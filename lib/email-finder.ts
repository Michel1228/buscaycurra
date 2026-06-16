/**
 * lib/email-finder.ts — Buscador rápido de emails para negocios locales
 * 
 * Estrategia multi-fuente en paralelo (máx 4s total):
 * 1. Google Places website → scrape rápido (3s timeout)
 * 2. Google Search "[nombre] [ciudad] email contacto" → extraer de snippets
 * 3. Fallback: dominios comunes inferidos del nombre
 */

const UA = "Mozilla/5.0 (compatible; BuscayCurraBot/1.0; +https://buscaycurra.es)";

export interface EmailResult {
  email: string | null;
  confidence: "high" | "medium" | "low" | "none";
  source: string;
}

export async function findEmail(
  businessName: string,
  city: string,
  website?: string,
  phone?: string
): Promise<EmailResult> {

  // ── Lanzar las 3 fuentes EN PARALELO (máx 3s total) ──
  const searches: Promise<EmailResult | null>[] = [];

  // Fuente 1: Website (si Google Places lo tiene)
  if (website) {
    searches.push((async () => {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(website, {
          headers: { "User-Agent": UA, Accept: "text/html" },
          signal: controller.signal,
          redirect: "follow",
        });
        clearTimeout(tid);
        const raw = await res.arrayBuffer();
        const html = new TextDecoder("utf-8", { fatal: false }).decode(raw.slice(0, 150_000));
        const emails = extractEmailsFast(html);
        if (emails.length > 0) {
          const best = pickBestEmail(emails, businessName);
          if (best) return { email: best, confidence: "high", source: `web: ${website}` };
        }
      } catch { /* timeout */ }
      return null;
    })());
  }

  // Fuente 2: Google Search snippets
  searches.push((async () => {
    try {
      const q = encodeURIComponent(`${businessName} ${city} email contacto`);
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`https://www.google.com/search?q=${q}&hl=es`, {
        headers: { "User-Agent": UA }, signal: controller.signal
      });
      clearTimeout(tid);
      const html = await res.text();
      const emails = extractEmailsFast(html);
      if (emails.length > 0) {
        const best = pickBestEmail(emails, businessName);
        if (best) return { email: best, confidence: "medium", source: "google_search" };
      }
    } catch { /* ignorar */ }
    return null;
  })());

  // Fuente 3: Páginas Amarillas (directorio español)
  searches.push((async () => {
    try {
      const q = encodeURIComponent(`${businessName} ${city}`);
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`https://www.paginasamarillas.es/search/${q}/all-ma/all/all/all?page=1`, {
        headers: { "User-Agent": UA }, signal: controller.signal
      });
      clearTimeout(tid);
      const html = await res.text();
      const emails = extractEmailsFast(html);
      if (emails.length > 0) {
        const best = pickBestEmail(emails, businessName);
        if (best) return { email: best, confidence: "medium", source: "paginas_amarillas" };
      }
    } catch { /* ignorar */ }
    return null;
  })());

  // Esperar a la primera que devuelva resultado (o todas)
  const settled = await Promise.allSettled(searches);
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value?.email) {
      return r.value;
    }
  }

  return { email: null, confidence: "none", source: "no_sources" };
}

// ── Helpers ──────────────────────────────────────────────────────

function extractEmailsFast(html: string): string[] {
  // Limpiar scripts y estilos
  const clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/&#64;/g, "@")
    .replace(/\[at\]/gi, "@")
    .replace(/\(at\)/gi, "@")
    .replace(/\[dot\]/gi, ".")
    .replace(/\(dot\)/gi, ".");

  const emailRe = /[a-zA-Z0-9._%+\-]{1,64}@[a-zA-Z0-9.\-]{1,253}\.[a-zA-Z]{2,}/g;
  const found = new Set<string>();
  let m: RegExpExecArray | null;

  while ((m = emailRe.exec(clean)) !== null) {
    const email = m[0].toLowerCase().replace(/[.,;:]+$/, "");
    if (email.includes("/")) continue;
    if (/\.(png|jpg|svg|js|css|woff|ttf|eot|map|min)$/i.test(email)) continue;
    if (email.length > 100) continue;
    // Excluir dominios genéricos que no son de la empresa
    const domain = email.split("@")[1];
    if (!domain) continue;
    if (/gmail\.com|yahoo\.|hotmail\.|outlook\.|example\.|sentry\.|google\.|facebook\.|twitter\.|instagram\.|linkedin\./i.test(domain)) continue;
    found.add(email);
  }

  return [...found];
}

function pickBestEmail(emails: string[], businessName: string): string | null {
  if (!emails.length) return null;

  // Normalizar nombre del negocio para comparar
  const nameWords = businessName.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  // 1. Email que contenga palabras del nombre del negocio
  for (const email of emails) {
    const localPart = email.split("@")[0].toLowerCase();
    if (nameWords.some(w => localPart.includes(w))) return email;
  }

  // 2. Keywords RRHH
  const rrhhKeywords = ["rrhh", "hr", "empleo", "trabajo", "jobs", "talent", "info", "contacto", "hola", "admin"];
  for (const kw of rrhhKeywords) {
    const found = emails.find(e => e.split("@")[0].toLowerCase().includes(kw));
    if (found) return found;
  }

  // 3. Evitar noreply/no-reply
  const filtered = emails.filter(e => !e.startsWith("noreply@") && !e.startsWith("no-reply@"));
  return filtered[0] || emails[0];
}
