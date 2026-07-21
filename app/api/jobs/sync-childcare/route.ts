/**
 * POST /api/jobs/sync-childcare
 *
 * Barrido DEDICADO de ofertas au pair / live-in nanny. Estas keywords viven en
 * el pool general de Careerjet, pero compiten con ~50 más por país, así que en
 * el barrido masivo apenas les toca turno → poco volumen (era el problema:
 * au_pair con solo ~2k vivas). Este endpoint las extrae en exclusiva.
 *
 * El worker (detectCategoria) marca automáticamente la categoría por el título,
 * así que estas ofertas entran ya clasificadas como au_pair / live_in_nanny.
 *
 * Paginado por ciudades para no pasarse del tiempo máximo: el llamador itera
 * cityOffset. Protegido con ADMIN_SECRET (dispara APIs externas de pago).
 */
import { NextRequest, NextResponse } from "next/server";
import { syncBatch } from "@/lib/job-search/sync-worker";
import { secretIguales } from "@/lib/secret-compare";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Términos que capturan el nicho en inglés y español.
const KEYWORDS = [
  "au pair", "nanny", "live in nanny", "live-in nanny", "babysitter",
  "childcare", "professional nanny", "governess", "niñera interna",
];

// Ciudades con demanda real de au pair / nanny (familias que contratan externo).
const CITIES = [
  "London", "Manchester", "Birmingham", "Edinburgh", "Dublin",
  "Paris", "Lyon", "Berlin", "Munich", "Hamburg", "Frankfurt",
  "Amsterdam", "Rotterdam", "Zurich", "Geneva", "Vienna",
  "Rome", "Milan", "Madrid", "Barcelona", "Stockholm",
  "Copenhagen", "Oslo", "Brussels", "New York", "Los Angeles",
  "Sydney", "Melbourne", "Toronto", "Vancouver",
];

export async function GET() {
  return NextResponse.json({ keywords: KEYWORDS, cities: CITIES, totalCities: CITIES.length });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (!secretIguales(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { cityOffset?: number; batchCities?: number } = {};
  try { body = await req.json(); } catch { /* defaults */ }

  const batchCities = Math.min(Math.max(body.batchCities ?? 5, 1), 10);
  const cityOffset = Math.max(body.cityOffset ?? 0, 0);
  const lote = CITIES.slice(cityOffset, cityOffset + batchCities);

  if (!lote.length) {
    return NextResponse.json({ done: true, inserted: 0, nextOffset: 0, totalCities: CITIES.length });
  }

  let inserted = 0;
  let fetched = 0;
  for (const city of lote) {
    for (const keyword of KEYWORDS) {
      try {
        const r = await syncBatch({ source: "careerjet", sector: "OTRO", keyword, city });
        inserted += r.inserted;
        fetched += r.fetched;
      } catch { /* seguir con la siguiente combinación */ }
    }
  }

  const nextOffset = cityOffset + batchCities;
  const done = nextOffset >= CITIES.length;

  return NextResponse.json({
    ciudades: lote,
    inserted,
    fetched,
    nextOffset: done ? 0 : nextOffset,
    done,
    totalCities: CITIES.length,
  });
}
