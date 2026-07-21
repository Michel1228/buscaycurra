/**
 * POST /api/company/extract
 * 
 * Búsqueda de empresas por nombre usando Google Places API como fuente primaria.
 * 
 * Flujo:
 *   1. Google Places Find Place → candidates (hasta 5)
 *   2. Google Places Details → nombre, web, teléfono, dirección, rating, sector
 *   3. Email: scraping opcional de la web real + patrones generados del dominio
 * 
 * Acepta: { name: "Mercadona" }
 * Opcional: { name: "Mercadona", city: "Valencia" }
 * 
 * Devuelve: { success: true, empresas: EmpresaCompleta[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { buscarEmpresaGooglePlaces } from "@/lib/google-places";
import { construirEmpresaDesdeGoogle, enriquecerEmpresas, type EmpresaCompleta } from "@/lib/empresa-datos";
import { buscarEnCachePorNombre, guardarEnCache } from "@/lib/empresas-cache";
import { getUserId } from "@/lib/auth-server";
import { secretIguales } from "@/lib/secret-compare";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Auth: usuario autenticado O llamada interna de Guzzi con secret. Antes era
    // público → Google Places de pago + scraping de webs disparables en bucle
    // por un anónimo (factura real + tráfico saliente).
    const internalSecret = request.headers.get("x-sync-secret");
    const isInternal = !!internalSecret && !!process.env.ADMIN_SECRET && secretIguales(internalSecret, process.env.ADMIN_SECRET);
    if (!isInternal && !(await getUserId(request))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json() as { name?: string; url?: string; city?: string };
    const name = body.name?.trim();
    const city = body.city?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Nombre de empresa requerido. Ej: { \"name\": \"Mercadona\" }" },
        { status: 400 }
      );
    }

    // ── 1. Caché primero: Places es de pago, no preguntar dos veces lo mismo ─
    const enCache = await buscarEnCachePorNombre(name, city);
    if (enCache.length) {
      console.log(`💾 ${enCache.length} empresas servidas desde caché: "${name}"`);
      return NextResponse.json({ success: true, empresas: enCache, desdeCache: true });
    }

    // ── 2. Google Places (fuente ÚNICA de datos de empresa) ────────────────
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "API de Google Places no configurada" },
        { status: 500 }
      );
    }

    console.log(`🗺️ Buscando en Google Places: "${name}"${city ? ` (${city})` : ""}`);
    const places = await buscarEmpresaGooglePlaces(name, city);

    if (!places.length) {
      return NextResponse.json({
        success: true,
        empresas: [],
        mensaje: `No se encontraron resultados para "${name}". Prueba con el nombre completo de la empresa.`,
      });
    }

    // ── 2. Construir resultados ────────────────────────────────────────────
    const empresas: EmpresaCompleta[] = places.map(gr =>
      construirEmpresaDesdeGoogle(gr, { fuente: "google_places" })
    );

    // ── 3. Enriquecer: email real de la web y, si no, verificación MX ──────
    // Marca cada email con su confianza para que el usuario no gaste envíos en
    // direcciones inventadas creyendo que son reales.
    await enriquecerEmpresas(empresas);

    // ── 4. Guardar en caché para no volver a pagar por esta búsqueda ───────
    await guardarEnCache(empresas, city);

    console.log(`✅ ${empresas.length} empresas encontradas: ${empresas.map(e => e.nombre).join(", ")}`);

    return NextResponse.json({ success: true, empresas });
  } catch (error) {
    console.error("[company/extract] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Error al buscar empresas" },
      { status: 500 }
    );
  }
}
