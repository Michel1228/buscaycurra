/**
 * lib/alertas/baja.ts
 * Enlace para dejar de recibir las alertas de ofertas con un clic.
 *
 * POR QUÉ. Las alertas mandan un correo al día, se crean solas al registrarse
 * con ciudad, y no había forma de quitarlas: ni pantalla ni enlace en el
 * correo (30 sep 2026). Quien no las quiere solo podía marcarlas como spam, y
 * eso perjudica la entrega de todos nuestros correos.
 *
 * El enlace lleva el id de la persona y una firma hecha con un secreto del
 * servidor: sin la firma nadie puede dar de baja a otro cambiando el id.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function secreto(): string | null {
  return process.env.ALERTS_SECRET || process.env.ADMIN_SECRET || null;
}

export function firmaBaja(userId: string): string | null {
  const s = secreto();
  if (!s) return null;
  return createHmac("sha256", s).update(`baja-alertas:${userId}`).digest("base64url").slice(0, 32);
}

export function firmaBajaValida(userId: string, firma: string): boolean {
  const esperada = firmaBaja(userId);
  if (!esperada || !firma) return false;
  const a = Buffer.from(esperada);
  const b = Buffer.from(firma);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** URL de baja para meter en el correo, o null si el servidor no tiene secreto. */
export function enlaceBaja(userId: string): string | null {
  const firma = firmaBaja(userId);
  if (!firma) return null;
  return `https://buscaycurra.es/api/alertas/baja?u=${encodeURIComponent(userId)}&t=${firma}`;
}
