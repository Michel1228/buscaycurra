"use client";

/**
 * GusiChat v2 — Chatbot con historial de conversaciones y CV guardado
 * - Sidebar con conversaciones previas
 - CV guardado persistente
 * - Diseño limpio sin saturar
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

interface Conversacion {
  id: string;
  title: string;
  last_message: string;
  updated_at: string;
}

const SUGERENCIAS = [
  { icon: "📧", label: "Enviar CV automático", msg: "__ENVIO_AUTO__", destacado: true },
  { icon: "📎", label: "Subir mi CV", msg: "__SUBIR_CV__", destacado: true },
  { icon: "📝", label: "Crear mi CV", msg: "__ENTREVISTA__" },
  { icon: "🔍", label: "Buscar trabajo", msg: "Quiero buscar trabajo, ¿me ayudas?" },
  { icon: "📸", label: "Mejorar mi foto", msg: "__FOTO_CV__" },
  { icon: "🎯", label: "Preparar entrevista", msg: "__PREP_ENTREVISTA__" },
  { icon: "📄", label: "Ver mi CV", msg: "__VER_CV__" },
  { icon: "✉️", label: "Carta recomendación", msg: "__CARTA_RECOMENDACION__" },
];

export default function GusiChat({ modoIncrustado = false }: { modoIncrustado?: boolean }) {
  const [abierto, setAbierto] = useState(modoIncrustado);
  const [logueado, setLogueado] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [conversacionActual, setConversacionActual] = useState<string | null>(null);
  const [mostrarSidebar, setMostrarSidebar] = useState(false);
  const [cvGuardado, setCvGuardado] = useState<Record<string, unknown> | null>(null);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(true);
  const [modoEntrevista, setModoEntrevista] = useState(false);
  const [modoEnvio, setModoEnvio] = useState(false);
  const queryEnvioRef = useRef<string>("");
  const [modoPreparaEntrevista, setModoPreparaEntrevista] = useState(false);
  const empresaEntrevistaRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastParsedCV = useRef<Record<string, unknown> | null>(null);
  const router = useRouter();

  async function handleFileUpload(file: File) {
    if (!file.type.includes("pdf")) {
      setMensajes((prev) => [...prev, { role: "gusi", text: "❌ Solo acepto archivos PDF. Intenta de nuevo." }]);
      return;
    }
    setCargando(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/cv/extraer", { method: "POST", body: fd });
      if (res.ok) {
        const parsed = await res.json();
        if (!parsed.error) {
          lastParsedCV.current = parsed;
          setCvGuardado(parsed);
          // Guardar en BD
          if (userId) {
            await fetch("/api/gusi/cv", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, cvData: parsed, cvText: JSON.stringify(parsed) }),
            });
          }
          setMensajes((prev) => [...prev, { 
            role: "gusi", 
            text: `✅ **CV recibido y analizado.**\n\nHe extraído tus datos. ¿Quieres que:\n\n1. ✨ **Mejore tu CV** con IA\n2. 📧 **Envíe tu CV** a ofertas\n3. ✉️ **Genere una carta** de presentación\n\n¿Qué prefieres?` 
          }]);
        } else {
          setMensajes((prev) => [...prev, { role: "gusi", text: "⚠️ No pude leer bien el PDF. ¿Puedes escribirme tus datos directamente?" }]);
        }
      }
    } catch {
      setMensajes((prev) => [...prev, { role: "gusi", text: "❌ Error al procesar el PDF. Intenta de nuevo o escribe tus datos." }]);
    } finally {
      setCargando(false);
    }
  }

  // Verificar login y cargar datos
  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await getSupabaseBrowser().auth.getUser();
        setLogueado(!!user);
        
        if (user) {
          setUserId(user.id);
          // Cargar conversaciones
          await cargarConversaciones(user.id);
          // Cargar CV guardado
          await cargarCV(user.id);
          
          const esNuevo = user.created_at && (Date.now() - new Date(user.created_at).getTime()) < 30 * 60 * 1000;
          const nombre = (user.user_metadata?.full_name || "").split(" ")[0];
          const saludo = nombre ? `¡Hola, ${nombre}!` : "¡Hola!";
          const msgBienvenida = esNuevo
            ? `${saludo} 🐛 Soy Guzzi, tu asistente personal de empleo.\n\nEstoy aquí para que nunca más tengas que buscar trabajo solo. Yo trabajo, tú eliges.\n\n¿Por dónde empezamos?\n\n📄 **Tengo CV** → súbemelo y te busco las mejores ofertas\n📝 **No tengo CV** → te ayudo a crearlo en 5 minutos\n📧 Cuando esté listo, **envío tu candidatura automáticamente**\n\n¡Tú relájate, que yo me pongo a trabajar! 🐛→🦋`
            : `${saludo} 🐛 ¿Qué hacemos hoy?\n\n📧 **Enviar tu CV automático** (¡nuestro FUERTE!)\n📝 Crear tu CV paso a paso\n🔍 Buscar ofertas para ti\n📸 Mejorar mi foto\n🎯 Preparar entrevistas\n📄 Ver mi CV guardado`;
          setMensajes([{ role: "gusi", text: msgBienvenida }]);
        } else {
          setMensajes([{ role: "gusi", text: "¡Hola! 🐛 Soy Gusi. Regístrate primero para que pueda ayudarte." }]);
        }
      } catch {
        setMensajes([{ role: "gusi", text: "¡Hola! 🐛 Soy Gusi. Regístrate primero." }]);
        setLogueado(false);
      }
    }
    init();
  }, [abierto]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes, cargando]);

  // Guardar conversación automáticamente
  useEffect(() => {
    if (userId && mensajes.length > 1) {
      const timeout = setTimeout(() => {
        guardarConversacion();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [mensajes, userId]);

  async function cargarConversaciones(uid: string) {
    try {
      const res = await fetch(`/api/gusi/conversations?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setConversaciones(data.conversations || []);
      }
    } catch (e) {
      console.error("Error cargando conversaciones:", e);
    }
  }

  async function cargarCV(uid: string) {
    try {
      const res = await fetch(`/api/gusi/cv?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.cv) {
          setCvGuardado(data.cv);
          lastParsedCV.current = data.cv;
        }
      }
    } catch (e) {
      console.error("Error cargando CV:", e);
    }
  }

  async function guardarConversacion() {
    if (!userId || mensajes.length === 0) return;
    try {
      await fetch("/api/gusi/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          conversationId: conversacionActual,
          messages: mensajes,
          cvData: cvGuardado,
        }),
      });
    } catch (e) {
      console.error("Error guardando conversación:", e);
    }
  }

  async function cargarConversacion(id: string) {
    if (!userId) return;
    try {
      const res = await fetch(`/api/gusi/conversations?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const conv = data.conversations?.find((c: Conversacion) => c.id === id);
        if (conv) {
          setConversacionActual(id);
          // Cargar mensajes de la conversación
          const detailRes = await fetch(`/api/gusi/conversations/${id}?userId=${userId}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            if (detail.messages) {
              setMensajes(detail.messages);
            }
          }
        }
      }
    } catch (e) {
      console.error("Error cargando conversación:", e);
    }
  }

  async function nuevaConversacion() {
    setConversacionActual(null);
    setMensajes([{ 
      role: "gusi", 
      text: "¡Nueva conversación! 🐛 ¿Qué necesitas?\n\n📧 Enviar CV automático\n📝 Crear mi CV\n🔍 Buscar trabajo\n📸 Mejorar foto\n🎯 Preparar entrevista" 
    }]);
    setMostrarSugerencias(true);
  }

  async function enviarMensaje(texto: string) {
    if (!texto.trim() || cargando) return;
    
    const nuevoMensaje: Mensaje = { role: "user", text: texto };
    setMensajes((prev) => [...prev, nuevoMensaje]);
    setInput("");
    setCargando(true);
    setMostrarSugerencias(false);

    // Manejar comandos especiales
    if (texto === "__ENTREVISTA__") {
      setModoEntrevista(true);
      setCargando(false);
      setMensajes((prev) => [...prev, { 
        role: "gusi", 
        text: "📝 ¡Vamos a crear tu CV! Te voy preguntando paso a paso.\n\n👉 **¿Cuál es tu nombre completo?**\n\n(Responde y sigo con la siguiente pregunta)" 
      }]);
      return;
    }

    if (texto === "__FOTO_CV__") {
      setCargando(false);
      setMensajes((prev) => [...prev, { 
        role: "gusi", 
        text: "📸 Para mejorar tu foto de CV:\n\n**Opción 1 — ChatGPT:**\nCopia este prompt exacto:\n_\"Limpia esta foto de perfil profesional, mejora la iluminación, elimina el fondo y pon un fondo gris claro degradado. Mantén la expresión natural.\"_\n\n**Opción 2 — Gratis:**\n1. Remove.bg → quita el fondo\n2. Canva → añade fondo profesional\n\n**Tips:** Luz de ventana, ropa formal, sonrisa natural, pecho arriba.\n\n¡Una buena foto = +40% respuestas! 🐛📸" 
      }]);
      return;
    }

    if (texto === "__PREP_ENTREVISTA__") {
      setModoPreparaEntrevista(true);
      setCargando(false);
      setMensajes((prev) => [...prev, { 
        role: "gusi", 
        text: "🎯 ¡Preparemos tu entrevista!\n\n¿Para qué empresa es la entrevista? (Escribe el nombre)" 
      }]);
      return;
    }

    if (texto === "__ENVIO_AUTO__") {
      setModoEnvio(true);
      setCargando(false);
      setMensajes((prev) => [...prev, { 
        role: "gusi", 
        text: "📧 ¡Perfecto! Para enviar tu CV automáticamente:\n\n1. ¿Qué trabajo buscas? (ej: camarero, programador...)\n2. ¿En qué ciudad?\n\nYo busco las ofertas y envío tu CV a todas. 🐛→📧" 
      }]);
      return;
    }

    if (texto === "__VER_CV__") {
      setCargando(false);
      if (cvGuardado) {
        const cvText = formatCV(cvGuardado);
        setMensajes((prev) => [...prev, { 
          role: "gusi", 
          text: `📄 **Tu CV guardado:**\n\n${cvText}\n\n¿Quieres mejorarlo o enviarlo?` 
        }]);
      } else {
        setMensajes((prev) => [...prev, { 
          role: "gusi", 
          text: "📄 No tienes CV guardado todavía.\n\nPuedes:\n1. Subir tu CV en PDF\n2. Crearlo paso a paso conmigo\n\n¿Qué prefieres?" 
        }]);
      }
      return;
    }

    if (texto === "__CARTA_RECOMENDACION__") {
      setCargando(false);
      setMensajes((prev) => [...prev, { 
        role: "gusi", 
        text: "✉️ Para generar una carta de recomendación personalizada, necesito:\n\n1. 🏢 Nombre de la empresa\n2. 🎯 Puesto al que aplicas\n\nDime estos datos y te hago una carta que destaque. 🐛" 
      }]);
      return;
    }

    if (texto === "__SUBIR_CV__") {
      setCargando(false);
      setMensajes((prev) => [...prev, { 
        role: "gusi", 
        text: "📎 **Sube tu CV en PDF** y yo lo mejoro con IA.\n\nTambién puedes escribirme tus datos directamente." 
      }]);
      // Abrir selector de archivo
      fileRef.current?.click();
      return;
    }

    // Llamar a la API de Gusi
    try {
      const res = await fetch("/api/gusi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: texto,
          history: mensajes.slice(-10),
          mode: modoEntrevista ? "entrevista" : modoEnvio ? "buscar" : "chat",
          cvData: cvGuardado ? JSON.stringify(cvGuardado) : undefined,
        }),
      });

      const data = await res.json();
      
      const respuestaGusi: Mensaje = { 
        role: "gusi", 
        text: data.reply || "No pude procesar eso. Inténtalo de nuevo. 🐛",
        action: data.action,
        jobs: data.jobs,
      };
      
      setMensajes((prev) => [...prev, respuestaGusi]);
    } catch {
      setMensajes((prev) => [...prev, { 
        role: "gusi", 
        text: "¡Ups! Algo falló. Inténtalo de nuevo 🐛" 
      }]);
    } finally {
      setCargando(false);
    }
  }

  function formatCV(cv: Record<string, unknown>): string {
    if (!cv) return "";
    let text = "";
    if (cv.nombre) text += `**${cv.nombre}**\n`;
    if (cv.email) text += `📧 ${cv.email}\n`;
    if (cv.telefono) text += `📞 ${cv.telefono}\n`;
    if (cv.ciudad) text += `📍 ${cv.ciudad}\n\n`;
    if (cv.experiencia) text += `**Experiencia:** ${cv.experiencia}\n`;
    if (cv.estudios) text += `**Formación:** ${cv.estudios}\n`;
    if (cv.habilidades) text += `**Habilidades:** ${cv.habilidades}\n`;
    return text;
  }

  // Si no está abierto, mostrar botón flotante
  if (!abierto && !modoIncrustado) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#22c55e] text-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center text-2xl"
        title="Hablar con Gusi"
      >
        🐛
      </button>
    );
  }

  return (
    <div className={`${modoIncrustado ? "h-full" : "fixed bottom-6 right-6 z-50 w-[400px] h-[600px]"} bg-[#0f1117] border border-[#2a2d35] rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2d35] bg-[#1a1d24]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐛</span>
          <div>
            <h3 className="font-semibold text-white text-sm">Guzzi</h3>
            <p className="text-xs text-gray-400">Tu asistente de empleo</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setMostrarSidebar(!mostrarSidebar)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#2a2d35] transition-colors"
            title="Historial"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          {!modoIncrustado && (
            <button 
              onClick={() => setAbierto(false)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#2a2d35] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Sidebar de conversaciones */}
      {mostrarSidebar && (
        <div className="absolute left-0 top-[52px] bottom-0 w-64 bg-[#1a1d24] border-r border-[#2a2d35] z-10 flex flex-col">
          <div className="p-3 border-b border-[#2a2d35]">
            <button 
              onClick={nuevaConversacion}
              className="w-full py-2 px-3 bg-[#22c55e] text-white rounded-lg text-sm font-medium hover:bg-[#16a34a] transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Nueva conversación
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversaciones.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No hay conversaciones previas</p>
            ) : (
              conversaciones.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    cargarConversacion(conv.id);
                    setMostrarSidebar(false);
                  }}
                  className={`w-full text-left p-3 border-b border-[#2a2d35] hover:bg-[#2a2d35] transition-colors ${conversacionActual === conv.id ? "bg-[#2a2d35]" : ""}`}
                >
                  <p className="text-sm text-white truncate">{conv.title}</p>
                  <p className="text-xs text-gray-500 truncate mt-1">{conv.last_message}</p>
                  <p className="text-xs text-gray-600 mt-1">{new Date(conv.updated_at).toLocaleDateString("es-ES")}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensajes.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === "user" 
                ? "bg-[#22c55e] text-white rounded-br-md" 
                : "bg-[#2a2d35] text-gray-200 rounded-bl-md"
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
              
              {/* Botones de acción para ofertas */}
              {msg.jobs && msg.jobs.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.jobs.map((job) => (
                    <div key={job.id} className="bg-[#1a1d24] rounded-lg p-2 text-xs">
                      <p className="font-medium text-white">{job.titulo}</p>
                      <p className="text-gray-400">{job.empresa} · {job.ubicacion}</p>
                      <p className="text-[#22c55e]">{job.match}% compatible</p>
                    </div>
                  ))}
                  <button 
                    onClick={() => enviarMensaje("__ENVIO_AUTO__")}
                    className="w-full py-2 bg-[#22c55e] text-white rounded-lg text-xs font-medium hover:bg-[#16a34a] transition-colors"
                  >
                    📧 Enviar mi CV a todas
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {cargando && (
          <div className="flex justify-start">
            <div className="bg-[#2a2d35] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sugerencias */}
      {mostrarSugerencias && mensajes.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {SUGERENCIAS.map((s, i) => (
              <button
                key={i}
                onClick={() => enviarMensaje(s.msg)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  s.destacado 
                    ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 hover:bg-[#22c55e]/30" 
                    : "bg-[#2a2d35] text-gray-300 hover:bg-[#3a3d45]"
                }`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-[#2a2d35]">
        <input
          type="file"
          ref={fileRef}
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = "";
          }}
        />
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-2.5 text-gray-400 hover:text-white rounded-xl text-sm transition-colors"
            title="Subir PDF"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviarMensaje(input)}
            placeholder="Escribe a Guzzi o adjunta un PDF..."
            className="flex-1 bg-[#1a1d24] border border-[#2a2d35] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e] transition-colors"
          />
          <button
            onClick={() => enviarMensaje(input)}
            disabled={cargando || !input.trim()}
            className="px-4 py-2.5 bg-[#22c55e] text-white rounded-xl text-sm font-medium hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
