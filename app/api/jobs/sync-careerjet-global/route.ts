/**
 * /api/jobs/sync-careerjet-global
 * Extrae ofertas de Careerjet para US, UK, AU, CA
 * usando keywords nativas + ciudades por país
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchCareerjetGlobal, upsertJobsForSync } from "@/lib/job-search/sync-worker";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const COUNTRIES: Record<string, { keywords: string[]; cities: string[]; name: string }> = {
  us: {
    name: "Estados Unidos",
    keywords: ["software engineer", "registered nurse", "truck driver", "teacher", "accountant", "electrician", "retail manager", "data analyst", "sales representative", "mechanic", "pharmacist", "physical therapist", "dental hygienist", "web developer", "project manager", "marketing manager", "financial analyst", "HR manager", "construction manager", "paralegal"],
    cities: ["New York", "Los Angeles", "Chicago", "Houston", "Miami", "Seattle", "Boston", "Atlanta", "Dallas", "Denver", "Austin", "San Francisco", "Phoenix", "Portland", "Nashville"],
  },
  uk: {
    name: "Reino Unido",
    keywords: ["software engineer", "nurse", "teacher", "electrician", "HGV driver", "accountant", "chef", "project manager", "data analyst", "plumber", "care assistant", "sales manager", "web developer", "HR manager", "marketing manager", "financial analyst", "solicitor", "mechanical engineer", "civil engineer", "pharmacist"],
    cities: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Liverpool", "Edinburgh", "Bristol", "Sheffield", "Cardiff", "Newcastle", "Nottingham", "Belfast", "Leicester", "Brighton"],
  },
  au: {
    name: "Australia",
    keywords: ["software engineer", "registered nurse", "electrician", "teacher", "chef", "accountant", "project manager", "data analyst", "diesel mechanic", "truck driver", "aged care worker", "web developer", "retail manager", "mining engineer", "civil engineer", "occupational therapist", "speech pathologist", "HR advisor", "marketing coordinator", "construction manager"],
    cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Darwin", "Hobart", "Newcastle", "Geelong", "Cairns", "Townsville", "Wollongong", "Sunshine Coast"],
  },
  ca: {
    name: "Canadá",
    keywords: ["software engineer", "registered nurse", "electrician", "teacher", "truck driver", "accountant", "chef", "project manager", "data analyst", "heavy duty mechanic", "web developer", "HR manager", "retail manager", "financial analyst", "civil engineer", "pharmacist", "dental hygienist", "welder", "carpenter", "early childhood educator"],
    cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Edmonton", "Ottawa", "Quebec City", "Winnipeg", "Hamilton", "Kitchener", "London Ontario", "Halifax", "Victoria", "Saskatoon", "Mississauga"],
  },
};

// Offset en memoria
const offsets: Record<string, number> = {};

export async function GET() {
  return NextResponse.json({
    countries: Object.keys(COUNTRIES),
    offsets,
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { country?: string; batchSize?: number } = {};
  try { body = await req.json(); } catch { /* defaults */ }

  const batchSize = Math.min(body.batchSize ?? 10, 20);
  const country = body.country ?? "us";
  const cfg = COUNTRIES[country];
  if (!cfg) return NextResponse.json({ error: "País no soportado: " + country }, { status: 400 });

  const startIdx = offsets[country] || 0;
  let totalFetched = 0;
  let totalInserted = 0;

  for (let i = 0; i < batchSize; i++) {
    const comboIdx = (startIdx + i) % (cfg.keywords.length * cfg.cities.length);
    const kwIdx = comboIdx % cfg.keywords.length;
    const cityIdx = Math.floor(comboIdx / cfg.keywords.length) % cfg.cities.length;
    const kw = cfg.keywords[kwIdx];
    const city = cfg.cities[cityIdx];

    try {
      const jobs = await fetchCareerjetGlobal(kw, city);
      if (jobs.length > 0) {
        const inserted = await upsertJobsForSync(jobs, "OTRO" as any);
        totalInserted += inserted;
        totalFetched += jobs.length;
      }
    } catch { /* skip combo */ }
  }

  offsets[country] = startIdx + batchSize;

  return NextResponse.json({
    country: cfg.name,
    inserted: totalInserted,
    fetched: totalFetched,
    nextOffset: offsets[country],
    totalCombos: cfg.keywords.length * cfg.cities.length,
  });
}
