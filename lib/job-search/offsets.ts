/**
 * lib/job-search/offsets.ts — Por dónde iba cada extractor.
 *
 * EL FALLO QUE ARREGLA ESTO, porque cuesta de ver y costó semanas de ofertas.
 *
 * Los extractores recorren combinaciones de palabra clave × ciudad. España, por
 * ejemplo, tiene 50 palabras × 40 ciudades = 2.000 combinaciones, y cada
 * ejecución procesa un puñado (12, 15, 20) y guarda por dónde se quedó para
 * seguir en la siguiente. La idea es buena.
 *
 * El problema es que ese "por dónde se quedó" vivía en una variable del proceso:
 *
 *     let countryOffsets: Record<string, number> = {};   // ← se pierde
 *
 * Cada despliegue reinicia el contenedor y con él la variable. Y desplegamos a
 * menudo. Resultado: el extractor volvía a la combinación 0 una y otra vez y
 * repetía eternamente las 15 primeras — camarero en Madrid, camarero en
 * Barcelona— sin llegar JAMÁS a las otras 1.985. Las ofertas ya estaban en la
 * base, así que el registro decía "0 nuevas" y parecía que la fuente se había
 * secado, cuando lo que pasaba es que preguntábamos siempre lo mismo.
 *
 * Se nota en los números: España, que es el mercado de la aplicación, tenía
 * 30.058 ofertas activas cuando Estados Unidos tenía 481.365.
 *
 * Ahora la posición vive en Redis, que sobrevive a los despliegues. Si Redis no
 * responde se cae a la memoria del proceso: se pierde el avance, como antes,
 * pero no se rompe la sincronización.
 */

import { get as redisGet, set as redisSet } from "@/lib/cache/redis-client";

/** Respaldo si Redis no está disponible. Mismo comportamiento que antes. */
const enMemoria: Record<string, number> = {};

/** 30 días: si una fuente se abandona, su posición acaba caducando sola. */
const TTL_SEGUNDOS = 60 * 60 * 24 * 30;

function clave(fuente: string, pais: string) {
  return `sync:offset:${fuente}:${pais}`;
}

export async function leerOffset(fuente: string, pais: string): Promise<number> {
  const k = clave(fuente, pais);
  try {
    const valor = await redisGet(k);
    if (valor !== null) {
      const n = parseInt(valor, 10);
      if (Number.isFinite(n) && n >= 0) return n;
    }
  } catch {
    // Redis caído: seguimos con lo que haya en memoria.
  }
  return enMemoria[k] ?? 0;
}

export async function guardarOffset(fuente: string, pais: string, valor: number): Promise<void> {
  const k = clave(fuente, pais);
  enMemoria[k] = valor;
  try {
    await redisSet(k, String(valor), TTL_SEGUNDOS);
  } catch {
    // Ya queda en memoria; no vale la pena tumbar la sincronización por esto.
  }
}

/** Para el GET de diagnóstico de cada extractor. */
export async function offsetsDe(fuente: string, paises: readonly string[]): Promise<Record<string, number>> {
  const salida: Record<string, number> = {};
  for (const p of paises) salida[p] = await leerOffset(fuente, p);
  return salida;
}
