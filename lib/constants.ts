/**
 * lib/constants.ts — Constantes compartidas de BuscayCurra
 *
 * Centraliza los valores que se usan en múltiples archivos
 * para evitar magic strings y errores de tipeo.
 */

// ─── Planes de usuario ────────────────────────────────────────────────────────

/** Planes disponibles en la plataforma */
export const PLANES_VALIDOS = ["free", "pro", "empresa"] as const;

/** Tipo para un plan válido */
export type Plan = (typeof PLANES_VALIDOS)[number];

/**
 * Comprueba si un string es un plan válido.
 * Útil para validar datos de APIs externas (Stripe webhooks, etc.)
 */
export function esPlanValido(valor: string): valor is Plan {
  return (PLANES_VALIDOS as readonly string[]).includes(valor);
}

// ─── Límites por plan ─────────────────────────────────────────────────────────

/** CVs máximos por día según el plan */
export const LIMITE_CVS_DIA: Record<Plan, number> = {
  free: 2,
  pro: 10,
  empresa: Infinity,
};

/** CVs máximos por mes según el plan */
export const LIMITE_CVS_MES: Record<Plan, number> = {
  free: 20,
  pro: 200,
  empresa: Infinity,
};

// ─── Colores de marca ─────────────────────────────────────────────────────────

export const COLORES = {
  azul: "#2563EB",
  naranja: "#F97316",
} as const;
