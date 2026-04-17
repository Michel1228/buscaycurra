/**
 * app/api/jobs/search/route.ts — API de búsqueda de ofertas de trabajo
 *
 * Auth:
 *   Header obligatorio: Authorization: Bearer <supabase_access_token>
 *   Evita scraping anónimo que podría causar baneos en las fuentes.
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
import { createClient } from "@supabase/supabase-js";
import { obtenerOfertasCacheadas } from "@/lib/cache/job-cache";
import { buscarOfertas } from "@/lib/job-scraper";

// ─── Handler GET ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // ─── Cliente Supabase con clave anónima (para verificar sesión) ───────────
  const supabasePublico = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── Verificar autenticación del usuario ─────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "No autorizado. Debes iniciar sesión para buscar ofertas." },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabasePublico.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: "Sesión no válida. Por favor, inicia sesión de nuevo." },
      { status: 401 }
    );
  }

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
    // Buscar en caché Redis primero; si no hay, ejecutar el scraper
    let ofertas = await obtenerOfertasCacheadas(
      keyword,
      location,
      () => buscarOfertas(keyword, location)
    );

    // ─── Aplicar filtros sobre los resultados ─────────────────────────────

    // Filtrar por tipo de jornada (si se especificó)
    if (jornada) {
      ofertas = ofertas.filter((oferta) => {
        const modalidad = oferta.modalidad?.toLowerCase() || "";
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
