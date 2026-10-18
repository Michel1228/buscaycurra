/**
 * GET /api/ofertas/resumen?id= — Título, empresa y ciudad de una oferta viva.
 *
 * Para el registro que viene de una ficha de oferta (18 oct 2026): "Vas a
 * enviar tu CV a Flying Tiger Copenhagen". Es lo mismo que enseña la ficha
 * pública, sin nada más. Sin sesión.
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { empresaParaGoogle } from "@/lib/seo/job-posting";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^[a-z0-9]{8,40}$/i.test(id)) return NextResponse.json({ error: "id no válido" }, { status: 400 });
  try {
    const { rows } = await getPool().query(
      `SELECT title, company, city FROM "JobListing"
        WHERE id = $1 AND "isActive" AND ("expiresAt" > NOW() OR "expiresAt" IS NULL)`,
      [id]
    );
    if (!rows[0]) return NextResponse.json({ error: "no está" }, { status: 404 });
    return NextResponse.json(
      { titulo: rows[0].title, empresa: empresaParaGoogle(rows[0].company), ciudad: (rows[0].city || "").split(",")[0].trim() || null },
      { headers: { "Cache-Control": "public, max-age=600" } }
    );
  } catch {
    return NextResponse.json({ error: "no disponible" }, { status: 503 });
  }
}
