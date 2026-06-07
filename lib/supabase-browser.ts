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
    // No crear el cliente durante SSR/build — solo en el navegador
    if (typeof window === "undefined") {
      // Devolver un stub que no explota durante prerender
      return {
        auth: {
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          signOut: () => Promise.resolve({ error: null }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
          }),
        }),
      } as unknown as SupabaseClient;
    }
    _cliente = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _cliente;
}
