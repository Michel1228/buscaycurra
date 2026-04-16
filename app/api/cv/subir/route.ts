/**
 * app/api/cv/subir/route.ts — API POST para subir el CV en PDF
 *
 * Verifica la autenticación del usuario, valida el archivo PDF
 * (solo PDF, máximo 5MB), lo sube al bucket 'cvs' de Supabase Storage
 * y guarda la URL en el perfil del usuario (tabla profiles.cv_url).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Límites de validación ────────────────────────────────────────────────────

/** Tamaño máximo permitido: 5 MB en bytes */
const TAMANIO_MAXIMO = 5 * 1024 * 1024;

/** Tipo MIME aceptado */
const TIPO_ACEPTADO = "application/pdf";

// ─── POST /api/cv/subir ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ─── Cliente Supabase con clave anónima (para verificar sesión) ───────────
  const supabasePublico = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ─── Cliente Supabase con service role (para subir archivos en Storage) ───
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // ── Verificar autenticación del usuario ─────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión para subir un CV." },
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

    // ── Obtener el archivo del form-data ────────────────────────────────────
    const formData = await request.formData();
    const archivo = formData.get("cv") as File | null;

    if (!archivo) {
      return NextResponse.json(
        { error: "No se ha enviado ningún archivo. Selecciona un PDF." },
        { status: 400 }
      );
    }

    // ── Validar que sea un PDF ───────────────────────────────────────────────
    if (archivo.type !== TIPO_ACEPTADO) {
      return NextResponse.json(
        { error: "Solo se aceptan archivos PDF. Por favor, selecciona un archivo .pdf" },
        { status: 400 }
      );
    }

    // ── Validar tamaño máximo (5 MB) ────────────────────────────────────────
    if (archivo.size > TAMANIO_MAXIMO) {
      return NextResponse.json(
        { error: "El archivo supera el tamaño máximo de 5 MB. Por favor, comprime el PDF." },
        { status: 400 }
      );
    }

    // ── Convertir el archivo a ArrayBuffer para subirlo ─────────────────────
    const buffer = await archivo.arrayBuffer();

    // ── Subir el archivo a Supabase Storage ─────────────────────────────────
    // Ruta: {userId}/cv.pdf — cada usuario tiene su propio directorio
    const rutaArchivo = `${userId}/cv.pdf`;

    const { error: errorSubida } = await supabaseAdmin.storage
      .from("cvs")
      .upload(rutaArchivo, buffer, {
        contentType: TIPO_ACEPTADO,
        upsert: true, // Sobreescribir si ya existe
      });

    if (errorSubida) {
      console.error("[cv/subir] Error al subir a Storage:", errorSubida.message);
      return NextResponse.json(
        { error: "No se pudo subir el CV. Por favor, inténtalo de nuevo." },
        { status: 500 }
      );
    }

    // ── Obtener la URL pública firmada del archivo ───────────────────────────
    // Usamos createSignedUrl para URLs temporales de archivos privados
    const { data: urlData, error: errorUrl } = await supabaseAdmin.storage
      .from("cvs")
      .createSignedUrl(rutaArchivo, 60 * 60 * 24 * 365); // URL válida 1 año

    if (errorUrl || !urlData?.signedUrl) {
      console.error("[cv/subir] Error al obtener URL firmada:", errorUrl?.message);
      return NextResponse.json(
        { error: "CV subido pero no se pudo obtener la URL. Por favor, recarga la página." },
        { status: 500 }
      );
    }

    const cvUrl = urlData.signedUrl;

    // ── Guardar la ruta del CV en el perfil del usuario ─────────────────────
    // Guardamos la ruta relativa (no la URL firmada) para poder regenerarla
    const { error: errorPerfil } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        cv_url: rutaArchivo, // Guardamos la ruta, no la URL firmada
        updated_at: new Date().toISOString(),
      });

    if (errorPerfil) {
      console.error("[cv/subir] Error al guardar cv_url en perfil:", errorPerfil.message);
      return NextResponse.json(
        { error: "CV subido pero no se pudo vincular al perfil. Por favor, contacta con soporte." },
        { status: 500 }
      );
    }

    // ── Respuesta de éxito ──────────────────────────────────────────────────
    return NextResponse.json({
      url: cvUrl,
      mensaje: "CV subido correctamente",
    });
  } catch (error) {
    console.error("[cv/subir] Error inesperado:", (error as Error).message);
    return NextResponse.json(
      { error: "Error interno del servidor. Por favor, inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
