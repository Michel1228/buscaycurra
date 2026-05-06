"use client";

/**
 * GusiChat — Chatbot flotante "Gusi" 🐛
 * Centro de control de BuscayCurra:
 * - Chat libre IA sobre empleo
 * - Crear CV paso a paso (entrevista guiada)
 * - Subir CV desde el chat
 * - Buscar ofertas de trabajo
 * - Envío automático de CVs (EL FUERTE)
 * - Consejos de foto con prompts GPT
 * - Preparar entrevistas
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Oferta {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario: string;
  fuente: string;
  match: number;
  url: string;
}

interface Mensaje {
  role: "user" | "gusi";
  text: string;
  action?: string;
  jobs?: Oferta[];
}

const SUGERENCIAS = [
  { icon: "📧", label: "Enviar CV automático", msg: "Quiero enviar mi CV automáticamente a empresas", destacado: true },
  { icon: "📝", label: "Crear mi CV", msg: "__ENTREVISTA__" },
  { icon: "🔍", label: "Buscar trabajo", msg: "Quiero buscar trabajo, ¿me ayudas?" },
  { icon: "📸", label: "Mejorar mi foto", msg: "¿Cómo mejoro mi foto de CV? Dame prompts para ChatGPT" },
  { icon: "🎯", label: "Preparar entrevista", msg: "Quiero preparar una entrevista de trabajo" },
  { icon: "📄", label: "Subir mi CV", msg: "__SUBIR_CV__" },
];

export default function GusiChat() {
  const [abierto, setAbierto] = useState(false);
  const [logueado, setLogueado] = useState<boolean | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);

  // Verificar login al abrir
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await getSupabaseBrowser().auth.getUser();
        setLogueado(!!user);
        if (user) {
          setMensajes([{ role: "gusi", text: `¡Hola! 🐛 Soy Gusi. ¿Qué hacemos hoy?\n\n📧 **Enviar tu CV automático** (¡nuestro FUERTE!)\n📝 Crear tu CV paso a paso\n🔍 Buscar ofertas para ti\n📸 Mejorar tu foto\n🎯 Preparar entrevistas` }]);
        } else {
          setMensajes([{ role: "gusi", text: "¡Hola! 🐛 Soy Gusi, tu asistente de empleo.\n\n⚠️ **Primero necesitas una cuenta** para que pueda ayudarte.\n\nEs gratis y tarda 30 segundos:\n👉 **Regístrate** o **inicia sesión**\n\n¡Y luego te ayudo con todo! 🐛→🦋" }]);
        }
      } catch {
        setMensajes([{ role: "gusi", text: "¡Hola! 🐛 Soy Gusi. Regístrate primero para que pueda ayudarte." }]);
        setLogueado(false);
      }
    }
    checkAuth();
  }, [abierto]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(true);
  const [modoEntrevista, setModoEntrevista] = useState(false);
  const [pulso, setPulso] = useState(true);
  const [notif, setNotif] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes, cargando]);

  useEffect(() => {
    const t = setTimeout(() => setPulso(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const addMsg = (role: "user" | "gusi", text: string, action?: string) => {
    setMensajes(prev => [...prev, { role, text, action }]);
  };

  const enviar = async (texto: string) => {
    if (!texto.trim() || cargando) return;

    // Acción especial: subir CV
    if (texto === "__SUBIR_CV__") {
      addMsg("user", "Quiero subir mi CV");
      addMsg("gusi", "📄 ¡Perfecto! Tienes dos opciones:\n\n1. **Aquí abajo** → Pulsa el clip 📎 para subir tu PDF\n2. **En Perfil** → Ve a 👤 Perfil → Mi CV\n\n¿Tienes tu CV en PDF? ¡Súbelo y yo me encargo del resto! 🐛", "upload_hint");
      setMostrarSugerencias(false);
      return;
    }

    // Acción especial: entrevista
    if (texto === "__ENTREVISTA__") {
      setModoEntrevista(true);
      setMostrarSugerencias(false);
      addMsg("user", "Quiero crear mi CV paso a paso");
      addMsg("gusi", "¡Genial! 🐛 Vamos a crear un CV increíble juntos. Yo pregunto, tú respondes. ¡Será rápido!\n\n👉 Empecemos: **¿Cuál es tu nombre completo?**");
      return;
    }

    setMostrarSugerencias(false);
    const nuevosMensajes = [...mensajes, { role: "user" as const, text: texto }];
    setMensajes(nuevosMensajes);
    setInput("");
    setCargando(true);

    try {
      const res = await fetch("/api/gusi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: texto,
          history: nuevosMensajes.slice(-12),
          mode: modoEntrevista ? "entrevista" : "chat",
        }),
      });

      const data = await res.json();
      setMensajes(prev => [...prev, { role: "gusi", text: data.reply || "¡Ups! Inténtalo de nuevo 🐛", action: data.action, jobs: data.jobs }]);
    } catch {
      addMsg("gusi", "Sin conexión. Comprueba tu internet 🐛");
    }
    setCargando(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.type !== "application/pdf") {
      addMsg("gusi", "⚠️ Solo acepto PDFs. Por favor, selecciona un archivo .pdf 🐛");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addMsg("gusi", "⚠️ El archivo es muy grande (máx 5MB). Intenta comprimir el PDF. 🐛");
      return;
    }

    addMsg("user", `📄 Subiendo: ${file.name}`);
    setCargando(true);

    try {
      // Get auth token
      const { getSupabaseBrowser } = await import("@/lib/supabase-browser");
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) {
        addMsg("gusi", "⚠️ Necesitas estar logueado. Ve a iniciar sesión primero. 🐛");
        setCargando(false);
        return;
      }

      // 1. Subir PDF a storage
      const uploadData = new FormData();
      uploadData.append("cv", file);

      const res = await fetch("/api/cv/subir", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: uploadData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        addMsg("gusi", `⚠️ ${(data as {error?: string}).error || "No pude subir el CV. Inténtalo de nuevo."} 🐛`);
        setCargando(false);
        return;
      }

      // 2. Extraer datos con IA
      addMsg("gusi", "🔍 Leyendo tu CV con IA... un momento 🐛");
      const extractData = new FormData();
      extractData.append("file", file);
      const extractRes = await fetch("/api/cv/extraer", {
        method: "POST",
        body: extractData,
      });

      if (extractRes.ok) {
        const parsed = await extractRes.json();
        if (parsed.fuente && parsed.nombre) {
          const exp = (parsed.experiencia || []).slice(0, 3);
          const expText = exp.map((e: {puesto?: string; empresa?: string}) => `  • ${e.puesto || "?"} en ${e.empresa || "?"}`).join("\n");
          addMsg("gusi", `✅ **¡CV subido y analizado!** 🐛🎉\n\n👤 **${parsed.nombre} ${parsed.apellidos || ""}**\n📞 ${parsed.telefono || "Sin teléfono"}\n📧 ${parsed.email || "Sin email"}\n📍 ${parsed.ciudad || "Sin ciudad"}\n${expText ? `\n💼 Experiencia:\n${expText}` : ""}\n\n✨ **Los campos se han rellenado** en la página de CV.\n\n¿Qué hacemos ahora?\n📧 **Enviar CV automáticamente**\n🔍 Buscar ofertas que encajen\n✨ Mejorar el CV con IA`);
        } else {
          addMsg("gusi", "✅ **¡CV subido!** 🐛🎉\n\nNo pude leer todos los datos automáticamente, pero tu PDF está guardado.\n\nVe a 📄 **Currículum** para rellenar los campos manualmente o mejorarlos con IA. 🦋");
        }
      } else {
        addMsg("gusi", "✅ **¡CV subido!** 🐛🎉\n\nAhora puedo:\n📧 **Enviar tu CV automáticamente** a empresas\n🔍 Buscar ofertas que encajen contigo\n\n¿Qué hacemos? ¡Un paso más cerca de ser mariposa! 🦋");
      }
    } catch {
      addMsg("gusi", "⚠️ Error al subir. Comprueba tu conexión. 🐛");
    }
    setCargando(false);
  };

  const limpiar = () => {
    setMensajes([{ role: "gusi", text: "¡Chat limpio! 🐛 ¿En qué te ayudo?\n\n📧 Enviar CV automático\n📝 Crear CV\n🔍 Buscar trabajo\n📸 Foto\n🎯 Entrevista" }]);
    setModoEntrevista(false);
    setMostrarSugerencias(true);
  };

  return (
    <>
      {/* ── Chat panel ───────────────────── */}
      {abierto && (
        <div
          className="fixed z-[9998] flex flex-col overflow-hidden"
          style={{
            bottom: "5rem", right: "1rem", left: "1rem",
            maxWidth: "420px", marginLeft: "auto",
            height: "min(70vh, 560px)",
            background: "#12160d",
            borderRadius: "1.25rem",
            border: "2px solid rgba(126,213,111,0.25)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(126,213,111,0.08)",
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(126,213,111,0.08), rgba(15,26,10,0.95))", borderBottom: "1px solid rgba(126,213,111,0.15)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                style={{ background: "rgba(126,213,111,0.15)", border: "1.5px solid rgba(126,213,111,0.3)" }}>
                🐛
              </div>
              <div>
                <span className="font-bold text-sm" style={{ color: "#7ed56f" }}>Gusi</span>
                {modoEntrevista && (
                  <span className="ml-2 text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(240,192,64,0.15)", color: "#f0c040", border: "1px solid rgba(240,192,64,0.25)" }}>
                    📝 MODO CV
                  </span>
                )}
                <div className="text-[10px]" style={{ color: "#706a58" }}>Tu centro de empleo 🐛→🦋</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={limpiar} title="Limpiar" className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition hover:opacity-80"
                style={{ background: "rgba(126,213,111,0.08)", color: "#706a58" }}>🗑</button>
              <button onClick={() => setAbierto(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition hover:opacity-80"
                style={{ background: "rgba(126,213,111,0.08)", color: "#706a58" }}>✕</button>
            </div>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5" style={{ background: "#12160d" }}>
            {mensajes.map((m, i) => (
              <div key={i}>
                <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} items-end gap-1.5`}>
                  {m.role === "gusi" && <span className="text-sm mb-1 shrink-0">🐛</span>}
                  <div className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                    m.role === "user" ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"}`}
                    style={{
                      background: m.role === "user" ? "linear-gradient(135deg, #7ed56f, #5cb848)" : "rgba(42,42,30,0.7)",
                      color: m.role === "user" ? "#0f1a0a" : "#f0ebe0",
                      border: m.role === "gusi" ? "1px solid rgba(126,213,111,0.1)" : "none",
                      fontWeight: m.role === "user" ? 500 : 400,
                    }}
                    dangerouslySetInnerHTML={{ __html: formatGusiText(m.text) }}
                  />
                </div>
                {/* Botón CV visual cuando la entrevista termina */}
                {m.action === "cv_complete" && (
                  <div className="ml-7 mt-2">
                    <button
                      onClick={() => router.push("/app/curriculum")}
                      className="w-full py-2.5 rounded-xl text-[12px] font-bold transition hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #3B5FE0, #2244CC)", color: "white", boxShadow: "0 2px 10px rgba(59,95,224,0.35)" }}>
                      📄 Generar mi CV visual ahora →
                    </button>
                    <p className="text-[10px] mt-1 text-center" style={{ color: "#706a58" }}>Con plantilla profesional, foto y colores</p>
                  </div>
                )}
                {/* Ofertas con % de match */}
                {m.jobs && m.jobs.length > 0 && (
                  <div className="ml-7 mt-2 space-y-2">
                    {m.jobs.map((job) => {
                      const matchColor = job.match >= 80 ? "#7ed56f" : job.match >= 60 ? "#f0c040" : "#e07850";
                      return (
                        <div key={job.id} className="rounded-xl p-3 transition hover:scale-[1.01]"
                          style={{ background: "rgba(42,42,30,0.5)", border: "1px solid rgba(126,213,111,0.1)" }}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-bold truncate" style={{ color: "#f0ebe0" }}>{job.titulo}</p>
                              <p className="text-[10px]" style={{ color: "#b0a890" }}>{job.empresa} · {job.ubicacion}</p>
                              <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#7ed56f" }}>💰 {job.salario}</p>
                            </div>
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <div className="flex items-center gap-1">
                                <div className="w-10 h-1.5 rounded-full" style={{ background: "#2a2a1e" }}>
                                  <div className="h-full rounded-full" style={{ width: `${job.match}%`, background: matchColor }} />
                                </div>
                                <span className="text-[11px] font-bold" style={{ color: matchColor }}>{job.match}%</span>
                              </div>
                              <button
                                onClick={() => router.push(`/app/envios?empresa=${encodeURIComponent(job.empresa)}`)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition hover:opacity-90"
                                style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}>
                                📧 Enviar CV
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => {
                        addMsg("user", "Envía mi CV a todas las ofertas");
                        addMsg("gusi", "📧 **¡Enviando tu CV a todas las ofertas!** 🐛\n\nVe a 📧 **Envíos** para ver el progreso. ¡Un paso más cerca de ser mariposa! 🦋");
                      }}
                      className="w-full py-2 rounded-xl text-[12px] font-bold transition hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, rgba(126,213,111,0.15), rgba(92,184,72,0.15))", border: "1.5px solid rgba(126,213,111,0.3)", color: "#7ed56f" }}>
                      📧 Enviar CV a TODAS ({m.jobs.length} ofertas)
                    </button>
                  </div>
                )}
              </div>
            ))}
            {cargando && (
              <div className="flex justify-start items-end gap-1.5">
                <span className="text-sm mb-1">🐛</span>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md text-[13px]"
                  style={{ background: "rgba(42,42,30,0.7)", border: "1px solid rgba(126,213,111,0.1)" }}>
                  <span className="inline-flex gap-1" style={{ color: "#7ed56f" }}>
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sugerencias */}
          {mostrarSugerencias && (
            <div className="px-3 py-2.5 flex flex-wrap gap-1.5 shrink-0"
              style={{ borderTop: "1px solid rgba(126,213,111,0.08)", background: "rgba(15,26,10,0.5)" }}>
              {logueado === false ? (
                /* No logueado: solo botones de registro/login */
                <>
                  <button onClick={() => router.push("/auth/registro")}
                    className="flex items-center gap-1 px-3 py-2 rounded-full text-[12px] font-bold transition hover:opacity-80"
                    style={{ background: "rgba(126,213,111,0.18)", color: "#7ed56f", border: "1.5px solid rgba(126,213,111,0.35)" }}>
                    📝 Registrarme gratis
                  </button>
                  <button onClick={() => router.push("/auth/login")}
                    className="flex items-center gap-1 px-3 py-2 rounded-full text-[12px] font-medium transition hover:opacity-80"
                    style={{ background: "rgba(126,213,111,0.06)", color: "#b0a890", border: "1px solid rgba(126,213,111,0.12)" }}>
                    🔑 Ya tengo cuenta
                  </button>
                </>
              ) : (
                /* Logueado: todas las sugerencias */
                SUGERENCIAS.map((s, i) => (
                  <button key={i} onClick={() => enviar(s.msg)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition hover:opacity-80"
                    style={{
                      background: s.destacado ? "rgba(126,213,111,0.18)" : "rgba(126,213,111,0.06)",
                      color: s.destacado ? "#7ed56f" : "#b0a890",
                      border: s.destacado ? "1.5px solid rgba(126,213,111,0.35)" : "1px solid rgba(126,213,111,0.12)",
                      fontWeight: s.destacado ? 700 : 500,
                    }}>
                    <span>{s.icon}</span> {s.label}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Input + file upload */}
          <div className="px-3 py-2.5 flex gap-2 shrink-0 items-center"
            style={{ borderTop: "1px solid rgba(126,213,111,0.1)", background: "rgba(15,26,10,0.95)" }}>
            {/* Clip para subir CV */}
            <button onClick={() => fileRef.current?.click()} title="Subir CV (PDF)"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm transition hover:opacity-80 shrink-0"
              style={{ background: "rgba(126,213,111,0.08)", border: "1px solid rgba(126,213,111,0.12)", color: "#706a58" }}>
              📎
            </button>
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />

            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviar(input)}
              placeholder={modoEntrevista ? "Escribe tu respuesta..." : "Pregúntale a Gusi..."}
              className="flex-1 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none"
              style={{ background: "rgba(126,213,111,0.05)", border: "1.5px solid rgba(126,213,111,0.12)", color: "#f0ebe0" }}
            />
            <button onClick={() => enviar(input)} disabled={!input.trim() || cargando}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition disabled:opacity-30 hover:scale-105 active:scale-95 shrink-0"
              style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#0f1a0a", boxShadow: "0 2px 8px rgba(126,213,111,0.2)" }}>
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ── Burbuja flotante ──────────────── */}
      <button onClick={() => { setAbierto(!abierto); setPulso(false); setNotif(false); }}
        className="fixed bottom-4 right-4 z-[9999] w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{
          background: abierto ? "rgba(42,42,30,0.9)" : "linear-gradient(135deg, #7ed56f, #5cb848)",
          boxShadow: abierto ? "0 4px 16px rgba(0,0,0,0.4)" : "0 4px 24px rgba(126,213,111,0.4), 0 0 50px rgba(126,213,111,0.12)",
          border: abierto ? "2px solid rgba(126,213,111,0.2)" : "2px solid rgba(255,255,255,0.15)",
          animation: pulso && !abierto ? "gusi-pulse 2s ease-in-out infinite" : "none",
        }}>
        {abierto ? (
          <span className="text-lg" style={{ color: "#706a58" }}>✕</span>
        ) : (
          <>
            <span className="text-2xl">🐛</span>
            {notif && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: "#e05050", color: "white", boxShadow: "0 2px 8px rgba(224,80,80,0.4)" }}>
                1
              </span>
            )}
          </>
        )}
      </button>

      {/* Tooltip primera vez */}
      {!abierto && pulso && (
        <div className="fixed z-[9998] px-3 py-2 rounded-xl text-[11px] font-medium pointer-events-none"
          style={{ bottom: "4.5rem", right: "4.5rem",
            background: "rgba(15,26,10,0.95)", color: "#7ed56f",
            border: "1px solid rgba(126,213,111,0.2)", boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            animation: "gusi-tooltip 2s ease-in-out infinite" }}>
          📧 ¡Envío tu CV automático! Toca aquí 🐛
        </div>
      )}

      <style jsx global>{`
        @keyframes gusi-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 24px rgba(126,213,111,0.4); }
          50% { transform: scale(1.08); box-shadow: 0 4px 32px rgba(126,213,111,0.6), 0 0 60px rgba(126,213,111,0.2); }
        }
        @keyframes gusi-tooltip {
          0%, 100% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.8; transform: translateY(-3px); }
        }
      `}</style>
    </>
  );
}

/** Formatea **bold** y _italic_ en el texto de Gusi */
function formatGusiText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#7ed56f">$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}
