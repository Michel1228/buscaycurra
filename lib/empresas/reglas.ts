/**
 * lib/empresas/reglas.ts — Las reglas de las empresas que buscan candidatos, sin base de datos.
 *
 * POR QUÉ (21 nov 2026, decisiones de Michel). Pagar el Plan Empresa ya no da
 * acceso a los candidatos: eso es solo para empresas que hemos verificado
 * (lib/empresas/verificacion.ts). Aquí está todo lo que se puede comprobar sin
 * la base, para que el sello lo pruebe:
 *
 *   · El NIF: con su letra o dígito de control. No prueba que la empresa
 *     exista (eso lo mira Michel en los registros oficiales), pero para los
 *     errores al escribirlo y los inventados a voleo.
 *   · El alcance: una empresa ve a los candidatos de su sector; una ETT o una
 *     agencia de colocación, de todos (art. 5.1.c RGPD: solo los datos que hacen
 *     falta para lo que buscan).
 *   · La puntuación del candidato: SOLO por hechos que se pueden comprobar o
 *     contar (cartas confirmadas por quien las firmó, lo que tiene el CV, si está
 *     al día). Nada de IA juzgando a personas: la AEPD avisó en 2026
 *     (AI-00009-2026) contra puntuar CV con IA, y desde el 2 dic 2027 es «alto
 *     riesgo» en la ley europea de IA. Tampoco cuenta nada que haya dicho una
 *     empresa de un candidato (eso sería una lista negra compartida), ni la foto,
 *     la edad, el sexo o el origen.
 *   · Las preguntas de entrevista que son discriminación (art. 4.2.c y 17 del
 *     Estatuto de los Trabajadores, LO 3/2007): no se guardan.
 */
import { SECTORES_ENTREVISTA, sectorDePuestos, type SectorEntrevista } from "@/lib/entrevistas/preguntas";
import { puestosDelCv } from "@/lib/job-search/puestos-del-cv";

// ── Quién es la empresa ───────────────────────────────────────────────────
export type TipoEntidad = "empresa" | "ett" | "agencia";

export const TIPOS_ENTIDAD: { id: TipoEntidad; label: string; ayuda: string }[] = [
  { id: "empresa", label: "Empresa que contrata para sí", ayuda: "Ves a los candidatos de tu sector." },
  { id: "ett", label: "Empresa de trabajo temporal (ETT)", ayuda: "Con tu número de autorización. Ves todos los sectores." },
  { id: "agencia", label: "Agencia de colocación", ayuda: "Con tu número de agencia del Servicio Público de Empleo. Ves todos los sectores." },
];

export const esTipoEntidad = (v: unknown): v is TipoEntidad => v === "empresa" || v === "ett" || v === "agencia";

/** Los sectores que elige una empresa: los mismos que salen de los CV, y «otro» para lo demás. */
export type SectorEmpresa = Exclude<SectorEntrevista, "general"> | "otro";

export const SECTORES_EMPRESA: { id: SectorEmpresa; label: string }[] = [
  ...SECTORES_ENTREVISTA.filter((s) => s.id !== "general").map((s) => ({ id: s.id as SectorEmpresa, label: s.label })),
  { id: "otro", label: "Otro sector" },
];

export const esSectorEmpresa = (v: unknown): v is SectorEmpresa => SECTORES_EMPRESA.some((s) => s.id === v);

export const MAX_SECTORES = 3;

export function normalizarNif(nif: string): string {
  return String(nif || "").toUpperCase().replace(/[\s.\-/]/g, "");
}

const LETRAS_DNI = "TRWAGMYFPDXBNJZSQVHLCKE";

/**
 * ¿Es un NIF bien formado? Sociedades (A12345674), autónomos con DNI
 * (12345678Z) o NIE (X1234567L). Un bar de un autónomo contrata con su DNI.
 */
export function nifValido(nif: string): boolean {
  const n = normalizarNif(nif);
  if (/^\d{8}[A-Z]$/.test(n)) return LETRAS_DNI[Number(n.slice(0, 8)) % 23] === n[8];
  if (/^[XYZ]\d{7}[A-Z]$/.test(n)) return LETRAS_DNI[Number("XYZ".indexOf(n[0]) + n.slice(1, 8)) % 23] === n[8];
  const m = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/.exec(n);
  if (!m) return false;
  const d = m[2].split("").map(Number);
  let suma = 0;
  d.forEach((x, i) => {
    if (i % 2 === 1) suma += x;                       // posiciones pares (2.ª, 4.ª, 6.ª)
    else { const y = x * 2; suma += Math.floor(y / 10) + (y % 10); }
  });
  const digito = (10 - (suma % 10)) % 10;
  const letra = "JABCDEFGHI"[digito];
  // Las sociedades anónimas y limitadas llevan número; los organismos y extranjeras, letra; el resto, cualquiera.
  if ("ABEH".includes(m[1])) return m[3] === String(digito);
  if ("NPQRSW".includes(m[1])) return m[3] === letra;
  return m[3] === String(digito) || m[3] === letra;
}

/** De persona (autónomo) o de sociedad: a Michel le cambia dónde mirarlo. */
export const nifDeAutonomo = (nif: string) => /^(\d{8}|[XYZ]\d{7})[A-Z]$/.test(normalizarNif(nif));

/**
 * El número de autorización de una ETT (8 cifras desde la Orden TES/1324/2024;
 * las antiguas llevan provincia/número/año, como 31/0012/95) o el de una
 * agencia de colocación (10 cifras). Solo se mira la forma: el número lo
 * comprueba Michel en el listado oficial antes de aprobar.
 */
export function autorizacionValida(tipo: TipoEntidad, numero: string): boolean {
  const n = String(numero || "").replace(/\s/g, "");
  if (tipo === "empresa") return true;
  if (tipo === "ett") return /^\d{8}$/.test(n) || /^\d{1,2}\/\d{1,5}\/\d{2,4}$/.test(n);
  return /^\d{8,12}$/.test(n);
}

// ── A quién puede ver cada empresa ────────────────────────────────────────
/** Los sectores de un CV, según los puestos que tiene. Sin ninguno reconocible: «general». */
export function sectoresDelCv(cv: unknown): SectorEntrevista[] {
  const s = new Set<SectorEntrevista>();
  for (const p of puestosDelCv(cv)) {
    const sector = sectorDePuestos([p]);
    if (sector) s.add(sector);
  }
  return s.size ? [...s] : ["general"];
}

export interface Alcance { tipo: TipoEntidad; sectores: SectorEmpresa[] }

/** ¿Puede esta empresa ver a un candidato con estos sectores? «Otro sector» ve a los de «general». */
export function puedeVer(alcance: Alcance, sectoresCandidato: SectorEntrevista[]): boolean {
  if (alcance.tipo === "ett" || alcance.tipo === "agencia") return true;
  return sectoresCandidato.some((s) => (s === "general" ? alcance.sectores.includes("otro") : alcance.sectores.includes(s as SectorEmpresa)));
}

// ── La puntuación del candidato ───────────────────────────────────────────
export interface DatosPuntuacion {
  /** El CV (form_data de user_cvs). */
  cv: unknown;
  /** Cartas de recomendación confirmadas por quien las firmó (lib/referencias). */
  referencias: number;
  /** Cartas de presentación que ha escrito (tabla cv_cartas). */
  cartasPresentacion: number;
  /** Cuándo actualizó el CV por última vez. */
  actualizado: string | Date | null;
  ahora?: Date;
}

export interface PartePuntuacion { id: string; nombre: string; puntos: number; max: number; consejo: string | null }

export interface Puntuacion { total: number; nivel: "destacado" | "solido" | "por_completar"; partes: PartePuntuacion[] }

export const NIVELES: Record<Puntuacion["nivel"], string> = {
  destacado: "Perfil destacado",
  solido: "Perfil sólido",
  por_completar: "Perfil por completar",
};

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function aptitudesDe(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(texto).filter(Boolean);
  return texto(v).split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
}

/**
 * De 0 a 100, con lo que vale cada cosa y qué le falta. La carta de
 * recomendación confirmada es lo que más pesa: Michel (21 nov 2026) quiere que
 * acerque al candidato a las ofertas aunque no tenga carta de presentación, así
 * que una carta confirmada y otra (de recomendación o de presentación) llenan el
 * apartado entero.
 */
export function puntuacionCandidato(d: DatosPuntuacion): Puntuacion {
  const cv = (d.cv && typeof d.cv === "object" ? d.cv : {}) as Record<string, unknown>;
  const partes: PartePuntuacion[] = [];
  const parte = (id: string, nombre: string, puntos: number, max: number, consejo: string) =>
    partes.push({ id, nombre, puntos: Math.min(puntos, max), max, consejo: puntos >= max ? null : consejo });

  // Cartas (40): recomendación confirmada 30 + 10 la segunda; la de presentación, 10.
  const refs = Math.max(0, Math.floor(d.referencias || 0));
  const cartas = (refs >= 1 ? 30 : 0) + (refs >= 2 ? 10 : 0) + (d.cartasPresentacion > 0 ? 10 : 0);
  parte("cartas", "Cartas de recomendación", cartas, 40, refs === 0
    ? "Sube una carta de recomendación de un trabajo anterior: cuando quien la firmó la confirma, es lo que más valoran las empresas."
    : "Añade otra carta de recomendación, o escribe una carta de presentación al mandar tu CV.");

  // CV completo (45).
  const exp = lista(cv.experiencia).filter((e) => texto((e as Record<string, unknown>)?.puesto));
  const conFechas = exp.some((e) => texto((e as Record<string, unknown>)?.fechas));
  parte("experiencia", "Experiencia", exp.length ? (conFechas ? 15 : 8) : 0, 15, exp.length
    ? "Pon las fechas de cada trabajo (por ejemplo, «2022 - 2024»)."
    : "Añade tus trabajos anteriores, aunque sean cortos o sin contrato largo.");
  const formacion = lista(cv.formacion).some((f) => texto((f as Record<string, unknown>)?.titulo));
  parte("formacion", "Formación", formacion ? 8 : 0, 8, "Añade tus estudios o cursos (también los carnés y certificados).");
  const apt = aptitudesDe(cv.aptitudes).length;
  parte("aptitudes", "Aptitudes", apt >= 3 ? 8 : apt > 0 ? 4 : 0, 8, "Escribe al menos tres cosas que sabes hacer en el trabajo.");
  const idiomas = lista(cv.idiomas).some((i) => texto((i as Record<string, unknown>)?.nombre));
  parte("idiomas", "Idiomas", idiomas ? 7 : 0, 7, "Di qué idiomas hablas y a qué nivel (también el español).");
  const contacto = (texto(cv.email) ? 1 : 0) + (texto(cv.telefono) ? 1 : 0);
  parte("contacto", "Contacto", contacto === 2 ? 7 : contacto ? 3 : 0, 7, "Pon tu correo y tu teléfono: es lo que la empresa usa para llamarte.");

  // Al día (15).
  const ahora = d.ahora ?? new Date();
  const dias = d.actualizado ? (ahora.getTime() - new Date(d.actualizado).getTime()) / 86_400_000 : Infinity;
  parte("al_dia", "CV al día", dias <= 60 ? 15 : dias <= 180 ? 8 : 0, 15, "Repasa tu CV y guárdalo: las empresas ven antes a quien lo tiene al día.");

  const total = partes.reduce((s, p) => s + p.puntos, 0);
  return { total, nivel: total >= 75 ? "destacado" : total >= 50 ? "solido" : "por_completar", partes };
}

// ── Preguntas que no se pueden hacer ──────────────────────────────────────
const sinTildes = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const PROHIBIDAS: [string, RegExp][] = [
  ["la edad", /que edad tienes|cuantos anos tienes|\btu edad\b|fecha de nacimiento|en que ano naciste/],
  ["el embarazo o los hijos", /embaraz|tienes hijos|vas a tener hijos|piensas tener hijos|quieres tener hijos|planes de (ser madre|ser padre|tener familia|formar una familia)|hijos a tu cargo/],
  ["el estado civil", /estado civil|estas casad|eres casad|estas solter|eres solter|tienes pareja|estas divorciad/],
  ["el origen o la nacionalidad", /de donde eres|tu nacionalidad|que nacionalidad|tu origen|tu pais de origen|tu raza|tu etnia/],
  ["la religión", /religion|religios|eres practicante|tu fe\b/],
  ["la salud", /tienes alguna enfermedad|estas enferm|tu salud|estado de salud|discapacidad|bajas? medicas?|tomas (alguna )?medicacion/],
  ["la afiliación sindical", /sindicat|afiliad/],
  ["la ideología", /a quien votas|que votas|ideologia|partido politico/],
  ["la orientación sexual", /orientacion sexual/],
];

/** Si la pregunta trata de algo que no se puede preguntar en una entrevista, de qué; si no, null. */
export function preguntaDiscriminatoria(pregunta: string): string | null {
  const t = sinTildes(pregunta);
  for (const [tema, re] of PROHIBIDAS) if (re.test(t)) return tema;
  return null;
}
