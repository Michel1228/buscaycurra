"use client";

import { useState, useRef, useEffect } from "react";

interface SendTarget {
  empresa: string;
  titulo: string;
  url: string;
  email?: string;
}

interface ChatSendPanelProps {
  target: SendTarget;
  userId: string;
  sessionToken: string;
  onClose: () => void;
  onSent: (msg: string) => void;
}

type Strategy = "ahora" | "optimo" | "personalizada";

export default function ChatSendPanel({ target, userId, sessionToken, onClose, onSent }: ChatSendPanelProps) {
  const [carta, setCarta] = useState("");
  const [cartaEditada, setCartaEditada] = useState("");
  const [generando, setGenerando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [strategy, setStrategy] = useState<Strategy>("optimo");
  const [fechaPersonalizada, setFechaPersonalizada] = useState("");
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // Generar carta al montar
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cv-sender/preview-carta", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            companyName: target.empresa,
            jobTitle: target.titulo,
          }),
        });
        if (res.ok) {
          const data = await res.json() as { carta?: string };
          const texto = data.carta || "";
          setCarta(texto);
          setCartaEditada(texto);
        }
      } catch { /* sin preview, se envía igual */ }
      setGenerando(false);
    })();
  }, []);

  const handleSend = async () => {
    setEnviando(true);
    setError("");
    try {
      // Si no hay email en el target, intentar extraerlo
      let email = target.email || "";
      if (!email) {
        setError("Buscando email de la empresa...");
        try {
          const exRes = await fetch("/api/company/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: target.empresa }),
          });
          if (exRes.ok) {
            const exData = await exRes.json();
            const primera = (exData.empresas as { emailRrhh?: string }[])?.[0];
            if (primera?.emailRrhh) email = primera.emailRrhh;
          }
        } catch { /* ignorar */ }

        // Fallback: construir desde dominio de la URL
        if (!email && target.url) {
          try {
            const domain = new URL(target.url).hostname.replace(/^www\./, "");
            const jobBoards = ["adzuna", "jooble", "careerjet", "infojobs", "jobviewtrack", "indeed", "linkedin", "monster", "tecnoempleo"];
            if (!jobBoards.some(b => domain.includes(b))) {
              email = `empleo@${domain}`;
            }
          } catch { /* ignorar */ }
        }

        if (!email) {
          setError("No se encontró email para esta empresa. Usa el buscador de ofertas o pega la web de la empresa.");
          setEnviando(false);
          return;
        }
        setError("");
      }

      let scheduledFor: string | undefined;
      if (strategy === "personalizada" && fechaPersonalizada) {
        scheduledFor = new Date(fechaPersonalizada).toISOString();
      }

      const res = await fetch("/api/cv-sender/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          companyName: target.empresa,
          companyEmail: email,
          companyUrl: target.url,
          jobTitle: target.titulo,
          strategy,
          scheduledFor,
          useAIPersonalization: true,
          cartaPersonalizada: cartaEditada || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json() as { estimatedTimeFormatted?: string };
        onSent(`✅ **CV enviado a ${target.empresa}**\n\n📄 Carta personalizada por IA\n🕐 ${data.estimatedTimeFormatted || "Envío programado"}\n\nPuedes ver el estado en **Mis envíos**.`);
        onClose();
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setError(err.error || "Error al enviar. Verifica que tengas un CV subido.");
      }
    } catch {
      setError("Error de conexión al enviar el CV.");
    }
    setEnviando(false);
  };

  // Cerrar al hacer clic fuera
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  const minDatetime = now.toISOString().slice(0, 16);

  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(3px)" }}
    >
      <div
        ref={panelRef}
        className="w-full max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto"
        style={{ background: "#161922", border: "1px solid #2d3142" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10" style={{ background: "#161922", borderBottom: "1px solid #1e212b" }}>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Enviar CV a {target.empresa}</h3>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{target.titulo}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-xl" style={{ color: "#64748b" }}>✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Carta de presentación */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "#94a3b8" }}>
              📄 Carta de presentación {generando ? "(generando...)" : "(editable)"}
            </label>
            {generando ? (
              <div className="h-32 rounded-xl flex items-center justify-center" style={{ background: "#1e212b" }}>
                <span className="inline-flex gap-1" style={{ color: "#64748b" }}>
                  <span className="animate-bounce" style={{ fontSize: "18px" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms", fontSize: "18px" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms", fontSize: "18px" }}>·</span>
                </span>
              </div>
            ) : (
              <textarea
                value={cartaEditada}
                onChange={e => setCartaEditada(e.target.value)}
                rows={8}
                className="w-full rounded-xl p-3 text-sm resize-y"
                style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#e2e8f0", lineHeight: 1.6 }}
              />
            )}
          </div>

          {/* Estrategia de envío */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "#94a3b8" }}>
              ⏰ ¿Cuándo lo enviamos?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "optimo" as const, label: "🎯 Óptimo", sub: "Mejor momento" },
                { id: "ahora" as const, label: "⚡ Ya", sub: "1 minuto" },
                { id: "personalizada" as const, label: "📅 Elegir", sub: "Tú decides" },
              ]).map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStrategy(s.id)}
                  aria-pressed={strategy === s.id}
                  className="py-2 px-2 rounded-lg text-center transition"
                  style={{
                    background: strategy === s.id ? "rgba(34,197,94,0.1)" : "#1e212b",
                    border: strategy === s.id ? "1.5px solid rgba(34,197,94,0.3)" : "1px solid #252836",
                  }}
                >
                  <div className="text-[11px] font-semibold" style={{ color: strategy === s.id ? "#22c55e" : "#94a3b8" }}>{s.label}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: "#6b7280" }}>{s.sub}</div>
                </button>
              ))}
            </div>
            {strategy === "personalizada" && (
              <input
                type="datetime-local"
                value={fechaPersonalizada}
                onChange={e => setFechaPersonalizada(e.target.value)}
                min={minDatetime}
                className="w-full rounded-lg px-3 py-2 text-sm mt-2"
                style={{ background: "#1e212b", border: "1px solid #252836", color: "#f1f5f9" }}
              />
            )}
          </div>

          {error && (
            <div className="rounded-lg p-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <p className="text-xs font-medium" style={{ color: "#ef4444" }}>{error}</p>
            </div>
          )}

          {/* Botón enviar */}
          <button
            onClick={handleSend}
            disabled={enviando || generando || (strategy === "personalizada" && !fechaPersonalizada)}
            className="w-full py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            style={{
              background: (enviando || generando) ? "#252836" : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: (enviando || generando) ? "#64748b" : "#fff",
            }}
          >
            {enviando ? "Enviando..." : generando ? "Generando carta..." : `Enviar CV a ${target.empresa}`}
          </button>
        </div>
      </div>
    </div>
  );
}
