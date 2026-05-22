/**
 * GET /api/jobs/semantic-search?q=trabajo donde pueda usar Python
 * Búsqueda semántica con Groq embeddings + cosine similarity en TS
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

// Cosine similarity entre dos vectores
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

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

    // 1. Obtener embedding de la query
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
    const embeddingRes = await groq.embeddings.create({
      model: "nomic-embed-text-v1",
      input: query,
    });
    const queryEmbedding = embeddingRes.data[0]?.embedding;
    if (!queryEmbedding) {
      return NextResponse.json({ error: "No se pudo generar embedding" }, { status: 500 });
    }

    // 2. Obtener ofertas candidatas (filtradas por ciudad si se especifica)
    let ofertas: any[];
    if (ciudad) {
      const loc = `%${ciudad.toLowerCase().trim()}%`;
      const res = await pool.query(
        `SELECT id, title, company, city, description, salary, "sourceUrl"
         FROM "JobListing"
         WHERE "isActive" = true AND (city ILIKE $1 OR province ILIKE $1)
         ORDER BY "scrapedAt" DESC LIMIT 200`,
        [loc]
      );
      ofertas = res.rows;
    } else {
      const res = await pool.query(
        `SELECT id, title, company, city, description, salary, "sourceUrl"
         FROM "JobListing"
         WHERE "isActive" = true
         ORDER BY "scrapedAt" DESC LIMIT 200`
      );
      ofertas = res.rows;
    }

    if (!ofertas.length) {
      return NextResponse.json({ results: [], query, message: "No se encontraron ofertas para comparar" });
    }

    // 3. Generar embeddings para las ofertas (en batch)
    const ofertasTextos = ofertas.map((o: any) =>
      `${o.title}. ${o.company}. ${(o.description || "").slice(0, 300)}`
    );

    const batchRes = await groq.embeddings.create({
      model: "nomic-embed-text-v1",
      input: ofertasTextos,
    });

    // 4. Calcular cosine similarity
    const scored = ofertas.map((oferta: any, i: number) => ({
      ...oferta,
      score: cosineSimilarity(queryEmbedding, batchRes.data[i]?.embedding || []),
    }));

    // 5. Ordenar por score y devolver top
    scored.sort((a: any, b: any) => b.score - a.score);
    const top = scored.slice(0, limit).filter((s: any) => s.score > 0.2);

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
