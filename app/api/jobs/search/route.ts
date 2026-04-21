/**
 * /api/jobs/search — Búsqueda de ofertas de trabajo
 * GET: ?keyword=X&location=Y → ofertas reales (Adzuna + LinkedIn + Careerjet)
 */

import { NextRequest, NextResponse } from "next/server";
import { buscarOfertasReales } from "@/lib/job-search/real-search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") || "";
  const location = searchParams.get("location") || "";

  if (!keyword.trim() && !location.trim()) {
    return NextResponse.json(
      { error: "Debes introducir al menos una palabra clave o ubicación" },
      { status: 400 }
    );
  }

  try {
    const ofertas = await buscarOfertasReales(keyword, location, 50);

    // Filtros opcionales
    const jornada = searchParams.get("jornada") || "";
    const salarioMinStr = searchParams.get("salarioMin") || "";

    let filtradas = ofertas;

    if (jornada) {
      filtradas = filtradas.filter((o) => {
        const t = o.titulo.toLowerCase();
        if (jornada === "remoto") return t.includes("remoto") || t.includes("teletrabajo");
        if (jornada === "parcial") return t.includes("parcial");
        return true;
      });
    }

    if (salarioMinStr) {
      const salarioMin = parseInt(salarioMinStr);
      if (!isNaN(salarioMin)) {
        filtradas = filtradas.filter((o) => {
          if (!o.salario || o.salario === "Ver en oferta") return true;
          const match = o.salario.match(/(\d[\d.]*)/);
          if (!match) return true;
          return parseInt(match[1].replace(/\./g, "")) >= salarioMin;
        });
      }
    }

    return NextResponse.json({ ofertas: filtradas, total: filtradas.length, keyword, location });
  } catch (error) {
    console.error("Error en búsqueda:", (error as Error).message);
    return NextResponse.json({ error: "Error al buscar ofertas" }, { status: 500 });
  }
}
