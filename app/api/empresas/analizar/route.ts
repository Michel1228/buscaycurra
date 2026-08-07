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

  // Este endpoint hace una peticion a la URL que le pasen. Sin autenticar y sin
  // filtrar, cualquiera podia usarlo para que el servidor le sondeara su propia
  // red interna (los contenedores se ven entre si por nombre) o los metadatos
  // del proveedor. Es el patron clasico de SSRF.
  const { getUserId } = await import("@/lib/auth-server");
  if (!(await getUserId(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let destino: URL;
  try { destino = new URL(url); } catch {
    return NextResponse.json({ error: "URL no válida" }, { status: 400 });
  }
  if (destino.protocol !== "http:" && destino.protocol !== "https:") {
    return NextResponse.json({ error: "Solo se admiten direcciones http o https" }, { status: 400 });
  }
  const host = destino.hostname.toLowerCase();
  const esInterno =
    host === "localhost" || host === "0.0.0.0" || host.endsWith(".local") || host.endsWith(".internal") ||
    !host.includes(".") ||                                   // nombres de contenedor: buscaycurra-api
    /^127\./.test(host) || /^10\./.test(host) ||               // redes privadas
    /^192\.168\./.test(host) || /^169\.254\./.test(host) ||     // enlace local y metadatos del proveedor
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.includes(":");                                      // IPv6, incluido ::1
  if (esInterno) {
    return NextResponse.json({ error: "Esa dirección no es una web pública" }, { status: 400 });
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
