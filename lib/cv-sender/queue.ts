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

import { Queue, QueueEvents } from "bullmq";
import IORedis from "ioredis";

// ─── Conexión a Redis ────────────────────────────────────────────────────────
// Redis es la base de datos en memoria que almacena todas las colas.
// Por defecto usa localhost:6379, configurable via variable de entorno REDIS_URL.
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

/**
 * Crea una conexión compartida a Redis.
 * maxRetriesPerRequest=null es necesario para BullMQ (evita timeouts en workers).
 */
export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
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

// ─── Cola de Reintentos: cv-sender-retry ────────────────────────────────────
/**
 * Cola especial para trabajos que han fallado todas las veces.
 * Un administrador puede revisar y reintentar manualmente los jobs aquí.
 */
export const cvSenderRetryQueue = new Queue("cv-sender-retry", {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 1, // En la cola de reintentos solo se intenta una vez más
  },
});

// ─── Cola de Notificaciones: notifications-queue ─────────────────────────────
/**
 * Cola para enviar notificaciones al usuario.
 * Por ejemplo: "Tu CV fue enviado a Empresa X ✅"
 * Separada de la cola principal para no mezclar prioridades.
 */
export const notificationsQueue = new Queue("notifications-queue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential" as const, delay: 1000 },
    removeOnComplete: { count: 1000, age: 3 * 24 * 60 * 60 },
    removeOnFail: { count: 100, age: 7 * 24 * 60 * 60 },
  },
});

// ─── Eventos de la Cola ──────────────────────────────────────────────────────
/**
 * QueueEvents permite escuchar eventos de la cola en tiempo real.
 * Útil para actualizar el estado en el frontend sin hacer polling.
 */
export const cvSenderQueueEvents = new QueueEvents("cv-sender-queue", {
  connection: new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  }),
});

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
