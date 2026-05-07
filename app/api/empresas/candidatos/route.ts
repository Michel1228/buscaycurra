import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getUserPlan } from "@/lib/cv-sender/rate-limiter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ciudad = searchParams.get("ciudad") || "";
  const keyword = searchParams.get("q") || "";
  const userId = searchParams.get("userId") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 24;
  const offset = (page - 1) * limit;

  let esEmpresa = false;
  if (userId) {
    try {
      const plan = await getUserPlan(userId);
      esEmpresa = plan === "empresa";
    } catch { /* tratar como free */ }
  }

  try {
    const pool = getPool();
    const params: (string | number)[] = [];
    let idx = 1;
    const conds: string[] = [
      "uc.form_data IS NOT NULL",
      "uc.form_data::text != '{}'",
      "uc.form_data::text != 'null'",
    ];

    if (ciudad.trim()) {
      conds.push(`LOWER(uc.form_data->>'ciudad') LIKE LOWER($${idx})`);
      params.push(`%${ciudad.trim()}%`);
      idx++;
    }
    if (keyword.trim()) {
      conds.push(`(
        LOWER(COALESCE(uc.form_data->>'aptitudes','')) LIKE LOWER($${idx}) OR
        LOWER(COALESCE(uc.form_data->>'subtitulo','')) LIKE LOWER($${idx}) OR
        LOWER(uc.form_data::text) LIKE LOWER($${idx})
      )`);
      params.push(`%${keyword.trim()}%`);
      idx++;
    }

    params.push(limit, offset);
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT
         uc.user_id,
         uc.form_data->>'nombre'    AS nombre,
         uc.form_data->>'ciudad'    AS ciudad,
         uc.form_data->>'subtitulo' AS puesto,
         uc.form_data->>'aptitudes' AS aptitudes,
         uc.form_data->'experiencia' AS experiencia,
         uc.form_data->>'email'     AS email,
         uc.form_data->>'telefono'  AS telefono,
         uc.updated_at
       FROM user_cvs uc
       ${where}
       ORDER BY uc.updated_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    const candidatos = result.rows.map(row => {
      const nombre: string = row.nombre || "Candidato";
      const partes = nombre.trim().split(" ");
      const nombrePublico = partes[0] + (partes[1] ? " " + partes[1][0] + "." : "");

      let aptitudesArr: string[] = [];
      if (typeof row.aptitudes === "string" && row.aptitudes) {
        aptitudesArr = row.aptitudes.split(",").map((s: string) => s.trim()).filter(Boolean).slice(0, 4);
      } else if (Array.isArray(row.aptitudes)) {
        aptitudesArr = (row.aptitudes as string[]).slice(0, 4);
      }

      let ultimoPuesto = row.puesto || "";
      if (!ultimoPuesto && Array.isArray(row.experiencia) && row.experiencia.length > 0) {
        ultimoPuesto = (row.experiencia[0] as { puesto?: string }).puesto || "";
      }

      return {
        id: row.user_id,
        nombre: esEmpresa ? nombre : nombrePublico,
        ciudad: row.ciudad || "España",
        puesto: ultimoPuesto,
        aptitudes: aptitudesArr,
        email: esEmpresa ? (row.email || null) : null,
        telefono: esEmpresa ? (row.telefono || null) : null,
        updatedAt: row.updated_at,
      };
    });

    return NextResponse.json({ candidatos, esEmpresa, pagina: page });
  } catch (error) {
    console.error("[empresas/candidatos] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
