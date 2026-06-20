/**
 * lib/timezone.ts — Zonas horarias por país para BuscayCurra
 *
 * Cada país de la plataforma mapeado a su zona horaria IANA.
 * Fallback: "Europe/Madrid" (UTC+1/+2)
 */

export const PAIS_TIMEZONE: Record<string, string> = {
  ES: "Europe/Madrid",
  DE: "Europe/Berlin",
  FR: "Europe/Paris",
  IT: "Europe/Rome",
  PT: "Europe/Lisbon",
  GB: "Europe/London",
  IE: "Europe/Dublin",
  NL: "Europe/Amsterdam",
  BE: "Europe/Brussels",
  AT: "Europe/Vienna",
  CH: "Europe/Zurich",
  SE: "Europe/Stockholm",
  DK: "Europe/Copenhagen",
  NO: "Europe/Oslo",
  FI: "Europe/Helsinki",
  PL: "Europe/Warsaw",
  CZ: "Europe/Prague",
  AU: "Australia/Sydney",
  NZ: "Pacific/Auckland",
  US: "America/New_York",
  CA: "America/Toronto",
};

/**
 * Formatea una fecha ISO en la zona horaria del país del usuario.
 * @param isoString - Fecha en formato ISO 8601
 * @param pais - Código de país ISO (ES, DE, FR...). Default: "ES"
 * @param options - Opciones adicionales de Intl.DateTimeFormat
 */
export function formatLocalDate(
  isoString: string | undefined | null,
  pais: string = "ES",
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!isoString) return "";
  const tz = PAIS_TIMEZONE[pais] || "Europe/Madrid";
  const locale = mapPaisToLocale(pais);
  return new Date(isoString).toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
    ...options,
  });
}

/** Mapea código de país a locale BCP 47 */
function mapPaisToLocale(pais: string): string {
  const map: Record<string, string> = {
    ES: "es-ES", DE: "de-DE", FR: "fr-FR", IT: "it-IT", PT: "pt-PT",
    GB: "en-GB", IE: "en-IE", NL: "nl-NL", BE: "nl-BE", AT: "de-AT",
    CH: "de-CH", SE: "sv-SE", DK: "da-DK", NO: "nb-NO", FI: "fi-FI",
    PL: "pl-PL", CZ: "cs-CZ", AU: "en-AU", NZ: "en-NZ",
    US: "en-US", CA: "en-CA",
  };
  return map[pais] || "es-ES";
}
