/**
 * queue.ts — Configuración de colas BullMQ (lazy initialization)
 *
 * Las instancias de Queue y IORedis se crean SOLO cuando se necesitan
 * (primera llamada a las funciones), nunca al importar el módulo.
 * Esto evita intentos de conexión a Redis durante el build de Next.js.
 */

import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2000 },
  removeOnComplete: { count: 500, age: 7 * 24 * 60 * 60 },
  removeOnFail: { count: 200, age: 14 * 24 * 60 * 60 },
};

// ─── Lazy singletons ─────────────────────────────────────────────────────────

let _redis: IORedis | null = null;
let _cvSenderQueue: Queue | null = null;
let _cvSenderRetryQueue: Queue | null = null;
let _notificationsQueue: Queue | null = null;

export function getRedisConnection(): IORedis {
  if (!_redis) {
    _redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    _redis.on("error", (err: Error) =>
      console.error("[BullMQ Redis] connection error:", err.message)
    );
  }
  return _redis;
}

export function getCvSenderQueue(): Queue {
  if (!_cvSenderQueue) {
    _cvSenderQueue = new Queue("cv-sender-queue", {
      connection: getRedisConnection(),
      defaultJobOptions,
    });
    _cvSenderQueue.on("error", (err: Error) =>
      console.error("[BullMQ] cvSenderQueue error:", err.message)
    );
  }
  return _cvSenderQueue;
}

export function getCvSenderRetryQueue(): Queue {
  if (!_cvSenderRetryQueue) {
    _cvSenderRetryQueue = new Queue("cv-sender-retry", {
      connection: getRedisConnection(),
      defaultJobOptions: { ...defaultJobOptions, attempts: 1 },
    });
    _cvSenderRetryQueue.on("error", (err: Error) =>
      console.error("[BullMQ] cvSenderRetryQueue error:", err.message)
    );
  }
  return _cvSenderRetryQueue;
}

export function getNotificationsQueue(): Queue {
  if (!_notificationsQueue) {
    _notificationsQueue = new Queue("notifications-queue", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential" as const, delay: 1000 },
        removeOnComplete: { count: 1000, age: 3 * 24 * 60 * 60 },
        removeOnFail: { count: 100, age: 7 * 24 * 60 * 60 },
      },
    });
    _notificationsQueue.on("error", (err: Error) =>
      console.error("[BullMQ] notificationsQueue error:", err.message)
    );
  }
  return _notificationsQueue;
}

// ─── Rate Limiting por Usuario ───────────────────────────────────────────────

export const RATE_LIMITS = {
  free: { perDay: 2, perMonth: 20 },
  pro: { perDay: 10, perMonth: 200 },
  empresa: { perDay: Infinity, perMonth: Infinity },
} as const;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CVJobData {
  userId: string;
  companyName: string;
  companyEmail: string;
  companyUrl: string;
  jobTitle?: string;
  priority: "normal" | "prioritario";
  useAIPersonalization: boolean;
  scheduledFor: number;
  userPlan: "free" | "basico" | "pro" | "empresa";
}

export interface NotificationJobData {
  userId: string;
  type: "cv_sent" | "cv_failed" | "daily_summary";
  message: string;
  companyName?: string;
  jobId?: string;
}

// ─── Funciones de Cola ────────────────────────────────────────────────────────

export async function addCVJob(
  data: CVJobData,
  delayMs = 0,
  priority = 10
): Promise<string> {
  const job = await getCvSenderQueue().add("send-cv", data, {
    delay: delayMs,
    priority,
    jobId: `cv-${data.userId}-${Date.now()}`,
  });
  console.log(`[Cola] Job añadido: ${job.id} | Usuario: ${data.userId} | Empresa: ${data.companyName}`);
  return job.id!;
}

export async function addNotificationJob(data: NotificationJobData): Promise<void> {
  await getNotificationsQueue().add("notify-user", data, { priority: 5 });
}

export async function getQueueStats() {
  const q = getCvSenderQueue();
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    q.getWaitingCount(),
    q.getActiveCount(),
    q.getCompletedCount(),
    q.getFailedCount(),
    q.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed };
}
