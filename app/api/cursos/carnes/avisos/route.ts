/**
 * /api/cursos/carnes/avisos — "Tu carné caduca en 3 meses" / "en 1 mes".
 *
 * De lunes a viernes a media mañana, desde el crontab del servidor
 * (scripts/vps/avisos-carnes.sh), con la cabecera x-sync-secret. Avisa a quien guardó su carné con los avisos
 * puestos (lib/cursos/carnes.ts): 3 meses antes y 1 mes antes, una vez cada
 * uno. Si lo guarda cuando ya le queda menos de un mes, solo recibe el de 1 mes.
 *
 * La campana y el correo van juntos. El correo, solo con CARNES_AVISO_CORREO=1
 * en el entorno (texto aprobado por Michel el 18 oct 2026).
 *
 * Para ver qué se mandaría sin mandar nada: ?simular=1.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import { secretIguales } from "@/lib/secret-compare";
import { asegurarTablaCarnes, enHorarioDeAviso, enlaceBajaCarnes, nombreDelCarne } from "@/lib/cursos/carnes";
import { sendCarneCaducaEmail } from "@/lib/email/smtp-sender";
import { quedaSitioParaLoQuePuedeEsperar } from "@/lib/email/presupuesto-diario";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const TIPO = "carne_caduca";
const MAX_POR_PASADA = 50;
const DE_PRUEBA = /@(resend\.dev|buscaycurra\.es)$/i;
// Lo aprendido con las sugerencias: un user_id que no es uuid tumba la consulta de Supabase.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "Carné de carretillero" → "carné de carretillero"; "CAP de…" y "TIP de…" se quedan. */
const enFrase = (s: string) => (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

function cuantoQueda(caduca: string): string {
  const dias = Math.round((new Date(`${caduca}T00:00:00Z`).getTime() - new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime()) / 86400000);
  if (dias <= 1) return dias === 1 ? "mañana" : "hoy";
  if (dias < 45) return `en ${dias} días`;
  const meses = Math.round(dias / 30.44);
  return meses === 1 ? "en 1 mes" : `en ${meses} meses`;
}

const fechaEs = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export async function POST(req: NextRequest) {
  if (!secretIguales(req.headers.get("x-sync-secret"), process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const params = new URL(req.url).searchParams;
  const simular = params.get("simular") === "1";
  // ?ahora=1 se salta el horario, para probar con las cuentas de prueba.
  if (!simular && params.get("ahora") !== "1" && !enHorarioDeAviso()) {
    return NextResponse.json({ fueraDeHorario: true });
  }
  const conCorreo = process.env.CARNES_AVISO_CORREO === "1";
  await asegurarTablaCarnes();

  const { rows } = await getPool().query<{ user_id: string; curso_slug: string; caduca_en: string; un_mes: boolean }>(
    `SELECT user_id, curso_slug, to_char(caduca_en, 'YYYY-MM-DD') AS caduca_en,
            caduca_en <= current_date + interval '1 month' AS un_mes
       FROM carne_usuario
      WHERE avisos AND caduca_en >= current_date
        AND ((caduca_en <= current_date + interval '1 month' AND avisado_1m IS NULL)
          OR (caduca_en <= current_date + interval '3 months' AND avisado_3m IS NULL))
      ORDER BY caduca_en
      LIMIT $1`,
    [MAX_POR_PASADA]
  );

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  let avisados = 0, correos = 0;
  const detalle: Array<Record<string, unknown>> = [];

  for (const r of rows) {
    if (!UUID.test(r.user_id)) continue;
    const carne = enFrase(nombreDelCarne(r.curso_slug));
    const queda = cuantoQueda(r.caduca_en);
    const fecha = fechaEs(r.caduca_en);
    const url = `/app/formacion/${r.curso_slug}#renovacion`;
    const titulo = `Tu ${carne} caduca ${queda}`;
    const mensaje = `Caduca el ${fecha}. En la ficha tienes qué hay que hacer para renovarlo y dónde.`;

    if (simular) { detalle.push({ usuario: r.user_id.slice(0, 8), titulo, aviso: r.un_mes ? "1m" : "3m" }); avisados++; continue; }

    const { error } = await sb.from("notificaciones").insert({
      user_id: r.user_id, tipo: TIPO, titulo, mensaje,
      datos: { curso_slug: r.curso_slug, url, aviso: r.un_mes ? "1m" : "3m" }, leida: false,
    });
    if (error) { console.error("[carnes/avisos] campana:", error.message); continue; }
    // Si ya queda menos de un mes, el de 3 meses no tiene sentido: se dan los dos por hechos.
    await getPool().query(
      `UPDATE carne_usuario SET avisado_3m = COALESCE(avisado_3m, now()), avisado_1m = CASE WHEN $3 THEN now() ELSE avisado_1m END
        WHERE user_id = $1 AND curso_slug = $2`,
      [r.user_id, r.curso_slug, r.un_mes]
    );
    avisados++;

    if (!conCorreo) continue;
    const { data: usuario } = await sb.auth.admin.getUserById(r.user_id);
    const email = usuario?.user?.email;
    if (!email || DE_PRUEBA.test(email) || !(await quedaSitioParaLoQuePuedeEsperar())) continue;
    if (await sendCarneCaducaEmail({ userEmail: email, carne, queda, fecha, destinoUrl: `https://buscaycurra.es${url}`, bajaUrl: enlaceBajaCarnes(r.user_id) })) correos++;
  }

  return NextResponse.json({ simulado: simular, conCorreo, pendientes: rows.length, avisados, correos, detalle });
}
