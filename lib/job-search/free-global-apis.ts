/**
 * lib/job-search/free-global-apis.ts
 * 
 * Fuentes GRATUITAS de empleo global:
 * - The Muse API — 500K+ ofertas (sin API key, paginada)
 * - Jobicy — remote jobs con salarios reales
 * - Remotive — remote tech jobs
 * 
 * Todas sin autenticación, rate-limited amablemente (1 req/seg)
 */

import { getPool } from "@/lib/db";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface RawJob {
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario: string;
  descripcion: string;
  url: string;
  fecha: string;
  fuente: string;
  country?: string;
}

// ─── Country mapping por ciudad/estado ───────────────────────────────────────

const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC","PR","GU","VI","AS","MP",
]);

const CITY_COUNTRY_MAP: Record<string, string> = {
  // UK cities
  "london": "UK", "manchester": "UK", "birmingham": "UK", "leeds": "UK",
  "liverpool": "UK", "bristol": "UK", "edinburgh": "UK", "glasgow": "UK",
  "cardiff": "UK", "belfast": "UK", "sheffield": "UK", "nottingham": "UK",
  "newcastle": "UK", "cambridge": "UK", "oxford": "UK", "brighton": "UK",
  // Canada
  "toronto": "CA", "vancouver": "CA", "montreal": "CA", "calgary": "CA",
  "ottawa": "CA", "edmonton": "CA", "quebec": "CA", "winnipeg": "CA",
  "halifax": "CA", "mississauga": "CA", "brampton": "CA", "hamilton": "CA",
  // Australia
  "sydney": "AU", "melbourne": "AU", "brisbane": "AU", "perth": "AU",
  "adelaide": "AU", "gold coast": "AU", "canberra": "AU",
  // Germany
  "berlin": "DE", "munich": "DE", "hamburg": "DE", "frankfurt": "DE",
  "cologne": "DE", "stuttgart": "DE", "dusseldorf": "DE", "leipzig": "DE",
  "dortmund": "DE", "essen": "DE", "bremen": "DE", "dresden": "DE",
  "hannover": "DE", "nuremberg": "DE", "bonn": "DE",
  // Spain
  "madrid": "ES", "barcelona": "ES", "valencia": "ES", "sevilla": "ES",
  "zaragoza": "ES", "malaga": "ES", "bilbao": "ES", "alicante": "ES",
  "murcia": "ES", "palma": "ES", "granada": "ES", "cordoba": "ES",
  // France
  "paris": "FR", "lyon": "FR", "marseille": "FR", "toulouse": "FR",
  "lille": "FR", "bordeaux": "FR", "nice": "FR", "nantes": "FR",
  "strasbourg": "FR", "montpellier": "FR", "rennes": "FR",
  // Italy
  "rome": "IT", "milan": "IT", "naples": "IT", "turin": "IT",
  "florence": "IT", "bologna": "IT", "venice": "IT", "genoa": "IT",
  // Netherlands
  "amsterdam": "NL", "rotterdam": "NL", "the hague": "NL", "utrecht": "NL",
  "eindhoven": "NL", "groningen": "NL", "tilburg": "NL",
  // Sweden
  "stockholm": "SE", "gothenburg": "SE", "malmo": "SE", "uppsala": "SE",
  // Other notable
  "dublin": "IE", "copenhagen": "DK", "oslo": "NO", "helsinki": "FI",
  "warsaw": "PL", "warszawa": "PL", "vienna": "AT", "wien": "AT",
  "zurich": "CH", "geneva": "CH", "basel": "CH", "bern": "CH",
  "brussels": "BE", "bruxelles": "BE", "lisbon": "PT", "lisboa": "PT",
  "porto": "PT", "athens": "GR", "budapest": "HU", "prague": "CZ",
  "praha": "CZ", "bucharest": "RO", "sofia": "BG", "zagreb": "HR",
  "ljubljana": "SI", "bratislava": "SK", "tallinn": "EE", "riga": "LV",
  "vilnius": "LT", "luxembourg": "LU", "reykjavik": "IS",
  // Japan
  "tokyo": "JP", "osaka": "JP", "yokohama": "JP", "nagoya": "JP",
  "kyoto": "JP", "fukuoka": "JP", "sapporo": "JP",
  // Singapore
  "singapore": "SG",
  // UAE
  "dubai": "AE", "abu dhabi": "AE",
  // Brazil
  "sao paulo": "BR", "rio de janeiro": "BR", "brasilia": "BR",
  // India
  "bengaluru": "IN", "bangalore": "IN", "mumbai": "IN", "delhi": "IN",
  "hyderabad": "IN", "chennai": "IN", "pune": "IN",
  // Mexico
  "mexico city": "MX", "guadalajara": "MX", "monterrey": "MX",
  // Argentina
  "buenos aires": "AR", "rosario": "AR",
  // Chile
  "santiago": "CL",
  // Colombia
  "bogota": "CO", "medellin": "CO",
  // New Zealand
  "auckland": "NZ", "wellington": "NZ", "christchurch": "NZ",
};

function detectCountry(location: string): string | null {
  if (!location) return null;
  
  // Si contiene nombre de país explícito
  const countryNames: Record<string, string> = {
    "united kingdom": "UK", "uk": "UK", "england": "UK", "scotland": "UK",
    "germany": "DE", "deutschland": "DE",
    "france": "FR",
    "spain": "ES", "españa": "ES", "espana": "ES",
    "italy": "IT", "italia": "IT",
    "netherlands": "NL", "holland": "NL",
    "sweden": "SE", "sverige": "SE",
    "canada": "CA",
    "australia": "AU",
    "japan": "JP",
    "switzerland": "CH", "schweiz": "CH", "suisse": "CH",
    "belgium": "BE", "belgique": "BE", "belgie": "BE",
    "austria": "AT", "österreich": "AT", "osterreich": "AT",
    "denmark": "DK", "danmark": "DK",
    "norway": "NO", "norge": "NO",
    "finland": "FI", "suomi": "FI",
    "poland": "PL", "polska": "PL",
    "portugal": "PT",
    "ireland": "IE",
    "singapore": "SG",
    "uae": "AE", "united arab emirates": "AE", "dubai": "AE",
    "brazil": "BR", "brasil": "BR",
    "india": "IN",
    "mexico": "MX",
    "argentina": "AR",
    "chile": "CL",
    "colombia": "CO",
    "new zealand": "NZ",
    "indonesia": "ID",
    "philippines": "PH",
    "malaysia": "MY",
    "south korea": "KR", "korea": "KR",
    "czech": "CZ", "czech republic": "CZ",
    "romania": "RO",
    "hungary": "HU",
    "greece": "GR",
    "turkey": "TR", "türkiye": "TR",
  };

  const lower = location.toLowerCase().trim();

  for (const [name, code] of Object.entries(countryNames)) {
    if (lower.includes(name)) return code;
  }

  // Detectar por estado de US (ej: "San Francisco, CA")
  const stateMatch = lower.match(/,\s*([A-Z]{2})\s*$/);
  if (stateMatch && US_STATES.has(stateMatch[1])) return "US";

  // Detectar UK postcode (ej: "London, SW1A 1AA" o "London EC2A")
  if (/[A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2}/i.test(location)) return "UK";

  // Buscar por ciudad conocida
  const cityMatch = lower.split(",")[0].trim();
  if (CITY_COUNTRY_MAP[cityMatch]) return CITY_COUNTRY_MAP[cityMatch];

  // Buscar ciudad en cualquier parte del string
  for (const [city, code] of Object.entries(CITY_COUNTRY_MAP)) {
    if (lower.includes(city)) return code;
  }

  // Si menciona "remote" sin ubicación clara → null (global)
  if (lower.includes("remote") || lower.includes("remoto") || lower === "anywhere") return null;

  // Por defecto, si tiene formato "City, ST" típico de US
  if (/,\s*[A-Z]{2}\s*$/.test(location)) return "US";

  return null;
}

// ─── DB helpers ──────────────────────────────────────────────────────────────

function makeId(source: string, id: string | number): string {
  const crypto = require("crypto");
  return crypto.createHash("md5").update(`${source}|${id}`).digest("hex").slice(0, 24);
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);
}

async function guardarOfertas(ofertas: RawJob[]): Promise<number> {
  if (ofertas.length === 0) return 0;
  const pool = getPool();
  let guardadas = 0;

  for (const o of ofertas) {
    try {
      const id = makeId(o.fuente, o.url);
      const country = o.country || detectCountry(o.ubicacion);
      await pool.query(
        `INSERT INTO "JobListing" (id, title, company, city, salary, description, "sourceUrl", "scrapedAt", "isActive", "sourceName", "sector", "country", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), true, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET "isActive" = true, "scrapedAt" = NOW()`,
        [
          id, o.titulo, o.empresa, o.ubicacion || "Remoto",
          o.salario || "Ver en oferta",
          o.descripcion?.slice(0, 5000) || "",
          o.url, o.fuente, "OTRO", country,
          o.fecha ? new Date(o.fecha).toISOString() : new Date().toISOString(),
        ]
      );
      guardadas++;
    } catch (e: any) {
      if (e?.code !== "23505") {
        console.error(`[GlobalAPIs] Error insertando ${o.fuente}:`, e?.message?.slice(0, 100));
      }
    }
  }
  return guardadas;
}

// ─── THE MUSE ────────────────────────────────────────────────────────────────

interface MuseJob {
  id: number;
  name: string;
  company: { name: string };
  locations: Array<{ name: string }>;
  levels: Array<{ name: string }>;
  categories: Array<{ name: string }>;
  publication_date: string;
  contents: string;
  refs: { landing_page: string };
}

interface MuseResponse {
  total: number;
  page_count: number;
  results: MuseJob[];
}

export async function fetchMusePage(page: number): Promise<{ jobs: RawJob[]; total: number; pageCount: number }> {
  const url = `https://www.themuse.com/api/public/jobs?page=${page}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BuscayCurra/1.0 (job aggregator; contacto@buscaycurra.es)" },
    });
    if (!res.ok) {
      console.error(`[Muse] HTTP ${res.status} for page ${page}`);
      return { jobs: [], total: 0, pageCount: 0 };
    }
    const data: MuseResponse = await res.json();
    
    const jobs: RawJob[] = (data.results || []).map((j: MuseJob) => {
      const location = j.locations?.map(l => l.name).join("; ") || "Remoto";
      const level = j.levels?.map(l => l.name).join(", ") || "";
      const category = j.categories?.map(c => c.name).join(", ") || "";
      const salario = extractSalaryFromHtml(j.contents);
      const titulo = level ? `${j.name} (${level})` : j.name;
      
      return {
        titulo: titulo.slice(0, 255),
        empresa: j.company?.name || "Empresa",
        ubicacion: location.slice(0, 255),
        salario,
        descripcion: cleanHtml(j.contents),
        url: j.refs?.landing_page || `https://www.themuse.com/jobs/${j.id}`,
        fecha: j.publication_date || new Date().toISOString(),
        fuente: "MUSE",
      };
    });

    return { jobs, total: data.total, pageCount: data.page_count };
  } catch (e: any) {
    console.error(`[Muse] Error page ${page}:`, e?.message?.slice(0, 100));
    return { jobs: [], total: 0, pageCount: 0 };
  }
}

function extractSalaryFromHtml(html: string): string {
  if (!html) return "";
  // Buscar patrones de salario en USD
  const patterns = [
    /\$\s*([\d,]+)\s*[-–to]+\s*\$?\s*([\d,]+)(?:\s*(?:per|a|\/)\s*(year|yr|annually|annual|annum|month|hour|hr))/i,
    /\$\s*([\d,]+)(?:\s*(?:per|a|\/)\s*(year|yr|annually|annual|annum|month|hour|hr))/i,
    /salary[:\s]*\$?\s*([\d,]+)\s*[-–to]+\s*\$?\s*([\d,]+)/i,
    /rate of pay[:\s]*\$?\s*([\d,]+)\s*[-–to]+\s*\$?\s*([\d,]+)/i,
  ];

  for (const p of patterns) {
    const m = html.match(p);
    if (m) {
      if (m[2] && /\d/.test(m[2].replace(/,/g, ""))) {
        return `$${m[1]} - $${m[2]} USD/año`;
      }
      return `$${m[1]} USD/año`;
    }
  }
  return "";
}

// ─── JOBICY ──────────────────────────────────────────────────────────────────

interface JobicyJob {
  id: string;
  jobTitle: string;
  companyName: string;
  jobGeo: string;
  jobIndustry: string[];
  jobType: string[];
  jobLevel: string;
  jobExcerpt: string;
  jobDescription: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  salaryPeriod: string;
  pubDate: string;
  url: string;
}

export async function fetchJobicy(count: number = 100): Promise<RawJob[]> {
  try {
    const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=${count}`, {
      headers: { "User-Agent": "BuscayCurra/1.0 (job aggregator; contacto@buscaycurra.es)" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs: any[] = data.jobs || [];

    return jobs.map((j: JobicyJob) => {
      let salario = "";
      if (j.salaryMin && j.salaryMax && j.salaryCurrency) {
        const period = j.salaryPeriod === "yearly" ? "año" : j.salaryPeriod || "año";
        salario = `${j.salaryMin}-${j.salaryMax} ${j.salaryCurrency}/${period}`;
      }

      return {
        titulo: (j.jobTitle || "").slice(0, 255),
        empresa: j.companyName || "Empresa",
        ubicacion: j.jobGeo || "Remoto",
        salario,
        descripcion: cleanHtml(j.jobDescription || j.jobExcerpt || ""),
        url: j.url || "",
        fecha: j.pubDate || new Date().toISOString(),
        fuente: "JOBICY",
      };
    });
  } catch (e: any) {
    console.error("[Jobicy] Error:", e?.message?.slice(0, 100));
    return [];
  }
}

// ─── REMOTIVE ────────────────────────────────────────────────────────────────

interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  candidate_required_location: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  salary: string;
  description: string;
  url: string;
}

export async function fetchRemotive(limit: number = 100): Promise<RawJob[]> {
  try {
    const res = await fetch(`https://remotive.com/api/remote-jobs?limit=${limit}`, {
      headers: { "User-Agent": "BuscayCurra/1.0 (job aggregator; contacto@buscaycurra.es)" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs: RemotiveJob[] = data.jobs || [];

    return jobs.map((j: RemotiveJob) => ({
      titulo: (j.title || "").slice(0, 255),
      empresa: j.company_name || "Empresa",
      ubicacion: j.candidate_required_location || "Remoto",
      salario: j.salary || "",
      descripcion: cleanHtml(j.description || ""),
      url: j.url || "",
      fecha: j.publication_date || new Date().toISOString(),
      fuente: "REMOTIVE",
    }));
  } catch (e: any) {
    console.error("[Remotive] Error:", e?.message?.slice(0, 100));
    return [];
  }
}

// ─── Sync completo ───────────────────────────────────────────────────────────

interface SyncResult {
  muse: { total: number; pageCount: number; inserted: number; pages: number };
  jobicy: { inserted: number };
  remotive: { inserted: number };
  devitjobs: Record<string, number>;
}

// ─── DEVITJOBS NETWORK (XML feeds, tech jobs con salario) ────────────────────

const DEVITJOBS_FEEDS: Record<string, string> = {
  "UK": "https://devitjobs.uk/job_feed.xml",
  "DE": "https://germantechjobs.de/job_feed.xml",
  "FR": "https://devitjobs.fr/job_feed.xml",
  "NL": "https://devitjobs.nl/job_feed.xml",
  "CH": "https://swissdevjobs.ch/job_feed.xml",
};

function parseXMLJobs(xml: string): RawJob[] {
  // Simple regex-based XML parser (no native XML parser in Node standard lib)
  const jobs: RawJob[] = [];
  const jobBlocks = xml.split(/<job\s/);
  
  for (let i = 1; i < jobBlocks.length; i++) {
    try {
      const block = jobBlocks[i];
      const getTag = (tag: string): string => {
        const m = block.match(new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[)?([^\\]<>]*?)(?:\\]\\]>)?\\s*</${tag}>`, 'i'));
        return m ? m[1].trim() : '';
      };
      
      const title = getTag('title') || getTag('name');
      const company = getTag('company') || getTag('company-name');
      const country = getTag('country');
      const city = getTag('city');
      const location = getTag('location') || city;
      const salary = getTag('salary');
      const description = getTag('description');
      const url = getTag('url') || getTag('link') || getTag('apply_url');
      const pubdate = getTag('pubdate');
      const jobtype = getTag('jobtype') || getTag('job-type');
      
      if (!title || !company) continue;
      
      const countryMap: Record<string, string> = {
        'united kingdom': 'UK', 'uk': 'UK', 'england': 'UK',
        'germany': 'DE', 'deutschland': 'DE',
        'france': 'FR',
        'netherlands': 'NL', 'the netherlands': 'NL', 'nederland': 'NL',
        'switzerland': 'CH', 'schweiz': 'CH', 'suisse': 'CH',
      };
      
      let countryCode: string | undefined = countryMap[country?.toLowerCase()] || undefined;
      const locationStr = [location, country].filter(Boolean).join(', ');
      const fullTitle = jobtype ? `${title} (${jobtype})` : title;
      
      jobs.push({
        titulo: fullTitle.slice(0, 255),
        empresa: company.slice(0, 255),
        ubicacion: locationStr.slice(0, 255),
        salario: salary || '',
        descripcion: description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000) || '',
        url: url || '',
        fecha: pubdate || new Date().toISOString(),
        fuente: `DEVITJOBS`,
        country: countryCode,
      });
    } catch {
      // skip malformed entries
    }
  }
  return jobs;
}

async function fetchDevITJobs(countryCode: string, feedUrl: string): Promise<RawJob[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "BuscayCurra/1.0 (job aggregator; contacto@buscaycurra.es)" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const jobs = parseXMLJobs(xml);
    console.log(`[DevITJobs] ${countryCode}: ${jobs.length} jobs from XML feed`);
    return jobs;
  } catch (e: any) {
    console.error(`[DevITJobs] Error ${countryCode}:`, e?.message?.slice(0, 100));
    return [];
  }
}

export async function syncGlobalFreeAPIs(musePages: number = 10, museStartPage: number = 1): Promise<SyncResult> {
  console.log(`[GlobalAPIs] Iniciando sync (Muse: ${musePages} pages desde ${museStartPage}, Jobicy, Remotive)...`);

  // The Muse — paginado con offset persistente
  let museInserted = 0;
  let museTotal = 0;
  let musePageCount = 0;
  let lastOkPage = museStartPage - 1;
  for (let page = museStartPage; page < museStartPage + musePages; page++) {
    const { jobs, total, pageCount } = await fetchMusePage(page);
    museTotal = total;
    musePageCount = pageCount;
    if (jobs.length === 0) {
      // Si la página 25000+ está vacía, reiniciar
      if (page > total / 20) { lastOkPage = 0; } // wrap around
      break;
    }
    const n = await guardarOfertas(jobs);
    museInserted += n;
    lastOkPage = page;
    // Rate limit: 200ms entre páginas (más agresivo pero seguro)
    if (page < museStartPage + musePages - 1) await new Promise(r => setTimeout(r, 200));
  }

  // Jobicy
  const jobicyJobs = await fetchJobicy(100);
  const jobicyInserted = await guardarOfertas(jobicyJobs);

  // Remotive
  const remotiveJobs = await fetchRemotive(100);
  const remotiveInserted = await guardarOfertas(remotiveJobs);

  // DevITJobs network (UK, DE, FR, NL, CH)
  const devitjobs: Record<string, number> = {};
  for (const [cc, feedUrl] of Object.entries(DEVITJOBS_FEEDS)) {
    const jobs = await fetchDevITJobs(cc, feedUrl);
    devitjobs[cc] = await guardarOfertas(jobs);
  }

  console.log(`[GlobalAPIs] Sync completado — Muse: ${museInserted}, Jobicy: ${jobicyInserted}, Remotive: ${remotiveInserted}, DevITJobs: ${Object.values(devitjobs).reduce((a,b) => a+b, 0)}`);

  return {
    muse: { total: museTotal, pageCount: musePageCount, inserted: museInserted, pages: musePages },
    jobicy: { inserted: jobicyInserted },
    remotive: { inserted: remotiveInserted },
    devitjobs,
  };
}
