"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { isNativeIOS } from "@/lib/utils/platform";
import { Mic, Lock, RefreshCw, Lightbulb } from "lucide-react";

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
  const [bloqueado, setBloqueado] = useState(false);
  const [errorVoz, setErrorVoz] = useState("");
  const [esIOS, setEsIOS] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setSoporteVoz(!!SR);
      setEsIOS(isNativeIOS() || /iPad|iPhone|iPod/.test(navigator.userAgent));
    }
  }, []);

  // Liberar al desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ok */ }
      }
    };
  }, []);

  const iniciarReconocimiento = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    setErrorVoz("");
    setBloqueado(false);

    const r = new SR();
    r.lang = "es-ES";
    r.interimResults = true;
    r.continuous = true;
    r.maxAlternatives = 1;

    let final = "";
    r.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript + " ";
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      onChange((final + interim).trim());
    };

    r.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setBloqueado(true);
        setErrorVoz("Micrófono bloqueado. Sigue las instrucciones de abajo.");
      } else if (e.error === "no-speech") {
        setErrorVoz("No se detectó voz. Pulsa el botón e intenta de nuevo.");
      } else if (e.error === "network") {
        setErrorVoz("Error de red. Comprueba tu conexión e inténtalo de nuevo.");
      } else if (e.error !== "aborted") {
        setErrorVoz(`Error: ${e.error}. Escribe tu respuesta arriba.`);
      }
      setEscuchando(false);
    };

    r.onend = () => setEscuchando(false);

    recognitionRef.current = r;
    try {
      r.start();
      setEscuchando(true);
    } catch {
      setErrorVoz("No se pudo iniciar el micrófono. Escribe tu respuesta arriba.");
    }
  }, [onChange]);

  const toggleVoz = useCallback(() => {
    if (escuchando) {
      recognitionRef.current?.stop();
      setEscuchando(false);
      return;
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Directo a SpeechRecognition.start() — gestiona su propio permiso
    // No usamos getUserMedia primero: en iOS son permisos separados y
    // llamar getUserMedia antes provoca el ciclo de bloqueo/desbloqueo.
    iniciarReconocimiento();
  }, [escuchando, iniciarReconocimiento]);

  const desbloquear = useCallback(() => {
    setBloqueado(false);
    setErrorVoz("");
    // Intentar de nuevo directamente
    iniciarReconocimiento();
  }, [iniciarReconocimiento]);

  const instruccionesDesbloqueo = esIOS
    ? "En iPhone/iPad: Ajustes → Privacidad → Micrófono → BuscayCurra → Activar. Luego vuelve aquí."
    : "En Chrome: toca el candado en la barra de dirección → Permisos → Micrófono → Permitir. Recarga la página.";

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
      {/* Textarea siempre visible */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        disabled={disabled}
        className="w-full text-sm resize-none outline-none"
        style={{ background: "transparent", color: "#e5e7eb", border: "none" }}
      />

      {/* Botón de voz — solo si hay soporte y no está bloqueado */}
      {soporteVoz && !bloqueado && (
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
              <><Mic size={16} strokeWidth={1.8} />Responder con voz</>
            )}
          </button>
          {errorVoz && (
            <p className="text-xs" style={{ color: "#f87171" }}>{errorVoz}</p>
          )}
          {escuchando && (
            <p className="text-xs text-center" style={{ color: "#6b7280" }}>
              Habla claramente al micrófono...
            </p>
          )}
        </div>
      )}

      {/* Estado bloqueado — instrucciones claras por plataforma */}
      {soporteVoz && bloqueado && (
        <div className="space-y-3 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
          <div className="flex items-center gap-2">
            <Mic size={16} strokeWidth={1.8} style={{ color: "#f87171", flexShrink: 0 }} />
            <p className="text-xs font-semibold" style={{ color: "#f87171" }}>Micrófono bloqueado</p>
          </div>
          {esIOS ? (
            <ol className="text-xs space-y-1 pl-1" style={{ color: "#9ca3af" }}>
              <li>1. Ve a <strong style={{ color: "#e5e7eb" }}>Ajustes</strong> del iPhone</li>
              <li>2. Busca <strong style={{ color: "#e5e7eb" }}>Privacidad → Micrófono</strong></li>
              <li>3. Activa el interruptor de <strong style={{ color: "#e5e7eb" }}>BuscayCurra</strong></li>
              <li>4. Vuelve aquí y pulsa <strong style={{ color: "#e5e7eb" }}>Intentar de nuevo</strong></li>
            </ol>
          ) : (
            <ol className="text-xs space-y-1 pl-1" style={{ color: "#9ca3af" }}>
              <li>1. Toca el <strong style={{ color: "#e5e7eb" }}>candado <Lock size={11} strokeWidth={2} className="inline" /></strong> en la barra de dirección</li>
              <li>2. Selecciona <strong style={{ color: "#e5e7eb" }}>Permisos → Micrófono → Permitir</strong></li>
              <li>3. Pulsa <strong style={{ color: "#e5e7eb" }}>Recargar</strong> abajo</li>
            </ol>
          )}
          <div className="flex gap-2">
            {!esIOS && (
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2 rounded-xl text-xs font-medium transition"
                style={{ background: "#1e212b", color: "#94a3b8", border: "1px solid #2d3142" }}
              >
                <RefreshCw size={13} strokeWidth={2} className="inline mr-1" />Recargar página
              </button>
            )}
            <button
              onClick={desbloquear}
              className="flex-1 py-2 rounded-xl text-xs font-medium transition"
              style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              {esIOS ? "Ya activé el permiso" : "Intentar de nuevo"}
            </button>
          </div>
          <p className="text-[11px] text-center" style={{ color: "#475569" }}>
            También puedes escribir tu respuesta directamente arriba ↑
          </p>
        </div>
      )}

      {/* Sin soporte (Firefox, navegadores no compatibles) */}
      {!soporteVoz && (
        <p className="text-xs flex items-center gap-1" style={{ color: "#6b7280" }}>
          <Lightbulb size={12} strokeWidth={2} className="shrink-0" />Voz disponible en Chrome, Edge y Safari. Escribe tu respuesta en el recuadro de arriba.
        </p>
      )}
    </div>
  );
}
