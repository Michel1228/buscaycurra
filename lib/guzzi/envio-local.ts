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
export type PropuestaLocal = { negocios: NegocioLocal[]; ciudad: string | null; puesto: string | null };

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
 * La propuesta a la que está contestando la persona: el ÚLTIMO mensaje de
 * Guzzi, y solo si después no ha escrito nada más que el mensaje de ahora.
 */
export function propuestaPendiente(history: Array<{ role: string; text: string }>): PropuestaLocal | null {
  let delUsuario = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "user") {
      if (++delUsuario > 1) return null;
      continue;
    }
    return leerNegociosLocales(history[i].text || "");
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
const VERBO_ENVIO = /\b(envia|manda)/;

/** ¿Contesta que sí (o elige uno) a la propuesta que Guzzi acaba de hacer? */
export function aceptaEnvioLocal(texto: string, history: Array<{ role: string; text: string }>): boolean {
  const propuesta = propuestaPendiente(history);
  if (!propuesta) return false;
  const t = normalizar(texto).trim();
  if (NEGATIVA.test(t) || /\bbusca/.test(t)) return false;
  if (negocioElegido(t, propuesta.negocios) !== null) return true;
  // "ok gracias" o "vale, ¿y de cocinero?" cierran o cambian de tema: no son un sí.
  if ((/gracias/.test(t) || t.includes("?")) && !VERBO_ENVIO.test(t)) return false;
  return AFIRMA.test(t) || VERBO_ENVIO.test(t);
}
