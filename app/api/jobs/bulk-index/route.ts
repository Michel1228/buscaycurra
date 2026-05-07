/**
 * POST /api/jobs/bulk-index — Indexación masiva de alta velocidad
 *
 * Body: { secret, source, offset?, limit? }
 *
 * source:
 *   "jooble"     → Bulk Jooble (puestos × ciudades), necesita offset
 *   "arbeitnow"  → Full dump Arbeitnow (sin offset)
 *   "remotive"   → Full dump Remotive (sin offset)
 *   "all-free"   → Arbeitnow + Remotive en paralelo
 *
 * Response: { ok, insertados, procesados, total, fuentes, totalEnBD, siguiente }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  indexarBulkJooble,
  indexarBulkArbeitnow,
  indexarBulkRemotive,
  TOTAL_COMBINACIONES,
} from "@/lib/job-search/bulk-indexer";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function contarEnBD(): Promise<number> {
  const pool = getPool();
  const res = await pool.query('SELECT COUNT(*) FROM "JobListing" WHERE "isActive" = true');
  return parseInt(res.rows[0].count);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      secret?: string;
      source?: string;
      offset?: number;
      limit?: number;
    };

    if (body.secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const source = body.source ?? "jooble";
    const offset = body.offset ?? 0;
    const limit = Math.min(body.limit ?? 200, 500);

    console.log(`[BulkIndex] source=${source} offset=${offset} limit=${limit}`);

    let result;

    if (source === "arbeitnow") {
      result = await indexarBulkArbeitnow();
    } else if (source === "remotive") {
      result = await indexarBulkRemotive();
    } else if (source === "all-free") {
      const [arb, rem] = await Promise.all([indexarBulkArbeitnow(), indexarBulkRemotive()]);
      result = {
        total: arb.total + rem.total,
        procesados: arb.procesados + rem.procesados,
        insertados: arb.insertados + rem.insertados,
        errores: arb.errores + rem.errores,
        fuentes: { ...arb.fuentes, ...rem.fuentes },
      };
    } else {
      result = await indexarBulkJooble(offset, limit);
    }

    const totalEnBD = await contarEnBD();
    const siguienteOffset = source === "jooble" ? offset + limit : null;
    const hayMas = siguienteOffset !== null && siguienteOffset < TOTAL_COMBINACIONES;

    return NextResponse.json({
      ok: true,
      ...result,
      totalEnBD,
      totalCombinaciones: TOTAL_COMBINACIONES,
      siguiente: hayMas ? siguienteOffset : null,
      progresoPct: source === "jooble"
        ? Math.round(((offset + result.procesados) / TOTAL_COMBINACIONES) * 100)
        : 100,
    });
  } catch (e) {
    console.error("[BulkIndex] Error:", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const totalEnBD = await contarEnBD();
  return NextResponse.json({
    totalEnBD,
    objetivo: 400000,
    progresoPct: Math.round((totalEnBD / 400000) * 100),
    totalCombinaciones: TOTAL_COMBINACIONES,
    mensaje: `${totalEnBD.toLocaleString("es-ES")} / 400.000 ofertas`,
  });
}
