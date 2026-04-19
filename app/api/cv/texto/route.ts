/**
 * app/api/cv/texto/route.ts — Extrae el texto del CV PDF del usuario
 *
 * Descarga el PDF desde Supabase Storage y usa pdf-parse para
 * devolver el texto plano, listo para pegarlo en el editor de IA.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// pdf-parse has ESM/CJS compat issues with bundler moduleResolution — use require
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;

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
      { error: "No se pudo descargar el CV para extraer el texto." },
      { status: 500 }
    );
  }

  // ── Extraer texto con pdf-parse ────────────────────────────────────────────
  try {
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const resultado = await pdfParse(buffer);
    const texto = resultado.text.trim();
    return NextResponse.json({ texto: texto || null });
  } catch {
    return NextResponse.json(
      { error: "No se pudo extraer el texto del PDF. Pégalo manualmente." },
      { status: 500 }
    );
  }
}
