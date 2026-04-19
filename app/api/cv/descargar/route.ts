/**
 * app/api/cv/descargar/route.ts — API GET para descargar el CV del usuario como PDF
 *
 * Verifica la autenticación del usuario, obtiene la URL firmada del CV desde
 * Supabase Storage, hace fetch del archivo y lo devuelve con las cabeceras
 * necesarias para forzar la descarga en el navegador (Content-Disposition: attachment).
 *
 * Cabeceras de respuesta:
 *   - Content-Type: application/pdf
 *   - Content-Disposition: attachment; filename="CV_BuscayCurra.pdf"
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── GET /api/cv/descargar ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
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
        { error: "No autorizado. Debes iniciar sesión para descargar tu CV." },
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

    if (errorPerfil || !perfil?.cv_url) {
      return NextResponse.json(
        { error: "No tienes ningún CV subido. Por favor, sube tu CV primero." },
        { status: 404 }
      );
    }

    // ── Generar URL firmada de corta duración solo para la descarga ─────────
    const { data: urlData, error: errorUrl } = await supabaseAdmin.storage
      .from("cvs")
      .createSignedUrl(perfil.cv_url, 60); // URL válida 1 minuto (solo para la descarga)

    if (errorUrl || !urlData?.signedUrl) {
      console.error("[cv/descargar] Error al generar URL firmada:", errorUrl?.message);
      return NextResponse.json(
        { error: "No se pudo obtener el CV. Por favor, inténtalo de nuevo." },
        { status: 500 }
      );
    }

    // ── Descargar el archivo desde Supabase Storage ─────────────────────────
    const respuestaArchivo = await fetch(urlData.signedUrl);

    if (!respuestaArchivo.ok) {
      return NextResponse.json(
        { error: "No se pudo descargar el archivo del almacenamiento." },
        { status: 502 }
      );
    }

    // ── Obtener el contenido binario del PDF ────────────────────────────────
    const contenidoPdf = await respuestaArchivo.arrayBuffer();

    // ── Devolver el PDF con cabeceras de descarga forzada ───────────────────
    // Content-Disposition: attachment fuerza la descarga en lugar de abrir en el navegador
    return new NextResponse(contenidoPdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="CV_BuscayCurra.pdf"',
        "Content-Length": contenidoPdf.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("[cv/descargar] Error inesperado:", (error as Error).message);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
