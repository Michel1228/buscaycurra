/**
 * /api/jobs/sync-arbeitnow
 * Extrae ofertas de Arbeitnow (API gratuita, enfoque alemán/europeo)
 * Sin API key. 100 ofertas por página. Actualizaciones cada hora.
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

let currentPage = 1;

async function upsertJob(job: {
  id: string; title: string; company: string; city: string;
  salary?: string; description?: string; sourceUrl?: string;
  country: string; sourceName: string;
}) {
  const pool = getPool();
  await pool.query(`
    INSERT INTO "JobListing" (id, title, company, city, salary, description, "sourceUrl", country, "sourceName", "isActive", "createdAt", "scrapedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET "scrapedAt" = NOW(), "isActive" = true
  `, [job.id, job.title, job.company, job.city, job.salary || null, job.description || null, job.sourceUrl || null, job.country, job.sourceName]);
}

function guessCountry(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes("germany") || loc.includes("deutschland") || 
      /berlin|munich|munchen|hamburg|frankfurt|koln|cologne|stuttgart|dusseldorf|dortmund|essen|leipzig|bremen|dresden|hannover|nurnberg/.test(loc))
    return "DE";
  if (/london|manchester|birmingham|leeds|glasgow|edinburgh|bristol|liverpool|uk/.test(loc))
    return "GB";
  if (/paris|lyon|marseille|toulouse|bordeaux|nantes|france/.test(loc))
    return "FR";
  if (/amsterdam|rotterdam|hague|utrecht|netherlands/.test(loc))
    return "NL";
  if (/madrid|barcelona|valencia|sevilla|bilbao|spain|españa/.test(loc))
    return "ES";
  if (/vienna|wien|austria/.test(loc))
    return "AT";
  if (/zurich|geneva|bern|basel|switzerland/.test(loc))
    return "CH";
  // Default: remote → US
  return "US";
}

export async function GET() {
  return NextResponse.json({ source: "Arbeitnow", currentPage, info: "Free, no key" });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { pages?: number; startPage?: number } = {};
  try { body = await req.json(); } catch {}

  const pages = Math.min(body.pages ?? 3, 10);
  const startPage = body.startPage ?? currentPage;
  let totalInserted = 0, totalFetched = 0;

  for (let p = startPage; p < startPage + pages; p++) {
    try {
      const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?page=${p}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;

      const data = await res.json();
      const jobs = data.data || [];
      totalFetched += jobs.length;

      for (const j of jobs) {
        const country = guessCountry(j.location || "");
        await upsertJob({
          id: `arbeitnow-${j.slug || j.url?.split("/").pop() || crypto.randomUUID()}`,
          title: (j.title || "").slice(0, 200),
          company: (j.company_name || "Empresa").slice(0, 200),
          city: (j.location || "Remoto").slice(0, 100),
          description: ((j.description || "") + " | Tags: " + (j.tags || []).join(", ")).slice(0, 5000),
          sourceUrl: j.url || `https://www.arbeitnow.com/view?utm_source=buscaycurra`,
          country,
          sourceName: "Arbeitnow",
        });
        totalInserted++;
      }

      await new Promise(r => setTimeout(r, 500));
    } catch { /* skip page */ }
  }

  currentPage = startPage + pages;

  return NextResponse.json({
    ok: true,
    source: "arbeitnow",
    totalInserted,
    totalFetched,
    pagesProcessed: pages,
    nextPage: currentPage,
  });
}
