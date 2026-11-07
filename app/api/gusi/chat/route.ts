/**
 * /api/gusi/chat — Guzzi v4: asistente de empleo con contexto de CV real
 *
 * Cambio clave: el system prompt se construye dinámicamente inyectando
 * los datos reales del CV del usuario. Guzzi nunca pregunta lo que ya sabe.
 */
/**
/**
 * 🔒 SELLO GUZZI detectIntent - BuscayCurra
 * detectIntent + extractJobTerm: NO TOCAR sin ejecutar tests
 * Tests: sello-verificacion.mjs bloques 1 y 2 (12 tests de regex)
 */



import { NextRequest, NextResponse } from "next/server";
import { PROMPT_BASE, PROMPT_ENTREVISTA, PROMPT_CV_MEJORADO, PROMPT_CARTA, PROMPT_MODO_CV, temasParaLaConversacion } from "@/lib/guzzi/prompts";
import { entenderMensaje, hayQueEntender, refiereAOfertasMostradas } from "@/lib/guzzi/entender";
import { respuestaOfertasMostradas, textoEnvioAutomatico, TEXTO_INFO_AU_PAIR, sinVoseo } from "@/lib/guzzi/respuestas-fijas";
import { detectIntent, extractJobTerm, extractAddress, extractCompanyFromContact } from "@/lib/guzzi/intents";
import { textoNegociosLocales, propuestaPendiente, negocioElegido } from "@/lib/guzzi/envio-local";
import { pideSiguientePaso, respuestaSiguientePaso, cvConContenido, pistaDeCurso } from "@/lib/guzzi/siguiente-paso";
import { extraerCorreo, empresaDelCorreo, empresaDelTexto, puestoDelTexto, textoPropuesta, propuestaCorreoPendiente, respuestaAPropuesta, type PropuestaCorreo } from "@/lib/guzzi/envio-correo";
import { anotarOficio, expandirPuesto, expresionesDePalabraEntera, tituloCoincide } from "@/lib/job-search/sinonimos-puesto";
import { aliasCiudad } from "@/lib/guzzi/ciudades-pais";
import { LISTA_PAISES, PAISES } from "@/lib/paises";
import { nacionalidadDe } from "@/lib/origen/nacionalidades";
import { servicioEmpleoDe } from "@/lib/cursos/plataformas";
import { getPrimerosPasos } from "@/lib/primeros-pasos";
import { callGroq, callOpenAI } from "@/lib/guzzi/llm";
import { checkRateLimit } from "@/lib/guzzi/rate-limit";
import { empresaVisible } from "@/lib/job-search/empresa-visible";
import { correoSinVerificar } from "@/lib/auth-server";

// Llamadas del servidor a sí mismo. 127.0.0.1 y no "localhost": en Node,
// localhost puede resolverse primero a ::1 (IPv6) y el servidor escucha en IPv4.
const BASE_INTERNA = `http://127.0.0.1:${process.env.PORT || 3000}`;

export const dynamic = "force-dynamic";


// --- Helpers ------------------------------------------------------------------

function analyzeCVDensity(cvData: string): { isSparse: boolean; isRich: boolean } {
  try {
    const cv = JSON.parse(cvData);
    let wordCount = 0;
    let sectionsFilled = 0;

    const textFields = ["perfilProfesional", "aptitudes", "subtitulo", "habilidades", "idiomas", "formacion"];
    textFields.forEach(f => {
      const val = cv[f];
      if (val && String(val).trim().length > 5) {
        wordCount += String(val).split(/\s+/).length;
        sectionsFilled++;
      }
    });

    if (Array.isArray(cv.experiencia)) {
      cv.experiencia.forEach((e: Record<string, unknown>) => {
        sectionsFilled++;
        if (e.descripcion) wordCount += String(e.descripcion).split(/\s+/).length;
      });
    }

    return {
      isSparse: wordCount < 80 || sectionsFilled < 3,
      isRich: wordCount > 300 && sectionsFilled >= 5,
    };
  } catch {
    return { isSparse: true, isRich: false };
  }
}

function parseStringList(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return (val as unknown[]).map(v => typeof v === "object" ? (v as { nombre?: string }).nombre || "" : String(v)).filter(Boolean);
  return String(val).split(/[,\n]/).map(s => s.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
}

interface CVParsed {
  nombre: string;
  ciudad: string;
  provincia: string;
  codigo_postal: string;
  ultimoPuesto: string;
  ultimaEmpresa: string;
  sector: string;
  habilidades: string;
  resumenTexto: string;
}

function parseCVData(raw: string): CVParsed | null {
  try {
    const cv = JSON.parse(raw);
    const nombre = String(cv.nombre || cv.full_name || "").trim();
    const ciudad = String(cv.ciudad || cv.location || "").trim();
    const provincia = String(cv.provincia || "").trim();
    const codigo_postal = String(cv.codigo_postal || "").trim();
    const sector = String(cv.sector || "").trim();

    let ultimoPuesto = "";
    let ultimaEmpresa = "";
    const exp = cv.experiencia || cv.experience;

    if (Array.isArray(exp) && exp.length > 0) {
      // Ordenar por año descendente (más reciente primero) para coger el último puesto real
      const expOrdenada = [...exp].sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const getYear = (f: string) => { const m = String(f || "").match(/(\d{4})/g); return m ? parseInt(m[m.length - 1]) : 0; };
        return getYear(String(b.fechas || "")) - getYear(String(a.fechas || ""));
      });
      const e0 = expOrdenada[0] as { puesto?: string; empresa?: string; descripcion?: string };
      ultimoPuesto = e0.puesto || "";
      ultimaEmpresa = e0.empresa || "";
    } else if (typeof exp === "string" && exp.trim()) {
      // "2020-2023 — Camarero en Bar La Plaza (Madrid)"
      const m = exp.match(/(?:—|–|-)\s*(.+?)\s+en\s+(.+?)(?:\s*[\n(]|$)/i);
      ultimoPuesto = m?.[1]?.trim() || "";
      ultimaEmpresa = m?.[2]?.trim() || "";
    }

    const habilidades = parseStringList(cv.aptitudes || cv.habilidades || cv.skills).slice(0, 5).join(", ");

    const resumenTexto = [
      nombre && `Nombre: ${nombre}`,
      ciudad && `Ciudad: ${ciudad}`,
      provincia && `Provincia: ${provincia}`,
      codigo_postal && `CP: ${codigo_postal}`,
      ultimoPuesto && `Último puesto: ${ultimoPuesto}`,
      ultimaEmpresa && `Última empresa: ${ultimaEmpresa}`,
      sector && `Sector: ${sector}`,
      habilidades && `Habilidades: ${habilidades}`,
    ].filter(Boolean).join("\n");

    return { nombre, ciudad, provincia, codigo_postal, ultimoPuesto, ultimaEmpresa, sector, habilidades, resumenTexto };
  } catch {
    return null;
  }
}

// `temas`: el conocimiento que toca para esta conversación (ver lib/guzzi/prompts.ts).
function buildSystemPrompt(cvData?: string, pais?: string, auPairData?: Record<string, unknown> | null, temas = ""): string {
  // `pais`: dónde está la persona (lo manda el chat, lib/origen/donde-estoy.ts).
  const paisInfo = pais && pais !== "ES"
    ? `\nLa persona está en ${nombreDePais(pais)}. Si no dice otro país, adapta tus consejos al mercado laboral de allí (salarios, requisitos, idioma).`
      + (esPaisNuestro(pais) ? "" : " De ese país todavía no tenemos ofertas en BuscayCurra: no inventes ninguna. Ofrécele buscar empresas de su ciudad para mandarles el CV, o mirar en los países donde sí hay.")
      + "\n"
    : "";

  // Construir contexto Au Pair si existe
  let auPairContext = "";
  if (auPairData) {
    const nombre = auPairData.nombre || "";
    const edad = auPairData.age || "";
    const ciudad = auPairData.ciudad || "";
    const idiomas = Array.isArray(auPairData.languages) ? (auPairData.languages as string[]).join(", ") : "";
    const experiencia = auPairData.childcare_experience || "";
    const paisDestino = auPairData.nationality || "";
    const fotos = Array.isArray(auPairData.photos) ? (auPairData.photos as string[]).length : 0;

    auPairContext = `\n--- PERFIL AU PAIR DEL USUARIO ---\nNombre: ${nombre}\nEdad: ${edad}\nCiudad: ${ciudad}\nIdiomas: ${idiomas}\nExperiencia con niños: ${experiencia}\nPaís preferido: ${paisDestino}\nFotos subidas: ${fotos}\nCarta Dear Family: ${auPairData.letter_text ? "✅ Creada" : "❌ Pendiente"}\n-----------------------------\n\nCuando el usuario pida "generar carta au pair" o "carta dear family", usa estos datos para personalizarla.\nCuando pida "buscar au pair" o "busco trabajo de au pair", busca ofertas de tipo au pair/nanny/niñera.\n`;
  }

  if (!cvData) return PROMPT_BASE + temas + paisInfo + auPairContext;

  const cv = parseCVData(cvData);
  if (!cv || !cv.resumenTexto) return PROMPT_BASE + temas + paisInfo + auPairContext;

  return `${PROMPT_BASE}${temas}${paisInfo}
--- DATOS REALES DEL CV DEL USUARIO (usa esto en TODAS tus respuestas) ---
${cv.resumenTexto}
------------------------------------------------------------------------
${auPairContext}
Cuando el usuario pregunte qué trabajo buscar - sugiérele ofertas de "${cv.ultimoPuesto || cv.sector || "su sector"}" SIEMPRE primero en "${cv.ciudad || "su zona"}" y sus alrededores (máx 30km). NUNCA sugieras Madrid o Barcelona a menos que el usuario lo pida explícitamente. Si no encuentras en su zona, DÍSELO claramente antes de ofrecer otras ciudades.
Cuando mejores el CV - usa exactamente los datos de arriba, no los inventes.
Cuando generes una carta - pon el nombre "${cv.nombre}" y la ciudad "${cv.ciudad}" reales.`;
}


// Mapa ciudad - provincia para expansión geográfica
const CIUDAD_A_PROVINCIA: Record<string, string> = {
  tudela: "navarra", pamplona: "navarra", estella: "navarra", tafalla: "navarra",
  zaragoza: "zaragoza", huesca: "huesca", teruel: "teruel",
  bilbao: "vizcaya", "san sebastian": "guipuzcoa", donostia: "guipuzcoa", vitoria: "alava",
  logrono: "la rioja", logroño: "la rioja", calahorra: "la rioja",
  madrid: "madrid", barcelona: "barcelona", valencia: "valencia",
  sevilla: "sevilla", malaga: "malaga", cordoba: "cordoba", granada: "granada",
  santander: "cantabria", oviedo: "asturias", gijon: "asturias",
  valladolid: "valladolid", burgos: "burgos", salamanca: "salamanca",
  "la coruña": "coruña", vigo: "pontevedra", lugo: "lugo", ourense: "ourense",
  murcia: "murcia", cartagena: "murcia", alicante: "alicante", elche: "alicante",
  palma: "baleares", "las palmas": "canarias",
};

// Provincias limítrofes para búsqueda expandida (estrategia 2.5)
const PROVINCIAS_LIMITROFES: Record<string, string[]> = {
  navarra: ["la rioja", "zaragoza", "huesca", "guipuzcoa", "alava"],
  "la rioja": ["navarra", "zaragoza", "alava", "burgos", "soria"],
  zaragoza: ["navarra", "la rioja", "huesca", "teruel", "soria", "guadalajara", "tarragona", "lleida"],
  madrid: ["toledo", "guadalajara", "segovia", "avila", "cuenca"],
  barcelona: ["tarragona", "lleida", "girona"],
  valencia: ["alicante", "castellon", "cuenca", "teruel"],
  sevilla: ["huelva", "cadiz", "cordoba", "malaga", "badajoz"],
  vizcaya: ["guipuzcoa", "alava", "cantabria", "burgos"],
};

// Ciudades cercanas (misma provincia/área metropolitana) para búsqueda ampliada
const CIUDADES_CERCANAS: Record<string, string[]> = {
  zaragoza: ["calatayud", "utebo", "alagon", "zuera", "la puebla", "cuarte"],
  tudela: ["pamplona", "estella", "tafalla", "corella", "cintruenigo"],
  pamplona: ["tudela", "estella", "tafalla", "barañain", "burlada", "zizur"],
  barcelona: ["hospitalet", "badalona", "sabadell", "terrassa", "sant cugat", "cornella"],
  madrid: ["alcobendas", "pozuelo", "las rozas", "getafe", "leganes", "alcorcon", "mostoles", "fuenlabrada", "torrejon"],
  valencia: ["paterna", "torrent", "mislata", "burjassot", "aldaya", "quart"],
  sevilla: ["dos hermanas", "alcala de guadaira", "mairena", "camas", "san juan"],
  bilbao: ["barakaldo", "getxo", "santurtzi", "portugalete", "basauri", "leioa", "erandio"],
  malaga: ["torremolinos", "benalmadena", "fuengirola", "mijas", "rincon de la victoria"],
  vigo: ["pontevedra", "redondela", "cangas", "moaña", "porriño"],
  gijon: ["oviedo", "aviles", "langreo", "mieres", "siero"],
  santander: ["torrelavega", "camargo", "el astillero", "piélagos"],
  valladolid: ["laguna de duero", "arroyo", "medina del campo", "tudela de duero"],
  murcia: ["cartagena", "lorca", "molina de segura", "alhama", "alcantarilla", "las torres de cotillas"],
  alicante: ["elche", "san vicente", "santa pola", "torrevieja", "orihuela", "benidorm", "alcoy"],
  "la coruña": ["santiago", "ferrol", "oleiros", "culleredo", "arteixo", "cambre"],
  logroño: ["calahorra", "haro", "alfaro", "lardero", "villamediana"],
  palma: ["calvia", "marratxi", "llucmajor", "manacor", "inca"],
  cordoba: ["lucena", "puente genil", "montilla", "priego", "palma del rio"],
  granada: ["armilla", "maracena", "santa fe", "motril", "guadix"],
  salamanca: ["santa marta", "villamayor", "carbajosa", "villares"],
  burgos: ["aranda de duero", "miranda de ebro", "briviesca"],
  pontevedra: ["vigo", "marín", "sanxenxo", "vilagarcía", "lalín"],
  lugo: ["monforte", "viveiro", "sarria", "vilalba", "chantada"],
  ourense: ["verín", "o barco", "xinzo", "o carballiño", "celanova"],
};

// Sinónimos de puestos para ampliar la búsqueda
const SINONIMOS_PUESTO: Record<string, string[]> = {
  carretillero: ["carretilla", "almacen", "logistica", "operario almacen", "mozo almacen", "picking", "preparador pedidos"],
  mecanico: ["taller", "mantenimiento mecanico", "mecanico vehiculos", "mecanico industrial"],
  camarero: ["hosteleria", "restaurante", "sala", "servicio mesas", "barman", "bares", "bar", "barra", "comedor"],
  cocinero: ["cocina", "chef", "ayudante cocina", "cocinero", "gastronomia"],
  conductor: ["chofer", "transportista", "repartidor", "camionero", "distribuidor"],
  administrativo: ["administracion", "oficina", "secretaria", "gestion administrativa"],
  electricista: ["instalacion electrica", "mantenimiento electrico", "tecnico electrico"],
  fontanero: ["fontaneria", "instalaciones", "plomero", "climatizacion"],
  albañil: ["construccion", "obra", "albanileria", "peón construccion"],
  enfermero: ["enfermeria", "auxiliar enfermeria", "atencion sanitaria", "clinica"],
  comercial: ["ventas", "vendedor", "asesor comercial", "agente ventas"],
  programador: ["desarrollador", "developer", "software", "informatico", "programacion"],
  carpintero: ["carpinteria", "madera", "ebanisteria"],
  soldador: ["soldadura", "metalurgia", "chapista", "caldereria"],
};

// Mapeo puesto → queries para Google Places cuando no hay ofertas locales
const PUESTO_A_GOOGLE_QUERIES: Record<string, string[]> = {
  camarero: ["bares", "restaurantes", "cafeterías"],
  cocinero: ["restaurantes", "bares", "hoteles"],
  repartidor: ["restaurantes", "pizzerías", "empresas de reparto"],
  dependiente: ["tiendas de ropa", "comercios", "supermercados"],
  limpiador: ["empresas de limpieza", "hoteles"],
  administrativo: ["oficinas", "gestorías", "ayuntamiento"],
  carretillero: ["almacenes", "empresas de logística", "naves industriales"],
  mecanico: ["talleres mecánicos", "concesionarios"],
  conductor: ["empresas de transporte", "mensajería"],
  electricista: ["empresas de electricidad", "tiendas de electricidad"],
  fontanero: ["empresas de fontanería", "tiendas de climatización"],
  albañil: ["empresas de construcción", "reformas"],
  enfermero: ["clínicas", "residencias", "hospitales"],
  comercial: ["empresas", "agencias", "concesionarios"],
  programador: ["empresas de informática", "agencias de desarrollo web"],
  carpintero: ["carpinterías", "fábricas de muebles"],
  soldador: ["empresas de metalurgia", "talleres de soldadura"],
  jardinero: ["empresas de jardinería", "viveros"],
  pintor: ["empresas de pintura", "empresas de reformas"],
  panadero: ["panaderías", "pastelerías", "obradores"],
  pescadero: ["pescaderías", "mercados"],
  carnicero: ["carnicerías", "mercados"],
  frutero: ["fruterías", "mercados"],
};

/**
 * Busca negocios locales en Google Places cuando no hay ofertas de empleo
 * Devuelve hasta 4 resultados combinados de varias queries
 */
async function buscarNegociosLocales(puesto: string, ciudad: string): Promise<Array<{ place_id: string; name: string; formatted_address?: string; formatted_phone_number?: string; rating?: number; website?: string; url?: string }>> {
  const puestoNorm = puesto.toLowerCase().trim();
  let queries = PUESTO_A_GOOGLE_QUERIES[puestoNorm];
  
  // Si no hay mapeo exacto, buscar por coincidencia parcial
  if (!queries) {
    for (const [key, qs] of Object.entries(PUESTO_A_GOOGLE_QUERIES)) {
      if (puestoNorm.includes(key) || key.includes(puestoNorm)) {
        queries = qs;
        break;
      }
    }
  }
  
  // Fallback genérico: buscar el puesto como query
  if (!queries) {
    queries = [`empresas de ${puestoNorm}`, `negocios ${puestoNorm}`];
  }

  // Import dinámico para evitar problemas de server/client bundles
  const { buscarEmpresaGooglePlaces } = await import("@/lib/google-places");

  // Buscar con las primeras 2-3 queries para no disparar muchas requests
  const results: Array<{ place_id: string; name: string; formatted_address?: string; formatted_phone_number?: string; rating?: number; website?: string; url?: string }> = [];
  const seen = new Set<string>();
  
  for (const q of queries.slice(0, 3)) {
    try {
      const places = await buscarEmpresaGooglePlaces(q, ciudad);
      for (const p of places) {
        if (!seen.has(p.place_id) && results.length < 5) {
          seen.add(p.place_id);
          results.push(p);
        }
      }
    } catch { /* seguir con la siguiente query */ }
    if (results.length >= 5) break;
  }
  
  return results;
}

/** Los negocios tal como los enseña Guzzi, con la pregunta de si mandarles el CV. */
function listaDeNegocios(negocios: Awaited<ReturnType<typeof buscarNegociosLocales>>, ciudad: string, puesto: string): string {
  return "\n\n" + textoNegociosLocales(negocios.slice(0, 4).map((n) => ({
    nombre: n.name, direccion: n.formatted_address, telefono: n.formatted_phone_number, web: n.website, rating: n.rating,
  })), ciudad, puesto);
}

type DbJobRow = { id: unknown; title: unknown; company: unknown; city: unknown; province: unknown; salary: unknown; sourceName: unknown; sourceUrl: unknown };

function mapRowToJob(j: DbJobRow, cityFallback: string) {
  return {
    id: `db-${j.id}`,
    titulo: j.title as string,
    empresa: empresaVisible(j.company),
    ubicacion: (j.city || j.province || cityFallback) as string,
    salario: (j.salary as string) || "Ver en oferta",
    fuente: (j.sourceName as string) || "BuscayCurra",
    url: (j.sourceUrl as string) || "",
    match: 0,
  };
}

async function searchJobsReal(query: string, city: string, limit = 5, countryCode = "ES"): Promise<{
  jobs: ReturnType<typeof mapRowToJob>[];
  scope: "ciudad" | "provincia" | "cercanas" | "pais" | "sinonimo" | "api";
} | null> {
  try {
    // Nombre en inglés del país, para las ofertas antiguas que guardaban el
    // nombre completo en `country` en vez del código ISO.
    //
    // OJO CON EL VALOR POR DEFECTO: antes era `|| "spain"`, así que cualquier
    // país que no estuviera en esta lista se buscaba EN ESPAÑA sin avisar.
    // Faltaban Japón y Singapur, entre otros: pedir trabajo en Tokio habría
    // devuelto ofertas españolas. Ahora, si el país no se reconoce, se deja
    // vacío y manda el código ISO, que es lo que lleva la columna hoy.
    const countryMap: Record<string, string> = {
      ES: "spain", DE: "germany", FR: "france", IT: "italy", PT: "portugal",
      GB: "united kingdom", UK: "united kingdom", US: "united states", CA: "canada",
      AU: "australia", NL: "netherlands", SE: "sweden", CH: "switzerland",
      BE: "belgium", IE: "ireland", NO: "norway", DK: "denmark", AT: "austria",
      FI: "finland", NZ: "new zealand", PL: "poland", JP: "japan", SG: "singapore",
      GR: "greece", CZ: "czechia", HU: "hungary", RO: "romania", LU: "luxembourg",
      BR: "brazil", MX: "mexico", IN: "india", AE: "united arab emirates",
    };
    const isoCode = countryCode?.toUpperCase() || "ES";
    // Si no conocemos el nombre, se usa el propio código: nunca "spain".
    const countryName = countryMap[isoCode] || isoCode.toLowerCase();
    const { getPool } = await import("@/lib/db");
    const pool = getPool();
    const kw = `%${query.toLowerCase()}%`;
    // Lo que se encontro con la palabra española pero fuera de su ciudad. Se
    // usa solo si el respaldo por sinonimos tampoco encuentra nada mejor.
    let respaldoDelPais: ReturnType<typeof mapRowToJob>[] | null = null;
    const countryFilter = countryMap[isoCode] ? `%${countryName}%` : countryName;
    const N = Math.min(limit * 2, 30);

    // ── Consolidated query: strategies 1→2→2.5a→2.5b→3 in ONE query ──
    if (city) {
      const cityNorm = city.toLowerCase();
      const provincia = CIUDAD_A_PROVINCIA[cityNorm];
      const cercanas = CIUDADES_CERCANAS[cityNorm];
      const limitrofes = provincia ? PROVINCIAS_LIMITROFES[provincia] : undefined;

      // Build scope CASE with dynamic location patterns
      const scopeParts: string[] = [];
      const params: (string | number)[] = [kw, isoCode, countryFilter];
      let pIdx = 4; // $1=kw, $2=iso, $3=countryName

      // Scope 0: la ciudad, escrita de todas las maneras en que aparece.
      // La base de datos guarda lo que manda cada portal: 16.263 ofertas en
      // "München" y solo 2.025 en "Munich". Buscando una sola forma se pierden
      // casi todas. Igual con Colonia, Viena, Praga o Copenhague.
      const formasCiudad = aliasCiudad(cityNorm);
      const ciudadClauses = formasCiudad.map((_, i) =>
        `LOWER(city) LIKE $${pIdx + i} OR LOWER(province) LIKE $${pIdx + i}`
      ).join(" OR ");
      scopeParts.push(`WHEN (${ciudadClauses}) THEN 0`);
      formasCiudad.forEach(f => params.push(`%${f}%`));
      pIdx += formasCiudad.length;

      // Scope 1: provincia match
      if (provincia) {
        scopeParts.push(`WHEN LOWER(city) LIKE $${pIdx} OR LOWER(province) LIKE $${pIdx} THEN 1`);
        params.push(`%${provincia}%`);
        pIdx++;
      }

      // Scope 2: ciudades cercanas
      if (cercanas && cercanas.length > 0) {
        const nearClauses = cercanas.map((_: string, i: number) =>
          `LOWER(city) LIKE $${pIdx + i} OR LOWER(province) LIKE $${pIdx + i}`
        ).join(" OR ");
        scopeParts.push(`WHEN (${nearClauses}) THEN 2`);
        cercanas.forEach(c => params.push(`%${c}%`));
        pIdx += cercanas.length;
      }

      // Scope 3: provincias limítrofes
      if (limitrofes && limitrofes.length > 0) {
        const limClauses = limitrofes.map((_: string, i: number) =>
          `LOWER(city) LIKE $${pIdx + i} OR LOWER(province) LIKE $${pIdx + i}`
        ).join(" OR ");
        scopeParts.push(`WHEN (${limClauses}) THEN 3`);
        limitrofes.forEach(p => params.push(`%${p}%`));
        pIdx += limitrofes.length;
      }

      // Scope 4: anywhere in country (fallback)
      scopeParts.push("ELSE 4");
      // Se pasaba String(N): Postgres recibía el LIMIT como texto y abortaba con
      // "argument of LIMIT must be type bigint, not type text", así que la
      // búsqueda de Guzzi fallaba SIEMPRE que el usuario nombraba una ciudad.
      params.push(N);

      const scopeCase = scopeParts.length > 0
        ? `CASE ${scopeParts.join(" ")} END`
        : "4";

      // Dos pasadas, igual que en el buscador web.
      //
      // La primera busca el oficio en el TÍTULO y como palabra entera. Buscar
      // "%bar%" dentro de la descripción devolvía "Learning Architect" y
      // "Senior Analytics Engineer" como camareros — comprobado en la base de
      // datos. La descripción solo entra en la segunda pasada, si con el título
      // no ha salido nada, para no dejar fuera anuncios de título vago tipo
      // "Personal para restaurante".
      // porIndicePais: el país por su índice (lower(country) = ...). $3 se
      // nombra igualmente porque va en los parámetros y Postgres no admite uno
      // sin usar; con el valor ya conocido, "$3 IS NOT NULL" se queda en true.
      const consulta = (dondeBuscar: string, porIndicePais = false) => `
        SELECT id, title, company, city, province, salary, "sourceName", "sourceUrl",
               ${scopeCase} as scope_rank
        FROM "JobListing"
        WHERE "isActive" = true
          AND (${dondeBuscar})
          AND ${porIndicePais
            ? "LOWER(country) = LOWER($2) AND $3::text IS NOT NULL"
            : "(LOWER(country) = LOWER($2) OR LOWER(country) LIKE $3)"}
        ORDER BY scope_rank, "createdAt" DESC
        LIMIT $${pIdx}
      `;

      // $1 pasa de ser '%camarero%' a '\mcamarero\M': el mismo hueco, otra forma.
      //
      // NO SE METEN AQUÍ LOS SINÓNIMOS, aunque sería lo lógico. Se probó a
      // buscar el oficio en todos los idiomas de una vez, con un patrón
      // "\m(driver|chofer|conductor|...)\M", y la consulta pasó de 86 ms a
      // 176 SEGUNDOS: una alternancia así no puede usar el índice trigram y
      // recorre los dos millones de filas una a una. En un servidor de dos
      // núcleos eso tumba la aplicación entera.
      //
      // Los sinónimos se aplican más abajo, cuando hacen falta (ver el aviso
      // sobre el respaldo por sinónimos justo después de esta consulta).
      const paramsTitulo = [...params];
      paramsTitulo[0] = "\\m" + query.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\M";

      let r = await pool.query(consulta("title ~* $1"), paramsTitulo);
      // La descripción, solo en España y entrando por el país: con el OR del
      // país se leían los 3,6 millones de filas y se cortaba a los 15 s
      // (10 oct 2026). Fuera de España una palabra española en la descripción
      // casi nunca aparece; para eso está el respaldo por sinónimos de abajo,
      // que busca el oficio en el idioma de allí.
      if (r.rows.length === 0 && isoCode === "ES") {
        r = await pool.query(consulta("LOWER(title) LIKE $1 OR LOWER(description) LIKE $1", true), params);
      }

      // SI LO ENCONTRADO NO ES DE SU CIUDAD, TODAVÍA NO VALE.
      //
      // La palabra española puede aparecer en algún título suelto del país y
      // eso bastaba para dar la búsqueda por buena, sin llegar nunca a mirar
      // el oficio en el idioma de allí. Comprobado: "conductor en Sídney"
      // encontraba 14 "Funeral Conductor" y "Train Conductor" repartidos por
      // Australia — que allí no es conducir — y se quedaba tan ancho, con 188
      // "driver" en Sídney sin mirar. Igual con "electricista en Ámsterdam" y
      // sus 135 "elektricien".
      //
      // Si no hay ni una de la ciudad pedida, se deja seguir hasta el respaldo
      // por sinónimos de abajo, que sí busca en todos los idiomas. Solo se
      // paga esa consulta extra en los casos que hoy salen mal; meter los
      // sinónimos en la consulta de arriba costaba 176 segundos.
      const hayDeLaCiudad = r.rows.some(f => (f as { scope_rank: number }).scope_rank === 0);

      if (r.rows.length > 0 && (hayDeLaCiudad || !city)) {
        const scopeRank: number = (r.rows[0] as { scope_rank: number }).scope_rank;
        const scopeMap: Record<number, "ciudad" | "provincia" | "cercanas" | "pais"> = {
          0: "ciudad", 1: "provincia", 2: "cercanas", 3: "provincia", 4: "pais",
        };
        return {
          jobs: (r.rows as DbJobRow[]).slice(0, limit).map(j => mapRowToJob(j, city)),
          scope: scopeMap[scopeRank] || "pais",
        };
      }

      // Se guarda lo encontrado por si el respaldo por sinónimos tampoco da
      // nada de la ciudad: mejor ofertas del país que ninguna.
      if (r.rows.length > 0) {
        respaldoDelPais = (r.rows as DbJobRow[]).slice(0, limit).map(j => mapRowToJob(j, city));
      }
    } else {
      // No city: just strategy 3 (nationwide)
      //
      // Solo el TÍTULO, como palabra entera. Buscaba también en la descripción
      // con LIKE '%...%', que obliga a leer el país entero: "enfermera" en
      // Alemania tardaba 22 s, el pool la cortaba a los 15 y Guzzi contestaba
      // "no me sale nada" con 12.496 ofertas de enfermería en la base. Por
      // título tarda 0,05 s, y si no hay nada sigue el respaldo por sinónimos
      // de abajo, que busca el oficio en el idioma de allí (0,24 s).
      // Medido en producción el 10 oct 2026.
      const r3 = await pool.query(
        `SELECT id, title, company, city, province, salary, "sourceName", "sourceUrl"
         FROM "JobListing"
         WHERE "isActive" = true
           AND title ~* $1
           AND (LOWER(country) = LOWER($2) OR LOWER(country) LIKE $3)
         ORDER BY "createdAt" DESC LIMIT $4`,
        ["\\m" + query.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\M", isoCode, countryFilter, N]
      );
      if (r3.rows.length > 0) {
        return { jobs: (r3.rows as DbJobRow[]).slice(0, limit).map(j => mapRowToJob(j, city)), scope: "pais" };
      }
    }

    // -- Estrategia 4: sinónimos del puesto (consolidated into ONE query) --
    //
    // Se combinan DOS diccionarios:
    //  - SINONIMOS_PUESTO: variantes en español ("camarero" -> "sala", "barra")
    //  - expandirPuesto: el mismo oficio en otros idiomas ("serveur", "kellner")
    //
    // Solo con el primero, Guzzi buscaba "%camarero%" en Francia y no encontraba
    // nada, porque allí las ofertas dicen "Serveur". En las pruebas, 10 de 12
    // búsquedas fuera de España respondían "no hay ofertas" habiendo cientos.
    const queryNorm = query.toLowerCase();
    const enOtrosIdiomas = expandirPuesto(query);
    // La entrada del diccionario español que corresponde al puesto, si hay.
    // La condición del bucle llevaba "|| enOtrosIdiomas.length > 1", que es
    // cierto para cualquier puesto conocido: el bucle se quedaba con la
    // PRIMERA entrada del diccionario (carretillero) y mezclaba sus sinónimos
    // con todo. "Camarero en Pamplona" devolvía "Operario puente grúa +
    // carretilla" (prueba de flujos del 10 oct 2026).
    const entradaEs = Object.entries(SINONIMOS_PUESTO).find(([key, syns]) =>
      queryNorm.includes(key) || syns.some(s => queryNorm.includes(s)));
    const candidatas: Array<[string, string[]]> = entradaEs
      ? [entradaEs]
      : enOtrosIdiomas.length > 1 ? [[queryNorm, []]] : [];
    for (const [key, syns] of candidatas) {
      {
        const allSynonyms = [...new Set([key, ...syns, ...enOtrosIdiomas])];

        // Se busca el oficio en el TÍTULO y como palabra entera.
        //
        // Antes se buscaba "%bar%" también dentro de la descripción, y eso casa
        // con "Barcelona", "barrera" o "colaborar": pidiendo camarero en Berlín
        // salía un "Freelance Full-Stack Developer" porque en su descripción
        // aparecía la palabra. El título es donde está el oficio de verdad.
        // En grupos y como mucho 16 (7 nov 2026): PostgreSQL solo guarda 32
        // expresiones compiladas y, pasadas 32, las recompila en cada fila.
        // "camarero" tiene 44 sinónimos desde el eslovaco, el esloveno y el
        // griego, y la consulta pasaba de 0,5 s a 52 s. Mismo resultado: un
        // grupo de palabras enteras equivale a buscarlas una a una.
        const synPatterns = expresionesDePalabraEntera(allSynonyms);
        const synOrClauses = synPatterns.map((_, i) => `title ~* $${i + 1}`).join(" OR ");
        // EL PAÍS, SEGÚN DÓNDE. Medido el 10 oct 2026 con 28 sinónimos de
        // camarero: en España (68.000 ofertas) entrar por el índice del país
        // tarda 0,6 s y el OR de abajo 3,5 s, que con el servidor cargado pasó
        // de 15 s y dejó a Guzzi sin ofertas en Pamplona. Fuera es al revés:
        // con 23 sinónimos de enfermera en Alemania (446.000 ofertas) el índice
        // del país tarda 4,3 s y el OR, que obliga a ir por el título, 0,24 s.
        const enEspana = isoCode === "ES";
        const synParams: (string | number)[] = enEspana ? [...synPatterns, isoCode] : [...synPatterns, isoCode, countryFilter];
        const condPaisSyn = enEspana
          ? `LOWER(country) = LOWER($${synPatterns.length + 1})`
          : `(LOWER(country) = LOWER($${synPatterns.length + 1}) OR LOWER(country) LIKE $${synPatterns.length + 2})`;
        let synIdx = synParams.length + 1;

        // Esta consulta filtraba por país pero NO por ciudad: pidiendo
        // "limpieza en Lisboa" contestaba con un "Jefe de Cocina (Barcelona)".
        // Si el usuario dijo una ciudad, se ordena poniéndola delante; nunca se
        // descarta el resto, porque en ciudades pequeñas dejaría cero.
        let synOrden = `"createdAt" DESC`;
        if (city) {
          const formas = aliasCiudad(city.toLowerCase());
          const ciudadOr = formas.map((_, i) =>
            `LOWER(city) LIKE $${synIdx + i} OR LOWER(province) LIKE $${synIdx + i}`
          ).join(" OR ");
          formas.forEach(f => synParams.push(`%${f}%`));
          synIdx += formas.length;
          synOrden = `(CASE WHEN (${ciudadOr}) THEN 0 ELSE 1 END), "createdAt" DESC`;
        }
        synParams.push(N);

        const r4 = await pool.query(
          `SELECT id, title, company, city, province, salary, "sourceName", "sourceUrl"
           FROM "JobListing"
           WHERE "isActive" = true
             AND (${synOrClauses})
             AND ${condPaisSyn}
           ORDER BY ${synOrden} LIMIT $${synIdx}`,
          synParams
        );
        if (r4.rows.length > 0) {
          return { jobs: (r4.rows as DbJobRow[]).slice(0, limit).map(j => mapRowToJob(j, city)), scope: "sinonimo" };
        }
        break;
      }
    }

    // Antes de salir a las APIs de fuera: si teniamos ofertas del pais
    // guardadas, valen mas que nada. Se devuelven diciendo que el alcance es
    // el pais, no la ciudad, para no enganar sobre donde estan.
    if (respaldoDelPais && respaldoDelPais.length > 0) {
      return { jobs: respaldoDelPais, scope: "pais" };
    }

    // -- Estrategia 5: APIs externas --------------------------------------
    const { buscarOfertasReales } = await import("@/lib/job-search/real-search");
    const extOfertas = await Promise.race([
      buscarOfertasReales(query, city, Math.min(limit * 2, 20)),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    // Las APIs externas devuelven lo que les da la gana: preguntando por
    // "cocinero en Berlín" contestaban con empleos remotos de Estados Unidos.
    // Se filtra por oficio antes de enseñar nada; si no queda ninguno de
    // verdad, es mejor decir que no hay que colocar cualquier cosa.
    //
    // Y hay que filtrar por SITIO además de por oficio. Con el oficio solo,
    // "cocinero en Londres" devolvía "Cocinero/a - Resort 3* Club Mac,
    // Alcúdia": cocinero sí, Londres no. Estas ofertas no pasan por el filtro
    // de país de la base de datos, así que el sitio se comprueba aquí.
    const formasSitio = city ? aliasCiudad(city.toLowerCase()) : [];
    const esDelSitio = (ubicacion: string): boolean => {
      if (formasSitio.length === 0) return true;   // sin ciudad pedida, vale cualquiera
      const u = ubicacion.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      return formasSitio.some(f => u.includes(f));
    };

    const extFiltradas = (extOfertas ?? []).filter(o =>
      tituloCoincide(String(o.titulo ?? ""), query) && esDelSitio(String(o.ubicacion ?? ""))
    );
    if (extFiltradas.length > 0) {
      return {
        jobs: extFiltradas.slice(0, limit).map(o => ({
          id: String(o.id), titulo: String(o.titulo), empresa: String(o.empresa),
          ubicacion: String(o.ubicacion), salario: String(o.salario ?? "Ver en oferta"),
          fuente: String(o.fuente), match: Number(o.match ?? 0), url: String(o.url ?? ""),
        })),
        scope: "api",
      };
    }

    return null;
  } catch (e) {
    console.error("[Guzzi] Error en searchJobsReal:", (e as Error).message);
    return null;
  }
}

/**
 * "En mi pueblo no hay nada" — pues mira lo que hay al lado, con los números.
 *
 * Devuelve el desglose de ciudades cercanas donde SÍ hay ese oficio, ordenadas
 * por cercanía, con lo que costaría el gasóleo cada mes. La gente descarta
 * buscar fuera porque "suena caro", sin haber echado nunca la cuenta; casi
 * siempre compensa, y aquí lo ve en una tabla.
 *
 * Devuelve null si no se puede calcular (ciudad sin coordenadas, o nada cerca).
 * En ese caso quien llama sigue con el mensaje de siempre: es mejor no decir
 * nada que enseñar un número inventado.
 */
async function mapaDeAlrededores(
  puesto: string, ciudad: string, pais: string
): Promise<string | null> {
  try {
    const { ciudadesCercanasConOfertas, precioGasoleo } = await import("@/lib/guzzi/desplazamiento");
    const cercanas = await ciudadesCercanasConOfertas(expandirPuesto(puesto), ciudad, pais);
    if (cercanas.length === 0) return null;

    const filas = cercanas.map(c => {
      const coste = c.costeMes !== null
        ? ` · ⛽ ${c.costeMes} €/mes${c.costeCompartido ? ` (${c.costeCompartido} € compartiendo coche)` : ""}`
        : "";
      return `**${c.ciudad}** — a ${c.km} km · ${c.ofertas} ${c.ofertas === 1 ? "oferta" : "ofertas"}${coste}`;
    }).join("\n");

    const precio = await precioGasoleo(pais);
    // Se dice de dónde sale el número y qué NO incluye. Un cálculo que la
    // gente va a usar para decidir si acepta un trabajo no puede ser una caja
    // negra: si luego no le cuadra, pierde la confianza en todo lo demás.
    const nota = precio
      ? `\n\n_Cuentas con el gasóleo a ${precio.toFixed(3)} €/l (precio real de hoy, Ministerio), ida y vuelta 22 días al mes y un coche de 6,5 l/100 km. No incluye peajes ni el desgaste del coche, y los kilómetros son estimados._`
      : "";

    return `${filas}${nota}\n\n¿Te miro las ofertas de alguna de estas? Dime la ciudad y te las saco.`;
  } catch (e) {
    console.error("[Guzzi] mapaDeAlrededores:", (e as Error).message);
    return null;
  }
}

/**
 * Las cuentas de las ofertas que se acaban de enseñar, cuando son de fuera.
 *
 * En una búsqueda desde un pueblo es normal que salgan dos ofertas de allí y
 * tres de la capital. El usuario ve las de la capital y piensa "eso me pilla
 * lejos" sin saber si son 20 km o 90, ni lo que costaría el gasóleo. Esto se lo
 * dice de las ciudades que TIENE DELANTE, no de un listado teórico.
 *
 * Devuelve cadena vacía si todas son de su ciudad o si no se puede calcular.
 */
async function cuentasDeLasOfertas(
  jobs: Array<{ ubicacion?: string; salario?: string }>,
  ciudadPedida: string,
  pais: string
): Promise<string> {
  try {
    const { calcularCoste } = await import("@/lib/guzzi/desplazamiento");
    const normaliza = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
    const pedida = normaliza(ciudadPedida);

    // Las ciudades de fuera que aparecen, sin repetir. Solo las tres primeras:
    // el objetivo es animar a mirar al lado, no soltarle una tabla enorme.
    const deFuera = [...new Set(
      jobs.map(j => (j.ubicacion || "").split(",")[0].trim())
          .filter(c => c && !normaliza(c).includes(pedida) && !pedida.includes(normaliza(c)))
    )].slice(0, 3);
    if (deFuera.length === 0) return "";

    const lineas: string[] = [];
    for (const ciudad of deFuera) {
      // Se pasa el salario de una oferta de esa ciudad, si lo trae: así el
      // veredicto puede decir cuánto queda limpio en vez de solo el gasto.
      const conSalario = jobs.find(j =>
        normaliza(j.ubicacion || "").includes(normaliza(ciudad)) && j.salario && j.salario !== "Ver en oferta"
      );
      const c = await calcularCoste(ciudadPedida, ciudad, conSalario?.salario, pais);
      if (!c) continue;
      const limpio = c.quedaCompartido !== null
        ? ` → te quedarían **${c.quedaCompartido} €** compartiendo coche`
        : "";
      lineas.push(`• **${ciudad}** está a ${c.km} km (unos ${c.minutos} min). Ida y vuelta todo el mes: **${c.costeSolo} €** de gasóleo, o **${c.costeCompartido2} €** si compartes coche${limpio}.`);
    }
    if (lineas.length === 0) return "";

    return `\n\n🚗 **Por si te lo estás preguntando:**\n${lineas.join("\n")}\n\n_Con el gasóleo al precio real de hoy, 22 días de ida y vuelta y un coche de 6,5 l/100 km. Sin peajes ni desgaste, y los kilómetros son estimados._`;
  } catch (e) {
    console.error("[Guzzi] cuentasDeLasOfertas:", (e as Error).message);
    return "";
  }
}

/** "GB" (Escocia, Gales...) es el mismo país que "UK" en la app. */
function esPaisNuestro(codigo: string): boolean {
  return !!PAISES[codigo === "GB" ? "UK" : codigo];
}

function nombreDePais(codigo: string): string {
  return PAISES[codigo]?.nombre ?? nacionalidadDe(codigo)?.nombre ?? codigo;
}

/**
 * Para quien busca en un país donde todavía no tenemos ofertas (Perú,
 * Colombia...): se le dice claro y se le da lo que sí tiene allí, la bolsa
 * pública de empleo de su país. Vacío si el país es de los nuestros.
 */
function avisoPaisSinOfertas(codigo: string): string {
  if (esPaisNuestro(codigo)) return "";
  const servicio = servicioEmpleoDe(codigo);
  return `\n\n🌎 De **${nombreDePais(codigo)}** todavía no tenemos ofertas en BuscayCurra; las estamos preparando.`
    + (servicio ? ` Mientras, la bolsa pública de empleo de allí es gratis: [${servicio.nombre}](${servicio.url}).` : "");
}

function fallbackMessage(puesto: string, ciudad: string): string {
  const syn = Object.entries(SINONIMOS_PUESTO).find(([k, v]) =>
    puesto.toLowerCase().includes(k) || v.some(s => puesto.toLowerCase().includes(s))
  );
  const sugerencias = syn
    ? `\n• 🔄 Prueba: "${syn[1][0]}" o "${syn[1][1]}"`
    : "\n• 🔄 Prueba con otro nombre del puesto";
  return `🔍 Con **${puesto}**${ciudad ? ` en **${ciudad}**` : ""} no me sale nada ahora mismo, pero tenemos varias vías:\n${sugerencias}\n• 📍 Amplía la zona (provincia o comunidad)\n• 🔍 Usa el buscador avanzado con más filtros\n• 📧 Activa alertas y te aviso cuando lleguen\n• 🏢 ¿Es una empresa pequeña o local? Dime el nombre y te busco en Google Maps con teléfono, email y web para enviar el CV directamente.\n\n✨ ¡El mercado se mueve a diario, vuelvo a mirar mañana!`;
}

function buildJobsText(puesto: string, ciudad: string, ofertas: unknown[], scope?: string): string {
  const scopeMsg = scope === "provincia"
    ? ` (en la provincia de ${ciudad})`
    : scope === "cercanas"
      ? ` (cerca de ${ciudad})`
      : scope === "pais"
        // Antes ponia "(en toda Espana)" literal, aunque la busqueda fuera en
        // Suiza o en Alemania.
        ? ` (en todo el país)`
        : scope === "sinonimo"
          ? " (puestos relacionados)"
          : ciudad ? ` en **${ciudad}**` : "";

  let text = `🔍 **${ofertas.length} oferta${ofertas.length !== 1 ? "s" : ""}** de **${puesto}**${scopeMsg}:\n\n`;
  (ofertas as Array<{ id?: string; titulo?: string; empresa?: string; ubicacion?: string; salario?: string; url?: string }>)
    .forEach((o, i) => {
      const em = ["🥇", "🥈", "🥉", "📌"][i] || "📌";

      // SE ENLAZA A LA FICHA DE LA PROPIA APLICACIÓN, no al portal de fuera.
      //
      // Antes solo se ofrecía el enlace al portal original, y ahí el usuario o
      // se encontraba la oferta ya retirada, o una web que le pedía registrarse
      // otra vez. La ficha de /app/ofertas/[id] ya existía y tiene todo lo que
      // hace falta —descripción completa, salario, empresa y hasta el email de
      // contacto para mandar el CV—, pero Guzzi no la usaba.
      //
      // Las ofertas de la base de datos llegan con el id como "db-xxx"; las que
      // vienen de las APIs de fuera no están guardadas y no tienen ficha, así
      // que para esas se mantiene el enlace externo de siempre.
      const idInterno = o.id?.startsWith("db-") ? o.id.slice(3) : null;
      const link = idInterno
        ? ` — [Ver detalles](/app/ofertas/${idInterno})`
        : o.url ? ` — [Ver oferta](${o.url})` : "";
      // Las ofertas de fuera vienen en su idioma: "Kellner (m/w/d)" no le dice
      // nada a alguien de aquí. Se le añade el oficio en español detrás, para
      // que sepa de qué es sin tener que traducir nada.
      const titulo = anotarOficio(o.titulo || "", puesto);
      text += `${em} **${titulo}**\n   📍 ${o.ubicacion} · 💰 ${o.salario || "Ver en oferta"}${link}\n\n`;
    });

  if (scope && scope !== "ciudad") {
    text += `ℹ️ _No encontré resultados exactos en "${ciudad}", te muestro los más cercanos._\n\n`;
  }
  text += `📧 **¿Envío tu CV a todas?** Di "sí" y me encargo.\n\n💡 _¿Buscas una empresa que no sale? Dime "busca [nombre]" y te doy email y teléfono con Google Maps._`;
  return text;
}

function extractCompanyName(text: string): string | null {
  // "búscame la peluquería Enjoy Estilistas": el tipo de negocio y el nombre,
  // juntos, que es como mejor lo encuentra el buscador de sitios. Va primero:
  // la regla de "busca" de abajo cortaba en dos letras ("pe").
  const conTipo = text.trim().match(/^(?:b[uú]sca(?:me)?|busco|encu[eé]ntra(?:me)?|localiza(?:me)?)\s+(?:el\s+|la\s+|los\s+|las\s+|un\s+|una\s+)?((?:bar|restaurante|tienda|hotel|cafeter[ií]a|supermercado|taller|panader[ií]a|farmacia|cl[ií]nica|peluquer[ií]a|barber[ií]a|gimnasio|academia|centro\s+de\s+est[eé]tica|est[eé]tica)\s+.{2,50}?)(?:\s+en\s+\S.*)?\s*[.?!]*$/i);
  if (conTipo?.[1]) return conTipo[1].trim();
  const patterns = [
    /empresa\s+[""]?(\w[\w\s]{2,40}?)[""]?\s*(?:es|tiene|ofrece|busca|contrata|$)/i,
    /(?:info|información|datos)\s+(?:sobre\s+)?(?:la\s+)?empresa\s+[""]?([\w\s]{2,40}?)[""]?$/i,
    /(?:qué|quien|quién)\s+(?:es|conoces)\s+(?:a\s+)?[""]?([\w\s]{2,40}?)[""]?\s*(?:empresa)?/i,
    /(?:busca|conoce[sr]?|sabes?\s+(?:algo\s+)?(?:de|sobre))\s+(?:la\s+)?(?:empresa\s+)?[""]?([\w\s]{2,40}?)[""]?\s*(?:empresa)?/i,
    /dime\s+(?:algo\s+)?(?:de|sobre)\s+(?:la\s+)?(?:empresa\s+)?[""]?([\w\s]{2,40}?)[""]?/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].trim();
  }
  // Fallback: si el texto es corto y parece nombre de empresa
  let clean = text.replace(/^(?:busca|busco|info|información|datos|dime|conoce|saber|rastrea|rastreame)\s+(?:sobre\s+)?(?:la\s+)?(?:empresa\s+)?/i, "").trim();
  // Quitar artículos y palabras de tipo de negocio del principio
  clean = clean.replace(/^(?:el|la|los|las|un|una)\s+/i, "");
  clean = clean.replace(/^(?:bar|restaurante|tienda|hotel|cafeter[ií]a|empresa|supermercado|taller|panader[ií]a|farmacia|cl[ií]nica|peluquer[ií]a|pizzer[ií]a|hamburgueser[ií]a|asador|sidrer[ií]a|taberna|bodega|mes[óo]n)\s+/i, "");
  // Quitar "en [ciudad]" o ", [ciudad]" del final
  clean = clean.replace(/\s+(?:en|por)\s+\w[\w\s]*$/i, "");
  clean = clean.replace(/,\s*\w[\w\s]*$/i, "");
  clean = clean.replace(/\s+para\s+echar\s+(?:el\s+)?curr[ií]culum.*$/i, "");
  if (clean.length >= 3 && clean.length <= 50 && !/(?:trabajo|empleo|cv|curriculum|oferta|buscar)/i.test(clean)) {
    return clean;
  }
  return null;
}

function sinTildes(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

/**
 * Papeles para trabajar en un país, desde lib/primeros-pasos.ts.
 *
 * Cada documento lleva su plazo y, cuando lo hay, el enlace oficial: es lo que
 * se puede comprobar. null si el país no tiene ficha (entonces contesta la IA).
 */
function respuestaPapelesPais(texto: string): string | null {
  const tn = sinTildes(texto);
  const ALIAS: Record<string, string> = {
    inglaterra: "UK", londres: "UK", "reino unido": "UK", eeuu: "US", "estados unidos": "US",
    holanda: "NL", chequia: "CZ", "republica checa": "CZ",
  };
  let codigo: string | undefined;
  for (const [alias, cod] of Object.entries(ALIAS)) {
    if (new RegExp(`\\b${alias}\\b`).test(tn)) { codigo = cod; break; }
  }
  if (!codigo) {
    codigo = LISTA_PAISES.find((p) =>
      [p.nombre, p.nombreLocal].some((n) => n && new RegExp(`\\b${sinTildes(n)}\\b`).test(tn))
    )?.codigo;
  }
  if (!codigo) return null;
  const info = getPrimerosPasos(codigo);
  const pais = LISTA_PAISES.find((p) => p.codigo === codigo);
  if (!info || !pais) return null;

  const l: string[] = [];
  l.push(`🌍 **Papeles para trabajar en ${pais.nombre}**`);
  l.push("");
  l.push(`🛂 ${info.visado.descripcion}${info.visado.enlaceOficial ? ` · [Fuente oficial](${info.visado.enlaceOficial})` : ""}`);
  if (info.papeleo.documentos.length) {
    l.push("");
    l.push("📄 **Lo que vas a necesitar:**");
    for (const d of info.papeleo.documentos.slice(0, 6)) {
      l.push(`• **${d.nombre}**${d.obligatorio ? "" : " (recomendable)"} — ${d.descripcion} _(${d.tiempoObtener})_${d.enlaceOficial ? ` · [Dónde](${d.enlaceOficial})` : ""}`);
    }
  }
  if (info.papeleo.consejo) {
    l.push("");
    l.push(`💡 ${info.papeleo.consejo}`);
  }
  l.push("");
  l.push(`👉 [Guía completa para trabajar en ${pais.nombre}](/trabajar-en/${codigo.toLowerCase()}): ofertas, alojamiento y salarios.`);
  return l.join("\n");
}

/**
 * "¿Me compensa ir a trabajar a Zaragoza desde Tudela?" → la cuenta de verdad.
 *
 * Saca el origen ("desde X", "de X a Y") y el destino ("a Y", "hasta Y"); si no
 * hay origen, usa la ciudad del CV. Kilómetros, minutos y gasóleo al mes con el
 * precio oficial del Ministerio (lib/guzzi/desplazamiento.ts). null si no se
 * entiende el trayecto: entonces contesta la IA.
 */
async function respuestaDesplazamiento(texto: string, ciudadCv: string): Promise<string | null> {
  const tn = sinTildes(texto).replace(/[¿?¡!.,;:]/g, " ");
  const CORTE = /\s(?:a|hasta|desde|de|para|y|todos|cada|al|en|me|si|compensa|merece|trabajar|ir)\s/;
  const lugar = (s: string | undefined) => {
    if (!s) return "";
    const limpio = (" " + s + " ").split(CORTE)[0].trim().split(/\s+/).slice(0, 3).join(" ");
    return limpio.length >= 3 ? limpio : "";
  };
  let origen = "";
  let destino = "";
  const deA = tn.match(/\bde\s+([a-z\s]{3,40}?)\s+(?:a|hasta)\s+([a-z\s]{3,40})/);
  if (deA) { origen = lugar(deA[1]); destino = lugar(deA[2]); }
  const desde = tn.match(/\bdesde\s+([a-z\s]{3,40})/);
  if (desde) origen = lugar(desde[1]);
  if (!destino) {
    const hacia = tn.match(/\b(?:ir(?:me)?|trabajar|moverme|viajar|currar)\s+(?:a\s+trabajar\s+)?(?:a|hasta|en)\s+([a-z\s]{3,40})/);
    destino = lugar(hacia?.[1]);
  }
  if (!origen) origen = sinTildes(ciudadCv);
  if (!origen || !destino || origen === destino) return null;

  const mayus = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  const { calcularCoste } = await import("@/lib/guzzi/desplazamiento");
  const c = await calcularCoste(mayus(origen), mayus(destino), undefined, "ES");
  if (!c) {
    return `🚗 No encuentro **${mayus(origen)}** o **${mayus(destino)}** en el mapa. Escríbemelo así: "¿me compensa ir de Tudela a Zaragoza?"`;
  }
  const l: string[] = [];
  l.push(`🚗 **De ${mayus(origen)} a ${mayus(destino)}:** ${c.km} km, unos ${c.minutos} min por trayecto.`);
  l.push("");
  l.push(`⛽ Con el gasóleo a **${c.precioLitro.toFixed(3)} €/l** (precio oficial de hoy), ir y volver cada día laborable son **${c.costeSolo} € al mes** yendo solo, **${c.costeCompartido2} €** compartiendo coche entre dos y **${c.costeCompartido3} €** entre tres.`);
  // Sin sueldo, el "veredicto" de calcularCoste repite estas mismas cifras y la
  // misma coletilla del sueldo: en la primera prueba salía dos veces seguidas.
  l.push("");
  l.push("💡 Si me dices lo que pagan en la oferta, te digo cuánto te quedaría limpio.");
  return l.join("\n");
}

function localReply(intent: string, cv?: CVParsed | null): string {
  switch (intent) {
    case "foto":
      return "📸 **Cómo mejorar tu foto de CV con IA:**\n\nSube tu foto a ChatGPT (o cualquier IA con imagen) y usa este prompt:\n\n---\n*Utiliza esta foto para realizar los siguientes cambios:\n\n1. Crear un fondo blanco y cambiar todo el fondo actual.\n2. Cambiar la camiseta por una camisa blanca.\n3. Poner la figura en posición sentada.\n\nFotografía tamaño carnet hasta la altura de los hombros. Preséntalo para un currículum.*\n\n---\n\n**Resultado:** foto profesional lista para el CV.";
    case "buscar":
      if (cv?.ultimoPuesto) {
        return `🔍 Conozco tu perfil (**${cv.ultimoPuesto}**${cv.ciudad ? ` en **${cv.ciudad}**` : ""}). Dime "buscar ofertas" y te muestro las que mejor encajan ahora mismo. También puedes usar el buscador avanzado. `;
      }
      return "🔍 Dime qué trabajo buscas y en qué ciudad o país, y te busco las mejores ofertas en toda Europa. ";
    case "enviar":
      return cv?.ultimoPuesto
        ? `📧 Basándome en tu CV (${cv.ultimoPuesto}), busca en 🔍 Buscar y usa el botón "Enviar CV" en cada oferta.`
        : "📧 Sube tu CV primero (botón clip de abajo) y luego te busco ofertas que encajen.";
    case "crear_cv":
      return "📝 ¡Vamos! ¿Cuál es tu nombre completo? (Te pregunto de uno en uno, facilísimo) ";
    case "cv_mejorado":
      return "✨ **Mejora de CV no disponible ahora mismo.**\n\nPuedo ayudarte con estos consejos mientras tanto:\n• Usa verbos de acción (logré, implementé, coordiné)\n• Incluye logros cuantificables (\"aumenté ventas un 20%\")\n• Adapta las palabras clave al puesto que buscas\n• Mantén el CV en 1-2 páginas máximo\n\n¿Quieres que te dé más consejos personalizados? ";
    case "entrevista_prep":
      return `🎯 **¡Vamos a preparar esa entrevista!**\n\nAquí tienes un guion rápido que funciona:\n• Prepara 3 ejemplos con método STAR (Situación, Tarea, Acción, Resultado)\n• Investiga la empresa: sector, tamaño, noticias recientes\n• Prepara 2-3 preguntas inteligentes para hacer tú al final\n• Ensaya tu presentación de 1 minuto en voz alta (marca la diferencia)\n\n¿Sobre qué puesto es la entrevista? Te ayudo a enfocarla al 100%. `;
    case "carta_recomendacion":
      return "✉️ **Carta de presentación no disponible en este momento.**\n\nMientras tanto, puedes estructurarla así:\n1. **Asunto**: Candidatura [Puesto] — [Tu Nombre]\n2. **Apertura**: por qué te interesa esa empresa en concreto\n3. **Cuerpo**: 2-3 logros que conecten con lo que buscan\n4. **Cierre**: disponibilidad para entrevista y despedida cordial\n\n¿Te ayudo a redactarla paso a paso? ";
    case "info_empresa":
      return "🏢 **No puedo consultar información de esa empresa ahora mismo.**\n\nPuedes buscar en:\n• **LinkedIn** — página de empresa y empleados\n• **Glassdoor** — opiniones de empleados y rangos salariales\n• **Google Maps** — sede, tamaño, sector\n\n¿Quieres que busque ofertas activas de esa empresa en nuestra base de datos? 🔍";
    case "buscar_au_pair":
      return "👶 **Búsqueda Au Pair** — dime el país donde quieres ser au pair (ej: 'busca au pair en Alemania' o 'au pair en Reino Unido') y te busco ofertas con familias que necesitan cuidadores. También puedo ayudarte con tu carta 'Dear Family'. ";
    case "carta_au_pair":
      return "💌 **Carta 'Dear Family'** — primero completa tu perfil Au Pair en la sección 🧒 del menú. Luego vuelve y dime 'crea mi carta au pair' para generarla personalizada con tus datos, experiencia con niños y fotos. ";
    case "buscar_cursos":
      return "🎓 **Cursos para trabajar**\n\nTe digo lo que cuesta de verdad, lo que dura y dónde sacarlo gratis:\n\n• [Manipulador de alimentos](/app/formacion/manipulador-alimentos) — obligatorio en hostelería, se saca en una tarde\n• [Carné de carretillero](/app/formacion/carretillero) — el más pedido en almacén\n• [PRL](/app/formacion/prl-basico) y [TPC](/app/formacion/tpc-construccion) — para industria y obra\n\n👉 [Ver todos los cursos](/app/formacion)\n\nY si me dices cuál te interesa, te preparo la carta de solicitud con tu CV y te digo qué papeles te van a pedir.";
    default:
      return "¡Hola! Soy Guzzi, tu asistente de empleo. Puedo ayudarte con:\n\n🔍 Buscar ofertas de trabajo\n📝 Crear o mejorar tu CV\n🎯 Preparar entrevistas\n✉️ Cartas de presentación\n🌍 Información para emigrar\n💰 Comparar salarios\n\n¿En qué quieres que te ayude hoy?";
  }
}

// --- Rate Limiting ----------------------------------------------------------

// --- Handler principal --------------------------------------------------------

export async function POST(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  // Rate limiting: por IP o userId
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
  const { allowed, retryAfter } = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: `Demasiados mensajes. Espera ${retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  // 🔒 Verificar autenticación (NO confiar en userId del body)
  const { getUserId } = await import("@/lib/auth-server");
  const authUserId = await getUserId(req);
  if (!authUserId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      message, history = [], mode = "chat",
      cvData: cvDataFromClient, empresa, puesto, userId: bodyUserId, pais: paisDelChat,
    } = body as {
      message: string;
      history?: Array<{ role: string; text: string }>;
      mode?: string;
      cvData?: string;
      empresa?: string;
      puesto?: string;
      userId?: string;
      pais?: string;
    };
    // Dónde está la persona. Solo se acepta un código de dos letras: va al
    // prompt y a la búsqueda.
    const pais = typeof paisDelChat === "string" && /^[A-Za-z]{2}$/.test(paisDelChat)
      ? paisDelChat.toUpperCase() : undefined;

    // ⚠️ Ignorar userId del body, usar el autenticado
    const userId = authUserId;
    if (bodyUserId && bodyUserId !== authUserId) {
      console.warn(`[Guzzi] ⚠️ userId del body (${bodyUserId}) no coincide con token (${authUserId}) — posible ataque`);
    }

    if (!message) return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });

    // -- Verificar límites del plan --
    if (userId) {
      const { checkGuzziAccess } = await import("@/lib/guzzi-limits");
      const access = await checkGuzziAccess(userId);
      if (!access.allowed) {
        return NextResponse.json(
          {
            error: access.errorMessage,
            plan: access.plan,
            planName: access.planName,
            upgradeUrl: "/app/perfil",
          },
          { status: 402 }
        );
      }
    }

    // Si hay userId, leer el CV fresco desde la BD (ignora el cvData del cliente)
    let cvData = cvDataFromClient;
    let auPairProfile: Record<string, unknown> | null = null;
    if (userId) {
      try {
        const { getPool } = await import("@/lib/db");
        const pool = getPool();
        // 1. Buscar en user_cvs (CV subido a Guzzi)
        const row = await pool.query(
          "SELECT form_data FROM user_cvs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
          [userId]
        );
        if (row.rows[0]?.form_data) {
          cvData = JSON.stringify(row.rows[0].form_data);
        }
        // 2. Si no hay en user_cvs, buscar en CV (editor de currículum Prisma)
        if (!cvData || cvData === "{}") {
          const cvRow = await pool.query(
            `SELECT "formData" FROM "CV" WHERE "userId" = $1 ORDER BY "updatedAt" DESC LIMIT 1`,
            [userId]
          );
          if (cvRow.rows[0]?.formData) {
            cvData = typeof cvRow.rows[0].formData === "string"
              ? cvRow.rows[0].formData
              : JSON.stringify(cvRow.rows[0].formData);
          }
        }
      } catch {
        // Si falla la BD, usar el cvData del cliente como fallback
      }

      // Cargar perfil Au Pair desde Supabase
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        );
        const { data } = await supabase
          .from("au_pair_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        if (data) auPairProfile = data as Record<string, unknown>;
      } catch {
        // Sin perfil au pair, continuar normalmente
      }
    }

    const cvParsed = cvData ? parseCVData(cvData) : null;
    // El CV tal cual, para recomendar cursos (lib/guzzi/siguiente-paso.ts).
    const cvObjeto = (() => { try { return cvConContenido(cvData ? JSON.parse(cvData) : null); } catch { return null; } })();
    const groqKey = process.env.GROQ_API_KEY;



    // -- Modo preparación de entrevista ---------------------------------------
    if (mode === "prep_entrevista") {
      const ctx = cvData ? `Datos del candidato:\n${cvParsed?.resumenTexto || cvData.slice(0, 400)}` : "";
      const content = `Entrevista: "${message}". ${ctx}`;
      const reply = await callGroq(PROMPT_ENTREVISTA, content, 800)
        || await callOpenAI(PROMPT_ENTREVISTA, content, 800)
        || localReply("entrevista_prep");
      return NextResponse.json({ reply });
    }

    // -- Modo CV mejorado -----------------------------------------------------
    if (mode === "cv_mejorado" || detectIntent(message, history) === "cv_mejorado") {
      if (!cvData) {
        return NextResponse.json({
          reply: "📝 Para mejorar tu CV necesito tus datos. Súbelo en PDF (botón clip) o cuéntame tus datos aquí. ",
          action: "need_cv_data",
        });
      }

      const density = analyzeCVDensity(cvData);
      let densityNote = "";
      let maxTokens = 1200;

      if (density.isSparse) {
        densityNote = `

INSTRUCCIÓN CRÍTICA — CV CON POCA INFORMACIÓN:
El candidato tiene poca experiencia o datos. NUNCA INVENTES información, pero SÍ:
- Elabora cada experiencia con 3-4 responsabilidades típicas del puesto (ej: "Camarero" - atención al cliente, gestión de pedidos, preparación de bebidas, trabajo en equipo bajo presión)
- Escribe el perfil profesional con 4-5 frases descriptivas, no solo 2
- Añade habilidades implícitas del sector aunque no las hayan mencionado (las que cualquiera con ese puesto tendría)
- Expande la sección de formación si hay datos
- Objetivo: que el CV parezca sólido y completo aunque la base sea escasa`;
        maxTokens = 1500;
      } else if (density.isRich) {
        densityNote = `

INSTRUCCIÓN CRÍTICA — CV CON MUCHA INFORMACIÓN:
El candidato tiene mucha experiencia.
- Selecciona y resume los 2-3 logros más relevantes por empresa
- Perfil profesional: máx 3 frases impactantes
- Prioriza lo más reciente y elimina redundancias`;
        maxTokens = 1000;
      }

      const promptConDensidad = PROMPT_CV_MEJORADO + densityNote;
      const content = `Mejora este CV con los datos reales que te doy:\n\n${cvData}`;
      const reply = await callGroq(promptConDensidad, content, maxTokens)
        || await callOpenAI(promptConDensidad, content, maxTokens)
        || localReply("cv_mejorado");
      return NextResponse.json({ reply, action: "cv_mejorado" });
    }

    // -- Modo carta -----------------------------------------------------------
    if (mode === "carta_recomendacion" || detectIntent(message, history) === "carta_recomendacion") {
      // Extraer empresa/puesto del mensaje si el frontend no los pasó
      let cartaEmpresa = empresa || "";
      let cartaPuesto = puesto || "";
      if (!cartaEmpresa || !cartaPuesto) {
        // Patrones: "carta para [EMPRESA] de [PUESTO]", "carta de [PUESTO] en [EMPRESA]"
        // El nombre de la empresa coge las mínimas palabras ({0,4}?): si no, "para
        // Mercadona de reponedor" daba empresa "Mercadona de reponedor" y ningún
        // puesto, y Guzzi volvía a pedir los dos (23 oct 2026).
        const empMatch = message.match(/(?:carta\s+(?:de\s+)?(?:presentaci[oó]n|recomendaci[oó]n)\s+)?(?:para|en)\s+([A-ZÁÉÍÓÚÑ][A-Za-záéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúüñ]+){0,4}?)(?:\s+de\s+(.+?))?(?:\s*$)/);
        if (empMatch) {
          cartaEmpresa = cartaEmpresa || empMatch[1]?.trim() || "";
          cartaPuesto = cartaPuesto || empMatch[2]?.trim() || "";
        }
        // También: "de [PUESTO] en [EMPRESA]"
        if (!cartaPuesto) {
          const puestoMatch = message.match(/de\s+([a-záéíóúüñ]+(?:\s+[a-záéíóúüñ]+){0,3})\s+en\s+([A-ZÁÉÍÓÚÑ][A-Za-záéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúüñ]+){0,4})/i);
          if (puestoMatch) {
            cartaPuesto = cartaPuesto || puestoMatch[1]?.trim() || "";
            cartaEmpresa = cartaEmpresa || puestoMatch[2]?.trim() || "";
          }
        }
      }
      if (!cartaEmpresa || !cartaPuesto) {
        return NextResponse.json({
          reply: "✉️ Para la carta necesito:\n1. 🏢 Nombre de la empresa\n2. 🎯 Puesto al que aplicas\n\nDime los dos y te la genero ahora. ",
          action: "need_empresa_puesto",
        });
      }
      const ctx = cvData ? `Datos del candidato: ${cvParsed?.resumenTexto || cvData.slice(0, 400)}` : "";
      const content = `Empresa: ${cartaEmpresa}. Puesto: ${cartaPuesto}. ${ctx}`;
      const reply = await callGroq(PROMPT_CARTA, content, 800)
        || await callOpenAI(PROMPT_CARTA, content, 800)
        || localReply("carta_recomendacion");
      return NextResponse.json({ reply, action: "carta_recomendacion", empresa: cartaEmpresa, puesto: cartaPuesto });
    }

    // "Crear mi CV" (el chat lo manda como mode "entrevista"): lo que escribe
    // son respuestas para su CV. "Recepcionista en un hotel de Sevilla,
    // 2019-2022" se tomaba por una búsqueda y le salían ofertas a mitad de la
    // entrevista. Solo se busca si lo pide con esas palabras.
    const enModoCV = mode === "entrevista" && !/\b(busca|buscar|busco|buscame|búscame|ofertas?)\b/i.test(message);
    const preIntent = enModoCV ? "chat" : detectIntent(message, history);

    // -- "Búscalo" después de una foto ----------------------------------------
    // La cámara dice "He leído **Consorcio EDER**…"; un "búscalo" (o "búscalo
    // en Pamplona") busca eso, en su ciudad si no dice otra. Antes se iba a la
    // charla libre (16 oct 2026). Ver lib/camara/analizar-foto.ts.
    if (!enModoCV) {
      const { nombreDeLaFotoAnterior, buscarNegocioPorNombre } = await import("@/lib/camara/analizar-foto");
      const deLaFoto = nombreDeLaFotoAnterior(message, history);
      if (deLaFoto) {
        return NextResponse.json(await buscarNegocioPorNombre(deLaFoto.nombre, deLaFoto.ciudad || cvParsed?.ciudad || ""));
      }
    }

    // -- Ofertas que Guzzi ya le ha enseñado ("a todas", "la primera") --------
    // Antes "quiero mandar el curriculum a todas" se tomaba por el nombre de
    // una empresa ("Todas") y se buscaba en Google. Ver lib/guzzi/entender.ts.
    if (!enModoCV && !/^(send_cv_local_confirm|enviar_correo)/.test(preIntent) && refiereAOfertasMostradas(message, history)) {
      return NextResponse.json(respuestaOfertasMostradas(message, history, !!cvData));
    }

    // -- Atajos del chat con respuesta fija (lib/guzzi/respuestas-fijas.ts) ----
    if (preIntent === "envio_auto_info") {
      return NextResponse.json({ reply: textoEnvioAutomatico(!!cvData), action: "send_cv_flow" });
    }
    if (preIntent === "foto_prompts") {
      return NextResponse.json({ reply: localReply("foto"), action: "foto" });
    }

    // -- Intent: enviar el CV a un correo que da la persona --------------------
    // Ver lib/guzzi/envio-correo.ts. Primero se enseña lo que se va a enviar;
    // solo con un "sí" a esa propuesta sale, por /api/cv-sender/send, que
    // comprueba el límite del plan, los 15 días por empresa y las direcciones
    // que no llegan. La carta la escribe la cola con el CV de verdad.
    if (preIntent === "enviar_correo_cancelar") {
      return NextResponse.json({
        reply: "Vale, no lo envío. Cuando quieras mandarlo, pásame otra vez el correo o hazlo desde [tus envíos](/app/envios).",
        action: "enviar_correo",
      });
    }
    if (preIntent === "enviar_correo") {
      const pendiente = propuestaCorreoPendiente(history);
      const cambio = pendiente ? respuestaAPropuesta(message, pendiente) : null;
      const correo = extraerCorreo(message);
      const propuesta: PropuestaCorreo = cambio?.tipo === "cambiar"
        ? cambio.propuesta
        : { email: correo || "", empresa: empresaDelTexto(message) || (correo ? empresaDelCorreo(correo) : null), puesto: puestoDelTexto(message) };
      if (!propuesta.email) {
        return NextResponse.json({ reply: "¿A qué correo lo mando? Pásamelo y lo preparo.", action: "enviar_correo" });
      }
      if (!cvData) {
        return NextResponse.json({
          reply: "Para enviar tu candidatura necesito tu CV. Súbelo con el clip 📎 de abajo o hazlo en [Mi Currículum](/app/curriculum), y vuelve a pasarme el correo.",
          action: "send_cv_flow",
        });
      }
      const { motivoParaNoEnviar } = await import("@/lib/cv-sender/direccion-segura");
      const motivo = await motivoParaNoEnviar(propuesta.email);
      if (motivo) {
        return NextResponse.json({ reply: `${motivo} Si tienes otro correo de la empresa, pásamelo.`, action: "enviar_correo" });
      }
      return NextResponse.json({ reply: textoPropuesta(propuesta), action: "enviar_correo" });
    }
    if (preIntent === "enviar_correo_confirmar") {
      const p = propuestaCorreoPendiente(history);
      if (!p?.empresa) {
        return NextResponse.json({ reply: "¿A qué correo y a qué empresa lo mando? Pásamelos y lo preparo.", action: "enviar_correo" });
      }
      try {
        const sendRes = await fetch(`${BASE_INTERNA}/api/cv-sender/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}),
          },
          body: JSON.stringify({
            companyName: p.empresa,
            companyEmail: p.email,
            jobTitle: p.puesto || undefined,
            strategy: "ahora",
            useAIPersonalization: true,
          }),
        });
        const d = await sendRes.json().catch(() => ({})) as { success?: boolean; error?: string };
        if (!sendRes.ok || !d.success) {
          return NextResponse.json({
            reply: `No lo he podido enviar: ${d.error || "ha fallado el envío. Inténtalo otra vez en un momento."}`
              + (sendRes.status === 429 ? "\n\n👉 [Ver planes](/app/perfil?tab=plan)" : ""),
            action: "enviar_correo",
          });
        }
        return NextResponse.json({
          reply: `✅ **Hecho.** Tu candidatura sale en un minuto hacia **${p.empresa}** (${p.email})${p.puesto ? ` para el puesto de **${p.puesto}**` : ""}, con tu CV y una carta escrita para ${p.empresa}.\n\n`
            + "Te llegará un correo cuando salga, y la verás en [tus envíos](/app/envios). Si la empresa contesta, la respuesta te llega directamente a tu correo.",
          action: "cv_enviado",
        });
      } catch (e) {
        console.error("[enviar_correo] fallo al enviar:", (e as Error).message);
        return NextResponse.json({ reply: "No lo he podido enviar ahora mismo. Inténtalo otra vez en un momento o desde [tus envíos](/app/envios).", action: "enviar_correo" });
      }
    }

    // -- Intent: papeles para trabajar en otro país (datos verificados) --------
    // La respuesta sale de lib/primeros-pasos.ts, con los enlaces oficiales, y
    // no de la memoria del modelo gratuito, que en una prueba dijo que el carné
    // español de manipulador de alimentos vale en Alemania (no vale).
    if (preIntent === "papeles_pais") {
      const respuesta = respuestaPapelesPais(message);
      if (respuesta) return NextResponse.json({ reply: respuesta, action: "papeles_pais" });
      // Sin ficha de ese país, sigue el flujo normal y contesta la IA.
    }

    // -- "¿Qué curso me conviene?": su siguiente paso, con datos ---------------
    // (17 oct 2026) El curso que le falta según su CV o el puesto que nombra,
    // la plaza gratis más cercana, cuántas ofertas lo piden en su provincia
    // (con tres) y negocios de la zona a los que mandar el CV. Si con lo que
    // sabemos no hay curso que recomendarle, sigue el flujo normal.
    if (!enModoCV && pideSiguientePaso(message)) {
      const paso = await respuestaSiguientePaso({ mensaje: message, cv: cvObjeto, ciudad: extractCity(message) || cvParsed?.ciudad || "" })
        .catch((e) => { console.error("[siguiente-paso]", (e as Error).message); return null; });
      if (paso) {
        let reply = paso.reply;
        if (paso.empresas) {
          try {
            const negocios = await buscarNegociosLocales(paso.empresas.busqueda, paso.empresas.ciudad);
            if (negocios.length > 0) {
              reply += "\n\n" + textoNegociosLocales(negocios.slice(0, 4).map((n) => ({
                nombre: n.name, direccion: n.formatted_address, telefono: n.formatted_phone_number, web: n.website, rating: n.rating,
              })), paso.empresas.ciudad, paso.empresas.puesto, "🏭 Y aunque no tengan oferta publicada, te he buscado negocios");
            }
          } catch { /* sin Google Maps, la respuesta vale igual */ }
        }
        return NextResponse.json({ reply, jobs: paso.jobs.length ? paso.jobs : undefined, action: "siguiente_paso" });
      }
    }

    // -- Intent: renovar un carné ----------------------------------------------
    // "¿Cómo renuevo el CAP?", "¿cuándo me caduca la TPC?": con la ficha
    // verificada y su propia fecha si lo tiene guardado, no de memoria.
    if (!enModoCV) {
      const { respuestaRenovacion } = await import("@/lib/guzzi/renovacion");
      const respuesta = await respuestaRenovacion(message, userId).catch(() => null);
      if (respuesta) return NextResponse.json({ reply: respuesta, action: "renovacion_carne" });
    }

    // -- Intent: cursos con plazas reales (curso_plaza) ------------------------
    // "Curso de carretillero en Bilbao" se contesta con plazas de verdad, con
    // fecha y centro. Si no reconoce el curso, sigue el flujo normal.
    if (preIntent === "buscar_cursos") {
      const { respuestaPlazasCurso } = await import("@/lib/guzzi/plazas-cursos");
      const respuesta = await respuestaPlazasCurso(message);
      if (respuesta) return NextResponse.json({ reply: respuesta, action: "plazas_curso" });
    }

    // -- Intent: la cuenta (no el CV) ------------------------------------------
    // "Borrar mis datos" se contestaba con el editor del CV, y la baja, el plan o
    // la contraseña iban al modelo, que no sabe dónde está cada cosa aquí y podía
    // inventarse los pasos (auditoría del 3 oct 2026). Respuesta fija y cierta.
    if (preIntent === "cuenta") {
      const m = message.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (/contrasena/.test(m)) {
        return NextResponse.json({
          reply: "Si estás dentro de tu cuenta, la cambias en **Perfil → Seguridad → Cambiar contraseña**.\n\n"
            + "👉 [Ir a Seguridad](/app/perfil?tab=seguridad)\n\n"
            + "Si no la recuerdas, pide un enlace aquí y te llega al correo: [He olvidado mi contraseña](/auth/recuperar).",
          action: "cuenta",
        });
      }
      if (/suscripcion|plan\b/.test(m)) {
        return NextResponse.json({
          reply: "Tu plan lo ves y lo cambias o cancelas en **Perfil → Mi Plan**.\n\n"
            + "👉 [Ver mi plan](/app/perfil?tab=plan)\n\n"
            + "Si lo pagaste desde el iPhone, la suscripción la gestiona Apple: se cancela en **Ajustes → tu nombre → Suscripciones**.",
          action: "cuenta",
        });
      }
      return NextResponse.json({
        reply: "Puedes borrar tu cuenta tú mismo en **Perfil → Seguridad → Eliminar mi cuenta**. Se borra todo: tu CV, tus envíos, las conversaciones conmigo y tus fotos.\n\n"
          + "👉 [Ir a Seguridad](/app/perfil?tab=seguridad)\n\n"
          + "Si tienes un plan de pago con tarjeta, se cancela al borrar la cuenta. Si lo pagas desde el iPhone, cancélalo también en Ajustes de Apple, porque ese cobro lo lleva Apple.",
        action: "cuenta",
      });
    }

    // -- Intent: redactar lo que quiere poner en el CV --------------------------
    // Guzzi ofrecía "dime qué quieres poner y te lo redacto" y no había nada que
    // lo hiciera: la persona contaba su experiencia y acababa en cursos u
    // ofertas (auditoría del 3 oct 2026). La IA gratuita lo deja listo para
    // pegar, sin inventar nada.
    if (preIntent === "redactar_cv") {
      const sistema = "Ayudas a una persona a escribir una línea de su currículum. Te cuenta con sus palabras algo que quiere poner en el CV: un trabajo, unos estudios, un curso, un idioma o un dato de contacto.\n"
        + "Devuélvelo redactado para pegarlo en el CV, en español y sin hablar en primera persona:\n"
        + "- Si es un trabajo: una línea «Puesto — Empresa (fechas)» y debajo de 2 a 4 viñetas que empiecen por «• » con lo que hacía.\n"
        + "- Si es otra cosa: la línea tal como iría en el CV.\n"
        + "NO INVENTES NADA: ni tareas, ni fechas, ni empresas, ni cifras, ni logros que no diga. Si falta un dato, déjalo sin poner.\n"
        + "Responde solo con el texto para el CV, sin explicaciones. Si el mensaje no trae ningún dato para el CV, responde exactamente: NADA";
      const texto = (await callGroq(sistema, message, 500).catch(() => null))?.trim() || "";
      if (texto && !/^NADA\b/i.test(texto)) {
        return NextResponse.json({
          reply: `Así quedaría en tu currículum:\n\n${texto}\n\nCópialo y pégalo en [el editor](/app/curriculum), en su apartado. Si quieres que cambie algo, dímelo.`,
          action: "redactar_cv",
        });
      }
      return NextResponse.json({
        reply: texto
          ? "Dime qué quieres poner —por ejemplo «camarero en Bar Pepe, de 2019 a 2021, atendía la barra y cobraba»— y te lo dejo redactado para pegarlo en [el editor](/app/curriculum)."
          : "Ahora mismo no puedo redactarlo. Pégalo tal cual en [el editor](/app/curriculum) y pulsa **✨ Mejorar con IA**: te lo deja bien escrito.",
        action: "redactar_cv",
      });
    }

    // -- Intent: editar el CV -------------------------------------------------
    //
    // Guzzi NO puede tocar el currículum: no tiene con qué. Lo que hacía era
    // peor que decirlo — prometía "súbeme tu CV en PDF y te lo actualizo", que
    // no existe, y nunca mencionaba el editor, que es donde se hace de verdad.
    // Comprobado en producción el 2 oct 2026.
    if (preIntent === "editar_cv") {
      // Si ya le hemos mandado el enlace en esta conversación, no se le suelta
      // otra vez el mismo párrafo: eso es lo que hace que parezca una máquina.
      // Se pasa a lo único útil que queda, que es redactarle el texto.
      const yaLeDijimosDondeEs = history.slice(-6).some(
        (m) => m.role !== "user" && /Abrir el editor de CV/.test(m.text || "")
      );
      if (yaLeDijimosDondeEs) {
        return NextResponse.json({
          reply: "Dímelo con tus palabras y te lo dejo redactado para que lo pegues en [el editor](/app/curriculum).\n\n"
            + "Por ejemplo: «carretillero en Logística Ribera, de 2022 a 2025, cargaba camiones y preparaba pedidos» "
            + "y te lo devuelvo escrito para el currículum.",
          action: "editar_cv",
        });
      }
      return NextResponse.json({
        reply: "Tu currículum se edita tú mismo en **Mi Currículum**, y se guarda solo mientras escribes.\n\n"
          + "👉 [Abrir el editor de CV](/app/curriculum)\n\n"
          + "Ahí cambias lo que quieras —experiencia, estudios, teléfono, foto— y lo ves al momento en la vista previa. "
          + "Con el botón **✨ Mejorar con IA** te reescribo el perfil y lo que hacías en cada trabajo, para que se entienda mejor; "
          + "si no te convence, lo deshaces.\n\n"
          + "Yo no puedo escribir dentro de tu CV, pero dime qué quieres poner y te lo redacto para que lo copies.",
        action: "editar_cv",
      });
    }

    // -- Intent: ¿me compensa ir a trabajar a otro sitio? (la cuenta real) -----
    if (preIntent === "desplazamiento") {
      const respuesta = await respuestaDesplazamiento(message, cvParsed?.ciudad || "");
      if (respuesta) return NextResponse.json({ reply: respuesta, action: "desplazamiento" });
    }

    // -- Intent: info empresa (Google Places) ----------------------------------
    if (preIntent === "info_empresa") {
      // extractCompanyFromContact cubre "manda un correo al Mercadona de la
      // calle X"; extractCompanyName cubre "info sobre la empresa X". Se prueba
      // primero el de contacto porque es el que limpia la coletilla de la vía.
      // Sin ciudad en el mensaje, la de su CV, como hace la cámara con la del
      // perfil: "búscame la peluquería Enjoy Estilistas" sin ciudad devolvía
      // una de Cardedeu (Barcelona) a quien estaba en Tudela (16 oct 2026).
      const searchCity = extractCity(message) || cvParsed?.ciudad || "";
      let companyName = extractCompanyFromContact(message) || extractCompanyName(message);
      // "Echar el currículum en Tudela" no es una empresa: es un pueblo. Si lo
      // que queda es la propia ciudad, se pregunta a qué empresa en vez de
      // buscar un negocio que se llame "Tudela".
      if (companyName && searchCity && sinTildes(companyName) === sinTildes(searchCity)) companyName = null;
      const searchAddress = extractAddress(message) || "";

      // Si no es un nombre de empresa concreto, pero es búsqueda por sector+ciudad
      // (ej: "empresas de limpieza en Tudela", "bares en Corella")
      //
      // 14 oct 2026: esta expresión llevaba las barras dobladas (\\s, que
      // busca una barra de verdad) y un grupo de menos, así que no encajaba
      // con nada y siempre contestaba "dime el nombre de la empresa".
      if (!companyName) {
        const sectorMatch = message.match(
          /(empresas?|negocios?|comercios?|tiendas?|f[aá]bricas?|bares?|restaurantes?|cafeter[ií]as?|talleres?|panader[ií]as?|farmacias?|cl[ií]nicas?|peluquer[ií]as?|supermercados?|hoteles?|de\s+limpieza|de\s+reparto)\s+(?:de\s+)?([a-záéíóúüñA-Z][\wáéíóúüñ\s]{2,40}?)(?:\s+(?:en|por|cerca|de)\s+([\wáéíóúüñ][\wáéíóúüñ\s]+))?$/i
        );
        // "bares en Corella": el sector es "bares"; "qué empresas de logística
        // hay en Zaragoza": sin el "hay"; "cerca de Tudela": sin el "de".
        let sectorRaw = sectorMatch?.[2]?.trim().replace(/\s+hay$/i, "");
        if (sectorMatch && sectorRaw && /^(en|por|cerca)\s/i.test(sectorRaw)) sectorRaw = sectorMatch[1];
        const cityFromSector = sectorMatch?.[3]?.trim().replace(/^de\s+/i, "") || searchCity;

        if (sectorRaw && cityFromSector) {
          return NextResponse.json({
            reply: `🏢 **${sectorRaw}** en **${cityFromSector}** — ¿cómo quieres que busque?\n\n**1. 🔍 Empresa grande** — busco ofertas publicadas en portales de empleo\n**2. 📍 Negocio local** — busco en Google Maps (email, teléfono, para enviar CV directo)\n\nResponde **"grande"** o **"pequeña"** y me pongo.`,
            action: "choose_size",
            sector: sectorRaw,
            city: cityFromSector,
          });
        }

        return NextResponse.json({
          reply: "🏢 Dime el nombre de la empresa y te busco toda la información: email, teléfono, web, valoraciones... ",
          action: "need_company_name",
        });
      }

      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://buscaycurra.es";
        const extractRes = await fetch(`${siteUrl}/api/company/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-sync-secret": process.env.ADMIN_SECRET || "" },
          // La calle desambigua entre locales de la misma cadena en la ciudad.
          body: JSON.stringify({
            name: companyName,
            city: searchCity || undefined,
            address: searchAddress || undefined,
          }),
          signal: AbortSignal.timeout(20000),
        });

        if (!extractRes.ok) {
          return NextResponse.json({
            reply: `🏢 No encontré información de **${companyName}** en Google Places. ¿Seguro que el nombre es correcto? Prueba con el nombre completo o la ciudad. `,
            action: "company_not_found",
          });
        }

        const extractData = await extractRes.json() as {
          success?: boolean;
          empresas?: Array<{
            nombre?: string; dominio?: string; urlWeb?: string;
            emailRrhh?: string; emailContacto?: string; emailsExtraidos?: string[];
            emailConfianza?: "alta" | "media" | "baja";
            telefono?: string; paginaEmpleo?: string; descripcion?: string;
            sector?: string; linkedin?: string; twitter?: string; instagram?: string;
            fuente?: string; googleRating?: number; googleReviews?: number;
            googleAddress?: string; googleMapsUrl?: string;
          }>;
        };

        const empresa = extractData.empresas?.[0];
        if (!empresa || !empresa.nombre) {
          return NextResponse.json({
            reply: `🏢 No encontré información de **${companyName}** en Google Places. ¿Seguro que el nombre es correcto? Prueba con el nombre completo o la ciudad. `,
            action: "company_not_found",
          });
        }

        let reply = `🏢 **${empresa.nombre}**\n\n`;
        if (empresa.sector) reply += `📂 **Sector:** ${empresa.sector}\n`;
        if (empresa.googleRating) reply += `⭐ **Valoración Google:** ${empresa.googleRating}/5 (${empresa.googleReviews || "?"} reseñas)\n`;
        if (empresa.googleAddress) reply += `📍 ${empresa.googleAddress}\n`;
        if (empresa.telefono) reply += `📞 ${empresa.telefono}\n`;
        if (empresa.emailRrhh) {
          // Ser honesto con el origen del email: uno hallado en su web no es lo
          // mismo que un patrón deducido del dominio. Si no, el usuario gasta
          // envíos creyendo que la dirección es segura.
          const sello =
            empresa.emailConfianza === "alta"
              ? " ✅ *(verificado en su web)*"
              : empresa.emailConfianza === "media"
                ? " ⚠️ *(deducido del dominio; el dominio sí recibe correo)*"
                : "";
          reply += `📧 ${empresa.emailRrhh}${sello}\n`;
        }
        if (empresa.urlWeb) reply += `🌐 [Web](${empresa.urlWeb})\n`;
        if (empresa.googleMapsUrl) reply += `🗺️ [Google Maps](${empresa.googleMapsUrl})\n`;

        // Aviso para cadenas: una tienda concreta no tiene email propio, el que
        // damos es el corporativo. Conviene decirlo y sugerir ir en persona.
        if (empresa.emailConfianza !== "alta" && searchAddress) {
          reply += `\n💡 Este parece el correo **general de la empresa**, no el de ese local en concreto. Para una tienda física, presentarte en persona con el CV suele funcionar mejor — pero puedo enviarlo igualmente.`;
        }
        reply += `\n\n📧 **¿Envío tu CV a ${empresa.nombre}?** Responde "sí" y me encargo.`;

        return NextResponse.json({
          reply,
          action: "company_info",
          company: empresa,
        });
      } catch {
        return NextResponse.json({
          reply: `🏢 **${companyName}** — no pude conectar con Google Places ahora. ¿Quieres que busque ofertas de esta empresa en nuestra base de datos? 🔍`,
          action: "company_search_fallback",
        });
      }
    }

    // -- Respuesta a choose_size: "grande" o "pequeña" -------------------------
    const isChooseSizeReply = /^(grande|pequeñ[oa]|pequen[oa]|local|negocio\s+local|empresa\s+grande|pequeñas?\s+empresas?)$/i.test(message.trim());
    if (isChooseSizeReply) {
      const wantSmall = /^(pequeñ[oa]|pequen[oa]|local|negocio\s+local|pequeñas?\s+empresas?)$/i.test(message.trim());
      // Extraer sector+ciudad del último mensaje de Guzzi en el historial
      let sector = "";
      let city = "";
      const lastGuzziMsg = [...history].reverse().find((h: {role: string; text: string}) => h.role === "gusi");
      if (lastGuzziMsg) {
        const m = lastGuzziMsg.text.match(/\*\*(.+?)\*\*\s+en\s+\*\*(.+?)\*\*/);
        if (m) { sector = m[1]; city = m[2]; }
      }

      if (!sector || !city) {
        return NextResponse.json({
          reply: "Perdona, he perdido el hilo. ¿Qué sector y ciudad buscabas?",
          action: "need_keyword",
        });
      }

      if (wantSmall) {
        // La misma lista de negocios que sale en la búsqueda, que es la que
        // entiende el "sí" siguiente (lib/guzzi/envio-local.ts). La de antes
        // decía "Responde sí y las enviamos" y ese "sí" no lo recogía nadie.
        try {
          const negocios = await buscarNegociosLocales(sector, city);
          if (negocios.length > 0) {
            return NextResponse.json({ reply: listaDeNegocios(negocios, city, sector).trim(), action: "search_results" });
          }
          return NextResponse.json({
            reply: `📍 No encontré negocios de **${sector}** en **${city}**.\n\n¿Quieres que busque por nombre exacto? Dame el nombre y te busco email y teléfono.`,
            action: "need_company_name",
          });
        } catch {
          return NextResponse.json({
            reply: `📍 Ahora mismo no puedo sacar los negocios de la zona. ¿Buscamos ofertas de **${sector}** en **${city}**? Responde "grande".`,
            action: "need_keyword",
          });
        }
      } else {
        // Empresa grande - buscar en BD
        const result = await searchJobsReal(sector, city, 5, pais || "ES");
        if (result && result.jobs.length > 0) {
          return NextResponse.json({
            reply: `🔍 **${result.jobs.length} ofertas de ${sector} en ${city}**\n\n${buildJobsText(sector, city, result.jobs, result.scope)}`,
            jobs: result.jobs,
            action: "search_results",
          });
        }
        return NextResponse.json({
          reply: `🔍 No encontré ofertas grandes de **${sector}** en **${city}**.\n\n¿Quieres que busque **negocios locales** en Google Maps? Responde "pequeña".`,
          action: "need_keyword",
        });
      }
    }

    // -- Intent: buscar trabajo -----------------------------------------------
    let intent = enModoCV ? "chat" : detectIntent(message, history);

    // Lo que las reglas no reconocen ("Mozo de almacén em Oporto",
    // "Salamanca" tras preguntarle dónde), o un puesto que no lo parece ("soy un
    // chaval de Murcia y estoy buscando"), lo lee un modelo pequeño y
    // gratuito (lib/guzzi/entender.ts). Si no contesta, todo sigue como antes.
    const entendido = !enModoCV && (mode === "chat" || mode === "entrevista") && hayQueEntender(intent, message)
      ? await entenderMensaje(message, history)
      : null;
    if (entendido?.accion === "enviar_a_ofertas_mostradas" && refiereAOfertasMostradas(message, history)) {
      return NextResponse.json(respuestaOfertasMostradas(message, history, !!cvData));
    }
    if (entendido?.accion === "buscar_ofertas" || entendido?.accion === "contar_ofertas") intent = "buscar";
    // Las reglas veían una búsqueda pero el puesto era basura y el modelo dice
    // que es otra cosa ("pásame el currículum a PDF"): que conteste la IA.
    else if (entendido?.accion === "otra" && intent === "buscar") intent = "chat";
    const quiereContar = entendido?.accion === "contar_ofertas";

    // -- Intent: buscar au pair ----------------------------------------------
    if (intent === "buscar_au_pair" || mode === "buscar_au_pair") {
      const extractedCity = extractCity(message);
      const extractedCountry = extractCountryCode(message);
      // "El extranjero" no es una ciudad: el atajo "Quiero información sobre el
      // programa Au Pair en el extranjero" respondía "No encontré ofertas au
      // pair para El extranjero". Si pide información y no dice dónde, se le da.
      const ciudadAuPair = extractedCity && !/extranjero|fuera/i.test(extractedCity) ? extractedCity : null;
      if (!extractedCountry && !ciudadAuPair && /informaci|programa|qu[eé] es|c[oó]mo funciona|requisitos|opciones/i.test(message)) {
        return NextResponse.json({ reply: TEXTO_INFO_AU_PAIR, action: "au_pair_info" });
      }
      const cityOrCountry = extractedCountry || ciudadAuPair || (auPairProfile?.nationality as string) || "UK";

      const ofertas = await searchAuPairJobs(cityOrCountry, 5);
      if (!ofertas || ofertas.length === 0) {
        return NextResponse.json({
          reply: `👶 No encontré ofertas au pair para **${cityOrCountry}** ahora mismo.\n\nPero puedo ayudarte:\n• 💌 **Crear tu carta "Dear Family"** — dime "crea mi carta au pair"\n• 🌍 **Buscar en otro país** — dime "busca au pair en Alemania"\n• 📄 **Completar tu perfil** — en la sección Au Pair del menú `,
          action: "au_pair_no_results",
        });
      }
      return NextResponse.json({
        reply: `👶 **${ofertas.length} ofertas Au Pair** en **${cityOrCountry}**:\n\n${ofertas.map((o: Record<string, unknown>, i: number) => {
          const em = ["🥇", "🥈", "🥉", "📌"][i] || "📌";
          return `${em} **${(o as { titulo?: string }).titulo}**\n   🏠 ${(o as { empresa?: string }).empresa} · 📍 ${(o as { ubicacion?: string }).ubicacion}\n   💰 ${(o as { salario?: string }).salario}\n`;
        }).join("\n")}\n📧 **¿Quieres aplicar?** Ve a la sección Au Pair del menú para completar tu perfil con fotos y carta. `,
        jobs: ofertas,
        action: "au_pair_search_results",
      });
    }

    // -- Intent: carta au pair -----------------------------------------------
    if (intent === "carta_au_pair" || mode === "carta_au_pair") {
      if (!auPairProfile) {
        return NextResponse.json({
          reply: "💌 Para generar tu carta \"Dear Family\" primero necesitas crear tu perfil Au Pair.\n\nVe a la sección **Au Pair** del menú (🧒) y rellena:\n• Tus datos personales\n• Experiencia con niños\n• Fotos\n\nLuego vuelve y dime \"crea mi carta au pair\". ",
          action: "need_au_pair_profile",
        });
      }

      // Carta personalizada con IA
      try {
        const nombre = auPairProfile.nombre || "el/la candidato/a";
        const edad = auPairProfile.age || "";
        const ciudad = auPairProfile.ciudad || "";
        const idiomas = Array.isArray(auPairProfile.languages) ? (auPairProfile.languages as string[]).join(", ") : "";
        const experiencia = auPairProfile.childcare_experience || "";
        const hobbies = auPairProfile.hobbies || "";
        const paisDestino = auPairProfile.nationality || "";

        // DeepSeek retirado (23 oct 2026, decisión de Michel: que ningún dato salga a
        // China). La carta la escribe Groq y, si no responde, OpenAI; si tampoco, la plantilla.
        const sistemaCarta = `Eres experto en cartas "Dear Family" para au pairs. Escribe en INGLÉS (idioma estándar internacional para au pair). La carta debe ser cálida, personal y profesional. Máximo 300 palabras. NO uses placeholders — usa los datos reales proporcionados.`;
        const peticionCarta = `Genera una carta "Dear Family" para una au pair con estos datos:\n\nNombre: ${nombre}\nEdad: ${edad}\nCiudad: ${ciudad}\nIdiomas: ${idiomas}\nExperiencia con niños: ${experiencia}\nHobbies: ${hobbies}\nPaís de destino: ${paisDestino}\n\nLa carta debe incluir: presentación personal, experiencia con niños, por qué quiere ser au pair en ese país, hobbies y personalidad, y despedida cálida.`;
        const cartaIA = (await callGroq(sistemaCarta, peticionCarta, 800)) || (await callOpenAI(sistemaCarta, peticionCarta, 800));
        if (cartaIA) {
          return NextResponse.json({
            reply: `💌 **Aquí tienes tu carta "Dear Family" personalizada:**

${cartaIA}

✅ **¿Te gusta?** Puedes copiarla y pegarla en tu perfil Au Pair, o dime "cambia [lo que quieras modificar]" y la ajusto. 

🧒 También puedes ir a la sección **Au Pair** para guardarla en tu perfil.`,
            action: "au_pair_letter_generated",
            auPairLetter: cartaIA,
          });
        }
        // Fallback: generar con plantilla si la IA no responde
        const { generarPlantillaLetter } = await import("@/lib/au-pair");
        const letter = generarPlantillaLetter({
          nombre: nombre as string,
          edad: edad ? parseInt(edad as string) : undefined,
          nacionalidad: paisDestino as string,
          ciudad: ciudad as string,
          idiomas: Array.isArray(auPairProfile.languages) ? auPairProfile.languages as string[] : [],
          experiencia: experiencia as string,
          hobbies: hobbies as string,
          paisDestino: paisDestino as string,
        });

        return NextResponse.json({
          reply: `💌 **Aquí tienes tu carta "Dear Family":**\n\n${letter}\n\n✅ Personalízala a tu gusto en la sección **Au Pair** del menú. `,
          action: "au_pair_letter_generated",
          auPairLetter: letter,
        });
      } catch (e) {
        return NextResponse.json({
          reply: `❌ Error al generar la carta: ${(e as Error).message}. Inténtalo de nuevo. `,
          action: "au_pair_letter_error",
        });
      }
    }

    if (intent === "buscar" || mode === "buscar") {
      // Detectar si el usuario está INSATISFECHO con los resultados anteriores
      const isDissatisfied = /(est[áa]n?\s+(muy\s+)?lejos|no\s+me\s+sirve|demasiado\s+lejos|busca\s+otra?\s+cosa|algo\s+diferente|mejor\s+(salario|horario|sueldo)|no\s+es\s+lo\s+que\s+busco|cerca\s+de|m[áa]s\s+cerca)/i.test(message);

      // Lo que el usuario PIDE explícitamente tiene prioridad sobre el CV
      const { detectarPais, limpiarTerminoBusqueda, sinPreferenciaDePuesto } = await import("@/lib/guzzi/paises-detect");

      // "hay ofertas en Dublin" hacía que se buscara el puesto "hay ofertas" y
      // no apareciera nada. Si al limpiar no queda una profesión de verdad, se
      // busca sin filtrar por puesto en vez de inventarse uno.
      // Si el modelo ha leído el mensaje, manda lo que ha entendido: el puesto
      // que sacan las reglas era justo lo que fallaba.
      const extractedJob = entendido
        ? (entendido.puesto ? limpiarTerminoBusqueda(entendido.puesto) : null)
        : limpiarTerminoBusqueda(extractJobTerm(message));
      const puestoBusqueda = extractedJob || cvParsed?.ultimoPuesto || "";
      // "Basándome en tu CV" solo si el puesto sale del CV: a quien preguntaba
      // por las ofertas de Suiza se le contestaba con su último trabajo.
      const puestoDelCV = !extractedJob && !!cvParsed?.ultimoPuesto;
      const lugarEntendido = entendido?.lugar || null;
      const paisDelLugar = lugarEntendido ? detectarPais(lugarEntendido) : null;
      const extractedCity = lugarEntendido ? (paisDelLugar ? null : lugarEntendido) : extractCity(message);

      // Un país es una ubicación válida. extractCity lo descartaba a propósito
      // (llevaba 'irlanda', 'españa'... en su lista de "no ciudades"), así que
      // "ofertas de trabajo en Irlanda" se quedaba sin sitio donde buscar y
      // Guzzi respondía que no había ninguna, teniendo 13.604.
      const paisPedido = entendido ? (paisDelLugar || (lugarEntendido ? null : detectarPais(message))) : detectarPais(message);
      const ciudadBusqueda = extractedCity || (paisPedido ? "" : cvParsed?.ciudad || "");

      // Si el usuario está insatisfecho y no especifica nuevo puesto, pedir aclaración
      // en vez de repetir los mismos resultados
      if (isDissatisfied && !extractedJob) {
        return NextResponse.json({
          reply: `Entendido, busquemos algo diferente. ¿Qué tipo de trabajo te interesa? Dime el puesto (ej: "camarero", "administrativo", "electricista") y te busco al instante.`,
          action: "need_keyword",
        });
      }

      // Si pide un país sin puesto, NO se le da largas: se cuenta lo que hay
      // de verdad y se le pregunta por el puesto con datos en la mano. Antes
      // esta rama respondía "necesito saber dónde", que con un país delante
      // sonaba a que no teníamos nada.
      if (paisPedido && !extractedJob) {
        const total = await contarOfertasPais(paisPedido.codigo);
        if (total > 0) {
          // Si ha dicho que le vale cualquier cosa ("lo que sea", "no me importa
          // de qué trabajar"), NO se le pregunta otra vez: se le enseñan ofertas
          // variadas de ese país. Una usuaria escribió justo eso para Irlanda y
          // Guzzi le devolvió puestos de Logroño y Valladolid.
          if (sinPreferenciaDePuesto(message)) {
            const variadas = await ofertasVariadasPais(paisPedido.codigo, 6);
            if (variadas.length > 0) {
              const lista = variadas
                .map((o, i) => `${i + 1}. **${o.title}**\n   📍 ${o.city || paisPedido.nombre}${o.company ? ` · ${o.company}` : ""}`)
                .join("\n\n");
              return NextResponse.json({
                reply: `${paisPedido.bandera} Perfecto, en **${paisPedido.nombre}** hay **${total.toLocaleString("es-ES")} ofertas** y no hace falta que te cierres a nada. Te enseño una muestra de sectores distintos:\n\n${lista}\n\n¿Te encaja alguna? Dime cuál o cuéntame qué sabes hacer y afino la búsqueda.`,
                jobs: variadas,
                action: "search_results",
                pais: paisPedido.codigo,
                total,
              });
            }
          }

          const ciudades = await ciudadesTopPais(paisPedido.codigo, 6);
          const listaCiudades = ciudades.length
            ? `\n\n📍 Donde más hay ahora mismo: ${ciudades.join(" · ")}`
            : "";
          return NextResponse.json({
            reply: `${paisPedido.bandera} En **${paisPedido.nombre}** tengo **${total.toLocaleString("es-ES")} ofertas** ahora mismo.${listaCiudades}\n\n¿De qué te gustaría trabajar? Dime el puesto (camarero, enfermera, soldador, lo que sea) o la ciudad, y te las saco al momento.`,
            action: "need_keyword",
            pais: paisPedido.codigo,
            total,
          });
        }
      }

      // "¿Cuántas ofertas tenéis?" sin decir dónde: el total de verdad.
      if (quiereContar && !paisPedido && !extractedCity) {
        const porPais = await ofertasPorPais();
        const total = Object.values(porPais || {}).reduce((a, b) => a + b, 0);
        if (total > 0) {
          return NextResponse.json({
            reply: `🌍 Ahora mismo hay **${total.toLocaleString("es-ES")} ofertas activas** de **${Object.keys(porPais || {}).length} países**.\n\n¿De qué y dónde te gustaría trabajar? Dime el puesto y la ciudad o el país (por ejemplo, "camarero en Tudela") y te las saco.`,
            action: "need_keyword",
            total,
          });
        }
      }

      // Si el usuario menciona una ciudad pero NO un puesto, no usar el puesto del CV
      if (!puestoBusqueda) {
        return NextResponse.json({
          reply: "🔍 Claro, ¿qué tipo de trabajo buscas? Dime el puesto y la ciudad (ej: 'camarero en Madrid') y te busco al instante. ",
          action: "need_keyword",
        });
      }

      // Si no hay ciudad ni en mensaje ni en CV, preguntar ANTES de buscar
      if (!ciudadBusqueda && !paisPedido) {
        return NextResponse.json({
          reply: `🔍 Vale, busco ofertas de **${puestoBusqueda}**. Pero necesito saber dónde. ¿En qué ciudad o zona estás buscando?`,
          action: "need_city",
        });
      }

      if (puestoBusqueda) {
        // El pais que pide el usuario manda sobre el suyo del perfil: si dice
        // "camarero en Irlanda", se busca en Irlanda aunque viva en Espana.
        //
        // Y si nombra una ciudad, esa ciudad decide el pais. Antes solo se
        // miraba si habia dicho el pais por su nombre: "camarero en Paris" no
        // detectaba nada, caia al pais del perfil y devolvia camareros de
        // Madrid. Le pasaba a las 11 busquedas de fuera de Espana.
        const { paisDeCiudad } = await import("@/lib/guzzi/ciudades-pais");
        const paisBusqueda = paisPedido?.codigo?.toUpperCase()
          || (ciudadBusqueda ? paisDeCiudad(ciudadBusqueda, pais || "ES") : null)?.toUpperCase()
          || pais || "ES";
        const result = await searchJobsReal(puestoBusqueda, ciudadBusqueda, 5, paisBusqueda);
        if (!result || result.jobs.length === 0) {
          // Buscar negocios locales en Google Places como alternativa
          let googleReply = "";
          if (ciudadBusqueda) {
            try {
              const negocios = await buscarNegociosLocales(puestoBusqueda, ciudadBusqueda);
              if (negocios.length > 0) {
                googleReply = listaDeNegocios(negocios, ciudadBusqueda, puestoBusqueda);
              }
            } catch { /* sin Google Places, solo mensaje normal */ }
          }

          // De Perú, Colombia... aún no hay ofertas: el consejo de siempre
          // ("amplía a la provincia", "activa alertas") no sirve allí. Se dice
          // claro y se da la bolsa pública de empleo de su país.
          return NextResponse.json({
            reply: (puestoDelCV
              ? `Basándome en tu CV (último puesto: **${cvParsed!.ultimoPuesto}**), ` : "") +
              (googleReply || (esPaisNuestro(paisBusqueda)
                ? fallbackMessage(puestoBusqueda, ciudadBusqueda)
                : `🔍 De **${puestoBusqueda}**${ciudadBusqueda ? ` en **${ciudadBusqueda}**` : ""} no tengo ofertas.`)) +
              avisoPaisSinOfertas(paisBusqueda),
            action: googleReply ? "search_results" : "no_results",
          });
        }
        // Si los resultados NO son de la ciudad exacta, buscar en Google Places
        if (ciudadBusqueda && result.scope && result.scope !== "ciudad") {
          // Buscar negocios locales automáticamente
          let googleReply = "";
          try {
            const negocios = await buscarNegociosLocales(puestoBusqueda, ciudadBusqueda);
            if (negocios.length > 0) {
              googleReply = listaDeNegocios(negocios, ciudadBusqueda, puestoBusqueda);
            }
          } catch { /* sin Google Places, solo mensaje normal */ }

          // Si la búsqueda SÍ trajo ofertas (aunque sean de la provincia o de
          // cerca), se enseñan. Antes se descartaban y se respondía "no me
          // salen ofertas" teniendo resultados en la mano: en las pruebas,
          // 10 de 12 búsquedas decían que no había trabajo cuando había entre
          // 100 y 3.000 ofertas reales.
          if (result.jobs.length > 0) {
            // Las ofertas son de fuera de su ciudad, así que se acompañan del
            // desglose de alrededores: a cuántos kilómetros está cada sitio y
            // lo que costaría el gasóleo al mes. Enseñar ofertas de otra
            // ciudad sin decir lo que cuesta llegar es media respuesta.
            const alrededores = await mapaDeAlrededores(puestoBusqueda, ciudadBusqueda, paisBusqueda);
            return NextResponse.json({
              reply: buildJobsText(puestoBusqueda, ciudadBusqueda, result.jobs, result.scope) +
                (alrededores ? `\n\n📊 **Lo que hay cerca de ${ciudadBusqueda}, con las cuentas hechas:**\n\n${alrededores}` : "") +
                pistaDeCurso(puestoBusqueda, cvObjeto, history) +
                (googleReply ? `\n${googleReply}` : ""),
              jobs: result.jobs,
              action: "search_results",
            });
          }

          // En su ciudad no hay. Antes se acababa ahí y la gente se rendía.
          // Ahora se le enseña el mapa de alrededores con las cuentas hechas:
          // dónde hay de lo suyo, a cuántos kilómetros, y lo que cuesta el
          // gasóleo cada mes yendo solo o compartiendo coche. Casi nadie hace
          // esas cuentas por su cuenta, y por eso descarta buscar fuera.
          const alrededores = await mapaDeAlrededores(puestoBusqueda, ciudadBusqueda, paisBusqueda);
          if (alrededores) {
            return NextResponse.json({
              reply: `🔍 De **${puestoBusqueda}** no me sale nada justo en **${ciudadBusqueda}**, pero cerca sí hay:\n\n${alrededores}${googleReply}`,
              action: "search_cercanas",
            });
          }

          return NextResponse.json({
            // Nunca un "no" a secas: se dice lo que hay y se ofrecen salidas.
            reply: `🔍 De **${puestoBusqueda}** no me salen ofertas justo en **${ciudadBusqueda}** en este momento.${googleReply}\n\n¿Ampliamos la búsqueda? Puedo mirar en toda la zona, probar con un puesto parecido, o buscarte empresas de ${ciudadBusqueda} a las que mandar tu CV directamente. Tú me dices.`,
            action: "search_scope_pais",
          });
        }
        const prefix = puestoDelCV
          ? `Basándome en tu CV (último puesto: **${cvParsed!.ultimoPuesto}**), aquí tienes lo mejor que encontré:\n\n`
          : "";
        // Aunque la búsqueda haya acertado con la ciudad, entre los resultados
        // suele haber alguno de la capital o del pueblo de al lado. Se dice lo
        // que cuesta llegar a esos sitios: verlos sin saber si son 20 km o 90
        // es lo que hace que la gente los descarte sin mirarlos.
        const cuentas = await cuentasDeLasOfertas(result.jobs, ciudadBusqueda, paisBusqueda);
        return NextResponse.json({
          reply: prefix + buildJobsText(puestoBusqueda, ciudadBusqueda, result.jobs, result.scope) + cuentas
            + pistaDeCurso(puestoBusqueda, cvObjeto, history),
          jobs: result.jobs,
          action: "search_results",
        });
      }
    }

    // -- Intent: enviar CV a negocio local (GOOGLE PLACES - REAL SEND) --------
    if (intent === "send_cv_local_confirm") {
      // detectIntent ya ha comprobado que el último mensaje de Guzzi es la lista
      // de negocios y que la persona dice que sí o elige uno.
      const propuesta = propuestaPendiente(history);
      if (!propuesta) return NextResponse.json({ reply: "¿A qué negocio quieres mandar el CV?", action: "send_cv_flow" });
      const ciudad = propuesta.ciudad || cvParsed?.ciudad || "";
      const puesto = propuesta.puesto || cvParsed?.ultimoPuesto || "Candidatura espontánea";
      const pos = negocioElegido(message, propuesta.negocios);
      const elegido = pos !== null ? propuesta.negocios[pos] : propuesta.negocios.length === 1 ? propuesta.negocios[0] : null;

      // Con varios negocios y un "sí" a secas no se elige por la persona.
      if (!elegido) {
        return NextResponse.json({
          reply: textoNegociosLocales(propuesta.negocios, ciudad, puesto, "¿A cuál se lo mando? Estos son los negocios"),
          action: "search_results",
        });
      }
      if (!cvData) {
        return NextResponse.json({
          reply: "📧 Para enviar tu CV necesito que lo subas primero.\n\nUsa el clip 📎 de abajo para subir tu CV en PDF o escribe **'crear cv'** y te lo hago paso a paso.",
          action: "send_cv_flow",
        });
      }

      // La carta la escribe la cola de envíos con el CV de verdad
      // (useAIPersonalization), igual que en la página de envíos.
      try {
        const authHeader = req.headers.get("authorization");
        const cookieHeader = req.headers.get("cookie");
        const sendRes = await fetch(`${BASE_INTERNA}/api/gusi/send-cv-local`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { authorization: authHeader } : {}),
            ...(cookieHeader ? { cookie: cookieHeader } : {}),
          },
          body: JSON.stringify({
            userId,
            companyName: elegido.nombre,
            companyPhone: elegido.telefono || "",
            website: elegido.web,
            city: ciudad,
            puesto,
          }),
        });
        const sendData = await sendRes.json().catch(() => ({}));

        if (sendRes.status === 429 || sendRes.status === 409) {
          return NextResponse.json({
            reply: `${sendData.error || "Has llegado al límite de envíos de tu plan."}\n\n👉 [Ver planes](/app/perfil?tab=plan)`,
            action: "send_cv_flow",
          });
        }
        if (!sendRes.ok) {
          console.error("[send_cv_local_confirm] send-cv-local respondió", sendRes.status, sendData);
          return NextResponse.json({
            reply: `No he podido mandar tu CV a **${elegido.nombre}**. Prueba desde [la página de envíos](/app/envios).`,
            action: "send_cv_flow",
          });
        }

        if (sendData.needsEmail) {
          return NextResponse.json({
            reply: `No he encontrado un correo fiable de **${elegido.nombre}**, y no quiero mandar tu CV a una dirección que igual no es suya.\n\nPuedes:\n${elegido.telefono ? `- Llamar al 📞 ${elegido.telefono} y preguntar a qué correo mandarlo\n` : ""}- Pasarte en persona con el CV (causa mejor impresión)\n- Si consigues el correo, mándalo desde [la página de envíos](/app/envios)`,
            action: "send_cv_flow",
          });
        }

        return NextResponse.json({
          reply: `📤 **Hecho.** Tu CV va de camino a **${elegido.nombre}** (${sendData.companyEmail}). Lo verás en [tus envíos](/app/envios).\n\n💡 Si puedes, pásate mañana a media mañana y preséntate en persona: así se acuerdan de ti.`,
          action: "cv_sent_local",
        });
      } catch (sendErr) {
        console.error("[send_cv_local_confirm] Send error:", (sendErr as Error).message);
        return NextResponse.json({
          reply: `No he podido mandar tu CV a **${elegido.nombre}**. Prueba desde [la página de envíos](/app/envios).`,
          action: "send_cv_flow",
        });
      }
    }

    // -- Intent: enviar CV ----------------------------------------------------
    if (intent === "enviar") {
      if (!cvData) {
        return NextResponse.json({
          reply: "📧 Para enviar tu CV necesito que lo subas primero.\n\nUsa el clip 📎 de abajo para subir tu CV en PDF o escribe **'crear cv'** y te lo hago paso a paso. ",
          action: "send_cv_flow",
        });
      }
      // ¿El usuario menciona una empresa concreta?
      const empresaMatch = message.match(/(?:a|para|en)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúüñ]+){0,3})\s*$/);
      const empresaNombre = empresaMatch?.[1]?.trim();
      if (empresaNombre && empresaNombre.length >= 3) {
        return NextResponse.json({
          reply: `📧 ¡Perfecto! Para enviar tu CV a **${empresaNombre}** necesito el email de la empresa.\n\nTienes 3 opciones:\n\n**1. Pegar la web** de la empresa - busco el email de RRHH yo solo\n**2. Darme el email** directamente - si ya lo tienes\n**3. Solo registrar** - si ya aplicaste y quieres hacer seguimiento\n\nVe a la página de envíos para completar el proceso - [✍️ Ir a Envíos](/app/envios?empresa=${encodeURIComponent(empresaNombre)})`,
          action: "send_cv_flow",
        });
      }
      // Buscar ofertas del perfil del usuario que tengan email para enviar
      const puestoEnviar = extractJobTerm(message) || cvParsed?.ultimoPuesto || "";
      const ciudadEnviar = extractCity(message) || cvParsed?.ciudad || "";
      if (puestoEnviar) {
        if (!ciudadEnviar) {
          return NextResponse.json({
            reply: `📧 Vale, busco ofertas de **${puestoEnviar}** para enviar CVs. ¿En qué ciudad?`,
            action: "need_city",
          });
        }
        const enviarResult = await searchJobsReal(puestoEnviar, ciudadEnviar, 5, pais || "ES");
        if (enviarResult && enviarResult.jobs.length > 0) {
          // Filtrar resultados no locales
          if (ciudadEnviar && enviarResult.scope && !["ciudad","provincia","cercanas"].includes(enviarResult.scope)) {
            return NextResponse.json({
              reply: `📧 No encontré ofertas de **${puestoEnviar}** en **${ciudadEnviar}** ni cerca. ¿Amplío la búsqueda a todo el país?`,
              action: "search_scope_pais",
            });
          }
          return NextResponse.json({
            reply: `📧 **¡A enviar CVs!**\n\nEncontré ${enviarResult.jobs.length} ofertas de **${puestoEnviar}**${ciudadEnviar ? ` en **${ciudadEnviar}**` : ""}.\n\nPulsa **"Enviar CV"** en cualquiera de ellas para personalizar la carta, elegir la hora de envío y mandarlo.\n\n${buildJobsText(puestoEnviar, ciudadEnviar, enviarResult.jobs, enviarResult.scope)}`,
            jobs: enviarResult.jobs,
            action: "search_results",
          });
        }
        return NextResponse.json({
          reply: fallbackMessage(puestoEnviar, ciudadEnviar) + "\n\n📧 Si conoces alguna empresa directamente, dime su nombre y te ayudo a enviarle el CV. ",
          action: "search_results",
        });
      }
      return NextResponse.json({
        reply: "📧 Claro, ¿para qué tipo de trabajo quieres enviar CVs? Dime el puesto y la ciudad (ej: 'camarero en Tudela') y te busco ofertas con email para enviar directamente. ",
        action: "send_cv_flow",
      });
    }

    // -- Chat normal con IA ---------------------------------------------------
    const anterioresDeLaPersona = history.filter((m) => m.role === "user" && m.text).slice(-3).map((m) => m.text);
    const systemPrompt = buildSystemPrompt(cvData, pais, auPairProfile,
      temasParaLaConversacion(message, anterioresDeLaPersona) + (mode === "entrevista" ? PROMPT_MODO_CV : ""));
    // El plan gratuito de Groq admite 8.000 tokens por minuto CONTANDO la
    // respuesta, y las listas de ofertas de Guzzi son largas: con los 14
    // últimos mensajes enteros no cabía. Se recortan los largos y se quitan
    // los más antiguos hasta que el historial quede en unos 8.000 caracteres.
    const recientes = history.slice(-14)
      .filter((m: { role: string; text: string }) => m.text)
      .map((m: { role: string; text: string }) => ({
        role: (m.role === "gusi" ? "assistant" : "user") as "assistant" | "user",
        content: m.text.length > 1500 ? m.text.slice(0, 1500) + "…" : m.text,
      }));
    while (recientes.length > 2 && recientes.reduce((n, m) => n + m.content.length, 0) > 8000) recientes.shift();
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...recientes,
      { role: "user" as const, content: message },
    ];

    // ── Cadena de proveedores ─────────────────────────────────────────────
    // OpenAI primero para todos; si no responde, Groq; y si tampoco, otra vez
    // OpenAI con un modelo más barato. DeepSeek se retiró el 23 oct 2026
    // (decisión de Michel): que ningún dato de los usuarios salga a China.
    let rawReply = "";

    // Intento 0: OpenAI gpt-5.6-luna, para TODOS (16 oct 2026). Se pasaron las
    // mismas 8 preguntas, con estas instrucciones, por seis modelos y fue el
    // único que no se inventó nada: Groq gratis mandaba a convalidar el título
    // de enfermera a organismos alemanes que no tienen nada que ver y metía
    // tablas que el chat no pinta. Aguanta 5.000 mensajes y 2 millones de
    // tokens por minuto (Groq gratis: 8.000). Unos 0,08 céntimos por mensaje.
    // Si falla o se acaba el saldo, sigue la cadena de siempre.
    if (process.env.OPENAI_API_KEY) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "gpt-5.6-luna", messages, reasoning_effort: "low", max_completion_tokens: 2500 }),
          signal: AbortSignal.timeout(25000),
        });
        if (res.ok) {
          const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
          rawReply = data.choices?.[0]?.message?.content || "";
        } else {
          console.error("[Guzzi] gpt-5.6-luna HTTP", res.status, (await res.text().catch(() => "")).slice(0, 200));
        }
      } catch (e) { console.error("[Guzzi] gpt-5.6-luna error:", (e as Error).message); }
      if (!rawReply) contarFalloGuzzi("luna-fallo");
    }

    // Intento 2: Groq.
    // El prefijo "/no_think" que llevaba antes era un truco para qwen3, el
    // modelo que Groq ha retirado; con gpt-oss-120b sobra.
    if (!rawReply && groqKey) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
            body: JSON.stringify({ model: "openai/gpt-oss-120b",
        // Razona antes de contestar y ese razonamiento gasta tokens del
        // mismo presupuesto: sin esto devolvia respuestas vacias.
        reasoning_effort: "low", messages, max_tokens: 1024, temperature: 0.7 }),
            signal: AbortSignal.timeout(20000),
          });
          if (res.ok) {
            const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
            rawReply = data.choices?.[0]?.message?.content || "";
            if (rawReply) break;
          } else {
            const detalle = await res.text().catch(() => "");
            // 413 = la petición entera no cabe en el límite del plan gratuito
            // (8.000 tokens por minuto). Reintentar no la hace más pequeña: solo
            // añadía casi un segundo de espera antes de pasar al siguiente.
            if (res.status === 413) {
              console.error("[Guzzi] Groq 413: la petición no cabe en el plan gratuito");
              contarFalloGuzzi("groq-413");
              break;
            }
            console.error("[Guzzi] Groq HTTP", res.status, detalle);
          }
        } catch (e) { console.error("[Guzzi] Groq error:", (e as Error).message); }
        if (attempt === 0) await new Promise(r => setTimeout(r, 800));
      }
    } else if (!rawReply) {
      console.error("[Guzzi] Groq key MISSING");
    }

    // Intento 3: OpenAI con un modelo más barato. Red de seguridad para cuando
    // los dos anteriores caen a la vez, que ya ha pasado.
    // Sin esto Guzzi respondía con textos enlatados y parecía roto.
    if (!rawReply && process.env.OPENAI_API_KEY) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model: "gpt-4o-mini", messages, temperature: 0.5, max_tokens: 800 }),
          signal: AbortSignal.timeout(30000),
        });
        if (res.ok) {
          const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
          rawReply = data.choices?.[0]?.message?.content || "";
          if (rawReply) {
            console.log("[Guzzi] respondido por OpenAI de respaldo (gpt-5.6-luna y Groq caidos)");
            contarFalloGuzzi("respaldo-openai");
          }
        } else {
          console.error("[Guzzi] OpenAI HTTP", res.status);
        }
      } catch (e) { console.error("[Guzzi] OpenAI error:", (e as Error).message); }
    }

    if (!rawReply) {
      console.error("[Guzzi] AI call failed — OpenAI y Groq sin respuesta. Falling back to localReply.");
      contarFalloGuzzi("sin-ia");
      return NextResponse.json({ reply: localReply(intent, cvParsed) });
    }
    // sinVoseo: el modelo gratuito a veces contesta "¿Y vos?", "tenés", "decime".
    let reply = sinVoseo(rawReply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()) || localReply(intent, cvParsed);

    // Si aun así promete una búsqueda ("voy a buscar…, un momento"), la persona
    // se queda esperando algo que no llega: se le dice cómo pedirla.
    if (/\b(voy a buscar|d[ée]jame buscar|dame un (segundo|momento)|un momento,? (que|y) (te )?(busco|miro)|ahora te (busco|paso las))/i.test(reply)) {
      reply += "\n\n👉 Para que te salgan las ofertas, escríbeme el puesto y la ciudad en un mensaje, por ejemplo: \"camarero en Tudela\".";
    }

    // 🔒 ANTI-ALUCINACIÓN: detectar emails inventados en respuestas del chat
    const hasFakeEmails = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(reply);
    const claimsSending = /(?:he\s+enviado|estoy\s+enviando|envi[ée]\s+tu\s+CV|CV\s+enviado|te\s+lo\s+he\s+enviado|les\s+estoy\s+enviando|les\s+he\s+enviado|ya\s+est[aá]n?\s+enviados|enviados?\s+a\s+\d+\s+empresas)/i.test(reply);
    if (hasFakeEmails && claimsSending) {
      console.error("[Guzzi] ANTI-ALUCINACIÓN: bloqueada respuesta con emails inventados + afirmación de envío");
      reply = "📧 Para enviar tu CV, usa el botón **Enviar CV** en cada oferta. Yo no puedo inventar emails ni hacer envíos masivos automáticos.\n\nSi quieres, dime el nombre de UNA empresa concreta y te busco su contacto real.";
    }

    return NextResponse.json({ reply });

  } catch (err) {
    console.error("[Guzzi] FATAL catch:", (err as Error).message, (err as Error).stack?.split("\n").slice(0,3).join(" | "));
    return NextResponse.json({ reply: "¡Ups! Algo falló. Inténtalo de nuevo " });
  }
}


/**
 * LO CARO DE CONTAR, GUARDADO UNAS HORAS (14 oct 2026). Contar las ofertas de
 * un país recorre cientos de miles de filas: Alemania pasaba de los 15 s del
 * pool, el recuento fallaba, devolvía 0 y Guzzi contestaba "¿qué tipo de
 * trabajo buscas?" a quien preguntaba cuántas ofertas había en Alemania.
 * Ahora se cuenta con más margen, se guarda en Redis y se contesta al momento
 * con lo guardado; si tiene más de 3 horas, se recalcula por detrás.
 */
async function consultaGuardada<T>(clave: string, consulta: () => Promise<T>): Promise<T | null> {
  const { get: cacheGet, set: cacheSet } = await import("@/lib/cache/redis-client");
  const refrescar = async (): Promise<T | null> => {
    try {
      const valor = await consulta();
      await cacheSet(clave, JSON.stringify({ t: Date.now(), valor }), 12 * 3600);
      return valor;
    } catch (e) {
      console.error(`[Guzzi] ${clave}:`, (e as Error).message);
      return null;
    }
  };
  const guardado = await cacheGet(clave).catch(() => null);
  if (guardado) {
    try {
      const { t, valor } = JSON.parse(guardado) as { t: number; valor: T };
      if (Date.now() - t > 3 * 3600 * 1000) void refrescar();
      return valor;
    } catch { /* guardado roto: se recalcula */ }
  }
  return refrescar();
}

/** Una consulta con 60 s de margen en vez de los 15 s del pool. */
async function consultaConMargen<R extends Record<string, unknown>>(sql: string, params: unknown[]): Promise<R[]> {
  const { getPool } = await import("@/lib/db");
  const cliente = await getPool().connect();
  try {
    await cliente.query("BEGIN");
    await cliente.query("SET LOCAL statement_timeout = 60000");
    const r = await cliente.query<R>(sql, params);
    await cliente.query("COMMIT");
    return r.rows;
  } catch (e) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    cliente.release();
  }
}

/**
 * Cuántas ofertas VIVAS hay en un país. Guzzi nunca debe decir "no hay ofertas
 * en X" de memoria: o lo ha contado, o no lo dice. Se cuentan todos los países
 * de una vez (unos 10 s) y se guardan: ver consultaGuardada.
 */
/**
 * Cuenta por día lo que antes solo quedaba en el registro del contenedor, que
 * no lee nadie: Groq rechazando la petición por tamaño, el respaldo de pago
 * contestando y Guzzi sin ninguna IA (respuesta enlatada). El centinela lo
 * mira cada mañana y avisa por correo (app/api/admin/centinela).
 */
function contarFalloGuzzi(tipo: "groq-413" | "respaldo-openai" | "sin-ia" | "luna-fallo"): void {
  const dia = new Date().toISOString().slice(0, 10);
  import("@/lib/cache/redis-client")
    .then(({ incrementar }) => incrementar(`guzzi:fallo:${tipo}:${dia}`, 8 * 86400))
    .catch(() => { /* sin Redis no se cuenta, pero se contesta igual */ });
}

async function ofertasPorPais(): Promise<Record<string, number> | null> {
  return consultaGuardada("guzzi:ofertas-por-pais", async () => {
    const filas = await consultaConMargen<{ pais: string; n: string }>(
      `SELECT lower(country) AS pais, count(*)::text AS n FROM "JobListing"
        WHERE "isActive" = true
          AND ("expiresAt" > NOW() OR "expiresAt" IS NULL)
          AND country IS NOT NULL
        GROUP BY 1`,
      []
    );
    return Object.fromEntries(filas.map(f => [f.pais, parseInt(f.n, 10)])) as Record<string, number>;
  });
}

async function contarOfertasPais(codigoPais: string): Promise<number> {
  return (await ofertasPorPais())?.[codigoPais.toLowerCase()] ?? 0;
}

/**
 * Muestra variada de ofertas de un país, para quien dice que le vale cualquier
 * trabajo. Se reparte por ciudades (una por ciudad) para que no salgan seis
 * puestos del mismo sitio, y el filtro de país es estricto: solo se devuelve lo
 * que de verdad está en ese país.
 */
async function ofertasVariadasPais(
  codigoPais: string,
  limite = 6
): Promise<Array<{ id: string; title: string; company: string; city: string; sourceUrl: string }>> {
  try {
    const { getPool } = await import("@/lib/db");
    const r = await getPool().query<{ id: string; title: string; company: string; city: string; sourceUrl: string }>(
      `SELECT DISTINCT ON (city) id, title, company, city, "sourceUrl"
         FROM "JobListing"
        WHERE "isActive" = true
          AND ("expiresAt" > NOW() OR "expiresAt" IS NULL)
          AND LOWER(country) = LOWER($1)
          AND title IS NOT NULL AND title <> ''
          AND city IS NOT NULL AND city <> ''
        ORDER BY city, "scrapedAt" DESC
        LIMIT $2`,
      [codigoPais, limite]
    );
    return r.rows;
  } catch (e) {
    console.error("[Guzzi] ofertasVariadasPais:", (e as Error).message);
    return [];
  }
}

/** Ciudades con más ofertas vivas de un país, para sugerirlas al usuario (guardadas: ver consultaGuardada). */
async function ciudadesTopPais(codigoPais: string, limite = 6): Promise<string[]> {
  const ciudades = await consultaGuardada(`guzzi:ciudades-top:${codigoPais.toLowerCase()}`, async () => {
    const filas = await consultaConMargen<{ city: string }>(
      `SELECT city FROM "JobListing"
        WHERE "isActive" = true
          AND ("expiresAt" > NOW() OR "expiresAt" IS NULL)
          AND LOWER(country) = LOWER($1)
          AND city IS NOT NULL AND city <> ''
        GROUP BY city
        ORDER BY count(*) DESC
        LIMIT 12`,
      [codigoPais]
    );
    return filas.map(x => x.city);
  });
  return (ciudades ?? []).slice(0, limite);
}

function extractCity(text: string): string {
  const cities = [
    // España — grandes ciudades + municipios navarros y cercanos
    "madrid", "barcelona", "valencia", "sevilla", "málaga", "bilbao", "zaragoza",
    "murcia", "pamplona", "tudela", "navarra", "alicante", "córdoba", "granada",
    "vitoria", "san sebastián", "santander", "toledo", "cádiz", "palma",
    // Navarra (comunes)
    "fustiñana", "cintruénigo", "corella", "estella", "tafalla", "tudelilla",
    "cascante", "castejón", "burlada", "barañain", "zizur", "villava",
    "murchante", "monteagudo", "milagro", "azagra", "san adrián", "peralta",
    "andosilla", "marcilla", "olite", "tudela de duero",
    // Europa
    "berlin", "münchen", "munich", "hamburg", "frankfurt", "köln", "stuttgart",
    "paris", "lyon", "marseille", "toulouse", "bordeaux", "lille",
    "roma", "milano", "napoli", "torino", "firenze",
    "lisboa", "porto", "braga", "faro",
    "amsterdam", "rotterdam", "la haya", "utrecht",
    "warszawa", "kraków", "wroclaw", "gdansk",
    "stockholm", "göteborg", "malmö",
    "københavn", "copenhagen", "aarhus",
    "oslo", "bergen", "trondheim",
    "helsinki", "tampere", "turku",
    "dublin", "cork", "galway",
    "zürich", "zurich", "ginebra", "basel", "bern",
    "bruselas", "amberes", "brujas",
    "wien", "vienna", "salzburg",
  ];
  const t = text.toLowerCase();
  
  // 1. Lista hardcodeada (rápido, ciudades grandes)
  for (const c of cities) {
    if (t.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }
  
  // 2. Regex genérico: cualquier palabra(s) tras "en" → captura municipios no listados
  //    Ej: "operario en Fustiñana" → "Fustiñana"
  //    Ej: "camarero en San Sebastián de los Reyes" → "San Sebastián de los Reyes"
  const enMatch = t.match(/en\s+([a-záéíóúñü]+(?:\s+(?:de\s+|la\s+|las\s+|los\s+|el\s+|del\s+)?[a-záéíóúñü]+){0,3})/i);
  if (enMatch) {
    const city = enMatch[1].trim();
    // Filtrar palabras que NO son ciudades
    const nonCities = ['españa', 'alemania', 'francia', 'italia', 'portugal', 'irlanda',
      'holanda', 'suiza', 'suecia', 'noruega', 'dinamarca', 'finlandia', 'austria',
      'bélgica', 'canadá', 'australia', 'remoto', 'casa', 'oficina', 'híbrido',
      'teletrabajo', 'mi', 'el', 'la', 'los', 'las', 'todo', 'cualquier',
      'empresa', 'general', 'total'];
    if (!nonCities.includes(city) && city.length > 2) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  
  return "";
}

// Detecta código de país en el mensaje (para búsquedas au pair)
function extractCountryCode(text: string): string {
  const t = text.toLowerCase();
  const countryMap: Record<string, string> = {
    "reino unido": "GB", "uk": "GB", "inglaterra": "GB", "londres": "GB", "united kingdom": "GB",
    "alemania": "DE", "germany": "DE", "berlin": "DE", "berlín": "DE",
    "francia": "FR", "france": "FR", "paris": "FR", "parís": "FR",
    "irlanda": "IE", "ireland": "IE", "dublin": "IE", "dublín": "IE",
    "holanda": "NL", "netherlands": "NL", "países bajos": "NL", "amsterdam": "NL",
    "dinamarca": "DK", "denmark": "DK", "copenhagen": "DK", "copenhague": "DK",
    "suecia": "SE", "sweden": "SE", "stockholm": "SE", "estocolmo": "SE",
    "noruega": "NO", "norway": "NO", "oslo": "NO",
    "bélgica": "BE", "belgium": "BE", "bruselas": "BE",
    "australia": "AU", "sydney": "AU", "melbourne": "AU",
    "canadá": "CA", "canada": "CA", "toronto": "CA", "vancouver": "CA",
    "nueva zelanda": "NZ", "new zealand": "NZ",
    "suiza": "CH", "switzerland": "CH", "zurich": "CH", "zúrich": "CH",
    "austria": "AT", "vienna": "AT", "viena": "AT",
    "finlandia": "FI", "finland": "FI", "helsinki": "FI",
    "italia": "IT", "italy": "IT", "roma": "IT",
    "portugal": "PT", "lisboa": "PT",
    "españa": "ES", "spain": "ES", "madrid": "ES",
    "estados unidos": "US", "usa": "US", "eeuu": "US", "united states": "US",
  };
  for (const [name, code] of Object.entries(countryMap)) {
    if (t.includes(name)) return code;
  }
  return "";
}

// --- Búsqueda de ofertas Au Pair ------------------------------------------

async function searchAuPairJobs(country: string, limit = 5) {
  try {
    const { getPool } = await import("@/lib/db");
    const pool = getPool();

    // Palabras clave au pair en varios idiomas
    const auPairTerms = ["au pair", "aupair", "au-pair", "nanny", "niñera", "childcare", "child care", "babysitter", "canguro", "live-in caregiver", "live in nanny", "live-in nanny", "niñera interna", "nanny profesional", "full-time nanny"];
    const conditions = auPairTerms.map((_, i) => `LOWER(title) LIKE $${i + 1}`).join(" OR ");
    const params = auPairTerms.map(t => `%${t}%`);

    let countryCondition = "";
    const auPairCountries = "'GB','UK','IE','DE','FR','NL','DK','SE','NO','BE','AU','US','NZ','CA','ES','IT','PT','CH','AT','FI'";
    
    if (country && country !== "ES") {
      // Si el usuario pide un país específico, filtrar SOLO ese país
      // UK/GB: DB tiene 'uk' y 'GB' mezclados — buscar ambos
      if (country === "GB" || country === "UK") {
        params.push(`%uk%`, `%gb%`);
        countryCondition = `AND (LOWER(country) LIKE $${params.length - 1} OR LOWER(country) LIKE $${params.length})`;
      } else {
        params.push(`%${country.toLowerCase()}%`);
        countryCondition = `AND LOWER(country) LIKE $${params.length}`;
      }
    }

    const limitParamIndex = params.length + 1;
    const query = `
      SELECT id, title, company, city, province, country, salary, description, "sourceName", "sourceUrl", "scrapedAt"
      FROM "JobListing"
      WHERE (${conditions})
        AND (${country && country !== "ES" ? "1=1" : `country IN (${auPairCountries})`}${countryCondition})
      ORDER BY "scrapedAt" DESC
      LIMIT $${limitParamIndex}::int
    `;
    params.push(String(limit));

    const result = await pool.query(query, params);

    if (result.rows.length > 0) {
      console.log(`[Guzzi] Au Pair BD: ${result.rows.length} ofertas`);
      return result.rows.map((j: Record<string, unknown>) => ({
        id: `db-${j.id}`,
        titulo: j.title as string,
        empresa: (j.company as string) || "Familia anfitriona",
        ubicacion: (j.city || j.country || "") as string,
        salario: (j.salary as string) || "Paga de bolsillo + alojamiento",
        fuente: (j.sourceName as string) || "BuscayCurra",
        url: (j.sourceUrl as string) || "",
        match: 0,
      }));
    }
    return null;
  } catch (e) {
    console.error("[Guzzi] Error en searchAuPairJobs:", (e as Error).message);
    return null;
  }
}
