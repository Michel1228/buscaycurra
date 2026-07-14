import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import { getPlanLimits } from "@/lib/plan-limits";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });

  const { nombre, html, formData } = await req.json();
  if (!html?.trim()) return NextResponse.json({ error: "Sin HTML" }, { status: 400 });

  const pool = getPool();

  // ── Límite de CVs guardados según plan (fuente única: lib/plan-limits.ts) ──
  const { data: perfil } = await sb.from("profiles").select("plan").eq("id", user.id).single();
  const limits = getPlanLimits(perfil?.plan);
  const countRes = await pool.query(`SELECT COUNT(*)::int AS n FROM user_cvs WHERE user_id = $1`, [user.id]);
  if (countRes.rows[0].n >= limits.cvsGuardados) {
    return NextResponse.json({
      error: `Tu plan ${limits.name} permite ${limits.cvsGuardados} ${limits.cvsGuardados === 1 ? "currículum guardado" : "currículums guardados"}. Elimina uno o mejora tu plan en /app/perfil para crear más.`,
      limite: limits.cvsGuardados,
      plan: limits.name,
    }, { status: 403 });
  }

  const res = await pool.query(
    `INSERT INTO user_cvs (user_id, nombre, html, form_data, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING id, nombre, created_at`,
    [user.id, (nombre || "Mi CV").slice(0, 80), html, formData ? JSON.stringify(formData) : null]
  );

  return NextResponse.json(res.rows[0]);
}
