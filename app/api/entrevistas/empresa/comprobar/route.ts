/**
 * POST /api/entrevistas/empresa/comprobar { id, indice, respuesta, sesion }
 *
 * Qué puntos de los que busca la empresa cubre una respuesta del ensayo. Es
 * solo para el candidato: no se guarda ni llega a la empresa (lib/entrevistas/empresa.ts).
 * Lo único que se apunta es que ha hecho un ensayo más.
 *
 * No gasta del cupo de entrevistas del plan gratis: le ha invitado la empresa.
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserId, correoSinVerificar } from "@/lib/auth-server";
import { checkUserRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit-user";
import { apuntarEnsayo, invitacionPorId } from "@/lib/entrevistas/empresa";
import { leerPuntos, promptPuntos } from "@/lib/entrevistas/puntos";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!(await checkUserRateLimit("entrevista-empresa", userId, 60, 3600))) {
    return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as { id?: string; indice?: number; respuesta?: string; sesion?: string };
  const respuesta = String(body.respuesta || "").trim();
  if (!respuesta) return NextResponse.json({ error: "Contesta antes de comprobar" }, { status: 400 });

  try {
    const inv = await invitacionPorId(String(body.id || ""));
    if (!inv || inv.user_id !== userId) return NextResponse.json({ error: "Esta invitación no está" }, { status: 404 });
    const pregunta = inv.preguntas[Number(body.indice)];
    if (!pregunta) return NextResponse.json({ error: "Esa pregunta no está" }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "No se puede comprobar ahora" }, { status: 500 });
    // Dos intentos: si el modelo no devuelve la forma pedida, se le vuelve a preguntar.
    for (let intento = 0; intento < 2; intento++) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          reasoning_effort: "low",
          messages: [{ role: "user", content: promptPuntos(pregunta.texto, pregunta.puntos, respuesta) }],
          temperature: 0.2,
          max_tokens: 600,
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) { console.error("[entrevistas/empresa/comprobar] Groq:", (await res.text()).slice(0, 200)); continue; }
      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      const leido = leerPuntos(data.choices?.[0]?.message?.content ?? "", pregunta.puntos.length);
      if (leido) {
        // Solo cuenta como ensayo lo que se ha podido comprobar.
        if (body.sesion) await apuntarEnsayo(inv.id, userId, String(body.sesion));
        return NextResponse.json(leido);
      }
    }
    return NextResponse.json({ error: "No se ha podido comprobar ahora. Inténtalo de nuevo en un momento." }, { status: 502 });
  } catch (e) {
    console.error("[entrevistas/empresa/comprobar]", (e as Error).message);
    return NextResponse.json({ error: "No se ha podido comprobar ahora. Inténtalo de nuevo en un momento." }, { status: 500 });
  }
}
