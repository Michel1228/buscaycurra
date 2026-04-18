/**
 * app/api/cv/subir/route.ts — Sube CV PDF a Supabase Storage
 * 
 * Ruta estándar: {userId}/cv.pdf en bucket 'cvs'
 * NO depende de columna cv_url en profiles (puede no existir)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TAMANIO_MAXIMO = 5 * 1024 * 1024;
const TIPO_ACEPTADO = "application/pdf";

export async function POST(request: NextRequest) {
  const supabasePublico = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Auth
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { data: { user }, error: authError } = await supabasePublico.auth.getUser(authHeader.slice(7));
    if (authError || !user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }

    // Get file
    const formData = await request.formData();
    const archivo = formData.get("cv") as File | null;
    if (!archivo) {
      return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 });
    }
    if (archivo.type !== TIPO_ACEPTADO) {
      return NextResponse.json({ error: "Solo se aceptan PDF" }, { status: 400 });
    }
    if (archivo.size > TAMANIO_MAXIMO) {
      return NextResponse.json({ error: "Máximo 5 MB" }, { status: 400 });
    }

    // Upload to Storage
    const buffer = await archivo.arrayBuffer();
    const rutaArchivo = `${user.id}/cv.pdf`;

    const { error: errorSubida } = await supabaseAdmin.storage
      .from("cvs")
      .upload(rutaArchivo, buffer, {
        contentType: TIPO_ACEPTADO,
        upsert: true,
      });

    if (errorSubida) {
      console.error("[cv/subir] Storage error:", errorSubida.message);
      return NextResponse.json({ error: "No se pudo subir el CV" }, { status: 500 });
    }

    // Get signed URL
    const { data: urlData } = await supabaseAdmin.storage
      .from("cvs")
      .createSignedUrl(rutaArchivo, 60 * 60 * 24 * 365);

    // Try to save cv_url in profiles (optional - column may not exist)
    try {
      await supabaseAdmin.from("profiles")
        .update({ cv_url: rutaArchivo, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    } catch {
      // Column doesn't exist yet - that's fine, we use convention-based path
      console.log("[cv/subir] cv_url column not in profiles, using path convention");
    }

    return NextResponse.json({
      url: urlData?.signedUrl || null,
      mensaje: "CV subido correctamente ✓",
    });
  } catch (error) {
    console.error("[cv/subir] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
