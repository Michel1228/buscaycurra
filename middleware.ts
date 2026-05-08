import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cookies = request.cookies.getAll();
  const hasSession = cookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("auth-token")
  );

  // Usuario autenticado en la raíz → ir directamente al app
  if (pathname === "/") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/app/bienvenida", request.url));
    }
    return NextResponse.next();
  }

  // Proteger rutas /app/*
  if (!pathname.startsWith("/app")) return NextResponse.next();

  if (!hasSession) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/app/:path*"],
};
