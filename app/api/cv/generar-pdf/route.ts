/**
 * /api/cv/generar-pdf — Genera un CV HTML profesional (estilo Erick)
 * 
 * POST: Recibe datos del CV → genera HTML (el cliente lo renderiza e imprime)
 */

import { NextRequest, NextResponse } from "next/server";
import { generarCVHTML, type CVData } from "@/lib/cv-generator/cv-template";

export async function POST(request: NextRequest) {
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
