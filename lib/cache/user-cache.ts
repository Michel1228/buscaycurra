/**
 * Caché para datos de usuario
 *
 * Evita consultas repetidas a Supabase guardando temporalmente:
 * - Perfil del usuario (5 minutos)
 * - Estadísticas del usuario (1 hora)
 *
 * Cuando el usuario actualiza su perfil, se limpia el caché automáticamente
 */

import { get, set, del } from "./redis-client";

// ==========================================
// TIPOS DE DATOS
// ==========================================

// Estructura del perfil de usuario
export interface PerfilUsuario {
  id: string;
  email: string;
  nombre?: string;
  plan: "free" | "pro" | "empresa";
  cvUrl?: string;
  cvTexto?: string;
  sectores?: string[];
  ubicacion?: string;
  radioKm?: number;
  enviosDiarios?: number;
  activo: boolean;
  creadoEn: string;
}

// Estadísticas de envíos del usuario
export interface EstadisticasUsuario {
  totalEnviados: number;
  enviadosHoy: number;
  enviadosSemana: number;
  enviadosMes: number;
  entrevistasObtenidas: number;
  empresasContactadas: string[];
  ultimoEnvio?: string;
}

// ==========================================
// CONSTANTES DE TTL
// ==========================================

// El perfil se refresca cada 5 minutos (balance entre frescura y rendimiento)
const TTL_PERFIL = 5 * 60; // 5 minutos

// Las estadísticas cambian con cada envío, pero 1 hora es aceptable
const TTL_ESTADISTICAS = 60 * 60; // 1 hora

// ==========================================
// FUNCIONES DE PERFIL
// ==========================================

/**
 * Obtiene el perfil de un usuario del caché
 * Si no está en caché, ejecuta la función para obtenerlo de Supabase
 *
 * @param userId - ID único del usuario
 * @param fnObtenerPerfil - Función que consulta Supabase (solo si no hay caché)
 */
export async function obtenerPerfilUsuarioCacheado(
  userId: string,
  fnObtenerPerfil: () => Promise<PerfilUsuario | null>
): Promise<PerfilUsuario | null> {
  const clave = `user:perfil:${userId}`;

  try {
    // Buscar en caché
    const datosCacheados = await get(clave);

    if (datosCacheados) {
      console.log(`✅ User Cache HIT — perfil de ${userId}`);
      return JSON.parse(datosCacheados) as PerfilUsuario;
    }

    // No hay caché, consultar Supabase
    console.log(`👤 User Cache MISS — obteniendo perfil de ${userId} desde Supabase...`);
    const perfil = await fnObtenerPerfil();

    // Guardar en caché si encontramos el usuario
    if (perfil) {
      await set(clave, JSON.stringify(perfil), TTL_PERFIL);
      console.log(`💾 Perfil de usuario guardado en caché (TTL: 5 min)`);
    }

    return perfil;
  } catch (error) {
    console.error("❌ Error en caché de perfil:", (error as Error).message);
    return await fnObtenerPerfil();
  }
}

// ==========================================
// FUNCIONES DE ESTADÍSTICAS
// ==========================================

/**
 * Obtiene las estadísticas de envíos de un usuario del caché
 *
 * @param userId - ID único del usuario
 * @param fnObtenerStats - Función que consulta Supabase (solo si no hay caché)
 */
export async function obtenerEstadisticasUsuarioCacheadas(
  userId: string,
  fnObtenerStats: () => Promise<EstadisticasUsuario>
): Promise<EstadisticasUsuario> {
  const clave = `user:stats:${userId}`;

  try {
    // Buscar en caché
    const datosCacheados = await get(clave);

    if (datosCacheados) {
      console.log(`✅ Stats Cache HIT — estadísticas de ${userId}`);
      return JSON.parse(datosCacheados) as EstadisticasUsuario;
    }

    // No hay caché, consultar Supabase
    console.log(`📊 Stats Cache MISS — obteniendo estadísticas de ${userId}...`);
    const stats = await fnObtenerStats();

    // Guardar en caché por 1 hora
    await set(clave, JSON.stringify(stats), TTL_ESTADISTICAS);
    console.log(`💾 Estadísticas guardadas en caché (TTL: 1h)`);

    return stats;
  } catch (error) {
    console.error("❌ Error en caché de estadísticas:", (error as Error).message);
    return await fnObtenerStats();
  }
}

// ==========================================
// INVALIDACIÓN DE CACHÉ
// ==========================================

/**
 * Limpia TODO el caché de un usuario
 * Se debe llamar cuando el usuario actualiza su perfil o envía un CV
 *
 * @param userId - ID del usuario cuyo caché limpiar
 */
export async function invalidarCacheUsuario(userId: string): Promise<void> {
  const clavePerfil = `user:perfil:${userId}`;
  const claveStats = `user:stats:${userId}`;

  try {
    // Eliminar ambas entradas en paralelo (más rápido)
    await Promise.all([del(clavePerfil), del(claveStats)]);

    console.log(`🗑️  Caché de usuario eliminado: ${userId}`);
  } catch (error) {
    console.error("❌ Error eliminando caché de usuario:", (error as Error).message);
  }
}

/**
 * Limpia solo el caché del perfil (no las estadísticas)
 * Útil cuando el usuario actualiza datos de perfil pero no ha enviado CVs
 *
 * @param userId - ID del usuario
 */
export async function invalidarCachePerfil(userId: string): Promise<void> {
  const clave = `user:perfil:${userId}`;
  await del(clave);
  console.log(`🗑️  Caché de perfil eliminado: ${userId}`);
}

/**
 * Limpia solo las estadísticas de un usuario
 * Se debe llamar después de cada envío de CV para mantener contadores actualizados
 *
 * @param userId - ID del usuario
 */
export async function invalidarCacheEstadisticas(userId: string): Promise<void> {
  const clave = `user:stats:${userId}`;
  await del(clave);
  console.log(`🗑️  Caché de estadísticas eliminado: ${userId}`);
}
