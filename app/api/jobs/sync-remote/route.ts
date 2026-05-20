/**
 * GET /api/jobs/sync-remote
 * Sincroniza ofertas desde Remote OK y Arbeitnow
 * Llamado por cron cada 6h
 */

import { NextResponse } from "next/server";
import { syncRemoteAPIs } from "@/lib/job-search/remote-apis";

export const dynamic = "force-dynamic";

export async function GET() {
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
