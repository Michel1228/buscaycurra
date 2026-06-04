import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = getPool();
    const res = await pool.query('SELECT COUNT(*) FROM "JobListing" WHERE "isActive" = true');
    const totalOfertas = parseInt(res.rows[0].count);
    return NextResponse.json({
      ok: true,
      version: process.env.npm_package_version || "1.0.0",
      totalOfertas,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[ping] Error:', (e as Error).message);
    return NextResponse.json({ ok: false, error: 'Error de conexión' }, { status: 500 });
  }
}
