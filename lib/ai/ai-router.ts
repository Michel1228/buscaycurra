/**
 * Router inteligente de IA para BuscayCurra
 *
 * Decide automáticamente qué IA usar según:
 * - El tipo de tarea (chat → DeepSeek, CV largo → Gemini, rápido → Groq)
 * - Los límites de cada API (si una está llena, usa otra)
 * - Si todas están llenas, pone la tarea en cola para mañana
 *
 * El resto de la app solo llama a este router y no necesita
 * saber qué IA se usa internamente ✅
 */

import { get } from "../cache/redis-client";
import { llamarGroq, mejorarCV, generarCartaPresentacion, analizarOfertaTrabajo, LIMITE_DIARIO_GROQ } from "./groq-client";
import { llamarGemini, analizarCVLargo, extraerDatosEmpresa, LIMITE_DIARIO_GEMINI } from "./gemini-client";
import { llamarDeepSeek, LIMITE_DIARIO_DEEPSEEK } from "./deepseek-client";
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
  iaUsada: "groq" | "gemini" | "deepseek" | "cola";
  desdecache: boolean;
  tiempoMs: number;
}

type IA = "groq" | "gemini" | "deepseek";

// ==========================================
// LÓGICA DE SELECCIÓN DE IA
// ==========================================

/**
 * Determina la IA preferida para cada tipo de tarea
 *
 * DeepSeek → Chat y NLP (mejor español coloquial)
 * Gemini   → Contexto largo (1M tokens), análisis complejos
 * Groq     → Velocidad (500 tokens/s), tareas cortas
 */
function iaPreferida(tarea: TareaIA): IA {
  // DeepSeek: el mejor para entender español coloquial
  if (tarea === "chat-agente") return "deepseek";

  // Gemini: contexto largo para CVs largos y análisis web
  if (tarea === "mejorar-cv-largo" || tarea === "analizar-empresa-web") {
    return "gemini";
  }

  // DeepSeek: default para todo — consumo mínimo, español nativo
  return "deepseek";
}

// ==========================================
// VERIFICACIÓN DE LÍMITES
// ==========================================

async function iaDisponible(ia: IA): Promise<boolean> {
  const fecha = new Date().toISOString().split("T")[0];

  try {
    if (ia === "groq") {
      const llamadasStr = await get(`groq:calls:${fecha}`);
      return parseInt(llamadasStr || "0") < LIMITE_DIARIO_GROQ;
    } else if (ia === "gemini") {
      const llamadasStr = await get(`gemini:calls:${fecha}`);
      return parseInt(llamadasStr || "0") < LIMITE_DIARIO_GEMINI;
    } else {
      const llamadasStr = await get(`deepseek:calls:${fecha}`);
      return parseInt(llamadasStr || "0") < LIMITE_DIARIO_DEEPSEEK;
    }
  } catch {
    return true;
  }
}

// ==========================================
// ROUTER PRINCIPAL
// ==========================================

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
  let iaUsada: IA | "cola" = "groq";
  let respuesta = "";

  try {
    const iaPreferidaParaTarea = iaPreferida(tarea);

    // Comprobar disponibilidad de las 3 IAs
    const preferidaOk = await iaDisponible(iaPreferidaParaTarea);

    if (preferidaOk) {
      iaUsada = iaPreferidaParaTarea;
      console.log(`🎯 Router: usando ${iaUsada} (preferida para ${tarea})`);
    } else {
      // Fallback: probar las otras dos en orden
      const alternativas: IA[] = ["deepseek", "groq", "gemini"].filter(
        (ia) => ia !== iaPreferidaParaTarea
      ) as IA[];

      let encontrada = false;
      for (const alt of alternativas) {
        if (await iaDisponible(alt)) {
          iaUsada = alt;
          console.log(`🔄 Router: ${iaPreferidaParaTarea} lleno, usando ${alt}`);
          encontrada = true;
          break;
        }
      }

      if (!encontrada) {
        console.warn("⚠️  Router: las 3 IAs han alcanzado el límite diario");
        return {
          respuesta:
            "Todas las IAs han alcanzado su límite diario. Tu petición se procesará mañana.",
          iaUsada: "cola",
          desdecache: false,
          tiempoMs: Date.now() - inicio,
        };
      }
    }

    // Ejecutar con la IA seleccionada
    respuesta = await ejecutarTareaConIA(iaUsada, tarea, contenido, extra);

    const tiempoMs = Date.now() - inicio;
    console.log(`✅ Router completado: ${tarea} con ${iaUsada} en ${tiempoMs}ms`);

    return { respuesta, iaUsada, desdecache: false, tiempoMs };
  } catch (error) {
    const mensaje = (error as Error).message;

    // Si una IA da error de límite, intentar con otra
    if (
      mensaje === "GROQ_LIMIT_REACHED" ||
      mensaje === "GEMINI_LIMIT_REACHED" ||
      mensaje === "DEEPSEEK_LIMIT_REACHED"
    ) {
      const iaFallida = mensaje.split("_")[0].toLowerCase() as IA;
      const alternativas: IA[] = ["deepseek", "groq", "gemini"].filter(
        (ia) => ia !== iaFallida
      ) as IA[];

      for (const fallback of alternativas) {
        if (await iaDisponible(fallback)) {
          console.log(`🔄 Router: error en ${iaFallida}, usando ${fallback}`);
          respuesta = await ejecutarTareaConIA(fallback, tarea, contenido, extra);
          return {
            respuesta,
            iaUsada: fallback,
            desdecache: false,
            tiempoMs: Date.now() - inicio,
          };
        }
      }
    }

    console.error("❌ Router error:", mensaje);
    throw error;
  }
}

// ==========================================
// EJECUTOR DE TAREAS
// ==========================================

async function ejecutarTareaConIA(
  ia: IA,
  tarea: TareaIA,
  contenido: string,
  extra?: {
    empresa?: string;
    puesto?: string;
    urlEmpresa?: string;
  }
): Promise<string> {
  const tipoCache: Record<TareaIA, TipoPeticionIA> = {
    "mejorar-cv": "mejora-cv",
    "mejorar-cv-largo": "mejora-cv",
    "carta-presentacion": "carta-presentacion",
    "analizar-oferta": "analisis-oferta",
    "analizar-empresa-web": "analisis-empresa",
    "chat-agente": "chat-agente",
    "generico": "generico",
  };

  // === GROQ ===
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
        return await llamarGroq(contenido, tipoCache[tarea]);
    }
  }

  // === GEMINI ===
  if (ia === "gemini") {
    switch (tarea) {
      case "mejorar-cv-largo":
        return await analizarCVLargo(contenido);
      case "analizar-empresa-web":
        return await extraerDatosEmpresa(contenido, extra?.urlEmpresa || "");
      default:
        return await llamarGemini(contenido, tipoCache[tarea]);
    }
  }

  // === DEEPSEEK ===
  return await llamarDeepSeek(contenido, tipoCache[tarea]);
}

/**
 * Función de conveniencia: enrutar según la longitud del CV
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
