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

import { get as cacheGet, set as cacheSet } from "@/lib/cache/redis-client";
import { consultaConMargen, consultaGuardada } from "@/lib/consulta-guardada";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://buscaycurra.es";

/** Google admite 50.000 por fichero. Nos quedamos lejos, por el servidor. */
const POR_PAGINA = 25000;

/** Mercado que se publica. Ampliar SOLO después de ver que funciona. */
const PAIS = "es";

/**
 * SOLO OFERTAS QUE SEGUIRÁN VIVAS CUANDO GOOGLE LLEGUE. La página de una oferta
 * caducada lleva noindex (app/empleo/oferta/[id]/page.tsx), y este sitemap solo
 * miraba "isActive": Google recibía ofertas que caducaban antes de visitarlas y
 * Search Console avisaba de "Excluida por una etiqueta noindex" en páginas del
 * sitemap (correo del 12 oct 2026). Se dejan fuera las que caducan en menos de
 * tres días: Google tarda días en pasar por cada URL.
 */
const VIVA_AL_RASTREAR = `("expiresAt" IS NULL OR "expiresAt" > NOW() + INTERVAL '3 days')`;
// Desde el 27 nov 2026 el índice no cuenta aparte: el total es lo larga que es
// la lista guardada, que ya lleva el filtro.

function xml(cuerpo: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${cuerpo}`, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Una hora. Google no lo pide a menudo y cada consulta cuesta cara aquí.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

/**
 * UNA SOLA LISTA, GUARDADA (27 nov 2026). Cada página del mapa leía todas las
 * ofertas de España (199.000) para ordenarlas y quedarse con 25.000; con la
 * base cargada pasaba de los 15 s: 156 cortes en un día, y Google se llevaba
 * un 503. Ahora la lista entera ([id, fecha]) se calcula por detrás una vez
 * cada 12 horas, solo una a la vez, y cada página es un trozo de ella. Si
 * todavía no hay lista, 503 («vuelve luego»), como antes cuando fallaba.
 */
const CLAVE = "sitemap-ofertas:es:v1";
async function ofertasDelMapa(): Promise<Array<[string, number]> | null> {
  return consultaGuardada(CLAVE, async () => {
    const rows = await consultaConMargen<{ id: string; f: string | null }>(
      `SELECT id, (extract(epoch from coalesce("createdAt", "updatedAt")) * 1000)::bigint AS f
         FROM "JobListing"
        WHERE "isActive" = true AND lower(country) = $1 AND ${VIVA_AL_RASTREAR}
        ORDER BY "createdAt" DESC NULLS LAST`,
      [PAIS],
      180000
    );
    await cacheSet("sitemap-ofertas:total", String(rows.length), 7 * 86400);
    return rows.map((r): [string, number] => [r.id, Number(r.f) || 0]);
  }, { frescoMs: 12 * 3600 * 1000, ttlS: 72 * 3600, esperar: false, candadoS: 240 });
}

export async function GET(req: Request) {
  const pagina = new URL(req.url).searchParams.get("page");

  try {
    // ── Índice: cuántos hijos hacen falta ──────────────────────────────────
    if (pagina === null) {
      // NUNCA UN 503 POR CONTAR (12 oct 2026). Desde el 27 nov no se cuenta:
      // el total es lo larga que es la lista guardada. Sin lista todavía, el
      // último total bueno, y sin ninguno, 4 páginas (unas 100.000 ofertas).
      // Una página de más solo sale vacía.
      const lista = await ofertasDelMapa();
      let total: number | null = lista ? lista.length : null;
      if (total === null) {
        total = Number(await cacheGet("sitemap-ofertas:total")) || null;
      }
      const paginas = total === null ? 4 : Math.max(1, Math.ceil(total / POR_PAGINA));

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

    // NULLS LAST importa (va en la consulta de arriba): hay 237.000 ofertas sin
    // createdAt por el INSERT roto del extractor alemán, y sin esto encabezarían
    // la lista las más rotas.
    const lista = await ofertasDelMapa();
    if (!lista) {
      return new Response("No disponible", { status: 503, headers: { "Retry-After": "900" } });
    }

    const urls = lista
      .slice(n * POR_PAGINA, (n + 1) * POR_PAGINA)
      .map(([id, f]) => {
        const fecha = f ? new Date(f) : new Date();
        return (
          `  <url>\n    <loc>${BASE_URL}/empleo/oferta/${id}</loc>\n` +
          `    <lastmod>${fecha.toISOString()}</lastmod>\n` +
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
