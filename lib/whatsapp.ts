/**
 * lib/whatsapp.ts — WhatsApp Cloud API (Meta)
 *
 * Envía mensajes de plantilla aprobada ("job_alert") cuando:
 *   - El CV es enviado a una empresa
 *   - La empresa ve/responde al CV
 *
 * Requiere en .env.local:
 *   WHATSAPP_PHONE_NUMBER_ID  → ID del número en Meta for Developers
 *   WHATSAPP_ACCESS_TOKEN     → Token de acceso permanente (System User)
 *   WHATSAPP_VERIFY_TOKEN     → Token secreto para verificar webhook
 */

const BASE = "https://graph.facebook.com/v21.0";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
  };
}

function isConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_ACCESS_TOKEN
  );
}

// ─── Tipos de notificación ────────────────────────────────────────────────────

export type TipoNotifWA =
  | "cv_enviado"      // CV enviado a empresa
  | "cv_visto"        // Empresa ha abierto el email
  | "respuesta"       // Empresa ha respondido
  | "nueva_oferta";   // Nueva oferta que coincide con perfil

interface PayloadCvEnviado {
  tipo: "cv_enviado";
  to: string;         // Número E.164: +34612345678
  empresa: string;
  puesto: string;
}

interface PayloadCvVisto {
  tipo: "cv_visto";
  to: string;
  empresa: string;
  puesto: string;
}

interface PayloadRespuesta {
  tipo: "respuesta";
  to: string;
  empresa: string;
  mensaje: string;
}

interface PayloadNuevaOferta {
  tipo: "nueva_oferta";
  to: string;
  puesto: string;
  ubicacion: string;
}

export type NotifPayload =
  | PayloadCvEnviado
  | PayloadCvVisto
  | PayloadRespuesta
  | PayloadNuevaOferta;

// ─── Sender principal ─────────────────────────────────────────────────────────

export async function enviarWhatsApp(payload: NotifPayload): Promise<void> {
  if (!isConfigured()) {
    console.warn("[WhatsApp] No configurado — saltando notificación");
    return;
  }

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const url = `${BASE}/${phoneId}/messages`;

  let body: Record<string, unknown>;

  switch (payload.tipo) {
    case "cv_enviado":
      body = buildTemplate(payload.to, "job_alert", [
        { type: "text", text: "¡CV enviado!" },
        { type: "text", text: `Tu CV ha sido enviado a *${payload.empresa}* para el puesto de *${payload.puesto}*. Te avisaremos cuando lo vean.` },
      ]);
      break;

    case "cv_visto":
      body = buildTemplate(payload.to, "job_alert", [
        { type: "text", text: "Tu CV ha sido visto 👀" },
        { type: "text", text: `*${payload.empresa}* ha abierto tu CV para el puesto de *${payload.puesto}*. ¡Buenas noticias!` },
      ]);
      break;

    case "respuesta":
      body = buildTemplate(payload.to, "job_alert", [
        { type: "text", text: "Nueva respuesta de empresa 💬" },
        { type: "text", text: `*${payload.empresa}* ha respondido: "${payload.mensaje.slice(0, 200)}"` },
      ]);
      break;

    case "nueva_oferta":
      body = buildTemplate(payload.to, "job_alert", [
        { type: "text", text: "Nueva oferta para ti 🔔" },
        { type: "text", text: `*${payload.puesto}* en *${payload.ubicacion}* — entra a BuscayCurra para verla.` },
      ]);
      break;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn(`[WhatsApp] Error ${res.status}:`, err);
    } else {
      console.log(`[WhatsApp] Enviado a ${payload.to} (tipo: ${payload.tipo})`);
    }
  } catch (e) {
    console.warn("[WhatsApp] Fallo de red:", (e as Error).message);
  }
}

// ─── Helper para construir body de plantilla ──────────────────────────────────

function buildTemplate(
  to: string,
  templateName: string,
  components: { type: "text"; text: string }[]
): Record<string, unknown> {
  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: "es" },
      components: [
        {
          type: "body",
          parameters: components,
        },
      ],
    },
  };
}
