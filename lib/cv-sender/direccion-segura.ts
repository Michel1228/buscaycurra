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
import { promises as dns } from "node:dns";
import { esCorreoDeServicioOficial } from "@/lib/job-search/fuente-oficial";
import { motivoPortalDeEmpleo } from "@/lib/job-search/portales-empleo";
import { esDireccionGenerica } from "@/lib/cv-sender/direccion-generica";
import { frenoDeRebotesActivo } from "@/lib/cv-sender/freno-rebotes";

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

/** ¿Consta que un CV ya llegó a esta dirección? Entonces existe, aunque sea genérica. */
async function direccionQueYaLlego(email: string): Promise<boolean> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await sb
    .from("cv_sends")
    .select("id")
    .ilike("company_email", email.trim().replace(/[%_\\]/g, (c) => "\\" + c))
    .in("status", ["entregado", "visto"])
    .limit(1);
  return !!data?.length;
}

/** Motivo para no enviar, o null si se puede enviar. */
// ── Dominios que no reciben correo ───────────────────────────────────────────
// 6 oct 2026: de los 12 rebotes de la semana, varios iban a dominios sin
// servidor de correo (un CV a un correo de apps.apple.com, alertas a
// @buscaycurra.es). Los rebotes cuentan para el 4 % a partir del cual Resend
// pausa TODOS los envíos de la cuenta (lib/centinela/limites-correo.ts).
// Solo se bloquea cuando el DNS lo dice con seguridad (el dominio no existe o
// no tiene registro MX); un fallo pasajero de DNS no bloquea nada.
const cacheMx = new Map<string, { sinCorreo: boolean; ts: number }>();

export async function dominioSinCorreo(email: string): Promise<boolean> {
  const dominio = (email.split("@")[1] || "").toLowerCase().trim();
  if (!dominio) return true;
  const guardado = cacheMx.get(dominio);
  if (guardado && Date.now() - guardado.ts < 12 * 3600 * 1000) return guardado.sinCorreo;
  let sinCorreo: boolean;
  try {
    const mx = await Promise.race([
      dns.resolveMx(dominio),
      new Promise<never>((_, rechazar) => setTimeout(() => rechazar(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), 4000)),
    ]);
    // Sin registros, o el "MX nulo" (RFC 7505) que declara que no recibe correo.
    sinCorreo = !mx.length || mx.every((r) => !r.exchange || r.exchange === ".");
  } catch (e) {
    const codigo = (e as { code?: string }).code;
    if (codigo !== "ENOTFOUND" && codigo !== "ENODATA") return false;
    sinCorreo = true;
  }
  cacheMx.set(dominio, { sinCorreo, ts: Date.now() });
  return sinCorreo;
}

export async function motivoParaNoEnviar(email: string): Promise<string | null> {
  if (esDireccionDeRelleno(email)) {
    return `«${email}» es una dirección de ejemplo, no la de la empresa. Busca su correo en su web o en la oferta.`;
  }
  // Correos deducidos del enlace de una oferta de Lanbide o SEF Murcia: no son
  // de la empresa, son de la administración (lib/job-search/fuente-oficial.ts).
  if (motivoPortalDeEmpleo(email)) return motivoPortalDeEmpleo(email);
  if (esCorreoDeServicioOficial(email)) {
    return `«${email}» es del servicio público de empleo, no de la empresa. Esta oferta se solicita inscribiéndote en su web oficial: pulsa "Inscribirme" en la oferta.`;
  }
  if (await dominioSinCorreo(email)) {
    return `El dominio de «${email}» no recibe correo, así que el CV rebotaría. Busca otro correo en la web de la empresa o en la oferta.`;
  }
  if (await direccionQueYaRebota(email)) {
    return `El correo «${email}» ya rebotó antes: esa dirección no recibe mensajes. Busca otro en la web de la empresa o en la oferta.`;
  }
  // Rebotes cerca del límite de Resend: se para lo que más rebota (lib/cv-sender/freno-rebotes.ts).
  if (esDireccionGenerica(email) && await frenoDeRebotesActivo() && !(await direccionQueYaLlego(email))) {
    return `No sabemos si «${email}» existe y ahora mismo no enviamos a correos sin confirmar, para que tu CV no se pierda. Busca el correo en la web de la empresa o en la oferta, o vuelve a intentarlo en unos días. No te ha gastado ningún envío.`;
  }
  return null;
}
