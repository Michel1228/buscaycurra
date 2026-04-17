/**
 * app/api/cuenta/borrar/route.ts — API endpoint DELETE para borrar cuenta completa
 *
 * Verifica que el usuario está autenticado y borra en orden:
 *   1. Registros de cv_sends del usuario
 *   2. Perfil de la tabla profiles
 *   3. El usuario de Supabase Auth (usando service role)
 *
 * Solo acepta peticiones DELETE autenticadas.
 * Devuelve confirmación o mensaje de error.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── DELETE /api/cuenta/borrar ────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  // ─── Cliente con clave anónima (para verificar sesión del usuario) ──────
  const supabasePublico = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ─── Cliente con service role (para operaciones de admin: borrar usuario auth) ─
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // ── Verificar autenticación del usuario ────────────────────────────────
    // Obtenemos el token del header Authorization
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión para realizar esta acción." },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Quitar "Bearer "

    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabasePublico.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sesión no válida. Por favor, inicia sesión de nuevo." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ── Borrar ficheros del bucket 'cvs' (Storage) ─────────────────────────
    // RGPD: el borrado de cuenta debe eliminar TODOS los datos personales,
    // incluido el PDF del CV. Listamos el directorio del usuario y borramos.
    try {
      const { data: ficheros } = await supabaseAdmin.storage
        .from("cvs")
        .list(userId);

      if (ficheros && ficheros.length > 0) {
        const rutas = ficheros.map((f) => `${userId}/${f.name}`);
        const { error: errorStorage } = await supabaseAdmin.storage
          .from("cvs")
          .remove(rutas);
        if (errorStorage) {
          console.error("[borrar cuenta] Error al borrar ficheros Storage:", errorStorage.message);
        }
      }
    } catch (err) {
      console.error("[borrar cuenta] Error listando Storage:", (err as Error).message);
    }

    // ── Borrar registros de la tabla cvs (metadatos del CV) ────────────────
    const { error: errorCvs } = await supabaseAdmin
      .from("cvs")
      .delete()
      .eq("user_id", userId);

    if (errorCvs) {
      console.error("[borrar cuenta] Error al borrar cvs:", errorCvs.message);
    }

    // ── Borrar entradas en la lista negra de empresas ──────────────────────
    const { error: errorBlacklist } = await supabaseAdmin
      .from("cv_blacklist")
      .delete()
      .eq("user_id", userId);

    if (errorBlacklist) {
      console.error("[borrar cuenta] Error al borrar cv_blacklist:", errorBlacklist.message);
    }

    // ── Borrar registros de cv_sends del usuario ───────────────────────────
    const { error: errorEnvios } = await supabaseAdmin
      .from("cv_sends")
      .delete()
      .eq("user_id", userId);

    if (errorEnvios) {
      console.error("[borrar cuenta] Error al borrar cv_sends:", errorEnvios.message);
      // No bloqueamos el proceso aunque falle esta parte
    }

    // ── Borrar el perfil del usuario de la tabla profiles ──────────────────
    const { error: errorPerfil } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (errorPerfil) {
      console.error("[borrar cuenta] Error al borrar profiles:", errorPerfil.message);
      // No bloqueamos el proceso aunque falle esta parte
    }

    // ── Borrar el usuario de Supabase Auth (operación irreversible) ────────
    const { error: errorAuth } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (errorAuth) {
      console.error("[borrar cuenta] Error al borrar usuario auth:", errorAuth.message);
      return NextResponse.json(
        { error: "No se pudo eliminar la cuenta. Por favor, contacta con soporte." },
        { status: 500 }
      );
    }

    // ── Respuesta de éxito ─────────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        mensaje: "Tu cuenta ha sido eliminada permanentemente. Hasta pronto.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[borrar cuenta] Error inesperado:", (error as Error).message);
    return NextResponse.json(
      { error: "Error interno del servidor. Por favor, inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
