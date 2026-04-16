/**
 * email-sender.ts — Módulo de envío de emails profesionales con CV adjunto
 *
 * Usa Resend (https://resend.com) para enviar emails de alta entrega.
 * Resend es superior a SMTP tradicional porque:
 *   - Mayor tasa de entrega (no va a spam)
 *   - Dashboard de seguimiento
 *   - API simple
 *
 * Funciones:
 *   - sendCVEmail: envía el CV a la empresa
 *   - sendConfirmationToUser: confirma al usuario que se envió su CV
 */

import { Resend } from "resend";

// ─── Cliente Resend ──────────────────────────────────────────────────────────
// La API key se configura en la variable de entorno RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY);

/** Email de remitente (configurable en variables de entorno) */
const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@buscaycurra.es";

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Datos del CV a enviar */
export interface CVEmailData {
  userName: string; // Nombre completo del usuario
  userEmail: string; // Email del usuario (para que RRHH pueda responder)
  userPhone?: string; // Teléfono del usuario (opcional)
  userLinkedIn?: string; // LinkedIn del usuario (opcional)
  cvPdfBuffer: Buffer; // PDF del CV en binario
  cvFileName?: string; // Nombre del archivo PDF (ej: "CV_Juan_Garcia.pdf")
}

/** Resultado del envío de email */
export interface EmailResult {
  success: boolean;
  messageId?: string; // ID del mensaje en Resend (para tracking)
  error?: string;
}

// ─── Función Principal: Envío del CV ─────────────────────────────────────────

/**
 * Envía el CV del usuario a la empresa por email.
 * Incluye una carta de presentación personalizada y el CV en PDF adjunto.
 *
 * @param to - Email de RRHH de la empresa destino
 * @param cvData - Datos del CV y del usuario
 * @param coverLetter - Carta de presentación personalizada
 * @param subject - Asunto del email (generado por OpenClaw o genérico)
 * @param companyName - Nombre de la empresa (para personalizar el cuerpo)
 * @returns Resultado del envío con el ID del mensaje
 */
export async function sendCVEmail(
  to: string,
  cvData: CVEmailData,
  coverLetter: string,
  subject: string,
  companyName: string
): Promise<EmailResult> {
  console.log(`[EmailSender] Enviando CV de ${cvData.userName} a ${to} (${companyName})...`);

  try {
    const { data, error } = await resend.emails.send({
      from: `${cvData.userName} via BuscayCurra <${FROM_EMAIL}>`,
      to: [to],
      replyTo: cvData.userEmail, // Las respuestas van directamente al candidato
      subject,
      html: buildCVEmailHTML(cvData, coverLetter, companyName),
      attachments: [
        {
          filename: cvData.cvFileName ?? `CV_${cvData.userName.replace(/\s+/g, "_")}.pdf`,
          content: cvData.cvPdfBuffer,
        },
      ],
    });

    if (error) {
      console.error(`[EmailSender] Error de Resend al enviar a ${to}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`[EmailSender] ✅ CV enviado correctamente a ${to}. ID: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    console.error(`[EmailSender] Error inesperado enviando CV a ${to}:`, mensaje);
    return { success: false, error: mensaje };
  }
}

// ─── Función: Confirmación al Usuario ────────────────────────────────────────

/**
 * Envía un email de confirmación al usuario informando que su CV fue enviado.
 * El usuario recibe este email en su bandeja de entrada.
 *
 * @param userEmail - Email del usuario
 * @param userName - Nombre del usuario
 * @param companyName - Nombre de la empresa a la que se envió el CV
 * @param jobTitle - Puesto al que aplica (opcional)
 */
export async function sendConfirmationToUser(
  userEmail: string,
  userName: string,
  companyName: string,
  jobTitle?: string
): Promise<void> {
  console.log(`[EmailSender] Enviando confirmación a ${userEmail}...`);

  try {
    await resend.emails.send({
      from: `BuscayCurra <${FROM_EMAIL}>`,
      to: [userEmail],
      subject: `✅ Tu CV fue enviado a ${companyName}`,
      html: buildConfirmationEmailHTML(userName, companyName, jobTitle),
    });

    console.log(`[EmailSender] Confirmación enviada a ${userEmail}`);
  } catch (err) {
    // La confirmación es secundaria, no queremos fallar el job por esto
    console.warn(`[EmailSender] No se pudo enviar confirmación a ${userEmail}:`, err);
  }
}

// ─── Templates HTML ───────────────────────────────────────────────────────────

/**
 * Genera el HTML del email del CV.
 * Diseño profesional con los colores de BuscayCurra (azul #2563EB, naranja #F97316).
 */
function buildCVEmailHTML(
  cvData: CVEmailData,
  coverLetter: string,
  companyName: string
): string {
  // Convertimos los saltos de línea en párrafos HTML
  const coverLetterHtml = coverLetter
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => `<p style="margin:0 0 12px 0;line-height:1.6;">${line}</p>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidatura de ${cvData.userName}</title>
</head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Cabecera -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563EB,#1d4ed8);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">
                Candidatura — ${companyName}
              </h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">
                Enviado a través de BuscayCurra
              </p>
            </td>
          </tr>

          <!-- Cuerpo: carta de presentación -->
          <tr>
            <td style="padding:40px;">
              <div style="color:#374151;font-size:15px;">
                ${coverLetterHtml}
              </div>
            </td>
          </tr>

          <!-- Datos de contacto -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="background:#f8fafc;border-left:4px solid #2563EB;border-radius:4px;padding:20px 24px;">
                <p style="margin:0 0 4px;font-weight:700;color:#1e293b;font-size:14px;">
                  DATOS DE CONTACTO
                </p>
                <p style="margin:0;color:#64748b;font-size:14px;">${cvData.userName}</p>
                <p style="margin:4px 0 0;color:#2563EB;font-size:14px;">
                  <a href="mailto:${cvData.userEmail}" style="color:#2563EB;text-decoration:none;">${cvData.userEmail}</a>
                </p>
                ${cvData.userPhone ? `<p style="margin:4px 0 0;color:#64748b;font-size:14px;">📞 ${cvData.userPhone}</p>` : ""}
                ${cvData.userLinkedIn ? `<p style="margin:4px 0 0;font-size:14px;"><a href="${cvData.userLinkedIn}" style="color:#2563EB;text-decoration:none;">🔗 LinkedIn</a></p>` : ""}
              </div>
            </td>
          </tr>

          <!-- Nota sobre el adjunto -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="color:#6b7280;font-size:13px;margin:0;text-align:center;">
                📎 CV adjunto en formato PDF
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                Enviado con <a href="https://buscaycurra.es" style="color:#F97316;text-decoration:none;font-weight:600;">BuscayCurra</a>
                — Plataforma de búsqueda de empleo con IA
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

/**
 * Genera el HTML del email de confirmación al usuario.
 * Notifica que el CV fue enviado correctamente.
 */
function buildConfirmationEmailHTML(
  userName: string,
  companyName: string,
  jobTitle?: string
): string {
  const fecha = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>CV enviado correctamente</title>
</head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Cabecera con check verde -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563EB,#1d4ed8);padding:40px;text-align:center;">
              <div style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:32px;">✅</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">
                ¡CV Enviado!
              </h1>
            </td>
          </tr>

          <!-- Mensaje principal -->
          <tr>
            <td style="padding:40px;text-align:center;">
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">
                Hola <strong>${userName}</strong>,
              </p>
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Tu CV ha sido enviado correctamente a
                <strong style="color:#2563EB;">${companyName}</strong>
                ${jobTitle ? `para el puesto de <strong>${jobTitle}</strong>` : ""}.
              </p>

              <!-- Tarjeta de detalles -->
              <div style="background:#f0f7ff;border-radius:8px;padding:20px;margin:0 0 24px;text-align:left;">
                <table width="100%">
                  <tr>
                    <td style="padding:4px 0;color:#6b7280;font-size:14px;">📅 Fecha de envío</td>
                    <td style="padding:4px 0;color:#1e293b;font-size:14px;text-align:right;">${fecha}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6b7280;font-size:14px;">🏢 Empresa</td>
                    <td style="padding:4px 0;color:#1e293b;font-size:14px;text-align:right;">${companyName}</td>
                  </tr>
                  ${jobTitle ? `
                  <tr>
                    <td style="padding:4px 0;color:#6b7280;font-size:14px;">💼 Puesto</td>
                    <td style="padding:4px 0;color:#1e293b;font-size:14px;text-align:right;">${jobTitle}</td>
                  </tr>` : ""}
                </table>
              </div>

              <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 32px;">
                Te avisaremos si hay novedades. Recuerda que puedes ver todos tus envíos
                en tu panel de control.
              </p>

              <a href="https://buscaycurra.es/app/envios"
                style="background:#F97316;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;">
                Ver mis envíos →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                <a href="https://buscaycurra.es" style="color:#F97316;text-decoration:none;font-weight:600;">BuscayCurra</a>
                — Tu asistente de búsqueda de empleo con IA 🚀
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
