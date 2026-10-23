/**
 * lib/metricas/suscriptores.ts (servidor) — Cuánta gente paga de verdad.
 *
 * SUSCRIPTORES DE VERDAD, NO FICHAS CON PLAN. Hasta el 6 oct 2026 se contaba
 * cualquier ficha con plan y estado "active", y el panel decía 3 cuando eran 0:
 * la cuenta de Michel, la de demostración para Apple y una regalada (en Stripe
 * no había ninguna suscripción activa). Cuentan las suscripciones activas o en
 * prueba de Stripe, más las compras de iPhone (RevenueCat) de cuentas reales.
 *
 * La usan el panel (/api/admin/metricas) y el contador del escritorio
 * (lib/metricas/contador.ts). El contador le preguntaba antes al panel, y el
 * panel recuenta millones de ofertas: tardaba más de 25 s (23 oct 2026).
 */
import { getStripe } from "@/lib/stripe";

export type PerfilDePago = { plan: string | null; subscription_status: string | null; plan_source: string | null; email: string | null };

/** null si Stripe no responde: mejor "no se sabe" que un 0 que parece un dato. */
export async function suscriptoresDePago(perfiles: PerfilDePago[]): Promise<number | null> {
  const deIphone = perfiles.filter((p) => (p.plan || "free") !== "free" && p.subscription_status === "active"
    && p.plan_source === "revenuecat" && !/@(resend\.dev|buscaycurra\.es)$/i.test(p.email || "")).length;
  try {
    let deStripe = 0;
    for (const estado of ["active", "trialing"] as const) {
      for await (const _sub of getStripe().subscriptions.list({ status: estado, limit: 100 })) deStripe++;
    }
    return deStripe + deIphone;
  } catch (e) {
    console.error("[suscriptores] Stripe:", (e as Error).message);
    return null;
  }
}
