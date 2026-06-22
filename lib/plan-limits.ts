/**
 * lib/plan-limits.ts — Límites por plan de suscripción
 * 
 * FUENTE ÚNICA de verdad para límites. Tanto UI como enforcement.
 * Límites diarios se resetean a las 00:00 UTC.
 * Free usa date_key fija "trial" (límite TOTAL, no diario).
 */

export type PlanTier = "free" | "basico" | "esencial" | "pro" | "empresa";

export interface PlanLimits {
  name: string;
  guzziModel: string;              // Modelo de IA para Guzzi
  guzziMaxConsultasDia: number;    // Consultas al chat por día (free: TOTAL trial)
  enviosCVDia: number;             // Envíos de CV por día
  enviosCVSemana: number;          // Envíos de CV por semana
  camaraMaxUsos: number;           // 📸 Búsqueda por cámara (free: TOTAL, pago: /día)
  cvsGuardados: number;            // CVs que puede tener guardados
  cvConIAGratis: number;           // CVs gratuitos creados con IA (TOTAL)
  cartaPersonalizada: boolean;     // Si la carta se personaliza con IA
  prepararEntrevista: boolean;     // Simulador de entrevista con IA
  ofertasGuardadas: number;        // Ofertas que puede guardar
  codigosPromocionales: boolean;   // Puede crear códigos de referido
  apiAccess: boolean;              // Acceso a API externa
}

const LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    name: "Free",
    guzziModel: "deepseek-v4-pro",
    guzziMaxConsultasDia: 2,          // 2 consultas TOTAL (trial)
    enviosCVDia: 0,
    enviosCVSemana: 0,
    camaraMaxUsos: 3,                 // 3 búsquedas TOTAL — gancho de adquisición
    cvsGuardados: 1,
    cvConIAGratis: 1,                 // 1 CV gratis con IA
    cartaPersonalizada: false,
    prepararEntrevista: false,
    ofertasGuardadas: 10,
    codigosPromocionales: false,
    apiAccess: false,
  },
  basico: {
    name: "Básico",
    guzziModel: "deepseek-v4-pro",
    guzziMaxConsultasDia: 30,
    enviosCVDia: 15,
    enviosCVSemana: 100,
    camaraMaxUsos: 10,                // Legacy — mismo que esencial
    cvsGuardados: 3,
    cvConIAGratis: 3,
    cartaPersonalizada: true,
    prepararEntrevista: true,
    ofertasGuardadas: 50,
    codigosPromocionales: false,
    apiAccess: false,
  },
  esencial: {
    name: "Esencial",
    guzziModel: "deepseek-v4-pro",
    guzziMaxConsultasDia: 30,
    enviosCVDia: 15,
    enviosCVSemana: 100,
    camaraMaxUsos: 10,                // 10 fotos/día — cubre jornada de búsqueda
    cvsGuardados: 3,
    cvConIAGratis: 3,
    cartaPersonalizada: true,
    prepararEntrevista: true,
    ofertasGuardadas: 50,
    codigosPromocionales: false,
    apiAccess: false,
  },
  pro: {
    name: "Pro",
    guzziModel: "deepseek-v4-pro",
    guzziMaxConsultasDia: 100,
    enviosCVDia: 50,
    enviosCVSemana: 350,
    camaraMaxUsos: 30,                // 30 fotos/día — recruiter intensivo
    cvsGuardados: 10,
    cvConIAGratis: 10,
    cartaPersonalizada: true,
    prepararEntrevista: true,
    ofertasGuardadas: 200,
    codigosPromocionales: true,
    apiAccess: false,
  },
  empresa: {
    name: "Empresa",
    guzziModel: "deepseek-v4-pro",
    guzziMaxConsultasDia: 999999,
    enviosCVDia: 200,
    enviosCVSemana: 1500,
    camaraMaxUsos: 999999,            // Ilimitado
    cvsGuardados: 999,
    cvConIAGratis: 999999,
    cartaPersonalizada: true,
    prepararEntrevista: true,
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

/** Verifica si el plan permite usar la cámara */
export function canUseCamera(plan?: string | null): boolean {
  return getPlanLimits(plan).camaraMaxUsos > 0;
}
