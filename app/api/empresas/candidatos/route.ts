// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getUsuario, correoSinVerificar } from "@/lib/auth-server";
import { asegurarTablasReferencias } from "@/lib/referencias/referencias";
import { cuentaEmpresa, cupoDelMes, yaAbiertos } from "@/lib/empresas/cuenta";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  // Autenticación obligatoria
  const usuario = await getUsuario(req);
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ciudad = searchParams.get("ciudad") || "";
  const keyword = searchParams.get("q") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 24;
  const offset = (page - 1) * limit;

  // Plan Empresa: el suyo o el de la empresa que le ha dado acceso (lib/empresas/cuenta.ts).
  const cuenta = await cuentaEmpresa(usuario).catch(() => null);
  const esEmpresa = !!cuenta;

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

    // Quien tiene una carta confirmada por quien la firmó sale antes (lib/referencias).
    await asegurarTablasReferencias();
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
         COALESCE(rv.n, 0) AS referencias,
         COUNT(*) OVER() AS total
       FROM (
         SELECT DISTINCT ON (user_id) * FROM user_cvs
         ORDER BY user_id, updated_at DESC
       ) uc
       LEFT JOIN (
         SELECT user_id, count(*)::int AS n FROM referencia_laboral WHERE estado = 'verificada' GROUP BY user_id
       ) rv ON rv.user_id = uc.user_id::text
       WHERE ${conds.join(" AND ")}
       ORDER BY COALESCE(rv.n, 0) > 0 DESC, uc.updated_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    // Solo una cuenta con Plan Empresa ve quién es cada candidato: nombre,
    // contacto y el enlace a su CV. Los demás ven la ficha sin nombre (puesto,
    // ciudad y aptitudes), para que una empresa sepa que hay gente antes de
    // pagar, y sin el identificador que abre el CV completo.
    //
    // EL CONTACTO, SOLO DE LOS YA ABIERTOS (4 nov 2026). Abrir uno gasta cupo
    // del mes (/talento/[id]); si la lista diera el correo y el teléfono de
    // todos, el cupo no serviría de nada.
    const abiertos = cuenta ? await yaAbiertos(cuenta.empresaId, result.rows.map((r) => String(r.user_id))) : new Set<string>();
    const candidatos = result.rows.map((row, i) => {
      const abierto = abiertos.has(String(row.user_id));
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
        email: abierto ? (row.email || null) : null,
        telefono: abierto ? (row.telefono || null) : null,
        abierto,
        // Cuántas cartas tiene confirmadas: no dice quién es, lo ve cualquiera.
        referencias: Number(row.referencias) || 0,
        updatedAt: row.updated_at,
      };
    });

    const total = result.rows.length > 0 ? Number(result.rows[0].total) : 0;
    const cupo = cuenta ? await cupoDelMes(cuenta.empresaId) : null;
    return NextResponse.json({ candidatos, esEmpresa, titular: !!cuenta?.titular, cupo, pagina: page, total });
  } catch (error) {
    console.error("[empresas/candidatos] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
