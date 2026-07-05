import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
  if (authError || !user) {
    return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json() as { id?: string; all?: boolean };

  // Soft-delete: marcamos hidden=true en vez de borrar físicamente. Así el envío
  // desaparece del historial del usuario PERO sigue contando para el límite de
  // envíos y el anti-spam de 15 días (que cuentan todas las filas). Esto evita
  // que un usuario resetee su cuota borrando el historial y reenviando sin tope.
  if (body.all) {
    const { error } = await serviceClient
      .from("cv_sends")
      .update({ hidden: true })
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, deleted: "all" });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Se requiere id o all:true" }, { status: 400 });
  }

  const { error } = await serviceClient
    .from("cv_sends")
    .update({ hidden: true })
    .eq("id", body.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
