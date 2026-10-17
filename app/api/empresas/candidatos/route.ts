// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getUserPlan } from "@/lib/cv-sender/rate-limiter";
import { getUserId } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Autenticación obligatoria
  const authUserId = await getUserId(req);
  if (!authUserId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ciudad = searchParams.get("ciudad") || "";
  const keyword = searchParams.get("q") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 24;
  const offset = (page - 1) * limit;

  // Verificar si el usuario autenticado tiene plan empresa
  let esEmpresa = false;
  try {
    const plan = await getUserPlan(authUserId);
    esEmpresa = plan === "empresa";
  } catch { /* tratar como free */ }

  // LA VISIBILIDAD SE LEE DE user_cvs, QUE ES DONDE LA GUARDA EL CV.
  //
  // Desde el 14 may 2026 el interruptor "Visible para empresas" escribe en
  // user_cvs.visible_empresas (nuestra base de datos). Este portal seguía
  // preguntando a Supabase por profiles.visible_empresas, una columna que no
  // existe: la consulta fallaba sin avisar y las empresas veían siempre 0
  // candidatos. Comprobado el 17 oct 2026 con 16 personas que lo habían activado.
  try {
    const pool = getPool();
    const params: (string | number)[] = [];
    let idx = 1;
    const conds: string[] = [
      "uc.visible_empresas = true",
      "uc.form_data IS NOT NULL",
      "COALESCE(uc.form_data->>'nombre', '') <> ''",
    ];

    if (ciudad.trim()) {
      conds.push(`LOWER(uc.form_data->>'ciudad') LIKE LOWER($${idx})`);
      params.push(`%${ciudad.trim()}%`);
      idx++;
    }
    if (keyword.trim()) {
      // Se busca en lo profesional, nunca en el contacto: si no, quien no es
      // empresa podría escribir un correo o un teléfono y saber si esa persona
      // está buscando trabajo.
      conds.push(`(uc.form_data - 'email' - 'telefono' - 'nombre' - 'apellidos' - 'fotoUrl')::text ILIKE $${idx}`);
      params.push(`%${keyword.trim()}%`);
      idx++;
    }

    params.push(limit, offset);

    const result = await pool.query(
      `SELECT
         uc.user_id,
         uc.form_data->>'nombre'    AS nombre,
         uc.form_data->>'apellidos' AS apellidos,
         uc.form_data->>'ciudad'    AS ciudad,
         uc.form_data->>'subtitulo' AS puesto,
         uc.form_data->>'aptitudes' AS aptitudes,
         uc.form_data->'experiencia' AS experiencia,
         uc.form_data->>'email'     AS email,
         uc.form_data->>'telefono'  AS telefono,
         uc.updated_at,
         COUNT(*) OVER() AS total
       FROM (
         SELECT DISTINCT ON (user_id) * FROM user_cvs
         ORDER BY user_id, updated_at DESC
       ) uc
       WHERE ${conds.join(" AND ")}
       ORDER BY uc.updated_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    // Solo una cuenta con Plan Empresa ve quién es cada candidato: nombre,
    // contacto y el enlace a su CV. Los demás ven la ficha sin nombre (puesto,
    // ciudad y aptitudes), para que una empresa sepa que hay gente antes de
    // pagar, y sin el identificador que abre el CV completo.
    const candidatos = result.rows.map((row, i) => {
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
        id: esEmpresa ? row.user_id : String(offset + i),
        nombre: esEmpresa ? [row.nombre, row.apellidos].filter(Boolean).join(" ").trim() : "Candidato",
        ciudad: row.ciudad || "España",
        puesto: ultimoPuesto,
        aptitudes: aptitudesArr,
        email: esEmpresa ? (row.email || null) : null,
        telefono: esEmpresa ? (row.telefono || null) : null,
        updatedAt: row.updated_at,
      };
    });

    const total = result.rows.length > 0 ? Number(result.rows[0].total) : 0;
    return NextResponse.json({ candidatos, esEmpresa, pagina: page, total });
  } catch (error) {
    console.error("[empresas/candidatos] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
