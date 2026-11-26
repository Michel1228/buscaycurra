/**
 * lib/cv-sender/buzon-existe.ts — ¿Existe este buzón? Se pregunta antes de mandar el CV.
 *
 * POR QUÉ (26 nov 2026, decisión de Michel). Los CV rebotaban casi un 30 %
 * (las direcciones deducidas, rrhh@ o empleo@ de la web, más de la mitad), y
 * llevaban la cuenta de Resend al 3,2 %: al 4 % puede parar TODOS los correos,
 * también las confirmaciones de registro. El dominio ya se miraba
 * (dominioSinCorreo), pero estos buzones están en dominios que sí tienen correo.
 *
 * CÓMO. Se le pregunta al servidor de correo de la empresa por el destinatario
 * (RCPT TO) sin llegar a mandar nada. La conversación la tiene
 * scripts/vps/comprobador-buzon.py en el propio VPS, porque el proveedor corta
 * el puerto 25 por IPv4 y el contenedor no tiene IPv6 (medido el 26 nov 2026).
 * Aquí se resuelven los MX y se decide qué significa la respuesta.
 *
 * SOLO SE DICE «NO EXISTE» CUANDO EL SERVIDOR LO AFIRMA: un 5xx de destinatario
 * desconocido (5.1.1 y parecidos). Un rechazo por política o lista negra
 * (5.7.x), una espera (4xx), un corte, un servidor solo con IPv4 o cualquier
 * duda es «no se sabe», y con eso se manda: un fallo nuestro no deja a nadie
 * sin enviar. Los servidores que aceptan cualquier dirección dicen 250 y
 * también se manda.
 */
import { promises as dns } from "node:dns";
import { get as cacheGet, set as cacheSet } from "@/lib/cache/redis-client";

export type Buzon = "existe" | "no-existe" | "no-se-sabe";

/** Respuesta a RCPT TO que dice que el buzón no existe (no un rechazo por política). */
export function respuestaDeBuzonInexistente(respuesta: string): boolean {
  const r = respuesta.trim();
  if (!/^5\d\d/.test(r)) return false;
  // Rechazos que hablan de nosotros (IP, reputación, política, remitente), no del buzón.
  if (/5\.7\.\d|5\.1\.[78]\b|sender|blocked|block list|blacklist|blocklist|spamhaus|reputation|policy|not permitted|relay|rbl|banned|denied by|client host|helo|spf|dmarc/i.test(r)
    && !/access denied.*AS\(201806281\)/i.test(r)) return false;
  return /5\.1\.(0|1|6|10)\b|5\.2\.1\b|5\.4\.1\b.*(recipient|access denied)|user unknown|unknown user|no such (user|mailbox|recipient)|does ?n[o']t exist|not exist|recipient not found|recipientnotfound|invalid recipient|invalid mailbox|mailbox (unavailable|not found)|no mailbox|unrouteable address|address rejected|undeliverable address|is not a valid mailbox/i.test(r);
}

/** Lo que dice el servidor de correo de la empresa a RCPT TO, o null si no se pudo preguntar. */
async function preguntarAlComprobador(email: string, servidores: string[]): Promise<string | null> {
  const base = process.env.COMPROBADOR_BUZON_URL;
  if (!base || !process.env.ADMIN_SECRET) return null;
  try {
    const url = `${base}/rcpt?email=${encodeURIComponent(email)}&mx=${encodeURIComponent(servidores.slice(0, 2).join(","))}`;
    const r = await fetch(url, { headers: { "x-admin-secret": process.env.ADMIN_SECRET }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) return null;
    const j = await r.json() as { respuesta?: string | null };
    return typeof j.respuesta === "string" ? j.respuesta : null;
  } catch {
    return null;
  }
}

/** El resultado, sin caché. Exportado para poder medirlo contra envíos reales. */
export async function comprobarBuzonSinCache(email: string): Promise<Buzon> {
  const limpio = email.trim().toLowerCase();
  const dominio = limpio.split("@")[1];
  if (!dominio || /[\s<>,]/.test(limpio)) return "no-se-sabe";
  let servidores: string[];
  try {
    servidores = (await dns.resolveMx(dominio)).sort((a, b) => a.priority - b.priority).map((m) => m.exchange).filter((x) => x && x !== ".");
  } catch {
    return "no-se-sabe";
  }
  if (!servidores.length) return "no-se-sabe";
  const r = await preguntarAlComprobador(limpio, servidores);
  if (!r) return "no-se-sabe";
  if (/^25[01]/.test(r)) return "existe";
  return respuestaDeBuzonInexistente(r) ? "no-existe" : "no-se-sabe";
}

/** ¿Existe el buzón? Con lo ya preguntado guardado: 14 días lo seguro, 1 día lo dudoso. */
export async function comprobarBuzon(email: string): Promise<Buzon> {
  const clave = `buzon:${email.trim().toLowerCase()}`;
  const guardado = await cacheGet(clave);
  if (guardado === "existe" || guardado === "no-existe" || guardado === "no-se-sabe") return guardado;
  const r = await comprobarBuzonSinCache(email);
  await cacheSet(clave, r, r === "no-se-sabe" ? 86400 : 14 * 86400);
  return r;
}
