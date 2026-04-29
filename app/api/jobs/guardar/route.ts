/**
 * /api/jobs/guardar — Guardar/eliminar oferta de favoritos
 * POST: { jobId, action: "save" | "unsave" }
 * GET: lista de ofertas guardadas del usuario
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// ─── POST: guardar o quitar oferta ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { jobId?: string; action?: "save" | "unsave"; userId?: string };
    const { jobId, action, userId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "jobId requerido" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const pool = getPool();

    if (action === "unsave") {
      await pool.query(
        'DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2',
        [userId, jobId]
      );
      return NextResponse.json({ saved: false });
    }

    // Guardar oferta (upsert)
    await pool.query(
      `INSERT INTO saved_jobs (user_id, job_id, created_at) 
       VALUES ($1, $2, NOW()) 
       ON CONFLICT (user_id, job_id) DO UPDATE SET created_at = NOW()`,
      [userId, jobId]
    );
    
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("[jobs/guardar] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error al guardar oferta: " + (error as Error).message }, { status: 500 });
  }
}

// ─── GET: listar ofertas guardadas ────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      'SELECT job_id, created_at FROM saved_jobs WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return NextResponse.json({ guardados: result.rows || [] });
  } catch (error) {
    console.error("[jobs/guardar] Error GET:", (error as Error).message);
    return NextResponse.json({ error: "Error al obtener guardados: " + (error as Error).message }, { status: 500 });
  }
}
