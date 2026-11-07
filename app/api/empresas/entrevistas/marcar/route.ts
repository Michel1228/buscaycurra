/**
 * POST /api/empresas/entrevistas/marcar { invitacionId, marcas: boolean[][] }
 *
 * La empresa lee las respuestas y marca qué puntos ha cubierto el candidato.
 * La nota de 0 a 100 sale de esas marcas: la pone una persona, no la IA
 * (lib/entrevistas/empresa.ts). Solo con Plan Empresa.
 */
import { NextRequest, NextResponse } from "next/server";
import { getUsuario, correoSinVerificar } from "@/lib/auth-server";
import { cuentaEmpresa } from "@/lib/empresas/cuenta";
import { guardarMarcas, invitacionPorId, notaDeMarcas } from "@/lib/entrevistas/empresa";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  const usuario = await getUsuario(req);
  if (!usuario) return NextResponse.json({ error: "Entra con tu cuenta de empresa" }, { status: 401 });
  const cuenta = await cuentaEmpresa(usuario).catch(() => null);
  if (!cuenta) {
    return NextResponse.json({ error: "Esto es del Plan Empresa" }, { status: 402 });
  }
  const empresaId = cuenta.empresaId;
  const body = (await req.json().catch(() => ({}))) as { invitacionId?: string; marcas?: unknown };
  try {
    const inv = await invitacionPorId(String(body.invitacionId || ""));
    if (!inv || inv.empresa_id !== empresaId) return NextResponse.json({ error: "Esa invitación no es tuya" }, { status: 404 });
    if (!inv.respuestas) return NextResponse.json({ error: "Todavía no ha mandado sus respuestas" }, { status: 400 });
    const r = notaDeMarcas(inv.preguntas, body.marcas);
    if (!r) return NextResponse.json({ error: "Las marcas no cuadran con las preguntas" }, { status: 400 });
    await guardarMarcas(inv.id, empresaId, r.marcas, r.nota);
    return NextResponse.json({ ok: true, nota: r.nota });
  } catch (e) {
    console.error("[empresas/entrevistas/marcar]", (e as Error).message);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
}
