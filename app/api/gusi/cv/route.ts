/**
 * API para guardar y recuperar CVs de usuarios
 * Compatible con ambas tablas: user_cvs (Guzzi) y CV (Curriculum editor)
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
    
    // 1. Buscar en user_cvs (Guzzi CV)
    const userCvResult = await pool.query(
      `SELECT form_data, html, visible_empresas, created_at, updated_at
       FROM user_cvs
       WHERE user_id = $1`,
      [userId]
    );

    if (userCvResult.rows.length > 0) {
      return NextResponse.json({
        cv: userCvResult.rows[0].form_data,
        cvText: userCvResult.rows[0].html,
        visibleEmpresas: userCvResult.rows[0].visible_empresas ?? false,
        updatedAt: userCvResult.rows[0].updated_at
      });
    }

    // 2. Buscar en CV (Curriculum editor Prisma)
    const cvResult = await pool.query(
      `SELECT "fullName", email, phone, city, "targetSector", "targetPosition",
              summary, experience, education, skills, languages, "coverLetter",
              "originalPhoto", "isActive", "updatedAt"
       FROM "CV"
       WHERE "userId" = $1 AND "isActive" = true
       ORDER BY "updatedAt" DESC
       LIMIT 1`,
      [userId]
    );

    if (cvResult.rows.length === 0) {
      return NextResponse.json({ cv: null, visibleEmpresas: false });
    }

    const cvRow = cvResult.rows[0];
    
    // Convertir a formato compatible con el frontend
    const cvData = {
      nombre: cvRow.fullName,
      email: cvRow.email,
      telefono: cvRow.phone,
      ciudad: cvRow.city,
      sector: cvRow.targetSector,
      puesto: cvRow.targetPosition,
      resumen: cvRow.summary || "",
      experiencia: cvRow.experience || [],
      educacion: cvRow.education || [],
      habilidades: cvRow.skills || [],
      idiomas: cvRow.languages || [],
      cartaPresentacion: cvRow.coverLetter || "",
      foto: cvRow.originalPhoto || "",
      fuente: "curriculum",
    };

    return NextResponse.json({
      cv: cvData,
      cvText: null,
      visibleEmpresas: cvRow.isActive ?? false,
      updatedAt: cvRow.updatedAt
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
      `INSERT INTO user_cvs (user_id, nombre, html, form_data, updated_at)
       VALUES ($1, 'Mi CV', $2, $3, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET html = $2, form_data = $3, updated_at = NOW()`,
      [userId, cvText || "", JSON.stringify(cvData)]
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
