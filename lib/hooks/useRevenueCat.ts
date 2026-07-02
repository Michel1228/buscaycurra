"use client";

/**
 * lib/hooks/useRevenueCat.ts — Estado global de compras In-App (RevenueCat / iOS).
 *
 * Arquitectura:
 *   - Store singleton a nivel de módulo (no React Context) para no tener que
 *     envolver el árbol en un Provider ni tocar cada layout.tsx de /app/*.
 *   - Purchases.configure() se llama UNA sola vez por sesión (flag `inicializado`).
 *   - Se importa el plugin de forma DINÁMICA dentro de las funciones async para no
 *     romper el build/SSR de Next.js (el plugin es nativo, no tiene sentido en server).
 *   - El SDK solo se usa dentro de la app nativa iOS (isNativeIOS). En web es no-op.
 *
 * IMPORTANTE: este hook NO escribe profiles.plan en Supabase. El estado del plan lo
 * fija exclusivamente el webhook server-side (app/api/revenuecat/webhook/route.ts),
 * igual que Stripe. Tras una compra, el componente refresca su plan desde Supabase.
 */

import { useCallback, useSyncExternalStore } from "react";
import type { PurchasesOfferings } from "@revenuecat/purchases-capacitor";
import { isNativeIOS } from "@/lib/utils/platform";
import { PACKAGE_IDS, type PlanIAP } from "@/lib/revenuecat";

export type { PlanIAP };

// ─── Estado global compartido ────────────────────────────────────────────────
interface EstadoRC {
  listo: boolean;
  comprando: PlanIAP | null;
  restaurando: boolean;
  error: string | null;
  offerings: PurchasesOfferings | null;
}

let estado: EstadoRC = {
  listo: false,
  comprando: null,
  restaurando: false,
  error: null,
  offerings: null,
};

let inicializado = false;
const listeners = new Set<() => void>();

function emitir() {
  for (const l of listeners) l();
}
function setEstado(patch: Partial<EstadoRC>) {
  estado = { ...estado, ...patch };
  emitir();
}
function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function getSnapshot(): EstadoRC {
  return estado;
}

// ─── Inicialización (idempotente, una vez por sesión) ─────────────────────────
export async function inicializarRevenueCat(supabaseUserId: string): Promise<void> {
  if (!isNativeIOS()) return;
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");

    const { isConfigured } = await Purchases.isConfigured();
    if (isConfigured) {
      // Ya configurado: si es otro usuario (login distinto en el mismo dispositivo),
      // cambiar de identidad para que las compras se asocien al usuario correcto.
      const { appUserID } = await Purchases.getAppUserID();
      if (appUserID !== supabaseUserId) {
        await Purchases.logIn({ appUserID: supabaseUserId });
      }
    } else {
      // Public SDK key de RevenueCat para iOS. Es pública por diseño (va embebida
      // en el cliente), por eso puede quedar como valor por defecto; se puede
      // sobreescribir con la env var NEXT_PUBLIC_REVENUECAT_API_KEY_IOS si hiciera falta.
      const apiKey =
        process.env.NEXT_PUBLIC_REVENUECAT_API_KEY_IOS || "appl_dMSLUryTHfCrKaLuVsdkVcCyoUR";
      await Purchases.configure({ apiKey, appUserID: supabaseUserId });
    }

    inicializado = true;
    const offerings = await Purchases.getOfferings();
    setEstado({ listo: true, offerings, error: null });
  } catch {
    // Degradación suave: la app sigue siendo usable aunque IAP falle al iniciar.
    setEstado({ error: "No se pudo inicializar el sistema de pagos." });
  }
}

// ─── Comprar un plan ──────────────────────────────────────────────────────────
async function comprarPlanImpl(
  plan: PlanIAP
): Promise<{ ok: boolean; cancelado?: boolean; error?: string }> {
  if (!isNativeIOS()) {
    return { ok: false, error: "Las compras solo están disponibles en la app de iOS." };
  }
  if (!inicializado) {
    return { ok: false, error: "El sistema de pagos aún no está listo. Inténtalo de nuevo en unos segundos." };
  }

  setEstado({ comprando: plan, error: null });
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const offerings = estado.offerings ?? (await Purchases.getOfferings());
    const pkg = offerings.current?.availablePackages.find(
      (p) => p.identifier === PACKAGE_IDS[plan]
    );
    if (!pkg) {
      setEstado({ comprando: null, error: "No se pudo cargar la información del plan. Inténtalo de nuevo." });
      return { ok: false, error: "No se pudo cargar la información del plan." };
    }

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    const activo = !!customerInfo.entitlements.active[plan];
    setEstado({ comprando: null });

    if (!activo) {
      const msg = "La compra no se pudo verificar. Si se te cobró, usa 'Restaurar compras'.";
      setEstado({ error: msg });
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (e) {
    // En el plugin de Capacitor, la cancelación del usuario llega como userCancelled.
    const cancelado = (e as { userCancelled?: boolean })?.userCancelled === true;
    if (cancelado) {
      setEstado({ comprando: null, error: null });
      return { ok: false, cancelado: true };
    }
    const msg = "No se pudo completar la compra. Inténtalo de nuevo o contacta con soporte.";
    setEstado({ comprando: null, error: msg });
    return { ok: false, error: msg };
  }
}

// ─── Restaurar compras (obligatorio por Apple) ────────────────────────────────
async function restaurarComprasImpl(): Promise<{ ok: boolean; encontrado?: boolean; error?: string }> {
  if (!isNativeIOS()) {
    return { ok: false, error: "Solo disponible en la app de iOS." };
  }
  if (!inicializado) {
    return { ok: false, error: "El sistema de pagos aún no está listo." };
  }

  setEstado({ restaurando: true, error: null });
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const { customerInfo } = await Purchases.restorePurchases();
    const encontrado = Object.keys(customerInfo.entitlements.active).length > 0;
    setEstado({ restaurando: false });
    return { ok: true, encontrado };
  } catch {
    const msg = "No se pudieron restaurar las compras. Inténtalo de nuevo.";
    setEstado({ restaurando: false, error: msg });
    return { ok: false, error: msg };
  }
}

// ─── Hook de lectura reactiva ─────────────────────────────────────────────────
export function useRevenueCat() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const comprarPlan = useCallback((plan: PlanIAP) => comprarPlanImpl(plan), []);
  const restaurarCompras = useCallback(() => restaurarComprasImpl(), []);
  return { ...snap, comprarPlan, restaurarCompras };
}
