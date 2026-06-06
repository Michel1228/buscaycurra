/**
 * POST /api/au-pair/send
 * Envía el perfil Au Pair a una familia/agencia por email con PDF adjunto
 * y un HTML completo del perfil (fotos, aptitudes, referencias, datos personales).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { jsPDF } from "jspdf";
import type { AuPairProfile, AuPairReference } from "@/lib/au-pair";

export const dynamic = "force-dynamic";

// ─── Constantes ────────────────────────────────────────────────────────────────

const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@buscaycurra.es";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

/** Límites de envío diarios según plan */
const LIMITES: Record<string, number> = {
  free: 2, esencial: 5, basico: 15, pro: 50, empresa: 9999,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeEmailHeader(value: string): string {
  return (value || "").replace(/[\r\n\t]/g, " ").trim().slice(0, 200);
}

function escapeHtml(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Generación de PDF ────────────────────────────────────────────────────────

/**
 * Genera un PDF del perfil Au Pair usando jsPDF.
 * Incluye datos personales, idiomas, experiencia, referencias y carta de presentación.
 */
function generateAuPairPDF(profile: AuPairProfile, coverLetter: string): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 25;

  // ── Título ────────────────────────────────────────────────────────────
  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235); // Azul BuscayCurra
  doc.text("Au Pair Profile", pageWidth / 2, y, { align: "center" });
  y += 12;

  // ── Nombre y datos básicos ────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  const nombre = profile.nombre || "Candidate";
  doc.text(nombre, margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const basicInfo: string[] = [];
  if (profile.age) basicInfo.push(`Age: ${profile.age}`);
  if (profile.nationality) basicInfo.push(`Nationality: ${profile.nationality}`);
  if (profile.ciudad) basicInfo.push(`City: ${profile.ciudad}`);
  if (basicInfo.length > 0) {
    doc.text(basicInfo.join("  |  "), margin, y);
    y += 6;
  }

  // ── Separador ─────────────────────────────────────────────────────────
  y += 4;
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Secciones ─────────────────────────────────────────────────────────
  const addSection = (title: string, content: string | null | undefined) => {
    if (!content) return;
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text(title, margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(content, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 6;
  };

  // Idiomas
  if (profile.languages && profile.languages.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text("Languages", margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(profile.languages.join(", "), margin, y);
    y += 8;
  }

  // Nivel educativo
  if (profile.nivel_educativo) {
    addSection("Education", profile.nivel_educativo);
  }

  // Experiencia con niños
  if (profile.childcare_experience) {
    addSection("Childcare Experience", profile.childcare_experience);
  }

  // Hobbies
  if (profile.hobbies) {
    addSection("Hobbies & Interests", profile.hobbies);
  }

  // Información dietética
  if (profile.dietary_info) {
    addSection("Dietary Information", profile.dietary_info);
  }

  // Duración preferida
  if (profile.duracion_preferida) {
    addSection("Preferred Duration", profile.duracion_preferida);
  }

  // Disponibilidad
  if (profile.available_from || profile.available_to) {
    const avail = [
      profile.available_from ? `From: ${profile.available_from}` : "",
      profile.available_to ? `To: ${profile.available_to}` : "",
    ].filter(Boolean).join("  —  ");
    if (avail) addSection("Availability", avail);
  }

  // Aptitudes (boolean flags)
  const skills: string[] = [];
  if (profile.has_driving_license) skills.push("Driving License");
  if (profile.primeros_auxilios) skills.push("First Aid Certified");
  if (profile.sabe_nadar) skills.push("Can Swim");
  if (!profile.fumador) skills.push("Non-Smoker");
  if (skills.length > 0) {
    addSection("Skills & Certifications", skills.join(", "));
  }

  // Referencias
  if (profile.references_json && profile.references_json.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text("References", margin, y);
    y += 7;
    for (const ref of profile.references_json) {
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const refText = [
        ref.nombre,
        ref.relacion ? `(${ref.relacion})` : "",
        ref.email,
        ref.telefono,
      ].filter(Boolean).join(" — ");
      doc.text(`• ${refText}`, margin + 4, y);
      y += 5;
    }
    y += 4;
  }

  // ── Carta de presentación ────────────────────────────────────────────
  y += 4;
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text("Cover Letter", margin, y);
  y += 7;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const letterLines = doc.splitTextToSize(coverLetter, pageWidth - margin * 2);
  doc.text(letterLines, margin, y);

  // ── Output ────────────────────────────────────────────────────────────
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

// ─── HTML del email ───────────────────────────────────────────────────────────

/**
 * Genera el HTML completo del email con todos los datos del perfil Au Pair.
 * Incluye: datos personales, fotos, idiomas, experiencia, aptitudes, referencias.
 */
function buildAuPairEmailHTML(
  profile: AuPairProfile,
  familyName: string | undefined,
  personalMessage: string | undefined,
  userName: string
): string {
  const nombre = profile.nombre || userName;
  const greeting = familyName ? `Dear ${familyName},` : "Dear Host Family,";

  // ── Datos personales ──────────────────────────────────────────────────
  const personalRows: string[] = [];
  if (profile.age) personalRows.push(`<tr><td style="color:#6b7280;padding:4px 12px 4px 0;font-size:14px;">Age</td><td style="color:#1e293b;padding:4px 0;font-size:14px;font-weight:500;">${profile.age}</td></tr>`);
  if (profile.nationality) personalRows.push(`<tr><td style="color:#6b7280;padding:4px 12px 4px 0;font-size:14px;">Nationality</td><td style="color:#1e293b;padding:4px 0;font-size:14px;font-weight:500;">${escapeHtml(profile.nationality)}</td></tr>`);
  if (profile.ciudad) personalRows.push(`<tr><td style="color:#6b7280;padding:4px 12px 4px 0;font-size:14px;">City</td><td style="color:#1e293b;padding:4px 0;font-size:14px;font-weight:500;">${escapeHtml(profile.ciudad)}</td></tr>`);
  if (profile.nivel_educativo) personalRows.push(`<tr><td style="color:#6b7280;padding:4px 12px 4px 0;font-size:14px;">Education</td><td style="color:#1e293b;padding:4px 0;font-size:14px;font-weight:500;">${escapeHtml(profile.nivel_educativo)}</td></tr>`);
  if (profile.duracion_preferida) personalRows.push(`<tr><td style="color:#6b7280;padding:4px 12px 4px 0;font-size:14px;">Duration</td><td style="color:#1e293b;padding:4px 0;font-size:14px;font-weight:500;">${escapeHtml(profile.duracion_preferida)}</td></tr>`);
  if (profile.available_from) personalRows.push(`<tr><td style="color:#6b7280;padding:4px 12px 4px 0;font-size:14px;">Available from</td><td style="color:#1e293b;padding:4px 0;font-size:14px;font-weight:500;">${escapeHtml(profile.available_from)}</td></tr>`);
  if (profile.available_to) personalRows.push(`<tr><td style="color:#6b7280;padding:4px 12px 4px 0;font-size:14px;">Available to</td><td style="color:#1e293b;padding:4px 0;font-size:14px;font-weight:500;">${escapeHtml(profile.available_to)}</td></tr>`);

  // ── Idiomas ───────────────────────────────────────────────────────────
  const languagesHtml = (profile.languages && profile.languages.length > 0)
    ? `<div style="margin-bottom:18px;">
        <p style="color:#2563EB;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">🗣 Languages</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${profile.languages.map(l => `<span style="background:#eff6ff;color:#2563EB;padding:5px 14px;border-radius:16px;font-size:13px;font-weight:500;">${escapeHtml(l)}</span>`).join("")}
        </div>
      </div>`
    : "";

  // ── Fotos ─────────────────────────────────────────────────────────────
  const photosHtml = (profile.photos && profile.photos.length > 0)
    ? `<div style="margin-bottom:18px;">
        <p style="color:#2563EB;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">📸 Photos</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${profile.photos.map(url => {
            const safeUrl = /^https?:\/\//.test(url) ? escapeHtml(url) : "";
            return safeUrl
              ? `<img src="${safeUrl}" alt="Au Pair photo" style="width:100px;height:100px;object-fit:cover;border-radius:8px;border:2px solid #e5e7eb;" />`
              : "";
          }).filter(Boolean).join("")}
        </div>
      </div>`
    : "";

  // ── Experiencia ───────────────────────────────────────────────────────
  const experienceHtml = profile.childcare_experience
    ? `<div style="margin-bottom:18px;">
        <p style="color:#2563EB;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">👶 Childcare Experience</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">${escapeHtml(profile.childcare_experience)}</p>
      </div>`
    : "";

  // ── Hobbies ───────────────────────────────────────────────────────────
  const hobbiesHtml = profile.hobbies
    ? `<div style="margin-bottom:18px;">
        <p style="color:#2563EB;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">🎨 Hobbies & Interests</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">${escapeHtml(profile.hobbies)}</p>
      </div>`
    : "";

  // ── Aptitudes / Skills ────────────────────────────────────────────────
  const skillsList: string[] = [];
  if (profile.has_driving_license) skillsList.push("🚗 Driving License");
  if (profile.primeros_auxilios) skillsList.push("🩹 First Aid Certified");
  if (profile.sabe_nadar) skillsList.push("🏊 Can Swim");
  if (!profile.fumador) skillsList.push("🚭 Non-Smoker");
  if (profile.dietary_info) skillsList.push(`🍽 ${escapeHtml(profile.dietary_info)}`);

  const skillsHtml = skillsList.length > 0
    ? `<div style="margin-bottom:18px;">
        <p style="color:#2563EB;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">⭐ Skills & Certifications</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${skillsList.map(s => `<span style="background:#f0fdf4;color:#166534;padding:5px 14px;border-radius:16px;font-size:13px;font-weight:500;">${s}</span>`).join("")}
        </div>
      </div>`
    : "";

  // ── Referencias ───────────────────────────────────────────────────────
  const refs = profile.references_json || [];
  const referencesHtml = refs.length > 0
    ? `<div style="margin-bottom:18px;">
        <p style="color:#2563EB;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">📋 References</p>
        ${refs.map((ref: AuPairReference) => `
          <div style="background:#f8fafc;border-left:3px solid #2563EB;padding:10px 14px;margin-bottom:8px;border-radius:4px;">
            <p style="margin:0;font-weight:600;color:#1e293b;font-size:14px;">${escapeHtml(ref.nombre)}${ref.relacion ? ` — <span style="font-weight:400;color:#6b7280;">${escapeHtml(ref.relacion)}</span>` : ""}</p>
            ${ref.email ? `<p style="margin:4px 0 0;color:#2563EB;font-size:13px;">✉ ${escapeHtml(ref.email)}</p>` : ""}
            ${ref.telefono ? `<p style="margin:2px 0 0;color:#6b7280;font-size:13px;">📞 ${escapeHtml(ref.telefono)}</p>` : ""}
          </div>`).join("")}
      </div>`
    : "";

  // ── Carta de presentación ─────────────────────────────────────────────
  const letterText = profile.letter_text || "";
  const letterParagraphs = letterText
    .split("\n")
    .filter(line => line.trim())
    .map(line => `<p style="margin:0 0 8px;line-height:1.6;color:#374151;font-size:14px;">${escapeHtml(line)}</p>`)
    .join("");

  // ── Mensaje personal ──────────────────────────────────────────────────
  const personalMessageHtml = personalMessage
    ? `<div style="background:#fef9e7;border-left:4px solid #F97316;border-radius:4px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">${escapeHtml(personalMessage)}</p>
      </div>`
    : "";

  // ── Construir HTML completo ───────────────────────────────────────────
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Au Pair Application — ${escapeHtml(nombre)}</title>
</head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Cabecera -->
          <tr>
            <td style="background:linear-gradient(135deg,#F97316,#ea580c);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">
                🌍 Au Pair Application
              </h1>
              <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:14px;">
                ${escapeHtml(nombre)} — ${escapeHtml(profile.nationality || "")}
              </p>
            </td>
          </tr>

          <!-- Saludo y mensaje personal -->
          <tr>
            <td style="padding:32px 40px 16px;">
              <p style="color:#1e293b;font-size:16px;font-weight:600;margin:0 0 4px;">${escapeHtml(greeting)}</p>
              <p style="color:#6b7280;font-size:14px;margin:0;">
                ${escapeHtml(nombre)} has applied to become your Au Pair through BuscayCurra. Below is their complete profile.
              </p>
              ${personalMessageHtml}
            </td>
          </tr>

          <!-- Datos personales -->
          <tr>
            <td style="padding:8px 40px 24px;">
              <p style="color:#2563EB;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">📋 Personal Details</p>
              <table cellpadding="0" cellspacing="0" style="width:100%;">
                ${personalRows.join("")}
              </table>
            </td>
          </tr>

          ${photosHtml ? `
          <!-- Fotos -->
          <tr>
            <td style="padding:0 40px 24px;">${photosHtml}</td>
          </tr>` : ""}

          ${languagesHtml ? `
          <!-- Idiomas -->
          <tr>
            <td style="padding:0 40px 12px;">${languagesHtml}</td>
          </tr>` : ""}

          ${skillsHtml ? `
          <!-- Aptitudes -->
          <tr>
            <td style="padding:0 40px 12px;">${skillsHtml}</td>
          </tr>` : ""}

          ${experienceHtml ? `
          <!-- Experiencia -->
          <tr>
            <td style="padding:0 40px 12px;">${experienceHtml}</td>
          </tr>` : ""}

          ${hobbiesHtml ? `
          <!-- Hobbies -->
          <tr>
            <td style="padding:0 40px 12px;">${hobbiesHtml}</td>
          </tr>` : ""}

          ${referencesHtml ? `
          <!-- Referencias -->
          <tr>
            <td style="padding:0 40px 12px;">${referencesHtml}</td>
          </tr>` : ""}

          ${letterText ? `
          <!-- Carta de presentación -->
          <tr>
            <td style="padding:12px 40px 24px;">
              <p style="color:#2563EB;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">💌 Cover Letter</p>
              <div style="background:#f8fafc;border-radius:8px;padding:20px 24px;">
                ${letterParagraphs}
              </div>
            </td>
          </tr>` : ""}

          <!-- Nota sobre PDF adjunto -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="color:#6b7280;font-size:13px;margin:0;text-align:center;">
                📎 Complete Au Pair profile attached as PDF
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                Sent via <a href="https://buscaycurra.es" style="color:#F97316;text-decoration:none;font-weight:600;">BuscayCurra</a>
                — Au Pair matching platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
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

    // ── Parsear body ──────────────────────────────────────────────────────
    const body = await request.json() as {
      familyEmail: string;
      familyName?: string;
      personalMessage?: string;
    };

    const { familyEmail, familyName, personalMessage } = body;
    if (!familyEmail || !familyEmail.includes("@")) {
      return NextResponse.json({ error: "Email de la familia requerido" }, { status: 400 });
    }

    // ── Obtener perfil Au Pair ────────────────────────────────────────────
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: profileRow, error: profileError } = await adminClient
      .from("au_pair_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError || !profileRow) {
      return NextResponse.json(
        { error: "No tienes perfil Au Pair. Crea tu perfil primero." },
        { status: 400 }
      );
    }

    const profile = profileRow as AuPairProfile;

    // ── Verificar rate limit ──────────────────────────────────────────────
    const { data: userProfile } = await adminClient
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    const plan: string = userProfile?.plan || "free";
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

    // ── Obtener datos del usuario ─────────────────────────────────────────
    const { data: authData } = await adminClient.auth.admin.getUserById(userId);
    const userEmail = authData?.user?.email || "";
    const userName = profile.nombre || "Candidato Au Pair";

    // ── Generar cover letter para el PDF ──────────────────────────────────
    const auPairLetter = profile.letter_text || "";
    const coverLetter = `Dear ${familyName || "Host Family"},

My name is ${userName} and I am interested in becoming your Au Pair.

${auPairLetter}

${personalMessage ? personalMessage + "\n\n" : ""}I look forward to hearing from you.

Warm regards,
${userName}`;

    // ── Generar PDF ──────────────────────────────────────────────────────
    const pdfBuffer = generateAuPairPDF(profile, coverLetter);

    // ── Generar HTML del email ────────────────────────────────────────────
    const htmlBody = buildAuPairEmailHTML(
      profile,
      familyName,
      personalMessage,
      userName
    );

    const subjectLine = `Au Pair Application — ${userName} from ${profile.nationality || "Spain"}`;

    // ── Registrar en cv_sends ────────────────────────────────────────────
    await adminClient.from("cv_sends").insert({
      user_id: userId,
      company_name: familyName || "Host Family",
      company_email: familyEmail,
      job_title: "Au Pair",
      status: "pendiente",
      sent_at: null,
    });

    // ── Enviar email con Resend ──────────────────────────────────────────
    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY no configurada" },
        { status: 500 }
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${sanitizeEmailHeader(userName)} via BuscayCurra <${FROM_EMAIL}>`,
      to: [familyEmail],
      reply_to: userEmail,
      subject: sanitizeEmailHeader(subjectLine),
      html: htmlBody,
      attachments: [{
        filename: `AuPair_Profile_${userName.replace(/\s+/g, "_")}.pdf`,
        content: pdfBuffer,
      }],
    });

    if (emailError) {
      console.error("[au-pair/send] Resend error:", emailError.message);

      // Actualizar estado a fallido
      await adminClient
        .from("cv_sends")
        .update({ status: "fallido", error_message: emailError.message })
        .eq("user_id", userId)
        .eq("company_email", familyEmail)
        .eq("status", "pendiente");

      return NextResponse.json(
        { error: emailError.message || "Error al enviar email" },
        { status: 500 }
      );
    }

    // ── Actualizar a enviado ─────────────────────────────────────────────
    await adminClient
      .from("cv_sends")
      .update({ status: "enviado", sent_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("company_email", familyEmail)
      .eq("status", "pendiente");

    return NextResponse.json({
      success: true,
      message: `✅ Perfil enviado a ${familyName || familyEmail}`,
      emailId: emailData?.id,
    });
  } catch (error) {
    console.error("[au-pair/send] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Error interno al enviar perfil" },
      { status: 500 }
    );
  }
}
