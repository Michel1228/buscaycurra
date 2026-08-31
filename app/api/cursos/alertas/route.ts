/**
 * /api/cursos/alertas — Avisa a quien se interesó por un curso de que hay
 * trabajo que lo pide.
 *
 * POR QUÉ ESTA ES LA ALERTA Y NO OTRA. Lo fácil habría sido avisar cuando salga
 * una convocatoria del curso, pero esas plazas todavía no las tenemos: los
 * datos abiertos solo cubren algunas comunidades y para media España no hay
 * nada. Prometer un aviso que casi nunca llegaría es peor que no prometerlo.
 *
 * Lo que sí tenemos son 2,2 millones de ofertas y, en cada ficha de curso, la
 * lista de puestos que lo piden. Así que el aviso es el motivo por el que esa
 * persona se estaba formando: "hay 34 ofertas de gerocultor que piden esto".
 * Eso lo podemos decir hoy y es verdad.
 *
 * CÓMO NO CONVERTIRLO EN SPAM:
 *   · Solo a quien pidió preparar la solicitud de ESE curso. No es una lista.
 *   · Solo si hay ofertas de verdad. Cero ofertas, cero correos.
 *   · Una vez cada 14 días como máximo por persona y curso, anotado en Redis
 *     con caducidad propia — sin tabla nueva que mantener.
 *
 * Se lanza desde GitHub Actions con la cabecera x-sync-secret, igual que las
 * sincronizaciones de ofertas.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import { secretIguales } from "@/lib/secret-compare";
import { sendCursoAlertaEmail } from "@/lib/email/smtp-sender";
import { tipoPorSlug } from "@/lib/cursos/tipos";
import { get as redisGet, set as redisSet } from "@/lib/cache/redis-client";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Días entre dos avisos del mismo curso a la misma persona. */
const DIAS_ENTRE_AVISOS = 14;

/** Tope por ejecución, para no vaciar la cuota de Resend de golpe. */
const MAX_CORREOS = 200;

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (!secretIguales(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const simular = new URL(req.url).searchParams.get("simular") === "1";
  const sb = supabaseAdmin();

  // Quién se interesó por qué. Una fila por persona y curso: si preparó la
  // solicitud tres veces, sigue siendo una persona.
  const { data: intereses, error } = await sb
    .from("curso_interes")
    .select("user_id, curso_slug, curso_nombre")
    .eq("accion", "preparado")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    return NextResponse.json({ error: "No se pudo leer curso_interes: " + error.message }, { status: 500 });
  }

  const unicos = new Map<string, { user_id: string; slug: string; nombre: string }>();
  for (const i of intereses ?? []) {
    const k = `${i.user_id}|${i.curso_slug}`;
    if (!unicos.has(k)) {
      unicos.set(k, { user_id: i.user_id, slug: i.curso_slug, nombre: i.curso_nombre || i.curso_slug });
    }
  }

  const pool = getPool();
  let enviados = 0;
  let sinOfertas = 0;
  let yaAvisados = 0;
  let sinEmail = 0;
  const detalle: Array<{ curso: string; ofertas: number }> = [];

  for (const { user_id, slug, nombre } of unicos.values()) {
    if (enviados >= MAX_CORREOS) break;

    const marca = `alerta:curso:${user_id}:${slug}`;
    if (await redisGet(marca)) { yaAvisados++; continue; }

    const tipo = tipoPorSlug(slug, "ES");
    if (!tipo || tipo.puestos.length === 0) continue;

    // Ofertas activas cuyo título contiene alguno de los puestos que piden el
    // curso. ILIKE ANY con un array de patrones: una sola consulta por curso.
    const patrones = tipo.puestos.map(p => `%${p}%`);
    const { rows } = await pool.query(
      `SELECT title, company, city
         FROM "JobListing"
        WHERE "isActive" = true
          AND title ILIKE ANY($1::text[])
        LIMIT 200`,
      [patrones]
    );

    if (rows.length === 0) { sinOfertas++; continue; }
    detalle.push({ curso: slug, ofertas: rows.length });

    if (simular) { enviados++; continue; }

    // El correo está en auth.users, no en curso_interes.
    const { data: usuario } = await sb.auth.admin.getUserById(user_id);
    const email = usuario?.user?.email;
    if (!email) { sinEmail++; continue; }

    await sendCursoAlertaEmail({
      userEmail: email,
      cursoNombre: nombre,
      cursoSlug: slug,
      total: rows.length,
      ejemploTitle: rows[0].title,
      ejemploCompany: rows[0].company || "Empresa",
      ejemploCity: rows[0].city || undefined,
      obligatorio: tipo.obligatorioLegal,
    });

    await redisSet(marca, "1", DIAS_ENTRE_AVISOS * 24 * 60 * 60);
    enviados++;
  }

  return NextResponse.json({
    simulado: simular,
    interesados: unicos.size,
    enviados,
    yaAvisados,
    sinOfertas,
    sinEmail,
    detalle: detalle.slice(0, 20),
  });
}
