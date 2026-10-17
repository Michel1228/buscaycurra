/**
 * lib/cursos/para-esa-persona.ts — Plazas y ofertas para una persona concreta.
 *
 * Lo comparten el aviso de cursos según el CV (app/api/cursos/sugerencias-cv)
 * y Guzzi cuando le preguntan qué curso le conviene (lib/guzzi/siguiente-paso):
 * los dos tienen que ofrecer las mismas plazas y dar los mismos números.
 */
import { getPool } from "@/lib/db";
import type { PlazaPublica } from "@/lib/cursos/plazas/db";

const escaparRegex = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Provincias que cubre cada servicio de empleo cuyas plazas leemos (códigos INE). */
export const PROVINCIAS_DE_FUENTE: Record<string, string[]> = {
  lanbide: ["01", "20", "48"],
  "sef-murcia": ["30"],
  soc: ["08", "17", "25", "43"],
  consorci: ["08", "17", "25", "43"],
  ecyl: ["05", "09", "24", "34", "37", "40", "42", "47", "49"],
  navarra: ["31"],
};

/** Que la plaza sea para esa persona y le dé tiempo a apuntarse. */
export function plazaParaEsaPersona(p: PlazaPublica, provincia: string): boolean {
  if (p.dirigido === "ocupados") return false;
  const enTresDias = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  if (p.inicio < enTresDias) return false;
  if (p.modalidad === "online") return (PROVINCIAS_DE_FUENTE[p.fuente] ?? []).includes(provincia);
  return p.provincia === provincia;
}

/**
 * Otros nombres con los que llega la provincia en las ofertas. La columna
 * province casi siempre está vacía y la ciudad viene como "Bilbao, Vizcaya":
 * buscando "Bizkaia" se perdían 899 ofertas de Bilbao (17 oct 2026).
 */
const OTROS_NOMBRES: Record<string, string[]> = {
  Bizkaia: ["Vizcaya"],
  Gipuzkoa: ["Guipúzcoa", "Guipuzcoa"],
  "Álava": ["Araba"],
  "A Coruña": ["La Coruña"],
  Ourense: ["Orense"],
  Girona: ["Gerona"],
  Lleida: ["Lérida", "Lerida"],
  "Illes Balears": ["Baleares", "Balears"],
  "Castellón": ["Castelló"],
  Alicante: ["Alacant"],
  Valencia: ["València"],
};

/** La provincia con sus otros nombres y sin tildes ("Málaga" y "Malaga"). */
export function nombresDeLaZona(zona: string): string[] {
  const sinTildes = zona.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return [...new Set([zona, sinTildes, ...(OTROS_NOMBRES[zona] ?? [])])];
}

/** Lo que tienen que cumplir las ofertas: vivas, en esa provincia y de esos puestos. */
function filtroOfertas(puestos: string[], zona: string): { where: string; params: (string | string[])[] } {
  const ps = puestos.slice(0, 8);
  const ors = ps.map((_, i) => `title ~* $${i + 2}`).join(" OR ");
  return {
    where: `"isActive" = true AND ("expiresAt" > NOW() OR "expiresAt" IS NULL)
        AND lower(country) = 'es' AND (city ILIKE ANY($1::text[]) OR province ILIKE ANY($1::text[])) AND (${ors})`,
    params: [nombresDeLaZona(zona).map((n) => `%${n}%`), ...ps.map((p) => `\\m${escaparRegex(p)}`)],
  };
}

/** Ofertas vivas en esa provincia de los puestos que piden el curso. */
export async function ofertasEnZona(puestos: string[], zona: string): Promise<number> {
  if (!puestos.length) return 0;
  const { where, params } = filtroOfertas(puestos, zona);
  const { rows } = await getPool().query<{ n: number }>(
    `SELECT count(*)::int AS n FROM "JobListing" WHERE ${where}`,
    params
  );
  return rows[0]?.n ?? 0;
}

export interface OfertaDeEjemplo {
  id: string;
  title: string;
  company: string | null;
  city: string | null;
  province: string | null;
  salary: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
}

/**
 * Unas pocas de las ofertas que cuenta ofertasEnZona, las más recientes, y
 * primero las de los puestos `primero` (los que el curso le abre de nuevo).
 */
export async function ofertasDeEjemplo(puestos: string[], zona: string, primero: string[], limite = 3): Promise<OfertaDeEjemplo[]> {
  if (!puestos.length) return [];
  const { where, params } = filtroOfertas(puestos, zona);
  const prioridad = primero.length
    ? `(title ~* $${params.length + 1})`
    : "false";
  const extra = primero.length ? [`\\m(${primero.slice(0, 8).map(escaparRegex).join("|")})`] : [];
  const { rows } = await getPool().query<OfertaDeEjemplo & { prioridad: boolean }>(
    `SELECT * FROM (
       SELECT DISTINCT ON (lower(title), lower(coalesce(company, '')))
              id, title, company, city, province, salary, "sourceName", "sourceUrl", "scrapedAt", ${prioridad} AS prioridad
         FROM "JobListing" WHERE ${where}
        ORDER BY lower(title), lower(coalesce(company, '')), "scrapedAt" DESC
     ) t
     ORDER BY prioridad DESC, "scrapedAt" DESC
     LIMIT ${Math.min(Math.max(limite, 1), 10)}`,
    [...params, ...extra]
  );
  return rows;
}
