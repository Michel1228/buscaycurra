/**
 * /api/auth/verificar-correo — Lo mínimo para verificar el correo, con sesión.
 *
 *   GET  → { verificado, email }: el aviso y la ventana de la app
 *          (components/ConfirmaCorreo*.tsx) y su botón "Ya lo he confirmado".
 *   POST → manda "Confirma tu correo" con el enlace firmado
 *          (/api/auth/confirmar). Lo pide el registro nada más crear la cuenta
 *          y el botón "Reenviar".
 *
 * POR QUÉ (7 nov 2026). Se entra sin confirmar y para hacer algo hay que
 * verificar el correo (lib/auth/correo-verificado.ts). Esta ruta NO pide el
 * correo verificado: es justo la que sirve para conseguirlo, y solo escribe en
 * la cuenta cuándo se mandó.
 *
 * SIN CORREOS DE MÁS (no caer en spam): como mucho UNO POR MINUTO y CINCO AL
 * DÍA por persona, contados en la propia cuenta
 * (app_metadata.verificacion_enviada), que no depende de que Redis esté vivo.
 * Siempre a la dirección de la cuenta, nunca a una que mande el navegador.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUsuario, cuentaVerificada } from "@/lib/auth-server";
import { enlaceConfirmar } from "@/lib/auth/confirmar-correo";
import { checkUserRateLimit } from "@/lib/rate-limit-user";
import { sendVerificarCorreoEmail } from "@/lib/email/smtp-sender";
import { enviosDelDia, motivoParaNoMandar } from "@/lib/auth/correo-verificado";

export const dynamic = "force-dynamic";

const MENSAJES = {
  espera: "Te lo acabamos de mandar. Espera un minuto antes de pedir otro y mira también en Spam o Promociones.",
  tope_dia: "Hoy ya te lo hemos mandado cinco veces. Búscalo en Spam o en Promociones; mañana puedes pedir otro.",
};

export async function GET(req: NextRequest) {
  const u = await getUsuario(req);
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ verificado: await cuentaVerificada(u), email: u.email });
}

export async function POST(req: NextRequest) {
  const u = await getUsuario(req);
  if (!u) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (await cuentaVerificada(u)) return NextResponse.json({ verificado: true });
  // Dos pulsaciones a la vez: la cuenta todavía no tiene apuntado el primero.
  if (!(await checkUserRateLimit("verificar-correo", u.id, 1, 60))) {
    return NextResponse.json({ error: "espera", mensaje: MENSAJES.espera }, { status: 429 });
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await admin.auth.admin.getUserById(u.id);
  const cuenta = data?.user;
  if (!cuenta?.email) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });

  const ahora = Date.now();
  const envios = enviosDelDia(cuenta.app_metadata?.verificacion_enviada, ahora);
  const motivo = motivoParaNoMandar(envios, ahora);
  if (motivo) return NextResponse.json({ error: motivo, mensaje: MENSAJES[motivo] }, { status: 429 });

  const enlace = enlaceConfirmar(u.id);
  if (!enlace) return NextResponse.json({ error: "No se puede mandar ahora" }, { status: 503 });
  const salio = await sendVerificarCorreoEmail({ email: cuenta.email, nombre: String(cuenta.user_metadata?.full_name || ""), enlace });
  if (!salio) {
    return NextResponse.json({ error: "no_salio", mensaje: "No hemos podido mandarlo ahora. Prueba otra vez dentro de un minuto." }, { status: 502 });
  }
  await admin.auth.admin.updateUserById(u.id, {
    app_metadata: { ...cuenta.app_metadata, verificacion_enviada: [...envios, new Date(ahora).toISOString()] },
  });
  return NextResponse.json({ ok: true, enviadoA: cuenta.email });
}
