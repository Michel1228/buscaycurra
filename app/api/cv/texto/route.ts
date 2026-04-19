/**
 * app/api/cv/texto/route.ts — Extrae el texto del CV PDF del usuario
 *
 * Descarga el PDF desde Supabase Storage y extrae el texto sin
 * dependencias externas (regex sobre el buffer del PDF).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function extraerTextoPDF(buffer: Buffer): string {
  const str = buffer.toString("latin1");
  const partes: string[] = [];

  // Extraer contenido de objetos de texto PDF (strings entre paréntesis)
  const textMatches = str.match(/\(([^)]{2,})\)/g) ?? [];
  for (const m of textMatches) {
    const t = m.slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "")
      .replace(/\\t/g, " ")
      .replace(/\\\\/g, "\\")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .trim();
    if (t.length > 1 && !/^[\x00-\x1f]+$/.test(t)) partes.push(t);
  }

  // También intentar streams de texto plano
  const streamMatches = str.match(/stream\r?\n([\s\S]*?)\r?\nendstream/g) ?? [];
  for (const sm of streamMatches) {
    const content = sm.replace(/^stream\r?\n/, "").replace(/\r?\nendstream$/, "");
    const legible = content.replace(/[^\x20-\x7E\xC0-\xFF\n]/g, "").trim();
    if (legible.length > 30) partes.push(legible);
  }

  return partes.join(" ").replace(/\s+/g, " ").trim();
}

export async function GET(request: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ texto: null });
  }

  const supabasePublico = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ── Autenticación ──────────────────────────────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabasePublico.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  }

  // ── Obtener ruta del CV ────────────────────────────────────────────────────
  const { data: perfil } = await supabaseAdmin
    .from("profiles")
    .select("cv_url")
    .eq("id", user.id)
    .single();

  if (!perfil?.cv_url) {
    return NextResponse.json({ texto: null });
  }

  // ── Descargar el PDF desde Storage ────────────────────────────────────────
  const { data: archivo, error: errorDescarga } = await supabaseAdmin.storage
    .from("cvs")
    .download(perfil.cv_url);

  if (errorDescarga || !archivo) {
    return NextResponse.json(
      { error: "No se pudo descargar el CV." },
      { status: 500 }
    );
  }

  // ── Extraer texto ─────────────────────────────────────────────────────────
  try {
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const texto = extraerTextoPDF(buffer);
    return NextResponse.json({ texto: texto || null });
  } catch {
    return NextResponse.json(
      { error: "No se pudo extraer el texto del PDF. Pégalo manualmente." },
      { status: 500 }
    );
  }
}
