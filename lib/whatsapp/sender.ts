/**
 * 🔒 SELLO WHATSAPP — BuscayCurra
 * ┌─────────────────────────────────────────────────────────────┐
 * │ CONFIGURACIÓN CORRECTA (NO TOCAR SIN LEER ESTO):           │
 * │                                                             │
 * │ 📱 Plantilla Meta: buscaycurra_alerta_empleo (español)      │
 * │ ⚠️  NO USAR: buscaycurra_alerta_en (inglés, no existe)      │
 * │                                                             │
 * │ 📋 Estructura: body(4 params) + button URL(1 param)         │
 * │    {{1}} = nombre   {{2}} = puesto                          │
 * │    {{3}} = ciudad   {{4}} = URL (texto cuerpo)              │
 * │    Button = misma URL (clickable)                           │
 * │                                                             │
 * │ 🔑 Token: WHATSAPP_ACCESS_TOKEN (system user Meta)          │
 * │    Expira ~60 días → regenerar en business.facebook.com     │
 * │    Phone ID: 1148143131713343                                │
 * │    Permisos: whatsapp_business_messaging + management        │
 * │                                                             │
 * │ 🔗 Webhook:                                                 │
 * │    URL: https://buscaycurra.es/api/whatsapp/webhook         │
 * │    Verify token: ef36ef32942ce3d7a3d6f0e34628c102          │
 * │                                                             │
 * │ 🗺️  Flujo completo:                                         │
 * │    usuario activa alertas → job_alerts (VPS PG)             │
 * │    → cron cada 3h → send-alerts → user_contacts (VPS PG)   │
 * │    → sendJobAlertEmail (Resend) + enviarAlertaWhatsApp      │
 * │    → Meta API → WhatsApp del usuario                        │
 * │                                                             │
 * │ ✅ Tests: sello-verificacion.mjs bloque 3                   │
 * └─────────────────────────────────────────────────────────────┘
 *
 * WhatsApp Cloud API — envía alertas de empleo por WhatsApp
 * Meta Business Platform — Graph API v21.0
 * 
 * Requisitos:
 * - Meta Business Account
 * - WhatsApp Business App (número de teléfono verificado)
 * - Token de acceso permanente (system user token)
 * - Templates de mensaje aprobados por Meta
 * 
 * Configuración en .env.local:
 *   WHATSAPP_PHONE_NUMBER_ID=1148143131713343
 *   WHATSAPP_ACCESS_TOKEN=***
 *   WHATSAPP_VERIFY_TOKEN=ef36ef32942ce3d7a3d6f0e34628c102
 */

const WHATSAPP_API = "https://graph.facebook.com/v21.0";

interface WhatsAppMessage {
  to: string; // Número con código de país: "34600123456"
  templateName: string;
  language?: string;
  components?: Array<{
    type: "header" | "body" | "button";
    parameters?: Array<{
      type: "text" | "payload";
      text?: string;
      payload?: string;
    }>;
    sub_type?: "url" | "quick_reply" | "call_to_action";
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
      parameters?: Array<{ type: "text"; text: string }>;
      sub_type?: string;
      index?: number;
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
      components: (msg.components || []) as any,
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
 * Usa la plantilla "buscaycurra_alerta_empleo" (aprobada en Meta).
 *
 * Parámetros del cuerpo:
 * {{1}} = nombre del usuario
 * {{2}} = título del puesto
 * {{3}} = ciudad
 * {{4}} = URL directa a la oferta (o búsqueda si no hay jobId)
 */
export async function enviarAlertaWhatsApp(
  telefono: string,
  datos: { nombre: string; puesto: string; ciudad: string; url?: string; keyword?: string }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const limpio = telefono.replace(/[\s\+\-\(\)]/g, "");
  const to = limpio.startsWith("34") ? limpio : `34${limpio}`;

  const urlOferta = datos.url
    || `https://buscaycurra.es/app/buscar?q=${encodeURIComponent(datos.keyword || datos.puesto)}`;

  return sendWhatsAppTemplate({
    to,
    templateName: "buscaycurra_alerta_empleo",
    language: "es",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: datos.nombre },
          { type: "text", text: datos.puesto },
          { type: "text", text: datos.ciudad || "España" },
          { type: "text", text: urlOferta },
        ],
      },
      {
        type: "button",
        sub_type: "url",
        index: 0,
        parameters: [
          { type: "text", text: urlOferta },
        ],
      },
    ],
  });
}
