/**
 * /api/jobs/sync-usajobs
 * Extrae ofertas de USAJobs (gobierno federal de EEUU)
 * API gratuita, sin rate limit conocido
 */
import { NextRequest, NextResponse } from "next/server";
import { upsertJobsForSync } from "@/lib/job-search/sync-worker";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const KEYWORDS = [
  "software engineer", "nurse", "data scientist", "cyber security",
  "project manager", "accountant", "analyst", "investigator",
  "physician", "engineer", "technician", "specialist",
  "administrative", "clerk", "security", "attorney",
  "scientist", "program manager", "contract specialist",
  "human resources", "budget analyst", "public affairs",
  "logistics", "supply", "pharmacist", "social worker",
  "psychologist", "dentist", "veterinarian", "facilities",
];

const LOCATIONS = [
  "Washington", "New York", "Los Angeles", "Chicago", "Houston",
  "Atlanta", "Dallas", "San Diego", "Seattle", "Denver",
  "Boston", "Philadelphia", "Miami", "Phoenix", "Portland",
  "San Francisco", "Austin", "Tampa", "Orlando", "Nashville",
];

async function fetchUSAJobs(keyword: string, location: string, apiKey: string) {
  const url = `https://data.usajobs.gov/api/search?Keyword=${encodeURIComponent(keyword)}&LocationName=${encodeURIComponent(location)}&ResultsPerPage=50`;
  const res = await fetch(url, {
    headers: {
      "Host": "data.usajobs.gov",
      "User-Agent": "michel@buscaycurra.es",
      "Authorization-Key": apiKey,
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) return [];

  const data = await res.json() as {
    SearchResult?: {
      SearchResultItems?: Array<{
        MatchedObjectDescriptor?: {
          PositionID?: string;
          PositionTitle?: string;
          OrganizationName?: string;
          PositionLocationDisplay?: string;
          QualificationSummary?: string;
          PositionRemuneration?: Array<{ MinimumRange?: string; MaximumRange?: string }>;
          PositionURI?: string;
        };
      }>;
    };
  };

  const items = data.SearchResult?.SearchResultItems || [];
  return items.map(item => {
    const j = item.MatchedObjectDescriptor || {};
    const sal = j.PositionRemuneration?.[0];
    const salaryStr = sal?.MinimumRange && sal?.MaximumRange
      ? `$${sal.MinimumRange} - $${sal.MaximumRange}`
      : "Ver en oferta";

    return {
      source: "USAJOBS",
      url: j.PositionURI || "",
      title: (j.PositionTitle || keyword).slice(0, 200),
      company: (j.OrganizationName || "US Federal Government").slice(0, 200),
      city: (j.PositionLocationDisplay || location).slice(0, 100),
      description: (j.QualificationSummary || "").replace(/<[^>]+>/g, "").slice(0, 1000),
      salary: salaryStr,
    };
  });
}

// Offset en memoria (se resetea en cada deploy)
let usaOffset = 0;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const apiKey = process.env.USAJOBS_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "USAJOBS_KEY no configurada" }, { status: 500 });
  }

  let body: { batchSize?: number; offset?: number } = {};
  try { body = await req.json(); } catch { /* defaults */ }

  const batchSize = Math.min(body.batchSize ?? 20, 50);
  const offset = body.offset ?? usaOffset;

  const combos: Array<{ kw: string; loc: string }> = [];
  for (const kw of KEYWORDS) {
    for (const loc of LOCATIONS) {
      combos.push({ kw, loc });
    }
  }

  const batch = combos.slice(offset, offset + batchSize);
  let totalInserted = 0;
  let totalFetched = 0;

  for (const { kw, loc } of batch) {
    try {
      const raw = await fetchUSAJobs(kw, loc, apiKey);
      totalFetched += raw.length;
      if (raw.length > 0) {
        const inserted = await upsertJobsForSync(raw, "OTRO", "us");
        totalInserted += inserted;
      }
    } catch { /* skip combo */ }
    await new Promise(r => setTimeout(r, 300));
  }

  usaOffset = offset + batchSize;
  if (usaOffset >= combos.length) usaOffset = 0;

  return NextResponse.json({
    source: "USAJobs",
    inserted: totalInserted,
    fetched: totalFetched,
    nextOffset: usaOffset,
    totalCombos: combos.length,
  });
}
