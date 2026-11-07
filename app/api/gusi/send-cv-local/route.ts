/**
 * /api/gusi/send-cv-local — Envío real de CV a negocio local (Google Places)
 * 
 * POST { companyName, companyPhone, companyEmail?, puesto, website?, city? }
 * La carta la escribe la cola con el CV de verdad (useAIPersonalization).
 */
import { NextRequest, NextResponse } from "next/server";
import { addCVJob } from "@/lib/cv-sender/queue";
import { getUserId, correoSinVerificar } from "@/lib/auth-server";
import { findEmail } from "@/lib/email-finder";
import { checkRateLimit, getUserPlan } from "@/lib/cv-sender/rate-limiter";
import { canSendToCompany } from "@/lib/cv-sender/tracker";
import { motivoParaNoEnviar } from "@/lib/cv-sender/direccion-segura";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json() as {
      userId?: string;
      companyName?: string;
      companyPhone?: string;
      companyEmail?: string;
      puesto?: string;
      adaptedCv?: string;
      coverLetter?: string;
      website?: string;
      city?: string;
    };

    const companyName = body.companyName || "Empresa local";
    let companyEmail = body.companyEmail || "";
    const jobTitle = body.puesto || "Candidatura espontánea";

    // Si no hay email, intentar encontrarlo automáticamente. Solo vale el que
    // sale en la web del propio negocio ("high"): los de buscadores y
    // directorios pueden ser de OTRO negocio de la misma página, y lo que se
    // manda es el CV de una persona, con sus datos.
    if (!companyEmail) {
      const result = await findEmail(
        companyName,
        body.city || "",
        body.website,
        body.companyPhone
      );

      if (result.email && result.confidence === "high") {
        companyEmail = result.email;
        console.log(`[send-cv-local] Email encontrado para ${companyName}: ${companyEmail} (fuente: ${result.source}, confianza: ${result.confidence})`);
      }
    }

    // Si aún no hay email, devolver error amigable
    if (!companyEmail) {
      return NextResponse.json({
        success: false,
        message: `No tengo email para ${companyName}. ¿Puedes pasármelo? 📧`,
        needsEmail: true,
        companyName,
        companyPhone: body.companyPhone || "",
      });
    }

    // ── Límite de envíos ──────────────────────────────────────────────────
    // Esta ruta encolaba con userPlan "empresa" fijo y sin comprobar cuota, así
    // que enviar desde el chat de Guzzi saltaba el límite del plan por completo
    // (la cola tampoco lo comprueba). Mismo control que /api/cv-sender/send.
    const userPlan = await getUserPlan(userId);
    const rateLimitCheck = await checkRateLimit(userId, userPlan, companyEmail);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitCheck.reason,
          rateLimitInfo: {
            enviadosHoy: rateLimitCheck.enviadosHoy,
            limiteHoy: rateLimitCheck.limiteHoy,
            enviadosEsteMes: rateLimitCheck.enviadosEsteMes,
            limiteMes: rateLimitCheck.limiteMes,
            cvsRestantesHoy: 0,
          },
          upgradeUrl: "/app/perfil?tab=plan",
        },
        { status: 429 }
      );
    }

    // La misma espera de 15 días por empresa que el envío normal: esta ruta
    // encolaba directamente y se la saltaba.
    const motivo = await motivoParaNoEnviar(companyEmail);
    if (motivo) return NextResponse.json({ success: false, needsEmail: true, error: motivo, companyName });
    if (!(await canSendToCompany(userId, companyEmail))) {
      return NextResponse.json({
        success: false,
        error: `Ya le enviaste tu CV a ${companyName} hace menos de 15 días.`,
      }, { status: 409 });
    }

    // Añadir job a la cola BullMQ
    const jobId = await addCVJob({
      userId,
      companyName,
      companyEmail,
      companyUrl: body.website || "",
      jobTitle,
      priority: "normal",
      useAIPersonalization: true,
      scheduledFor: Date.now(),
      userPlan,
      frecuencia: "unico",
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: `📤 CV enviado a ${companyName} (${companyEmail})`,
      companyName,
      companyEmail,
    });

  } catch (err) {
    console.error("[send-cv-local] Error:", (err as Error).message);
    return NextResponse.json(
      { error: "Error al encolar el envío" },
      { status: 500 }
    );
  }
}
