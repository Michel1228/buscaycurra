/**
 * lib/email/ofertas-para-correo.ts
 * Ofertas reales del sitio donde busca la persona, para meterlas en un correo.
 *
 * POR QUÉ. El recordatorio del primer día decía "te queda un paso" y nada más:
 * de 78 personas avisadas (23-29 sep 2026), ninguna hizo su primer CV. En los
 * portales de empleo lo que funciona es enseñar el motivo para entrar —ofertas
 * concretas de tu ciudad— y un asunto con esa cifra, no uno genérico.
 *
 * LA GENTE ESCRIBE SU CIUDAD COMO QUIERE. Visto en los registros del 23-29 sep:
 * "Tudela navarra" (con el texto entero no sale nada), "Portugal" (que dentro
 * de la ciudad encontraba Portugalete, en Vizcaya), "España" o "Colombia". Por
 * eso: si es un país de los nuestros se busca por país; si no, la ciudad tal
 * cual, y si no da nada, sin la provincia o la región del final.
 */
import { getPool } from "@/lib/db";
import { LISTA_PAISES } from "@/lib/paises";

export interface OfertaCorreo {
  titulo: string;
  empresa: string;
  url: string;
}

export interface OfertasCiudad {
  /** Ofertas nuevas en los últimos 7 días. */
  total: number;
  /** Las tres más recientes. */
  ofertas: OfertaCorreo[];
  /** Cómo nombrar el sitio en el correo: "Tudela" aunque escribiera "Tudela navarra". */
  lugar: string;
  /** true si escribió un país: se buscó por país, no por ciudad. */
  esPais: boolean;
}

// La misma expresión que el índice idx_joblisting_city_unaccent_trgm, para que
// la consulta lo use y "Logroño" encuentre "Logrono".
const CIUDAD_SIN_TILDES = `translate(city, 'áéíóúñüÁÉÍÓÚÑÜàèìòùÀÈÌÒÙ', 'aeiounuAEIOUNUaeiouAEIOU')`;

// Provincias y regiones que la gente añade detrás de la ciudad.
const REGIONES = new Set([
  "espana", "spain", "navarra", "aragon", "la rioja", "rioja", "andalucia", "cataluna", "catalunya",
  "galicia", "asturias", "cantabria", "murcia", "valencia", "comunidad valenciana", "madrid",
  "comunidad de madrid", "extremadura", "castilla", "castilla y leon", "castilla la mancha",
  "castilla-la mancha", "leon", "pais vasco", "euskadi", "canarias", "baleares", "islas baleares",
  "zaragoza", "huesca", "teruel", "vizcaya", "bizkaia", "guipuzcoa", "gipuzkoa", "alava", "araba",
]);

function sinTildes(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normal(s: string): string {
  return sinTildes(s).toLowerCase().replace(/\s+/g, " ").trim();
}

function capitalizar(s: string): string {
  return s.replace(/(^|\s)(\p{L})/gu, (_, e: string, l: string) => e + l.toUpperCase());
}

/**
 * "Tudela navarra" → ["Tudela navarra", "Tudela"]; "Pamplona, Navarra" → [..., "Pamplona"].
 * Lo de detrás solo se quita si es una provincia o región española conocida:
 * "Santo domingo, república dominicana" sin la coma encontraba ofertas de
 * Santo Domingo de la Calzada, en La Rioja (30 sep 2026).
 */
export function candidatos(texto: string): string[] {
  const lista = [texto];
  const [primera, ...resto] = texto.split(",");
  const antesDeComa = primera.trim();
  const trasComa = normal(resto.join(","));
  if (resto.length && REGIONES.has(trasComa)) lista.push(antesDeComa);
  const palabras = (resto.length && !REGIONES.has(trasComa) ? texto : antesDeComa).split(/\s+/);
  for (let i = palabras.length - 1; i >= 1; i--) {
    const cola = normal(palabras.slice(i).join(" "));
    if (REGIONES.has(cola)) lista.push(palabras.slice(0, i).join(" "));
  }
  return [...new Set(lista.filter((c) => c.length >= 2))];
}

async function consultar(filtro: string, valor: string): Promise<{ total: number; ofertas: OfertaCorreo[] }> {
  const pool = getPool();
  const [cuenta, ultimas] = await Promise.all([
    pool.query<{ n: string }>(
      `SELECT COUNT(*) AS n FROM "JobListing" WHERE "isActive" AND ${filtro} AND "createdAt" > NOW() - INTERVAL '7 days'`,
      [valor]
    ),
    pool.query<{ id: string; title: string; company: string | null }>(
      `SELECT id, title, company FROM "JobListing" WHERE "isActive" AND ${filtro} AND "createdAt" > NOW() - INTERVAL '7 days'
       ORDER BY "createdAt" DESC LIMIT 3`,
      [valor]
    ),
  ]);
  return {
    total: parseInt(cuenta.rows[0]?.n || "0", 10),
    ofertas: ultimas.rows.map((r) => ({
      titulo: r.title,
      empresa: r.company && !/^ver en oferta$/i.test(r.company) ? r.company : "",
      url: `https://buscaycurra.es/app/ofertas/${encodeURIComponent(r.id)}`,
    })),
  };
}

/** null si no hay ciudad o si la base no responde: el correo sale sin ofertas. */
export async function ofertasRecientesEn(ciudad: string | null | undefined): Promise<OfertasCiudad | null> {
  const texto = (ciudad || "").trim();
  if (texto.length < 2) return null;
  try {
    const pais = LISTA_PAISES.find((p) => normal(p.nombre) === normal(texto) || normal(p.nombreLocal) === normal(texto));
    if (pais) {
      // Índice idx_joblisting_country_lower_vivas.
      const r = await consultar(`LOWER(country) = $1`, pais.codigo.toLowerCase());
      return { ...r, lugar: pais.nombre, esPais: true };
    }
    const opciones = candidatos(texto);
    for (const c of opciones) {
      const r = await consultar(`${CIUDAD_SIN_TILDES} ILIKE $1`, `%${sinTildes(c)}%`);
      if (r.total > 0) return { ...r, lugar: capitalizar(c), esPais: false };
    }
    return { total: 0, ofertas: [], lugar: capitalizar(opciones[opciones.length - 1]), esPais: false };
  } catch (e) {
    console.error("[ofertas-para-correo]", (e as Error).message);
    return null;
  }
}
