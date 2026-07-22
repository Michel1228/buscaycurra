/**
 * POST /api/jobs/sync-arbeitsagentur
 *
 * Sync de ofertas de la Bundesagentur für Arbeit (agencia federal de empleo
 * alemana). API pública sin autenticación.
 *
 * PAGINADO por keyword (jul 2026): antes procesaba las 100 keywords de una
 * sola llamada. Como la API tarda ~9 s por página, eso son ~400 peticiones
 * ≈ 1 hora: el endpoint nunca respondía y por eso estaba abandonado, pese a
 * que la fuente funciona perfectamente. Ahora el llamador recorre las
 * keywords por lotes con `startIdx`.
 *
 * Body: { startIdx?: number, batchSize?: number, maxPerKeyword?: number }
 */
import { NextResponse } from "next/server";
import { syncArbeitsagentur, GERMAN_KEYWORDS } from "@/lib/job-search/arbeitsagentur";
import { secretIguales } from "@/lib/secret-compare";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  return NextResponse.json({ totalKeywords: GERMAN_KEYWORDS.length });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-sync-secret") ?? url.searchParams.get("secret");
  if (!secretIguales(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    startIdx?: number;
    batchSize?: number;
    maxPerKeyword?: number;
  };

  const startIdx = Math.max(body.startIdx ?? 0, 0);
  // 5 keywords × 200 ofertas ≈ 4 páginas cada una ≈ 180 s: cabe en maxDuration.
  const batchSize = Math.min(Math.max(body.batchSize ?? 5, 1), 10);
  const maxPerKeyword = Math.min(Math.max(body.maxPerKeyword ?? 200, 50), 1000);
  const lote = GERMAN_KEYWORDS.slice(startIdx, startIdx + batchSize);

  if (!lote.length) {
    return NextResponse.json({
      ok: true, done: true, inserted: 0, fetched: 0,
      nextIdx: 0, totalKeywords: GERMAN_KEYWORDS.length,
    });
  }

  try {
    const result = await syncArbeitsagentur(lote, maxPerKeyword, 50);
    const nextIdx = startIdx + batchSize;
    const done = nextIdx >= GERMAN_KEYWORDS.length;

    return NextResponse.json({
      ok: true,
      source: "Arbeitsagentur",
      keywords: lote,
      ...result,
      nextIdx: done ? 0 : nextIdx,
      done,
      totalKeywords: GERMAN_KEYWORDS.length,
    });
  } catch (e) {
    console.error("[sync-arbeitsagentur] Error:", e);
    return NextResponse.json({ error: (e as Error).message || "Error desconocido" }, { status: 500 });
  }
}
