/**
 * /api/admin/metricas — Números de negocio en vivo para el panel de /admin/metricas.
 *
 * Reúne en una sola llamada lo que hasta ahora había que sacar a mano de tres
 * sitios distintos: usuarios y planes (Supabase), ofertas (Postgres del VPS) y
 * cobros (Stripe). La idea es poder mirar cómo va la cosa sin pedirle a nadie
 * que ejecute consultas.
 *
 * Protegido con ADMIN_SECRET, igual que el resto de /api/admin.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { secretIguales } from "@/lib/secret-compare";
import { descargasApple, descargasGooglePlay, type DescargasTienda } from "@/lib/descargas-tiendas";

export const dynamic = "force-dynamic";

function hace(dias: number): string {
  return new Date(Date.now() - dias * 86400000).toISOString();
}

// ─── Cachés ───────────────────────────────────────────────────────────────
// El panel se refresca solo cada 60 s y está pensado para dejarlo abierto todo
// el día. Sin caché, cada refresco relanzaría el recuento de ofertas (que
// recorre millones de filas) y las llamadas a las tiendas: un panel abierto
// tumbaría el servidor él solo. Ninguno de esos dos números cambia de un
// minuto para otro, así que se guardan un rato.
type Ofertas = { vivas: number; conEmail: number; paises: number; nuevas24h: number; error?: string };
let cacheOfertas: { dato: Ofertas; hasta: number } | null = null;
const OFERTAS_TTL = 10 * 60 * 1000;   // 10 minutos

type Descargas = { apple: DescargasTienda; googlePlay: DescargasTienda };
let cacheDescargas: { dato: Descargas; hasta: number } | null = null;
const DESCARGAS_TTL = 60 * 60 * 1000; // 1 hora — las tiendas publican una vez al día

/**
 * Dos formas de entrar, a propósito:
 *  - Con la sesión normal, si el email está en ADMIN_EMAILS. Es la que usa el
 *    panel: así Michel entra con su cuenta de siempre y no tiene que recordar
 *    ninguna clave (y si le roban el móvil, basta con cerrar la sesión).
 *  - Con la cabecera x-admin-secret, para scripts y comprobaciones desde el
 *    servidor, donde no hay sesión.
 */
async function esAdministrador(req: NextRequest): Promise<boolean> {
  // 1) Secreto de servidor (scripts)
  const secret = req.headers.get("x-admin-secret");
  if (secret && process.env.ADMIN_SECRET && secretIguales(secret, process.env.ADMIN_SECRET)) {
    return true;
  }

  // 2) Sesión de un email autorizado
  const admins = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
    .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  if (admins.length === 0) return false;

  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  try {
    const pub = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await pub.auth.getUser(auth.slice(7));
    return !!user?.email && admins.includes(user.email.toLowerCase());
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await esAdministrador(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /** Cuenta filas de una tabla, opcionalmente solo las creadas en los últimos N días. */
  const contar = async (tabla: string, desdeDias?: number): Promise<number> => {
    try {
      const base = sb.from(tabla).select("*", { count: "exact", head: true });
      const { count } = await (desdeDias === undefined ? base : base.gte("created_at", hace(desdeDias)));
      return count ?? 0;
    } catch { return 0; }
  };

  try {
    // ── Usuarios ────────────────────────────────────────────────────────
    const [total, alta1, alta7, alta30] = await Promise.all([
      contar("profiles"),
      contar("profiles", 1),
      contar("profiles", 7),
      contar("profiles", 30),
    ]);

    // Serie diaria de altas (30 días), para dibujar la evolución
    const { data: altas } = await sb
      .from("profiles")
      .select("created_at")
      .gte("created_at", hace(30))
      .order("created_at", { ascending: true });
    const porDia: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      porDia[new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)] = 0;
    }
    for (const a of altas || []) {
      const d = String(a.created_at).slice(0, 10);
      if (d in porDia) porDia[d]++;
    }

    // ── Planes ──────────────────────────────────────────────────────────
    const { data: perfiles } = await sb.from("profiles").select("plan, subscription_status, plan_source");
    const planes: Record<string, number> = {};
    let dePago = 0;
    let conOrigenPago = 0;
    for (const p of perfiles || []) {
      const plan = p.plan || "free";
      planes[plan] = (planes[plan] || 0) + 1;
      if (plan !== "free" && p.subscription_status === "active") dePago++;
      if (p.plan_source) conOrigenPago++;
    }

    // ── Actividad ───────────────────────────────────────────────────────
    const [cvTotal, cv7, cv30, conversaciones] = await Promise.all([
      contar("cv_sends"),
      contar("cv_sends", 7),
      contar("cv_sends", 30),
      contar("gusi_conversations"),
    ]);

    // ── Ofertas (Postgres del VPS) ──────────────────────────────────────
    //
    // Este recuento recorre TODA la tabla JobListing (varios millones de filas,
    // con un count(DISTINCT) encima), asi que tarda mas que los 15s de
    // statement_timeout que lleva el pool para las consultas normales. Ese
    // limite existe por una buena razon —una busqueda lenta dejaba consultas
    // huerfanas quemando la CPU— pero a una consulta de panel de administracion,
    // que la lanza una sola persona y a proposito, hay que darle mas margen.
    //
    // SET LOCAL dentro de una transaccion sube el limite SOLO para esta
    // consulta y revierte al hacer COMMIT, asi que la conexion vuelve al pool
    // con los 15s de siempre.
    let ofertas: Ofertas = { vivas: 0, conEmail: 0, paises: 0, nuevas24h: 0 };
    if (cacheOfertas && cacheOfertas.hasta > Date.now()) {
      ofertas = cacheOfertas.dato;
    } else {
      try {
        const { getPool } = await import("@/lib/db");
        const cliente = await getPool().connect();
        try {
          await cliente.query("BEGIN");
          await cliente.query("SET LOCAL statement_timeout = 60000");
          const r = await cliente.query<{ vivas: string; con_email: string; paises: string; nuevas: string }>(
            `SELECT count(*)::text AS vivas,
                    count(*) FILTER (WHERE "contactEmail" <> '')::text AS con_email,
                    count(DISTINCT country)::text AS paises,
                    count(*) FILTER (WHERE "scrapedAt" > NOW() - INTERVAL '24 hours')::text AS nuevas
               FROM "JobListing"
              WHERE "isActive" = true AND ("expiresAt" > NOW() OR "expiresAt" IS NULL)`
          );
          await cliente.query("COMMIT");
          const f = r.rows[0];
          ofertas = {
            vivas: parseInt(f?.vivas || "0", 10),
            conEmail: parseInt(f?.con_email || "0", 10),
            paises: parseInt(f?.paises || "0", 10),
            nuevas24h: parseInt(f?.nuevas || "0", 10),
          };
          cacheOfertas = { dato: ofertas, hasta: Date.now() + OFERTAS_TTL };
        } finally {
          cliente.release();
        }
      } catch (e) {
        // Antes este catch se tragaba el fallo en silencio y el panel pintaba
        // "0 ofertas", que parece un dato real y es mentira: asi es como una
        // consulta que moria por timeout se leia como "no queda ni una oferta
        // viva". Si falla, que se vea que ha fallado.
        ofertas.error = (e as Error).message;
        console.error("[admin/metricas] recuento de ofertas:", (e as Error).message);
      }
    }

    // ── Descargas en las tiendas ────────────────────────────────────────
    let descargas: Descargas;
    if (cacheDescargas && cacheDescargas.hasta > Date.now()) {
      descargas = cacheDescargas.dato;
    } else {
      const [apple, googlePlay] = await Promise.all([descargasApple(), descargasGooglePlay()]);
      descargas = { apple, googlePlay };
      cacheDescargas = { dato: descargas, hasta: Date.now() + DESCARGAS_TTL };
    }

    // ── Cobros (Stripe) ─────────────────────────────────────────────────
    let cobros = { numero: 0, importe: 0, moneda: "EUR", disponible: false };
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const res = await fetch("https://api.stripe.com/v1/charges?limit=100", {
          headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const d = await res.json() as { data?: Array<{ paid: boolean; refunded: boolean; amount: number; currency: string }> };
          const ok = (d.data || []).filter(c => c.paid && !c.refunded);
          cobros = {
            numero: ok.length,
            importe: ok.reduce((s, c) => s + c.amount, 0) / 100,
            moneda: (ok[0]?.currency || "eur").toUpperCase(),
            disponible: true,
          };
        }
      }
    } catch { /* Stripe caído no debe tumbar el panel */ }

    return NextResponse.json({
      generado: new Date().toISOString(),
      usuarios: { total, alta1, alta7, alta30, porDia },
      planes,
      suscriptores: { activos: dePago, conOrigenPago },
      actividad: { cvTotal, cv7, cv30, conversaciones },
      ofertas,
      descargas,
      cobros,
    });
  } catch (e) {
    console.error("[admin/metricas]", (e as Error).message);
    return NextResponse.json({ error: "Error al reunir las métricas" }, { status: 500 });
  }
}
