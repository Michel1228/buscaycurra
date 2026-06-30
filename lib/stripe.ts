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

export const stripe = (typeof window === "undefined" && process.env.STRIPE_SECRET_KEY) ? getStripe() : null as unknown as Stripe;

export const PLANES = {
  BASICO: requireEnvPrice("STRIPE_PRICE_BASICO"),
  ESENCIAL: requireEnvPrice("STRIPE_PRICE_ESENCIAL"),
  PRO: requireEnvPrice("STRIPE_PRICE_PRO"),
  EMPRESA: requireEnvPrice("STRIPE_PRICE_EMPRESA"),
} as const;

function requireEnvPrice(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return val;
}

export function getPlanFromPriceId(
  priceId: string
): "free" | "basico" | "esencial" | "pro" | "empresa" {
  if (priceId === PLANES.BASICO) return "basico";
  if (priceId === PLANES.ESENCIAL) return "esencial";
  if (priceId === PLANES.PRO) return "pro";
  if (priceId === PLANES.EMPRESA) return "empresa";
  return "free";
}
