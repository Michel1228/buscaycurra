/**
 * /api/jobs/by-ids — Obtener ofertas específicas por lista de IDs
 * GET: ?ids=id1,id2,id3
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids") ?? "";

  const idList = ids.split(",").map(s => s.trim()).filter(Boolean).slice(0, 10);
  if (idList.length === 0) {
    return NextResponse.json({ ofertas: [] });
  }

  try {
    const pool = getPool();
    const placeholders = idList.map((_, i) => `$${i + 1}`).join(", ");
    const result = await pool.query<{
      id: string; title: string; company: string; city: string;
      province: string; salary: string; sourceUrl: string; sourceName: string;
    }>(
      `SELECT id, title, company, city, province, salary, "sourceUrl", "sourceName"
       FROM "JobListing"
       WHERE id IN (${placeholders}) AND "isActive" = true`,
      idList
    );

    // Devolver en el mismo orden que los IDs solicitados
    const byId = new Map(result.rows.map(r => [r.id, r]));
    const ofertas = idList
      .map(id => byId.get(id))
      .filter((j): j is NonNullable<typeof j> => j != null)
      .map(j => ({
        id: j.id,
        titulo: j.title,
        empresa: j.company || "Ver en oferta",
        ubicacion: j.city || j.province || "España",
        salario: j.salary || "Ver en oferta",
        fuente: j.sourceName || "BuscayCurra",
        url: j.sourceUrl || "#",
        descripcion: "",
        fecha: "",
      }));

    return NextResponse.json({ ofertas });
  } catch (error) {
    console.error("[jobs/by-ids] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error al obtener ofertas" }, { status: 500 });
  }
}
