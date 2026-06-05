/**
 * lib/google-places.ts
 * Búsqueda de empresas vía Google Places API
 * Datos REALES: teléfono, dirección, web, rating, horario
 */
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
  city?: string
): Promise<GooglePlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[GooglePlaces] GOOGLE_PLACES_API_KEY no configurada");
    return [];
  }

  const searchQuery = city ? `${query} ${city}` : query;

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

    // 2. Obtener detalles de cada place_id (máx 5)
    const candidates = findData.candidates.slice(0, 5);
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
