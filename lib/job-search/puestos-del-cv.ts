/**
 * lib/job-search/puestos-del-cv.ts — De lo que pone el CV a lo que se busca.
 *
 * POR QUÉ (17 oct 2026). Las "Ofertas recomendadas para ti" de la portada eran
 * las seis más nuevas de la ciudad, de cualquier cosa: a un carretillero de
 * Tudela le salían "Profesor/a particular", "Director/a de Delegación" y
 * "Terapeuta ocupacional". Recomendar tiene que salir del CV.
 *
 * El CV se escribe a mano y mezcla cosas ("Reponedor, Repartidor, Encargado de
 * Almacén y Ventas"). Se trocea por comas y por "y", se quitan las palabras que
 * valen para cualquier oficio (ayudante, encargado, contrato…) y de cada trozo
 * se queda la primera palabra con sentido, en su raíz: "repone", "almacen",
 * "carretill". Primero el título del CV, intercalado con las experiencias de
 * la más reciente a la más antigua.
 *
 * Sin dependencias de servidor: lo usa también el navegador y se prueba en el
 * sello con CVs inventados.
 */

const VACIAS = new Set(["de", "del", "la", "el", "los", "las", "en", "y", "e", "a", "al", "para", "con", "por", "o", "u", "h", "m", "x", "mh", "hm", "mhx", "un", "una"]);

/** Palabras que acompañan a cualquier oficio: solas sí cuentan ("Operario"). */
const GENERICAS = new Set([
  "ayudante", "auxiliar", "oficial", "responsable", "encargado", "encargada", "jefe", "jefa", "tecnico", "tecnica",
  "operario", "operaria", "personal", "empleado", "empleada", "trabajador", "trabajadora", "contrato", "formacion",
  "practicas", "especialista", "profesional", "senior", "junior", "becario", "becaria", "puesto", "trabajo",
]);

const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const texto = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** "Reponedor, Repartidor, Encargado de Almacén y Ventas" → cuatro trozos. */
function trozos(puesto: string): string[] {
  return puesto.split(/\s*[,;/|·()]\s*|\s+-\s+|\s+y\s+|\s+e\s+/i).map((t) => t.trim()).filter(Boolean);
}

/** El año más reciente de "2015-2026"; "actualidad" cuenta como ahora. */
function anioMasReciente(fechas: string): number {
  if (/actual|presente|hoy|now/i.test(fechas)) return 9999;
  const anios = (fechas.match(/\b(19|20)\d{2}\b/g) || []).map(Number);
  return anios.length ? Math.max(...anios) : 0;
}

/** Los puestos del CV, del más importante al menos. */
export function puestosDelCv(cv: unknown): string[] {
  if (!cv || typeof cv !== "object") return [];
  const c = cv as Record<string, unknown>;
  const titulo = trozos(texto(c.subtitulo) || texto(c.puesto));
  const exp = (Array.isArray(c.experiencia) ? c.experiencia : [])
    .map((e: Record<string, unknown>, i: number) => ({ puesto: texto(e?.puesto), anio: anioMasReciente(texto(e?.fechas)), i }))
    .filter((e) => e.puesto)
    // De la más reciente a la más antigua; sin fechas, en el orden del CV.
    .sort((a, b) => b.anio - a.anio || a.i - b.i)
    .map((e) => trozos(e.puesto)[0]);
  const salida: string[] = [];
  for (let i = 0; i < Math.max(titulo.length, exp.length); i++) {
    if (titulo[i]) salida.push(titulo[i]);
    if (exp[i]) salida.push(exp[i]);
  }
  return salida;
}

/** "carretillero" → "carretill", "cocina" → "cocin", "albañilería" → "albanil". */
export function raiz(palabra: string): string {
  const w = norm(palabra).replace(/[^a-z]/g, "");
  let r = w.replace(/(erias?|eros?|eras?|ores|oras|or|ora|istas?|iones|ion)$/, "");
  // "cajero" → "caj" o "pintor" → "pint" casarían con cualquier cosa.
  if (r.length < 5) r = w;
  if (r.length > 5) r = r.replace(/[aeos]$/, "");
  return r;
}

/** Las raíces que se buscan en los títulos de las ofertas (como mucho `max`). */
export function patronesDelCv(cv: unknown, max = 6): string[] {
  const salida: string[] = [];
  for (const p of puestosDelCv(cv)) {
    const palabras = norm(p).split(/[^a-z]+/).filter((w) => w.length >= 3 && !VACIAS.has(w));
    const conSentido = palabras.find((w) => !GENERICAS.has(w)) ?? palabras[0];
    if (!conSentido) continue;
    const r = raiz(conSentido);
    if (r.length >= 4 && !salida.includes(r)) salida.push(r);
    if (salida.length >= max) break;
  }
  return salida;
}

/** Cada letra con y sin tilde: los títulos de las ofertas las llevan ("Almacén"). */
function conTildes(r: string): string {
  return r.replace(/[aeioun]/g, (l) => ({ a: "[aá]", e: "[eé]", i: "[ií]", o: "[oó]", u: "[uúü]", n: "[nñ]" })[l] as string);
}

/** La expresión para Postgres (~*): palabra que empieza por alguna de las raíces. */
export function regexDePatrones(patrones: string[]): string {
  return `\\m(${patrones.map((r) => (r.length <= 4 ? `${conTildes(r)}(es|as|os|a|o|s)?\\M` : conTildes(r))).join("|")})`;
}

/** Qué raíz casa con un título (para no llenar la portada de lo mismo), o -1. */
export function patronDelTitulo(titulo: string, patrones: string[]): number {
  const t = norm(titulo);
  return patrones.findIndex((r) => new RegExp(`(^|[^a-z])${r}${r.length <= 4 ? "(es|as|os|a|o|s)?($|[^a-z])" : ""}`).test(t));
}
