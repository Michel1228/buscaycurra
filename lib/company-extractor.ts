/**
 * lib/company-extractor.ts — Extractor real de información de empresas
 *
 * Analiza la web de una empresa con fetch real + regex para encontrar:
 *   - Nombre de la empresa (og:site_name, title, h1)
 *   - Email de RRHH o contacto (regex sobre HTML)
 *   - Página de empleo interna (links con "empleo", "careers", etc.)
 */

export interface DatosEmpresa {
  nombre: string;
  emailRrhh?: string;
  telefono?: string;
  paginaEmpleo?: string;
}

// Palabras clave para detectar emails de RRHH (mayor prioridad)
const RRHH_KEYWORDS = ["rrhh", "hr", "empleo", "trabajo", "jobs", "talent", "recruit", "seleccion", "contratacion", "personal", "people"];

// Palabras clave para páginas de empleo
const EMPLEO_KEYWORDS = [
  "empleo", "trabaja", "trabaj", "career", "job", "vacante", "oferta",
  "incorpora", "únete", "join", "work-with-us", "work_with_us",
];

// User-agent neutral para evitar bloqueos básicos
const UA = "Mozilla/5.0 (compatible; BuscayCurraBot/1.0; +https://buscaycurra.es)";

// Bloquear IPs privadas, loopback, link-local y metadata de cloud (SSRF)
const PRIVATE_IP_RE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc00:|fd)/i;
const CLOUD_METADATA_HOSTS = ["metadata.google.internal", "instance-data", "169.254.169.254", "metadata.azure.com"];

function esUrlSegura(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || PRIVATE_IP_RE.test(host)) return false;
    if (CLOUD_METADATA_HOSTS.some(h => host.includes(h))) return false;
    return true;
  } catch {
    return false;
  }
}

export async function extraerInfoEmpresa(url: string): Promise<DatosEmpresa> {
  if (!esUrlSegura(url)) return { nombre: extraerNombreDesdeUrl(url) };
  const dominioLimpio = (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  const nombreFallback = extraerNombreDesdeUrl(url);

  let html = "";
  let finalUrl = url;

  // 1. Intentar cargar la web de la empresa
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(tid);
    finalUrl = res.url || url;
    // Leer máximo 300 KB para no saturar memoria
    const raw = await res.arrayBuffer();
    html = new TextDecoder("utf-8", { fatal: false }).decode(raw.slice(0, 300_000));
  } catch {
    // Si no podemos cargar, devolvemos lo mínimo
    return { nombre: nombreFallback };
  }

  // 2. Extraer nombre (og:site_name > og:title > <title>)
  const nombre =
    match1(html, /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']{1,80})["']/i) ||
    match1(html, /<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']{1,80})["']/i) ||
    match1(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,80})["']/i) ||
    (() => {
      const t = match1(html, /<title[^>]*>([^<]{1,100})<\/title>/i);
      // Limpiar " | Empresa", " - Empresa", etc.
      return t ? t.replace(/\s*[\|\-–—]\s*.+$/, "").trim() : null;
    })() ||
    nombreFallback;

  // 3. Extraer emails del HTML
  // Regex segura: sin backtracking catastrófico
  const emailsEncontrados = extractEmails(html, dominioLimpio);
  const emailRrhh = priorizarEmail(emailsEncontrados, dominioLimpio);

  // 4. Buscar página de empleo
  const paginaEmpleo = encontrarPaginaEmpleo(html, finalUrl);

  // 5. Si no encontramos email en la home, intentar cargar la página de empleo
  let emailFinal = emailRrhh;
  if (!emailFinal && paginaEmpleo && esUrlSegura(paginaEmpleo)) {
    try {
      const controller2 = new AbortController();
      const tid2 = setTimeout(() => controller2.abort(), 6000);
      const res2 = await fetch(paginaEmpleo, {
        headers: { "User-Agent": UA, Accept: "text/html" },
        signal: controller2.signal,
      });
      clearTimeout(tid2);
      const raw2 = await res2.arrayBuffer();
      const html2 = new TextDecoder("utf-8", { fatal: false }).decode(raw2.slice(0, 150_000));
      const emails2 = extractEmails(html2, dominioLimpio);
      emailFinal = priorizarEmail(emails2, dominioLimpio) || emailFinal;
    } catch { /* ignorar */ }
  }

  return {
    nombre: nombre.trim().substring(0, 100),
    emailRrhh: emailFinal || undefined,
    telefono: undefined,
    paginaEmpleo: paginaEmpleo || undefined,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function match1(html: string, re: RegExp): string | null {
  const m = re.exec(html);
  return m ? m[1].trim() : null;
}

function extractEmails(html: string, dominio: string): string[] {
  // Eliminar scripts y estilos para reducir falsos positivos
  const clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");

  // Decodificar entidades HTML comunes usadas para ofuscar emails
  const decoded = clean
    .replace(/&#64;/g, "@")
    .replace(/&#x40;/g, "@")
    .replace(/&amp;/g, "&")
    .replace(/\[at\]/gi, "@")
    .replace(/\(at\)/gi, "@")
    .replace(/\[dot\]/gi, ".")
    .replace(/\(dot\)/gi, ".");

  // Regex de emails (simple y segura)
  const emailRe = /[a-zA-Z0-9._%+\-]{1,64}@[a-zA-Z0-9.\-]{1,253}\.[a-zA-Z]{2,}/g;
  const encontrados = new Set<string>();
  let m: RegExpExecArray | null;

  while ((m = emailRe.exec(decoded)) !== null) {
    const email = m[0].toLowerCase().replace(/[.,;:]+$/, "");
    // Filtrar emails de imágenes, fuentes, librerías (contienen rutas)
    if (email.includes("/")) continue;
    if (email.endsWith(".png") || email.endsWith(".jpg") || email.endsWith(".svg")) continue;
    if (email.endsWith(".js") || email.endsWith(".css") || email.endsWith(".min")) continue;
    // Solo aceptar emails del mismo dominio o dominios conocidos de email
    const [, emailDomain] = email.split("@");
    if (!emailDomain) continue;
    // Filtrar dominios de librerías y CDN
    if (/\.(woff|ttf|eot|woff2|map)$/.test(emailDomain)) continue;
    if (/version|example|sentry|google|facebook|twitter|instagram|linkedin/.test(emailDomain)) continue;
    if (email.length > 100) continue;
    encontrados.add(email);
  }

  return [...encontrados];
}

function priorizarEmail(emails: string[], dominio: string): string | null {
  if (!emails.length) return null;

  // 1. Prioridad máxima: email del mismo dominio con keyword RRHH
  for (const keyword of RRHH_KEYWORDS) {
    const found = emails.find(e => e.includes(keyword) && (dominio ? e.includes(dominio) : true));
    if (found) return found;
  }

  // 2. Cualquier email del mismo dominio
  if (dominio) {
    const delDominio = emails.filter(e => e.endsWith(`@${dominio}`) || e.endsWith(`.${dominio}`));
    if (delDominio.length) return delDominio[0];
  }

  // 3. Email con keyword RRHH de cualquier dominio
  for (const keyword of RRHH_KEYWORDS) {
    const found = emails.find(e => e.includes(keyword));
    if (found) return found;
  }

  // 4. Primer email encontrado (excluir noreply, info muy genérica)
  const filtrado = emails.filter(e => !e.startsWith("noreply@") && !e.startsWith("no-reply@"));
  return filtrado[0] || emails[0];
}

function encontrarPaginaEmpleo(html: string, finalUrl: string): string | null {
  // Buscar todos los href
  const hrefRe = /href=["']([^"']{1,500})["']/gi;
  const candidatos: { url: string; score: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = hrefRe.exec(html)) !== null) {
    const href = m[1];
    const lower = href.toLowerCase();
    // Calcular score por keywords
    let score = 0;
    for (const kw of EMPLEO_KEYWORDS) {
      if (lower.includes(kw)) score += 1;
    }
    if (score === 0) continue;

    // Construir URL absoluta
    let absUrl: string;
    if (href.startsWith("http")) {
      absUrl = href;
    } else if (href.startsWith("/")) {
      try { absUrl = new URL(href, finalUrl).href; } catch { continue; }
    } else {
      continue;
    }

    // Solo URLs del mismo dominio
    try {
      const baseHost = new URL(finalUrl).hostname;
      const linkHost = new URL(absUrl).hostname;
      if (!linkHost.includes(baseHost.replace(/^www\./, "").split(".").slice(-2).join("."))) continue;
    } catch { continue; }

    candidatos.push({ url: absUrl, score });
  }

  if (!candidatos.length) return null;
  // Ordenar por score descendente y devolver el mejor
  candidatos.sort((a, b) => b.score - a.score);
  return candidatos[0].url;
}

function extraerNombreDesdeUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    const nombre = hostname.replace(/^www\./, "").split(".")[0].replace(/-/g, " ");
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  } catch {
    return "Empresa";
  }
}
