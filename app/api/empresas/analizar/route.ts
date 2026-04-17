/**
 * app/api/empresas/analizar/route.ts — API para analizar empresa desde su URL
 *
 * Auth:
 *   Header obligatorio: Authorization: Bearer <supabase_access_token>
 *   Evita que la cuota de IA se consuma desde peticiones anónimas.
 *
 * Recibe:  url (URL de la empresa a analizar, http/https)
 * Proceso: busca en caché Redis → si no hay, usa company-extractor
 * Devuelve: nombre, email RRHH, teléfono y página de empleo
 *
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { obtenerInfoEmpresaCacheada } from "@/lib/cache/job-cache";
import { extraerInfoEmpresa } from "@/lib/company-extractor";

// ─── Handler GET ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // ─── Cliente Supabase con clave anónima (para verificar sesión) ───────────
  const supabasePublico = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── Verificar autenticación del usuario ─────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "No autorizado. Debes iniciar sesión para analizar empresas." },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabasePublico.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: "Sesión no válida. Por favor, inicia sesión de nuevo." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);

  // Leer la URL de la empresa
  const url = searchParams.get("url") || "";

  // Validar que se ha proporcionado una URL
  if (!url.trim()) {
    return NextResponse.json(
      { error: "Debes proporcionar la URL de la empresa" },
      { status: 400 }
    );
  }

  // Validar que la URL tiene formato correcto y es http/https
  // (rechaza javascript:, file:, data:, etc. — protocolos peligrosos)
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json(
        { error: "La URL debe empezar por http:// o https://" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "La URL no es válida. Ejemplo: https://www.empresa.com" },
      { status: 400 }
    );
  }

  try {
    // Buscar en caché Redis primero (TTL: 7 días)
    // Si no hay caché, extraer la información de la web de la empresa
    const infoEmpresa = await obtenerInfoEmpresaCacheada(url, () =>
      extraerInfoEmpresa(url).then((datos) => ({
        nombre: datos.nombre,
        url,
        emailContacto: datos.emailRrhh,
        descripcion: datos.paginaEmpleo,
        fechaObtencion: new Date().toISOString(),
      }))
    );

    // Devolver los datos en el formato esperado por el frontend
    return NextResponse.json({
      nombre: infoEmpresa.nombre,
      emailRrhh: infoEmpresa.emailContacto,
      telefono: undefined, // Se obtiene del scraping real
      paginaEmpleo: infoEmpresa.descripcion,
    });
  } catch (error) {
    console.error("❌ Error al analizar empresa:", (error as Error).message);
    return NextResponse.json(
      { error: "Error al analizar la empresa. Inténtalo de nuevo más tarde." },
      { status: 500 }
    );
  }
}
