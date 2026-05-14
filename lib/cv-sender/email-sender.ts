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
  userName: string;
  userEmail: string;
  userPhone?: string;
  userLinkedIn?: string;
  cvPdfBuffer?: Buffer; // Opcional — si no hay PDF, el CV va en el cuerpo del email
  cvFileName?: string;
  cvHtmlSection?: string; // HTML del CV para incluir en el cuerpo del email
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
    const sendPayload: Parameters<typeof resend.emails.send>[0] = {
      from: `${cvData.userName} via BuscayCurra <${FROM_EMAIL}>`,
      to: [to],
      reply_to: cvData.userEmail,
      subject,
      html: buildCVEmailHTML(cvData, coverLetter, companyName),
    };

    if (cvData.cvPdfBuffer) {
      sendPayload.attachments = [{
        filename: cvData.cvFileName ?? `CV_${cvData.userName.replace(/\s+/g, "_")}.pdf`,
        content: cvData.cvPdfBuffer,
      }];
    }

    const { data, error } = await resend.emails.send(sendPayload);

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
  const today = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  const coverLetterHtml = coverLetter
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => `<p style="margin:0 0 14px 0;line-height:1.7;color:#1e293b;font-size:15px;">${line}</p>`)
    .join("");

  const hasPdf = !!cvData.cvPdfBuffer;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidatura de ${cvData.userName}</title>
</head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background:#f0f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;box-shadow:0 2px 12px rgba(0,0,0,0.1);">

          <!-- Cabecera del candidato -->
          <tr>
            <td style="background:#1a2744;padding:28px 48px;">
              <p style="color:#a3b4d0;font-size:11px;margin:0 0 4px;letter-spacing:1px;font-family:Arial,sans-serif;text-transform:uppercase;">Carta de presentación</p>
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:normal;font-family:Georgia,serif;">${cvData.userName}</h1>
              <p style="color:#7a9abf;margin:6px 0 0;font-size:13px;font-family:Arial,sans-serif;">
                <a href="mailto:${cvData.userEmail}" style="color:#7a9abf;text-decoration:none;">${cvData.userEmail}</a>
                ${cvData.userPhone ? ` &nbsp;·&nbsp; ${cvData.userPhone}` : ""}
              </p>
            </td>
          </tr>

          <!-- Fecha y destinatario -->
          <tr>
            <td style="padding:36px 48px 0;">
              <p style="color:#64748b;font-size:13px;margin:0 0 24px;font-family:Arial,sans-serif;">${today}</p>
              <p style="color:#374151;font-size:14px;margin:0 0 24px;font-family:Arial,sans-serif;">
                <strong>A/A: Departamento de RRHH</strong><br>
                ${companyName}
              </p>
            </td>
          </tr>

          <!-- Cuerpo de la carta -->
          <tr>
            <td style="padding:0 48px 32px;">
              ${coverLetterHtml}
            </td>
          </tr>

          <!-- Datos de contacto -->
          <tr>
            <td style="padding:0 48px 32px;">
              <div style="border-top:2px solid #1a2744;padding-top:20px;">
                <p style="margin:0 0 4px;font-weight:bold;color:#1a2744;font-size:13px;font-family:Arial,sans-serif;letter-spacing:0.5px;">DATOS DE CONTACTO</p>
                <table cellpadding="0" cellspacing="0" style="margin-top:8px;">
                  <tr><td style="font-family:Arial,sans-serif;font-size:13px;color:#374151;padding:2px 0;">📧</td><td style="padding:2px 0 2px 8px;"><a href="mailto:${cvData.userEmail}" style="color:#1a2744;font-family:Arial,sans-serif;font-size:13px;">${cvData.userEmail}</a></td></tr>
                  ${cvData.userPhone ? `<tr><td style="font-family:Arial,sans-serif;font-size:13px;color:#374151;padding:2px 0;">📞</td><td style="padding:2px 0 2px 8px;font-family:Arial,sans-serif;font-size:13px;color:#374151;">${cvData.userPhone}</td></tr>` : ""}
                  ${cvData.userLinkedIn ? `<tr><td style="font-family:Arial,sans-serif;font-size:13px;color:#374151;padding:2px 0;">🔗</td><td style="padding:2px 0 2px 8px;"><a href="${cvData.userLinkedIn}" style="color:#1a2744;font-family:Arial,sans-serif;font-size:13px;">LinkedIn</a></td></tr>` : ""}
                </table>
              </div>
            </td>
          </tr>

          ${hasPdf ? `
          <!-- Aviso de adjunto PDF -->
          <tr>
            <td style="padding:0 48px 32px;">
              <div style="background:#f0f9f4;border:1px solid #bbf7d0;border-radius:6px;padding:14px 18px;">
                <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#166534;">📎 <strong>Curriculum Vitae adjunto</strong> — CV_${cvData.userName.replace(/\s+/g, "_")}.pdf</p>
              </div>
            </td>
          </tr>` : cvData.cvHtmlSection ? `
          <!-- CV inline si no hay PDF -->
          <tr>
            <td style="padding:0 48px 32px;">
              <div style="border:1px solid #e5e7eb;border-radius:6px;padding:24px;background:#fafafa;">
                <p style="margin:0 0 12px;font-weight:bold;color:#1a2744;font-size:12px;font-family:Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;">Currículum Vitae</p>
                ${cvData.cvHtmlSection}
              </div>
            </td>
          </tr>` : ""}

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:16px 48px;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:11px;margin:0;font-family:Arial,sans-serif;">
                Enviado automáticamente con <a href="https://buscaycurra.es" style="color:#22c55e;text-decoration:none;">BuscayCurra</a> — Plataforma de búsqueda de empleo con IA
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

          <tr>
            <td style="background:linear-gradient(135deg,#166534,#15803d);padding:40px;text-align:center;">
              <div style="font-size:40px;margin-bottom:10px;">🐛</div>
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">¡CV Enviado!</h1>
              <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;">Guzzi ha trabajado por ti</p>
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
                <strong style="color:#16a34a;">${companyName}</strong>
                ${jobTitle ? `para el puesto de <strong>${jobTitle}</strong>` : ""}.
              </p>

              <!-- Tarjeta de detalles -->
              <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:0 0 24px;text-align:left;">
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
                style="background:linear-gradient(135deg,#22c55e,#16a34a);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;">
                Ver mis envíos →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                <a href="https://buscaycurra.es" style="color:#22c55e;text-decoration:none;font-weight:600;">BuscayCurra</a>
                — Tu asistente de búsqueda de empleo con IA 🐛
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
