import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ visible_empresas: visible, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("[perfil/visibilidad] Error:", error.message);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, visible });
}
