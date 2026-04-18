"use client";

/**
 * components/GusiChat.tsx — Interfaz de chat con el agente Gusi
 *
 * Chat conversacional con Gusi (IA basada en Groq/Llama).
 * Mantiene el historial de mensajes en memoria del cliente.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Mensaje {
  role: "user" | "assistant";
  content: string;
}

// ─── Mensaje inicial de Gusi ──────────────────────────────────────────────────

const SALUDO_INICIAL: Mensaje = {
  role: "assistant",
  content: "¡Hola! 🐛 Soy Gusi, tu asistente de BuscayCurra.\n\nEstoy aquí para ayudarte a conseguir trabajo más rápido: puedo revisar tu CV, escribirte cartas de presentación, darte consejos sobre tu foto de perfil y guiarte paso a paso.\n\n¿Cuál es tu situación ahora mismo? ¿Buscas trabajo activamente, quieres cambiar de sector o aspiras a un ascenso?",
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function GusiChat() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO_INICIAL]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const finListaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Obtener token de autenticación al montar
  useEffect(() => {
    const obtenerToken = async () => {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      setToken(session?.access_token ?? null);
    };
    void obtenerToken();
  }, []);

  // Scroll automático al último mensaje
  useEffect(() => {
    finListaRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, enviando]);

  const enviarMensaje = useCallback(async () => {
    const texto = input.trim();
    if (!texto || enviando) return;

    setInput("");
    setError("");

    const nuevoMensaje: Mensaje = { role: "user", content: texto };
    const historialActualizado = [...mensajes, nuevoMensaje];
    setMensajes(historialActualizado);
    setEnviando(true);

    try {
      const response = await fetch("/api/chat/gusi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: historialActualizado }),
      });

      const data = await response.json() as { respuesta?: string; error?: string };

      if (!response.ok || data.error) {
        setError(data.error ?? "Error al contactar con Gusi. Inténtalo de nuevo.");
        return;
      }

      setMensajes((prev) => [
        ...prev,
        { role: "assistant", content: data.respuesta! },
      ]);
    } catch {
      setError("Error de red. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }, [input, enviando, mensajes, token]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void enviarMensaje();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[600px] bg-white rounded-2xl border border-gray-100 overflow-hidden">

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 py-4 text-white"
        style={{ background: "linear-gradient(135deg, #2563EB, #1d4ed8)" }}
      >
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
          🐛
        </div>
        <div>
          <p className="font-semibold text-sm">Gusi</p>
          <p className="text-blue-200 text-xs">Asistente de BuscayCurra · IA</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs text-blue-200">En línea</span>
        </div>
      </div>

      {/* ── Lista de mensajes ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {mensajes.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                msg.role === "assistant"
                  ? "text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
              style={msg.role === "assistant" ? { backgroundColor: "#2563EB" } : {}}
            >
              {msg.role === "assistant" ? "🐛" : "👤"}
            </div>

            {/* Burbuja */}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "assistant"
                  ? "bg-gray-50 text-gray-800 rounded-tl-sm"
                  : "text-white rounded-tr-sm"
              }`}
              style={msg.role === "user" ? { backgroundColor: "#2563EB" } : {}}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Indicador de escritura */}
        {enviando && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 text-white"
              style={{ backgroundColor: "#2563EB" }}
            >
              🐛
            </div>
            <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        <div ref={finListaRef} />
      </div>

      {/* ── Área de input ─────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe a Gusi... (Enter para enviar, Shift+Enter para nueva línea)"
            rows={2}
            disabled={enviando}
            className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 transition"
          />
          <button
            onClick={() => void enviarMensaje()}
            disabled={enviando || !input.trim()}
            className="h-11 px-5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            style={{ backgroundColor: "#2563EB" }}
          >
            {enviando ? "..." : "Enviar"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 pl-1">
          Puedes pegarle directamente tu CV para que Gusi lo revise
        </p>
      </div>

    </div>
  );
}
