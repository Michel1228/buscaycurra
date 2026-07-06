/**
 * /api/cv-cartas — Archivo de cartas de presentación enviadas
 * GET  ?userId=xxx  → lista de cartas del usuario
 * POST { userId, companyName, companyEmail, cartaTexto } → guarda carta
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getUserId } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // El userId SIEMPRE se deriva del token, nunca del query param. Antes se
  // aceptaba ?userId= sin validar → cualquiera podía leer las cartas (con
  // emails de empresa = PII) de otro usuario. IDOR crítico.
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const pool = getPool();
  try {
    // Crear tabla si no existe (auto-migración en primera llamada)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cv_cartas (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        company_name TEXT,
        company_email TEXT,
        carta_texto TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    const res = await pool.query(
      `SELECT id, company_name, company_email, carta_texto, created_at
       FROM cv_cartas WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    return NextResponse.json({ cartas: res.rows });
  } catch (err) {
    console.error("[cv-cartas] GET error:", (err as Error).message);
    return NextResponse.json({ cartas: [] });
  }
}

export async function POST(request: NextRequest) {
  // userId del token, no del body (antes se inyectaba a nombre de cualquiera).
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json() as { companyName?: string; companyEmail?: string; cartaTexto?: string };
  const { companyName, companyEmail, cartaTexto } = body;
  if (!cartaTexto) return NextResponse.json({ error: "cartaTexto requerido" }, { status: 400 });

  const pool = getPool();
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cv_cartas (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        company_name TEXT,
        company_email TEXT,
        carta_texto TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(
      `INSERT INTO cv_cartas (user_id, company_name, company_email, carta_texto) VALUES ($1, $2, $3, $4)`,
      [userId, companyName || "", companyEmail || "", cartaTexto]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cv-cartas] POST error:", (err as Error).message);
    return NextResponse.json({ error: "Error guardando carta" }, { status: 500 });
  }
}
