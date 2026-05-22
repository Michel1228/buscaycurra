/**
 * POST /api/salarios/negociar
 * Genera un guión de negociación salarial basado en datos reales del mercado
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { puesto, ciudad, experiencia, salarioOferta } = await req.json();
    if (!puesto) return NextResponse.json({ error: "puesto requerido" }, { status: 400 });

    const pool = getPool();
    const puestoClean = puesto.toLowerCase().trim();
    const kw = `%${puestoClean}%`;

    // 1. Buscar estadísticas salariales REALES en la BD
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN salary ~ '[0-9]' THEN 1 END) as con_salario,
        AVG(CASE WHEN salary ~ '[0-9]+' THEN (regexp_match(salary, '[0-9]+(?:[.,][0-9]+)?'))[1]::numeric ELSE NULL END) as media,
        MIN(CASE WHEN salary ~ '[0-9]+' THEN (regexp_match(salary, '[0-9]+(?:[.,][0-9]+)?'))[1]::numeric ELSE NULL END) as minima,
        MAX(CASE WHEN salary ~ '[0-9]+' THEN (regexp_match(salary, '[0-9]+(?:[.,][0-9]+)?'))[1]::numeric ELSE NULL END) as maxima
       FROM "JobListing"
       WHERE "isActive" = true AND (title ILIKE $1 OR description ILIKE $1)`,
      [kw]
    );

    const stats = statsResult.rows[0];

    // 2. Buscar salarios con ciudad
    let statsCiudad = null;
    if (ciudad) {
      const loc = `%${ciudad.toLowerCase().trim()}%`;
      const cityResult = await pool.query(
        `SELECT 
          COUNT(*) as total,
          AVG(CASE WHEN salary ~ '[0-9]+' THEN (regexp_match(salary, '[0-9]+(?:[.,][0-9]+)?'))[1]::numeric ELSE NULL END) as media_local
         FROM "JobListing"
         WHERE "isActive" = true AND (title ILIKE $1 OR description ILIKE $1) AND city ILIKE $2`,
        [kw, loc]
      );
      statsCiudad = cityResult.rows[0];
    }

    // 3. Buscar ofertas de ejemplo con salario
    const ejemplos = await pool.query(
      `SELECT title, company, city, salary FROM "JobListing"
       WHERE "isActive" = true AND salary ~ '[0-9]' AND (title ILIKE $1 OR description ILIKE $1)
       ORDER BY "scrapedAt" DESC LIMIT 6`,
      [kw]
    );

    // 4. Generar guión con Groq
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    const prompt = `[ESPAÑOL OBLIGATORIO] Eres un asesor de negociación salarial experto en el mercado español. Genera un guión de negociación basado en estos DATOS REALES:

PUESTO: ${puesto}
CIUDAD: ${ciudad || "España"}
EXPERIENCIA DEL CANDIDATO: ${experiencia || "No especificada"}
SALARIO OFRECIDO: ${salarioOferta || "No especificado"}

ESTADÍSTICAS DEL MERCADO (DATOS REALES):
- Total ofertas analizadas: ${stats.total}
- Media salarial España: ${stats.media ? Math.round(Number(stats.media)) + "€" : "No disponible"}
- Rango: ${stats.minima ? Math.round(Number(stats.minima)) + "€" : "?"} - ${stats.maxima ? Math.round(Number(stats.maxima)) + "€" : "?"}
${statsCiudad ? "- Media en " + ciudad + ": " + Math.round(Number(statsCiudad.media_local)) + "€" : ""}
- Ofertas con salario público: ${stats.con_salario} de ${stats.total}

EJEMPLOS REALES:
${ejemplos.rows.map((e: any) => `- ${e.title} en ${e.company} (${e.city}): ${e.salary}`).join("\n")}

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
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const text = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      guion: text,
      datosMercado: {
        totalOfertas: parseInt(stats.total),
        mediaNacional: stats.media ? Math.round(Number(stats.media)) : null,
        minima: stats.minima ? Math.round(Number(stats.minima)) : null,
        maxima: stats.maxima ? Math.round(Number(stats.maxima)) : null,
        mediaCiudad: statsCiudad?.media_local ? Math.round(Number(statsCiudad.media_local)) : null,
        ejemplos: ejemplos.rows.map((e: any) => ({
          titulo: e.title,
          empresa: e.company,
          ciudad: e.city,
          salario: e.salary,
        })),
      },
    });
  } catch (err: any) {
    console.error("[Negociar]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
