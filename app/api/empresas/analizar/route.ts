/**
 * /api/empresas/analizar — Analiza empresa desde su URL
 * GET: ?url=https://empresa.com → nombre, email RRHH, página empleo
 */

import { NextRequest, NextResponse } from "next/server";
import { extraerInfoEmpresa } from "@/lib/company-extractor";

export async function GET(request: NextRequest) {
  const url = new URL(request.url).searchParams.get("url") || "";

  if (!url.trim()) {
    return NextResponse.json({ error: "Debes proporcionar la URL de la empresa" }, { status: 400 });
  }

  try { new URL(url); } catch {
    return NextResponse.json({ error: "URL no válida" }, { status: 400 });
  }

  try {
    const datos = await extraerInfoEmpresa(url);
    return NextResponse.json({
      nombre: datos.nombre,
      emailRrhh: datos.emailRrhh,
      paginaEmpleo: datos.paginaEmpleo,
    });
  } catch (error) {
    console.error("Error al analizar empresa:", (error as Error).message);
    return NextResponse.json({ error: "Error al analizar la empresa" }, { status: 500 });
  }
}
