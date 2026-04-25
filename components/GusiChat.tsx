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
  { icon: "📧", label: "Enviar CV automático", msg: "__ENVIO_AUTO__", destacado: true },
  { icon: "📝", label: "Crear mi CV", msg: "__ENTREVISTA__" },
  { icon: "🔍", label: "Buscar trabajo", msg: "Quiero buscar trabajo, ¿me ayudas?" },
  { icon: "📸", label: "Mejorar mi foto", msg: "__FOTO_CV__" },
  { icon: "🎯", label: "Preparar entrevista", msg: "__PREP_ENTREVISTA__" },
  { icon: "🦋", label: "¡Conseguí trabajo!", msg: "__CONSEGUI_TRABAJO__" },
  { icon: "📄", label: "Subir mi CV", msg: "__SUBIR_CV__" },
];

export default function GusiChat({ modoIncrustado = false }: { modoIncrustado?: boolean }) {
  const [abierto, setAbierto] = useState(modoIncrustado);
  const [logueado, setLogueado] = useState<boolean | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);

  // Verificar login al abrir
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await getSupabaseBrowser().auth.getUser();
        setLogueado(!!user);
        if (user) {
          const esNuevo = user.created_at && (Date.now() - new Date(user.created_at).getTime()) < 30 * 60 * 1000;
          const nombre = (user.user_metadata?.full_name || "").split(" ")[0];
          const saludo = nombre ? `¡Hola, ${nombre}!` : "¡Hola!";
          const msgBienvenida = esNuevo
            ? `${saludo} 🐛 Soy Guzzi, tu asistente personal de empleo.\n\nEstoy aquí para que nunca más tengas que buscar trabajo solo. Yo trabajo, tú eliges.\n\n¿Por dónde empezamos?\n\n📄 **Tengo CV** → súbemelo y te busco las mejores ofertas\n📝 **No tengo CV** → te ayudo a crearlo en 5 minutos\n📧 Cuando esté listo, **envío tu candidatura automáticamente**\n\n¡Tú relájate, que yo me pongo a trabajar! 🐛→🦋`
            : `${saludo} 🐛 Soy Guzzi. ¿Qué hacemos hoy?\n\n📧 **Enviar tu CV automático** (¡nuestro FUERTE!)\n📝 Crear tu CV paso a paso\n🔍 Buscar ofertas para ti\n📸 Mejorar mi foto\n🎯 Preparar entrevistas`;
          setMensajes([{ role: "gusi", text: msgBienvenida }]);
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
  const [contextoFoto, setContextoFoto] = useState(false);
  const [modoEntrevista, setModoEntrevista] = useState(false);
  const [modoEnvio, setModoEnvio] = useState(false);
  const queryEnvioRef = useRef<string>("");
  const [modoPreparaEntrevista, setModoPreparaEntrevista] = useState(false);
  const empresaEntrevistaRef = useRef<string>("");
  const [pulso, setPulso] = useState(true);
  const [notif, setNotif] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastParsedCV = useRef<Record<string, unknown> | null>(null);
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

  const actualizarEtapa = async (etapa: number) => {
    try {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) return;
      await getSupabaseBrowser()
        .from("profiles")
        .update({ oruga_stage: etapa })
        .eq("id", session.user.id);
    } catch { /* silent fail - column may not exist yet */ }
  };

  const enviar = async (texto: string) => {
    if (!texto.trim() || cargando) return;

    // Acción especial: subir CV
    if (texto === "__SUBIR_CV__") {
      addMsg("user", "Quiero subir mi CV");
      addMsg("gusi", "📄 ¡Perfecto! Súbeme tu CV en PDF directamente aquí.\n\n👇 Pulsa el botón 📎 que ves abajo a la izquierda del chat — ese es el clip para subir archivos.\n\nCuando lo tengas listo te lo analizo con IA y te digo cómo mejorarlo. 🐛", "upload_hint");
      setMostrarSugerencias(false);
      return;
    }

    // Preparacion de entrevista — pregunta empresa y puesto
    if (texto === "__PREP_ENTREVISTA__") {
      addMsg("user", "Quiero preparar una entrevista");
      addMsg("gusi", "¡Genial! Voy a prepararte como un coach. 🎯\n\n**¿Con qué empresa tienes la entrevista y para qué puesto?**\n\nEjemplo: *\"Entrevista en Mercadona para cajero\"* o *\"Inditex, puesto de dependienta\"* 🐛");
      setModoPreparaEntrevista(true);
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

    // Accion especial: consegui trabajo - butterfly moment
    if (texto === "__CONSEGUI_TRABAJO__") {
      addMsg("user", "¡Conseguí trabajo! 🦋");
      addMsg("gusi", "🦋 **¡INCREÍBLE!!!** \n\nEsto es lo que esperábamos desde el día uno. La metamorfosis está completa.\n\n¡Eres una mariposa! 🦋✨\n\nTe llevo ahora mismo a celebrarlo como se merece...");
      actualizarEtapa(4);
      setTimeout(() => router.push("/app/mariposa"), 2000);
      setMostrarSugerencias(false);
      return;
    }

    // Accion especial: envio automatico con visibilidad
    if (texto === "__ENVIO_AUTO__") {
      addMsg("user", "Quiero enviar mi CV automáticamente a empresas");
      addMsg("gusi", "📧 ¡Perfecto! Para encontrarte las empresas correctas necesito saber:\n\n**¿Qué puesto buscas y en qué ciudad?**\n\nEjemplo: *\"Administrativo en Madrid\"* o *\"Cocinero en Barcelona\"* 🐛");
      setModoEnvio(true);
      setMostrarSugerencias(false);
      return;
    }

    // Accion especial: foto CV
    if (texto === "__FOTO_CV__") {
      addMsg("user", "Quiero mejorar mi foto de CV");
      addMsg("gusi", "📸 Tu foto es lo primero que ven los reclutadores. Así funciona el proceso completo:\n\n**Paso 1 — Mejora la foto con ChatGPT:**\nAbre ChatGPT, sube tu foto y pega este prompt tal cual:\n\n---\n📋 **COPIA ESTO:**\n_Retoca esta foto para un currículum profesional: pon fondo blanco liso, iluminación frontal suave, aspecto limpio y formal tipo foto carnet. No cambies mi cara ni mis rasgos, solo mejora la luz, limpia el fondo y haz que parezca una foto de estudio profesional. Tamaño cuadrado._\n---\n\n**Paso 2 — Descarga la foto mejorada** de ChatGPT.\n\n**Paso 3 — Súbela a tu CV:**\nVe a 📄 **Currículum → sección Foto para el CV** y sube la foto descargada. Quedará vinculada directamente a tu CV. 🐛→🦋");
      setTimeout(() => {
        addMsg("gusi", "👉 ¿Vamos a tu CV para subir la foto cuando la tengas lista?");
        setContextoFoto(true);
        setMostrarSugerencias(true);
      }, 800);
      setMostrarSugerencias(false);
      return;
    }

    // Accion especial: ir a curriculum
    if (texto === "__IR_CURRICULUM__") {
      addMsg("user", "Sí, vamos al CV");
      addMsg("gusi", "📄 ¡Perfecto! Te llevo ahora mismo. En la sección **Foto para el CV** tienes el prompt listo y el botón para subir la foto. 🐛");
      setTimeout(() => router.push("/app/curriculum"), 1200);
      setMostrarSugerencias(false);
      return;
    }

    // Accion especial: mejorar CV
    if (texto === "__MEJORAR_CV__") {
      addMsg("user", "Sí, mejora mi CV con IA");
      addMsg("gusi", "✨ Analizando tu CV con IA... un momento 🐛");
      setMostrarSugerencias(false);
      try {
        const { getSupabaseBrowser } = await import("@/lib/supabase-browser");
        const { data: { session } } = await getSupabaseBrowser().auth.getSession();
        const parsed = lastParsedCV.current;
        if (!session || !parsed) {
          addMsg("gusi", "⚠️ No encuentro tu CV. Súbelo primero con el clip 📎");
          return;
        }
        const exp = ((parsed.experiencia as Array<{puesto?: string; empresa?: string; periodo?: string}>) || [])
          .map(e => `- ${e.puesto || ""} en ${e.empresa || ""} ${e.periodo ? "(" + e.periodo + ")" : ""}`)
          .join("\n");
        const cvText = [
          `Nombre: ${parsed.nombre || ""} ${parsed.apellidos || ""}`,
          `Email: ${parsed.email || ""}`,
          `Teléfono: ${parsed.telefono || ""}`,
          `Ciudad: ${parsed.ciudad || ""}`,
          `Resumen: ${parsed.resumen || ""}`,
          exp ? `Experiencia:\n${exp}` : "",
          parsed.habilidades ? `Habilidades: ${(parsed.habilidades as string[]).join(", ")}` : "",
          parsed.formacion ? `Formación: ${JSON.stringify(parsed.formacion)}` : "",
        ].filter(Boolean).join("\n");

        const res = await fetch("/api/cv/mejorar", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ cvText, jobTitle: "" }),
        });
        const data = await res.json();
        if (data.cvMejorado) {
          addMsg("gusi", `✅ **¡CV mejorado!** 🐛🎉\n\nAquí tienes tu CV optimizado:\n\n---\n${data.cvMejorado}\n---\n\n💾 Ve a 📄 **Currículum** para guardarlo y descargarlo en PDF.`);
        } else {
          addMsg("gusi", `⚠️ ${data.error || "No pude mejorar el CV. Inténtalo de nuevo."} 🐛`);
        }
      } catch {
        addMsg("gusi", "⚠️ Error al mejorar el CV. Comprueba tu conexión. 🐛");
      }
      return;
    }

    // Modo preparacion entrevista — el usuario acaba de decir empresa y puesto
    if (modoPreparaEntrevista) {
      setModoPreparaEntrevista(false);
      empresaEntrevistaRef.current = texto;
      const nuevosMensajesEnt = [...mensajes, { role: "user" as const, text: texto }];
      setMensajes(nuevosMensajesEnt);
      setInput("");
      setCargando(true);
      try {
        const cvResumen = lastParsedCV.current
          ? JSON.stringify({
              nombre: lastParsedCV.current.nombre,
              experiencia: (lastParsedCV.current.experiencia as unknown[] || []).slice(0, 3),
              habilidades: lastParsedCV.current.habilidades,
              estudios: lastParsedCV.current.estudios,
            })
          : null;
        const res = await fetch("/api/gusi/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: texto,
            history: [],
            mode: "prep_entrevista",
            cvData: cvResumen,
          }),
        });
        const data = await res.json();
        setMensajes(prev => [...prev, { role: "gusi", text: data.reply || "Algo salió mal, inténtalo de nuevo 🐛" }]);
      } catch {
        addMsg("gusi", "Sin conexión. Comprueba tu internet 🐛");
      }
      setCargando(false);
      return;
    }

    // Modo envio: el usuario acaba de decir qué puesto/ciudad busca
    if (modoEnvio) {
      setModoEnvio(false);
      queryEnvioRef.current = texto;
      const nuevosMensajesEnvio = [...mensajes, { role: "user" as const, text: texto }];
      setMensajes(nuevosMensajesEnvio);
      setInput("");
      setCargando(true);
      try {
        const res = await fetch(`/api/jobs/search?q=${encodeURIComponent(texto)}&page=1`);
        const data = await res.json();
        const ofertas: Oferta[] = (data.ofertas || []).slice(0, 5);
        if (ofertas.length === 0) {
          addMsg("gusi", `🔍 No encontré ofertas para "${texto}". Prueba con términos más generales o diferente ciudad. 🐛`);
        } else {
          const lista = ofertas.map((o, i) => `${i + 1}. **${o.empresa}** — ${o.titulo} · ${o.ubicacion}`).join("\n");
          setMensajes(prev => [...prev, {
            role: "gusi",
            text: `📧 Encontré **${data.total} ofertas**. Las más relevantes son:\n\n${lista}\n\n¿Envío tu CV a estas empresas?`,
            jobs: ofertas,
          }]);
        }
      } catch {
        addMsg("gusi", "⚠️ Error al buscar ofertas. Comprueba tu conexión. 🐛");
      }
      setCargando(false);
      return;
    }

    setMostrarSugerencias(false);
    setContextoFoto(false);
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
          lastParsedCV.current = parsed;
          actualizarEtapa(1);
          const exp = (parsed.experiencia || []).slice(0, 3);
          const expText = exp.map((e: {puesto?: string; empresa?: string}) => `  • ${e.puesto || "?"} en ${e.empresa || "?"}`).join("\n");
          addMsg("gusi", `✅ **¡CV subido y analizado!** 🐛🎉\n\n👤 **${parsed.nombre} ${parsed.apellidos || ""}**\n📞 ${parsed.telefono || "Sin teléfono"}\n📧 ${parsed.email || "Sin email"}\n📍 ${parsed.ciudad || "Sin ciudad"}\n${expText ? `\n💼 Experiencia:\n${expText}` : ""}\n\n✨ Los datos están guardados en tu perfil.`);
          setTimeout(() => {
            addMsg("gusi", "✨ **¿Quieres que mejoremos tu CV con IA?**\n\nPuedo optimizar el texto para que destaque más ante los reclutadores. Tarda 30 segundos. 🐛");
            setMostrarSugerencias(true);
          }, 900);
        } else {
          lastParsedCV.current = parsed;
          addMsg("gusi", "✅ **¡CV subido!** 🐛🎉\n\nNo pude extraer todos los datos automáticamente, pero el PDF está guardado.\n\n📄 Si quieres, puedes rellenar los datos manualmente en **Currículum**. Pero primero... 👇");
          setTimeout(() => {
            addMsg("gusi", "✨ **¿Quieres que mejoremos tu CV con IA?**\n\nPuedo optimizar el texto para que destaque más ante los reclutadores y consiga más respuestas. Tarda 30 segundos. 🐛");
            setMostrarSugerencias(true);
          }, 900);
        }
      } else {
        addMsg("gusi", "✅ **¡CV subido!** 🐛🎉\n\nTu PDF está guardado y listo para enviar.");
          setTimeout(() => {
            addMsg("gusi", "✨ **¿Quieres que mejoremos tu CV con IA?**\n\nPuedo optimizar el texto para que destaque más ante los reclutadores y consiga más respuestas. Tarda 30 segundos. 🐛");
            setMostrarSugerencias(true);
          }, 900);
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
      {(modoIncrustado || abierto) && (
        <div
          className={modoIncrustado ? "flex flex-col overflow-hidden w-full" : "fixed z-[9998] flex flex-col overflow-hidden"}
          style={modoIncrustado ? {
            height: "100%",
            minHeight: "520px",
            background: "#12160d",
            borderRadius: "1.25rem",
            border: "2px solid rgba(126,213,111,0.25)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          } : {
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
              {!modoIncrustado && <button onClick={() => setAbierto(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition hover:opacity-80"
                style={{ background: "rgba(126,213,111,0.08)", color: "#706a58" }}>✕</button>}
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
                        actualizarEtapa(2);
                      }}
                      className="w-full py-2 rounded-xl text-[12px] font-bold transition hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, rgba(126,213,111,0.15), rgba(92,184,72,0.15))", border: "1.5px solid rgba(126,213,111,0.3)", color: "#7ed56f" }}>
                      📧 Enviar CV a TODAS ({m.jobs.length} ofertas)
                    </button>
                    <button
                      onClick={() => {
                        const q = queryEnvioRef.current;
                        router.push(`/app/buscar${q ? "?q=" + encodeURIComponent(q) : ""}`);
                      }}
                      className="w-full py-2 rounded-xl text-[12px] font-medium transition hover:opacity-90"
                      style={{ background: "transparent", border: "1px solid rgba(126,213,111,0.2)", color: "#706a58" }}>
                      🔍 Ver todas las ofertas →
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
                /* Logueado: sugerencias contextuales o todas */
                contextoFoto ? (
                  <>
                    <button key="ir-cv" onClick={() => { setContextoFoto(false); enviar("__IR_CURRICULUM__"); }}
                      className="flex items-center gap-1 px-3 py-2 rounded-full text-[12px] font-bold transition hover:opacity-80"
                      style={{ background: "rgba(126,213,111,0.18)", color: "#7ed56f", border: "1.5px solid rgba(126,213,111,0.35)" }}>
                      📄 Ir a mi CV ahora
                    </button>
                    <button key="despues" onClick={() => { setContextoFoto(false); setMostrarSugerencias(false); addMsg("gusi", "Sin problema. Cuando tengas la foto lista, vuelve aquí o ve directamente a 📄 Currículum → Foto para el CV. 🐛"); }}
                      className="flex items-center gap-1 px-3 py-2 rounded-full text-[12px] font-medium transition hover:opacity-80"
                      style={{ background: "rgba(126,213,111,0.06)", color: "#b0a890", border: "1px solid rgba(126,213,111,0.12)" }}>
                      ⏱ Lo hago después
                    </button>
                  </>
                ) : SUGERENCIAS.map((s, i) => (
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

      {!modoIncrustado && (<>
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

      </>
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
