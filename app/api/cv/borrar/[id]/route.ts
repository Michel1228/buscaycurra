import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });

  const { id } = await params;
  const pool = getPool();
  const res = await pool.query(
    `DELETE FROM user_cvs WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, user.id]
  );

  if (!res.rows[0]) return NextResponse.json({ error: "CV no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
