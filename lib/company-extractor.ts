/**
 * lib/company-extractor.ts — Extractor REAL de información de empresas
 *
 * Analiza la web de una empresa para encontrar:
 *   - Nombre de la empresa
 *   - Email de RRHH o contacto (scrapeo real + Hunter.io fallback)
 *   - Teléfono de contacto
 *   - Página de empleo interna
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DatosEmpresa {
  nombre: string;
  emailRrhh?: string;
  telefono?: string;
  paginaEmpleo?: string;
}

// ─── Configuración ────────────────────────────────────────────────────────────

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

// Patrones de email comunes en RRHH español
const PATRONES_EMAIL_RRHH = [
  /rrhh@[\w.-]+\.\w+/i,
  /recursos\.humanos@[\w.-]+\.\w+/i,
  /empleo@[\w.-]+\.\w+/i,
  /trabajo@[\w.-]+\.\w+/i,
  /jobs@[\w.-]+\.\w+/i,
  /careers@[\w.-]+\.\w+/i,
  /talento@[\w.-]+\.\w+/i,
  /seleccion@[\w.-]+\.\w+/i,
  /personas@[\w.-]+\.\w+/i,
  /contacto@[\w.-]+\.\w+/i,
  /info@[\w.-]+\.\w+/i,
];

// Emails placeholder/fake que el scraper no debe coger nunca
const EMAILS_FALSOS = new Set([
  "tu@email.com", "email@email.com", "ejemplo@ejemplo.com", "test@test.com",
  "user@example.com", "name@email.com", "correo@correo.com", "mail@mail.com",
  "your@email.com", "sample@sample.com", "demo@demo.com", "info@example.com",
]);
const DOMINIOS_FALSOS = ["example.com", "ejemplo.com", "test.com", "sample.com", "domain.com", "email.com"];

function esEmailFalso(email: string): boolean {
  const lower = email.toLowerCase();
  if (EMAILS_FALSOS.has(lower)) return true;
  const dominio = lower.split("@")[1] ?? "";
  if (DOMINIOS_FALSOS.some(d => dominio === d)) return true;
  // Emails que contienen palabras de placeholder
  if (/^(tu|your|name|usuario|user|correo|mail|email|test|demo|ejemplo|sample)@/.test(lower)) return true;
  return false;
}

// Patrones de teléfono español
const PATRONES_TELEFONO = [
  /(?:\+34\s?)?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/g,
  /(?:\+34\s?)?9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/g,
];

// Palabras clave para detectar página de empleo
const PALABRAS_EMPLEO = [
  "trabaja", "empleo", "carreras", "careers", "jobs", "trabajo",
  "unete", "join", "vacantes", "ofertas", "opportunities", "talento",
  "equipo", "team", "people", "rrhh", "humanos", "work",
];

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Extrae información de contacto y empleo de la web de una empresa.
 * Usa scraping real + Hunter.io API como fallback.
 */
export async function extraerInfoEmpresa(url: string): Promise<DatosEmpresa> {
  console.log(`🏢 Extractor: analizando ${url}`);

  const nombreDesdeUrl = extraerNombreDesdeUrl(url);
  const dominio = new URL(url).hostname;

  let emailRrhh: string | undefined;
  let telefono: string | undefined;
  let paginaEmpleo: string | undefined;

  // ── 1. Intentar scraping de la web ───────────────────────────────────────
  try {
    const html = await fetchPagina(url, 8000);
    if (html) {
      // Buscar emails en el HTML — primero patrones RRHH específicos
      for (const patron of PATRONES_EMAIL_RRHH) {
        const match = html.match(patron);
        if (match) {
          const candidato = match[0].toLowerCase();
          if (!esEmailFalso(candidato)) {
            emailRrhh = candidato;
            console.log(`📧 Email encontrado en web: ${emailRrhh}`);
            break;
          }
        }
      }

      // Si no hay email RRHH, buscar cualquier email (filtrando placeholders)
      if (!emailRrhh) {
        const todos = html.match(/[\w.-]+@[\w.-]+\.\w{2,}/g) ?? [];
        const valido = todos.find(e => !esEmailFalso(e.toLowerCase()));
        if (valido) {
          emailRrhh = valido.toLowerCase();
          console.log(`📧 Email genérico encontrado: ${emailRrhh}`);
        }
      }

      // Buscar teléfono
      for (const patron of PATRONES_TELEFONO) {
        const match = html.match(patron);
        if (match) {
          telefono = match[0];
          break;
        }
      }

      // Buscar página de empleo
      paginaEmpleo = buscarPaginaEmpleo(html, url);
    }
  } catch (e) {
    console.warn(`[Extractor] Error scrapeando ${url}:`, (e as Error).message);
  }

  // ── 2. Fallback: Hunter.io API ──────────────────────────────────────────
  if (!emailRrhh && HUNTER_API_KEY) {
    try {
      const hunterEmail = await buscarHunterIo(dominio);
      if (hunterEmail) {
        emailRrhh = hunterEmail;
        console.log(`📧 Email encontrado via Hunter.io: ${emailRrhh}`);
      }
    } catch (e) {
      console.warn(`[Extractor] Hunter.io falló:`, (e as Error).message);
    }
  }

  // ── 3. Fallback final: email genérico rrhh@ ─────────────────────────────
  if (!emailRrhh) {
    emailRrhh = `rrhh@${dominio}`;
    console.log(`📧 Email genérico asignado: ${emailRrhh}`);
  }

  const datos: DatosEmpresa = {
    nombre: nombreDesdeUrl,
    emailRrhh,
    telefono,
    paginaEmpleo,
  };

  console.log(`✅ Extractor: datos obtenidos para ${datos.nombre}`);
  return datos;
}

// ─── Funciones auxiliares ─────────────────────────────────────────────────────

async function fetchPagina(url: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "es-ES,es;q=0.9",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    return await res.text();
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

function buscarPaginaEmpleo(html: string, baseUrl: string): string | undefined {
  // Buscar enlaces que contengan palabras de empleo
  const linkRegex = /href=["']([^"']+)["']/gi;
  let match;
  const candidatos: { url: string; score: number }[] = [];

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const hrefLower = href.toLowerCase();

    let score = 0;
    for (const palabra of PALABRAS_EMPLEO) {
      if (hrefLower.includes(palabra)) score += 10;
    }

    if (score > 0) {
      // Resolver URL relativa
      let fullUrl: string;
      try {
        fullUrl = new URL(href, baseUrl).href;
      } catch {
        continue;
      }
      candidatos.push({ url: fullUrl, score });
    }
  }

  // Ordenar por score y devolver el mejor
  candidatos.sort((a, b) => b.score - a.score);
  return candidatos[0]?.url;
}

async function buscarHunterIo(domain: string): Promise<string | null> {
  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${HUNTER_API_KEY}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;

  const data = await res.json() as {
    data?: {
      emails?: Array<{
        value: string;
        type?: string;
        position?: string;
      }>;
    };
  };

  const emails = data.data?.emails || [];

  // Priorizar emails de RRHH/recursos humanos
  const rrhhEmails = emails.filter(e => {
    const val = e.value.toLowerCase();
    const pos = (e.position || "").toLowerCase();
    return /rrhh|recursos|humanos|empleo|talento|seleccion|hr|people/i.test(val + " " + pos);
  });

  if (rrhhEmails.length > 0) return rrhhEmails[0].value;

  // Si no hay RRHH, devolver el primer email genérico
  const genericEmails = emails.filter(e => {
    const val = e.value.toLowerCase();
    return /info|contacto|hola|hello/i.test(val);
  });

  if (genericEmails.length > 0) return genericEmails[0].value;
  if (emails.length > 0) return emails[0].value;

  return null;
}

// ─── Funciones auxiliares ─────────────────────────────────────────────────────

/**
 * Extrae un nombre legible a partir de la URL de la empresa.
 * Ej: "https://www.acmecorp.com/about" → "Acmecorp"
 */
function extraerNombreDesdeUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Eliminar www. y TLD, capitalizar la primera letra
    const nombre = hostname
      .replace(/^www\./, "")
      .split(".")[0]
      .replace(/-/g, " ");
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  } catch {
    return "Empresa desconocida";
  }
}
