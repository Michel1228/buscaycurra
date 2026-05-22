"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

// ─── Preguntas por sector ──────────────────────────────────────────
const PREGUNTAS_POR_SECTOR: Record<string, string[]> = {
  hosteleria: [
    "¿Cómo manejas a un cliente insatisfecho con su plato?",
    "Cuéntame de una vez que hayas trabajado bajo mucha presión en cocina/sala.",
    "¿Qué harías si un compañero no aparece y tienes que cubrir su turno?",
    "¿Cómo gestionas varias mesas ocupadas a la vez?",
    "Háblame de tu experiencia con alérgenos y seguridad alimentaria.",
  ],
  tecnologia: [
    "¿Cuál ha sido el proyecto más complejo en el que has trabajado?",
    "¿Cómo te mantienes actualizado con las nuevas tecnologías?",
    "Cuéntame de una vez que hayas tenido que aprender algo nuevo muy rápido.",
    "¿Cómo explicas un concepto técnico a alguien no técnico?",
    "Háblame de un bug difícil que hayas resuelto.",
  ],
  comercio: [
    "¿Cómo convencerías a un cliente indeciso?",
    "Cuéntame de una venta de la que estés especialmente orgulloso.",
    "¿Cómo manejas los objetivos mensuales de ventas?",
    "Un cliente quiere devolver un producto fuera de plazo. ¿Qué haces?",
    "¿Cómo te organizas cuando tienes varios clientes a la vez?",
  ],
  salud: [
    "¿Cómo manejas el estrés emocional del trabajo con pacientes?",
    "Cuéntame de una emergencia que hayas gestionado.",
    "¿Cómo comunicas malas noticias a un paciente o familiar?",
    "¿Cómo priorizas cuando tienes varios pacientes urgentes?",
    "Háblame de tu experiencia trabajando en equipo multidisciplinar.",
  ],
  general: [
    "Háblame de ti y de tu experiencia profesional.",
    "¿Por qué quieres trabajar con nosotros?",
    "¿Cuál es tu mayor fortaleza y tu mayor debilidad?",
    "¿Dónde te ves en 5 años?",
    "Cuéntame de un conflicto laboral que hayas resuelto.",
    "¿Por qué dejaste tu último trabajo?",
    "¿Qué te motiva en tu día a día laboral?",
  ],
};

export default function EntrevistasPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [sector, setSector] = useState("general");
  const [preguntas, setPreguntas] = useState<string[]>(PREGUNTAS_POR_SECTOR.general);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [escuchando, setEscuchando] = useState(false);
  const [transcripcion, setTranscripcion] = useState("");
  const [feedback, setFeedback] = useState("");
  const [cargandoFeedback, setCargandoFeedback] = useState(false);
  const [respuestas, setRespuestas] = useState<{ pregunta: string; respuesta: string; feedback: string }[]>([]);
  const [soporteVoz, setSoporteVoz] = useState(true);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    async function init() {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      setUserId(session.user.id);

      // Detectar perfil para sugerir sector
      const { data: p } = await supabase
        .from("profiles")
        .select("sector")
        .eq("id", session.user.id)
        .single();
      
      if (p?.sector) {
        const s = p.sector.toLowerCase();
        if (PREGUNTAS_POR_SECTOR[s]) {
          setSector(s);
          setPreguntas(PREGUNTAS_POR_SECTOR[s]);
        }
      }
    }
    init();

    // Verificar soporte Web Speech
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) setSoporteVoz(false);
      synthRef.current = window.speechSynthesis;
    }
  }, [router]);

  // ─── Reconocimiento de voz ────────────────────────────────────
  const toggleEscucha = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (escuchando) {
      recognitionRef.current?.stop();
      setEscuchando(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        final += event.results[i][0].transcript;
      }
      setTranscripcion(final);
    };

    recognition.onerror = () => setEscuchando(false);
    recognition.onend = () => setEscuchando(false);

    recognitionRef.current = recognition;
    recognition.start();
    setEscuchando(true);
    setFeedback("");
  }, [escuchando]);

  // ─── Leer pregunta en voz alta ───────────────────────────────
  const leerPregunta = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(preguntas[preguntaActual]);
    utterance.lang = "es-ES";
    utterance.rate = 0.9;
    synthRef.current.speak(utterance);
  };

  // ─── Analizar respuesta con IA ───────────────────────────────
  const analizarRespuesta = async () => {
    if (!transcripcion.trim()) return;

    setCargandoFeedback(true);
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/entrevistas/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          pregunta: preguntas[preguntaActual],
          respuesta: transcripcion,
          sector,
        }),
      });

      const data = await res.json();
      setFeedback(data.feedback || "No se pudo analizar la respuesta.");

      setRespuestas(prev => [...prev, {
        pregunta: preguntas[preguntaActual],
        respuesta: transcripcion,
        feedback: data.feedback || "",
      }]);
    } catch {
      setFeedback("Error al analizar. Intenta de nuevo.");
    } finally {
      setCargandoFeedback(false);
    }
  };

  // ─── Siguiente pregunta ──────────────────────────────────────
  const siguientePregunta = () => {
    if (preguntaActual < preguntas.length - 1) {
      setPreguntaActual(prev => prev + 1);
      setTranscripcion("");
      setFeedback("");
    }
  };

  // ─── Cambiar sector ──────────────────────────────────────────
  const cambiarSector = (s: string) => {
    setSector(s);
    setPreguntas(PREGUNTAS_POR_SECTOR[s] || PREGUNTAS_POR_SECTOR.general);
    setPreguntaActual(0);
    setTranscripcion("");
    setFeedback("");
  };

  const sectores = Object.keys(PREGUNTAS_POR_SECTOR);

  return (
    <div className="min-h-screen p-4" style={{ background: "#0f1117" }}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <span className="text-5xl">🎙️</span>
          <h1 className="text-2xl font-bold mt-3" style={{ color: "#f1f5f9" }}>
            Simulador de Entrevistas
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Practica con voz real y recibe feedback de IA
          </p>
        </div>

        {!soporteVoz && (
          <div className="p-4 rounded-xl text-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
            ⚠️ Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.
          </div>
        )}

        {/* Selector de sector */}
        <div className="flex flex-wrap gap-2 justify-center">
          {sectores.map(s => (
            <button
              key={s}
              onClick={() => cambiarSector(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition"
              style={{
                background: sector === s ? "rgba(34,197,94,0.15)" : "#161922",
                border: `1px solid ${sector === s ? "#22c55e" : "#252836"}`,
                color: sector === s ? "#22c55e" : "#94a3b8",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Progreso */}
        <div className="flex items-center gap-2 justify-center">
          <span className="text-xs" style={{ color: "#64748b" }}>
            Pregunta {preguntaActual + 1} de {preguntas.length}
          </span>
          <div className="w-32 h-1.5 rounded-full" style={{ background: "#1e212b" }}>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${((preguntaActual + 1) / preguntas.length) * 100}%`,
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
              }}
            />
          </div>
        </div>

        {/* Tarjeta de pregunta */}
        <div className="p-6 rounded-xl" style={{ background: "#161922", border: "1px solid #252836" }}>
          <div className="flex items-start justify-between mb-4">
            <p className="text-lg font-medium" style={{ color: "#f1f5f9" }}>
              {preguntas[preguntaActual]}
            </p>
            <button
              onClick={leerPregunta}
              className="p-2 rounded-lg transition hover:opacity-80 flex-shrink-0 ml-2"
              style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
              title="Escuchar pregunta"
            >
              🔊
            </button>
          </div>

          {/* Botón de grabar */}
          <button
            onClick={toggleEscucha}
            disabled={!soporteVoz}
            className={`w-full py-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
              escuchando ? "animate-pulse" : ""
            }`}
            style={{
              background: escuchando
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              opacity: soporteVoz ? 1 : 0.5,
            }}
          >
            {escuchando ? "🔴 Grabando... pulsa para parar" : "🎤 Pulsa para responder"}
          </button>

          {/* Transcripción */}
          {transcripcion && (
            <div className="mt-4 p-3 rounded-lg" style={{ background: "#0f1117", border: "1px solid #2d3142" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Tu respuesta:</p>
              <p className="text-sm" style={{ color: "#f1f5f9" }}>{transcripcion}</p>
            </div>
          )}

          {/* Feedback IA */}
          {feedback && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#22c55e" }}>🤖 Feedback de Guzzi:</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: "#f1f5f9" }}>{feedback}</p>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={analizarRespuesta}
            disabled={!transcripcion.trim() || cargandoFeedback}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "#fff",
            }}
          >
            {cargandoFeedback ? "Analizando..." : "📊 Analizar respuesta"}
          </button>
          <button
            onClick={siguientePregunta}
            disabled={preguntaActual >= preguntas.length - 1}
            className="px-6 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-30"
            style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#94a3b8" }}
          >
            Siguiente →
          </button>
        </div>

        {/* Historial de respuestas */}
        {respuestas.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#64748b" }}>
              📝 Tu historial ({respuestas.length} respuestas)
            </h3>
            <div className="space-y-3">
              {respuestas.map((r, i) => (
                <details key={i} className="p-3 rounded-lg" style={{ background: "#161922", border: "1px solid #252836" }}>
                  <summary className="text-sm font-medium cursor-pointer" style={{ color: "#f1f5f9" }}>
                    {r.pregunta.slice(0, 60)}...
                  </summary>
                  <div className="mt-3 space-y-2 pl-2 border-l-2" style={{ borderColor: "#22c55e" }}>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>"{r.respuesta}"</p>
                    <p className="text-xs" style={{ color: "#22c55e" }}>{r.feedback}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
