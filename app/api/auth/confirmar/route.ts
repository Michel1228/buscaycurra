/**
 * GET /api/auth/confirmar?u=…&t=… — El botón del recordatorio de confirmar el correo.
 *
 * Pide a Supabase un enlace de entrada recién hecho, lo canjea AQUÍ y manda a
 * /auth/callback con la sesión en el fragmento (#access_token=…), que la página
 * recoge y hace lo de siempre: la bienvenida y a donde iba. Canjear el enlace
 * confirma el correo de una cuenta sin confirmar (probado el 20 oct 2026).
 *
 * POR QUÉ SE CANJEA EN EL SERVIDOR (22 oct 2026). Canjeado en el navegador, si
 * la respuesta de Supabase se perdía ("Failed to fetch") su librería repetía la
 * petición, el enlace ya estaba gastado (403) y la página decía "Algo no fue
 * bien" con la cuenta ya confirmada y dentro. Aquí se canjea una sola vez.
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
  const publico = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data: canje, error: errCanje } = await publico.auth.verifyOtp({ token_hash: enlace.properties.hashed_token, type: "email" });
  if (errCanje || !canje.session) {
    console.error("[auth/confirmar] canje:", errCanje?.message || "sin sesión");
    return alLogin;
  }
  const fragmento = new URLSearchParams({ access_token: canje.session.access_token, refresh_token: canje.session.refresh_token, type: "magiclink" });
  return NextResponse.redirect(`${WEB}/auth/callback#${fragmento.toString()}`);
}
