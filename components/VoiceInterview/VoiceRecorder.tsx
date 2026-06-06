"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;

interface VoiceRecorderProps {
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function VoiceRecorder({
  value,
  onChange,
  disabled = false,
  placeholder = "Escribe tu respuesta aquí...",
}: VoiceRecorderProps) {
  const [escuchando, setEscuchando] = useState(false);
  const [soporteVoz, setSoporteVoz] = useState(false);
  const [errorVoz, setErrorVoz] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SR) setSoporteVoz(true);
    }
  }, []);

  // Liberar micrófono al desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ok */ }
      }
    };
  }, []);

  const toggleVoz = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (escuchando) {
      recognitionRef.current?.stop();
      setEscuchando(false);
      return;
    }

    setErrorVoz("");
    const r = new SR();
    r.lang = "es-ES";
    r.interimResults = true;
    r.continuous = false;

    r.onresult = (e: any) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
      }
      onChange(t);
    };

    r.onerror = (e: any) => {
      const msg =
        e.error === "not-allowed"
          ? "Permiso de micrófono denegado."
          : e.error === "no-speech"
          ? "No se detectó voz. Inténtalo de nuevo."
          : `Error: ${e.error}`;
      setErrorVoz(msg);
      setEscuchando(false);
    };

    r.onend = () => setEscuchando(false);
    recognitionRef.current = r;
    r.start();
    setEscuchando(true);
  }, [escuchando, onChange]);

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
      {/* Textarea siempre visible como fallback */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        disabled={disabled}
        className="w-full text-sm resize-none outline-none"
        style={{
          background: "transparent",
          color: "#e5e7eb",
          border: "none",
        }}
      />

      {/* Botón de voz */}
      {soporteVoz && (
        <div className="space-y-2">
          <button
            onClick={toggleVoz}
            disabled={disabled}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
            style={{
              background: escuchando ? "#dc2626" : "#0f1117",
              color: escuchando ? "#fff" : "#10b981",
              border: `1px solid ${escuchando ? "#dc2626" : "#10b981"}`,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {escuchando ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                Escuchando... (pulsa para parar)
              </>
            ) : (
              <>🎤 Responder con voz</>
            )}
          </button>

          {errorVoz && (
            <p className="text-xs" style={{ color: "#f87171" }}>
              {errorVoz}
            </p>
          )}

          {escuchando && (
            <p className="text-xs text-center" style={{ color: "#6b7280" }}>
              Habla claramente al micrófono...
            </p>
          )}
        </div>
      )}

      {!soporteVoz && (
        <p className="text-xs" style={{ color: "#6b7280" }}>
          💡 Usa Chrome para responder con voz. Escribe tu respuesta en el
          recuadro de arriba.
        </p>
      )}
    </div>
  );
}
