/**
 * POST /api/empresas/activar { codigo } — Meter el código que llegó al correo de la empresa.
 *
 * Con él la empresa queda activa y entra a los candidatos de su alcance
 * (lib/empresas/verificacion.ts). Vale solo para la cuenta que la dio de alta.
 */
import { NextRequest, NextResponse } from "next/server";
import { getUsuario, correoSinVerificar } from "@/lib/auth-server";
import { activarConCodigo, paraLaEmpresa } from "@/lib/empresas/verificacion";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  const usuario = await getUsuario(req);
  if (!usuario) return NextResponse.json({ error: "Entra con tu cuenta" }, { status: 401 });
  const { codigo } = (await req.json().catch(() => ({}))) as { codigo?: string };
  if (!codigo || String(codigo).length > 40) return NextResponse.json({ error: "Escribe el código que os llegó al correo." }, { status: 400 });
  try {
    const r = await activarConCodigo(usuario.id, String(codigo));
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, solicitud: paraLaEmpresa(r.solicitud) });
  } catch (e) {
    console.error("[empresas/activar]:", (e as Error).message);
    return NextResponse.json({ error: "No se pudo comprobar el código" }, { status: 500 });
  }
}
