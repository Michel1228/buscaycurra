/**
 * /api/salarios — Comparador de salarios por puesto y provincia
 * GET: ?puesto=camarero&provincia=madrid
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// Salarios de referencia España 2026 (bruto anual, €)
// Fuente: INE, Infojobs Informe Mercado Laboral 2025, Randstad
const SALARIOS_REFERENCIA: Record<string, { min: number; max: number; avg: number; provincias: Record<string, number> }> = {
  programador:   { min: 24000, max: 55000, avg: 34000, provincias: { Madrid: 38000, Barcelona: 36000, Valencia: 30000, Sevilla: 27000 } },
  desarrollador: { min: 24000, max: 55000, avg: 34000, provincias: { Madrid: 38000, Barcelona: 36000, Valencia: 30000 } },
  informatico:   { min: 22000, max: 50000, avg: 31000, provincias: { Madrid: 35000, Barcelona: 33000 } },
  enfermero:     { min: 22000, max: 38000, avg: 28000, provincias: { Madrid: 30000, Barcelona: 29000, Valencia: 27000 } },
  medico:        { min: 35000, max: 80000, avg: 52000, provincias: { Madrid: 58000, Barcelona: 55000 } },
  administrativo:{ min: 18000, max: 28000, avg: 22000, provincias: { Madrid: 24000, Barcelona: 23000, Valencia: 21000 } },
  camarero:      { min: 15000, max: 22000, avg: 18000, provincias: { Madrid: 19000, Barcelona: 18500, Valencia: 17500, "Baleares": 20000 } },
  cocinero:      { min: 16000, max: 28000, avg: 21000, provincias: { Madrid: 23000, Barcelona: 22000, "Baleares": 25000 } },
  limpieza:      { min: 14000, max: 18000, avg: 15500, provincias: { Madrid: 16000, Barcelona: 15500 } },
  conductor:     { min: 18000, max: 30000, avg: 23000, provincias: { Madrid: 25000, Barcelona: 24000, Valencia: 22000 } },
  electricista:  { min: 20000, max: 35000, avg: 26000, provincias: { Madrid: 28000, Barcelona: 27000 } },
  dependiente:   { min: 15000, max: 22000, avg: 18000, provincias: { Madrid: 19000, Barcelona: 18500 } },
  mecanico:      { min: 18000, max: 30000, avg: 23000, provincias: { Madrid: 25000, Barcelona: 24000 } },
  albanil:       { min: 17000, max: 28000, avg: 21000, provincias: { Madrid: 23000, Barcelona: 22000 } },
  almacen:       { min: 16000, max: 22000, avg: 18500, provincias: { Madrid: 19000, Barcelona: 18500 } },
  soldador:      { min: 20000, max: 32000, avg: 25000, provincias: { Madrid: 27000, "País Vasco": 29000 } },
  fontanero:     { min: 18000, max: 32000, avg: 24000, provincias: { Madrid: 26000, Barcelona: 25000 } },
  peluquero:     { min: 14000, max: 22000, avg: 17000, provincias: { Madrid: 18000, Barcelona: 17500 } },
  cuidador:      { min: 14000, max: 20000, avg: 16500, provincias: { Madrid: 17000, Barcelona: 16500 } },
  operario:      { min: 16000, max: 24000, avg: 19000, provincias: { Madrid: 20000, Barcelona: 19500 } },
  repartidor:    { min: 16000, max: 25000, avg: 20000, provincias: { Madrid: 21000, Barcelona: 20500 } },
  cajero:        { min: 15000, max: 20000, avg: 17000, provincias: { Madrid: 17500, Barcelona: 17000 } },
  vendedor:      { min: 16000, max: 30000, avg: 22000, provincias: { Madrid: 24000, Barcelona: 23000 } },
  comercial:     { min: 18000, max: 40000, avg: 27000, provincias: { Madrid: 30000, Barcelona: 28000 } },
  contable:      { min: 20000, max: 35000, avg: 26000, provincias: { Madrid: 28000, Barcelona: 27000 } },
  abogado:       { min: 22000, max: 60000, avg: 35000, provincias: { Madrid: 40000, Barcelona: 37000 } },
  arquitecto:    { min: 22000, max: 50000, avg: 32000, provincias: { Madrid: 36000, Barcelona: 34000 } },
  diseñador:     { min: 18000, max: 38000, avg: 26000, provincias: { Madrid: 28000, Barcelona: 27000 } },
  periodista:    { min: 16000, max: 30000, avg: 22000, provincias: { Madrid: 24000, Barcelona: 23000 } },
  profesor:      { min: 20000, max: 32000, avg: 25000, provincias: { Madrid: 27000, Barcelona: 26000 } },
  psicólogo:     { min: 18000, max: 35000, avg: 25000, provincias: { Madrid: 27000, Barcelona: 26000 } },
  fisioterapeuta:{ min: 18000, max: 32000, avg: 24000, provincias: { Madrid: 26000, Barcelona: 25000 } },
  farmacéutico:  { min: 22000, max: 40000, avg: 30000, provincias: { Madrid: 32000, Barcelona: 31000 } },
  ingeniero:     { min: 26000, max: 55000, avg: 38000, provincias: { Madrid: 42000, Barcelona: 40000, "País Vasco": 41000 } },
  analista:      { min: 24000, max: 48000, avg: 33000, provincias: { Madrid: 37000, Barcelona: 35000 } },
  gestor:        { min: 22000, max: 40000, avg: 29000, provincias: { Madrid: 32000, Barcelona: 30000 } },
  recepcionista: { min: 15000, max: 22000, avg: 18000, provincias: { Madrid: 19000, Barcelona: 18500 } },
  seguridad:     { min: 17000, max: 26000, avg: 21000, provincias: { Madrid: 22000, Barcelona: 21500 } },
  teleoperador:  { min: 15000, max: 22000, avg: 18000, provincias: { Madrid: 19000, Barcelona: 18500 } },
};

function getFallbackSalario(puesto: string, provincia?: string) {
  const p = puesto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const match = Object.entries(SALARIOS_REFERENCIA).find(([key]) =>
    p.includes(key) || key.includes(p.substring(0, 5))
  );
  if (!match) return null;
  const [, data] = match;
  const provAvg = provincia
    ? Object.entries(data.provincias).find(([k]) =>
        k.toLowerCase().includes(provincia.toLowerCase().substring(0, 5))
      )?.[1]
    : undefined;

  return {
    rangoGeneral: {
      min_salary: data.min,
      max_salary: data.max,
      avg_salary: data.avg,
      total: 0,
      fuente: "referencia",
    },
    porProvincia: Object.entries(data.provincias).map(([province, avg]) => ({
      province,
      count: 0,
      avg_salary: avg,
    })),
    provinciaDetalle: provAvg ? { count: 0, avg_salary: provAvg } : null,
  };
}

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

    // Helper: safe salary cast (avoids error on empty strings)
    const safeSalaryCast = `CAST(NULLIF(REGEXP_REPLACE(salary, '[^0-9]', '', 'g'), '') AS BIGINT)`;

    // Salarios por provincia
    const provinciaQuery = await pool.query(
      `SELECT province, COUNT(*) as count,
              AVG(${safeSalaryCast}) as avg_salary
       FROM "JobListing"
       WHERE "isActive" = true AND (title ILIKE $1 OR description ILIKE $1)
         AND province IS NOT NULL AND province != ''
         AND salary IS NOT NULL AND salary != '' AND salary NOT ILIKE '%ver%' AND salary NOT ILIKE '%consul%'
         AND NULLIF(REGEXP_REPLACE(salary, '[^0-9]', '', 'g'), '') IS NOT NULL
         AND ${safeSalaryCast} BETWEEN 8000 AND 200000
       GROUP BY province
       ORDER BY count DESC
       LIMIT 20`,
      [kw]
    );

    // Rango salarial general
    const rangoQuery = await pool.query(
      `SELECT
        MIN(${safeSalaryCast}) as min_salary,
        MAX(${safeSalaryCast}) as max_salary,
        AVG(${safeSalaryCast}) as avg_salary,
        COUNT(*) as total
       FROM "JobListing"
       WHERE "isActive" = true AND (title ILIKE $1 OR description ILIKE $1)
         AND salary IS NOT NULL AND salary != '' AND salary NOT ILIKE '%ver%' AND salary NOT ILIKE '%consul%'
         AND NULLIF(REGEXP_REPLACE(salary, '[^0-9]', '', 'g'), '') IS NOT NULL
         AND ${safeSalaryCast} BETWEEN 8000 AND 200000`,
      [kw]
    );

    let provinciaDetalle = null;
    if (provincia) {
      const detQuery = await pool.query(
        `SELECT COUNT(*) as count, AVG(${safeSalaryCast}) as avg_salary
         FROM "JobListing"
         WHERE "isActive" = true AND (title ILIKE $1 OR description ILIKE $1)
           AND (province ILIKE $2 OR city ILIKE $2)
           AND salary IS NOT NULL AND salary != '' AND salary NOT ILIKE '%ver%'
           AND NULLIF(REGEXP_REPLACE(salary, '[^0-9]', '', 'g'), '') IS NOT NULL
           AND ${safeSalaryCast} BETWEEN 8000 AND 200000`,
        [kw, `%${provincia}%`]
      );
      provinciaDetalle = detQuery.rows[0];
    }

    const total = parseInt(rangoQuery.rows[0]?.total ?? "0");

    // Si hay pocos datos reales en BD, completar con datos de referencia
    if (total < 5) {
      const fallback = getFallbackSalario(puesto, provincia);
      if (fallback) {
        return NextResponse.json({
          puesto,
          provincia: provincia || null,
          fuente: "referencia",
          rangoGeneral: fallback.rangoGeneral,
          porProvincia: fallback.porProvincia,
          provinciaDetalle: fallback.provinciaDetalle,
        });
      }
    }

    return NextResponse.json({
      puesto,
      provincia: provincia || null,
      fuente: total >= 5 ? "ofertas" : "referencia",
      rangoGeneral: rangoQuery.rows[0],
      porProvincia: provinciaQuery.rows,
      provinciaDetalle,
    });
  } catch (error) {
    console.error("[salarios] Error:", (error as Error).message);
    // Even on DB error, try fallback
    const fallback = getFallbackSalario(puesto, provincia);
    if (fallback) {
      return NextResponse.json({
        puesto,
        provincia: provincia || null,
        fuente: "referencia",
        ...fallback,
      });
    }
    return NextResponse.json({ error: "Error al obtener salarios" }, { status: 500 });
  }
}
