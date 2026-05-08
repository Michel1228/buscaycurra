/**
 * lib/email/smtp-sender.ts
 * Envio de emails transaccionales via Resend API.
 * FROM: noreply@buscaycurra.es (requiere dominio verificado en resend.com)
 */

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

export interface ConfirmacionEnvioParams {
  userEmail: string;
  userName: string;
  companyName: string;
  companyEmail?: string;
  jobTitle?: string;
  companyUrl?: string;
  sentAt?: Date;
}

/** Email de confirmacion detallado al usuario cuando Guzzi envia su CV */
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

  const rowStyle = "padding:14px 20px;border-bottom:1px solid rgba(126,213,111,0.08);";
  const labelStyle = "color:#706a58;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:4px;";
  const valueStyle = "color:#f0ebe0;font-size:14px;font-weight:600;";

  const detailRows = [
    `<tr><td style="${rowStyle}"><span style="${labelStyle}">Empresa</span><span style="${valueStyle}">${p.companyName}</span></td></tr>`,
    p.jobTitle ? `<tr><td style="${rowStyle}"><span style="${labelStyle}">Puesto</span><span style="${valueStyle}">${p.jobTitle}</span></td></tr>` : "",
    p.companyEmail ? `<tr><td style="${rowStyle}"><span style="${labelStyle}">Enviado a</span><span style="color:#a8d8ff;font-size:14px;">${p.companyEmail}</span></td></tr>` : "",
    `<tr><td style="padding:14px 20px;"><span style="${labelStyle}">Fecha</span><span style="color:#b0a890;font-size:13px;">${fecha}</span></td></tr>`,
  ].join("");

  const ctaSecundario = p.companyUrl
    ? `<br><a href="${p.companyUrl}" style="display:inline-block;margin-top:10px;color:#706a58;font-size:12px;text-decoration:none;">Ver oferta original →</a>`
    : "";

  try {
    await sendEmail(
      p.userEmail,
      `✅ CV enviado a ${p.companyName}`,
      `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0d0a;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0a;padding:32px 16px;">
<tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a12;border-radius:20px;overflow:hidden;border:1px solid rgba(126,213,111,0.15);">
  <tr><td style="background:linear-gradient(135deg,#1f2e12,#2a3d18);padding:32px;text-align:center;">
    <div style="font-size:40px;margin-bottom:8px;">🐛</div>
    <h1 style="color:#7ed56f;margin:0;font-size:22px;font-weight:700;">CV enviado con éxito</h1>
    <p style="color:rgba(176,168,144,0.8);margin:8px 0 0;font-size:13px;">Guzzi ha trabajado por ti</p>
  </td></tr>
  <tr><td style="padding:32px 32px 0;">
    <p style="color:#f0ebe0;font-size:15px;margin:0 0 8px;">Hola <strong>${p.userName}</strong>,</p>
    <p style="color:#b0a890;font-size:14px;line-height:1.6;margin:0;">Tu candidatura ha llegado a <strong style="color:#f0c040;">${p.companyName}</strong>. Guzzi generó una carta de presentación personalizada y la envió en el momento óptimo para que sea leída.</p>
  </td></tr>
  <tr><td style="padding:24px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(126,213,111,0.04);border:1px solid rgba(126,213,111,0.12);border-radius:12px;overflow:hidden;">
      ${detailRows}
    </table>
  </td></tr>
  <tr><td style="padding:0 32px 24px;">
    <p style="color:#706a58;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px;">Qué incluyó Guzzi</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="background:rgba(126,213,111,0.06);border-radius:8px;padding:10px 14px;color:#a8e6a1;font-size:13px;margin-bottom:6px;">✅ &nbsp;CV en PDF adjunto</td></tr>
      <tr><td style="height:6px;"></td></tr>
      <tr><td style="background:rgba(240,192,64,0.06);border-radius:8px;padding:10px 14px;color:#f0c040;font-size:13px;margin-bottom:6px;">✅ &nbsp;Carta de presentación IA adaptada a esta empresa</td></tr>
      <tr><td style="height:6px;"></td></tr>
      <tr><td style="background:rgba(160,112,208,0.06);border-radius:8px;padding:10px 14px;color:#c084fc;font-size:13px;">✅ &nbsp;Enviado en el momento óptimo del horario RRHH</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 32px 32px;text-align:center;">
    <a href="https://buscaycurra.es/app/envios" style="display:inline-block;background:linear-gradient(135deg,#7ed56f,#5cb848);color:#1a1a12;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;">Ver todos mis envíos →</a>
    ${ctaSecundario}
  </td></tr>
  <tr><td style="padding:20px 32px;border-top:1px solid rgba(61,60,48,0.4);text-align:center;">
    <p style="color:#504a3a;font-size:11px;margin:0;line-height:1.8;">
      BuscayCurra · Tu empleo, nuestra misión<br>
      <a href="https://buscaycurra.es/app/envios" style="color:#706a58;text-decoration:none;">Mis envíos</a>
      &nbsp;·&nbsp;
      <a href="https://buscaycurra.es/app/perfil" style="color:#706a58;text-decoration:none;">Mi cuenta</a>
    </p>
  </td></tr>
</table></td></tr></table>
</body></html>`,
    );
  } catch (err) {
    console.error("[Resend] Error en confirmacion:", (err as Error).message);
  }
}

/** Email de bienvenida al registrarse */
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
  try {
    await sendEmail(
      userEmail,
      "¡Bienvenido/a a BuscayCurra! 🐛",
      `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;background:#111827;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">🐛</div>
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">¡Hola, ${userName}!</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Bienvenido/a a BuscayCurra</p>
        </div>
        <div style="padding:40px;color:#e2e8f0;">
          <p style="font-size:15px;line-height:1.7;margin:0 0 20px;">Soy <strong style="color:#22c55e;">Guzzi</strong>, tu asistente de empleo con IA. A partir de ahora trabajo yo, tú solo apareces a la entrevista. 🦋</p>
          <div style="background:#1e212b;border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="margin:0 0 12px;font-weight:700;color:#f1f5f9;font-size:14px;">¿Por dónde empezar?</p>
            <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">1. 📎 <strong style="color:#f1f5f9;">Sube tu CV</strong> — Guzzi lo mejora con IA</p>
            <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">2. 🔍 <strong style="color:#f1f5f9;">Dile qué buscas</strong> — Guzzi escanea miles de ofertas</p>
            <p style="margin:0;font-size:13px;color:#94a3b8;">3. 📧 <strong style="color:#f1f5f9;">Aprueba y Guzzi envía</strong> — carta personalizada por IA</p>
          </div>
          <div style="text-align:center;">
            <a href="https://buscaycurra.es/app/gusi" style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;">Empezar con Guzzi →</a>
          </div>
          <p style="margin:28px 0 0;font-size:12px;color:#475569;text-align:center;">Tenemos más de 148.000 ofertas activas en España esperándote.</p>
        </div>
      </div>
      `,
    );
  } catch (err) {
    console.error("[Resend] Error en bienvenida:", (err as Error).message);
  }
}

/** Datos para enviar un CV adjunto a una empresa */
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

/** Envia el CV del usuario a la empresa via Resend (con adjunto PDF) */
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

/** Genera HTML de carta de presentacion */
export function generarCartaHTML(
  candidato: string,
  empresa: string,
  puesto?: string,
  personalizadaIA?: string,
): string {
  const cuerpo = personalizadaIA || `
    <p>Estimado/a equipo de Recursos Humanos de ${empresa},</p>
    <p>Me dirijo a ustedes para expresar mi interes en formar parte de su equipo${puesto ? ` en el puesto de <strong>${puesto}</strong>` : ""}.</p>
    <p>Adjunto mi CV para su consideracion.</p>
    <p>Atentamente,<br><strong>${candidato}</strong></p>
  `;

  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #333; line-height: 1.6;">
      ${cuerpo}
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
      <p style="font-size: 11px; color: #999;">Enviado a traves de BuscayCurra.es</p>
    </div>
  `;
}
