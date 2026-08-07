/**
 * GET /api/jobs/sync-remote
 * Sincroniza ofertas desde Remote OK y Arbeitnow
 * Llamado por cron cada 6h
 */

import { NextRequest, NextResponse } from "next/server";
import { secretIguales } from "@/lib/secret-compare";
import { syncRemoteAPIs } from "@/lib/job-search/remote-apis";

export const dynamic = "force-dynamic";

const SYNC_SECRET = process.env.SYNC_SECRET || process.env.ADMIN_SECRET || "";

export async function GET(request: NextRequest) {
  // Este endpoint ESCRIBE masivamente en JobListing y no pedia nada: cualquiera
  // podia dispararlo en bucle y saturar la base (el servidor tiene 2 nucleos).
  if (!SYNC_SECRET) {
    return NextResponse.json({ error: "SYNC_SECRET no configurada" }, { status: 503 });
  }
  const auth = request.headers.get("x-sync-secret") || request.headers.get("Authorization")?.replace("Bearer ", "") || "";
  if (!secretIguales(auth, SYNC_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await syncRemoteAPIs();
    return NextResponse.json({
      ok: true,
      remoteok: result.remoteok,
      arbeitnow: result.arbeitnow,
      total: result.remoteok + result.arbeitnow,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
