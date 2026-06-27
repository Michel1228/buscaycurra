/**
 * Middleware de BuscayCurra
 * Protege rutas /app/* validando el token JWT real de Supabase.
 * Redirige usuarios autenticados desde / y /auth/* a /app/gusi.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // Usuario autenticado en la raíz o en páginas de auth → ir al app
  if (pathname === "/" || pathname.startsWith("/auth/")) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/app/gusi", request.url));
    }
    return NextResponse.next();
  }

  // Proteger rutas /app/*
  if (!pathname.startsWith("/app")) return NextResponse.next();

  if (!isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/auth/:path*", "/app/:path*"],
};
