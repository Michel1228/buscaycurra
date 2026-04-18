/**
 * app/api/cv/borrar/route.ts — Elimina el CV del usuario
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(request: NextRequest) {
  const supabasePublico = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { data: { user }, error: authError } = await supabasePublico.auth.getUser(authHeader.slice(7));
    if (authError || !user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }

    const rutaArchivo = `${user.id}/cv.pdf`;
    const { error } = await supabaseAdmin.storage
      .from("cvs")
      .remove([rutaArchivo]);

    if (error) {
      console.error("[cv/borrar] Error:", error.message);
      return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
    }

    // Try to clear cv_url in profiles (optional)
    try {
      await supabaseAdmin.from("profiles")
        .update({ cv_url: null })
        .eq("id", user.id);
    } catch { /* column may not exist */ }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[cv/borrar] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
