/**
 * lib/email/presupuesto-diario.ts
 * Que los envíos masivos nunca se coman el tope diario de Resend.
 *
 * POR QUÉ (6 oct 2026, decisión de Michel: seguir en el plan gratuito y
 * repartir). El plan gratuito de Resend corta a 100 correos por día UTC, y el
 * 30 sep y el 3 oct se llegó a 100 y 101 con envíos de una vez (recordatorios,
 * bienvenidas atrasadas). Si eso pasa, el resto del día no sale NADA: ni la
 * confirmación de quien se registra ni su contraseña.
 *
 * Cómo: cada correo que sale por la cuenta principal se cuenta en Redis. Lo que
 * puede esperar (recordatorios, alertas, campañas) solo sale mientras queden
 * más de RESERVA correos para el día; si no, se deja para la siguiente pasada.
 * Lo urgente no mira el contador. Las confirmaciones que manda Supabase no
 * pasan por aquí: la reserva también les deja sitio.
 *
 * Desde el 23 oct 2026 la cuenta está en el plan Pro, sin tope diario:
 * LIMITE_RESEND_DIA es ahora nuestro reparto de los 50.000 del mes
 * (lib/centinela/limites-correo.ts).
 */
import { incrementar, get } from "@/lib/cache/redis-client";
import { LIMITE_RESEND_DIA } from "@/lib/centinela/limites-correo";

/** Correos que se guardan cada día para lo urgente. */
export const RESERVA = 30;

const claveDelDia = () => `correos-dia:${new Date().toISOString().slice(0, 10)}`; // día UTC, como Resend

export async function apuntarCorreo(): Promise<void> {
  await incrementar(claveDelDia(), 2 * 86400).catch(() => 0);
}

/** ¿Puede salir hoy un correo que podría esperar a mañana? */
export async function quedaSitioParaLoQuePuedeEsperar(): Promise<boolean> {
  const enviados = Number(await get(claveDelDia()).catch(() => null) || 0);
  return enviados < LIMITE_RESEND_DIA - RESERVA;
}
