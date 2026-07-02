/**
 * lib/revenuecat.ts — Utilidades de RevenueCat (Apple In-App Purchase en iOS)
 *
 * Paralelo a lib/stripe.ts. Centraliza el mapeo entre los Product IDs de
 * App Store Connect y los planes internos, para poder reutilizarlo tanto en el
 * webhook (server) como en el cliente sin duplicar strings.
 */

export type PlanIAP = "esencial" | "pro" | "empresa";

/**
 * Product IDs configurados en App Store Connect (Subscription Group
 * "BuscayCurra Planes"). Deben coincidir EXACTAMENTE con los del dashboard.
 */
export const PRODUCT_IDS: Record<PlanIAP, string> = {
  esencial: "es.buscaycurra.app.esencial.monthly",
  // "pro.monthly" se creó con duración errónea (1 semana) y hubo que borrarlo;
  // Apple no permite reutilizar un Product ID borrado, por eso usamos "pro.mensual".
  pro: "es.buscaycurra.app.pro.mensual",
  empresa: "es.buscaycurra.app.empresa.monthly",
};

/**
 * Identificadores de los Packages dentro del Offering "default" de RevenueCat.
 * El cliente busca el package por este identificador al comprar un plan.
 */
export const PACKAGE_IDS: Record<PlanIAP, string> = {
  esencial: "esencial_monthly",
  pro: "pro_monthly",
  empresa: "empresa_monthly",
};

/**
 * Traduce un Product ID de App Store Connect al plan interno.
 * Equivalente a getPlanFromPriceId() de lib/stripe.ts.
 */
export function getPlanFromProductId(
  productId: string
): "free" | PlanIAP {
  if (productId === PRODUCT_IDS.esencial) return "esencial";
  if (productId === PRODUCT_IDS.pro) return "pro";
  if (productId === PRODUCT_IDS.empresa) return "empresa";
  return "free";
}
