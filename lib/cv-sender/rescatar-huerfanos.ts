/**
 * lib/cv-sender/rescatar-huerfanos.ts — Envíos que se quedaron colgados.
 *
 * EL PROBLEMA. Un envío que revienta con una excepción deja su fila en
 * "pendiente". El manejador `failed` del worker ya lo arregla cuando salta,
 * pero hay un caso en el que no llega a saltar: si el contenedor se reinicia
 * —un despliegue, sin ir más lejos— mientras un envío se está procesando, el
 * proceso muere sin avisar a nadie y la fila se queda en "pendiente" para
 * siempre.
 *
 * Y eso duele por partida doble:
 *
 *   · La persona ve su envío como en curso y espera una respuesta de una
 *     empresa que nunca recibió nada.
 *   · "pendiente" GASTA CUOTA (ver rate-limiter.ts), así que cada huérfano le
 *     come un hueco de su plan de forma permanente, por un CV que no salió.
 *
 * Medido al encontrarlo: 3 de 119 envíos llevaban más de 24 horas atascados.
 *
 * Esto se ejecuta al arrancar el worker, que es justo después de cada
 * despliegue: el momento en que se crean los huérfanos. Solo toca lo que lleva
 * parado más de SEIS HORAS, muy por encima de lo que tarda un envío normal, así
 * que no puede pillar a ninguno en curso.
 */

import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sb: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): any {
  if (!_sb) {
    _sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _sb;
}

/** Un envío normal tarda segundos. Seis horas es margen de sobra. */
const HORAS_PARA_DARLO_POR_PERDIDO = 6;

export async function rescatarEnviosHuerfanos(): Promise<number> {
  const limite = new Date(Date.now() - HORAS_PARA_DARLO_POR_PERDIDO * 3600_000).toISOString();

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("cv_sends")
      .update({
        status: "fallido",
        error_message:
          "El envío se quedó a medias (probablemente por un reinicio del servidor). No ha gastado cuota: puedes volver a intentarlo.",
      })
      .eq("status", "pendiente")
      .lt("created_at", limite)
      .select("id, user_id, company_name");

    if (error) {
      console.error("[huérfanos] No se pudieron rescatar:", error.message);
      return 0;
    }

    const n = data?.length || 0;
    if (n === 0) return 0;

    console.log(`[huérfanos] ${n} envío(s) colgado(s) marcados como fallidos; su cuota se devuelve.`);

    // Avisar a cada uno. Enterarse de que falló es lo que permite reintentarlo;
    // creer que salió cuando no salió es lo que hace perder una oportunidad.
    for (const fila of data) {
      try {
        await sb.from("notificaciones").insert({
          user_id: fila.user_id,
          tipo: "cv_fallido",
          titulo: `No se pudo enviar tu CV${fila.company_name ? ` a ${fila.company_name}` : ""}`,
          mensaje:
            "El envío se quedó a medias y no llegó a salir. No te ha gastado cuota: puedes volver a intentarlo cuando quieras.",
          datos: { companyName: fila.company_name, motivo: "envio_huerfano" },
          leida: false,
        });
      } catch (e) {
        console.warn("[huérfanos] No se pudo avisar a un usuario:", (e as Error).message);
      }
    }

    return n;
  } catch (e) {
    // Que esto falle NO puede impedir que el worker arranque: es una limpieza,
    // no un requisito para funcionar.
    console.error("[huérfanos] Error al rescatar:", (e as Error).message);
    return 0;
  }
}
