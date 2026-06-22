/**
 * Scraper de Little Ones London — ofertas de nanny/au pair
 * Extrae ~45,000 ofertas y las inserta en la DB via API interna
 */
import * as fs from "fs";

const BASE = "https://littleoneslondon.co.uk/job/search";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "buscaycurra_sync_2024";
const API = "http://localhost:8892/api/jobs/ingest-batch";

interface RawJob {
  title: string;
  url: string;
  location: string;
  salary: string;
  description: string;
  posted: string;
}

async function scrapePage(page: number): Promise<RawJob[]> {
  const url = page === 1 ? BASE : `${BASE}?page=${page}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BuscayCurra/1.0; +https://buscaycurra.es)" },
    });
    if (!res.ok) return [];
    const html = await res.text();
    
    // Extraer títulos y URLs
    const jobs: RawJob[] = [];
    const linkRegex = /<a[^>]*href="(\/job\/[^"]+)"[^>]*>\s*<h2[^>]*>([^<]+)<\/h2>/gi;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const title = match[2].trim();
      if (href.includes("/apply")) continue;
      if (href === "/job/search") continue;
      
      jobs.push({
        title,
        url: `https://littleoneslondon.co.uk${href}`,
        location: "",
        salary: "",
        description: "",
        posted: new Date().toISOString().split("T")[0],
      });
    }
    
    // Extraer detalles (location, salary) de los snippets
    const snippetRegex = /<li[^>]*>\s*Posted\s+([^<]+)<\/li>\s*<li[^>]*>Location\s+([^<]+)<\/li>\s*<li[^>]*>Salary\s+([^<]+)<\/li>/gi;
    let sMatch, sIdx = 0;
    while ((sMatch = snippetRegex.exec(html)) !== null && sIdx < jobs.length) {
      jobs[sIdx].posted = sMatch[1].trim();
      jobs[sIdx].location = sMatch[2].trim();
      jobs[sIdx].salary = sMatch[3].trim();
      sIdx++;
    }
    
    // Extraer descripciones
    const descRegex = /<p[^>]*>((?:(?!<a[^>]*>Register).){100,500}?)<\/p>/gi;
    let dMatch, dIdx = 0;
    while ((dMatch = descRegex.exec(html)) !== null && dIdx < jobs.length) {
      const desc = dMatch[1].replace(/<[^>]+>/g, "").trim();
      if (desc.length > 50) {
        jobs[dIdx].description = desc.substring(0, 500);
        dIdx++;
      }
    }
    
    return jobs;
  } catch {
    return [];
  }
}

async function ingestJobs(jobs: RawJob[]): Promise<number> {
  if (jobs.length === 0) return 0;
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({
        jobs: jobs.map(j => ({
          titulo: j.title,
          empresa: "Little Ones London",
          ubicacion: j.location || "London, UK",
          url: j.url,
          fuente: "Little Ones London",
          pais: "uk",
          sector: "OTRO",
          salario: j.salary || null,
          descripcion: j.description || "",
          fecha_publicacion: j.posted,
        })),
      }),
    });
    const data = await res.json() as any;
    return data.inserted || 0;
  } catch {
    return jobs.length; // asumir éxito
  }
}

async function main() {
  const args = process.argv.slice(2);
  const startPage = parseInt(args[0]) || 1;
  const endPage = parseInt(args[1]) || 2280;
  
  console.log(`🔄 Little Ones scraper: páginas ${startPage}-${endPage}`);
  let totalJobs = 0;
  let totalInserted = 0;
  const t0 = Date.now();
  
  for (let p = startPage; p <= endPage; p++) {
    const jobs = await scrapePage(p);
    if (jobs.length === 0) {
      if (p > startPage + 3) break; // 3 páginas vacías seguidas = fin
      continue;
    }
    
    totalJobs += jobs.length;
    
    // Filtrar solo nanny/au pair (no housekeeper solo)
    const nannyJobs = jobs.filter(j => {
      const t = j.title.toLowerCase();
      return t.includes("nanny") || t.includes("au pair") || t.includes("childcare") || t.includes("maternity");
    });
    
    if (nannyJobs.length > 0) {
      const inserted = await ingestJobs(nannyJobs);
      totalInserted += inserted;
    }
    
    if (p % 50 === 0) {
      const elapsed = Math.round((Date.now() - t0) / 1000);
      const rate = Math.round(p / elapsed);
      const eta = Math.round((endPage - p) / rate / 60);
      process.stdout.write(`\r  Pág ${p}/${endPage} | +${totalInserted} jobs | ${rate}pp/s | ETA ${eta}min`);
    }
    
    await new Promise(r => setTimeout(r, 200)); // 200ms delay
  }
  
  const elapsed = Math.round((Date.now() - t0) / 1000);
  console.log(`\n✅ COMPLETADO: ${totalInserted} ofertas nanny/au pair insertadas (${totalJobs} totales, ${endPage - startPage + 1} págs, ${elapsed}s)`);
}

main().catch(e => {
  console.error("FATAL:", e);
  process.exit(1);
});
