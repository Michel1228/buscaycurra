/**
 * /api/jobs/scrape-ats
 * Scraper de fuentes directas: Greenhouse, Lever, Teamtailor
 * Se llama desde crontab cada 6 horas.
 * Auth: Authorization: Bearer <ALERTS_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ALERTS_SECRET = process.env.ALERTS_SECRET || "bcv-alerts-2026";

// ─── Empresas con Greenhouse ──────────────────────────────────────────────────
const GREENHOUSE = [
  "cabify", "typeform", "jobandtalent", "flywire", "adevinta", "paack",
  "wallapop", "idealista", "badi", "fever", "playtomic", "factorial",
  "lanzadera", "glovo", "nuvei", "luda-partners", "recovo", "cooltra",
  "carto", "habitissimo", "domestika", "voxel-group",
];

// ─── Empresas con Lever ───────────────────────────────────────────────────────
const LEVER = [
  "holded", "amenitiz", "voicemod", "urbanitae", "kenjo", "bewe",
  "gigas", "fluentify", "coverfy", "ficosota", "bdeo",
];

// ─── Empresas con Teamtailor ──────────────────────────────────────────────────
const TEAMTAILOR = [
  "factorial-hr", "lanzadera-portfolio", "bigml", "tropicfeel",
];

type JobSector = "HOSTELERIA" | "INDUSTRIA" | "OFICINA" | "COMERCIO" | "SALUD" | "EDUCACION" | "TECNOLOGIA" | "CONSTRUCCION" | "TRANSPORTE" | "OTRO";

function classifySector(title: string, desc: string = ""): JobSector {
  const t = (title + " " + desc).toLowerCase();
  if (/developer|engineer|software|fullstack|frontend|backend|devops|data|cloud|qa|cto|cio|it |tech|programador|informatica/.test(t)) return "TECNOLOGIA";
  if (/hotel|hosteleria|camarero|cocinero|chef|restaurante|bar |cocina|recepcion/.test(t)) return "HOSTELERIA";
  if (/medico|enfermero|farmacia|hospital|clinica|salud|doctor|sanitario/.test(t)) return "SALUD";
  if (/profesor|docente|maestro|educacion|formacion|pedagogia|tutor/.test(t)) return "EDUCACION";
  if (/logistica|transporte|conductor|repartidor|almacen|chofer|mensajero/.test(t)) return "TRANSPORTE";
  if (/construccion|obra|albanil|electricista|arquitecto|fontanero|soldador/.test(t)) return "CONSTRUCCION";
  if (/ventas|comercial|vendedor|tienda|retail|dependiente|atencion.*cliente/.test(t)) return "COMERCIO";
  if (/fabricacion|produccion|manufactura|industria|mecanico|operario|planta/.test(t)) return "INDUSTRIA";
  return "OTRO";
}

interface GHJob { id: number; title: string; location?: { name?: string }; absolute_url?: string; content?: string; updated_at?: string; }
interface LeverJob { id: string; text: string; categories?: { location?: string; team?: string }; hostedUrl?: string; descriptionPlain?: string; createdAt?: number; }
interface TeamtailorJob { id: string; attributes?: { title?: string; body?: string; "remote-status"?: string; created_at?: string }; links?: { "careersite-job-url"?: string }; }

async function fetchJson<T>(url: string, timeout = 10000): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "BuscayCurra-Bot/1.0 (buscaycurra.es)" } });
    clearTimeout(tid);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch { return null; }
}

function extractLocation(raw?: string): { city: string; province: string } {
  if (!raw) return { city: "", province: "" };
  const s = raw.replace(/españa|spain|es$/i, "").trim();
  const parts = s.split(/[,\-\/]/).map(p => p.trim()).filter(Boolean);
  return { city: parts[0] || "", province: parts[1] || parts[0] || "" };
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${ALERTS_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pool = getPool();
  let nuevas = 0;
  let errores = 0;

  const upsert = async (row: {
    id: string; title: string; company: string; description: string;
    sector: JobSector; city: string; province: string;
    sourceUrl: string; sourceName: string;
  }) => {
    try {
      const res = await pool.query(
        `INSERT INTO "JobListing" (id, title, company, description, sector, city, province, "sourceUrl", "sourceName", "isActive", "scrapedAt", "createdAt")
         VALUES ($1,$2,$3,$4,$5::\"JobSector\",$6,$7,$8,$9,true,NOW(),NOW())
         ON CONFLICT (id) DO UPDATE SET "scrapedAt"=NOW(), "isActive"=true`,
        [row.id, row.title.slice(0, 200), row.company.slice(0, 200), row.description.slice(0, 4000), row.sector, row.city.slice(0, 100), row.province.slice(0, 100), row.sourceUrl.slice(0, 500), row.sourceName]
      );
      if (res.rowCount && res.rowCount > 0) nuevas++;
    } catch { errores++; }
  };

  // ─── Greenhouse ───────────────────────────────────────────────────────────────
  for (const slug of GREENHOUSE) {
    const data = await fetchJson<{ jobs?: GHJob[] }>(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`);
    if (!data?.jobs) continue;
    for (const j of data.jobs) {
      const loc = extractLocation(j.location?.name);
      await upsert({
        id: `gh-${j.id}`,
        title: j.title || "",
        company: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
        description: j.content ? j.content.replace(/<[^>]*>/g, " ").slice(0, 4000) : "",
        sector: classifySector(j.title || ""),
        city: loc.city,
        province: loc.province,
        sourceUrl: j.absolute_url || `https://boards.greenhouse.io/${slug}/jobs/${j.id}`,
        sourceName: "Greenhouse",
      });
    }
  }

  // ─── Lever ────────────────────────────────────────────────────────────────────
  for (const slug of LEVER) {
    const data = await fetchJson<LeverJob[]>(`https://api.lever.co/v0/postings/${slug}?mode=json`);
    if (!Array.isArray(data)) continue;
    for (const j of data) {
      const loc = extractLocation(j.categories?.location);
      await upsert({
        id: `lv-${j.id}`,
        title: j.text || "",
        company: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
        description: j.descriptionPlain?.slice(0, 4000) || "",
        sector: classifySector(j.text || "", j.categories?.team || ""),
        city: loc.city,
        province: loc.province,
        sourceUrl: j.hostedUrl || `https://jobs.lever.co/${slug}/${j.id}`,
        sourceName: "Lever",
      });
    }
  }

  // ─── Teamtailor ───────────────────────────────────────────────────────────────
  for (const slug of TEAMTAILOR) {
    const data = await fetchJson<{ data?: TeamtailorJob[] }>(`https://${slug}.teamtailor.com/jobs.json`);
    if (!data?.data) continue;
    for (const j of data.data) {
      const attrs = j.attributes || {};
      await upsert({
        id: `tt-${j.id}`,
        title: attrs.title || "",
        company: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
        description: attrs.body ? attrs.body.replace(/<[^>]*>/g, " ").slice(0, 4000) : "",
        sector: classifySector(attrs.title || ""),
        city: "",
        province: "",
        sourceUrl: j.links?.["careersite-job-url"] || "",
        sourceName: "Teamtailor",
      });
    }
  }

  console.log(`[scrape-ats] Nuevas: ${nuevas}, Errores: ${errores}`);
  return NextResponse.json({ ok: true, nuevas, errores, fuentes: GREENHOUSE.length + LEVER.length + TEAMTAILOR.length });
}
