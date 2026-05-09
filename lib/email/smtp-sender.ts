const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "BuscayCurra <noreply@buscaycurra.es>";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "placeholder") {
    console.warn("[Resend] API key no configurada, email no enviado");
    return;
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[Resend] Error al enviar email:", err);
  } else {
    const data = await res.json() as { id?: string };
    console.log("[Resend] Email enviado:", data.id);
  }
}

// ─── Plantilla base ───────────────────────────────────────────────────────────

function baseTemplate(headerContent: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
</head>
<body style="margin:0;padding:0;background:#090c10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#090c10;padding:40px 16px 60px;">
  <tr><td align="center">
    <table width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0">

      <!-- Logo -->
      <tr><td align="center" style="padding-bottom:28px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:linear-gradient(135deg,rgba(34,197,94,0.15),rgba(22,163,74,0.05));border:1px solid rgba(34,197,94,0.2);border-radius:14px;padding:10px 20px;">
              <span style="font-size:20px;line-height:1;vertical-align:middle;">🐛</span>
              <span style="color:#22c55e;font-weight:700;font-size:17px;letter-spacing:-0.3px;vertical-align:middle;margin-left:8px;">BuscayCurra</span>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:#111520;border:1px solid #1e2538;border-radius:20px;overflow:hidden;">

        <!-- Header -->
        ${headerContent}

        <!-- Body -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:36px 40px 40px;">
            ${bodyContent}
          </td></tr>
        </table>

      </td></tr>

      <!-- Footer -->
      <tr><td align="center" style="padding-top:28px;">
        <p style="margin:0;color:#374151;font-size:12px;line-height:1.9;">
          BuscayCurra · Tu empleo, nuestra misión<br>
          <a href="https://buscaycurra.es/app/perfil" style="color:#4b5563;text-decoration:none;">Mi cuenta</a>
          &nbsp;·&nbsp;
          <a href="https://buscaycurra.es" style="color:#4b5563;text-decoration:none;">Inicio</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function headerGradient(emoji: string, title: string, subtitle: string, color: string = "#22c55e"): string {
  const rgb = color === "#22c55e" ? "34,197,94" : color === "#3b82f6" ? "59,130,246" : "249,115,22";
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,#0c1f14,#111520);border-bottom:1px solid rgba(${rgb},0.12);">
      <tr><td style="padding:40px;text-align:center;">
        <div style="font-size:46px;line-height:1;margin-bottom:16px;">${emoji}</div>
        <h1 style="margin:0 0 8px;color:${color};font-size:24px;font-weight:700;letter-spacing:-0.5px;">${title}</h1>
        <p style="margin:0;color:#64748b;font-size:14px;">${subtitle}</p>
      </td></tr>
    </table>`;
}

function ctaButton(text: string, url: string, color: string = "#22c55e"): string {
  return `<table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding-top:28px;">
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,${color},${color}cc);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:14px;letter-spacing:0.2px;">${text}</a>
    </td></tr>
  </table>`;
}

function infoRow(label: string, value: string, valueColor: string = "#f1f5f9"): string {
  return `<tr>
    <td style="padding:14px 0;border-bottom:1px solid #1e2538;">
      <p style="margin:0 0 4px;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;">${label}</p>
      <p style="margin:0;color:${valueColor};font-size:15px;font-weight:600;">${value}</p>
    </td>
  </tr>`;
}

// ─── Email de bienvenida ──────────────────────────────────────────────────────

export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
  const firstName = userName.split(" ")[0];

  const header = headerGradient("🐛", `¡Hola, ${firstName}!`, "Tu asistente de empleo ya está listo");

  const body = `
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.7;">
      Soy <strong style="color:#22c55e;">Guzzi</strong>, el asistente de BuscayCurra.
      A partir de ahora <strong style="color:#f1f5f9;">yo busco, tú decides</strong>. Solo tendrás que aparecer a la entrevista.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1520;border:1px solid #1e2538;border-radius:14px;margin-bottom:28px;">
      <tr><td style="padding:22px 24px;">
        <p style="margin:0 0 16px;color:#f1f5f9;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Primeros pasos</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #1a2030;">
              <span style="font-size:18px;vertical-align:middle;">📎</span>
              <span style="color:#f1f5f9;font-size:14px;font-weight:600;vertical-align:middle;margin-left:12px;">Sube tu CV</span>
              <span style="display:block;margin-left:34px;color:#64748b;font-size:12px;margin-top:2px;">Guzzi lo analiza y lo mejora con IA</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #1a2030;">
              <span style="font-size:18px;vertical-align:middle;">💬</span>
              <span style="color:#f1f5f9;font-size:14px;font-weight:600;vertical-align:middle;margin-left:12px;">Cuéntale qué buscas</span>
              <span style="display:block;margin-left:34px;color:#64748b;font-size:12px;margin-top:2px;">Sector, ubicación, jornada — Guzzi se adapta</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;">
              <span style="font-size:18px;vertical-align:middle;">🚀</span>
              <span style="color:#f1f5f9;font-size:14px;font-weight:600;vertical-align:middle;margin-left:12px;">Aprueba y listo</span>
              <span style="display:block;margin-left:34px;color:#64748b;font-size:12px;margin-top:2px;">Carta de presentación personalizada, enviada por ti</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(34,197,94,0.04);border:1px solid rgba(34,197,94,0.1);border-radius:12px;margin-bottom:8px;">
      <tr><td style="padding:16px 20px;text-align:center;">
        <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
          Tenemos <strong style="color:#22c55e;">más de 148.000 ofertas activas</strong> en España esperándote.
        </p>
      </td></tr>
    </table>

    ${ctaButton("Hablar con Guzzi →", "https://buscaycurra.es/app/gusi")}
  `;

  try {
    await sendEmail(userEmail, `¡Bienvenido/a a BuscayCurra, ${firstName}! 🐛`, baseTemplate(header, body));
  } catch (err) {
    console.error("[Resend] Error en bienvenida:", (err as Error).message);
  }
}

// ─── Email de confirmación de pago ───────────────────────────────────────────

export async function sendPaymentConfirmationEmail(userEmail: string, plan: string, nombrePlan: string): Promise<void> {
  const header = headerGradient("✅", "¡Pago confirmado!", `Tu plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} está activo`);

  const body = `
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.7;">
      Tu suscripción ya está activa. Todas las funciones de tu plan están disponibles ahora mismo.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1520;border:1px solid rgba(34,197,94,0.15);border-radius:14px;margin-bottom:28px;">
      <tr><td style="padding:22px 24px;">
        <p style="margin:0 0 6px;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;">Plan activado</p>
        <p style="margin:0;color:#22c55e;font-size:22px;font-weight:700;">${nombrePlan}</p>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      ${infoRow("Estado", "✅ Activo y funcionando", "#22c55e")}
      ${infoRow("Renovación", "Automática mensual", "#94a3b8")}
      ${infoRow("Cancelación", "En cualquier momento desde Mi cuenta", "#94a3b8")}
    </table>

    ${ctaButton("Ir a BuscayCurra →", "https://buscaycurra.es/app/gusi")}

    <p style="margin:20px 0 0;text-align:center;color:#374151;font-size:12px;line-height:1.8;">
      Gestiona tu suscripción en <a href="https://buscaycurra.es/app/perfil" style="color:#22c55e;text-decoration:none;">Mi cuenta</a>
    </p>
  `;

  try {
    await sendEmail(userEmail, `✅ Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} activado — BuscayCurra`, baseTemplate(header, body));
  } catch (err) {
    console.error("[Resend] Error en confirmación de pago:", (err as Error).message);
  }
}

// ─── Email de CV enviado a empresa ───────────────────────────────────────────

export interface ConfirmacionEnvioParams {
  userEmail: string;
  userName: string;
  companyName: string;
  companyEmail?: string;
  jobTitle?: string;
  companyUrl?: string;
  sentAt?: Date;
}

export async function sendConfirmationEmail(
  userEmailOrParams: string | ConfirmacionEnvioParams,
  userName?: string,
  companyName?: string,
): Promise<void> {
  const p: ConfirmacionEnvioParams =
    typeof userEmailOrParams === "string"
      ? { userEmail: userEmailOrParams, userName: userName ?? "Usuario", companyName: companyName ?? "la empresa" }
      : userEmailOrParams;

  const fecha = (p.sentAt ?? new Date()).toLocaleDateString("es-ES", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid",
  });

  const firstName = p.userName.split(" ")[0];
  const header = headerGradient("📨", "CV enviado con éxito", `Guzzi ha trabajado por ti, ${firstName}`);

  const body = `
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.7;">
      Tu candidatura ha llegado a <strong style="color:#f1f5f9;">${p.companyName}</strong>.
      Guzzi generó una carta de presentación personalizada con IA y la envió en el momento óptimo.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${infoRow("Empresa", p.companyName)}
      ${p.jobTitle ? infoRow("Puesto", p.jobTitle) : ""}
      ${p.companyEmail ? infoRow("Enviado a", p.companyEmail, "#94a3b8") : ""}
      ${infoRow("Fecha", fecha, "#64748b")}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1520;border:1px solid #1e2538;border-radius:14px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 14px;color:#f1f5f9;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Qué incluyó Guzzi</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:8px 0;color:#22c55e;font-size:13px;">✅ &nbsp;CV en PDF adjunto</td></tr>
          <tr><td style="padding:8px 0;color:#f59e0b;font-size:13px;">✅ &nbsp;Carta de presentación adaptada con IA</td></tr>
          <tr><td style="padding:8px 0;color:#a78bfa;font-size:13px;">✅ &nbsp;Enviado en el momento óptimo para RRHH</td></tr>
        </table>
      </td></tr>
    </table>

    ${ctaButton("Ver todos mis envíos →", "https://buscaycurra.es/app/envios")}
  `;

  try {
    await sendEmail(
      p.userEmail,
      `📨 CV enviado a ${p.companyName} — BuscayCurra`,
      baseTemplate(header, body),
    );
  } catch (err) {
    console.error("[Resend] Error en confirmacion:", (err as Error).message);
  }
}

// ─── Email de CV a empresa (con adjunto) ─────────────────────────────────────

export interface CVEmailPayload {
  toEmail: string;
  toName?: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  cvBuffer?: Buffer;
  cvFileName?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendCVEmailSMTP(payload: CVEmailPayload): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "placeholder") {
    return { success: false, error: "RESEND_API_KEY no configurada" };
  }

  try {
    const body: Record<string, unknown> = {
      from: FROM_ADDRESS,
      reply_to: payload.fromEmail,
      to: [payload.toEmail],
      subject: payload.subject,
      html: payload.htmlBody,
      text: payload.textBody || payload.htmlBody.replace(/<[^>]*>/g, ""),
    };

    if (payload.cvBuffer) {
      body.attachments = [{
        filename: payload.cvFileName || "CV.pdf",
        content: payload.cvBuffer.toString("base64"),
      }];
    }

    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Resend] Error enviando CV:", err);
      return { success: false, error: err };
    }

    const data = await res.json() as { id?: string };
    console.log("[Resend] CV enviado:", data.id);
    return { success: true, messageId: data.id };
  } catch (err) {
    const msg = (err as Error).message;
    console.error("[Resend] Error inesperado:", msg);
    return { success: false, error: msg };
  }
}

export function generarCartaHTML(
  candidato: string,
  empresa: string,
  puesto?: string,
  personalizadaIA?: string,
): string {
  const cuerpo = personalizadaIA || `
    <p>Estimado/a equipo de Recursos Humanos de ${empresa},</p>
    <p>Me dirijo a ustedes para expresar mi interés en formar parte de su equipo${puesto ? ` en el puesto de <strong>${puesto}</strong>` : ""}.</p>
    <p>Adjunto mi CV para su consideración.</p>
    <p>Atentamente,<br><strong>${candidato}</strong></p>
  `;

  return `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;color:#333;line-height:1.6;">
      ${cuerpo}
      <hr style="border:none;border-top:1px solid #e0e0e0;margin:30px 0;" />
      <p style="font-size:11px;color:#999;">Enviado a través de BuscayCurra.es</p>
    </div>
  `;
}
