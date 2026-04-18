/**
 * app/api/jobs/search/route.ts — API de búsqueda de ofertas de trabajo
 *
 * Recibe:  keyword (palabra clave) y location (ciudad/provincia)
 * Proceso: primero busca en caché Redis; si no hay → llama al scraper
 * Devuelve: array de ofertas de trabajo en formato JSON
 *
 * Parámetros opcionales de filtro:
 *   - jornada:    "completa" | "parcial" | "remoto"
 *   - experiencia: "sin-experiencia" | "1-3" | "3-5" | "5+"
 *   - salarioMin: número (euros/año)
 *
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { NextRequest, NextResponse } from "next/server";
import { obtenerOfertasCacheadas } from "@/lib/cache/job-cache";
import { buscarOfertas } from "@/lib/job-scraper";
import { buscarOfertasReales } from "@/lib/job-search/real-search";

// ─── Handler GET ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Leer parámetros de búsqueda
  const keyword = searchParams.get("keyword") || "";
  const location = searchParams.get("location") || "";
  const jornada = searchParams.get("jornada") || "";
  const experiencia = searchParams.get("experiencia") || "";
  const salarioMinStr = searchParams.get("salarioMin") || "";

  // Validar que al menos uno de los campos esté presente
  if (!keyword.trim() && !location.trim()) {
    return NextResponse.json(
      { error: "Debes introducir al menos una palabra clave o ubicación" },
      { status: 400 }
    );
  }

  try {
    // Intentar búsqueda real primero, fallback al scraper mock
    let ofertasReales;
    try {
      ofertasReales = await buscarOfertasReales(keyword, location, 25);
    } catch {
      ofertasReales = null;
    }

    // Si la búsqueda real devuelve resultados, usarlos directamente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ofertas: any[] = ofertasReales && ofertasReales.length > 0
      ? ofertasReales
      : await obtenerOfertasCacheadas(
          keyword, location,
          () => buscarOfertas(keyword, location)
        );

    // ─── Aplicar filtros sobre los resultados ─────────────────────────────

    // Filtrar por tipo de jornada (si se especificó)
    if (jornada) {
      ofertas = ofertas.filter((oferta) => {
        const modalidad = (oferta.modalidad || "").toLowerCase();
        if (jornada === "remoto") return modalidad === "remoto";
        if (jornada === "completa") return modalidad === "presencial" || modalidad === "hibrido";
        if (jornada === "parcial") return modalidad.includes("parcial");
        return true;
      });
    }

    // Filtrar por salario mínimo (si se especificó y el salario está disponible)
    if (salarioMinStr) {
      const salarioMin = parseInt(salarioMinStr);
      if (!isNaN(salarioMin)) {
        ofertas = ofertas.filter((oferta) => {
          if (!oferta.salario) return true; // No filtrar si no hay datos de salario
          // Extraer el primer número del campo salario
          const match = oferta.salario.match(/(\d[\d.]*)/);
          if (!match) return true;
          const salarioOferta = parseInt(match[1].replace(/\./g, ""));
          return salarioOferta >= salarioMin;
        });
      }
    }

    // Nota: el filtro de experiencia se aplica en el scraper en producción

    return NextResponse.json({
      ofertas,
      total: ofertas.length,
      keyword,
      location,
    });
  } catch (error) {
    console.error("❌ Error en búsqueda de ofertas:", (error as Error).message);
    return NextResponse.json(
      { error: "Error al buscar ofertas. Inténtalo de nuevo más tarde." },
      { status: 500 }
    );
  }
}
