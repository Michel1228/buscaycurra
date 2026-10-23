/**
 * lib/onboarding/dar-bienvenida.ts (servidor)
 * La bienvenida de una cuenta nueva: ficha, ciudad, alerta, correo y referido.
 *
 * La usan /api/auth/welcome (la pide el navegador al confirmar o al entrar) y
 * /api/auth/bienvenidas-pendientes (red de seguridad cada 10 minutos). Se hace
 * una sola vez por cuenta: app_metadata.bienvenida_en.
 */
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/email/smtp-sender";
import { getPool } from "@/lib/db";
import { asegurarColumnaOficio, limpiarOficio } from "@/lib/onboarding/oficio";
import { aplicarReferido } from "@/lib/referidos/premios";

export type ResultadoBienvenida = { ok: boolean; yaHecha?: boolean; antigua?: boolean; error?: string };

export async function darBienvenida(
  userId: string,
  cuerpo: { nombre?: string; ciudad?: string; ref?: string; oficio?: string } = {},
  // Bienvenidas atrasadas (/api/auth/bienvenidas-pendientes?antiguas=1): correo
  // y alerta aunque la cuenta tenga más de una semana.
  opciones: { aunqueSeaAntigua?: boolean } = {}
): Promise<ResultadoBienvenida> {
  // LOS DATOS SALEN DE LA CUENTA, NO SOLO DEL FORMULARIO.
  //
  // El formulario de registro llamaba aquí justo después de crear la cuenta,
  // pero con la confirmación por correo activada todavía no hay sesión: la
  // llamada se quedaba en el 401 de arriba y no se hacía NADA de lo de abajo.
  // Comprobado el 29 sep 2026: de 14 registros desde el 23 sep, 12 habían
  // escrito su ciudad, 2 la tenían guardada y ninguno tenía alerta ni correo
  // de bienvenida. Ahora la llama también la página de confirmación, ya con
  // sesión, y lo que el formulario guardó en la cuenta (nombre, ciudad y
  // código de referido) se lee de ahí.
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: { user: cuenta } } = await admin.auth.admin.getUserById(userId);
  if (!cuenta?.email) {
    return { ok: false, error: "Cuenta no encontrada" };
  }

  // Una sola vez por cuenta: la llaman el formulario y la confirmación, y la
  // confirmación también se abre al entrar con enlace mágico.
  if (cuenta.app_metadata?.bienvenida_en) {
    return { ok: true, yaHecha: true };
  }
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...cuenta.app_metadata, bienvenida_en: new Date().toISOString() },
  });

  const meta = (cuenta.user_metadata || {}) as { full_name?: string; ciudad?: string; ref?: string; oficio?: string };
  const email = cuenta.email;
  const nombre = (cuerpo.nombre || meta.full_name || "").trim() || email.split("@")[0];
  const ciudad = (cuerpo.ciudad || meta.ciudad || "").trim();
  const oficio = limpiarOficio(cuerpo.oficio || meta.oficio);
  const ref = cuerpo.ref || meta.ref || "";

  // Una cuenta de hace más de una semana que pasa por aquí no es un registro
  // nuevo (enlace mágico de alguien que ya usaba la aplicación): se le
  // completa la ficha en silencio, sin correo ni alerta que no ha pedido.
  const esNueva = opciones.aunqueSeaAntigua || Date.now() - new Date(cuenta.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;

  // 1. La ficha, siempre, haya ciudad o no.
  // Quien lleva tiempo puede tener la ciudad en la ficha y no en la cuenta: sirve
  // igual para su alerta.
  let ciudadDeLaFicha = "";
  try {
    const { data: perfilActual } = await admin
      .from("profiles")
      .select("id, ciudad, full_name")
      .eq("id", userId)
      .maybeSingle();
    ciudadDeLaFicha = perfilActual?.ciudad?.trim() || "";

    if (!perfilActual) {
      // NI SIQUIERA HABIA FICHA. A 23 sep 2026 habia 122 cuentas y 54
      // perfiles: a 68 personas no se les habia creado nunca, asi que su
      // ciudad no tenia ni donde guardarse y la aplicacion las trataba como
      // desconocidas.
      const { error: errFicha } = await admin.from("profiles").insert({
        id: userId,
        email,
        full_name: nombre,
        ...(ciudad ? { ciudad } : {}),
      });
      if (errFicha) console.error("[welcome] No se pudo crear la ficha:", errFicha.message);
    } else {
      // Solo lo que esté vacío: nunca se pisa lo que la persona haya puesto.
      const faltan: Record<string, string> = {};
      if (ciudad && !perfilActual.ciudad?.trim()) faltan.ciudad = ciudad;
      if (!perfilActual.full_name?.trim()) faltan.full_name = nombre;
      if (Object.keys(faltan).length) {
        const { error: errFicha } = await admin.from("profiles").update(faltan).eq("id", userId);
        if (errFicha) console.error("[welcome] No se pudo completar la ficha:", errFicha.message);
      }
    }
  } catch (perfilErr) {
    console.error("[welcome] Error guardando la ficha:", (perfilErr as Error).message);
  }

  if (!esNueva) return { ok: true, antigua: true };

  // 2. Enviar email de bienvenida
  await sendWelcomeEmail(email, nombre);

  // 3. Si hay ciudad, guardar en user_contacts + crear alerta
  const ciudadAlerta = ciudad || ciudadDeLaFicha;
  if (ciudadAlerta) {
    // LA CIUDAD TAMBIEN AL PERFIL: ya se guarda arriba, en el paso 1. Antes
    // solo iba a user_contacts y a la alerta, y a 23 sep 2026 de 50 personas
    // registradas en el ultimo mes, 49 figuraban "sin ciudad" aunque la
    // hubieran escrito.
    const pool = getPool();
    try {
      // Guardar datos de contacto para futuras notificaciones (email/WhatsApp),
      // y el oficio si lo dijo al registrarse (lib/onboarding/oficio.ts). Un
      // oficio vacío no borra el que ya hubiera.
      await asegurarColumnaOficio(pool);
      await pool.query(
        `INSERT INTO user_contacts (user_id, email, full_name, whatsapp_alertas, oficio)
         VALUES ($1, $2, $3, false, NULLIF($4, ''))
         ON CONFLICT (user_id) DO UPDATE SET email = $2, full_name = $3,
           oficio = COALESCE(NULLIF($4, ''), user_contacts.oficio), updated_at = NOW()`,
        [userId, email, nombre, oficio]
      );

      // Crear alerta automática para la ciudad, si no tiene ya una (una cuenta
      // antigua puede haberla creado ella misma).
      const { rowCount: yaTieneAlerta } = await pool.query(
        `SELECT 1 FROM job_alerts WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      if (!yaTieneAlerta) {
        await pool.query(
          `INSERT INTO job_alerts (user_id, keyword, location, frequency, active)
           VALUES ($1, '', $2, 'daily', true)`,
          [userId, ciudadAlerta]
        );
      }
    } catch (dbErr) {
      console.error("[welcome] Error guardando contactos/alerta:", (dbErr as Error).message);
      // No bloqueamos — el email ya se envió
    }
  }

  // 4. Canjear código de referido si viene en la URL de registro. Esto pasa al
  // confirmar el correo, que es cuando se reparten los premios (lib/referidos/premios.ts).
  if (ref) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const r = await aplicarReferido(supabaseAdmin, userId, ref);
      console.log(r.ok
        ? `[welcome] Referido: ${userId} llegó con el código de ${r.referenteId}${r.referentePremiado ? "" : " (ya tenía 10 este mes: sin premio)"}`
        : `[welcome] Código de referido no aplicado (${r.motivo})`);
    } catch (refErr) {
      console.error("[welcome] Error canjeando referido:", (refErr as Error).message);
      // No bloqueamos el registro por un fallo en referidos
    }
  }


  return { ok: true };
}
