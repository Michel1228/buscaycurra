"use client";

/**
 * AutoSendSetup.tsx — Formulario de configuración del envío automático de CV
 *
 * Permite al usuario:
 *   - Introducir la URL de la empresa destino
 *   - Especificar el puesto al que aplica (opcional)
 *   - Elegir la urgencia (normal o prioritario)
 *   - Activar/desactivar la personalización con IA
 *   - Ver una vista previa del email antes de enviar
 *   - Programar el envío con un clic
 *
 * Colores de marca:
 *   - Azul: #2563EB
 *   - Naranja: #F97316
 */

import { useState } from "react";

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Resultado exitoso al programar un envío */
interface ScheduleSuccess {
  jobId: string;
  estimatedTime: string;
  estimatedTimeFormatted: string;
  positionInQueue: number;
  estimatedWaitMinutes: number;
  rateLimitInfo: {
    enviadosHoy: number;
    limiteHoy: number;
    cvsRestantesHoy: number;
    userPlan: string;
  };
}

/** Props del componente */
interface AutoSendSetupProps {
  userId: string;
  onJobScheduled?: (result: ScheduleSuccess) => void;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function AutoSendSetup({ userId, onJobScheduled }: AutoSendSetupProps) {
  // ── Estado del formulario ──────────────────────────────────────────────
  const [companyUrl, setCompanyUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [priority, setPriority] = useState<"normal" | "prioritario">("normal");
  const [useAI, setUseAI] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // ── Estado de la petición ──────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ScheduleSuccess | null>(null);

  // ── Enviar el formulario ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validación básica del email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(companyEmail)) {
      setError("Por favor introduce un email de empresa válido (ej: rrhh@empresa.com)");
      return;
    }

    if (!companyName.trim()) {
      setError("Por favor introduce el nombre de la empresa");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/cv-sender/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          companyUrl: companyUrl.trim() || undefined,
          companyEmail: companyEmail.trim().toLowerCase(),
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim() || undefined,
          priority,
          useAIPersonalization: useAI,
        }),
      });

      const data = await response.json() as ScheduleSuccess & { error?: string };

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Error al programar el envío");
      }

      setSuccess(data);
      onJobScheduled?.(data);

      // Limpiar el formulario después del éxito
      setCompanyUrl("");
      setCompanyName("");
      setCompanyEmail("");
      setJobTitle("");
      setPriority("normal");
      setShowPreview(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ── Vista previa del email ─────────────────────────────────────────────
  const emailPreview = (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-2 text-sm">
      <p className="font-semibold text-gray-700">Vista previa del email:</p>
      <div className="space-y-1 text-gray-600">
        <p><span className="text-gray-400 w-16 inline-block">Para:</span> {companyEmail || "rrhh@empresa.com"}</p>
        <p>
          <span className="text-gray-400 w-16 inline-block">Asunto:</span>{" "}
          {jobTitle
            ? `Candidatura para ${jobTitle} — Tu Nombre`
            : `Candidatura espontánea — ${companyName || "Tu Nombre"}`}
        </p>
        <p>
          <span className="text-gray-400 w-16 inline-block">Adjunto:</span>{" "}
          <span className="text-blue-600">📎 CV_Tu_Nombre.pdf</span>
        </p>
        <hr className="border-gray-200" />
        <p className="text-gray-500 italic text-xs">
          {useAI
            ? "✨ La carta de presentación será personalizada por OpenClaw IA para esta empresa específica."
            : "📝 Se usará una carta de presentación genérica profesional."}
        </p>
        <p className="text-gray-500 text-xs">
          📅 Envío programado en horario laboral (lun-vie 9:00-18:00, zona horaria España)
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Programar envío de CV</h2>
      <p className="text-sm text-gray-500 mb-6">
        Tu CV se enviará automáticamente en horario laboral español con una carta personalizada.
      </p>

      {/* ── Mensaje de éxito ──────────────────────────────────────────── */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">¡Envío programado correctamente!</p>
              <p className="text-sm text-green-700 mt-1">
                📅 Fecha estimada: <strong>{success.estimatedTimeFormatted}</strong>
              </p>
              <p className="text-sm text-green-700">
                📋 Posición en cola: <strong>#{success.positionInQueue}</strong>
              </p>
              <p className="text-xs text-green-600 mt-2">
                ID del envío: {success.jobId}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Mensaje de error ──────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm font-medium">❌ {error}</p>
        </div>
      )}

      {/* ── Formulario ────────────────────────────────────────────────── */}
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">

        {/* Nombre de la empresa */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nombre de la empresa <span className="text-red-500">*</span>
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="ej: Telefónica España"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Email de RRHH */}
        <div>
          <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email de RRHH de la empresa <span className="text-red-500">*</span>
          </label>
          <input
            id="companyEmail"
            type="email"
            value={companyEmail}
            onChange={(e) => setCompanyEmail(e.target.value)}
            placeholder="ej: rrhh@empresa.com o empleo@empresa.es"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <p className="text-xs text-gray-400 mt-1">
            Puedes encontrar el email en la sección &ldquo;Trabaja con nosotros&rdquo; de su web
          </p>
        </div>

        {/* URL de la empresa (opcional) */}
        <div>
          <label htmlFor="companyUrl" className="block text-sm font-medium text-gray-700 mb-1.5">
            URL de la empresa{" "}
            <span className="text-gray-400 font-normal">(opcional, mejora la personalización)</span>
          </label>
          <input
            id="companyUrl"
            type="url"
            value={companyUrl}
            onChange={(e) => setCompanyUrl(e.target.value)}
            placeholder="https://www.empresa.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Puesto al que aplica (opcional) */}
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1.5">
            Puesto al que aplicas{" "}
            <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            id="jobTitle"
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="ej: Desarrollador Frontend, Diseñador UX..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <p className="text-xs text-gray-400 mt-1">
            Si no especificas, se enviará como candidatura espontánea
          </p>
        </div>

        {/* Urgencia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Urgencia
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPriority("normal")}
              className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition ${
                priority === "normal"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              🕒 Normal
            </button>
            <button
              type="button"
              onClick={() => setPriority("prioritario")}
              className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition ${
                priority === "prioritario"
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              ⚡ Prioritario
            </button>
          </div>
          {priority === "prioritario" && (
            <p className="text-xs text-orange-600 mt-1.5">
              ⚡ Tu envío irá al principio de la cola
            </p>
          )}
        </div>

        {/* Personalización con IA */}
        <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
          <input
            id="useAI"
            type="checkbox"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-blue-600 cursor-pointer"
          />
          <div>
            <label htmlFor="useAI" className="text-sm font-medium text-blue-900 cursor-pointer">
              ✨ Personalizar carta de presentación con OpenClaw IA
            </label>
            <p className="text-xs text-blue-700 mt-0.5">
              La IA analizará la empresa y adaptará tu carta destacando las skills más relevantes.
              Aumenta significativamente las posibilidades de respuesta.
            </p>
          </div>
        </div>

        {/* Vista previa */}
        <div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {showPreview ? "▲ Ocultar" : "▼ Ver"} vista previa del email
          </button>
          {showPreview && <div className="mt-3">{emailPreview}</div>}
        </div>

        {/* Botón enviar */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          style={{ backgroundColor: loading ? undefined : "#2563EB" }}
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              Programando envío...
            </>
          ) : (
            <>
              📧 Programar envío de CV
            </>
          )}
        </button>

        <p className="text-xs text-center text-gray-400">
          Tu CV se enviará en horario laboral español (lun-vie 9:00-18:00).<br />
          Recibirás un email de confirmación cuando se envíe.
        </p>
      </form>
    </div>
  );
}
