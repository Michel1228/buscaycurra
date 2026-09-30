/**
 * lib/email/ofertas-para-correo.ts
 * Ofertas reales de la ciudad de la persona, para meterlas en un correo.
 *
 * POR QUÉ. El recordatorio del primer día decía "te queda un paso" y nada más:
 * de 78 personas avisadas (23-29 sep 2026), ninguna hizo su primer CV. En los
 * portales de empleo lo que funciona es enseñar el motivo para entrar —ofertas
 * concretas de tu ciudad— y un asunto con esa cifra, no uno genérico.
 */
import { getPool } from "@/lib/db";

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
}

// La misma expresión que el índice idx_joblisting_city_unaccent_trgm, para que
// la consulta lo use y "Logroño" encuentre "Logrono".
const CIUDAD_SIN_TILDES = `translate(city, 'áéíóúñüÁÉÍÓÚÑÜàèìòùÀÈÌÒÙ', 'aeiounuAEIOUNUaeiouAEIOU')`;

function sinTildes(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** null si no hay ciudad o si la base no responde: el correo sale sin ofertas. */
export async function ofertasRecientesEn(ciudad: string | null | undefined): Promise<OfertasCiudad | null> {
  const c = (ciudad || "").trim();
  if (c.length < 2) return null;
  const patron = `%${sinTildes(c)}%`;
  try {
    const pool = getPool();
    const [cuenta, ultimas] = await Promise.all([
      pool.query<{ n: string }>(
        `SELECT COUNT(*) AS n FROM "JobListing"
         WHERE "isActive" AND ${CIUDAD_SIN_TILDES} ILIKE $1 AND "createdAt" > NOW() - INTERVAL '7 days'`,
        [patron]
      ),
      pool.query<{ id: string; title: string; company: string | null }>(
        `SELECT id, title, company FROM "JobListing"
         WHERE "isActive" AND ${CIUDAD_SIN_TILDES} ILIKE $1 AND "createdAt" > NOW() - INTERVAL '7 days'
         ORDER BY "createdAt" DESC LIMIT 3`,
        [patron]
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
  } catch (e) {
    console.error("[ofertas-para-correo]", (e as Error).message);
    return null;
  }
}
