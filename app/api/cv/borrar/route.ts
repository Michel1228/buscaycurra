/**
 * app/api/cv/borrar/route.ts — API DELETE para borrar el CV del usuario
 *
 * Verifica la autenticación del usuario, borra el archivo del bucket
 * de Supabase Storage y pone cv_url a null en el perfil del usuario.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── DELETE /api/cv/borrar ────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Servicio no configurado." }, { status: 503 });
  }

  const supabasePublico = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // ── Verificar autenticación del usuario ─────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión para borrar tu CV." },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabasePublico.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sesión no válida. Por favor, inicia sesión de nuevo." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ── Obtener la ruta del CV desde el perfil del usuario ──────────────────
    const { data: perfil } = await supabaseAdmin
      .from("profiles")
      .select("cv_url")
      .eq("id", userId)
      .single();

    if (!perfil?.cv_url) {
      return NextResponse.json(
        { error: "No tienes ningún CV subido para borrar." },
        { status: 404 }
      );
    }

    // ── Borrar el archivo de Supabase Storage ───────────────────────────────
    const { error: errorStorage } = await supabaseAdmin.storage
      .from("cvs")
      .remove([perfil.cv_url]);

    if (errorStorage) {
      console.error("[cv/borrar] Error al borrar de Storage:", errorStorage.message);
      // Continuamos aunque falle el borrado del archivo — actualizamos el perfil igualmente
    }

    // ── Poner cv_url a null en el perfil del usuario ─────────────────────────
    const { error: errorPerfil } = await supabaseAdmin
      .from("profiles")
      .update({
        cv_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (errorPerfil) {
      console.error("[cv/borrar] Error al actualizar perfil:", errorPerfil.message);
      return NextResponse.json(
        { error: "No se pudo borrar el CV del perfil. Por favor, inténtalo de nuevo." },
        { status: 500 }
      );
    }

    // ── Respuesta de éxito ──────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      mensaje: "CV eliminado correctamente",
    });
  } catch (error) {
    console.error("[cv/borrar] Error inesperado:", (error as Error).message);
    return NextResponse.json(
      { error: "Error interno del servidor. Por favor, inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
