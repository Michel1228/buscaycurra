/**
 * Cliente para Groq API (Llama 3.3)
 *
 * Groq es la IA más RÁPIDA del mundo (500 tokens/segundo)
 * Es perfecta para:
 * - Chat del agente (respuestas instantáneas)
 * - Cartas de presentación (rápido y preciso)
 * - Mejorar CVs cortos
 *
 * Incluye:
 * - Caché automático (todas las llamadas pasan por Redis primero)
 * - Rate limiting (no superar 14.400 req/día del tier gratuito)
 * - Contador diario en Redis
 */

import Groq from "groq-sdk";
import { obtenerConCacheIA, TipoPeticionIA } from "../cache/ai-cache";
import { get, incrementar } from "../cache/redis-client";

// ==========================================
// CONFIGURACIÓN
// ==========================================

// Límite diario del tier gratuito de Groq
const LIMITE_DIARIO_GROQ = 14000; // Dejamos 400 de margen sobre los 14.400

// Modelo a usar (el mejor disponible en Groq gratis)
const MODELO_GROQ = "llama-3.3-70b-versatile";

// Temperatura por defecto (0.7 = balance creatividad/coherencia)
const TEMPERATURA_DEFAULT = 0.7;

// ==========================================
// CLIENTE GROQ
// ==========================================

// Instancia del cliente (se crea solo una vez)
let clienteGroq: Groq | null = null;

/**
 * Obtiene el cliente de Groq (patrón singleton)
 * Si no hay API key, devuelve null
 */
function obtenerClienteGroq(): Groq | null {
  if (!process.env.GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY no configurada en las variables de entorno");
    return null;
  }

  if (!clienteGroq) {
    clienteGroq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    console.log("✅ Cliente Groq inicializado");
  }

  return clienteGroq;
}

// ==========================================
// GESTIÓN DE RATE LIMITING
// ==========================================

/**
 * Comprueba si hemos superado el límite diario de Groq
 * Devuelve true si podemos hacer más llamadas, false si no
 */
async function podemoUsarGroq(): Promise<boolean> {
  const fecha = new Date().toISOString().split("T")[0];
  const clave = `groq:calls:${fecha}`;

  const llamadasStr = await get(clave);
  const llamadasHoy = parseInt(llamadasStr || "0");

  if (llamadasHoy >= LIMITE_DIARIO_GROQ) {
    console.warn(`⚠️  Groq: límite diario alcanzado (${llamadasHoy}/${LIMITE_DIARIO_GROQ})`);
    return false;
  }

  return true;
}

/**
 * Registra una llamada a Groq en el contador diario
 */
async function registrarLlamadaGroq(): Promise<void> {
  const fecha = new Date().toISOString().split("T")[0];
  const clave = `groq:calls:${fecha}`;

  // El contador expira a medianoche (86400 segundos = 24 horas)
  const total = await incrementar(clave, 86400);
  console.log(`📊 Groq llamadas hoy: ${total}/${LIMITE_DIARIO_GROQ}`);
}

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================

/**
 * Llama a Groq con caché automático
 * Si la respuesta está en caché, la devuelve sin llamar a Groq
 *
 * @param prompt - El texto a enviar a la IA
 * @param tipo - Tipo de petición (afecta al TTL del caché)
 * @param opciones - Opciones adicionales (temperatura, max tokens, etc.)
 */
export async function llamarGroq(
  prompt: string,
  tipo: TipoPeticionIA = "generico",
  opciones: {
    temperatura?: number;
    maxTokens?: number;
    sistemaPrompt?: string;
  } = {}
): Promise<string> {
  // Primero intentar desde caché (no gasta cuota de API)
  return await obtenerConCacheIA(prompt, tipo, async () => {
    // Si llegamos aquí, hay que llamar a Groq de verdad

    // Comprobar límite diario
    const puedeUsarGroq = await podemoUsarGroq();
    if (!puedeUsarGroq) {
      throw new Error("GROQ_LIMIT_REACHED");
    }

    const cliente = obtenerClienteGroq();
    if (!cliente) {
      throw new Error("GROQ_NOT_CONFIGURED");
    }

    const mensajes: { role: "system" | "user"; content: string }[] = [];

    // Añadir prompt de sistema si se especifica
    if (opciones.sistemaPrompt) {
      mensajes.push({
        role: "system",
        content: opciones.sistemaPrompt,
      });
    }

    mensajes.push({
      role: "user",
      content: prompt,
    });

    console.log(`🤖 Llamando a Groq (${MODELO_GROQ})...`);

    const respuesta = await cliente.chat.completions.create({
      messages: mensajes,
      model: MODELO_GROQ,
      temperature: opciones.temperatura ?? TEMPERATURA_DEFAULT,
      max_tokens: opciones.maxTokens ?? 2048,
    });

    // Registrar la llamada en el contador
    await registrarLlamadaGroq();

    const contenido = respuesta.choices[0]?.message?.content || "";
    console.log(`✅ Groq respondió (${contenido.length} caracteres)`);

    return contenido;
  });
}

// ==========================================
// FUNCIONES ESPECIALIZADAS
// ==========================================

/**
 * Mejora el CV de un usuario para un puesto específico
 *
 * @param textoCv - El texto actual del CV
 * @param tituloPuesto - El título del puesto al que aplica
 */
export async function mejorarCV(
  textoCv: string,
  tituloPuesto: string
): Promise<string> {
  const prompt = `Eres un experto en recursos humanos en España. Mejora este CV para el puesto de "${tituloPuesto}".

CV ACTUAL:
${textoCv}

Instrucciones:
- Mantén la información real, no inventes datos
- Mejora la redacción y presentación
- Resalta las habilidades más relevantes para el puesto
- Usa vocabulario profesional en español
- Formato limpio y legible

Devuelve solo el CV mejorado, sin comentarios adicionales.`;

  return await llamarGroq(prompt, "mejora-cv", {
    sistemaPrompt: "Eres un experto en recursos humanos especializado en el mercado laboral español.",
    maxTokens: 3000,
  });
}

/**
 * Genera una carta de presentación personalizada
 *
 * @param textoCv - El CV del candidato
 * @param empresa - Nombre de la empresa
 * @param puesto - Puesto al que aplica
 * @param infoEmpresa - Información adicional sobre la empresa (opcional)
 */
export async function generarCartaPresentacion(
  textoCv: string,
  empresa: string,
  puesto: string,
  infoEmpresa?: string
): Promise<string> {
  const prompt = `Escribe una carta de presentación profesional para aplicar al puesto de "${puesto}" en "${empresa}".

MI CV:
${textoCv}

${infoEmpresa ? `INFORMACIÓN DE LA EMPRESA:\n${infoEmpresa}` : ""}

Instrucciones:
- Carta en español, tono profesional pero cercano
- Máximo 3 párrafos
- Menciona algo específico de la empresa que muestre interés real
- Conecta mis habilidades con las necesidades del puesto
- Termina con llamada a la acción (solicitar entrevista)
- No usar frases hechas como "me dirijo a ustedes"

Devuelve solo la carta, sin comentarios.`;

  return await llamarGroq(prompt, "carta-presentacion", {
    maxTokens: 1500,
  });
}

/**
 * Analiza una oferta de trabajo y extrae información clave
 *
 * @param textoOferta - El texto de la oferta de trabajo
 */
export async function analizarOfertaTrabajo(textoOferta: string): Promise<string> {
  const prompt = `Analiza esta oferta de trabajo y extrae la información más importante en español.

OFERTA:
${textoOferta}

Extrae en formato estructurado:
- Empresa: 
- Puesto:
- Requisitos imprescindibles:
- Requisitos valorados:
- Salario (si aparece):
- Modalidad (presencial/remoto/híbrido):
- Puntos clave para el CV:
- Palabras clave importantes:`;

  return await llamarGroq(prompt, "analisis-oferta", {
    maxTokens: 1000,
  });
}

/**
 * Exportar el límite diario para que el router pueda consultarlo
 */
export { LIMITE_DIARIO_GROQ };
