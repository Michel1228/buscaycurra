"use client";

/**
 * GusiChat v3 — AGUSTÍN: Asistente Guzzi Ultra-Sofisticado
 * - Interacción paso a paso (no manual, todo conversacional)
 * - CV siempre en UNA SOLA PÁGINA
 * - Integración total con todas las funciones
 * - Plantilla de CV profesional estricta
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import CVVisual from "./CVVisual";

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
  cvData?: string;
}

interface Conversacion {
  id: string;
  title: string;
  last_message: string;
  updated_at: string;
}

// Pasos de la entrevista para crear CV
const PASOS_ENTREVISTA = [
  { campo: "nombre", pregunta: "📝 ¡Vamos a crear tu CV!\n\n**Paso 1/8: ¿Cuál es tu nombre completo?**" },
  { campo: "contacto", pregunta: "📞 **Paso 2/8: ¿Tu teléfono y email?**\n\n(Ej: 685 60 34 79, michel@email.com)" },
  { campo: "ciudad", pregunta: "📍 **Paso 3/8: ¿En qué ciudad vives?**" },
  { campo: "perfil", pregunta: "💼 **Paso 4/8: Cuéntame brevemente tu perfil profesional**\n\n(Ej: Profesional con 5 años en hostelería, rápido aprendizaje...)" },
  { campo: "experiencia1", pregunta: "🏢 **Paso 5/8: Tu último trabajo**\n\nFormato: AÑOS — PUESTO en EMPRESA (Ubicación)\nEj: 2020-2023 — Camarero en Bar La Plaza (Madrid)" },
  { campo: "experiencia2", pregunta: "🏢 **Paso 6/8: ¿Tienes otro trabajo anterior?**\n\n(Si no, escribe 'no')" },
  { campo: "formacion", pregunta: "🎓 **Paso 7/8: Tus estudios o formación**\n\nFormato: TÍTULO — CENTRO (Ubicación)\nEj: ESO — Colegio Santa Teresa (Calahorra)" },
  { campo: "aptitudes", pregunta: "🎯 **Paso 8/8: Tus 3-5 aptitudes principales**\n\n(Ej: Rápido aprendizaje, trabajo en equipo, fuerza física...)" },
];

const ACCIONES = [
  { icon: "📧", label: "Enviar CV", msg: "__ENVIO_AUTO__" },
  { icon: "📎", label: "Subir CV", msg: "__SUBIR_CV__" },
  { icon: "📝", label: "Crear CV", msg: "__ENTREVISTA__" },
  { icon: "🔍", label: "Buscar trabajo", msg: "Quiero buscar trabajo" },
  { icon: "🎯", label: "Preparar entrevista", msg: "__PREP_ENTREVISTA__" },
  { icon: "📄", label: "Ver CV", msg: "__VER_CV__" },
  { icon: "📸", label: "Foto perfil", msg: "__FOTO_CV__" },
  { icon: "✉️", label: "Carta", msg: "__CARTA_RECOMENDACION__" },
];

// Etiquetas legibles para los comandos internos (no mostrar el __ en el bubble)
const LABELS_COMANDO: Record<string, string> = {
  "__ENVIO_AUTO__": "📧 Enviar CV automático",
  "__SUBIR_CV__": "📎 Subir mi CV",
  "__ENTREVISTA__": "📝 Crear mi CV",
  "__FOTO_CV__": "📸 Mejorar mi foto",
  "__PREP_ENTREVISTA__": "🎯 Preparar entrevista",
  "__VER_CV__": "📄 Ver mi CV",
  "__CARTA_RECOMENDACION__": "✉️ Carta de recomendación",
};

function renderMd(text: string): React.ReactNode[] {
  // Split on **bold** and render React nodes
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((seg, i) => {
    if (seg.startsWith("**") && seg.endsWith("**")) {
      return <strong key={i} style={{ fontWeight: 700, color: "#f1f5f9" }}>{seg.slice(2, -2)}</strong>;
    }
    return seg;
  });
}

// Extrae la info clave del CV para ser proactivo sin preguntar
function extractCVInfo(cv: Record<string, unknown>): { puesto: string; ciudad: string; nombre: string } {
  const nombre = String(cv.nombre || cv.full_name || "").trim().split(" ")[0];
  const ciudad = String(cv.ciudad || cv.location || "").trim();
  let puesto = "";
  const exp = cv.experiencia || cv.experience;
  if (Array.isArray(exp) && exp.length > 0) {
    puesto = String((exp[0] as { puesto?: string }).puesto || "").trim();
  } else if (typeof exp === "string" && exp.trim()) {
    const m = exp.match(/(?:—|–|-)\s*(.+?)\s+en\s+/i);
    puesto = m?.[1]?.trim() || "";
  }
  return { puesto, ciudad, nombre };
}

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
  
  // Estados de modos
  const [modoEntrevista, setModoEntrevista] = useState(false);
  const [pasoEntrevista, setPasoEntrevista] = useState(0);
  const [datosCV, setDatosCV] = useState<Record<string, string>>({});
  
  const [modoEnvio, setModoEnvio] = useState(false);
  const [pasoEnvio, setPasoEnvio] = useState(0);
  const [datosEnvio, setDatosEnvio] = useState<Record<string, string>>({});
  
  // Estado para esperando confirmación de CV
  const [esperandoConfirmacionCV, setEsperandoConfirmacionCV] = useState(false);
  const [cvHtml, setCvHtml] = useState(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ============================================
  // EFECTOS INICIALES
  // ============================================

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await getSupabaseBrowser().auth.getUser();
        setLogueado(!!user);

        if (user) {
          setUserId(user.id);
          cargarConversaciones(user.id); // carga el historial en sidebar, sin bloquear
          const cvExistente = await cargarCV(user.id);

          const nombre = (user.user_metadata?.full_name || "").split(" ")[0];
          const saludo = nombre ? `¡Hola, ${nombre}!` : "¡Hola!";

          // Siempre arranca con mensaje fresco — el historial está en el sidebar
          if (cvExistente) {
            const { puesto, ciudad } = extractCVInfo(cvExistente);
            const puestoStr = puesto ? `**${puesto}**` : "tu sector";
            const ciudadStr = ciudad ? ` en **${ciudad}**` : "";
            setMensajes([{
              role: "gusi",
              text: `${saludo} 🐛 Tengo tu CV listo.\n\nVeo que tienes experiencia como ${puestoStr}${ciudadStr}. ¿Busco ofertas y envío candidaturas automáticamente?`,
            }]);
          } else {
            setMensajes([{
              role: "gusi",
              text: `${saludo} 🐛 Soy Guzzi. Dime qué necesitas o usa los botones de abajo.`,
            }]);
          }
        } else {
          setMensajes([{ role: "gusi", text: "¡Hola! 🐛 Soy Guzzi. Regístrate primero para que pueda ayudarte." }]);
        }
      } catch {
        setMensajes([{ role: "gusi", text: "¡Hola! 🐛 Soy Guzzi. Regístrate primero." }]);
        setLogueado(false);
      }
    }
    init();
  }, [abierto]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes, cargando]);

  useEffect(() => {
    if (userId && mensajes.length > 1) {
      const timeout = setTimeout(() => guardarConversacion(), 2000);
      return () => clearTimeout(timeout);
    }
  }, [mensajes, userId]);

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================

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

  async function cargarConversacion(id: string) {
    if (!userId) return;
    try {
      const res = await fetch(`/api/gusi/conversations/${id}?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setMensajes(data.messages);
          setConversacionActual(id);
        }
      }
    } catch (e) {
      console.error("Error cargando conversación:", e);
    }
  }

  async function cargarCV(uid: string): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(`/api/gusi/cv?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.cv) {
          setCvGuardado(data.cv);
          return data.cv;
        }
      }
    } catch (e) {
      console.error("Error cargando CV:", e);
    }
    return null;
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

  async function nuevaConversacion() {
    setConversacionActual(null);
    setMensajes([{ 
      role: "gusi", 
      text: "¡Nueva conversación! 🐛 ¿Qué necesitas?\n\n📧 Enviar CV automático\n📝 Crear mi CV\n🔍 Buscar trabajo\n📸 Mejorar foto\n🎯 Preparar entrevista" 
    }]);
    setModoEntrevista(false);
    setPasoEntrevista(0);
    setDatosCV({});
  }

  // ============================================
  // MANEJO DE FOTO
  // ============================================

  async function handlePhotoUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setMensajes(prev => [...prev, { role: "gusi", text: "❌ Solo acepto imágenes (JPG, PNG). Inténtalo de nuevo." }]);
      return;
    }
    setCargando(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const size = 200;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d")!;
            const min = Math.min(img.width, img.height);
            ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          };
          img.onerror = reject;
          img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const cvActualizado = { ...(cvGuardado || {}), fotoUrl: dataUrl };
      setCvGuardado(cvActualizado);

      if (userId) {
        await fetch("/api/gusi/cv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, cvData: cvActualizado, cvText: JSON.stringify(cvActualizado) }),
        });
      }

      setMensajes(prev => [...prev, {
        role: "gusi",
        text: "📸 **¡Foto añadida!** Ya aparece en tu CV profesional.",
        action: "ver_cv",
      }]);
    } catch {
      setMensajes(prev => [...prev, { role: "gusi", text: "❌ Error al procesar la foto. Inténtalo de nuevo." }]);
    } finally {
      setCargando(false);
    }
  }

  // ============================================
  // MANEJO DE ARCHIVOS
  // ============================================

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
          setCvGuardado(parsed);
          if (userId) {
            await fetch("/api/gusi/cv", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, cvData: parsed, cvText: JSON.stringify(parsed) }),
            });
          }
          const resumen = formatCVResumen(parsed);
          setEsperandoConfirmacionCV(true);
          setMensajes((prev) => [...prev, {
            role: "gusi",
            text: `✅ **CV analizado.** He extraído esto:\n\n${resumen}\n¿Quieres añadir o cambiar algo?\n\n(Escribe lo que quieras añadir, di "no" para mejorar con IA, o di "foto" para añadir tu foto de perfil)`,
            action: "ver_cv"
          }]);
        } else {
          setMensajes((prev) => [...prev, {
            role: "gusi",
            text: `⚠️ Tu PDF usa imágenes en lugar de texto, así que no puedo leerlo automáticamente.\n\n**Opciones:**\n1. Ve a 📄 **Mi CV** para rellenar los datos manualmente (recomendado)\n2. O escríbeme tus datos aquí directamente\n3. Si tienes el CV en Word/Google Docs, expórtalo como PDF con texto seleccionable`,
          }]);
        }
      } else {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        if (errData.error?.includes("no contiene texto")) {
          setMensajes((prev) => [...prev, {
            role: "gusi",
            text: `⚠️ Tu PDF es de imagen (escaneado o diseñado en Canva/Photoshop) y no tiene texto legible.\n\n**Opciones:**\n1. Ve a 📄 **Mi CV** para rellenar los datos manualmente\n2. O escríbeme tus datos aquí y te hago el CV`,
          }]);
        } else {
          setMensajes((prev) => [...prev, { role: "gusi", text: "❌ Error al procesar el PDF. Inténtalo de nuevo o escribe tus datos." }]);
        }
      }
    } catch {
      setMensajes((prev) => [...prev, { role: "gusi", text: "❌ Error al procesar el PDF. Intenta de nuevo o escribe tus datos." }]);
    } finally {
      setCargando(false);
    }
  }

  // ============================================
  // RESUMEN DE CV PARA MOSTRAR AL USUARIO
  // ============================================

  function formatCVResumen(cv: Record<string, unknown>): string {
    const lines: string[] = [];
    if (cv.nombre) lines.push(`**Nombre:** ${cv.nombre}${cv.apellidos ? " " + cv.apellidos : ""}`);
    if (cv.email) lines.push(`**Email:** ${cv.email}`);
    if (cv.telefono) lines.push(`**Teléfono:** ${cv.telefono}`);
    if (cv.ciudad) lines.push(`**Ciudad:** ${cv.ciudad}`);
    if (cv.subtitulo) lines.push(`**Puesto:** ${cv.subtitulo}`);
    if (cv.perfilProfesional || cv.perfil) lines.push(`**Perfil:** ${String(cv.perfilProfesional || cv.perfil).substring(0, 120)}`);
    if (Array.isArray(cv.experiencia) && cv.experiencia.length > 0) {
      const exp = cv.experiencia as Array<{fechas?: string; puesto?: string; empresa?: string}>;
      lines.push(`**Experiencia:** ${exp.length} entrada(s) — ${exp[0]?.puesto || ""} en ${exp[0]?.empresa || ""}`);
    } else if (cv.experiencia) {
      lines.push(`**Experiencia:** ${String(cv.experiencia).substring(0, 80)}`);
    }
    if (Array.isArray(cv.formacion) && cv.formacion.length > 0) {
      const edu = cv.formacion as Array<{titulo?: string; centro?: string}>;
      lines.push(`**Formación:** ${edu[0]?.titulo || ""}`);
    }
    if (Array.isArray(cv.aptitudes) && cv.aptitudes.length > 0) {
      lines.push(`**Aptitudes:** ${(cv.aptitudes as string[]).slice(0, 4).join(", ")}`);
    }
    return lines.length > 0 ? lines.join("\n") + "\n\n" : "*(Datos básicos extraídos)*\n\n";
  }

  // ============================================
  // GENERAR CV EN FORMATO EXACTO
  // ============================================

  function generarEnlaceCV(datos: Record<string, unknown>): string {
    return `https://buscaycurra.es/app/curriculum`;
  }

  async function descargarCVVisual() {
    if (!cvGuardado) return;
    try {
      const res = await fetch("/api/cv/generar-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cvGuardado),
      });
      const { html } = await res.json();
      if (!html) return;
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 600);
    } catch {
      // silently fail
    }
  }

  function generarCVTexto(datos: Record<string, unknown>): string {
    // Extraer datos del formato cvGuardado (puede venir de PDF o de entrevista)
    const nombre = String(datos.nombre || datos.full_name || "[Nombre Apellidos]");
    const telefono = String(datos.telefono || datos.phone || "");
    const email = String(datos.email || "");
    const ciudad = String(datos.ciudad || datos.location || "");
    const perfil = String(datos.perfil || datos.perfilProfesional || datos.summary || "");
    const experiencia = String(datos.experiencia || datos.experience || "");
    const formacion = String(datos.formacion || datos.estudios || datos.education || "");
    const aptitudes = String(datos.aptitudes || datos.habilidades || datos.skills || "");
    const idiomas = String(datos.idiomas || datos.languages || "Español (nativo)");

    // Generar enlace al CV visual
    const enlaceCV = generarEnlaceCV(datos);

    // Formato exacto de la plantilla de Michel - UNA SOLA PÁGINA
    let cv = `${nombre}\n`;
    cv += `■ ${telefono || "[Teléfono]"} ✉ ${email || "[Email]"} ■ ${ciudad || "[Ciudad]"}\n\n`;
    
    // APTITUDES (máximo 4-5)
    if (aptitudes) {
      cv += `APTITUDES\n`;
      const aptList = aptitudes.includes(",") ? aptitudes.split(",") : aptitudes.split("\n");
      const aptitudesLimitadas = aptList.slice(0, 5); // Máximo 5 aptitudes
      aptitudesLimitadas.forEach((apt: string) => {
        const trimmed = apt.trim().replace(/^[-•]\s*/, "");
        if (trimmed) cv += `${trimmed}\n`;
      });
      cv += `\n`;
    }
    
    // IDIOMAS
    if (idiomas) {
      cv += `IDIOMAS\n`;
      const langList = idiomas.includes(",") ? idiomas.split(",") : idiomas.split("\n");
      langList.forEach((lang: string) => {
        const trimmed = lang.trim().replace(/^[-•]\s*/, "");
        if (trimmed) cv += `${trimmed}\n`;
      });
      cv += `\n`;
    }
    
    // PERFIL PROFESIONAL (máximo 2-3 líneas)
    if (perfil) {
      cv += `PERFIL PROFESIONAL\n`;
      const perfilCorto = perfil.length > 200 ? perfil.substring(0, 200) + "..." : perfil;
      cv += `${perfilCorto}\n\n`;
    }
    
    // EXPERIENCIA LABORAL (máximo 3 trabajos)
    if (experiencia) {
      cv += `EXPERIENCIA LABORAL\n`;
      const expLines = experiencia.split("\n").filter((l: string) => l.trim());
      let trabajosCount = 0;
      
      for (let i = 0; i < expLines.length && trabajosCount < 3; i++) {
        const line = expLines[i].trim();
        if (!line) continue;
        
        // Detectar formato: AÑOS — PUESTO
        if (line.match(/^\d{4}/) || line.includes("—") || line.includes("-")) {
          cv += `${line}\n`;
          trabajosCount++;
          
          // Buscar empresa en la siguiente línea
          if (i + 1 < expLines.length) {
            const nextLine = expLines[i + 1].trim();
            if (nextLine.includes("·") || nextLine.includes("en") || nextLine.includes("@")) {
              cv += `${nextLine}\n`;
              i++;
            }
          }
          cv += `\n`;
        }
      }
    }
    
    // FORMACIÓN (máximo 2)
    if (formacion) {
      cv += `FORMACIÓN\n`;
      const formLines = formacion.split("\n").filter((l: string) => l.trim());
      const formacionLimitada = formLines.slice(0, 2);
      formacionLimitada.forEach((line: string) => {
        const trimmed = line.trim().replace(/^[-•]\s*/, "");
        if (trimmed) cv += `${trimmed}\n`;
      });
    }
    
    return cv;
  }

  // ============================================
  // ENVIAR MENSAJE PRINCIPAL
  // ============================================

  async function enviarMensaje(texto: string) {
    if (!texto.trim() || cargando) return;
    
    const nuevoMensaje: Mensaje = { role: "user", text: texto };
    setMensajes((prev) => [...prev, nuevoMensaje]);
    setInput("");
    setCargando(true);

    // ============================================
    // ESPERANDO CONFIRMACIÓN DE CV (después de subir PDF)
    // ============================================
    if (esperandoConfirmacionCV) {
      // Opción foto: pedir foto sin cerrar el modo confirmación
      if (texto.toLowerCase() === "foto" || texto.toLowerCase() === "añadir foto" || texto.toLowerCase() === "foto cv") {
        setCargando(false);
        setMensajes(prev => [...prev, { role: "gusi", text: "📸 Perfecto, sube tu foto de perfil:" }]);
        photoRef.current?.click();
        return;
      }

      setEsperandoConfirmacionCV(false);

      if (texto.toLowerCase() === "no" || texto.toLowerCase() === "no gracias") {
        // Mejorar CV directamente con IA
        setCargando(true);
        try {
          const res = await fetch("/api/gusi/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: "Mejora mi CV profesionalmente",
              mode: "cv_mejorado",
              cvData: cvGuardado ? JSON.stringify(cvGuardado) : undefined,
            }),
          });
          const data = await res.json();
          setCargando(false);
          setMensajes((prev) => [...prev, {
            role: "gusi",
            text: data.reply || "✨ **CV mejorado:**\n\nHe reestructurado tu CV profesionalmente. ¿Quieres enviarlo a ofertas o generar una carta de presentación?",
            action: "cv_mejorado",
            cvData: data.reply
          }]);
        } catch {
          setCargando(false);
          setMensajes((prev) => [...prev, { role: "gusi", text: "❌ Error al mejorar el CV. Inténtalo de nuevo." }]);
        }
        return;
      } else {
        // El usuario quiere añadir algo
        setCargando(false);
        setMensajes((prev) => [...prev, { 
          role: "gusi", 
          text: `✅ **Anotado.** He añadido: "${texto}"\n\n**¿Algo más?**\n\n(Escribe más o di "**no**" para que mejore el CV con IA)` 
        }]);
        setEsperandoConfirmacionCV(true);
        return;
      }
    }

    // ============================================
    // MODO ENTREVISTA (Crear CV paso a paso)
    // ============================================
    if (modoEntrevista) {
      const nuevoDatos = { ...datosCV, [PASOS_ENTREVISTA[pasoEntrevista].campo]: texto };
      setDatosCV(nuevoDatos);
      
      const siguientePaso = pasoEntrevista + 1;
      
      if (siguientePaso < PASOS_ENTREVISTA.length) {
        setPasoEntrevista(siguientePaso);
        setCargando(false);
        setMensajes((prev) => [...prev, { 
          role: "gusi", 
          text: PASOS_ENTREVISTA[siguientePaso].pregunta 
        }]);
      } else {
        // Último paso - generar CV
        setModoEntrevista(false);
        setPasoEntrevista(0);
        
        const cvTexto = generarCVTexto(nuevoDatos);
        
        // Guardar CV
        const cvData = {
          nombre: nuevoDatos.nombre,
          contacto: nuevoDatos.contacto,
          ciudad: nuevoDatos.ciudad,
          perfil: nuevoDatos.perfil,
          experiencia: `${nuevoDatos.experiencia1}${nuevoDatos.experiencia2 && nuevoDatos.experiencia2.toLowerCase() !== "no" ? "\n" + nuevoDatos.experiencia2 : ""}`,
          formacion: nuevoDatos.formacion,
          aptitudes: nuevoDatos.aptitudes,
        };
        
        setCvGuardado(cvData);
        if (userId) {
          await fetch("/api/gusi/cv", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, cvData, cvText: JSON.stringify(cvData) }),
          });
        }
        
        setCargando(false);
        setMensajes((prev) => [...prev, {
          role: "gusi",
          text: `✅ **¡CV completado!** 🐛\n\n**¿Qué quieres hacer ahora?**\n\n1. 📧 **Enviar mi CV** a ofertas de trabajo\n2. ✉️ **Generar carta** de presentación\n3. 📝 **Modificar** algún dato\n4. 💾 **Guardar** para más tarde`,
          action: "ver_cv",
          cvData: cvTexto
        }]);
      }
      return;
    }

    // ============================================
    // COMANDOS ESPECIALES
    // ============================================
    
    if (texto === "__ENTREVISTA__") {
      // Si ya tiene CV guardado, preguntar si quiere mejorarlo o crear nuevo
      if (cvGuardado && Object.keys(cvGuardado).length > 0) {
        setCargando(false);
        setMensajes((prev) => [...prev, { 
          role: "gusi", 
          text: `📄 **Ya tengo tus datos guardados.**\n\n¿Quieres:\n\n1. ✨ **Mejorar mi CV** con IA (más presentable)\n2. 📝 **Crear uno nuevo** desde cero\n3. 📄 **Ver mi CV** actual\n\n¿Qué prefieres?` 
        }]);
        return;
      }
      setModoEntrevista(true);
      setPasoEntrevista(0);
      setDatosCV({});
      setCargando(false);
      setMensajes((prev) => [...prev, { 
        role: "gusi", 
        text: PASOS_ENTREVISTA[0].pregunta 
      }]);
      return;
    }

    if (texto === "__VER_CV__") {
      setCargando(false);
      if (cvGuardado && Object.keys(cvGuardado).length > 0) {
        setMensajes((prev) => [...prev, { 
          role: "gusi", 
          text: `📄 **Aquí tienes tu CV visual:**\n\nAsí se ve tu currículum con la plantilla profesional. Puedes editarlo o enviarlo a ofertas.`,
          action: "ver_cv"
        }]);
      } else if (Object.keys(datosCV).length > 0) {
        // Convertir datosCV a cvGuardado temporalmente para mostrar
        const tempCV = {
          nombre: datosCV.nombre,
          telefono: datosCV.contacto?.split(",")[0]?.trim(),
          email: datosCV.contacto?.split(",")[1]?.trim(),
          ciudad: datosCV.ciudad,
          perfil: datosCV.perfil,
          experiencia: datosCV.experiencia1 + (datosCV.experiencia2 ? "\n" + datosCV.experiencia2 : ""),
          formacion: datosCV.formacion,
          aptitudes: datosCV.aptitudes,
        };
        setCvGuardado(tempCV);
        setMensajes((prev) => [...prev, { 
          role: "gusi", 
          text: `📄 **Aquí tienes tu CV visual:**\n\nAsí se ve tu currículum con la plantilla profesional. Puedes editarlo o enviarlo a ofertas.`,
          action: "ver_cv"
        }]);
      } else {
        setMensajes((prev) => [...prev, { 
          role: "gusi", 
          text: "📄 No tienes CV guardado todavía.\n\nPuedes:\n1. Subir tu CV en PDF\n2. Crearlo paso a paso conmigo\n3. Ir a 📄 Mi CV para crearlo visualmente\n\n¿Qué prefieres?" 
        }]);
      }
      return;
    }

    if (texto === "__FOTO_CV__") {
      setCargando(false);
      setMensajes((prev) => [...prev, {
        role: "gusi",
        text: "📸 **Sube tu foto de perfil** y la añado directamente a tu CV.\n\nConsejos para una buena foto:\n• Fondo liso (blanco o gris)\n• Ropa formal, pecho arriba\n• Buena iluminación (luz de ventana)\n• Expresión natural y sonrisa\n\n**Una buena foto = +40% de respuestas.** 🐛📸",
      }]);
      photoRef.current?.click();
      return;
    }

    if (texto === "__PREP_ENTREVISTA__") {
      setCargando(false);
      setMensajes((prev) => [...prev, { 
        role: "gusi", 
        text: "🎯 ¡Preparemos tu entrevista!\n\n¿Para qué empresa es la entrevista? (Escribe el nombre)" 
      }]);
      return;
    }

    if (texto === "__ENVIO_AUTO__") {
      if (!cvGuardado || Object.keys(cvGuardado).length === 0) {
        setCargando(false);
        setMensajes((prev) => [...prev, {
          role: "gusi",
          text: "📧 Para enviar tu CV automáticamente primero necesito tenerlo.\n\n📎 **Súbelo en PDF** (botón clip de abajo)\n📝 O escribe **'crear cv'** para hacerlo paso a paso conmigo."
        }]);
        return;
      }

      const { puesto: cvPuesto, ciudad: cvCiudad } = extractCVInfo(cvGuardado);

      if (cvPuesto) {
        // Tenemos puesto del CV → buscar directamente, sin preguntar
        const puestoBusqueda = cvPuesto;
        const ciudadBusqueda = cvCiudad || "España";
        setCargando(true);
        try {
          const res = await fetch(`/api/jobs/search?keyword=${encodeURIComponent(puestoBusqueda)}&location=${encodeURIComponent(ciudadBusqueda)}&page=1`);
          const data = await res.json() as { ofertas?: Oferta[] };
          const ofertas = (data.ofertas || []).slice(0, 5);

          if (ofertas.length > 0) {
            let text = `🔍 Basándome en tu CV (**${puestoBusqueda}**${cvCiudad ? ` en **${cvCiudad}**` : ""}), encontré:\n\n`;
            ofertas.forEach((o: Oferta, i: number) => {
              const em = ["🥇", "🥈", "🥉", "📌", "📌"][i];
              text += `${em} **${o.titulo}**\n   📍 ${o.ubicacion} · 💰 ${o.salario || "Ver oferta"}\n\n`;
            });
            text += `📧 **¿Envío tu CV a todas?** Di "sí". O usa el botón Enviar CV en cada oferta. 🐛`;
            setMensajes((prev) => [...prev, { role: "gusi", text, jobs: ofertas }]);
          } else {
            // Sin resultados → pedir ciudad alternativa
            setModoEnvio(true);
            setPasoEnvio(1);
            setDatosEnvio({ puesto: puestoBusqueda });
            setMensajes((prev) => [...prev, {
              role: "gusi",
              text: `🔍 No encontré ofertas de **${puestoBusqueda}** en **${ciudadBusqueda}**.\n\n¿Buscamos en otra ciudad?`
            }]);
          }
        } catch {
          setMensajes((prev) => [...prev, { role: "gusi", text: "❌ Error al buscar ofertas. Inténtalo de nuevo." }]);
        } finally {
          setCargando(false);
        }
        return;
      }

      // Sin puesto en CV → preguntar solo qué trabajo busca
      setModoEnvio(true);
      setPasoEnvio(0);
      setDatosEnvio({});
      setCargando(false);
      setMensajes((prev) => [...prev, {
        role: "gusi",
        text: "📧 Tu CV está listo.\n\n**¿Qué tipo de trabajo buscas?**\n\n(Ej: camarero, peón, programador, administrativo...)"
      }]);
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
        text: "📎 **Sube tu CV en PDF** y lo analizo al instante.\n\nDespués te pediré también una foto de perfil para que tu CV quede completo. 📸",
      }]);
      fileRef.current?.click();
      return;
    }

    // ============================================
    // MODO ENVÍO (Paso a paso)
    // ============================================
    if (modoEnvio) {
      if (pasoEnvio === 0) {
        setDatosEnvio({ puesto: texto });
        setPasoEnvio(1);
        setCargando(false);
        setMensajes((prev) => [...prev, { 
          role: "gusi", 
          text: `📧 **Paso 2/2: ¿En qué ciudad?**\n\n(Buscando ofertas de **${texto}**...)` 
        }]);
        return;
      } else if (pasoEnvio === 1) {
        const puesto = datosEnvio.puesto;
        const ciudad = texto;
        setModoEnvio(false);
        setPasoEnvio(0);
        
        // Buscar ofertas
        try {
          const res = await fetch(`/api/jobs/search?q=${encodeURIComponent(puesto)}&city=${encodeURIComponent(ciudad)}&limit=5`);
          const data = await res.json();
          const ofertas = data.ofertas || [];
          
          if (ofertas.length > 0) {
            let text = `🔍 He encontrado **${ofertas.length} ofertas** de **${puesto}** en **${ciudad}**:\n\n`;
            ofertas.forEach((o: Oferta, i: number) => {
              const emoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "📌";
              text += `${emoji} **${o.titulo}**\n   📍 ${o.ubicacion} · 💰 ${o.salario}\n\n`;
            });
            text += `📧 **¿Envío tu CV a todas estas ofertas?**\n\nSolo di "**sí**" y me encargo automáticamente. 🐛→📧`;
            
            setCargando(false);
            setMensajes((prev) => [...prev, { role: "gusi", text, jobs: ofertas }]);
          } else {
            setCargando(false);
            setMensajes((prev) => [...prev, { 
              role: "gusi", 
              text: `🔍 No encontré ofertas de **${puesto}** en **${ciudad}** en este momento.\n\n¿Quieres que busque en otra ciudad o con otro término?` 
            }]);
          }
        } catch {
          setCargando(false);
          setMensajes((prev) => [...prev, { 
            role: "gusi", 
            text: "❌ Error al buscar ofertas. Inténtalo de nuevo." 
          }]);
        }
        return;
      }
    }

    // ============================================
    // AUTO-ENVÍO CUANDO EL USUARIO DICE "SÍ" A OFERTAS MOSTRADAS
    // ============================================
    const textoLower = texto.toLowerCase();
    const lastGusiConJobs = [...mensajes].reverse().find(m => m.role === "gusi" && m.jobs && m.jobs.length > 0);
    if (lastGusiConJobs?.jobs && (textoLower === "si" || textoLower === "sí" || textoLower === "envia" || textoLower === "envía" || textoLower === "enviar todo" || textoLower === "dale" || textoLower.startsWith("sí") || textoLower.startsWith("si,"))) {
      const jobs = lastGusiConJobs.jobs;
      setMensajes(prev => [...prev, { role: "gusi", text: `📧 Enviando tu CV a **${jobs.length} empresa${jobs.length > 1 ? "s" : ""}**...\n\nBuscando emails de RRHH...` }]);
      let enviados = 0, sinEmail = 0;
      for (const job of jobs) {
        try {
          let email = "";
          if (job.url) {
            const r = await fetch(`/api/empresas/analizar?url=${encodeURIComponent(job.url)}`);
            const d = await r.json() as { emailRrhh?: string };
            email = d.emailRrhh || "";
          }
          if (email) {
            await fetch("/api/cv-sender/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, companyName: job.empresa, companyEmail: email, companyUrl: job.url, jobTitle: job.titulo, useAIPersonalization: true }),
            });
            enviados++;
          } else {
            await fetch("/api/cv-sender/registrar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, companyName: job.empresa, jobTitle: job.titulo, companyUrl: job.url }),
            });
            sinEmail++;
          }
        } catch { /* continuar con la siguiente */ }
      }
      const msgFinal = enviados > 0
        ? `✅ **¡Listo!** ${enviados} candidatura${enviados > 1 ? "s" : ""} enviada${enviados > 1 ? "s" : ""} con carta personalizada por IA.${sinEmail > 0 ? `\n📝 ${sinEmail} registrada${sinEmail > 1 ? "s" : ""} para seguimiento (sin email directo).` : ""}\n\n📬 Recibirás confirmación por email. Ve a **Mis envíos** para el estado. 📊`
        : `📝 **${sinEmail} empresa${sinEmail > 1 ? "s" : ""} encontrada${sinEmail > 1 ? "s" : ""} pero sin email de RRHH público.**\n\nEsto pasa con portales como Domestiko o Infojobs — publican las ofertas pero no el email directo. La candidatura quedó registrada en tu historial.\n\n💡 Para que Guzzi pueda enviar el email, busca empresas con web propia (no portales de intermediario).`;
      setMensajes(prev => [...prev, { role: "gusi", text: msgFinal }]);
      setCargando(false);
      return;
    }

    // ============================================
    // DETECTAR INTENTS DE ENVÍO/MEJORAR CV
    // ============================================

    if (
      (textoLower.includes("enviar") || textoLower.includes("envio") || textoLower.includes("envío") || textoLower === "enviar cv") &&
      (textoLower.includes("cv") || textoLower.includes("curriculum") || textoLower.includes("currículum") || textoLower.includes("oferta"))
    ) {
      if (!cvGuardado || Object.keys(cvGuardado).length === 0) {
        setCargando(false);
        setMensajes((prev) => [...prev, {
          role: "gusi",
          text: "📧 Para enviar tu CV automáticamente primero necesito tenerlo.\n\n📎 **Súbelo en PDF** (botón clip de abajo)\n📝 O escribe **'crear cv'** para hacerlo paso a paso conmigo."
        }]);
        return;
      }
      setModoEnvio(true);
      setPasoEnvio(0);
      setDatosEnvio({});
      setCargando(false);
      setMensajes((prev) => [...prev, {
        role: "gusi",
        text: "📧 ¡Perfecto! Tu CV ya está listo.\n\n**Paso 1/2: ¿Qué trabajo buscas?**\n\n(Ej: camarero, programador, albañil...)"
      }]);
      return;
    }
    if ((textoLower.includes("mejorar") || textoLower.includes("mejora")) && 
        (textoLower.includes("cv") || textoLower.includes("currículum") || textoLower.includes("curriculum"))) {
      if (cvGuardado && Object.keys(cvGuardado).length > 0) {
        setCargando(false);
        setMensajes((prev) => [...prev, { 
          role: "gusi", 
          text: `✨ **¡Perfecto! Voy a mejorar tu CV con IA.**

Ya tengo tus datos guardados. Voy a:
- Reestructurarlo profesionalmente
- Destacar tus fortalezas
- Adaptarlo para que las empresas no puedan ignorarlo

**¿Quieres que lo adapte para algún puesto en específico?**

(Si no, lo haré genérico y profesional)` 
        }]);
        return;
      }
    }

    // ============================================
    // LLAMADA A LA API DE GUSI
    // ============================================
    try {
      const res = await fetch("/api/gusi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: texto,
          history: mensajes.slice(-10),
          mode: "chat",
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

  // ============================================
  // RENDER
  // ============================================

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

      {/* Sidebar */}
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

          {/* Tu espacio — accesos rápidos */}
          <div className="p-3 border-b border-[#2a2d35]">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#374151" }}>Tu espacio</p>
            {[
              { href: "/app/curriculum", icon: "📄", label: "Mi CV" },
              { href: "/app/buscar",     icon: "🔍", label: "Buscar trabajo" },
              { href: "/app/envios",     icon: "📬", label: "Mis envíos" },
              { href: "/app/pipeline",   icon: "📊", label: "Pipeline" },
              { href: "/app/guardados",  icon: "❤️", label: "Guardadas" },
            ].map(item => (
              <a key={item.href} href={item.href}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors hover:bg-[#2a2d35]"
                style={{ color: "#94a3b8" }}>
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          {/* Historial de conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {conversaciones.length > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-wider px-3 pt-3 pb-1" style={{ color: "#374151" }}>Conversaciones</p>
            )}
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
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensajes.map((msg, i) => {
          // Ocultar mensajes de usuario que son comandos internos
          const esComando = msg.role === "user" && msg.text.startsWith("__") && msg.text.endsWith("__");
          const textoMostrar = esComando ? (LABELS_COMANDO[msg.text] ?? msg.text) : msg.text;
          return (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[95%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === "user"
                ? "bg-[#22c55e] text-white rounded-br-md"
                : "bg-[#2a2d35] text-gray-200 rounded-bl-md"
            }`}>
              <div className="whitespace-pre-wrap">{renderMd(textoMostrar)}</div>
              
              {/* CV Visual cuando Guzzi muestra el CV */}
              {(msg.action === "ver_cv" || msg.action === "cv_mejorado") && cvGuardado && (
                <div className="mt-3">
                  {cvHtml ? (
                    <iframe srcDoc={cvHtml} className='w-full rounded-lg border border-gray-600' style={{height:'520px',background:'white'}} title='CV Profesional' />
                  ) : (
                    <CVVisual data={cvGuardado} />
                  )}
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <a
                      href="/app/curriculum"
                      target="_blank"
                      className="text-xs bg-[#374151] text-gray-200 px-3 py-1.5 rounded-lg hover:bg-[#4b5563] transition-colors"
                    >
                      ✏️ Editar
                    </a>
                    <button
                      onClick={descargarCVVisual}
                      className="text-xs bg-[#22c55e] text-white px-3 py-1.5 rounded-lg hover:bg-[#16a34a] transition-colors"
                    >
                      ⬇️ Descargar PDF
                    </button>
                    <button
                      onClick={() => enviarMensaje("__ENVIO_AUTO__")}
                      className="text-xs bg-[#3b82f6] text-white px-3 py-1.5 rounded-lg hover:bg-[#2563eb] transition-colors"
                    >
                      📧 Enviar a ofertas
                    </button>
                  </div>
                </div>
              )}
              
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
                    onClick={() => enviarMensaje("sí")}
                    className="w-full py-2 bg-[#22c55e] text-white rounded-lg text-xs font-medium hover:bg-[#16a34a] transition-colors"
                  >
                    📧 Sí, enviar mi CV a todas
                  </button>
                </div>
              )}
            </div>
          </div>
          );
        })}

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

      {/* Acciones rápidas — SIEMPRE visibles */}
      <div className="px-3 pt-2 pb-1 border-t border-[#1e212b]">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {ACCIONES.map((a) => (
            <button
              key={a.msg}
              onClick={() => enviarMensaje(a.msg)}
              disabled={cargando}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors hover:opacity-80 shrink-0 disabled:opacity-40"
              style={{ background: "#1a1d24", border: "1px solid #252836", color: "#94a3b8" }}
            >
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

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
        <input
          type="file"
          ref={photoRef}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePhotoUpload(file);
            e.target.value = "";
          }}
        />
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="px-2 py-2.5 text-gray-400 hover:text-white rounded-xl text-sm transition-colors"
            title="Subir CV en PDF"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>
          <button
            onClick={() => photoRef.current?.click()}
            className="px-2 py-2.5 text-gray-400 hover:text-white rounded-xl text-sm transition-colors"
            title="Añadir foto al CV"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviarMensaje(input)}
            placeholder={modoEntrevista ? `Paso ${pasoEntrevista + 1}/8: Responde aquí...` : modoEnvio ? "Responde aquí..." : "Escribe a Guzzi..."}
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