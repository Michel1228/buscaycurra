import { NextRequest, NextResponse } from "next/server";
import { syncBatch, getJobStats, SECTORES, CIUDADES } from "@/lib/job-search/sync-worker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/jobs/sync-batch — sincroniza un lote de ofertas
// GET  /api/jobs/sync-batch — devuelve estadísticas + plan completo
export async function GET() {
  try {
    const stats = await getJobStats();
    const plan = SECTORES.flatMap(s =>
      s.keywords.flatMap(kw =>
        CIUDADES.map(city => ({ sector: s.sector, keyword: kw, city }))
      )
    );
    return NextResponse.json({
      stats,
      totalCombinations: plan.length,
      message: `${stats.total || 0} ofertas en BD. ${plan.length} combinaciones en el plan de sync.`,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret") || req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { source, sector, keyword, city, page } = body;

    if (!source || !sector || !keyword || !city) {
      return NextResponse.json({ error: "Faltan parámetros: source, sector, keyword, city" }, { status: 400 });
    }

    const result = await syncBatch({ source, sector, keyword, city, page: page || 1 });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
