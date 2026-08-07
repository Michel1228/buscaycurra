/**
 * /api/jobs/guardar — Guardar/eliminar oferta de favoritos
 * POST: { jobId, action: "save" | "unsave" }
 * GET: lista de ofertas guardadas del usuario
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getUserId } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

// ─── POST: guardar o quitar oferta ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json() as { jobId?: string; action?: "save" | "unsave" };
    const { jobId, action } = body;

    if (!jobId) {
      return NextResponse.json({ error: "jobId requerido" }, { status: 400 });
    }

    const pool = getPool();

    if (action === "unsave") {
      await pool.query(
        'DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2',
        [userId, jobId]
      );
      return NextResponse.json({ saved: false });
    }

    // Tope de ofertas guardadas segun el plan. Estaba definido en
    // lib/plan-limits.ts (ofertasGuardadas) y se enseñaba en la pantalla de
    // uso, pero no lo comprobaba nadie: el plan gratuito anunciaba 10 y podia
    // guardar infinitas. Se cuenta antes de insertar, y solo si es una oferta
    // nueva (volver a guardar una que ya tienes no deberia contar).
    const { getPlanLimits } = await import("@/lib/plan-limits");
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: perfil } = await sb.from("profiles").select("plan").eq("id", userId).single();
    const limites = getPlanLimits(perfil?.plan || "free");

    if (limites.ofertasGuardadas < 999999) {
      const yaGuardada = await pool.query(
        "SELECT 1 FROM saved_jobs WHERE user_id = $1 AND job_id = $2",
        [userId, jobId]
      );
      if (yaGuardada.rowCount === 0) {
        const { rows } = await pool.query<{ n: string }>(
          "SELECT count(*)::text AS n FROM saved_jobs WHERE user_id = $1",
          [userId]
        );
        if (parseInt(rows[0]?.n || "0", 10) >= limites.ofertasGuardadas) {
          return NextResponse.json(
            {
              error: `Has llegado a ${limites.ofertasGuardadas} ofertas guardadas, el máximo de tu plan ${limites.name}. Borra alguna o amplía tu plan para guardar más.`,
              upgradeUrl: "/app/perfil?tab=plan",
            },
            { status: 402 }
          );
        }
      }
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
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
