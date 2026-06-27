/**
 * cv-sender/plans.ts — Límites de envío por plan (ESPEJO de lib/plan-limits.ts)
 * 
 * ⚠️ NO MODIFICAR sin modificar también lib/plan-limits.ts
 */
export type UserPlan = "free" | "basico" | "esencial" | "pro" | "empresa";

export const PLAN_LIMITS: Record<UserPlan, { perDay: number; perMonth: number }> = {
  free:    { perDay: 3,        perMonth: 5         },  // Trial: 3/día, 5/mes para probar
  basico:  { perDay: 15,       perMonth: 400       },  // ≈ 100/semana * 4
  esencial:{ perDay: 15,       perMonth: 400       },  // ≈ 100/semana * 4
  pro:     { perDay: 50,       perMonth: 1400      },  // ≈ 350/semana * 4
  empresa: { perDay: Infinity, perMonth: Infinity  },  // Ilimitado
};
