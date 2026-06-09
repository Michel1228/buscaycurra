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
  // Calcular match score basado en solapamiento de keywords
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
    // Si no hay keywords en la oferta, buscar en título+descripción
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
  const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const jornada      = searchParams.get("jornada") || "";
  const experiencia  = searchParams.get("experiencia") || "";
  const salarioMin   = parseInt(searchParams.get("salarioMin") || "0");
  const salarioMax   = parseInt(searchParams.get("salarioMax") || "0");
  const limit    = 500;
  const offset   = (page - 1) * limit;

  if (!keyword && !location && !country) {
    return NextResponse.json({ error: "Debes introducir al menos una palabra clave, ubicación o país" }, { status: 400 });
  }

  // Extraer skills del usuario desde el header (opcional, para match score)
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

    if (keyword) {
      conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push(`%${keyword}%`);
      idx++;
    }

    // Filtro por país
    if (country) {
      conditions.push(`"country" = $${idx}`);
      params.push(country);
      idx++;
    }

    // Ciudad: extraer solo el nombre de ciudad, ignorando provincia/comunidad
    // Ej: "Tudela Navarra" → "Tudela", "Madrid, Comunidad de Madrid" → "Madrid"
    let cityParts = "";
    if (location) {
      const partes = location.split(/[,\-]/).map(p => p.trim());
      // Lista de palabras que indican provincia/comunidad (ignorar)
      const provincias = [
        "navarra", "la rioja", "madrid", "cataluña", "valencia", "andalucía", "andalucia",
        "aragon", "aragón", "pais vasco", "país vasco", "murcia", "extremadura", "galicia",
        "asturias", "cantabria", "castilla y leon", "castilla y león", "castilla la mancha",
        "castilla-la mancha", "baleares", "canarias", "comunidad", "provincia", "region", "región"
      ];
      // Buscar la primera parte que NO sea una provincia/comunidad
      for (const parte of partes) {
        const parteLower = parte.toLowerCase();
        if (!provincias.some(p => parteLower.includes(p) || p.includes(parteLower))) {
          cityParts = stripAccents(parte);
          break;
        }
      }
      // Si todas son provincias, usar la primera parte
      if (!cityParts && partes.length > 0) {
        cityParts = stripAccents(partes[0]);
      }
    }
    if (cityParts) {
      conditions.push(`(${cityLike("city", idx)} OR ${cityLike("province", idx)})`);
      params.push(`%${cityParts}%`);
      idx++;
    }

    // Filtro por jornada (remoto, parcial)
    if (jornada === "remoto") {
      conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push("%remoto%");
      idx++;
    } else if (jornada === "parcial") {
      conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push("%parcial%");
      idx++;
    }
    // "completa" no añade condición (devuelve todo, que ya es el default)

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

    // Filtro por salario mínimo
    if (salarioMin > 0) {
      conditions.push(`(
        (salary ~ '^[0-9]+$' AND salary::int >= $${idx})
        OR (regexp_replace(salary, '[^0-9]', '', 'g')::int >= $${idx})
      )`);
      params.push(salarioMin);
      idx++;
    }

    // Filtro por salario máximo
    if (salarioMax > 0) {
      conditions.push(`(
        (salary ~ '^[0-9]+$' AND salary::int <= $${idx})
        OR (regexp_replace(salary, '[^0-9]', '', 'g')::int <= $${idx})
      )`);
      params.push(salarioMax);
      idx++;
    }

    const whereClause = conditions.join(" AND ");
    const countRes = await pool.query(`SELECT COUNT(*) FROM "JobListing" WHERE ${whereClause}`, params);
    const totalDB = parseInt(countRes.rows[0].count);
    
    // Rotación diaria priorizando frescura: últimas 7 días primero, luego mes, luego antiguas
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

    // Deduplicar: primero por sourceUrl, si no por título+empresa (misma oferta de distintas fuentes)
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

    // Si keyword+ciudad da pocos resultados (<10) y la ciudad tiene mas ofertas,
    // mostrar todas las de la ciudad (fallback inteligente). Si hay >=10, mostramos los matches exactos.
    if (keyword && cityParts && dbResult.rows.length < 10) {
      const locCount = await pool.query(
        `SELECT COUNT(*) FROM "JobListing" WHERE "isActive" = true AND (${cityLike("city", 1)} OR ${cityLike("province", 1)})`,
        [`%${cityParts}%`]
      );
      const locTotal = parseInt(locCount.rows[0].count);
      // Si la ciudad tiene significativamente mas ofertas que el keyword match, mostrar todas
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

    // Fallback final a APIs en tiempo real
    console.log("[Search] BD: 0 -> APIs en tiempo real");
    const apiOfertas = await buscarOfertasReales(keyword, location, 50);
    return NextResponse.json({ ofertas: apiOfertas, total: apiOfertas.length, page: 1, hasMore: false, keyword, location, source: "live-api" });

  } catch (error) {
    console.error("Error en busqueda:", (error as Error).message);
    try {
      const apiOfertas = await buscarOfertasReales(keyword, location, 50);
      return NextResponse.json({ ofertas: apiOfertas, total: apiOfertas.length, page: 1, hasMore: false, keyword, location, source: "live-api-fallback" });
    } catch {
      return NextResponse.json({ error: "Error al buscar ofertas" }, { status: 500 });
    }
  }
}
