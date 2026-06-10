/**
 * lib/guzzi-limits.ts — Verificación de límites para el chat de Guzzi
 * 
 * Se llama desde la API route de Guzzi antes de procesar cualquier mensaje.
 * Verifica:
 * 1. Que el usuario tiene un plan que permite Guzzi
 * 2. Que no ha superado el límite diario de consultas
 * 3. Registra la consulta
 */

import { createClient } from "@supabase/supabase-js";
import { canUseGuzzi, getPlanLimits } from "./plan-limits";
import { trackGuzziQuery } from "./usage-tracker";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface GuzziCheckResult {
  allowed: boolean;
  plan: string;
  planName: string;
  guzziModel: string;
  remaining: number;
  errorMessage?: string;
}

/**
 * Verifica si un usuario puede usar Guzzi y registra la consulta.
 * Debe llamarse ANTES de procesar el mensaje.
 */
export async function checkGuzziAccess(userId: string): Promise<GuzziCheckResult> {
  // Obtener el plan del usuario
  const { data: profile } = await getSupabase()
    .from("profiles")
    .select("plan, subscription_status")
    .eq("id", userId)
    .single();

  const plan = profile?.plan ?? "free";
  const limits = getPlanLimits(plan);

  // Verificar si el plan permite Guzzi
  if (!canUseGuzzi(plan)) {
    return {
      allowed: false,
      plan,
      planName: limits.name,
      guzziModel: "none",
      remaining: 0,
      errorMessage: `Guzzi requiere un plan de pago. Tu plan actual es ${limits.name}. Contrata Esencial desde 2,99€/mes en /app/perfil`,
    };
  }

  // Trackear y verificar límite diario
  const { allowed, remaining } = await trackGuzziQuery(userId, plan);

  if (!allowed) {
    return {
      allowed: false,
      plan,
      planName: limits.name,
      guzziModel: limits.guzziModel,
      remaining: 0,
      errorMessage: `Has alcanzado el límite de ${limits.guzziMaxConsultasDia} consultas hoy con el plan ${limits.name}. Mañana se resetea. Sube a Pro para consultas ilimitadas.`,
    };
  }

  return {
    allowed: true,
    plan,
    planName: limits.name,
    guzziModel: limits.guzziModel,
    remaining,
  };
}
