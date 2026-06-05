// @ts-nocheck
/**
 * POST /api/au-pair/send
 * Envía el perfil Au Pair a una familia/agencia por email
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCVEmail } from "@/lib/cv-sender/email-sender";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Auth
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
    if (authError || !user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }
    const userId = user.id;

    const body = await request.json() as {
      familyEmail: string;
      familyName?: string;
      personalMessage?: string;
    };

    const { familyEmail, familyName, personalMessage } = body;
    if (!familyEmail || !familyEmail.includes("@")) {
      return NextResponse.json({ error: "Email de la familia requerido" }, { status: 400 });
    }

    // ── Obtener perfil Au Pair de Supabase ──────────────────────────────
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: profileRow } = await adminClient
      .from("au_pair_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!profileRow) {
      return NextResponse.json(
        { error: "No tienes perfil Au Pair. Crea tu perfil primero." },
        { status: 400 }
      );
    }

    const profile = profileRow;

    // ── Verificar rate limit (mismo sistema que cv-sender) ──────────────
    const { data: userProfile } = await adminClient
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    const plan = userProfile?.plan || "free";
    const LIMITES: Record<string, number> = { free: 2, esencial: 5, pro: 10, empresa: 9999 };
    const limiteHoy = LIMITES[plan] ?? 2;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const { count: enviadosHoy } = await adminClient
      .from("cv_sends")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["enviado", "pendiente"])
      .gte("created_at", hoy.toISOString());

    if ((enviadosHoy || 0) >= limiteHoy && plan !== "empresa") {
      return NextResponse.json(
        { error: `Límite diario de ${limiteHoy} envíos alcanzado` },
        { status: 429 }
      );
    }

    // ── Obtener datos del usuario ───────────────────────────────────────
    const { data: authData } = await adminClient.auth.admin.getUserById(userId);
    const userEmail = authData?.user?.email || "";
    const userName = profile.nombre || "Candidato Au Pair";

    // ── Generar HTML del perfil ─────────────────────────────────────────
    const auPairLetter = profile.letter_text || "";
    const mensajeAdicional = personalMessage
      ? `\n\n<p style="margin:0 0 14px;line-height:1.7;color:#1e293b;font-size:15px;">${personalMessage}</p>`
      : "";

    const coverLetter = `Dear ${familyName || "Host Family"},

My name is ${userName} and I am interested in becoming your Au Pair.

${auPairLetter}

${personalMessage ? personalMessage + "\n\n" : ""}I look forward to hearing from you.

Warm regards,
${userName}`;

    const subjectLine = `Au Pair Application — ${userName} from ${profile.nationality || "Spain"}`;

    // ── Registrar en cv_sends ──────────────────────────────────────────
    await adminClient.from("cv_sends").insert({
      user_id: userId,
      company_name: familyName || "Host Family",
      company_email: familyEmail,
      job_title: "Au Pair",
      status: "pendiente",
      sent_at: null,
    });

    // ── Enviar email ───────────────────────────────────────────────────
    const emailResult = await sendCVEmail(
      familyEmail,
      {
        userName,
        userEmail,
        userPhone: "",
      },
      coverLetter,
      subjectLine,
      familyName || "Host Family"
    );

    if (!emailResult.success) {
      // Actualizar estado a fallido
      await adminClient
        .from("cv_sends")
        .update({ status: "fallido" })
        .eq("user_id", userId)
        .eq("company_email", familyEmail)
        .eq("status", "pendiente");

      return NextResponse.json(
        { error: emailResult.error || "Error al enviar email" },
        { status: 500 }
      );
    }

    // ── Actualizar a enviado ───────────────────────────────────────────
    await adminClient
      .from("cv_sends")
      .update({ status: "enviado", sent_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("company_email", familyEmail)
      .eq("status", "pendiente");

    return NextResponse.json({
      success: true,
      message: `✅ Perfil enviado a ${familyName || familyEmail}`,
      emailId: emailResult.messageId,
    });
  } catch (error) {
    console.error("[au-pair/send] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Error interno al enviar perfil" },
      { status: 500 }
    );
  }
}
