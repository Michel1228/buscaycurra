/**
 * /api/jobs/sync-careerjet-global
 * Extrae ofertas de Careerjet para 21 países
 * usando keywords nativas + ciudades por país
 * Pool de keywords masivo en lib/job-search/careerjet-countries.ts
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchCareerjetGlobal, upsertJobsForSync } from "@/lib/job-search/sync-worker";
import { CAREERJET_COUNTRIES } from "@/lib/job-search/careerjet-countries";
import { secretIguales } from "@/lib/secret-compare";
import { leerOffset, guardarOffset, offsetsDe } from "@/lib/job-search/offsets";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// La posición vive en Redis, no en memoria: si no, cada despliegue la
// devolvía a cero y volvíamos a pedir siempre las mismas combinaciones.
// Ver el comentario largo en lib/job-search/offsets.ts.
const FUENTE = "careerjet";

export async function GET() {
  const paises = Object.keys(CAREERJET_COUNTRIES);
  return NextResponse.json({
    countries: paises,
    offsets: await offsetsDe(FUENTE, paises),
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (!secretIguales(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { country?: string; batchSize?: number } = {};
  try { body = await req.json(); } catch { /* defaults */ }

  const batchSize = Math.min(body.batchSize ?? 15, 50);
  const country = body.country ?? "us";
  const cfg = CAREERJET_COUNTRIES[country];
  if (!cfg) return NextResponse.json({ error: "País no soportado: " + country }, { status: 400 });

  const startIdx = await leerOffset(FUENTE, country);
  let totalFetched = 0;
  let totalInserted = 0;

  for (let i = 0; i < batchSize; i++) {
    const comboIdx = (startIdx + i) % (cfg.keywords.length * cfg.cities.length);
    const kwIdx = comboIdx % cfg.keywords.length;
    const cityIdx = Math.floor(comboIdx / cfg.keywords.length) % cfg.cities.length;
    const kw = cfg.keywords[kwIdx];
    const city = cfg.cities[cityIdx];

    try {
      const jobs = await fetchCareerjetGlobal(kw, city, 1, country);
      if (jobs.length > 0) {
        const inserted = await upsertJobsForSync(jobs, "OTRO", country);
        totalInserted += inserted;
        totalFetched += jobs.length;
      }
    } catch { /* skip combo */ }
  }

  const nextOffset = startIdx + batchSize;
  await guardarOffset(FUENTE, country, nextOffset);

  return NextResponse.json({
    country: cfg.name,
    inserted: totalInserted,
    fetched: totalFetched,
    nextOffset,
    totalCombos: cfg.keywords.length * cfg.cities.length,
  });
}
