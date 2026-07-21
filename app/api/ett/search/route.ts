/**
 * POST /api/ett/search
 *
 * Busca ETTs (Empresas de Trabajo Temporal) por ciudad usando Google Places.
 *
 * Flujo:
 *   1. Text Search con varias consultas ("ETT X", "agencia empleo temporal X"...)
 *      → hasta 20 sitios por consulta (Find Place solo daba ~1-5: se quedaba corto)
 *   2. Google Places Details → nombre, web, teléfono, dirección, rating, fotos
 *   3. Email: real de la web si se encuentra; si no, patrón + verificación MX
 *
 * Acepta: { city: "Madrid" }
 * Devuelve: { success: true, empresas: EmpresaCompleta[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { buscarEmpresasTextSearch, type GooglePlaceResult } from "@/lib/google-places";
import { construirEmpresaDesdeGoogle, enriquecerEmpresas, type EmpresaCompleta } from "@/lib/empresa-datos";
import { getUserId } from "@/lib/auth-server";
import { secretIguales } from "@/lib/secret-compare";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Auth: este endpoint dispara Google Places (de pago) y scraping saliente.
    // Sin ella, un anónimo podía llamarlo en bucle y generar factura real.
    // Mismo criterio que /api/company/extract.
    const internalSecret = request.headers.get("x-sync-secret");
    const isInternal =
      !!internalSecret &&
      !!process.env.ADMIN_SECRET &&
      secretIguales(internalSecret, process.env.ADMIN_SECRET);
    if (!isInternal && !(await getUserId(request))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as { city?: string };
    const city = body.city?.trim();

    if (!city || city.length < 2) {
      return NextResponse.json(
        { error: 'Ciudad requerida. Ej: { "city": "Madrid" }' },
        { status: 400 }
      );
    }
    if (city.length > 80) {
      return NextResponse.json({ error: "Ciudad demasiado larga" }, { status: 400 });
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json({ error: "API de Google Places no configurada" }, { status: 500 });
    }

    // ── 1. Buscar ETTs en Google Places ─────────────────────────────────
    console.log(`🏢 Buscando ETTs en: "${city}"`);

    const queries = [
      `ETT empresa trabajo temporal ${city}`,
      `agencia de empleo ${city}`,
      `agencia de colocación ${city}`,
    ];

    // Dedupe por place_id: las tres consultas se solapan mucho.
    const porId = new Map<string, GooglePlaceResult>();
    const tandas = await Promise.all(
      queries.map((q) => buscarEmpresasTextSearch(q, 10).catch(() => [] as GooglePlaceResult[]))
    );
    for (const tanda of tandas) {
      for (const place of tanda) {
        if (!porId.has(place.place_id)) porId.set(place.place_id, place);
      }
    }

    const places = Array.from(porId.values());

    if (!places.length) {
      return NextResponse.json({
        success: true,
        empresas: [],
        mensaje: `No se encontraron ETTs en "${city}". Prueba con otra ciudad o una más grande cercana.`,
      });
    }

    // ── 2. Construir resultados ────────────────────────────────────────
    const empresas: EmpresaCompleta[] = places.map((gr) =>
      construirEmpresaDesdeGoogle(gr, {
        fuente: "google_places_ett",
        sector: "ETT / Recursos Humanos",
        prioridadRrhh: true, // en una ETT, rrhh@/seleccion@ es lo más probable
      })
    );

    // ── 3. Email real de la web y, si no, verificación MX ──────────────
    await enriquecerEmpresas(empresas);

    // Las que tienen email comprobado primero: es donde el CV tiene recorrido.
    const peso: Record<string, number> = { alta: 0, media: 1, baja: 2 };
    empresas.sort(
      (a, b) =>
        peso[a.emailConfianza] - peso[b.emailConfianza] ||
        (b.googleRating ?? 0) - (a.googleRating ?? 0)
    );

    console.log(`✅ ${empresas.length} ETTs en ${city} (${empresas.filter(e => e.emailConfianza === "alta").length} con email verificado)`);

    return NextResponse.json({ success: true, empresas });
  } catch (error) {
    console.error("[ett/search] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error al buscar ETTs" }, { status: 500 });
  }
}
