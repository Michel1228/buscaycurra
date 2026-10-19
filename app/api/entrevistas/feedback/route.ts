import { planEfectivoDeUsuario } from "@/lib/plan-limits";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkUserRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit-user";
import { promptDePais } from "@/lib/entrevistas/por-pais";
import { normalizarPais } from "@/lib/origen/movilidad";
import { PAISES } from "@/lib/paises";
import { partesDelFeedback } from "@/lib/entrevistas/feedback";
import { usarEntrevista } from "@/lib/entrevistas/cupo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!(await checkUserRateLimit("feedback", user.id, 40, 3600))) {
      return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
    }

    const { pregunta, respuesta, sector, pais, sesion } = await req.json() as {
      pregunta: string;
      respuesta: string;
      sector?: string;
      /** País para el que se prepara la entrevista. Por defecto España. */
      pais?: string;
      /** La entrevista a la que pertenece esta respuesta (cupo del plan gratis). */
      sesion?: string;
    };

    // Sin límite en los planes de pago; el gratis, 2 entrevistas a la semana
    // (lib/entrevistas/cupo.ts). El estado de la suscripción manda sobre el plan guardado.
    const plan = await planEfectivoDeUsuario(supabase, user.id);
    const uso = await usarEntrevista(user.id, plan, sesion);
    if (!uso.ok) {
      return NextResponse.json(
        uso.motivo === "sesion"
          ? { error: "Vuelve a pulsar «Empezar» para abrir la entrevista." }
          : { error: "Ya has hecho las 2 entrevistas de esta semana del plan gratis. Vuelve el lunes, o ensaya sin límite con el plan Esencial (2,99 €/mes).", upgradeUrl: "/app/perfil?tab=plan" },
        { status: uso.motivo === "sesion" ? 400 : 402 }
      );
    }

    if (!pregunta || !respuesta) {
      return NextResponse.json({ error: "pregunta y respuesta requeridos" }, { status: 400 });
    }

    // Sanitizar inputs para prevenir prompt injection
    const sectorSafe = String(sector ?? "general").replace(/[^\w\s\-áéíóúüñÁÉÍÓÚÜÑ]/g, "").slice(0, 50);
    const preguntaSafe = String(pregunta).replace(/[\r\n]/g, " ").slice(0, 300);
    const respuestaSafe = String(respuesta).replace(/[\r\n]{3,}/g, "\n\n").slice(0, 1500);

    // El pais salia clavado a España aunque la oferta fuera de Berlin o de
    // Londres, y las entrevistas no se parecen: en Alemania son formales y
    // cronologicas, en Reino Unido y Paises Bajos van casi todas por
    // competencias. Ensayar el estilo equivocado es prepararse mal.
    const paisEntrevista = normalizarPais(pais) || "ES";
    const nombrePais = PAISES[paisEntrevista]?.nombre || "España";

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY no configurada" }, { status: 500 });

    // EL TONO (18 oct 2026). Antes salía "A mejorar" y una nota del 1 al 10 en
    // cada respuesta: parecía un examen, y quien ensaya una entrevista ya va
    // nervioso. Ahora es un entrevistador cercano que da confianza, un solo
    // detalle que pulir y una frase de ejemplo para decirlo mejor. Sin nota,
    // como el ensayo de entrevistas de Google, que lo plantea sin juicios.
    const prompt = `[ESPAÑOL OBLIGATORIO] Eres un entrevistador cercano que ayuda a ensayar entrevistas de trabajo del sector ${sectorSafe}.
${promptDePais(paisEntrevista, nombrePais)}
La persona está practicando y puede estar nerviosa. Tu trabajo es darle confianza y una mejora concreta, nunca juzgarla.

PREGUNTA: "${preguntaSafe}"

RESPUESTA DEL CANDIDATO: "${respuestaSafe}"

Contesta EXACTAMENTE con estas tres líneas y nada más:
BIEN: [una frase concreta sobre algo que ha hecho bien en esta respuesta]
PULIR: [un solo detalle que mejorar, dicho con amabilidad y en positivo]
DILO ASÍ: [una frase de ejemplo, en primera persona, que podría decir en la entrevista con lo que ha contado]

Háblale de tú, con frases cortas y sencillas, en español de España («has contado», no «contaste»). Sin notas ni puntuaciones. Sin emojis. En DILO ASÍ aprovecha los datos que haya dado, como cifras, sitios o tiempos, y no te inventes ninguno: si hace falta uno que no ha dicho, deja un hueco como [tu último trabajo]. Si la respuesta es muy corta o no contesta a la pregunta, dilo con tacto en PULIR y ayúdale en DILO ASÍ.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        // Razona antes de contestar y ese razonamiento gasta tokens del
        // mismo presupuesto: sin esto devolvia respuestas vacias.
        reasoning_effort: "low",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        // Razona antes de contestar y eso gasta del mismo límite: con 300 la
        // tercera casilla a veces salía cortada.
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Entrevistas/feedback] Groq error:", err);
      return NextResponse.json({ error: "Error en IA" }, { status: 502 });
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const feedback = data.choices?.[0]?.message?.content ?? "No se pudo generar feedback.";

    // Las tres casillas por separado; si el modelo no respeta el formato, la
    // pantalla enseña el texto tal cual.
    return NextResponse.json({ feedback, partes: partesDelFeedback(feedback) });
  } catch (err) {
    console.error("[Entrevistas/feedback]", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
