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

function rowToOferta(j: Record<string, unknown>, location: string) {
  return {
    id: j.id,
    titulo: j.title,
    empresa: (j.company as string) || "Ver en oferta",
    ubicacion: (j.city as string) || (j.province as string) || location,
    salario: (j.salary as string) || "Ver en oferta",
    descripcion: ((j.description as string) || "").slice(0, 200),
    fuente: j.sourcename,
    url: j.sourceurl,
    fecha: j.scrapedat,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword  = (searchParams.get("keyword")  || "").trim();
  const location = (searchParams.get("location") || "").trim();
  const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const jornada  = searchParams.get("jornada") || "";
  const limit    = 500;
  const offset   = (page - 1) * limit;

  if (!keyword && !location) {
    return NextResponse.json({ error: "Debes introducir al menos una palabra clave o ubicacion" }, { status: 400 });
  }

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

    if (dbResult.rows.length >= 1 || page > 1) {
      const deduped = deduplicar(dbResult.rows);
      let ofertas = deduped.map(j => rowToOferta(j, location));
      if (jornada === "remoto") ofertas = ofertas.filter(o => (o.titulo as string).toLowerCase().includes("remoto") || (o.titulo as string).toLowerCase().includes("teletrabajo"));
      else if (jornada === "parcial") ofertas = ofertas.filter(o => (o.titulo as string).toLowerCase().includes("parcial"));
      return NextResponse.json({ ofertas, total: totalDB, page, hasMore: offset + dbResult.rows.length < totalDB, keyword, location, source: "database" });
    }

    // Si keyword+ciudad = 0, mostrar todas las ofertas de esa ciudad (total real)
    if (keyword && cityParts) {
      const locCount = await pool.query(
        `SELECT COUNT(*) FROM "JobListing" WHERE "isActive" = true AND (${cityLike("city", 1)} OR ${cityLike("province", 1)})`,
        [`%${cityParts}%`]
      );
      const locTotal = parseInt(locCount.rows[0].count);
      if (locTotal > 0) {
        const locOffset = (page - 1) * limit;
        const locResult = await pool.query(
          `SELECT id, title, company, city, province, salary, description, "sourceUrl", "sourceName", "scrapedAt"
           FROM "JobListing" WHERE "isActive" = true AND (${cityLike("city", 1)} OR ${cityLike("province", 1)})
           ORDER BY
             CASE WHEN "scrapedAt" > NOW() - INTERVAL '7 days' THEN 0
                  WHEN "scrapedAt" > NOW() - INTERVAL '30 days' THEN 1
                  ELSE 2 END,
             md5(id::text || to_char(NOW(), 'YYYYDDD'))
           LIMIT $2 OFFSET $3`,
          [`%${cityParts}%`, limit, locOffset]
        );
        const locOfertas = deduplicar(locResult.rows).map(j => rowToOferta(j, location));
        return NextResponse.json({ ofertas: locOfertas, total: locTotal, page, hasMore: locOffset + locResult.rows.length < locTotal, keyword, location, source: "database-city" });
      }
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
