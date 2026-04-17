/**
 * lib/email/smtp-sender.ts — Envío real de emails con CV adjunto via SMTP
 * Usa Gmail SMTP como transporte principal.
 * Cuando Resend esté configurado, se puede cambiar fácilmente.
 */

import nodemailer from "nodemailer";

// ── Configuración SMTP ────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/** Datos para enviar un CV */
export interface CVEmailPayload {
  toEmail: string;         // Email de RRHH de la empresa
  toName?: string;         // Nombre de la empresa
  fromName: string;        // Nombre del candidato
  fromEmail: string;       // Email del candidato (para reply-to)
  subject: string;         // Asunto
  htmlBody: string;        // Cuerpo HTML
  textBody?: string;       // Cuerpo texto plano
  cvBuffer?: Buffer;       // PDF del CV
  cvFileName?: string;     // Nombre del archivo
}

/** Resultado del envío */
export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envía un email con CV adjunto
 */
export async function sendCVEmailSMTP(payload: CVEmailPayload): Promise<SendResult> {
  try {
    console.log(`[SMTP] Enviando CV a ${payload.toEmail} (${payload.toName || "empresa"})`);

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${payload.fromName} via BuscayCurra" <${process.env.SMTP_USER}>`,
      replyTo: payload.fromEmail,
      to: payload.toEmail,
      subject: payload.subject,
      html: payload.htmlBody,
      text: payload.textBody || payload.htmlBody.replace(/<[^>]*>/g, ""),
      attachments: payload.cvBuffer ? [{
        filename: payload.cvFileName || "CV.pdf",
        content: payload.cvBuffer,
        contentType: "application/pdf",
      }] : [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] ✅ Email enviado: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    const msg = (err as Error).message;
    console.error(`[SMTP] ❌ Error enviando a ${payload.toEmail}: ${msg}`);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Envía email de confirmación al usuario
 */
export async function sendConfirmationEmail(
  userEmail: string,
  userName: string,
  companyName: string,
): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"BuscayCurra 🐛→🦋" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `✅ Tu CV fue enviado a ${companyName}`,
      html: `
        <div style="font-family: 'Nunito', sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #1a1a12; color: #f0ebe0; border-radius: 16px;">
          <h2 style="color: #7ed56f; margin: 0 0 16px;">✅ ¡CV Enviado!</h2>
          <p>Hola <strong>${userName}</strong>,</p>
          <p>Tu CV ha sido enviado correctamente a <strong style="color: #f0c040;">${companyName}</strong>.</p>
          <p style="color: #b0a890; font-size: 14px;">La carta de presentación fue personalizada por nuestra IA para esta empresa específica.</p>
          <hr style="border: none; border-top: 1px solid #3d3c30; margin: 20px 0;" />
          <p style="color: #706a58; font-size: 12px;">
            📅 Próximo envío automático: en 4-5 días<br>
            🔄 Puedes ver el estado en la app → Envíos<br>
            🐛→🦋 BuscayCurra — Tu empleo, nuestra misión
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[SMTP] Error enviando confirmación:", (err as Error).message);
  }
}

/**
 * Genera el HTML profesional de la carta de presentación
 */
export function generarCartaHTML(
  candidato: string,
  empresa: string,
  puesto?: string,
  personalizadaIA?: string,
): string {
  const cuerpo = personalizadaIA || `
    <p>Estimado/a equipo de Recursos Humanos de ${empresa},</p>
    <p>Me dirijo a ustedes para expresar mi interés en formar parte de su equipo${puesto ? ` en el puesto de <strong>${puesto}</strong>` : ""}.</p>
    <p>Adjunto mi CV para su consideración. Creo que mi experiencia y habilidades pueden aportar valor a ${empresa}.</p>
    <p>Quedo a su disposición para una entrevista en la que pueda ampliar cualquier información.</p>
    <p>Atentamente,<br><strong>${candidato}</strong></p>
  `;

  return `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #333; line-height: 1.6;">
      ${cuerpo}
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
      <p style="font-size: 11px; color: #999;">
        Enviado a través de BuscayCurra.es — Plataforma inteligente de búsqueda de empleo
      </p>
    </div>
  `;
}
