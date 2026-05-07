/**
 * queue.ts — Configuración principal de las colas de BullMQ
 *
 * BullMQ es un sistema de colas de trabajos que usa Redis como backend.
 * Permite gestionar millones de envíos de CVs de forma escalable y fiable.
 *
 * Arquitectura:
 *   cv-sender-queue      → cola principal de envíos
 *   cv-sender-retry      → cola de reintentos (trabajos que fallaron)
 *   notifications-queue  → cola de notificaciones al usuario
 */

import { Queue } from "bullmq";
import IORedis from "ioredis";

// ─── Conexión a Redis ────────────────────────────────────────────────────────
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

// lazyConnect:true evita que IORedis conecte al importar el módulo (falla en CI sin Redis).
// La conexión se establece en el primer comando real (en producción, donde Redis sí existe).
export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});
redisConnection.on("error", (err: Error) => {
  console.error("[BullMQ Redis] connection error:", err.message);
});

// ─── Opciones por defecto para todos los jobs ────────────────────────────────
/**
 * Configuración de reintentos automáticos con backoff exponencial.
 * Si un envío falla, lo intenta de nuevo con esperas crecientes:
 *   Intento 1 → falla → espera 2s
 *   Intento 2 → falla → espera 4s
 *   Intento 3 → falla → espera 8s
 */
const defaultJobOptions = {
  attempts: 3, // Máximo 3 intentos por job
  backoff: {
    type: "exponential" as const,
    delay: 2000, // Empieza con 2 segundos, se duplica en cada reintento
  },
  removeOnComplete: {
    count: 500, // Guarda los últimos 500 jobs completados para historial
    age: 7 * 24 * 60 * 60, // Elimina completados con más de 7 días
  },
  removeOnFail: {
    count: 200, // Guarda los últimos 200 jobs fallidos para análisis
    age: 14 * 24 * 60 * 60, // Elimina fallidos con más de 14 días
  },
};

// ─── Cola Principal: cv-sender-queue ────────────────────────────────────────
/**
 * Cola principal donde se añaden todos los envíos de CV.
 * Los workers la procesan en orden FIFO (primero en entrar, primero en salir).
 * Admite prioridades: menor número = mayor prioridad.
 */
export const cvSenderQueue = new Queue("cv-sender-queue", {
  connection: redisConnection,
  defaultJobOptions,
});
cvSenderQueue.on("error", (err: Error) => console.error("[BullMQ] cvSenderQueue error:", err.message));

export const cvSenderRetryQueue = new Queue("cv-sender-retry", {
  connection: redisConnection,
  defaultJobOptions: { ...defaultJobOptions, attempts: 1 },
});
cvSenderRetryQueue.on("error", (err: Error) => console.error("[BullMQ] cvSenderRetryQueue error:", err.message));

export const notificationsQueue = new Queue("notifications-queue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential" as const, delay: 1000 },
    removeOnComplete: { count: 1000, age: 3 * 24 * 60 * 60 },
    removeOnFail: { count: 100, age: 7 * 24 * 60 * 60 },
  },
});
notificationsQueue.on("error", (err: Error) => console.error("[BullMQ] notificationsQueue error:", err.message));

// ─── Rate Limiting por Usuario ───────────────────────────────────────────────
/**
 * Límite de CVs que puede enviar cada usuario por día.
 * Se aplica en el scheduler antes de añadir jobs a la cola.
 *
 * Plan Free:    2 CVs/día,  20/mes
 * Plan Pro:    10 CVs/día, 200/mes
 * Plan Empresa: sin límite
 */
export const RATE_LIMITS = {
  free: { perDay: 2, perMonth: 20 },
  pro: { perDay: 10, perMonth: 200 },
  empresa: { perDay: Infinity, perMonth: Infinity },
} as const;

/**
 * Tipos de datos que lleva un job de envío de CV.
 * Cada job contiene toda la información necesaria para el envío.
 */
export interface CVJobData {
  userId: string; // ID del usuario en Supabase
  companyName: string; // Nombre de la empresa destino
  companyEmail: string; // Email de RRHH de la empresa
  companyUrl: string; // URL de la empresa (para personalización)
  jobTitle?: string; // Puesto al que aplica (opcional)
  priority: "normal" | "prioritario"; // Urgencia del envío
  useAIPersonalization: boolean; // Si debe personalizar la carta con IA
  scheduledFor: number; // Timestamp Unix (cuándo enviar)
  userPlan: "free" | "basico" | "pro" | "empresa"; // Plan del usuario
}

/**
 * Tipos de datos para jobs de notificación.
 */
export interface NotificationJobData {
  userId: string;
  type: "cv_sent" | "cv_failed" | "daily_summary";
  message: string;
  companyName?: string;
  jobId?: string;
}

/**
 * Añade un job de envío de CV a la cola principal.
 * @param data - Datos del envío (empresa, usuario, etc.)
 * @param delayMs - Milisegundos de retraso antes de procesar (0 = inmediato)
 * @param priority - Prioridad del job (1=alta, 10=normal, 100=baja)
 */
export async function addCVJob(
  data: CVJobData,
  delayMs = 0,
  priority = 10
): Promise<string> {
  const job = await cvSenderQueue.add("send-cv", data, {
    delay: delayMs,
    priority,
    jobId: `cv-${data.userId}-${Date.now()}`, // ID único por usuario + timestamp
  });

  console.log(`[Cola] Job añadido: ${job.id} | Usuario: ${data.userId} | Empresa: ${data.companyName}`);
  return job.id!;
}

/**
 * Añade un job de notificación a la cola de notificaciones.
 * @param data - Datos de la notificación
 */
export async function addNotificationJob(data: NotificationJobData): Promise<void> {
  await notificationsQueue.add("notify-user", data, {
    priority: 5, // Las notificaciones tienen alta prioridad
  });
}

/**
 * Obtiene estadísticas de la cola principal.
 * Útil para el panel de administración.
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    cvSenderQueue.getWaitingCount(),
    cvSenderQueue.getActiveCount(),
    cvSenderQueue.getCompletedCount(),
    cvSenderQueue.getFailedCount(),
    cvSenderQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}
