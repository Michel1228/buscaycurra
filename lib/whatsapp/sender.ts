/**
 * WhatsApp Cloud API — envía alertas de empleo por WhatsApp
 * Meta Business Platform — Graph API v20.0
 * 
 * Requisitos:
 * - Meta Business Account
 * - WhatsApp Business App (número de teléfono verificado)
 * - Token de acceso permanente (system user token)
 * - Templates de mensaje aprobados por Meta
 * 
 * Configuración en .env.local:
 *   WHATSAPP_PHONE_NUMBER_ID=123456789
 *   WHATSAPP_ACCESS_TOKEN=EAAx...
 *   WHATSAPP_VERIFY_TOKEN=buscaycurra_whatsapp_webhook
 */

const WHATSAPP_API = "https://graph.facebook.com/v20.0";

interface WhatsAppMessage {
  to: string; // Número con código de país: "34600123456"
  templateName: string;
  language?: string;
  components?: Array<{
    type: "header" | "body" | "button";
    parameters?: Array<{
      type: "text";
      text: string;
    }>;
    sub_type?: string;
    index?: number;
  }>;
}

interface WhatsAppTemplateMessage {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "template";
  template: {
    name: string;
    language: { code: string };
    components: Array<{
      type: "header" | "body" | "button";
      parameters: Array<{ type: "text"; text: string }>;
    }>;
  };
}

interface WhatsAppTextMessage {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text";
  text: {
    preview_url: boolean;
    body: string;
  };
  // Solo funciona dentro de las 24h de la última interacción del usuario
}

/**
 * Envía un mensaje de plantilla de WhatsApp (aprobado por Meta).
 * Las plantillas se usan para iniciar conversaciones fuera de las 24h.
 */
export async function sendWhatsAppTemplate(msg: WhatsAppMessage): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: "WHATSAPP no configurado (PHONE_NUMBER_ID o ACCESS_TOKEN faltan)" };
  }

  const body: WhatsAppTemplateMessage = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: msg.to,
    type: "template",
    template: {
      name: msg.templateName,
      language: { code: msg.language || "es" },
      components: msg.components || [],
    },
  };

  try {
    const res = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: JSON.stringify(data) };
    }
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Envía un mensaje de texto libre por WhatsApp.
 * SOLO funciona si el usuario ha enviado un mensaje en las últimas 24h.
 * Para notificaciones proactivas, usar sendWhatsAppTemplate().
 */
export async function sendWhatsAppText(to: string, body: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: "WHATSAPP no configurado" };
  }

  const msg: WhatsAppTextMessage = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body },
  };

  try {
    const res = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(msg),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: JSON.stringify(data) };
    }
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Envía una alerta de nueva oferta de empleo por WhatsApp.
 * Usa la plantilla "job_alert" (debe estar aprobada en Meta).
 * 
 * Parámetros de la plantilla:
 * {{1}} = título del puesto
 * {{2}} = empresa
 * {{3}} = ciudad
 * {{4}} = salario (o "No especificado")
 */
export async function enviarAlertaWhatsApp(
  telefono: string,
  datos: { puesto: string; empresa: string; ciudad: string; salario?: string; url: string }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Limpiar número: quitar espacios, +, asegurar formato internacional
  const limpio = telefono.replace(/[\s\+\-\(\)]/g, "");
  const to = limpio.startsWith("34") ? limpio : `34${limpio}`;

  return sendWhatsAppTemplate({
    to,
    templateName: "job_alert",
    language: "es",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: datos.puesto },
          { type: "text", text: datos.empresa },
          { type: "text", text: datos.ciudad },
          { type: "text", text: datos.salario || "No especificado" },
        ],
      },
      {
        type: "button",
        sub_type: "url",
        index: 0,
        parameters: [{ type: "text", text: datos.url }],
      },
    ],
  });
}
