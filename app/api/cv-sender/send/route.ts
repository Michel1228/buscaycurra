import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scheduleCV } from "@/lib/cv-sender/scheduler";
import { checkRateLimit, getUserPlan } from "@/lib/cv-sender/rate-limiter";
import { recordSent } from "@/lib/cv-sender/tracker";

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
      scheduledFor?: string; // ISO string elegido por el usuario
    };

    const { userId, companyUrl, companyEmail, companyName, jobTitle, priority, useAIPersonalization, scheduledFor } = body;

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

    const fechaElegida = scheduledFor ? new Date(scheduledFor) : undefined;

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
        scheduledFor: fechaElegida,
      }
    );

    if ("error" in resultado) {
      return NextResponse.json({ error: resultado.error }, { status: 400 });
    }

    // Registrar envío como "pendiente" INMEDIATAMENTE para que el rate limiter lo cuente
    // en solicitudes simultáneas (evita la condición de carrera con el worker)
    await recordSent(userId, companyEmail, "pendiente", {
      company_name: companyName,
      job_title: jobTitle,
      job_id: resultado.jobId,
    });

    // Email de confirmación inmediata al usuario usando Supabase Auth (tiene el email real)
    try {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: { user: authUser } } = await sb.auth.admin.getUserById(userId);
      const { data: perfil } = await sb.from("profiles").select("full_name").eq("id", userId).single();

      if (authUser?.email) {
        const { sendConfirmationEmail } = await import("@/lib/email/smtp-sender");
        await sendConfirmationEmail({
          userEmail: authUser.email,
          userName: perfil?.full_name || authUser.email.split("@")[0],
          companyName,
          companyEmail,
          jobTitle,
          companyUrl,
          sentAt: resultado.scheduledFor,
        });
      }
    } catch (err) {
      console.error("[API send] Error enviando confirmación:", (err as Error).message);
    }

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
