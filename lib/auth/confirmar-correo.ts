/**
 * lib/auth/confirmar-correo.ts
 * El enlace del recordatorio a quien se registró y no confirmó el correo.
 *
 * POR QUÉ UN ENLACE NUESTRO (20 oct 2026). El enlace de Supabase caduca, y el
 * recordatorio puede abrirse días después. El correo lleva este, firmado, y el
 * de Supabase se pide al pulsarlo, recién hecho (/api/auth/confirmar).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function firma(userId: string): string | null {
  const s = process.env.ALERTS_SECRET || process.env.ADMIN_SECRET;
  if (!s) return null;
  return createHmac("sha256", s).update(`confirmar-correo:${userId}`).digest("base64url").slice(0, 32);
}

export function firmaConfirmarValida(userId: string, t: string): boolean {
  const esperada = firma(userId);
  if (!esperada || !t) return false;
  const a = Buffer.from(esperada);
  const b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function enlaceConfirmar(userId: string): string | null {
  const f = firma(userId);
  return f ? `https://buscaycurra.es/api/auth/confirmar?u=${encodeURIComponent(userId)}&t=${f}` : null;
}
