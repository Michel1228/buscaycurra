/**
 * /api/empresas/alta — Dar de alta una empresa para ver candidatos (lib/empresas/verificacion.ts).
 *
 * GET  → { solicitud | null, equipo }  cómo va la suya (o si entra por el equipo de otra)
 * POST { razonSocial, nif, tipo, autorizacion?, sectores, busca?, provincia?, web?, correoEmpresa, telefono? }
 *      → la deja pendiente y avisa a Michel con dónde comprobarla.
 *
 * Hace falta tener el correo de la cuenta verificado: sin eso, el correo no
 * prueba quién es (lib/auth/correo-verificado.ts).
 */
import { NextRequest, NextResponse } from "next/server";
import { getUsuario, correoSinVerificar } from "@/lib/auth-server";
import { cuentaEmpresa } from "@/lib/empresas/cuenta";
import { guardarSolicitud, paraLaEmpresa, solicitudDe, validarAlta, type Solicitud } from "@/lib/empresas/verificacion";
import { SECTORES_EMPRESA, TIPOS_ENTIDAD, nifDeAutonomo } from "@/lib/empresas/reglas";
import { esBuzonPublico } from "@/lib/job-search/correo-oferta";
import { sendAltaEmpresaAdminEmail } from "@/lib/email/smtp-sender";

export const dynamic = "force-dynamic";

const error = (mensaje: string, status = 400) => NextResponse.json({ error: mensaje }, { status });

/** Dónde puede comprobar Michel cada tipo de entidad (registros públicos y gratuitos). */
function dondeComprobar(s: Solicitud): { nombre: string; url: string }[] {
  const enlaces = [{ nombre: `Buscar el NIF ${s.nif} en internet`, url: `https://www.google.com/search?q=${encodeURIComponent(`"${s.nif}"`)}` }];
  if (s.tipo === "ett") {
    enlaces.push(
      { nombre: "ETT autorizadas: consulta por NIF (Comunidad de Madrid)", url: "https://www.comunidad.madrid/empleo/empresas-trabajo-temporal-ett" },
      { nombre: "ETT autorizadas en toda España (relación de la Xunta)", url: "https://emprego.xunta.gal/es/las-empresas-de-trabajo-temporal-ett" },
    );
  }
  if (s.tipo === "agencia") {
    enlaces.push({ nombre: "Listado oficial de agencias de colocación (Sistema Nacional de Empleo)", url: "https://www.sistemanacionalempleo.es/AgenciasColocacion_WEB/listadoAgencias.do?modo=inicio" });
  }
  if (s.web) enlaces.push({ nombre: `Su web: ${s.web}`, url: /^https?:\/\//.test(s.web) ? s.web : `https://${s.web}` });
  return enlaces;
}

export async function GET(req: NextRequest) {
  const usuario = await getUsuario(req);
  if (!usuario) return error("Entra con tu cuenta", 401);
  try {
    const [s, cuenta] = await Promise.all([solicitudDe(usuario.id), cuentaEmpresa(usuario).catch(() => null)]);
    return NextResponse.json({
      solicitud: paraLaEmpresa(s),
      // Quien entra por el equipo de otra empresa no necesita darse de alta.
      equipo: cuenta && !cuenta.titular ? { razonSocial: cuenta.razonSocial } : null,
      correoVerificado: !!usuario.confirmado,
      tipos: TIPOS_ENTIDAD, sectores: SECTORES_EMPRESA,
    });
  } catch (e) {
    console.error("[empresas/alta] GET:", (e as Error).message);
    return error("No se pudo leer", 500);
  }
}

export async function POST(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  const usuario = await getUsuario(req);
  if (!usuario) return error("Entra con tu cuenta", 401);
  const v = validarAlta((await req.json().catch(() => ({}))) as Record<string, unknown>);
  if (!v.ok) return error(v.error);
  try {
    const r = await guardarSolicitud(usuario.id, usuario.email, v.datos);
    if (!r.ok) return error(r.error, 409);
    const s = r.solicitud;

    // A Michel (ADMIN_EMAILS), con lo que hay que mirar. Si falla el correo, la solicitud queda igual en el panel.
    const admins = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").split(",").map((x) => x.trim()).filter(Boolean);
    const avisos: string[] = [];
    if (esBuzonPublico(s.correo_empresa)) avisos.push("correo genérico (Gmail, Hotmail…), no de la empresa");
    if (nifDeAutonomo(s.nif)) avisos.push("NIF de persona (autónomo)");
    const tipo = TIPOS_ENTIDAD.find((t) => t.id === s.tipo)?.label || s.tipo;
    const sectores = s.tipo === "empresa"
      ? s.sectores.map((x) => SECTORES_EMPRESA.find((y) => y.id === x)?.label || x).join(", ")
      : "todos (ETT o agencia)";
    await Promise.all(admins.map((to) => sendAltaEmpresaAdminEmail({
      to, razonSocial: s.razon_social, nif: s.nif, tipo: avisos.length ? `${tipo} · ojo: ${avisos.join("; ")}` : tipo,
      autorizacion: s.autorizacion, sectores, correoEmpresa: s.correo_empresa, correoCuenta: s.email_cuenta, web: s.web,
      enlacePanel: "https://buscaycurra.es/app/admin/empresas", comprobar: dondeComprobar(s),
    }).catch(() => false)));

    return NextResponse.json({ ok: true, solicitud: paraLaEmpresa(s) });
  } catch (e) {
    console.error("[empresas/alta] POST:", (e as Error).message);
    return error("No se pudo guardar", 500);
  }
}
