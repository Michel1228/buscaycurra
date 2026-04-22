/**
 * lib/job-search/sync-worker.ts
 * Descarga masiva de ofertas desde APIs y las guarda en la BD PostgreSQL local.
 */
import { createHash } from "crypto";
import { getPool } from "@/lib/db";

export const SECTORES = [
  { sector: "HOSTELERIA", keywords: ["camarero", "cocinero", "chef", "hosteleria", "barman", "recepcionista hotel", "ayudante cocina", "pizzero", "panadero"] },
  { sector: "INDUSTRIA", keywords: ["operario", "produccion", "manufactura", "soldador", "electromecanico", "mecanico industrial", "tornero", "caldereria", "operario almacen"] },
  { sector: "OFICINA", keywords: ["administrativo", "contable", "secretaria", "recursos humanos", "recepcionista", "atencion al cliente", "facturacion", "gestion administrativa"] },
  { sector: "COMERCIO", keywords: ["dependiente", "vendedor", "cajero", "comercial", "ventas", "reponedor", "promotor", "agente comercial", "asesor comercial"] },
  { sector: "SALUD", keywords: ["enfermero", "auxiliar enfermeria", "medico", "farmaceutico", "fisioterapeuta", "cuidador", "auxiliar clinica", "tecnico sanitario"] },
  { sector: "EDUCACION", keywords: ["profesor", "maestro", "educador", "monitor", "tutor", "educador social", "auxiliar educacion", "formador"] },
  { sector: "TECNOLOGIA", keywords: ["programador", "desarrollador", "software", "frontend", "backend", "data scientist", "devops", "informatica", "sistemas"] },
  { sector: "CONSTRUCCION", keywords: ["albanil", "electricista", "fontanero", "pintor", "carpintero", "construccion", "peon", "reformas", "instalador"] },
  { sector: "TRANSPORTE", keywords: ["conductor", "repartidor", "logistica", "carretillero", "mensajero", "transportista", "mozo almacen", "picking", "chofer"] },
  { sector: "OTRO", keywords: ["limpieza", "vigilante", "seguridad", "jardinero", "peluquero", "estetica", "cuidador personas mayores", "auxiliar servicios"] },
] as const;

export const CIUDADES = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza",
  "Malaga", "Murcia", "Bilbao", "Alicante", "Cordoba",
  "Valladolid", "Vigo", "Gijon", "Granada", "La Coruna",
  "Vitoria", "Pamplona", "Santander", "Logrono", "Burgos",
  "Leon", "Oviedo", "Almeria", "Huelva", "Badajoz",
  "Toledo", "Albacete", "Jaen", "Tarragona", "Lleida",
  "Girona", "Castellon", "Salamanca", "Segovia", "Tudela",
  "Calahorra", "Huesca", "Teruel", "Cadiz", "Jerez",
  "Las Palmas", "Santa Cruz de Tenerife", "Palma", "San Sebastian",
  "Elche", "Cartagena", "Getafe", "Mostoles", "Alcala de Henares",
];

type JobSector = "HOSTELERIA" | "INDUSTRIA" | "OFICINA" | "COMERCIO" | "SALUD" | "EDUCACION" | "TECNOLOGIA" | "CONSTRUCCION" | "TRANSPORTE" | "OTRO";

function makeId(source: string, url: string): string {
  return createHash("md5").update(source + "|" + url).digest("hex").slice(0, 24);
}

interface RawJob {
  source: string;
  url: string;
  title: string;
  company: string;
  city: string;
  description: string;
  salary: string;
}

async function fetchJooble(keyword: string, city: string, page = 1): Promise<RawJob[]> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: keyword, location: city + ", Spain", page, resultonpage: 20 }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((j: Record<string, string>) => ({
      source: "Jooble",
      url: j.link || "",
      title: (j.title || keyword).replace(/<[^>]+>/g, "").slice(0, 200),
      company: (j.company || "Ver en oferta").slice(0, 200),
      city,
      description: (j.snippet || "").replace(/<[^>]+>/g, "").slice(0, 1000),
      salary: (j.salary || "Ver en oferta").slice(0, 100),
    }));
  } catch { return []; }
}

async function fetchAdzuna(keyword: string, city: string, page = 1): Promise<RawJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !apiKey) return [];
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/es/search/${page}?app_id=${appId}&app_key=${apiKey}&results_per_page=50&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(city)}&content-type=application/json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((j: Record<string, unknown>) => {
      const company = j.company as Record<string, string> | undefined;
      const location = j.location as Record<string, unknown> | undefined;
      const salMin = j.salary_min ? Math.round(j.salary_min as number) : 0;
      const salMax = j.salary_max ? Math.round(j.salary_max as number) : 0;
      return {
        source: "Adzuna",
        url: (j.redirect_url as string) || "",
        title: ((j.title as string) || keyword).replace(/<[^>]+>/g, "").slice(0, 200),
        company: (company?.display_name || "Ver en oferta").slice(0, 200),
        city: ((location?.display_name as string) || city).slice(0, 100),
        description: ((j.description as string) || "").replace(/<[^>]+>/g, "").slice(0, 1000),
        salary: salMin && salMax ? `${salMin}€ - ${salMax}€/año` : "Ver en oferta",
      };
    });
  } catch { return []; }
}

async function fetchCareerjet(keyword: string, city: string, page = 1): Promise<RawJob[]> {
  const apiKey = process.env.CAREERJET_API_KEY;
  if (!apiKey) return [];
  try {
    const url = `http://public.api.careerjet.net/search?locale_code=es_ES&keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(city + " Espana")}&affid=${apiKey}&user_ip=187.124.37.183&user_agent=BuscayCurra%2F1.0&pagesize=20&page=${page}&sort=relevance`;
    const res = await fetch(url, {
      headers: { "Referer": "https://buscaycurra.es" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.type === "ERROR") return [];
    return (data.jobs || []).map((j: Record<string, string>) => ({
      source: "Careerjet",
      url: j.url || "",
      title: (j.title || keyword).replace(/<[^>]+>/g, "").slice(0, 200),
      company: (j.company || "Ver en oferta").slice(0, 200),
      city: (j.locations || city).slice(0, 100),
      description: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 1000),
      salary: (j.salary || "Ver en oferta").slice(0, 100),
    }));
  } catch { return []; }
}

async function upsertJobs(jobs: RawJob[], sector: JobSector): Promise<number> {
  if (!jobs.length) return 0;
  const pool = getPool();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  let inserted = 0;
  for (const j of jobs) {
    if (!j.url || !j.title) continue;
    const id = makeId(j.source, j.url);
    try {
      const result = await pool.query(
        `INSERT INTO "JobListing" (id, title, company, description, sector, city, salary, "sourceUrl", "sourceName", "isActive", "scrapedAt", "createdAt", "expiresAt")
         VALUES ($1, $2, $3, $4, $5::"JobSector", $6, $7, $8, $9, true, NOW(), NOW(), $10)
         ON CONFLICT (id) DO NOTHING`,
        [id, j.title, j.company, j.description, sector, j.city, j.salary, j.url, j.source, expiresAt]
      );
      if (result.rowCount && result.rowCount > 0) inserted++;
    } catch { /* skip */ }
  }
  return inserted;
}

export async function syncBatch(params: {
  source: "jooble" | "adzuna" | "careerjet";
  sector: JobSector;
  keyword: string;
  city: string;
  page?: number;
}): Promise<{ inserted: number; fetched: number }> {
  const { source, sector, keyword, city, page = 1 } = params;
  let raw: RawJob[] = [];
  if (source === "jooble") raw = await fetchJooble(keyword, city, page);
  if (source === "adzuna") raw = await fetchAdzuna(keyword, city, page);
  if (source === "careerjet") raw = await fetchCareerjet(keyword, city, page);
  const inserted = await upsertJobs(raw, sector);
  return { inserted, fetched: raw.length };
}

export async function getJobStats(): Promise<Record<string, number>> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT "sourceName", COUNT(*) as count FROM "JobListing" WHERE "isActive" = true GROUP BY "sourceName" ORDER BY count DESC`
  );
  const stats: Record<string, number> = {};
  for (const row of res.rows) stats[row.sourcename] = parseInt(row.count);
  stats.total = Object.values(stats).reduce((a, b) => a + b, 0);
  return stats;
}
