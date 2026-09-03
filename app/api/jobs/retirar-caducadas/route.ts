/**
 * POST /api/jobs/retirar-caducadas — Saca de circulación lo que ya ha caducado.
 *
 * POR QUE EXISTE. La columna "expiresAt" llevaba tiempo rellenándose y NADIE la
 * miraba: no había ningún trabajo que actuara sobre ella, y de las 33 consultas
 * que leen JobListing solo una la tenía en cuenta. Las ofertas se acumulaban
 * para siempre.
 *
 * Medido antes de la primera limpieza: 2,3 millones marcadas como activas, de
 * las cuales 163.503 llevaban más de tres meses publicadas. Se retiraron
 * 195.217 y el porcentaje de ofertas con más de dos meses pasó del 7,1% al 0,7%.
 *
 * Y no es solo higiene: en la tabla comparativa de nuestra propia portada le
 * criticamos a la competencia "ofertas caducadas y empresas fantasma". No se
 * puede vender eso y hacer lo mismo.
 *
 * POR QUE MARCA EN VEZ DE FILTRAR EN LAS CONSULTAS. Las 33 consultas ya filtran
 * por "isActive". Marcando la oferta como inactiva se arreglan todas de golpe,
 * sin editar ninguna. Menos superficie, menos que se pueda romper.
 *
 * NO BORRA NADA. Solo marca. Para deshacerlo:
 *   UPDATE "JobListing" SET "isActive" = true
 *    WHERE "isActive" = false AND "expiresAt" <= now();
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { secretIguales } from "@/lib/secret-compare";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Tamaño de lote. Este servidor tiene el 85% de la CPU robada por el
 *  hipervisor: un UPDATE de 200.000 filas de golpe se come el statement_timeout
 *  y se queda a medias, que es como ya reventaron dos scripts en este proyecto. */
const LOTE = 20_000;

export async function POST(req: NextRequest) {
  if (!secretIguales(req.headers.get("x-sync-secret"), process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const pool = getPool();
  let retiradas = 0;
  const empezado = Date.now();

  try {
    for (;;) {
      const r = await pool.query(
        `WITH lote AS (
           SELECT id FROM "JobListing"
            WHERE "isActive" = true AND "expiresAt" <= now()
            LIMIT $1
         )
         UPDATE "JobListing" j SET "isActive" = false
           FROM lote WHERE j.id = lote.id`,
        [LOTE],
      );
      const n = r.rowCount || 0;
      if (n === 0) break;
      retiradas += n;

      // Si se acerca el limite de la funcion, se para y se deja el resto para
      // la siguiente pasada. Es idempotente: retomar donde se quedo no cuesta
      // nada y es preferible a que la corten a media escritura.
      if (Date.now() - empezado > 240_000) break;
    }

    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS vivas FROM "JobListing" WHERE "isActive" = true`,
    );

    console.log(`[retirar-caducadas] ${retiradas} retiradas, quedan ${rows[0].vivas} vivas`);
    return NextResponse.json({
      ok: true,
      retiradas,
      vivas: rows[0].vivas,
      segundos: Math.round((Date.now() - empezado) / 1000),
    });
  } catch (e) {
    console.error("[retirar-caducadas]", (e as Error).message);
    return NextResponse.json(
      { error: (e as Error).message, retiradas },
      { status: 500 },
    );
  }
}
