/**
 * Validación de tokens de usuario en API routes del servidor.
 * Usa fetch directo a Supabase en lugar del SDK para compatibilidad
 * con el formato de clave sb_secret_* en producción.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import {
  correoVerificado, confirmoConEnlace, ERROR_CONFIRMA_CORREO, MENSAJE_CONFIRMA_CORREO,
  type CuentaParaVerificar,
} from "@/lib/auth/correo-verificado";

export interface AuthUser {
  id: string;
  email: string;
  /**
   * Si ha verificado su correo (lib/auth/correo-verificado.ts): sin eso, el
   * correo no prueba quién es. Ya no es email_confirmed_at a secas: con
   * "Confirm email" apagado en Supabase, eso se pone al crear la cuenta.
   */
  confirmado?: boolean;
  /** Supabase dice que pulsó un enlace (más de 30 s tras el alta): ver cuentaVerificada. */
  confirmoConEnlace?: boolean;
}

type CuentaSupabase = CuentaParaVerificar & { id?: string; email?: string | null };

function aAuthUser(u: CuentaSupabase & { id: string }): AuthUser {
  return { id: u.id, email: u.email || "", confirmado: correoVerificado(u), confirmoConEnlace: confirmoConEnlace(u) };
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
    const data = (await res.json()) as CuentaSupabase;
    if (!data?.id) return null;
    return aAuthUser({ ...data, id: data.id });
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
  return (await getUsuario(request))?.id ?? null;
}

function clienteDeCookies(request: NextRequest) {
  return createServerClient(
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
}

/**
 * Como getUserId, pero con el correo y si está verificado: hace falta para
 * saber de qué empresa es alguien (lib/empresas/cuenta.ts).
 */
export async function getUsuario(request: NextRequest): Promise<AuthUser | null> {
  // 1. Intentar autenticación vía cookies (cliente web)
  try {
    const {
      data: { user },
    } = await clienteDeCookies(request).auth.getUser();
    if (user?.id) return aAuthUser(user);
  } catch {
    // Cookies no disponibles, continuar con fallback
  }

  // 2. Fallback: Authorization header (server-to-server o client con token explícito)
  const authHeader = request.headers.get("authorization");
  const token = extractToken(authHeader);
  if (token) {
    const authUser = await getUserFromToken(token);
    if (authUser?.id) return authUser;
  }

  return null;
}

// ─── MIRAR SÍ, HACER NO (7 nov 2026) ──────────────────────────────────────
//
// Se entra sin confirmar el correo, pero toda ACCIÓN (escribir datos de la
// persona, gastar IA, mandar correos, generar o mandar CV y cartas) lo exige,
// y se exige AQUÍ, en el servidor: el aviso y la ventana del navegador
// (components/ConfirmaCorreo*.tsx) solo lo explican. El sello recorre
// app/api/** y falla si una ruta que no está en su lista cerrada de lectura
// no llama a correoSinVerificar.

/** ¿Está activado el auto-confirm ("Confirm email" apagado)? null si no se sabe. Se mira como mucho una vez por minuto. */
let autoconfirm: { valor: boolean | null; hasta: number } = { valor: null, hasta: 0 };
async function autoconfirmActivo(): Promise<boolean | null> {
  if (Date.now() < autoconfirm.hasta) return autoconfirm.valor;
  let valor: boolean | null = null;
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      signal: AbortSignal.timeout(4000),
    });
    const d = r.ok ? ((await r.json()) as { mailer_autoconfirm?: unknown }) : null;
    if (typeof d?.mailer_autoconfirm === "boolean") valor = d.mailer_autoconfirm;
  } catch { /* no se sabe: no se marca a nadie */ }
  autoconfirm = { valor, hasta: Date.now() + 60_000 };
  return valor;
}

/**
 * MIENTRAS "Confirm email" SIGA ACTIVADO, quien tiene sesión confirmó con un
 * enlace de su correo: se le pone la marca y sigue igual que siempre. Así el
 * código funciona antes y después de que Michel cambie el ajuste. Con el
 * auto-confirm ya activado no se marca a nadie por esta vía (ver la regla en
 * lib/auth/correo-verificado.ts).
 */
async function marcarSiConfirmoConEnlace(u: AuthUser): Promise<boolean> {
  if (!u.confirmoConEnlace || (await autoconfirmActivo()) !== false) return false;
  try {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data } = await admin.auth.admin.getUserById(u.id);
    const cuenta = data?.user;
    if (!cuenta?.email_confirmed_at) return false;
    if (!cuenta.app_metadata?.correo_verificado_en) {
      const { error } = await admin.auth.admin.updateUserById(u.id, {
        app_metadata: { ...cuenta.app_metadata, correo_verificado_en: cuenta.email_confirmed_at },
      });
      if (error) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Si la cuenta tiene el correo verificado; pone la marca a quien confirmó mientras "Confirm email" seguía activado. */
export async function cuentaVerificada(u: AuthUser): Promise<boolean> {
  return !!u.confirmado || (await marcarSiConfirmoConEnlace(u));
}

/**
 * Todas las cuentas que trae la petición: la de las cookies y la del
 * Authorization (con o sin "Bearer ", como lo leen las rutas: unas hacen
 * slice(7) y otras replace). Se miran TODAS: si no, con la cookie de una cuenta
 * verificada y el token de otra sin verificar, una ruta que lee el token
 * actuaría como la segunda.
 */
async function cuentasDeLaPeticion(request: NextRequest): Promise<AuthUser[]> {
  const cuentas: AuthUser[] = [];
  let tokenDeLaCookie: string | null = null;
  try {
    const supabase = clienteDeCookies(request);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      tokenDeLaCookie = session.access_token;
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) cuentas.push(aAuthUser(user));
    }
  } catch { /* sin cookies de sesión */ }
  const cabecera = request.headers.get("authorization") || "";
  const tokens = new Set([cabecera.replace("Bearer ", ""), cabecera.slice(7)].map((t) => t.trim()));
  for (const t of tokens) {
    if (!t || t === tokenDeLaCookie) continue;
    const u = await getUserFromToken(t);
    if (u) cuentas.push(u);
  }
  return cuentas;
}

/**
 * LA COMPROBACIÓN DE LAS ACCIONES. Devuelve el 403 { error: "confirma_correo",
 * mensaje } si quien llama tiene sesión y no ha verificado su correo, y null si
 * puede seguir. Sin sesión devuelve null: de eso se encarga cada ruta (401, o
 * el uso sin cuenta que ya tuviera). Uso, lo primero del manejador:
 *
 *   const sinVerificar = await correoSinVerificar(req);
 *   if (sinVerificar) return sinVerificar;
 */
export async function correoSinVerificar(request: NextRequest): Promise<NextResponse | null> {
  for (const u of await cuentasDeLaPeticion(request)) {
    if (await cuentaVerificada(u)) continue;
    return NextResponse.json({ error: ERROR_CONFIRMA_CORREO, mensaje: MENSAJE_CONFIRMA_CORREO }, { status: 403 });
  }
  return null;
}
