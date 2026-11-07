/**
 * GET /api/auth/confirmar?u=…&t=… — El botón de los correos de confirmar el correo.
 *
 * DESDE EL 7 NOV 2026 ES LA VERIFICACIÓN DEL CORREO. Con "Confirm email"
 * apagado en Supabase se entra sin confirmar, pero para hacer algo hace falta el
 * correo verificado (lib/auth/correo-verificado.ts). El enlace firmado llega
 * solo al buzón de la cuenta, así que abrirlo prueba que el correo es suyo: se
 * escribe app_metadata.correo_verificado_en, se le da la bienvenida (correo,
 * aviso de ofertas, premio del referido) y se le deja dentro.
 *
 * DEJARLE DENTRO. Si este navegador ya tiene su sesión, directo a la app (a la
 * oferta de la que venía, si se registró desde una). Si no (lo abre en Gmail,
 * en otro móvil), se pide a Supabase un enlace de entrada recién hecho, se
 * canjea AQUÍ y se manda a /auth/callback con la sesión en el fragmento
 * (#access_token=…). Canjearlo también confirma en Supabase una cuenta antigua
 * que nunca confirmó (probado el 20 oct 2026), que sin eso no puede entrar.
 *
 * POR QUÉ SE CANJEA EN EL SERVIDOR (22 oct 2026). Canjeado en el navegador, si
 * la respuesta de Supabase se perdía ("Failed to fetch") su librería repetía la
 * petición, el enlace ya estaba gastado (403) y la página decía "Algo no fue
 * bien" con la cuenta ya confirmada y dentro. Aquí se canjea una sola vez.
 *
 * Solo deja entrar sin contraseña mientras el correo está sin verificar.
 * Después lleva al login (o a la app, si ya tiene la sesión en este navegador),
 * para que el correo no sea una llave para entrar que vale para siempre.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { firmaConfirmarValida } from "@/lib/auth/confirmar-correo";
import { correoVerificado } from "@/lib/auth/correo-verificado";
import { destinoSeguro } from "@/lib/auth/destino";
import { darBienvenida } from "@/lib/onboarding/dar-bienvenida";

export const dynamic = "force-dynamic";

const WEB = "https://buscaycurra.es";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ¿Este navegador tiene ya la sesión de esa cuenta? */
async function sesionDe(req: NextRequest, userId: string): Promise<boolean> {
  try {
    const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { getAll: () => req.cookies.getAll().map((c) => ({ name: c.name, value: c.value })) },
    });
    const { data: { user } } = await sb.auth.getUser();
    return user?.id === userId;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams;
  const userId = p.get("u") || "";
  const alLogin = NextResponse.redirect(`${WEB}/auth/login`);
  if (!UUID.test(userId) || !firmaConfirmarValida(userId, p.get("t") || "")) return alLogin;

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await admin.auth.admin.getUserById(userId);
  const cuenta = data?.user;
  const email = cuenta?.email;
  if (!cuenta || !email) return alLogin;

  // A la oferta de la que venía la primera semana, como al entrar (app/auth/login).
  const reciente = Date.now() - new Date(cuenta.created_at).getTime() < 7 * 86400000;
  const destino = (reciente ? destinoSeguro(cuenta.user_metadata?.destino) : null) || "/app/bienvenida";
  const aLaApp = NextResponse.redirect(`${WEB}${destino}`);

  if (correoVerificado(cuenta)) return (await sesionDe(req, userId)) ? aLaApp : alLogin;

  const { error: errMarca } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...cuenta.app_metadata, correo_verificado_en: new Date().toISOString() },
  });
  if (errMarca) {
    console.error("[auth/confirmar] marca:", errMarca.message);
    return alLogin;
  }
  // La bienvenida, ahora que el correo es de verdad. Se hace una sola vez por
  // cuenta (bienvenida_en); si falla, la completa /api/auth/bienvenidas-pendientes.
  await darBienvenida(userId).catch((e) => console.error("[auth/confirmar] bienvenida:", (e as Error).message));

  if (await sesionDe(req, userId)) return aLaApp;

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
