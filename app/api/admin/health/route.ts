/**
 * /api/admin/health — Estado de salud del sistema de APIs
 * Usado por el GitHub Actions watchdog para monitoreo externo.
 */
import { NextRequest, NextResponse } from "next/server";
import { getPoolStatus } from "@/lib/job-search/api-pool";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const status: Record<string, unknown> = { ok: true, timestamp: new Date().toISOString() };

  // DB health
  try {
    const pool = getPool();
    const res = await pool.query("SELECT COUNT(*) FROM \"JobListing\" WHERE \"isActive\" = true");
    status.db = { ok: true, totalJobs: parseInt(res.rows[0].count) };
  } catch (e) {
    status.db = { ok: false, error: (e as Error).message };
    status.ok = false;
  }

  // API pool status
  try {
    status.apis = await getPoolStatus();
    const apis = status.apis as Record<string, { statuses: { ok: boolean }[] }>;
    const allDown = ["adzuna", "jooble", "careerjet"].every(p =>
      (apis[p]?.statuses || []).every(s => !s.ok)
    );
    if (allDown) status.ok = false;
  } catch (e) {
    status.apis = { error: (e as Error).message };
  }

  const httpStatus = status.ok ? 200 : 503;
  return NextResponse.json(status, { status: httpStatus });
}
