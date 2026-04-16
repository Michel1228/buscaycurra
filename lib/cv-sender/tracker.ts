/**
 * tracker.ts — Registro y seguimiento de todos los envíos de CV
 *
 * Guarda en Supabase (tabla cv_sends) cada envío para:
 *   - Evitar enviar dos veces a la misma empresa
 *   - Mostrar estadísticas al usuario
 *   - Calcular tasa de respuesta
 *   - Cumplir con RGPD (registro de actividad)
 */

import { createClient } from "@supabase/supabase-js";

// ─── Cliente Supabase ────────────────────────────────────────────────────────
// Usamos la clave de servicio (service role) para operaciones del servidor.
// NUNCA expongas SUPABASE_SERVICE_ROLE_KEY en el frontend.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Estado posible de un envío */
export type SendStatus = "pendiente" | "enviado" | "fallido" | "cancelado";

/** Fila de la tabla cv_sends en Supabase */
export interface CVSendRecord {
  id?: string;
  user_id: string;
  company_email: string;
  company_name: string;
  company_url?: string;
  job_title?: string;
  status: SendStatus;
  job_id?: string; // ID del job en BullMQ
  sent_at?: string; // ISO timestamp de cuándo se envió
  error_message?: string; // Mensaje de error si falló
  created_at?: string;
}

/** Estadísticas del usuario */
export interface UserStats {
  totalEnviados: number;
  empresasContactadas: number;
  enviadosEstaSemana: number;
  enviadosEsteMes: number;
  enviadosHoy: number;
  tasaRespuesta: number; // Porcentaje estimado (0-100)
}

// ─── Funciones Principales ───────────────────────────────────────────────────

/**
 * Registra un nuevo envío de CV en la base de datos.
 * Se llama cuando se añade el job a la cola (estado: pendiente)
 * y cuando se envía el email (estado: enviado).
 *
 * @param userId - ID del usuario
 * @param companyEmail - Email de RRHH de la empresa
 * @param status - Estado del envío
 * @param extras - Datos adicionales opcionales
 */
export async function recordSent(
  userId: string,
  companyEmail: string,
  status: SendStatus,
  extras?: Partial<CVSendRecord>
): Promise<string | null> {
  const record: CVSendRecord = {
    user_id: userId,
    company_email: companyEmail,
    company_name: extras?.company_name ?? "Empresa desconocida",
    status,
    sent_at: status === "enviado" ? new Date().toISOString() : undefined,
    ...extras,
  };

  const { data, error } = await supabase
    .from("cv_sends")
    .insert(record)
    .select("id")
    .single();

  if (error) {
    console.error(`[Tracker] Error registrando envío para ${userId}:`, error.message);
    return null;
  }

  console.log(`[Tracker] Envío registrado: ${data.id} | Usuario: ${userId} | Empresa: ${companyEmail} | Estado: ${status}`);
  return data.id;
}

/**
 * Actualiza el estado de un envío existente.
 * Por ejemplo: de "pendiente" a "enviado" o "fallido".
 *
 * @param jobId - ID del job en BullMQ
 * @param status - Nuevo estado
 * @param errorMessage - Mensaje de error (solo si falló)
 */
export async function updateSendStatus(
  jobId: string,
  status: SendStatus,
  errorMessage?: string
): Promise<void> {
  const updates: Partial<CVSendRecord> = {
    status,
    ...(status === "enviado" && { sent_at: new Date().toISOString() }),
    ...(errorMessage && { error_message: errorMessage }),
  };

  const { error } = await supabase
    .from("cv_sends")
    .update(updates)
    .eq("job_id", jobId);

  if (error) {
    console.error(`[Tracker] Error actualizando estado del job ${jobId}:`, error.message);
  }
}

/**
 * Obtiene las estadísticas de envíos de un usuario.
 * Muestra el resumen en el panel de control.
 *
 * @param userId - ID del usuario
 * @returns Objeto con todas las estadísticas
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  // Fechas de referencia para filtrar
  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString();
  const inicioSemana = new Date(ahora.setDate(ahora.getDate() - ahora.getDay())).toISOString();
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // Obtenemos todos los envíos del usuario (solo los enviados)
  const { data, error } = await supabase
    .from("cv_sends")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "enviado");

  if (error || !data) {
    console.error(`[Tracker] Error obteniendo estadísticas de ${userId}:`, error?.message);
    return {
      totalEnviados: 0,
      empresasContactadas: 0,
      enviadosEstaSemana: 0,
      enviadosEsteMes: 0,
      enviadosHoy: 0,
      tasaRespuesta: 0,
    };
  }

  // Calculamos las estadísticas
  const empresasUnicas = new Set(data.map((r: CVSendRecord) => r.company_email));
  const enviadosHoy = data.filter((r: CVSendRecord) => r.sent_at && r.sent_at >= inicioHoy).length;
  const enviadosEstaSemana = data.filter((r: CVSendRecord) => r.sent_at && r.sent_at >= inicioSemana).length;
  const enviadosEsteMes = data.filter((r: CVSendRecord) => r.sent_at && r.sent_at >= inicioMes).length;

  return {
    totalEnviados: data.length,
    empresasContactadas: empresasUnicas.size,
    enviadosEstaSemana,
    enviadosEsteMes,
    enviadosHoy,
    tasaRespuesta: 0, // TODO: implementar cuando tengamos tracking de respuestas
  };
}

/**
 * Obtiene el historial de envíos a una empresa específica.
 * Se usa para respetar el periodo mínimo de 90 días entre envíos.
 *
 * @param companyEmail - Email de RRHH de la empresa
 * @returns Lista de envíos ordenada por fecha descendente
 */
export async function getCompanyHistory(companyEmail: string): Promise<CVSendRecord[]> {
  const { data, error } = await supabase
    .from("cv_sends")
    .select("*")
    .eq("company_email", companyEmail)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`[Tracker] Error obteniendo historial de ${companyEmail}:`, error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Verifica si ya se ha enviado un CV a esta empresa recientemente.
 * Respeta el mínimo de 90 días entre envíos a la misma empresa.
 *
 * @param userId - ID del usuario
 * @param companyEmail - Email de la empresa
 * @param minDays - Días mínimos entre envíos (por defecto 90)
 * @returns true si se puede enviar, false si hay que esperar
 */
export async function canSendToCompany(
  userId: string,
  companyEmail: string,
  minDays = 90
): Promise<boolean> {
  const { data, error } = await supabase
    .from("cv_sends")
    .select("sent_at")
    .eq("user_id", userId)
    .eq("company_email", companyEmail)
    .eq("status", "enviado")
    .order("sent_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return true; // No hay historial previo, se puede enviar
  }

  const ultimoEnvio = new Date(data[0].sent_at);
  const diasTranscurridos = (Date.now() - ultimoEnvio.getTime()) / (1000 * 60 * 60 * 24);

  if (diasTranscurridos < minDays) {
    console.log(
      `[Tracker] Muy pronto para enviar a ${companyEmail}. Han pasado ${Math.floor(diasTranscurridos)} días (mínimo: ${minDays})`
    );
    return false;
  }

  return true;
}

/**
 * Obtiene los envíos pendientes de un usuario (estado: pendiente).
 * Se usa en el dashboard para mostrar la cola del usuario.
 *
 * @param userId - ID del usuario
 */
export async function getUserPendingSends(userId: string): Promise<CVSendRecord[]> {
  const { data, error } = await supabase
    .from("cv_sends")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pendiente")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(`[Tracker] Error obteniendo pendientes de ${userId}:`, error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Obtiene todos los envíos de un usuario (historial completo).
 *
 * @param userId - ID del usuario
 * @param limit - Máximo de registros a devolver
 */
export async function getUserSendHistory(
  userId: string,
  limit = 50
): Promise<CVSendRecord[]> {
  const { data, error } = await supabase
    .from("cv_sends")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`[Tracker] Error obteniendo historial de ${userId}:`, error.message);
    return [];
  }

  return data ?? [];
}
