/**
 * /api/jobs/sync-jooble-global
 * Sync masivo de Jooble en 20+ países con keywords nativas.
 * Jooble tiene una API gratuita con key única. Sin rate-limit conocido.
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;

// Keywords nativas por país (profesiones comunes en cada idioma)
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  es: ["camarero", "limpieza", "conductor", "administrativo", "dependiente", "cocinero", "enfermero",
       "programador", "electricista", "mecanico", "albañil", "soldador", "fontanero", "peluquero",
       "repartidor", "cajero", "vendedor", "operario", "cuidador", "teleoperador"],
  uk: ["cleaner", "driver", "nurse", "teacher", "administrator", "receptionist", "chef",
       "developer", "electrician", "mechanic", "plumber", "welder", "hairdresser",
       "delivery driver", "cashier", "sales assistant", "warehouse operative", "carer"],
  us: ["cleaner", "driver", "nurse", "teacher", "administrator", "receptionist", "chef",
       "software developer", "electrician", "mechanic", "plumber", "welder", 
       "delivery driver", "cashier", "sales associate", "warehouse worker", "caregiver"],
  de: ["Reinigungskraft", "Fahrer", "Krankenpfleger", "Lehrer", "Verwaltungsangestellter",
       "Empfangsmitarbeiter", "Koch", "Softwareentwickler", "Elektriker", "Mechaniker",
       "Klempner", "Schweißer", "Friseur", "Lieferfahrer", "Kassierer", "Verkäufer"],
  fr: ["agent d'entretien", "chauffeur", "infirmier", "enseignant", "administrateur",
       "réceptionniste", "cuisinier", "développeur", "électricien", "mécanicien",
       "plombier", "soudeur", "coiffeur", "livreur", "caissier", "vendeur"],
  it: ["addetto alle pulizie", "autista", "infermiere", "insegnante", "amministrativo",
       "receptionist", "cuoco", "sviluppatore", "elettricista", "meccanico",
       "idraulico", "saldatore", "parrucchiere", "corriere", "cassiere", "venditore"],
  pt: ["limpeza", "motorista", "enfermeiro", "professor", "administrativo",
       "recepcionista", "cozinheiro", "programador", "eletricista", "mecânico",
       "canalizador", "soldador", "cabeleireiro", "entregador", "caixa", "vendedor"],
  nl: ["schoonmaker", "chauffeur", "verpleegkundige", "leraar", "administratief medewerker",
       "receptionist", "kok", "ontwikkelaar", "elektricien", "monteur",
       "loodgieter", "lasser", "kapper", "bezorger", "kassamedewerker", "verkoper"],
  pl: ["sprzątaczka", "kierowca", "pielęgniarka", "nauczyciel", "administrator",
       "recepcjonista", "kucharz", "programista", "elektryk", "mechanik",
       "hydraulik", "spawacz", "fryzjer", "dostawca", "kasjer", "sprzedawca"],
  se: ["städare", "förare", "sjuksköterska", "lärare", "administratör",
       "receptionist", "kock", "utvecklare", "elektriker", "mekaniker",
       "rörmokare", "svetsare", "frisör", "leveransförare", "kassör", "försäljare"],
  ie: ["cleaner", "driver", "nurse", "teacher", "administrator", "receptionist", "chef",
       "developer", "electrician", "mechanic", "plumber", "welder",
       "delivery driver", "cashier", "sales assistant", "care assistant"],
  au: ["cleaner", "driver", "nurse", "teacher", "administrator", "receptionist", "chef",
       "developer", "electrician", "mechanic", "plumber", "welder",
       "delivery driver", "cashier", "sales assistant", "aged care worker"],
  ca: ["cleaner", "driver", "nurse", "teacher", "administrator", "receptionist", "chef",
       "developer", "electrician", "mechanic", "plumber", "welder",
       "delivery driver", "cashier", "sales associate", "personal support worker"],
};

// Ciudades principales por país
const COUNTRY_CITIES: Record<string, string[]> = {
  es: ["Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Malaga", "Murcia", "Bilbao", "Alicante", "Valladolid"],
  uk: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Liverpool", "Bristol", "Sheffield", "Edinburgh", "Cardiff"],
  us: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Dallas", "Miami", "Atlanta", "Seattle", "Denver"],
  de: ["Berlin", "München", "Hamburg", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Hannover"],
  fr: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Bordeaux", "Lille", "Rennes"],
  it: ["Roma", "Milano", "Napoli", "Torino", "Palermo", "Bologna", "Firenze", "Genova", "Venezia", "Bari"],
  pt: ["Lisboa", "Porto", "Braga", "Coimbra", "Funchal", "Amadora", "Setúbal", "Aveiro", "Viseu", "Faro"],
  nl: ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen"],
  pl: ["Warszawa", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Bydgoszcz", "Lublin", "Katowice"],
  se: ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Linköping", "Örebro", "Västerås", "Helsingborg", "Norrköping", "Jönköping"],
  ie: ["Dublin", "Cork", "Limerick", "Galway", "Waterford", "Drogheda", "Dundalk", "Swords", "Bray", "Navan"],
  au: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Newcastle", "Hobart", "Darwin"],
  ca: ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton", "Halifax"],
};

function normalizeCountry(country?: string): string {
  const c = (country || "es").toLowerCase();
  const aliases: Record<string, string> = {
    "spain": "es", "espana": "es", "españa": "es",
    "united kingdom": "uk", "great britain": "uk",
    "united states": "us", "usa": "us",
    "germany": "de", "deutschland": "de",
    "france": "fr", "sweden": "se", "italy": "it",
    "netherlands": "nl", "poland": "pl", "portugal": "pt",
    "ireland": "ie", "australia": "au", "canada": "ca",
  };
  return aliases[c] || c;
}

async function upsertJob(job: {
  id: string; title: string; company: string; city: string;
  salary?: string; description?: string; sourceUrl?: string;
  country: string; sourceName: string;
}) {
  const pool = getPool();
  await pool.query(`
    INSERT INTO "JobListing" (id, title, company, city, salary, description, "sourceUrl", country, "sourceName", "isActive", "createdAt", "scrapedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET "scrapedAt" = NOW()
  `, [job.id, job.title, job.company, job.city, job.salary || null, job.description || null, job.sourceUrl || null, job.country, job.sourceName]);
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!JOOBLE_API_KEY) {
    return NextResponse.json({ error: "Jooble API key no configurada" }, { status: 503 });
  }

  let body: { country?: string; batchSize?: number; maxCombos?: number } = {};
  try { body = await req.json(); } catch {}

  const countries = body.country
    ? [normalizeCountry(body.country)]
    : Object.keys(COUNTRY_KEYWORDS);

  const MAX_COMBOS = body.maxCombos || 50; // máximo combos totales en esta ejecución
  let totalInserted = 0;
  let totalFetched = 0;
  let combosProcessed = 0;

  for (const country of countries) {
    const keywords = COUNTRY_KEYWORDS[country];
    const cities = COUNTRY_CITIES[country];
    if (!keywords || !cities) continue;

    for (const kw of keywords) {
      if (combosProcessed >= MAX_COMBOS) break;
      for (const city of cities) {
        if (combosProcessed >= MAX_COMBOS) break;
        combosProcessed++;

        try {
          const res = await fetch(`https://jooble.org/api/${JOOBLE_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keywords: kw, location: city }),
            signal: AbortSignal.timeout(15000),
          });

          if (!res.ok) {
            console.error(`[Jooble] ${country}/${kw}/${city}: HTTP ${res.status}`);
            continue;
          }

          const data = await res.json() as { jobs?: Array<{
            id?: string; title: string; company: string;
            location: string; salary?: string; snippet?: string;
            link?: string; updated?: string;
          }> };

          const jobs = data.jobs || [];
          totalFetched += jobs.length;

          for (const j of jobs) {
            const jobId = j.id || `jooble-${j.title}-${j.company}-${j.location}`.replace(/\s+/g, "-").toLowerCase();
            await upsertJob({
              id: jobId,
              title: j.title,
              company: j.company || "Empresa no especificada",
              city: j.location || city,
              salary: j.salary,
              description: j.snippet?.replace(/<[^>]+>/g, "").slice(0, 500),
              sourceUrl: j.link,
              country: country.toUpperCase(),
              sourceName: "Jooble",
            });
            totalInserted++;
          }
        } catch (err) {
          console.error(`[Jooble] Error ${country}/${kw}/${city}:`, (err as Error).message);
        }

        // Pequeña pausa para no saturar
        await new Promise(r => setTimeout(r, 200));
      }
    }
  }

  return NextResponse.json({
    ok: true,
    source: "jooble",
    totalInserted,
    totalFetched,
    combosProcessed,
    countries: countries.join(","),
  });
}
