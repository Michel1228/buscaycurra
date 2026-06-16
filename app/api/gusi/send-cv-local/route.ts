/**
 * /api/gusi/send-cv-local — Envío real de CV a negocio local (Google Places)
 * 
 * POST { userId, companyName, companyPhone, companyEmail, puesto, adaptedCv, coverLetter, website?, city? }
 */
import { NextRequest, NextResponse } from "next/server";
import { addCVJob } from "@/lib/cv-sender/queue";
import { getUserId } from "@/lib/auth-server";
import { findEmail } from "@/lib/email-finder";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

    // Si no hay email, intentar encontrarlo automáticamente
    if (!companyEmail) {
      const result = await findEmail(
        companyName,
        body.city || "Tudela",
        body.website,
        body.companyPhone
      );

      if (result.email) {
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
      userPlan: "empresa",
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
