/**
 * app/api/empresas/analizar/route.ts — API para analizar empresa desde su URL
 *
 * Recibe:  url (URL de la empresa a analizar)
 * Proceso: busca en caché Redis → si no hay, usa company-extractor
 * Devuelve: nombre, email RRHH, teléfono y página de empleo
 *
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { NextRequest, NextResponse } from "next/server";
import { obtenerInfoEmpresaCacheada } from "@/lib/cache/job-cache";
import { extraerInfoEmpresa } from "@/lib/company-extractor";

// ─── Handler GET ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Leer la URL de la empresa
  const url = searchParams.get("url") || "";

  // Validar que se ha proporcionado una URL
  if (!url.trim()) {
    return NextResponse.json(
      { error: "Debes proporcionar la URL de la empresa" },
      { status: 400 }
    );
  }

  // Validar que la URL tiene formato correcto
  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "La URL no es válida. Ejemplo: https://www.empresa.com" },
      { status: 400 }
    );
  }

  try {
    // Buscar en caché Redis primero (TTL: 7 días)
    // Si no hay caché, extraer la información de la web de la empresa
    const infoEmpresa = await obtenerInfoEmpresaCacheada(url, () =>
      extraerInfoEmpresa(url).then((datos) => ({
        nombre: datos.nombre,
        url,
        emailContacto: datos.emailRrhh,
        descripcion: datos.paginaEmpleo,
        fechaObtencion: new Date().toISOString(),
      }))
    );

    // Devolver los datos en el formato esperado por el frontend
    return NextResponse.json({
      nombre: infoEmpresa.nombre,
      emailRrhh: infoEmpresa.emailContacto,
      telefono: undefined, // Se obtiene del scraping real
      paginaEmpleo: infoEmpresa.descripcion,
    });
  } catch (error) {
    console.error("❌ Error al analizar empresa:", (error as Error).message);
    return NextResponse.json(
      { error: "Error al analizar la empresa. Inténtalo de nuevo más tarde." },
      { status: 500 }
    );
  }
}
