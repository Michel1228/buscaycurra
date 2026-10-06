/**
 * POST /api/auth/bienvenidas-pendientes — Red de seguridad de la bienvenida.
 * La llama el servidor cada 10 minutos (scripts/vps/bienvenidas-pendientes.sh).
 *
 * POR QUÉ (6 oct 2026). La bienvenida (ficha, ciudad, alerta de ofertas y
 * correo) dependía de que el navegador la pidiera al confirmar el correo o al
 * entrar con la contraseña. Y hay caminos donde no la pide: confirmar en otro
 * navegador y no volver a entrar, o que el cliente de Supabase canjee el
 * código por su cuenta y la página crea que ha fallado. El centinela encontró
 * dos personas así en dos días. Aquí se completa desde el servidor, pase lo
 * que pase en el navegador.
 *
 * Solo cuentas confirmadas hace más de 2 minutos (para no pisarse con el
 * navegador) y de la última semana. ?probar=1 dice a quién sin hacer nada.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { secretIguales } from "@/lib/secret-compare";
import { darBienvenida } from "@/lib/onboarding/dar-bienvenida";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!secretIguales(req.headers.get("x-sync-secret"), process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  const probar = req.nextUrl.searchParams.get("probar") === "1";
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ahora = Date.now();
  const pendientes = data.users.filter((u) =>
    u.email_confirmed_at
    && !u.app_metadata?.bienvenida_en
    && !/@resend\.dev$/i.test(u.email || "")
    && ahora - new Date(u.email_confirmed_at).getTime() > 2 * 60 * 1000
    && ahora - new Date(u.created_at).getTime() < 7 * 24 * 3600 * 1000);

  if (probar) return NextResponse.json({ pendientes: pendientes.length });

  let hechas = 0;
  for (const u of pendientes) {
    const r = await darBienvenida(u.id).catch((e) => ({ ok: false, error: (e as Error).message }));
    if (r.ok) hechas++;
    else console.error(`[bienvenidas-pendientes] ${u.id}: ${r.error}`);
  }
  if (pendientes.length) console.log(`[bienvenidas-pendientes] ${hechas} de ${pendientes.length} completadas`);
  return NextResponse.json({ pendientes: pendientes.length, hechas });
}
