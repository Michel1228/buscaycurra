/**
 * app/api/cv-sender/status/route.ts
 * API endpoint GET para ver el estado de los envíos de un usuario
 *
 * Query params:
 *   - userId: ID del usuario (obligatorio)
 *
 * Devuelve:
 *   - pendingJobs: Lista de envíos pendientes en la cola
 *   - history: Historial de envíos completados/fallidos
 *   - stats: Estadísticas del usuario (total, esta semana, este mes)
 *   - rateLimitInfo: Información del límite diario restante
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserPendingJobs } from "@/lib/cv-sender/scheduler";
import { getUserStats, getUserSendHistory } from "@/lib/cv-sender/tracker";
import { checkRateLimit, getUserPlan } from "@/lib/cv-sender/rate-limiter";

// ─── GET /api/cv-sender/status ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // ── Leer y validar el query param ─────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "El parámetro userId es obligatorio" },
        { status: 400 }
      );
    }

    // ── Obtener todos los datos en paralelo (más rápido) ─────────────────
    const [pendingJobs, stats, history, userPlan] = await Promise.all([
      getUserPendingJobs(userId),
      getUserStats(userId),
      getUserSendHistory(userId, 20), // Últimos 20 envíos
      getUserPlan(userId),
    ]);

    // Verificar el rate limit actual
    const rateLimitCheck = await checkRateLimit(userId, userPlan);

    // ── Formatear la respuesta ────────────────────────────────────────────
    const pendingJobsFormateados = pendingJobs.map((job) => ({
      id: job.id,
      companyName: job.companyName,
      scheduledFor: job.scheduledFor.toISOString(),
      scheduledForFormatted: job.scheduledFor.toLocaleString("es-ES", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Madrid",
      }),
      priority: job.priority,
      state: job.state,
    }));

    return NextResponse.json({
      success: true,
      userId,
      userPlan,
      pendingJobs: pendingJobsFormateados,
      totalPending: pendingJobsFormateados.length,
      history: history.map((record) => ({
        id: record.id,
        companyName: record.company_name,
        companyEmail: record.company_email,
        jobTitle: record.job_title,
        status: record.status,
        sentAt: record.sent_at,
        createdAt: record.created_at,
      })),
      stats: {
        totalEnviados: stats.totalEnviados,
        empresasContactadas: stats.empresasContactadas,
        enviadosEstaSemana: stats.enviadosEstaSemana,
        enviadosEsteMes: stats.enviadosEsteMes,
        enviadosHoy: stats.enviadosHoy,
      },
      rateLimitInfo: {
        enviadosHoy: rateLimitCheck.enviadosHoy,
        limiteHoy: rateLimitCheck.limiteHoy,
        enviadosEsteMes: rateLimitCheck.enviadosEsteMes,
        limiteMes: rateLimitCheck.limiteMes,
        cvsRestantesHoy: rateLimitCheck.cvsRestantesHoy,
        puedeEnviar: rateLimitCheck.allowed,
      },
    });
  } catch (error) {
    console.error("[API status] Error inesperado:", (error as Error).message);
    return NextResponse.json(
      { error: "Error interno del servidor al obtener el estado de los envíos." },
      { status: 500 }
    );
  }
}
