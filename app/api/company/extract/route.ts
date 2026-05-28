/**
 * POST /api/company/extract
 * Extrae emails y datos de contacto de la web de una empresa.
 * Usa scraping + Hunter.io como fallback.
 */
import { NextRequest, NextResponse } from "next/server";
import { extraerInfoEmpresa } from "@/lib/company-extractor";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "URL de empresa requerida" }, { status: 400 });
    }

    // Validar URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: "URL no válida" }, { status: 400 });
    }

    console.log(`🔍 Extractor API: analizando ${parsedUrl.href}`);

    const datos = await extraerInfoEmpresa(parsedUrl.href);

    return NextResponse.json({
      success: true,
      empresa: {
        nombre: datos.nombre,
        emailRrhh: datos.emailRrhh || null,
        telefono: datos.telefono || null,
        paginaEmpleo: datos.paginaEmpleo || null,
        dominio: parsedUrl.hostname,
      },
    });
  } catch (error) {
    console.error("[company/extract] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Error al extraer información de la empresa" },
      { status: 500 }
    );
  }
}
