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

function makeId(source: string, url: string): string {
  return createHash("md5").update(source + "|" + url).digest("hex").slice(0, 24);
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

async function fetchAdzuna(keyword: string, city: string, page = 1): Promise<RawJob[]> {
  const keyInfo = await getAdzunaKey();
  if (!keyInfo) return [];
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/es/search/${page}?app_id=${keyInfo.id}&app_key=${keyInfo.key}&results_per_page=50&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(city)}&content-type=application/json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) { await reportFailure("adzuna", keyInfo.idx, res.status); return []; }
    const data = await res.json();
    return (data.results || []).map((j: Record<string, unknown>) => {
      const company = j.company as Record<string, string> | undefined;
      const location = j.location as Record<string, unknown> | undefined;
      const salMin = j.salary_min ? Math.round(j.salary_min as number) : 0;
      const salMax = j.salary_max ? Math.round(j.salary_max as number) : 0;
      return {
        source: "Adzuna",
        url: (j.redirect_url as string) || "",
        title: ((j.title as string) || keyword).replace(/<[^>]+>/g, "").slice(0, 200),
        company: (company?.display_name || "Ver en oferta").slice(0, 200),
        city: ((location?.display_name as string) || city).slice(0, 100),
        description: ((j.description as string) || "").replace(/<[^>]+>/g, "").slice(0, 1000),
        salary: salMin && salMax ? `${salMin}€ - ${salMax}€/año` : "Ver en oferta",
      };
    });
  } catch { return []; }
}

async function fetchCareerjet(keyword: string, city: string, page = 1): Promise<RawJob[]> {
  const keyInfo = await getCareerjetKey();
  if (!keyInfo) return [];
  try {
    const url = `http://public.api.careerjet.net/search?locale_code=es_ES&keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(city + " Espana")}&affid=${keyInfo.key}&user_ip=187.124.37.183&user_agent=BuscayCurra%2F1.0&pagesize=20&page=${page}&sort=relevance`;
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

async function upsertJobs(jobs: RawJob[], sector: JobSector): Promise<number> {
  if (!jobs.length) return 0;
  const pool = getPool();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  let inserted = 0;
  for (const j of jobs) {
    if (!j.url || !j.title) continue;
    const id = makeId(j.source, j.url);
    try {
      const result = await pool.query(
        `INSERT INTO "JobListing" (id, title, company, description, sector, city, salary, "sourceUrl", "sourceName", "isActive", "scrapedAt", "createdAt", "expiresAt")
         VALUES ($1, $2, $3, $4, $5::"JobSector", $6, $7, $8, $9, true, NOW(), NOW(), $10)
         ON CONFLICT (id) DO NOTHING`,
        [id, j.title, j.company, j.description, sector, j.city, j.salary, j.url, j.source, expiresAt]
      );
      if (result.rowCount && result.rowCount > 0) inserted++;
    } catch { /* skip */ }
  }
  return inserted;
}

export async function syncBatch(params: {
  source: "jooble" | "adzuna" | "careerjet";
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
  const inserted = await upsertJobs(raw, sector);
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
