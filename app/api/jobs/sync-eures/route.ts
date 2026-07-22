/**
 * POST /api/jobs/sync-eures — Sincroniza ofertas del portal europeo EURES.
 *
 * Reescrito en jul 2026 por DOS motivos:
 *  1. La API antigua (`jobsearch.api.eures.europa.eu`) fue retirada: el dominio
 *     ya ni siquiera resuelve en DNS, así que el endpoint fallaba siempre con
 *     "fetch failed". La actual es el buscador público de europa.eu.
 *  2. Guardaba en la tabla `ofertas` de Supabase, que está obsoleta — la app
 *     busca en `JobListing` (Postgres del VPS). Aunque hubiera funcionado, esas
 *     ofertas nunca habrían aparecido en la búsqueda.
 *
 * EURES es enorme y oficial: ~76.000 vacantes solo para "nurse".
 *
 * Header: x-sync-secret = ADMIN_SECRET
 * Body: { keywords?: string[], startIdx?: number, batchSize?: number, pagesPorKeyword?: number }
 */
import { NextRequest, NextResponse } from "next/server";
import { upsertJobsForSync } from "@/lib/job-search/sync-worker";
import { secretIguales } from "@/lib/secret-compare";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const EURES_URL = "https://europa.eu/eures/api/jv-searchengine/public/jv-search/search";
const RESULTADOS_POR_PAGINA = 50;

/** Términos amplios que cubren los sectores con más demanda en Europa. */
const KEYWORDS = [
  "nurse", "driver", "engineer", "chef", "waiter", "cleaner", "welder",
  "electrician", "warehouse", "construction", "mechanic", "carpenter",
  "hotel", "farm", "caregiver", "teacher", "developer", "sales",
  "logistics", "plumber", "painter", "security", "cook", "housekeeping",
];

interface EuresJV {
  id?: string;
  title?: string;
  description?: string;
  employer?: { name?: string };
  locationMap?: Record<string, string[]>;
  creationDate?: number;
}

function limpiarHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** El locationMap es { "BE": ["BE211"] }: la clave es el país ISO. */
function paisDe(jv: EuresJV): string {
  const claves = Object.keys(jv.locationMap || {});
  return claves[0]?.toLowerCase() || "";
}

async function buscarEures(keyword: string, page: number): Promise<EuresJV[]> {
  const body = {
    resultsPerPage: RESULTADOS_POR_PAGINA,
    page,
    sortSearch: "MOST_RECENT",
    keywords: [{ keyword, specificSearchCode: "EVERYWHERE" }],
    publicationPeriod: null,
    occupationUris: [],
    skillUris: [],
    requiredExperienceCodes: [],
    positionScheduleCodes: [],
    sectorCodes: [],
    educationAndQualificationLevelCodes: [],
    positionOfferingCodes: [],
    locationCodes: [],
    euresFlagCodes: [],
    otherBenefitsCodes: [],
    requiredLanguages: [],
    minNumberPost: null,
    sessionId: "buscaycurra",
    userPreferredLanguage: null,
    requestLanguage: "en",
  };

  const res = await fetch(EURES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "BuscayCurra/1.0 (https://buscaycurra.es)",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { jvs?: EuresJV[] };
  return data.jvs || [];
}

export async function GET() {
  return NextResponse.json({ keywords: KEYWORDS, total: KEYWORDS.length });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (!secretIguales(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { startIdx?: number; batchSize?: number; pagesPorKeyword?: number } = {};
  try { body = await req.json(); } catch { /* defaults */ }

  const startIdx = Math.max(body.startIdx ?? 0, 0);
  const batchSize = Math.min(Math.max(body.batchSize ?? 4, 1), 8);
  const pagesPorKeyword = Math.min(Math.max(body.pagesPorKeyword ?? 3, 1), 10);
  const lote = KEYWORDS.slice(startIdx, startIdx + batchSize);

  if (!lote.length) {
    return NextResponse.json({ ok: true, done: true, inserted: 0, nextIdx: 0, totalKeywords: KEYWORDS.length });
  }

  let inserted = 0;
  let fetched = 0;

  for (const keyword of lote) {
    for (let page = 1; page <= pagesPorKeyword; page++) {
      try {
        const jvs = await buscarEures(keyword, page);
        if (!jvs.length) break;
        fetched += jvs.length;

        // Se agrupa por país porque upsertJobsForSync recibe un país por lote.
        const porPais = new Map<string, ReturnType<typeof mapear>[]>();
        for (const jv of jvs) {
          if (!jv.title || !jv.id) continue;
          const pais = paisDe(jv);
          if (!porPais.has(pais)) porPais.set(pais, []);
          porPais.get(pais)!.push(mapear(jv));
        }

        for (const [pais, jobs] of porPais) {
          inserted += await upsertJobsForSync(jobs, "OTRO", pais || undefined);
        }
      } catch { /* siguiente página */ }
    }
  }

  const nextIdx = startIdx + batchSize;
  const done = nextIdx >= KEYWORDS.length;

  return NextResponse.json({
    ok: true,
    source: "EURES",
    keywords: lote,
    inserted,
    fetched,
    nextIdx: done ? 0 : nextIdx,
    done,
    totalKeywords: KEYWORDS.length,
  });
}

function mapear(jv: EuresJV) {
  return {
    source: "EURES",
    url: `https://europa.eu/eures/portal/jv-se/jv-details/${jv.id}`,
    title: (jv.title || "").slice(0, 300),
    company: (jv.employer?.name || "").slice(0, 200),
    city: paisDe(jv).toUpperCase(),
    description: limpiarHtml(jv.description || "").slice(0, 2000),
    salary: "",
  };
}
