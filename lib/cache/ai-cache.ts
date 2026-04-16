/**
 * Caché específico para respuestas de Inteligencia Artificial
 * Evita llamar a la IA cuando ya tenemos la respuesta guardada
 *
 * Funcionamiento:
 * 1. Usuario pide mejorar su CV
 * 2. Generamos un hash único del texto
 * 3. Si el hash está en Redis → devolvemos la respuesta guardada (¡gratis!)
 * 4. Si no está → llamamos a la IA, guardamos y devolvemos
 */

import crypto from "crypto";
import { get, set, incrementar } from "./redis-client";

// Tipos de peticiones a la IA con sus tiempos de caché correspondientes
export type TipoPeticionIA =
  | "mejora-cv"          // Mejorar curriculum vitae
  | "busqueda-ofertas"   // Buscar ofertas de trabajo
  | "carta-presentacion" // Generar carta de presentación
  | "analisis-empresa"   // Analizar información de empresa
  | "analisis-oferta"    // Analizar oferta de trabajo específica
  | "chat-agente"        // Respuestas del agente conversacional
  | "generico";          // Cualquier otra petición

// Tiempos de caché por tipo de petición (en segundos)
// Lógica: el CV no cambia, pero las ofertas sí
const TTL_POR_TIPO: Record<TipoPeticionIA, number> = {
  "mejora-cv": 7 * 24 * 60 * 60,          // 7 días — el CV no cambia
  "busqueda-ofertas": 2 * 60 * 60,         // 2 horas — cambian poco
  "carta-presentacion": 24 * 60 * 60,      // 24 horas — bastante estable
  "analisis-empresa": 3 * 24 * 60 * 60,    // 3 días — info empresa es estable
  "analisis-oferta": 6 * 60 * 60,          // 6 horas — puede actualizarse
  "chat-agente": 30 * 60,                  // 30 minutos — conversaciones cortas
  "generico": 60 * 60,                     // 1 hora — default
};

// Prefijo de clave en Redis para respuestas de IA
const PREFIJO_AI = "ai:respuesta:";

// Claves para estadísticas del caché
const CLAVE_HITS = "ai:cache:hits";
const CLAVE_MISSES = "ai:cache:misses";

/**
 * Genera un hash MD5 único a partir del prompt
 * Dos prompts idénticos producen el mismo hash → misma clave en Redis
 *
 * @param prompt - El texto del prompt enviado a la IA
 * @param tipo - Tipo de petición (para separar caché por tipo)
 */
function generarHashPrompt(prompt: string, tipo: TipoPeticionIA): string {
  const textoCompleto = `${tipo}:${prompt}`;
  return crypto.createHash("md5").update(textoCompleto).digest("hex");
}

/**
 * Busca una respuesta de IA en el caché
 *
 * @param prompt - El texto que se enviaría a la IA
 * @param tipo - Tipo de petición para usar el TTL correcto
 * @returns La respuesta guardada o null si no existe
 */
export async function obtenerRespuestaCacheada(
  prompt: string,
  tipo: TipoPeticionIA = "generico"
): Promise<string | null> {
  try {
    // Generar clave única para este prompt
    const hash = generarHashPrompt(prompt, tipo);
    const clave = `${PREFIJO_AI}${hash}`;

    // Buscar en Redis
    const respuestaGuardada = await get(clave);

    if (respuestaGuardada) {
      // ¡Acierto! Tenemos la respuesta en caché
      await incrementar(CLAVE_HITS);
      console.log(`✅ AI Cache HIT — tipo: ${tipo}, hash: ${hash.substring(0, 8)}...`);
      return respuestaGuardada;
    }

    // No está en caché (miss)
    await incrementar(CLAVE_MISSES);
    console.log(`❌ AI Cache MISS — tipo: ${tipo}, hash: ${hash.substring(0, 8)}...`);
    return null;
  } catch (error) {
    console.error("❌ Error buscando en AI cache:", (error as Error).message);
    return null;
  }
}

/**
 * Guarda una respuesta de IA en el caché
 *
 * @param prompt - El prompt original
 * @param respuesta - La respuesta de la IA a guardar
 * @param tipo - Tipo de petición para usar el TTL correcto
 */
export async function guardarRespuestaIA(
  prompt: string,
  respuesta: string,
  tipo: TipoPeticionIA = "generico"
): Promise<boolean> {
  try {
    // Verificar que el caché de IA está habilitado
    if (process.env.AI_CACHE_ENABLED === "false") {
      return false;
    }

    const hash = generarHashPrompt(prompt, tipo);
    const clave = `${PREFIJO_AI}${hash}`;
    const ttl = TTL_POR_TIPO[tipo];

    const guardado = await set(clave, respuesta, ttl);

    if (guardado) {
      console.log(`💾 AI Cache guardado — tipo: ${tipo}, TTL: ${ttl}s`);
    }

    return guardado;
  } catch (error) {
    console.error("❌ Error guardando en AI cache:", (error as Error).message);
    return false;
  }
}

/**
 * Función principal: obtiene respuesta de IA con caché automático
 * Esta es la función que deben usar todos los clientes de IA
 *
 * @param prompt - El texto a enviar a la IA
 * @param tipo - Tipo de petición
 * @param llamadaIA - Función que llama a la IA real (se ejecuta solo si no hay caché)
 * @returns La respuesta (desde caché o desde la IA)
 */
export async function obtenerConCacheIA(
  prompt: string,
  tipo: TipoPeticionIA,
  llamadaIA: () => Promise<string>
): Promise<string> {
  // Paso 1: Intentar obtener del caché
  const respuestaCacheada = await obtenerRespuestaCacheada(prompt, tipo);

  if (respuestaCacheada) {
    return respuestaCacheada;
  }

  // Paso 2: No hay caché, llamar a la IA
  console.log(`🤖 Llamando a la IA para tipo: ${tipo}...`);
  const respuestaIA = await llamadaIA();

  // Paso 3: Guardar en caché para futuras peticiones
  await guardarRespuestaIA(prompt, respuestaIA, tipo);

  return respuestaIA;
}

/**
 * Obtiene las estadísticas del caché de IA
 * Útil para el panel de administración
 */
export async function obtenerEstadisticasCache(): Promise<{
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  totalPeticiones: number;
}> {
  try {
    const [hitsStr, missesStr] = await Promise.all([
      get(CLAVE_HITS),
      get(CLAVE_MISSES),
    ]);

    const totalHits = parseInt(hitsStr || "0");
    const totalMisses = parseInt(missesStr || "0");
    const totalPeticiones = totalHits + totalMisses;

    // Calcular porcentaje de aciertos
    const hitRate =
      totalPeticiones > 0
        ? Math.round((totalHits / totalPeticiones) * 100)
        : 0;

    return {
      totalHits,
      totalMisses,
      hitRate,
      totalPeticiones,
    };
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas de AI cache:", (error as Error).message);
    return { totalHits: 0, totalMisses: 0, hitRate: 0, totalPeticiones: 0 };
  }
}

// Exportar los TTLs para que otros módulos puedan consultarlos
export { TTL_POR_TIPO };
