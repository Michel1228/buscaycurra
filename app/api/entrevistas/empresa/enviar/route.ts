/**
 * POST /api/entrevistas/empresa/enviar { id, respuestas: string[] }
 *
 * El candidato manda a la empresa sus respuestas, cuando él quiere. Solo el
 * texto: ninguna nota de la IA (lib/entrevistas/empresa.ts). A la empresa le
 * llega un aviso en la app para que las lea y las valore una persona.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserId, correoSinVerificar } from "@/lib/auth-server";
import { getPool } from "@/lib/db";
import { invitacionPorId, mandarRespuestas } from "@/lib/entrevistas/empresa";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { id?: string; respuestas?: unknown };
  try {
    const inv = await invitacionPorId(String(body.id || ""));
    if (!inv || inv.user_id !== userId) return NextResponse.json({ error: "Esta invitación no está" }, { status: 404 });
    const respuestas = Array.isArray(body.respuestas) ? body.respuestas.map((r) => String(r ?? "").trim().slice(0, 1500)) : [];
    if (respuestas.length !== inv.preguntas.length || respuestas.some((r) => r.length < 2)) {
      return NextResponse.json({ error: "Contesta todas las preguntas antes de mandarlas." }, { status: 400 });
    }
    await mandarRespuestas(inv.id, userId, respuestas);

    const { rows } = await getPool().query(
      "SELECT form_data->>'nombre' AS nombre FROM user_cvs WHERE user_id::text = $1 ORDER BY updated_at DESC LIMIT 1", [userId]
    );
    const quien = String(rows[0]?.nombre || "").trim().split(" ")[0] || "Un candidato";
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await sb.from("notificaciones").insert({
      user_id: inv.empresa_id, tipo: "entrevista_respuestas", leida: false,
      titulo: `${quien} ha mandado sus respuestas`,
      mensaje: `Para tu entrevista de ${inv.puesto}. Léelas y marca lo que ha cubierto.`,
      datos: { url: "/empresas/entrevistas" },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[entrevistas/empresa/enviar]", (e as Error).message);
    return NextResponse.json({ error: "No se pudieron mandar. Inténtalo de nuevo." }, { status: 500 });
  }
}
