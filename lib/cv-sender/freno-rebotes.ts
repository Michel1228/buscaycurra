/**
 * lib/cv-sender/freno-rebotes.ts
 * ¿Están los rebotes de la semana tan altos que hay que frenar lo deducido?
 *
 * POR QUÉ (1 nov 2026, decisión de Michel). Bloquear siempre las direcciones
 * deducidas deja a la gente sin enviar (esa semana, 19 de 37 CVs) y no hacer nada
 * arriesga que Resend pause todos los correos, también las confirmaciones. Así se
 * envían mientras hay margen y se paran solo cuando se acaba.
 *
 * Se mira a Resend, no a la tabla de envíos: cuentan todos los correos de la
 * cuenta, como en el centinela. La respuesta se guarda 10 minutos, porque leerla
 * son varias páginas. Si no se puede leer no se frena: un fallo nuestro no deja a
 * nadie sin enviar.
 */
import { get as cacheGet, set as cacheSet } from "@/lib/cache/redis-client";
import { correosUltimosDias, rebotesDeLaSemana } from "@/lib/centinela/limites-correo";
import { UMBRAL_FRENO_REBOTES } from "@/lib/cv-sender/direccion-generica";

const CLAVE = "freno-rebotes";

export async function frenoDeRebotesActivo(): Promise<boolean> {
  const guardado = await cacheGet(CLAVE);
  if (guardado !== null) return guardado === "1";

  let activo = false;
  try {
    const clave = process.env.RESEND_API_KEY_CV || process.env.RESEND_API_KEY || "";
    activo = rebotesDeLaSemana(await correosUltimosDias(7, clave)).pct >= UMBRAL_FRENO_REBOTES;
  } catch (e) {
    console.warn("[freno-rebotes] No se pudo leer Resend:", (e as Error).message);
  }
  await cacheSet(CLAVE, activo ? "1" : "0", 600);
  return activo;
}
