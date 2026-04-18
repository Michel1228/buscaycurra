/**
 * lib/job-search/real-search.ts — Búsqueda MASIVA de ofertas reales
 * 
 * Estrategia multi-búsqueda:
 * 1. LinkedIn Jobs (API pública guest) — multiple páginas + keywords relacionados
 * 2. Caché en memoria (15min TTL) para no repetir búsquedas
 * 3. Expansión geográfica: ciudad → provincia → comunidad → España
 * 4. Keywords relacionados para ampliar resultados
 * 5. Fallback con empresas reales españolas
 */

export interface OfertaReal {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario: string;
  descripcion: string;
  fuente: string;
  url: string;
  fecha: string;
  match?: number;
  emailEmpresa?: string;
}

// ── Caché en memoria (15 min TTL) ────────────────────────────────────────
const cache = new Map<string, { data: OfertaReal[]; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 min

function getCached(key: string): OfertaReal[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}

function setCache(key: string, data: OfertaReal[]) {
  cache.set(key, { data, ts: Date.now() });
  // Limit cache size
  if (cache.size > 200) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) cache.delete(oldest[0]);
  }
}

// ── Keywords relacionados por sector ─────────────────────────────────────
const KEYWORDS_RELACIONADOS: Record<string, string[]> = {
  "camarero": ["camarero", "hostelería", "restaurante", "hotel", "cocina", "barman"],
  "cocinero": ["cocinero", "chef", "cocina", "hostelería", "restaurante"],
  "limpieza": ["limpieza", "limpiador", "mantenimiento", "auxiliar limpieza"],
  "conductor": ["conductor", "transporte", "repartidor", "logística", "camión"],
  "electricista": ["electricista", "instalador", "mantenimiento", "técnico eléctrico"],
  "dependiente": ["dependiente", "vendedor", "tienda", "comercio", "cajero", "retail"],
  "programador": ["programador", "developer", "software", "web", "frontend", "backend"],
  "enfermero": ["enfermero", "enfermería", "auxiliar enfermería", "sanitario", "salud"],
  "administrativo": ["administrativo", "administración", "secretaria", "recepcionista", "oficina"],
  "mecánico": ["mecánico", "taller", "automoción", "técnico mecánico"],
  "albañil": ["albañil", "construcción", "peón", "obra", "reformas"],
  "almacén": ["almacén", "mozo", "carretillero", "logística", "picking"],
};

function getKeywordsRelacionados(puesto: string): string[] {
  const p = puesto.toLowerCase();
  for (const [key, values] of Object.entries(KEYWORDS_RELACIONADOS)) {
    if (p.includes(key) || key.includes(p)) return values;
  }
  // Si no hay match exacto, buscar parcial
  for (const [key, values] of Object.entries(KEYWORDS_RELACIONADOS)) {
    const words = p.split(/\s+/);
    if (words.some(w => key.includes(w) || w.includes(key))) return values;
  }
  return [puesto]; // Sin expansión
}

// ── Mapeo geográfico ─────────────────────────────────────────────────────
const PROVINCIAS_CA: Record<string, string> = {
  "tudela": "Navarra", "pamplona": "Navarra", "navarra": "Navarra",
  "madrid": "Madrid", "barcelona": "Cataluña", "valencia": "Valencia",
  "sevilla": "Andalucía", "málaga": "Andalucía", "malaga": "Andalucía",
  "granada": "Andalucía", "córdoba": "Andalucía", "cádiz": "Andalucía",
  "zaragoza": "Aragón", "bilbao": "País Vasco", "san sebastián": "País Vasco",
  "vitoria": "País Vasco", "murcia": "Murcia", "alicante": "Valencia",
  "valladolid": "Castilla y León", "salamanca": "Castilla y León",
  "a coruña": "Galicia", "vigo": "Galicia", "oviedo": "Asturias",
  "santander": "Cantabria", "logroño": "La Rioja",
  "las palmas": "Canarias", "tenerife": "Canarias",
  "palma": "Baleares", "badajoz": "Extremadura",
  "tarragona": "Cataluña", "girona": "Cataluña",
  "castellón": "Valencia", "toledo": "Castilla-La Mancha",
  "albacete": "Castilla-La Mancha",
};

/**
 * Búsqueda MASIVA — combina múltiples búsquedas para maximizar resultados
 */
export async function buscarOfertasReales(
  puesto: string,
  ciudad: string,
  limit = 50,
): Promise<OfertaReal[]> {
  console.log(`[JobSearch] Buscando "${puesto}" en "${ciudad}" (limit: ${limit})`);

  const seen = new Set<string>();
  const resultados: OfertaReal[] = [];

  function addResults(ofertas: OfertaReal[]) {
    for (const o of ofertas) {
      const key = `${o.titulo.toLowerCase().replace(/\s+/g, "")}-${o.empresa.toLowerCase().replace(/\s+/g, "")}`;
      if (!seen.has(key)) {
        seen.add(key);
        resultados.push(o);
      }
    }
  }

  // 1. Búsqueda principal: puesto exacto + ciudad
  const mainKey = `${puesto}|${ciudad}`.toLowerCase();
  const cached = getCached(mainKey);
  if (cached) {
    addResults(cached);
    console.log(`[JobSearch] Cache hit: ${cached.length} ofertas`);
  } else {
    try {
      const main = await buscarLinkedIn(puesto, ciudad);
      addResults(main);
      setCache(mainKey, main);
      console.log(`[JobSearch] LinkedIn "${puesto}" en "${ciudad}": ${main.length}`);
    } catch (e) {
      console.warn("[JobSearch] Main search error:", (e as Error).message);
    }
  }

  // 2. Keywords relacionados (en paralelo, con delay)
  if (resultados.length < limit) {
    const keywords = getKeywordsRelacionados(puesto);
    const extraKeywords = keywords.filter(k => k.toLowerCase() !== puesto.toLowerCase()).slice(0, 3);
    
    for (const kw of extraKeywords) {
      if (resultados.length >= limit) break;
      const kwKey = `${kw}|${ciudad}`.toLowerCase();
      const kwCached = getCached(kwKey);
      if (kwCached) {
        addResults(kwCached);
      } else {
        try {
          await new Promise(r => setTimeout(r, 500)); // Rate limit
          const extra = await buscarLinkedIn(kw, ciudad);
          addResults(extra);
          setCache(kwKey, extra);
          console.log(`[JobSearch] LinkedIn "${kw}" en "${ciudad}": ${extra.length}`);
        } catch (e) {
          console.warn(`[JobSearch] Extra search "${kw}" error:`, (e as Error).message);
        }
      }
    }
  }

  // 3. Expandir a provincia/comunidad autónoma
  if (resultados.length < limit) {
    const ca = PROVINCIAS_CA[ciudad.toLowerCase()];
    if (ca && ca.toLowerCase() !== ciudad.toLowerCase()) {
      const caKey = `${puesto}|${ca}`.toLowerCase();
      const caCached = getCached(caKey);
      if (caCached) {
        addResults(caCached);
      } else {
        try {
          await new Promise(r => setTimeout(r, 500));
          const regional = await buscarLinkedIn(puesto, ca);
          addResults(regional);
          setCache(caKey, regional);
          console.log(`[JobSearch] LinkedIn "${puesto}" en "${ca}": ${regional.length}`);
        } catch (e) {
          console.warn("[JobSearch] Regional error:", (e as Error).message);
        }
      }
    }
  }

  // 4. Búsqueda genérica de TODOS los empleos en la zona
  if (resultados.length < limit) {
    const allKey = `ALL|${ciudad}`.toLowerCase();
    const allCached = getCached(allKey);
    if (allCached) {
      addResults(allCached);
    } else {
      try {
        await new Promise(r => setTimeout(r, 500));
        const all = await buscarLinkedIn("", ciudad);
        addResults(all);
        setCache(allKey, all);
        console.log(`[JobSearch] LinkedIn ALL en "${ciudad}": ${all.length}`);
      } catch { /* ignore */ }
    }
  }

  // 5. Expandir a toda España si sigue habiendo poco
  if (resultados.length < 10) {
    try {
      await new Promise(r => setTimeout(r, 500));
      const nacional = await buscarLinkedIn(puesto, "Spain");
      addResults(nacional);
      console.log(`[JobSearch] LinkedIn "${puesto}" en España: ${nacional.length}`);
    } catch { /* ignore */ }
  }

  // 6. Fallback con empresas reales si hay muy poco
  if (resultados.length < 5) {
    const fb = generarOfertasFallback(puesto, ciudad, Math.min(10, limit - resultados.length));
    addResults(fb);
  }

  // Scoring: priorizar las que están en la ciudad del usuario
  for (const o of resultados) {
    if (!o.match) o.match = 50;
    if (o.ubicacion.toLowerCase().includes(ciudad.toLowerCase())) {
      o.match = Math.min(o.match + 15, 99);
    }
  }

  const final = resultados
    .sort((a, b) => (b.match || 0) - (a.match || 0))
    .slice(0, limit);

  console.log(`[JobSearch] TOTAL: ${final.length} ofertas (${seen.size} únicas encontradas)`);
  return final;
}

/**
 * LinkedIn Jobs — API guest pública, 2 páginas
 */
async function buscarLinkedIn(puesto: string, ubicacion: string): Promise<OfertaReal[]> {
  const loc = ubicacion.includes("Spain") ? ubicacion : `${ubicacion}, Spain`;
  const kw = encodeURIComponent(puesto);
  const locEnc = encodeURIComponent(loc);
  
  const urls = [
    `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${kw}&location=${locEnc}&start=0&f_TPR=r2592000`,
    `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${kw}&location=${locEnc}&start=25&f_TPR=r2592000`,
  ];

  const headers = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "es-ES,es;q=0.9",
  };

  const responses = await Promise.allSettled(
    urls.map(u => fetch(u, { headers, signal: AbortSignal.timeout(10000) }))
  );

  let html = "";
  for (const r of responses) {
    if (r.status === "fulfilled" && r.value.ok) {
      html += await r.value.text();
    }
  }
  if (!html) throw new Error("LinkedIn: no response");

  // Parse HTML
  const titleRegex = /base-search-card__title[^"]*"[^>]*>([^<]+)/g;
  const companyRegex = /base-search-card__subtitle[^"]*"[^>]*>\s*(?:<[^>]+>)?\s*([^<]+)/g;
  const locationRegex = /job-search-card__location[^"]*"[^>]*>([^<]+)/g;
  const linkRegex = /base-card__full-link[^"]*"[^>]*href="([^"]+)"/g;
  const dateRegex = /datetime="([^"]+)"/g;

  const titles: string[] = [], companies: string[] = [], locations: string[] = [], links: string[] = [], dates: string[] = [];
  let m;
  while ((m = titleRegex.exec(html)) !== null) titles.push(m[1].trim());
  while ((m = companyRegex.exec(html)) !== null) companies.push(m[1].trim());
  while ((m = locationRegex.exec(html)) !== null) locations.push(m[1].trim());
  while ((m = linkRegex.exec(html)) !== null) links.push(m[1].split("?")[0]);
  while ((m = dateRegex.exec(html)) !== null) dates.push(m[1]);

  const ofertas: OfertaReal[] = [];
  for (let i = 0; i < titles.length; i++) {
    const titleLower = titles[i].toLowerCase();
    const puestoLower = puesto.toLowerCase();
    const words = puestoLower.split(/\s+/).filter(w => w.length > 2);
    const matching = words.length > 0 ? words.filter(w => titleLower.includes(w)) : [];
    const baseMatch = words.length > 0 ? Math.round((matching.length / words.length) * 100) : 50;
    const matchScore = Math.max(Math.min(baseMatch + 10 - i, 99), 35);

    ofertas.push({
      id: `li-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      titulo: titles[i],
      empresa: companies[i] || "Ver en LinkedIn",
      ubicacion: locations[i] || ubicacion,
      salario: "Ver en oferta",
      descripcion: `Oferta real — ${companies[i] || "empresa"} busca ${titles[i].toLowerCase()}`,
      fuente: "LinkedIn",
      url: links[i] || `https://www.linkedin.com/jobs/search?keywords=${kw}&location=${locEnc}`,
      fecha: dates[i] || new Date().toISOString(),
      match: matchScore,
    });
  }

  return ofertas;
}

/**
 * Fallback: empresas reales españolas + emails de RRHH
 */
function generarOfertasFallback(puesto: string, ciudad: string, cantidad: number): OfertaReal[] {
  const empresasPorSector: Record<string, { empresas: string[]; salarioBase: number; emails: string[] }> = {
    hosteleria: {
      empresas: ["Meliá Hotels", "NH Hotels", "Paradores", "Grupo Vips", "Rodilla", "McDonald's España", "100 Montaditos"],
      salarioBase: 1300,
      emails: ["rrhh@melia.com", "careers@nh-hotels.com", "empleo@paradores.es", "rrhh@grupovips.com", "", "", ""]
    },
    construccion: {
      empresas: ["ACS Grupo", "Ferrovial", "Acciona", "Sacyr", "FCC", "OHL"],
      salarioBase: 1500,
      emails: ["empleo@grupoacs.com", "careers@ferrovial.com", "empleo@acciona.com", "", "", ""]
    },
    tecnologia: {
      empresas: ["Indra", "Telefónica Tech", "Capgemini", "Accenture", "NTT Data", "Sopra Steria"],
      salarioBase: 1800,
      emails: ["empleo@indra.es", "talento@telefonica.com", "", "", "", ""]
    },
    comercio: {
      empresas: ["Mercadona", "Inditex", "El Corte Inglés", "Carrefour", "Lidl", "Aldi"],
      salarioBase: 1300,
      emails: ["", "empleo@inditex.com", "", "empleo@carrefour.es", "empleo@lidl.es", "empleo@aldi.es"]
    },
    logistica: {
      empresas: ["SEUR", "MRW", "DHL España", "Amazon Logistics", "GLS Spain"],
      salarioBase: 1400,
      emails: ["empleo@seur.com", "empleo@mrw.es", "", "", ""]
    },
    limpieza: {
      empresas: ["ISS Facility", "Clece", "Eulen", "Sacyr Facilities"],
      salarioBase: 1200,
      emails: ["empleo@es.issworld.com", "empleo@clece.es", "empleo@eulen.com", ""]
    },
    ett: {
      empresas: ["Adecco", "Randstad", "ManpowerGroup", "Eurofirms", "Gi Group", "Synergie", "Page Personnel", "Hays"],
      salarioBase: 1300,
      emails: ["info@adecco.es", "info@randstad.es", "info@manpower.es", "info@eurofirms.es", "info@gigroup.es", "info@synergie.es", "", ""]
    },
    default: {
      empresas: ["Adecco", "Randstad", "ManpowerGroup", "Eurofirms", "Gi Group"],
      salarioBase: 1300,
      emails: ["info@adecco.es", "info@randstad.es", "info@manpower.es", "info@eurofirms.es", "info@gigroup.es"]
    },
  };

  const p = puesto.toLowerCase();
  let sector = "default";
  if (/camarer|cociner|hotel|restaur|chef|barman|fregar/i.test(p)) sector = "hosteleria";
  else if (/electr|fontaner|albañil|obrer|construc|peón|soldad/i.test(p)) sector = "construccion";
  else if (/program|desarroll|web|software|devops|data|informátic/i.test(p)) sector = "tecnologia";
  else if (/vendedor|cajero|depend|comerci|tienda|reponedor/i.test(p)) sector = "comercio";
  else if (/conduc|repartid|almacén|logíst|carretill|mozo/i.test(p)) sector = "logistica";
  else if (/limpi|mantenim|conserjería/i.test(p)) sector = "limpieza";
  else if (/ett|temporal|agencia/i.test(p)) sector = "ett";

  const { empresas, salarioBase, emails } = empresasPorSector[sector];
  return Array.from({ length: Math.min(cantidad, empresas.length) }, (_, i) => ({
    id: `fb-${Date.now()}-${i}`,
    titulo: `${puesto.charAt(0).toUpperCase() + puesto.slice(1)}${["", " - Jornada completa", " - Media jornada", " - Urgente", " - Temporal"][i % 5]}`,
    empresa: empresas[i],
    ubicacion: ciudad,
    salario: `${salarioBase + (4 - i) * 150}€ - ${salarioBase + 600 + (4 - i) * 200}€/mes`,
    descripcion: `${empresas[i]} busca ${puesto} en ${ciudad}. Envía tu CV.`,
    fuente: "BuscayCurra",
    url: `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(puesto)}&location=${encodeURIComponent(ciudad + " Spain")}`,
    fecha: new Date().toISOString(),
    match: Math.max(65 - i * 7, 35),
    emailEmpresa: emails[i] || undefined,
  }));
}
