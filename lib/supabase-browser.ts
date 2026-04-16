/**
 * lib/supabase-browser.ts — Cliente de Supabase para el navegador (uso en cliente)
 *
 * Inicializa el cliente de Supabase de forma diferida para evitar errores de SSR
 * cuando las variables de entorno no están configuradas durante el build.
 * Solo para uso en componentes "use client".
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cliente inicializado de forma diferida (null hasta que se usa)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _cliente: SupabaseClient | null = null;

/**
 * Obtiene el cliente de Supabase para el navegador.
 * Lo crea en el primer uso, evitando problemas con SSR en el build.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (!_cliente) {
    _cliente = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _cliente;
}
