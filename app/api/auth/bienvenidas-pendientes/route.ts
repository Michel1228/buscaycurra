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
 * Confirmadas = con el correo verificado (lib/auth/correo-verificado.ts): desde
 * el 7 nov 2026 se entra sin confirmar, y la bienvenida (correo, aviso de
 * ofertas, premio del referido) es para quien ha demostrado que el correo es suyo.
 *
 * ?antiguas=1 — BIENVENIDAS ATRASADAS (23 oct 2026, aprobado por Michel). Había
 * 81 cuentas confirmadas de antes de esta red de seguridad que nunca la
 * recibieron: ni correo ni aviso de ofertas. Se les da a las de más de una
 * semana, con estas reglas:
 *  - De lunes a viernes, entre las 10 y las 12 de Madrid (enHorarioDeAviso).
 *  - Como mucho MAX_ANTIGUAS_POR_PASADA por pasada, de la más reciente a la
 *    más antigua, y solo mientras quede cupo para lo que puede esperar.
 *  - Nunca a cuentas de prueba ni a quien ya tiene un plan: ese ya está dentro.
 * La llama el crontab una vez cada mañana (scripts/vps/bienvenidas-antiguas.sh).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { secretIguales } from "@/lib/secret-compare";
import { darBienvenida } from "@/lib/onboarding/dar-bienvenida";
import { enHorarioDeAviso } from "@/lib/cursos/carnes";
import { quedaSitioParaLoQuePuedeEsperar } from "@/lib/email/presupuesto-diario";
import { correoVerificadoEn } from "@/lib/auth/correo-verificado";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_ANTIGUAS_POR_PASADA = 25;
const SEMANA = 7 * 24 * 3600 * 1000;
const DE_PRUEBA = /buscaycurra|@(resend\.dev|example\.com|test\.com|qa\.com|mailinator\.com)$/i;

export async function POST(req: NextRequest) {
  if (!secretIguales(req.headers.get("x-sync-secret"), process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  const probar = req.nextUrl.searchParams.get("probar") === "1";
  const antiguas = req.nextUrl.searchParams.get("antiguas") === "1";
  if (antiguas && !probar && !enHorarioDeAviso()) return NextResponse.json({ fueraDeHorario: true });
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ahora = Date.now();
  let pendientes = data.users.filter((u) =>
    correoVerificadoEn(u)
    && !u.app_metadata?.bienvenida_en
    && !/@resend\.dev$/i.test(u.email || "")
    && ahora - new Date(correoVerificadoEn(u)!).getTime() > 2 * 60 * 1000
    && (antiguas
      ? ahora - new Date(u.created_at).getTime() >= SEMANA && !DE_PRUEBA.test(u.email || "")
      : ahora - new Date(u.created_at).getTime() < SEMANA));

  if (antiguas && pendientes.length) {
    const { data: conPlan } = await admin.from("profiles").select("id").in("id", pendientes.map((u) => u.id)).neq("plan", "free");
    const yaDentro = new Set((conPlan || []).map((p) => p.id));
    pendientes = pendientes.filter((u) => !yaDentro.has(u.id))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  if (probar) return NextResponse.json({ pendientes: pendientes.length });

  let hechas = 0;
  for (const u of antiguas ? pendientes.slice(0, MAX_ANTIGUAS_POR_PASADA) : pendientes) {
    if (antiguas && !(await quedaSitioParaLoQuePuedeEsperar())) break;
    const r = await darBienvenida(u.id, {}, { aunqueSeaAntigua: antiguas }).catch((e) => ({ ok: false, error: (e as Error).message }));
    if (r.ok) hechas++;
    else console.error(`[bienvenidas-pendientes] ${u.id}: ${r.error}`);
  }
  if (pendientes.length) console.log(`[bienvenidas-pendientes${antiguas ? " antiguas" : ""}] ${hechas} de ${pendientes.length} completadas`);
  return NextResponse.json({ pendientes: pendientes.length, hechas });
}
