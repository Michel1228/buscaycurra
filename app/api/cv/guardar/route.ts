import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";

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

  // Limitar a 20 CVs por usuario (limpieza del más antiguo si se supera)
  const countRes = await pool.query(`SELECT COUNT(*) FROM user_cvs WHERE user_id = $1`, [user.id]);
  if (parseInt(countRes.rows[0].count) >= 20) {
    await pool.query(
      `DELETE FROM user_cvs WHERE id = (SELECT id FROM user_cvs WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1)`,
      [user.id]
    );
  }

  const res = await pool.query(
    `INSERT INTO user_cvs (user_id, nombre, html, form_data, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING id, nombre, created_at`,
    [user.id, (nombre || "Mi CV").slice(0, 80), html, formData ? JSON.stringify(formData) : null]
  );

  return NextResponse.json(res.rows[0]);
}
