/**
 * lib/job-search/bulk-indexer.ts — Indexador masivo de alta velocidad
 *
 * Diseñado para llenar la BD con 400.000+ ofertas únicas.
 * Usa SOLO fuentes gratuitas/sin límite de rate para el volumen:
 *   - Jooble (key propia, 100 resultados/query)
 *   - Arbeitnow (API pública, sin key, paginada)
 *   - Remotive (API pública, sin key, todos los jobs)
 *
 * Estrategia:
 *   - 200 puestos × 120 ciudades = 24.000 combinaciones únicas
 *   - Proceso en lotes paralelos de PARALLEL_BATCH a la vez
 *   - Upsert a Supabase ignorando duplicados (por id)
 *   - Endpoint: POST /api/jobs/bulk-index
 */

import { createClient } from "@supabase/supabase-js";
import type { OfertaReal } from "./real-search";

// ─── Listas Masivas ──────────────────────────────────────────────────────────

export const PUESTOS_BULK = [
  // Hostelería (20)
  "camarero", "cocinero", "chef", "ayudante cocina", "barman", "recepcionista hotel",
  "friegaplatos", "jefe de sala", "pastelero", "panadero", "maitre", "sommelier",
  "barista", "pinche cocina", "gobernanta hotel", "catering", "personal cocina",
  "auxiliar recepción", "conserje hotel", "gestor eventos",
  // Logística y transporte (18)
  "conductor", "repartidor", "carretillero", "mozo almacén", "operario logística",
  "chófer", "transportista", "jefe de almacén", "mozo carga descarga",
  "preparador pedidos", "camionero", "gestor logística", "operario picking",
  "operador carretilla", "conductor furgoneta", "mensajero", "repartidor ecommerce",
  "coordinador logístico",
  // Construcción y oficios (18)
  "electricista", "fontanero", "albañil", "peón construcción", "soldador",
  "pintor", "carpintero", "técnico mantenimiento", "encofrador", "ceramista",
  "instalador", "techador", "jefe de obra", "aparejador", "operario obra",
  "montador", "instalador climatización", "técnico ascensores",
  // Comercio y retail (16)
  "dependiente tienda", "cajero supermercado", "vendedor", "reponedor",
  "promotor ventas", "teleoperador", "comercial", "asesor ventas",
  "visual merchandiser", "gerente tienda", "jefe de ventas", "agente comercial",
  "asesor comercial", "técnico ventas", "representante comercial", "captador comercial",
  // Industria y manufactura (15)
  "operario producción", "operario fábrica", "técnico industrial",
  "mecánico industrial", "electromecánico", "operario control calidad",
  "técnico mantenimiento industrial", "operario línea producción", "montador industrial",
  "operario química", "técnico procesos", "operario textil", "operario alimentación",
  "técnico metrología", "inspector calidad",
  // Sanidad y social (18)
  "enfermero", "auxiliar enfermería", "cuidador geriátrico", "fisioterapeuta",
  "técnico radiología", "celador", "auxiliar clínica", "médico", "dentista",
  "farmacéutico", "terapeuta ocupacional", "logopeda", "psicólogo", "trabajador social",
  "técnico emergencias", "paramédico", "auxiliar dental", "técnico ortopedia",
  // Administración y oficinas (16)
  "administrativo", "recepcionista", "secretaria", "contable",
  "gestor administrativo", "auxiliar administrativo", "controller financiero",
  "director financiero", "técnico recursos humanos", "gestor RRHH",
  "asesor fiscal", "técnico nóminas", "office manager", "asistente dirección",
  "analista financiero", "técnico contabilidad",
  // Tecnología e IT (20)
  "programador", "desarrollador web", "frontend developer", "backend developer",
  "data analyst", "devops", "técnico informático", "soporte IT",
  "full stack developer", "QA tester", "arquitecto software", "ciberseguridad",
  "analista sistemas", "desarrollador móvil", "data engineer", "machine learning",
  "administrador sistemas", "técnico redes", "cloud architect", "scrum master",
  // Limpieza y servicios generales (10)
  "limpiador", "auxiliar limpieza", "operario limpieza", "empleado hogar",
  "limpieza industrial", "servicios limpieza", "conserje", "bedel",
  "auxiliar servicios", "ordenanza",
  // Educación y formación (12)
  "profesor", "monitor", "educador infantil", "auxiliar educación",
  "formador", "orientador", "maestro", "tutor", "instructor",
  "animador sociocultural", "técnico deportivo", "entrenador personal",
  // Seguridad (6)
  "vigilante seguridad", "guardia de seguridad", "controlador accesos",
  "seguridad privada", "auxiliar vigilancia", "técnico alarmas",
  // Marketing y comunicación (12)
  "community manager", "diseñador gráfico", "redactor", "periodista",
  "fotógrafo", "SEO specialist", "SEM specialist", "director marketing",
  "analista marketing", "copywriter", "diseñador UX", "gestor redes sociales",
  // Turismo e inmobiliario (10)
  "agente inmobiliario", "agente viajes", "guía turístico", "técnico turismo",
  "asesor inmobiliario", "promotor inmobiliario", "gestión turística",
  "técnico booking", "agente reservas", "coordinador viajes",
  // Otros servicios (19)
  "peluquero", "esteticista", "mecánico vehículos", "técnico electrónico",
  "jardinero", "agricultor", "operario agrícola", "asesor seguros",
  "técnico laboratorio", "veterinario", "auxiliar veterinaria",
  "técnico audiovisual", "operador grúa", "buceador", "técnico naval",
  "piloto comercial", "auxiliar vuelo", "maquinista", "técnico ferroviario",
];

export const CIUDADES_BULK = [
  // Madrid y área metropolitana
  "Madrid", "Alcalá de Henares", "Getafe", "Leganés", "Fuenlabrada",
  "Móstoles", "Alcorcón", "Torrejón de Ardoz", "Parla", "Alcobendas",
  "Pozuelo de Alarcón", "Las Rozas", "Rivas-Vaciamadrid",
  // Cataluña
  "Barcelona", "Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell",
  "Tarragona", "Lleida", "Girona", "Mataró", "Cornellà", "Sant Cugat",
  "Castelldefels", "Granollers", "Manresa",
  // Valencia
  "Valencia", "Alicante", "Elche", "Castellón", "Torrent", "Murcia",
  "Cartagena", "Orihuela", "Benidorm", "Gandía",
  // Andalucía
  "Sevilla", "Málaga", "Granada", "Córdoba", "Almería", "Huelva",
  "Cádiz", "Jaén", "Jerez de la Frontera", "Marbella", "Algeciras",
  "Torremolinos", "Fuengirola", "Linares",
  // País Vasco y Navarra
  "Bilbao", "Vitoria", "San Sebastián", "Pamplona", "Tudela", "Barakaldo",
  "Getxo", "Irun", "Donostia",
  // Galicia
  "A Coruña", "Vigo", "Ourense", "Lugo", "Santiago de Compostela",
  "Ferrol", "Pontevedra",
  // Castilla y León
  "Valladolid", "Burgos", "Salamanca", "Ávila", "Segovia", "Palencia",
  "León", "Zamora", "Soria",
  // Aragón y La Rioja
  "Zaragoza", "Logroño", "Huesca", "Teruel", "Calahorra",
  // Asturias y Cantabria
  "Oviedo", "Gijón", "Avilés", "Santander", "Torrelavega",
  // Extremadura
  "Badajoz", "Cáceres", "Mérida",
  // Castilla-La Mancha
  "Albacete", "Toledo", "Ciudad Real", "Cuenca", "Guadalajara",
  // Islas
  "Las Palmas", "Santa Cruz de Tenerife", "Palma", "Ibiza", "Arrecife",
  // Murcia
  "Lorca", "Molina de Segura",
  // Nacional (queries sin ciudad específica)
  "España", "teletrabajo", "remoto",
];

// ─── Configuración ────────────────────────────────────────────────────────────

const PARALLEL_BATCH = 8;   // Queries en paralelo simultáneamente
const JOOBLE_KEY = process.env.JOOBLE_API_KEY ?? "";
const JOOBLE_RESULTS = 100; // Máximo que permite Jooble

// ─── Mapeadores de respuesta ──────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 60);
}

function mapJooble(job: Record<string, string>, puesto: string, ciudad: string): OfertaReal {
  const url = (job.link ?? job.url ?? "").slice(0, 500);
  return {
    id: `jooble-${slugify(url || `${puesto}-${ciudad}-${job.title ?? ""}`)}-${Buffer.from(url || `${puesto}${ciudad}${job.title}`).toString("base64").slice(0, 12)}`,
    titulo: (job.title ?? puesto).slice(0, 255),
    empresa: (job.company ?? "").slice(0, 255),
    ubicacion: (job.location ?? ciudad).slice(0, 255),
    salario: (job.salary ?? "").slice(0, 100),
    descripcion: (job.snippet ?? "").slice(0, 1000),
    fuente: "Jooble",
    url,
    fecha: job.updated ? new Date(job.updated).toISOString() : new Date().toISOString(),
    emailEmpresa: "",
  };
}

function mapArbeitnow(job: Record<string, unknown>): OfertaReal {
  const slug = (job.slug as string) ?? "";
  return {
    id: `arbeitnow-${slug}`,
    titulo: ((job.title as string) ?? "").slice(0, 255),
    empresa: ((job.company_name as string) ?? "").slice(0, 255),
    ubicacion: ((job.location as string) ?? "Europa").slice(0, 255),
    salario: "",
    descripcion: ((job.description as string) ?? "").replace(/<[^>]+>/g, " ").slice(0, 1000),
    fuente: "Arbeitnow",
    url: `https://www.arbeitnow.com/jobs/${slug}`,
    fecha: job.created_at ? new Date((job.created_at as number) * 1000).toISOString() : new Date().toISOString(),
    emailEmpresa: "",
  };
}

function mapRemotive(job: Record<string, unknown>): OfertaReal {
  return {
    id: `remotive-${job.id as number}`,
    titulo: ((job.title as string) ?? "").slice(0, 255),
    empresa: ((job.company_name as string) ?? "").slice(0, 255),
    ubicacion: ((job.candidate_required_location as string) ?? "Remoto").slice(0, 255),
    salario: ((job.salary as string) ?? "").slice(0, 100),
    descripcion: ((job.description as string) ?? "").replace(/<[^>]+>/g, " ").slice(0, 1000),
    fuente: "Remotive",
    url: ((job.url as string) ?? "").slice(0, 500),
    fecha: (job.publication_date as string) ?? new Date().toISOString(),
    emailEmpresa: "",
  };
}

// ─── Fetchers de fuentes ──────────────────────────────────────────────────────

async function fetchJooble(puesto: string, ciudad: string): Promise<OfertaReal[]> {
  if (!JOOBLE_KEY) return [];
  try {
    const resp = await fetch(`https://es.jooble.org/api/${JOOBLE_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: puesto, location: ciudad, page: 1, resultsOnPage: JOOBLE_RESULTS }),
      signal: AbortSignal.timeout(12000),
    });
    if (!resp.ok) return [];
    const data = await resp.json() as { jobs?: Record<string, string>[] };
    return (data.jobs ?? []).map(j => mapJooble(j, puesto, ciudad));
  } catch {
    return [];
  }
}

export async function fetchArbeitnowAll(): Promise<OfertaReal[]> {
  const all: OfertaReal[] = [];
  for (let page = 1; page <= 50; page++) {
    try {
      const resp = await fetch(`https://www.arbeitnow.com/api/job-board-api?page=${page}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) break;
      const data = await resp.json() as { data?: Record<string, unknown>[]; links?: { next?: string } };
      if (!data.data?.length) break;
      all.push(...data.data.map(j => mapArbeitnow(j)));
      if (!data.links?.next) break;
      await new Promise(r => setTimeout(r, 300));
    } catch {
      break;
    }
  }
  return all;
}

export async function fetchRemotiveAll(): Promise<OfertaReal[]> {
  try {
    const resp = await fetch("https://remotive.com/api/remote-jobs", {
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) return [];
    const data = await resp.json() as { jobs?: Record<string, unknown>[] };
    return (data.jobs ?? []).map(j => mapRemotive(j));
  } catch {
    return [];
  }
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface BulkProgress {
  total: number;
  procesados: number;
  insertados: number;
  errores: number;
  fuentes: Record<string, number>;
}

function inferirSector(titulo: string): string {
  const t = titulo.toLowerCase();
  if (/camarer|cociner|chef|hotel|restaur|hostel|barman|sala|pastel|panadero/i.test(t)) return "hosteleria";
  if (/electricist|fontaner|albañil|soldad|construc|encofr|techad|montad/i.test(t)) return "construccion";
  if (/program|develop|software|web|frontend|backend|data|devops|IT|cloud|QA|scrum/i.test(t)) return "tecnologia";
  if (/vendedor|cajero|depend|comerci|tienda|retail|promotor/i.test(t)) return "comercio";
  if (/conduc|repartid|almacén|logíst|carretill|camioner|transp|picking/i.test(t)) return "logistica";
  if (/operario|fábrica|producc|industri|montaj|manufactur|control calidad/i.test(t)) return "industria";
  if (/enfermer|auxiliar|cuidador|sanidad|salud|médico|farmac|fisio|paramédico/i.test(t)) return "sanidad";
  if (/administrat|secretar|recepcion|contabl|controller|nómin|gestor/i.test(t)) return "administracion";
  if (/limpiez|limpiad/i.test(t)) return "limpieza";
  if (/profesor|educad|monitor|maestro|tutor|formad|orientad/i.test(t)) return "educacion";
  if (/marketing|community|diseñad|copywrite|SEO|SEM|redes sociales/i.test(t)) return "marketing";
  if (/inmobiliar|viajes|turism|guía|booking|reservas/i.test(t)) return "inmobiliario";
  return "otros";
}

function ofertaToDB(o: OfertaReal, ciudad: string) {
  return {
    id: o.id,
    titulo: o.titulo.slice(0, 255),
    empresa: (o.empresa || "").slice(0, 255),
    ubicacion: (o.ubicacion || ciudad).slice(0, 255),
    provincia: ciudad.slice(0, 100),
    comunidad: "",
    salario: (o.salario || "").slice(0, 100),
    descripcion: (o.descripcion || "").slice(0, 1000),
    fuente: (o.fuente || "").slice(0, 50),
    url: (o.url || "").slice(0, 500),
    email_empresa: (o.emailEmpresa || "").slice(0, 255),
    sector: inferirSector(o.titulo),
    keywords: [o.titulo.toLowerCase(), (o.empresa || "").toLowerCase(), ciudad.toLowerCase()].filter(Boolean),
    fecha: o.fecha || new Date().toISOString(),
  };
}

// ─── Indexador principal: Jooble en lotes paralelos ──────────────────────────

export async function indexarBulkJooble(
  offset = 0,
  maxCombinaciones = 200,
  onProgress?: (p: BulkProgress) => void,
): Promise<BulkProgress> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Generar todas las combinaciones determinísticas (sin shuffle para batching por offset)
  const combinaciones: Array<[string, string]> = [];
  for (const puesto of PUESTOS_BULK) {
    for (const ciudad of CIUDADES_BULK) {
      combinaciones.push([puesto, ciudad]);
    }
  }

  const lote = combinaciones.slice(offset, offset + maxCombinaciones);

  const progress: BulkProgress = {
    total: lote.length,
    procesados: 0,
    insertados: 0,
    errores: 0,
    fuentes: {},
  };

  // Procesar en lotes paralelos de PARALLEL_BATCH
  for (let i = 0; i < lote.length; i += PARALLEL_BATCH) {
    const chunk = lote.slice(i, i + PARALLEL_BATCH);

    const results = await Promise.allSettled(
      chunk.map(([puesto, ciudad]) => fetchJooble(puesto, ciudad))
    );

    const toInsert: ReturnType<typeof ofertaToDB>[] = [];
    for (let k = 0; k < results.length; k++) {
      const ciudad = chunk[k][1];
      const result = results[k];
      if (result.status === "fulfilled") {
        const ofertas = result.value;
        for (const o of ofertas) {
          toInsert.push(ofertaToDB(o, ciudad));
        }
      }
      progress.procesados++;
    }

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from("ofertas")
        .upsert(toInsert, { onConflict: "id", ignoreDuplicates: true });

      if (!error) {
        progress.insertados += toInsert.length;
        progress.fuentes["Jooble"] = (progress.fuentes["Jooble"] ?? 0) + toInsert.length;
      } else {
        progress.errores++;
        console.warn("[BulkIndexer] upsert error:", error.message);
      }
    }

    onProgress?.(progress);
  }

  return progress;
}

// ─── Indexador de Arbeitnow (full dump) ──────────────────────────────────────

export async function indexarBulkArbeitnow(): Promise<BulkProgress> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const progress: BulkProgress = { total: 0, procesados: 0, insertados: 0, errores: 0, fuentes: {} };

  const ofertas = await fetchArbeitnowAll();
  progress.total = ofertas.length;

  if (ofertas.length === 0) return progress;

  // Insertar en lotes de 500
  for (let i = 0; i < ofertas.length; i += 500) {
    const chunk = ofertas.slice(i, i + 500).map(o => ofertaToDB(o, o.ubicacion || "Europa"));
    const { error } = await supabase
      .from("ofertas")
      .upsert(chunk, { onConflict: "id", ignoreDuplicates: true });

    if (!error) {
      progress.insertados += chunk.length;
      progress.fuentes["Arbeitnow"] = (progress.fuentes["Arbeitnow"] ?? 0) + chunk.length;
    } else {
      progress.errores++;
    }
    progress.procesados += chunk.length;
  }

  return progress;
}

// ─── Indexador de Remotive (full dump) ───────────────────────────────────────

export async function indexarBulkRemotive(): Promise<BulkProgress> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const progress: BulkProgress = { total: 0, procesados: 0, insertados: 0, errores: 0, fuentes: {} };

  const ofertas = await fetchRemotiveAll();
  progress.total = ofertas.length;

  if (ofertas.length === 0) return progress;

  const filas = ofertas.map(o => ofertaToDB(o, o.ubicacion || "Remoto"));
  const { error } = await supabase
    .from("ofertas")
    .upsert(filas, { onConflict: "id", ignoreDuplicates: true });

  if (!error) {
    progress.insertados = filas.length;
    progress.fuentes["Remotive"] = filas.length;
  } else {
    progress.errores = 1;
  }
  progress.procesados = filas.length;

  return progress;
}

export const TOTAL_COMBINACIONES = PUESTOS_BULK.length * CIUDADES_BULK.length;
