/**
 * Cliente Redis centralizado para BuscayCurra
 * Gestiona la conexión y operaciones básicas de caché
 */

import { createClient, RedisClientType } from "redis";

// Variable global para reutilizar la conexión (patrón singleton)
let cliente: RedisClientType | null = null;

/**
 * Obtiene o crea la conexión al servidor Redis
 * Si Redis no está disponible, continúa sin caché (modo degradado)
 */
async function obtenerCliente(): Promise<RedisClientType | null> {
  // Si ya existe una conexión activa, la reutilizamos
  if (cliente && cliente.isOpen) {
    return cliente;
  }

  // URL de Redis desde las variables de entorno
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    // Crear nuevo cliente Redis
    cliente = createClient({
      url: redisUrl,
      socket: {
        // Intentar reconectar automáticamente si se pierde la conexión
        reconnectStrategy: (intentos: number) => {
          if (intentos > 10) {
            console.error("❌ Redis: demasiados intentos de reconexión, abandonando");
            return false;
          }
          // Esperar progresivamente más tiempo entre intentos (máximo 3 segundos)
          const espera = Math.min(intentos * 300, 3000);
          console.log(`🔄 Redis: reconectando en ${espera}ms (intento ${intentos})...`);
          return espera;
        },
      },
    }) as RedisClientType;

    // Manejar errores de conexión sin romper la app
    cliente.on("error", (err: Error) => {
      console.error("❌ Redis error de conexión:", err.message);
    });

    cliente.on("connect", () => {
      console.log("✅ Redis conectado correctamente");
    });

    cliente.on("reconnecting", () => {
      console.log("🔄 Redis reconectando...");
    });

    // Conectar al servidor Redis
    await cliente.connect();

    return cliente;
  } catch (error) {
    console.error("❌ Redis: no se pudo conectar:", (error as Error).message);
    console.warn("⚠️  La app continuará sin caché (modo degradado)");
    return null;
  }
}

/**
 * Obtiene un valor del caché
 * @param clave - La clave única del valor a obtener
 * @returns El valor guardado o null si no existe o hay error
 */
export async function get(clave: string): Promise<string | null> {
  try {
    const redis = await obtenerCliente();
    if (!redis) return null;

    return await redis.get(clave);
  } catch (error) {
    console.error(`❌ Redis get error para clave "${clave}":`, (error as Error).message);
    return null;
  }
}

/**
 * Guarda un valor en el caché con tiempo de expiración
 * @param clave - La clave única para identificar el valor
 * @param valor - El valor a guardar (se convierte a string si es objeto)
 * @param ttlSegundos - Tiempo de vida en segundos (default: 3600 = 1 hora)
 */
export async function set(
  clave: string,
  valor: string | object,
  ttlSegundos: number = parseInt(process.env.CACHE_TTL_DEFAULT || "3600")
): Promise<boolean> {
  try {
    const redis = await obtenerCliente();
    if (!redis) return false;

    // Convertir objetos a JSON string para guardarlos
    const valorString = typeof valor === "object" ? JSON.stringify(valor) : valor;

    await redis.setEx(clave, ttlSegundos, valorString);
    return true;
  } catch (error) {
    console.error(`❌ Redis set error para clave "${clave}":`, (error as Error).message);
    return false;
  }
}

/**
 * Elimina una clave del caché
 * @param clave - La clave a eliminar
 */
export async function del(clave: string): Promise<boolean> {
  try {
    const redis = await obtenerCliente();
    if (!redis) return false;

    await redis.del(clave);
    return true;
  } catch (error) {
    console.error(`❌ Redis del error para clave "${clave}":`, (error as Error).message);
    return false;
  }
}

/**
 * Comprueba si una clave existe en el caché
 * @param clave - La clave a comprobar
 */
export async function exists(clave: string): Promise<boolean> {
  try {
    const redis = await obtenerCliente();
    if (!redis) return false;

    const resultado = await redis.exists(clave);
    return resultado === 1;
  } catch (error) {
    console.error(`❌ Redis exists error para clave "${clave}":`, (error as Error).message);
    return false;
  }
}

/**
 * Limpia TODO el caché de Redis
 * ¡Usar con cuidado! Borra todos los datos
 */
export async function flush(): Promise<boolean> {
  try {
    const redis = await obtenerCliente();
    if (!redis) return false;

    await redis.flushAll();
    console.log("🗑️  Redis: caché limpiado completamente");
    return true;
  } catch (error) {
    console.error("❌ Redis flush error:", (error as Error).message);
    return false;
  }
}

/**
 * Incrementa un contador en Redis (útil para estadísticas)
 * @param clave - La clave del contador
 * @param ttlSegundos - Tiempo de vida del contador
 */
export async function incrementar(clave: string, ttlSegundos?: number): Promise<number> {
  try {
    const redis = await obtenerCliente();
    if (!redis) return 0;

    const nuevoValor = await redis.incr(clave);

    // Si se especifica TTL y el contador es nuevo (valor 1), establecer expiración
    if (ttlSegundos && nuevoValor === 1) {
      await redis.expire(clave, ttlSegundos);
    }

    return nuevoValor;
  } catch (error) {
    console.error(`❌ Redis incr error para clave "${clave}":`, (error as Error).message);
    return 0;
  }
}

/**
 * Obtiene múltiples claves de una vez (más eficiente que llamadas individuales)
 * @param claves - Array de claves a obtener
 */
export async function mget(claves: string[]): Promise<(string | null)[]> {
  try {
    const redis = await obtenerCliente();
    if (!redis) return claves.map(() => null);

    return await redis.mGet(claves);
  } catch (error) {
    console.error("❌ Redis mget error:", (error as Error).message);
    return claves.map(() => null);
  }
}

/**
 * Cierra la conexión a Redis de forma limpia
 * Útil para tests y apagado de la app
 */
export async function cerrarConexion(): Promise<void> {
  if (cliente && cliente.isOpen) {
    await cliente.quit();
    cliente = null;
    console.log("👋 Redis: conexión cerrada");
  }
}

// Exportar también el cliente para uso avanzado si es necesario
export { obtenerCliente };
