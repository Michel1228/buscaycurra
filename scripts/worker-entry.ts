// Punto de entrada del worker para el build de producción
import "../lib/cv-sender/worker";
import { getRedisConnection, getQueueStats } from "../lib/cv-sender/queue";

async function start() {
  try {
    await getRedisConnection().ping();
    console.log("[Worker] Redis OK");
    const stats = await getQueueStats();
    console.log(`[Worker] Cola: ${stats.waiting} esperando, ${stats.active} activos`);

    // Rescatar los envios que se quedaron colgados. Se hace AQUI, al arrancar,
    // porque el momento en que se crean huerfanos es justo el reinicio del
    // contenedor: si un envio se estaba procesando cuando el proceso murio,
    // nadie llego a marcarlo como fallido y su fila se quedo en "pendiente"
    // para siempre, gastando cuota de una persona por un CV que no salio.
    const { rescatarEnviosHuerfanos } = await import("../lib/cv-sender/rescatar-huerfanos");
    await rescatarEnviosHuerfanos();

    console.log("[Worker] Escuchando cv-sender-queue...");
  } catch (err) {
    console.error("[Worker] Redis no disponible:", (err as Error).message);
    process.exit(1);
  }
}

void start();

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
