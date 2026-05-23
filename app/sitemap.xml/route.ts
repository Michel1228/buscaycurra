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

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;

      return new Response(xml, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    // ─── Sitemap hijo ────────────────────────────────────────────
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
      const slug = row.title
        ?.toLowerCase()
        .replace(/[^a-záéíóúüñ0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "empleo";
      const ciudad = row.city?.toLowerCase().replace(/\s+/g, "-") || "espana";
      const lastmod = row.createdAt
        ? new Date(row.createdAt).toISOString()
        : new Date().toISOString();

      // Prioridad: 0.8 para ofertas con salario, 0.7 para el resto
      const priority = "0.8";

      return `  <url>
    <loc>${BASE_URL}/empleo/oferta/${row.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
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
