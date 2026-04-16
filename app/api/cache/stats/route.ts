/**
 * Endpoint API para estadísticas del caché — Solo para administradores
 *
 * GET /api/cache/stats
 * Devuelve todas las métricas del sistema de caché
 *
 * Requiere el header: x-admin-secret con el valor de ADMIN_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { obtenerMetricasCache, obtenerReporteDiario, obtenerEstadoRedis } from "../../../../lib/cache/cache-monitor";

/**
 * Maneja las peticiones GET al endpoint de estadísticas
 * Devuelve métricas completas del sistema de caché
 */
export async function GET(request: NextRequest) {
  // ==========================================
  // VERIFICACIÓN DE PERMISOS (solo admin)
  // ==========================================

  // Obtener el secret del header de la petición
  const adminSecret = request.headers.get("x-admin-secret");

  // Verificar que el secret coincide con el configurado en las variables de entorno
  // Usamos comparación en tiempo constante para evitar ataques de temporización
  const expectedSecret = process.env.ADMIN_SECRET ?? "";
  const secretsMatch =
    adminSecret !== null &&
    adminSecret.length === expectedSecret.length &&
    timingSafeEqual(Buffer.from(adminSecret), Buffer.from(expectedSecret));
  if (!adminSecret || !secretsMatch) {
    console.warn("⚠️  Intento de acceso no autorizado a /api/cache/stats");
    return NextResponse.json(
      {
        error: "No autorizado",
        mensaje: "Necesitas el header x-admin-secret para acceder a esta ruta",
      },
      { status: 401 }
    );
  }

  // ==========================================
  // OBTENER MÉTRICAS
  // ==========================================

  try {
    console.log("📊 Admin solicitó estadísticas del caché");

    // Obtener todos los datos en paralelo para mayor velocidad
    const [metricas, estadoRedis, reporte] = await Promise.all([
      obtenerMetricasCache(),
      obtenerEstadoRedis(),
      obtenerReporteDiario(),
    ]);

    // ==========================================
    // RESPUESTA CON TODAS LAS MÉTRICAS
    // ==========================================

    return NextResponse.json(
      {
        // Estado de Redis
        redis: {
          conectado: estadoRedis.conectado,
          memoriaUsada: estadoRedis.memoria,
          totalClaves: estadoRedis.clavesTotales,
        },

        // Métricas del caché de IA
        cache: {
          hitRate: metricas.hitRate,
          porcentajeEficiencia: `${metricas.hitRate}%`,
          hitsHoy: metricas.totalHitsHoy,
          missesHoy: metricas.totalMissesHoy,
          totalPeticionesHoy: metricas.totalPeticionesHoy,
        },

        // Uso de las APIs de IA
        ia: {
          groq: {
            llamadasHoy: metricas.llamadasGroqHoy,
            limiteMaximo: metricas.limiteGroq,
            porcentajeUsado: `${Math.round((metricas.llamadasGroqHoy / metricas.limiteGroq) * 100)}%`,
            disponible: metricas.llamadasGroqHoy < metricas.limiteGroq,
          },
          gemini: {
            llamadasHoy: metricas.llamadasGeminiHoy,
            limiteMaximo: metricas.limiteGemini,
            porcentajeUsado: `${Math.round((metricas.llamadasGeminiHoy / metricas.limiteGemini) * 100)}%`,
            disponible: metricas.llamadasGeminiHoy < metricas.limiteGemini,
          },
        },

        // Estimaciones económicas
        ahorro: {
          dineroAhorradoHoy: `${metricas.dineroAhorradoHoy.toFixed(3)}€`,
          dineroAhorradoMes: `${metricas.dineroAhorradoMes.toFixed(2)}€`,
        },

        // Capacidad del sistema
        capacidad: {
          usuariosEstimados: metricas.usuariosEstimadosPosibles,
          descripcion: `Con el caché actual, el sistema puede atender aproximadamente ${metricas.usuariosEstimadosPosibles.toLocaleString("es-ES")} usuarios más hoy`,
        },

        // Reporte en texto legible
        reporteTexto: reporte,

        // Metadatos
        actualizadoEn: metricas.fechaActualizacion,
      },
      {
        status: 200,
        headers: {
          // Caché corto para esta respuesta (30 segundos)
          "Cache-Control": "private, max-age=30",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas del caché:", (error as Error).message);

    return NextResponse.json(
      {
        error: "Error interno",
        mensaje: "No se pudieron obtener las estadísticas del caché",
        detalle: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
