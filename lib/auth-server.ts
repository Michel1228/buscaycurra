/**
 * Validación de tokens de usuario en API routes del servidor.
 * Usa fetch directo a Supabase en lugar del SDK para compatibilidad
 * con el formato de clave sb_secret_* en producción.
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export interface AuthUser {
  id: string;
  email: string;
}

export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: string; email?: string };
    if (!data?.id) return null;
    return { id: data.id, email: data.email || "" };
  } catch {
    return null;
  }
}

export function extractToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

/**
 * Extrae el userId del request de forma segura.
 * 1. Intenta obtener el usuario desde las cookies de sesión (createServerClient).
 * 2. Si no hay cookies, intenta el header Authorization: Bearer <token>.
 * Retorna null si no se puede autenticar al usuario.
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  // 1. Intentar autenticación vía cookies (cliente web)
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () =>
            request.cookies.getAll().map((c) => ({
              name: c.name,
              value: c.value,
            })),
        },
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {
    // Cookies no disponibles, continuar con fallback
  }

  // 2. Fallback: Authorization header (server-to-server o client con token explícito)
  const authHeader = request.headers.get("authorization");
  const token = extractToken(authHeader);
  if (token) {
    const authUser = await getUserFromToken(token);
    if (authUser?.id) return authUser.id;
  }

  return null;
}
