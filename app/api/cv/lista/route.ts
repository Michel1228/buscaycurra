import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });

  const pool = getPool();
  const res = await pool.query(
    `SELECT id, nombre, form_data, created_at, updated_at,
            LEFT(html, 200) as html_preview
     FROM user_cvs
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [user.id]
  );

  return NextResponse.json({ cvs: res.rows });
}

// GET by id — para cargar el HTML completo
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });

  const { id } = await req.json();
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, nombre, html, form_data, created_at, updated_at
     FROM user_cvs WHERE id = $1 AND user_id = $2`,
    [id, user.id]
  );

  if (!res.rows[0]) return NextResponse.json({ error: "CV no encontrado" }, { status: 404 });
  return NextResponse.json(res.rows[0]);
}
