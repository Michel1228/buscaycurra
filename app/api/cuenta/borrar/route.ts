/**
 * DEPRECATED: Usar /api/user/delete-account (endpoint canónico).
 * Redirige al endpoint canónico para unificar el borrado de cuenta.
 */
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  const canonicalUrl = new URL("/api/user/delete-account", request.url);
  // Reenviar la petición al endpoint canónico
  return NextResponse.redirect(canonicalUrl, 307);
}
