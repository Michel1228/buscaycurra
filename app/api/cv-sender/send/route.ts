import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scheduleCV } from "@/lib/cv-sender/scheduler";
import { checkRateLimit, getUserPlan } from "@/lib/cv-sender/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      userId?: string;
      companyUrl?: string;
      companyEmail?: string;
      companyName?: string;
      jobTitle?: string;
      priority?: "normal" | "prioritario";
      useAIPersonalization?: boolean;
    };

    const { userId, companyUrl, companyEmail, companyName, jobTitle, priority, useAIPersonalization } = body;

    if (!userId) {
      return NextResponse.json({ error: "El campo userId es obligatorio" }, { status: 400 });
    }

    if (!companyEmail) {
      return NextResponse.json({ error: "El campo companyEmail es obligatorio" }, { status: 400 });
    }

    if (!companyName) {
      return NextResponse.json({ error: "El campo companyName es obligatorio" }, { status: 400 });
    }

    const emailRegex = /^[^@\s]{1,64}@[^@\s]{1,253}$/;
    if (!emailRegex.test(companyEmail) || !companyEmail.includes(".")) {
      return NextResponse.json({ error: "El email de la empresa no tiene un formato valido" }, { status: 400 });
    }

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
        { status: 429 }
      );
    }

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

    if ("error" in resultado) {
      return NextResponse.json({ error: resultado.error }, { status: 400 });
    }

    // Enviar email de confirmacion al usuario (silencioso si falla)
    try {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "http://placeholder",
        process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
      );
      const { data: profile } = await sb.from("profiles").select("email, nombre").eq("id", userId).single();
      if (profile?.email) {
        const { sendConfirmationEmail } = await import("@/lib/email/smtp-sender");
        await sendConfirmationEmail({
          userEmail: profile.email,
          userName: profile.nombre || "Usuario",
          companyName,
          companyEmail,
          jobTitle,
          companyUrl,
          sentAt: new Date(),
        });
      }
    } catch { /* silencioso si no hay SMTP configurado */ }

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
    return NextResponse.json({ error: "Error interno del servidor. Por favor, intentalo de nuevo." }, { status: 500 });
  }
}
