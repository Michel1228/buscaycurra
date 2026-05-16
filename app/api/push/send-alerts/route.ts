/**
 * /api/push/send-alerts
 * Worker que busca alertas de empleo pendientes, encuentra nuevas ofertas
 * y envía notificaciones push + registra en Supabase.
 * Se llama desde crontab del VPS cada 3 horas.
 * Autenticación: Authorization: Bearer <ALERTS_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import { sendPush, type PushSub } from "@/lib/push-sender";

export const dynamic = "force-dynamic";

const ALERTS_SECRET = process.env.ALERTS_SECRET || "bcv-alerts-2026";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://placeholder",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export async function GET(request: NextRequest) {
  // Auth del cron
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${ALERTS_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pool = getPool();
  let procesadas = 0;
  let enviadas = 0;

  try {
    // 1. Alertas pendientes: no enviadas nunca o hace más de 2h
    const alertasResult = await pool.query<{
      id: number; user_id: string; keyword: string; location: string; last_sent_at: Date | null;
    }>(
      `SELECT id, user_id, keyword, location, last_sent_at
       FROM job_alerts
       WHERE active = true
         AND (last_sent_at IS NULL OR last_sent_at < NOW() - INTERVAL '2 hours')
       ORDER BY last_sent_at ASC NULLS FIRST
       LIMIT 100`
    );

    for (const alerta of alertasResult.rows) {
      procesadas++;
      const desde = alerta.last_sent_at ?? new Date(Date.now() - 3 * 3600 * 1000);

      // 2. Buscar nuevas ofertas que coincidan
      const kw = `%${alerta.keyword.toLowerCase()}%`;
      const loc = alerta.location ? `%${alerta.location.toLowerCase()}%` : null;

      const jobsResult = await pool.query<{ title: string; company: string; city: string; count: string }>(
        `SELECT title, company, city, COUNT(*) OVER() AS count
         FROM "JobListing"
         WHERE "isActive" = true
           AND "createdAt" > $1
           AND (LOWER(title) LIKE $2 OR LOWER(company) LIKE $2 OR LOWER(description) LIKE $2)
           ${loc ? `AND (LOWER(city) LIKE $3 OR LOWER(province) LIKE $3)` : ""}
         LIMIT 3`,
        loc ? [desde, kw, loc] : [desde, kw]
      );

      if (jobsResult.rows.length === 0) {
        await pool.query(`UPDATE job_alerts SET last_sent_at = NOW() WHERE id = $1`, [alerta.id]);
        continue;
      }

      const totalStr = jobsResult.rows[0].count;
      const total = parseInt(totalStr, 10);
      const ejemplo = jobsResult.rows[0];
      const titulo = `${total} nueva${total > 1 ? "s" : ""} oferta${total > 1 ? "s" : ""} para ti`;
      const cuerpo = `${ejemplo.title} en ${ejemplo.company}${ejemplo.city ? ` · ${ejemplo.city}` : ""}`;

      // 3. Push notification
      const subsResult = await pool.query<PushSub>(
        `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
        [alerta.user_id]
      );

      for (const sub of subsResult.rows) {
        try {
          await sendPush(sub, { title: titulo, body: cuerpo, url: `/app/buscar?q=${encodeURIComponent(alerta.keyword)}` });
          enviadas++;
        } catch (pushErr) {
          const code = (pushErr as { statusCode?: number }).statusCode;
          // Suscripción expirada — eliminarla
          if (code === 410 || code === 404) {
            await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [sub.endpoint]);
          }
        }
      }

      // 4. Notificación en Supabase (campana)
      await supabase.from("notificaciones").insert({
        user_id: alerta.user_id,
        tipo: "alerta_empleo",
        titulo,
        mensaje: cuerpo,
        datos: { keyword: alerta.keyword, location: alerta.location, total },
        leida: false,
      });

      // 5. Actualizar last_sent_at
      await pool.query(`UPDATE job_alerts SET last_sent_at = NOW() WHERE id = $1`, [alerta.id]);
    }

    return NextResponse.json({ ok: true, procesadas, enviadas });
  } catch (error) {
    console.error("[send-alerts] Error:", (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
