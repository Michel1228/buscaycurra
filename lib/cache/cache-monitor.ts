/**
 * Monitor del sistema de caché de BuscayCurra
 *
 * Proporciona métricas en tiempo real sobre:
 * - Cuántas veces se ha evitado llamar a la IA
 * - Cuánto dinero se ha ahorrado
 * - Cuántos usuarios más puede aguantar el sistema
 */

import { get, obtenerCliente } from "./redis-client";
import { obtenerEstadisticasCache } from "./ai-cache";

// ==========================================
// TIPOS DE DATOS
// ==========================================

// Métricas completas del sistema de caché
export interface MetricasCache {
  // Estadísticas de caché de IA
  hitRate: number;               // % de peticiones servidas desde caché
  totalHitsHoy: number;          // Aciertos hoy
  totalMissesHoy: number;        // Fallos hoy
  totalPeticionesHoy: number;    // Total peticiones hoy

  // Contadores de llamadas a APIs de IA
  llamadasGroqHoy: number;       // Llamadas a Groq API hoy
  llamadasGeminiHoy: number;     // Llamadas a Gemini API hoy
  limiteGroq: number;            // Límite diario de Groq
  limiteGemini: number;          // Límite diario de Gemini

  // Estimaciones económicas
  dineroAhorradoHoy: number;     // Euros ahorrados hoy
  dineroAhorradoMes: number;     // Euros ahorrados este mes (estimación)

  // Capacidad del sistema
  usuariosEstimadosPosibles: number; // Cuántos usuarios más puede aguantar

  // Metadatos
  fechaActualizacion: string;
}

// ==========================================
// CONSTANTES
// ==========================================

// Límites diarios de cada API gratuita
const LIMITE_GROQ_DIARIO = 14400;       // Groq: 14.400 req/día gratis
const LIMITE_GEMINI_DIARIO = 1500;      // Gemini: ~1.500 req/día (15 req/min)

// Coste estimado por llamada si pagáramos (en céntimos de euro)
const COSTE_POR_LLAMADA_IA = 0.002;     // ~0.2 céntimos por llamada

// Promedio de llamadas a IA por usuario activo por día
const LLAMADAS_POR_USUARIO = 5;

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

/**
 * Obtiene todas las métricas del sistema de caché
 * Esta es la función principal del monitor
 */
export async function obtenerMetricasCache(): Promise<MetricasCache> {
  const fecha = new Date().toISOString().split("T")[0]; // "2024-01-15"

  try {
    // Obtener todos los datos en paralelo para mayor velocidad
    const [
      statsCache,
      llamadasGroqStr,
      llamadasGeminiStr,
    ] = await Promise.all([
      obtenerEstadisticasCache(),
      get(`groq:calls:${fecha}`),
      get(`gemini:calls:${fecha}`),
    ]);

    const llamadasGroqHoy = parseInt(llamadasGroqStr || "0");
    const llamadasGeminiHoy = parseInt(llamadasGeminiStr || "0");

    // Calcular dinero ahorrado
    // Si el hitRate es 70%, hemos evitado el 70% de las llamadas
    const llamadasEvitadas = statsCache.totalHits;
    const dineroAhorradoHoy = llamadasEvitadas * COSTE_POR_LLAMADA_IA;
    const dineroAhorradoMes = dineroAhorradoHoy * 30;

    // Calcular cuántos usuarios puede aguantar con la capacidad actual
    const llamadasRestantesGroq = LIMITE_GROQ_DIARIO - llamadasGroqHoy;
    const llamadasRestantesGemini = LIMITE_GEMINI_DIARIO - llamadasGeminiHoy;
    const llamadasRestantesTotal = llamadasRestantesGroq + llamadasRestantesGemini;

    // Con el caché, cada usuario "real" genera menos llamadas a IA
    const factorReduccionCache = statsCache.hitRate / 100;
    const llamadasEfectivasPorUsuario =
      LLAMADAS_POR_USUARIO * (1 - factorReduccionCache);

    const usuariosEstimados =
      llamadasEfectivasPorUsuario > 0
        ? Math.floor(llamadasRestantesTotal / llamadasEfectivasPorUsuario)
        : 0;

    return {
      hitRate: statsCache.hitRate,
      totalHitsHoy: statsCache.totalHits,
      totalMissesHoy: statsCache.totalMisses,
      totalPeticionesHoy: statsCache.totalPeticiones,
      llamadasGroqHoy,
      llamadasGeminiHoy,
      limiteGroq: LIMITE_GROQ_DIARIO,
      limiteGemini: LIMITE_GEMINI_DIARIO,
      dineroAhorradoHoy: Math.round(dineroAhorradoHoy * 100) / 100,
      dineroAhorradoMes: Math.round(dineroAhorradoMes * 100) / 100,
      usuariosEstimadosPosibles: usuariosEstimados,
      fechaActualizacion: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Error obteniendo métricas del caché:", (error as Error).message);

    // Devolver métricas vacías si hay error
    return {
      hitRate: 0,
      totalHitsHoy: 0,
      totalMissesHoy: 0,
      totalPeticionesHoy: 0,
      llamadasGroqHoy: 0,
      llamadasGeminiHoy: 0,
      limiteGroq: LIMITE_GROQ_DIARIO,
      limiteGemini: LIMITE_GEMINI_DIARIO,
      dineroAhorradoHoy: 0,
      dineroAhorradoMes: 0,
      usuariosEstimadosPosibles: 0,
      fechaActualizacion: new Date().toISOString(),
    };
  }
}

/**
 * Genera un reporte diario en español del estado del sistema
 * Útil para enviar por email al administrador o mostrar en consola
 */
export async function obtenerReporteDiario(): Promise<string> {
  const metricas = await obtenerMetricasCache();

  const reporte = `
═══════════════════════════════════════
📊 REPORTE DIARIO DEL CACHÉ — BuscayCurra
${new Date().toLocaleDateString("es-ES", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
})}
═══════════════════════════════════════

🎯 EFICIENCIA DEL CACHÉ:
   Hit Rate: ${metricas.hitRate}%
   ${metricas.hitRate >= 70 ? "✅ Excelente" : metricas.hitRate >= 50 ? "👍 Bueno" : "⚠️  Mejorable"}

📈 ESTADÍSTICAS DE HOY:
   Peticiones totales: ${metricas.totalPeticionesHoy.toLocaleString("es-ES")}
   Desde caché: ${metricas.totalHitsHoy.toLocaleString("es-ES")} ✅
   Llamadas a IA: ${metricas.totalMissesHoy.toLocaleString("es-ES")} 🤖

🤖 LLAMADAS A IA:
   Groq: ${metricas.llamadasGroqHoy} / ${metricas.limiteGroq} (${Math.round((metricas.llamadasGroqHoy / metricas.limiteGroq) * 100)}% del límite)
   Gemini: ${metricas.llamadasGeminiHoy} / ${metricas.limiteGemini} (${Math.round((metricas.llamadasGeminiHoy / metricas.limiteGemini) * 100)}% del límite)

💰 AHORRO ECONÓMICO:
   Hoy: ${metricas.dineroAhorradoHoy.toFixed(3)}€
   Mes (estimación): ${metricas.dineroAhorradoMes.toFixed(2)}€

👥 CAPACIDAD:
   Usuarios que puede aguantar hoy: ~${metricas.usuariosEstimadosPosibles.toLocaleString("es-ES")}

═══════════════════════════════════════
  `.trim();

  return reporte;
}

/**
 * Obtiene el estado de conexión de Redis y estadísticas básicas del servidor
 */
export async function obtenerEstadoRedis(): Promise<{
  conectado: boolean;
  memoria?: string;
  clavesTotales?: number;
}> {
  try {
    const redis = await obtenerCliente();

    if (!redis) {
      return { conectado: false };
    }

    // Obtener información del servidor Redis
    const info = await redis.info("memory");
    const dbInfo = await redis.info("keyspace");

    // Extraer memoria usada
    const memoriaMatch = info.match(/used_memory_human:(\S+)/);
    const memoria = memoriaMatch ? memoriaMatch[1] : "desconocida";

    // Extraer número de claves (aproximado del keyspace)
    const clavesMatch = dbInfo.match(/keys=(\d+)/);
    const clavesTotales = clavesMatch ? parseInt(clavesMatch[1]) : 0;

    return {
      conectado: true,
      memoria,
      clavesTotales,
    };
  } catch (error) {
    return { conectado: false };
  }
}
