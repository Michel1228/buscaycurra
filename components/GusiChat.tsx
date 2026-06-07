"use client";

/**
 * GusiChat — Chatbot flotante "Guzzi"
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
import GuzziAvatar from "@/components/GuzziAvatar";

// Mapa de palabras clave → id de país en /app/emigrar
const LOCATION_TO_PAIS: Record<string, string> = {
  "reino unido": "uk", "uk": "uk", "london": "uk", "londres": "uk", "england": "uk", "manchester": "uk",
  "alemania": "alemania", "germany": "alemania", "berlin": "alemania", "berlín": "alemania", "munich": "alemania", "münchen": "alemania",
  "francia": "francia", "france": "francia", "paris": "francia", "parís": "francia", "lyon": "francia",
  "irlanda": "irlanda", "ireland": "irlanda", "dublin": "irlanda", "dublín": "irlanda",
  "países bajos": "paises_bajos", "paises bajos": "paises_bajos", "netherlands": "paises_bajos", "holanda": "paises_bajos", "amsterdam": "paises_bajos",
  "italia": "italia", "italy": "italia", "rome": "italia", "roma": "italia", "milan": "italia", "milán": "italia",
  "suecia": "suecia", "sweden": "suecia", "stockholm": "suecia", "estocolmo": "suecia",
  "suiza": "suiza", "switzerland": "suiza", "zurich": "suiza", "zúrich": "suiza", "ginebra": "suiza",
  "bélgica": "belgica", "belgica": "belgica", "belgium": "belgica", "brussels": "belgica", "bruselas": "belgica",
  "portugal": "portugal", "lisbon": "portugal", "lisboa": "portugal", "porto": "portugal",
  "noruega": "noruega", "norway": "noruega", "oslo": "noruega",
  "dinamarca": "dinamarca", "denmark": "dinamarca", "copenhagen": "dinamarca", "copenhague": "dinamarca",
  "austria": "austria", "vienna": "austria", "viena": "austria",
  "finlandia": "finlandia", "finland": "finlandia", "helsinki": "finlandia",
  "nueva zelanda": "nueva_zelanda", "new zealand": "nueva_zelanda",
  "polonia": "polonia", "poland": "polonia", "warsaw": "polonia", "varsovia": "polonia",
  "canadá": "canada", "canada": "canada", "toronto": "canada", "vancouver": "canada",
  "australia": "australia", "sydney": "australia", "melbourne": "australia",
  "estados unidos": "usa", "usa": "usa", "ee.uu.": "usa", "new york": "usa", "san francisco": "usa",
  "grecia": "grecia", "greece": "grecia", "athens": "grecia", "atenas": "grecia",
  "luxemburgo": "luxemburgo", "luxembourg": "luxemburgo",
};

function getCountryFromLocation(ubicacion: string): string | null {
  if (!ubicacion) return null;
  const lower = ubicacion.toLowerCase();
  for (const [keyword, paisId] of Object.entries(LOCATION_TO_PAIS)) {
    if (lower.includes(keyword)) return paisId;
  }
  return null;
}

const SPAIN_KEYWORDS = ["madrid", "barcelona", "valencia", "sevilla", "zaragoza", "málaga", "bilbao", "españa", "spain", "remote", "remoto", "teletrabajo"];
function isSpainOrRemote(ubicacion: string): boolean {
  const lower = ubicacion.toLowerCase();
  return SPAIN_KEYWORDS.some(k => lower.includes(k));
}

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
  { icon: "📧", label: "Enviar CV automático", desc: "A múltiples empresas en segundos", msg: "Quiero enviar mi CV automáticamente a empresas", destacado: true },
  { icon: "🔍", label: "Buscar trabajo", desc: "Por puesto y ciudad", msg: "Quiero buscar trabajo, ¿me ayudas?" },
  { icon: "📝", label: "Crear mi CV", desc: "Paso a paso con IA", msg: "__ENTREVISTA__" },
  { icon: "🎯", label: "Preparar entrevista", desc: "Simula preguntas reales", msg: "Quiero preparar una entrevista de trabajo" },
  { icon: "🌍", label: "Emigrar", desc: "Alemania, Irlanda, UK...", msg: "Quiero emigrar al extranjero, ¿qué opciones tengo?" },
  { icon: "👶", label: "Au Pair", desc: "Programa de trabajo internacional", msg: "Quiero información sobre el programa Au Pair en el extranjero" },
  { icon: "📸", label: "Mejorar mi foto", desc: "Prompts IA para foto profesional", msg: "¿Cómo mejoro mi foto de CV? Dame prompts para ChatGPT" },
  { icon: "📄", label: "Subir mi CV", desc: "PDF, Word — lo analizo al instante", msg: "__SUBIR_CV__" },
  { icon: "📋", label: "Mi CV", desc: "Ver y editar mi currículum", href: "/app/curriculum" },
  { icon: "📬", label: "Mis envíos", desc: "Historial de CVs enviados", href: "/app/empresas" },
  { icon: "📊", label: "Pipeline", desc: "Mis candidaturas activas", href: "/app/pipeline" },
  { icon: "❤️", label: "Guardadas", desc: "Ofertas que guardé", href: "/app/guardados" },
];

function sanitizeGusiHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    .replace(/javascript\s*:/gi, "about:")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
}

export default function GusiChat({ modoIncrustado }: { modoIncrustado?: boolean } = {}) {
  const [abierto, setAbierto] = useState(!!modoIncrustado);
  const [logueado, setLogueado] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);

  const inicializadoRef = useRef(false);

  // Verificar login — solo una vez al montar (no resetear en cada toggle del chat)
  useEffect(() => {
    if (inicializadoRef.current) return;
    inicializadoRef.current = true;
    async function checkAuth() {
      try {
        const { data: { user } } = await getSupabaseBrowser().auth.getUser();
        setLogueado(!!user);
        if (user?.id) setUserId(user.id);
        if (user) {
          setMensajes([{ role: "gusi", text: `¡Hola! Soy Guzzi, tu asistente de empleo. ¿Qué hacemos hoy?\n\nPuedo ayudarte con:\n📧 **Enviar tu CV automático** a empresas\n📝 Crear o mejorar tu CV\n🔍 Buscar ofertas por puesto y ciudad\n🎯 Prepararte para entrevistas` }]);
        } else {
          setMensajes([{ role: "gusi", text: "¡Hola! Soy Guzzi, tu asistente de empleo de BuscayCurra.\n\n⚠️ **Primero necesitas una cuenta** para que pueda ayudarte.\n\nEs gratis y tarda 30 segundos:\n👉 **Regístrate** o **inicia sesión**" }]);
        }
      } catch {
        setMensajes([{ role: "gusi", text: "¡Hola! Soy Guzzi. Regístrate primero para que pueda ayudarte." }]);
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
  const [notif, setNotif] = useState(false);
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
      addMsg("gusi", "📄 ¡Perfecto! Tienes dos opciones:\n\n1. **Aquí abajo** → Pulsa el clip 📎 para subir tu PDF\n2. **En Perfil** → Ve a 👤 Perfil → Mi CV\n\n¿Tienes tu CV en PDF? ¡Súbelo y yo me encargo del resto!", "upload_hint");
      setMostrarSugerencias(false);
      return;
    }

    // Acción especial: entrevista
    if (texto === "__ENTREVISTA__") {
      setModoEntrevista(true);
      setMostrarSugerencias(false);
      addMsg("user", "Quiero crear mi CV paso a paso");
      addMsg("gusi", "¡Genial! Vamos a crear un CV increíble juntos. Yo pregunto, tú respondes. ¡Será rápido!\n\n👉 Empecemos: **¿Cuál es tu nombre completo?**");
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
          userId: userId || undefined,
        }),
      });

      const data = await res.json();
      setMensajes(prev => [...prev, { role: "gusi", text: data.reply || "¡Ups! Inténtalo de nuevo.", action: data.action, jobs: data.jobs }]);
    } catch {
      addMsg("gusi", "Sin conexión. Comprueba tu internet.");
    }
    setCargando(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.type !== "application/pdf") {
      addMsg("gusi", "⚠️ Solo acepto PDFs. Por favor, selecciona un archivo .pdf");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addMsg("gusi", "⚠️ El archivo es muy grande (máx 5MB). Intenta comprimir el PDF.");
      return;
    }

    addMsg("user", `📄 Subiendo: ${file.name}`);
    setCargando(true);

    try {
      // Get auth token
      const { getSupabaseBrowser } = await import("@/lib/supabase-browser");
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) {
        addMsg("gusi", "⚠️ Necesitas estar logueado. Ve a iniciar sesión primero.");
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
        addMsg("gusi", `⚠️ ${(data as {error?: string}).error || "No pude subir el CV. Inténtalo de nuevo."}`);
        setCargando(false);
        return;
      }

      // 2. Extraer datos con IA
      addMsg("gusi", "🔍 Leyendo tu CV con IA... un momento");
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
          addMsg("gusi", `✅ **¡CV subido y analizado!** 🎉\n\n👤 **${parsed.nombre} ${parsed.apellidos || ""}**\n📞 ${parsed.telefono || "Sin teléfono"}\n📧 ${parsed.email || "Sin email"}\n📍 ${parsed.ciudad || "Sin ciudad"}\n${expText ? `\n💼 Experiencia:\n${expText}` : ""}\n\n✨ **Los campos se han rellenado** en la página de CV.\n\n¿Qué hacemos ahora?\n📧 **Enviar CV automáticamente**\n🔍 Buscar ofertas que encajen\n✨ Mejorar el CV con IA`);
        } else {
          addMsg("gusi", "✅ **¡CV subido!** 🎉\n\nNo pude leer todos los datos automáticamente, pero tu PDF está guardado.\n\nVe a 📄 **Currículum** para rellenar los campos manualmente o mejorarlos con IA.");
        }
      } else {
        addMsg("gusi", "✅ **¡CV subido!** 🎉\n\nAhora puedo:\n📧 **Enviar tu CV automáticamente** a empresas\n🔍 Buscar ofertas que encajen contigo\n\n¿Empezamos a buscar trabajo? 🚀");
      }
    } catch {
      addMsg("gusi", "⚠️ Error al subir. Comprueba tu conexión.");
    }
    setCargando(false);
  };

  const limpiar = () => {
    setMensajes([{ role: "gusi", text: "¡Nueva conversación! ¿En qué te ayudo hoy?" }]);
    setModoEntrevista(false);
    setMostrarSugerencias(true);
  };

  return (
    <>
      {/* ── Panel principal ─────────────────────────────────────── */}
      {abierto && (
        <div
          className={modoIncrustado
            ? "flex flex-col h-full overflow-hidden"
            : "fixed z-[9998] flex flex-col overflow-hidden"
          }
          style={modoIncrustado ? {
            background: "#0f1117",
          } : {
            bottom: "5rem", right: "1rem", left: "1rem",
            maxWidth: "440px", marginLeft: "auto",
            height: "min(72vh, 580px)",
            background: "#0f1117",
            borderRadius: "1rem",
            border: "1px solid #2d3142",
            boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
          }}
        >
          {/* ── Header ── */}
          <div className="px-4 py-3 flex items-center justify-between shrink-0"
            style={{ background: "#111827", borderBottom: "1px solid #1e212b" }}>
            <div className="flex items-center gap-2.5">
              <GuzziAvatar size={34} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Guzzi</span>
                  {modoEntrevista && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                      MODO CV
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
                  <span className="text-[10px]" style={{ color: "#64748b" }}>Asistente de empleo IA</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={limpiar} title="Nueva conversación"
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition hover:opacity-80"
                style={{ background: "#1e212b", color: "#64748b", border: "1px solid #2d3142" }}>
                Nueva
              </button>
              {!modoIncrustado && (
                <button onClick={() => setAbierto(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                  style={{ background: "#1e212b", color: "#64748b", border: "1px solid #2d3142" }}>
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ── Área de mensajes ── */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
            style={{ background: "#0f1117" }}>
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2.5`}>
                {m.role === "gusi" && (
                  <div className="shrink-0 mt-0.5">
                    <GuzziAvatar size={28} />
                  </div>
                )}
                <div className="max-w-[80%] space-y-2">
                  <div
                    className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                    style={{
                      background: m.role === "user" ? "#22c55e" : "#1e212b",
                      color: m.role === "user" ? "#0a1208" : "#e2e8f0",
                      borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                      border: m.role === "gusi" ? "1px solid #2d3142" : "none",
                      fontWeight: m.role === "user" ? 500 : 400,
                    }}
                    dangerouslySetInnerHTML={{ __html: sanitizeGusiHtml(formatGusiText(m.text)) }}
                  />
                  {/* Acción: CV completo */}
                  {m.action === "cv_complete" && (
                    <button onClick={() => router.push("/app/curriculum")}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
                      style={{ background: "#3b82f6", color: "white" }}>
                      📄 Ver mi CV generado →
                    </button>
                  )}
                  {/* Acción: Ofertas */}
                  {m.jobs && m.jobs.length > 0 && (
                    <div className="space-y-2">
                      {m.jobs.map((job) => {
                        const matchColor = job.match >= 80 ? "#22c55e" : job.match >= 60 ? "#f59e0b" : "#94a3b8";
                        const paisId = getCountryFromLocation(job.ubicacion);
                        const enEspana = isSpainOrRemote(job.ubicacion);
                        const locationHref = paisId
                          ? `/app/emigrar?pais=${paisId}`
                          : enEspana ? `/app/buscar?q=${encodeURIComponent(job.titulo)}` : null;
                        return (
                          <div key={job.id} className="rounded-xl p-3 transition hover:border-[#3d4258]"
                            style={{ background: "#161922", border: "1px solid #2d3142" }}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                {job.url ? (
                                  <a href={job.url} target="_blank" rel="noopener noreferrer"
                                    className="text-[13px] font-semibold truncate block hover:underline"
                                    style={{ color: "#f1f5f9" }}>
                                    {job.titulo} ↗
                                  </a>
                                ) : (
                                  <p className="text-[13px] font-semibold truncate" style={{ color: "#f1f5f9" }}>{job.titulo}</p>
                                )}
                                <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
                                  {job.empresa}
                                  {locationHref ? (
                                    <button onClick={() => router.push(locationHref)}
                                      className="ml-1 hover:underline" style={{ color: "#94a3b8" }}>
                                      · 📍 {job.ubicacion}
                                    </button>
                                  ) : (
                                    <span> · 📍 {job.ubicacion}</span>
                                  )}
                                </p>
                                {job.salario && job.salario !== "Ver en oferta" && (
                                  <p className="text-[11px] font-semibold mt-1" style={{ color: "#22c55e" }}>{job.salario}</p>
                                )}
                              </div>
                              <button
                                onClick={() => router.push(`/app/envios?empresa=${encodeURIComponent(job.empresa)}&puesto=${encodeURIComponent(job.titulo)}&web=${encodeURIComponent(job.url)}`)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition hover:opacity-90 shrink-0"
                                style={{ background: "#22c55e", color: "#0a1208" }}>
                                Enviar CV
                              </button>
                            </div>
                            {job.match > 0 && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1 rounded-full" style={{ background: "#2d3142" }}>
                                  <div className="h-full rounded-full transition-all" style={{ width: `${job.match}%`, background: matchColor }} />
                                </div>
                                <span className="text-[10px] font-semibold" style={{ color: matchColor }}>{job.match}%</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button
                        onClick={() => { addMsg("user", "Envía mi CV a todas"); router.push("/app/empresas"); }}
                        className="w-full py-2 rounded-xl text-sm font-semibold transition hover:opacity-90"
                        style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#22c55e" }}>
                        Enviar CV a todas ({m.jobs.length} ofertas) →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Typing indicator */}
            {cargando && (
              <div className="flex justify-start gap-2.5">
                <GuzziAvatar size={28} />
                <div className="px-4 py-3 rounded-[4px_18px_18px_18px]"
                  style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
                  <span className="inline-flex gap-1" style={{ color: "#64748b" }}>
                    <span className="animate-bounce" style={{ animationDelay: "0ms", fontSize: "18px", lineHeight: 1 }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms", fontSize: "18px", lineHeight: 1 }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms", fontSize: "18px", lineHeight: 1 }}>·</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Input ── */}
          <div className="px-4 pt-3 pb-2 shrink-0" style={{ background: "#111827", borderTop: "1px solid #1e212b" }}>
            <div className="flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()} title="Subir CV (PDF)"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-base transition hover:opacity-80 shrink-0"
                style={{ background: "#1e212b", color: "#64748b", border: "1px solid #2d3142" }}>
                📎
              </button>
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviar(input)}
                placeholder={modoEntrevista ? "Escribe tu respuesta..." : "Escribe un mensaje..."}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1"
                style={{
                  background: "#1e212b",
                  border: "1px solid #2d3142",
                  color: "#f1f5f9",
                  caretColor: "#22c55e",
                }}
              />
              <button
                onClick={() => enviar(input)}
                disabled={!input.trim() || cargando}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition disabled:opacity-30 hover:opacity-90 active:scale-95 shrink-0"
                style={{ background: input.trim() ? "#22c55e" : "#1e212b", color: input.trim() ? "#0a1208" : "#64748b", border: "1px solid #2d3142" }}>
                ➤
              </button>
            </div>
          </div>

          {/* ── Sugerencias (bajo el input) ── */}
          {mostrarSugerencias && (
            <div className="px-4 pb-2 pt-1.5 shrink-0" style={{ background: "#111827" }}>
              {logueado === false ? (
                <div className="flex gap-2">
                  <button onClick={() => router.push("/auth/registro")}
                    className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition hover:opacity-90"
                    style={{ background: "#22c55e", color: "#0a1208" }}>
                    Crear cuenta gratis
                  </button>
                  <button onClick={() => router.push("/auth/login")}
                    className="flex-1 py-2 rounded-lg text-[12px] font-medium transition hover:opacity-80"
                    style={{ background: "#1e212b", color: "#94a3b8", border: "1px solid #2d3142" }}>
                    Ya tengo cuenta
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {SUGERENCIAS.map((s, i) => (
                    <button key={i} onClick={() => s.href ? router.push(s.href) : enviar(s.msg ?? "")}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-left transition hover:opacity-80"
                      style={{
                        background: s.destacado ? "rgba(34,197,94,0.08)" : "#1e212b",
                        border: `1px solid ${s.destacado ? "rgba(34,197,94,0.2)" : "#2d3142"}`,
                      }}>
                      <span className="text-sm shrink-0">{s.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold truncate" style={{ color: s.destacado ? "#22c55e" : "#e2e8f0" }}>
                          {s.label}
                        </p>
                        <p className="text-[9px] truncate" style={{ color: s.destacado ? "rgba(34,197,94,0.6)" : "#475569" }}>
                          {s.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Burbuja flotante (solo modo no incrustado) ── */}
      {!modoIncrustado && (
        <>
          <button
            onClick={() => { setAbierto(!abierto); setPulso(false); setNotif(false); }}
            className="fixed bottom-4 right-4 z-[9999] w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 overflow-hidden"
            style={{
              background: abierto ? "#1e212b" : "#111827",
              border: `1.5px solid ${abierto ? "#2d3142" : "#22c55e"}`,
              boxShadow: abierto ? "0 4px 16px rgba(0,0,0,0.5)" : "0 4px 20px rgba(34,197,94,0.25)",
              animation: pulso && !abierto ? "gusi-pulse 2.5s ease-in-out infinite" : "none",
            }}
          >
            {abierto ? (
              <span className="text-lg" style={{ color: "#64748b" }}>✕</span>
            ) : (
              <>
                <GuzziAvatar size={44} />
                {notif && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: "#ef4444", color: "white" }}>
                    1
                  </span>
                )}
              </>
            )}
          </button>

          {!abierto && pulso && (
            <div className="fixed z-[9998] px-3 py-2 rounded-xl text-[12px] font-medium pointer-events-none whitespace-nowrap"
              style={{
                bottom: "4.5rem", right: "4.5rem",
                background: "#111827", color: "#f1f5f9",
                border: "1px solid #2d3142",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                animation: "gusi-tooltip 2s ease-in-out infinite",
              }}>
              ✨ Habla con Guzzi
            </div>
          )}
        </>
      )}

      <style jsx global>{`
        @keyframes gusi-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(34,197,94,0.25); }
          50% { box-shadow: 0 4px 28px rgba(34,197,94,0.45); }
        }
        @keyframes gusi-tooltip {
          0%, 100% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.8; transform: translateY(-2px); }
        }
      `}</style>
    </>
  );
}

/** Formatea **bold** y _italic_ en el texto de Guzzi */
function formatGusiText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f1f5f9;font-weight:600">$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}
