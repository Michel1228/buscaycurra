/**
 * lib/google-places.ts
 * Búsqueda de empresas vía Google Places API
 * Datos REALES: teléfono, dirección, web, rating, horario
 *
 * Toda llamada de pago pasa antes por consumirCuotaPlaces(): ver
 * lib/places-quota.ts para el porqué del tope y por qué está aquí y no en la
 * consola de Google.
 */
import { consumirCuotaPlaces } from "./places-quota";

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  photos?: Array<{ photo_reference: string }>;
  url?: string; // Google Maps URL
}

/**
 * Busca una empresa en Google Places por nombre (+ ciudad opcional)
 * Devuelve hasta 5 resultados
 */
export async function buscarEmpresaGooglePlaces(
  query: string,
  city?: string,
  address?: string
): Promise<GooglePlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[GooglePlaces] GOOGLE_PLACES_API_KEY no configurada");
    return [];
  }

  // Tope diario propio: la consola de Google no deja fijar cuotas en cuentas de
  // prueba, y sin tope fue como llego una factura de 100 EUR sin suscriptores.
  // Si se agota, devolvemos vacio y quien llama cae a OpenStreetMap (gratis).
  if (!(await consumirCuotaPlaces())) return [];


  // La dirección va ANTES de la ciudad para desambiguar locales de la misma
  // cadena: sin ella, "Mercadona Tudela" devuelve cualquiera de los que haya
  // en la ciudad, no el de la calle que pidió el usuario.
  const searchQuery = [query, address, city].filter(Boolean).join(" ");

  try {
    // 1. Find Place from text → obtener place_id
    const findUrl = new URL(`${PLACES_API_BASE}/findplacefromtext/json`);
    findUrl.searchParams.set("input", searchQuery);
    findUrl.searchParams.set("inputtype", "textquery");
    findUrl.searchParams.set(
      "fields",
      "place_id,name,formatted_address,types"
    );
    findUrl.searchParams.set("key", apiKey);

    const findRes = await fetch(findUrl.toString(), {
      signal: AbortSignal.timeout(8000),
    });

    if (!findRes.ok) return [];
    const findData = await findRes.json() as {
      candidates?: Array<{ place_id: string; name: string }>;
      status: string;
    };

    if (findData.status !== "OK" || !findData.candidates?.length) {
      return [];
    }

    // 2. Detalles de cada place_id. Cada Details es una llamada de PAGO a Google.
    // Bajado de 5 a 2: el primer candidato es casi siempre el correcto y el 2º
    // cubre la duda; pedir 5 multiplicaba el coste por búsqueda sin apenas valor.
    const candidates = findData.candidates.slice(0, 2);
    const details = await Promise.all(
      candidates.map(async (c) => {
        try {
          const detailUrl = new URL(`${PLACES_API_BASE}/details/json`);
          detailUrl.searchParams.set("place_id", c.place_id);
          detailUrl.searchParams.set(
            "fields",
            "place_id,name,formatted_address,formatted_phone_number," +
            "international_phone_number,website,rating,user_ratings_total," +
            "types,opening_hours,photos,url"
          );
          detailUrl.searchParams.set("key", apiKey);

          const detailRes = await fetch(detailUrl.toString(), {
            signal: AbortSignal.timeout(8000),
          });

          if (!detailRes.ok) return null;
          const detailData = await detailRes.json() as {
            result?: GooglePlaceResult;
            status: string;
          };

          return detailData.status === "OK" ? detailData.result || null : null;
        } catch {
          return null;
        }
      })
    );

    return details.filter((d): d is GooglePlaceResult => d !== null);
  } catch (err) {
    console.warn("[GooglePlaces] Error:", (err as Error).message);
    return [];
  }
}

/**
 * Búsqueda por TEXTO (Text Search): devuelve hasta 20 sitios, frente a los ~1-5
 * de Find Place. Es la adecuada cuando quieres MUCHOS resultados de una zona
 * ("ETT en Madrid", "bares en Zaragoza"), no un sitio concreto.
 *
 * Text Search no trae web ni teléfono, así que se piden los detalles de los
 * primeros `maxDetalles` (cada Details es una llamada de pago: no subir sin motivo).
 */
export async function buscarEmpresasTextSearch(
  query: string,
  maxDetalles = 12
): Promise<GooglePlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[GooglePlaces] GOOGLE_PLACES_API_KEY no configurada");
    return [];
  }

  // Tope diario propio: la consola de Google no deja fijar cuotas en cuentas de
  // prueba, y sin tope fue como llego una factura de 100 EUR sin suscriptores.
  // Si se agota, devolvemos vacio y quien llama cae a OpenStreetMap (gratis).
  if (!(await consumirCuotaPlaces())) return [];


  try {
    const url = new URL(`${PLACES_API_BASE}/textsearch/json`);
    url.searchParams.set("query", query);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(9000) });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      results?: Array<{ place_id: string }>;
      status: string;
    };
    if (data.status !== "OK" || !data.results?.length) return [];

    const ids = data.results.slice(0, maxDetalles).map((r) => r.place_id);
    const detalles = await Promise.all(ids.map((id) => obtenerDetallesPlace(id, apiKey)));
    return detalles.filter((d): d is GooglePlaceResult => d !== null);
  } catch (err) {
    console.warn("[GooglePlaces] TextSearch error:", (err as Error).message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SITUAR LA ZONA ANTES DE BUSCAR
//
// El 22 sep 2026 se comprobo que buscar ETTs solo por el nombre del sitio falla
// de dos maneras: "Cabanillas" devolvia ETTs de Guadalajara (hay dos Cabanillas
// y nadie avisaba de cual se habia entendido), y "Berlin" devolvia tres de cinco
// resultados en Barcelona, porque la consulta iba en español y Google mezclaba
// paises. Situar la zona primero resuelve las dos: sabemos el pais (para buscar
// con las palabras de su idioma), tenemos coordenadas (para descartar por
// distancia real) y podemos decirle al usuario que sitio hemos entendido.
// ─────────────────────────────────────────────────────────────────────────────

export interface ZonaSituada {
  descripcion: string;   // "Cabanillas del Campo, Guadalajara, España"
  lat: number;
  lng: number;
  paisCodigo: string;    // ES, DE, UK...
}

/** Situa un texto libre ("Buñuel", "Cabanillas, Navarra") en el mapa. */
export async function situarZona(texto: string): Promise<ZonaSituada | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  if (!(await consumirCuotaPlaces())) return null;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", texto);
    url.searchParams.set("language", "es");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: string;
      results?: Array<{
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
        address_components: Array<{ short_name: string; types: string[] }>;
      }>;
    };
    const r = data.status === "OK" ? data.results?.[0] : null;
    if (!r) return null;

    const pais = r.address_components.find((c) => c.types.includes("country"))?.short_name || "";
    return {
      descripcion: r.formatted_address,
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      // Nuestra lista de paises llama UK al Reino Unido; Google lo llama GB.
      paisCodigo: pais === "GB" ? "UK" : pais,
    };
  } catch (err) {
    console.warn("[GooglePlaces] situarZona:", (err as Error).message);
    return null;
  }
}

/** Resultado de Text Search sin pedir detalles: lo justo para elegir a cuales. */
export interface SitioBasico {
  place_id: string;
  name: string;
  formatted_address?: string;
  types?: string[];
  lat?: number;
  lng?: number;
}

/**
 * Text Search SIN detalles. Existe para no pagar detalles de sitios que luego se
 * descartan: antes cada consulta pedia los detalles de sus diez primeros, y como
 * las tres consultas de ETTs se solapan mucho, la misma empresa se pagaba varias
 * veces. Ahora se juntan, se descartan los lejanos y solo entonces se piden.
 */
export async function buscarTextoSinDetalles(
  query: string,
  zona?: { lat: number; lng: number; radioMetros: number }
): Promise<SitioBasico[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];
  if (!(await consumirCuotaPlaces())) return [];

  try {
    const url = new URL(`${PLACES_API_BASE}/textsearch/json`);
    url.searchParams.set("query", query);
    if (zona) {
      url.searchParams.set("location", `${zona.lat},${zona.lng}`);
      url.searchParams.set("radius", String(zona.radioMetros));
    }
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(9000) });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      status: string;
      results?: Array<{
        place_id: string;
        name: string;
        formatted_address?: string;
        types?: string[];
        geometry?: { location?: { lat: number; lng: number } };
      }>;
    };
    if (data.status !== "OK" || !data.results?.length) return [];

    return data.results.map((r) => ({
      place_id: r.place_id,
      name: r.name,
      formatted_address: r.formatted_address,
      types: r.types,
      lat: r.geometry?.location?.lat,
      lng: r.geometry?.location?.lng,
    }));
  } catch (err) {
    console.warn("[GooglePlaces] buscarTextoSinDetalles:", (err as Error).message);
    return [];
  }
}

/** Detalles de varios sitios ya elegidos. Cada uno es una llamada de pago. */
export async function detallesDeSitios(placeIds: string[]): Promise<GooglePlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];
  const detalles = await Promise.all(placeIds.map((id) => obtenerDetallesPlace(id, apiKey)));
  return detalles.filter((d): d is GooglePlaceResult => d !== null);
}

/** Distancia en kilometros entre dos puntos (formula del semiverseno). */
export function distanciaKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)) * 10) / 10;
}

/** Detalles completos de un place_id. */
/**
 * CADA DETALLE CUENTA COMO UNA LLAMADA, porque Google cobra por cada una.
 *
 * Antes la cuota se consumía UNA VEZ por búsqueda, y luego esa misma búsqueda
 * pedía los detalles de hasta doce sitios en paralelo. Es decir, una unidad del
 * contador podían ser trece peticiones facturadas, y el tope de 500 al día
 * permitía en realidad varios miles. Ese desajuste es el que produjo la factura
 * de 100 € de julio que documenta lib/places-quota.ts.
 *
 * Si se acaba la cuota a mitad de una búsqueda, los detalles que falten vuelven
 * null y la empresa sale con menos datos. Es mejor eso que seguir gastando.
 */
async function obtenerDetallesPlace(
  placeId: string,
  apiKey: string
): Promise<GooglePlaceResult | null> {
  if (!(await consumirCuotaPlaces())) return null;
  try {
    const detailUrl = new URL(`${PLACES_API_BASE}/details/json`);
    detailUrl.searchParams.set("place_id", placeId);
    detailUrl.searchParams.set(
      "fields",
      "place_id,name,formatted_address,formatted_phone_number," +
        "international_phone_number,website,rating,user_ratings_total," +
        "types,opening_hours,photos,url"
    );
    detailUrl.searchParams.set("key", apiKey);

    const detailRes = await fetch(detailUrl.toString(), { signal: AbortSignal.timeout(8000) });
    if (!detailRes.ok) return null;

    const detailData = (await detailRes.json()) as {
      result?: GooglePlaceResult;
      status: string;
    };
    return detailData.status === "OK" ? detailData.result || null : null;
  } catch {
    return null;
  }
}

/**
 * Obtiene una foto de Google Places para una referencia de foto
 */
export function getPlacePhotoUrl(
  photoReference: string,
  maxWidth: number = 400
): string {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  return `${PLACES_API_BASE}/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${apiKey}`;
}

/**
 * Infiere el sector de una empresa a partir de los types de Google Places
 */
export function inferirSector(types: string[] = []): string | null {
  const SECTOR_MAP: Record<string, string> = {
    supermarket: "Alimentación / Retail",
    grocery_or_supermarket: "Alimentación / Retail",
    restaurant: "Hostelería / Turismo",
    hotel: "Hostelería / Turismo",
    bank: "Banca / Seguros",
    insurance_agency: "Banca / Seguros",
    hospital: "Salud / Farmacia",
    pharmacy: "Salud / Farmacia",
    doctor: "Salud / Farmacia",
    school: "Educación",
    university: "Educación",
    car_dealer: "Automoción",
    car_repair: "Automoción",
    clothing_store: "Moda / Textil",
    department_store: "Moda / Textil",
    electronics_store: "Tecnología",
    hardware_store: "Industria / Manufactura",
    real_estate_agency: "Construcción / Inmobiliaria",
    furniture_store: "Industria / Manufactura",
    gym: "Servicios",
    hair_care: "Servicios",
    lawyer: "Servicios Legales",
    accounting: "Consultoría",
    travel_agency: "Hostelería / Turismo",
    gas_station: "Energía",
    electrician: "Energía",
    plumber: "Construcción / Inmobiliaria",
    logistics: "Transporte / Logística",
    storage: "Transporte / Logística",
  };

  for (const type of types) {
    if (SECTOR_MAP[type]) return SECTOR_MAP[type];
  }
  return null;
}
