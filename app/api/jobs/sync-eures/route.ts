/**
 * POST /api/jobs/sync-eures — Sincroniza ofertas del portal europeo EURES
 *
 * EURES (European Employment Services) tiene una API REST pública sin autenticación.
 * Endpoint oficial: https://jobsearch.api.eures.europa.eu/
 *
 * Header: x-sync-secret = ADMIN_SECRET
 * Body: { batchSize?: number, keywords?: string, country?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EURES_BASE = "https://jobsearch.api.eures.europa.eu/searchengine/adzuna/v1/jobs";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 60);
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { batchSize?: number; keywords?: string; country?: string; page?: number } = {};
  try { body = await req.json(); } catch { /* defaults */ }

  const batchSize = Math.min(body.batchSize ?? 50, 100);
  const keywords = body.keywords ?? "empleo trabajo";
  const country = body.country ?? "ES";
  const page = body.page ?? 1;

  try {
    // EURES API pública — no requiere API key
    const params = new URLSearchParams({
      what: keywords,
      where: country,
      results_per_page: String(batchSize),
      page: String(page),
      sort_by: "date",
    });

    const res = await fetch(`${EURES_BASE}?${params}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "BuscayCurra/1.0 (https://buscaycurra.es)",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `EURES API ${res.status}`, details: await res.text() },
        { status: 502 }
      );
    }

    const data = await res.json() as {
      results?: Array<{
        id?: string;
        title?: string;
        company?: { display_name?: string };
        location?: { display_name?: string };
        description?: string;
        redirect_url?: string;
        created?: string;
        salary_min?: number;
        salary_max?: number;
        salary_is_predicted?: boolean;
      }>;
      count?: number;
    };

    const jobs = data.results ?? [];
    if (jobs.length === 0) {
      return NextResponse.json({ ok: true, insertados: 0, total: data.count ?? 0 });
    }

    const supabase = getSupabase();

    const filas = jobs.map((j) => {
      const id = `eures-${j.id ?? slugify((j.title ?? "") + (j.company?.display_name ?? ""))}`;
      const salario = j.salary_min
        ? `${j.salary_min}${j.salary_max ? `–${j.salary_max}` : ""}€/año`
        : "";
      return {
        id,
        titulo: (j.title ?? "").slice(0, 255),
        empresa: (j.company?.display_name ?? "").slice(0, 255),
        ubicacion: (j.location?.display_name ?? country).slice(0, 255),
        provincia: country,
        comunidad: "Europa",
        salario: salario.slice(0, 100),
        descripcion: (j.description ?? "").replace(/<[^>]+>/g, "").slice(0, 1000),
        fuente: "EURES",
        url: (j.redirect_url ?? "").slice(0, 500),
        email_empresa: "",
        sector: "otros",
        keywords: [(j.title ?? "").toLowerCase()].filter(Boolean),
        fecha: j.created ?? new Date().toISOString(),
      };
    });

    const { error } = await supabase
      .from("ofertas")
      .upsert(filas, { onConflict: "id", ignoreDuplicates: true });

    if (error) {
      console.warn("[SyncEURES] upsert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      insertados: filas.length,
      total: data.count ?? filas.length,
      page,
      source: "EURES",
    });
  } catch (e) {
    console.error("[SyncEURES] Error:", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
