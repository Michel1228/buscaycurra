"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AutoSendSetupProps {
  userId: string;
  onJobScheduled?: () => void;
}

export default function AutoSendSetup({ userId, onJobScheduled }: AutoSendSetupProps) {
  const router = useRouter();
  const [modo, setModo] = useState<"auto" | "manual">("auto");
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [useAI, setUseAI] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [scheduled, setScheduled] = useState<{ fecha: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!companyName.trim()) { setError("Introduce el nombre de la empresa"); return; }
    if (modo === "auto" && !companyEmail.trim()) { setError("Introduce el email de RRHH para envio automatico"); return; }
    if (modo === "auto" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail)) {
      setError("El email no parece valido"); return;
    }

    setLoading(true);
    try {
      if (modo === "manual") {
        const res = await fetch("/api/cv-sender/registrar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, companyName: companyName.trim(), jobTitle: jobTitle.trim() }),
        });
        const data = await res.json() as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Error al registrar");
      } else {
        const res = await fetch("/api/cv-sender/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            companyName: companyName.trim(),
            companyEmail: companyEmail.trim().toLowerCase(),
            companyUrl: companyUrl.trim() || undefined,
            jobTitle: jobTitle.trim() || undefined,
            priority: "normal",
            useAIPersonalization: useAI,
            frecuencia: "unico",
          }),
        });
        const data = await res.json() as { error?: string; estimatedTimeFormatted?: string };
        if (!res.ok) throw new Error(data.error ?? "Error al programar");
        setScheduled({ fecha: data.estimatedTimeFormatted ?? "" });
      }
      setSuccess(true);
      onJobScheduled?.();
      setCompanyName(""); setCompanyEmail(""); setCompanyUrl(""); setJobTitle("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card-game p-8 text-center space-y-4">
        <div className="text-5xl">{modo === "manual" ? "ok" : "ok"}</div>
        <h3 className="text-xl font-bold" style={{ color: "#7ed56f" }}>
          {modo === "manual" ? "Candidatura registrada!" : "CV programado para envio!"}
        </h3>
        {scheduled?.fecha && (
          <p className="text-sm" style={{ color: "#a8e6a1" }}>
            Se enviara el {scheduled.fecha}
          </p>
        )}
        <p className="text-xs" style={{ color: "#706a58" }}>
          Recibiras un email de confirmacion cuando se procese.
        </p>
        <div className="flex gap-3 justify-center mt-4">
          <button onClick={() => { setSuccess(false); setScheduled(null); }}
            className="px-5 py-2 rounded-xl text-sm font-semibold"
            style={{ border: "1px solid #3d3c30", color: "#b0a890" }}>
            + Otro envio
          </button>
          <button onClick={() => router.push("/app/envios")}
            className="btn-game px-5 py-2 text-sm">
            Ver mis envios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-game p-6">
      <h2 className="text-lg font-bold mb-1" style={{ color: "#f0ebe0" }}>Enviar candidatura</h2>
      <p className="text-sm mb-5" style={{ color: "#706a58" }}>
        Envia tu CV automaticamente o registra que ya aplicaste por la web de la empresa.
      </p>

      <div className="flex gap-3 mb-6">
        {([
          { id: "auto" as const, title: "Envio automatico", sub: "Tengo el email de RRHH" },
          { id: "manual" as const, title: "Solo registrar", sub: "Aplique por la web" },
        ]).map(m => (
          <button key={m.id} type="button" onClick={() => setModo(m.id)}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition text-left"
            style={{
              background: modo === m.id ? "rgba(126,213,111,0.12)" : "rgba(42,42,30,0.5)",
              border: modo === m.id ? "2px solid rgba(126,213,111,0.4)" : "1px solid #3d3c30",
              color: modo === m.id ? "#7ed56f" : "#706a58",
            }}>
            <div className="font-bold mb-0.5">{m.title}</div>
            <div className="text-xs opacity-70">{m.sub}</div>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-sm font-medium" style={{ color: "#f87171" }}>{error}</p>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
            Empresa <span style={{ color: "#f87171" }}>*</span>
          </label>
          <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
            placeholder="ej: Mercadona, Telefonica, Bar El Rincon..." className="input-game w-full" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
            Puesto <span className="font-normal text-xs" style={{ color: "#504a3a" }}>(opcional)</span>
          </label>
          <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
            placeholder="ej: Camarero, Electricista, Administrativo..." className="input-game w-full" />
        </div>

        {modo === "auto" && (
          <>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                Email de RRHH <span style={{ color: "#f87171" }}>*</span>
              </label>
              <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)}
                placeholder="rrhh@empresa.com" className="input-game w-full" />
              <p className="text-xs mt-1.5" style={{ color: "#504a3a" }}>
                No lo tienes?{" "}
                <button type="button" onClick={() => router.push("/app/empresas")}
                  className="underline" style={{ color: "#7ed56f" }}>
                  Buscalo automaticamente
                </button>
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                Web de la empresa{" "}
                <span className="font-normal text-xs" style={{ color: "#504a3a" }}>(mejora la carta IA)</span>
              </label>
              <input type="url" value={companyUrl} onChange={e => setCompanyUrl(e.target.value)}
                placeholder="https://www.empresa.com" className="input-game w-full" />
            </div>

            <div className="flex items-start gap-3 rounded-xl p-4"
              style={{ background: "rgba(126,213,111,0.06)", border: "1px solid rgba(126,213,111,0.12)" }}>
              <input id="useAI" type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-green-500 cursor-pointer" />
              <div>
                <label htmlFor="useAI" className="text-sm font-semibold cursor-pointer" style={{ color: "#a8e6a1" }}>
                  Personalizar carta con IA
                </label>
                <p className="text-xs mt-0.5" style={{ color: "#706a58" }}>
                  La IA adapta la carta a esta empresa. Aumenta mucho las respuestas.
                </p>
              </div>
            </div>
          </>
        )}

        {modo === "manual" && (
          <div className="rounded-xl p-4" style={{ background: "rgba(126,213,111,0.06)", border: "1px solid rgba(126,213,111,0.12)" }}>
            <p className="text-sm" style={{ color: "#a8e6a1" }}>
              Se guardara en tus envios para hacer seguimiento. No se enviara ningun email automatico a la empresa.
            </p>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3.5 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
          style={{
            background: loading ? "#3d3c30" : "linear-gradient(135deg, #7ed56f, #5cb848)",
            color: loading ? "#706a58" : "#1a1a12",
            boxShadow: loading ? "none" : "0 4px 16px rgba(126,213,111,0.25)",
          }}>
          {loading
            ? "Procesando..."
            : modo === "auto" ? "Enviar CV automaticamente" : "Registrar candidatura"}
        </button>
      </form>
    </div>
  );
}
