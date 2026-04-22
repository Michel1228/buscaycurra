/**
 * /api/jobs/search — Búsqueda paginada en la BD local
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { buscarOfertasReales } from "@/lib/job-search/real-search";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword  = (searchParams.get("keyword")  || "").trim();
  const location = (searchParams.get("location") || "").trim();
  const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit    = 50;
  const offset   = (page - 1) * limit;

  if (!keyword && !location) {
    return NextResponse.json({ error: "Debes introducir al menos una palabra clave o ubicación" }, { status: 400 });
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

    if (location) {
      // Búsqueda flexible: "Madrid" coincide con "Madrid", "Madrid, Comunidad de Madrid", etc.
      const cityParts = location.split(",")[0].trim(); // Sólo la parte antes de la coma
      conditions.push(`(city ILIKE $${idx} OR province ILIKE $${idx})`);
      params.push(`%${cityParts}%`);
      idx++;
    }

    const whereClause = conditions.join(" AND ");

    // Contar total
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM "JobListing" WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);

    // Obtener página
    const sql = `
      SELECT id, title, company, city, province, salary, description,
             "sourceUrl", "sourceName", "scrapedAt"
      FROM "JobListing"
      WHERE ${whereClause}
      ORDER BY "scrapedAt" DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    params.push(limit, offset);

    const dbResult = await pool.query(sql, params);

    if (dbResult.rows.length >= 1 || page > 1) {
      const jornada = searchParams.get("jornada") || "";

      let ofertas = dbResult.rows.map((j, i) => ({
        id: j.id,
        titulo: j.title,
        empresa: j.company || "Ver en oferta",
        ubicacion: j.city || j.province || location,
        salario: j.salary || "Ver en oferta",
        descripcion: (j.description || "").slice(0, 200),
        fuente: j.sourcename,
        url: j.sourceurl,
        fecha: j.scrapedat,
        match: Math.max(98 - offset * 0.05 - i * 0.5, 40),
        distancia: "🏠 Tu ciudad",
      }));

      if (jornada === "remoto") {
        ofertas = ofertas.filter(o => o.titulo.toLowerCase().includes("remoto") || o.titulo.toLowerCase().includes("teletrabajo"));
      } else if (jornada === "parcial") {
        ofertas = ofertas.filter(o => o.titulo.toLowerCase().includes("parcial"));
      }

      return NextResponse.json({
        ofertas,
        total,
        page,
        hasMore: offset + dbResult.rows.length < total,
        keyword,
        location,
        source: "database",
      });
    }

    // Fallback a APIs en tiempo real si la BD no tiene resultados
    console.log(`[Search] BD: ${dbResult.rows.length} → APIs en tiempo real`);
    const apiOfertas = await buscarOfertasReales(keyword, location, 50);
    return NextResponse.json({
      ofertas: apiOfertas,
      total: apiOfertas.length,
      page: 1,
      hasMore: false,
      keyword,
      location,
      source: "live-api",
    });
  } catch (error) {
    console.error("Error en búsqueda:", (error as Error).message);
    try {
      const apiOfertas = await buscarOfertasReales(keyword, location, 50);
      return NextResponse.json({ ofertas: apiOfertas, total: apiOfertas.length, page: 1, hasMore: false, keyword, location, source: "live-api-fallback" });
    } catch {
      return NextResponse.json({ error: "Error al buscar ofertas" }, { status: 500 });
    }
  }
}
