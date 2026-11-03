/**
 * /api/empresas/entrevistas — Las entrevistas de una empresa y quién las ha preparado
 * (lib/entrevistas/empresa.ts). Solo con Plan Empresa.
 *
 * GET                                       → { entrevistas, invitaciones }
 * POST { id?, empresa, puesto, preguntas }  → guardar una entrevista
 * DELETE ?id=                               → quitarla (las invitaciones ya hechas guardan su copia)
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-server";
import { getPool } from "@/lib/db";
import { getUserPlan } from "@/lib/cv-sender/rate-limiter";
import { entrevistasDe, guardarEntrevista, invitacionesDeEmpresa, quitarEntrevista, validarPreguntas } from "@/lib/entrevistas/empresa";
import { asegurarTablasReferencias } from "@/lib/referencias/referencias";

export const dynamic = "force-dynamic";

const error = (mensaje: string, status = 400) => NextResponse.json({ error: mensaje }, { status });

async function empresa(req: NextRequest): Promise<string | NextResponse> {
  const id = await getUserId(req);
  if (!id) return error("Entra con tu cuenta de empresa", 401);
  if ((await getUserPlan(id).catch(() => "free")) !== "empresa") return error("Esto es del Plan Empresa", 402);
  return id;
}

export async function GET(req: NextRequest) {
  const id = await empresa(req);
  if (typeof id !== "string") return id;
  try {
    const [entrevistas, invitaciones] = await Promise.all([entrevistasDe(id), invitacionesDeEmpresa(id)]);
    // Quién es cada candidato y si tiene referencias confirmadas (sello aparte, no suma a la nota).
    const ids = [...new Set(invitaciones.map((i) => i.user_id))];
    const datos = new Map<string, { nombre: string; ciudad: string; referencias: number }>();
    if (ids.length) {
      await asegurarTablasReferencias();
      const { rows } = await getPool().query(
        `SELECT uc.user_id::text AS id,
                trim(concat_ws(' ', uc.form_data->>'nombre', uc.form_data->>'apellidos')) AS nombre,
                uc.form_data->>'ciudad' AS ciudad,
                (SELECT count(*)::int FROM referencia_laboral r WHERE r.user_id = uc.user_id::text AND r.estado = 'verificada') AS referencias
           FROM (SELECT DISTINCT ON (user_id) * FROM user_cvs WHERE user_id::text = ANY($1) ORDER BY user_id, updated_at DESC) uc`,
        [ids]
      );
      for (const r of rows) datos.set(r.id, { nombre: r.nombre || "Candidato", ciudad: r.ciudad || "", referencias: r.referencias });
    }
    return NextResponse.json({
      entrevistas,
      invitaciones: invitaciones.map((i) => ({
        id: i.id, candidatoId: i.user_id, empresa: i.empresa, puesto: i.puesto, preguntas: i.preguntas,
        intentos: i.intentos, respuestas: i.respuestas, enviadaEn: i.enviada_en, marcas: i.marcas, nota: i.nota, creado: i.creado,
        ...(datos.get(i.user_id) ?? { nombre: "Candidato", ciudad: "", referencias: 0 }),
      })),
    });
  } catch (e) {
    console.error("[empresas/entrevistas] GET:", (e as Error).message);
    return error("No se pudieron leer tus entrevistas", 500);
  }
}

export async function POST(req: NextRequest) {
  const id = await empresa(req);
  if (typeof id !== "string") return id;
  const body = (await req.json().catch(() => ({}))) as { id?: string; empresa?: string; puesto?: string; preguntas?: unknown };
  const nombre = String(body.empresa || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const puesto = String(body.puesto || "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!nombre || !puesto) return error("Pon el nombre de la empresa y el puesto.");
  const v = validarPreguntas(body.preguntas);
  if (!v.ok) return error(v.error);
  try {
    const guardada = await guardarEntrevista(id, { id: body.id, empresa: nombre, puesto, preguntas: v.preguntas });
    return NextResponse.json({ ok: true, id: guardada, entrevistas: await entrevistasDe(id) });
  } catch (e) {
    console.error("[empresas/entrevistas] POST:", (e as Error).message);
    return error("No se pudo guardar", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const id = await empresa(req);
  if (typeof id !== "string") return id;
  const cual = new URL(req.url).searchParams.get("id") || "";
  try {
    if (!(await quitarEntrevista(id, cual))) return error("Esa entrevista no está", 404);
    return NextResponse.json({ ok: true, entrevistas: await entrevistasDe(id) });
  } catch (e) {
    console.error("[empresas/entrevistas] DELETE:", (e as Error).message);
    return error("No se pudo quitar", 500);
  }
}
