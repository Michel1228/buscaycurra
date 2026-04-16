/**
 * Router inteligente de IA para BuscayCurra
 *
 * Decide automáticamente qué IA usar según:
 * - El tipo de tarea (CV largo → Gemini, chat rápido → Groq)
 * - Los límites de cada API (si Groq está lleno, usa Gemini y viceversa)
 * - Si ambos están llenos, pone la tarea en cola para mañana
 *
 * El resto de la app solo llama a este router y no necesita
 * saber qué IA se usa internamente ✅
 */

import { get } from "../cache/redis-client";
import { llamarGroq, mejorarCV, generarCartaPresentacion, analizarOfertaTrabajo, LIMITE_DIARIO_GROQ } from "./groq-client";
import { llamarGemini, analizarCVLargo, extraerDatosEmpresa, LIMITE_DIARIO_GEMINI } from "./gemini-client";
import { TipoPeticionIA } from "../cache/ai-cache";

// ==========================================
// TIPOS DE TAREAS
// ==========================================

// Todas las tareas que puede hacer la IA en BuscayCurra
export type TareaIA =
  | "mejorar-cv"              // Mejorar curriculum
  | "mejorar-cv-largo"        // CV con más de 2000 palabras
  | "carta-presentacion"      // Generar carta de presentación
  | "analizar-oferta"         // Analizar una oferta de trabajo
  | "analizar-empresa-web"    // Analizar la web de una empresa
  | "chat-agente"             // Respuestas del agente conversacional
  | "generico";               // Cualquier otra tarea

// Estructura de respuesta del router
export interface RespuestaRouter {
  respuesta: string;
  iaUsada: "groq" | "gemini" | "cola";
  desdecache: boolean;
  tiempoMs: number;
}

// ==========================================
// LÓGICA DE SELECCIÓN DE IA
// ==========================================

/**
 * Determina la IA preferida para cada tipo de tarea
 * Basado en las características de cada modelo:
 *
 * Groq  → Velocidad (500 tokens/s), ideal para tareas cortas y chat
 * Gemini → Contexto largo (1M tokens), ideal para análisis complejos
 */
function iaPreferida(tarea: TareaIA): "groq" | "gemini" {
  const tareasGemini: TareaIA[] = [
    "mejorar-cv-largo",      // CVs largos necesitan más contexto
    "analizar-empresa-web",  // Analizar webs completas (HTML largo)
  ];

  const tareasGroq: TareaIA[] = [
    "chat-agente",           // Chat requiere velocidad máxima
    "carta-presentacion",    // Rápido y preciso
    "analizar-oferta",       // Análisis corto
    "mejorar-cv",            // CVs normales
    "generico",
  ];

  if (tareasGemini.includes(tarea)) return "gemini";
  return "groq"; // Por defecto Groq (más rápido)
}

// ==========================================
// VERIFICACIÓN DE LÍMITES
// ==========================================

/**
 * Comprueba cuántas llamadas llevamos hoy para cada IA
 * Devuelve true si la IA especificada puede recibir más llamadas
 */
async function iaDisponible(ia: "groq" | "gemini"): Promise<boolean> {
  const fecha = new Date().toISOString().split("T")[0];

  try {
    if (ia === "groq") {
      const llamadasStr = await get(`groq:calls:${fecha}`);
      const llamadas = parseInt(llamadasStr || "0");
      return llamadas < LIMITE_DIARIO_GROQ;
    } else {
      const llamadasStr = await get(`gemini:calls:${fecha}`);
      const llamadas = parseInt(llamadasStr || "0");
      return llamadas < LIMITE_DIARIO_GEMINI;
    }
  } catch {
    return true; // Si no podemos verificar, asumir que está disponible
  }
}

// ==========================================
// ROUTER PRINCIPAL
// ==========================================

/**
 * Función principal del router
 * Decide qué IA usar y la llama automáticamente
 *
 * @param tarea - Tipo de tarea a realizar
 * @param contenido - El texto a procesar (CV, oferta, prompt, etc.)
 * @param extra - Información adicional (empresa, puesto, etc.)
 */
export async function enrutarPeticionIA(
  tarea: TareaIA,
  contenido: string,
  extra?: {
    empresa?: string;
    puesto?: string;
    urlEmpresa?: string;
  }
): Promise<RespuestaRouter> {
  const inicio = Date.now();
  let iaUsada: "groq" | "gemini" | "cola" = "groq";
  let respuesta = "";

  try {
    // Paso 1: Determinar qué IA preferiríamos usar
    const iaPreferidaParaTarea = iaPreferida(tarea);

    // Paso 2: Comprobar si la IA preferida está disponible
    const iaPreferidaDisponible = await iaDisponible(iaPreferidaParaTarea);
    const iaAlternativa = iaPreferidaParaTarea === "groq" ? "gemini" : "groq";
    const iaAlternativaDisponible = await iaDisponible(iaAlternativa);

    // Paso 3: Seleccionar la IA a usar
    let iaSeleccionada: "groq" | "gemini";

    if (iaPreferidaDisponible) {
      iaSeleccionada = iaPreferidaParaTarea;
      console.log(`🎯 Router: usando ${iaSeleccionada} (preferida para ${tarea})`);
    } else if (iaAlternativaDisponible) {
      iaSeleccionada = iaAlternativa;
      console.log(`🔄 Router: ${iaPreferidaParaTarea} lleno, usando ${iaAlternativa}`);
    } else {
      // Ambas IAs han llegado a su límite
      console.warn("⚠️  Router: ambas IAs han alcanzado el límite diario");
      iaUsada = "cola";
      return {
        respuesta: "Tu petición ha sido recibida pero las IAs han alcanzado su límite diario. Se procesará mañana.",
        iaUsada: "cola",
        desdecache: false,
        tiempoMs: Date.now() - inicio,
      };
    }

    iaUsada = iaSeleccionada;

    // Paso 4: Ejecutar la tarea con la IA seleccionada
    respuesta = await ejecutarTareaConIA(iaSeleccionada, tarea, contenido, extra);

    const tiempoMs = Date.now() - inicio;
    console.log(`✅ Router completado: ${tarea} con ${iaUsada} en ${tiempoMs}ms`);

    return {
      respuesta,
      iaUsada,
      desdecache: false, // El caché está manejado internamente en cada cliente
      tiempoMs,
    };
  } catch (error) {
    const mensaje = (error as Error).message;

    // Si una IA da error de límite, intentar con la otra
    if (mensaje === "GROQ_LIMIT_REACHED" || mensaje === "GEMINI_LIMIT_REACHED") {
      const iaFallback = iaUsada === "groq" ? "gemini" : "groq";
      const fallbackDisponible = await iaDisponible(iaFallback);

      if (fallbackDisponible) {
        console.log(`🔄 Router: error en ${iaUsada}, intentando con ${iaFallback}`);
        respuesta = await ejecutarTareaConIA(iaFallback, tarea, contenido, extra);
        iaUsada = iaFallback;

        return {
          respuesta,
          iaUsada,
          desdecache: false,
          tiempoMs: Date.now() - inicio,
        };
      }
    }

    console.error("❌ Router error:", mensaje);
    throw error;
  }
}

// ==========================================
// EJECUTOR DE TAREAS
// ==========================================

/**
 * Ejecuta una tarea específica con la IA seleccionada
 * Llama a la función especializada según el tipo de tarea
 */
async function ejecutarTareaConIA(
  ia: "groq" | "gemini",
  tarea: TareaIA,
  contenido: string,
  extra?: {
    empresa?: string;
    puesto?: string;
    urlEmpresa?: string;
  }
): Promise<string> {
  // Mapear tarea a tipo de caché
  const tipoCache: Record<TareaIA, TipoPeticionIA> = {
    "mejorar-cv": "mejora-cv",
    "mejorar-cv-largo": "mejora-cv",
    "carta-presentacion": "carta-presentacion",
    "analizar-oferta": "analisis-oferta",
    "analizar-empresa-web": "analisis-empresa",
    "chat-agente": "chat-agente",
    "generico": "generico",
  };

  if (ia === "groq") {
    switch (tarea) {
      case "mejorar-cv":
        return await mejorarCV(contenido, extra?.puesto || "");

      case "carta-presentacion":
        return await generarCartaPresentacion(
          contenido,
          extra?.empresa || "",
          extra?.puesto || ""
        );

      case "analizar-oferta":
        return await analizarOfertaTrabajo(contenido);

      default:
        // Para tareas genéricas o chat, usar la función base
        return await llamarGroq(contenido, tipoCache[tarea]);
    }
  } else {
    // Gemini
    switch (tarea) {
      case "mejorar-cv-largo":
        return await analizarCVLargo(contenido);

      case "analizar-empresa-web":
        return await extraerDatosEmpresa(contenido, extra?.urlEmpresa || "");

      default:
        return await llamarGemini(contenido, tipoCache[tarea]);
    }
  }
}

/**
 * Función de conveniencia: enrutar según la longitud del CV
 * Si el CV tiene más de 2000 palabras, usa Gemini (más contexto)
 *
 * @param textoCv - El texto del CV
 * @param puesto - El puesto al que aplica
 */
export async function enrutarMejoraCV(
  textoCv: string,
  puesto: string
): Promise<RespuestaRouter> {
  const palabras = textoCv.split(/\s+/).length;
  const tarea: TareaIA = palabras > 2000 ? "mejorar-cv-largo" : "mejorar-cv";

  console.log(`📄 CV con ${palabras} palabras → usando tarea: ${tarea}`);

  return await enrutarPeticionIA(tarea, textoCv, { puesto });
}
