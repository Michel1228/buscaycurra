"use client";

/**
 * AutoSendSetup.tsx — Formulario de envío automático de CV
 * Tema: Bosque Encantado (oscuro)
 * Frecuencia: cada 4-5 días (no diario)
 */

import { useState } from "react";

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

interface AutoSendSetupProps {
  userId: string;
  onJobScheduled?: (result: ScheduleSuccess) => void;
}

export default function AutoSendSetup({ userId, onJobScheduled }: AutoSendSetupProps) {
  const [companyUrl, setCompanyUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [priority, setPriority] = useState<"normal" | "prioritario">("normal");
  const [useAI, setUseAI] = useState(true);
  const [frecuencia, setFrecuencia] = useState<"unico" | "cada4dias">("cada4dias");
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ScheduleSuccess | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail)) {
      setError("Introduce un email de empresa válido (ej: rrhh@empresa.com)");
      return;
    }
    if (!companyName.trim()) {
      setError("Introduce el nombre de la empresa");
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
          frecuencia,
        }),
      });

      const data = await response.json() as ScheduleSuccess & { error?: string };
      if (!response.ok || data.error) throw new Error(data.error ?? "Error al programar");

      setSuccess(data);
      onJobScheduled?.(data);
      setCompanyUrl(""); setCompanyName(""); setCompanyEmail(""); setJobTitle("");
      setPriority("normal"); setShowPreview(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-game p-6">
      <h2 className="text-lg font-bold mb-1" style={{ color: "#f0ebe0" }}>📧 Programar envío de CV</h2>
      <p className="text-sm mb-6" style={{ color: "#706a58" }}>
        Tu CV se envía automáticamente en horario laboral con carta personalizada por IA.
      </p>

      {success && (
        <div className="mb-6 rounded-xl p-5" style={{ background: "rgba(126,213,111,0.1)", border: "1px solid rgba(126,213,111,0.2)" }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold" style={{ color: "#7ed56f" }}>¡Envío programado!</p>
              <p className="text-sm mt-1" style={{ color: "#a8e6a1" }}>📅 {success.estimatedTimeFormatted}</p>
              <p className="text-sm" style={{ color: "#a8e6a1" }}>📋 Cola: #{success.positionInQueue}</p>
              <p className="text-xs mt-2" style={{ color: "#706a58" }}>ID: {success.jobId}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-sm font-medium" style={{ color: "#f87171" }}>❌ {error}</p>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        {/* Nombre empresa */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
            Empresa <span style={{ color: "#f87171" }}>*</span>
          </label>
          <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
            placeholder="ej: Telefónica España" required className="w-full" />
        </div>

        {/* Email RRHH */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
            Email de RRHH <span style={{ color: "#f87171" }}>*</span>
          </label>
          <input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)}
            placeholder="rrhh@empresa.com" required className="w-full" />
          <p className="text-xs mt-1" style={{ color: "#504a3a" }}>Búscalo en "Trabaja con nosotros"</p>
        </div>

        {/* URL empresa */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
            Web <span className="font-normal" style={{ color: "#504a3a" }}>(mejora la personalización IA)</span>
          </label>
          <input type="url" value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)}
            placeholder="https://www.empresa.com" className="w-full" />
        </div>

        {/* Puesto */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
            Puesto <span className="font-normal" style={{ color: "#504a3a" }}>(opcional)</span>
          </label>
          <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
            placeholder="ej: Camarero, Electricista..." className="w-full" />
        </div>

        {/* Frecuencia de envío */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#b0a890" }}>📅 Frecuencia</label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setFrecuencia("unico")}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition"
              style={{
                background: frecuencia === "unico" ? "rgba(126,213,111,0.15)" : "rgba(42,42,30,0.5)",
                border: frecuencia === "unico" ? "2px solid rgba(126,213,111,0.4)" : "1px solid #3d3c30",
                color: frecuencia === "unico" ? "#7ed56f" : "#706a58",
              }}>
              📧 Envío único
            </button>
            <button type="button" onClick={() => setFrecuencia("cada4dias")}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition"
              style={{
                background: frecuencia === "cada4dias" ? "rgba(126,213,111,0.15)" : "rgba(42,42,30,0.5)",
                border: frecuencia === "cada4dias" ? "2px solid rgba(126,213,111,0.4)" : "1px solid #3d3c30",
                color: frecuencia === "cada4dias" ? "#7ed56f" : "#706a58",
              }}>
              🔄 Cada 4-5 días
            </button>
          </div>
          {frecuencia === "cada4dias" && (
            <p className="text-xs mt-2" style={{ color: "#7ed56f" }}>
              🔄 Tu CV se enviará automáticamente cada 4-5 días a nuevas empresas del sector
            </p>
          )}
        </div>

        {/* Urgencia */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#b0a890" }}>⚡ Urgencia</label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setPriority("normal")}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition"
              style={{
                background: priority === "normal" ? "rgba(126,213,111,0.15)" : "rgba(42,42,30,0.5)",
                border: priority === "normal" ? "2px solid rgba(126,213,111,0.4)" : "1px solid #3d3c30",
                color: priority === "normal" ? "#7ed56f" : "#706a58",
              }}>
              🕒 Normal
            </button>
            <button type="button" onClick={() => setPriority("prioritario")}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition"
              style={{
                background: priority === "prioritario" ? "rgba(240,192,64,0.15)" : "rgba(42,42,30,0.5)",
                border: priority === "prioritario" ? "2px solid rgba(240,192,64,0.4)" : "1px solid #3d3c30",
                color: priority === "prioritario" ? "#f0c040" : "#706a58",
              }}>
              ⚡ Prioritario
            </button>
          </div>
        </div>

        {/* IA toggle */}
        <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: "rgba(126,213,111,0.06)", border: "1px solid rgba(126,213,111,0.12)" }}>
          <input id="useAI" type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-green-500 cursor-pointer" />
          <div>
            <label htmlFor="useAI" className="text-sm font-semibold cursor-pointer" style={{ color: "#a8e6a1" }}>
              ✨ Personalizar carta con IA
            </label>
            <p className="text-xs mt-0.5" style={{ color: "#706a58" }}>
              La IA analiza la empresa y adapta tu carta. Aumenta mucho las respuestas.
            </p>
          </div>
        </div>

        {/* Preview */}
        <button type="button" onClick={() => setShowPreview(!showPreview)}
          className="text-sm font-medium flex items-center gap-1" style={{ color: "#7ed56f" }}>
          {showPreview ? "▲ Ocultar" : "▼ Ver"} vista previa
        </button>
        {showPreview && (
          <div className="rounded-xl p-5 space-y-2 text-sm" style={{ background: "rgba(42,42,30,0.5)", border: "1px solid #3d3c30" }}>
            <p className="font-semibold" style={{ color: "#b0a890" }}>Vista previa:</p>
            <div className="space-y-1" style={{ color: "#706a58" }}>
              <p><span style={{ color: "#504a3a" }}>Para:</span> {companyEmail || "rrhh@empresa.com"}</p>
              <p><span style={{ color: "#504a3a" }}>Asunto:</span>{" "}
                {jobTitle ? `Candidatura: ${jobTitle}` : `Candidatura — ${companyName || "Tu Nombre"}`}
              </p>
              <p><span style={{ color: "#504a3a" }}>Adjunto:</span>{" "}
                <span style={{ color: "#7ed56f" }}>📎 Tu_CV.pdf</span>
              </p>
              <hr style={{ borderColor: "#3d3c30" }} />
              <p className="text-xs italic" style={{ color: "#706a58" }}>
                {useAI ? "✨ Carta personalizada por IA para esta empresa." : "📝 Carta genérica profesional."}
              </p>
              <p className="text-xs" style={{ color: "#504a3a" }}>
                📅 Envío en horario laboral (lun-vie 9:00-18:00 España)
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full py-3.5 px-6 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
          style={{
            background: loading ? "#3d3c30" : "linear-gradient(135deg, #7ed56f, #5cb848)",
            color: loading ? "#706a58" : "#1a1a12",
            boxShadow: loading ? "none" : "0 4px 16px rgba(126,213,111,0.25)",
          }}>
          {loading ? (
            <><span className="animate-spin">⏳</span> Programando...</>
          ) : (
            <>📧 {frecuencia === "cada4dias" ? "Activar envío automático" : "Programar envío"}</>
          )}
        </button>

        <p className="text-xs text-center" style={{ color: "#504a3a" }}>
          {frecuencia === "cada4dias"
            ? "🔄 Se enviarán CVs cada 4-5 días a empresas del sector en horario laboral."
            : "📅 Se enviará una vez en horario laboral español (lun-vie 9:00-18:00)."}
        </p>
      </form>
    </div>
  );
}
