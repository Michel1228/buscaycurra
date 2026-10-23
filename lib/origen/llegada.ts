/**
 * lib/origen/llegada.ts — Por qué canal llega cada persona que se registra.
 *
 * POR QUÉ (23 oct 2026, Michel): saber de dónde viene la gente. De 248
 * cuentas, solo 58 decían algo (que se registraron desde una oferta) y de 190
 * no se sabía nada: ni si fue Instagram, ni Google, ni una charla.
 *
 * SIN COOKIES NI NADA GUARDADO EN EL NAVEGADOR. Se lee al cargar la primera
 * página (de qué web viene y la campaña del enlace, utm_source) y se queda en
 * memoria mientras la persona se mueve por la web, que cambia de página sin
 * recargar. Solo se guarda si se registra, junto al resto de su cuenta, y lo
 * cuenta la política de privacidad. Si recarga o vuelve otro día se pierde:
 * para eso está también la pregunta «¿Cómo nos has conocido?» del registro.
 */

export type Llegada = { llegoDe: string; campana?: string };

let primera: { referrer: string; utmSource: string; utmCampaign: string } | null = null;

/** Se llama al cargar la web (components/ApuntarLlegada.tsx). Solo cuenta la primera página. */
export function apuntarLlegada(): void {
  if (primera || typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  primera = {
    referrer: document.referrer || "",
    utmSource: p.get("utm_source") || "",
    utmCampaign: p.get("utm_campaign") || "",
  };
}

// El orden importa: play.google.com antes que cualquier google.
const CONOCIDAS: Array<[RegExp, string]> = [
  [/^play\.google\.com$/, "google play"],
  [/^apps\.apple\.com$/, "app store"],
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)(instagram\.com|ig\.me)$/, "instagram"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "facebook"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "x"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
  [/(^|\.)(chatgpt\.com|openai\.com)$/, "chatgpt"],
];

/**
 * "instagram", "google", "directo"… Manda la campaña del enlace (utm_source) y,
 * si no hay, la web de la que viene. Sin web de origen (enlace escrito a mano,
 * desde un correo o desde la app) es "directo".
 */
export function clasificarLlegada(referrer: string, utmSource: string, utmCampaign: string): Llegada {
  const campana = utmCampaign.trim().toLowerCase().slice(0, 60) || undefined;
  if (utmSource.trim()) return { llegoDe: utmSource.trim().toLowerCase().slice(0, 40), campana };
  let host = "";
  try { host = new URL(referrer).hostname.toLowerCase(); } catch { /* sin web de origen */ }
  if (!host || /(^|\.)buscaycurra\.es$/.test(host)) return { llegoDe: "directo", campana };
  for (const [re, nombre] of CONOCIDAS) if (re.test(host)) return { llegoDe: nombre, campana };
  return { llegoDe: host.replace(/^www\./, "").slice(0, 40), campana };
}

/** Lo de esta visita, para guardarlo en la cuenta al registrarse. */
export function llegadaDeEstaVisita(): Llegada {
  apuntarLlegada();
  const l = primera || { referrer: "", utmSource: "", utmCampaign: "" };
  return clasificarLlegada(l.referrer, l.utmSource, l.utmCampaign);
}

/** Respuestas de «¿Cómo nos has conocido?» (el valor que se guarda y lo que se lee). */
export const COMO_NOS_CONOCIO: Array<[string, string]> = [
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["google", "Buscando en Google"],
  ["tienda", "App Store o Google Play"],
  ["amigo", "Me lo dijo alguien"],
  ["charla", "En una charla o un curso"],
  ["otro", "Otro"],
];
