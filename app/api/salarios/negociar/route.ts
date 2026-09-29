/**
 * POST /api/salarios/negociar
 * Genera un guión de negociación salarial basado en datos reales del mercado
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { resumirSalarios, salarioAnualEuros } from "@/lib/salarios/anual";
import Groq from "groq-sdk";
import { getUserId } from "@/lib/auth-server";
import { checkUserRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit-user";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Exigir sesión: antes era público → Groq + queries de BD sin límite.
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!(await checkUserRateLimit("negociar", userId, 20, 3600))) {
      return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
    }

    const body = await req.json();
    const puesto: string = String(body.puesto ?? "").slice(0, 120);
    const ciudad: string = String(body.ciudad ?? "").slice(0, 80);
    const experiencia: string = String(body.experiencia ?? "").slice(0, 300);
    const salarioOferta: string = String(body.salarioOferta ?? "").slice(0, 40);
    if (!puesto) return NextResponse.json({ error: "puesto requerido" }, { status: 400 });

    const pool = getPool();
    const puestoClean = puesto.toLowerCase().trim();
    const kw = `%${puestoClean}%`;

    // 1. Sueldos REALES de España para ese puesto.
    //
    // Antes buscaba el puesto también en la DESCRIPCIÓN de 2,4 millones de
    // ofertas, sin índice: se pasaba de los 15 s del límite de la base y la
    // pantalla daba error 500 a todo el mundo (comprobado el 30 sep 2026). Y
    // cogía el primer número del texto como sueldo, mezclando horas, meses y
    // monedas de 26 países. Ahora solo el título (índice trigram), solo España
    // y el mismo intérprete que la pantalla de salarios.
    const { rows } = await pool.query(
      `SELECT title, company, city, province, salary FROM "JobListing"
       WHERE "isActive" = true AND title ILIKE $1 AND LOWER(country) = 'es'
         AND salary ~ '[0-9]'
       ORDER BY "scrapedAt" DESC
       LIMIT 3000`,
      [kw]
    );
    const filas = rows as Array<{ title: string; company: string; city: string | null; province: string | null; salary: string }>;
    const resumen = resumirSalarios(filas.map((r) => r.salary));

    // 2. En su ciudad, si hay suficientes
    let resumenCiudad = null;
    if (ciudad) {
      const buscada = ciudad.toLowerCase().trim();
      resumenCiudad = resumirSalarios(
        filas
          .filter((r) => (r.city || "").toLowerCase().includes(buscada) || (r.province || "").toLowerCase().includes(buscada))
          .map((r) => r.salary)
      );
      if (resumenCiudad && resumenCiudad.conSalario < 3) resumenCiudad = null;
    }

    // 3. Ofertas de ejemplo con un sueldo anual legible
    const ejemplos = filas
      .filter((r) => salarioAnualEuros(r.salary))
      .slice(0, 6)
      .map((r) => ({ ...r, salary: r.salary.replace(/&euro;/gi, "€") }));

    // 4. Generar guión con Groq
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    const prompt = `[ESPAÑOL OBLIGATORIO] Eres un asesor de negociacion salarial. Si los datos que te paso son de otro pais, razona sobre ESE mercado y no sobre el espanol. Genera un guión de negociación basado en estos DATOS REALES:

PUESTO: ${puesto}
CIUDAD: ${ciudad || "España"}
EXPERIENCIA DEL CANDIDATO: ${experiencia || "No especificada"}
SALARIO OFRECIDO: ${salarioOferta || "No especificado"}

ESTADÍSTICAS DEL MERCADO (DATOS REALES):
- Ofertas de España con sueldo anual publicado: ${resumen?.conSalario ?? 0}
- Sueldo típico en España (mediana, bruto anual): ${resumen ? resumen.tipico + "€" : "No disponible"}
- Mitad central de las ofertas: ${resumen ? resumen.bajo + "€ - " + resumen.alto + "€" : "No disponible"}
${resumenCiudad ? "- Sueldo típico en " + ciudad + ": " + resumenCiudad.tipico + "€ (" + resumenCiudad.conSalario + " ofertas)" : ""}

EJEMPLOS REALES:
${ejemplos.map((e) => `- ${e.title} en ${e.company} (${e.city}): ${e.salary}`).join("\n") || "Ninguna con sueldo anual publicado."}

Genera una respuesta EN ESPAÑOL con este formato exacto:
## 📊 Análisis de Mercado
[2-3 frases sobre el mercado para este puesto usando los datos reales]

## 💰 Rango Objetivo
[basado en los datos: mínimo, media, máximo — recomendar un rango realista]

## 🗣️ Guión de Negociación
### Fase 1: Research
[frases para investigar antes de negociar]

### Fase 2: La Conversación
[4-5 frases textuales que el candidato puede decir]

### Fase 3: Cierre
[cómo cerrar si aceptan, cómo responder si dicen que no]

## ⚠️ Puntos Clave
[2-3 consejos específicos para este puesto en España]`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
        // Razona antes de contestar y ese razonamiento gasta tokens del
        // mismo presupuesto: sin esto devolvia respuestas vacias. El SDK aun
        // no lo declara en sus tipos, pero la API lo acepta.
        ...({ reasoning_effort: "low" } as Record<string, unknown>),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const text = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      guion: text,
      datosMercado: {
        // "media" es la mediana y "minima"/"maxima" la mitad central (p25-p75).
        totalOfertas: resumen?.conSalario ?? 0,
        mediaNacional: resumen?.tipico ?? null,
        minima: resumen?.bajo ?? null,
        maxima: resumen?.alto ?? null,
        mediaCiudad: resumenCiudad?.tipico ?? null,
        ejemplos: ejemplos.map((e) => ({
          titulo: e.title,
          empresa: e.company,
          ciudad: e.city,
          salario: e.salary,
        })),
      },
    });
  } catch (err: any) {
    console.error("[Negociar]", err);
    return NextResponse.json({ error: 'Error al calcular negociación' }, { status: 500 });
  }
}
