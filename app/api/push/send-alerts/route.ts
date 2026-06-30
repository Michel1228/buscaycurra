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

// Mapa inverso: provincia → [ciudades] para expansión geográfica
const PROVINCIA_CIUDADES: Record<string, string[]> = {};
for (const [ciudad, provincia] of Object.entries(CIUDAD_PROVINCIA)) {
  if (!PROVINCIA_CIUDADES[provincia]) PROVINCIA_CIUDADES[provincia] = [];
  PROVINCIA_CIUDADES[provincia].push(ciudad);
}

function getProvinciaExpansion(location: string): string | null {
  const norm = location.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [ciudad, provincia] of Object.entries(CIUDAD_PROVINCIA)) {
    if (norm === ciudad || norm.startsWith(ciudad + ",") || norm.startsWith(ciudad + " ")) {
      return provincia;
    }
  }
  return null;
}

/** 
 * Expansión inversa: provincia → LIKE patterns para ciudades
 * Cuando la location es una provincia ("navarra"), genera patrones para sus ciudades
 * porque el campo `province` casi nunca está poblado en la DB
 */
function getCiudadPatterns(location: string): string[] {
  const norm = location.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const patterns: string[] = [];
  
  // 1. Si es una provincia, añadir todas sus ciudades conocidas
  const ciudades = PROVINCIA_CIUDADES[norm];
  if (ciudades) {
    patterns.push(...ciudades);
  }
  
  // 2. Si es una ciudad, añadir la provincia + ciudades hermanas
  const provincia = CIUDAD_PROVINCIA[norm];
  if (provincia && PROVINCIA_CIUDADES[provincia]) {
    patterns.push(provincia);
    for (const c of PROVINCIA_CIUDADES[provincia]) {
      if (c !== norm) patterns.push(c); // ciudades hermanas
    }
  }
  
  return [...new Set(patterns)]; // dedup
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

    // ── Batch fetch: push subscriptions + contacts for all users (fix N+1) ──
    const userIds = [...new Set(alertasResult.rows.map(a => a.user_id))];

    const subsMap = new Map<string, PushSub[]>();
    if (userIds.length > 0) {
      const allSubs = await pool.query<PushSub & { user_id: string }>(
        `SELECT user_id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ANY($1)`,
        [userIds]
      );
      for (const s of allSubs.rows) {
        if (!subsMap.has(s.user_id)) subsMap.set(s.user_id, []);
        subsMap.get(s.user_id)!.push(s);
      }
    }

    const contactsMap = new Map<string, {
      email: string | null; whatsapp_phone: string | null;
      whatsapp_alertas: boolean; full_name: string | null;
    }>();
    if (userIds.length > 0) {
      const allContacts = await pool.query<{
        user_id: string; email: string | null; whatsapp_phone: string | null;
        whatsapp_alertas: boolean; full_name: string | null;
      }>(
        `SELECT user_id, email, whatsapp_phone, whatsapp_alertas, full_name
         FROM user_contacts WHERE user_id = ANY($1)`,
        [userIds]
      );
      for (const c of allContacts.rows) contactsMap.set(c.user_id, c);
    }

    // ── Batch fetch: JobListings for all alertas (fix N+1) ──
    // Build a single query: for each alerta, create keyword + geo conditions OR'd together
    const alertasEntries = alertasResult.rows.map(a => ({
      alerta: a,
      kw: `%${a.keyword.toLowerCase()}%`,
      locNorm: a.location ? a.location.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "",
    }));

    const jobsMap = new Map<number, Array<{ id: string; title: string; company: string; city: string; sourceUrl: string }>>();
    if (alertasEntries.length > 0) {
      const batchParams: (string | Date)[] = [];
      const batchClauses: string[] = [];
      const batchDesde = new Date(Date.now() - 3 * 3600 * 1000);
      let bpIdx = 1;

      for (const entry of alertasEntries) {
        const desde = entry.alerta.last_sent_at ?? batchDesde;
        const keywordClause = `(LOWER(title) LIKE $${bpIdx} OR LOWER(company) LIKE $${bpIdx} OR LOWER(description) LIKE $${bpIdx})`;
        batchParams.push(entry.kw);
        bpIdx++;

        let geoParts = "";
        if (entry.alerta.location) {
          const locPat = `%${entry.locNorm}%`;
          geoParts = `AND (LOWER(city) LIKE $${bpIdx} OR LOWER(province) LIKE $${bpIdx}`;
          batchParams.push(locPat);
          bpIdx++;
          const expandidas = getCiudadPatterns(entry.alerta.location);
          for (const c of expandidas) {
            geoParts += ` OR LOWER(city) LIKE $${bpIdx} OR LOWER(province) LIKE $${bpIdx}`;
            batchParams.push(`%${c}%`);
            bpIdx++;
          }
          geoParts += ")";
        }

        batchClauses.push(
          `("createdAt" > $${bpIdx} AND ${keywordClause} ${geoParts} LIMIT 3)`
        );
        batchParams.push(desde);
        bpIdx++;
      }

      // Execute one UNION ALL query for all alertas
      const unionQuery = batchClauses.map((clause, i) =>
        `(SELECT id, title, company, city, "sourceUrl", ${i} as alerta_idx FROM "JobListing" WHERE "isActive" = true AND ${clause})`
      ).join(" UNION ALL ");

      try {
        const batchResult = await pool.query<{ id: string; title: string; company: string; city: string; sourceUrl: string; alerta_idx: number }>(
          unionQuery,
          batchParams
        );
        for (const row of batchResult.rows) {
          const idx = row.alerta_idx;
          if (!jobsMap.has(idx)) jobsMap.set(idx, []);
          jobsMap.get(idx)!.push(row);
        }
      } catch (batchErr) {
        console.error("[send-alerts] Batch query failed, falling back to per-alerta:", (batchErr as Error).message);
      }
    }

    for (let alertaIdx = 0; alertaIdx < alertasResult.rows.length; alertaIdx++) {
      const alerta = alertasResult.rows[alertaIdx];
      procesadas++;

      // Use pre-fetched results from batch query
      const jobsResult = jobsMap.get(alertaIdx);
      if (!jobsResult || jobsResult.length === 0) {
        await pool.query(`UPDATE job_alerts SET last_sent_at = NOW() WHERE id = $1`, [alerta.id]);
        continue;
      }

      const total = jobsResult.length;
      const ejemplo = jobsResult[0];
      const titulo = `${total} nueva${total > 1 ? "s" : ""} oferta${total > 1 ? "s" : ""} para ti`;
      const cuerpo = `${ejemplo.title} en ${ejemplo.company}${ejemplo.city ? ` · ${ejemplo.city}` : ""}`;

      // 3. Push notification (batched lookup)
      const userSubs = subsMap.get(alerta.user_id) || [];

      // URL directo a la oferta concreta si hay job_id, si no al buscador con la keyword
      const pushUrl = ejemplo.id
        ? `/app/ofertas/${encodeURIComponent(ejemplo.id)}`
        : `/app/buscar?q=${encodeURIComponent(alerta.keyword)}${alerta.location ? `&ciudad=${encodeURIComponent(alerta.location)}` : ""}`;

      for (const sub of userSubs) {
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

      // 4b. Email + WhatsApp de alerta (datos desde batch lookup)
      try {
        const contact = contactsMap.get(alerta.user_id);

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
