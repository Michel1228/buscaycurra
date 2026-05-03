/**
 * Entrypoint del worker de BullMQ para envío de CVs.
 * Se ejecuta como proceso Node.js independiente.
 */
import "../lib/cv-sender/worker";

console.log("[Worker] Iniciado. Escuchando cola cv-sender-queue en Redis...");

process.on("SIGTERM", () => {
  console.log("[Worker] SIGTERM recibido, cerrando...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[Worker] SIGINT recibido, cerrando...");
  process.exit(0);
});
