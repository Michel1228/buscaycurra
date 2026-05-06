/**
 * lib/stripe.ts — Cliente centralizado de Stripe
 */

import Stripe from "stripe";

let _stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripeInstance) {
    _stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }
  return _stripeInstance;
}

export const stripe = getStripe;

export const PLANES = {
  BASICO: process.env.STRIPE_PRICE_BASICO ?? "price_basico",
  PRO: process.env.STRIPE_PRICE_PRO ?? "price_pro",
  EMPRESA: process.env.STRIPE_PRICE_EMPRESA ?? "price_empresa",
} as const;

export function getPlanFromPriceId(
  priceId: string
): "free" | "basico" | "pro" | "empresa" {
  if (priceId === PLANES.BASICO) return "basico";
  if (priceId === PLANES.PRO) return "pro";
  if (priceId === PLANES.EMPRESA) return "empresa";
  return "free";
}
