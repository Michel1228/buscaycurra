/**
 * POST /api/jobs/ingest-remote
 * Recibe ofertas desde GitHub Actions y las guarda en PostgreSQL.
 * Autenticado con x-sync-secret.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Verificar secreto compartido
  const secret = req.headers.get("x-sync-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { source, jobs } = body as {
      source: string;
      jobs: Array<{
        title?: string;
        company?: string;
        location?: string;
        description?: string;
        url?: string;
        created_at?: string;
        position?: string;
        company_name?: string;
      }>;
    };

    if (!jobs || !Array.isArray(jobs)) {
      return NextResponse.json({ error: "Array jobs requerido" }, { status: 400 });
    }

    const pool = getPool();
    let inserted = 0;

    for (const j of jobs) {
      try {
        const titulo = (j.title || j.position || "").trim();
        const empresa = (j.company || j.company_name || "").trim();
        const ubicacion = (j.location || "Remoto").trim();
        const descripcion = (j.description || "").slice(0, 5000);
        const url = (j.url || "").trim();
        const fecha = j.created_at
          ? new Date(parseInt(String(j.created_at)) * 1000).toISOString()
          : new Date().toISOString();

        if (!titulo || !empresa || !url) continue;

        const id = `${source.toLowerCase()}-${Date.now()}-${inserted}`.slice(0, 120);

        await pool.query(
          `INSERT INTO "JobListing" (id, title, company, city, description, "sourceUrl", "scrapedAt", "isActive", source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
           ON CONFLICT (id) DO NOTHING`,
          [id, titulo, empresa, ubicacion, descripcion, url, fecha, source]
        );
        inserted++;
      } catch {
        // skip individual errors
      }
    }

    return NextResponse.json({ ok: true, source, inserted, total: jobs.length });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
