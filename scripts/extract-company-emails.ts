/**
 * scripts/extract-company-emails.ts
 * 
 * Worker de extracción de emails corporativos.
 * 
 * Estrategia:
 * 1. Toma empresas sin contactEmail, ordenadas por nº de ofertas (más impacto primero)
 * 2. Para cada empresa, intenta encontrar su dominio
 * 3. Prueba patrones comunes de email (rrhh@, empleo@, jobs@, etc.)
 * 4. Si encuentra email, actualiza TODAS las ofertas de esa empresa
 * 
 * Uso: npx tsx scripts/extract-company-emails.ts [--max=N]
 */

import { Pool } from "pg";
import * as dns from "dns";
import * as https from "https";

// ── Config ──────────────────────────────────────────────────────────
const DB_URL = process.env.DATABASE_URL || "postgresql://buscaycurra:ByCurr...ure!@buscaycurra-db:5433/buscaycurra";
const MAX_EMPRESAS = parseInt(process.argv.find(a => a.startsWith("--max="))?.split("=")[1] || "500");
const BATCH_SIZE = 25;

const EMAIL_PATTERNS = [
  "rrhh", "empleo", "info", "jobs", "careers", "hr", "talent",
  "recruitment", "personal", "contacto", "contact", "admin", "hello",
  "seleccion", "recursoshumanos", "work", "bewerbung", "recrutement",
  " recruiting", "personnel",
];

// ── DB ──────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: DB_URL, max: 3 });

async function getTopCompanies(limit: number): Promise<{ company: string; ofertas: number }[]> {
  const { rows } = await pool.query(
    `SELECT company, COUNT(*) as ofertas
     FROM "JobListing"
     WHERE company IS NOT NULL AND company != ''
       AND ("contactEmail" IS NULL OR "contactEmail" = '')
       AND company NOT IN ('Empresa europea', 'Ver en oferta', 'Anónimo', 'Confidencial')
     GROUP BY company
     ORDER BY ofertas DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

async function updateCompanyEmail(company: string, email: string): Promise<number> {
  const { rowCount } = await pool.query(
    `UPDATE "JobListing" 
     SET "contactEmail" = $1 
     WHERE company = $2 AND ("contactEmail" IS NULL OR "contactEmail" = '')`,
    [email, company]
  );
  return rowCount || 0;
}

// ── Domain discovery ────────────────────────────────────────────────
function cleanCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function generateDomains(name: string): string[] {
  const clean = cleanCompany(name);
  const domains: string[] = [];

  // Quitar palabras comunes
  const stripped = clean
    .replace(/group$|holding$|international$|inc$|llc$|ltd$|gmbh$|ag$|sa$|sl$|srl$|bv$|nv$|spa$|sas$|ou$|oy$|as$/i, "")
    .replace(/corporation$|solutions$|services$|technologies$|consulting$/i, "");

  const tlds = [".com", ".es", ".de", ".fr", ".it", ".nl", ".co.uk", ".pt", ".be", ".ch", ".at", ".se", ".ie", ".pl"];

  // Variaciones del nombre
  const variations = new Set<string>();
  variations.add(stripped);
  variations.add(clean);
  if (stripped !== clean) variations.add(stripped);

  for (const v of variations) {
    if (v.length < 3) continue;
    for (const tld of tlds) {
      domains.push(v + tld);
    }
  }

  return domains.slice(0, 20); // máximo 20 variaciones
}

function checkDomain(domain: string): Promise<boolean> {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        resolve(true);
        return;
      }
      // Si no tiene MX, probar A record (al menos existe el dominio)
      dns.resolve4(domain, (err2, addrs) => {
        resolve(!err2 && addrs && addrs.length > 0);
      });
    });
  });
}

// ── Email extraction from website ───────────────────────────────────
function fetchPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      // Seguir redirects manualmente
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchPage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

function extractEmailsFromHtml(html: string): string[] {
  const emails = new Set<string>();
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const email = match[0].toLowerCase();
    // Filtrar emails genéricos/no deseados
    if (
      !email.includes("example") &&
      !email.includes("domain") &&
      !email.includes("test") &&
      !email.includes("noreply") &&
      !email.includes("no-reply") &&
      !email.includes("donotreply") &&
      !email.includes("email") &&
      email.length < 80
    ) {
      emails.add(email);
    }
  }
  return Array.from(emails);
}

function prioritizeEmails(emails: string[]): string | null {
  // Priorizar emails de RRHH/empleo
  const priorityPatterns = [
    /rrhh/i, /empleo/i, /jobs/i, /careers/i, /hr/i, /talent/i,
    /recruitment/i, /personal/i, /seleccion/i, /recursoshumanos/i,
    /bewerbung/i, /recrutement/i, /recruiting/i, /personnel/i,
  ];

  for (const pattern of priorityPatterns) {
    const match = emails.find((e) => pattern.test(e));
    if (match) return match;
  }

  // Si no hay de RRHH, devolver el primero que no sea info@
  const notInfo = emails.find((e) => !e.startsWith("info@"));
  if (notInfo) return notInfo;

  // Último recurso: info@
  return emails[0] || null;
}

// ── Main ────────────────────────────────────────────────────────────
async function processCompany(company: string, ofertas: number): Promise<string | null> {
  // 1. Generar dominios candidatos
  const domains = generateDomains(company);
  if (domains.length === 0) return null;

  // 2. Encontrar dominio que exista
  let foundDomain = "";
  for (const domain of domains) {
    const exists = await checkDomain(domain);
    if (exists) {
      foundDomain = domain;
      break;
    }
  }

  if (!foundDomain) return null;

  // 3. Intentar sacar emails de la web
  try {
    const html = await fetchPage(`https://${foundDomain}`);
    const emails = extractEmailsFromHtml(html);
    if (emails.length > 0) {
      return prioritizeEmails(emails);
    }
  } catch {
    // No se pudo acceder a la web, probar patrones comunes
  }

  // 4. Si no pudimos scrapear, probar patrones comunes
  // (no podemos verificar sin SMTP — guardamos el mejor patrón)
  for (const pattern of EMAIL_PATTERNS) {
    // Aquí podríamos intentar SMTP verify, pero es lento
    // Por ahora: si el dominio existe, guardamos rrhh@dominio como mejor intento
  }

  return null; // solo guardamos emails verificados por scraping
}

async function main() {
  console.log(`[EmailExtractor] Iniciando — max ${MAX_EMPRESAS} empresas`);
  const companies = await getTopCompanies(MAX_EMPRESAS);
  console.log(`[EmailExtractor] ${companies.length} empresas a procesar`);

  let procesadas = 0;
  let conEmail = 0;
  let ofertasActualizadas = 0;

  for (let i = 0; i < companies.length; i += BATCH_SIZE) {
    const batch = companies.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (c) => {
        const email = await processCompany(c.company, c.ofertas);
        if (email) {
          const updated = await updateCompanyEmail(c.company, email);
          return { company: c.company, email, updated };
        }
        return null;
      })
    );

    for (const r of results) {
      procesadas++;
      if (r.status === "fulfilled" && r.value) {
        conEmail++;
        ofertasActualizadas += r.value.updated;
        console.log(`  ✅ ${r.value.company} → ${r.value.email} (${r.value.updated} ofertas)`);
      }
    }

    // Progreso cada 100 empresas
    if (procesadas % 100 === 0) {
      console.log(`[EmailExtractor] Progreso: ${procesadas}/${companies.length} | ${conEmail} emails | ${ofertasActualizadas} ofertas actualizadas`);
    }

    // Pequeña pausa entre batches para no saturar
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n[EmailExtractor] ✅ Terminado`);
  console.log(`  Empresas procesadas: ${procesadas}`);
  console.log(`  Emails encontrados:  ${conEmail}`);
  console.log(`  Ofertas actualizadas: ${ofertasActualizadas}`);

  // Estadísticas finales
  const { rows: stats } = await pool.query(
    `SELECT COUNT(*) as total_con_email FROM "JobListing" WHERE "contactEmail" IS NOT NULL AND "contactEmail" != ''`
  );
  console.log(`  Total ofertas con email en DB: ${stats[0].total_con_email}`);

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("[EmailExtractor] Error:", err);
  process.exit(1);
});
