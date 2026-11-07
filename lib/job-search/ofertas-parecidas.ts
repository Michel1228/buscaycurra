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
 * para camarero en Madrid (232 de verdad).
 *
 * LOS RASTREADORES (7 nov 2026). Applebot, Bingbot, Googlebot y otros abren
 * unas 4.500 fichas por hora, y cada una lanzaba esta consulta. Se medían 10 a
 * la vez, de hasta 10 s cada una, y la aplicación solo tiene 10 conexiones con
 * la base: el buscador de la app esperaba turno detrás de ellas. Era porque
 * cada ficha leía del disco TODAS las ofertas de su ciudad (Madrid: 32.263
 * ofertas, 27.427 páginas, 7,6 s) aunque solo enseña cinco. Ahora:
 *   - El puesto en la ciudad va en su propia consulta, que cruza los índices
 *     de ciudad y de título y lee solo esas.
 *   - Lo de la ciudad entera (cuántas hay y las 30 últimas) solo hace falta
 *     cuando no hay ninguna del puesto, y se guarda por ciudad, no por ciudad
 *     y puesto: se calcula una vez para todas las fichas de esa ciudad.
 *   - Se guarda 6 horas en Redis (lo mismo que dura la página de puesto y
 *     ciudad), como mucho 3 cálculos a la vez y uno solo por clave: si llegan
 *     diez fichas de Madrid juntas, la ciudad se calcula una vez.
 */
import { getPool } from "@/lib/db";
import { patronesDelCv, regexDePatrones, palabraPrincipal } from "@/lib/job-search/puestos-del-cv";
import { ciudadSinAlias } from "@/lib/job-search/ciudad-busqueda";
import { get as cacheGet, set as cacheSet } from "@/lib/cache/redis-client";

const CIUDAD_SIN_TILDES = `translate(city, 'áéíóúñüÁÉÍÓÚÑÜàèìòùÀÈÌÒÙ', 'aeiounuAEIOUNUaeiouAEIOU')`;
const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** "Gijón, Asturias" → "Gijon"; "la coruna" → "coruna" (la ciudad es "A Coruña"); "cdmx" → "Ciudad de Mexico". */
export function ciudadParaBuscar(ciudad: string): string {
  return sinTildes(ciudadSinAlias(ciudad.split(",")[0].replace(/\(.*?\)/g, "").trim())).trim().replace(/^(la|las|el|los|a|l')\s+/i, "").trim();
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
  /** Si no hay del puesto, las últimas de la ciudad. Si las hay, vacío. */
  deLaCiudad: OfertaCorta[];
  deEsePuesto: number;
  /** Cuántas hay en la ciudad. Solo se calcula si no hay del puesto; si no, 0. */
  enLaCiudad: number;
  puesto: string | null;
}

const DURACION = 6 * 3600;
const A_LA_VEZ = 3;
const ESPERA_MAXIMA_MS = 8000;

// Turnos: como mucho A_LA_VEZ consultas de esto en marcha. El que termina le
// pasa su turno al primero que espera; el que espera más de 8 s se rinde (la
// ficha sale sin el recuadro, como cuando la consulta fallaba).
let enMarcha = 0;
const enEspera: Array<() => void> = [];
async function pedirTurno(): Promise<void> {
  if (enMarcha < A_LA_VEZ) { enMarcha++; return; }
  await new Promise<void>((seguir, rendirse) => {
    const entrar = () => { clearTimeout(reloj); seguir(); };
    const reloj = setTimeout(() => {
      const i = enEspera.indexOf(entrar);
      if (i >= 0) enEspera.splice(i, 1);
      rendirse(new Error("ofertas-parecidas: sin turno a tiempo"));
    }, ESPERA_MAXIMA_MS);
    enEspera.push(entrar);
  });
}
function soltarTurno(): void {
  const siguiente = enEspera.shift();
  if (siguiente) siguiente(); else enMarcha--;
}

// Lo que ya se está calculando: quien pida lo mismo espera a ese cálculo.
const calculando = new Map<string, Promise<unknown>>();
async function guardado<T>(clave: string, calcular: () => Promise<T>): Promise<T> {
  const enRedis = await cacheGet(clave).catch(() => null);
  if (enRedis) {
    try { return JSON.parse(enRedis) as T; } catch { /* se calcula otra vez */ }
  }
  const yaEnCamino = calculando.get(clave);
  if (yaEnCamino) return yaEnCamino as Promise<T>;
  const calculo = (async () => {
    await pedirTurno();
    try {
      const datos = await calcular();
      await cacheSet(clave, datos as object, DURACION).catch(() => false);
      return datos;
    } finally {
      soltarTurno();
    }
  })();
  calculando.set(clave, calculo);
  try {
    return await calculo;
  } finally {
    calculando.delete(clave);
  }
}

const VIVAS = `"isActive" AND ("expiresAt" > NOW() OR "expiresAt" IS NULL)`;

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
  const pool = getPool();

  // Las 60 más nuevas del puesto en la ciudad, y cuántas son (el recuento va
  // antes del LIMIT).
  const delPuesto = patrones.length
    ? await guardado(`parecidas:v2:puesto:${slug(c)}:${patrones.join(",")}`, async () => {
        const { rows } = await pool.query<OfertaCorta & { n: number }>(
          `SELECT id, title, company, city, salary, count(*) OVER()::int AS n
             FROM "JobListing"
            WHERE ${VIVAS} AND ${CIUDAD_SIN_TILDES} ILIKE $1 AND title ~* $2
            ORDER BY "scrapedAt" DESC LIMIT 60`,
          [`%${c}%`, regexDePatrones(patrones)]
        );
        return {
          de_ese_puesto: rows[0]?.n ?? 0,
          ofertas: rows.map(({ id, title, company, city, salary }) => ({ id, title, company, city, salary })),
        };
      })
    : { de_ese_puesto: 0, ofertas: [] as OfertaCorta[] };

  const limite = opciones.limite ?? 5;
  const fuera = (l: OfertaCorta[]) => l.filter((o) => o.id !== opciones.excluirId).slice(0, limite);
  const ofertas = fuera(delPuesto.ofertas || []);

  // La ciudad entera solo si no hay nada del puesto (es lo único para lo que
  // se usa), y guardada por ciudad.
  const deLaCiudad = ofertas.length
    ? null
    : await guardado(`parecidas:v2:ciudad:${slug(c)}`, async () => {
        const { rows } = await pool.query<{ en_ciudad: number; de_la_ciudad: OfertaCorta[] }>(
          `WITH zona AS MATERIALIZED (
             SELECT id, title, company, city, salary, "scrapedAt" FROM "JobListing"
              WHERE ${VIVAS} AND ${CIUDAD_SIN_TILDES} ILIKE $1
           )
           SELECT (SELECT count(*) FROM zona)::int AS en_ciudad,
                  (SELECT coalesce(json_agg(t), '[]'::json) FROM (
                     SELECT id, title, company, city, salary FROM zona ORDER BY "scrapedAt" DESC LIMIT 30) t) AS de_la_ciudad`,
          [`%${c}%`]
        );
        return rows[0];
      });

  return {
    ofertas,
    deLaCiudad: deLaCiudad ? fuera(deLaCiudad.de_la_ciudad || []) : [],
    deEsePuesto: Math.max(0, (delPuesto.de_ese_puesto || 0) - (opciones.excluirId ? 1 : 0)),
    enLaCiudad: deLaCiudad?.en_ciudad || 0,
    puesto,
  };
}
