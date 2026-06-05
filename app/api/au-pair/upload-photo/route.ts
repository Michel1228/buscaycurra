import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB

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
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { data: { user }, error: authError } = await supabasePublico.auth.getUser(authHeader.slice(7));
    if (authError || !user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }

    const formData = await request.formData();
    const archivo = formData.get("foto") as File | null;
    if (!archivo) {
      return NextResponse.json({ error: "No se envió ninguna imagen" }, { status: 400 });
    }
    if (!TIPOS_ACEPTADOS.includes(archivo.type)) {
      return NextResponse.json({ error: "Solo se aceptan imágenes JPG, PNG o WebP" }, { status: 400 });
    }
    if (archivo.size > TAMANO_MAXIMO) {
      return NextResponse.json({ error: "La imagen no puede superar 5 MB" }, { status: 400 });
    }

    const ext = archivo.type.split("/")[1] || "jpg";
    const timestamp = Date.now();
    const path = `au-pair/${user.id}/photo_${timestamp}.${ext}`;
    const buffer = await archivo.arrayBuffer();

    const { error: errorSubida } = await supabaseAdmin.storage
      .from("profiles")
      .upload(path, buffer, { contentType: archivo.type, upsert: true });

    if (errorSubida) {
      console.error("[au-pair/upload-photo] Storage error:", errorSubida.message);
      return NextResponse.json({ error: "No se pudo subir la foto" }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from("profiles").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("[au-pair/upload-photo] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

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

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    // Extraer path del bucket de la URL pública de Supabase
    const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profiles/`;
    if (!url.startsWith(bucketUrl)) {
      return NextResponse.json({ error: "URL no válida" }, { status: 400 });
    }
    const storagePath = url.replace(bucketUrl, "");

    const { error } = await supabaseAdmin.storage
      .from("profiles")
      .remove([storagePath]);

    if (error) {
      console.error("[au-pair/upload-photo] Delete error:", error.message);
      return NextResponse.json({ error: "No se pudo eliminar la foto" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[au-pair/upload-photo] Delete error:", (error as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
