/**
 * lib/ett-terminos.ts — Como se llama una ETT en cada pais.
 *
 * POR QUE EXISTE: hasta el 22 sep 2026 el buscador de ETTs preguntaba a Google
 * siempre en español ("ETT empresa trabajo temporal Berlin"). En España va bien,
 * pero fuera no: ninguna empresa alemana se anuncia como "ETT", asi que Google
 * devolvia lo que mejor casaba con esas palabras, y en la prueba de Berlin tres
 * de los cinco resultados estaban en Barcelona. Con el nombre que se usa de
 * verdad en cada sitio (Zeitarbeitsfirma, uitzendbureau, agence d'interim...)
 * salen las de la ciudad que pide el usuario.
 *
 * Son los paises de lib/paises.ts. Si algun dia se añade otro y no esta aqui,
 * se usa PREDETERMINADO (ingles), que Google entiende en casi todo el mundo.
 */

/** Terminos de busqueda por codigo de pais (ISO 3166-1 alpha-2; UK, no GB). */
export const TERMINOS_ETT: Record<string, string[]> = {
  ES: ["ETT empresa de trabajo temporal", "agencia de empleo"],
  DE: ["Zeitarbeitsfirma", "Personalvermittlung"],
  AT: ["Zeitarbeitsfirma", "Personalbereitstellung"],
  CH: ["Personalverleih Temporärbüro", "agence de placement"],
  FR: ["agence d'intérim", "agence de recrutement"],
  BE: ["uitzendbureau", "agence d'intérim"],
  NL: ["uitzendbureau", "wervingsbureau"],
  IT: ["agenzia per il lavoro", "agenzia interinale"],
  PT: ["empresa de trabalho temporário", "agência de emprego"],
  PL: ["agencja pracy tymczasowej", "agencja zatrudnienia"],
  CZ: ["personální agentura", "agentura práce"],
  HU: ["munkaerő-kölcsönző", "személyzeti ügynökség"],
  RO: ["agent de muncă temporară", "agenție de recrutare"],
  GR: ["εταιρεία προσωρινής απασχόλησης", "γραφείο ευρέσεως εργασίας"],
  SE: ["bemanningsföretag", "rekryteringsföretag"],
  DK: ["vikarbureau", "rekrutteringsbureau"],
  NO: ["bemanningsbyrå", "rekrutteringsbyrå"],
  FI: ["henkilöstöpalveluyritys", "rekrytointitoimisto"],
  IE: ["recruitment agency", "temp agency"],
  UK: ["recruitment agency", "temp agency"],
  US: ["staffing agency", "temp agency"],
  CA: ["staffing agency", "recruitment agency"],
  AU: ["labour hire agency", "recruitment agency"],
  NZ: ["recruitment agency", "labour hire company"],
  JP: ["人材派遣会社", "転職エージェント"],
  SG: ["employment agency", "recruitment agency"],
  // En México no se dice "ETT", y desde la reforma de 2021 la subcontratación de
  // personal está prohibida: las que quedan se anuncian como agencias.
  MX: ["agencia de empleo", "agencia de reclutamiento"],
  // En Brasil el trabajo temporal va por empresas de "trabalho temporário"
  // (Lei 6.019/1974); para buscar trabajo se dice "agência de empregos".
  BR: ["agência de empregos", "trabalho temporário"],
  // En Colombia la ETT es la "empresa de servicios temporales" (EST, Ley 50 de
  // 1990), y las agencias de colocación se anuncian como agencias de empleo.
  CO: ["empresa de servicios temporales", "agencia de empleo"],
  // En Perú las ETT son "empresas de servicios temporales" (Ley 27626, de
  // intermediación laboral).
  PE: ["empresa de servicios temporales", "agencia de empleo"],
  // En Chile la ETT es la "empresa de servicios transitorios" (EST, Ley 20.123).
  CL: ["empresa de servicios transitorios", "agencia de empleo"],
  // En Argentina son "empresas de servicios eventuales" (Decreto 1694/2006).
  AR: ["empresa de servicios eventuales", "agencia de empleo"],
  // En Ecuador no hay ETT: el Mandato Constituyente 8 (2008) prohibió la
  // intermediación laboral. Quedan las empresas de actividades complementarias
  // (limpieza, vigilancia, alimentación) y las agencias de empleo.
  EC: ["agencia de empleo", "actividades complementarias"],
  GT: ["agencia de empleo", "agencia de reclutamiento"],
  CR: ["agencia de empleo", "agencia de reclutamiento"],
  UY: ["agencia de empleo", "agencia de colocación"],
};

/**
 * Cuando no se ha podido situar el sitio (OpenStreetMap caido, por ejemplo) no
 * se sabe el pais. Se pregunta en español y en ingles a la vez: la mayoria de
 * quien busca esta en España, y el ingles lo entiende Google en todas partes.
 * Preguntar SOLO en español fue lo que trajo ETTs de Barcelona buscando en
 * Berlin, y preguntar solo en ingles trajo la panaderia del pueblo buscando en
 * Fustiñana. Comprobado el 22 sep 2026 con las dos formas.
 */
const PREDETERMINADO = ["ETT empresa de trabajo temporal", "employment agency"];

export function terminosEtt(paisCodigo?: string): string[] {
  return (paisCodigo && TERMINOS_ETT[paisCodigo.toUpperCase()]) || PREDETERMINADO;
}
