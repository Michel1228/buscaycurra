/**
 * POST /api/empresas/entrevistas/invitar { candidatoId, entrevistaId }
 *
 * «Me interesa»: la empresa invita a un candidato visible a preparar su
 * entrevista. Al candidato le llega un aviso en la app que le abre el ensayo
 * de esa empresa (lib/entrevistas/empresa.ts). Solo con Plan Empresa.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUsuario } from "@/lib/auth-server";
import { cuentaEmpresa } from "@/lib/empresas/cuenta";
import { invitar } from "@/lib/entrevistas/empresa";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const usuario = await getUsuario(req);
  if (!usuario) return NextResponse.json({ error: "Entra con tu cuenta de empresa" }, { status: 401 });
  // Plan Empresa propio o el de la empresa que le ha dado acceso: invita a nombre de la empresa.
  const cuenta = await cuentaEmpresa(usuario).catch(() => null);
  if (!cuenta) {
    return NextResponse.json({ error: "Esto es del Plan Empresa" }, { status: 402 });
  }
  const empresaId = cuenta.empresaId;
  const body = (await req.json().catch(() => ({}))) as { candidatoId?: string; entrevistaId?: string };
  const candidatoId = String(body.candidatoId || "");
  if (!UUID.test(candidatoId) || !body.entrevistaId) return NextResponse.json({ error: "Falta el candidato o la entrevista" }, { status: 400 });
  if (candidatoId === usuario.id) return NextResponse.json({ error: "No puedes invitarte a ti mismo." }, { status: 400 });

  try {
    const r = await invitar(empresaId, candidatoId, String(body.entrevistaId));
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    // Un aviso por invitación: volver a pulsar no le escribe otra vez.
    if (r.nueva) {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      await sb.from("notificaciones").insert({
        user_id: candidatoId, tipo: "entrevista_empresa", leida: false,
        titulo: `${r.empresa} se ha interesado por tu perfil`,
        mensaje: `Te invita a preparar su entrevista de ${r.puesto}. Ensaya con sus preguntas: tus ensayos son solo para ti, y tú decides si les mandas tus respuestas.`,
        datos: { url: `/app/entrevistas/empresa/${r.id}` },
      });
    }
    return NextResponse.json({ ok: true, id: r.id, nueva: r.nueva });
  } catch (e) {
    console.error("[empresas/entrevistas/invitar]", (e as Error).message);
    return NextResponse.json({ error: "No se pudo invitar" }, { status: 500 });
  }
}
