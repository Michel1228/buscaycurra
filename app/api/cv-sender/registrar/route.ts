import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { userId, companyName, jobTitle } = await req.json() as {
    userId?: string;
    companyName?: string;
    jobTitle?: string;
  };

  if (!userId || !companyName) {
    return NextResponse.json({ error: "userId y companyName requeridos" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query(
    `INSERT INTO cv_sends (user_id, company_name, company_email, job_title, estado, sent_at, created_at)
     VALUES ($1, $2, '', $3, 'manual', NOW(), NOW())
     ON CONFLICT DO NOTHING`,
    [userId, companyName.slice(0, 200), (jobTitle || "").slice(0, 200)]
  );

  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "http://placeholder",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
    );
    const { data: profile } = await sb.from("profiles").select("email, nombre").eq("id", userId).single();
    if (profile?.email) {
      await enviarConfirmacion(profile.email, profile.nombre || "Usuario", companyName);
    }
  } catch { /* silencioso si no hay SMTP */ }

  return NextResponse.json({ ok: true });
}

async function enviarConfirmacion(userEmail: string, userName: string, empresa: string) {
  const { sendConfirmationEmail } = await import("@/lib/email/smtp-sender");
  await sendConfirmationEmail(userEmail, userName, empresa);
}
