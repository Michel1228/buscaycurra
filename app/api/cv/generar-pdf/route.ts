/**
 * /api/cv/generar-pdf — Genera un CV HTML profesional (estilo Erick)
 * 
 * POST: Recibe datos del CV → genera HTML (el cliente lo renderiza e imprime)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generarCVHTML, type CVData } from "@/lib/cv-generator/cv-template";

export async function POST(request: NextRequest) {
  // Auth — requiere sesión válida para generar HTML del CV
  const supabasePublico = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { data: { user }, error: authError } = await supabasePublico.auth.getUser(authHeader.slice(7));
  if (authError || !user) {
    return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
  }

  try {
    const data: CVData = await request.json();

    if (!data.nombre) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const html = generarCVHTML(data);

    return NextResponse.json({ html });
  } catch (err) {
    console.error("[CV PDF] Error:", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
