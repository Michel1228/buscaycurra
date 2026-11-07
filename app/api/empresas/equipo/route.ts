/**
 * /api/empresas/equipo — Quién de la empresa tiene acceso, y el cupo del mes
 * (lib/empresas/cuenta.ts). Añadir y quitar personas solo puede quien paga.
 *
 * GET                → { titular, miembros, usuarios: { usados, maximo }, cupo }
 * POST { email }     → dar acceso a alguien de la empresa
 * DELETE ?email=     → quitárselo
 */
import { NextRequest, NextResponse } from "next/server";
import { getUsuario, correoSinVerificar } from "@/lib/auth-server";
import { LIMITES_EMPRESA } from "@/lib/plan-limits";
import { anadirMiembro, cuentaEmpresa, cupoDelMes, miembrosDe, quitarMiembro, type CuentaEmpresa } from "@/lib/empresas/cuenta";

export const dynamic = "force-dynamic";

const error = (mensaje: string, status = 400) => NextResponse.json({ error: mensaje }, { status });

async function quien(req: NextRequest): Promise<{ cuenta: CuentaEmpresa; email: string } | NextResponse> {
  const usuario = await getUsuario(req);
  if (!usuario) return error("Entra con tu cuenta de empresa", 401);
  const cuenta = await cuentaEmpresa(usuario).catch(() => null);
  if (!cuenta) return error("Esto es del Plan Empresa", 402);
  return { cuenta, email: usuario.email };
}

async function estado(cuenta: CuentaEmpresa) {
  // A quien no paga no se le enseñan los correos de los demás: solo el cupo.
  const miembros = cuenta.titular ? await miembrosDe(cuenta.empresaId) : [];
  const usados = cuenta.titular ? 1 + miembros.length : null;
  return {
    titular: cuenta.titular,
    miembros,
    usuarios: { usados, maximo: LIMITES_EMPRESA.usuarios },
    cupo: await cupoDelMes(cuenta.empresaId),
  };
}

export async function GET(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  const q = await quien(req);
  if (q instanceof NextResponse) return q;
  try {
    return NextResponse.json(await estado(q.cuenta));
  } catch (e) {
    console.error("[empresas/equipo] GET:", (e as Error).message);
    return error("No se pudo leer tu equipo", 500);
  }
}

export async function POST(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  const q = await quien(req);
  if (q instanceof NextResponse) return q;
  if (!q.cuenta.titular) return error("Solo quien paga el Plan Empresa puede añadir personas.", 403);
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  try {
    const r = await anadirMiembro(q.cuenta.empresaId, q.email, String(body.email || ""));
    if (!r.ok) return error(r.error);
    return NextResponse.json({ ok: true, ...(await estado(q.cuenta)) });
  } catch (e) {
    console.error("[empresas/equipo] POST:", (e as Error).message);
    return error("No se pudo añadir", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  const q = await quien(req);
  if (q instanceof NextResponse) return q;
  if (!q.cuenta.titular) return error("Solo quien paga el Plan Empresa puede quitar personas.", 403);
  const email = new URL(req.url).searchParams.get("email") || "";
  try {
    if (!(await quitarMiembro(q.cuenta.empresaId, email))) return error("Esa persona no está en tu equipo", 404);
    return NextResponse.json({ ok: true, ...(await estado(q.cuenta)) });
  } catch (e) {
    console.error("[empresas/equipo] DELETE:", (e as Error).message);
    return error("No se pudo quitar", 500);
  }
}
