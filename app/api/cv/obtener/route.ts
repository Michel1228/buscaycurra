/**
 * app/api/cv/obtener/route.ts — API GET para obtener la URL del CV del usuario
 *
 * Verifica la autenticación del usuario y devuelve la URL firmada
 * del CV almacenado en Supabase Storage (si existe).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── GET /api/cv/obtener ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // ─── Cliente Supabase con clave anónima (para verificar sesión) ───────────
  const supabasePublico = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ─── Cliente Supabase con service role (para acceder a Storage) ───────────
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // ── Verificar autenticación del usuario ─────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión para ver tu CV." },
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
    const { data: perfil, error: errorPerfil } = await supabaseAdmin
      .from("profiles")
      .select("cv_url")
      .eq("id", userId)
      .single();

    if (errorPerfil) {
      // Error al consultar — puede que el perfil no exista aún
      return NextResponse.json({ cvUrl: null });
    }

    // ── Si no tiene CV, devolver null ────────────────────────────────────────
    if (!perfil?.cv_url) {
      return NextResponse.json({ cvUrl: null });
    }

    // ── Generar URL firmada (válida 1 hora) para que el usuario pueda ver el PDF ─
    const { data: urlData, error: errorUrl } = await supabaseAdmin.storage
      .from("cvs")
      .createSignedUrl(perfil.cv_url, 60 * 60); // URL válida 1 hora

    if (errorUrl || !urlData?.signedUrl) {
      console.error("[cv/obtener] Error al generar URL firmada:", errorUrl?.message);
      return NextResponse.json(
        { error: "No se pudo obtener la URL del CV. Por favor, inténtalo de nuevo." },
        { status: 500 }
      );
    }

    // ── Devolver la URL firmada ──────────────────────────────────────────────
    return NextResponse.json({ cvUrl: urlData.signedUrl });
  } catch (error) {
    console.error("[cv/obtener] Error inesperado:", (error as Error).message);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
