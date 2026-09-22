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
 * Son los 26 paises de lib/paises.ts. Si algun dia se añade otro y no esta aqui,
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
