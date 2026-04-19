/**
 * lib/job-scraper.ts — Búsqueda de ofertas via Adzuna API
 *
 * Adzuna es una API de empleo real con cobertura en España.
 * Credenciales en variables de entorno: ADZUNA_APP_ID, ADZUNA_APP_KEY
 */

import type { OfertaTrabajo } from "./cache/job-cache";

const ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs/es/search/1";

interface AdzunaResult {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  created: string;
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
}

interface AdzunaResponse {
  results: AdzunaResult[];
}

export async function buscarOfertas(
  keyword: string,
  location: string
): Promise<OfertaTrabajo[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.error("❌ ADZUNA_APP_ID o ADZUNA_APP_KEY no configuradas");
    return [];
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "20",
    "content-type": "application/json",
  });

  if (keyword.trim()) params.set("what", keyword.trim());
  if (location.trim()) params.set("where", location.trim());

  console.log(`🔍 Adzuna: buscando "${keyword}" en "${location}"`);

  const res = await fetch(`${ADZUNA_BASE}?${params.toString()}`);

  if (!res.ok) {
    const texto = await res.text();
    console.error(`❌ Adzuna error ${res.status}: ${texto.slice(0, 200)}`);
    return [];
  }

  const datos = await res.json() as AdzunaResponse;
  const resultados = datos.results ?? [];

  console.log(`✅ Adzuna: ${resultados.length} ofertas encontradas`);

  return resultados.map((r): OfertaTrabajo => {
    let salario: string | undefined;
    if (r.salary_min && r.salary_max) {
      salario = `${Math.round(r.salary_min).toLocaleString("es-ES")}€ - ${Math.round(r.salary_max).toLocaleString("es-ES")}€/año`;
    } else if (r.salary_min) {
      salario = `Desde ${Math.round(r.salary_min).toLocaleString("es-ES")}€/año`;
    }

    let modalidad: OfertaTrabajo["modalidad"];
    if (r.contract_time === "part_time") modalidad = "presencial";
    else if (r.contract_time === "full_time") modalidad = "presencial";

    return {
      id: r.id,
      titulo: r.title,
      empresa: r.company?.display_name ?? "Empresa",
      ubicacion: r.location?.display_name ?? location,
      descripcion: r.description,
      url: r.redirect_url,
      fechaPublicacion: r.created ? r.created.split("T")[0] : undefined,
      salario,
      modalidad,
    };
  });
}
