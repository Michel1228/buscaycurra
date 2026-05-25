"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

type Mensaje = {
  rol: "user" | "assistant";
  texto: string;
};

const PUESTOS_SUGERIDOS = [
  "Desarrollador Frontend",
  "Comercial",
  "Administrativo",
  "Enfermero/a",
  "Conductor",
  "Dependiente/a",
  "Electricista",
  "Técnico IT",
];

export default function EntrevistasPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [puesto, setPuesto] = useState("");
  const [puestoConfirmado, setPuestoConfirmado] = useState("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sesionActiva, setSesionActiva] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function verificar() {
      try {
        const { data: { session } } = await getSupabaseBrowser().auth.getSession();
        if (!session) { router.push("/auth/login"); return; }
      } catch { router.push("/auth/login"); return; }
      setCargando(false);
    }
    verificar();
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function iniciarEntrevista() {
    if (!puesto.trim()) return;
    setPuestoConfirmado(puesto.trim());
    setSesionActiva(true);
    setMensajes([]);
    setEnviando(true);

    try {
      const res = await fetch("/api/entrevistas/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puesto: puesto.trim(), mensajes: [], inicio: true }),
      });
      const data = await res.json();
      if (data.respuesta) {
        setMensajes([{ rol: "assistant", texto: data.respuesta }]);
      }
    } catch {
      setMensajes([{ rol: "assistant", texto: "No pude conectar con el simulador. Inténtalo de nuevo." }]);
    } finally {
      setEnviando(false);
    }
  }

  async function enviarRespuesta() {
    if (!input.trim() || enviando) return;
    const texto = input.trim();
    setInput("");
    const nuevosMensajes: Mensaje[] = [...mensajes, { rol: "user", texto }];
    setMensajes(nuevosMensajes);
    setEnviando(true);

    try {
      const res = await fetch("/api/entrevistas/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puesto: puestoConfirmado, mensajes: nuevosMensajes }),
      });
      const data = await res.json();
      if (data.respuesta) {
        setMensajes([...nuevosMensajes, { rol: "assistant", texto: data.respuesta }]);
      }
    } catch {
      setMensajes([...nuevosMensajes, { rol: "assistant", texto: "Error al procesar tu respuesta." }]);
    } finally {
      setEnviando(false);
    }
  }

  function reiniciar() {
    setSesionActiva(false);
    setPuesto("");
    setPuestoConfirmado("");
    setMensajes([]);
    setInput("");
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#7ed56f" }}>
            🎙️ Simulador de entrevistas
          </h1>
          <p className="text-sm" style={{ color: "#706a58" }}>
            Practica con IA antes de tu próxima entrevista real
          </p>
        </div>

        {!sesionActiva ? (
          /* Selector de puesto */
          <div className="glass-warm rounded-2xl p-6">
            <label className="block text-sm font-medium mb-2" style={{ color: "#e8e0cc" }}>
              ¿Para qué puesto quieres prepararte?
            </label>
            <input
              type="text"
              value={puesto}
              onChange={(e) => setPuesto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && iniciarEntrevista()}
              placeholder="Ej: Camarero, Programador, Enfermero..."
              className="w-full rounded-xl px-4 py-3 text-sm mb-4 outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(126,213,111,0.2)",
                color: "#e8e0cc",
              }}
            />
            <div className="flex flex-wrap gap-2 mb-5">
              {PUESTOS_SUGERIDOS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPuesto(p)}
                  className="text-xs px-3 py-1.5 rounded-full transition"
                  style={{
                    background: puesto === p ? "rgba(126,213,111,0.2)" : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(126,213,111,0.2)",
                    color: puesto === p ? "#7ed56f" : "#706a58",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={iniciarEntrevista}
              disabled={!puesto.trim()}
              className="w-full py-3 rounded-xl font-semibold text-sm transition"
              style={{
                background: puesto.trim() ? "rgba(126,213,111,0.2)" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(126,213,111,0.3)",
                color: puesto.trim() ? "#7ed56f" : "#706a58",
                cursor: puesto.trim() ? "pointer" : "not-allowed",
              }}
            >
              Empezar entrevista
            </button>
          </div>
        ) : (
          /* Chat de entrevista */
          <div className="flex flex-col gap-3">
            {/* Info sesión */}
            <div
              className="flex items-center justify-between px-4 py-2 rounded-xl text-xs"
              style={{ background: "rgba(126,213,111,0.08)", border: "1px solid rgba(126,213,111,0.15)" }}
            >
              <span style={{ color: "#7ed56f" }}>
                Entrevista para: <strong>{puestoConfirmado}</strong>
              </span>
              <button onClick={reiniciar} style={{ color: "#706a58" }} className="hover:text-red-400 transition">
                Terminar
              </button>
            </div>

            {/* Mensajes */}
            <div
              className="rounded-2xl p-4 flex flex-col gap-3 overflow-y-auto"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(126,213,111,0.1)",
                minHeight: 320,
                maxHeight: 420,
              }}
            >
              {mensajes.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.rol === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={
                      m.rol === "user"
                        ? {
                            background: "rgba(126,213,111,0.15)",
                            color: "#e8e0cc",
                            borderBottomRightRadius: 4,
                          }
                        : {
                            background: "rgba(255,255,255,0.06)",
                            color: "#c8c0a8",
                            borderBottomLeftRadius: 4,
                          }
                    }
                  >
                    {m.rol === "assistant" && (
                      <span className="text-xs font-semibold block mb-1" style={{ color: "#7ed56f" }}>
                        Entrevistador
                      </span>
                    )}
                    {m.texto}
                  </div>
                </div>
              ))}
              {enviando && (
                <div className="flex justify-start">
                  <div
                    className="px-4 py-2.5 rounded-2xl text-sm"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#706a58" }}
                  >
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                      <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                      <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviarRespuesta()}
                disabled={enviando}
                placeholder="Escribe tu respuesta..."
                className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(126,213,111,0.2)",
                  color: "#e8e0cc",
                }}
              />
              <button
                onClick={enviarRespuesta}
                disabled={!input.trim() || enviando}
                className="px-5 py-3 rounded-xl font-medium text-sm transition"
                style={{
                  background: input.trim() && !enviando ? "rgba(126,213,111,0.2)" : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(126,213,111,0.3)",
                  color: input.trim() && !enviando ? "#7ed56f" : "#706a58",
                  cursor: input.trim() && !enviando ? "pointer" : "not-allowed",
                }}
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
