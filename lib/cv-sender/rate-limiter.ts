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
import { PLAN_LIMITS, type UserPlan } from "./plans";
import { LIMITS, getPlanEfectivo } from "@/lib/plan-limits";

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

export type { UserPlan };

/**
 * LOS ESTADOS QUE GASTAN CUOTA. Se exporta para que todo el mundo cuente igual.
 *
 * Faltaban "visto" y "respondido", y eso abría un agujero: el webhook pasa el
 * envío de "enviado" a "visto" en cuanto la empresa abre el correo, así que ese
 * envío desaparecía del recuento y el usuario recuperaba un hueco de su cuota.
 * Dicho de otra forma: cuanto mejor te iba, más CVs podías mandar por encima de
 * tu plan. En producción había ya diez filas en "visto" sin contar para nadie.
 *
 * Y hacía además que la app se contradijera sola: la pantalla calculaba los
 * disponibles con una lista y el límite se aplicaba con otra, así que podías
 * leer "te quedan 3" y recibir "límite alcanzado" al pulsar Enviar.
 *
 * "fallido" y "cancelado" quedan fuera a propósito: lo que no llegó a salir no
 * debe gastar cuota. "pendiente" sí cuenta, para reservar el hueco mientras el
 * envío está en la cola.
 */
export const ESTADOS_QUE_GASTAN_CUOTA = ["enviado", "pendiente", "visto", "respondido"] as const;

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
  const limite = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  // ── LA LISTA NEGRA SE COMPRUEBA SIEMPRE, Y VA LA PRIMERA ─────────────────
  //
  // Estaba DEBAJO del atajo del plan "empresa", que retorna antes. O sea que el
  // plan que mas envia —200 CVs al dia— era el UNICO que se saltaba la lista de
  // empresas que pidieron expresamente no recibir candidaturas espontaneas.
  //
  // Esto no es una cuestion de cuota: es una peticion de la otra parte, y no
  // depende de lo que pague quien envia. Ademas es justo el plan que mas
  // volumen mueve, o sea el que mas quemaria nuestro dominio y el que mas
  // papeletas tiene de acabar en una reclamacion.
  if (companyEmail) {
    const enBlacklist = await isInBlacklist(companyEmail);
    if (enBlacklist) {
      return {
        allowed: false,
        reason: `La empresa ${companyEmail} pidió no recibir CVs espontáneos, así que no se le envía.`,
        enviadosHoy: 0,
        enviadosEsteMes: 0,
        limiteHoy: limite.perDay,
        limiteMes: limite.perMonth,
        cvsRestantesHoy: 0,
      };
    }
  }

  // Si el plan es "empresa", no hay tope de cantidad (pero la lista negra de
  // arriba ya se ha respetado).
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

  // ── Contar envíos del usuario hoy y este mes ─────────────────────────────
  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();

  const { count: enviadosHoy } = await getSupabase()
    .from("cv_sends")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ESTADOS_QUE_GASTAN_CUOTA)
    .gte("created_at", inicioHoy);

  const { count: enviadosEsteMes } = await getSupabase()
    .from("cv_sends")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ESTADOS_QUE_GASTAN_CUOTA)
    .gte("created_at", inicioMes);

  const hoy = enviadosHoy ?? 0;
  const mes = enviadosEsteMes ?? 0;

  // ── Verificar límites ────────────────────────────────────────────────────
  if (hoy >= limite.perDay) {
    return {
      allowed: false,
      reason: `🎯 ¡Buen ritmo! Ya has enviado ${limite.perDay} CVs hoy, el máximo de tu plan ${plan}. Descansa y vuelve mañana — tus candidaturas ya están trabajando. ¡Mucha suerte! 🍀`,
      enviadosHoy: hoy,
      enviadosEsteMes: mes,
      limiteHoy: limite.perDay,
      limiteMes: limite.perMonth,
      cvsRestantesHoy: 0,
    };
  }

  // EL LIMITE SEMANAL NO SE COMPROBABA NUNCA. Estaba declarado en
  // plan-limits.ts (enviosCVSemana) y solo se usaba para calcular el mensual
  // como semana*4. Sin el, alguien podia gastarse el mes entero en nueve dias
  // a base de rafagas diarias, que es justo lo que el limite semanal existe
  // para evitar: repartir el envio en el tiempo en vez de bombardear.
  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - 7);
  const { count: enviadosSemana } = await getSupabase()
    .from("cv_sends")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ESTADOS_QUE_GASTAN_CUOTA)
    .gte("created_at", inicioSemana.toISOString());

  const semana = enviadosSemana ?? 0;
  const limiteSemana = LIMITS[plan]?.enviosCVSemana ?? Infinity;
  if (semana >= limiteSemana) {
    return {
      allowed: false,
      reason: `Has enviado ${semana} CVs en los ultimos siete dias, el maximo de tu plan ${plan}. Se te van liberando segun pasan los dias.`,
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
      reason: `📦 ¡Vaya mes! Has alcanzado el tope mensual de ${limite.perMonth} CVs en el plan ${plan}. Con el plan Pro son ${PLAN_LIMITS.pro.perMonth} al mes.`,
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
  // SE LEEN LAS DOS COLUMNAS, NO SOLO EL PLAN.
  //
  // Antes esto pedia solo `plan` y se creia el valor guardado sin mirar si la
  // suscripcion seguia viva. Quien dejaba de pagar el plan Pro conservaba sus
  // 50 envios de CV al dia — que es la funcion mas cara que tenemos despues de
  // la camara, porque cada uno manda un correo de verdad.
  //
  // La comprobacion existia (getPlanEfectivo) y la usaba UN solo sitio: Guzzi.
  // O sea que lo unico protegido era el chat.
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("plan, subscription_status")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.log(`[RateLimiter] No se encontró plan para ${userId}, usando "free" por defecto`);
    return "free";
  }

  const plan = getPlanEfectivo(data.plan, data.subscription_status) as UserPlan;
  return ["free", "basico", "esencial", "pro", "empresa"].includes(plan) ? plan : "free";
}
