/**
 * app/api/cv-sender/send/route.ts
 * API endpoint POST para programar el envío automático de un CV
 *
 * Auth:
 *   Header obligatorio: Authorization: Bearer <supabase_access_token>
 *   El userId se extrae del token, NUNCA del body.
 *
 * Recibe:
 *   - companyUrl: URL de la empresa destino
 *   - companyEmail: Email de RRHH de la empresa (obligatorio)
 *   - companyName: Nombre de la empresa (obligatorio)
 *   - jobTitle: Puesto al que aplica (opcional)
 *   - priority: "normal" | "prioritario" (opcional)
 *   - useAIPersonalization: boolean (opcional)
 *
 * Devuelve:
 *   - jobId: ID del job en BullMQ
 *   - estimatedTime: Fecha/hora estimada de envío
 *   - positionInQueue: Posición en la cola
 *   - rateLimitInfo: Información sobre el límite restante del usuario
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scheduleCV } from "@/lib/cv-sender/scheduler";
import { checkRateLimit, getUserPlan } from "@/lib/cv-sender/rate-limiter";

// ─── POST /api/cv-sender/send ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ─── Cliente Supabase con clave anónima (para verificar sesión) ───────────
  const supabasePublico = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // ── Verificar autenticación del usuario ─────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión para programar envíos." },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabasePublico.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sesión no válida. Por favor, inicia sesión de nuevo." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ── Leer y validar el cuerpo de la petición ────────────────────────────
    const body = await request.json() as {
      companyUrl?: string;
      companyEmail?: string;
      companyName?: string;
      jobTitle?: string;
      priority?: "normal" | "prioritario";
      useAIPersonalization?: boolean;
    };

    const { companyUrl, companyEmail, companyName, jobTitle, priority, useAIPersonalization } = body;

    if (!companyEmail) {
      return NextResponse.json(
        { error: "El campo companyEmail es obligatorio" },
        { status: 400 }
      );
    }

    if (!companyName) {
      return NextResponse.json(
        { error: "El campo companyName es obligatorio" },
        { status: 400 }
      );
    }

    // Validación básica del email
    // Usamos una regex simple y segura para evitar ataques ReDoS
    const emailRegex = /^[^@\s]{1,64}@[^@\s]{1,253}$/;
    if (!emailRegex.test(companyEmail) || !companyEmail.includes(".")) {
      return NextResponse.json(
        { error: "El email de la empresa no tiene un formato válido" },
        { status: 400 }
      );
    }

    // ── Verificar límite de envíos del usuario ────────────────────────────
    const userPlan = await getUserPlan(userId);
    const rateLimitCheck = await checkRateLimit(userId, userPlan, companyEmail);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: rateLimitCheck.reason,
          rateLimitInfo: {
            enviadosHoy: rateLimitCheck.enviadosHoy,
            limiteHoy: rateLimitCheck.limiteHoy,
            enviadosEsteMes: rateLimitCheck.enviadosEsteMes,
            limiteMes: rateLimitCheck.limiteMes,
            cvsRestantesHoy: 0,
          },
        },
        { status: 429 } // 429 = Too Many Requests
      );
    }

    // ── Programar el envío ────────────────────────────────────────────────
    const resultado = await scheduleCV(
      userId,
      {
        name: companyName,
        email: companyEmail,
        url: companyUrl ?? "",
        jobTitle,
      },
      {
        priority: priority ?? "normal",
        useAIPersonalization: useAIPersonalization ?? true,
      }
    );

    // Si scheduleCV devuelve un error
    if ("error" in resultado) {
      return NextResponse.json({ error: resultado.error }, { status: 400 });
    }

    // ── Respuesta exitosa ─────────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        jobId: resultado.jobId,
        estimatedTime: resultado.scheduledFor.toISOString(),
        estimatedTimeFormatted: resultado.scheduledFor.toLocaleString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Madrid",
        }),
        positionInQueue: resultado.positionInQueue,
        estimatedWaitMinutes: resultado.estimatedWaitMinutes,
        rateLimitInfo: {
          enviadosHoy: rateLimitCheck.enviadosHoy,
          limiteHoy: rateLimitCheck.limiteHoy,
          cvsRestantesHoy: rateLimitCheck.cvsRestantesHoy - 1,
          userPlan,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API send] Error inesperado:", (error as Error).message);
    return NextResponse.json(
      { error: "Error interno del servidor. Por favor, inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
