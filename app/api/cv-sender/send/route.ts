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
import { scheduleCV, getNextBusinessHour } from "@/lib/cv-sender/scheduler";
import { checkRateLimit, getUserPlan } from "@/lib/cv-sender/rate-limiter";
import { addCVJob } from "@/lib/cv-sender/queue";
import { canSendToCompany } from "@/lib/cv-sender/tracker";

// ─── Programa empresas adicionales en background para "cada4días" ─────────────
async function programarEmpresasAdicionales(opts: {
  userId: string;
  jobTitle: string;
  companyEmail: string; // excluir esta empresa (ya programada)
  priority?: "normal" | "prioritario";
  useAIPersonalization?: boolean;
  userPlan: "free" | "basico" | "esencial" | "pro" | "empresa";
}) {
  try {
    const { buscarOfertasReales } = await import("@/lib/job-search/real-search");
    const ofertas = await buscarOfertasReales(opts.jobTitle, "España", 15);

    // Filtrar: con email, no contactada recientemente, distinta a la ya programada
    const candidatas = ofertas.filter(o =>
      o.emailEmpresa &&
      o.emailEmpresa !== opts.companyEmail
    );

    let diasOffset = 4;
    let programadas = 0;

    for (const oferta of candidatas) {
      if (programadas >= 4) break; // max 4 envíos automáticos adicionales
      if (!oferta.emailEmpresa) continue;

      const puedeEnviar = await canSendToCompany(opts.userId, oferta.emailEmpresa);
      if (!puedeEnviar) continue;

      const rateLimitOk = await checkRateLimit(opts.userId, opts.userPlan, oferta.emailEmpresa);
      if (!rateLimitOk.allowed) continue;

      // Calcular fecha: diasOffset días laborables desde ahora
      const fechaBase = new Date();
      fechaBase.setDate(fechaBase.getDate() + diasOffset);
      const fechaEnvio = getNextBusinessHour(fechaBase);
      const delayMs = Math.max(0, fechaEnvio.getTime() - Date.now());

      await addCVJob({
        userId: opts.userId,
        companyName: oferta.empresa,
        companyEmail: oferta.emailEmpresa,
        companyUrl: oferta.url || "",
        jobTitle: oferta.titulo || opts.jobTitle,
        priority: opts.priority ?? "normal",
        useAIPersonalization: opts.useAIPersonalization ?? true,
        scheduledFor: fechaEnvio.getTime(),
        userPlan: opts.userPlan,
        frecuencia: "cada4dias",
      }, delayMs, 10);

      programadas++;
      diasOffset += 4 + Math.floor(Math.random() * 2); // 4-5 días entre cada envío
    }

    console.log(`[AutoSend] Programados ${programadas} envíos adicionales para ${opts.userId}`);
  } catch (err) {
    console.warn("[AutoSend] No se pudieron programar envíos adicionales:", (err as Error).message);
  }
}

// ─── POST /api/cv-sender/send ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Verificar autenticación ───────────────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    const syncSecret = request.headers.get("x-sync-secret");
    const internalUserId = request.headers.get("x-user-id");

    let userId: string;

    // 🔒 Ruta A: Llamada interna desde agente/cron (x-sync-secret + x-user-id)
    if (syncSecret && internalUserId && syncSecret === process.env.ADMIN_SECRET) {
      userId = internalUserId;
    }
    // 🔒 Ruta B: Llamada de usuario normal (Bearer token JWT)
    else if (authHeader?.startsWith("Bearer ")) {
      const supabasePublico = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user }, error: authError } = await supabasePublico.auth.getUser(authHeader.slice(7));
      if (authError || !user) {
        return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
      }
      userId = user.id;
    }
    else {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // ── Leer y validar el cuerpo de la petición ────────────────────────────
    const body = await request.json() as {
      companyUrl?: string;
      companyEmail?: string;
      companyName?: string;
      jobTitle?: string;
      priority?: "normal" | "prioritario";
      useAIPersonalization?: boolean;
      frecuencia?: "unico" | "cada4dias";
      strategy?: "ahora" | "optimo" | "personalizada";
      scheduledFor?: string; // ISO string cuando strategy="personalizada"
      cartaPersonalizada?: string;
    };

    const { companyUrl, companyEmail, companyName, jobTitle, priority, useAIPersonalization, frecuencia, strategy, scheduledFor, cartaPersonalizada } = body;

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

    // ── Verificar que el usuario tiene CV ───────────────────────────
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Primero buscar PDF en Supabase Storage
    const { data: cvFiles } = await supabaseAdmin.storage
      .from("cvs")
      .list(userId, { limit: 1, search: "cv.pdf" });

    let tieneCV = cvFiles && cvFiles.length > 0;

    // Si no hay PDF en storage, verificar si el CV existe en la tabla CV (editor)
    // ⚠️ La tabla CV puede usar userIds/emails diferentes a Supabase auth
    // Buscamos por email de Supabase, email alternativo, o comprobamos si el plan es de pago
    if (!tieneCV) {
      const userPlanCheck = await getUserPlan(userId);
      // Si el usuario tiene plan de pago, asumimos que tiene CV (ya pasó el onboarding)
      if (userPlanCheck !== 'free') {
        tieneCV = true;
      } else if (user.email) {
        const { data: cvRows } = await supabaseAdmin
          .from("CV")
          .select("id")
          .or(`email.eq.${user.email},userId.eq.${userId}`)
          .eq("isActive", true)
          .limit(1);
        tieneCV = cvRows && cvRows.length > 0;
      }
    }

    if (!tieneCV) {
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

    // ── Calcular scheduledFor según estrategia ────────────────────────────
    // Default: "ahora" (1 min) en vez de "optimo". Los envíos no deben esperar a
    // la siguiente hora hábil si el usuario acaba de hacer clic en "Enviar CV".
    let scheduledForMs: number | undefined;
    if (!strategy || strategy === "ahora") {
      scheduledForMs = Date.now() + 60_000; // 1 min desde ahora
    } else if (strategy === "personalizada" && scheduledFor) {
      scheduledForMs = new Date(scheduledFor).getTime();
      if (scheduledForMs <= Date.now()) {
        return NextResponse.json(
          { error: "La fecha programada debe ser futura" },
          { status: 400 }
        );
      }
    }
    // strategy="optimo" → scheduledForMs = undefined → el scheduler decide

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
        frecuencia: frecuencia ?? "unico",
        scheduledFor: scheduledForMs,
      }
    );

    // Si scheduleCV devuelve un error
    if ("error" in resultado) {
      return NextResponse.json({ error: resultado.error }, { status: 400 });
    }

    // ── Si frecuencia = "cada4dias", buscar y programar empresas adicionales ──
    // Se lanza en background sin bloquear la respuesta al usuario
    if (frecuencia === "cada4dias") {
      void programarEmpresasAdicionales({
        userId,
        jobTitle: jobTitle || companyName, // usar nombre de empresa como fallback si no hay puesto
        companyEmail,
        priority,
        useAIPersonalization,
        userPlan,
      });
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
          cvsRestantesHoy: rateLimitCheck.cvsRestantesHoy === null ? null : rateLimitCheck.cvsRestantesHoy - 1,
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
