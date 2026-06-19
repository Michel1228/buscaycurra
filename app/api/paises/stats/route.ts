// @ts-nocheck
/**
 * GET /api/paises/stats
 * Devuelve conteo real de ofertas por país desde la DB VPS. Cache 1h.
 */
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// ── Mapa de códigos ISO → flag + nombre ──
const PAISES_MAP: Record<string, { flag: string; nombre: string }> = {
  US: { flag: "🇺🇸", nombre: "Estados Unidos" },
  DE: { flag: "🇩🇪", nombre: "Alemania" },
  ES: { flag: "🇪🇸", nombre: "España" },
  FR: { flag: "🇫🇷", nombre: "Francia" },
  GB: { flag: "🇬🇧", nombre: "Reino Unido" },
  UK: { flag: "🇬🇧", nombre: "Reino Unido" },
  CA: { flag: "🇨🇦", nombre: "Canadá" },
  AU: { flag: "🇦🇺", nombre: "Australia" },
  SE: { flag: "🇸🇪", nombre: "Suecia" },
  IT: { flag: "🇮🇹", nombre: "Italia" },
  NL: { flag: "🇳🇱", nombre: "Países Bajos" },
  CH: { flag: "🇨🇭", nombre: "Suiza" },
  IE: { flag: "🇮🇪", nombre: "Irlanda" },
  BE: { flag: "🇧🇪", nombre: "Bélgica" },
  PT: { flag: "🇵🇹", nombre: "Portugal" },
  NO: { flag: "🇳🇴", nombre: "Noruega" },
  PL: { flag: "🇵🇱", nombre: "Polonia" },
  DK: { flag: "🇩🇰", nombre: "Dinamarca" },
  AT: { flag: "🇦🇹", nombre: "Austria" },
  NZ: { flag: "🇳🇿", nombre: "Nueva Zelanda" },
  FI: { flag: "🇫🇮", nombre: "Finlandia" },
  GR: { flag: "🇬🇷", nombre: "Grecia" },
  RO: { flag: "🇷🇴", nombre: "Rumanía" },
  HU: { flag: "🇭🇺", nombre: "Hungría" },
  CZ: { flag: "🇨🇿", nombre: "República Checa" },
  IN: { flag: "🇮🇳", nombre: "India" },
  BR: { flag: "🇧🇷", nombre: "Brasil" },
  MX: { flag: "🇲🇽", nombre: "México" },
  SG: { flag: "🇸🇬", nombre: "Singapur" },
  JP: { flag: "🇯🇵", nombre: "Japón" },
  CL: { flag: "🇨🇱", nombre: "Chile" },
  PH: { flag: "🇵🇭", nombre: "Filipinas" },
  KR: { flag: "🇰🇷", nombre: "Corea del Sur" },
  ID: { flag: "🇮🇩", nombre: "Indonesia" },
  CO: { flag: "🇨🇴", nombre: "Colombia" },
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export async function GET() {
  try {
    const pool = getPool();

    // Agrupar por UPPER(country) para unificar duplicados case-sensitive
    const { rows } = await pool.query(`
      SELECT UPPER(country) AS code, COUNT(*)::int AS total
      FROM "JobListing"
      WHERE country IS NOT NULL AND country != ''
      GROUP BY UPPER(country)
      ORDER BY total DESC
    `);

    const paises = rows
      .filter((r) => PAISES_MAP[r.code] && r.code !== "ES")
      .map((r) => ({
        code: r.code,
        flag: PAISES_MAP[r.code].flag,
        nombre: PAISES_MAP[r.code].nombre,
        ofertas: formatNumber(r.total),
        total: r.total,
      }));

    const totalGlobal = rows.reduce((sum, r) => sum + r.total, 0);

    return NextResponse.json(
      {
        paises,
        totalGlobal: formatNumber(totalGlobal),
        totalPaises: paises.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("[paises/stats] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Error al obtener estadísticas de países" },
      { status: 500 }
    );
  }
}
