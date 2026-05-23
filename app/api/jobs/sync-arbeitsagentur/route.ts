/**
 * POST /api/jobs/sync-arbeitsagentur
 * 
 * Sync de ofertas desde la API pública de la Bundesagentur für Arbeit (Alemania).
 * Sin autenticación. 100 keywords alemanas × 4 páginas × 50 = hasta 20K ofertas por sync.
 * 
 * Rate limit interno: 200ms entre páginas, 500ms entre keywords (~2 min total).
 */

import { NextResponse } from "next/server";
import { syncArbeitsagentur } from "@/lib/job-search/arbeitsagentur";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-sync-secret") ?? url.searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const maxPerKeyword = body.maxPerKeyword ?? 200;

  try {
    const result = await syncArbeitsagentur(undefined, maxPerKeyword, 50);
    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[sync-arbeitsagentur] Error:", e);
    return NextResponse.json({ error: e?.message || "Error desconocido" }, { status: 500 });
  }
}
