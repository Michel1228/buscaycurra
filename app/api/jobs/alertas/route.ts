/**
 * /api/jobs/alertas — Gestión de alertas de empleo
 * POST: crear alerta { keyword, location, frequency }
 * GET: listar alertas del usuario
 * DELETE: eliminar alerta ?id=<alertId>
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://placeholder',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// ─── POST: crear alerta ───────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json() as {
      keyword?: string;
      location?: string;
      frequency?: "daily" | "weekly";
    };

    if (!body.keyword?.trim() && !body.location?.trim()) {
      return NextResponse.json({ error: "Keyword o location requeridos" }, { status: 400 });
    }

    const pool = getPool();
    await pool.query(
      `INSERT INTO job_alerts (user_id, keyword, location, frequency)
       VALUES ($1, $2, $3, $4)`,
      [user.id, body.keyword?.trim() || "", body.location?.trim() || "", body.frequency || "daily"]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[jobs/alertas] Error POST:", (error as Error).message);
    return NextResponse.json({ error: "Error al crear alerta" }, { status: 500 });
  }
}

// ─── GET: listar alertas ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const pool = getPool();
    const result = await pool.query(
      `SELECT id, keyword, location, frequency, created_at, last_sent_at
       FROM job_alerts
       WHERE user_id = $1 AND active = true
       ORDER BY created_at DESC`,
      [user.id]
    );

    return NextResponse.json({ alertas: result.rows });
  } catch (error) {
    console.error("[jobs/alertas] Error GET:", (error as Error).message);
    return NextResponse.json({ error: "Error al obtener alertas" }, { status: 500 });
  }
}

// ─── DELETE: eliminar alerta ──────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("id");
    if (!alertId) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const pool = getPool();
    await pool.query(
      `DELETE FROM job_alerts WHERE id = $1 AND user_id = $2`,
      [alertId, user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[jobs/alertas] Error DELETE:", (error as Error).message);
    return NextResponse.json({ error: "Error al eliminar alerta" }, { status: 500 });
  }
}
