/**
 * EURES Job Search API — European Employment Services
 * API oficial de la UE para ofertas de empleo en 31 países europeos.
 * 
 * Fuente: EURES Portal (https://eures.europa.eu)
 * La API REST antigua fue migrada a Drupal. Usamos el endpoint JSON:API actual.
 * 
 * NOTA: La API de EURES requiere un User-Agent válido y acepta peticiones
 * desde IPs europeas (el VPS Hostinger está en España → OK).
 */

const EURES_BASE = "https://eures.europa.eu";

interface EuresJob {
  id: string;
  title: string;
  company: string;
  city: string;
  country: string;
  url: string;
  salary: string | null;
  contractType: string | null;
  postedDate: string;
  sourceName: string;
}

/**
 * Busca ofertas en EURES por keyword y país.
 * EURES cubre: EU/EEA countries + Switzerland
 */
export async function searchEures(params: {
  keyword: string;
  country?: string; // ISO code: "ES", "DE", "FR", "PT", "IT"...
  page?: number;
  limit?: number;
}): Promise<{ jobs: EuresJob[]; total: number }> {
  const keyword = encodeURIComponent(params.keyword || "");
  const country = params.country || "ES";
  const page = params.page || 0;
  const limit = Math.min(params.limit || 50, 100);

  if (!keyword) return { jobs: [], total: 0 };

  // EURES usa Drupal JSON:API
  // Endpoint descubierto analizando la search page del portal
  const url = `${EURES_BASE}/api/job-offers/search?` +
    `keyword=${keyword}&country=${country}&page=${page}&size=${limit}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "BuscayCurra/2.0 (job-search-aggregator; https://buscaycurra.es)",
        "Accept-Language": "es-ES,es;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.warn(`[EURES] HTTP ${res.status} for "${params.keyword}"`);
      return { jobs: [], total: 0 };
    }

    const data = await res.json();

    // La respuesta puede tener diferentes formatos según la versión de la API
    const items = data?.data || data?.results || data?.items || [];
    const total = data?.meta?.total || data?.total || items.length;

    const jobs: EuresJob[] = items.map((item: any) => ({
      id: item.id || item.uuid || item.jobId || "",
      title: item.title || item.name || "",
      company: item.company?.name || item.employer?.name || item.companyName || "Empresa europea",
      city: item.location?.city || item.city || "",
      country: item.location?.country || item.country || country,
      url: item.url || item.link || `${EURES_BASE}/job/${item.id || ""}`,
      salary: item.salary || null,
      contractType: item.contractType || item.contract || null,
      postedDate: item.postedDate || item.created || new Date().toISOString(),
      sourceName: `eures_${(item.location?.country || country).toLowerCase()}`,
    }));

    return { jobs, total };
  } catch (err: any) {
    console.error(`[EURES] Error fetching "${params.keyword}":`, err.message);
    return { jobs: [], total: 0 };
  }
}

/**
 * Países disponibles en EURES con sus keywords locales traducidas.
 */
export const EURES_COUNTRIES = [
  { code: "ES", name: "España", keywords: ["camarero", "programador", "enfermero", "administrativo", "conductor", "dependiente", "electricista", "mecanico"] },
  { code: "DE", name: "Alemania", keywords: ["kellner", "entwickler", "krankenpfleger", "bürokaufmann", "fahrer", "verkäufer", "elektriker", "mechaniker"] },
  { code: "FR", name: "Francia", keywords: ["serveur", "développeur", "infirmier", "administratif", "chauffeur", "vendeur", "électricien", "mécanicien"] },
  { code: "PT", name: "Portugal", keywords: ["empregado", "programador", "enfermeiro", "administrativo", "motorista", "vendedor", "eletricista", "mecânico"] },
  { code: "IT", name: "Italia", keywords: ["cameriere", "sviluppatore", "infermiere", "amministrativo", "autista", "venditore", "elettricista", "meccanico"] },
  { code: "NL", name: "Países Bajos", keywords: ["ober", "ontwikkelaar", "verpleegkundige", "administratief", "chauffeur", "verkoper", "elektricien", "monteur"] },
  { code: "IE", name: "Irlanda", keywords: ["waiter", "developer", "nurse", "administrator", "driver", "sales", "electrician", "mechanic"] },
  { code: "BE", name: "Bélgica", keywords: ["serveur", "développeur", "infirmier", "administratif", "chauffeur", "vendeur", "électricien", "mécanicien"] },
  { code: "AT", name: "Austria", keywords: ["kellner", "entwickler", "krankenpfleger", "bürokaufmann", "fahrer", "verkäufer", "elektriker", "mechaniker"] },
  { code: "PL", name: "Polonia", keywords: ["kelner", "programista", "pielegniarka", "administracyjny", "kierowca", "sprzedawca", "elektryk", "mechanik"] },
  { code: "SE", name: "Suecia", keywords: ["servitör", "utvecklare", "sjuksköterska", "administratör", "förare", "säljare", "elektriker", "mekaniker"] },
  { code: "CH", name: "Suiza", keywords: ["kellner", "entwickler", "krankenpfleger", "bürokaufmann", "fahrer", "verkäufer", "elektriker", "mechaniker"] },
  { code: "NO", name: "Noruega", keywords: ["servitør", "utvikler", "sykepleier", "administrativ", "sjåfør", "selger", "elektriker", "mekaniker"] },
  { code: "DK", name: "Dinamarca", keywords: ["tjener", "udvikler", "sygeplejerske", "administrativ", "chauffør", "sælger", "elektriker", "mekaniker"] },
  { code: "FI", name: "Finlandia", keywords: ["tarjoilija", "kehittäjä", "sairaanhoitaja", "hallinnollinen", "kuljettaja", "myyjä", "sähköasentaja", "mekaanikko"] },
];

/**
 * Genera combos para sync masivo EURES: país × keyword
 */
export function generateEuresCombos(): Array<{ keyword: string; country: string }> {
  const combos: Array<{ keyword: string; country: string }> = [];
  for (const country of EURES_COUNTRIES) {
    for (const keyword of country.keywords) {
      combos.push({ keyword, country: country.code });
    }
  }
  return combos;
}
