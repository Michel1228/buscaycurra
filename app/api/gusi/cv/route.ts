/**
 * API para guardar y recuperar CVs de usuarios
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET - Obtener CV del usuario
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      `SELECT cv_data, cv_text, created_at, updated_at 
       FROM user_cvs 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ cv: null });
    }

    return NextResponse.json({ 
      cv: result.rows[0].cv_data,
      cvText: result.rows[0].cv_text,
      updatedAt: result.rows[0].updated_at
    });
  } catch (error) {
    console.error("Error GET cv:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST - Guardar CV
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, cvData, cvText } = body;

    if (!userId || !cvData) {
      return NextResponse.json({ error: "userId y cvData requeridos" }, { status: 400 });
    }

    const pool = getPool();
    
    // Upsert: insertar o actualizar
    await pool.query(
      `INSERT INTO user_cvs (user_id, cv_data, cv_text, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET cv_data = $2, cv_text = $3, updated_at = NOW()`,
      [userId, JSON.stringify(cvData), cvText || null]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error POST cv:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE - Eliminar CV
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const pool = getPool();
    await pool.query(
      `DELETE FROM user_cvs WHERE user_id = $1`,
      [userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE cv:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
