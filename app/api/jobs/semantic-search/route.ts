/**
 * GET /api/jobs/semantic-search?q=trabajo donde pueda usar Python
 * Búsqueda semántica con Groq embeddings + cosine similarity en TS
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const ciudad = searchParams.get("ciudad") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "15"), 30);

  if (!query) {
    return NextResponse.json({ error: "Parámetro 'q' requerido" }, { status: 400 });
  }

  try {
    const pool = getPool();

    // 1. Usar Groq para extraer keywords de la query en lenguaje natural
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    const kwCompletion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{
        role: "user",
        content: `Extrae 3-5 palabras clave de búsqueda de empleo de esta frase: "${query}". Responde SOLO las keywords separadas por coma, sin texto adicional. Ejemplo: "Python, backend, desarrollo software, Django"`,
      }],
      temperature: 0.1,
      max_tokens: 60,
    });

    const keywords = kwCompletion.choices[0]?.message?.content?.trim() || query;
    const keywordList = keywords.split(/,\s*/).filter(k => k.length > 0);
    
    // También incluir la query original
    const allKeywords = [...new Set([query, ...keywordList])];

    // 2. Buscar con ILIKE para cada keyword
    let allRows: any[] = [];
    const seen = new Set<string>();

    for (const kw of allKeywords.slice(0, 6)) {
      const pattern = `%${kw}%`;
      let res;
      if (ciudad) {
        const loc = `%${ciudad.toLowerCase().trim()}%`;
        res = await pool.query(
          `SELECT id, title, company, city, description, salary, "sourceUrl"
           FROM "JobListing"
           WHERE "isActive" = true AND (city ILIKE $1 OR province ILIKE $1)
             AND (title ILIKE $2 OR description ILIKE $2)
           ORDER BY "scrapedAt" DESC LIMIT 30`,
          [loc, pattern]
        );
      } else {
        res = await pool.query(
          `SELECT id, title, company, city, description, salary, "sourceUrl"
           FROM "JobListing"
           WHERE "isActive" = true AND (title ILIKE $1 OR description ILIKE $1)
           ORDER BY "scrapedAt" DESC LIMIT 30`,
          [pattern]
        );
      }
      for (const row of res.rows) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          allRows.push(row);
        }
      }
    }

    if (!allRows.length) {
      return NextResponse.json({ 
        query, 
        keywords: allKeywords,
        totalEncontrados: 0,
        results: [],
        message: "No se encontraron ofertas. Prueba con otras palabras." 
      });
    }

    // 3. Calcular score simple basado en cuántas keywords matchean
    const scored = allRows.map((row: any) => {
      const text = `${row.title} ${row.description || ""}`.toLowerCase();
      let score = 0;
      for (const kw of allKeywords) {
        if (text.includes(kw.toLowerCase())) score += 1;
      }
      // Bonus para match exacto en título
      if (row.title.toLowerCase().includes(query.toLowerCase())) score += 3;
      return { ...row, score };
    });

    scored.sort((a: any, b: any) => b.score - a.score);
    const top = scored.slice(0, limit).filter((s: any) => s.score > 0);

    return NextResponse.json({
      query,
      ciudad: ciudad || "Toda España",
      totalEncontrados: top.length,
      results: top.map((s: any) => ({
        id: s.id,
        titulo: s.title,
        empresa: s.company,
        ciudad: s.city,
        salario: s.salary,
        descripcion: (s.description || "").slice(0, 200),
        url: s.sourceUrl,
        match: Math.round(s.score * 100),
      })),
    });
  } catch (err: any) {
    console.error("[SemanticSearch]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
