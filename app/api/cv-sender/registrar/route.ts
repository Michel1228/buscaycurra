import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // Insertar en Supabase cv_sends (misma tabla que usan pipeline, envios y rate-limiter)
    const { error: insertError } = await sb
      .from("cv_sends")
      .insert({
        user_id: userId,
        company_name: companyName.slice(0, 200),
        company_email: "manual@buscaycurra.es",
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
          companyEmail: "",
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
