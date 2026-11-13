/**
 * lib/job-search/portales-empleo.ts — Portales de empleo: NO son quien contrata.
 *
 * POR QUÉ (8 nov 2026). 12.231 ofertas activas tenían como empresa "Domestiko.com",
 * que es un portal que publica ofertas de muchas empresas distintas (6.334 títulos,
 * 1.668 ciudades), y todas llevaban un correo @domestiko.com. "Enviar CV" mandaba
 * el currículum al portal y no a quien contrata, y como hay un freno de 15 días por
 * dirección, al escribir a una se "tachaban" todas. Lo mismo pasa con Cronoshare,
 * Superprof, Placements24... Estas ofertas se solicitan en su web de origen
 * ("Inscribirme en la oferta"), igual que Lanbide y SEF (fuente-oficial.ts).
 *
 * LISTA CERRADA, revisada a mano con consultas de solo lectura a producción el
 * 8 nov 2026 (ofertas vivas con ese correo; se sacó con: dominios de contactEmail
 * con muchos títulos y ciudades distintos, y nombres de empresa de portales).
 * Cuidado al ampliarla: una ETT real (Adecco, Randstad, Manpower, Michael Page,
 * Hays, Gi Group, Crit...) SÍ contrata y SÍ recibe CV: no va aquí aunque tenga
 * miles de títulos. Tampoco "Job-Room" (portal oficial suizo) ni "Non renseigné":
 * sus correos son distintos y de cada empleador, no del portal.
 *
 * Sin dependencias de servidor: lo usan también componentes de cliente y el
 * extractor de correos del VPS (compilado junto a correo-oferta.ts).
 */

/** Dominio de correo del portal → ofertas vivas con ese correo el 8 nov 2026. */
const DOMINIOS_PORTAL: Record<string, number> = {
  "superprof.com": 19277,          // clases particulares, 16 países
  "placements24.com": 13876,       // portal sudafricano
  "fonction-publique.gouv.fr": 6260, // portal del empleo público francés
  "nlwerkt.nl": 5878,              // agregador neerlandés
  "direct-emploi.com": 4643,
  "free-work.com": 4587,           // agregador francés de freelances
  "jobgether.com": 4181,           // "publicado en nombre de una empresa socia"
  "france-travail.com": 3579,      // no es el servicio público (ese es francetravail.fr)
  "cronoshare.com": 3536,          // España: plataforma de profesionales
  "ernesto.com": 3353, "ernesto.de": 2460, "ernesto.it": 292, "ernesto.pt": 143,
  "sitly.com": 2393,               // canguros
  "collective.work": 2204, "collectivework.com": 16, "collectiveworks.net": 6,
  "banen.com": 1956,               // "PLC Banen", "Banen bij ..." (Países Bajos)
  "mercor.com": 1517,
  "jobbydoo.com": 934, "jobbydoo.it": 5,
  "jobtome.com": 689,
  "yoopies.com": 621,
  "infegy.com": 409,               // correo de las ofertas "Cronoshare" de Brasil
  "talantir.ai": 458,
  "babysits.com": 247,
  "directemploi.com": 89,
  "hosteleo.com": 7, "gserviceaccount.com": 77, // cuenta de servicio de Google: ni es de nadie
  "ziprecruiter.com": 60,
  "francetravail.fr": 28,
  "studentjob.co.uk": 25,
  "meteojob.com": 17,
};

/**
 * Nombre de empresa (normalizado, ver normalizar) → ofertas vivas con ese nombre
 * el 8 nov 2026. Hay portales cuyo correo se perdió pero el nombre delata que es
 * el portal quien figura como "empresa" (p. ej. 114 ofertas "Domestiko" sin correo).
 */
const NOMBRES_PORTAL: Record<string, number> = {
  superprof: 19540, superprofsas: 2099,
  placements24: 13876,
  nlwerkt: 5878,
  directemploi: 4732,
  freework: 4599,
  jobgether: 4192, jobgethersrl: 252,
  francetravail: 3607,
  cronoshare: 4989,                // "Cronoshare.com" 3.645 + "Cronoshare" 1.244 + ".com.br" 300
  ernesto: 6248,
  sitly: 2393,
  collectivework: 3476,
  jobslimnl: 3070,
  mercor: 1590,
  jobbydoo: 982,
  jobtome: 689,
  yoopies: 621,
  jooble: 485,
  talantir: 458,
  babysits: 268,
  hosteleo: 84,
  ziprecruiter: 60,
  meteojob: 17,
};

/** "PLC Banen", "Vapro Banen", "Banen bij X": portales neerlandeses de ofertas. */
const ES_BANEN = /(^banen\b|\bbanen$)/;

function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/\.com(\.br)?$/, "").replace(/[^a-z0-9]+/g, "");
}

/** ¿Este correo es de un portal de empleo (no de quien contrata)? */
export function esCorreoDePortal(email: string | null | undefined): boolean {
  const dominio = (email ?? "").trim().toLowerCase().split("@")[1] ?? "";
  if (!dominio) return false;
  return Object.keys(DOMINIOS_PORTAL).some((d) => dominio === d || dominio.endsWith("." + d));
}

/** ¿Este nombre de empresa es el de un portal de empleo? */
export function esNombreDePortal(empresa: string | null | undefined): boolean {
  const crudo = (empresa ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  if (!crudo) return false;
  if (normalizar(crudo) in NOMBRES_PORTAL) return true;
  return ES_BANEN.test(crudo.replace(/[^a-z0-9]+/g, " ").trim());
}

/**
 * ¿Es una oferta de un portal? Entonces el CV NO se manda por correo: la oferta
 * se solicita en su web de origen. Basta con que el nombre o el correo lo sean.
 */
export function esOfertaDePortal(o: { empresa?: string | null; correo?: string | null }): boolean {
  return esNombreDePortal(o.empresa) || esCorreoDePortal(o.correo);
}

/**
 * Motivo para no mandar el CV por correo a este destino, o null. Lo comprueban la
 * ruta de envío Y el worker de la cola, para que tampoco salga lo ya encolado.
 */
export function motivoPortalDeEmpleo(email: string, empresa?: string | null): string | null {
  return esCorreoDePortal(email) || esNombreDePortal(empresa)
    ? `${AVISO_PORTAL} Pulsa "Inscribirme en la oferta".`
    : null;
}

/**
 * AGENCIAS QUE SÍ RECIBEN EL CV, PERO DE MUCHOS PUESTOS EN LA MISMA DIRECCIÓN
 * (13 nov 2026). Decisión de Michel: Domestiko es una agencia de empleo; "aunque
 * tenga muchísimos puestos, cuando mandes el currículum que vaya dirigido a ese
 * puesto". Ya no está en las listas de portales de arriba, así que se le manda
 * el CV como a cualquier empresa (jobs@domestiko.com, 12.299 ofertas vivas), y:
 *  - el asunto y la carta llevan el puesto ("Candidatura para Ayudante de
 *    cocina — Nombre"; cv-personalizer.ts y worker.ts);
 *  - el freno de 15 días es por dirección Y PUESTO (tracker.canSendToCompany):
 *    por dirección sola, un envío "tachaba" sus 12.000 ofertas;
 *  - y como mucho TOPE_DIARIO_AGENCIA CV al día de una persona a la misma
 *    agencia, para que su buzón no nos tome por envío masivo.
 * OJO: las condiciones de Adzuna prohíben contactar a quien le pasa ofertas
 * ("third party content provider"); Michel lo sabe y lo decidió así.
 */
const AGENCIAS_POR_PUESTO = ["domestiko.com"];
export const TOPE_DIARIO_AGENCIA = 3;

/** ¿Este correo es de una agencia que recibe CV de muchos puestos (freno por puesto)? */
export function esAgenciaPorPuesto(email: string | null | undefined): boolean {
  const dominio = (email ?? "").trim().toLowerCase().split("@")[1] ?? "";
  return !!dominio && AGENCIAS_POR_PUESTO.some((d) => dominio === d || dominio.endsWith("." + d));
}

/** Texto para decirlo en pantalla. */
export const AVISO_PORTAL = "Esta oferta la publica un portal de empleo, no la empresa que contrata. No mandamos tu CV al portal: inscríbete desde la propia oferta.";
