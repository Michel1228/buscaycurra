/**
 * GET /api/au-pair/agencias
 * Devuelve las agencias/familias Au Pair con email de la BD
 * para que el usuario pueda elegir y enviar su perfil directamente.
 */
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = getPool();
    const { rows } = await pool.query<{
      company: string;
      contact_email: string;
      country: string;
      ofertas: number;
    }>(
      `SELECT company,
              "contactEmail" as contact_email,
              COALESCE(country, 'Desconocido') as country,
              COUNT(*) as ofertas
       FROM "JobListing"
       WHERE ("contactEmail" IS NOT NULL AND "contactEmail" != '')
         AND (LOWER(title) LIKE '%au pair%' OR LOWER(title) LIKE '%aupair%')
       GROUP BY company, "contactEmail", country
       ORDER BY ofertas DESC
       LIMIT 50`
    );

    const agencias = rows.map((r) => ({
      nombre: r.company,
      email: r.contact_email,
      pais: r.country,
      ofertas: Number(r.ofertas),
    }));

    return NextResponse.json({ agencias });
  } catch (err) {
    console.error("[au-pair/agencias]", (err as Error).message);
    return NextResponse.json({ error: "Error obteniendo agencias" }, { status: 500 });
  }
}
