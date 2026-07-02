/**
 * app/api/revenuecat/webhook/route.ts — Webhook de RevenueCat (Apple IAP en iOS)
 *
 * Equivalente al webhook de Stripe, adaptado al protocolo de RevenueCat:
 *   - RevenueCat NO firma HMAC: autentica con un bearer token fijo que se
 *     configura en su dashboard (Authorization header) y se compara aquí.
 *   - El body es JSON directo (no hace falta el raw body).
 *   - event.app_user_id es directamente profiles.id (lo configuramos como
 *     appUserID en el cliente), así que buscamos por .eq("id", ...) sin mapeo.
 *
 * Eventos: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";
import { getPlanFromProductId } from "@/lib/revenuecat";

export const runtime = "nodejs";

// Comparación en tiempo constante para evitar timing attacks al validar el token.
function tokenValido(recibido: string | null): boolean {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret || !recibido) return false;
  const esperado = `Bearer ${secret}`;
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

interface RevenueCatEvent {
  id?: string;
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  new_product_id?: string;
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // ── Autenticación por bearer token fijo ──────────────────────────────────
    if (!tokenValido(request.headers.get("Authorization"))) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const payload = (await request.json()) as { event?: RevenueCatEvent };
    const event = payload.event;
    if (!event?.type || !event.app_user_id) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }

    // ── Idempotencia: no procesar el mismo evento dos veces ──────────────────
    if (event.id) {
      try {
        await supabaseAdmin
          .from("revenuecat_events")
          .upsert(
            { id: event.id, event_type: event.type },
            { onConflict: "id", ignoreDuplicates: true }
          );
      } catch {
        // La tabla puede no existir aún — continuar de todas formas.
      }
    }

    const userId = event.app_user_id;

    switch (event.type) {
      // ── Compra inicial / renovación / reactivación: activar plan ───────────
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "UNCANCELLATION": {
        const plan = getPlanFromProductId(event.product_id ?? "");
        if (plan === "free") {
          console.error("[revenuecat/webhook] product_id no reconocido:", event.product_id);
          break;
        }
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            plan,
            plan_source: "revenuecat",
            subscription_status: "active",
            revenuecat_app_user_id: userId,
            revenuecat_original_app_user_id: event.original_app_user_id ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        if (error) {
          console.error("[revenuecat/webhook] Error al activar plan:", error.message);
        } else {
          console.log(`[revenuecat/webhook] Plan '${plan}' activado (RevenueCat) para ${userId}`);
        }
        break;
      }

      // ── Upgrade / downgrade entre planes ──────────────────────────────────
      case "PRODUCT_CHANGE": {
        const nuevoPlan = getPlanFromProductId(event.new_product_id ?? event.product_id ?? "");
        if (nuevoPlan === "free") {
          console.error("[revenuecat/webhook] PRODUCT_CHANGE con producto no reconocido:", event.new_product_id);
          break;
        }
        await supabaseAdmin
          .from("profiles")
          .update({
            plan: nuevoPlan,
            plan_source: "revenuecat",
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        console.log(`[revenuecat/webhook] Plan cambiado a '${nuevoPlan}' para ${userId}`);
        break;
      }

      // ── Expiración real: resetear a free ──────────────────────────────────
      // (CANCELLATION solo desactiva la auto-renovación; el usuario mantiene
      //  acceso hasta EXPIRATION, igual que Stripe distingue payment_failed de
      //  subscription.deleted.)
      case "EXPIRATION": {
        await supabaseAdmin
          .from("profiles")
          .update({
            plan: "free",
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        console.log(`[revenuecat/webhook] Suscripción expirada — plan 'free' para ${userId}`);
        break;
      }

      // ── Problema de cobro: marcar past_due sin quitar el plan ──────────────
      case "BILLING_ISSUE": {
        await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: "past_due", updated_at: new Date().toISOString() })
          .eq("id", userId);
        console.log(`[revenuecat/webhook] Problema de cobro (past_due) para ${userId}`);
        break;
      }

      // ── CANCELLATION y otros: solo log informativo ────────────────────────
      default:
        console.log(`[revenuecat/webhook] Evento no accionable: ${event.type}`);
    }

    // Responder 200 siempre (salvo auth/payload inválido) para que RevenueCat no
    // reintente en bucle eventos que nunca podrán resolverse.
    return NextResponse.json({ recibido: true });
  } catch (error) {
    console.error("[revenuecat/webhook] Error inesperado:", (error as Error).message);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
