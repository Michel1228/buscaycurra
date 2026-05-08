import { NextRequest, NextResponse } from "next/server";
import { syncBatch, SECTORES } from "@/lib/job-search/sync-worker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 40 ciudades principales de España para máxima cobertura por llamada
const CIUDADES_SYNC = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza",
  "Malaga", "Murcia", "Bilbao", "Alicante", "Cordoba",
  "Valladolid", "Vigo", "Gijon", "Granada", "La Coruna",
  "Vitoria", "Pamplona", "Santander", "Almeria", "Huelva",
  "Badajoz", "Toledo", "Tarragona", "Lleida", "Girona",
  "Castellon", "Salamanca", "Las Palmas", "Palma", "San Sebastian",
  "Elche", "Cartagena", "Getafe", "Mostoles", "Alcala de Henares",
  "Hospitalet", "Badalona", "Terrassa", "Sabadell", "Leganes",
];

type Combo = { sector: typeof SECTORES[number]["sector"]; keyword: string; city: string };

function buildCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const s of SECTORES) {
    for (const kw of s.keywords) {
      for (const city of CIUDADES_SYNC) {
        combos.push({ sector: s.sector, keyword: kw, city });
      }
    }
  }
  return combos;
}

export async function GET() {
  const total = buildCombos().length;
  return NextResponse.json({ total, message: `${total} combinaciones en el plan` });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { source?: string; batchSize?: number; offset?: number; page?: number } = {};
  try { body = await req.json(); } catch { /* use defaults */ }

  const source = (body.source ?? "jooble") as "jooble" | "adzuna" | "careerjet";
  const batchSize = Math.min(body.batchSize ?? 40, 60);
  const offset = body.offset ?? 0;
  const page = body.page ?? 1;

  const combos = buildCombos();
  const slice = combos.slice(offset, offset + batchSize);

  if (slice.length === 0) {
    return NextResponse.json({ inserted: 0, fetched: 0, nextOffset: 0, done: true, total: combos.length });
  }

  const CONCURRENCY = 10;
  let totalInserted = 0;
  let totalFetched = 0;
  const start = Date.now();

  for (let i = 0; i < slice.length; i += CONCURRENCY) {
    const group = slice.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      group.map(c => syncBatch({ source, sector: c.sector, keyword: c.keyword, city: c.city, page }))
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        totalInserted += r.value.inserted;
        totalFetched += r.value.fetched;
      }
    }
    // Parar si llevamos >50s para no exceder maxDuration=60
    if (Date.now() - start > 50_000) break;
  }

  return NextResponse.json({
    inserted: totalInserted,
    fetched: totalFetched,
    elapsed: Math.round((Date.now() - start) / 1000),
    nextOffset: offset + batchSize,
    done: offset + batchSize >= combos.length,
    total: combos.length,
  });
}
