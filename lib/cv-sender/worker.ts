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
import { getRedisConnection, CVJobData } from "./queue";
import { personalizeForCompany } from "./cv-personalizer";
import { sendCVEmail, sendConfirmationToUser } from "./email-sender";
import { recordSent, updateSendStatus } from "./tracker";
import { getPool } from "../db";
import { normalizar } from "../cv-generator/normalizar";
import { generarCVHTML } from "../cv-generator/cv-template";
import { generateCVPdf } from "../cv-generator/generate-pdf";

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

// ─── Función Principal: processCVJob ─────────────────────────────────────────

/**
 * Procesa un job de envío de CV.
 * Esta es la función principal que ejecuta el worker por cada trabajo.
 *
 * @param job - Job de BullMQ con todos los datos del envío
 */
async function processCVJob(job: Job<CVJobData>): Promise<void> {
  // Garantizar que el job tiene ID antes de procesar (evita que updateSendStatus sin filtro actualice todo)
  if (!job.id) {
    console.error("[Worker] Job sin ID asignado — abortando procesamiento");
    throw new Error("Job sin ID asignado");
  }
  const jobId = job.id;

  const { userId, companyName, companyEmail, companyUrl, jobTitle, useAIPersonalization } = job.data;

  console.log(`[Worker] Procesando job ${job.id}: ${userId} → ${companyName} (${companyEmail})`);

  // Actualizamos el progreso del job (visible en el dashboard)
  await job.updateProgress(10);

  // ── Paso 1: Obtener perfil y CV del usuario ──────────────────────────────
  console.log(`[Worker] Paso 1/6: Obteniendo datos del usuario ${userId}...`);

  const profileResult = await getSupabase()
    .from("profiles")
    .select("id, full_name, email, phone, linkedin_url")
    .eq("id", userId)
    .single();

  if (profileResult.error || !profileResult.data) {
    throw new Error(`No se encontró el perfil del usuario ${userId}: ${profileResult.error?.message}`);
  }

  const userProfile = profileResult.data as UserProfile;

  await job.updateProgress(25);

  // ── Paso 2: Generar PDF de plantilla (o descargar raw como fallback) ─────
  console.log(`[Worker] Paso 2/6: Generando PDF de plantilla para ${userId}...`);
  let cvBuffer: Buffer;
  let cvFileName = `CV_BuscayCurra_${userProfile.full_name.replace(/\s+/g, "_")}.pdf`;

  try {
    const pool = getPool();
    const cvDataResult = await pool.query(
      `SELECT form_data FROM user_cvs WHERE user_id = $1`,
      [userId]
    );

    if (!cvDataResult.rows.length || !cvDataResult.rows[0].form_data) {
      throw new Error("Sin datos de formulario en user_cvs");
    }

    const rawData = typeof cvDataResult.rows[0].form_data === "string"
      ? JSON.parse(cvDataResult.rows[0].form_data)
      : cvDataResult.rows[0].form_data;

    const cvData = normalizar(rawData);
    const html = generarCVHTML(cvData);
    cvBuffer = await generateCVPdf(html);
    console.log(`[Worker] ✅ PDF de plantilla generado para ${userId}`);
  } catch (templateErr) {
    console.warn(`[Worker] Plantilla no disponible, usando CV subido:`, (templateErr as Error).message);

    const cvPath = `${userId}/cv.pdf`;
    const { data: cvFiles } = await getSupabase().storage.from("cvs").list(userId, { limit: 1, search: "cv.pdf" });
    if (!cvFiles || cvFiles.length === 0) {
      throw new Error(`El usuario ${userId} no tiene CV subido ni datos de formulario.`);
    }

    const { data: signedUrlData } = await getSupabase().storage.from("cvs").createSignedUrl(cvPath, 3600);
    if (!signedUrlData?.signedUrl) {
      throw new Error(`No se pudo obtener URL firmada del CV de ${userId}`);
    }

    const cvResponse = await fetch(signedUrlData.signedUrl);
    if (!cvResponse.ok) {
      throw new Error(`No se pudo descargar el CV: ${cvResponse.statusText}`);
    }
    cvBuffer = Buffer.from(await cvResponse.arrayBuffer());
    cvFileName = `CV_${userProfile.full_name.replace(/\s+/g, "_")}.pdf`;
  }

  await job.updateProgress(40);

  // ── Paso 3: Personalizar con OpenClaw IA ────────────────────────────────
  let coverLetter: string;
  let subjectLine: string;

  if (useAIPersonalization) {
    console.log(`[Worker] Paso 3/6: Personalizando carta con OpenClaw IA para ${companyName}...`);

    try {
      const personalizacion = await personalizeForCompany(
        "",
        { name: companyName, url: companyUrl },
        jobTitle
      );
      coverLetter = personalizacion.coverLetter;
      subjectLine = personalizacion.subjectLine;
    } catch (aiError) {
      console.warn(`[Worker] OpenClaw IA no disponible, usando carta genérica:`, (aiError as Error).message);
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
    job_id: jobId,
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
      cvPdfBuffer: cvBuffer,
      cvFileName: cvFileName,
    },
    coverLetter,
    subjectLine,
    companyName
  );

  if (!emailResult.success) {
    // Actualizamos el estado a fallido en Supabase
    if (recordId) {
      await updateSendStatus(jobId, "fallido", emailResult.error);
    }
    throw new Error(`Error enviando email a ${companyEmail}: ${emailResult.error}`);
  }

  await job.updateProgress(85);

  // ── Paso 6: Actualizar estado y notificar al usuario ─────────────────────
  console.log(`[Worker] Paso 6/6: Actualizando estado y notificando al usuario...`);

  // Actualizar estado en Supabase a "enviado"
  if (recordId) {
    await updateSendStatus(jobId, "enviado");
  }

  // Enviar confirmación al usuario
  await sendConfirmationToUser(
    userProfile.email,
    userProfile.full_name,
    companyName,
    jobTitle
  );

  // Insertar notificación directamente en Supabase (la cola de notificaciones no tiene worker)
  try {
    await getSupabase().from("notificaciones").insert({
      user_id: userId,
      tipo: "cv_enviado",
      titulo: `📧 CV enviado a ${companyName}`,
      mensaje: `Tu CV fue enviado correctamente a ${companyName}${jobTitle ? ` para el puesto de ${jobTitle}` : ""}.`,
      datos: { companyName, jobId },
      leida: false,
    });
  } catch (notifErr) {
    console.warn("[Worker] No se pudo crear notificación:", (notifErr as Error).message);
  }

  await job.updateProgress(100);

  console.log(`[Worker] ✅ Job ${job.id} completado: CV de ${userProfile.full_name} enviado a ${companyName}`);
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
    connection: getRedisConnection(),
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
