/**
 * /api/gusi/analyze-image — La cámara: de una foto a la empresa y cómo trabajar allí.
 *
 * Flujo:
 * 1. Recibe la imagen (la app ya la reduce a 1280 px) + GPS opcional
 * 2. GPT-4o Vision dice qué hay: fachada de un negocio, cartel de "se busca" o
 *    un producto, y de qué marca SOLO si se ve (antes se le obligaba a adivinar)
 * 3. Se sitúa a quien hace la foto: GPS, o la ciudad de su perfil
 * 4. Fachada → el local en el mapa, con su correo si lo tiene en la web
 *    Producto de marca → lib/camara/ficha-marca.ts: la empresa de verdad (Nike,
 *    Inc.; Aguas Danone para Font Vella), su web y portal de empleo COMPROBADOS,
 *    sus tiendas propias cerca, sus ofertas reales en el país, y queda guardada
 * 5. Si hay a quién mandar el CV, sale la tarjeta con el botón de enviarlo
 *
 * Aquí solo se comprueba la sesión, el tamaño y el límite de fotos, y se sitúa a
 * la persona; lo que se hace con la foto (también tarjetas, papeles escritos a
 * mano, dibujos y el sector de más cerca a más lejos) está en
 * lib/camara/analizar-foto.ts.
 *
 * Probado el 29 sep 2026 con fotos reales: el reconocimiento acertaba siempre,
 * pero Nike devolvía una tienda de deportes, Font Vella una fuente de Girona y
 * las "ofertas cerca de Tudela" eran de Berlín y Plymouth.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { planEfectivoDeUsuario } from "@/lib/plan-limits";
import { leerFoto, responderFoto } from "@/lib/camara/analizar-foto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 🔒 Verificar autenticación (NO confiar en userId del body)
  const { getUserId } = await import("@/lib/auth-server");
  const authUserId = await getUserId(req);
  if (!authUserId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { imageBase64, userId: bodyUserId, lat, lng } = body as {
      imageBase64: string;
      userId?: string;
      lat?: number;
      lng?: number;
    };

    // ⚠️ Usar userId autenticado, ignorar el del body
    const userId = authUserId;
    if (bodyUserId && bodyUserId !== authUserId) {
      console.warn(`[Guzzi OCR] ⚠️ userId del body (${bodyUserId}) no coincide con token (${authUserId})`);
    }

    if (!imageBase64) {
      return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });
    }

    // Límite de tamaño: evita que una imagen enorme dispare el coste de GPT-4o
    // Vision o agote memoria. ~8 MB de base64 ≈ 6 MB de imagen, de sobra para una
    // foto de móvil comprimida.
    if (imageBase64.length > 8_000_000) {
      return NextResponse.json(
        { error: "La imagen es demasiado grande. Prueba con una foto de menor resolución." },
        { status: 413 }
      );
    }

    // ─── Verificar límite de cámara según plan ────────────────────────
    if (userId) {
      try {
        const { getPlanLimits } = await import("@/lib/plan-limits");
        const { createClient: createSbClient } = await import("@supabase/supabase-js");
        const sbAdmin = createSbClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        // La suscripcion manda sobre el plan guardado. Esta es la funcion mas
        // cara de la aplicacion —vision de GPT-4o, se paga por cada foto— asi
        // que no puede quedar abierta a quien ha dejado de pagar.
        const plan = await planEfectivoDeUsuario(sbAdmin, userId);
        const limits = getPlanLimits(plan);

        if (limits.camaraMaxUsos >= 999999) {
          // Ilimitado — no hacer nada
        } else {
          // Cuota MENSUAL (17 oct 2026): se recarga el día 1. La clave lleva
          // "camara-" delante para no mezclarse con las filas de cada día, donde
          // se cuentan las consultas a Guzzi.
          const dateKey = `camara-${new Date().toISOString().slice(0, 7)}`;
          const { LIMITS } = await import("@/lib/plan-limits");
          const siguiente = plan === "free" ? LIMITS.esencial : plan === "esencial" || plan === "basico" ? LIMITS.pro : null;
          const mejora = !siguiente ? ""
            : plan === "free" ? ` Con Esencial (2,99€/mes) tienes ${siguiente.camaraMaxUsos} al mes.`
            : ` Con ${siguiente.name} tienes ${siguiente.camaraMaxUsos} al mes.`;
          // Lo mismo se consigue gratis escribiendo el nombre: se le dice.
          const sinCuota = `📸 Has usado tus ${limits.camaraMaxUsos} fotos de este mes; se recargan el día 1. Mientras, escríbeme el nombre del negocio (por ejemplo "búscame la peluquería Lola en Tudela") y te lo busco igual. Y por cada amigo que invites te damos una foto más.${mejora}`;
          // Sin fotos del plan: las que ha ganado invitando amigos (lib/referidos/premios.ts).
          const { gastarFotoExtra } = await import("@/lib/referidos/premios");

          // SUMAR Y COMPROBAR EN LA MISMA OPERACION.
          //
          // Antes se leia el contador, se comparaba y luego se escribia. Entre
          // la lectura y la escritura cabe otra peticion: diez a la vez leen el
          // mismo valor, las diez pasan la comprobacion y las diez gastan una
          // foto. Para alguien del plan gratuito —2 al dia— son diez llamadas a
          // la vision de GPT-4o, que es la mas cara que tenemos y se paga por
          // foto.
          //
          // La funcion de base de datos (migracion 005) suma con un WHERE dentro
          // del ON CONFLICT: si ya no queda cuota no actualiza, no devuelve fila
          // y aqui llega null. No queda hueco entre comprobar y escribir.
          const { data: nuevoUso, error: errRpc } = await sbAdmin.rpc("consumir_uso_camara", {
            p_user_id: userId,
            p_date_key: dateKey,
            p_limite: limits.camaraMaxUsos,
          });

          if (errRpc) {
            // La funcion aun no existe en la base (migracion sin aplicar). Se
            // usa el metodo de antes para no dejar la camara inservible, pero se
            // dice en el log: por esta rama la carrera sigue abierta.
            console.warn("[analyze-image] consumir_uso_camara no disponible, metodo antiguo:", errRpc.message);
            const { data: usage } = await sbAdmin.from("usage_tracking")
              .select("camara_usos").eq("user_id", userId).eq("date_key", dateKey).single();
            const usos = usage?.camara_usos ?? 0;
            if (usos >= limits.camaraMaxUsos) {
              if (!(await gastarFotoExtra(userId))) return NextResponse.json({ error: sinCuota }, { status: 429 });
            } else {
              await sbAdmin.from("usage_tracking").upsert(
                { user_id: userId, date_key: dateKey, week_key: "", camara_usos: usos + 1 },
                { onConflict: "user_id,date_key" }
              );
            }
          } else if (nuevoUso === null && !(await gastarFotoExtra(userId))) {
            return NextResponse.json({ error: sinCuota }, { status: 429 });
          }
        }
      } catch (errLimite) {
        // FALLA CERRADO a proposito. Antes se permitia igual "por si acaso",
        // pero esto abre GPT-4o Vision (la llamada mas cara de la app, ~1
        // centimo por foto) a barra libre en cuanto Supabase tenga un mal rato.
        // Es preferible pedir al usuario que reintente que regalar la factura.
        console.error("[analyze-image] no se pudo comprobar el limite:", (errLimite as Error).message);
        return NextResponse.json(
          { error: "No he podido comprobar tu límite de fotos ahora mismo. Inténtalo de nuevo en un momento." },
          { status: 503 }
        );
      }
    }

    // Limpiar el prefijo data:image si viene
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 });
    }

    // Dónde vive, para buscar "cerca de ti" cuando el móvil no da el GPS: la
    // ciudad del perfil y, si no la tiene, la de su CV. Con la tarjeta del
    // Consorcio EDER hecha en Tudela, sin ciudad no había forma de saber dónde
    // buscar. Se busca mientras se lee la foto, no después (3 nov 2026).
    const ciudadEnCamino = (async (): Promise<string> => {
      if (!userId) return "";
      let ciudad = "";
      try {
        const sbCiudad = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: profileCiudad } = await sbCiudad.from("profiles").select("ciudad").eq("id", userId).single();
        ciudad = profileCiudad?.ciudad || "";
      } catch { /* sin perfil, sin problema */ }
      if (!ciudad) {
        try {
          const { rows } = await getPool().query<{ ciudad: string | null }>(
            "SELECT form_data->>'ciudad' AS ciudad FROM user_cvs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
            [userId]
          );
          ciudad = rows[0]?.ciudad?.trim() || "";
        } catch { /* sin CV, sin problema */ }
      }
      return ciudad;
    })();

    // ─── Qué hay en la foto (GPT-4o Vision) y qué hacer con ello ───────
    // Todo el camino está en lib/camara/analizar-foto.ts.
    const foto = await leerFoto(base64Data, openaiKey);
    if (!foto) {
      return NextResponse.json(
        { error: "No se pudo leer la imagen. Prueba con más luz o más cerca." },
        { status: 500 }
      );
    }
    const respuesta = await responderFoto(foto, { lat, lng, ciudadUsuario: await ciudadEnCamino });
    return NextResponse.json(respuesta);
  } catch (error) {
    console.error("analyze-image error:", error);
    return NextResponse.json(
      { error: "Error al procesar la imagen" },
      { status: 500 }
    );
  }
}
