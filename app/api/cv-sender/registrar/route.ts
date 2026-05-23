import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getUserPlan } from "@/lib/cv-sender/rate-limiter";
import { canSendToCompany } from "@/lib/cv-sender/tracker";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId, companyName, jobTitle, companyUrl } = await req.json() as {
      userId?: string;
      companyName?: string;
      jobTitle?: string;
      companyUrl?: string;
    };

    if (!userId || !companyName) {
      return NextResponse.json({ error: "userId y companyName requeridos" }, { status: 400 });
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Derivar email único por empresa para que el 90-day check funcione
    const empresaSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
    const companyEmail = `${empresaSlug}@manual.buscaycurra.es`;

    // ── Rate limit ──
    const userPlan = await getUserPlan(userId);
    const rateLimitCheck = await checkRateLimit(userId, userPlan, companyEmail);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.reason || "Límite de envíos alcanzado" },
        { status: 429 }
      );
    }

    // ── 90-day check ──
    const puedeEnviar = await canSendToCompany(userId, companyEmail);
    if (!puedeEnviar) {
      return NextResponse.json(
        { error: `Ya enviaste tu CV a ${companyName} hace menos de 90 días.` },
        { status: 429 }
      );
    }

    // ── Insertar en Supabase ──
    const { error: insertError } = await sb
      .from("cv_sends")
      .insert({
        user_id: userId,
        company_name: companyName.slice(0, 200),
        company_email: companyEmail,
        company_url: (companyUrl || "").slice(0, 500),
        job_title: (jobTitle || "").slice(0, 200),
        status: "enviado",
        sent_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("[registrar] Error insertando en Supabase:", insertError.message);
      return NextResponse.json({ error: "Error al registrar el envío" }, { status: 500 });
    }

    // Email de confirmación (best-effort)
    try {
      const { data: profile } = await sb.from("profiles").select("email, full_name").eq("id", userId).single();
      if (profile?.email) {
        const { sendConfirmationEmail } = await import("@/lib/email/smtp-sender");
        await sendConfirmationEmail({
          userEmail: profile.email,
          userName: profile.full_name || profile.email.split("@")[0],
          companyName,
          companyEmail,
          jobTitle,
          companyUrl,
          sentAt: new Date(),
        });
      }
    } catch { /* silencioso si no hay SMTP */ }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[registrar] Error:", (err as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
