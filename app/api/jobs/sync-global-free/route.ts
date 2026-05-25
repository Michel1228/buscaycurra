/**
 * POST /api/jobs/sync-global-free
 * 
 * Sync de APIs gratuitas globales:
 * - The Muse (500K+ ofertas, paginada)
 * - Jobicy (remote jobs con salarios)
 * - Remotive (remote tech)
 * 
 * Body: { musePages?: number, jobicy?: boolean, remotive?: boolean }
 * Auth: x-sync-secret header
 */

import { NextRequest, NextResponse } from "next/server";
import { syncGlobalFreeAPIs, fetchMusePage, fetchJobicy, fetchRemotive } from "@/lib/job-search/free-global-apis";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SYNC_SECRET = process.env.ADMIN_SECRET || "buscaycurra_sync_2024";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("x-sync-secret");
  if (auth !== SYNC_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const musePages = body.musePages || 25;  // 25 pages = ~500 ofertas por llamada
    const includeJobicy = body.jobicy !== false;
    const includeRemotive = body.remotive !== false;

    const result = await syncGlobalFreeAPIs(musePages);

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[sync-global-free] Error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Error desconocido" },
      { status: 500 }
    );
  }
}

// GET para health check rápido
export async function GET(request: NextRequest) {
  const auth = request.headers.get("x-sync-secret");
  if (auth !== SYNC_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Solo 1 página de cada para test rápido
    const { jobs: museJobs, total, pageCount } = await fetchMusePage(1);
    const jobicyJobs = await fetchJobicy(10);
    const remotiveJobs = await fetchRemotive(10);

    return NextResponse.json({
      ok: true,
      muse: { total, pageCount, firstPage: museJobs.length },
      jobicy: { sample: jobicyJobs.length },
      remotive: { sample: remotiveJobs.length },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error" },
      { status: 500 }
    );
  }
}
