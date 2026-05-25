/**
 * /api/jobs/sync-adzuna-global
 * Sync masivo de Adzuna en 6 países (ES, UK, US, DE, FR, AU)
 * Rota países en cada llamada para distribuir el rate limit diario (250 req/día/país)
 */
import { NextRequest, NextResponse } from "next/server";
import { syncAdzunaCountry } from "@/lib/job-search/sync-worker";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Orden de países (rotativo)
const COUNTRIES = ["es", "uk", "us", "de", "fr", "au"] as const;

// Estado simple en memoria (se resetea en cada deploy)
let currentCountryIdx = 0;
let countryOffsets: Record<string, number> = {};

export async function GET() {
  return NextResponse.json({
    countries: COUNTRIES,
    currentIdx: currentCountryIdx,
    offsets: countryOffsets,
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { country?: string; batchSize?: number; offset?: number } = {};
  try { body = await req.json(); } catch { /* use defaults */ }

  const batchSize = Math.min(body.batchSize ?? 20, 50);
  
  // Si se especifica país, usar ese; si no, rotar
  const country = body.country || COUNTRIES[currentCountryIdx % COUNTRIES.length];
  const offset = body.offset ?? (countryOffsets[country] || 0);

  const result = await syncAdzunaCountry(country, batchSize, offset);

  // Actualizar offset y rotar país para la siguiente llamada
  countryOffsets[country] = result.done ? 0 : result.nextOffset;
  if (!body.country) {
    currentCountryIdx++;
  }

  return NextResponse.json({
    ...result,
    nextCountry: COUNTRIES[currentCountryIdx % COUNTRIES.length],
    offsets: countryOffsets,
  });
}
