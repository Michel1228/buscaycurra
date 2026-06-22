/**
 * GET /api/au-pair/ofertas?modo=au_pair|live_in_nanny
 * Devuelve contador global de ofertas au pair / live-in nanny + últimas ofertas recientes.
 * Sin autenticación — datos públicos para atraer tráfico.
 */
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 300; // cache 5 min

const NANNY_EXCL = `title NOT ILIKE '%administrative%' AND title NOT ILIKE '%assistant%' AND title NOT ILIKE '%apprentice%' AND title NOT ILIKE '%teacher%' AND title NOT ILIKE '%support%' AND title NOT ILIKE '%coordinator%' AND title NOT ILIKE '%substitute%' AND title NOT ILIKE '%manager%' AND title NOT ILIKE '%director%' AND title NOT ILIKE '%supervisor%' AND title NOT ILIKE '%specialist%' AND title NOT ILIKE '%officer%' AND title NOT ILIKE '%receptionist%' AND title NOT ILIKE '%sales%' AND title NOT ILIKE '%marketing%' AND title NOT ILIKE '%payroll%' AND title NOT ILIKE '%accountant%' AND title NOT ILIKE '%clerk%' AND title NOT ILIKE '%secretary%' AND title NOT ILIKE '%office%' AND title NOT ILIKE '%reception%'`;

const KEYWORDS: Record<string, string> = {
  au_pair: `(title ILIKE '%au pair%' OR title ILIKE '%aupair%' OR title ILIKE '%niñera%' OR title ILIKE '%canguro%' OR (title ILIKE '%nanny%' AND ${NANNY_EXCL}))`,
  live_in_nanny: `title ILIKE '%live in nanny%' OR title ILIKE '%live-in nanny%' OR title ILIKE '%live-in caregiver%' OR title ILIKE '%live in caregiver%' OR title ILIKE '%niñera interna%' OR title ILIKE '%nanny interna%' OR title ILIKE '%full-time nanny%' OR title ILIKE '%professional nanny%' OR title ILIKE '%nanny housekeeper%' OR title ILIKE '%nanny/housekeeper%' OR title ILIKE '%live out nanny%' OR title ILIKE '%nanny live%' OR title ILIKE '%cuidador interno%' OR title ILIKE '%cuidadora interna%' OR (title ILIKE '%nanny%' AND ${NANNY_EXCL})`,
};

const CATEGORIA: Record<string, string> = {
  au_pair: `categoria = 'au_pair'`,
  live_in_nanny: `categoria = 'live_in_nanny'`,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modo = searchParams.get("modo") || "au_pair";
    const cat = CATEGORIA[modo] || CATEGORIA.au_pair;

    const pool = getPool();
    const [countRes, ofertasRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int as total,
                COUNT(*) FILTER (WHERE "contactEmail" IS NOT NULL AND "contactEmail" != '')::int as con_email,
                COUNT(DISTINCT UPPER(TRIM(country)))::int as paises,
                COUNT(DISTINCT company)::int as empresas
         FROM "JobListing"
         WHERE "isActive" = true
           AND ${cat}`
      ),
      pool.query(
        `SELECT title, company, "contactEmail", country, city, salary, "sourceUrl", "scrapedAt"
         FROM "JobListing"
         WHERE "isActive" = true
           AND ${cat}
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

    return NextResponse.json({ stats, ofertas, modo });
  } catch (err: any) {
    console.error("[au-pair/ofertas]", err.message);
    return NextResponse.json({ stats: { total: 0, con_email: 0, paises: 0, empresas: 0 }, ofertas: [], modo: "au_pair" });
  }
}
