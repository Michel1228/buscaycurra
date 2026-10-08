/**
 * lib/job-search/ofertas-publicas.ts — Ofertas de los servicios públicos de
 * empleo españoles, sacadas de sus datos abiertos.
 *
 * POR QUÉ. El 8 oct 2026 España, el mercado principal, tenía 65.124 ofertas de
 * 2,8 millones, el 70 % de una sola fuente (Adzuna) y ninguna de los servicios
 * públicos de empleo. Estas son ofertas reales y revisadas por la
 * administración, con enlace oficial para inscribirse.
 *
 *   · Lanbide (Euskadi): JSONP en Windows-1252, 712 ofertas ese día.
 *   · SEF Murcia: JSON, 264 ofertas, con fecha de fin de plazo. Detrás de un
 *     control antirrobots desde fuera; desde el servidor responde.
 *
 * LO QUE NO SE HACE, A PROPÓSITO:
 *   · No se pone empresa. Ninguna de las dos fuentes dice quién contrata, y
 *     con la empresa vacía el proceso que deduce correos de empresa
 *     (scripts/vps/extract-emails-fast.sh) no las toca. Poner "vía Lanbide"
 *     habría acabado deduciendo un correo de Lanbide y mandándole CVs.
 *   · No se pone correo de contacto. El de Murcia es de una oficina del SEF y
 *     solo para quien está inscrito fuera de Murcia, poniendo el número de
 *     oferta y el DNI en el asunto. Nuestro envío automático no hace eso: se
 *     solicitan por su enlace oficial, y las instrucciones van en el texto.
 *
 * CADUCIDAD. Lo que la fuente ya no publica se desactiva al sincronizar, pero
 * solo si la fuente respondió bien y con un número razonable de ofertas: un día
 * de caída no puede vaciar Euskadi.
 */
import { getPool } from "@/lib/db";
import { decodificar, tituloLegible } from "@/lib/cursos/plazas/fuentes";
import { detectCategoria } from "@/lib/job-search/sync-worker";

export type FuenteOfertas = "lanbide" | "sef-murcia";

export interface OfertaPublica {
  id: string;
  sourceName: string;
  titulo: string;
  descripcion: string;
  ciudad: string | null;
  provincia: string | null;
  url: string;
  publicada: Date | null;
  /** Fin de plazo; si la fuente no lo da, null y se pone uno prudente al guardar. */
  caduca: Date | null;
}

const FUENTES: Record<FuenteOfertas, { url: string; sourceName: string; minimo: number }> = {
  lanbide: {
    url: "https://apps.lanbide.euskadi.net/apps/OF_OFERTAS_ODE_JSON",
    sourceName: "LANBIDE",
    minimo: 100,
  },
  "sef-murcia": {
    url: "https://sefapps.carm.es/sefApps/rest/ofertas/ofertas",
    sourceName: "SEF_MURCIA",
    minimo: 40,
  },
};

export const TODAS_LAS_FUENTES_OFERTAS = Object.keys(FUENTES) as FuenteOfertas[];

function limpio(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\s+/g, " ").trim();
  return s && s !== "null" ? s : null;
}

/** dd/mm/aaaa → Date (a medianoche UTC), o null si no es una fecha válida. */
export function fechaDMA(v: unknown, finDelDia = false): Date | null {
  const m = String(v ?? "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const f = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1], finDelDia ? 23 : 0, finDelDia ? 59 : 0));
  return f.getUTCMonth() === +m[2] - 1 ? f : null;
}

/** HTML de la fuente a texto con saltos de línea, sin etiquetas. */
export function htmlATexto(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|div)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function capitalizarLugar(s: string | null): string | null {
  if (!s) return null;
  return s.toLocaleLowerCase("es").replace(/(^|[\s/(-])(\p{L})/gu, (_, a, b) => a + b.toLocaleUpperCase("es"));
}

export function leerLanbide(texto: string): OfertaPublica[] {
  const filas = JSON.parse(texto.trim().replace(/^[\w$]+\(/, "").replace(/\);?\s*$/, "")) as Record<string, string>[];
  return filas.flatMap(r => {
    const codigo = limpio(r.codigo);
    const titulo = limpio(r.desEmpleo);
    const url = limpio(r.url);
    if (!codigo || !titulo || !url?.startsWith("https://")) return [];
    return [{
      id: `lanbide-${codigo}`,
      sourceName: FUENTES.lanbide.sourceName,
      titulo: tituloLegible(titulo),
      descripcion: limpio(r.desPuesto) ?? "",
      ciudad: capitalizarLugar(limpio(r.municipio)),
      provincia: capitalizarLugar(limpio(r.provincia)),
      url,
      publicada: fechaDMA(r.fecPub),
      caduca: null,
    }];
  });
}

export function leerSefMurcia(texto: string): OfertaPublica[] {
  const filas = JSON.parse(texto) as any[];
  return filas.flatMap(r => {
    const codigo = limpio(r.numeroOferta);
    const titulo = limpio(r.descripcion);
    const url = limpio(r.urlDetalles);
    if (!codigo || !titulo) return [];
    return [{
      id: `sef-murcia-${codigo}`,
      sourceName: FUENTES["sef-murcia"].sourceName,
      titulo: tituloLegible(titulo),
      descripcion: htmlATexto(r.adicionales),
      ciudad: capitalizarLugar(limpio(r.municipio?.municipio)),
      provincia: capitalizarLugar(limpio(r.municipio?.provincia?.provincia)),
      url: url && /^https?:\/\//.test(url) ? url : "https://www.sefcarm.es/",
      publicada: fechaDMA(r.fechaDeInicio),
      caduca: fechaDMA(r.fechaDeFin, true),
    }];
  });
}

const LECTORES: Record<FuenteOfertas, (t: string) => OfertaPublica[]> = {
  lanbide: leerLanbide,
  "sef-murcia": leerSefMurcia,
};

export async function descargarOfertas(fuente: FuenteOfertas): Promise<OfertaPublica[]> {
  const res = await fetch(FUENTES[fuente].url, {
    headers: { "User-Agent": "BuscayCurra/1.0 (+https://buscaycurra.es; datos abiertos de empleo)" },
    signal: AbortSignal.timeout(90_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${fuente}: HTTP ${res.status}`);
  const texto = decodificar(new Uint8Array(await res.arrayBuffer()));
  if (/^\s*</.test(texto)) throw new Error(`${fuente}: devolvió una página en vez de datos (¿control antirrobots?)`);
  const ofertas = LECTORES[fuente](texto);
  const vistos = new Set<string>();
  return ofertas.filter(o => (vistos.has(o.id) ? false : (vistos.add(o.id), true)));
}

/** Días que se da por viva una oferta sin fecha de fin, si deja de sincronizarse. */
const VIDA_SIN_PLAZO_DIAS = 30;

export async function guardarOfertas(fuente: FuenteOfertas, ofertas: OfertaPublica[], inicio: Date): Promise<{
  guardadas: number; nuevas: number; retiradas: number; retiradaOmitida: boolean;
}> {
  const pool = getPool();
  let nuevas = 0;
  for (const o of ofertas) {
    const caduca = o.caduca ?? new Date(inicio.getTime() + VIDA_SIN_PLAZO_DIAS * 86400000);
    const { rows } = await pool.query<{ es_nueva: boolean }>(
      `INSERT INTO "JobListing" (id, title, company, description, sector, city, province, "sourceUrl", "sourceName",
                                 "isActive", "scrapedAt", "createdAt", "updatedAt", "expiresAt", country, categoria)
       VALUES ($1, $2, '', $3, 'OTRO'::"JobSector", $4, $5, $6, $7, true, $8, COALESCE($9, $8), $8, $10, 'es', $11)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title, description = EXCLUDED.description, city = EXCLUDED.city,
         province = EXCLUDED.province, "sourceUrl" = EXCLUDED."sourceUrl", "isActive" = true,
         "scrapedAt" = EXCLUDED."scrapedAt", "updatedAt" = EXCLUDED."updatedAt", "expiresAt" = EXCLUDED."expiresAt",
         categoria = COALESCE("JobListing".categoria, EXCLUDED.categoria)
       RETURNING (xmax = 0) AS es_nueva`,
      [o.id, o.titulo, o.descripcion.slice(0, 8000), o.ciudad, o.provincia, o.url, o.sourceName, inicio,
       o.publicada, caduca, detectCategoria(o.titulo)]
    );
    if (rows[0]?.es_nueva) nuevas++;
  }

  // Solo se retira lo que ya no publica una fuente que ha respondido entera.
  if (ofertas.length < FUENTES[fuente].minimo) {
    return { guardadas: ofertas.length, nuevas, retiradas: 0, retiradaOmitida: true };
  }
  const { rowCount } = await pool.query(
    `UPDATE "JobListing" SET "isActive" = false, "updatedAt" = NOW()
      WHERE "sourceName" = $1 AND "isActive" AND "scrapedAt" < $2`,
    [FUENTES[fuente].sourceName, inicio]
  );
  return { guardadas: ofertas.length, nuevas, retiradas: rowCount ?? 0, retiradaOmitida: false };
}
