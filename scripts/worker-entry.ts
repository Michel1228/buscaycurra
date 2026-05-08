// Punto de entrada del worker para el build de producción
import "../lib/cv-sender/worker";
import { redisConnection, getQueueStats } from "../lib/cv-sender/queue";

async function start() {
  try {
    await redisConnection.ping();
    console.log("[Worker] Redis OK");
    const stats = await getQueueStats();
    console.log(`[Worker] Cola: ${stats.waiting} esperando, ${stats.active} activos`);
    console.log("[Worker] Escuchando cv-sender-queue...");
  } catch (err) {
    console.error("[Worker] Redis no disponible:", (err as Error).message);
    process.exit(1);
  }
}

void start();

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
