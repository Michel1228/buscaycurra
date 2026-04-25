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

/** Email de confirmacion al usuario cuando se registra o envia un CV */
export async function sendConfirmationEmail(
  userEmail: string,
  userName: string,
  companyName: string,
): Promise<void> {
  try {
    await sendEmail(
      userEmail,
      `Tu CV fue enviado a ${companyName}`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #1a1a12; color: #f0ebe0; border-radius: 16px; padding: 32px;">
        <h2 style="color: #7ed56f; margin: 0 0 20px;">CV enviado correctamente</h2>
        <p style="margin: 0 0 12px;">Hola <strong>${userName}</strong>,</p>
        <p style="margin: 0 0 12px;">Tu CV ha sido enviado a <strong style="color: #f0c040;">${companyName}</strong>. La carta de presentacion fue personalizada por nuestra IA para aumentar tus posibilidades.</p>
        <div style="background: rgba(126,213,111,0.08); border: 1px solid rgba(126,213,111,0.2); border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #a8e6a1;">Puedes seguir el estado de todos tus envios desde la seccion <strong>Envios</strong> de la app.</p>
        </div>
        <hr style="border: none; border-top: 1px solid #3d3c30; margin: 24px 0;" />
        <p style="font-size: 12px; color: #706a58; margin: 0;">
          BuscayCurra — Tu empleo, nuestra mision<br>
          Si no reconoces este envio, ignora este mensaje.
        </p>
      </div>
      `,
    );
  } catch (err) {
    console.error("[Resend] Error en confirmacion:", (err as Error).message);
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
