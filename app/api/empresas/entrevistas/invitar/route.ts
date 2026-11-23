/**
 * POST /api/empresas/entrevistas/invitar { candidatoId, entrevistaId }
 *
 * La empresa invita a un candidato visible a hacer su entrevista desde la app.
 * Al candidato le llega un aviso que se la abre (lib/entrevistas/empresa.ts). Solo para empresas verificadas (lib/empresas/verificacion.ts).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUsuario, correoSinVerificar } from "@/lib/auth-server";
import { cuentaEmpresa } from "@/lib/empresas/cuenta";
import { candidatoVisible } from "@/lib/empresas/candidatos";
import { puedeVer } from "@/lib/empresas/reglas";
import { invitar } from "@/lib/entrevistas/empresa";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  const usuario = await getUsuario(req);
  if (!usuario) return NextResponse.json({ error: "Entra con tu cuenta de empresa" }, { status: 401 });
  // La empresa verificada propia o la que le ha dado acceso: invita a nombre de la empresa.
  const cuenta = await cuentaEmpresa(usuario).catch(() => null);
  if (!cuenta) {
    return NextResponse.json({ error: "Esto es para empresas verificadas" }, { status: 402 });
  }
  const empresaId = cuenta.empresaId;
  const body = (await req.json().catch(() => ({}))) as { candidatoId?: string; entrevistaId?: string };
  const candidatoId = String(body.candidatoId || "");
  if (!UUID.test(candidatoId) || !body.entrevistaId) return NextResponse.json({ error: "Falta el candidato o la entrevista" }, { status: 400 });
  if (candidatoId === usuario.id) return NextResponse.json({ error: "No puedes invitarte a ti mismo." }, { status: 400 });

  try {
    // Solo a quien la empresa puede ver: visible y de su sector (las ETT y agencias, de todos).
    const ficha = await candidatoVisible(candidatoId);
    if (!ficha) return NextResponse.json({ error: "Este candidato ya no está visible para empresas." }, { status: 404 });
    if (!puedeVer(cuenta.alcance, ficha.sectores)) return NextResponse.json({ error: "Este candidato no es de vuestro sector." }, { status: 403 });
    const r = await invitar(empresaId, candidatoId, String(body.entrevistaId));
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    // Un aviso por invitación: volver a pulsar no le escribe otra vez.
    if (r.nueva) {
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      await sb.from("notificaciones").insert({
        user_id: candidatoId, tipo: "entrevista_empresa", leida: false,
        titulo: `${r.empresa} te invita a su entrevista`,
        mensaje: `Para el puesto de ${r.puesto}. Hazla desde la app cuando quieras, hablando o escribiendo.`,
        datos: { url: `/app/entrevistas/empresa/${r.id}` },
      });
    }
    return NextResponse.json({ ok: true, id: r.id, nueva: r.nueva });
  } catch (e) {
    console.error("[empresas/entrevistas/invitar]", (e as Error).message);
    return NextResponse.json({ error: "No se pudo invitar" }, { status: 500 });
  }
}
