/**
 * POST /api/au-pair/send
 * Envía el perfil Au Pair a una familia/agencia por email con PDF adjunto
 * y un HTML completo del perfil (fotos, aptitudes, referencias, datos personales).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { generateCVPdf } from "@/lib/cv-generator/generate-pdf";
import type { AuPairProfile, AuPairReference } from "@/lib/au-pair";
import { PAISES_AU_PAIR_LEGAL, calcularCosteFamilia } from "@/lib/au-pair-legal-data";

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

// ─── Generación de PDF con plantilla visual ───────────────────────────────────

function generateAuPairProfileHTML(profile: AuPairProfile, coverLetter: string): string {
  const nombre = escapeHtml(profile.nombre || "Au Pair");
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const aptitudes: string[] = [];
  if (profile.has_driving_license) aptitudes.push("🚗 Driving License");
  if (!profile.fumador) aptitudes.push("🚭 Non-smoker");
  if (profile.primeros_auxilios) aptitudes.push("⛑️ First Aid");
  if (profile.sabe_nadar) aptitudes.push("🏊 Swimmer");

  const headerMeta = [
    profile.nationality ? `${escapeHtml(profile.nationality)}${profile.ciudad ? ` · ${escapeHtml(profile.ciudad)}` : ""}` : "",
    profile.age ? `🎂 ${escapeHtml(String(profile.age))} años` : "",
    profile.languages?.length ? `🗣 ${profile.languages.map(l => escapeHtml(l)).join(" · ")}` : "",
    profile.available_from ? `📅 Available ${escapeHtml(profile.available_from)}` : "",
  ].filter(Boolean).map(s => `<span style="font-size:11px;color:rgba(255,255,255,0.85);margin-right:16px;">${s}</span>`).join("");

  const photosHtml = profile.photos && profile.photos.length > 0
    ? `<div style="background:#f8f6f0;padding:28px 40px;">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;font-weight:bold;margin:0 0 12px;">📸 PHOTO GALLERY</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          ${profile.photos.slice(0, 5).map((url, i) =>
            /^https?:\/\//.test(url)
              ? `<img src="${escapeHtml(url)}" alt="Photo ${i + 1}" style="width:${i === 0 && profile.photos!.length >= 3 ? "160px;height:160px" : "120px;height:90px"};object-fit:cover;border-radius:8px;" />`
              : ""
          ).filter(Boolean).join("")}
        </div>
      </div>`
    : "";

  const aptitudesHtml = aptitudes.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;">
        ${aptitudes.map(a => `<span style="font-size:11px;padding:4px 14px;border-radius:9999px;background:#e8f5e9;color:#1a3d34;">${a}</span>`).join("")}
      </div>`
    : "";

  const infoCards = [
    profile.childcare_experience ? { label: "Experience", value: profile.childcare_experience, border: "#2d5a4e" } : null,
    profile.hobbies ? { label: "About Me", value: profile.hobbies, border: "#4a9d84" } : null,
    profile.dietary_info ? { label: "Diet", value: profile.dietary_info, border: "#8cb8a8" } : null,
    profile.duracion_preferida ? { label: "Duration", value: profile.duracion_preferida, border: "#2d5a4e" } : null,
  ].filter(Boolean) as { label: string; value: string; border: string }[];

  const infoCardsHtml = infoCards.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:28px;">
        ${infoCards.map(c => `
          <div style="flex:1;min-width:140px;background:#f8faf9;border-left:3px solid ${c.border};border-radius:8px;padding:12px;">
            <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:bold;margin:0 0 4px;">${c.label}</p>
            <p style="font-size:11px;color:#374151;margin:0;">${escapeHtml(c.value)}</p>
          </div>`).join("")}
      </div>`
    : "";

  const letterHtml = coverLetter
    ? `<div style="margin-bottom:28px;">
        <div style="width:48px;height:4px;border-radius:2px;background:linear-gradient(90deg,#2d5a4e,#4a9d84);margin-bottom:24px;"></div>
        <div style="font-size:13px;line-height:1.8;color:#374151;font-family:Georgia,'Times New Roman',serif;white-space:pre-wrap;">${escapeHtml(coverLetter)}</div>
      </div>`
    : "";

  const refs = (profile.references_json || []) as AuPairReference[];
  const refsHtml = refs.length > 0
    ? `<div>
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;font-weight:bold;margin:0 0 12px;">References</p>
        ${refs.map(ref => `
          <div style="background:#f8faf9;border-left:3px solid #2d5a4e;border-radius:4px;padding:12px;margin-bottom:8px;">
            <p style="font-weight:bold;font-size:13px;color:#1a3d34;margin:0;">${escapeHtml(ref.nombre)}</p>
            <p style="font-size:11px;color:#6b7280;margin:4px 0 0;">${[ref.relacion, ref.email, ref.telefono].filter(Boolean).map(v => escapeHtml(String(v))).join(" · ")}</p>
          </div>`).join("")}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Au Pair Profile — ${nombre}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body { font-family:system-ui,-apple-system,Arial,sans-serif; background:white; }
    @page { size:A4 portrait; margin:0; }
  </style>
</head>
<body>
  <div style="width:210mm;min-height:297mm;background:white;">
    <div style="background:linear-gradient(135deg,#1a3d34 0%,#2d5a4e 100%);padding:40px;">
      <h1 style="font-size:26px;font-weight:bold;color:white;margin:0 0 4px;">${nombre}</h1>
      <p style="font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">Childcare Professional · Dear Family Letter</p>
      <div style="display:flex;flex-wrap:wrap;">${headerMeta}</div>
      ${profile.nivel_educativo ? `<p style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:8px;">🎓 ${escapeHtml(profile.nivel_educativo)}</p>` : ""}
    </div>
    <div style="padding:14px 40px;background:#fafafa;border-bottom:1px solid #e8e4d9;">
      <p style="font-size:12px;color:#94a3b8;font-style:italic;">${dateStr}</p>
    </div>
    ${photosHtml}
    <div style="padding:32px 40px;">
      ${aptitudesHtml}
      ${infoCardsHtml}
      ${letterHtml}
      ${refsHtml}
    </div>
    <div style="background:#f8f6f0;border-top:1px solid #e8e4d9;padding:14px 40px;">
      <span style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Au Pair Profile · ${dateStr} · BuscayCurra</span>
    </div>
  </div>
</body>
</html>`;
}

// ─── HTML del email ───────────────────────────────────────────────────────────

/**
 * Genera el HTML completo del email con todos los datos del perfil Au Pair.
 * Incluye: datos personales, fotos, idiomas, experiencia, aptitudes, referencias,
 * e info para la familia anfitriona (costes y requisitos del país destino).
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

          <!-- Info para la familia anfitriona -->
          ${(() => {
            const paisDest = (profile as any).pais_destino || profile.nationality || "ES";
            const paisInfo = PAISES_AU_PAIR_LEGAL.find(p => p.codigo === paisDest);
            if (!paisInfo) return "";
            const costes = calcularCosteFamilia(paisInfo);
            return `
          <tr>
            <td style="padding:12px 40px 16px;">
              <div style="background:#f0f7f4;border:1px solid #c8e6d4;border-radius:8px;padding:16px 20px;">
                <p style="color:#2d5a4e;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">
                  ℹ️ Para la familia anfitriona — ${paisInfo.bandera} ${paisInfo.nombre}
                </p>
                <table cellpadding="0" cellspacing="0" style="width:100%;font-size:13px;color:#374151;">
                  <tr>
                    <td style="padding:4px 0;vertical-align:top;width:50%;">
                      <strong>💰 Coste estimado mensual:</strong> ~${costes.total}€<br/>
                      <span style="font-size:11px;color:#6b7280;">Salario ${costes.salario}€ + manutención ~${costes.comidaAlojamiento}€${costes.cursoIdioma > 0 ? ` + curso ~${costes.cursoIdioma}€` : ""} + seguro ~${costes.seguro}€</span>
                    </td>
                    <td style="padding:4px 0;vertical-align:top;width:50%;">
                      <strong>⏱ ${paisInfo.horasSemanales}h/semana</strong> · ${paisInfo.edadMin}-${paisInfo.edadMax} años<br/>
                      <span style="font-size:11px;color:#6b7280;">${paisInfo.cursoIdioma} · Duración: ${paisInfo.duracionMax}</span>
                    </td>
                  </tr>
                </table>
                <p style="margin:8px 0 0;font-size:10px;color:#9ca3af;">Datos orientativos de BuscayCurra. Verifica requisitos actualizados oficialmente.</p>
              </div>
            </td>
          </tr>`;
          })()}

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

    // ── Generar PDF con plantilla visual ─────────────────────────────────
    const pdfBuffer = await generateCVPdf(generateAuPairProfileHTML(profile, coverLetter));

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
