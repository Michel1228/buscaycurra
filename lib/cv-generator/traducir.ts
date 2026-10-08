/**
 * lib/cv-generator/traducir.ts — Traducir el contenido del CV con la IA.
 *
 * QUÉ SE MANDA A LA IA Y QUÉ NO. Solo el texto que hay que traducir: puesto
 * buscado, perfil, aptitudes, y de cada experiencia y estudio el puesto, las
 * fechas, las tareas y el título. NUNCA el nombre, el teléfono, el correo, la
 * ciudad, la foto ni los nombres de empresas y centros: no hacen falta para
 * traducir y no tienen por qué salir de aquí.
 *
 * QUÉ SE ACEPTA DE VUELTA. La IA puede inventar, saltarse un puesto o
 * devolver otra cosa. Por eso aplicarTraduccion() solo coge lo que encaja con
 * el CV original: mismo número de experiencias, de tareas y de estudios; si
 * algo no cuadra, se queda el texto original de ese campo. Lo que se descarga
 * nunca tiene más experiencia de la que la persona escribió.
 */
import type { CVData } from "./cv-template";
import { IDIOMAS_CV, type IdiomaCV } from "./idiomas-cv";

interface Traducible {
  subtitulo: string;
  perfilProfesional: string;
  aptitudes: string[];
  idiomas: string[];
  experiencia: { puesto: string; fechas: string; descripcion: string[] }[];
  formacion: { titulo: string }[];
}

export function extraerTraducible(cv: CVData): Traducible {
  return {
    subtitulo: cv.subtitulo ?? "",
    perfilProfesional: cv.perfilProfesional ?? "",
    aptitudes: cv.aptitudes ?? [],
    idiomas: (cv.idiomas ?? []).map(i => i.nombre),
    experiencia: (cv.experiencia ?? []).map(e => ({ puesto: e.puesto, fechas: e.fechas, descripcion: e.descripcion ?? [] })),
    formacion: (cv.formacion ?? []).map(f => ({ titulo: f.titulo })),
  };
}

const NOMBRE_IDIOMA: Record<Exclude<IdiomaCV, "es">, string> = {
  en: "English", de: "German", fr: "French", pt: "European Portuguese", it: "Italian", nl: "Dutch",
};

export function promptTraduccion(cv: CVData, idioma: Exclude<IdiomaCV, "es">): string {
  return [
    `Translate this CV content from Spanish into ${NOMBRE_IDIOMA[idioma]}, as a native professional recruiter in that country would write it.`,
    "Rules:",
    "- Translate faithfully. Do NOT add, remove or invent any experience, task, skill, qualification or achievement.",
    "- Use the usual job-title names of that country (e.g. 'Camarero/a' -> 'Waiter/Waitress').",
    "- In dates translate only the words (e.g. 'Actualidad' -> 'Present'); keep every number.",
    "- Spanish official qualifications: translate the name and keep the Spanish name in brackets the first time (e.g. 'Hospitality technician (Técnico en Cocina)').",
    "- Keep the same number of items in every array and the same order.",
    "- Reply ONLY with valid JSON with exactly the same keys and structure as the input. No comments, no markdown.",
    "",
    JSON.stringify(extraerTraducible(cv)),
  ].join("\n");
}

const texto = (v: unknown): string | null => (typeof v === "string" ? v.trim() : null);

function parsearJSON(respuesta: string): any | null {
  const limpio = respuesta.replace(/```(?:json)?/gi, "").trim();
  const ini = limpio.indexOf("{"), fin = limpio.lastIndexOf("}");
  if (ini < 0 || fin <= ini) return null;
  try { return JSON.parse(limpio.slice(ini, fin + 1)); } catch { return null; }
}

/**
 * Mezcla la respuesta de la IA con el CV original. Devuelve el CV traducido y
 * cuántos campos se han quedado en español porque la respuesta no cuadraba.
 */
export function aplicarTraduccion(
  original: CVData, respuesta: string, idioma: Exclude<IdiomaCV, "es">
): { cv: CVData; sinTraducir: number } | null {
  const t = parsearJSON(respuesta);
  if (!t || typeof t !== "object") return null;
  let sinTraducir = 0;
  const uno = (nuevo: unknown, viejo: string | undefined) => {
    const n = texto(nuevo);
    if (!viejo) return viejo;
    if (!n) { sinTraducir++; return viejo; }
    // Una "traducción" diez veces más larga es la IA escribiendo de más.
    if (n.length > Math.max(60, viejo.length * 3)) { sinTraducir++; return viejo; }
    return n;
  };
  const lista = (nuevo: unknown, viejo: string[] | undefined) => {
    if (!viejo?.length) return viejo;
    if (!Array.isArray(nuevo) || nuevo.length !== viejo.length) { sinTraducir += viejo.length; return viejo; }
    return viejo.map((v, i) => uno(nuevo[i], v) as string);
  };

  const exp = original.experiencia?.map((e, i) => {
    const n = Array.isArray(t.experiencia) && t.experiencia.length === original.experiencia!.length ? t.experiencia[i] : null;
    if (!n) { sinTraducir++; return e; }
    return { ...e, puesto: uno(n.puesto, e.puesto) as string, fechas: uno(n.fechas, e.fechas) as string, descripcion: lista(n.descripcion, e.descripcion) };
  });
  const form = original.formacion?.map((f, i) => {
    const n = Array.isArray(t.formacion) && t.formacion.length === original.formacion!.length ? t.formacion[i] : null;
    if (!n) { sinTraducir++; return f; }
    return { ...f, titulo: uno(n.titulo, f.titulo) as string };
  });
  const nombresIdiomas = lista(t.idiomas, original.idiomas?.map(i => i.nombre));

  return {
    cv: {
      ...original,
      idioma,
      subtitulo: uno(t.subtitulo, original.subtitulo),
      perfilProfesional: uno(t.perfilProfesional, original.perfilProfesional),
      aptitudes: lista(t.aptitudes, original.aptitudes),
      idiomas: original.idiomas?.map((i, k) => ({ ...i, nombre: nombresIdiomas?.[k] ?? i.nombre })),
      experiencia: exp,
      formacion: form,
    },
    sinTraducir,
  };
}

export function nombreIdioma(codigo: string): string {
  return IDIOMAS_CV.find(i => i.codigo === codigo)?.nombre ?? codigo;
}
