/**
 * scripts/extract-company-emails.ts
 * Worker de extracción masiva de emails corporativos.
 * Corre desde el VPS, conecta a PostgreSQL via localhost:5433.
 */

const { Pool } = require("pg");
const dns = require("dns");
const https = require("https");

const DB_URL = "postgresql://buscaycurra:ByCurra2026Secure!@buscaycurra-db:5432/buscaycurra";
const MAX_EMPRESAS = parseInt(process.argv[2] || "100");

const pool = new Pool({ connectionString: DB_URL, max: 5 });

function cleanCompany(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "").trim();
}

function generateDomains(name) {
  const clean = cleanCompany(name);
  let stripped = clean;
  // Quitar sufijos comunes
  for (const suffix of ["group", "holding", "international", "inc", "llc", "ltd", "gmbh", "ag", "sa", "sl", "srl", "bv", "nv", "spa", "sas", "ou", "oy", "as", "corporation", "solutions", "services", "technologies", "consulting"]) {
    if (stripped.endsWith(suffix) && stripped.length > suffix.length + 2) {
      stripped = stripped.slice(0, -suffix.length);
    }
  }
  const tlds = [".com", ".es", ".de", ".fr", ".it", ".nl", ".co.uk", ".pt", ".be", ".ch", ".at", ".se"];
  const domains = [];
  for (const v of [stripped, clean]) {
    if (v.length < 3) continue;
    for (const tld of tlds) {
      domains.push(v + tld);
    }
  }
  return domains.slice(0, 15);
}

function checkDomain(domain) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 3000);
    dns.resolveMx(domain, (err, addresses) => {
      clearTimeout(timeout);
      if (!err && addresses && addresses.length > 0) { resolve(true); return; }
      dns.resolve4(domain, (err2, addrs) => {
        resolve(!err2 && addrs && addrs.length > 0);
      });
    });
  });
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 8000, headers: { "User-Agent": "Mozilla/5.0 (compatible; BuscayCurra/1.0)" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchPage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data.slice(0, 50000)));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

function extractEmails(html) {
  const emails = new Set();
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const email = match[0].toLowerCase();
    if (!email.includes("example") && !email.includes("domain") && !email.includes("test") && !email.includes("noreply") && !email.includes("no-reply") && email.length < 80) {
      emails.add(email);
    }
  }
  return Array.from(emails);
}

function pickBestEmail(emails) {
  const priority = [/rrhh/i, /empleo/i, /jobs/i, /careers/i, /^hr@/i, /talent/i, /recruitment/i, /personal/i, /seleccion/i, /recursoshumanos/i, /bewerbung/i, /recrutement/i];
  for (const p of priority) {
    const match = emails.find((e) => p.test(e));
    if (match) return match;
  }
  const notInfo = emails.find((e) => !e.startsWith("info@"));
  return notInfo || emails[0] || null;
}

async function processCompany(company) {
  const domains = generateDomains(company);
  for (const domain of domains) {
    const exists = await checkDomain(domain);
    if (!exists) continue;
    try {
      const html = await fetchPage("https://" + domain);
      const emails = extractEmails(html);
      if (emails.length > 0) {
        return { email: pickBestEmail(emails), domain };
      }
    } catch (e) {
      // web no accesible, siguiente dominio
    }
  }
  return null;
}

async function main() {
  console.log("[Extractor] Iniciando para " + MAX_EMPRESAS + " empresas...\n");

  const { rows: companies } = await pool.query(
    `SELECT company, COUNT(*) as n FROM "JobListing"
     WHERE company IS NOT NULL AND company != ''
       AND ("contactEmail" IS NULL OR "contactEmail" = '')
       AND company NOT IN ('Empresa europea', 'Ver en oferta', 'Anónimo', 'Confidencial', 'Empresa del sector', 'Sin nombre')
     GROUP BY company ORDER BY n DESC LIMIT $1`,
    [MAX_EMPRESAS]
  );

  console.log("[Extractor] " + companies.length + " empresas a procesar\n");

  let ok = 0, totalOfertas = 0;
  for (let i = 0; i < companies.length; i++) {
    const { company, n } = companies[i];
    process.stdout.write(`[${i + 1}/${companies.length}] ${company.substring(0, 35)}... `);

    try {
      const result = await processCompany(company);
      if (result) {
        const { rowCount } = await pool.query(
          `UPDATE "JobListing" SET "contactEmail" = $1 WHERE company = $2 AND ("contactEmail" IS NULL OR "contactEmail" = '')`,
          [result.email, company]
        );
        ok++;
        totalOfertas += rowCount || 0;
        console.log(`✅ ${result.email} (${rowCount} ofertas) [${result.domain}]`);
      } else {
        console.log("❌ sin email");
      }
    } catch (e) {
      console.log("⚠️ error:", e.message);
    }

    // Stats cada 25
    if ((i + 1) % 25 === 0) {
      const { rows: s } = await pool.query(`SELECT COUNT(*) as c FROM "JobListing" WHERE "contactEmail" IS NOT NULL AND "contactEmail" != ''`);
      console.log(`\n  📊 Progreso: ${i + 1}/${companies.length} | ${ok} emails | ${totalOfertas} ofertas | Total DB: ${s[0].c} con email\n`);
    }
  }

  const { rows: final } = await pool.query(`SELECT COUNT(*) as c FROM "JobListing" WHERE "contactEmail" IS NOT NULL AND "contactEmail" != ''`);
  console.log(`\n✅ FINALIZADO. ${ok} emails nuevos. ${totalOfertas} ofertas actualizadas. Total DB: ${final[0].c} ofertas con email.`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
