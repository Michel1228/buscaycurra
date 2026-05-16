/**
 * /api/jobs/scrape-ats
 * Scraper de fuentes directas: Greenhouse, Lever, Teamtailor
 * Se llama desde crontab cada 6 horas.
 * Auth: Authorization: Bearer <ALERTS_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { sendPush, type PushSub } from "@/lib/push-sender";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://placeholder",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ALERTS_SECRET = process.env.ALERTS_SECRET || "bcv-alerts-2026";

// ─── Empresas con Greenhouse ──────────────────────────────────────────────────
const GREENHOUSE = [
  "cabify", "typeform", "jobandtalent", "flywire", "adevinta", "paack",
  "wallapop", "idealista", "badi", "fever", "playtomic", "factorial",
  "lanzadera", "glovo", "nuvei", "luda-partners", "recovo", "cooltra",
  "carto", "habitissimo", "domestika", "voxel-group",
];

// ─── Empresas con Lever ───────────────────────────────────────────────────────
const LEVER = [
  "holded", "amenitiz", "voicemod", "urbanitae", "kenjo", "bewe",
  "gigas", "fluentify", "coverfy", "ficosota", "bdeo",
];

// ─── Empresas con Teamtailor ──────────────────────────────────────────────────
const TEAMTAILOR = [
  "factorial-hr", "lanzadera-portfolio", "bigml", "tropicfeel",
];

type JobSector = "HOSTELERIA" | "INDUSTRIA" | "OFICINA" | "COMERCIO" | "SALUD" | "EDUCACION" | "TECNOLOGIA" | "CONSTRUCCION" | "TRANSPORTE" | "OTRO";

function classifySector(title: string, desc: string = ""): JobSector {
  const t = (title + " " + desc).toLowerCase();
  if (/developer|engineer|software|fullstack|frontend|backend|devops|data|cloud|qa|cto|cio|it |tech|programador|informatica/.test(t)) return "TECNOLOGIA";
  if (/hotel|hosteleria|camarero|cocinero|chef|restaurante|bar |cocina|recepcion/.test(t)) return "HOSTELERIA";
  if (/medico|enfermero|farmacia|hospital|clinica|salud|doctor|sanitario/.test(t)) return "SALUD";
  if (/profesor|docente|maestro|educacion|formacion|pedagogia|tutor/.test(t)) return "EDUCACION";
  if (/logistica|transporte|conductor|repartidor|almacen|chofer|mensajero/.test(t)) return "TRANSPORTE";
  if (/construccion|obra|albanil|electricista|arquitecto|fontanero|soldador/.test(t)) return "CONSTRUCCION";
  if (/ventas|comercial|vendedor|tienda|retail|dependiente|atencion.*cliente/.test(t)) return "COMERCIO";
  if (/fabricacion|produccion|manufactura|industria|mecanico|operario|planta/.test(t)) return "INDUSTRIA";
  return "OTRO";
}

interface GHJob { id: number; title: string; location?: { name?: string }; absolute_url?: string; content?: string; updated_at?: string; }
interface LeverJob { id: string; text: string; categories?: { location?: string; team?: string }; hostedUrl?: string; descriptionPlain?: string; createdAt?: number; }
interface TeamtailorJob { id: string; attributes?: { title?: string; body?: string; "remote-status"?: string; created_at?: string }; links?: { "careersite-job-url"?: string }; }

async function fetchJson<T>(url: string, timeout = 10000): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "BuscayCurra-Bot/1.0 (buscaycurra.es)" } });
    clearTimeout(tid);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch { return null; }
}

function extractLocation(raw?: string): { city: string; province: string } {
  if (!raw) return { city: "", province: "" };
  const s = raw.replace(/españa|spain|es$/i, "").trim();
  const parts = s.split(/[,\-\/]/).map(p => p.trim()).filter(Boolean);
  return { city: parts[0] || "", province: parts[1] || parts[0] || "" };
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${ALERTS_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pool = getPool();
  let nuevas = 0;
  let errores = 0;
  const ciudadesNuevas = new Set<string>(); // ciudades con ofertas nuevas en este ciclo

  const upsert = async (row: {
    id: string; title: string; company: string; description: string;
    sector: JobSector; city: string; province: string;
    sourceUrl: string; sourceName: string;
  }) => {
    try {
      // xmax=0 → INSERT real; xmax>0 → UPDATE de fila existente
      const res = await pool.query(
        `INSERT INTO "JobListing" (id, title, company, description, sector, city, province, "sourceUrl", "sourceName", "isActive", "scrapedAt", "createdAt")
         VALUES ($1,$2,$3,$4,$5::\"JobSector\",$6,$7,$8,$9,true,NOW(),NOW())
         ON CONFLICT (id) DO UPDATE SET "scrapedAt"=NOW(), "isActive"=true
         RETURNING (xmax = 0) AS inserted`,
        [row.id, row.title.slice(0, 200), row.company.slice(0, 200), row.description.slice(0, 4000), row.sector, row.city.slice(0, 100), row.province.slice(0, 100), row.sourceUrl.slice(0, 500), row.sourceName]
      );
      if (res.rows[0]?.inserted === true) {
        nuevas++;
        if (row.city) ciudadesNuevas.add(row.city.toLowerCase());
        if (row.province) ciudadesNuevas.add(row.province.toLowerCase());
      }
    } catch { errores++; }
  };

  // ─── Greenhouse ───────────────────────────────────────────────────────────────
  for (const slug of GREENHOUSE) {
    const data = await fetchJson<{ jobs?: GHJob[] }>(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`);
    if (!data?.jobs) continue;
    for (const j of data.jobs) {
      const loc = extractLocation(j.location?.name);
      await upsert({
        id: `gh-${j.id}`,
        title: j.title || "",
        company: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
        description: j.content ? j.content.replace(/<[^>]*>/g, " ").slice(0, 4000) : "",
        sector: classifySector(j.title || ""),
        city: loc.city,
        province: loc.province,
        sourceUrl: j.absolute_url || `https://boards.greenhouse.io/${slug}/jobs/${j.id}`,
        sourceName: "Greenhouse",
      });
    }
  }

  // ─── Lever ────────────────────────────────────────────────────────────────────
  for (const slug of LEVER) {
    const data = await fetchJson<LeverJob[]>(`https://api.lever.co/v0/postings/${slug}?mode=json`);
    if (!Array.isArray(data)) continue;
    for (const j of data) {
      const loc = extractLocation(j.categories?.location);
      await upsert({
        id: `lv-${j.id}`,
        title: j.text || "",
        company: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
        description: j.descriptionPlain?.slice(0, 4000) || "",
        sector: classifySector(j.text || "", j.categories?.team || ""),
        city: loc.city,
        province: loc.province,
        sourceUrl: j.hostedUrl || `https://jobs.lever.co/${slug}/${j.id}`,
        sourceName: "Lever",
      });
    }
  }

  // ─── Teamtailor ───────────────────────────────────────────────────────────────
  for (const slug of TEAMTAILOR) {
    const data = await fetchJson<{ data?: TeamtailorJob[] }>(`https://${slug}.teamtailor.com/jobs.json`);
    if (!data?.data) continue;
    for (const j of data.data) {
      const attrs = j.attributes || {};
      await upsert({
        id: `tt-${j.id}`,
        title: attrs.title || "",
        company: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
        description: attrs.body ? attrs.body.replace(/<[^>]*>/g, " ").slice(0, 4000) : "",
        sector: classifySector(attrs.title || ""),
        city: "",
        province: "",
        sourceUrl: j.links?.["careersite-job-url"] || "",
        sourceName: "Teamtailor",
      });
    }
  }

  console.log(`[scrape-ats] Nuevas: ${nuevas}, Errores: ${errores}`);

  // Notificar a usuarios con alertas activas cuya ciudad coincida con ofertas nuevas
  let notificados = 0;
  if (nuevas > 0 && ciudadesNuevas.size > 0) {
    try {
      // Alertas activas no notificadas en las últimas 3h
      const alertasRes = await pool.query<{ id: number; user_id: string; keyword: string; location: string }>(
        `SELECT id, user_id, keyword, location FROM job_alerts
         WHERE active = true
           AND (last_sent_at IS NULL OR last_sent_at < NOW() - INTERVAL '3 hours')
         LIMIT 200`
      );

      for (const alerta of alertasRes.rows) {
        const loc = (alerta.location || "").toLowerCase();
        // Verificar si alguna de las ciudades nuevas coincide con la ubicación de la alerta
        const ciudadMatch = loc === "" || Array.from(ciudadesNuevas).some(c =>
          c.includes(loc) || loc.includes(c) || loc.split(/[\s,]+/).some(part => c.includes(part) && part.length > 3)
        );
        if (!ciudadMatch) continue;

        // Contar cuántas ofertas nuevas coinciden con esta alerta
        const kw = `%${alerta.keyword.toLowerCase()}%`;
        const countRes = await pool.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM "JobListing"
           WHERE "isActive" = true AND "createdAt" > NOW() - INTERVAL '7 hours'
             AND (LOWER(title) LIKE $1 OR LOWER(description) LIKE $1)`,
          [kw]
        );
        const totalNuevas = parseInt(countRes.rows[0]?.count || "0");
        if (totalNuevas === 0) continue;

        // Obtener suscripciones push del usuario
        const subsRes = await pool.query<PushSub>(
          `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
          [alerta.user_id]
        );

        for (const sub of subsRes.rows) {
          try {
            await sendPush(sub, {
              title: `🐛 ${totalNuevas} nueva${totalNuevas > 1 ? "s" : ""} oferta${totalNuevas > 1 ? "s" : ""} de "${alerta.keyword}"`,
              body: alerta.location ? `Acabamos de encontrarlas en ${alerta.location}` : "Revísalas ahora en BuscayCurra",
              url: `/app/buscar?keyword=${encodeURIComponent(alerta.keyword)}${alerta.location ? `&location=${encodeURIComponent(alerta.location)}` : ""}`,
            });
            notificados++;
          } catch (pushErr) {
            const code = (pushErr as { statusCode?: number }).statusCode;
            if (code === 410 || code === 404) {
              await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [sub.endpoint]);
            }
          }
        }

        // Notificación en Supabase (campana)
        await supabase.from("notificaciones").insert({
          user_id: alerta.user_id,
          tipo: "nuevas_ofertas",
          titulo: `${totalNuevas} nueva${totalNuevas > 1 ? "s" : ""} oferta${totalNuevas > 1 ? "s" : ""} de "${alerta.keyword}"`,
          mensaje: alerta.location ? `Acabamos de encontrarlas en ${alerta.location}` : "Revísalas ahora en BuscayCurra",
          datos: { keyword: alerta.keyword, location: alerta.location, total: totalNuevas },
          leida: false,
        });

        // Marcar como notificado para evitar spam
        await pool.query(`UPDATE job_alerts SET last_sent_at = NOW() WHERE id = $1`, [alerta.id]);
      }
    } catch (notifErr) {
      console.error("[scrape-ats] Error en notificaciones:", (notifErr as Error).message);
    }
  }

  console.log(`[scrape-ats] Notificados: ${notificados} usuarios`);
  return NextResponse.json({ ok: true, nuevas, errores, notificados, fuentes: GREENHOUSE.length + LEVER.length + TEAMTAILOR.length });
}
