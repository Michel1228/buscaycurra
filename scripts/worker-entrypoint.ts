/**
 * Entrypoint del worker de BullMQ para envío de CVs.
 * Se ejecuta como proceso Node.js independiente.
 */
import { cvWorker } from "../lib/cv-sender/worker";
import { getRedisConnection } from "../lib/cv-sender/queue";

console.log("[Worker] Iniciado. Escuchando cola cv-sender-queue en Redis...");

// ─── Graceful Shutdown ──────────────────────────────────────────────────────

/**
 * Cierra el worker limpiamente:
 *   1. Deja de aceptar nuevos jobs
 *   2. Espera a que termine el job actual (si hay alguno)
 *   3. Cierra la conexión a Redis
 *   4. Sale del proceso
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log("");
  console.log(`[Worker] Recibida señal ${signal}. Cerrando limpiamente...`);
  console.log("[Worker] Esperando a que termine el job actual (si hay alguno)...");

  try {
    await cvWorker.close();
    console.log("[Worker] ✅ Worker cerrado correctamente");

    try {
      await getRedisConnection().quit();
      console.log("[Worker] ✅ Conexión a Redis cerrada");
    } catch {
      // Redis ya puede estar cerrado
    }

    console.log("[Worker] 👋 Hasta luego!");
    process.exit(0);
  } catch (error) {
    console.error("[Worker] Error durante el cierre:", (error as Error).message);
    process.exit(1);
  }
}

process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));

// Capturar errores no controlados
process.on("uncaughtException", (error: Error) => {
  console.error("[Worker] ❌ Error no controlado:", error.message);
  console.error(error.stack);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("[Worker] ❌ Promise rechazada sin controlar:", reason);
});
