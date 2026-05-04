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

const SUGERENCIAS = [
  { icon: "📧", label: "Enviar CV automático", msg: "__ENVIO_AUTO__", destacado: true },
  { icon: "📎", label: "Subir mi CV", msg: "__SUBIR_CV__", destacado: true },
  { icon: "📝", label: "Crear mi CV", msg: "__ENTREVISTA__" },
  { icon: "🔍", label: "Buscar trabajo", msg: "Quiero buscar trabajo" },
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
          await cargarConversaciones(user.id);
          const cvExistente = await cargarCV(user.id);

          const esNuevo = user.created_at && (Date.now() - new Date(user.created_at).getTime()) < 30 * 60 * 1000;
          const nombre = (user.user_metadata?.full_name || "").split(" ")[0];
          const saludo = nombre ? `¡Hola, ${nombre}!` : "¡Hola!";

          if (cvExistente && !esNuevo) {
            // Usuario con CV guardado: mostrar CV directamente
            setMensajes([{
              role: "gusi",
              text: `${saludo} 🐛 Aquí tienes tu CV actualizado.\n\n¿Qué hacemos hoy?\n\n📧 **Enviar a ofertas** · ✨ **Mejorar con IA** · 📸 **Añadir/cambiar foto**`,
              action: "ver_cv",
            }]);
          } else if (esNuevo) {
            setMensajes([{ role: "gusi", text: `${saludo} 🐛 Soy Guzzi, tu asistente personal de empleo.\n\nEstoy aquí para que nunca más tengas que buscar trabajo solo. Yo trabajo, tú eliges.\n\n¿Por dónde empezamos?\n\n📄 **Tengo CV** → súbemelo y te busco las mejores ofertas\n📝 **No tengo CV** → te ayudo a crearlo en 5 minutos paso a paso\n📧 Cuando esté listo, **envío tu candidatura automáticamente**\n\n¡Tú relájate, que yo me pongo a trabajar! 🐛→🦋` }]);
          } else {
            setMensajes([{ role: "gusi", text: `${saludo} 🐛 ¿Qué hacemos hoy?\n\n📧 **Enviar tu CV automático** (¡nuestro FUERTE!)\n📝 Crear tu CV paso a paso\n🔍 Buscar ofertas para ti\n📸 Añadir foto al CV\n🎯 Preparar entrevistas\n📄 Ver mi CV guardado` }]);
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
    setMostrarSugerencias(true);
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
            text: `✅ **CV analizado.** He extraído esto:\n\n${resumen}\n**¿Quieres añadir o cambiar algo?**\n\n(Escribe lo que quieras añadir, di "**no**" para mejorar con IA, o di "**foto**" para añadir tu foto de perfil)`,
            action: "ver_cv"
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

  // ============================================
  // RESUMEN DE CV PARA MOSTRAR AL USUARIO
  // ============================================

  function formatCVResumen(cv: Record<string, unknown>): string {
    let text = "";
    if (cv.nombre) text += `👤 **Nombre:** ${cv.nombre}\n`;
    if (cv.email) text += `📧 **Email:** ${cv.email}\n`;
    if (cv.telefono) text += `📞 **Teléfono:** ${cv.telefono}\n`;
    if (cv.ciudad) text += `📍 **Ciudad:** ${cv.ciudad}\n`;
    if (cv.perfilProfesional || cv.perfil) text += `💼 **Perfil:** ${cv.perfilProfesional || cv.perfil}\n`;
    if (cv.experiencia) text += `🏢 **Experiencia:** ${String(cv.experiencia).substring(0, 100)}...\n`;
    if (cv.formacion || cv.estudios) text += `🎓 **Formación:** ${cv.formacion || cv.estudios}\n`;
    return text || "*(Datos básicos extraídos)*";
  }

  // ============================================
  // GENERAR CV EN FORMATO EXACTO
  // ============================================

  function generarEnlaceCV(datos: Record<string, unknown>): string {
    // Redirigir a la página de curriculum con la plantilla visual profesional
    return `https://buscaycurra.es/app/curriculum`;
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
    setMostrarSugerencias(false);

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
          text: `✅ **¡CV completado!** 🦋\n\n**¿Qué quieres hacer ahora?**\n\n1. 📧 **Enviar mi CV** a ofertas de trabajo\n2. ✉️ **Generar carta** de presentación\n3. 📝 **Modificar** algún dato\n4. 💾 **Guardar** para más tarde`,
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
      setModoEnvio(true);
      setPasoEnvio(0);
      setDatosEnvio({});
      setCargando(false);
      setMensajes((prev) => [...prev, { 
        role: "gusi", 
        text: "📧 ¡Perfecto! Para enviar tu CV automáticamente:\n\n**Paso 1/2: ¿Qué trabajo buscas?**\n\n(Ej: camarero, programador, albañil...)" 
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
    // DETECTAR "MEJORAR CV" CUANDO YA TIENE DATOS
    // ============================================
    const textoLower = texto.toLowerCase();
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
            <div className={`max-w-[95%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === "user" 
                ? "bg-[#22c55e] text-white rounded-br-md" 
                : "bg-[#2a2d35] text-gray-200 rounded-bl-md"
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
              
              {/* CV Visual cuando Guzzi muestra el CV */}
              {(msg.action === "ver_cv" || msg.action === "cv_mejorado") && cvGuardado && (
                <div className="mt-3">
                  {cvHtml ? (
                    <iframe srcDoc={cvHtml} className='w-full rounded-lg border border-gray-600' style={{height:'520px',background:'white'}} title='CV Profesional' />
                  ) : (
                    <CVVisual data={cvGuardado} />
                  )}
                  <div className="mt-2 flex gap-2">
                    <a 
                      href="/app/curriculum" 
                      target="_blank"
                      className="text-xs bg-[#22c55e] text-white px-3 py-1.5 rounded-lg hover:bg-[#16a34a] transition-colors"
                    >
                      ✏️ Editar y descargar
                    </a>
                    <button 
                      onClick={() => enviarMensaje("enviar cv")}
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