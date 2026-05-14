import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
  if (authError || !user) {
    return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
  }

  const { visible } = await request.json() as { visible: boolean };

  const pool = getPool();
  await pool.query(
    `INSERT INTO user_cvs (user_id, nombre, html, form_data, visible_empresas, updated_at)
     VALUES ($1, 'Mi CV', '', '{}', $2, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET visible_empresas = $2, updated_at = NOW()`,
    [user.id, visible]
  );

  return NextResponse.json({ ok: true, visible });
}
