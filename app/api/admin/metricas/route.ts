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

export const dynamic = "force-dynamic";

function hace(dias: number): string {
  return new Date(Date.now() - dias * 86400000).toISOString();
}

export async function GET(req: NextRequest) {
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "ADMIN_SECRET no configurada" }, { status: 503 });
  }
  const secret = req.headers.get("x-admin-secret");
  if (!secretIguales(secret, process.env.ADMIN_SECRET)) {
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
    let ofertas = { vivas: 0, conEmail: 0, paises: 0, nuevas24h: 0 };
    try {
      const { getPool } = await import("@/lib/db");
      const r = await getPool().query<{ vivas: string; con_email: string; paises: string; nuevas: string }>(
        `SELECT count(*)::text AS vivas,
                count(*) FILTER (WHERE "contactEmail" <> '')::text AS con_email,
                count(DISTINCT country)::text AS paises,
                count(*) FILTER (WHERE "scrapedAt" > NOW() - INTERVAL '24 hours')::text AS nuevas
           FROM "JobListing"
          WHERE "isActive" = true AND ("expiresAt" > NOW() OR "expiresAt" IS NULL)`
      );
      const f = r.rows[0];
      ofertas = {
        vivas: parseInt(f?.vivas || "0", 10),
        conEmail: parseInt(f?.con_email || "0", 10),
        paises: parseInt(f?.paises || "0", 10),
        nuevas24h: parseInt(f?.nuevas || "0", 10),
      };
    } catch { /* si la BD de ofertas no responde, el resto del panel sigue */ }

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
      cobros,
    });
  } catch (e) {
    console.error("[admin/metricas]", (e as Error).message);
    return NextResponse.json({ error: "Error al reunir las métricas" }, { status: 500 });
  }
}
