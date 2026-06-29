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
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SYNC_SECRET = process.env.ADMIN_SECRET || "";
const MUSE_OFFSET_FILE = "/tmp/muse_page_offset.txt";

function getMuseOffset(): number {
  try { return parseInt(fs.readFileSync(MUSE_OFFSET_FILE, "utf-8").trim()) || 1; } catch { return 1; }
}
function saveMuseOffset(page: number) {
  fs.writeFileSync(MUSE_OFFSET_FILE, String(page));
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get("x-sync-secret");
  if (auth !== SYNC_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const musePages = body.musePages || 50;
    const museStartPage = body.museStartPage || getMuseOffset();

    const result = await syncGlobalFreeAPIs(musePages, museStartPage);

    // Guardar offset para siguiente ejecución
    const nextPage = museStartPage + musePages;
    saveMuseOffset(nextPage > (result.muse.pageCount || 99999) ? 1 : nextPage);

    return NextResponse.json({
      ok: true,
      ...result,
      museStartPage,
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
