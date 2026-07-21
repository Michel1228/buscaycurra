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
  "London", "Manchester", "Birmingham", "Edinburgh", "Glasgow", "Bristol", "Leeds", "Dublin", "Cork",
  "Paris", "Lyon", "Marseille", "Nice", "Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart",
  "Amsterdam", "Rotterdam", "The Hague", "Zurich", "Geneva", "Basel", "Vienna",
  "Rome", "Milan", "Madrid", "Barcelona", "Valencia", "Lisbon", "Porto",
  "Stockholm", "Gothenburg", "Copenhagen", "Oslo", "Brussels", "Luxembourg",
  "New York", "Los Angeles", "Chicago", "Boston", "San Francisco", "Washington",
  "Sydney", "Melbourne", "Brisbane", "Perth", "Auckland",
  "Toronto", "Vancouver", "Montreal",
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

  // Dos fuentes para maximizar cobertura del nicho: Careerjet (source "eures" =
  // fetchCareerjetGlobal, usa la ciudad tal cual) + Jooble. NO usar source
  // "careerjet", que hardcodea location = city + " Espana" (buscaría "London
  // Espana" → 0). Si Jooble no tiene API key, su rama degrada suave (try/catch).
  const FUENTES: Array<"eures" | "jooble"> = ["eures", "jooble"];
  let inserted = 0;
  let fetched = 0;
  for (const city of lote) {
    for (const keyword of KEYWORDS) {
      for (const source of FUENTES) {
        try {
          const r = await syncBatch({ source, sector: "OTRO", keyword, city });
          inserted += r.inserted;
          fetched += r.fetched;
        } catch { /* seguir con la siguiente combinación */ }
      }
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
