/**
 * lib/stripe.ts — Cliente centralizado de Stripe
 *
 * Inicializa el cliente de Stripe con la clave secreta del servidor.
 * Exporta constantes de precios y una función para obtener el plan
 * a partir del price ID de Stripe.
 */

import Stripe from "stripe";

// ─── Cliente Stripe (lazy) ────────────────────────────────────────────────────

// Instancia singleton del cliente Stripe, creada bajo demanda
let _stripeInstance: Stripe | null = null;

/**
 * Devuelve el cliente Stripe inicializado con la clave secreta del servidor.
 * Se crea de forma lazy para evitar errores durante el build de Next.js
 * cuando STRIPE_SECRET_KEY no está disponible en el entorno de compilación.
 */
export function getStripe(): Stripe {
  if (!_stripeInstance) {
    _stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }
  return _stripeInstance;
}

// Exportamos también como alias para compatibilidad con código existente
export const stripe = getStripe;

// ─── Constantes de precios ────────────────────────────────────────────────────

/**
 * IDs de precios de Stripe para cada plan.
 * Se configuran en las variables de entorno para flexibilidad entre entornos.
 */
export const PLANES = {
  BASICO: process.env.STRIPE_PRICE_BASICO ?? "price_basico",
  PRO: process.env.STRIPE_PRICE_PRO ?? "price_pro",
  EMPRESA: process.env.STRIPE_PRICE_EMPRESA ?? "price_empresa",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Devuelve el nombre del plan ('free' | 'pro' | 'empresa')
 * a partir del price ID de Stripe.
 *
 * @param priceId - ID del precio de Stripe (ej: price_xxx)
 * @returns Nombre del plan correspondiente
 */
export function getPlanFromPriceId(
  priceId: string
): "free" | "basico" | "pro" | "empresa" {
  if (priceId === PLANES.BASICO) return "basico";
  if (priceId === PLANES.PRO) return "pro";
  if (priceId === PLANES.EMPRESA) return "empresa";
  return "free";
}
