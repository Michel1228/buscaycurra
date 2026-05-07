/**
 * scripts/start-worker.ts — Script para arrancar el worker de BullMQ en producción
 *
 * Este script debe ejecutarse de forma independiente al servidor Next.js.
 * El worker escucha la cola de Redis y procesa los envíos de CV.
 *
 * Cómo usarlo:
 *   npm run worker
 *   o directamente: npx tsx scripts/start-worker.ts
 *
 * Para producción en múltiples instancias (más velocidad):
 *   WORKER_CONCURRENCY=5 npm run worker
 *
 * Para parar limpiamente:
 *   Ctrl+C (SIGINT) o matar el proceso con SIGTERM
 */

// Cargar variables de entorno desde .env.local
import "dotenv/config";

import { cvWorker } from "../lib/cv-sender/worker";
import { getRedisConnection, getQueueStats } from "../lib/cv-sender/queue";

// ─── Información del sistema al arrancar ─────────────────────────────────────

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY ?? "1");
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const VERSION = process.env.npm_package_version ?? "0.1.0";

console.log("═══════════════════════════════════════════════════");
console.log("   🚀 BuscayCurra — Worker de Envío de CVs");
console.log("═══════════════════════════════════════════════════");
console.log(`   Versión:      ${VERSION}`);
console.log(`   Redis:        ${REDIS_URL}`);
console.log(`   Concurrencia: ${CONCURRENCY} job(s) en paralelo`);
console.log(`   Fecha inicio: ${new Date().toLocaleString("es-ES")}`);
console.log("═══════════════════════════════════════════════════");
console.log("");

// ─── Verificar conexión a Redis ───────────────────────────────────────────────

/**
 * Espera a que Redis esté disponible antes de empezar a procesar.
 * Si Redis no está disponible, el proceso se cierra con error.
 */
async function checkRedisConnection(): Promise<void> {
  console.log("[Worker] Verificando conexión a Redis...");

  try {
    await getRedisConnection().ping();
    console.log("[Worker] ✅ Conexión a Redis establecida correctamente");
  } catch (error) {
    console.error("[Worker] ❌ No se pudo conectar a Redis:", (error as Error).message);
    console.error("[Worker] Asegúrate de que Redis está corriendo.");
    console.error("[Worker] Para arrancar Redis con Docker: docker-compose up -d redis");
    process.exit(1); // Salir con error si no hay Redis
  }
}

/**
 * Muestra el estado inicial de la cola al arrancar.
 */
async function showQueueStatus(): Promise<void> {
  try {
    const stats = await getQueueStats();
    console.log("[Worker] 📊 Estado de la cola al arrancar:");
    console.log(`         ⏳ En espera:    ${stats.waiting}`);
    console.log(`         🔄 En proceso:   ${stats.active}`);
    console.log(`         ✅ Completados:  ${stats.completed}`);
    console.log(`         ❌ Fallidos:     ${stats.failed}`);
    console.log(`         📅 Programados:  ${stats.delayed}`);
    console.log("");
  } catch (error) {
    console.warn("[Worker] No se pudo obtener el estado de la cola:", (error as Error).message);
  }
}

// ─── Arranque del worker ──────────────────────────────────────────────────────

async function start(): Promise<void> {
  await checkRedisConnection();
  await showQueueStatus();

  console.log("[Worker] ✅ Worker iniciado y escuchando la cola 'cv-sender-queue'...");
  console.log("[Worker] Pulsa Ctrl+C para parar el worker limpiamente.");
  console.log("");
}

// ─── Parada limpia (Graceful Shutdown) ────────────────────────────────────────
/**
 * Cuando el proceso recibe SIGTERM o SIGINT (Ctrl+C):
 *   1. Deja de aceptar nuevos jobs
 *   2. Espera a que termine el job que está procesando ahora (si hay alguno)
 *   3. Cierra la conexión a Redis
 *   4. Sale del proceso
 *
 * Esto evita dejar jobs a medias o perder datos.
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log("");
  console.log(`[Worker] Recibida señal ${signal}. Cerrando limpiamente...`);
  console.log("[Worker] Esperando a que termine el job actual (si hay alguno)...");

  try {
    // Cerrar el worker (espera a que termine el job actual)
    await cvWorker.close();
    console.log("[Worker] ✅ Worker cerrado correctamente");

    // Cerrar la conexión a Redis
    await getRedisConnection().quit();
    console.log("[Worker] ✅ Conexión a Redis cerrada");

    console.log("[Worker] 👋 Hasta luego!");
    process.exit(0);
  } catch (error) {
    console.error("[Worker] Error durante el cierre:", (error as Error).message);
    process.exit(1);
  }
}

// Registrar manejadores de señales del sistema operativo
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));

// Capturar errores no controlados para que no cierren el worker silenciosamente
process.on("uncaughtException", (error: Error) => {
  console.error("[Worker] ❌ Error no controlado:", error.message);
  console.error(error.stack);
  // No cerramos el proceso aquí para que el worker siga funcionando
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("[Worker] ❌ Promise rechazada sin controlar:", reason);
});

// ─── Iniciar ──────────────────────────────────────────────────────────────────

void start();
