/**
 * lib/osm-places.ts — Búsqueda de negocios con OpenStreetMap (Nominatim).
 *
 * Alternativa GRATUITA a Google Places: sin API key, sin tarjeta y sin
 * facturación. Se añadió tras el susto de 100 € en Google Cloud y porque la
 * Places API legacy que usamos está congelada por Google.
 *
 * Qué da y qué NO da:
 *   ✅ nombre, dirección, coordenadas, y a veces web / teléfono / horario
 *   ❌ valoraciones, reseñas y fotos (OSM no las tiene)
 *   ❌ email — igual que Google Places; el email lo saca después
 *      lib/company-extractor.ts scrapeando la web del negocio.
 *
 * Devuelve la MISMA forma que `GooglePlaceResult` para que el resto de la app
 * (construirEmpresaDesdeGoogle, caché, enriquecimiento de emails) funcione sin
 * cambios y se pueda alternar de proveedor.
 *
 * ⚠️ Política de uso de Nominatim: máx. 1 petición/segundo y User-Agent
 * identificable. Por eso las consultas se serializan con una cola.
 */
import type { GooglePlaceResult } from "@/lib/google-places";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const UA = "BuscayCurra/1.0 (https://buscaycurra.es)";

/** Nominatim exige 1 req/s: cola global para no saltarse el límite. */
let ultimaPeticion = 0;
async function esperarTurno(): Promise<void> {
  const ahora = Date.now();
  const espera = Math.max(0, 1100 - (ahora - ultimaPeticion));
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultimaPeticion = Date.now();
}

interface NominatimResult {
  place_id?: number;
  osm_type?: string;
  osm_id?: number;
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string> | null;
  type?: string;
  class?: string;
}

/** "Calle Mayor 5, Tudela, Navarra" a partir de los campos de la dirección. */
function formatearDireccion(r: NominatimResult): string {
  const a = r.address || {};
  const via = [a.road, a.house_number].filter(Boolean).join(" ");
  const partes = [via, a.postcode, a.city || a.town || a.village || a.municipality, a.state]
    .filter(Boolean);
  return partes.length ? partes.join(", ") : (r.display_name || "");
}

/** El nombre propio del negocio; si no viene, la primera parte del display_name. */
function nombreDe(r: NominatimResult): string {
  const t = r.extratags || {};
  return (r.name || t.name || (r.display_name || "").split(",")[0] || "").trim();
}

/** Mapea los `class/type` de OSM a un sector legible, como inferirSector(). */
function sectorDe(r: NominatimResult): string | null {
  const clave = `${r.class}:${r.type}`;
  const MAPA: Record<string, string> = {
    "shop:supermarket": "Alimentación / Retail",
    "shop:convenience": "Alimentación / Retail",
    "shop:bakery": "Alimentación / Retail",
    "shop:butcher": "Alimentación / Retail",
    "shop:clothes": "Moda / Textil",
    "shop:hairdresser": "Servicios",
    "shop:car_repair": "Automoción",
    "shop:electronics": "Tecnología",
    "shop:hardware": "Industria / Manufactura",
    "amenity:restaurant": "Hostelería / Turismo",
    "amenity:cafe": "Hostelería / Turismo",
    "amenity:bar": "Hostelería / Turismo",
    "amenity:pub": "Hostelería / Turismo",
    "amenity:fast_food": "Hostelería / Turismo",
    "tourism:hotel": "Hostelería / Turismo",
    "amenity:pharmacy": "Salud / Farmacia",
    "amenity:hospital": "Salud / Farmacia",
    "amenity:clinic": "Salud / Farmacia",
    "amenity:doctors": "Salud / Farmacia",
    "amenity:school": "Educación",
    "amenity:kindergarten": "Educación",
    "amenity:bank": "Banca / Seguros",
    "leisure:fitness_centre": "Servicios",
    "office:company": "Servicios",
  };
  return MAPA[clave] || null;
}

function aResultado(r: NominatimResult): GooglePlaceResult {
  const t = r.extratags || {};
  const web = t.website || t["contact:website"] || t.url || undefined;
  const tel = t.phone || t["contact:phone"] || t["contact:mobile"] || undefined;
  const horario = t.opening_hours;

  return {
    // Identificador estable, con prefijo para no chocar con los place_id de Google.
    place_id: `osm:${r.osm_type || "n"}${r.osm_id ?? r.place_id ?? ""}`,
    name: nombreDe(r),
    formatted_address: formatearDireccion(r),
    formatted_phone_number: tel,
    international_phone_number: tel,
    website: web,
    // OSM no tiene valoraciones ni reseñas: se dejan sin valor a propósito
    // en vez de inventarlas.
    rating: undefined,
    user_ratings_total: undefined,
    types: [`${r.class}`, `${r.type}`].filter(Boolean) as string[],
    opening_hours: horario ? { open_now: false, weekday_text: [horario] } : undefined,
    photos: undefined,
    url: r.lat && r.lon
      ? `https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lon}#map=19/${r.lat}/${r.lon}`
      : undefined,
  };
}

async function consultar(q: string, limit: number): Promise<NominatimResult[]> {
  await esperarTurno();
  const url = new URL(NOMINATIM);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("extratags", "1");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as NominatimResult[];
  return Array.isArray(data) ? data : [];
}

/**
 * Busca un negocio por nombre, con calle y/o ciudad opcionales.
 * Equivalente a buscarEmpresaGooglePlaces().
 */
export async function buscarEmpresaOSM(
  query: string,
  city?: string,
  address?: string
): Promise<GooglePlaceResult[]> {
  // 1º con la calle (desambigua locales de la misma cadena), y si no hay nada,
  // se reintenta sin ella: mejor el dato de la cadena que ninguno.
  const intentos = [
    [query, address, city].filter(Boolean).join(" "),
    address ? [query, city].filter(Boolean).join(" ") : "",
  ].filter(Boolean);

  for (const q of intentos) {
    try {
      const rs = await consultar(q, 5);
      const validos = rs.filter((r) => nombreDe(r).length > 1);
      if (validos.length) return validos.map(aResultado);
    } catch (err) {
      console.warn("[OSM] Error:", (err as Error).message);
    }
  }
  return [];
}

/**
 * Muchos negocios de un tipo en una zona ("bares en Tudela").
 * Equivalente a buscarEmpresasTextSearch().
 */
export async function buscarNegociosZonaOSM(
  tipo: string,
  ciudad: string,
  limite = 20
): Promise<GooglePlaceResult[]> {
  try {
    const rs = await consultar(`${tipo} ${ciudad}`, Math.min(limite, 40));
    return rs.filter((r) => nombreDe(r).length > 1).map(aResultado);
  } catch (err) {
    console.warn("[OSM] Error zona:", (err as Error).message);
    return [];
  }
}

export { sectorDe as inferirSectorOSM };
