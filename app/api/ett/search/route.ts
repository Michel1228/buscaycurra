/**
 * POST /api/ett/search
 *
 * Busca ETTs (Empresas de Trabajo Temporal) por ciudad.
 *
 * Flujo:
 *   1. Se sitúa la zona en el mapa (OpenStreetMap, gratis): país, para buscar con
 *      sus palabras, y coordenadas, para descartar lo que esté lejos
 *   2. Caché: si ya hay ETTs guardadas a menos de 35 km de ahí, salen de ahí
 *      (gratis). Es por cercanía y no por el nombre del pueblo a propósito: quien
 *      busca en Fustiñana quiere las de Tudela
 *   3. Text Search con los términos del país ("ETT" aquí, "Zeitarbeitsfirma" en
 *      Alemania), sin pedir detalles todavía
 *   4. Se descartan las lejanas y se piden los detalles SOLO de las que quedan
 *   5. Si Google no responde (sin facturación o sin cuota) → respaldo GRATIS
 *      con OpenStreetMap/Nominatim, que da nombre, dirección, web y teléfono
 *      (sin valoraciones ni fotos, que OSM no tiene)
 *   6. Email: real de la web si se encuentra; si no, patrón + verificación MX
 *
 * Acepta: { city: "Madrid" }  ·  también "Cabanillas, Navarra" para desambiguar
 * Devuelve: { success: true, empresas: EmpresaCompleta[], zona?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import {
  buscarTextoSinDetalles,
  detallesDeSitios,
  distanciaKm,
  situarZona,
  type GooglePlaceResult,
  type SitioBasico,
} from "@/lib/google-places";
import { terminosEtt } from "@/lib/ett-terminos";
import { buscarNegociosZonaOSM } from "@/lib/osm-places";
import { construirEmpresaDesdeGoogle, enriquecerEmpresas, type EmpresaCompleta } from "@/lib/empresa-datos";
import { buscarEnCacheCerca, buscarEnCachePorZona, guardarEnCache } from "@/lib/empresas-cache";
import { getUserId } from "@/lib/auth-server";
import { secretIguales } from "@/lib/secret-compare";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Etiqueta con la que se guardan en la caché (la misma que usa /api/empresas/zona). */
const SECTOR_ETT = "ETT / Recursos Humanos";
/** Lo que se considera "aquí al lado". */
const RADIO_CERCA_KM = 35;
/** Hasta dónde se estira en pueblos pequeños antes de decir que no hay nada. */
const RADIO_LEJOS_KM = 120;
/** Tope de detalles por búsqueda: cada uno es una llamada de pago a Google. */
const MAX_DETALLES = 12;

/**
 * ¿El nombre dice que es una agencia de empleo?
 *
 * Las palabras salen de los propios términos del país, así que vale para los 26
 * sin listas aparte: en España "trabajo", "temporal", "empleo", "ETT"; en
 * Alemania "zeitarbeitsfirma", "personalvermittlung". Se añaden las marcas
 * internacionales, que se llaman igual en todas partes y no llevan ninguna de
 * esas palabras en el rótulo (Adecco, Randstad, Manpower...).
 */
const MARCAS_ETT = ["adecco", "randstad", "manpower", "eurofirms", "synergie", "gi group",
  "iman", "marlex", "nortempo", "proman", "temps", "crit", "hays", "robert half",
  "page personnel", "staffmatch", "ananda", "temporing", "navarwork"];

function nombreDeAgencia(nombre: string, terminos: string[]): boolean {
  const limpio = nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const palabras = terminos
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((p) => p.length >= 3 && !["empresa", "que", "del", "las", "los", "para"].includes(p));
  return palabras.some((p) => limpio.includes(p)) || MARCAS_ETT.some((m) => limpio.includes(m));
}

export async function POST(request: NextRequest) {
  let kmPorId = new Map<string, number>();
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

    // Sin clave de Google no se corta: más abajo hay respaldo con OpenStreetMap.

    console.log(`🏢 Buscando ETTs en: "${city}"`);

    // ── 1. Situar la zona: de qué país es y dónde cae exactamente ───────
    // Va antes que la caché porque la caché ahora es geográfica: quien busca en
    // Fustiñana quiere las ETTs de Tudela, y guardarlas como "de Fustiñana"
    // vaciaba la caché de Tudela.
    const zona = await situarZona(city);

    // ── 2. La caché ─────────────────────────────────────────────────────
    // Se guardaban los resultados "para no repetir la misma ciudad", pero nunca
    // se leían: cada búsqueda de Tudela volvía a pagar ~33 llamadas a Google por
    // las mismas once ETTs. Las entradas caducan solas a los 30 días.
    const cacheados: EmpresaCompleta[] = zona
      ? await buscarEnCacheCerca(zona.lat, zona.lng, RADIO_CERCA_KM, SECTOR_ETT, 30)
      : await buscarEnCachePorZona(city, SECTOR_ETT, 30);
    if (cacheados.length >= 8) {
      return NextResponse.json({
        success: true,
        empresas: cacheados,
        zona: zona?.descripcion,
        desdeCache: true,
      });
    }

    // ── 3. Buscar con las palabras del país (aquí "ETT", en Alemania
    //       "Zeitarbeitsfirma") y cerca de esas coordenadas ──────────────
    const terminos = terminosEtt(zona?.paisCodigo);
    const queries = terminos.map((t) => `${t} ${city}`);

    // El primer término es el específico ("ETT empresa de trabajo temporal",
    // "Zeitarbeitsfirma"): lo que devuelve son ETTs de verdad. El segundo es
    // genérico ("agencia de empleo") y en un pueblo pequeño Google rellena con
    // lo que sea: buscando en Fustiñana colaba el ayuntamiento, una empresa de
    // congelados y una de renovables. De ese segundo solo se aceptan las que se
    // llaman como lo que son.
    const porId = new Map<string, SitioBasico>();
    const esAgencia = new Map<string, boolean>();
    if (process.env.GOOGLE_PLACES_API_KEY) {
      const tandas = await Promise.all(
        queries.map((q) =>
          buscarTextoSinDetalles(q, zona ? { lat: zona.lat, lng: zona.lng, radioMetros: RADIO_CERCA_KM * 1000 } : undefined)
            .catch(() => [] as SitioBasico[])
        )
      );
      tandas.forEach((tanda, indice) => {
        for (const sitio of tanda) {
          const segura = indice === 0 || nombreDeAgencia(sitio.name, terminos);
          if (!porId.has(sitio.place_id)) {
            porId.set(sitio.place_id, sitio);
            esAgencia.set(sitio.place_id, segura);
          } else if (segura) {
            esAgencia.set(sitio.place_id, true);
          }
        }
      });
    }

    // ── 4. Fuera las que no están donde ha pedido el usuario ────────────
    // Sin esto, "Berlin" devolvía tres de cinco resultados en Barcelona (la
    // consulta iba en español y Google mezclaba países), y nadie lo notaba.
    let candidatos = Array.from(porId.values());
    if (zona) {
      const conDistancia = candidatos
        .map((s) => ({
          sitio: s,
          km: s.lat != null && s.lng != null ? distanciaKm(zona, { lat: s.lat, lng: s.lng }) : null,
        }))
        .filter((c) => c.km !== null) as Array<{ sitio: SitioBasico; km: number }>;

      // En un pueblo las ETTs están en la cabecera de comarca: si cerca no hay
      // bastantes, se amplía en vez de decir "no hay nada".
      const cerca = conDistancia.filter((c) => c.km <= RADIO_CERCA_KM);
      const elegidos = (cerca.length >= 5 ? cerca : conDistancia.filter((c) => c.km <= RADIO_LEJOS_KM))
        .sort((a, b) => a.km - b.km);
      kmPorId = new Map(elegidos.map((c) => [c.sitio.place_id, c.km]));
      candidatos = elegidos.map((c) => c.sitio);
    }

    // Delante las que son agencias seguras; las dudosas solo se enseñan si sin
    // ellas quedaría casi vacío, y siempre detrás.
    const seguras = candidatos.filter((c) => esAgencia.get(c.place_id));
    const dudosas = candidatos.filter((c) => !esAgencia.get(c.place_id));
    candidatos = seguras.length >= 5 ? seguras : [...seguras, ...dudosas];

    // ── 5. Detalles solo de las que se van a enseñar (cada uno se paga) ──
    const yaEnCache = new Set(cacheados.map((e) => e.placeId));
    const idsNuevos = candidatos.map((c) => c.place_id).filter((id) => !yaEnCache.has(id)).slice(0, MAX_DETALLES);
    let places: GooglePlaceResult[] = idsNuevos.length ? await detallesDeSitios(idsNuevos) : [];

    // Respaldo gratuito si Google no responde (sin facturación o sin cuota).
    if (!places.length && !cacheados.length) {
      const porIdOsm = new Map<string, GooglePlaceResult>();
      for (const tipo of terminos) {
        const rs = await buscarNegociosZonaOSM(tipo, city, 15).catch(() => [] as GooglePlaceResult[]);
        for (const place of rs) {
          if (!porIdOsm.has(place.place_id)) porIdOsm.set(place.place_id, place);
        }
        if (porIdOsm.size >= 15) break;
      }
      places = Array.from(porIdOsm.values());
    }

    if (!places.length && !cacheados.length) {
      return NextResponse.json({
        success: true,
        empresas: [],
        zona: zona?.descripcion,
        mensaje: zona
          ? `No se encontraron ETTs cerca de ${zona.descripcion}. Prueba con la ciudad grande más cercana.`
          : `No se encontraron ETTs en "${city}". Prueba escribiendo también la provincia.`,
      });
    }

    // ── 6. Construir resultados ────────────────────────────────────────
    // Las coordenadas vienen de la búsqueda de texto (los detalles no las
    // traen): son las que hacen que la caché funcione por cercanía.
    const coordsPorId = new Map(
      Array.from(porId.values())
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => [s.place_id, { lat: s.lat as number, lon: s.lng as number }])
    );
    const nuevas: EmpresaCompleta[] = places.map((gr) => ({
      ...construirEmpresaDesdeGoogle(gr, {
        fuente: "google_places_ett",
        sector: SECTOR_ETT,
        prioridadRrhh: true, // en una ETT, rrhh@/seleccion@ es lo más probable
      }),
      lat: coordsPorId.get(gr.place_id)?.lat ?? null,
      lon: coordsPorId.get(gr.place_id)?.lon ?? null,
    }));

    // ── 7. Email real de la web y, si no, verificación MX ──────────────
    await enriquecerEmpresas(nuevas);

    // ── 8. A la caché: Places es de pago, no repetir la misma ciudad ────
    await guardarEnCache(nuevas, city);

    // Las que tienen email comprobado primero: es donde el CV tiene recorrido.
    // A igualdad, la más cercana: en un pueblo, una ETT a 7 km sirve y una a
    // 90 km casi nunca.
    const peso: Record<string, number> = { alta: 0, media: 1, baja: 2 };
    const empresas = [...cacheados, ...nuevas]
      .map((e) => ({ ...e, distanciaKm: kmPorId.get(e.placeId ?? "") ?? null }))
      .sort(
        (a, b) =>
          peso[a.emailConfianza] - peso[b.emailConfianza] ||
          (a.distanciaKm ?? 9999) - (b.distanciaKm ?? 9999) ||
          (b.googleRating ?? 0) - (a.googleRating ?? 0)
      );

    console.log(`✅ ${empresas.length} ETTs en ${zona?.descripcion || city} (${empresas.filter(e => e.emailConfianza === "alta").length} con email verificado)`);

    return NextResponse.json({ success: true, empresas, zona: zona?.descripcion });
  } catch (error) {
    console.error("[ett/search] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error al buscar ETTs" }, { status: 500 });
  }
}
