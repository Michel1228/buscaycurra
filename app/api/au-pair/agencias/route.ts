/**
 * GET /api/au-pair/agencias
 * Agencias y familias del área de au pair / live-in nanny a las que se les
 * puede escribir directamente, porque tenemos su correo.
 *
 * POR QUÉ SE REESCRIBIÓ. La consulta buscaba el texto "au pair" en el título.
 * Medido en producción, eso devolvía 10 agencias. Usando la columna `categoria`
 * —que el sincronizador YA rellena, y que reconoce nanny, live-in, childcare,
 * niñera y las variantes en otros idiomas— salen 179 agencias con 2.561 ofertas
 * vivas. Se estaba enseñando el 6 % de lo que había.
 *
 * Y no filtraba por ofertas activas, así que podía mandar a alguien a escribir
 * a una familia cuyas ofertas llevaban meses caducadas.
 *
 * ADEMÁS DEVUELVE SI SE PUEDE IR. Las agencias con más ofertas están en Reino
 * Unido, Estados Unidos y Canadá, tres sitios donde una persona española no
 * puede presentarse sin trámite — y en el Reino Unido directamente ya no existe
 * el visado de au pair. Mandar cincuenta correos a familias británicas sin
 * saberlo es perder semanas. Ver lib/au-pair/puedes-ir.ts.
 */
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { realidadDe, ETIQUETA_DIFICULTAD } from "@/lib/au-pair/puedes-ir";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = getPool();
    const { rows } = await pool.query<{
      company: string;
      contact_email: string;
      country: string;
      ofertas: string;
      ultima: Date | null;
    }>(
      `SELECT company,
              "contactEmail"                       AS contact_email,
              COALESCE(country, '')                AS country,
              COUNT(*)                             AS ofertas,
              MAX(COALESCE("createdAt", "updatedAt")) AS ultima
         FROM "JobListing"
        WHERE "contactEmail" IS NOT NULL
          AND "contactEmail" <> ''
          AND "isActive" = true
          AND categoria IN ('au_pair', 'live_in_nanny')
          AND company IS NOT NULL
          AND company <> ''
        GROUP BY company, "contactEmail", country
        ORDER BY COUNT(*) DESC, MAX(COALESCE("createdAt", "updatedAt")) DESC NULLS LAST
        LIMIT 200`
    );

    const agencias = rows.map(r => {
      const realidad = r.country ? realidadDe(r.country) : undefined;
      return {
        nombre: r.company,
        email: r.contact_email,
        pais: r.country || "Sin especificar",
        ofertas: Number(r.ofertas),
        ultima: r.ultima,
        // Lo que hace falta para poder aceptar sus ofertas, si lo sabemos.
        puedesIr: realidad
          ? { nivel: realidad.dificultad, etiqueta: ETIQUETA_DIFICULTAD[realidad.dificultad], resumen: realidad.resumen }
          : null,
      };
    });

    return NextResponse.json({ agencias, total: agencias.length });
  } catch (err) {
    console.error("[au-pair/agencias]", (err as Error).message);
    return NextResponse.json({ error: "Error obteniendo agencias" }, { status: 500 });
  }
}
