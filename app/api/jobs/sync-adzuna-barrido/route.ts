/**
 * /api/jobs/sync-adzuna-barrido
 *
 * Trae el catálogo de Adzuna paginando, SIN palabras clave ni ciudades.
 *
 * POR QUÉ EXISTE, SI YA HAY UN SINCRONIZADOR DE ADZUNA
 *
 * El de siempre (`sync-adzuna-global`) recorre combinaciones de palabra clave
 * por ciudad y de cada una pide **solo la página 1**. Está fijado en el código.
 * Cada dos horas vuelve a bajarse esas mismas primeras páginas: de las ~104.000
 * ofertas que traemos al día, solo 16.000 son nuevas. El 85% del gasto es
 * descargar otra vez lo mismo.
 *
 * Medido contra la API el 5 de septiembre de 2026:
 *
 *   - `results_per_page` se queda en 50 aunque pidas 100.
 *   - La página 1.000 SIGUE devolviendo 50 ofertas. No hay tope de paginación.
 *   - España tiene 123.888 ofertas en Adzuna; el Reino Unido 734.617; Alemania
 *     1.260.030; Estados Unidos 6.711.568.
 *   - El catálogo español entero cabe en 2.478 peticiones sin filtrar por nada.
 *   - Con `max_days_old=1` son 3.897 ofertas: **78 peticiones para todo lo que
 *     se ha publicado hoy en España**, frente a las ~300 de ahora que solo
 *     traen una muestra.
 *
 * Es decir: sin palabras clave se trae más con menos.
 *
 * DOS MODOS
 *
 *   dias=1  (por defecto)  Solo lo de hoy. Es el modo diario.
 *   dias=0                 El catálogo entero. Para llenar el hueco una vez.
 *
 * REANUDABLE
 *
 * Adzuna no publica su límite real y no manda cabeceras de cuota (comprobado:
 * la respuesta no trae ninguna cabecera de rate limit). Así que no se calcula
 * el límite: se guarda por qué página va en Redis y, si la cuota se agota a
 * mitad, la siguiente pasada sigue donde lo dejó. El cortacircuitos que ya
 * existe corta al primer 429 y aquí la página vuelve vacía, que es la señal de
 * parar.
 */
import { NextRequest, NextResponse } from "next/server";
import { barrerAdzuna } from "@/lib/job-search/sync-worker";
import { secretIguales } from "@/lib/secret-compare";
import { leerOffset, guardarOffset, offsetsDe } from "@/lib/job-search/offsets";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Los 19 países que cubre Adzuna. Ordenados poniendo delante el mercado propio
// y los destinos a los que emigra nuestra gente, no por volumen: el barrido
// completo tarda semanas en los países grandes y no queremos que España espere
// detrás de los 6,7 millones de Estados Unidos.
const PAISES = [
  "es", "de", "fr", "uk", "it", "nl", "ch", "be", "at",
  "us", "ca", "au", "nz", "pl", "sg", "br", "mx", "in", "za",
] as const;

// Clave propia en Redis: el barrido lleva su cuenta de páginas, que no tiene
// nada que ver con el desplazamiento de combinaciones del sincronizador viejo.
const FUENTE = "adzuna-barrido";

export async function GET() {
  return NextResponse.json({
    paises: PAISES,
    paginas: await offsetsDe(FUENTE, PAISES),
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (!secretIguales(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { country?: string; paginas?: number; dias?: number; desde?: number } = {};
  try { body = await req.json(); } catch { /* valores por defecto */ }

  const country = body.country || "es";
  // Tope de 60 páginas por llamada: a ~0,4 s cada una son 24 s, muy por debajo
  // de los 300 s de maxDuration incluso si la API va lenta.
  const paginas = Math.min(Math.max(body.paginas ?? 20, 1), 60);
  const dias = body.dias ?? 1;

  // El barrido diario empieza siempre por la página 1: lo de hoy es un conjunto
  // pequeño y completo. Solo el barrido del catálogo entero se reanuda.
  const desde = body.desde ?? (dias > 0 ? 1 : await leerOffset(FUENTE, country));

  const r = await barrerAdzuna(country, paginas, desde, dias);

  if (dias === 0) {
    await guardarOffset(FUENTE, country, r.siguientePagina);
  }

  return NextResponse.json({
    ...r,
    modo: dias > 0 ? `solo lo de los ultimos ${dias} dia(s)` : "catalogo completo",
  });
}
