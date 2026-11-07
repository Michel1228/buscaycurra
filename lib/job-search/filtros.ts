/**
 * lib/job-search/filtros.ts — Los filtros del buscador, en los idiomas de las ofertas.
 *
 * EL FALLO (medido el 5 nov 2026 con el buscador público). Los filtros solo
 * sabían español: "Remoto" buscaba la palabra "remoto" y "Jornada parcial" la
 * palabra "parcial". En España funcionaban (1.612 ofertas remotas), pero
 * fuera no:
 *   · Reino Unido, jornada parcial → 0 ofertas. Allí dicen "part time".
 *   · Alemania, remoto → la búsqueda se cortaba por tiempo: leía la descripción
 *     de 545.000 ofertas buscando una palabra que en alemán no se usa
 *     ("Homeoffice" salía 2.189 veces solo en títulos).
 *   · "Jornada completa" no filtraba nada: no tenía condición.
 *
 * Y los portales de Latinoamérica y Brasil (OCC, Computrabajo, Catho, InfoJobs,
 * Vagas) tienen un filtro que aquí no había: ofertas para personas con
 * discapacidad. En Brasil son las "vagas PCD" (681 en nuestra base el 5 nov
 * 2026); en España, las que piden certificado de discapacidad (614).
 *
 * Los términos van con límite de palabra (\m...\M): "stage" no puede salir en
 * "backstage", ni "intern" en "international".
 */

export const TERMINOS = {
  remoto: [
    "remoto", "remota", "teletrabajo", "home office", "homeoffice", "desde casa",
    "remote", "work from home", "fully remote", "télétravail", "teletravail",
    "da remoto", "smart working", "thuiswerk", "thuiswerken", "praca zdalna",
    "zdalnie", "trabalho remoto", "fjernarbeid", "distansarbete", "etätyö",
    // Eslovaco, esloveno y griego (6 nov 2026).
    "práca z domu", "práca na diaľku", "delo od doma", "delo na daljavo",
    "τηλεργασία", "εξ αποστάσεως",
  ],
  parcial: [
    "parcial", "media jornada", "medio tiempo", "part time", "parttime",
    "teilzeit", "minijob", "temps partiel", "meio período", "meio periodo",
    "tempo parziale", "part-time", "deeltijd", "deltid", "osa-aikainen",
    "pół etatu", "niepełny etat",
    "čiastočný úväzok", "skrátený úväzok", "polovičný úväzok", "kratší pracovný čas",
    "krajši delovni čas", "krajšim delovnim časom", "polovični delovni čas",
    "μερική απασχόληση", "μερικής απασχόλησης", "μερικό ωράριο",
  ],
  sinExperiencia: [
    "sin experiencia", "becario", "becaria", "prácticas", "practicante", "trainee",
    "junior", "sem experiência", "estágio", "estagiário", "estagiária",
    "jovem aprendiz", "aprendiz", "entry level", "graduate", "internship",
    "apprentice", "apprenticeship", "berufseinsteiger", "praktikum", "ausbildung",
    "werkstudent", "stagiaire", "alternance", "débutant", "apprenti",
    "tirocinio", "stagista", "stagiair", "praktykant", "staż",
    // "absolvent" y "praktikant" son también alemanes (graduado, becario):
    // encajan con lo que ya hacen "graduate" y "praktikum".
    "bez praxe", "absolvent", "absolventa", "absolventov", "stáž", "stážista", "praktikant",
    "brez izkušenj", "pripravnik", "pripravnica", "pripravništvo",
    "χωρίς εμπειρία", "χωρίς προϋπηρεσία", "πρακτική άσκηση", "ασκούμενος", "ασκούμενη", "νέοι απόφοιτοι",
  ],
  // Solo lo que dice que la oferta es PARA personas con discapacidad. Nada de
  // "disability" a secas: todas las ofertas de Estados Unidos lo llevan en la
  // frase legal de no discriminación, y el filtro las devolvería todas.
  inclusiva: [
    "pcd", "pcds", "pessoa com deficiência", "pessoas com deficiência",
    "vaga afirmativa", "certificado de discapacidad", "persona con discapacidad",
    "personas con discapacidad", "diversidad funcional", "discapacidad igual o superior",
    // "ZŤP" es la sigla eslovaca; sin tilde también casa "ZTP". En esloveno no
    // va "invalid" suelto: en inglés sale en descripciones que no tienen nada que ver.
    "ZŤP", "zdravotným postihnutím", "chránená dielňa",
    "invalidi", "invalidne osebe", "za invalide", "invalidsko podjetje",
    "ΑμεΑ", "άτομα με αναπηρία", "ατόμων με αναπηρία",
  ],
} as const;

export type Filtro = keyof typeof TERMINOS;

function sinAcentos(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
}

function escapar(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Una sola expresión regular de Postgres para todo el filtro:
 * \m(remoto|home[ -]?office|...)\M. Cada término va con y sin acentos, y los
 * espacios valen también como guion o nada ("home-office", "homeoffice").
 */
export function regexFiltro(filtro: Filtro): string {
  const formas = new Set<string>();
  for (const t of TERMINOS[filtro]) {
    for (const v of [t.toLowerCase(), sinAcentos(t.toLowerCase())]) {
      formas.add(v.split(/[\s-]+/).map(escapar).join("[ -]?"));
    }
  }
  return "\\m(" + [...formas].join("|") + ")\\M";
}

/** Lo mismo para probar en JavaScript (pruebas y el sello). */
export function coincideFiltro(filtro: Filtro, texto: string): boolean {
  const js = regexFiltro(filtro).replace(/^\\m/, "(?<![\\p{L}\\p{N}])").replace(/\\M$/, "(?![\\p{L}\\p{N}])");
  return new RegExp(js, "iu").test(texto);
}
