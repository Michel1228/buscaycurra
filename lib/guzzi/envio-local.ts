/**
 * lib/guzzi/envio-local.ts
 * Mandar el CV a un negocio de la zona desde el chat de Guzzi.
 *
 * Cuando una búsqueda no trae ofertas en la ciudad, Guzzi enseña negocios de
 * Google Places y pregunta si mandar el CV a alguno. Aquí viven JUNTAS la
 * lista que se enseña y la lectura de lo que contesta la persona, para que no
 * se desincronicen.
 *
 * POR QUÉ (auditoría del 3 oct 2026). Antes bastaba un "vale", "ok gracias",
 * "perfecto" o "sí, pero luego" y que en los últimos cuatro mensajes saliera
 * 📍, ⭐ o la palabra "bar" (también dentro de "Barcelona" o "sin embargo")
 * para que el CV saliera hacia el primer "Bar algo" del historial, sin mirar
 * cuál había elegido, buscando el correo en Tudela fuera cual fuera su ciudad.
 * Ahora solo vale un sí a la propuesta que Guzzi acaba de hacer, y si hay
 * varios negocios tiene que decir cuál.
 */

export const PREGUNTA_ENVIO_LOCAL = "¿Quieres que envíe tu CV a alguno de estos?";

export type NegocioLocal = { nombre: string; direccion?: string; telefono?: string; web?: string; rating?: number };
export type PropuestaLocal = {
  negocios: NegocioLocal[]; ciudad: string | null; puesto: string | null;
  /** Nombres de la lista a los que ya se mandó el CV o que no tienen correo fiable. */
  hechos?: string[];
  /** true si la lista es lo último que ha dicho Guzzi (entonces vale un "sí" a secas). */
  inmediata?: boolean;
};

const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** "https://www.bar.es/?utm=x" → "www.bar.es". Se enseña sin protocolo y se lee de vuelta. */
function webVisible(url: string): string {
  try {
    const u = new URL(url);
    return u.host + (u.pathname !== "/" ? u.pathname.replace(/\/$/, "") : "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

export function textoNegociosLocales(
  negocios: NegocioLocal[],
  ciudad: string,
  puesto: string,
  entrada = "Pero he buscado negocios"
): string {
  let s = `${entrada}${ciudad ? ` en **${ciudad}**` : ""}${puesto ? ` donde podrías encajar como **${puesto}**` : ""}:\n\n`;
  negocios.forEach((n, i) => {
    s += `🏢 ${i + 1}. **${n.nombre}**${n.rating ? ` ⭐ ${n.rating}/5` : ""}`
      + (n.direccion ? `\n   📍 ${n.direccion}` : "")
      + (n.telefono ? `\n   📞 ${n.telefono}` : "")
      + (n.web ? `\n   🌐 ${webVisible(n.web)}` : "")
      + "\n\n";
  });
  return s + `📧 ${PREGUNTA_ENVIO_LOCAL} Dime el número o el nombre.`;
}

/** Lee la lista de un mensaje de Guzzi. null si el mensaje no es la propuesta. */
export function leerNegociosLocales(texto: string): PropuestaLocal | null {
  if (!texto.includes(PREGUNTA_ENVIO_LOCAL)) return null;
  const ciudad = texto.match(/ en \*\*(.+?)\*\*(?: donde| que)/)?.[1] || null;
  const puesto = texto.match(/encajar como \*\*(.+?)\*\*/)?.[1] || null;
  const negocios = texto.split("🏢").slice(1).map((bloque) => {
    const web = bloque.match(/🌐\s*(\S+)/)?.[1];
    return {
      nombre: bloque.match(/\*\*(.+?)\*\*/)?.[1]?.trim() || "",
      direccion: bloque.match(/📍\s*(.+)/)?.[1]?.trim(),
      telefono: bloque.match(/📞\s*(.+)/)?.[1]?.trim(),
      web: web ? `http://${web}` : undefined,
    };
  }).filter((n) => n.nombre);
  return negocios.length ? { negocios, ciudad, puesto } : null;
}

/**
 * Mensajes de Guzzi que salen de mandar el CV a un negocio de la lista: no
 * cierran la lista (13 nov 2026). Michel eligió "1", Guzzi contestó que no
 * tenía correo de ese, y su "2" ya no se entendía porque la lista había dejado
 * de ser el último mensaje: lo contestó la IA diciendo que no podía enviar.
 */
const RESULTADO_ENVIO = /📤 \*\*Hecho\.\*\*|No he encontrado un correo fiable de \*\*|No he podido mandar tu CV a \*\*|^📬 /;
function nombresDeResultado(texto: string): string[] {
  return [...texto.matchAll(/(?:va de camino a|correo fiable de|📤|📭|⚠️) \*\*(.+?)\*\*/g)]
    .map((m) => m[1]).filter((n) => n !== "Hecho.");
}

/** ¿El mensaje de la persona elige negocios de la lista o pide mandarlos? */
function eligeOEnvia(t: string): boolean {
  return /^\s*(el\s+|la\s+)?[1-5](\s*(,|y|e)\s*(el\s+|la\s+)?[1-5])*\s*[.!]*$/.test(t)
    || VERBO_ENVIO.test(t) || TODOS.test(t) || RESTO.test(t)
    || /\b(primer[oa]?|segund[oa]|tercer[oa]?|cuart[oa]|quint[oa]|ultim[oa])\b/.test(t);
}

/**
 * La lista de negocios a la que está contestando la persona. Puede no ser el
 * último mensaje: entre medias puede haber elegido uno ("1") y Guzzi haberle
 * contestado que va de camino o que no tiene correo. Cualquier otra cosa
 * (otra búsqueda, otra pregunta) cierra la lista. El último mensaje de la
 * persona del historial es el de ahora (el chat lo manda incluido) y no cuenta.
 */
export function propuestaPendiente(history: Array<{ role: string; text: string }>): PropuestaLocal | null {
  const hechos: string[] = [];
  let inmediata = true;
  let actual = true;
  for (let i = history.length - 1, vistos = 0; i >= 0 && vistos < 12; i--, vistos++) {
    const texto = history[i].text || "";
    if (history[i].role === "user") {
      if (actual) { actual = false; continue; }
      if (!eligeOEnvia(normalizar(texto))) return null;
      continue;
    }
    actual = false;
    const lista = leerNegociosLocales(texto);
    if (lista) return { ...lista, hechos, inmediata };
    if (!RESULTADO_ENVIO.test(texto)) return null;
    hechos.push(...nombresDeResultado(texto));
    inmediata = false;
  }
  return null;
}

// Palabras que no sirven para saber de qué negocio habla: "el bar" no dice cuál.
const GENERICAS = new Set(["restaurante", "cafeteria", "hotel", "hostal", "taberna", "meson", "asador",
  "pizzeria", "grupo", "servicios", "empresa", "tienda", "casa", "cafe", "centro", "comercial"]);

/** Qué negocio ha elegido (posición desde 0), o null si no queda claro. */
export function negocioElegido(texto: string, negocios: NegocioLocal[]): number | null {
  const t = normalizar(texto);
  const porPosicion = [
    /\bprimer[oa]?\b|\b1\b/, /\bsegund[oa]\b|\b2\b/, /\btercer[oa]?\b|\b3\b/,
    /\bcuart[oa]\b|\b4\b/, /\bquint[oa]\b|\b5\b/,
  ].map((r, i) => (r.test(t) ? i : -1));
  if (/\bultim[oa]\b/.test(t)) porPosicion.push(negocios.length - 1);
  const porNombre = negocios.map((n, i) =>
    normalizar(n.nombre).split(/[^a-z0-9]+/)
      .filter((p) => p.length >= 4 && !GENERICAS.has(p))
      .some((p) => new RegExp(`\\b${p}\\b`).test(t)) ? i : -1);
  const candidatos = [...new Set([...porPosicion, ...porNombre])].filter((i) => i >= 0 && i < negocios.length);
  return candidatos.length === 1 ? candidatos[0] : null;
}

const NEGATIVA = /\bno\b|\bnada\b|\bluego\b|\bdespues\b|mas\s+tarde|\bmanana\b|\bespera\b|\btodavia\b|\bningun[oa]?\b|\bpensar/;
const AFIRMA = /^(si+|vale|ok|okey|okay|dale|venga|adelante|claro|perfecto|genial|por\s+supuesto|hazlo|elijo|me\s+quedo)\b/;
// "mándalo", "mandes", "envíalos", "envíes": mand/envi + a/e (13 nov 2026: "que
// lo mandes" no se reconocía).
const VERBO_ENVIO = /\b(envi[ae]|mand[ae])/;
const TODOS = /\b(a\s+)?tod[oa]s\b/;
// "a los otros", "los demás", "el resto", "los que faltan", "mándalos".
const RESTO = /\b(l[oa]s\s+)?(otr[oa]s|demas)\b|\bel\s+resto\b|\bfalta(n|ban)\b|\b(mandal|envial)[oa]s\b/;

/**
 * A qué negocios de la lista hay que mandar el CV (posiciones desde 0).
 * "1 y 3" → esos dos; "al Diamante" → ese; "a todos", "a los otros", "los que
 * faltan", "mándalos" → los que quedan (sin los ya enviados ni los que no
 * tenían correo). Vacío si no queda claro.
 */
export function negociosElegidos(texto: string, propuesta: PropuestaLocal): number[] {
  const t = normalizar(texto);
  const hechos = new Set((propuesta.hechos || []).map((n) => normalizar(n)));
  const quedan = propuesta.negocios.map((_, i) => i).filter((i) => !hechos.has(normalizar(propuesta.negocios[i].nombre)));
  // "a los 2 que faltan", "mándalos a los 3": ahí el número es cuántos, no cuál.
  if ((TODOS.test(t) || RESTO.test(t)) && /\b(a\s+)?l[oa]s\s+[1-5]\b/.test(t)) return quedan;
  const porNumero = [...t.matchAll(/\b([1-5])\b/g)].map((m) => Number(m[1]) - 1);
  const ordinales = [/\bprimer[oa]?\b/, /\bsegund[oa]\b/, /\btercer[oa]?\b/, /\bcuart[oa]\b/, /\bquint[oa]\b/]
    .map((r, i) => (r.test(t) ? i : -1));
  if (/\bultim[oa]\b/.test(t)) ordinales.push(propuesta.negocios.length - 1);
  const porNombre = propuesta.negocios.map((n, i) =>
    normalizar(n.nombre).split(/[^a-z0-9]+/)
      .filter((p) => p.length >= 4 && !GENERICAS.has(p))
      .some((p) => new RegExp(`\\b${p}\\b`).test(t)) ? i : -1);
  const explicitos = [...new Set([...porNumero, ...ordinales, ...porNombre])]
    .filter((i) => i >= 0 && i < propuesta.negocios.length);
  if (explicitos.length) return explicitos.sort((a, b) => a - b);
  if (TODOS.test(t) || RESTO.test(t)) return quedan;
  return [];
}

/** ¿Contesta que sí (o elige uno o varios) a la lista de negocios de Guzzi? */
export function aceptaEnvioLocal(texto: string, history: Array<{ role: string; text: string }>): boolean {
  const propuesta = propuestaPendiente(history);
  if (!propuesta) return false;
  let t = normalizar(texto).trim();
  // "No, que lo mandes a los otros dos": ese "no" corrige a Guzzi, no rechaza el envío.
  if (VERBO_ENVIO.test(t)) t = t.replace(/^no[\s,.!]+(que\s+)?/, "");
  if (NEGATIVA.test(t) || /\bbusca/.test(t)) return false;
  if (negociosElegidos(t, propuesta).length > 0) return true;
  // "ok gracias" o "vale, ¿y de cocinero?" cierran o cambian de tema: no son un sí.
  if ((/gracias/.test(t) || t.includes("?")) && !VERBO_ENVIO.test(t)) return false;
  // Si la lista ya no es lo último que dijo Guzzi, un "vale" suelto no manda
  // nada: hace falta pedirlo ("mándalo") o elegir.
  return VERBO_ENVIO.test(t) || (propuesta.inmediata === true && AFIRMA.test(t));
}
