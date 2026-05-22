/**
 * POST /api/jobs/sync-run — Punto de entrada para el workflow sync-jobs.yml
 *
 * Autentica con x-sync-secret header (= ADMIN_SECRET).
 * Body: { source: "jooble" | "careerjet", batchSize: number, offset: number, page: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { indexarBulkJooble, indexarBulkCareerjet } from "@/lib/job-search/bulk-indexer";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { source?: string; batchSize?: number; offset?: number; page?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const source = body.source ?? "jooble";
  const batchSize = Math.min(body.batchSize ?? 40, 200);
  const offset = body.offset ?? 0;
  const page = body.page ?? 1;

  console.log(`[SyncRun] source=${source} offset=${offset} batchSize=${batchSize} page=${page}`);

  try {
    let result;

    if (source === "careerjet") {
      result = await indexarBulkCareerjet(offset, batchSize);
    } else {
      result = await indexarBulkJooble(offset, batchSize, undefined, page);
    }

    return NextResponse.json({
      ok: true,
      source,
      offset,
      page,
      ...result,
    });
  } catch (e) {
    console.error("[SyncRun] Error:", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
