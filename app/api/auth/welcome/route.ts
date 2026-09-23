import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/email/smtp-sender";
import { getPool } from "@/lib/db";
import { getUserId } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Autenticación obligatoria: extraer userId del token, no del body
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { email, nombre, ciudad, ref } = await req.json() as {
      email?: string; nombre?: string; ciudad?: string; ref?: string;
    };
    if (!email || !nombre) {
      return NextResponse.json({ error: "email y nombre requeridos" }, { status: 400 });
    }

    // 1. Enviar email de bienvenida
    await sendWelcomeEmail(email, nombre);

    // 2. Si hay ciudad, guardar en user_contacts + crear alerta
    if (ciudad) {
      // LA CIUDAD TAMBIEN AL PERFIL. El formulario de registro la pide, se
      // guardaba en user_contacts y en la alerta, pero NUNCA en profiles.ciudad,
      // que es de donde la leen el perfil, las recomendaciones y los tres pasos
      // del principio. Resultado a 23 sep 2026: de 50 personas registradas en el
      // ultimo mes, 49 figuraban "sin ciudad" aunque la hubieran escrito. El
      // dato se pedia, se perdia, y luego se le volvia a pedir.
      try {
        const supabasePerfil = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        // Solo si esta vacia: nunca se pisa lo que la persona haya puesto ya.
        const { data: perfilActual } = await supabasePerfil
          .from("profiles")
          .select("id, ciudad")
          .eq("id", userId)
          .maybeSingle();

        if (!perfilActual) {
          // NI SIQUIERA HABIA FICHA. A 23 sep 2026 habia 122 cuentas y 54
          // perfiles: a 68 personas no se les habia creado nunca, asi que su
          // ciudad no tenia ni donde guardarse y la aplicacion las trataba como
          // desconocidas. Se crea aqui, que es el unico sitio por el que pasan
          // todos los registros.
          await supabasePerfil.from("profiles").insert({
            id: userId,
            email,
            full_name: nombre,
            ciudad: ciudad.trim(),
          });
        } else if (!perfilActual.ciudad?.trim()) {
          await supabasePerfil
            .from("profiles")
            .update({ ciudad: ciudad.trim() })
            .eq("id", userId);
        }
      } catch (perfilErr) {
        console.error("[welcome] Error guardando la ciudad en el perfil:", (perfilErr as Error).message);
      }

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

    // 3. Canjear código de referido si viene en la URL de registro
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

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
