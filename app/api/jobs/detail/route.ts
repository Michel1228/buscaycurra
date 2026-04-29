/**
 * /api/jobs/detail — Detalle de una oferta por ID
 * GET: ?id=jobId
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, title, company, city, province, salary, description, "sourceUrl", "sourceName", "scrapedAt"
       FROM "JobListing" WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Oferta no encontrada" }, { status: 404 });
    }

    const j = result.rows[0];
    return NextResponse.json({
      oferta: {
        id: j.id,
        titulo: j.title,
        empresa: j.company || "Ver en oferta",
        ubicacion: j.city || j.province || "España",
        salario: j.salary || "Ver en oferta",
        descripcion: (j.description || "").slice(0, 200),
        fuente: j.sourceName || "BuscayCurra",
        url: j.sourceUrl || "#",
        match: 85,
      },
    });
  } catch (error) {
    console.error("[jobs/detail] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error al obtener oferta" }, { status: 500 });
  }
}
