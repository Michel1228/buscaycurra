/**
 * /api/jobs/sync-careerjet-global
 * Extrae ofertas de Careerjet para 21 países
 * usando keywords nativas + ciudades por país
 * Pool de keywords masivo en lib/job-search/careerjet-countries.ts
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchCareerjetGlobal, upsertJobsForSync } from "@/lib/job-search/sync-worker";
import { CAREERJET_COUNTRIES } from "@/lib/job-search/careerjet-countries";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Offset en memoria
const offsets: Record<string, number> = {};

export async function GET() {
  return NextResponse.json({
    countries: Object.keys(CAREERJET_COUNTRIES),
    offsets,
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { country?: string; batchSize?: number } = {};
  try { body = await req.json(); } catch { /* defaults */ }

  const batchSize = Math.min(body.batchSize ?? 15, 50);
  const country = body.country ?? "us";
  const cfg = CAREERJET_COUNTRIES[country];
  if (!cfg) return NextResponse.json({ error: "País no soportado: " + country }, { status: 400 });

  const startIdx = offsets[country] || 0;
  let totalFetched = 0;
  let totalInserted = 0;

  for (let i = 0; i < batchSize; i++) {
    const comboIdx = (startIdx + i) % (cfg.keywords.length * cfg.cities.length);
    const kwIdx = comboIdx % cfg.keywords.length;
    const cityIdx = Math.floor(comboIdx / cfg.keywords.length) % cfg.cities.length;
    const kw = cfg.keywords[kwIdx];
    const city = cfg.cities[cityIdx];

    try {
      const jobs = await fetchCareerjetGlobal(kw, city);
      if (jobs.length > 0) {
        const inserted = await upsertJobsForSync(jobs, "OTRO", country);
        totalInserted += inserted;
        totalFetched += jobs.length;
      }
    } catch { /* skip combo */ }
  }

  offsets[country] = startIdx + batchSize;

  return NextResponse.json({
    country: cfg.name,
    inserted: totalInserted,
    fetched: totalFetched,
    nextOffset: offsets[country],
    totalCombos: cfg.keywords.length * cfg.cities.length,
  });
}
