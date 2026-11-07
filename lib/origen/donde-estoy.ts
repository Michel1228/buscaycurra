/**
 * lib/origen/donde-estoy.ts — En qué país está la persona ahora mismo.
 *
 * EL HUECO. Sabíamos de dónde es cada uno (nacionalidad) y a dónde quiere ir
 * (la bandera del buscador), pero no DÓNDE ESTÁ. Y el buscador, sin nada
 * guardado, empezaba siempre en España: alguien de Monterrey que abría la
 * aplicación por primera vez veía ofertas de Madrid y tenía que descubrir solo
 * que la bandera de abajo se podía cambiar.
 *
 * No es lo mismo que la nacionalidad: una venezolana que vive en Madrid está en
 * España; un español en Guadalajara (Jalisco) está en México.
 *
 * DE DÓNDE SE SACA, SIN PREGUNTAR. La zona horaria del teléfono o del
 * ordenador (America/Mexico_City → México). No pide permisos, no usa el GPS y
 * no sale del dispositivo. Si la zona no nos dice nada, se mira la región del
 * idioma del navegador (es-MX). Si tampoco, no se adivina: null.
 *
 * Y se puede cambiar con un toque: lo que elige la persona manda siempre sobre
 * lo que detectamos. Se guarda en este dispositivo y en su cuenta.
 */

/** Zonas horarias que son de un solo país. Las de varios (UTC) no están. */
const ZONA_A_PAIS: Record<string, string> = {
  "Europe/Madrid": "ES", "Atlantic/Canary": "ES", "Africa/Ceuta": "ES",
  "Europe/Lisbon": "PT", "Atlantic/Madeira": "PT", "Atlantic/Azores": "PT",
  "Europe/London": "UK", "Europe/Dublin": "IE", "Europe/Paris": "FR",
  "Europe/Berlin": "DE", "Europe/Rome": "IT", "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE", "Europe/Vienna": "AT", "Europe/Zurich": "CH",
  "Europe/Stockholm": "SE", "Europe/Oslo": "NO", "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI", "Europe/Warsaw": "PL", "Europe/Athens": "GR",
  "Europe/Prague": "CZ", "Europe/Budapest": "HU", "Europe/Bucharest": "RO",
  "Asia/Tokyo": "JP", "Asia/Singapore": "SG", "Pacific/Auckland": "NZ",
  "America/Bogota": "CO", "America/Caracas": "VE", "America/Lima": "PE",
  "America/Santiago": "CL", "America/Guayaquil": "EC", "America/La_Paz": "BO",
  "America/Asuncion": "PY", "America/Montevideo": "UY", "America/Havana": "CU",
  "America/Santo_Domingo": "DO", "America/Guatemala": "GT", "America/El_Salvador": "SV",
  "America/Tegucigalpa": "HN", "America/Managua": "NI", "America/Costa_Rica": "CR",
  "America/Panama": "PA", "America/Puerto_Rico": "PR", "Africa/Casablanca": "MA",
  // Asia/Calcutta es el nombre antiguo de Asia/Kolkata (tzdb, "backward").
  "Asia/Kolkata": "IN", "Asia/Calcutta": "IN",
  // OJO: Africa/Johannesburg es también la hora de Lesoto y Esuatini (tzdb,
  // zone1970.tab: ZA,LS,SZ). Quien esté allí saldrá como Sudáfrica, y se
  // cambia con un toque.
  "Africa/Johannesburg": "ZA",
  // Asia/Famagusta se deja fuera a propósito: es la zona del norte de Chipre.
  "Europe/Malta": "MT", "Europe/Bratislava": "SK", "Europe/Ljubljana": "SI",
  "Asia/Nicosia": "CY", "Europe/Nicosia": "CY",
};

/** Zonas que empiezan igual y son todas del mismo país. */
const PREFIJO_A_PAIS: [string, string][] = [
  ["America/Argentina/", "AR"], ["Australia/", "AU"],
];

/** México y Brasil tienen muchas zonas; Estados Unidos y Canadá también. */
const ZONAS_DE: Record<string, string[]> = {
  MX: ["America/Mexico_City", "America/Monterrey", "America/Merida", "America/Cancun",
       "America/Chihuahua", "America/Ciudad_Juarez", "America/Hermosillo", "America/Tijuana",
       "America/Mazatlan", "America/Matamoros", "America/Bahia_Banderas", "America/Ojinaga"],
  BR: ["America/Sao_Paulo", "America/Fortaleza", "America/Recife", "America/Bahia",
       "America/Manaus", "America/Belem", "America/Cuiaba", "America/Campo_Grande",
       "America/Porto_Velho", "America/Boa_Vista", "America/Rio_Branco", "America/Maceio",
       "America/Araguaina", "America/Santarem", "America/Noronha", "America/Eirunepe"],
  US: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
       "America/Phoenix", "America/Anchorage", "America/Detroit", "Pacific/Honolulu",
       "America/Boise", "America/Indiana/Indianapolis", "America/Kentucky/Louisville"],
  CA: ["America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg",
       "America/Halifax", "America/St_Johns", "America/Regina", "America/Moncton"],
};

/** Zona horaria → país (ISO, salvo Reino Unido, que en la app es "UK"). */
export function paisDeZona(zona: string): string | null {
  if (!zona) return null;
  if (ZONA_A_PAIS[zona]) return ZONA_A_PAIS[zona];
  for (const [pais, zonas] of Object.entries(ZONAS_DE)) if (zonas.includes(zona)) return pais;
  for (const [prefijo, pais] of PREFIJO_A_PAIS) if (zona.startsWith(prefijo)) return pais;
  return null;
}

/** "es-MX" → "MX"; "pt-BR" → "BR"; "en-GB" → "UK". Sin región, null. */
export function paisDeIdioma(idioma: string): string | null {
  const m = /^[a-z]{2,3}[-_]([A-Za-z]{2})$/.exec((idioma || "").trim());
  if (!m) return null;
  const r = m[1].toUpperCase();
  return r === "GB" ? "UK" : r;
}

const CLAVE = "bc_donde_estoy";

/** Lo que eligió la persona en este dispositivo, si eligió algo. */
export function paisElegido(): string | null {
  try { return localStorage.getItem(CLAVE) || null; } catch { return null; }
}

/** Lo que se detecta sin preguntar. Solo en el navegador. */
export function paisDetectado(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const porZona = paisDeZona(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    if (porZona) return porZona;
  } catch { /* navegador sin Intl: se sigue */ }
  try { return paisDeIdioma(navigator.language || ""); } catch { return null; }
}

/** Dónde está: lo elegido manda; si no, lo detectado; si no, null. */
export function dondeEstoy(): string | null {
  return paisElegido() || paisDetectado();
}

/** Guarda la elección en el dispositivo y, si hay sesión, en la cuenta. */
export async function guardarDondeEstoy(pais: string): Promise<void> {
  const codigo = pais.trim().toUpperCase();
  try { localStorage.setItem(CLAVE, codigo); } catch { /* sin almacenamiento */ }
  try {
    const { getSupabaseBrowser } = await import("@/lib/supabase-browser");
    const sb = getSupabaseBrowser();
    const { data: { user } } = await sb.auth.getUser();
    if (user) await sb.auth.updateUser({ data: { pais_residencia: codigo } });
  } catch { /* sin conexión: queda en el dispositivo */ }
}
