/**
 * app/api/cv-sender/cancel/route.ts
 * API endpoint DELETE para cancelar un envío pendiente
 *
 * Body JSON:
 *   - jobId: ID del job en BullMQ (obligatorio)
 *   - userId: ID del usuario (obligatorio, para verificar propiedad)
 *
 * Devuelve:
 *   - success: true si se canceló, false si no se pudo
 *   - message: Mensaje descriptivo del resultado
 */

import { NextRequest, NextResponse } from "next/server";
import { cancelJob } from "@/lib/cv-sender/scheduler";
import { updateSendStatus } from "@/lib/cv-sender/tracker";

// ─── DELETE /api/cv-sender/cancel ─────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    // ── Leer y validar el cuerpo de la petición ────────────────────────────
    const body = await request.json() as {
      jobId?: string;
      userId?: string;
    };

    const { jobId, userId } = body;

    // Validación de campos obligatorios
    if (!jobId) {
      return NextResponse.json(
        { error: "El campo jobId es obligatorio" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "El campo userId es obligatorio" },
        { status: 400 }
      );
    }

    // ── Intentar cancelar el job ──────────────────────────────────────────
    const cancelado = await cancelJob(jobId, userId);

    if (!cancelado) {
      return NextResponse.json(
        {
          success: false,
          message: "No se pudo cancelar el envío. Es posible que ya esté procesándose, completado, o no te pertenezca.",
        },
        { status: 400 }
      );
    }

    // Actualizar estado en Supabase a "cancelado"
    await updateSendStatus(jobId, "cancelado");

    console.log(`[API cancel] Job ${jobId} cancelado por el usuario ${userId}`);

    return NextResponse.json({
      success: true,
      message: "El envío ha sido cancelado correctamente.",
      jobId,
    });
  } catch (error) {
    console.error("[API cancel] Error inesperado:", (error as Error).message);
    return NextResponse.json(
      { error: "Error interno del servidor al cancelar el envío." },
      { status: 500 }
    );
  }
}
