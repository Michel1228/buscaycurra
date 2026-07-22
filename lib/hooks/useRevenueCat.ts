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
import { PACKAGE_IDS, PRODUCT_IDS, type PlanIAP } from "@/lib/revenuecat";

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

// Último usuario conocido. Se persiste porque la app iOS es un wrapper remoto:
// la WebView carga buscaycurra.es y CADA RECARGA reinicia este módulo. Sin esto
// no podríamos reconfigurar el SDK tras una recarga y la compra quedaba muerta.
const CLAVE_USER = "bc_rc_user";
let ultimoUserId: string | null = null;

function recordarUsuario(id: string) {
  ultimoUserId = id;
  try { localStorage.setItem(CLAVE_USER, id); } catch { /* modo privado */ }
}
function usuarioRecordado(): string | null {
  if (ultimoUserId) return ultimoUserId;
  try { return localStorage.getItem(CLAVE_USER); } catch { return null; }
}

// ─── Inicialización (idempotente, una vez por sesión) ─────────────────────────
export async function inicializarRevenueCat(supabaseUserId: string): Promise<void> {
  if (!isNativeIOS()) return;
  recordarUsuario(supabaseUserId);
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

/**
 * Garantiza que el SDK esté operativo JUSTO ANTES de comprar.
 *
 * Por qué existe: la variable `inicializado` vive en memoria del módulo JS, y
 * la app iOS carga la web remota — cada recarga la ponía a false aunque el
 * plugin nativo siguiera configurado. El revisor de Apple veía entonces
 * "El sistema de pagos aún no está listo" y la compra era IMPOSIBLE de
 * recuperar (rechazo 2.1). Ahora se consulta al plugin nativo, que es la
 * fuente de verdad, y si hace falta se configura en el momento.
 */
async function asegurarListo(): Promise<boolean> {
  if (!isNativeIOS()) return false;
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const { isConfigured } = await Purchases.isConfigured();

    if (!isConfigured) {
      const userId = usuarioRecordado();
      const apiKey =
        process.env.NEXT_PUBLIC_REVENUECAT_API_KEY_IOS || "appl_dMSLUryTHfCrKaLuVsdkVcCyoUR";
      // Sin userId configuramos igualmente (RevenueCat crea un id anónimo): es
      // preferible permitir la compra y que el webhook la reconcilie después
      // que bloquear al usuario.
      await Purchases.configure(userId ? { apiKey, appUserID: userId } : { apiKey });
    }

    inicializado = true;
    if (!estado.offerings) {
      try {
        const offerings = await Purchases.getOfferings();
        setEstado({ listo: true, offerings, error: null });
      } catch { /* los offerings se reintentan al comprar */ }
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Comprar un plan ──────────────────────────────────────────────────────────
async function comprarPlanImpl(
  plan: PlanIAP
): Promise<{ ok: boolean; cancelado?: boolean; error?: string }> {
  if (!isNativeIOS()) {
    return { ok: false, error: "Las compras solo están disponibles en la app de iOS." };
  }
  if (!(await asegurarListo())) {
    return { ok: false, error: "No se pudo conectar con el sistema de pagos de Apple. Comprueba tu conexión e inténtalo de nuevo." };
  }

  setEstado({ comprando: plan, error: null });
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const offerings = estado.offerings ?? (await Purchases.getOfferings());

    // Buscar el package: primero en el offering "current", y si no, en CUALQUIER
    // offering (por si el offering no está marcado como current en el dashboard) o
    // por el Product ID directo. Evita el falso "no se pudo cargar el plan".
    const productoId = PRODUCT_IDS[plan];
    const todosPkgs = [
      ...(offerings.current?.availablePackages ?? []),
      ...Object.values(offerings.all ?? {}).flatMap((o) => o.availablePackages ?? []),
    ];
    const pkg =
      todosPkgs.find((p) => p.identifier === PACKAGE_IDS[plan]) ??
      todosPkgs.find((p) => p.product?.identifier === productoId);

    if (!pkg) {
      const msg = "Este plan no está disponible ahora mismo. Inténtalo de nuevo en unos minutos.";
      setEstado({ comprando: null, error: msg });
      return { ok: false, error: msg };
    }

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    setEstado({ comprando: null });

    // Si purchasePackage NO lanza excepción, StoreKit confirmó el pago. La activación
    // del plan la hace el webhook server-side; NO bloqueamos con un error si el
    // entitlement no casa exactamente (era la causa de "error al procesar la compra"
    // aunque el cobro fuera bien — Apple 2.1b). Consideramos éxito y dejamos que el
    // componente refresque el plan desde Supabase (polling).
    const algunEntitlement = Object.keys(customerInfo.entitlements.active).length > 0;
    const productoActivo = customerInfo.activeSubscriptions?.includes(productoId);
    void algunEntitlement; void productoActivo; // señales informativas; no se usan para fallar
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
  // Mismo motivo que en la compra: tras una recarga de la web la variable de
  // módulo se pierde y "Restaurar compras" (obligatorio por Apple) quedaba
  // inutilizable. Se comprueba contra el plugin nativo.
  if (!(await asegurarListo())) {
    return { ok: false, error: "No se pudo conectar con el sistema de pagos de Apple. Inténtalo de nuevo." };
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
