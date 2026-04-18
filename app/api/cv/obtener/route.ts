/**
 * app/api/cv/obtener/route.ts — Obtiene URL del CV del usuario
 * 
 * Busca el archivo {userId}/cv.pdf en el bucket 'cvs'
 * NO depende de columna cv_url en profiles
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
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

    // Check if file exists in storage
    const rutaArchivo = `${user.id}/cv.pdf`;
    const { data: files } = await supabaseAdmin.storage
      .from("cvs")
      .list(user.id, { limit: 1, search: "cv.pdf" });

    if (!files || files.length === 0) {
      return NextResponse.json({ cvUrl: null });
    }

    // Generate signed URL
    const { data: urlData } = await supabaseAdmin.storage
      .from("cvs")
      .createSignedUrl(rutaArchivo, 60 * 60 * 24); // 24h

    return NextResponse.json({ cvUrl: urlData?.signedUrl || null });
  } catch (error) {
    console.error("[cv/obtener] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
