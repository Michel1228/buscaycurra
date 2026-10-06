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

export type ResultadoBienvenida = { ok: boolean; yaHecha?: boolean; antigua?: boolean; error?: string };

export async function darBienvenida(
  userId: string,
  cuerpo: { nombre?: string; ciudad?: string; ref?: string } = {}
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

  const meta = (cuenta.user_metadata || {}) as { full_name?: string; ciudad?: string; ref?: string };
  const email = cuenta.email;
  const nombre = (cuerpo.nombre || meta.full_name || "").trim() || email.split("@")[0];
  const ciudad = (cuerpo.ciudad || meta.ciudad || "").trim();
  const ref = cuerpo.ref || meta.ref || "";

  // Una cuenta de hace más de una semana que pasa por aquí no es un registro
  // nuevo (enlace mágico de alguien que ya usaba la aplicación): se le
  // completa la ficha en silencio, sin correo ni alerta que no ha pedido.
  const esNueva = Date.now() - new Date(cuenta.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;

  // 1. La ficha, siempre, haya ciudad o no.
  try {
    const { data: perfilActual } = await admin
      .from("profiles")
      .select("id, ciudad, full_name")
      .eq("id", userId)
      .maybeSingle();

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
  if (ciudad) {
    // LA CIUDAD TAMBIEN AL PERFIL: ya se guarda arriba, en el paso 1. Antes
    // solo iba a user_contacts y a la alerta, y a 23 sep 2026 de 50 personas
    // registradas en el ultimo mes, 49 figuraban "sin ciudad" aunque la
    // hubieran escrito.
    const pool = getPool();
    try {
      // Guardar datos de contacto para futuras notificaciones (email/WhatsApp)
      await pool.query(
        `INSERT INTO user_contacts (user_id, email, full_name, whatsapp_alertas)
         VALUES ($1, $2, $3, false)
         ON CONFLICT (user_id) DO UPDATE SET email = $2, full_name = $3, updated_at = NOW()`,
        [userId, email, nombre]
      );

      // Crear alerta automática para la ciudad
      await pool.query(
        `INSERT INTO job_alerts (user_id, keyword, location, frequency, active)
         VALUES ($1, '', $2, 'daily', true)`,
        [userId, ciudad.trim()]
      );
    } catch (dbErr) {
      console.error("[welcome] Error guardando contactos/alerta:", (dbErr as Error).message);
      // No bloqueamos — el email ya se envió
    }
  }

  // 4. Canjear código de referido si viene en la URL de registro
  if (ref) {
    try {
      const codigo = ref.trim().toUpperCase();
      if (codigo) {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verificar que no sea su propio código
        const { data: miPerfil } = await supabaseAdmin
          .from("profiles")
          .select("referral_code")
          .eq("id", userId)
          .single();

        if (miPerfil?.referral_code !== codigo) {
          // Buscar al referente
          const { data: referente } = await supabaseAdmin
            .from("profiles")
            .select("id, referral_count, referral_credits")
            .eq("referral_code", codigo)
            .single();

          if (referente) {
            // Verificar que no haya sido referido antes
            const { data: yaReferido } = await supabaseAdmin
              .from("referrals")
              .select("id")
              .eq("referred_id", userId)
              .maybeSingle();

            if (!yaReferido) {
              // Registrar la referencia
              await supabaseAdmin.from("referrals").insert({
                referrer_id: referente.id,
                referred_id: userId,
                code_used: codigo,
                created_at: new Date().toISOString(),
              });

              // Actualizar contador del referente (+10 créditos)
              const nuevoCount = Math.max(0, referente.referral_count || 0) + 1;
              const nuevoCreditos = Math.max(0, referente.referral_credits || 0) + 10;
              await supabaseAdmin.from("profiles").update({
                referral_count: nuevoCount,
                referral_credits: nuevoCreditos,
              }).eq("id", referente.id);

              // Vincular al nuevo usuario con el referente
              await supabaseAdmin.from("profiles").update({
                referred_by: referente.id,
              }).eq("id", userId);

              console.log(`[welcome] Referido canjeado: ${userId} usó código ${codigo} de ${referente.id}`);
            } else {
              console.log(`[welcome] Usuario ${userId} ya había sido referido antes — ignorando código ${codigo}`);
            }
          } else {
            console.log(`[welcome] Código de referido no válido: ${codigo}`);
          }
        }
      }
    } catch (refErr) {
      console.error("[welcome] Error canjeando referido:", (refErr as Error).message);
      // No bloqueamos el registro por un fallo en referidos
    }
  }


  return { ok: true };
}
