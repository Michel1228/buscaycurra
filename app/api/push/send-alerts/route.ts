/**
 * 🔒 SELLO ALERTAS — BuscayCurra
 * ┌─────────────────────────────────────────────────────────────┐
 * │ FLUJO CORRECTO (NO ROMPER):                                │
 * │                                                             │
 * │ 1. job_alerts (VPS PG) → alertas activas cada 2h            │
 * │ 2. searchJobsReal → JobListing (VPS PG)                     │
 * │ 3. sendPush → push_subscriptions (VPS PG)                  │
 * │ 4. user_contacts (VPS PG) → email + whatsapp_phone          │
 * │ 5. sendJobAlertEmail (Resend SMTP)                          │
 * │ 6. enviarAlertaWhatsApp (Meta API v21)                      │
 * │                                                             │
 * │ ⚠️  NO DEPENDE DE SUPABASE — usa VPS PostgreSQL              │
 * │ ⚠️  Supabase notificaciones es opcional (try/catch)          │
 * │                                                             │
 * │ 🗺️  Cron: 0 */3 * * * (cada 3h)                            │
 * │    curl -H "Authorization: Bearer ***"                      │
 * │    https://buscaycurra.es/api/push/send-alerts              │
 * │                                                             │
 * │ 📊 Tablas VPS PG necesarias:                                │
 * │    job_alerts, user_contacts, push_subscriptions,           │
 * │    JobListing                                               │
 * │                                                             │
 * │ ✅ Tests: sello-verificacion.mjs bloque 3                   │
 * └─────────────────────────────────────────────────────────────┘
 *
 * /api/push/send-alerts
 * Worker que busca alertas de empleo pendientes, encuentra nuevas ofertas
 * y envía notificaciones push + email + WhatsApp + registra en Supabase.
 * Se llama desde crontab del VPS cada 3 horas.
 * Autenticación: Authorization: Bearer ***
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import { sendPush, type PushSub } from "@/lib/push-sender";
import { sendJobAlertEmail } from "@/lib/email/smtp-sender";

export const dynamic = "force-dynamic";

const ALERTS_SECRET = process.env.ALERTS_SECRET;

// Ciudad → provincia para búsqueda regional ampliada
const CIUDAD_PROVINCIA: Record<string, string> = {
  // Navarra
  "tudela": "navarra", "pamplona": "navarra", "calahorra": "la rioja",
  // La Rioja
  "logrono": "la rioja", "logroño": "la rioja",
  // Aragón
  "zaragoza": "zaragoza", "huesca": "huesca", "teruel": "teruel",
  // Pais Vasco
  "bilbao": "vizcaya", "san sebastian": "guipuzcoa", "donostia": "guipuzcoa", "vitoria": "alava",
  // Galicia
  "vigo": "pontevedra", "la coruna": "coruña", "santiago de compostela": "coruña", "ferrol": "coruña", "lugo": "lugo", "ourense": "ourense",
  // Andalucia
  "sevilla": "sevilla", "malaga": "malaga", "granada": "granada", "cordoba": "cordoba",
  "almeria": "almeria", "huelva": "huelva", "jaen": "jaen", "cadiz": "cadiz",
  // Castilla y Leon
  "valladolid": "valladolid", "salamanca": "salamanca", "burgos": "burgos",
  "leon": "leon", "zamora": "zamora", "palencia": "palencia", "segovia": "segovia",
  // Castilla La Mancha
  "toledo": "toledo", "albacete": "albacete", "ciudad real": "ciudad real", "guadalajara": "guadalajara", "cuenca": "cuenca",
  // Madrid (ciudades de la periferia)
  "getafe": "madrid", "mostoles": "madrid", "alcala de henares": "madrid",
  "leganes": "madrid", "fuenlabrada": "madrid", "alcorcon": "madrid", "coslada": "madrid",
  "parla": "madrid", "torrejon": "madrid", "aranjuez": "madrid",
  // Cataluña
  "barcelona": "cataluña", "hospitalet": "cataluña", "badalona": "cataluña",
  "terrassa": "cataluña", "sabadell": "cataluña", "tarragona": "tarragona",
  "lleida": "lleida", "girona": "girona",
  // Valencia
  "valencia": "valencia", "alicante": "alicante", "elche": "alicante",
  "castellon": "castellon", "castellón": "castellon",
  // Murcia
  "murcia": "murcia", "cartagena": "murcia", "lorca": "murcia",
  // Extremadura
  "badajoz": "badajoz", "caceres": "caceres", "merida": "badajoz",
  // Canarias
  "las palmas": "canarias", "santa cruz de tenerife": "canarias",
  // Baleares
  "palma": "baleares",
  // Asturias / Cantabria
  "gijon": "asturias", "oviedo": "asturias", "santander": "cantabria",
};

function getProvinciaExpansion(location: string): string | null {
  const norm = location.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [ciudad, provincia] of Object.entries(CIUDAD_PROVINCIA)) {
    if (norm === ciudad || norm.startsWith(ciudad + ",") || norm.startsWith(ciudad + " ")) {
      return provincia;
    }
  }
  return null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://placeholder",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export async function GET(request: NextRequest) {
  // Auth del cron
  if (!ALERTS_SECRET) {
    return NextResponse.json({ error: "ALERTS_SECRET no configurada" }, { status: 503 });
  }
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

      // 2. Buscar nuevas ofertas que coincidan (con expansión geográfica provincial)
      const kw = `%${alerta.keyword.toLowerCase()}%`;
      const loc = alerta.location ? `%${alerta.location.toLowerCase()}%` : null;
      const provincia = alerta.location ? getProvinciaExpansion(alerta.location) : null;
      const provLoc = provincia ? `%${provincia}%` : null;

      const jobsResult = await pool.query<{ id: string; title: string; company: string; city: string; count: string; sourceUrl: string }>(
        `SELECT id, title, company, city, COUNT(*) OVER() AS count, "sourceUrl"
         FROM "JobListing"
         WHERE "isActive" = true
           AND "createdAt" > $1
           AND (LOWER(title) LIKE $2 OR LOWER(company) LIKE $2 OR LOWER(description) LIKE $2)
           ${loc ? `AND (LOWER(city) LIKE $3 OR LOWER(province) LIKE $3${provLoc ? " OR LOWER(city) LIKE $4 OR LOWER(province) LIKE $4" : ""})` : ""}
         LIMIT 3`,
        loc
          ? (provLoc ? [desde, kw, loc, provLoc] : [desde, kw, loc])
          : [desde, kw]
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

      // URL directo a la oferta concreta si hay job_id, si no al buscador con la keyword
      const pushUrl = ejemplo.id
        ? `/app/ofertas/${encodeURIComponent(ejemplo.id)}`
        : `/app/buscar?q=${encodeURIComponent(alerta.keyword)}${alerta.location ? `&ciudad=${encodeURIComponent(alerta.location)}` : ""}`;

      for (const sub of subsResult.rows) {
        try {
          await sendPush(sub, { title: titulo, body: cuerpo, url: pushUrl });
          enviadas++;
        } catch (pushErr) {
          const code = (pushErr as { statusCode?: number }).statusCode;
          // Suscripción expirada — eliminarla
          if (code === 410 || code === 404) {
            await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [sub.endpoint]);
          }
        }
      }

      // 4. Notificación en Supabase (campana) — no bloquea si falla
      try {
        await supabase.from("notificaciones").insert({
          user_id: alerta.user_id,
          tipo: "alerta_empleo",
          titulo,
          mensaje: cuerpo,
          datos: { keyword: alerta.keyword, location: alerta.location, total, job_id: ejemplo.id, job_url: ejemplo.sourceUrl || "" },
          leida: false,
        });
      } catch { /* Supabase puede no estar disponible */ }

      // 4b. Email + WhatsApp de alerta (VPS PostgreSQL, sin dependencia de Supabase)
      try {
        // Obtener datos de contacto desde VPS PG (user_contacts)
        const contactResult = await pool.query<{
          email: string | null;
          whatsapp_phone: string | null;
          whatsapp_alertas: boolean;
          full_name: string | null;
        }>(
          `SELECT email, whatsapp_phone, whatsapp_alertas, full_name
           FROM user_contacts
           WHERE user_id = $1`,
          [alerta.user_id]
        );

        const contact = contactResult.rows[0];

        // Email
        if (contact?.email) {
          await sendJobAlertEmail({
            userEmail: contact.email,
            keyword: alerta.keyword,
            location: alerta.location || undefined,
            total,
            ejemploTitle: ejemplo.title,
            ejemploCompany: ejemplo.company,
            ejemploCity: ejemplo.city || undefined,
          });
        }

        // WhatsApp: solo si el usuario tiene teléfono guardado
        if (contact?.whatsapp_alertas && contact?.whatsapp_phone) {
          const { enviarAlertaWhatsApp } = await import("@/lib/whatsapp/sender");
          const result = await enviarAlertaWhatsApp(contact.whatsapp_phone, {
            nombre: contact.full_name?.split(" ")[0] || "Candidato",
            puesto: ejemplo.title,
            ciudad: ejemplo.city || alerta.location || "España",
            url: ejemplo.id
              ? `https://buscaycurra.es/app/ofertas/${encodeURIComponent(ejemplo.id)}`
              : undefined,
            keyword: alerta.keyword,
          });
          if (!result.success) {
            console.error("[send-alerts] WhatsApp falló:", result.error);
          }
        }
      } catch (emailErr) {
        console.error("[send-alerts] Error enviando email/whatsapp:", (emailErr as Error).message);
      }

      // 5. Actualizar last_sent_at
      await pool.query(`UPDATE job_alerts SET last_sent_at = NOW() WHERE id = $1`, [alerta.id]);
    }

    return NextResponse.json({ ok: true, procesadas, enviadas });
  } catch (error) {
    console.error("[send-alerts] Error:", (error as Error).message);
    return NextResponse.json({ error: 'Error en alertas' }, { status: 500 });
  }
}
