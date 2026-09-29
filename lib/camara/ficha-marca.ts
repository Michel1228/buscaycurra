/**
 * lib/camara/ficha-marca.ts — De la foto de un producto a la empresa que lo hace.
 *
 * POR QUÉ EXISTE. La idea de la cámara es: haces una foto a unas zapatillas y la
 * aplicación te dice quién las hace, cómo se trabaja allí y dónde, y te lo deja
 * guardado. Probado el 29 sep 2026 con fotos reales, el reconocimiento de la
 * imagen acertaba siempre (Nike Air Max, Adidas, Font Vella, Zara), pero lo de
 * después estaba roto:
 *
 *   - Nike → devolvía "Forum Sport Tudela", una tienda de deportes, como si
 *     fuera Nike. Adidas → Intersport.
 *   - Font Vella → "Fuente la Font Vella", una fuente de Girona.
 *   - "5 ofertas cerca de Tudela" que eran un solador en Berlín, una tienda en
 *     Núremberg y un profesor en Plymouth: se buscaba la palabra "textil" en los
 *     títulos de todo el mundo.
 *
 * Aquí se separan las tres cosas que antes se mezclaban: QUIÉN es la empresa,
 * DÓNDE tiene tiendas cerca de ti y QUÉ ofertas reales tiene.
 *
 * REGLA DE VERDAD. Los datos de la empresa los da un modelo de IA, que puede
 * equivocarse. Por eso cada enlace (web y portal de empleo) se COMPRUEBA antes
 * de enseñarlo: si no existe, no sale. En la prueba, el modelo barato se inventó
 * "careers.inditex.com" (no existe) y "recrutement.decathlon.fr" para la
 * Decathlon española; gpt-5.6-luna acertó las ocho marcas probadas, incluidas
 * Bezoya → Calidad Pascual y Solán de Cabras → Mahou San Miguel.
 */
import { get, set } from "@/lib/cache/redis-client";
import { getPool } from "@/lib/db";
import {
  buscarTextoSinDetalles,
  detallesDeSitios,
  distanciaKm,
  type SitioBasico,
} from "@/lib/google-places";
import { construirEmpresaDesdeGoogle, enriquecerEmpresas, type EmpresaCompleta } from "@/lib/empresa-datos";
import { guardarEnCache } from "@/lib/empresas-cache";

export interface FichaMarca {
  marca: string;
  empresa: string | null;
  grupo: string | null;
  paisOrigen: string | null;
  /** Solo si se ha comprobado que responde. */
  webOficial: string | null;
  /** Solo si se ha comprobado que responde. */
  portalEmpleo: string | null;
  presenciaEspana: string | null;
  tieneTiendasPropias: boolean;
  busquedaTiendas: string | null;
  puestosHabituales: string[];
}

export interface OfertaMarca {
  id: string;
  titulo: string;
  empresa: string;
  ciudad: string;
}

export interface TiendaCerca {
  empresa: EmpresaCompleta;
  km: number;
}

/** Un mes: quién es la dueña de una marca no cambia de un día para otro. */
const CACHE_SEGUNDOS = 30 * 24 * 3600;
const CACHE_VERSION = "v1";

function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * ¿Existe de verdad esta web?
 *
 * 404, 410 o que el dominio no exista (el fetch falla) = inventada: fuera.
 * 403 o 429 NO cuentan como inventada: webs grandes como adidas.com o
 * solandecabras.es existen pero bloquean a los robots, y quitarlas sería
 * esconder un dato bueno.
 */
async function webExiste(url: string | null | undefined): Promise<string | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BuscayCurra/1.0; +https://buscaycurra.es)" },
    });
    if (res.status === 404 || res.status === 410 || res.status >= 500) return null;
    return url;
  } catch {
    return null;
  }
}

const PROMPT_FICHA = (marca: string, objeto: string) => `Marca de un producto fotografiado: "${marca}" (el objeto es: ${objeto}).
Devuelve SOLO un JSON con lo que sepas con seguridad. Si no lo sabes con seguridad, pon null. NO inventes URLs: una web inventada manda a alguien a mandar su currículum a ninguna parte.
{
  "empresa": "razón social o nombre de la empresa dueña de la marca",
  "grupo": "grupo empresarial al que pertenece, o null",
  "pais_origen": "país",
  "web_oficial": "https://... dominio principal",
  "portal_empleo": "https://... página oficial de empleo, o null",
  "presencia_espana": "dónde está en España: oficinas, fábricas o plantas (ciudades), o null",
  "tiene_tiendas_propias": true o false,
  "busqueda_tiendas": "texto para buscar SUS tiendas propias en Google Maps (p. ej. \\"Nike Store\\"), o null si no tiene",
  "puestos_habituales": ["3-5 puestos que suele contratar en España"]
}`;

/**
 * Pregunta a la IA quién hay detrás de la marca. Primero gpt-5.6-luna, que es
 * el que acertó en la prueba; si falla, gpt-4o-mini, que es peor en datos pero
 * mejor que nada (y los enlaces que se invente se caen en la comprobación).
 */
async function preguntarFicha(marca: string, objeto: string): Promise<Record<string, unknown> | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  for (const modelo of ["gpt-5.6-luna", "gpt-4o-mini"]) {
    const cuerpo: Record<string, unknown> = {
      model: modelo,
      messages: [{ role: "user", content: PROMPT_FICHA(marca, objeto) }],
      response_format: { type: "json_object" },
    };
    if (modelo.startsWith("gpt-5")) {
      // Razona antes de contestar y el razonamiento gasta del mismo presupuesto.
      cuerpo.max_completion_tokens = 1200;
      cuerpo.reasoning_effort = "low";
    } else {
      cuerpo.max_tokens = 600;
      cuerpo.temperature = 0;
    }
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        console.warn(`[ficha-marca] ${modelo} HTTP ${res.status}`);
        continue;
      }
      const datos = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const texto = datos.choices?.[0]?.message?.content;
      if (!texto) continue;
      return JSON.parse(texto) as Record<string, unknown>;
    } catch (e) {
      console.warn(`[ficha-marca] ${modelo}:`, (e as Error).message);
    }
  }
  return null;
}

const texto = (v: unknown): string | null =>
  typeof v === "string" && v.trim() && v.trim().toLowerCase() !== "null" ? v.trim() : null;

/** Quién es la empresa de una marca. Con caché de un mes por marca. */
export async function investigarMarca(marca: string, objeto: string): Promise<FichaMarca | null> {
  const clave = `camara:marca:${CACHE_VERSION}:${slug(marca)}`;
  try {
    const guardada = await get(clave);
    if (guardada) return JSON.parse(guardada) as FichaMarca;
  } catch { /* sin caché, se pregunta */ }

  const bruto = await preguntarFicha(marca, objeto);
  if (!bruto) return null;

  const [webOficial, portalEmpleo] = await Promise.all([
    webExiste(texto(bruto.web_oficial)),
    webExiste(texto(bruto.portal_empleo)),
  ]);

  const ficha: FichaMarca = {
    marca,
    empresa: texto(bruto.empresa),
    grupo: texto(bruto.grupo),
    paisOrigen: texto(bruto.pais_origen),
    webOficial,
    portalEmpleo,
    presenciaEspana: texto(bruto.presencia_espana),
    tieneTiendasPropias: bruto.tiene_tiendas_propias === true,
    busquedaTiendas: texto(bruto.busqueda_tiendas),
    puestosHabituales: Array.isArray(bruto.puestos_habituales)
      ? (bruto.puestos_habituales as unknown[]).map((p) => texto(p)).filter((p): p is string => !!p).slice(0, 5)
      : [],
  };

  // Solo se guarda si hay algo que valga la pena: una ficha vacía en caché
  // impediría volver a intentarlo durante un mes.
  if (ficha.empresa) {
    try { await set(clave, ficha, CACHE_SEGUNDOS); } catch { /* sin caché */ }
  }
  return ficha;
}

/**
 * Ofertas reales de la marca, primero las del país de quien hace la foto.
 *
 * Se busca por el NOMBRE de la empresa (Nike, Aguas Danone, Calidad Pascual…),
 * nunca por palabras del sector: "textil" casaba con un solador de Berlín.
 */
export async function ofertasDeLaMarca(
  nombres: string[],
  paisCodigo: string
): Promise<{ enPais: OfertaMarca[]; totalPais: number; totalFuera: number }> {
  const vacio = { enPais: [], totalPais: 0, totalFuera: 0 };
  // Nombres de 3+ letras, sin la forma jurídica, que en la base no aparece igual.
  const limpios = [...new Set(
    nombres
      .map((n) => n.replace(/,?\s*(S\.?A\.?U?\.?|S\.?L\.?U?\.?|Inc\.?|AG|GmbH|Ltd\.?|S\.A\.S\.?)\s*$/i, "").trim())
      .filter((n) => n.length >= 3)
  )];
  if (!limpios.length) return vacio;

  const patrones = limpios.map((n) => `%${n}%`);
  const pais = (paisCodigo || "es").toLowerCase();
  try {
    const pool = getPool();
    // DISTINCT ON: la misma oferta llega a veces por dos fuentes, y "NIKE UNITE
    // ZARAGOZA" salía dos veces seguidas en la lista.
    const { rows } = await pool.query<{ id: string; title: string; company: string; city: string | null; en_pais: boolean; total_pais: string; total: string }>(
      `WITH m AS (
         SELECT DISTINCT ON (lower(title), lower(company), lower(coalesce(city, '')))
                id, title, company, city, (country = $2) AS en_pais, "scrapedAt"
           FROM "JobListing"
          WHERE "isActive" = true AND company ILIKE ANY($1)
          ORDER BY lower(title), lower(company), lower(coalesce(city, '')), "scrapedAt" DESC
       )
       SELECT id, title, company, city, en_pais,
              count(*) FILTER (WHERE en_pais) OVER ()::text AS total_pais,
              count(*) OVER ()::text AS total
         FROM m
        ORDER BY en_pais DESC, "scrapedAt" DESC
        LIMIT 5`,
      [patrones, pais]
    );
    const totalPais = parseInt(rows[0]?.total_pais || "0", 10);
    const total = parseInt(rows[0]?.total || "0", 10);
    return {
      enPais: rows.filter((r) => r.en_pais).map((r) => ({
        id: r.id, titulo: r.title, empresa: r.company, ciudad: r.city || "",
      })),
      totalPais,
      totalFuera: Math.max(0, total - totalPais),
    };
  } catch (e) {
    console.warn("[ficha-marca] ofertas:", (e as Error).message);
    return vacio;
  }
}

/**
 * Tiendas cerca de quien hace la foto, en DOS grupos que no se mezclan:
 *
 *  - propias: llevan la marca en el nombre (Nike Store, Nike Factory Store).
 *  - queLaVenden: las demás (Intersport, la zapatería del centro).
 *
 * En la primera versión salían todas como "sus tiendas", y para Nike en Tudela
 * eran Intersport y dos tiendas de deportes. Eso no es Nike; pero sí son sitios
 * cercanos que venden la marca y contratan, así que se enseñan con su nombre.
 * Máximo 3 en total, las más cercanas.
 */
export async function tiendasDeLaMarca(
  marca: string,
  zona: { lat: number; lng: number }
): Promise<{ propias: TiendaCerca[]; queLaVenden: TiendaCerca[] }> {
  const vacio = { propias: [] as TiendaCerca[], queLaVenden: [] as TiendaCerca[] };
  const RADIO_KM = 60;
  try {
    const sitios = await buscarTextoSinDetalles(`${marca} tienda`, { ...zona, radioMetros: RADIO_KM * 1000 });
    const conKm = sitios
      .filter((s): s is SitioBasico & { lat: number; lng: number } => s.lat != null && s.lng != null)
      .map((s) => ({ sitio: s, km: distanciaKm(zona, { lat: s.lat, lng: s.lng }) }))
      .filter((c) => c.km <= RADIO_KM)
      .sort((a, b) => a.km - b.km)
      .slice(0, 3);
    if (!conKm.length) return vacio;

    const detalles = await detallesDeSitios(conKm.map((c) => c.sitio.place_id));
    const empresas = detalles.map((d) =>
      construirEmpresaDesdeGoogle(d, { fuente: "camara_tienda_marca", sector: "Comercio", prioridadRrhh: true })
    );
    await enriquecerEmpresas(empresas);

    const km = new Map(conKm.map((c) => [c.sitio.place_id, c.km]));
    const marcaNorm = slug(marca);
    const todas = empresas
      .map((e) => ({ empresa: e, km: km.get(e.placeId ?? "") ?? 999 }))
      .sort((a, b) => a.km - b.km);
    return {
      propias: todas.filter((t) => slug(t.empresa.nombre).includes(marcaNorm)),
      queLaVenden: todas.filter((t) => !slug(t.empresa.nombre).includes(marcaNorm)),
    };
  } catch (e) {
    console.warn("[ficha-marca] tiendas:", (e as Error).message);
    return vacio;
  }
}

/**
 * "Rastrear lo capturado": la empresa de la marca queda guardada en la caché de
 * empresas, así que a partir de ahora sale en el buscador de empresas y se le
 * puede mandar el CV sin volver a hacer la foto. Las tiendas cercanas también se
 * guardan (ya con su correo, si lo tenían en la web).
 */
export async function guardarLoCapturado(
  ficha: FichaMarca,
  sector: string,
  tiendas: TiendaCerca[],
  ciudad: string
): Promise<void> {
  try {
    if (ficha.empresa) {
      const empresa: EmpresaCompleta = {
        placeId: `marca:${slug(ficha.marca)}`,
        nombre: ficha.empresa,
        dominio: ficha.webOficial ? new URL(ficha.webOficial).hostname.replace(/^www\./, "") : null,
        urlWeb: ficha.webOficial,
        emailRrhh: null,
        emailContacto: null,
        emailsExtraidos: [],
        emailConfianza: "baja",
        telefono: null,
        paginaEmpleo: ficha.portalEmpleo,
        descripcion: [ficha.grupo && `Grupo ${ficha.grupo}`, ficha.presenciaEspana].filter(Boolean).join(" · ") || null,
        sector,
        linkedin: null,
        twitter: null,
        instagram: null,
        fuente: "camara_marca",
        fotos: [],
        abiertoAhora: null,
        horario: null,
        googleAddress: ficha.presenciaEspana,
      };
      await guardarEnCache([empresa]);
    }
    if (tiendas.length) {
      await guardarEnCache(tiendas.map((t) => t.empresa), ciudad || undefined);
    }
  } catch (e) {
    console.warn("[ficha-marca] guardar:", (e as Error).message);
  }
}
