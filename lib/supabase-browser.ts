/**
 * lib/supabase-browser.ts — Cliente de Supabase para el navegador (uso en cliente)
 *
 * Inicializa el cliente de Supabase de forma diferida para evitar errores de SSR
 * cuando las variables de entorno no están configuradas durante el build.
 * Solo para uso en componentes "use client".
 */

import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";

let _cliente: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (!_cliente) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Guard against build-time prerender where env vars are unavailable
    if (!url || !key) {
      // Return a stub that throws only when actually used at runtime
      return new Proxy({} as SupabaseClient, {
        get(_target, prop) {
          throw new Error(
            `Supabase client not initialized. NEXT_PUBLIC_SUPABASE_URL=${url ? "set" : "MISSING"}, ` +
            `NEXT_PUBLIC_SUPABASE_ANON_KEY=${key ? "set" : "MISSING"}`
          );
        },
      });
    }

    _cliente = createBrowserClient(url, key);
  }
  return _cliente;
}
