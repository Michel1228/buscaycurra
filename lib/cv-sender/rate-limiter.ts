/**
 * rate-limiter.ts — Control de límites de envío para evitar spam
 *
 * Cada plan tiene un número máximo de CVs que puede enviar:
 *   - Free:    2 CVs/día,  20/mes
 *   - Pro:    10 CVs/día, 200/mes
 *   - Empresa: sin límite
 *
 * También gestiona la blacklist de empresas que no quieren CVs espontáneos.
 */

import { createClient } from "@supabase/supabase-js";
import { RATE_LIMITS } from "./queue";

// ─── Cliente Supabase (inicializado de forma diferida) ────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Planes de usuario disponibles */
export type UserPlan = "free" | "basico" | "pro" | "empresa";

/** Resultado de la verificación de límites */
export interface RateLimitResult {
  allowed: boolean; // ¿Puede enviar?
  reason?: string; // Si no puede, ¿por qué?
  enviadosHoy: number; // CVs enviados hoy
  enviadosEsteMes: number; // CVs enviados este mes
  limiteHoy: number | typeof Infinity; // Límite diario del plan (Infinity = ilimitado)
  limiteMes: number | typeof Infinity; // Límite mensual del plan (Infinity = ilimitado)
  cvsRestantesHoy: number | typeof Infinity; // CVs que puede enviar hoy todavía
}

// ─── Funciones Principales ───────────────────────────────────────────────────

/**
 * Verifica si un usuario puede enviar un CV según su plan y los límites actuales.
 *
 * Comprueba:
 *   1. Límite diario del plan
 *   2. Límite mensual del plan
 *   3. Si la empresa está en la blacklist
 *
 * @param userId - ID del usuario en Supabase
 * @param plan - Plan del usuario (free, pro, empresa)
 * @param companyEmail - Email de la empresa destino (para verificar blacklist)
 * @returns Objeto con si puede enviar y el motivo si no puede
 */
export async function checkRateLimit(
  userId: string,
  plan: UserPlan,
  companyEmail?: string
): Promise<RateLimitResult> {
  // Usamos las variables de entorno si están definidas, o los valores por defecto del plan
  const limites = {
    free: {
      perDay: parseInt(process.env.MAX_CVS_PER_DAY_FREE ?? "1"),
      perMonth: 5,
    },
    basico: {
      perDay: parseInt(process.env.MAX_CVS_PER_DAY_BASICO ?? "5"),
      perMonth: 60,
    },
    pro: {
      perDay: parseInt(process.env.MAX_CVS_PER_DAY_PRO ?? "10"),
      perMonth: 200,
    },
    empresa: {
      perDay: Infinity,
      perMonth: Infinity,
    },
  };

  const limite = limites[plan] ?? limites.free;

  // Si el plan es "empresa", siempre puede enviar
  if (plan === "empresa") {
    return {
      allowed: true,
      enviadosHoy: 0,
      enviadosEsteMes: 0,
      limiteHoy: Infinity,
      limiteMes: Infinity,
      cvsRestantesHoy: Infinity,
    } satisfies RateLimitResult;
  }

  // ── Verificar blacklist ──────────────────────────────────────────────────
  if (companyEmail) {
    const enBlacklist = await isInBlacklist(companyEmail);
    if (enBlacklist) {
      return {
        allowed: false,
        reason: `La empresa ${companyEmail} está en la blacklist y no acepta CVs espontáneos.`,
        enviadosHoy: 0,
        enviadosEsteMes: 0,
        limiteHoy: limite.perDay,
        limiteMes: limite.perMonth,
        cvsRestantesHoy: 0,
      };
    }
  }

  // ── Contar envíos del usuario hoy y este mes ─────────────────────────────
  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();

  const { count: enviadosHoy } = await getSupabase()
    .from("cv_sends")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["enviado", "pendiente"]) // Contamos también los pendientes
    .gte("created_at", inicioHoy);

  const { count: enviadosEsteMes } = await getSupabase()
    .from("cv_sends")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["enviado", "pendiente"])
    .gte("created_at", inicioMes);

  const hoy = enviadosHoy ?? 0;
  const mes = enviadosEsteMes ?? 0;

  // ── Verificar límites ────────────────────────────────────────────────────
  if (hoy >= limite.perDay) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite diario de ${limite.perDay} CVs para el plan ${plan}. Prueba mañana o actualiza tu plan.`,
      enviadosHoy: hoy,
      enviadosEsteMes: mes,
      limiteHoy: limite.perDay,
      limiteMes: limite.perMonth,
      cvsRestantesHoy: 0,
    };
  }

  if (mes >= limite.perMonth) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite mensual de ${limite.perMonth} CVs para el plan ${plan}. Actualiza tu plan para enviar más.`,
      enviadosHoy: hoy,
      enviadosEsteMes: mes,
      limiteHoy: limite.perDay,
      limiteMes: limite.perMonth,
      cvsRestantesHoy: 0,
    };
  }

  // ── Todo OK, puede enviar ────────────────────────────────────────────────
  return {
    allowed: true,
    enviadosHoy: hoy,
    enviadosEsteMes: mes,
    limiteHoy: limite.perDay,
    limiteMes: limite.perMonth,
    cvsRestantesHoy: limite.perDay - hoy,
  };
}

/**
 * Verifica si una empresa está en la blacklist.
 *
 * @param companyEmail - Email de la empresa a verificar
 * @returns true si está en la blacklist (NO se debe enviar)
 */
export async function isInBlacklist(companyEmail: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from("cv_blacklist")
    .select("id")
    .eq("company_email", companyEmail.toLowerCase())
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no encontrado, es normal
    console.error("[RateLimiter] Error verificando blacklist:", error.message);
  }

  return !!data;
}

/**
 * Añade una empresa a la blacklist.
 * Las empresas en la blacklist no recibirán CVs de ningún usuario.
 *
 * @param companyEmail - Email de la empresa a bloquear
 * @param reason - Motivo (ej: "empresa cerrada", "no acepta CVs espontáneos")
 */
export async function addToBlacklist(
  companyEmail: string,
  reason?: string
): Promise<void> {
  const { error } = await getSupabase().from("cv_blacklist").upsert(
    {
      company_email: companyEmail.toLowerCase(),
      reason: reason ?? "No especificado",
      added_at: new Date().toISOString(),
    },
    { onConflict: "company_email" }
  );

  if (error) {
    console.error(`[RateLimiter] Error añadiendo ${companyEmail} a blacklist:`, error.message);
    throw new Error(`No se pudo añadir a la blacklist: ${error.message}`);
  }

  console.log(`[RateLimiter] Empresa ${companyEmail} añadida a la blacklist. Motivo: ${reason ?? "No especificado"}`);
}

/**
 * Elimina una empresa de la blacklist.
 * Útil si la empresa cambia su política de RRHH.
 *
 * @param companyEmail - Email de la empresa a desbloquear
 */
export async function removeFromBlacklist(companyEmail: string): Promise<void> {
  const { error } = await getSupabase()
    .from("cv_blacklist")
    .delete()
    .eq("company_email", companyEmail.toLowerCase());

  if (error) {
    console.error(`[RateLimiter] Error eliminando ${companyEmail} de blacklist:`, error.message);
    throw new Error(`No se pudo eliminar de la blacklist: ${error.message}`);
  }

  console.log(`[RateLimiter] Empresa ${companyEmail} eliminada de la blacklist.`);
}

/**
 * Obtiene la lista completa de empresas en la blacklist.
 * Útil para el panel de administración.
 */
export async function getBlacklist(): Promise<Array<{ company_email: string; reason: string; added_at: string }>> {
  const { data, error } = await getSupabase()
    .from("cv_blacklist")
    .select("company_email, reason, added_at")
    .order("added_at", { ascending: false });

  if (error) {
    console.error("[RateLimiter] Error obteniendo blacklist:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Determina el plan de un usuario consultando Supabase.
 * Si no tiene plan, devuelve "free" por defecto.
 *
 * @param userId - ID del usuario
 */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.log(`[RateLimiter] No se encontró plan para ${userId}, usando "free" por defecto`);
    return "free";
  }

  const plan = data.plan as UserPlan;
  return ["free", "pro", "empresa"].includes(plan) ? plan : "free";
}
