/**
 * /api/jobs/extract-emails — Batch extraction de emails para ofertas sin email
 * 
 * GET  ?batch=100  → procesa N ofertas pendientes
 * POST { batch: 100 } → igual
 * 
 * Estrategia:
 * 1. Ofertas con sourceUrl → scrapeo rápido de la página original
 * 2. Ofertas sin URL → Google search por empresa+ciudad
 * 
 * Máx 8s por oferta, timeout agresivo para no encallar.
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const UA = "Mozilla/5.0 (compatible; BuscayCurraBot/1.0; +https://buscaycurra.es)";
const SYNC_SECRET = process.env.SYNC_SECRET || "buscaycurra_sync_2024";

// Extraer emails de HTML (versión rápida, misma lógica que email-finder)
function extractEmails(html: string): string[] {
  const clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/&#64;/g, "@")
    .replace(/\[at\]/gi, "@")
    .replace(/\(at\)/gi, "@");
  
  const re = /[a-zA-Z0-9._%+\-]{1,64}@[a-zA-Z0-9.\-]{1,253}\.[a-zA-Z]{2,}/g;
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  
  while ((m = re.exec(clean)) !== null) {
    const email = m[0].toLowerCase().replace(/[.,;:]+$/, "");
    if (email.includes("/")) continue;
    if (/\.(png|jpg|svg|js|css|woff|ttf|eot|map|min)$/i.test(email)) continue;
    if (email.length > 100) continue;
    const domain = email.split("@")[1];
    if (!domain) continue;
    if (/gmail\.com|yahoo\.|hotmail\.|outlook\.|example\.|sentry\.|google\.|facebook\.|twitter\.|instagram\.|linkedin\./i.test(domain)) continue;
    found.add(email);
  }
  return [...found];
}

// Scrapear URL buscando email de contacto
async function scrapeUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(tid);
    
    const raw = await res.arrayBuffer();
    const html = new TextDecoder("utf-8", { fatal: false }).decode(raw.slice(0, 200_000));
    const emails = extractEmails(html);
    
    // Priorizar emails de RRHH
    const rrhh = ["rrhh", "hr", "empleo", "trabajo", "jobs", "talent", "recruit", "career", "info", "contacto"];
    for (const kw of rrhh) {
      const found = emails.find(e => e.includes(kw));
      if (found) return found;
    }
    
    return emails[0] || null;
  } catch {
    return null;
  }
}

// Google search para empresa sin URL
async function googleSearch(company: string, city: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`${company} ${city} email contacto`);
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://www.google.com/search?q=${q}&hl=es`, {
      headers: { "User-Agent": UA },
      signal: controller.signal,
    });
    clearTimeout(tid);
    
    const html = await res.text();
    const emails = extractEmails(html);
    return emails[0] || null;
  } catch {
    return null;
  }
}

// ── Handler ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret") || req.nextUrl.searchParams.get("secret") || "";
  if (secret !== SYNC_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const batchSize = parseInt(req.nextUrl.searchParams.get("batch") || "50");
  return await processBatch(Math.min(batchSize, 200));
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret") || "";
  if (secret !== SYNC_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const batchSize = Math.min(body.batch || 50, 200);
  return await processBatch(batchSize);
}

async function processBatch(batchSize: number) {
  const pool = getPool();
  const startTime = Date.now();
  
  // ── Obtener lote de ofertas sin email ──
  const { rows } = await pool.query(
    `SELECT id, company, title, city, "sourceUrl", "sourceName"
     FROM "JobListing"
     WHERE "isActive" = true
       AND ("contactEmail" IS NULL OR "contactEmail" = '')
       AND "sourceUrl" IS NOT NULL AND "sourceUrl" NOT LIKE '%jobviewtrack%'
       AND "sourceUrl" != ''
     ORDER BY "createdAt" DESC
     LIMIT $1`,
    [batchSize]
  );

  if (rows.length === 0) {
    // Sin ofertas con URL — probar Google search
    const { rows: rows2 } = await pool.query(
      `SELECT id, company, title, city, "sourceUrl"
       FROM "JobListing"
       WHERE "isActive" = true
         AND ("contactEmail" IS NULL OR "contactEmail" = '')
       ORDER BY "createdAt" DESC
       LIMIT $1`,
      [batchSize]
    );

    if (rows2.length === 0) {
      return NextResponse.json({ extracted: 0, message: "No pending offers" });
    }

    let extracted = 0;
    for (const row of rows2) {
      const company = (row.company as string) || "";
      const city = (row.city as string) || "";
      if (!company || company.length < 3) continue;

      const email = await googleSearch(company, city);
      if (email) {
        await pool.query(
          `UPDATE "JobListing" SET "contactEmail" = $1 WHERE id = $2`,
          [email, row.id]
        );
        extracted++;
      }

      // No saturar — pequeña pausa entre Google searches
      await new Promise(r => setTimeout(r, 500));
      if (Date.now() - startTime > 45_000) break; // max 45s por lote
    }

    return NextResponse.json({
      extracted,
      total: rows2.length,
      method: "google_search",
      elapsed: Date.now() - startTime,
    });
  }

  // ── Procesar ofertas con sourceUrl ──
  let extracted = 0;
  for (const row of rows) {
    const url = (row.sourceUrl as string) || "";
    if (!url.startsWith("http")) continue;

    let email = await scrapeUrl(url);
    // Fallback: Google search si el scrape no encuentra email
    if (!email) {
      const company = (row.company as string) || "";
      const city = (row.city as string) || "";
      if (company.length >= 3) {
        email = await googleSearch(company, city);
        if (email) await new Promise(r => setTimeout(r, 500)); // pausa post-Google
      }
    }
    if (email) {
      await pool.query(
        `UPDATE "JobListing" SET "contactEmail" = $1 WHERE id = $2`,
        [email, row.id]
      );
      extracted++;
    }

    if (Date.now() - startTime > 45_000) break;
  }

  return NextResponse.json({
    extracted,
    total: rows.length,
    method: "scrape_sourceUrl",
    elapsed: Date.now() - startTime,
  });
}
