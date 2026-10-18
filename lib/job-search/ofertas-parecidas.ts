/**
 * lib/job-search/ofertas-parecidas.ts — Ofertas de lo mismo en la misma ciudad.
 *
 * Para la ficha pública de oferta (/empleo/oferta/[id]) y las páginas
 * /empleo/[puesto]/[ciudad] (18 oct 2026). Casi todas las visitas de Google
 * entran por una ficha de oferta (Search Console, 3 meses: 1.000 páginas
 * distintas), y a quien buscaba "empleo Gijón" no se le enseñaba ninguna más.
 *
 * La ciudad primero y sin tildes (usa el índice idx_joblisting_city_unaccent_trgm,
 * por eso el translate() es idéntico al del índice), y solo sobre esas el puesto
 * en el título. Antes /empleo/[puesto]/[ciudad] buscaba en la descripción de 3
 * millones de ofertas: tardaba tanto que la página decía "0 ofertas" incluso
 * para camarero en Madrid (232 de verdad). Se guarda una hora en Redis.
 */
import { getPool } from "@/lib/db";
import { patronesDelCv, regexDePatrones, palabraPrincipal } from "@/lib/job-search/puestos-del-cv";
import { get as cacheGet, set as cacheSet } from "@/lib/cache/redis-client";

const CIUDAD_SIN_TILDES = `translate(city, 'áéíóúñüÁÉÍÓÚÑÜàèìòùÀÈÌÒÙ', 'aeiounuAEIOUNUaeiouAEIOU')`;
const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** "Gijón, Asturias" → "Gijon"; "la coruna" → "coruna" (la ciudad es "A Coruña"). */
export function ciudadParaBuscar(ciudad: string): string {
  return sinTildes(ciudad.split(",")[0].replace(/\(.*?\)/g, "")).trim().replace(/^(la|las|el|los|a|l')\s+/i, "").trim();
}

/** "Gijón" → "gijon", "dependiente" → "dependiente" (para /empleo/[puesto]/[ciudad]). */
export function slug(t: string): string {
  return sinTildes(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export interface OfertaCorta {
  id: string;
  title: string;
  company: string | null;
  city: string | null;
  salary: string | null;
}

export interface Parecidas {
  /** Las del mismo puesto en la ciudad (sin la de la ficha). */
  ofertas: OfertaCorta[];
  /** Si no hay del puesto, las últimas de la ciudad. */
  deLaCiudad: OfertaCorta[];
  deEsePuesto: number;
  enLaCiudad: number;
  puesto: string | null;
}

export async function ofertasParecidas(
  puestoOTitulo: string,
  ciudad: string | null | undefined,
  opciones: { excluirId?: string; limite?: number } = {}
): Promise<Parecidas | null> {
  if (!ciudad) return null;
  const c = ciudadParaBuscar(ciudad);
  if (c.length < 3) return null;
  const puesto = palabraPrincipal(puestoOTitulo);
  const patrones = puesto ? patronesDelCv({ subtitulo: puesto }) : [];
  const clave = `parecidas:v1:${slug(c)}:${patrones.join(",")}`;

  let datos: { en_ciudad: number; de_ese_puesto: number; ofertas: OfertaCorta[]; de_la_ciudad: OfertaCorta[] } | null = null;
  const guardado = await cacheGet(clave).catch(() => null);
  if (guardado) {
    try { datos = JSON.parse(guardado); } catch { datos = null; }
  }
  if (!datos) {
    const { rows } = await getPool().query(
      `WITH zona AS MATERIALIZED (
         SELECT id, title, company, city, salary, "scrapedAt" FROM "JobListing"
          WHERE "isActive" AND ("expiresAt" > NOW() OR "expiresAt" IS NULL) AND ${CIUDAD_SIN_TILDES} ILIKE $1
       )
       SELECT (SELECT count(*) FROM zona)::int AS en_ciudad,
              (SELECT count(*) FROM zona WHERE $2::text IS NOT NULL AND title ~* $2)::int AS de_ese_puesto,
              (SELECT coalesce(json_agg(t), '[]'::json) FROM (
                 SELECT id, title, company, city, salary FROM zona
                  WHERE $2::text IS NOT NULL AND title ~* $2 ORDER BY "scrapedAt" DESC LIMIT 60) t) AS ofertas,
              (SELECT coalesce(json_agg(t), '[]'::json) FROM (
                 SELECT id, title, company, city, salary FROM zona ORDER BY "scrapedAt" DESC LIMIT 30) t) AS de_la_ciudad`,
      [`%${c}%`, patrones.length ? regexDePatrones(patrones) : null]
    );
    datos = rows[0];
    await cacheSet(clave, datos as object, 3600).catch(() => false);
  }

  const limite = opciones.limite ?? 5;
  const fuera = (l: OfertaCorta[]) => l.filter((o) => o.id !== opciones.excluirId).slice(0, limite);
  return {
    ofertas: fuera(datos!.ofertas || []),
    deLaCiudad: fuera(datos!.de_la_ciudad || []),
    deEsePuesto: Math.max(0, (datos!.de_ese_puesto || 0) - (opciones.excluirId ? 1 : 0)),
    enLaCiudad: datos!.en_ciudad || 0,
    puesto,
  };
}
