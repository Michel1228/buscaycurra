/**
 * /sitemap-ofertas.xml — Las ofertas de trabajo, para que Google las vea.
 *
 * EL AGUJERO QUE TAPA. El sitemap de producción tenía 181 URLs: las páginas de
 * país, las de curso y cuatro estáticas. Ni una sola oferta de trabajo, de los
 * 2,2 millones que hay en la base. Y las páginas de oferta SÍ son públicas y
 * están bien hechas — /empleo/oferta/[id] devuelve 200, con JSON-LD de
 * JobPosting, canonical y meta description. Estaban ahí, indexables, y no se
 * las estábamos enseñando a nadie.
 *
 * Existía un app/sitemap.xml/route.ts escrito precisamente para esto, con
 * paginación de 50.000 en 50.000. Nunca llegó a servir: en Next.js el fichero
 * app/sitemap.ts se queda con la ruta /sitemap.xml y eclipsa al route handler.
 * Alguien hizo el trabajo y el resultado no salió jamás por la puerta.
 *
 * POR QUÉ UN FICHERO NUEVO Y NO ARREGLAR AQUEL. Porque tocar /sitemap.xml es
 * tocar lo que Google ya tiene rastreado. Esto es aditivo: /sitemap.xml sigue
 * exactamente igual y este se añade aparte en el robots.txt. Si sale mal, se
 * quita una línea del robots y no se ha roto nada.
 *
 * POR QUÉ SOLO ESPAÑA, Y NO LOS 2,2 MILLONES. Tres razones, por orden:
 *
 *   1. Es el mercado de la aplicación. El tráfico que sirve de algo es el de
 *      quien busca "camarero Madrid", no el de quien busca "warehouse Ohio".
 *   2. Mandarle a Google dos millones de páginas de golpe, desde un dominio
 *      con treinta y cinco usuarios, se parece mucho a lo que hace el spam. Y
 *      las ofertas caducan: una avalancha de páginas muertas hace daño.
 *   3. El servidor tiene dos núcleos y un 85 % de CPU robada. Treinta mil URLs
 *      las sirve; dos millones lo tumban.
 *
 * Si esto funciona, se amplía a Alemania, Francia e Italia, que es a donde
 * emigra nuestra gente. No al revés.
 */

import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://buscaycurra.es";

/** Google admite 50.000 por fichero. Nos quedamos lejos, por el servidor. */
const POR_PAGINA = 25000;

/** Mercado que se publica. Ampliar SOLO después de ver que funciona. */
const PAIS = "es";

function xml(cuerpo: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${cuerpo}`, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Una hora. Google no lo pide a menudo y cada consulta cuesta cara aquí.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export async function GET(req: Request) {
  const pagina = new URL(req.url).searchParams.get("page");
  const pool = getPool();

  try {
    // ── Índice: cuántos hijos hacen falta ──────────────────────────────────
    if (pagina === null) {
      const { rows } = await pool.query(
        `SELECT count(*)::int AS total
           FROM "JobListing"
          WHERE "isActive" = true AND lower(country) = $1`,
        [PAIS]
      );
      const total = rows[0]?.total ?? 0;
      const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

      const hijos = Array.from({ length: paginas }, (_, i) =>
        `  <sitemap>\n    <loc>${BASE_URL}/sitemap-ofertas.xml?page=${i}</loc>\n` +
        `    <lastmod>${new Date().toISOString()}</lastmod>\n  </sitemap>`
      ).join("\n");

      return xml(
        `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${hijos}\n</sitemapindex>`
      );
    }

    // ── Un hijo con sus URLs ───────────────────────────────────────────────
    const n = parseInt(pagina, 10);
    if (!Number.isFinite(n) || n < 0) {
      return new Response("Página no válida", { status: 400 });
    }

    // NULLS LAST importa: hay 237.000 ofertas sin createdAt por el INSERT roto
    // del extractor alemán, y sin esto encabezarían la lista las más rotas.
    const { rows } = await pool.query(
      `SELECT id, "createdAt", "updatedAt"
         FROM "JobListing"
        WHERE "isActive" = true AND lower(country) = $1
        ORDER BY "createdAt" DESC NULLS LAST
        LIMIT $2 OFFSET $3`,
      [PAIS, POR_PAGINA, n * POR_PAGINA]
    );

    const urls = rows
      .map(r => {
        const fecha = r.createdAt || r.updatedAt || new Date();
        return (
          `  <url>\n    <loc>${BASE_URL}/empleo/oferta/${r.id}</loc>\n` +
          `    <lastmod>${new Date(fecha).toISOString()}</lastmod>\n` +
          `    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`
        );
      })
      .join("\n");

    return xml(
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
    );
  } catch (e) {
    console.error("[sitemap-ofertas]", (e as Error).message);
    // Un sitemap que devuelve 500 le dice a Google "vuelve luego", que es
    // mejor que devolverle un XML vacío y que se piense que ya no hay nada.
    return new Response("No disponible", { status: 503 });
  }
}
