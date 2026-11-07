/**
 * lib/auth/correo-verificado.ts — QUÉ ES TENER EL CORREO VERIFICADO. Solo aquí.
 *
 * POR QUÉ (7 nov 2026). 93 de 451 cuentas no confirmaban el correo y se
 * quedaban fuera. Michel: "Vamos a dejarles entrar y que luego confirmen el
 * correo, pero cuando quieran hacer algo les pediremos la confirmación. Que no
 * haya ningún escape." Para dejarles entrar se apaga "Confirm email" en
 * Supabase, y entonces Supabase da la cuenta por confirmada AL CREARLA
 * (GoTrue, internal/api/signup.go: con Mailer.Autoconfirm llama a
 * user.Confirm, que pone email_confirmed_at = now en la misma transacción).
 * Desde ese momento email_confirmed_at ya no dice que el correo sea de verdad.
 *
 * LA REGLA. Está verificado quien:
 *  1. Tiene nuestra marca, app_metadata.correo_verificado_en: la pone
 *     /api/auth/confirmar al abrir el enlace firmado que le mandamos (y el
 *     servidor, mientras "Confirm email" siga activado, ver confirmoConEnlace).
 *  2. O confirmó ANTES de CORTE_CONFIRMACION. Hasta entonces "Confirm email"
 *     estaba activado: email_confirmed_at solo lo ponía un enlace del correo
 *     (o nosotros, al crear cuentas de prueba como la de la revisión de Apple).
 *
 * POR QUÉ NO BASTA CON "CONFIRMÓ MÁS DE 30 s DESPUÉS DE CREARLA". Con el
 * auto-confirm activado, si alguien se registra con el correo de una cuenta
 * que existe y NO está confirmada, GoTrue confirma ESA cuenta y le da la
 * sesión, sin pedir la contraseña (signup.go: "do not update the user..." y
 * después user.Confirm + issueRefreshToken). Esa confirmación llega días
 * después del alta, así que con la regla de los 30 s contaría como un correo
 * verificado de verdad, y quien no es dueño del correo podría usarlo todo (y
 * colarse en el equipo de una empresa, lib/empresas/cuenta.ts). Por eso una
 * confirmación de Supabase posterior al cambio no vale por sí sola.
 *
 * Sin dependencias: lo usan el servidor, las tareas programadas y el navegador.
 */

/** Antes de este instante "Confirm email" estaba activado en Supabase (commit del 7 nov 2026). */
export const CORTE_CONFIRMACION = Date.parse("2026-11-07T19:00:00Z");

/** Con auto-confirm, email_confirmed_at y created_at se separan milisegundos: más de esto es un enlace pulsado. */
export const SEPARACION_CONFIRMACION_MS = 30_000;

export interface CuentaParaVerificar {
  created_at?: string | null;
  email_confirmed_at?: string | null;
  app_metadata?: Record<string, unknown> | null;
}

/** Desde cuándo está verificado el correo, o null si no lo está. */
export function correoVerificadoEn(u: CuentaParaVerificar | null | undefined): string | null {
  if (!u) return null;
  const marca = u.app_metadata?.correo_verificado_en;
  if (typeof marca === "string" && marca) return marca;
  const confirmado = u.email_confirmed_at ? Date.parse(u.email_confirmed_at) : NaN;
  if (Number.isFinite(confirmado) && confirmado < CORTE_CONFIRMACION) return u.email_confirmed_at!;
  return null;
}

export function correoVerificado(u: CuentaParaVerificar | null | undefined): boolean {
  return correoVerificadoEn(u) !== null;
}

/**
 * La regla de los 30 s: Supabase dice que confirmó pulsando un enlace, no al
 * crear la cuenta. Solo es prueba mientras "Confirm email" sigue ACTIVADO (el
 * servidor lo comprueba antes de poner la marca, lib/auth-server.ts); con el
 * auto-confirm puede ser la confirmación de un registro repetido (ver arriba).
 * También sirve para no decirle "no confirmaste tu correo" a quien sí lo hizo.
 */
export function confirmoConEnlace(u: CuentaParaVerificar | null | undefined): boolean {
  if (!u?.email_confirmed_at || !u.created_at) return false;
  const separacion = Date.parse(u.email_confirmed_at) - Date.parse(u.created_at);
  return Number.isFinite(separacion) && separacion > SEPARACION_CONFIRMACION_MS;
}

// ─── Cuántos correos de "Confirma tu correo" (/api/auth/verificar-correo) ───
// Como mucho uno por minuto y cinco al día por persona: no caer en spam.
export const MAX_ENVIOS_VERIFICACION_DIA = 5;

/** Los envíos de las últimas 24 horas (app_metadata.verificacion_enviada), del más antiguo al más reciente. */
export function enviosDelDia(marca: unknown, ahora: number): string[] {
  if (!Array.isArray(marca)) return [];
  return marca.filter((t): t is string => typeof t === "string" && ahora - Date.parse(t) < 86_400_000).sort();
}

/** null si se puede mandar ya; si no, por qué no. */
export function motivoParaNoMandar(envios: string[], ahora: number): "espera" | "tope_dia" | null {
  if (envios.length && ahora - Date.parse(envios[envios.length - 1]) < 60_000) return "espera";
  if (envios.length >= MAX_ENVIOS_VERIFICACION_DIA) return "tope_dia";
  return null;
}

/** Lo que devuelve una ACCIÓN a quien no ha verificado su correo (403). La ventana común lo reconoce por `error`. */
export const ERROR_CONFIRMA_CORREO = "confirma_correo";
export const MENSAJE_CONFIRMA_CORREO =
  "Para hacer esto necesitas confirmar tu correo. Te hemos mandado un enlace: ábrelo y vuelve.";
