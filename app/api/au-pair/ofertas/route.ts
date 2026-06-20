/**
 * GET /api/au-pair/ofertas
 * Devuelve contador global de ofertas au pair + últimas ofertas recientes.
 * Sin autenticación — datos públicos para atraer tráfico.
 */
import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";
export const revalidate = 300; // cache 5 min

const pool = new Pool({
  host: "buscaycurra-db",
  port: 5432,
  user: "buscaycurra",
  password: process.env.POSTGRES_PASSWORD || "buscaycurra",
  database: "buscaycurra",
  max: 3,
  statement_timeout: 5000,
});

export async function GET() {
  try {
    const [countRes, ofertasRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int as total,
                COUNT(*) FILTER (WHERE "contactEmail" IS NOT NULL AND "contactEmail" != '')::int as con_email,
                COUNT(DISTINCT country)::int as paises,
                COUNT(DISTINCT company)::int as empresas
         FROM "JobListing"
         WHERE "isActive" = true
           AND (title ILIKE '%au pair%' OR title ILIKE '%aupair%' OR title ILIKE '%nanny%' OR title ILIKE '%childcare%')`
      ),
      pool.query(
        `SELECT title, company, "contactEmail", country, city, salary, "sourceUrl", "scrapedAt"
         FROM "JobListing"
         WHERE "isActive" = true
           AND (title ILIKE '%au pair%' OR title ILIKE '%aupair%' OR title ILIKE '%nanny%')
           AND "contactEmail" IS NOT NULL AND "contactEmail" != ''
         ORDER BY "scrapedAt" DESC
         LIMIT 8`
      ),
    ]);

    const stats = countRes.rows[0] || { total: 0, con_email: 0, paises: 0, empresas: 0 };

    const ofertas = ofertasRes.rows.map((r: any) => ({
      title: r.title,
      company: r.company,
      email: r.contactEmail,
      country: r.country || "",
      city: r.city || "",
      salary: r.salary || "",
      url: r.sourceUrl || "",
    }));

    return NextResponse.json({ stats, ofertas });
  } catch (err: any) {
    console.error("[au-pair/ofertas]", err.message);
    return NextResponse.json({ stats: { total: 0, con_email: 0, paises: 0, empresas: 0 }, ofertas: [] });
  }
}
