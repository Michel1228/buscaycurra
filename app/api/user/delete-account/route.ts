import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Cliente con service role para borrar el auth user al final
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verificar token y obtener user
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const userId = user.id;

  try {
    // 1. Obtener stripe_customer_id antes de borrar el perfil
    const { data: perfil } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    const stripeCustomerId = perfil?.stripe_customer_id as string | null;

    // 2. Cancelar suscripción de Stripe si existe
    if (stripeCustomerId) {
      try {
        const stripe = getStripe();
        const suscripciones = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: "active",
          limit: 10,
        });
        for (const sub of suscripciones.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
        // También cancelar suscripciones en trial
        const trialing = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: "trialing",
          limit: 10,
        });
        for (const sub of trialing.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
      } catch (stripeErr) {
        // No bloqueamos el borrado si Stripe falla
        console.error("[delete-account] Error cancelando Stripe:", stripeErr);
      }
    }

    // 3. Borrar de tablas PostgreSQL (pool)
    const pool = getPool();
    await pool.query("DELETE FROM cv_sends WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM saved_jobs WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM job_alerts WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM gusi_conversations WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM user_cvs WHERE user_id = $1", [userId]);

    // 4. Borrar de tablas Supabase (orden: hijos antes que padre)
    await supabaseAdmin.from("cv_sends").delete().eq("user_id", userId);
    await supabaseAdmin.from("company_reviews").delete().eq("user_id", userId);
    await supabaseAdmin.from("notificaciones").delete().eq("user_id", userId);
    await supabaseAdmin.from("cvs").delete().eq("user_id", userId);
    await supabaseAdmin.from("referrals").delete().or(`referrer_id.eq.${userId},referred_id.eq.${userId}`);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // 5. Borrar archivos de storage (foto de perfil, CV subido)
    try {
      await supabaseAdmin.storage.from("avatars").remove([`${userId}/avatar`]);
      await supabaseAdmin.storage.from("cvs").remove([`${userId}/cv.pdf`]);
    } catch {
      // Storage es opcional, no bloqueamos
    }

    // 6. Borrar el usuario de Supabase Auth (operación final e irreversible)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("[delete-account] Error borrando auth user:", deleteAuthError);
      return NextResponse.json({ error: "Error al eliminar la cuenta de autenticación." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[delete-account] Error inesperado:", err);
    return NextResponse.json({ error: "Error interno al eliminar la cuenta." }, { status: 500 });
  }
}
