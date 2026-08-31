/**
 * /api/jobs/sync-adzuna-global
 * Sync masivo de Adzuna en 6 países (ES, UK, US, DE, FR, AU)
 * Rota países en cada llamada para distribuir el rate limit diario (250 req/día/país)
 */
import { NextRequest, NextResponse } from "next/server";
import { syncAdzunaCountry } from "@/lib/job-search/sync-worker";
import { secretIguales } from "@/lib/secret-compare";
import { leerOffset, guardarOffset, offsetsDe } from "@/lib/job-search/offsets";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Orden de países (rotativo). Los 19 que cubre Adzuna con nuestras claves,
// ordenados por volumen: us 6M, fr 1,5M, de 1,2M, br 829k, gb 758k, it 316k...
// Antes solo se recorrían 6 y quedaban ~2,3M de ofertas sin extraer.
const COUNTRIES = [
  "us", "fr", "de", "br", "uk", "it", "ca", "in", "au", "nl",
  "mx", "pl", "es", "za", "ch", "be", "at", "sg", "nz",
] as const;

// La posición de cada país vive en Redis, no en memoria. Estaba en una
// variable del proceso y cada despliegue la devolvía a cero, así que se
// repetían eternamente las primeras combinaciones y nunca se llegaba al
// resto. Ver el comentario largo en lib/job-search/offsets.ts.
const FUENTE = "adzuna";

// El país solo rota cuando NO se pide uno concreto. Los workflows sí lo
// piden, así que esto es solo para llamadas manuales y puede seguir en
// memoria sin consecuencias.
let currentCountryIdx = 0;

export async function GET() {
  return NextResponse.json({
    countries: COUNTRIES,
    currentIdx: currentCountryIdx,
    offsets: await offsetsDe(FUENTE, COUNTRIES),
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (!secretIguales(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { country?: string; batchSize?: number; offset?: number } = {};
  try { body = await req.json(); } catch { /* use defaults */ }

  const batchSize = Math.min(body.batchSize ?? 20, 50);
  
  // Si se especifica país, usar ese; si no, rotar
  const country = body.country || COUNTRIES[currentCountryIdx % COUNTRIES.length];
  const offset = body.offset ?? (await leerOffset(FUENTE, country));

  const result = await syncAdzunaCountry(country, batchSize, offset);

  // Guardar por dónde va y rotar país para la siguiente llamada
  await guardarOffset(FUENTE, country, result.done ? 0 : result.nextOffset);
  if (!body.country) {
    currentCountryIdx++;
  }

  return NextResponse.json({
    ...result,
    nextCountry: COUNTRIES[currentCountryIdx % COUNTRIES.length],
  });
}
