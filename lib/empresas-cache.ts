/**
 * lib/empresas-cache.ts — Caché en BD de las empresas extraídas de Google Places.
 *
 * Por qué existe: cada búsqueda repetida era una llamada de PAGO a Places
 * (Place Details ≈ 17 $/1000) y además se tiraba todo el trabajo de extracción
 * (scraping del email real, verificación MX...). Ahora cada empresa se guarda y
 * las siguientes búsquedas salen gratis e instantáneas.
 *
 * Se guarda por `place_id` (identificador estable de Google), así una misma
 * empresa buscada de tres formas distintas no se duplica.
 */
import { getPool } from "@/lib/db";
import type { EmpresaCompleta, EmailConfianza } from "@/lib/empresa-datos";

/** Días tras los que se vuelve a preguntar a Google (web y email cambian poco). */
const FRESCURA_DIAS = 30;

/** Minúsculas y sin acentos, para que "Málaga" y "malaga" casen. */
export function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

interface FilaEmpresa {
  place_id: string;
  nombre: string;
  dominio: string | null;
  url_web: string | null;
  email_rrhh: string | null;
  email_confianza: EmailConfianza | null;
  emails_extraidos: string[] | null;
  telefono: string | null;
  pagina_empleo: string | null;
  sector: string | null;
  direccion: string | null;
  ciudad: string | null;
  google_rating: number | null;
  google_reviews: number | null;
  google_maps_url: string | null;
  fotos: string[] | null;
  horario: string[] | null;
}

function filaAEmpresa(f: FilaEmpresa): EmpresaCompleta {
  return {
    placeId: f.place_id,
    nombre: f.nombre,
    dominio: f.dominio,
    urlWeb: f.url_web,
    emailRrhh: f.email_rrhh,
    emailContacto: (f.emails_extraidos || []).find((e) => e.startsWith("info@") || e.startsWith("contacto@")) || null,
    emailsExtraidos: f.emails_extraidos || [],
    emailConfianza: f.email_confianza || "baja",
    telefono: f.telefono,
    paginaEmpleo: f.pagina_empleo,
    descripcion: null,
    sector: f.sector,
    linkedin: null,
    twitter: null,
    instagram: null,
    fuente: "cache",
    fotos: f.fotos || [],
    // El horario se cachea, pero "abierto ahora" NO: cambia cada hora y sería mentir.
    abiertoAhora: null,
    horario: f.horario,
    googleRating: f.google_rating,
    googleReviews: f.google_reviews,
    googleAddress: f.direccion,
    googleMapsUrl: f.google_maps_url,
  };
}

const COLUMNAS = `place_id, nombre, dominio, url_web, email_rrhh, email_confianza,
  emails_extraidos, telefono, pagina_empleo, sector, direccion, ciudad,
  google_rating, google_reviews, google_maps_url, fotos, horario`;

/** Busca por nombre (y ciudad si se da). Solo devuelve entradas frescas. */
export async function buscarEnCachePorNombre(
  nombre: string,
  ciudad?: string
): Promise<EmpresaCompleta[]> {
  try {
    const pool = getPool();
    const params: string[] = [`%${normalizarTexto(nombre)}%`];
    let sql = `SELECT ${COLUMNAS} FROM empresas
               WHERE nombre_norm LIKE $1
                 AND actualizado_at > now() - interval '${FRESCURA_DIAS} days'`;
    if (ciudad) {
      params.push(`%${normalizarTexto(ciudad)}%`);
      sql += ` AND ciudad_norm LIKE $2`;
    }
    sql += ` ORDER BY CASE email_confianza WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END,
                      google_rating DESC NULLS LAST
             LIMIT 10`;
    const { rows } = await pool.query<FilaEmpresa>(sql, params);
    return rows.map(filaAEmpresa);
  } catch (e) {
    console.warn("[empresas-cache] Error al leer:", (e as Error).message);
    return [];
  }
}

/** Empresas ya conocidas de una ciudad (+ sector opcional). Alimenta el envío en lote. */
export async function buscarEnCachePorZona(
  ciudad: string,
  sector?: string,
  limite = 60
): Promise<EmpresaCompleta[]> {
  try {
    const pool = getPool();
    const params: (string | number)[] = [`%${normalizarTexto(ciudad)}%`];
    let sql = `SELECT ${COLUMNAS} FROM empresas
               WHERE ciudad_norm LIKE $1
                 AND actualizado_at > now() - interval '${FRESCURA_DIAS} days'`;
    if (sector) {
      params.push(`%${sector}%`);
      sql += ` AND sector ILIKE $${params.length}`;
    }
    params.push(Math.min(limite, 200));
    sql += ` ORDER BY CASE email_confianza WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END,
                      google_rating DESC NULLS LAST
             LIMIT $${params.length}`;
    const { rows } = await pool.query<FilaEmpresa>(sql, params);
    return rows.map(filaAEmpresa);
  } catch (e) {
    console.warn("[empresas-cache] Error al leer zona:", (e as Error).message);
    return [];
  }
}

/**
 * Guarda o refresca empresas. Nunca lanza: si la caché falla, la búsqueda debe
 * seguir funcionando igual (solo perdemos el ahorro).
 */
export async function guardarEnCache(empresas: EmpresaCompleta[], ciudad?: string): Promise<void> {
  if (!empresas.length) return;
  try {
    const pool = getPool();
    for (const e of empresas) {
      if (!e.placeId) continue;
      // La ciudad del texto de búsqueda es más fiable que intentar sacarla de
      // la dirección formateada, que varía mucho de país a país.
      const ciudadFinal = ciudad || null;
      await pool.query(
        `INSERT INTO empresas (
           place_id, nombre, nombre_norm, dominio, url_web, email_rrhh, email_confianza,
           emails_extraidos, telefono, pagina_empleo, sector, direccion, ciudad, ciudad_norm,
           google_rating, google_reviews, google_maps_url, fotos, horario, actualizado_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19, now())
         ON CONFLICT (place_id) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           nombre_norm = EXCLUDED.nombre_norm,
           dominio = EXCLUDED.dominio,
           url_web = EXCLUDED.url_web,
           -- No pisar un email verificado con uno peor de una búsqueda posterior.
           email_rrhh = CASE WHEN EXCLUDED.email_confianza = 'alta' OR empresas.email_confianza <> 'alta'
                             THEN EXCLUDED.email_rrhh ELSE empresas.email_rrhh END,
           email_confianza = CASE WHEN EXCLUDED.email_confianza = 'alta' OR empresas.email_confianza <> 'alta'
                             THEN EXCLUDED.email_confianza ELSE empresas.email_confianza END,
           emails_extraidos = EXCLUDED.emails_extraidos,
           telefono = EXCLUDED.telefono,
           pagina_empleo = EXCLUDED.pagina_empleo,
           sector = COALESCE(EXCLUDED.sector, empresas.sector),
           direccion = EXCLUDED.direccion,
           ciudad = COALESCE(EXCLUDED.ciudad, empresas.ciudad),
           ciudad_norm = COALESCE(EXCLUDED.ciudad_norm, empresas.ciudad_norm),
           google_rating = EXCLUDED.google_rating,
           google_reviews = EXCLUDED.google_reviews,
           google_maps_url = EXCLUDED.google_maps_url,
           fotos = EXCLUDED.fotos,
           horario = EXCLUDED.horario,
           actualizado_at = now()`,
        [
          e.placeId, e.nombre, normalizarTexto(e.nombre), e.dominio, e.urlWeb,
          e.emailRrhh, e.emailConfianza, e.emailsExtraidos, e.telefono, e.paginaEmpleo,
          e.sector, e.googleAddress, ciudadFinal, ciudadFinal ? normalizarTexto(ciudadFinal) : null,
          e.googleRating, e.googleReviews, e.googleMapsUrl, e.fotos, e.horario,
        ]
      );
    }
  } catch (e) {
    console.warn("[empresas-cache] Error al guardar:", (e as Error).message);
  }
}
