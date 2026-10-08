/**
 * lib/cursos/plazas/emparejar.ts — Qué plazas reales corresponden a cada ficha.
 *
 * La ficha de "carretillero" tiene que enseñar las plazas de "Conducción de
 * carretillas elevadoras" de Bilbao y las de "Conducció de carretons elevadors"
 * de Tarragona. Ni las fuentes usan nuestros slugs ni hablan todas castellano,
 * así que se empareja por el título, en castellano y en catalán.
 *
 * POR QUÉ PATRONES ESTRECHOS. Una plaza mal emparejada es peor que ninguna:
 * quien busca el carné de carretillero y acaba en un curso de "logística" de
 * 300 horas pierde una mañana y la confianza. Así que cada patrón pide la
 * palabra que identifica el curso, no el sector. Lo que no encaje en ninguna
 * ficha sigue saliendo en el buscador general de /cursos/plazas.
 *
 * Se aplica sobre el título SIN TILDES y en minúsculas.
 */

export const PATRONES_POR_FICHA: Record<string, RegExp> = {
  "manipulador-alimentos": /manipula\w* (de |d')?alimen|manipulacio d'aliments|higiene alimentaria|seguretat alimentaria|appcc|haccp/,
  barista: /barista|\bcafe (de especialidad|d'especialitat)|latte art|servicios? de bar y cafeteria|serveis de bar i cafeteria/,
  "ingles-hosteleria": /\bingles\b|\bangles\b|\benglish\b/,
  carretillero: /carretill|carretons? elevador/,
  "plataforma-elevadora": /plataformas? elevadoras?|plataformes elevadores|\bpemp\b/,
  "prl-basico": /prevencion de riesgos|prevencio de riscos|\bprl\b|riesgos laborales|riscos laborals/,
  "tpc-construccion": /tarjeta profesional de la construccion|\btpc\b|prevencion de riesgos.*construccion|riscos laborals.*construccio/,
  "atencion-sociosanitaria-instituciones": /sociosanitari\w* .*institucion|sscs0208|gerocultor|institucions socials/,
  "atencion-sociosanitaria-domicilio": /sociosanitari\w* .*domicili|sscs0108|ajuda a domicili|ayuda a domicilio/,
  "limpieza-industrial": /limpieza|\bneteja\b/,
  "excel-ofimatica": /ofimatic|\bexcel\b|hojas? de calculo|fulls? de calcul/,
  "competencias-digitales": /competencias digitales|competencies digitals|alfabetizacion digital|alfabetitzacio digital|digitalizacion basica/,
  "atencion-cliente": /atencion al cliente|atencio al client|atencion al publico|atencio al public|atencion al consumidor/,
  // Fichas añadidas el 2026-10-08.
  "cap-conductor-profesional": /\bcap\b|cualificacion inicial|certificado de aptitud profesional|conductor profesional|transporte de mercancias por carretera|transporte de viajeros por carretera/,
  "gases-fluorados": /fluorad|sistemas frigorificos|instalaciones frigorifiques|instalaciones frigorificas/,
  "vigilante-seguridad": /vigilante de seguridad|vigilant de seguretat|seguridad privada|seguretat privada|habilitacion vigilante/,
  soldadura: /soldadu|soldeo|\bsoldar\b/,
};

/**
 * Cómo se llaman las plazas de una ficha cuando no son exactamente la ficha.
 * Las plazas de "inglés para hostelería" son de inglés en general (B1, A2…):
 * titularlas "plazas de inglés para hostelería" sería prometer algo que no son.
 */
const ETIQUETA_PLAZAS: Record<string, string> = {
  "ingles-hosteleria": "inglés",
  barista: "bar y cafetería",
  "limpieza-industrial": "limpieza",
  "prl-basico": "prevención de riesgos laborales",
};

export function etiquetaPlazas(slug: string, nombreFicha: string): string {
  return ETIQUETA_PLAZAS[slug] ?? nombreFicha.toLowerCase();
}

export function normalizarTitulo(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Lo que parece de la ficha pero no lo es. "Competencias digitales docentes" y
 * "para formadores y tutores" son cursos para profesores: a quien busca su
 * primer trabajo de oficina no le sirven de nada.
 */
export const EXCLUIR_POR_FICHA: Record<string, RegExp> = {
  "competencias-digitales": /docent|formador|tutor|profesorado|professorat/,
  "excel-ofimatica": /docent|formador/,
};

/** Fichas a las que corresponde una plaza, por su título. Puede ser ninguna. */
export function fichasDePlaza(titulo: string): string[] {
  const t = normalizarTitulo(titulo);
  return Object.entries(PATRONES_POR_FICHA)
    .filter(([slug, re]) => re.test(t) && !EXCLUIR_POR_FICHA[slug]?.test(t))
    .map(([slug]) => slug);
}
