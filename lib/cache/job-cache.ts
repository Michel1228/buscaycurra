/**
 * Caché específico para ofertas de trabajo y datos de empresas
 *
 * Las ofertas de trabajo no cambian cada minuto, por eso:
 * - Guardamos los resultados del scraper durante 2 horas
 * - La info de empresa se guarda durante 7 días
 * - Ahorramos muchísimas llamadas al scraper
 */

import crypto from "crypto";
import { get, set, del } from "./redis-client";

// ==========================================
// TIPOS DE DATOS
// ==========================================

// Estructura de una oferta de trabajo
export interface OfertaTrabajo {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  descripcion: string;
  url: string;
  fechaPublicacion?: string;
  salario?: string;
  modalidad?: "presencial" | "remoto" | "hibrido";
}

// Estructura de información de empresa
export interface InfoEmpresa {
  nombre: string;
  url: string;
  descripcion?: string;
  sector?: string;
  tamano?: string;
  emailContacto?: string;
  ubicacion?: string;
  fechaObtencion: string;
}

// ==========================================
// CONSTANTES DE TTL (tiempo de vida)
// ==========================================

// Las ofertas duran 2 horas porque cambian relativamente poco
const TTL_OFERTAS = 2 * 60 * 60; // 2 horas en segundos

// La info de empresa es muy estable, dura 7 días
const TTL_EMPRESA = 7 * 24 * 60 * 60; // 7 días en segundos

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

/**
 * Obtiene ofertas de trabajo del caché o lanza el scraper
 *
 * @param keyword - Palabra clave de búsqueda (ej: "electricista")
 * @param ubicacion - Ubicación (ej: "Madrid")
 * @param fnScraper - Función que lanza el scraper real (solo si no hay caché)
 * @returns Array de ofertas de trabajo
 */
export async function obtenerOfertasCacheadas(
  keyword: string,
  ubicacion: string,
  fnScraper: () => Promise<OfertaTrabajo[]>
): Promise<OfertaTrabajo[]> {
  // Normalizar clave (minúsculas, sin espacios extra)
  const keyNormalizada = keyword.toLowerCase().trim();
  const ubicNormalizada = ubicacion.toLowerCase().trim();
  const clave = `jobs:${keyNormalizada}:${ubicNormalizada}`;

  try {
    // Buscar en caché primero
    const datosCacheados = await get(clave);

    if (datosCacheados) {
      console.log(`✅ Jobs Cache HIT — ${keyNormalizada} en ${ubicNormalizada}`);
      return JSON.parse(datosCacheados) as OfertaTrabajo[];
    }

    // No hay caché, ejecutar el scraper
    console.log(`🔍 Jobs Cache MISS — buscando ${keyNormalizada} en ${ubicNormalizada}...`);
    const ofertas = await fnScraper();

    // Guardar resultado en caché para próximas búsquedas iguales
    if (ofertas.length > 0) {
      await set(clave, JSON.stringify(ofertas), TTL_OFERTAS);
      console.log(`💾 Jobs guardados en caché: ${ofertas.length} ofertas (TTL: 2h)`);
    }

    return ofertas;
  } catch (error) {
    console.error("❌ Error en caché de ofertas:", (error as Error).message);
    // Si falla el caché, ejecutar el scraper directamente
    return await fnScraper();
  }
}

/**
 * Obtiene información de una empresa del caché o la extrae de su web
 *
 * @param url - URL de la empresa
 * @param fnObtenerInfo - Función que extrae la info de la empresa (solo si no hay caché)
 * @returns Información de la empresa
 */
export async function obtenerInfoEmpresaCacheada(
  url: string,
  fnObtenerInfo: () => Promise<InfoEmpresa>
): Promise<InfoEmpresa> {
  // Crear hash de la URL para usarla como clave (URLs pueden ser muy largas)
  const urlHash = crypto.createHash("md5").update(url).digest("hex");
  const clave = `company:${urlHash}`;

  try {
    // Buscar en caché
    const datosCacheados = await get(clave);

    if (datosCacheados) {
      console.log(`✅ Company Cache HIT — ${url.substring(0, 50)}...`);
      return JSON.parse(datosCacheados) as InfoEmpresa;
    }

    // No hay caché, obtener la información
    console.log(`🏢 Company Cache MISS — analizando ${url.substring(0, 50)}...`);
    const infoEmpresa = await fnObtenerInfo();

    // Guardar en caché por 7 días
    await set(clave, JSON.stringify(infoEmpresa), TTL_EMPRESA);
    console.log(`💾 Info empresa guardada en caché (TTL: 7 días)`);

    return infoEmpresa;
  } catch (error) {
    console.error("❌ Error en caché de empresa:", (error as Error).message);
    return await fnObtenerInfo();
  }
}

/**
 * Invalida (elimina) el caché de ofertas para forzar una búsqueda fresca
 * Útil cuando el usuario quiere resultados actualizados
 *
 * @param keyword - Palabra clave de la búsqueda
 * @param ubicacion - Ubicación de la búsqueda
 */
export async function invalidarCacheOfertas(
  keyword: string,
  ubicacion: string
): Promise<boolean> {
  const keyNormalizada = keyword.toLowerCase().trim();
  const ubicNormalizada = ubicacion.toLowerCase().trim();
  const clave = `jobs:${keyNormalizada}:${ubicNormalizada}`;

  const eliminado = await del(clave);

  if (eliminado) {
    console.log(`🗑️  Caché de ofertas eliminado: ${keyNormalizada} en ${ubicNormalizada}`);
  }

  return eliminado;
}

/**
 * Invalida el caché de información de una empresa específica
 *
 * @param url - URL de la empresa cuyo caché queremos eliminar
 */
export async function invalidarCacheEmpresa(url: string): Promise<boolean> {
  const urlHash = crypto.createHash("md5").update(url).digest("hex");
  const clave = `company:${urlHash}`;

  const eliminado = await del(clave);

  if (eliminado) {
    console.log(`🗑️  Caché de empresa eliminado: ${url.substring(0, 50)}...`);
  }

  return eliminado;
}
