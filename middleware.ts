/**
 * Middleware de BuscayCurra
 * Protege rutas /app/* validando el token JWT real de Supabase.
 * Redirige usuarios autenticados desde / y /auth/* a /app/gusi.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { COOKIE_CUENTA } from "@/lib/auth/destino";

// Dominios permitidos para peticiones API (CSRF protection)
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  "https://buscaycurra.es",
  "https://www.buscaycurra.es",
  "http://localhost:3000",
].filter(Boolean) as string[];

function isSameSiteRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host") || "";

  // Si no hay Origin ni Referer, podría ser petición directa (curl, cron, etc.)
  if (!origin && !referer) {
    // Solo permitir sin Origin/Referer si es petición GET (crons, health checks)
    // o si tiene un header de autorización interna
    const isGet = request.method === "GET";
    const hasInternalAuth = request.headers.get("x-internal-auth") || request.headers.get("authorization");
    if (isGet || hasInternalAuth) return true;
    // POST/PUT/DELETE sin Origin/Referer son sospechosos
    return false;
  }

  // Validar Origin
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some(allowed => origin === allowed || origin.startsWith(allowed + ":"));
    if (!isAllowed) return false;
  }

  // Validar Referer
  if (referer) {
    try {
      const refUrl = new URL(referer);
      const refHost = refUrl.host;
      if (refHost !== host && refHost !== new URL(ALLOWED_ORIGINS[0] || "https://buscaycurra.es").host) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF protection para rutas API con estado (POST/PUT/PATCH/DELETE)
  if (pathname.startsWith("/api/") && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    if (!isSameSiteRequest(request)) {
      return NextResponse.json(
        { error: "Cross-site request blocked (CSRF)" },
        { status: 403 }
      );
    }
  }

  // Validar sesión real con Supabase SSR
  let isAuthenticated = false;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set({ name, value, ...options });
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = !!user?.id;
  } catch {
    // Si falla la validación (cookies corruptas, network), tratar como no autenticado
    isAuthenticated = false;
  }

  // Usuario autenticado en la raíz o en páginas de auth → ir al app.
  // Menos "nueva contraseña": quien abre el enlace del correo con la sesión ya
  // abierta (o recarga tras abrirlo) tiene que poder cambiarla, no acabar en Guzzi.
  if (pathname === "/" || (pathname.startsWith("/auth/") && pathname !== "/auth/nueva-contrasena")) {
    if (isAuthenticated) {
      // Quien ya tiene cuenta y pulsa "Envía tu CV a…" en una ficha de oferta
      // va a esa oferta dentro de la app, no a Guzzi (18 oct 2026).
      const oferta = pathname === "/auth/registro" ? request.nextUrl.searchParams.get("oferta") : null;
      if (oferta && /^[a-z0-9]{8,40}$/i.test(oferta)) {
        return NextResponse.redirect(new URL(`/app/ofertas/${oferta}`, request.url));
      }
      return NextResponse.redirect(new URL("/app/gusi", request.url));
    }
    return NextResponse.next();
  }

  // Proteger rutas /app/*
  if (!pathname.startsWith("/app")) return NextResponse.next();

  if (!isAuthenticated) {
    // QUIEN NUNCA HA TENIDO CUENTA AQUÍ, AL REGISTRO (18 oct 2026). Desde las
    // páginas públicas ("Buscar ofertas en Suecia") la gente nueva acababa en
    // "Bienvenido de vuelta" y se iba. Se distingue por una cookie que se pone
    // al entrar o al confirmar el correo; el registro tiene "Ya tengo cuenta".
    // El destino lleva también la búsqueda (?pais=SE), que antes se perdía.
    const destino = pathname + request.nextUrl.search;
    if (!request.cookies.get(COOKIE_CUENTA)) {
      const registroUrl = new URL("/auth/registro", request.url);
      registroUrl.searchParams.set("destino", destino);
      return NextResponse.redirect(registroUrl);
    }
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", destino);
    return NextResponse.redirect(loginUrl);
  }

  // Con sesión dentro de la app: este dispositivo ya tiene cuenta. Si un día
  // caduca la sesión, le saldrá el login y no el registro.
  const respuesta = NextResponse.next();
  if (!request.cookies.get(COOKIE_CUENTA)) {
    respuesta.cookies.set(COOKIE_CUENTA, "1", { path: "/", maxAge: 31536000, sameSite: "lax" });
  }
  return respuesta;
}

export const config = {
  matcher: ["/", "/auth/:path*", "/app/:path*"],
};
