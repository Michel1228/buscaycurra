/**
 * lib/cv-sender/direccion-segura.ts
 * ¿Merece la pena mandar un CV a esta dirección?
 *
 * POR QUÉ. Del 1 al 29 sep 2026 rebotaron 9 de 25 envíos de CV (36 %). Casi
 * todos a direcciones deducidas (empleo@, rrhh@, info@ + dominio) que no
 * existían, y uno a "ejemplo@domain.com", un texto de relleno sacado de alguna
 * web. Cada rebote es un CV que la persona cree que ha llegado, y además todos
 * nuestros correos (bienvenidas, alertas, recordatorios) salen por la misma
 * cuenta de Resend: si la tasa de rebote sigue alta, se resiente la entrega de
 * todo lo demás.
 *
 * Aquí se paran dos casos que se saben perdidos de antemano:
 *   · Direcciones de relleno o de ejemplo.
 *   · Direcciones que ya rebotaron en firme (o dos veces) con otro envío.
 */

import { createClient } from "@supabase/supabase-js";

// Dominios reservados para ejemplos o que aparecen como plantilla en webs.
const DOMINIOS_DE_RELLENO = new Set([
  "domain.com", "example.com", "example.org", "example.net", "example.es",
  "ejemplo.com", "ejemplo.es", "email.com", "correo.com", "tudominio.com",
  "tuempresa.com", "empresa.com", "yourdomain.com", "yourcompany.com",
  "company.com", "test.com", "dominio.com", "sentry.io", "wixpress.com",
]);

// Partes locales que solo aparecen en plantillas ("tu@email.com").
const NOMBRES_DE_RELLENO = /^(ejemplo|example|tuemail|tucorreo|your\.?email|youremail|nombre|usuario|user|test|email|correo|name)$/i;

export function esDireccionDeRelleno(email: string): boolean {
  const [local, dominio] = email.trim().toLowerCase().split("@");
  if (!local || !dominio) return true;
  return DOMINIOS_DE_RELLENO.has(dominio) || NOMBRES_DE_RELLENO.test(local);
}

/**
 * ¿Ya rebotó esta dirección con otro envío? Solo cuenta un rebote en firme
 * ("hard bounce"), una queja de spam o dos rebotes cualesquiera: un rebote
 * "general" suelto puede ser un buzón lleno y se deja volver a intentar.
 */
export async function direccionQueYaRebota(email: string): Promise<boolean> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await sb
    .from("cv_sends")
    .select("motivo_rebote")
    // ilike para no distinguir mayúsculas; % y _ se escapan para que sea exacto.
    .ilike("company_email", email.trim().replace(/[%_\\]/g, (c) => "\\" + c))
    .eq("status", "rebotado")
    .limit(5);
  // Si no se puede comprobar, no se bloquea: mejor un rebote que dejar a
  // alguien sin enviar por un fallo nuestro.
  if (error || !data) return false;
  if (data.length >= 2) return true;
  return data.some((r) => /hard bounce|spam/i.test(r.motivo_rebote || ""));
}

/** Motivo para no enviar, o null si se puede enviar. */
export async function motivoParaNoEnviar(email: string): Promise<string | null> {
  if (esDireccionDeRelleno(email)) {
    return `«${email}» es una dirección de ejemplo, no la de la empresa. Busca su correo en su web o en la oferta.`;
  }
  if (await direccionQueYaRebota(email)) {
    return `El correo «${email}» ya rebotó antes: esa dirección no recibe mensajes. Busca otro en la web de la empresa o en la oferta.`;
  }
  return null;
}
