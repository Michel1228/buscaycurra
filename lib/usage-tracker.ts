/**
 * lib/usage-tracker.ts — Trackea uso diario/semanal contra los límites del plan
 * 
 * Usa Supabase para persistencia. Las cuentas se resetean automáticamente
 * al cambiar de día (consultas, envíos diarios) o de semana (envíos semanales).
 */

import { createClient } from "@supabase/supabase-js";
import { getPlanLimits, type PlanTier } from "./plan-limits";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface UsageRow {
  user_id: string;
  date_key: string;       // "2026-06-10"
  week_key: string;       // "2026-W24"
  guzzi_consultas: number;
  envios_cv: number;
  envios_cv_semana: number;
}

/** Devuelve la clave de hoy (YYYY-MM-DD) */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Devuelve la clave de la semana ISO (YYYY-Www) */
function weekKey(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Obtiene o crea el registro de uso del usuario para una fecha (por defecto hoy) */
async function getOrCreateUsage(userId: string, dateKeyOverride?: string): Promise<UsageRow> {
  const supabase = getSupabase();
  const today = dateKeyOverride || todayKey();
  const week = dateKeyOverride || weekKey();

  const { data } = await supabase
    .from("usage_tracking")
    .select("*")
    .eq("user_id", userId)
    .eq("date_key", today)
    .single();

  if (data) return data as UsageRow;

  // Crear nuevo registro para hoy
  const newRow: UsageRow = {
    user_id: userId,
    date_key: today,
    week_key: week,
    guzzi_consultas: 0,
    envios_cv: 0,
    envios_cv_semana: 0,
  };

  await supabase.from("usage_tracking").insert(newRow);
  return newRow;
}

/** Verifica si el usuario puede hacer una consulta a Guzzi hoy */
export async function canQueryGuzzi(userId: string, plan?: string | null): Promise<boolean> {
  const limits = getPlanLimits(plan);
  if (limits.guzziMaxConsultasDia >= 999999) return true; // Ilimitado

  const isTrial = plan === "free";
  const dateKey = isTrial ? "trial" : todayKey();
  const usage = await getOrCreateUsage(userId, dateKey);
  return usage.guzzi_consultas < limits.guzziMaxConsultasDia;
}

/** Registra una consulta a Guzzi. Devuelve las consultas restantes hoy. */
export async function trackGuzziQuery(userId: string, plan?: string | null): Promise<{ allowed: boolean; remaining: number }> {
  const limits = getPlanLimits(plan);
  const supabase = getSupabase();
  // Para plan free: límite TOTAL (no diario) — usamos date_key fija "trial"
  const isTrial = plan === "free";
  const today = isTrial ? "trial" : todayKey();

  if (limits.guzziMaxConsultasDia >= 999999) {
    return { allowed: true, remaining: 999999 };
  }

  // Incrementar contador
  const { data } = await supabase
    .from("usage_tracking")
    .select("guzzi_consultas")
    .eq("user_id", userId)
    .eq("date_key", today)
    .single();

  const current = data?.guzzi_consultas ?? 0;
  
  if (current >= limits.guzziMaxConsultasDia) {
    return { allowed: false, remaining: 0 };
  }

  await supabase
    .from("usage_tracking")
    .upsert(
      { user_id: userId, date_key: today, week_key: isTrial ? "trial" : weekKey(), guzzi_consultas: current + 1 },
      { onConflict: "user_id,date_key" }
    );

  return { allowed: true, remaining: limits.guzziMaxConsultasDia - current - 1 };
}

/** Verifica si el usuario puede enviar un CV hoy */
export async function canSendCV(userId: string, plan?: string | null): Promise<{ allowed: boolean; remainingDay: number; remainingWeek: number }> {
  const limits = getPlanLimits(plan);
  const supabase = getSupabase();
  const today = todayKey();
  const week = weekKey();

  // Obtener uso de hoy
  const { data: todayData } = await supabase
    .from("usage_tracking")
    .select("envios_cv")
    .eq("user_id", userId)
    .eq("date_key", today)
    .single();

  const enviosHoy = todayData?.envios_cv ?? 0;

  // Obtener uso de la semana
  const { data: weekData } = await supabase
    .from("usage_tracking")
    .select("envios_cv")
    .eq("user_id", userId)
    .eq("week_key", week);

  const enviosSemana = (weekData ?? []).reduce((sum: number, r: { envios_cv: number }) => sum + r.envios_cv, 0);

  return {
    allowed: enviosHoy < limits.enviosCVDia && enviosSemana < limits.enviosCVSemana,
    remainingDay: limits.enviosCVDia - enviosHoy,
    remainingWeek: limits.enviosCVSemana - enviosSemana,
  };
}

/** Registra un envío de CV */
export async function trackCVSend(userId: string): Promise<void> {
  const supabase = getSupabase();
  const today = todayKey();

  const { data } = await supabase
    .from("usage_tracking")
    .select("envios_cv")
    .eq("user_id", userId)
    .eq("date_key", today)
    .single();

  const current = data?.envios_cv ?? 0;

  await supabase
    .from("usage_tracking")
    .upsert(
      { user_id: userId, date_key: today, week_key: weekKey(), envios_cv: current + 1 },
      { onConflict: "user_id,date_key" }
    );
}

/** Obtiene las consultas restantes de Guzzi hoy */
export async function getRemainingQueries(userId: string, plan?: string | null): Promise<number> {
  const limits = getPlanLimits(plan);
  if (limits.guzziMaxConsultasDia >= 999999) return 999999;

  const { data } = await getSupabase()
    .from("usage_tracking")
    .select("guzzi_consultas")
    .eq("user_id", userId)
    .eq("date_key", todayKey())
    .single();

  const used = data?.guzzi_consultas ?? 0;
  return Math.max(0, limits.guzziMaxConsultasDia - used);
}
