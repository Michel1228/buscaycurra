/**
 * GET /api/auth/confirmar?u=…&t=… — El botón del recordatorio de confirmar el correo.
 *
 * Pide a Supabase un enlace de entrada recién hecho y lleva a /auth/callback,
 * que hace lo de siempre: la bienvenida y a donde iba. Ese enlace confirma el
 * correo de una cuenta sin confirmar (probado con una cuenta de prueba el 20 oct
 * 2026), y si el antivirus del correo abre este antes que la persona, el
 * siguiente sigue valiendo: el de Supabase solo se gasta en el navegador.
 *
 * Solo sirve mientras la cuenta está sin confirmar. Después lleva al login, para
 * que el correo no sea una llave para entrar que vale para siempre.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { firmaConfirmarValida } from "@/lib/auth/confirmar-correo";

export const dynamic = "force-dynamic";

const WEB = "https://buscaycurra.es";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams;
  const userId = p.get("u") || "";
  const alLogin = NextResponse.redirect(`${WEB}/auth/login`);
  if (!UUID.test(userId) || !firmaConfirmarValida(userId, p.get("t") || "")) return alLogin;

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await admin.auth.admin.getUserById(userId);
  const email = data?.user?.email;
  if (!email || data?.user?.email_confirmed_at) return alLogin;

  const { data: enlace, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !enlace?.properties?.hashed_token) {
    console.error("[auth/confirmar]", error?.message || "sin enlace");
    return alLogin;
  }
  return NextResponse.redirect(`${WEB}/auth/callback?token_hash=${encodeURIComponent(enlace.properties.hashed_token)}&type=email`);
}
