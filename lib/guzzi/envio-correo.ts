/**
 * lib/guzzi/envio-correo.ts
 * "Manda mi CV a este correo": Guzzi prepara la candidatura y la envía.
 *
 * POR QUÉ (4 oct 2026). Michel le escribió "Mándame mi currículum y carta de
 * presentación a este correo de empresa rrhh@sofidel.com". Guzzi vio "carta de
 * presentación", le pidió empresa y puesto para redactar una carta, y con la
 * respuesta ("Sofidel, peón") le mandó a buscar la oferta y pulsar "Enviar CV".
 * El correo lo ignoró: no había ningún camino para enviar desde el chat.
 *
 * Cómo va: con el correo (y lo que se pueda sacar de empresa y puesto) Guzzi
 * enseña lo que va a enviar y pregunta. Solo con un sí a ESA propuesta, recién
 * hecha, se envía (por /api/cv-sender/send, con todas sus comprobaciones). Es
 * la misma regla que envio-local.ts: nada sale sin que la persona lo confirme.
 */

export const CABECERA_PROPUESTA = "📨 Esto es lo que voy a enviar:";
export const PREGUNTA_PROPUESTA = "¿Lo envío? Contesta «sí, envíalo».";

export type PropuestaCorreo = { email: string; empresa: string | null; puesto: string | null };

const RE_CORREO = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const DOMINIOS_PERSONALES = /^(gmail|googlemail|hotmail|outlook|live|msn|yahoo|ymail|icloud|me|mac|aol|gmx|protonmail|proton|yandex|mail|terra|telefonica|movistar|orange|vodafone|ono|wanadoo|libero|web|t-online|free|laposte)$/i;
const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function extraerCorreo(texto: string): string | null {
  return texto.match(RE_CORREO)?.[0].replace(/[.,;:]+$/, "").toLowerCase() || null;
}

/** "rrhh@sofidel.com" → "Sofidel"; "info@grupo-ole.es" → "Grupo Ole". null si es un correo personal. */
export function empresaDelCorreo(email: string): string | null {
  const partes = (email.split("@")[1] || "").toLowerCase().split(".");
  if (partes.length < 2) return null;
  // "empresa.com.es", "empresa.co.uk": la etiqueta buena es la anterior a esas.
  let i = partes.length - 2;
  if (i > 0 && /^(com|co|org|net|gob|gov|edu)$/.test(partes[i])) i--;
  const etiqueta = partes[i];
  if (!etiqueta || DOMINIOS_PERSONALES.test(etiqueta)) return null;
  return etiqueta.split(/[-_]/).filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");
}

/** "puesto peón", "para el puesto de mozo de almacén", "como carretillero". */
export function puestoDelTexto(texto: string): string | null {
  const m = texto.match(/\b(?:puesto(?:\s+de)?|para\s+(?:trabajar\s+de|el\s+puesto\s+de)|como|de\s+puesto)\s+([a-záéíóúüñ][a-záéíóúüñ /-]{2,40}?)(?=\s*(?:[.,;!?]|\by\b|\ben\b|\bpara\b|\bcon\b|$))/i);
  const p = m?.[1]?.trim();
  if (!p || /^(empresa|correo|email|el|la|un|una)$/i.test(p)) return null;
  return p[0].toUpperCase() + p.slice(1);
}

/** "empresa Sofidel", "Sofidel nombre de empresa", "se llama Sofidel". */
export function empresaDelTexto(texto: string): string | null {
  const m = texto.match(/\b(?:empresa|se\s+llama|compañ[ií]a)\s+(?:es\s+)?([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ&'.-]*(?:\s+[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ&'.-]*){0,3})/)
    || texto.match(/^\s*([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ&'.-]*(?:\s+[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ&'.-]*){0,3})\s+(?:es\s+)?(?:el\s+)?nombre\s+de\s+(?:la\s+)?empresa/i);
  return m?.[1]?.trim() || null;
}

/** ¿Pide enviar su CV a un correo? Hace falta el correo y hablar de enviar o del CV. */
export function pideEnviarACorreo(texto: string): boolean {
  if (!RE_CORREO.test(texto)) return false;
  const t = normalizar(texto);
  return /\b(envia|enviar|enviame|envialo|enviasela|manda|mandar|mandame|mandalo|mandaselo|mandarle|enviarle)\w*|\b(cv|curriculum|curriculo|candidatura|carta)\b/.test(t);
}

export function textoPropuesta(p: PropuestaCorreo): string {
  return `${CABECERA_PROPUESTA}\n\n`
    + `🏢 Empresa: **${p.empresa || "?"}**\n`
    + `📧 Correo: **${p.email}**\n`
    + `🎯 Puesto: **${p.puesto || "Candidatura espontánea"}**\n`
    + `📄 Tu CV: el de [Mi Currículum](/app/curriculum)\n`
    + `✉️ Carta de presentación: la escribo para ${p.empresa || "la empresa"} con lo que pone en tu CV, sin inventar nada\n\n`
    + (p.empresa
      ? `${PREGUNTA_PROPUESTA} Si quieres cambiar el puesto o el nombre, dímelo (por ejemplo «puesto: mozo de almacén»).`
      : `¿Cómo se llama la empresa? Dímelo y lo dejo listo para enviar.`);
}

export function leerPropuesta(texto: string): PropuestaCorreo | null {
  if (!texto.includes(CABECERA_PROPUESTA)) return null;
  const email = texto.match(/📧 Correo: \*\*([^*]+)\*\*/)?.[1]?.trim();
  if (!email) return null;
  const empresa = texto.match(/🏢 Empresa: \*\*([^*]+)\*\*/)?.[1]?.trim();
  const puesto = texto.match(/🎯 Puesto: \*\*([^*]+)\*\*/)?.[1]?.trim();
  return {
    email,
    empresa: empresa && empresa !== "?" ? empresa : null,
    puesto: puesto && puesto !== "Candidatura espontánea" ? puesto : null,
  };
}

/** La propuesta a la que contesta: el ÚLTIMO mensaje de Guzzi, sin otro mensaje suyo en medio. */
export function propuestaCorreoPendiente(history: Array<{ role: string; text: string }>): PropuestaCorreo | null {
  let delUsuario = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "user") {
      if (++delUsuario > 1) return null;
      continue;
    }
    return leerPropuesta(history[i].text || "");
  }
  return null;
}

const NEGATIVA = /\b(no|nada|espera|cancela\w*|luego|despues|manana|todavia|aun\s+no|dejalo)\b/;
const AFIRMA = /^(si+|vale|ok|okey|okay|dale|venga|adelante|perfecto|claro|correcto|eso\s+es|hazlo|envia\w*|manda\w*|confirmo)\b/;

export type RespuestaPropuesta =
  | { tipo: "confirmar" }
  | { tipo: "cancelar" }
  | { tipo: "cambiar"; propuesta: PropuestaCorreo };

/** Qué contesta a la propuesta: sí, no, o un cambio (puesto, empresa, otro correo). */
export function respuestaAPropuesta(texto: string, propuesta: PropuestaCorreo): RespuestaPropuesta | null {
  const t = normalizar(texto).trim();
  const correo = extraerCorreo(texto);
  const puesto = puestoDelTexto(texto);
  const empresa = empresaDelTexto(texto)
    // Falta el nombre y contesta solo con él: "Sofidel".
    || (!propuesta.empresa && texto.trim().split(/\s+/).length <= 4 && !AFIRMA.test(t) && !NEGATIVA.test(t) ? texto.trim().replace(/[.!]+$/, "") : null);
  if (correo || puesto || empresa) {
    return { tipo: "cambiar", propuesta: {
      email: correo || propuesta.email,
      empresa: empresa || propuesta.empresa,
      puesto: puesto || propuesta.puesto,
    } };
  }
  if (NEGATIVA.test(t)) return { tipo: "cancelar" };
  if (propuesta.empresa && AFIRMA.test(t) && !t.includes("?")) return { tipo: "confirmar" };
  return null;
}
