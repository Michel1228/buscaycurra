/**
 * /api/salarios — Comparador de salarios por puesto y provincia
 * GET: ?puesto=camarero&provincia=madrid
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const puesto = (searchParams.get("puesto") || "").trim();
  const provincia = (searchParams.get("provincia") || "").trim();

  if (!puesto) {
    return NextResponse.json({ error: "puesto requerido" }, { status: 400 });
  }

  try {
    const pool = getPool();
    const kw = `%${puesto}%`;

    // Salarios por provincia
    const provinciaQuery = await pool.query(
      `SELECT province, COUNT(*) as count, 
              AVG(CASE WHEN salary ~ '^[0-9]+' THEN CAST(REGEXP_REPLACE(salary, '[^0-9]', '', 'g') AS INTEGER) END) as avg_salary
       FROM "JobListing"
       WHERE "isActive" = true AND (title ILIKE $1 OR description ILIKE $1)
         AND province IS NOT NULL AND province != ''
         AND salary IS NOT NULL AND salary != '' AND salary != 'Ver en oferta'
       GROUP BY province
       ORDER BY count DESC
       LIMIT 20`,
      [kw]
    );

    // Rango salarial general
    const rangoQuery = await pool.query(
      `SELECT 
        MIN(CAST(REGEXP_REPLACE(salary, '[^0-9]', '', 'g') AS INTEGER)) as min_salary,
        MAX(CAST(REGEXP_REPLACE(salary, '[^0-9]', '', 'g') AS INTEGER)) as max_salary,
        AVG(CAST(REGEXP_REPLACE(salary, '[^0-9]', '', 'g') AS INTEGER)) as avg_salary,
        COUNT(*) as total
       FROM "JobListing"
       WHERE "isActive" = true AND (title ILIKE $1 OR description ILIKE $1)
         AND salary IS NOT NULL AND salary != '' AND salary != 'Ver en oferta'
         AND CAST(REGEXP_REPLACE(salary, '[^0-9]', '', 'g') AS INTEGER) > 1000`,
      [kw]
    );

    // Si hay provincia específica, añadir detalle
    let provinciaDetalle = null;
    if (provincia) {
      const detQuery = await pool.query(
        `SELECT 
          COUNT(*) as count,
          AVG(CAST(REGEXP_REPLACE(salary, '[^0-9]', '', 'g') AS INTEGER)) as avg_salary
         FROM "JobListing"
         WHERE "isActive" = true AND (title ILIKE $1 OR description ILIKE $1)
           AND (province ILIKE $2 OR city ILIKE $2)
           AND salary IS NOT NULL AND salary != '' AND salary != 'Ver en oferta'`,
        [kw, `%${provincia}%`]
      );
      provinciaDetalle = detQuery.rows[0];
    }

    return NextResponse.json({
      puesto,
      provincia: provincia || null,
      rangoGeneral: rangoQuery.rows[0],
      porProvincia: provinciaQuery.rows,
      provinciaDetalle,
    });
  } catch (error) {
    console.error("[salarios] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error al obtener salarios" }, { status: 500 });
  }
}
