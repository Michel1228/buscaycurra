"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import VoiceRecorder from "@/components/VoiceInterview/VoiceRecorder";
import InterviewFeedback from "@/components/VoiceInterview/InterviewFeedback";

const PREGUNTAS: Record<string, string[]> = {
  general: [
    "Háblame de ti y de tu experiencia profesional.",
    "¿Por qué quieres trabajar con nosotros?",
    "¿Cuál es tu mayor fortaleza y tu mayor debilidad?",
    "¿Dónde te ves en 5 años?",
    "Cuéntame de un conflicto laboral que hayas resuelto.",
    "¿Por qué dejaste tu último trabajo?",
    "¿Qué te motiva en tu día a día laboral?",
  ],
  hosteleria: [
    "¿Cómo manejas a un cliente insatisfecho con su plato?",
    "Cuéntame de una vez que hayas trabajado bajo mucha presión en cocina o sala.",
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
};

const SECTORES = [
  { id: "general", label: "General" },
  { id: "hosteleria", label: "Hostelería" },
  { id: "tecnologia", label: "Tecnología" },
  { id: "comercio", label: "Comercio" },
  { id: "salud", label: "Salud" },
];

type Respuesta = { pregunta: string; respuesta: string; feedback: string };

const LS_KEY = "bc_entrevistas";

export default function EntrevistasPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [sector, setSector] = useState("general");
  const [preguntas, setPreguntas] = useState(PREGUNTAS.general);
  const [idx, setIdx] = useState(0);
  const [texto, setTexto] = useState("");
  const [feedback, setFeedback] = useState("");
  const [analizando, setAnalizando] = useState(false);
  const [historial, setHistorial] = useState<Respuesta[]>([]);
  const [finalizado, setFinalizado] = useState(false);
  const [soporteVoz, setSoporteVoz] = useState(false);
  const [cargando, setCargando] = useState(true);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // ─── Inicialización (auth + localStorage) ──────────────────────
  useEffect(() => {
    async function init() {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      setToken(session.access_token);

      // Autodetectar sector del perfil
      const { data: p } = await getSupabaseBrowser()
        .from("profiles")
        .select("sector")
        .eq("id", session.user.id)
        .single();
      
      let sectorDetectado = "general";
      if (p?.sector) {
        const s = p.sector.toLowerCase();
        if (PREGUNTAS[s]) sectorDetectado = s;
      }

      // Restaurar estado desde localStorage
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          // Solo restaurar si es del mismo sector y no ha pasado mucho tiempo (>24h)
          if (data.sector === sectorDetectado || data.sector === p?.sector?.toLowerCase()) {
            if (typeof data.idx === "number" && data.idx >= 0) setIdx(data.idx);
            if (Array.isArray(data.historial)) setHistorial(data.historial);
            setSector(data.sector || sectorDetectado);
            setPreguntas(PREGUNTAS[data.sector || sectorDetectado]);
          } else {
            setSector(sectorDetectado);
            setPreguntas(PREGUNTAS[sectorDetectado]);
          }
        } else {
          setSector(sectorDetectado);
          setPreguntas(PREGUNTAS[sectorDetectado]);
        }
      } catch {
        setSector(sectorDetectado);
        setPreguntas(PREGUNTAS[sectorDetectado]);
      }

      setCargando(false);
    }
    init();

    if (typeof window !== "undefined") {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) setSoporteVoz(true);
      synthRef.current = window.speechSynthesis || null;
    }
  }, [router]);

  // ─── Persistencia automática en localStorage ───────────────────
  useEffect(() => {
    if (cargando) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ sector, idx, historial }));
    } catch { /* localStorage puede no estar disponible */ }
  }, [sector, idx, historial, cargando]);

  // Liberar síntesis de voz al desmontar
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        try { synthRef.current.cancel(); } catch { /* ok */ }
      }
    };
  }, []);

  const cambiarSector = (s: string) => {
    setSector(s); setPreguntas(PREGUNTAS[s]); setIdx(0);
    setTexto(""); setFeedback(""); setHistorial([]); setFinalizado(false);
  };

  const leerPregunta = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const u = new SpeechSynthesisUtterance(preguntas[idx]);
    u.lang = "es-ES"; u.rate = 0.9;
    synthRef.current.speak(u);
  };

  const analizar = async () => {
    if (!texto.trim()) return;
    setAnalizando(true);
    try {
      const res = await fetch("/api/entrevistas/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pregunta: preguntas[idx], respuesta: texto, sector }),
      });
      const data = await res.json();
      const fb = data.feedback || "No se pudo analizar.";
      setFeedback(fb);
      setHistorial(h => [...h, { pregunta: preguntas[idx], respuesta: texto, feedback: fb }]);
    } catch {
      setFeedback("Error al analizar. Inténtalo de nuevo.");
    } finally {
      setAnalizando(false);
    }
  };

  const siguiente = () => {
    if (idx < preguntas.length - 1) {
      setIdx(i => i + 1); setTexto(""); setFeedback("");
    } else {
      setFinalizado(true);
    }
  };

  const reiniciar = () => {
    setIdx(0); setTexto(""); setFeedback(""); setHistorial([]); setFinalizado(false);
  };

  if (cargando) {
    return (
      <div className="min-h-screen pt-24 pb-8 px-4 flex items-center justify-center" style={{ background: "#0f1117" }}>
        <div className="text-center">
          <div className="text-4xl mb-3">🎙️</div>
          <p className="text-sm" style={{ color: "#6b7280" }}>Cargando simulador...</p>
        </div>
      </div>
    );
  }

  // ─── Resumen final ────────────────────────────────────────────
  if (finalizado) {
    return (
      <div className="min-h-screen pt-16 pb-8 px-4" style={{ background: "#0f1117" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-2xl font-bold text-white mb-1">¡Entrevista completada!</h1>
            <p className="text-sm" style={{ color: "#6b7280" }}>
              {historial.length} de {preguntas.length} preguntas respondidas
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {historial.map((r, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#10b981" }}>P{i + 1}. {r.pregunta}</p>
                <p className="text-sm mb-3" style={{ color: "#9ca3af" }}>{r.respuesta}</p>
                <div className="text-xs whitespace-pre-wrap" style={{ color: "#d1d5db" }}>{r.feedback}</div>
              </div>
            ))}
          </div>

          <button
            onClick={reiniciar}
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: "#10b981", color: "#fff" }}
          >
            Volver a empezar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-8 px-4" style={{ background: "#0f1117" }}>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="text-center pt-2">
          <div className="text-4xl mb-2">🎙️</div>
          <h1 className="text-xl font-bold text-white">Simulador de Entrevistas</h1>
          <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
            Practica y recibe feedback de IA
          </p>
        </div>

        {/* Sectores */}
        <div className="flex flex-wrap gap-2 justify-center">
          {SECTORES.map(s => (
            <button
              key={s.id}
              onClick={() => cambiarSector(s.id)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition"
              style={{
                background: sector === s.id ? "#10b981" : "#1a1f2e",
                color: sector === s.id ? "#fff" : "#6b7280",
                border: `1px solid ${sector === s.id ? "#10b981" : "#2d3748"}`,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Progreso */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "#6b7280" }}>
            <span>Pregunta {idx + 1} de {preguntas.length}</span>
            <span>{Math.round((idx / preguntas.length) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "#1a1f2e" }}>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ background: "#10b981", width: `${(idx / preguntas.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Pregunta */}
        <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-medium text-white leading-relaxed flex-1">
              {preguntas[idx]}
            </p>
            {soporteVoz && (
              <button
                onClick={leerPregunta}
                className="p-2 rounded-lg shrink-0"
                style={{ background: "#0f1117", color: "#10b981" }}
                title="Escuchar pregunta"
              >
                🔊
              </button>
            )}
          </div>
        </div>

        {/* VoiceRecorder con fallback a textarea */}
        <VoiceRecorder
          value={texto}
          onChange={setTexto}
          disabled={analizando}
        />

        {/* InterviewFeedback con animación */}
        <InterviewFeedback feedback={feedback} />

        {/* Acciones */}
        <div className="flex gap-3">
          <button
            onClick={analizar}
            disabled={!texto.trim() || analizando}
            className="flex-1 py-3 rounded-xl font-semibold text-sm transition"
            style={{
              background: texto.trim() && !analizando ? "#10b981" : "#1a1f2e",
              color: texto.trim() && !analizando ? "#fff" : "#6b7280",
            }}
          >
            {analizando ? "Analizando..." : "📊 Analizar respuesta"}
          </button>
          <button
            onClick={siguiente}
            disabled={!feedback}
            className="flex-1 py-3 rounded-xl font-semibold text-sm transition"
            style={{
              background: feedback ? "#1a1f2e" : "#0f1117",
              color: feedback ? "#e5e7eb" : "#374151",
              border: `1px solid ${feedback ? "#2d3748" : "#1a1f2e"}`,
            }}
          >
            {idx < preguntas.length - 1 ? "Siguiente →" : "Finalizar ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
