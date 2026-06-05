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
  cvData?: string;
}

const SUGERENCIAS = [
  { icon: "📧", label: "Enviar CV automático", msg: "Quiero enviar mi CV automáticamente a empresas", destacado: true },
  { icon: "📝", label: "Crear mi CV", msg: "__ENTREVISTA__" },
  { icon: "🔍", label: "Buscar trabajo", msg: "Quiero buscar trabajo, ¿me ayudas?" },
  { icon: "🌍", label: "Emigrar", msg: "Quiero emigrar al extranjero, ¿qué opciones tengo?" },
  { icon: "👶", label: "Au Pair", msg: "Quiero información sobre el programa Au Pair en el extranjero" },
  { icon: "🎯", label: "Preparar entrevista", msg: "Quiero preparar una entrevista de trabajo" },
  { icon: "📸", label: "Mejorar mi foto", msg: "¿Cómo mejoro mi foto de CV? Dame prompts para ChatGPT" },
  { icon: "📄", label: "Subir mi CV", msg: "__SUBIR_CV__" },
];

function sanitizeGusiHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    .replace(/javascript\s*:/gi, "about:")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
}

export default function GusiChat() {
  const [abierto, setAbierto] = useState(false);
  const [logueado, setLogueado] = useState<boolean | null>(null);
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

        if (user) {
          setUserId(user.id);
          cargarConversaciones(user.id); // carga el historial en sidebar, sin bloquear
          const cvExistente = await cargarCV(user.id);

          const nombre = (user.user_metadata?.full_name || "").split(" ")[0];
          const saludo = nombre ? `¡Hola, ${nombre}!` : "¡Hola!";

          // Siempre arranca con mensaje fresco — el historial está en el sidebar
          if (cvExistente) {
            const { puesto, ciudad, puestos, aptitudes } = extractCVInfo(cvExistente);
            const puestoStr = puesto ? `**${puesto}**` : "tu sector";
            const ciudadStr = ciudad ? ` en **${ciudad}**` : "";
            const otrosStr = puestos.length > 1 
              ? `\n📋 También has trabajado de: **${puestos.slice(1, 4).join(" · ")}**${puestos.length > 4 ? " · ..." : ""}`
              : "";
            const aptStr = aptitudes.length > 0
              ? `\n🎯 Habilidades: **${aptitudes.slice(0, 3).join(" · ")}**`
              : "";
            setMensajes([{
              role: "gusi",
              text: `${saludo} 🐛 Tengo tu CV listo.\n\n🔍 Último puesto: ${puestoStr}${ciudadStr}${otrosStr}${aptStr}\n\n¿Busco ofertas que encajen con todo tu perfil y envío candidaturas?`,
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

    const textoLower = texto.toLowerCase();
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
              userId: userId ?? undefined,
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
        text: "📸 **Foto de perfil para tu CV**\n\n¿Ya tienes una foto profesional? Súbela directamente.\n\n¿Tienes un selfie normal? Usa ChatGPT para transformarla: fondo blanco, camisa formal, formato carnet — gratis en 30 segundos. 🐛",
        action: "foto_cv",
      }]);
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

    if (texto === "__AUTO_FIRE__") {
      setCargando(false);
      if (!cvGuardado || Object.keys(cvGuardado).length === 0) {
        setMensajes((prev) => [...prev, {
          role: "gusi",
          text: "⚡ **Auto-envío masivo**\n\nPara activar el envío automático a todas las ofertas que encajen con tu perfil, primero necesito tu CV.\n\n📎 Súbelo o 📝 créalo conmigo."
        }]);
        return;
      }
      const { puesto: cvPuesto, ciudad: cvCiudad, puestos: cvPuestos, aptitudes: cvAptitudes } = extractCVInfo(cvGuardado);
      const puestosStr = cvPuestos.length > 1 
        ? `\n📋 **También buscaré:** ${cvPuestos.slice(1, 4).join(" · ")}${cvPuestos.length > 4 ? " · ..." : ""}`
        : "";
      const aptitudesStr = cvAptitudes.length > 0
        ? `\n🎯 **Habilidades:** ${cvAptitudes.slice(0, 3).join(" · ")}`
        : "";
      setMensajes((prev) => [...prev, {
        role: "gusi",
        text: `⚡ **Auto-envío masivo activado**\n\n🔍 Principal: **${cvPuesto || "tu perfil"}**${cvCiudad ? ` en **${cvCiudad}**` : ""}${puestosStr}${aptitudesStr}\n\nVoy a buscar ofertas que encajen con TODO tu perfil y enviar tu CV automáticamente.\n\n📧 Usa el botón **Enviar CV** para empezar. O dime: "envía mi CV a ofertas de Alemania" para buscar en otro país. 🌍`,
        action: "auto_fire",
      }]);
      return;
    }

    if (texto === "__BUSCAR_PAIS__") {
      setCargando(false);
      setMensajes((prev) => [...prev, {
        role: "gusi",
        text: "🌍 **Buscar ofertas por país**\n\nActualmente tengo ofertas en **19 países**:\n\n🇩🇪 Alemania (216K) · 🇪🇸 España (124K) · 🇺🇸 EEUU (73K)\n🇬🇧 Reino Unido (48K) · 🇨🇦 Canadá (39K) · 🇫🇷 Francia (35K)\n🇸🇪 Suecia (28K) · 🇦🇺 Australia (26K) · 🇳🇱 Países Bajos (19K)\n🇮🇹 Italia (18K) · 🇨🇭 Suiza (17K) · 🇮🇪 Irlanda (16K)\n🇧🇪 Bélgica (13K) · 🇵🇹 Portugal (11K) · 🇳🇴 Noruega (10K)\n🇵🇱 Polonia (9K) · 🇩🇰 Dinamarca (5K) · 🇦🇹 Austria (5K)\n🇫🇮 Finlandia (3K)\n\n¿En qué país quieres buscar? (Escríbelo)",
      }]);
      return;
    }

    if (texto === "__COMPARAR_SALARIOS__") {
      setCargando(false);
      setMensajes((prev) => [...prev, {
        role: "gusi",
        text: "💰 **Comparador de salarios**\n\nDime un puesto de trabajo y te muestro cuánto pagan en diferentes países.\n\nEjemplo: \"¿Cuánto gana un enfermero en España vs Alemania?\"\n\nO dime tu puesto y comparo por ti.",
      }]);
      return;
    }

    if (texto === "__MIGRAR__") {
      setCargando(false);
      setMensajes((prev) => [...prev, {
        role: "gusi",
        text: "✈️ **Buscar ofertas para emigrar**\n\nTe ayudo a encontrar trabajo en otro país con relocation o visa sponsorship.\n\n🌍 **Países con más ofertas para emigrar:**\n🇩🇪 Alemania (216K) · 🇨🇦 Canadá (39K) · 🇦🇺 Australia (26K)\n🇨🇭 Suiza (17K) · 🇮🇪 Irlanda (16K) · 🇳🇱 Países Bajos (19K)\n🇧🇪 Bélgica (13K) · 🇳🇴 Noruega (10K) · 🇩🇰 Dinamarca (5K)\n\nDime: \"busca trabajo de [tu puesto] en [país]\" y te muestro las mejores ofertas para emigrar. 🐛",
      }]);
      return;
    }

    if (texto === "__AU_PAIR__") {
      setCargando(false);
      setMensajes((prev) => [...prev, {
        role: "gusi",
        text: "👶 **Buscar trabajo de Au Pair**\n\nTe ayudo a encontrar familias que buscan au pair en Europa y otros países.\n\n💌 **Generar carta:** Dime \"crea mi carta au pair\" o \"genera mi dear family\" y usaré los datos de tu perfil.\n\n🔍 **Buscar ofertas:** Dime \"busca au pair en Alemania\" o el país que te interese.\n\n🧒 También puedes completar tu perfil con fotos en la sección **Au Pair** del menú.\n\n🏠 **Países populares para au pair:**\n🇩🇪 Alemania · 🇫🇷 Francia · 🇳🇱 Países Bajos\n🇬🇧 Reino Unido · 🇮🇪 Irlanda · 🇩🇰 Dinamarca\n🇸🇪 Suecia · 🇳🇴 Noruega · 🇦🇺 Australia\n\n¿Qué te interesa? 🐛",
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

      const { puesto: cvPuesto, ciudad: cvCiudad, puestos: cvPuestos, aptitudes: cvAptitudes } = extractCVInfo(cvGuardado);

      if (cvPuesto) {
        // Usar el puesto más reciente como búsqueda principal
        const puestoBusqueda = cvPuesto;
        const ciudadBusqueda = cvCiudad || "España";
        
        // Construir keywords enriquecidas: puesto principal + otros puestos + aptitudes (máx 3 keywords extra)
        const otrasKeys = [...cvPuestos.slice(1, 3), ...cvAptitudes.slice(0, 2)]
          .filter(k => k && k.length > 2 && k !== puestoBusqueda)
          .slice(0, 3);
        const keywordExtendida = [puestoBusqueda, ...otrasKeys].join(" ");
        
        setCargando(true);
        try {
          const res = await fetch(`/api/jobs/search?keyword=${encodeURIComponent(keywordExtendida)}&location=${encodeURIComponent(ciudadBusqueda)}&page=1`);
          const data = await res.json() as { ofertas?: Oferta[] };
          const ofertas = (data.ofertas || []).slice(0, 5);

          if (ofertas.length > 0) {
            // Mostrar todos los puestos del CV para que el usuario sepa que Guzzi leyó todo
            const puestosLista = cvPuestos.length > 1 
              ? `\n📋 **Tu experiencia:** ${cvPuestos.slice(0, 4).join(" · ")}${cvPuestos.length > 4 ? " · ..." : ""}`
              : "";
            const aptitudesLista = cvAptitudes.length > 0
              ? `\n🎯 **Tus habilidades:** ${cvAptitudes.slice(0, 4).join(" · ")}${cvAptitudes.length > 4 ? " · ..." : ""}`
              : "";
            let text = `🔍 He leído tu CV completo. Buscando principalmente **${puestoBusqueda}** (tu puesto más reciente${cvCiudad ? ` en **${cvCiudad}**` : ""}):${puestosLista}${aptitudesLista}\n\n**Resultados:**\n`;
            ofertas.forEach((o: Oferta, i: number) => {
              const em = ["🥇", "🥈", "🥉", "📌", "📌"][i];
              text += `${em} **${o.titulo}**\n   📍 ${o.ubicacion} · 💰 ${o.salario || "Ver oferta"}\n\n`;
            });
            if (cvPuestos.length > 1 || cvAptitudes.length > 0) {
              const otrasBusquedas = [...cvPuestos.slice(1, 3), ...cvAptitudes.slice(0, 2)].filter(k => k && k.length > 2);
              if (otrasBusquedas.length > 0) {
                text += `💡 También puedo buscar ofertas de: **${otrasBusquedas.join(", ")}**\n\n`;
              }
            }
            text += `📧 **¿Envío tu CV a estas ofertas?** Di "sí". 🐛`;
            setMensajes((prev) => [...prev, { role: "gusi", text, jobs: ofertas }]);
          } else {
            // Sin resultados con el puesto principal → probar con el siguiente puesto
            const siguientePuesto = cvPuestos[1];
            if (siguientePuesto && siguientePuesto !== puestoBusqueda) {
              setCargando(false);
              setMensajes((prev) => [...prev, {
                role: "gusi",
                text: `🔍 No encontré ofertas de **${puestoBusqueda}** en **${ciudadBusqueda}**.\n\nPero veo que también tienes experiencia como **${siguientePuesto}**. ¿Busco ofertas de eso?`
              }]);
            } else {
              setModoEnvio(true);
              setPasoEnvio(1);
              setDatosEnvio({ puesto: puestoBusqueda });
              setMensajes((prev) => [...prev, {
                role: "gusi",
                text: `🔍 No encontré ofertas de **${puestoBusqueda}** en **${ciudadBusqueda}**.\n\n¿Buscamos en otra ciudad?`
              }]);
            }
          }
        } catch (e) {
          console.error("Error buscando ofertas:", e);
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
      setModoCarta(true);
      setPasoCarta(0);
      setDatosCarta({});
      setCargando(false);
      setMensajes((prev) => [...prev, {
        role: "gusi",
        text: "✉️ **Vamos a crear tu carta de presentación personalizada.**\n\n**¿Para qué empresa es?** (escribe el nombre exacto)"
      }]);
      return;
    }

    // ============================================
    // MODO CARTA (paso a paso)
    // ============================================
    if (modoCarta) {
      if (pasoCarta === 0) {
        // Recibimos la empresa
        setDatosCarta({ empresa: texto });
        setPasoCarta(1);
        setCargando(false);
        setMensajes((prev) => [...prev, {
          role: "gusi",
          text: `✅ Empresa: **${texto}**\n\n**¿Para qué puesto aplicas?** (ej: Camarero, Programador, Administrativo...)`
        }]);
        return;
      }
      if (pasoCarta === 1) {
        // Recibimos el puesto → generamos la carta
        const empresa = datosCarta.empresa || "";
        const puesto = texto;
        setModoCarta(false);
        setPasoCarta(0);
        setDatosCarta({});
        setCargando(true);
        setMensajes((prev) => [...prev, {
          role: "gusi",
          text: `✅ Generando carta para **${puesto}** en **${empresa}**... ✍️`
        }]);
        try {
          const res = await fetch("/api/gusi/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: `Genera una carta de presentación para ${puesto} en ${empresa}`,
              mode: "carta_recomendacion",
              empresa,
              puesto,
              userId: userId ?? undefined,
              cvData: cvGuardado ? JSON.stringify(cvGuardado) : undefined,
            }),
          });
          const data = await res.json() as { reply?: string };
          const cartaTexto = data.reply || "No se pudo generar la carta.";
          setMensajes((prev) => [...prev, {
            role: "gusi",
            text: `✉️ **Aquí tienes tu carta de presentación:**\n\n---\n\n${cartaTexto}\n\n---\n\n📄 **¿Quieres descargarla en PDF?** Escribe **"descargar carta"** y te la preparo.`,
            action: "carta_generada",
          }]);
        } catch {
          setMensajes((prev) => [...prev, {
            role: "gusi",
            text: "❌ Error generando la carta. Inténtalo de nuevo. 🐛"
          }]);
        } finally {
          setCargando(false);
        }
        return;
      }
    }

    // Descargar carta como PDF (impresión del navegador)
    if (textoLower.includes("descargar carta") || textoLower.includes("pdf carta") || textoLower === "descargar") {
      const lastCarta = [...mensajes].reverse().find(m => m.role === "gusi" && m.action === "carta_generada");
      if (lastCarta) {
        setCargando(false);
        const cartaTexto = lastCarta.text.split("---\n\n")[1]?.split("\n\n---")[0] || "";
        const cartaHtml = cartaTexto
          .split("\n")
          .filter(l => l.trim())
          .map(l => `<p style="margin:0 0 14px;">${l}</p>`)
          .join("");
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Carta de presentación</title><style>body{font-family:Georgia,serif;padding:60px;max-width:680px;margin:auto;line-height:1.8;color:#1e293b;font-size:14px;}@media print{body{padding:20mm;}}</style></head><body>${cartaHtml}<script>setTimeout(function(){window.print();},400);</script></body></html>`);
          printWindow.document.close();
        }
        setMensajes((prev) => [...prev, { role: "gusi", text: "📄 **Ventana de impresión abierta.** Usa 'Guardar como PDF' en el diálogo de impresión. ¡Mucha suerte! 🐛" }]);
        return;
      }
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
          const res = await fetch(`/api/jobs/search?keyword=${encodeURIComponent(puesto)}&location=${encodeURIComponent(ciudad)}&limit=5`);
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
    // DETECTAR INTENT DE SALARIO
    // ============================================
    if (textoLower.includes("salario") || textoLower.includes("cuanto gana") || textoLower.includes("cuánto gana") || 
        textoLower.includes("cuanto pagan") || textoLower.includes("cuánto pagan") || textoLower.includes("cuanto cobra") ||
        textoLower.includes("sueldo") || textoLower.includes("comparar salario")) {
      setCargando(false);
      setMensajes((prev) => [...prev, {
        role: "gusi",
        text: "💰 **Comparador de salarios**\n\nDime un puesto de trabajo y te muestro cuánto pagan en diferentes países.\n\nEjemplo: \"¿Cuánto gana un enfermero en España vs Alemania?\"\n\nO dime tu puesto y comparo por ti.",
      }]);
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
          userId: userId ?? undefined,
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
        title="Hablar con Guzzi"
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
                    dangerouslySetInnerHTML={{ __html: sanitizeGusiHtml(formatGusiText(m.text)) }}
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
                      const paisId = getCountryFromLocation(job.ubicacion);
                      const enEspana = isSpainOrRemote(job.ubicacion);
                      const locationHref = paisId
                        ? `/app/emigrar?pais=${paisId}`
                        : enEspana
                          ? `/app/buscar?q=${encodeURIComponent(job.titulo)}`
                          : null;
                      return (
                        <div key={job.id} className="rounded-xl p-3 transition hover:scale-[1.01]"
                          style={{ background: "rgba(42,42,30,0.5)", border: "1px solid rgba(126,213,111,0.1)" }}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              {/* Título → abre oferta en nueva pestaña */}
                              {job.url ? (
                                <a href={job.url} target="_blank" rel="noopener noreferrer"
                                  className="text-[12px] font-bold truncate block hover:underline"
                                  style={{ color: "#f0ebe0" }}>
                                  {job.titulo} ↗
                                </a>
                              ) : (
                                <p className="text-[12px] font-bold truncate" style={{ color: "#f0ebe0" }}>{job.titulo}</p>
                              )}
                              <p className="text-[10px] mt-0.5" style={{ color: "#b0a890" }}>
                                {job.empresa}
                                {" · "}
                                {/* Ubicación → redirige a país o búsqueda */}
                                {locationHref ? (
                                  <button onClick={() => router.push(locationHref)}
                                    className="hover:underline font-medium"
                                    style={{ color: "#a0d0f0" }}>
                                    🌍 {job.ubicacion}
                                  </button>
                                ) : (
                                  <span>📍 {job.ubicacion}</span>
                                )}
                              </p>
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
                                onClick={() => router.push(`/app/envios?empresa=${encodeURIComponent(job.empresa)}&puesto=${encodeURIComponent(job.titulo)}&web=${encodeURIComponent(job.url)}`)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition hover:opacity-90"
                                style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}>
                                ✓ Enviar CV
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => {
                        addMsg("user", "Envía mi CV a todas las ofertas");
                        addMsg("gusi", "📧 **¡Enviando tu CV a todas las ofertas!** 🐛\n\nVe a 🏢 **Empresa** para ver el progreso y el contador de envíos de hoy. ¡Un paso más cerca de ser mariposa! 🦋");
                        router.push("/app/empresas");
                      }}
                      className="w-full py-2 rounded-xl text-[12px] font-bold transition hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, rgba(126,213,111,0.15), rgba(92,184,72,0.15))", border: "1.5px solid rgba(126,213,111,0.3)", color: "#7ed56f" }}>
                      ✓ Enviar CV a TODAS ({m.jobs.length} ofertas)
                    </button>
                  </div>
                </div>
              )}
              
              {/* Shortcuts foto CV */}
              {msg.action === "foto_cv" && (
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => photoRef.current?.click()}
                    className="w-full py-2 text-xs font-semibold rounded-lg transition-colors"
                    style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}
                  >
                    📁 Ya tengo foto — subir ahora
                  </button>
                  <button
                    onClick={() => {
                      const prompt = "Utiliza esta foto para realizar los siguientes cambios: 1. Crear un fondo blanco y cambiar todo el fondo actual. 2. Cambiar la camiseta por una camisa blanca. 3. Poner la figura en posición sentada. Fotografía tamaño carnet hasta la altura de los hombros. Preséntalo para un currículum.";
                      navigator.clipboard.writeText(prompt).catch(() => {});
                      const ua = navigator.userAgent.toLowerCase();
                      const isIOS = /iphone|ipad|ipod/.test(ua);
                      const isAndroid = /android/.test(ua);
                      if (isIOS) {
                        window.location.href = "chatgpt://";
                        setTimeout(() => { window.open("https://chatgpt.com", "_blank"); }, 1200);
                      } else if (isAndroid) {
                        window.location.href = "intent://chatgpt.com#Intent;scheme=https;package=com.openai.chatgpt;end";
                        setTimeout(() => { window.open("https://chatgpt.com", "_blank"); }, 1200);
                      } else {
                        window.open("https://chatgpt.com", "_blank");
                      }
                    }}
                    className="w-full py-2 text-xs font-semibold rounded-lg transition-colors"
                    style={{ background: "#161922", border: "1px solid #252836", color: "#94a3b8" }}
                  >
                    ✨ Mejorar selfie con ChatGPT (prompt copiado)
                  </button>
                </div>
              )}

              {/* Botones de acción para ofertas */}
              {msg.jobs && msg.jobs.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.jobs.map((job) => (
                    <div key={job.id} className="bg-[#1a1d24] rounded-lg p-2 text-xs">
                      <p className="font-medium text-white">{job.titulo}</p>
                      <p className="text-gray-400">{job.empresa} · {job.ubicacion}</p>
                      {job.salario && job.salario !== "Ver en oferta" && (
                        <p className="text-[#22c55e]">{job.salario}</p>
                      )}
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