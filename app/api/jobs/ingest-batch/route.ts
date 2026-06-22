/**
 * POST /api/jobs/ingest-batch
 * Ingesta masiva de ofertas scrapeadas de agencias externas
 * Body: { jobs: [{ titulo, empresa, ubicacion, url, fuente, pais, salario?, descripcion? }] }
 */
import { NextRequest, NextResponse } from "next/server";
import { upsertJobsForSync } from "@/lib/job-search/sync-worker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const jobs = body.jobs as any[];
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: "Falta array jobs" }, { status: 400 });
    }

    const transformed = jobs.map((j: any) => ({
      source: j.fuente || j.source || "Agency",
      url: j.url || "",
      title: (j.titulo || j.title || "Sin título").slice(0, 200),
      company: (j.empresa || j.company || "Desconocido").slice(0, 200),
      city: (j.ubicacion || j.location || j.city || "").slice(0, 100),
      description: (j.descripcion || j.description || "").slice(0, 1000),
      salary: (j.salario || j.salary || "").slice(0, 100),
    }));

    const inserted = await upsertJobsForSync(transformed, "OTRO", body.pais || "uk");

    return NextResponse.json({ ok: true, inserted, received: jobs.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
