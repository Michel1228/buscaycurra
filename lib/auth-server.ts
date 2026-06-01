/**
 * Validación de tokens de usuario en API routes del servidor.
 * Usa fetch directo a Supabase en lugar del SDK para compatibilidad
 * con el formato de clave sb_secret_* en producción.
 */

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
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
