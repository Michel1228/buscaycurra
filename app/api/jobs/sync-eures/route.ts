/**
 * EURES Sync Endpoint — Sync masivo de ofertas europeas
 * 
 * POST /api/jobs/sync-eures
 * Body: { batchSize?: number, offset?: number, countries?: string[] }
 * 
 * Cada "combo" = país + keyword. ~120 combos (15 países × 8 keywords).
 * Este endpoint itera sobre todos los combos por lotes.
 */

import { NextRequest, NextResponse } from "next/server";
import { syncBatch } from "@/lib/job-search/sync-worker";
import { generateEuresCombos, CITY_COMBOS } from "@/lib/job-search/eures-api";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const combos = generateEuresCombos();
  return NextResponse.json({
    total: combos.length,
    countries: [...new Set(combos.map(c => c.country))],
    message: `${combos.length} combinaciones EURES (keyword × país)`,
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { batchSize?: number; offset?: number; countries?: string[] } = {};
  try { body = await req.json(); } catch { /* defaults */ }

  const batchSize = Math.min(body.batchSize ?? 10, 50);
  const offset = body.offset ?? 0;

  let combos = [...generateEuresCombos(), ...CITY_COMBOS];
  
  // Filtrar por países si se especifican
  if (body.countries?.length) {
    combos = combos.filter(c => body.countries!.includes(c.country));
  }

  const slice = combos.slice(offset, offset + batchSize);

  if (slice.length === 0) {
    return NextResponse.json({ inserted: 0, fetched: 0, nextOffset: 0, done: true, total: combos.length });
  }

  const CONCURRENCY = 8; // 3 págs × 8 = 24 requests simultáneos, bien dentro de maxDuration=300
  let totalInserted = 0;
  let totalFetched = 0;

  for (let i = 0; i < slice.length; i += CONCURRENCY) {
    const group = slice.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      group.map(c => syncBatch({
        source: "eures",
        sector: "HOSTELERIA", // Temporal, EURES no mapea a sectores aún
        keyword: c.keyword,
        city: c.location, // "Deutschland", "France", etc.
      }))
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        totalInserted += r.value.inserted;
        totalFetched += r.value.fetched;
      }
    }
    // Pequeña pausa entre grupos para no saturar la API de la UE
    if (i + CONCURRENCY < slice.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  const nextOffset = offset + batchSize;
  const done = nextOffset >= combos.length;

  return NextResponse.json({
    inserted: totalInserted,
    fetched: totalFetched,
    nextOffset: done ? 0 : nextOffset,
    done,
    total: combos.length,
    countries: [...new Set(slice.map(c => c.country))],
  });
}
