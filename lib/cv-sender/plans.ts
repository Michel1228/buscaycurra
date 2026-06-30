/**
 * cv-sender/plans.ts — Límites de envío por plan
 *
 * FUENTE ÚNICA: lib/plan-limits.ts
 * Este archivo re-exporta los límites en el formato que espera el módulo cv-sender.
 */

import { LIMITS, type PlanTier, getPlanLimits } from "../plan-limits";

export type UserPlan = PlanTier;

export interface PlanSendLimits {
  perDay: number;
  perMonth: number;
}

export const PLAN_LIMITS: Record<UserPlan, PlanSendLimits> = {
  free: {
    perDay: LIMITS.free.enviosCVDia,
    perMonth: LIMITS.free.enviosCVSemana * 4,
  },
  basico: {
    perDay: LIMITS.basico.enviosCVDia,
    perMonth: LIMITS.basico.enviosCVSemana * 4,
  },
  esencial: {
    perDay: LIMITS.esencial.enviosCVDia,
    perMonth: LIMITS.esencial.enviosCVSemana * 4,
  },
  pro: {
    perDay: LIMITS.pro.enviosCVDia,
    perMonth: LIMITS.pro.enviosCVSemana * 4,
  },
  empresa: {
    perDay: Infinity,
    perMonth: Infinity,
  },
};

// Re-export getPlanLimits para compatibilidad
export { getPlanLimits };
