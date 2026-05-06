/**
 * POST /api/jobs/index — Lanza el indexador masivo de ofertas en Supabase
 * Protegido con ADMIN_SECRET. Llámalo desde un cron o manualmente.
 *
 * Body: { secret: string, maxCombinaciones?: number }
 * Response: { insertados, procesados, errores, fuentes }
 */

import { NextRequest, NextResponse } from "next/server";
import { indexarOfertas } from "@/lib/job-search/db-indexer";

export const maxDuration = 300; // 5 minutos máximo (plan Pro de Vercel)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { secret?: string; maxCombinaciones?: number };

    if (body.secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const maxCombinaciones = Math.min(body.maxCombinaciones ?? 50, 500);

    console.log(`[/api/jobs/index] Iniciando indexación de ${maxCombinaciones} combinaciones...`);

    const resultado = await indexarOfertas(undefined, maxCombinaciones);

    return NextResponse.json({
      ok: true,
      ...resultado,
      mensaje: `${resultado.insertados} ofertas indexadas en ${resultado.procesados} búsquedas`,
    });
  } catch (e) {
    console.error("[/api/jobs/index] Error:", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// GET para ver cuántas ofertas hay en la BD
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { count: total } = await supabase.from("ofertas").select("*", { count: "exact", head: true });
  const { data: porFuente } = await supabase.rpc("count_by_fuente").limit(20);
  const { data: porSector } = await supabase.rpc("count_by_sector").limit(20);

  return NextResponse.json({ total, porFuente, porSector });
}
