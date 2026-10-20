/**
 * POST /api/auth/recordar-confirmacion — A quien se registró y no confirmó el correo.
 *
 * POR QUÉ (20 oct 2026). Tras el anuncio entraron 43 registros en tres días y
 * 15 no confirmaron el correo; en total eran 56 de 204. Sin confirmar no se
 * puede entrar, y el recordatorio del primer día les llegaba igual (a 42 de
 * ellas) mandándolas a un paso de la app donde no podían entrar. Michel: que se
 * mande solo a la gente que le falta por confirmar.
 *
 * REGLAS, las mismas que el recordatorio del primer día:
 *  - UNA SOLA VEZ por persona: app_metadata.recordatorio_confirmar_en, que se
 *    escribe DESPUÉS de que Resend acepte el correo.
 *  - Entre 1 y 30 días desde el registro: antes es dar la turra, después ya no
 *    es un recordatorio, es publicidad.
 *  - De lunes a viernes, entre las 10 y las 12 de Madrid (enHorarioDeAviso), y
 *    como lo que puede esperar: no se come el cupo diario de correos.
 *  - Nunca a cuentas de prueba.
 *
 * La llama el crontab del servidor (scripts/vps/recordar-confirmacion.sh).
 * ?probar=1 dice a cuántos se mandaría, sin mandar nada.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { secretIguales } from "@/lib/secret-compare";
import { enHorarioDeAviso } from "@/lib/cursos/carnes";
import { enlaceConfirmar } from "@/lib/auth/confirmar-correo";
import { sendConfirmarCorreoEmail } from "@/lib/email/smtp-sender";
import { ofertasRecientesEn } from "@/lib/email/ofertas-para-correo";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_POR_PASADA = 40;
const DE_PRUEBA = /@(resend\.dev|buscaycurra\.es|example\.com|test\.com)$/i;
const DIA = 86400000;

export async function POST(req: NextRequest) {
  if (!secretIguales(req.headers.get("x-sync-secret"), process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const probar = new URL(req.url).searchParams.get("probar") === "1";
  if (!probar && !enHorarioDeAviso()) return NextResponse.json({ fueraDeHorario: true });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const ahora = Date.now();
  const pendientes = [];
  for (let pagina = 1; pagina <= 50; pagina++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 1000 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    for (const u of data.users) {
      const dias = (ahora - new Date(u.created_at).getTime()) / DIA;
      if (u.email && !u.email_confirmed_at && !DE_PRUEBA.test(u.email) && dias >= 1 && dias <= 30
        && !u.app_metadata?.recordatorio_confirmar_en) pendientes.push(u);
    }
    if (data.users.length < 1000) break;
  }
  if (probar) return NextResponse.json({ probar: true, pendientes: pendientes.length });

  let enviados = 0;
  for (const u of pendientes.slice(0, MAX_POR_PASADA)) {
    const enlace = enlaceConfirmar(u.id);
    if (!enlace) break;
    const ciudad = String(u.user_metadata?.ciudad || "").trim();
    const salio = await sendConfirmarCorreoEmail({
      email: u.email!,
      nombre: String(u.user_metadata?.full_name || ""),
      fechaAlta: new Date(u.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", timeZone: "Europe/Madrid" }),
      enlace,
      ciudad,
      ofertas: ciudad ? await ofertasRecientesEn(ciudad) : null,
    });
    // Si no salió (cupo del día, dirección que rebota), se queda para la siguiente pasada.
    if (!salio) continue;
    await admin.auth.admin.updateUserById(u.id, {
      app_metadata: { ...u.app_metadata, recordatorio_confirmar_en: new Date().toISOString() },
    });
    enviados++;
  }
  console.log(`[recordar-confirmacion] ${enviados} de ${pendientes.length} avisados`);
  return NextResponse.json({ pendientes: pendientes.length, enviados });
}
