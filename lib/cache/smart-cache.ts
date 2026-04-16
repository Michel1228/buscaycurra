/**
 * Caché inteligente con prioridades según el plan del usuario
 *
 * La lógica es:
 * - Usuarios Free → caché muy agresivo (guardamos más tiempo)
 *   Razón: tienen límites de IA, necesitan ahorrar más llamadas
 *
 * - Usuarios Pro → caché moderado
 *   Razón: pagan, pero también queremos ahorrar costes
 *
 * - Usuarios Empresa → caché mínimo
 *   Razón: pagan más, quieren siempre respuestas frescas
 *
 * También incluye:
 * - Patrón "cache-aside" automático
 * - Sistema de tags para invalidación masiva
 */

import { get, set, del, obtenerCliente } from "./redis-client";

// ==========================================
// TIPOS DE DATOS
// ==========================================

// Planes disponibles en BuscayCurra
type PlanUsuario = "free" | "pro" | "empresa";

// Tipos de petición para determinar si cachear
type TipoPeticion =
  | "mejora-cv"
  | "busqueda-ofertas"
  | "carta-presentacion"
  | "analisis-empresa"
  | "chat-agente"
  | "estadisticas"
  | "generico";

// Opciones para la función getOrFetch
interface OpcionesCache {
  ttl?: number;           // Tiempo de vida en segundos
  tags?: string[];        // Tags para invalidación masiva
  planUsuario?: PlanUsuario; // Plan del usuario (afecta al TTL)
  forzarActualizacion?: boolean; // Ignorar caché y obtener datos frescos
}

// ==========================================
// MULTIPLICADORES DE TTL POR PLAN
// ==========================================

// Los usuarios Free tienen TTL más largo (caché más agresivo)
const MULTIPLICADOR_TTL: Record<PlanUsuario, number> = {
  free: 3.0,    // 3x más tiempo en caché (ahorra llamadas a IA)
  pro: 1.5,     // 1.5x — balance entre frescura y ahorro
  empresa: 0.5, // 0.5x — mitad de tiempo, respuestas más frescas
};

// TTL base por tipo de petición (en segundos)
const TTL_BASE: Record<TipoPeticion, number> = {
  "mejora-cv": 24 * 60 * 60,          // 24 horas base
  "busqueda-ofertas": 2 * 60 * 60,    // 2 horas base
  "carta-presentacion": 12 * 60 * 60, // 12 horas base
  "analisis-empresa": 3 * 24 * 60 * 60, // 3 días base
  "chat-agente": 30 * 60,             // 30 minutos base
  "estadisticas": 60 * 60,            // 1 hora base
  "generico": 60 * 60,                // 1 hora base
};

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

/**
 * Determina si se debe aplicar caché y cuánto tiempo
 * Tiene en cuenta el tipo de petición y el plan del usuario
 *
 * @param tipoPeticion - Qué tipo de petición es
 * @param userId - ID del usuario (para futuras personalizaciones)
 * @param plan - Plan del usuario (free/pro/empresa)
 * @returns Objeto con si cachear y el TTL calculado
 */
export function deberiasCachear(
  tipoPeticion: TipoPeticion,
  userId: string,
  plan: PlanUsuario = "free"
): { cachear: boolean; ttl: number } {
  // Si el caché de IA está desactivado en las variables de entorno
  if (process.env.AI_CACHE_ENABLED === "false") {
    return { cachear: false, ttl: 0 };
  }

  const ttlBase = TTL_BASE[tipoPeticion] || TTL_BASE.generico;
  const multiplicador = MULTIPLICADOR_TTL[plan];
  const ttlFinal = Math.round(ttlBase * multiplicador);

  console.log(`🧠 Smart Cache — tipo: ${tipoPeticion}, plan: ${plan}, TTL: ${ttlFinal}s`);

  return { cachear: true, ttl: ttlFinal };
}

/**
 * Patrón "cache-aside": obtener del caché o ejecutar función y guardar
 *
 * Uso típico:
 * const resultado = await obtenerOEjecutar(
 *   "mi-clave-unica",
 *   () => llamarALaIA(prompt),
 *   { planUsuario: "free", tags: ["cv", "madrid"] }
 * );
 *
 * @param clave - Clave única para identificar el dato en caché
 * @param fnObtener - Función que obtiene el dato real (si no está en caché)
 * @param opciones - Opciones de caché (TTL, tags, etc.)
 */
export async function obtenerOEjecutar<T>(
  clave: string,
  fnObtener: () => Promise<T>,
  opciones: OpcionesCache = {}
): Promise<T> {
  const {
    ttl,
    tags = [],
    planUsuario = "free",
    forzarActualizacion = false,
  } = opciones;

  try {
    // Si se fuerza actualización, saltamos el caché
    if (!forzarActualizacion) {
      const datosCacheados = await get(clave);

      if (datosCacheados) {
        console.log(`✅ Smart Cache HIT — clave: ${clave}`);
        return JSON.parse(datosCacheados) as T;
      }
    }

    // No hay caché, ejecutar la función
    console.log(`🔄 Smart Cache MISS — ejecutando para clave: ${clave}`);
    const resultado = await fnObtener();

    // Calcular TTL según el plan del usuario
    const ttlFinal =
      ttl || Math.round((TTL_BASE.generico) * MULTIPLICADOR_TTL[planUsuario]);

    // Guardar en caché
    await set(clave, JSON.stringify(resultado), ttlFinal);

    // Si hay tags, registrarlos para poder invalidar por grupo después
    if (tags.length > 0) {
      await registrarTags(clave, tags, ttlFinal);
    }

    return resultado;
  } catch (error) {
    console.error(`❌ Smart Cache error para clave "${clave}":`, (error as Error).message);
    // Si hay error de caché, ejecutar la función directamente
    return await fnObtener();
  }
}

/**
 * Registra los tags de una clave para poder invalidarlos masivamente
 * Ejemplo: tag "ofertas-madrid" agrupa todas las ofertas de Madrid
 *
 * @param clave - Clave del dato
 * @param tags - Lista de tags a asociar
 * @param ttl - Tiempo de vida de los tags
 */
async function registrarTags(
  clave: string,
  tags: string[],
  ttl: number
): Promise<void> {
  try {
    const redis = await obtenerCliente();
    if (!redis) return;

    // Para cada tag, añadir la clave al set de claves con ese tag
    for (const tag of tags) {
      const claveTag = `tag:${tag}`;
      await redis.sAdd(claveTag, clave);
      // El tag expira cuando expira el dato
      await redis.expire(claveTag, ttl + 60); // Un poco más de tiempo que el dato
    }

    console.log(`🏷️  Tags registrados: [${tags.join(", ")}] → ${clave}`);
  } catch (error) {
    console.error("❌ Error registrando tags:", (error as Error).message);
  }
}

/**
 * Invalida (elimina) todos los datos con un tag específico
 * Ejemplo: invalidarPorTag("ofertas-madrid") borra todas las búsquedas de Madrid
 *
 * @param tag - El tag a invalidar
 */
export async function invalidarPorTag(tag: string): Promise<number> {
  try {
    const redis = await obtenerCliente();
    if (!redis) return 0;

    const claveTag = `tag:${tag}`;

    // Obtener todas las claves asociadas a este tag
    const claves = await redis.sMembers(claveTag);

    if (claves.length === 0) {
      console.log(`ℹ️  No hay claves con el tag: ${tag}`);
      return 0;
    }

    // Eliminar todas las claves en paralelo
    await Promise.all(claves.map((clave) => del(clave)));

    // Eliminar el tag también
    await del(claveTag);

    console.log(`🗑️  Invalidado tag "${tag}": ${claves.length} claves eliminadas`);
    return claves.length;
  } catch (error) {
    console.error(`❌ Error invalidando tag "${tag}":`, (error as Error).message);
    return 0;
  }
}

/**
 * Calcula el TTL optimizado para un usuario según su plan
 * Los usuarios Free necesitan TTLs más largos para ahorrar llamadas a IA
 *
 * @param ttlBase - TTL base en segundos
 * @param plan - Plan del usuario
 */
export function calcularTTLOptimizado(
  ttlBase: number,
  plan: PlanUsuario = "free"
): number {
  return Math.round(ttlBase * MULTIPLICADOR_TTL[plan]);
}

// Exportar los TTLs base para uso en otros módulos
export { TTL_BASE, MULTIPLICADOR_TTL };
