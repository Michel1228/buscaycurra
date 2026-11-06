/**
 * lib/job-search/senales-estafa.ts — Señales a vigilar en una oferta.
 *
 * POR QUÉ. Juntamos ofertas de terceros (Adzuna, Careerjet, EURES...) de 40
 * países, y con ellas entra lo que cuelan los estafadores. El 5 nov 2026, 203
 * de 792 títulos de Argentina en Careerjet eran altas en paneles de encuestas
 * pagadas (NO_SON_OFERTAS, sync-worker.ts). En julio de 2026 INCIBE y la
 * Guardia Civil avisaron de falsas ofertas por WhatsApp que pedían un pago por
 * un «examen médico», la foto del DNI y el código de WhatsApp. La FTC de
 * EE. UU. lo resume en una regla: nunca pagues para cobrar.
 *
 * QUÉ HACE. Busca en el texto de la oferta frases concretas de esas estafas y
 * devuelve qué señal es. No dice «esto es una estafa» ni nombra a nadie:
 * avisa para que la persona mire con cuidado. No descarta ofertas.
 *
 * LO MÁS IMPORTANTE ES NO EQUIVOCARSE CON UNA OFERTA BUENA. Por eso no cuenta
 * «envía tu CV por WhatsApp» (en Latinoamérica es lo normal en un negocio
 * pequeño), ni «copia de la cédula» (muchas ofertas legales la piden para el
 * contrato), ni «la empresa paga la formación» (la paga la empresa, no tú).
 * Solo cuenta cuando te piden el dinero o los datos A TI. El sello lo prueba
 * con ofertas buenas y malas de verdad.
 */

export type CodigoSenal = "pago" | "datos" | "dinero_facil";

export interface SenalEstafa {
  codigo: CodigoSenal;
  /** Una frase para la persona, sin acusar a nadie. */
  texto: string;
}

const TEXTOS: Record<CodigoSenal, string> = {
  pago: "Te pide pagar algo para empezar (un curso, material, la inscripción o un examen). Una empresa seria no cobra por darte trabajo.",
  datos: "Te pide datos del banco, de tu tarjeta o un código que te llegue al móvil. Eso no se da para una entrevista.",
  dinero_facil: "Promete mucho dinero fácil desde casa, o pagar por dar «me gusta» o hacer «tareas». Es el gancho más usado en las estafas.",
};

/** Te piden pagar a TI: "debes abonar", "tendrás que pagar", "you must pay"... */
const PAGO: RegExp[] = [
  /\b(debes|deber[aá]s|tienes que|tendr[aá]s que|hay que|es necesario|es obligatorio|se requiere|requiere|previo)\s+(pagar|abonar|ingresar|depositar|transferir|el pago|un pago|pago)\b/i,
  /\b(pago|cuota|coste|costo|importe|tasa)\s+de\s+(inscripci[oó]n|matr[ií]cula|alta|registro|reserva de (la )?plaza)\b/i,
  /\b(requiere|necesitas|con)\s+una\s+(peque[ñn]a\s+)?inversi[oó]n(\s+inicial)?\b/i,
  /\byou\s+(must|need to|will need to|have to|are required to)\s+pay\b/i,
  /\b(registration|training|starter[- ]?kit|processing|application|onboarding)\s+fee\b/i,
  /\bpay\s+(a|an|the)\s+(small\s+|one[- ]time\s+)?(fee|deposit)\b/i,
  /\b(taxa|valor)\s+de\s+(inscri[cç][aã]o|cadastro|matr[ií]cula)\b/i,
];

/** Te piden datos que solo sirven para vaciarte la cuenta o robarte el WhatsApp. */
const DATOS: RegExp[] = [
  /\b(env[ií]a(nos)?|manda(nos)?|facilita(nos)?|proporciona(nos)?|ind[ií]ca(nos)?|necesitamos|solicitamos|pedimos|d[eé]janos)\b[^.\n]{0,40}\b(datos bancarios|n[uú]mero de (cuenta|tarjeta)|datos de (tu|la) tarjeta|pin de (tu |la )?tarjeta|c[oó]digo (de verificaci[oó]n|que te (llegue|lleg[oó])|de whatsapp|sms))\b/i,
  /\b(send|provide|share|give)\b[^.\n]{0,40}\b(bank (account )?details|credit card|card number|social security number|ssn|verification code)\b/i,
];

/** El gancho: dinero por día o por semana + desde casa / sin experiencia, o "likes" y "tareas". */
const PROMESA_DINERO = /\b(gana|ganar|ganas|cobra|cobrar|cobras|earn|make|ganhe|ganhar)\b[^.\n]{0,25}(\d[\d.,]*\s?(€|euros?|\$|usd|d[oó]lares|pesos|reais|r\$)|(€|\$|r\$)\s?\d)[^.\n]{0,30}\b(al d[ií]a|diarios?|por d[ií]a|a la semana|semanales|per day|a day|daily|per week|por dia)\b/i;
const DESDE_CASA = /\b(desde (tu |la )?casa|sin experiencia|f[aá]cil(mente)?|solo con (tu|el) (m[oó]vil|celular)|from home|no experience|easy money|de casa)\b/i;
const LIKES_TAREAS = [
  /\b(dar|darle|poner|dando)\s+(un\s+)?(likes?|me gusta)\b/i,
  /\b(likes?|valorar|calificar|puntuar)\s+(v[ií]deos|productos|publicaciones|rese[ñn]as)\b/i,
  /\blik(e|ing)\s+(videos|posts|products)\b/i,
  /\b(tareas|tasks|trabalhos)\s+(online\s+)?(pagadas|remuneradas|paid|pagos)\b/i,
];

/**
 * "No hay que pagar nada", "no registration fee", "sin coste de inscripción":
 * eso es justo lo contrario. Si delante de lo encontrado hay una negación
 * cercana, no cuenta.
 */
function encuentra(texto: string, re: RegExp): boolean {
  const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  for (const m of texto.matchAll(global)) {
    const antes = texto.slice(Math.max(0, (m.index ?? 0) - 25), m.index ?? 0);
    if (!/\b(no|sin|nunca|jam[aá]s|without|never|free of|zero|nenhuma?|sem)\b[^.\n]*$/i.test(antes)) return true;
  }
  return false;
}

export function senalesDeEstafa(oferta: { titulo?: string | null; descripcion?: string | null; empresa?: string | null }): SenalEstafa[] {
  const texto = `${oferta.titulo || ""}\n${oferta.empresa || ""}\n${oferta.descripcion || ""}`;
  const codigos: CodigoSenal[] = [];
  if (PAGO.some(re => encuentra(texto, re))) codigos.push("pago");
  if (DATOS.some(re => encuentra(texto, re))) codigos.push("datos");
  if ((PROMESA_DINERO.test(texto) && DESDE_CASA.test(texto)) || LIKES_TAREAS.some(re => re.test(texto))) codigos.push("dinero_facil");
  return codigos.map(codigo => ({ codigo, texto: TEXTOS[codigo] }));
}
