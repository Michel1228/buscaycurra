/**
 * POST /api/empresas/zona
 *
 * Devuelve MUCHAS empresas de una ciudad y sector para enviar el CV en lote,
 * aunque no tengan ninguna oferta publicada. Es la vía para cubrir el hueco:
 * atacar directamente al negocio (bares, tiendas, talleres...) en vez de esperar
 * a que publiquen.
 *
 * Acepta: { ciudad: "Zaragoza", sector: "hosteleria", limite?: 40 }
 * Devuelve: { success, empresas, total, conEmailFiable, desdeCache }
 *
 * Coste: cada empresa nueva son llamadas de PAGO a Google Places, así que
 * primero se mira la caché y hay tope por usuario.
 */
import { NextRequest, NextResponse } from "next/server";
import { buscarEmpresasTextSearch, type GooglePlaceResult } from "@/lib/google-places";
import { construirEmpresaDesdeGoogle, enriquecerEmpresas, type EmpresaCompleta } from "@/lib/empresa-datos";
import { buscarEnCachePorZona, guardarEnCache } from "@/lib/empresas-cache";
import { getUserId } from "@/lib/auth-server";
import { checkUserRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit-user";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Sectores con los términos de búsqueda que mejor funcionan en Google Maps.
 * Varias consultas por sector porque cada una devuelve hasta 20 sitios y se
 * solapan poco (un "bar" y una "cafetería" no son el mismo listado).
 */
const SECTORES: Record<string, { etiqueta: string; consultas: string[] }> = {
  hosteleria: {
    etiqueta: "Hostelería",
    consultas: ["bares en", "restaurantes en", "cafeterías en", "hoteles en"],
  },
  comercio: {
    etiqueta: "Comercio y tiendas",
    consultas: ["tiendas de ropa en", "supermercados en", "panaderías en", "tiendas en"],
  },
  belleza: {
    etiqueta: "Belleza y bienestar",
    consultas: ["peluquerías en", "centros de estética en", "gimnasios en"],
  },
  automocion: {
    etiqueta: "Automoción",
    consultas: ["talleres mecánicos en", "concesionarios en"],
  },
  salud: {
    etiqueta: "Salud",
    consultas: ["clínicas en", "farmacias en", "residencias de mayores en"],
  },
  construccion: {
    etiqueta: "Construcción y reformas",
    consultas: ["empresas de reformas en", "constructoras en", "fontaneros en"],
  },
  logistica: {
    etiqueta: "Transporte y logística",
    consultas: ["empresas de transporte en", "almacenes logísticos en", "mensajería en"],
  },
  educacion: {
    etiqueta: "Educación",
    consultas: ["academias en", "guarderías en", "colegios en"],
  },
  limpieza: {
    etiqueta: "Limpieza",
    consultas: ["empresas de limpieza en", "lavanderías en"],
  },
  ett: {
    etiqueta: "ETT y agencias de empleo",
    consultas: ["ETT empresa trabajo temporal en", "agencias de empleo en"],
  },
};

/** Catálogo de sectores, para que la interfaz no los tenga duplicados a mano. */
export async function GET() {
  return NextResponse.json({
    sectores: Object.entries(SECTORES).map(([id, s]) => ({ id, etiqueta: s.etiqueta })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Tope anti-abuso: cada búsqueda nueva son decenas de llamadas de pago.
    if (!(await checkUserRateLimit("empresas-zona", userId, 12, 3600))) {
      return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
    }

    const body = (await request.json()) as { ciudad?: string; sector?: string; limite?: number };
    const ciudad = body.ciudad?.trim();
    const sectorId = body.sector?.trim();
    const limite = Math.min(Math.max(body.limite ?? 40, 5), 80);

    if (!ciudad || ciudad.length < 2 || ciudad.length > 80) {
      return NextResponse.json(
        { error: 'Ciudad requerida. Ej: { "ciudad": "Zaragoza", "sector": "hosteleria" }' },
        { status: 400 }
      );
    }
    const sector = sectorId ? SECTORES[sectorId] : undefined;
    if (sectorId && !sector) {
      return NextResponse.json(
        { error: `Sector no válido. Opciones: ${Object.keys(SECTORES).join(", ")}` },
        { status: 400 }
      );
    }

    // ── 1. Caché primero ────────────────────────────────────────────────
    const cacheados = await buscarEnCachePorZona(ciudad, sector?.etiqueta, limite);
    if (cacheados.length >= limite) {
      return NextResponse.json({
        success: true,
        empresas: cacheados,
        total: cacheados.length,
        conEmailFiable: cacheados.filter((e) => e.emailConfianza === "alta").length,
        desdeCache: true,
      });
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      // Sin API seguimos pudiendo servir lo ya conocido.
      return NextResponse.json({
        success: true,
        empresas: cacheados,
        total: cacheados.length,
        conEmailFiable: cacheados.filter((e) => e.emailConfianza === "alta").length,
        desdeCache: true,
      });
    }

    // ── 2. Buscar en Google lo que falte ────────────────────────────────
    const consultas = (sector?.consultas ?? ["empresas en"]).map((c) => `${c} ${ciudad}`);
    const yaConocidos = new Set(cacheados.map((e) => e.placeId));
    const porId = new Map<string, GooglePlaceResult>();

    const tandas = await Promise.all(
      consultas.map((q) => buscarEmpresasTextSearch(q, 12).catch(() => [] as GooglePlaceResult[]))
    );
    for (const tanda of tandas) {
      for (const place of tanda) {
        if (!yaConocidos.has(place.place_id) && !porId.has(place.place_id)) {
          porId.set(place.place_id, place);
        }
      }
    }

    const nuevas: EmpresaCompleta[] = Array.from(porId.values())
      .slice(0, limite)
      .map((gr) =>
        construirEmpresaDesdeGoogle(gr, {
          fuente: "google_places_zona",
          sector: sector?.etiqueta,
          prioridadRrhh: sectorId === "ett",
        })
      );

    // ── 3. Email real + verificación MX, y a la caché ───────────────────
    await enriquecerEmpresas(nuevas);
    await guardarEnCache(nuevas, ciudad);

    // ── 4. Unir con lo cacheado: primero las que tienen email de verdad ──
    const peso: Record<string, number> = { alta: 0, media: 1, baja: 2 };
    const todas = [...cacheados, ...nuevas].sort(
      (a, b) =>
        peso[a.emailConfianza] - peso[b.emailConfianza] ||
        (b.googleRating ?? 0) - (a.googleRating ?? 0)
    );

    const conEmailFiable = todas.filter((e) => e.emailConfianza === "alta").length;
    console.log(
      `🏘️ Zona ${ciudad}/${sectorId || "general"}: ${todas.length} empresas (${nuevas.length} nuevas, ${conEmailFiable} con email verificado)`
    );

    return NextResponse.json({
      success: true,
      empresas: todas,
      total: todas.length,
      conEmailFiable,
      desdeCache: false,
    });
  } catch (error) {
    console.error("[empresas/zona] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error al buscar empresas de la zona" }, { status: 500 });
  }
}
