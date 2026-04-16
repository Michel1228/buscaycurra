/**
 * scheduler.ts — Planificador inteligente de envíos de CV
 *
 * Este módulo decide CUÁNDO se envía cada CV respetando:
 *   - Horario laboral español: lunes-viernes 9:00-18:00
 *   - Festivos nacionales de España (hardcodeados)
 *   - Distribución de envíos a lo largo del día (no todos a la vez)
 *   - Respeto de los 90 días mínimos entre envíos a la misma empresa
 *
 * Arquitectura:
 *   scheduleCV     → programa un solo envío
 *   scheduleBulkCV → programa múltiples envíos distribuyéndolos en el tiempo
 */

import { addCVJob, cvSenderQueue, CVJobData } from "./queue";
import { checkRateLimit, getUserPlan } from "./rate-limiter";
import { canSendToCompany } from "./tracker";

// ─── Festivos Nacionales de España ───────────────────────────────────────────
/**
 * Lista de festivos nacionales de España.
 * Formato: "MM-DD" (mes-día)
 * Se actualiza cada año si cambian los festivos.
 */
const FESTIVOS_NACIONALES = new Set([
  "01-01", // Año Nuevo
  "01-06", // Reyes Magos
  "04-18", // Viernes Santo (aproximado, varía cada año)
  "05-01", // Día del Trabajo
  "08-15", // Asunción de la Virgen
  "10-12", // Fiesta Nacional de España
  "11-01", // Todos los Santos
  "12-06", // Día de la Constitución Española
  "12-08", // Inmaculada Concepción
  "12-25", // Navidad
]);

// ─── Configuración de Horario Laboral ────────────────────────────────────────
const HORA_INICIO = 9; // 9:00 (hora española)
const HORA_FIN = 18; // 18:00 (hora española)
const ZONA_HORARIA = "Europe/Madrid";

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Preferencias de envío del usuario */
export interface SendPreferences {
  priority?: "normal" | "prioritario";
  useAIPersonalization?: boolean;
  preferredHour?: number; // Hora preferida (9-18)
}

/** Información de la empresa destino */
export interface CompanyData {
  name: string;
  email: string;
  url?: string;
  jobTitle?: string;
}

/** Resultado de programar un envío */
export interface ScheduleResult {
  jobId: string;
  scheduledFor: Date;
  positionInQueue: number;
  estimatedWaitMinutes: number;
}

// ─── Funciones Auxiliares de Tiempo ──────────────────────────────────────────

/**
 * Comprueba si una fecha es un festivo nacional en España.
 * @param date - Fecha a comprobar
 */
function esFestivo(date: Date): boolean {
  const mesdia = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return FESTIVOS_NACIONALES.has(mesdia);
}

/**
 * Comprueba si una fecha es día laborable (lunes-viernes, no festivo).
 * @param date - Fecha a comprobar
 */
function esLaborable(date: Date): boolean {
  const diaSemana = date.getDay(); // 0=domingo, 6=sábado
  const esDiaLaboral = diaSemana >= 1 && diaSemana <= 5;
  return esDiaLaboral && !esFestivo(date);
}

/**
 * Obtiene el próximo momento laborable disponible en España.
 * Si son las 3am del lunes, devuelve las 9:00 del mismo lunes.
 * Si es sábado, devuelve las 9:00 del lunes.
 * Si es un festivo, salta al siguiente día laborable.
 *
 * @param desde - Fecha de partida (por defecto: ahora)
 * @returns Próxima fecha/hora laborable disponible
 */
export function getNextBusinessHour(desde?: Date): Date {
  const ahora = desde ? new Date(desde) : new Date();
  const resultado = new Date(ahora);

  // Si ya es hora laboral y día laborable, elegimos un momento aleatorio en las próximas 2 horas
  const hora = resultado.getHours();
  if (esLaborable(resultado) && hora >= HORA_INICIO && hora < HORA_FIN) {
    // Añadimos un retraso aleatorio de 0-120 minutos para distribuir los envíos
    const minutosAleatorios = Math.floor(Math.random() * 120);
    resultado.setMinutes(resultado.getMinutes() + minutosAleatorios);

    // Si el retraso nos saca del horario laboral, movemos al día siguiente
    if (resultado.getHours() >= HORA_FIN) {
      resultado.setDate(resultado.getDate() + 1);
      resultado.setHours(HORA_INICIO, Math.floor(Math.random() * 60), 0, 0);
    } else {
      return resultado;
    }
  }

  // Si es fuera de horario, mover al próximo inicio de jornada
  if (hora >= HORA_FIN) {
    resultado.setDate(resultado.getDate() + 1);
  }
  resultado.setHours(HORA_INICIO, Math.floor(Math.random() * 60), 0, 0);

  // Avanzar días hasta encontrar uno laborable
  let intentos = 0;
  while (!esLaborable(resultado) && intentos < 14) {
    resultado.setDate(resultado.getDate() + 1);
    intentos++;
  }

  return resultado;
}

// ─── Funciones Principales ───────────────────────────────────────────────────

/**
 * Programa el envío de un CV a una empresa.
 *
 * Proceso:
 *   1. Verifica que el usuario puede enviar (rate limit)
 *   2. Verifica que no ha enviado a esta empresa en los últimos 90 días
 *   3. Calcula el próximo momento laborable para enviar
 *   4. Añade el job a la cola de BullMQ con el retraso calculado
 *
 * @param userId - ID del usuario en Supabase
 * @param companyData - Datos de la empresa destino
 * @param preferences - Preferencias del usuario (urgencia, IA, etc.)
 * @returns Datos del job programado (ID, hora estimada, posición en cola)
 */
export async function scheduleCV(
  userId: string,
  companyData: CompanyData,
  preferences: SendPreferences = {}
): Promise<ScheduleResult | { error: string }> {
  console.log(`[Scheduler] Programando envío para ${userId} → ${companyData.name}`);

  // ── 1. Verificar plan y rate limit ───────────────────────────────────────
  const userPlan = await getUserPlan(userId);
  const rateLimitCheck = await checkRateLimit(userId, userPlan, companyData.email);

  if (!rateLimitCheck.allowed) {
    console.warn(`[Scheduler] Límite alcanzado para ${userId}: ${rateLimitCheck.reason}`);
    return { error: rateLimitCheck.reason ?? "Límite de envíos alcanzado" };
  }

  // ── 2. Verificar historial con esta empresa ──────────────────────────────
  const puedeEnviar = await canSendToCompany(userId, companyData.email);
  if (!puedeEnviar) {
    return {
      error: `Ya enviaste tu CV a ${companyData.name} hace menos de 90 días. Por favor espera antes de volver a intentarlo.`,
    };
  }

  // ── 3. Calcular cuándo enviar ────────────────────────────────────────────
  const fechaEnvio = getNextBusinessHour();
  const ahora = Date.now();
  const delayMs = Math.max(0, fechaEnvio.getTime() - ahora);

  // ── 4. Construir datos del job ───────────────────────────────────────────
  const jobData: CVJobData = {
    userId,
    companyName: companyData.name,
    companyEmail: companyData.email,
    companyUrl: companyData.url ?? "",
    jobTitle: companyData.jobTitle,
    priority: preferences.priority ?? "normal",
    useAIPersonalization: preferences.useAIPersonalization ?? true,
    scheduledFor: fechaEnvio.getTime(),
    userPlan,
  };

  // Prioridad en la cola: prioritario = 1, normal = 10
  const queuePriority = preferences.priority === "prioritario" ? 1 : 10;

  // ── 5. Añadir a la cola ──────────────────────────────────────────────────
  const jobId = await addCVJob(jobData, delayMs, queuePriority);

  // ── 6. Calcular posición en la cola ──────────────────────────────────────
  const waitingCount = await cvSenderQueue.getWaitingCount();
  const delayedCount = await cvSenderQueue.getDelayedCount();
  const posicion = waitingCount + delayedCount;

  console.log(
    `[Scheduler] ✅ Job ${jobId} programado para ${fechaEnvio.toLocaleString("es-ES")} | Posición: ${posicion}`
  );

  return {
    jobId,
    scheduledFor: fechaEnvio,
    positionInQueue: posicion,
    estimatedWaitMinutes: Math.ceil(delayMs / 60_000),
  };
}

/**
 * Programa el envío de CVs a múltiples empresas.
 * Los distribuye a lo largo del tiempo para no enviar todos a la vez.
 * Respeta el límite diario del usuario.
 *
 * @param userId - ID del usuario
 * @param companies - Lista de empresas a las que enviar el CV
 * @param preferences - Preferencias del usuario
 * @returns Lista de resultados (uno por empresa)
 */
export async function scheduleBulkCV(
  userId: string,
  companies: CompanyData[],
  preferences: SendPreferences = {}
): Promise<Array<{ company: string; result: ScheduleResult | { error: string } }>> {
  console.log(`[Scheduler] Programando envío masivo para ${userId}: ${companies.length} empresas`);

  const resultados: Array<{ company: string; result: ScheduleResult | { error: string } }> = [];

  // Procesamos cada empresa con un pequeño retraso entre ellas
  // Esto evita sobrecargar la cola y distribuye los envíos naturalmente
  let offsetMinutos = 0;

  for (const company of companies) {
    const prefsConOffset: SendPreferences = {
      ...preferences,
    };

    // Añadimos un offset incremental: primera empresa en hora X, segunda en X+15min, etc.
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + offsetMinutos);
    const fechaBase = getNextBusinessHour(ahora);

    const jobData: CVJobData = {
      userId,
      companyName: company.name,
      companyEmail: company.email,
      companyUrl: company.url ?? "",
      jobTitle: company.jobTitle,
      priority: preferences.priority ?? "normal",
      useAIPersonalization: preferences.useAIPersonalization ?? true,
      scheduledFor: fechaBase.getTime(),
      userPlan: await getUserPlan(userId),
    };

    const delayMs = Math.max(0, fechaBase.getTime() - Date.now());

    try {
      // Verificar rate limit antes de cada envío
      const userPlan = await getUserPlan(userId);
      const rateLimitCheck = await checkRateLimit(userId, userPlan, company.email);

      if (!rateLimitCheck.allowed) {
        resultados.push({
          company: company.name,
          result: { error: rateLimitCheck.reason ?? "Límite alcanzado" },
        });
        continue;
      }

      const puedeEnviar = await canSendToCompany(userId, company.email);
      if (!puedeEnviar) {
        resultados.push({
          company: company.name,
          result: { error: `CV ya enviado a ${company.name} recientemente (< 90 días)` },
        });
        continue;
      }

      const jobId = await addCVJob(jobData, delayMs, preferences.priority === "prioritario" ? 1 : 10);
      const waitingCount = await cvSenderQueue.getWaitingCount();

      resultados.push({
        company: company.name,
        result: {
          jobId,
          scheduledFor: fechaBase,
          positionInQueue: waitingCount,
          estimatedWaitMinutes: Math.ceil(delayMs / 60_000),
        },
      });

      // Separamos cada envío por 15-30 minutos aleatorios
      offsetMinutos += 15 + Math.floor(Math.random() * 15);
    } catch (err) {
      resultados.push({
        company: company.name,
        result: { error: `Error inesperado: ${(err as Error).message}` },
      });
    }
  }

  console.log(`[Scheduler] Bulk programado: ${resultados.filter((r) => !("error" in r.result)).length}/${companies.length} exitosos`);
  return resultados;
}

/**
 * Obtiene todos los jobs pendientes de un usuario en BullMQ.
 * Útil para mostrar la cola del usuario en el dashboard.
 *
 * @param userId - ID del usuario
 * @returns Lista de jobs pendientes con sus datos
 */
export async function getUserPendingJobs(userId: string) {
  // Obtenemos los jobs en espera y los retrasados
  const [waiting, delayed] = await Promise.all([
    cvSenderQueue.getWaiting(),
    cvSenderQueue.getDelayed(),
  ]);

  const todosLosPendientes = [...waiting, ...delayed];

  // Filtramos solo los del usuario
  const jobsDelUsuario = todosLosPendientes
    .filter((job) => (job.data as CVJobData).userId === userId)
    .map((job) => ({
      id: job.id,
      companyName: (job.data as CVJobData).companyName,
      scheduledFor: new Date((job.data as CVJobData).scheduledFor),
      priority: (job.data as CVJobData).priority,
      state: "pendiente" as const,
    }));

  return jobsDelUsuario;
}

/**
 * Cancela un job pendiente en BullMQ.
 * Solo se pueden cancelar jobs que aún no han empezado a procesarse.
 *
 * @param jobId - ID del job a cancelar
 * @param userId - ID del usuario (para verificar que el job le pertenece)
 * @returns true si se canceló correctamente, false si no se pudo
 */
export async function cancelJob(jobId: string, userId: string): Promise<boolean> {
  try {
    const job = await cvSenderQueue.getJob(jobId);

    if (!job) {
      console.warn(`[Scheduler] Job ${jobId} no encontrado`);
      return false;
    }

    // Verificar que el job pertenece al usuario (seguridad)
    if ((job.data as CVJobData).userId !== userId) {
      console.warn(`[Scheduler] El job ${jobId} no pertenece al usuario ${userId}`);
      return false;
    }

    // Verificar que el job está en estado que se puede cancelar
    const estado = await job.getState();
    if (estado === "active") {
      console.warn(`[Scheduler] El job ${jobId} ya está procesándose, no se puede cancelar`);
      return false;
    }

    await job.remove();
    console.log(`[Scheduler] Job ${jobId} cancelado correctamente`);
    return true;
  } catch (err) {
    console.error(`[Scheduler] Error cancelando job ${jobId}:`, (err as Error).message);
    return false;
  }
}
