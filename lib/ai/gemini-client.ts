/**
 * Cliente para Google Gemini 1.5 Flash
 *
 * Gemini es perfecto para:
 * - CVs muy largos (soporta hasta 1 millón de tokens)
 * - Analizar webs completas de empresas
 * - Cuando Groq llega a su límite diario
 *
 * Incluye:
 * - Caché automático (todas las llamadas pasan por Redis primero)
 * - Contador diario en Redis
 * - Manejo de errores robusto
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { obtenerConCacheIA, TipoPeticionIA } from "../cache/ai-cache";
import { get, incrementar } from "../cache/redis-client";

// ==========================================
// CONFIGURACIÓN
// ==========================================

// Modelo a usar (Flash es rápido y gratuito)
const MODELO_GEMINI = "gemini-1.5-flash";

// Límite diario aproximado (15 req/min × 60 min × 24h)
// En la práctica limitamos menos porque el caché reduce muchas llamadas
const LIMITE_DIARIO_GEMINI = 1440; // ~1.440 req/día (15/min)

// ==========================================
// CLIENTE GEMINI
// ==========================================

// Instancia del cliente
let clienteGemini: GoogleGenerativeAI | null = null;
let modeloGemini: GenerativeModel | null = null;

/**
 * Obtiene el cliente de Gemini (patrón singleton)
 */
function obtenerClienteGemini(): GenerativeModel | null {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY no configurada en las variables de entorno");
    return null;
  }

  if (!modeloGemini) {
    clienteGemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    modeloGemini = clienteGemini.getGenerativeModel({ model: MODELO_GEMINI });
    console.log("✅ Cliente Gemini inicializado");
  }

  return modeloGemini;
}

// ==========================================
// GESTIÓN DE RATE LIMITING
// ==========================================

/**
 * Comprueba si hemos superado el límite diario de Gemini
 */
async function podemosUsarGemini(): Promise<boolean> {
  const fecha = new Date().toISOString().split("T")[0];
  const clave = `gemini:calls:${fecha}`;

  const llamadasStr = await get(clave);
  const llamadasHoy = parseInt(llamadasStr || "0");

  if (llamadasHoy >= LIMITE_DIARIO_GEMINI) {
    console.warn(`⚠️  Gemini: límite diario alcanzado (${llamadasHoy}/${LIMITE_DIARIO_GEMINI})`);
    return false;
  }

  return true;
}

/**
 * Registra una llamada a Gemini en el contador diario
 */
async function registrarLlamadaGemini(): Promise<void> {
  const fecha = new Date().toISOString().split("T")[0];
  const clave = `gemini:calls:${fecha}`;

  const total = await incrementar(clave, 86400); // expira en 24h
  console.log(`📊 Gemini llamadas hoy: ${total}/${LIMITE_DIARIO_GEMINI}`);
}

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================

/**
 * Llama a Gemini con caché automático
 *
 * @param prompt - El texto a enviar a la IA
 * @param tipo - Tipo de petición (afecta al TTL del caché)
 */
export async function llamarGemini(
  prompt: string,
  tipo: TipoPeticionIA = "generico"
): Promise<string> {
  // Primero intentar desde caché
  return await obtenerConCacheIA(prompt, tipo, async () => {
    // Comprobar límite diario
    const geminiDisponible = await podemosUsarGemini();
    if (!geminiDisponible) {
      throw new Error("GEMINI_LIMIT_REACHED");
    }

    const modelo = obtenerClienteGemini();
    if (!modelo) {
      throw new Error("GEMINI_NOT_CONFIGURED");
    }

    console.log(`🤖 Llamando a Gemini (${MODELO_GEMINI})...`);

    const resultado = await modelo.generateContent(prompt);
    const respuesta = resultado.response;
    const texto = respuesta.text();

    // Registrar llamada
    await registrarLlamadaGemini();

    console.log(`✅ Gemini respondió (${texto.length} caracteres)`);
    return texto;
  });
}

// ==========================================
// FUNCIONES ESPECIALIZADAS
// ==========================================

/**
 * Analiza un CV muy largo (más de 2000 palabras)
 * Gemini soporta hasta 1 millón de tokens, ideal para esto
 *
 * @param textoCv - El texto completo del CV
 */
export async function analizarCVLargo(textoCv: string): Promise<string> {
  const prompt = `Eres un experto en recursos humanos en España. Analiza este CV en detalle.

CV:
${textoCv}

Proporciona:
1. RESUMEN EJECUTIVO (3-4 líneas)
2. PUNTOS FUERTES (lista)
3. PUNTOS A MEJORAR (lista)
4. SECTORES RECOMENDADOS donde aplicar
5. PALABRAS CLAVE para incluir en el CV
6. PUNTUACIÓN general del CV (1-10) con justificación

Responde en español, de forma clara y útil para el candidato.`;

  return await llamarGemini(prompt, "mejora-cv");
}

/**
 * Extrae información útil de la web de una empresa
 * Útil para personalizar cartas de presentación
 *
 * @param htmlEmpresa - El HTML de la web de la empresa
 * @param urlEmpresa - URL de la empresa (para referencia)
 */
export async function extraerDatosEmpresa(
  htmlEmpresa: string,
  urlEmpresa: string
): Promise<string> {
  // Limpiar el HTML de etiquetas para reducir tokens
  const textoLimpio = htmlEmpresa
    .replace(/<[^>]*>/g, " ")      // Quitar etiquetas HTML
    .replace(/\s+/g, " ")          // Normalizar espacios
    .trim()
    .substring(0, 10000);           // Limitar a 10.000 caracteres

  const prompt = `Analiza esta información de la empresa y extrae los datos más relevantes para un candidato que quiere enviar su CV.

URL: ${urlEmpresa}

CONTENIDO WEB:
${textoLimpio}

Extrae:
- Nombre oficial de la empresa:
- Sector o industria:
- Descripción breve (2-3 líneas):
- Tamaño aproximado (si se menciona):
- Valores o cultura de empresa:
- Tecnologías o herramientas mencionadas:
- Email de contacto (si aparece):
- Información de RRHH o empleo (si aparece):
- Tono de la empresa (formal/informal/startup/corporativo):

Si algún dato no está disponible, escribe "No disponible".`;

  return await llamarGemini(prompt, "analisis-empresa");
}

// Exportar el límite para el router
export { LIMITE_DIARIO_GEMINI };
