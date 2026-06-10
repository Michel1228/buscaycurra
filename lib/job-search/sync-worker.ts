/**
 * lib/job-search/sync-worker.ts v2
 * Descarga masiva de ofertas desde APIs y las guarda en la BD PostgreSQL local.
 * Ahora con MÁS keywords, MÁS ciudades, y MÁS fuentes.
 */
import { createHash } from "crypto";
import { getPool } from "@/lib/db";
import { getAdzunaKey, getJoobleKey, getCareerjetKey, reportFailure } from "./api-pool";

export const SECTORES = [
  { sector: "HOSTELERIA", keywords: ["camarero", "cocinero", "chef", "hosteleria", "barman", "recepcionista hotel", "ayudante cocina", "pizzero", "panadero", "jefe cocina", "maitre", "sommelier", "pastelero", "cocinero colectividades", "encargado bar", "animador turistico", "guia turismo", "fregaplatos", "limpieza cocina", "mozo almacen hosteleria"] },
  { sector: "INDUSTRIA", keywords: ["operario", "produccion", "manufactura", "soldador", "electromecanico", "mecanico industrial", "tornero", "caldereria", "operario almacen", "mecanico", "montador", "tecnico mantenimiento", "operario fabrica", "control calidad", "maquinista", "pintor industrial", "trefilador", "estampador", "inyeccion plastico"] },
  { sector: "OFICINA", keywords: ["administrativo", "contable", "secretaria", "recursos humanos", "recepcionista", "atencion al cliente", "facturacion", "gestion administrativa", "abogado", "economista", "controller financiero", "project manager", "office manager", "auxiliar administrativo", "teleoperador", "data entry", "community manager"] },
  { sector: "COMERCIO", keywords: ["dependiente", "vendedor", "cajero", "comercial", "ventas", "reponedor", "promotor", "agente comercial", "asesor comercial", "gerente tienda", "jefe ventas", "teleoperador ventas", "visual merchandiser", "agente seguros", "consultor inmobiliario", "comprador", "exportacion"] },
  { sector: "SALUD", keywords: ["enfermero", "auxiliar enfermeria", "medico", "farmaceutico", "fisioterapeuta", "cuidador", "auxiliar clinica", "tecnico sanitario", "psicologo", "terapeuta", "logopeda", "optometrista", "radiologo", "celador", "ordenanza hospital", "tecnico laboratorio", "auxiliar geriatria", "cuidador personas mayores"] },
  { sector: "EDUCACION", keywords: ["profesor", "maestro", "educador", "monitor", "tutor", "educador social", "auxiliar educacion", "formador", "profesor idiomas", "profesor primaria", "profesor secundaria", "pedagogo", "orientador educativo", "bibliotecario", "coordinador extraescolar"] },
  { sector: "TECNOLOGIA", keywords: ["programador", "desarrollador", "software", "frontend", "backend", "data scientist", "devops", "informatica", "sistemas", "ingeniero", "arquitecto software", "ciberseguridad", "administrador sistemas", "cloud", "machine learning", "qa tester", "product manager", "scrum master", "ux ui", "analista datos", "blockchain", "fullstack", "mobile developer"] },
  { sector: "CONSTRUCCION", keywords: ["albanil", "electricista", "fontanero", "pintor", "carpintero", "construccion", "peon", "reformas", "instalador", "jefe obra", "aparejador", "delineante", "soldador tig", "gruista", "operador maquinaria", "instalador climatizacion", "encofrador", "hormigon", "impermeabilizacion", "revestimientos", "escayolista"] },
  { sector: "TRANSPORTE", keywords: ["conductor", "repartidor", "logistica", "carretillero", "mensajero", "transportista", "mozo almacen", "picking", "chofer", "conductor camion", "conductor autobus", "peón carga", "coordinador logistica", "despachador", "planificador rutas", "agente aduanas"] },
  { sector: "OTRO", keywords: ["limpieza", "vigilante", "seguridad", "jardinero", "peluquero", "estetica", "cuidador personas mayores", "auxiliar servicios", "mantenimiento", "recepcionista", "azafata", "mozo eventos", "camarera piso", "planchador", "costurera", "zapatero", "mecanico vehiculos", "chapista", "electricista automocion", "montador muebles", "decorador", "fotografo", "camarografo", "periodista", "traductor", "interprete"] },
] as const;

export const CIUDADES = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza",
  "Malaga", "Murcia", "Bilbao", "Alicante", "Cordoba",
  "Valladolid", "Vigo", "Gijon", "Granada", "La Coruna",
  "Vitoria", "Pamplona", "Santander", "Logrono", "Burgos",
  "Leon", "Oviedo", "Almeria", "Huelva", "Badajoz",
  "Toledo", "Albacete", "Jaen", "Tarragona", "Lleida",
  "Girona", "Castellon", "Salamanca", "Segovia", "Tudela",
  "Calahorra", "Huesca", "Teruel", "Cadiz", "Jerez",
  "Las Palmas", "Santa Cruz de Tenerife", "Palma", "San Sebastian",
  "Elche", "Cartagena", "Getafe", "Mostoles", "Alcala de Henares",
  "Hospitalet", "Badalona", "Terrassa", "Sabadell", "Leganes",
  "Fuenlabrada", "Almeria", "Dos Hermanas", "Torrejon", "Parla",
  "Mataro", "Cornella", "Alcorcon", "Coslada", "Ourense",
  "Pontevedra", "Lugo", "Santiago de Compostela", "Ferrol",
  "Aviles", "Langreo", "Mieres", "Palencia", "Zamora",
  "Soria", "Guadalajara", "Cuenca", "Ciudad Real", "Puertollano",
  "Merida", "Caceres", "Plasencia", "Don Benito", "Villanueva de la Serena",
  "Linares", "Andujar", "Ubeda", "Motril", "El Ejido",
  "Roquetas de Mar", "Adra", "Almunecar", "Salobreña", "Baza",
  "Guadix", "Lorca", "Molina de Segura", "San Javier", "Los Alcazares",
  "Totana", "Alhama de Murcia", "Yecla", "Jumilla", "Caravaca de la Cruz",
  "Cehegin", "Bullas", "Calasparra", "Moratalla", "Aguilas",
  "Mazarron", "San Pedro del Pinatar", "Torre Pacheco", "Fuente Alamo", "La Union",
  "Cartaya", "Lepe", "Isla Cristina", "Ayamonte", "Punta Umbria",
  "Almonte", "Bollullos", "Moguer", "Niebla", "Palos de la Frontera",
  "Aracena", "Cortegana", "Jabugo", "Aroche", "Cumbres Mayores",
  "Zafra", "Jerez de los Caballeros", "Villafranca de los Barros", "Almendralejo", "Montijo",
  "Merida", "Caceres", "Plasencia", "Coria", "Navalmoral de la Mata",
  "Talayuela", "Trujillo", "Montanchez", "Jaraiz de la Vera", "Cuacos de Yuste",
  "Talavera de la Reina", "Illescas", "Seseña", "Yuncos", "Bargas",
  "Torrijos", "Ocaña", "Quintanar de la Orden", "Madridejos", "Consuegra",
  "Mora", "La Puebla de Montalban", "Los Navalucillos", "Pepino", "San Martin de Valdeiglesias",
  "Aranjuez", "Chinchon", "Colmenar de Oreja", "Valdemoro", "Pinto",
  "Parla", "Fuenlabrada", "Humanes de Madrid", "Griñon", "Serranillos del Valle",
  "Moraleja de Enmedio", "Cubas de la Sagra", "Torrejon de Velasco", "Yeles", "Esquivias",
  "Illescas", "Numancia de la Sagra", "Borox", "Cedillo del Condado", "Santa Cruz de la Zarza",
  "Villacañas", "Quintanar de la Orden", "La Villa de Don Fadrique", "Tembleque", "Miguel Esteban",
  "La Puebla de Almoradiel", "El Toboso", "Quero", "Santa Cruz de Mudela", "Alcazar de San Juan",
  "Campo de Criptana", "Tomelloso", "Socuellamos", "La Solana", "Daimiel",
  "Manzanares", "Valdepeñas", "Membrilla", "Infantes", "Villanueva de los Infantes",
  "Almagro", "Bolaños de Calatrava", "Miguelturra", "Ciudad Real", "Puertollano",
  "Alcudia", "Almodovar del Campo", "Fernan Nuñez", "Montilla", "Puente Genil",
  "Lucena", "Cabra", "Priego de Cordoba", "Baena", "Montemayor",
  "Espejo", "Castro del Rio", "Fernan-Nuñez", "Montalban de Cordoba", "Doña Mencia",
  "Rute", "Iznajar", "Luque", "Zuheros", "Carcabuey",
  "Alcaudete", "Alcalá la Real", "Bailen", "Linares", "Jodar",
  "Mancha Real", "Torreperogil", "Ubeda", "Baeza", "Villacarrillo",
  "Sabiote", "La Carolina", "Santa Elena", "Santisteban del Puerto", "Navas de San Juan",
  "Arquillos", "Lupion", "Jabalquinto", "Mengibar", "Villardompardo",
  "Torredonjimeno", "Martos", "Torredelcampo", "Jaen", "Andujar",
  "Villanueva del Arzobispo", "Alcaudete", "Porcuna", "Higuera de Calatrava", "Arjona",
  "Marmolejo", "Lopera", "Bujalance", "Cardena", "Villa del Rio",
  "Montoro", "Pedro Abad", "El Carpio", "La Rambla", "Palma del Rio",
  "Posadas", "Almodovar del Rio", "Fuente Palmera", "Guadalcazar", "Villaviciosa de Cordoba",
  "Espiel", "Belmez", "Peñarroya-Pueblonuevo", "Valsequillo", "Villafranca de Cordoba",
  "Priego de Cordoba", "Iznajar", "Rute", "Lucena", "Cabra",
  "Baena", "Castro del Rio", "Espejo", "Montemayor", "Doña Mencia",
  "Montalban de Cordoba", "Fernan-Nuñez", "La Carlota", "Palma del Rio", "Posadas",
  "Almodovar del Rio", "Fuente Palmera", "Guadalcazar", "Villaviciosa de Cordoba", "Espiel",
  "Belmez", "Peñarroya-Pueblonuevo", "Valsequillo", "Villafranca de Cordoba", "Santaella",
  "La Rambla", "Montilla", "Montalban de Cordoba", "Fernan-Nuñez", "La Carlota",
  "Palma del Rio", "Posadas", "Almodovar del Rio", "Fuente Palmera", "Guadalcazar",
  "Villaviciosa de Cordoba", "Espiel", "Belmez", "Peñarroya-Pueblonuevo", "Valsequillo",
  "Villafranca de Cordoba", "Santaella", "La Rambla", "Montilla", "Puente Genil",
  "Lucena", "Cabra", "Priego de Cordoba", "Baena", "Montemayor",
  "Espejo", "Castro del Rio", "Fernan-Nuñez", "Montalban de Cordoba", "Doña Mencia",
  "Rute", "Iznajar", "Luque", "Zuheros", "Carcabuey",
  "Alcaudete", "Alcalá la Real", "Bailen", "Linares", "Jodar",
  "Mancha Real", "Torreperogil", "Ubeda", "Baeza", "Villacarrillo",
] as const;

type JobSector = typeof SECTORES[number]["sector"];

function makeId(title: string, company: string, city: string, source: string): string {
  // Usar campos estables (NO la URL, que cambia en cada petición a Careerjet)
  const normalized = `${title}|${company}|${city}|${source}`
    .toLowerCase()
    .replace(/[^a-z0-9|ñáéíóúü]/g, "")
    .trim();
  return createHash("md5").update(normalized).digest("hex").slice(0, 24);
}

interface RawJob {
  source: string;
  url: string;
  title: string;
  company: string;
  city: string;
  description: string;
  salary: string;
}

async function fetchJooble(keyword: string, city: string, page = 1): Promise<RawJob[]> {
  const keyInfo = await getJoobleKey();
  if (!keyInfo) return [];
  try {
    const res = await fetch(`https://jooble.org/api/${keyInfo.key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: keyword, location: city + ", Spain", page, resultonpage: 20 }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { await reportFailure("jooble", keyInfo.idx, res.status); return []; }
    const data = await res.json();
    return (data.jobs || []).map((j: Record<string, string>) => ({
      source: "Jooble",
      url: j.link || "",
      title: (j.title || keyword).replace(/<[^>]+>/g, "").slice(0, 200),
      company: (j.company || "Ver en oferta").slice(0, 200),
      city,
      description: (j.snippet || "").replace(/<[^>]+>/g, "").slice(0, 1000),
      salary: (j.salary || "Ver en oferta").slice(0, 100),
    }));
  } catch { return []; }
}

// ─── Adzuna multi-país ───────────────────────────────────────────────────────

const ADZUNA_COUNTRIES: Record<string, { code: string; cc: string; name: string }> = {
  es: { code: "es", cc: "ES", name: "España" },
  uk: { code: "gb", cc: "UK", name: "Reino Unido" },
  us: { code: "us", cc: "US", name: "Estados Unidos" },
  de: { code: "de", cc: "DE", name: "Alemania" },
  fr: { code: "fr", cc: "FR", name: "Francia" },
  au: { code: "au", cc: "AU", name: "Australia" },
};

// Keywords en inglés para países no hispanohablantes
const GLOBAL_KEYWORDS = [
  "developer", "nurse", "driver", "cleaner", "teacher", "accountant", "sales",
  "manager", "engineer", "electrician", "chef", "waiter", "security", "receptionist",
  "administrator", "labourer", "carpenter", "plumber", "mechanic", "designer",
  "analyst", "marketing", "hr", "consultant", "technician", "assistant", "supervisor",
  "operator", "clerk", "cook", "warehouse", "delivery", "retail", "barista",
  "data scientist", "project manager", "software engineer", "devops", "full stack",
  "frontend", "backend", "cloud", "cyber security", "machine learning",
];

// Keywords en francés para FR
const FR_KEYWORDS = [
  "developpeur", "infirmier", "chauffeur", "nettoyage", "enseignant", "comptable",
  "vendeur", "manager", "ingenieur", "electricien", "chef", "serveur", "securite",
  "receptionniste", "administrateur", "ouvrier", "menuisier", "plombier", "mecanicien",
  "analyste", "marketing", "rh", "consultant", "technicien", "assistant", "superviseur",
  "operateur", "commis", "cuisinier", "entrepot", "livraison", "commercial",
];

// Keywords en alemán para DE
const DE_KEYWORDS = [
  "entwickler", "krankenpfleger", "fahrer", "reinigung", "lehrer", "buchhalter",
  "verkaufer", "manager", "ingenieur", "elektriker", "koch", "kellner", "sicherheit",
  "rezeptionist", "verwaltung", "arbeiter", "schreiner", "klempner", "mechaniker",
  "analyst", "marketing", "personal", "berater", "techniker", "assistent",
  "lager", "lieferung", "einzelhandel", "pflege", "produktion", "logistik",
];

async function fetchAdzuna(keyword: string, city: string, page = 1, countryCode = "es"): Promise<RawJob[]> {
  const keyInfo = await getAdzunaKey();
  if (!keyInfo) return [];
  const cc = ADZUNA_COUNTRIES[countryCode]?.code || "es";
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${cc}/search/${page}?app_id=${keyInfo.id}&app_key=${keyInfo.key}&results_per_page=50&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(city)}&content-type=application/json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) { await reportFailure("adzuna", keyInfo.idx, res.status); return []; }
    const data = await res.json();
    return (data.results || []).map((j: Record<string, unknown>) => {
      const company = j.company as Record<string, string> | undefined;
      const location = j.location as Record<string, unknown> | undefined;
      const salMin = j.salary_min ? Math.round(j.salary_min as number) : 0;
      const salMax = j.salary_max ? Math.round(j.salary_max as number) : 0;
      const salaryStr = salMin && salMax ? `${salMin} - ${salMax}` : "Ver en oferta";
      return {
        source: `ADZUNA_${ADZUNA_COUNTRIES[countryCode]?.cc || "ES"}`,
        url: (j.redirect_url as string) || "",
        title: ((j.title as string) || keyword).replace(/<[^>]+>/g, "").slice(0, 200),
        company: (company?.display_name || "Ver en oferta").slice(0, 200),
        city: ((location?.display_name as string) || city).slice(0, 100),
        description: ((j.description as string) || "").replace(/<[^>]+>/g, "").slice(0, 1000),
        salary: salaryStr,
      };
    });
  } catch { return []; }
}

// ─── Sync masivo Adzuna multi-país ────────────────────────────────────────────

export interface AdzunaCountryConfig {
  code: string;
  keywords: string[];
  cities: string[];
}

export function getAdzunaCountryConfig(countryCode: string): AdzunaCountryConfig {
  const configs: Record<string, AdzunaCountryConfig> = {
    es: { code: "es", keywords: SECTORES.flatMap(s => s.keywords).slice(0, 50), cities: CIUDADES.slice(0, 40) },
    uk: { code: "uk", keywords: GLOBAL_KEYWORDS, cities: ["London","Manchester","Birmingham","Leeds","Liverpool","Bristol","Edinburgh","Glasgow","Cardiff","Belfast","Sheffield","Nottingham","Newcastle","Brighton","Oxford","Cambridge","Leicester","Coventry","Southampton","Portsmouth","Aberdeen","Dundee","Swansea","Exeter","York","Norwich","Plymouth","Bath","Hull","Stoke"] },
    us: { code: "us", keywords: GLOBAL_KEYWORDS, cities: ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","San Jose","Austin","Jacksonville","Fort Worth","Columbus","Charlotte","Indianapolis","San Francisco","Seattle","Denver","Nashville","Oklahoma City","El Paso","Washington","Boston","Las Vegas","Portland","Memphis","Louisville","Baltimore","Milwaukee"] },
    de: { code: "de", keywords: [...GLOBAL_KEYWORDS, ...DE_KEYWORDS], cities: ["Berlin","Munich","Hamburg","Frankfurt","Cologne","Stuttgart","Dusseldorf","Leipzig","Dortmund","Essen","Bremen","Dresden","Hannover","Nuremberg","Bonn","Mannheim","Karlsruhe","Augsburg","Wiesbaden","Munster"] },
    fr: { code: "fr", keywords: [...GLOBAL_KEYWORDS, ...FR_KEYWORDS], cities: ["Paris","Lyon","Marseille","Toulouse","Nice","Nantes","Strasbourg","Montpellier","Bordeaux","Lille","Rennes","Reims","Saint-Etienne","Le Havre","Toulon","Grenoble","Dijon","Angers","Nimes","Villeurbanne"] },
    au: { code: "au", keywords: GLOBAL_KEYWORDS, cities: ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast","Canberra","Newcastle","Hobart","Darwin","Cairns","Townsville","Geelong","Wollongong","Sunshine Coast"] },
  };
  return configs[countryCode] || configs.es;
}

export async function syncAdzunaCountry(
  countryCode: string,
  batchSize: number = 30,
  offset: number = 0
): Promise<{ inserted: number; fetched: number; nextOffset: number; done: boolean; country: string }> {
  const config = getAdzunaCountryConfig(countryCode);
  const combos: Array<{ keyword: string; city: string }> = [];
  for (const kw of config.keywords) {
    for (const city of config.cities) {
      combos.push({ keyword: kw, city });
    }
  }
  
  const batch = combos.slice(offset, offset + batchSize);
  let totalInserted = 0;
  let totalFetched = 0;

  for (const { keyword, city } of batch) {
    const raw = await fetchAdzuna(keyword, city, 1, countryCode);
    totalFetched += raw.length;
    if (raw.length > 0) {
      const inserted = await upsertJobsForSync(raw, "OTRO");
      totalInserted += inserted;
    }
    // Pequeña pausa para no saturar la API
    await new Promise(r => setTimeout(r, 200));
  }

  const nextOffset = offset + batchSize;
  return {
    inserted: totalInserted,
    fetched: totalFetched,
    nextOffset,
    done: nextOffset >= combos.length,
    country: ADZUNA_COUNTRIES[countryCode]?.name || countryCode,
  };
}

async function fetchCareerjet(keyword: string, city: string, page = 1): Promise<RawJob[]> {
  const keyInfo = await getCareerjetKey();
  if (!keyInfo) return [];
  try {
    const url = `https://public.api.careerjet.net/search?locale_code=es_ES&keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(city + " Espana")}&affid=${keyInfo.key}&user_ip=187.124.37.183&user_agent=BuscayCurra%2F1.0&pagesize=20&page=${page}&sort=relevance`;
    const res = await fetch(url, {
      headers: { "Referer": "https://buscaycurra.es" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { await reportFailure("careerjet", keyInfo.idx, res.status); return []; }
    const data = await res.json();
    if (data.type === "ERROR") return [];
    return (data.jobs || []).map((j: Record<string, string>) => ({
      source: "Careerjet",
      url: j.url || "",
      title: (j.title || keyword).replace(/<[^>]+>/g, "").slice(0, 200),
      company: (j.company || "Ver en oferta").slice(0, 200),
      city: (j.locations || city).slice(0, 100),
      description: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 1000),
      salary: (j.salary || "Ver en oferta").slice(0, 100),
    }));
  } catch { return []; }
}

export async function fetchCareerjetGlobal(keyword: string, countryLocation: string, _page = 1): Promise<RawJob[]> {
  // 5 páginas para máximo volumen — de 20 resultados/pág = 100 por combo
  const keyInfo = await getCareerjetKey();
  if (!keyInfo) return [];
  const allJobs: RawJob[] = [];
  const seen = new Set<string>();
  
  for (const page of [1, 2, 3]) { // Reducido de 10→3 páginas para no exceder maxDuration=300s
    try {
      const url = `https://public.api.careerjet.net/search?locale_code=es_ES&keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(countryLocation)}&affid=${keyInfo.key}&user_ip=187.124.37.183&user_agent=BuscayCurra%2F3.0&pagesize=50&page=${page}&sort=relevance`;
      const res = await fetch(url, {
        headers: { "Referer": "https://buscaycurra.es" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) { await reportFailure("careerjet", keyInfo.idx, res.status); continue; }
      const data = await res.json();
      console.error("[CJ-DEBUG]", keyword, countryLocation, "page", page, "type:", data.type, "jobs:", data.jobs?.length ?? 0);
      if (data.type === "ERROR") { console.error("[CJ-ERROR]", JSON.stringify(data).slice(0, 500)); continue; }
      const jobs = (data.jobs || []).map((j: Record<string, string>) => ({
        source: `EURES_${countryLocation.slice(0, 3).toUpperCase()}`,
        url: j.url || "",
        title: (j.title || keyword).replace(/<[^>]+>/g, "").slice(0, 200),
        company: (j.company || "Empresa europea").slice(0, 200),
        city: (j.locations || countryLocation).slice(0, 100),
        description: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 1000),
        salary: (j.salary || "Ver en oferta").slice(0, 100),
      }));
      // Dedup dentro del mismo combo (Careerjet a veces repite entre páginas)
      let newJobs = 0;
      for (const j of jobs) {
        const dedupKey = `${j.title}|${j.company}`.toLowerCase();
        if (!seen.has(dedupKey)) {
          seen.add(dedupKey);
          allJobs.push(j);
          newJobs++;
        }
      }
      // Si la página vino casi vacía, no seguir (con pagesize=50, <20 es final)
      if (jobs.length < 20) break;
    } catch { continue; }
  }
  return allJobs;
}

export async function upsertJobsForSync(jobs: RawJob[], sector: JobSector, country?: string): Promise<number> {
  if (!jobs.length) return 0;
  const pool = getPool();
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  let inserted = 0;
  for (const j of jobs) {
    if (!j.url || !j.title) continue;
    const id = makeId(j.title, j.company, j.city, j.source);
    try {
      const result = await pool.query(
        `INSERT INTO "JobListing" (id, title, company, description, sector, city, salary, "sourceUrl", "sourceName", "isActive", "scrapedAt", "createdAt", "expiresAt", country)
         VALUES ($1, $2, $3, $4, $5::"JobSector", $6, $7, $8, $9, true, NOW(), NOW(), $10, $11)
         ON CONFLICT (id) DO UPDATE SET country = COALESCE("JobListing".country, EXCLUDED.country)`,
        [id, j.title, j.company, j.description, sector, j.city, j.salary, j.url, j.source, expiresAt, country || null]
      );
      if (result.rowCount && result.rowCount > 0) inserted++;
    } catch { /* skip */ }
  }
  return inserted;
}

export async function syncBatch(params: {
  source: "jooble" | "adzuna" | "careerjet" | "eures";
  sector: JobSector;
  keyword: string;
  city: string;
  page?: number;
}): Promise<{ inserted: number; fetched: number }> {
  const { source, sector, keyword, city, page = 1 } = params;
  let raw: RawJob[] = [];
  if (source === "jooble") raw = await fetchJooble(keyword, city, page);
  if (source === "adzuna") raw = await fetchAdzuna(keyword, city, page);
  if (source === "careerjet") raw = await fetchCareerjet(keyword, city, page);
  if (source === "eures") raw = await fetchCareerjetGlobal(keyword, city, page);
  const inserted = await upsertJobsForSync(raw, sector);
  return { inserted, fetched: raw.length };
}

export async function getJobStats(): Promise<Record<string, number>> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT "sourceName", COUNT(*) as count FROM "JobListing" WHERE "isActive" = true GROUP BY "sourceName" ORDER BY count DESC`
  );
  const stats: Record<string, number> = {};
  for (const row of res.rows) stats[row["sourceName"] as string] = parseInt(row.count as string);
  stats.total = Object.values(stats).reduce((a, b) => a + b, 0);
  return stats;
}
