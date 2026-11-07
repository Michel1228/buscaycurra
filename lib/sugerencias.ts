/**
 * lib/sugerencias.ts — Lo que se sugiere al escribir una ciudad o un puesto, y
 * los ejemplos, según el país de cada uno.
 *
 * POR QUÉ EXISTE (prueba desde Colombia y México, 7 nov 2026). No había ningún
 * autorrelleno, y las pocas pistas que había eran de España: el registro decía
 * "Ej: Madrid, Barcelona..." a quien entraba desde Bogotá, el comparador de
 * salarios empezaba en España con "camarero, fontanero, albanil", y las páginas
 * /empleo de Medellín proponían "vendedor en madrid". Cada uno tiene que ver lo
 * suyo: sus ciudades, bien escritas, y los oficios como se dicen allí.
 *
 * TODO ES ESTÁTICO: nada de esto consulta la base. Las ciudades salen de las
 * fichas de lib/paises.ts y de la tabla de lib/guzzi/ciudades-pais.ts (que
 * lleva los municipios del barrido de México y Colombia con sus tildes); los
 * oficios, de las palabras de cada país (keywordsLaborales, sacadas de la base)
 * y del vocabulario de abajo.
 */
import { PAISES } from "@/lib/paises";
import { ciudadesDePais } from "@/lib/guzzi/ciudades-pais";

/** Minúsculas y sin tildes, para comparar lo escrito con las sugerencias. */
export function sinTildes(s: string): string {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export interface Sugerencia {
  /** Lo que se enseña y se escribe en el campo: "Zipaquirá". */
  texto: string;
  /** Formas con las que casa lo que se escribe, sin tildes: "zipaquira". */
  claves: string[];
}

// ── Ciudades ─────────────────────────────────────────────────────────────────

const PARTICULAS = new Set(["de", "del", "la", "las", "los", "y", "e", "el", "da", "do", "dos", "das"]);
const LETRA_CON_TILDE = /[à-ÿĀ-ž]/i;

/** "san nicolás de los garza" → "San Nicolás de los Garza". */
function nombrePropio(s: string): string {
  return s.split(" ").map((p, i) =>
    i > 0 && PARTICULAS.has(p) ? p : p.charAt(0).toLocaleUpperCase("es") + p.slice(1)
  ).join(" ");
}

const cacheCiudades = new Map<string, Sugerencia[]>();

/**
 * Las ciudades de un país: primero las de su ficha (ordenadas por ofertas),
 * luego el resto de la tabla por orden alfabético. Sin país, ninguna.
 */
export function ciudadesDe(pais: string | null | undefined): Sugerencia[] {
  const p = (pais || "").trim().toUpperCase();
  if (!p) return [];
  const guardada = cacheCiudades.get(p);
  if (guardada) return guardada;

  const fichas = PAISES[p]?.ciudades ?? [];
  const grupos = ciudadesDePais(p).map((formas) => formas.map((f) => f.toLowerCase()));
  const grupoDe = (nombre: string) => grupos.find((g) => g.some((f) => sinTildes(f) === sinTildes(nombre)));

  const usados = new Set<string[]>();
  const resultado: Sugerencia[] = [];
  for (const nombre of fichas) {
    const grupo = grupoDe(nombre);
    if (grupo) usados.add(grupo);
    resultado.push({ texto: nombre, claves: [...new Set([nombre, ...(grupo ?? [])].map(sinTildes))] });
  }
  const resto: Sugerencia[] = [];
  for (const grupo of grupos) {
    if (usados.has(grupo)) continue;
    // Se enseña la forma con tildes si la hay ("itagüí", no "itagui"), y solo
    // en letras latinas: "λεμεσός" o "東京" no se enseñan, pero sí casan.
    const latinas = grupo.filter((f) => /^[\p{Script=Latin}\s.'’-]+$/u.test(f));
    const mejor = latinas.find((f) => LETRA_CON_TILDE.test(f)) ?? latinas[0] ?? grupo[0];
    resto.push({ texto: nombrePropio(mejor), claves: [...new Set(grupo.map(sinTildes))] });
  }
  resto.sort((a, b) => a.texto.localeCompare(b.texto, "es"));
  const todas = [...resultado, ...resto];
  cacheCiudades.set(p, todas);
  return todas;
}

/** La primera ciudad del país, para empezar una búsqueda: "Bogotá", "Ciudad de México". */
export function ciudadPorDefecto(pais: string | null | undefined): string {
  return PAISES[(pais || "").toUpperCase()]?.ciudades[0] ?? "Madrid";
}

/** El ejemplo del campo ciudad: "Ej: Madrid, Barcelona..." solo en España. */
export function ejemploCiudades(pais: string | null | undefined): string {
  const p = (pais || "").toUpperCase();
  if (!p || p === "ES") return "Ej: Madrid, Barcelona...";
  const nombres = ciudadesDe(p).slice(0, 2).map((c) => c.texto);
  return nombres.length >= 2 ? `Ej: ${nombres[0]}, ${nombres[1]}...` : "Ej: tu ciudad";
}

// ── Puestos ──────────────────────────────────────────────────────────────────
//
// Como se dicen en cada sitio. España, México y Colombia, uno a uno; el resto
// de países de habla hispana, con palabras que se entienden en todos (y sus
// keywordsLaborales, que salen de sus ofertas). Nada de "camarero" o
// "fontanero" en México, ni de "mesero" o "plomero" en España.

const VOCABULARIO_ES = [
  "camarero", "cocinero", "ayudante de cocina", "dependiente", "cajero", "mozo de almacén",
  "repartidor", "conductor", "limpieza", "camarera de piso", "recepcionista", "administrativo",
  "comercial", "teleoperador", "enfermero", "cuidador", "niñera", "au pair", "albañil",
  "electricista", "fontanero", "soldador", "carpintero", "pintor", "mecánico", "operario",
  "jardinero", "peluquero", "profesor", "programador", "vigilante de seguridad",
];

const VOCABULARIO_MX = [
  "mesero", "ayudante general", "almacenista", "chofer", "vendedor", "cajero",
  "auxiliar administrativo", "recepcionista", "cocinero", "ayudante de cocina", "recamarista",
  "limpieza", "guardia de seguridad", "repartidor", "call center", "enfermero", "cuidador",
  "niñera", "albañil", "electricista", "plomero", "soldador", "carpintero", "pintor",
  "mecánico", "jardinero", "estilista", "profesor", "programador",
];

const VOCABULARIO_CO = [
  "mesero", "auxiliar administrativo", "asesor comercial", "vendedor", "cajero", "operario",
  "conductor", "mensajero", "auxiliar de bodega", "auxiliar de aseo", "call center",
  "recepcionista", "cocinero", "auxiliar de cocina", "enfermero", "auxiliar de enfermería",
  "cuidador", "niñera", "vigilante", "albañil", "electricista", "soldador", "carpintero",
  "pintor", "mecánico", "estilista", "profesor", "programador",
];

const VOCABULARIO_HISPANO = [
  "vendedor", "cajero", "cocinero", "recepcionista", "limpieza", "atención al cliente",
  "call center", "operario", "chofer", "conductor", "repartidor", "auxiliar administrativo",
  "guardia de seguridad", "enfermero", "cuidador", "albañil", "electricista", "soldador",
  "carpintero", "mecánico", "profesor", "programador",
];

/** El vocabulario de un país de habla hispana; null si allí no se habla español. */
function vocabularioDe(pais: string | null | undefined): string[] | null {
  const p = (pais || "").toUpperCase();
  if (p === "ES") return VOCABULARIO_ES;
  if (p === "MX") return VOCABULARIO_MX;
  if (p === "CO") return VOCABULARIO_CO;
  return PAISES[p]?.idioma === "es" ? VOCABULARIO_HISPANO : null;
}

function sinRepetir(lista: string[]): string[] {
  const vistas = new Set<string>();
  return lista.filter((x) => { const k = sinTildes(x); if (vistas.has(k)) return false; vistas.add(k); return true; });
}

/**
 * Los puestos que se sugieren al buscar en `paisOfertas`: primero las palabras
 * de sus ofertas (keywordsLaborales, en el idioma de allí) y luego las de la
 * persona. En un país que no habla español, las de donde está ella ("mesero"
 * si está en México): el buscador las traduce.
 */
export function puestosDe(paisOfertas: string | null | undefined, paisPersona?: string | null): string[] {
  const local = PAISES[(paisOfertas || "").toUpperCase()]?.keywordsLaborales ?? [];
  const vocabulario = vocabularioDe(paisOfertas) ?? vocabularioDe(paisPersona) ?? VOCABULARIO_ES;
  return sinRepetir([...local, ...vocabulario]);
}

/** Puestos para enlazar en las páginas públicas de una ciudad de ese país. */
export function puestosParecidos(pais: string | null | undefined): string[] {
  return sinRepetir([...(vocabularioDe(pais) ?? []), ...puestosDe(pais)]);
}

/**
 * Entre los países posibles de una ciudad que se llama igual en varios sitios,
 * el que delata el oficio: "mesero en Guadalajara" es México, porque en España
 * no se dice "mesero". null si el oficio no lo aclara.
 */
export function paisPorVocabulario(candidatos: string[], puesto: string): string | null {
  const p = sinTildes(puesto);
  const dice = (pais: string) => (vocabularioDe(pais) ?? []).some((v) => sinTildes(v) === p);
  if (dice("ES")) return null;
  return candidatos.find((c) => c !== "ES" && dice(c)) ?? null;
}

/** El ejemplo del campo "¿De qué buscas trabajo?" del registro. */
export function ejemploPuestos(pais: string | null | undefined): string {
  const p = (pais || "").toUpperCase();
  if (p === "MX" || p === "CO") return `Ej: ${vocabularioDe(p)!.slice(0, 3).join(", ")}…`;
  const local = PAISES[p]?.idioma === "es" && p !== "ES" ? PAISES[p].keywordsLaborales.slice(0, 3) : [];
  if (local.length === 3) return `Ej: ${local.join(", ")}…`;
  return "Ej: camarera, mozo de almacén, cuidador…";
}

// ── Filtrar lo escrito ───────────────────────────────────────────────────────

/**
 * Las sugerencias que casan con lo escrito, sin mirar tildes ni mayúsculas:
 * primero las que empiezan así, luego las que tienen una palabra que empieza
 * así ("pedro" → "San Pedro Garza García") y, con tres letras o más, las que
 * lo contienen. Con menos de dos letras, ninguna.
 */
export function filtrarSugerencias(opciones: (string | Sugerencia)[], escrito: string, max = 8): string[] {
  const q = sinTildes(escrito);
  if (q.length < 2) return [];
  const empiezan: string[] = [];
  const porPalabra: string[] = [];
  const contienen: string[] = [];
  for (const o of opciones) {
    const texto = typeof o === "string" ? o : o.texto;
    const claves = typeof o === "string" ? [sinTildes(o)] : o.claves;
    if (claves.some((k) => k.startsWith(q))) empiezan.push(texto);
    else if (claves.some((k) => k.split(/[\s-]+/).some((w) => w.startsWith(q)))) porPalabra.push(texto);
    else if (q.length >= 3 && claves.some((k) => k.includes(q))) contienen.push(texto);
  }
  return sinRepetir([...empiezan, ...porPalabra, ...contienen]).slice(0, max);
}
