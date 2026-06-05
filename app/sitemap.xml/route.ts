/**
 * Sitemap dinámico para BuscayCurra
 * GET /sitemap.xml            → sitemap index con enlaces a sitemaps hijos
 * GET /sitemap.xml?page=N     → sitemap hijo N con hasta 50.000 URLs de ofertas
 */
import { getPool } from "@/lib/db";

const BASE_URL = "https://buscaycurra.es";
const PER_PAGE = 50_000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");

  const pool = getPool();

  try {
    if (pageParam === null) {
      // ─── Sitemap Index ──────────────────────────────────────────
      const countRes = await pool.query(
        `SELECT COUNT(*)::int AS total FROM "JobListing" WHERE "isActive" = true`
      );
      const total = countRes.rows[0]?.total ?? 0;
      const numSitemaps = Math.ceil(total / PER_PAGE);

      const sitemaps = Array.from({ length: numSitemaps }, (_, i) =>
        `  <sitemap>
    <loc>${BASE_URL}/sitemap.xml?page=${i}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
      ).join("\n");

      // Páginas estáticas en sitemap propio
      const staticPages = `  <sitemap>
    <loc>${BASE_URL}/sitemap.xml?page=static</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`;

      // Países en sitemap propio
      const countryPages = `  <sitemap>
    <loc>${BASE_URL}/sitemap.xml?page=countries</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`;

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
${staticPages}
${countryPages}
</sitemapindex>`;

      return new Response(xml, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    // ─── Sitemap de páginas estáticas ────────────────────────────
    if (pageParam === "static") {
      const pages = [
        { loc: "/", priority: "1.0", freq: "daily" },
        { loc: "/precios", priority: "0.9", freq: "weekly" },
        { loc: "/auth/login", priority: "0.8", freq: "weekly" },
        { loc: "/auth/registro", priority: "0.8", freq: "weekly" },
        { loc: "/empresas", priority: "0.7", freq: "weekly" },
        { loc: "/descargar", priority: "0.7", freq: "monthly" },
        { loc: "/app/buscar", priority: "0.9", freq: "daily" },
        { loc: "/app/emigrar", priority: "0.8", freq: "daily" },
        { loc: "/app/salarios", priority: "0.8", freq: "daily" },
        { loc: "/aviso-legal", priority: "0.3", freq: "yearly" },
        { loc: "/privacidad", priority: "0.3", freq: "yearly" },
        { loc: "/terminos", priority: "0.3", freq: "yearly" },
        { loc: "/cookies", priority: "0.3", freq: "yearly" },
      ];

      const urls = pages.map(
        (p) =>
          `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
      ).join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

      return new Response(xml, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    // ─── Sitemap de países ─────────────────────────────────────
    if (pageParam === "countries") {
      const paises = [
        "alemania","espana","estados-unidos","reino-unido","canada",
        "francia","suecia","australia","paises-bajos","italia",
        "suiza","irlanda","belgica","portugal","noruega","polonia"
      ];

      const urls = paises.map(
        (p) =>
          `  <url>
    <loc>${BASE_URL}/trabajar-en/${p}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
      ).join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

      return new Response(xml, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    // ─── Sitemap hijo (ofertas) ─────────────────────────────────
    const page = parseInt(pageParam, 10);
    if (isNaN(page) || page < 0) {
      return new Response("Invalid page", { status: 400 });
    }

    const offset = page * PER_PAGE;
    const result = await pool.query(
      `SELECT "id", "title", "city", "createdAt"
       FROM "JobListing"
       WHERE "isActive" = true
       ORDER BY "createdAt" DESC
       LIMIT ${PER_PAGE} OFFSET ${offset}`
    );

    const urls = result.rows.map((row: any) => {
      const lastmod = row.createdAt
        ? new Date(row.createdAt).toISOString()
        : new Date().toISOString();

      return `  <url>
    <loc>${BASE_URL}/empleo/oferta/${row.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;

    return new Response(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (err) {
    console.error("Sitemap error:", err);
    return new Response("Internal error generating sitemap", { status: 500 });
  }
}
