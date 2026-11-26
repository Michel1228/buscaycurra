/**
 * lib/consultas/consultas.ts — Mandar una consulta desde la app, a nombre de la persona.
 *
 * POR QUÉ (26 nov 2026, Michel): «somos el intermediario; que la gente lo
 * mande todo desde aquí, no darle un cartel como hacen otros». Dos destinos:
 *
 *   · acreditación: al organismo de su comunidad (lib/consultas/destinos.ts),
 *     preguntando cómo acreditar su experiencia. Con su CV (decisión de Michel).
 *   · plaza: al centro que imparte un curso con plaza abierta
 *     (lib/cursos/plazas), pidiendo la plaza.
 *
 * Cómo sale: «Nombre via BuscayCurra <noreply@…>», con respuesta a su correo,
 * igual que los CV. El destino lo pone SIEMPRE el servidor (de destinos.ts o
 * de la plaza en la base), nunca lo que mande el navegador: si no, esto
 * serviría para escribir a cualquiera desde nuestra dirección.
 *
 * Topes: 5 consultas al día por persona, y una al mismo sitio cada 7 días.
 * Una administración o un centro que recibe lo mismo diez veces deja de leernos.
 */
import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { getPool } from "@/lib/db";
import { callGroq, callOpenAI } from "@/lib/guzzi/llm";
import { escapeHtml } from "@/lib/cv-generator/cv-template";
import { normalizar } from "@/lib/cv-generator/normalizar";
import { generarCV } from "@/lib/cv-generator/plantillas";
import { generateCVPdf } from "@/lib/cv-generator/generate-pdf";
import { apuntarCorreo } from "@/lib/email/presupuesto-diario";
import { organismoPorId } from "@/lib/consultas/destinos";
import { plazaPorId } from "@/lib/cursos/plazas/db";

export type TipoConsulta = "acreditacion" | "plaza";
export const AL_DIA = 5;
export const DIAS_ENTRE_REPETIDAS = 7;

export interface Destino { tipo: TipoConsulta; ref: string; nombre: string; email: string | null; web: string; detalle: string }

export interface Consulta {
  id: string; tipo: TipoConsulta; ref: string; destino_nombre: string; destino_email: string;
  asunto: string; con_cv: boolean; estado: string; creado: string;
}

let lista = false;
async function asegurarTabla(): Promise<void> {
  if (lista) return;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS consulta (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL,
      tipo           TEXT NOT NULL,
      ref            TEXT NOT NULL,
      destino_nombre TEXT NOT NULL,
      destino_email  TEXT NOT NULL,
      asunto         TEXT NOT NULL,
      cuerpo         TEXT NOT NULL,
      con_cv         BOOLEAN NOT NULL DEFAULT false,
      resend_id      TEXT,
      estado         TEXT NOT NULL DEFAULT 'enviada',
      creado         TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS consulta_user ON consulta (user_id, creado DESC);
  `);
  lista = true;
}

/** A quién va, sacado del servidor. null si no existe. */
export async function destinoDe(tipo: TipoConsulta, ref: string): Promise<Destino | null> {
  if (tipo === "acreditacion") {
    const o = organismoPorId(ref);
    return o ? { tipo, ref, nombre: o.organismo, email: o.email, web: o.web, detalle: o.ccaa } : null;
  }
  const p = await plazaPorId(ref);
  if (!p) return null;
  const email = p.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) ? p.email.trim().toLowerCase() : null;
  return {
    tipo, ref, nombre: p.centro || "el centro del curso", email, web: p.url,
    detalle: `${p.titulo}${p.municipio ? ` · ${p.municipio}` : ""}${p.inicio ? ` · empieza el ${p.inicio.split("-").reverse().join("/")}` : ""}`,
  };
}

interface DatosCV { nombre: string; email: string; telefono: string; formData: Record<string, unknown> | null }

async function datosDelCV(userId: string, emailCuenta: string): Promise<DatosCV> {
  const { rows } = await getPool().query(`SELECT form_data FROM user_cvs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`, [userId]);
  const f = (rows[0]?.form_data ?? null) as Record<string, unknown> | null;
  const nombre = [f?.nombre, f?.apellidos].filter(Boolean).join(" ").trim() || emailCuenta.split("@")[0];
  return { nombre, email: emailCuenta, telefono: String(f?.telefono || "").trim(), formData: f };
}

/** El texto de la consulta, escrito por Guzzi con lo que dice su CV. La persona lo puede cambiar. */
export async function borrador(userId: string, emailCuenta: string, d: Destino): Promise<{ asunto: string; cuerpo: string }> {
  const cv = await datosDelCV(userId, emailCuenta);
  const cvTexto = cv.formData ? JSON.stringify(normalizar(cv.formData)).slice(0, 6000) : "Sin CV";
  const reglas = `REGLAS: primera persona, de usted ("les escribo", "quisiera saber"), respetuoso y sencillo, sin florituras. Entre 80 y 140 palabras.
NO INVENTES NADA: usa solo lo que pone el CV (puestos, empresas, años, estudios). Si el CV no lo dice, no lo pongas.
Firma solo con el nombre: ${cv.nombre}. Devuelve SOLO el texto, sin asunto ni comentarios.`;
  const sistema = d.tipo === "acreditacion"
    ? `Escribe la consulta que ${cv.nombre} manda al organismo de acreditación de competencias profesionales de ${d.detalle} (${d.nombre}).
Empieza con "Buenos días:" y se presenta: nombre y a qué se ha dedicado según su CV (puestos y cuántos años, si el CV lo dice).
Explica que quiere acreditar su experiencia laboral y pregunta: si el procedimiento está abierto para su oficio en ${d.detalle}, cómo presenta la solicitud, qué documentación necesita y si puede tener asesoramiento.
${reglas}`
    : `Escribe la solicitud que ${cv.nombre} manda al centro ${d.nombre} para el curso: ${d.detalle}.
Empieza con "Buenos días:" y se presenta: nombre y su experiencia o situación según el CV.
Dice por qué le interesa el curso y pide que le informen de si quedan plazas, qué requisitos y papeles hacen falta y cómo inscribirse.
${reglas}`;
  const texto = (await callGroq(sistema, `CV:\n${cvTexto}`, 700)) || (await callOpenAI(sistema, `CV:\n${cvTexto}`, 700));
  const respaldo = d.tipo === "acreditacion"
    ? `Buenos días:\n\nMe llamo ${cv.nombre} y quisiera acreditar mi experiencia laboral. ¿Podrían indicarme si el procedimiento está abierto en ${d.detalle} para mi oficio, cómo presento la solicitud y qué documentación necesito?\n\nLes adjunto mi currículum. Muchas gracias.\n\nUn saludo,\n${cv.nombre}`
    : `Buenos días:\n\nMe llamo ${cv.nombre} y me interesa el curso ${d.detalle}. ¿Podrían informarme de si quedan plazas, qué requisitos hay y cómo puedo inscribirme?\n\nMuchas gracias.\n\nUn saludo,\n${cv.nombre}`;
  const cuerpo = (texto || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim() || respaldo;
  const asunto = d.tipo === "acreditacion"
    ? `Consulta sobre acreditación de competencias — ${cv.nombre}`
    : `Solicitud de información de plaza — ${cv.nombre}`;
  return { asunto, cuerpo: cuerpo.length > 60 ? cuerpo : respaldo };
}

export type Resultado = { ok: true; id: string } | { ok: false; error: string; status: number };

export async function enviar(userId: string, emailCuenta: string, d: Destino, asunto: string, cuerpo: string, conCV: boolean): Promise<Resultado> {
  if (!d.email) return { ok: false, error: "Este organismo no publica un correo para esto. Entra en su web.", status: 400 };
  const texto = cuerpo.trim().slice(0, 4000);
  const titulo = asunto.replace(/[\r\n\t]/g, " ").trim().slice(0, 150);
  if (texto.length < 40 || !titulo) return { ok: false, error: "Escribe la consulta antes de mandarla.", status: 400 };
  await asegurarTabla();
  const pool = getPool();
  const { rows: [hoy] } = await pool.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM consulta WHERE user_id = $1 AND creado > now() - interval '1 day'", [userId]);
  if (hoy.n >= AL_DIA) return { ok: false, error: `Puedes mandar ${AL_DIA} consultas al día. Mañana puedes seguir.`, status: 429 };
  const { rows: repetida } = await pool.query(
    `SELECT 1 FROM consulta WHERE user_id = $1 AND tipo = $2 AND ref = $3 AND estado <> 'fallida' AND creado > now() - interval '${DIAS_ENTRE_REPETIDAS} days'`,
    [userId, d.tipo, d.ref]);
  if (repetida.length) return { ok: false, error: `Ya les escribiste hace menos de ${DIAS_ENTRE_REPETIDAS} días. Espera su respuesta en tu correo.`, status: 409 };
  const { rows: rebota } = await pool.query("SELECT 1 FROM correos_rebotados WHERE email = $1 AND (permanente OR veces >= 2)", [d.email]).catch(() => ({ rows: [] }));
  if (rebota.length) return { ok: false, error: "Ese correo ya no recibe mensajes. Entra en su web para contactar.", status: 400 };

  const cv = await datosDelCV(userId, emailCuenta);
  let adjuntos: { filename: string; content: Buffer }[] | undefined;
  if (conCV) {
    if (!cv.formData) return { ok: false, error: "Para adjuntar tu CV, primero hazlo en «Mi CV».", status: 400 };
    try {
      adjuntos = [{ filename: `CV_${cv.nombre.replace(/\s+/g, "_").replace(/[^\p{L}\p{N}_-]/gu, "") || "Candidato"}.pdf`, content: await generateCVPdf(generarCV(normalizar(cv.formData))) }];
    } catch (e) {
      console.error("[consultas] PDF:", (e as Error).message);
      return { ok: false, error: "No se pudo preparar tu CV ahora. Prueba en un momento o mándala sin CV.", status: 503 };
    }
  }

  const id = randomBytes(10).toString("base64url");
  const nombre = escapeHtml(cv.nombre);
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;padding:32px 36px;color:#1f2937;font-size:15px;line-height:1.6;">
<tr><td>${texto.split("\n").filter((l) => l.trim()).map((l) => `<p style="margin:0 0 12px;">${escapeHtml(l)}</p>`).join("")}
<p style="margin:20px 0 0;color:#4b5563;font-size:14px;">${nombre}<br><a href="mailto:${escapeHtml(cv.email)}" style="color:#16a34a;">${escapeHtml(cv.email)}</a>${cv.telefono ? `<br>${escapeHtml(cv.telefono)}` : ""}</p>
${conCV ? `<p style="margin:16px 0 0;color:#6b7280;font-size:13px;">📎 Adjunto mi currículum en PDF.</p>` : ""}
<p style="margin:24px 0 0;padding-top:14px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;">${nombre} les escribe por su cuenta a través de <a href="https://buscaycurra.es" style="color:#16a34a;">BuscayCurra</a>. Si contestan a este correo, le llega directamente.</p>
</td></tr></table></td></tr></table></body></html>`;

  const clave = process.env.RESEND_API_KEY;
  if (!clave) return { ok: false, error: "Ahora mismo no se pueden mandar consultas.", status: 503 };
  const { data, error } = await new Resend(clave).emails.send({
    from: `${cv.nombre.replace(/[\r\n"<>]/g, " ").slice(0, 80)} via BuscayCurra <${process.env.FROM_EMAIL ?? "noreply@buscaycurra.es"}>`,
    to: [d.email],
    reply_to: cv.email,
    subject: titulo,
    html,
    ...(adjuntos ? { attachments: adjuntos } : {}),
  });
  await pool.query(
    `INSERT INTO consulta (id, user_id, tipo, ref, destino_nombre, destino_email, asunto, cuerpo, con_cv, resend_id, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [id, userId, d.tipo, d.ref, d.nombre, d.email, titulo, texto, !!adjuntos, data?.id ?? null, error ? "fallida" : "enviada"]
  );
  if (error) {
    console.error("[consultas] Resend:", error.message);
    return { ok: false, error: "No se pudo mandar. Inténtalo de nuevo en un momento.", status: 502 };
  }
  await apuntarCorreo();
  return { ok: true, id };
}

export async function consultasDe(userId: string): Promise<Consulta[]> {
  await asegurarTabla();
  const { rows } = await getPool().query<Consulta>(
    `SELECT id, tipo, ref, destino_nombre, destino_email, asunto, con_cv, estado, creado
       FROM consulta WHERE user_id = $1 ORDER BY creado DESC LIMIT 50`, [userId]);
  return rows;
}
