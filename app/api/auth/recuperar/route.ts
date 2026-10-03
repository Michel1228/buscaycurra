/**
 * /api/auth/recuperar — "He olvidado mi contraseña".
 *
 * POST { email } → si hay una cuenta con ese correo, le manda un enlace para
 * elegir contraseña nueva. Contesta lo mismo haya cuenta o no, para que nadie
 * pueda averiguar desde aquí quién está registrado.
 *
 * POR QUÉ NO resetPasswordForEmail (auditoría del 3 oct 2026). Lo mandaba
 * Supabase con su plantilla en inglés ("Reset Your Password"), y su enlace
 * solo funcionaba en el navegador donde se había pedido: quien lo pedía en la
 * app o en Safari y lo abría desde Gmail veía "El enlace no es válido o ha
 * expirado" y no podía cambiarla. De once personas que lo pidieron, cuatro no
 * han llegado a entrar nunca. Aquí se genera el enlace con el token_hash, que
 * /auth/nueva-contrasena verifica en cualquier navegador, y el correo sale en
 * español por Resend.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendRecuperarContrasenaEmail } from "@/lib/email/smtp-sender";
import { checkUserRateLimit } from "@/lib/rate-limit-user";

export const dynamic = "force-dynamic";

const tapar = (e: string) => e.replace(/^(.{2}).*(@.*)$/, "$1***$2");

export async function POST(req: NextRequest) {
  const { email: bruto } = (await req.json().catch(() => ({}))) as { email?: string };
  const email = (bruto || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) {
    return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });
  }

  // Topes contra el abuso: es un formulario sin sesión que manda correos.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "desconocida";
  const porCorreo = await checkUserRateLimit("recuperar-1min", email, 1, 60);
  if (!porCorreo) {
    return NextResponse.json({ error: "Te lo acabamos de mandar. Espera un minuto antes de pedir otro y mira también en spam." }, { status: 429 });
  }
  const porHora = (await checkUserRateLimit("recuperar-hora", email, 5, 3600))
    && (await checkUserRateLimit("recuperar-ip", ip, 15, 3600));
  if (!porHora) {
    return NextResponse.json({ error: "Has pedido demasiados enlaces. Prueba dentro de una hora." }, { status: 429 });
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    // Lo normal aquí es que no haya cuenta con ese correo. Se anota para poder
    // ayudar a quien diga "no me llega", sin enseñar el correo entero.
    console.warn(`[recuperar] ${tapar(email)}: sin enlace (${error?.message?.slice(0, 80) || "sin token"})`);
    return NextResponse.json({ ok: true });
  }

  const sitio = process.env.NEXT_PUBLIC_SITE_URL || "https://buscaycurra.es";
  const enlace = `${sitio}/auth/nueva-contrasena?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;
  const enviado = await sendRecuperarContrasenaEmail({
    email,
    nombre: (data.user?.user_metadata?.full_name as string | undefined) || null,
    enlace,
  });
  console.log(`[recuperar] ${tapar(email)}: ${enviado ? "correo enviado" : "NO SE PUDO ENVIAR"}`);
  if (!enviado) {
    return NextResponse.json({ error: "No hemos podido mandarte el correo ahora mismo. Inténtalo en unos minutos." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
