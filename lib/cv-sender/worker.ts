/**
 * worker.ts — Worker de BullMQ que procesa los trabajos de envío de CV
 *
 * El worker es el "motor" del sistema: coge trabajos de la cola de Redis
 * y los procesa uno a uno (o varios en paralelo si se configura así).
 *
 * Proceso completo por cada job:
 *   1. Obtiene el CV del usuario de Supabase
 *   2. Personaliza la carta con OpenClaw IA
 *   3. Busca el email de RRHH de la empresa
 *   4. Envía el CV por email (usando Resend)
 *   5. Registra el envío en Supabase
 *   6. Notifica al usuario que su CV fue enviado
 *
 * Escalabilidad:
 *   - Añadir más workers = más envíos en paralelo
 *   - Configurable con la variable de entorno WORKER_CONCURRENCY
 */

import { Worker, Job } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { redisConnection, CVJobData, addNotificationJob, NotificationJobData } from "./queue";
import { personalizeForCompany } from "./cv-personalizer";
import { sendCVEmail, sendConfirmationToUser } from "./email-sender";
import { recordSent, updateSendStatus } from "./tracker";
import { getPool } from "@/lib/db";

// ─── Cliente Supabase (inicializado de forma diferida) ────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

/** Datos del perfil de usuario que necesitamos */
interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  linkedin_url?: string;
}

/** Datos del CV almacenado en user_cvs (VPS PostgreSQL) */
interface CVDocument {
  form_data: Record<string, unknown>;
  html: string;
}

// ─── Función Principal: processCVJob ─────────────────────────────────────────

/**
 * Procesa un job de envío de CV.
 * Esta es la función principal que ejecuta el worker por cada trabajo.
 *
 * @param job - Job de BullMQ con todos los datos del envío
 */
async function processCVJob(job: Job<CVJobData>): Promise<void> {
  const { userId, companyName, companyEmail, companyUrl, jobTitle, useAIPersonalization } = job.data;

  console.log(`[Worker] Procesando job ${job.id}: ${userId} → ${companyName} (${companyEmail})`);

  // Actualizamos el progreso del job (visible en el dashboard)
  await job.updateProgress(10);

  // ── Paso 1: Obtener perfil y CV del usuario ──────────────────────────────
  console.log(`[Worker] Paso 1/6: Obteniendo datos del usuario ${userId}...`);

  const profileResult = await getSupabase()
    .from("profiles")
    .select("id, full_name, phone, linkedin_url")
    .eq("id", userId)
    .single();

  if (profileResult.error || !profileResult.data) {
    throw new Error(`No se encontró el perfil del usuario ${userId}: ${profileResult.error?.message}`);
  }

  // Obtener email real desde Supabase Auth (profiles.email puede ser null)
  const { data: authData } = await getSupabase().auth.admin.getUserById(userId);
  const userEmail = authData?.user?.email ?? "";
  if (!userEmail) {
    throw new Error(`No se encontró email para el usuario ${userId}`);
  }

  const userProfile: UserProfile = {
    ...profileResult.data,
    email: userEmail,
  };

  // Obtener CV desde la tabla user_cvs del VPS PostgreSQL
  console.log(`[Worker] Paso 1b/6: Obteniendo CV de user_cvs para ${userId}...`);
  const pool = getPool();
  const cvRow = await pool.query(
    "SELECT form_data, html FROM user_cvs WHERE user_id = $1",
    [userId]
  );

  if (!cvRow.rows[0]) {
    throw new Error(`No se encontró CV para el usuario ${userId}. El usuario debe crear su CV primero.`);
  }

  const cvDocument: CVDocument = {
    form_data: (cvRow.rows[0].form_data as Record<string, unknown>) ?? {},
    html: cvRow.rows[0].html ?? "",
  };

  await job.updateProgress(25);

  // Paso 2: Generar contenido del CV para el email
  console.log(`[Worker] Paso 2/6: Generando contenido del CV...`);

  await job.updateProgress(40);

  // ── Paso 3: Personalizar con OpenClaw IA ────────────────────────────────
  let coverLetter: string;
  let subjectLine: string;

  // Resumen de texto del CV para personalización con IA
  const cvTextSummary = buildCVTextSummary(cvDocument.form_data);

  if (useAIPersonalization && cvTextSummary) {
    console.log(`[Worker] Paso 3/6: Personalizando carta con OpenClaw IA para ${companyName}...`);

    try {
      const personalizacion = await personalizeForCompany(
        cvTextSummary,
        { name: companyName, url: companyUrl },
        jobTitle
      );
      coverLetter = personalizacion.coverLetter;
      subjectLine = personalizacion.subjectLine;
    } catch (aiError) {
      console.warn(`[Worker] OpenClaw IA no disponible, usando carta genérica:`, (aiError as Error).message);
      // Fallback: carta genérica si la IA no está disponible
      coverLetter = `Estimado equipo de ${companyName},\n\nMe pongo en contacto con ustedes para enviarles mi candidatura${jobTitle ? ` al puesto de ${jobTitle}` : " espontánea"}.\n\nQuedo a su disposición para cualquier consulta.\n\nUn cordial saludo,\n${userProfile.full_name}`;
      subjectLine = jobTitle
        ? `Candidatura para ${jobTitle} — ${userProfile.full_name}`
        : `Candidatura espontánea — ${userProfile.full_name}`;
    }
  } else {
    // Sin personalización IA
    console.log(`[Worker] Paso 3/6: Usando carta genérica (sin IA)...`);
    coverLetter = `Estimado equipo de ${companyName},\n\nMe pongo en contacto con ustedes para enviarles mi candidatura${jobTitle ? ` al puesto de ${jobTitle}` : " espontánea"}.\n\nAdjunto mi CV para su consideración.\n\nUn cordial saludo,\n${userProfile.full_name}`;
    subjectLine = jobTitle
      ? `Candidatura para ${jobTitle} — ${userProfile.full_name}`
      : `Candidatura espontánea — ${userProfile.full_name}`;
  }

  await job.updateProgress(60);

  // ── Paso 4: Registrar envío como pendiente en Supabase ──────────────────
  console.log(`[Worker] Paso 4/6: Registrando envío en la base de datos...`);

  const recordId = await recordSent(userId, companyEmail, "pendiente", {
    company_name: companyName,
    company_url: companyUrl,
    job_title: jobTitle,
    job_id: job.id,
  });

  await job.updateProgress(70);

  // ── Paso 5: Enviar el CV por email ───────────────────────────────────────
  console.log(`[Worker] Paso 5/6: Enviando CV a ${companyEmail}...`);

  const emailResult = await sendCVEmail(
    companyEmail,
    {
      userName: userProfile.full_name,
      userEmail: userProfile.email,
      userPhone: userProfile.phone,
      userLinkedIn: userProfile.linkedin_url,
      cvHtmlSection: buildCVHtmlSection(cvDocument.form_data),
    },
    coverLetter,
    subjectLine,
    companyName
  );

  if (!emailResult.success) {
    // Actualizamos el estado a fallido en Supabase
    if (recordId) {
      await updateSendStatus(job.id!, "fallido", emailResult.error);
    }
    throw new Error(`Error enviando email a ${companyEmail}: ${emailResult.error}`);
  }

  await job.updateProgress(85);

  // ── Paso 6: Actualizar estado y notificar al usuario ─────────────────────
  console.log(`[Worker] Paso 6/6: Actualizando estado y notificando al usuario...`);

  // Actualizar estado en Supabase a "enviado"
  if (recordId) {
    await updateSendStatus(job.id!, "enviado");
  }

  // Enviar confirmación al usuario
  await sendConfirmationToUser(
    userProfile.email,
    userProfile.full_name,
    companyName,
    jobTitle
  );

  // Añadir notificación a la cola de notificaciones
  const notificacion: NotificationJobData = {
    userId,
    type: "cv_sent",
    message: `Tu CV fue enviado correctamente a ${companyName}${jobTitle ? ` para el puesto de ${jobTitle}` : ""}.`,
    companyName,
    jobId: job.id,
  };
  await addNotificationJob(notificacion);

  await job.updateProgress(100);

  console.log(`[Worker] ✅ Job ${job.id} completado: CV de ${userProfile.full_name} enviado a ${companyName}`);
}

// ─── Helpers: generar contenido del CV ───────────────────────────────────────

function buildCVTextSummary(form: Record<string, unknown>): string {
  const lines: string[] = [];
  const nombre = `${form.nombre || ""} ${form.apellidos || ""}`.trim();
  if (nombre) lines.push(`Candidato: ${nombre}`);
  if (form.ciudad) lines.push(`Ciudad: ${form.ciudad}`);
  if (form.subtitulo) lines.push(`Perfil: ${form.subtitulo}`);
  if (form.perfilProfesional) lines.push(`Resumen: ${form.perfilProfesional}`);
  if (form.aptitudes) lines.push(`Habilidades: ${form.aptitudes}`);
  if (Array.isArray(form.experiencia)) {
    const exp = form.experiencia as Array<Record<string, unknown>>;
    exp.slice(0, 3).forEach(e => {
      lines.push(`Exp: ${e.puesto || ""} en ${e.empresa || ""} (${e.fechas || ""})`);
    });
  }
  return lines.join("\n");
}

function buildCVHtmlSection(form: Record<string, unknown>): string {
  const nombre = `${form.nombre || ""} ${form.apellidos || ""}`.trim();
  const rows: string[] = [];

  const addRow = (label: string, value: unknown) => {
    if (value && String(value).trim()) {
      rows.push(`<tr><td style="color:#64748b;font-size:12px;padding:3px 8px 3px 0;width:100px;vertical-align:top;">${label}</td><td style="color:#1e293b;font-size:13px;padding:3px 0;">${String(value)}</td></tr>`);
    }
  };

  if (nombre) rows.push(`<tr><td colspan="2" style="padding:0 0 8px;"><strong style="font-size:15px;color:#1e293b;">${nombre}</strong></td></tr>`);
  addRow("Subtítulo", form.subtitulo);
  addRow("Ciudad", form.ciudad);
  addRow("Teléfono", form.telefono);
  addRow("Email", form.email);

  if (form.perfilProfesional) {
    rows.push(`<tr><td colspan="2" style="padding:10px 0 4px;"><strong style="color:#1e293b;font-size:12px;">PERFIL</strong></td></tr>`);
    rows.push(`<tr><td colspan="2" style="color:#374151;font-size:13px;padding-bottom:8px;">${form.perfilProfesional}</td></tr>`);
  }

  if (Array.isArray(form.experiencia) && form.experiencia.length > 0) {
    rows.push(`<tr><td colspan="2" style="padding:8px 0 4px;"><strong style="color:#1e293b;font-size:12px;">EXPERIENCIA</strong></td></tr>`);
    (form.experiencia as Array<Record<string, unknown>>).forEach(e => {
      rows.push(`<tr><td colspan="2" style="padding:2px 0;color:#374151;font-size:13px;"><strong>${e.puesto || ""}</strong> — ${e.empresa || ""}<span style="color:#64748b;"> (${e.fechas || ""})</span></td></tr>`);
      if (e.descripcion) rows.push(`<tr><td colspan="2" style="color:#64748b;font-size:12px;padding:0 0 6px 0;">${e.descripcion}</td></tr>`);
    });
  }

  if (form.aptitudes) {
    rows.push(`<tr><td colspan="2" style="padding:8px 0 4px;"><strong style="color:#1e293b;font-size:12px;">HABILIDADES</strong></td></tr>`);
    rows.push(`<tr><td colspan="2" style="color:#374151;font-size:13px;">${form.aptitudes}</td></tr>`);
  }

  return `<table style="width:100%;border-collapse:collapse;">${rows.join("")}</table>`;
}

// ─── Creación del Worker ─────────────────────────────────────────────────────

/**
 * Concurrencia del worker: cuántos jobs puede procesar simultáneamente.
 * Configurable con la variable de entorno WORKER_CONCURRENCY.
 * Valor por defecto: 1 (conservador para no sobrecargar el servidor)
 */
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY ?? "1");

/**
 * El worker principal de BullMQ.
 * Escucha la cola "cv-sender-queue" y procesa jobs con la función processCVJob.
 */
export const cvWorker = new Worker(
  "cv-sender-queue",
  processCVJob,
  {
    connection: redisConnection,
    concurrency: CONCURRENCY,
    // Limitar la frecuencia de sondeo para no sobrecargar Redis
    stalledInterval: 30_000, // Cada 30s revisa si hay jobs bloqueados
    maxStalledCount: 2, // Si un job se bloquea más de 2 veces, lo falla
  }
);

// ─── Eventos del Worker ───────────────────────────────────────────────────────

/** Se dispara cuando un job se completa correctamente */
cvWorker.on("completed", (job: Job<CVJobData>) => {
  console.log(`[Worker] ✅ Job completado: ${job.id} | Empresa: ${job.data.companyName}`);
});

/** Se dispara cuando un job falla (después de todos los reintentos) */
cvWorker.on("failed", (job: Job<CVJobData> | undefined, error: Error) => {
  console.error(`[Worker] ❌ Job fallido: ${job?.id} | Empresa: ${job?.data?.companyName} | Error: ${error.message}`);
});

/** Se dispara cuando el worker no puede procesar un job (error del propio worker) */
cvWorker.on("error", (error: Error) => {
  console.error(`[Worker] Error en el worker:`, error.message);
});

/** Se dispara cuando un job empieza a procesarse */
cvWorker.on("active", (job: Job<CVJobData>) => {
  console.log(`[Worker] 🔄 Procesando job: ${job.id} | Usuario: ${job.data.userId} | Empresa: ${job.data.companyName}`);
});

export { processCVJob };
