import { frasePromesaOfertas } from "@/lib/promesas";
import { getPool } from "@/lib/db";
import type { OfertasCiudad } from "@/lib/email/ofertas-para-correo";

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "BuscayCurra <noreply@buscaycurra.es>";

/**
 * ¿Esta dirección rebota? Entonces no se le escribe.
 *
 * Del 1 al 29 sep 2026 rebotaron 392 alertas a dos cuentas de prueba sin buzón,
 * más que las 218 que llegaron. Una tasa de rebote así hunde la entrega de todo
 * lo que sale de noreply@ (bienvenidas y recordatorios incluidos). Los rebotes
 * los anota el aviso de Resend en correos_rebotados (/api/cv-sender/entrega).
 *
 * Solo cuenta un rebote en firme, una queja de spam o dos rebotes cualesquiera.
 * Si la base no responde se envía igual: mejor un rebote que un aviso perdido.
 */
async function direccionQueRebota(to: string): Promise<boolean> {
  try {
    const { rows } = await getPool().query(
      `SELECT 1 FROM correos_rebotados WHERE email = $1 AND (permanente OR veces >= 2)`,
      [to.trim().toLowerCase()]
    );
    if (rows.length) console.warn(`[Resend] No se envía a ${to}: esa dirección rebota.`);
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "placeholder") {
    console.warn("[Resend] API key no configurada, email no enviado");
    return;
  }
  if (await direccionQueRebota(to)) return;

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

/**
 * Igual que sendEmail, pero DICE SI SALIÓ.
 *
 * sendEmail se traga los fallos (registra en el log y sigue), que está bien
 * para un aviso suelto pero no para una tanda: sin esto, el recordatorio del
 * primer día daría por avisada a gente a la que no le llegó nada, y como solo
 * se manda una vez, se quedaría sin recibirlo para siempre.
 */
async function enviarCorreo(
  to: string,
  subject: string,
  html: string,
  opciones: { bajaUrl?: string | null } = {}
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "placeholder") {
    console.warn("[Resend] API key no configurada, email no enviado");
    return false;
  }
  if (await direccionQueRebota(to)) return false;
  // Con enlace de baja, las cabeceras estándar: Gmail y los demás enseñan un
  // botón "Cancelar suscripción" que da de baja con un clic (POST al enlace).
  const headers = opciones.bajaUrl
    ? { "List-Unsubscribe": `<${opciones.bajaUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
    : undefined;
  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html, ...(headers ? { headers } : {}) }),
    });
    if (!res.ok) {
      console.error("[Resend] Error al enviar email:", (await res.text()).slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Resend] Error de red al enviar email:", (err as Error).message);
    return false;
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
      <p style="margin:0 0 4px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;">${label}</p>
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
          Tenemos <strong style="color:#22c55e;">${frasePromesaOfertas()}</strong> esperándote.
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

// ─── Correos con aspecto de correo personal ──────────────────────────────────
//
// El recordatorio del primer día iba con la plantilla oscura de marca y un
// asunto genérico ("te queda un paso en BuscayCurra"). Resultado medido del 23
// al 29 sep 2026: 78 personas avisadas, 76 entregados, 0 primeros CV, 1 envío.
// Los estudios de correo coinciden en que un correo sencillo, que parece
// escrito por una persona, consigue bastantes más clics que uno muy diseñado
// (HubSpot, Stripo), y en los portales de empleo gana el asunto concreto
// ("12 ofertas nuevas en tu ciudad"). Así que estos dos van en blanco, con
// texto corto, ofertas reales de su ciudad y un único enlace.

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function plantillaSencilla(cuerpo: string, pie: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="max-width:560px;margin:0 auto;padding:28px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;">
${cuerpo}
<p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.6;color:#6b7280;">${pie}</p>
</div>
</body>
</html>`;
}

const P = `style="margin:0 0 16px;"`;
const ENLACE = `style="color:#15803d;font-weight:600;"`;

function listaOfertas(o: OfertasCiudad): string {
  return `<ul style="margin:0 0 16px;padding-left:20px;">${o.ofertas
    .map((x) => `<li style="margin:0 0 6px;"><a href="${x.url}" ${ENLACE}>${esc(x.titulo)}</a>${x.empresa ? ` — ${esc(x.empresa)}` : ""}</li>`)
    .join("")}</ul>`;
}

function frasesOfertas(ciudad: string, o: OfertasCiudad): { asunto: string; texto: string } {
  const plural = o.total !== 1;
  const cuantas = `${o.total} oferta${plural ? "s" : ""} nueva${plural ? "s" : ""}`;
  return {
    asunto: `hay ${cuantas} en ${ciudad} esta semana`,
    texto: `Esta semana ha${plural ? "n" : ""} salido ${cuantas} en ${esc(ciudad)}. ${o.ofertas.length > 1 ? "Las últimas" : "La última"}:`,
  };
}

/** "Sube tu CV" → "sube tu CV": solo la primera letra, que "CV" no pase a "cv". */
function enFrase(titulo: string): string {
  return titulo ? titulo.charAt(0).toLowerCase() + titulo.slice(1) : titulo;
}

function capitalizar(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// ─── Recordatorio del primer día ─────────────────────────────────────────────

/**
 * A quien se registró y se quedó a medias.
 *
 * Recuerda EL PASO QUE LE FALTA a esa persona, con su enlace, y le enseña las
 * ofertas nuevas de su ciudad como motivo para volver. Se manda UNA VEZ (ver
 * /api/onboarding/recordatorios), porque insistir a quien no quiere es la forma
 * más rápida de acabar en la carpeta de spam de todo el mundo.
 */
export async function sendPrimerDiaEmail(params: {
  email: string;
  nombre: string;
  paso: { titulo: string; porQue: string; ruta: string; textoBoton: string };
  pasosHechos: number;
  pasosTotales: number;
  ciudad?: string | null;
  ofertas?: OfertasCiudad | null;
}): Promise<boolean> {
  const primerNombre = esc((params.nombre || "").trim().split(" ")[0]);
  const ciudad = capitalizar((params.ciudad || "").trim());
  const conOfertas = !!(ciudad && params.ofertas && params.ofertas.total > 0 && params.ofertas.ofertas.length);
  const o = conOfertas ? frasesOfertas(ciudad, params.ofertas!) : null;

  const asunto = o
    ? `${primerNombre ? `${primerNombre}, ` : ""}${o.asunto}`
    : `${primerNombre ? `${primerNombre}, te` : "Te"} falta un paso para empezar a mandar tu CV`;

  const cuerpo = `
<p ${P}>Hola${primerNombre ? ` ${primerNombre}` : ""}:</p>
<p ${P}>Te registraste en BuscayCurra hace unos días y se te quedó un paso a medias: <strong>${esc(enFrase(params.paso.titulo))}</strong>. ${esc(params.paso.porQue)}</p>
${o ? `<p ${P}>${o.texto}</p>${listaOfertas(params.ofertas!)}` : ""}
<p ${P}><a href="https://buscaycurra.es${params.paso.ruta}" ${ENLACE}>${esc(params.paso.textoBoton)} →</a> Se tarda un minuto.</p>
<p style="margin:0;">Un saludo,<br>Guzzi 🐛 y el equipo de BuscayCurra</p>`;

  return enviarCorreo(
    params.email,
    asunto,
    plantillaSencilla(cuerpo, "Solo te escribimos esto una vez. Si no te interesa, no tienes que hacer nada.")
  );
}

// ─── Bienvenida que llegó tarde ──────────────────────────────────────────────

/**
 * Para quien se registró entre el 23 y el 29 sep 2026, cuando la bienvenida se
 * quedaba en un 401 (ver /api/auth/welcome): no recibieron este correo ni se
 * les activó el aviso de ofertas de su ciudad. Se les pide perdón, se les dice
 * qué se ha activado y cómo quitarlo, y se les da el paso que les falta.
 */
export async function sendBienvenidaAtrasadaEmail(params: {
  email: string;
  nombre: string;
  fechaAlta: string; // "25 de septiembre"
  ciudad?: string | null;
  alertaActivada: boolean;
  ofertas?: OfertasCiudad | null;
  paso?: { titulo: string; porQue: string; ruta: string; textoBoton: string } | null;
  bajaUrl?: string | null;
}): Promise<boolean> {
  const primerNombre = esc((params.nombre || "").trim().split(" ")[0]);
  const ciudad = capitalizar((params.ciudad || "").trim());
  const conOfertas = !!(ciudad && params.ofertas && params.ofertas.total > 0 && params.ofertas.ofertas.length);
  const o = conOfertas ? frasesOfertas(ciudad, params.ofertas!) : null;

  const asunto = `${primerNombre ? `${primerNombre}, perdona` : "Perdona"} el retraso: ${
    params.alertaActivada && ciudad ? `ya tienes tus avisos de ofertas en ${ciudad}` : "tu bienvenida a BuscayCurra"
  }`;

  const cuerpo = `
<p ${P}>Hola${primerNombre ? ` ${primerNombre}` : ""}:</p>
<p ${P}>Te registraste en BuscayCurra el ${esc(params.fechaAlta)} y, por un fallo nuestro, no te llegó el correo de bienvenida${
    params.alertaActivada && ciudad ? ` ni se activó tu aviso de ofertas de ${esc(ciudad)}` : ""
  }. Ya está arreglado. Perdona.</p>
${params.alertaActivada && ciudad ? `<p ${P}>Desde mañana te llegará un correo al día con las ofertas nuevas de ${esc(ciudad)}. Si no lo quieres, lo quitas con el enlace del final.</p>` : ""}
${o ? `<p ${P}>${o.texto}</p>${listaOfertas(params.ofertas!)}` : ""}
${params.paso
    ? `<p ${P}>Lo que te falta ahora: <strong>${esc(enFrase(params.paso.titulo))}</strong>. ${esc(params.paso.porQue)}</p>
<p ${P}><a href="https://buscaycurra.es${params.paso.ruta}" ${ENLACE}>${esc(params.paso.textoBoton)} →</a></p>`
    : `<p ${P}><a href="https://buscaycurra.es/app/bienvenida" ${ENLACE}>Entrar en BuscayCurra →</a></p>`}
<p style="margin:0;">Un saludo,<br>Guzzi 🐛 y el equipo de BuscayCurra</p>`;

  const pie = params.bajaUrl && params.alertaActivada
    ? `Te escribimos por tu cuenta en BuscayCurra. <a href="${params.bajaUrl}" style="color:#6b7280;">No quiero el aviso diario de ofertas</a>.`
    : "Te escribimos por tu cuenta en BuscayCurra.";

  return enviarCorreo(params.email, asunto, plantillaSencilla(cuerpo, pie), { bajaUrl: params.alertaActivada ? params.bajaUrl : null });
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
        <p style="margin:0 0 6px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;">Plan activado</p>
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

    ${ctaButton("Ver todos mis envíos →", "https://buscaycurra.es/app/empresas")}
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

// ─── Email de alerta de empleo ────────────────────────────────────────────────

/**
 * El correo de las alertas de empleo.
 *
 * Revisado el 29 sep 2026: casi todas las alertas se crean al registrarse con la
 * ciudad y SIN palabra clave, así que el asunto llegaba como
 * `🔔 3 nuevas ofertas: "" — BuscayCurra` y el texto decía "tu alerta """. Además
 * decía "nuevas" también cuando eran ofertas activas de días anteriores (la
 * campanita ya lo distinguía) y metía prisa con "los mejores puestos se cubren
 * en horas", que no es un dato. Ahora dice lo que es y cuenta si salió.
 */
export async function sendJobAlertEmail(params: {
  userEmail: string;
  keyword: string;
  location?: string;
  total: number;
  ejemploTitle: string;
  ejemploCompany: string;
  ejemploCity?: string;
  /** true si no son nuevas sino ofertas activas que aún no había visto. */
  esInventario?: boolean;
  /** Enlace de baja de un clic (lib/alertas/baja.ts). */
  bajaUrl?: string | null;
}): Promise<boolean> {
  const { userEmail, keyword, location, total, ejemploTitle, ejemploCompany, ejemploCity, esInventario, bajaUrl } = params;
  const searchUrl = `https://buscaycurra.es/app/notificaciones`;

  const plural = total > 1;
  const clase = esInventario ? `activa${plural ? "s" : ""}` : `nueva${plural ? "s" : ""}`;
  const palabra = keyword?.trim();
  // "3 ofertas nuevas de camarero en Tudela" · "3 ofertas activas en Tudela"
  const queEs = `${total} oferta${plural ? "s" : ""} ${clase}${palabra ? ` de "${palabra}"` : ""}${location ? ` en ${location}` : ""}`;

  const header = headerGradient(
    "🔔",
    `${total} oferta${plural ? "s" : ""} ${clase} para ti`,
    [palabra ? `"${palabra}"` : "", location || ""].filter(Boolean).join(" · ") || "Tu alerta de empleo"
  );

  const body = `
    <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
      Guzzi ha encontrado <strong style="color:#22c55e;">${queEs}</strong>${esInventario ? " que todavía no habías visto" : ""}.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1520;border:1px solid rgba(34,197,94,0.15);border-radius:14px;margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 4px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;">Ejemplo</p>
        <p style="margin:0 0 4px;color:#f1f5f9;font-size:16px;font-weight:700;">${ejemploTitle}</p>
        <p style="margin:0;color:#64748b;font-size:13px;">${ejemploCompany}${ejemploCity ? ` · ${ejemploCity}` : ""}</p>
      </td></tr>
    </table>

    ${total > 1 ? `<p style="margin:0 0 20px;color:#64748b;font-size:13px;line-height:1.7;">Y ${total - 1} más en tus avisos.</p>` : ""}

    ${ctaButton("Ver todas las ofertas →", searchUrl)}

    <p style="margin:20px 0 0;text-align:center;color:#64748b;font-size:11px;line-height:1.7;">
      Te llega porque tienes una alerta de ofertas en BuscayCurra.
      ${bajaUrl ? `<br><a href="${bajaUrl}" style="color:#94a3b8;text-decoration:underline;">Dejar de recibir estas alertas</a>` : ""}
    </p>
  `;

  return enviarCorreo(userEmail, `🔔 ${queEs} — BuscayCurra`, baseTemplate(header, body), { bajaUrl });
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

/**
 * Aviso a quien se interesó por un curso: hay trabajo que lo pide.
 *
 * Es la pieza que une las dos mitades de la aplicación. Alguien entra buscando
 * "curso de carretillero", le preparamos la solicitud, y ahí se acababa todo:
 * se iba a inscribir y no volvíamos a saber de él. Esto le devuelve semanas
 * después el único motivo por el que se estaba formando — que hay empresas
 * pidiéndolo ahora mismo, y cuántas.
 *
 * No es un boletín. Solo sale cuando hay ofertas de verdad que piden ese curso,
 * y como mucho una vez cada dos semanas por curso y persona.
 */
export async function sendCursoAlertaEmail(params: {
  userEmail: string;
  cursoNombre: string;
  cursoSlug: string;
  total: number;
  ejemploTitle: string;
  ejemploCompany: string;
  ejemploCity?: string;
  obligatorio: boolean;
}): Promise<void> {
  const { userEmail, cursoNombre, cursoSlug, total, ejemploTitle, ejemploCompany, ejemploCity, obligatorio } = params;

  const header = headerGradient(
    "🎓",
    `${total} oferta${total > 1 ? "s" : ""} que pide${total > 1 ? "n" : ""} tu curso`,
    cursoNombre
  );

  const body = `
    <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
      Te interesaste por <strong style="color:#f1f5f9;">${cursoNombre}</strong>.
      Ahora mismo hay <strong style="color:#22c55e;">${total} oferta${total > 1 ? "s" : ""}</strong>
      de puestos que lo piden.
    </p>

    ${obligatorio ? `
    <p style="margin:0 0 20px;color:#f59e0b;font-size:13px;line-height:1.7;">
      Recuerda que este es obligatorio: sin él no te pueden contratar para ese puesto.
    </p>` : ""}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1520;border:1px solid rgba(34,197,94,0.15);border-radius:14px;margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 4px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;">Por ejemplo</p>
        <p style="margin:0 0 4px;color:#f1f5f9;font-size:16px;font-weight:700;">${ejemploTitle}</p>
        <p style="margin:0;color:#64748b;font-size:13px;">${ejemploCompany}${ejemploCity ? ` · ${ejemploCity}` : ""}</p>
      </td></tr>
    </table>

    ${ctaButton("Ver las ofertas →", "https://buscaycurra.es/app/buscar")}

    <p style="margin:20px 0 0;text-align:center;color:#374151;font-size:11px;">
      ¿Aún no lo has sacado? <a href="https://buscaycurra.es/cursos/${cursoSlug}" style="color:#22c55e;text-decoration:none;">Vuelve a la ficha del curso</a>
    </p>
  `;

  try {
    await sendEmail(
      userEmail,
      `🎓 ${total} oferta${total > 1 ? "s" : ""} piden ${cursoNombre} — BuscayCurra`,
      baseTemplate(header, body)
    );
  } catch (err) {
    console.error("[Resend] Error en alerta de curso:", (err as Error).message);
  }
}
