/**
 * /api/entrevistas/empresa — Las entrevistas a las que me han invitado las empresas
 * (lib/entrevistas/empresa.ts).
 *
 * GET           → { invitaciones } (las mías)
 * GET ?id=      → { invitacion } (una)
 * DELETE ?id=   → quitarla, con las respuestas que hubiera mandado
 *
 * Al candidato no se le devuelven las marcas ni la nota que pone la empresa:
 * son su forma de valorar. Si las pide, se le dan como cualquier dato suyo.
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserId, correoSinVerificar } from "@/lib/auth-server";
import { invitacionPorId, invitacionesDeCandidato, quitarInvitacion, type Invitacion } from "@/lib/entrevistas/empresa";

export const dynamic = "force-dynamic";

const paraElCandidato = (i: Invitacion) => ({
  id: i.id, empresa: i.empresa, puesto: i.puesto, preguntas: i.preguntas,
  intentos: i.intentos, respuestas: i.respuestas, enviadaEn: i.enviada_en, creado: i.creado,
  leida: i.marcas !== null,
});

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Entra para ver tus entrevistas" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  try {
    if (id) {
      const inv = await invitacionPorId(id);
      if (!inv || inv.user_id !== userId) return NextResponse.json({ error: "Esta invitación no está" }, { status: 404 });
      return NextResponse.json({ invitacion: paraElCandidato(inv) });
    }
    return NextResponse.json({ invitaciones: (await invitacionesDeCandidato(userId)).map(paraElCandidato) });
  } catch (e) {
    console.error("[entrevistas/empresa] GET:", (e as Error).message);
    return NextResponse.json({ error: "No se pudo leer" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") || "";
  try {
    if (!(await quitarInvitacion(id, userId))) return NextResponse.json({ error: "Esta invitación no está" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[entrevistas/empresa] DELETE:", (e as Error).message);
    return NextResponse.json({ error: "No se pudo quitar" }, { status: 500 });
  }
}
