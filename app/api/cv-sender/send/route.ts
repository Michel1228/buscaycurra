/**
 * app/api/cv-sender/send/route.ts
 * API endpoint POST para programar el envío automático de un CV
 *
 * Recibe:
 *   - userId: ID del usuario en Supabase
 *   - companyUrl: URL de la empresa destino
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
  try {
    // ── Verificar autenticación ───────────────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const supabasePublico = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabasePublico.auth.getUser(authHeader.slice(7));
    if (authError || !user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }

    // ── Leer y validar el cuerpo de la petición ────────────────────────────
    const body = await request.json() as {
      companyUrl?: string;
      companyEmail?: string;
      companyName?: string;
      jobTitle?: string;
      priority?: "normal" | "prioritario";
      useAIPersonalization?: boolean;
    };

    // userId siempre del token — nunca del body
    const userId = user.id;
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

    // ── Verificar que el usuario tiene CV subido ───────────────────────────
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: cvFiles } = await supabaseAdmin.storage
      .from("cvs")
      .list(userId, { limit: 1, search: "cv.pdf" });

    if (!cvFiles || cvFiles.length === 0) {
      return NextResponse.json(
        { error: "Debes subir tu CV antes de poder enviar candidaturas. Ve a tu perfil para subirlo." },
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
          cvsRestantesHoy: rateLimitCheck.cvsRestantesHoy - 1, // Restamos el que acabamos de añadir
          userPlan,
        },
      },
      { status: 201 } // 201 = Created
    );
  } catch (error) {
    console.error("[API send] Error inesperado:", (error as Error).message);
    return NextResponse.json(
      { error: "Error interno del servidor. Por favor, inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
