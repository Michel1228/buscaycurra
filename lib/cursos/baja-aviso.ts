/**
 * lib/cursos/baja-aviso.ts — Apagar el aviso de un curso con un clic desde el correo.
 *
 * Mismo esquema que lib/alertas/baja.ts: el enlace lleva el id del aviso y una
 * firma hecha con un secreto del servidor, para que nadie pueda apagar el
 * aviso de otro cambiando el número. Sin enlace de baja, quien no quiere el
 * correo lo marca como spam, y eso hunde la entrega de todos nuestros envíos.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function secreto(): string | null {
  return process.env.ALERTS_SECRET || process.env.ADMIN_SECRET || null;
}

export function firmaBajaAviso(avisoId: string): string | null {
  const s = secreto();
  if (!s) return null;
  return createHmac("sha256", s).update(`baja-curso:${avisoId}`).digest("base64url").slice(0, 32);
}

export function firmaBajaAvisoValida(avisoId: string, firma: string): boolean {
  const esperada = firmaBajaAviso(avisoId);
  if (!esperada || !firma) return false;
  const a = Buffer.from(esperada);
  const b = Buffer.from(firma);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function enlaceBajaAviso(avisoId: string): string | null {
  const firma = firmaBajaAviso(avisoId);
  if (!firma) return null;
  return `https://buscaycurra.es/api/cursos/aviso/baja?a=${encodeURIComponent(avisoId)}&t=${firma}`;
}
