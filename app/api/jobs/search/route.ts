/**
 * /api/jobs/search - Busqueda paginada en la BD local
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { buscarOfertasReales } from "@/lib/job-search/real-search";

export const dynamic = "force-dynamic";

const ACCENT_FROM = "áéíóúñüÁÉÍÓÚÑÜàèìòùÀÈÌÒÙ";
const ACCENT_TO   = "aeiounuAEIOUNUaeiouAEIOU";

// Normaliza una cadena quitando acentos (para comparar ciudad sin tildes)
function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ñ/gi, "n").replace(/ü/gi, "u");
}

// Clausula SQL insensible a acentos usando translate() de Postgres
function cityLike(col: string, idx: number): string {
  return `translate(${col}, '${ACCENT_FROM}', '${ACCENT_TO}') ILIKE $${idx}`;
}


/**
 * Convierte un término en una expresión regular de Postgres con límite de
 * palabra (\m = inicio, \M = fin).
 *
 * Con ILIKE '%conductor%' salían 255 ofertas de SEMIconductor: puestos de
 * ingeniería en una búsqueda de chófer. Verificado que `~*` con límite de
 * palabra SIGUE usando el índice trigram (Bitmap Index Scan), así que no
 * cuesta rendimiento.
 */
function palabraExacta(termino: string): string {
  // Escapar lo que Postgres interpretaría como sintaxis de expresión regular
  const limpio = termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return "\\m" + limpio + "\\M";
}

function rowToOferta(j: Record<string, unknown>, location: string, userSkills: string[] = []) {
  let match = 0;
  const offerKeywords: string[] = Array.isArray(j.keywords) ? j.keywords as string[] : [];
  const title = (j.title as string) || "";
  const description = ((j.description as string) || "").toLowerCase();
  const company = ((j.company as string) || "").toLowerCase();
  const fullText = `${title} ${description} ${company}`.toLowerCase();

  if (userSkills.length > 0 && offerKeywords.length > 0) {
    const matched = offerKeywords.filter(kw =>
      userSkills.some(skill => skill.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(skill.toLowerCase()))
    );
    match = Math.round((matched.length / Math.max(offerKeywords.length, 1)) * 100);
  } else if (userSkills.length > 0) {
    const matched = userSkills.filter(skill => fullText.includes(skill.toLowerCase()));
    match = Math.round((matched.length / Math.max(userSkills.length, 1)) * 100);
  }

  return {
    id: j.id,
    titulo: title,
    empresa: company || "Ver en oferta",
    ubicacion: (j.city as string) || (j.province as string) || location,
    salario: (j.salary as string) && (j.salary as string) !== "Ver en oferta" ? (j.salary as string) : "",
    descripcion: description.slice(0, 200),
    fuente: j.sourcename,
    url: j.sourceurl,
    fecha: j.scrapedat,
    keywords: offerKeywords,
    match: match > 0 ? match : undefined,
    // El email ya estaba guardado en la oferta (78% de las vivas lo tienen),
    // pero no se devolvia, asi que la tarjeta lo pedia a /api/company/extract
    // por el nombre de la empresa y, si eso fallaba, mostraba "sin email aun".
    emailEmpresa: (j.contactemail as string) || undefined,
    emailConfianza: (j.contactemailconfianza as string) || undefined,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword  = (searchParams.get("keyword")  || "").trim();
  const location = (searchParams.get("location") || "").trim();
  const country  = (searchParams.get("country")  || "").trim();
  const categoria = (searchParams.get("categoria") || "").trim(); // au_pair | live_in_nanny
  // Tope de página: sin él, page=100000 → OFFSET gigante que Postgres materializa
  // y descarta en cada request (DoS de BD barato). 200 páginas × 500 = 100k resultados.
  const page     = Math.min(200, Math.max(1, parseInt(searchParams.get("page") || "1")));
  const jornada      = searchParams.get("jornada") || "";
  const experiencia  = searchParams.get("experiencia") || "";
  const salarioMin   = parseInt(searchParams.get("salarioMin") || "0");
  const salarioMax   = parseInt(searchParams.get("salarioMax") || "0");
  // Antes era 500 fijo y se ignoraba lo que pidiera el cliente: cada busqueda
  // devolvia 500 filas aunque la pantalla mostrara 20. Ahora se respeta el
  // parametro, con 100 por defecto y 200 de tope.
  const limit    = Math.min(parseInt(searchParams.get("limit") || "100", 10) || 100, 200);
  const offset   = (page - 1) * limit;

  // Keywords especificas por categoria (mismas que en /api/au-pair/ofertas)
  const NANNY_EXCLUSIONS = `title NOT ILIKE '%administrative%' AND title NOT ILIKE '%assistant%' AND title NOT ILIKE '%apprentice%' AND title NOT ILIKE '%teacher%' AND title NOT ILIKE '%support%' AND title NOT ILIKE '%coordinator%' AND title NOT ILIKE '%substitute%' AND title NOT ILIKE '%manager%' AND title NOT ILIKE '%director%' AND title NOT ILIKE '%supervisor%' AND title NOT ILIKE '%specialist%' AND title NOT ILIKE '%officer%' AND title NOT ILIKE '%receptionist%' AND title NOT ILIKE '%sales%' AND title NOT ILIKE '%marketing%' AND title NOT ILIKE '%payroll%' AND title NOT ILIKE '%accountant%' AND title NOT ILIKE '%clerk%' AND title NOT ILIKE '%secretary%' AND title NOT ILIKE '%office%' AND title NOT ILIKE '%reception%'`;
  const CATEGORIA_KEYWORDS: Record<string, string> = {
    au_pair: `(title ILIKE '%au pair%' OR title ILIKE '%aupair%' OR title ILIKE '%niñera%' OR title ILIKE '%canguro%' OR (title ILIKE '%nanny%' AND ${NANNY_EXCLUSIONS}))`,
    live_in_nanny: `(title ILIKE '%live in nanny%' OR title ILIKE '%live-in nanny%' OR title ILIKE '%live-in caregiver%' OR title ILIKE '%live in caregiver%' OR title ILIKE '%niñera interna%' OR title ILIKE '%nanny interna%' OR title ILIKE '%full-time nanny%' OR title ILIKE '%professional nanny%' OR title ILIKE '%nanny housekeeper%' OR title ILIKE '%nanny/housekeeper%' OR title ILIKE '%live out nanny%' OR title ILIKE '%nanny live%' OR title ILIKE '%cuidador interno%' OR title ILIKE '%cuidadora interna%' OR (title ILIKE '%nanny%' AND ${NANNY_EXCLUSIONS}))`,
  };

  if (!keyword && !location && !country && !categoria) {
    return NextResponse.json({ error: "Debes introducir al menos una palabra clave, ubicacion o pais" }, { status: 400 });
  }

  let userSkills: string[] = [];
  try {
    const skillsHeader = request.headers.get("x-user-skills");
    if (skillsHeader) {
      userSkills = skillsHeader.split(",").map(s => s.trim()).filter(Boolean);
    }
  } catch { /* ignorar */ }

  try {
    const pool = getPool();
    const params: (string | boolean | number)[] = [true];
    // Solo ofertas vivas: isActive Y no caducadas. Sin este guard de expiresAt la
    // búsqueda servía ~1,9M ofertas caducadas (expiresAt en el pasado) como si
    // fueran válidas → la app parecía desfasada. NULL = sin fecha conocida, se deja pasar.
    const conditions: string[] = ['"isActive" = $1', '("expiresAt" > NOW() OR "expiresAt" IS NULL)'];
    let idx = 2;

    // Keyword: si hay categoria, la categoria YA filtra — el keyword es redundante
    // (evita que "au pair" no matchee ofertas con "nanny" en el titulo)
    // Se guardan DOS versiones del filtro de palabra clave, ligera y completa.
    //
    // Buscar en `description` obliga a Postgres a recorrer los 3,5 millones de
    // filas: hay indice trigram sobre title, city y province, pero NO sobre
    // description (haria falta uno de 1-2 GB, solo el texto ya ocupa 1.100 MB).
    // Medido en produccion con "camarero":
    //    title + description -> Parallel Seq Scan, 11.566 ms
    //    solo title          -> Bitmap Index Scan, milisegundos
    //
    // Asi que primero se busca por titulo y empresa, que va por indice, y solo
    // si no salen resultados suficientes se repite ampliando a la descripcion.
    // La inmensa mayoria de las busquedas se resuelven en la primera pasada.
    let condicionKeywordLigera = "";
    let condicionKeywordCompleta = "";
    if (keyword && !categoria) {
      const STOP_WORDS = new Set(["de", "la", "el", "en", "del", "las", "los", "un", "una", "y", "o", "a", "para", "por", "con", "sin", "que", "es", "se", "no", "al", "lo", "le", "the", "of", "in", "and", "to", "for", "a"]);
      const words = keyword.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()));
      if (words.length > 1) {
        const ligeras: string[] = [];
        const completas: string[] = [];
        for (const w of words) {
          params.push(`%${w}%`);
          const i = idx++;
          ligeras.push(`(title ILIKE $${i} OR company ILIKE $${i})`);
          completas.push(`(title ILIKE $${i} OR description ILIKE $${i} OR company ILIKE $${i})`);
        }
        condicionKeywordLigera = `(${ligeras.join(" AND ")})`;
        condicionKeywordCompleta = `(${completas.join(" AND ")})`;
      } else {
        // Se busca el termino Y sus equivalentes en otros idiomas. Sin esto,
        // "camarero en Paris" no encontraba nada (alli las ofertas dicen
        // "serveur") y acababa cayendo en el respaldo por ciudad, que devolvia
        // ingenieros y desarrolladores como si fueran camareros.
        const { expandirPuesto } = await import("@/lib/job-search/sinonimos-puesto");
        const variantes = expandirPuesto(keyword);
        const orsLigeros: string[] = [];
        const orsCompletos: string[] = [];
        for (const v of variantes) {
          params.push(palabraExacta(v));
          const i = idx++;
          orsLigeros.push(`title ~* $${i} OR company ~* $${i}`);
          orsCompletos.push(`title ~* $${i} OR description ~* $${i} OR company ~* $${i}`);
        }
        condicionKeywordLigera = `(${orsLigeros.join(" OR ")})`;
        condicionKeywordCompleta = `(${orsCompletos.join(" OR ")})`;
      }
      // Se añade la ligera; más abajo se sustituye por la completa si hace falta.
      conditions.push(condicionKeywordLigera);
    }

   // Filtro por pais (case-insensitive: DB tiene 'uk' y 'UK' mezclados)
   if (country) {
      conditions.push(`"country" ILIKE $${idx}`);
     params.push(country);
     idx++;
   }

    // Ciudad: extraer solo el nombre de ciudad, ignorando provincia/comunidad
    let cityParts = "";
    if (location) {
      const partes = location.split(/[,\-]/).map(p => p.trim());
      const provincias = [
        "navarra", "la rioja", "madrid", "cataluña", "valencia", "andalucía", "andalucia",
        "aragon", "aragón", "pais vasco", "país vasco", "murcia", "extremadura", "galicia",
        "asturias", "cantabria", "castilla y leon", "castilla y león", "castilla la mancha",
        "castilla-la mancha", "baleares", "canarias", "comunidad", "provincia", "region", "región"
      ];
      for (const parte of partes) {
        const parteLower = parte.toLowerCase();
        if (!provincias.some(p => parteLower.includes(p) || p.includes(parteLower))) {
          cityParts = stripAccents(parte);
          break;
        }
      }
      if (!cityParts && partes.length > 0) {
        cityParts = stripAccents(partes[0]);
      }
    }
    if (cityParts) {
      conditions.push(`(${cityLike("city", idx)} OR ${cityLike("province", idx)})`);
      params.push(`%${cityParts}%`);
      idx++;
    }

    // Filtro por jornada
    if (jornada === "remoto") {
      conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push("%remoto%");
      idx++;
    } else if (jornada === "parcial") {
      conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push("%parcial%");
      idx++;
    }

    // Filtro por experiencia
    if (experiencia) {
      const expMap: Record<string, string[]> = {
        "sin-experiencia": ["%junior%", "%trainee%", "%becario%", "%prácticas%", "%sin experiencia%", "%entry level%"],
        "1-3": ["%1 año%", "%2 años%", "%3 años%", "%junior%"],
        "3-5": ["%3 años%", "%5 años%", "%mid%", "%mid-level%"],
        "5-10": ["%5 años%", "%10 años%", "%senior%"],
        "10+": ["%10 años%", "%senior%", "%lead%", "%head of%", "%director%"],
      };
      const keywords = expMap[experiencia] || [];
      if (keywords.length > 0) {
        const orClauses = keywords.map((_, i) => {
          const pi = idx + i;
          return `(title ILIKE $${pi} OR description ILIKE $${pi})`;
        });
        conditions.push(`(${orClauses.join(" OR ")})`);
        keywords.forEach(k => params.push(k));
        idx += keywords.length;
      }
    }

    // Filtro de salario robusto: guard `salary ~ '[0-9]'` para no castear cadenas
    // sin dígitos ("Ver en oferta" → '' → error), NULLIF para no castear '' y
    // ::bigint para no desbordar int4 con salarios largos ("30000-45000" → 3000045000).
    // Antes la rama `regexp_replace(...)::int` reventaba la query → caía al fallback
    // que servía resultados SIN filtrar de salario, mintiendo al usuario.
    if (salarioMin > 0) {
      conditions.push(`(salary ~ '[0-9]' AND NULLIF(regexp_replace(salary, '[^0-9]', '', 'g'), '')::bigint >= $${idx})`);
      params.push(salarioMin);
      idx++;
    }

    if (salarioMax > 0) {
      conditions.push(`(salary ~ '[0-9]' AND NULLIF(regexp_replace(salary, '[^0-9]', '', 'g'), '')::bigint <= $${idx})`);
      params.push(salarioMax);
      idx++;
    }

    // Filtro por categoria (au_pair / live_in_nanny) — SEPARADOS: son sectores distintos
    if (categoria === "au_pair") {
      // Solo au pair estricto — sin nanny genéricas
      conditions.push(`(title ILIKE '%au pair%' OR title ILIKE '%aupair%' OR title ILIKE '%niñera%' OR title ILIKE '%canguro%')`);
    } else if (categoria === "live_in_nanny") {
      // Live-in nanny + términos específicos de nanny profesional/interna
      conditions.push(`(${CATEGORIA_KEYWORDS["live_in_nanny"]})`);
    } else if (categoria && CATEGORIA_KEYWORDS[categoria]) {
      conditions.push(CATEGORIA_KEYWORDS[categoria]);
    }

    const whereClause = conditions.join(" AND ");
    params.push(limit, offset);

    // El total va en la misma consulta con COUNT(*) OVER(). Antes se lanzaba un
    // COUNT(*) aparte con el WHERE completo justo antes del SELECT: el mismo
    // escaneo hecho dos veces, y sobre 3,5M filas eso es el doble de trabajo.
    const construirSql = (where: string) => `
      SELECT id, title, company, city, province, salary,
             -- Solo el principio: mapJob() ya recorta a 200 caracteres, pero se
             -- traian descripciones enteras de hasta 1.000 y con 500 filas por
             -- busqueda eso son megabytes de JSON en cada peticion.
             LEFT(description, 300) AS description,
             "sourceUrl", "sourceName", "scrapedAt",
             "contactEmail" AS contactemail, "contactEmailConfianza" AS contactemailconfianza,
             COUNT(*) OVER() AS total_encontrado
      FROM "JobListing"
      WHERE ${where}
      ORDER BY
        CASE WHEN "scrapedAt" > NOW() - INTERVAL '7 days' THEN 0
             WHEN "scrapedAt" > NOW() - INTERVAL '30 days' THEN 1
             ELSE 2 END,
        md5(id::text || to_char(NOW(), 'YYYYDDD'))
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    let dbResult = await pool.query(construirSql(whereClause), params);

    // Segunda pasada: si buscando por título y empresa no sale bastante, se
    // amplía a la descripción. Es la consulta cara (recorre la tabla entera),
    // así que solo se paga cuando de verdad hace falta.
    if (condicionKeywordCompleta && dbResult.rows.length < Math.min(limit, 10)) {
      const whereAmpliado = conditions
        .map(c => (c === condicionKeywordLigera ? condicionKeywordCompleta : c))
        .join(" AND ");
      console.log(`[search] "${keyword}": ${dbResult.rows.length} por titulo, amplio a descripcion`);
      dbResult = await pool.query(construirSql(whereAmpliado), params);
    }

    const totalDB = parseInt(String(dbResult.rows[0]?.total_encontrado || "0"), 10);

    function deduplicar(rows: Record<string, unknown>[]) {
      const seen = new Set<string>();
      return rows.filter(j => {
        const url = String(j.sourceurl || "").trim();
        const key = url || `${String(j.title || "").toLowerCase()}|${String(j.company || "").toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // Fallback ciudad: NO aplicar si hay categoria
    // El umbral se compara con lo que se pidio, no con un 10 fijo: con limit=5
    // una busqueda que devolvia sus 5 resultados correctos se consideraba
    // "insuficiente" y saltaba al respaldo igualmente.
    if (keyword && cityParts && dbResult.rows.length < Math.min(10, limit) && !categoria) {
      const locCount = await pool.query(
        `SELECT COUNT(*) FROM "JobListing" WHERE "isActive" = true AND ("expiresAt" > NOW() OR "expiresAt" IS NULL) AND (${cityLike("city", 1)} OR ${cityLike("province", 1)})`,
        [`%${cityParts}%`]
      );
      const locTotal = parseInt(locCount.rows[0].count);
      if (locTotal > dbResult.rows.length + 5) {
        const locOffset = (page - 1) * limit;
        // El respaldo amplia la ZONA, nunca el PUESTO.
        //
        // Antes la palabra buscada solo se usaba para ORDENAR: la consulta
        // filtraba unicamente por ciudad y devolvia lo que hubiera, poniendo
        // las coincidencias delante. Resultado real: "camarero en Paris"
        // devolvia 8 ofertas y NINGUNA era de camarero (salian ingenieros,
        // DevOps, recursos humanos). Es peor que no devolver nada, porque el
        // usuario deja de fiarse del buscador.
        const { expandirPuesto: expandir } = await import("@/lib/job-search/sinonimos-puesto");
        const variantesLoc = expandir(keyword);
        const locParams: (string | number)[] = [`%${cityParts}%`];
        const orsLoc: string[] = [];
        for (const v of variantesLoc) {
          locParams.push(palabraExacta(v));
          const i = locParams.length;
          orsLoc.push(`title ~* $${i} OR description ~* $${i}`);
        }
        locParams.push(limit, locOffset);
        const iLimit = locParams.length - 1;
        const iOffset = locParams.length;

        const locResult = await pool.query(
          `SELECT id, title, company, city, province, salary, LEFT(description, 300) AS description,
                  "sourceUrl", "sourceName", "scrapedAt",
                  "contactEmail" AS contactemail, "contactEmailConfianza" AS contactemailconfianza,
                  COUNT(*) OVER() AS total_encontrado
             FROM "JobListing"
            WHERE "isActive" = true AND ("expiresAt" > NOW() OR "expiresAt" IS NULL)
              AND (${cityLike("city", 1)} OR ${cityLike("province", 1)})
              AND (${orsLoc.join(" OR ")})
            ORDER BY
              CASE WHEN "scrapedAt" > NOW() - INTERVAL '7 days' THEN 0
                   WHEN "scrapedAt" > NOW() - INTERVAL '30 days' THEN 1
                   ELSE 2 END,
              md5(id::text || to_char(NOW(), 'YYYYDDD'))
            LIMIT $${iLimit} OFFSET $${iOffset}`,
          locParams
        );
        const locOfertas = deduplicar(locResult.rows).map(j => rowToOferta(j, location, userSkills));
        // El total tiene que ser el de la consulta FILTRADA, no el de la ciudad.
        // Antes se devolvia locTotal (todas las ofertas de la ciudad): la app
        // anunciaba "20.543 ofertas de camarero en Paris" cuando no habia
        // ninguna, y la paginacion prometia paginas que no existian.
        const totalReal = parseInt(String(locResult.rows[0]?.total_encontrado || locOfertas.length), 10);
        return NextResponse.json({
          ofertas: locOfertas,
          total: totalReal,
          page,
          hasMore: locOffset + locOfertas.length < totalReal,
          keyword,
          location,
          source: "database-city-fallback",
        });
      }
    }

    if (dbResult.rows.length >= 1 || page > 1) {
      const deduped = deduplicar(dbResult.rows);
      let ofertas = deduped.map(j => rowToOferta(j, location, userSkills));
      if (jornada === "remoto") ofertas = ofertas.filter(o => (o.titulo as string).toLowerCase().includes("remoto") || (o.titulo as string).toLowerCase().includes("teletrabajo"));
      else if (jornada === "parcial") ofertas = ofertas.filter(o => (o.titulo as string).toLowerCase().includes("parcial"));
      return NextResponse.json({ ofertas, total: totalDB, page, hasMore: offset + ofertas.length < totalDB, keyword, location, source: "database" });
    }

    // NUNCA fallback a live-api para busquedas categorizadas
    if (categoria) {
      return NextResponse.json({ ofertas: [], total: 0, page, hasMore: false, keyword, location, source: "database-category-noresults" });
    }
    console.log("[Search] BD: 0 -> APIs en tiempo real");
    const apiOfertas = await buscarOfertasReales(keyword, location, 50);
    return NextResponse.json({ ofertas: apiOfertas, total: apiOfertas.length, page: 1, hasMore: false, keyword, location, source: "live-api" });

  } catch (error) {
    console.error("Error en busqueda:", (error as Error).message);
    if (categoria) {
      return NextResponse.json({ ofertas: [], total: 0, page: 1, hasMore: false, source: "database-category-error" });
    }
    try {
      const apiOfertas = await buscarOfertasReales(keyword, location, 50);
      return NextResponse.json({ ofertas: apiOfertas, total: apiOfertas.length, page: 1, hasMore: false, keyword, location, source: "live-api-fallback" });
    } catch {
      return NextResponse.json({ error: "Error al buscar ofertas" }, { status: 500 });
    }
  }
}
