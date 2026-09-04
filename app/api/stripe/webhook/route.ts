/**
 * app/api/stripe/webhook/route.ts — API POST para webhooks de Stripe
 *
 * Recibe y procesa eventos de Stripe:
 *   - checkout.session.completed → activa el plan pro o empresa en el perfil
 *   - customer.subscription.deleted → resetea el plan a 'free'
 *
 * IMPORTANTE: usa el body raw (sin parsear) para verificar la firma del webhook.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe, getPlanFromPriceId } from "@/lib/stripe";
import Stripe from "stripe";

// ─── Necesario: deshabilitar el body parser de Next.js para webhooks ──────────
// Stripe necesita el body en bruto para verificar la firma
export const runtime = "nodejs";

// ─── POST /api/stripe/webhook ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ─── Cliente Supabase con service role (para actualizar perfiles) ─────────
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // ── Obtener el body raw para verificar la firma de Stripe ────────────────
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Falta la firma del webhook." },
        { status: 400 }
      );
    }

    // ── Verificar la firma del webhook con el secreto configurado ────────────
    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("[stripe/webhook] Firma no válida:", (err as Error).message);
      return NextResponse.json(
        { error: "Firma del webhook no válida." },
        { status: 400 }
      );
    }

    // ── Idempotencia: evitar procesar el mismo evento dos veces ─────────────
    // El upsert con ignoreDuplicates nunca decia si el evento YA existia: se
    // procesaba siempre, tabla o no. Con .select() sabemos si de verdad se
    // inserto una fila nueva; si no hay fila (conflicto = evento repetido),
    // se corta aqui y no se reprocesa.
    try {
      const { data: eventoInsertado, error: insertError } = await supabaseAdmin
        .from("stripe_events")
        .upsert({ id: event.id }, { onConflict: "id", ignoreDuplicates: true })
        .select("id");
      if (insertError) {
        console.error("[stripe/webhook] Error en idempotencia:", insertError.message);
      } else if (!eventoInsertado || eventoInsertado.length === 0) {
        console.log(`[stripe/webhook] Evento ${event.id} ya procesado, se ignora`);
        return NextResponse.json({ recibido: true, duplicado: true });
      }
    } catch {
      // La tabla puede no existir — continuar de todas formas
    }

    // ── Procesar eventos de Stripe ───────────────────────────────────────────

    switch (event.type) {
      // ── Pago completado: activar el plan del usuario ──────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (!userId) {
          console.error("[stripe/webhook] checkout.session.completed sin userId en metadata");
          break;
        }

        if (!plan || !["basico", "esencial", "pro", "empresa"].includes(plan)) {
          console.error("[stripe/webhook] checkout.session.completed con plan inválido en metadata:", plan);
          break;
        }

        let planFinal = plan as "basico" | "esencial" | "pro" | "empresa";

        // Si hay suscripción, obtener el price ID para determinar el plan exacto
        if (session.subscription) {
          try {
            const suscripcion = await getStripe().subscriptions.retrieve(
              session.subscription as string
            );
            const priceId = suscripcion.items.data[0]?.price.id;
            if (priceId) {
              const planDesdePrice = getPlanFromPriceId(priceId);
              if (planDesdePrice !== "free") {
                planFinal = planDesdePrice as "basico" | "esencial" | "pro" | "empresa";
              }
            }
          } catch {
            // Si no podemos obtener el price, usamos el plan de metadata
          }
        }

        // Actualizar el plan en el perfil del usuario (update, no upsert)
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            plan: planFinal,
            plan_source: "stripe",
            subscription_status: "active",
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

       if (error) {
         console.error("[stripe/webhook] Error al actualizar plan:", error.message);
          return NextResponse.json(
            { error: "Error al actualizar el plan del usuario." },
            { status: 500 }
          );
       } else {
          console.log(`[stripe/webhook] Plan '${planFinal}' activado para usuario ${userId}`);
        }
        break;
      }

      // ── Suscripción cancelada: resetear el plan a 'free' ─────────────────
      case "customer.subscription.deleted": {
        const suscripcion = event.data.object as Stripe.Subscription;
        const customerId = suscripcion.customer as string;

        // Buscar el usuario por su stripe_customer_id
        const { data: perfiles, error: errorBusqueda } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (errorBusqueda || !perfiles?.length) {
          console.error("[stripe/webhook] No se encontró usuario con customer_id:", customerId);
          break;
        }

        // Resetear el plan a 'free' — SOLO si el plan vigente es de Stripe (o
        // heredado sin origen). Si el usuario migró a Apple IAP (plan_source
        // 'revenuecat'), un evento residual de Stripe no debe quitarle el acceso.
        const { error: errorUpdate } = await supabaseAdmin
          .from("profiles")
          .update({
            plan: "free",
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId)
          .or("plan_source.is.null,plan_source.eq.stripe");

        if (errorUpdate) {
          console.error("[stripe/webhook] Error al resetear plan:", errorUpdate.message);
        } else {
          console.log(`[stripe/webhook] Plan reseteado a 'free' para customer ${customerId}`);
        }
        break;
      }

      // ── Pago recurrente fallido: marcar subscription_status, NO cambiar plan ──
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as { id: string })?.id;
        if (customerId) {
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_customer_id", customerId);
          console.log(`[stripe/webhook] Pago fallido — subscription_status marcado como past_due para customer ${customerId}`);
        }
        break;
      }

      // ── Pago recuperado tras un fallo: volver a 'active' ──────────────────
      // Sin esto, un cliente marcado past_due se quedaba asi para siempre
      // aunque pagara despues, y perdia el acceso a Guzzi de por vida.
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as { id: string })?.id;
        if (customerId) {
          const { error: errorRecuperar } = await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: "active", updated_at: new Date().toISOString() })
            .eq("stripe_customer_id", customerId)
            .eq("subscription_status", "past_due");
          if (errorRecuperar) {
            console.error("[stripe/webhook] Error al recuperar de past_due:", errorRecuperar.message);
          } else {
            console.log(`[stripe/webhook] Pago recuperado — subscription_status vuelve a 'active' para customer ${customerId}`);
          }
        }
        break;
      }

      // ── CAMBIO DE PLAN. Este evento hacía media cosa y la otra media era la
      // importante.
      //
      // Solo escribía `subscription_status`, y encima solo cuando el estado
      // anterior era 'past_due'. NUNCA tocaba la columna `plan`. Y como el
      // checkout rechaza con 409 a quien ya tiene un plan activo
      // (checkout/route.ts), el portal de Stripe es la ÚNICA vía para cambiar
      // de plan — y es la que le ofrecemos nosotros desde el perfil.
      //
      // Resultado: quien bajaba de Pro a Esencial pagaba 2,99 € y conservaba
      // los límites de 9,99 €. Quien subía de Esencial a Pro pagaba 9,99 € y
      // se quedaba con 30 consultas al día en vez de 100 — pagando más por lo
      // mismo, que es como se pierde un cliente y se devuelve el dinero.
      //
      // Lo que lo remata: el webhook de RevenueCat SÍ lo hace bien, actualiza
      // el plan en PRODUCT_CHANGE. La misma función, resuelta en Apple y
      // olvidada en Stripe.
      case "customer.subscription.updated": {
        const suscripcion = event.data.object as Stripe.Subscription;
        const customerId = suscripcion.customer as string;
        const activa = suscripcion.status === "active" || suscripcion.status === "trialing";

        // El plan que dice la suscripción AHORA, que es el que manda.
        const priceId = suscripcion.items.data[0]?.price.id;
        const planActual = priceId ? getPlanFromPriceId(priceId) : null;

        const cambios: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (activa) cambios.subscription_status = "active";
        // Solo se escribe el plan si se ha podido resolver de verdad y la
        // suscripción está viva. Si Stripe manda un precio que no conocemos, es
        // mejor dejar el plan como está que degradar a alguien que paga.
        if (activa && planActual && planActual !== "free") {
          cambios.plan = planActual;
          cambios.plan_source = "stripe";
        }

        const { error: errorActualizar } = await supabaseAdmin
          .from("profiles")
          .update(cambios)
          .eq("stripe_customer_id", customerId);

        if (errorActualizar) {
          console.error("[stripe/webhook] Error al sincronizar la suscripción:", errorActualizar.message);
        } else if (cambios.plan) {
          console.log(`[stripe/webhook] Plan actualizado a "${cambios.plan}" para el cliente ${customerId}`);
        } else if (activa && priceId && planActual === "free") {
          // OJO: getPlanFromPriceId devuelve "free" cuando NO conoce el precio,
          // no null. Esta rama tiene que comprobar eso, no una ausencia de
          // valor; escrita de la otra forma no se alcanzaría nunca, que es
          // justo la clase de fallo mudo que este commit arregla.
          //
          // Si salta: alguien ha creado un producto nuevo en Stripe y no está
          // en el mapa, así que quien lo contrate se quedará sin plan.
          console.error(`[stripe/webhook] Precio desconocido ${priceId}: el plan NO se ha actualizado. Añádelo a PLANES en lib/stripe.ts.`);
        }
        break;
      }

      // ── Otros eventos: los ignoramos ──────────────────────────────────────
      default:
        console.log(`[stripe/webhook] Evento ignorado: ${event.type}`);
    }

    // ── Respuesta de confirmación a Stripe ───────────────────────────────────
    return NextResponse.json({ recibido: true });
  } catch (error) {
    console.error("[stripe/webhook] Error inesperado:", (error as Error).message);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
