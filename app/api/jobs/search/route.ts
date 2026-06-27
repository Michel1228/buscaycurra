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
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword  = (searchParams.get("keyword")  || "").trim();
  const location = (searchParams.get("location") || "").trim();
  const country  = (searchParams.get("country")  || "").trim();
  const categoria = (searchParams.get("categoria") || "").trim(); // au_pair | live_in_nanny
  const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const jornada      = searchParams.get("jornada") || "";
  const experiencia  = searchParams.get("experiencia") || "";
  const salarioMin   = parseInt(searchParams.get("salarioMin") || "0");
  const salarioMax   = parseInt(searchParams.get("salarioMax") || "0");
  const limit    = 500;
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
    const conditions: string[] = ['"isActive" = $1'];
    let idx = 2;

    // Keyword: si hay categoria, la categoria YA filtra — el keyword es redundante
    // (evita que "au pair" no matchee ofertas con "nanny" en el titulo)
    if (keyword && !categoria) {
      const STOP_WORDS = new Set(["de", "la", "el", "en", "del", "las", "los", "un", "una", "y", "o", "a", "para", "por", "con", "sin", "que", "es", "se", "no", "al", "lo", "le", "the", "of", "in", "and", "to", "for", "a"]);
      const words = keyword.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()));
      if (words.length > 1) {
        const wordConditions = words.map(w => {
          params.push(`%${w}%`);
          const i = idx++;
          return `(title ILIKE $${i} OR description ILIKE $${i} OR company ILIKE $${i})`;
        });
        conditions.push(`(${wordConditions.join(" AND ")})`);
      } else {
        conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx} OR company ILIKE $${idx})`);
        params.push(`%${keyword}%`);
        idx++;
      }
    }

    // Filtro por pais (case-insensitive: DB tiene 'uk' y 'UK' mezclados)
    if (country) {
      conditions.push(`LOWER("country") = LOWER($${idx})`);
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

    if (salarioMin > 0) {
      conditions.push(`(
        (salary ~ '^[0-9]+$' AND salary::int >= $${idx})
        OR (regexp_replace(salary, '[^0-9]', '', 'g')::int >= $${idx})
      )`);
      params.push(salarioMin);
      idx++;
    }

    if (salarioMax > 0) {
      conditions.push(`(
        (salary ~ '^[0-9]+$' AND salary::int <= $${idx})
        OR (regexp_replace(salary, '[^0-9]', '', 'g')::int <= $${idx})
      )`);
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
    const countRes = await pool.query(`SELECT COUNT(*) FROM "JobListing" WHERE ${whereClause}`, params);
    const totalDB = parseInt(countRes.rows[0].count);
    
    const sql = `
      SELECT id, title, company, city, province, salary, description,
             "sourceUrl", "sourceName", "scrapedAt"
      FROM "JobListing"
      WHERE ${whereClause}
      ORDER BY
        CASE WHEN "scrapedAt" > NOW() - INTERVAL '7 days' THEN 0
             WHEN "scrapedAt" > NOW() - INTERVAL '30 days' THEN 1
             ELSE 2 END,
        md5(id::text || to_char(NOW(), 'YYYYDDD'))
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    params.push(limit, offset);
    const dbResult = await pool.query(sql, params);

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
    if (keyword && cityParts && dbResult.rows.length < 10 && !categoria) {
      const locCount = await pool.query(
        `SELECT COUNT(*) FROM "JobListing" WHERE "isActive" = true AND (${cityLike("city", 1)} OR ${cityLike("province", 1)})`,
        [`%${cityParts}%`]
      );
      const locTotal = parseInt(locCount.rows[0].count);
      if (locTotal > dbResult.rows.length + 5) {
        const locOffset = (page - 1) * limit;
        const locResult = await pool.query(
          `SELECT id, title, company, city, province, salary, description, "sourceUrl", "sourceName", "scrapedAt"
           FROM "JobListing" WHERE "isActive" = true AND (${cityLike("city", 1)} OR ${cityLike("province", 1)})
           ORDER BY
             CASE WHEN title ILIKE $2 THEN 0 ELSE 1 END,
             CASE WHEN "scrapedAt" > NOW() - INTERVAL '7 days' THEN 0
                  WHEN "scrapedAt" > NOW() - INTERVAL '30 days' THEN 1
                  ELSE 2 END,
             md5(id::text || to_char(NOW(), 'YYYYDDD'))
           LIMIT $3 OFFSET $4`,
          [`%${cityParts}%`, `%${keyword}%`, limit, locOffset]
        );
        const locOfertas = deduplicar(locResult.rows).map(j => rowToOferta(j, location, userSkills));
        return NextResponse.json({ ofertas: locOfertas, total: locTotal, page, hasMore: locOffset + locOfertas.length < locTotal, keyword, location, source: "database-city-fallback" });
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
