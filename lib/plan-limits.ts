/**
 * lib/plan-limits.ts — Límites por plan de suscripción
 * 
 * Controla qué puede hacer cada usuario según su plan.
 * Los límites se resetean diariamente (consultas, envíos) o semanalmente (envíos).
 */

export type PlanTier = "free" | "basico" | "esencial" | "pro" | "empresa";

export interface PlanLimits {
  name: string;
  guzziModel: string;            // Modelo de IA para Guzzi
  guzziMaxConsultasDia: number;  // Consultas al chat por día
  enviosCVDia: number;           // Envíos de CV por día
  enviosCVSemana: number;        // Envíos de CV por semana
  cvsGuardados: number;          // CVs que puede tener guardados
  cartaPersonalizada: boolean;   // Si la carta se personaliza con IA
  ofertasGuardadas: number;      // Ofertas que puede guardar
  codigosPromocionales: boolean; // Puede crear códigos de referido
  apiAccess: boolean;            // Acceso a API externa
}

const LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    name: "Free",
    guzziModel: "none",           // Sin Guzzi
    guzziMaxConsultasDia: 0,
    enviosCVDia: 0,
    enviosCVSemana: 0,
    cvsGuardados: 1,
    cartaPersonalizada: false,
    ofertasGuardadas: 10,
    codigosPromocionales: false,
    apiAccess: false,
  },
  basico: {
    name: "Básico",
    guzziModel: "gpt-4o-mini",
    guzziMaxConsultasDia: 30,
    enviosCVDia: 10,
    enviosCVSemana: 50,
    cvsGuardados: 3,
    cartaPersonalizada: true,
    ofertasGuardadas: 50,
    codigosPromocionales: false,
    apiAccess: false,
  },
  esencial: {
    name: "Esencial",
    guzziModel: "gpt-4o-mini",
    guzziMaxConsultasDia: 30,
    enviosCVDia: 10,
    enviosCVSemana: 50,
    cvsGuardados: 3,
    cartaPersonalizada: true,
    ofertasGuardadas: 50,
    codigosPromocionales: false,
    apiAccess: false,
  },
  pro: {
    name: "Pro",
    guzziModel: "gpt-4o",
    guzziMaxConsultasDia: 200,
    enviosCVDia: 100,
    enviosCVSemana: 500,
    cvsGuardados: 10,
    cartaPersonalizada: true,
    ofertasGuardadas: 200,
    codigosPromocionales: true,
    apiAccess: false,
  },
  empresa: {
    name: "Empresa",
    guzziModel: "gpt-4o",         // El mejor
    guzziMaxConsultasDia: 999999, // Ilimitado
    enviosCVDia: 200,
    enviosCVSemana: 1000,
    cvsGuardados: 999,
    cartaPersonalizada: true,
    ofertasGuardadas: 9999,
    codigosPromocionales: true,
    apiAccess: true,
  },
};

/** Obtiene los límites para un plan. Si no se reconoce, devuelve free. */
export function getPlanLimits(plan?: string | null): PlanLimits {
  if (!plan) return LIMITS.free;
  const tier = plan.toLowerCase() as PlanTier;
  return LIMITS[tier] ?? LIMITS.free;
}

/** Modelo real de IA que usará Guzzi según el plan */
export function getGuzziModel(plan?: string | null): string {
  return getPlanLimits(plan).guzziModel;
}

/** Verifica si el plan tiene acceso a Guzzi */
export function canUseGuzzi(plan?: string | null): boolean {
  return getPlanLimits(plan).guzziMaxConsultasDia > 0;
}
