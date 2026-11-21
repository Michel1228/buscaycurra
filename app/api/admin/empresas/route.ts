/**
 * /api/admin/empresas — El visto bueno de Michel a las empresas que piden ver candidatos.
 *
 * GET                                   → { solicitudes }
 * POST { id, accion: "aprobar" }         → genera el código y lo manda al correo de la empresa
 *      { id, accion: "reenviar" }        → código nuevo (el anterior deja de valer)
 *      { id, accion: "rechazar" | "suspender", motivo }
 *
 * Solo ADMIN_EMAILS con el correo verificado, o la cabecera x-admin-secret para
 * scripts. Aquí no entran quienes reciben el resumen diario: el panel de
 * cifras es para leer, y esto decide quién ve los datos de los candidatos.
 */
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getUsuario } from "@/lib/auth-server";
import { DIAS_CODIGO, aprobar, cerrar, listarSolicitudes } from "@/lib/empresas/verificacion";
import { sendCodigoEmpresaEmail, sendRechazoEmpresaEmail } from "@/lib/email/smtp-sender";

export const dynamic = "force-dynamic";

const iguales = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

async function administrador(req: NextRequest): Promise<string | null> {
  const secreto = req.headers.get("x-admin-secret");
  if (secreto && process.env.ADMIN_SECRET && iguales(secreto, process.env.ADMIN_SECRET)) return "script";
  const admins = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const u = await getUsuario(req);
  return u?.confirmado && u.email && admins.includes(u.email.toLowerCase()) ? u.email : null;
}

export async function GET(req: NextRequest) {
  if (!(await administrador(req))) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    return NextResponse.json({ solicitudes: await listarSolicitudes() });
  } catch (e) {
    console.error("[admin/empresas] GET:", (e as Error).message);
    return NextResponse.json({ error: "No se pudieron leer" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await administrador(req);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id, accion, motivo } = (await req.json().catch(() => ({}))) as { id?: string; accion?: string; motivo?: string };
  if (!id || !accion) return NextResponse.json({ error: "Falta la solicitud o la acción" }, { status: 400 });
  try {
    if (accion === "aprobar" || accion === "reenviar") {
      const r = await aprobar(id, admin);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 409 });
      const enviado = await sendCodigoEmpresaEmail({
        to: r.solicitud.correo_empresa, razonSocial: r.solicitud.razon_social, codigo: r.codigo,
        enlace: "https://buscaycurra.es/empresas/alta", dias: DIAS_CODIGO,
      });
      // El código no vuelve en la respuesta: solo lo tiene el correo de la empresa.
      return NextResponse.json({ ok: true, enviado, solicitudes: await listarSolicitudes() });
    }
    if (accion === "rechazar" || accion === "suspender") {
      const s = await cerrar(id, admin, accion, String(motivo || ""));
      if (!s) return NextResponse.json({ error: "Esa solicitud no se puede cambiar así" }, { status: 409 });
      if (accion === "rechazar") {
        await sendRechazoEmpresaEmail({ to: s.email_cuenta, razonSocial: s.razon_social, motivo: s.motivo, enlace: "https://buscaycurra.es/empresas/alta" }).catch(() => false);
      }
      return NextResponse.json({ ok: true, solicitudes: await listarSolicitudes() });
    }
    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (e) {
    console.error("[admin/empresas] POST:", (e as Error).message);
    return NextResponse.json({ error: "No se pudo hacer" }, { status: 500 });
  }
}
