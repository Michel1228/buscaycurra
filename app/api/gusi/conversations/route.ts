/**
 * API para guardar y recuperar conversaciones de Gusi
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET - Listar conversaciones del usuario
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      `SELECT id, title, last_message, created_at, updated_at 
       FROM gusi_conversations 
       WHERE user_id = $1 
       ORDER BY updated_at DESC 
       LIMIT 20`,
      [userId]
    );

    return NextResponse.json({ conversations: result.rows });
  } catch (error) {
    console.error("Error GET conversations:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST - Crear o actualizar conversación
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, conversationId, messages, cvData, title } = body;

    if (!userId || !messages) {
      return NextResponse.json({ error: "userId y messages requeridos" }, { status: 400 });
    }

    const pool = getPool();
    const lastMessage = messages[messages.length - 1]?.text || "";
    const conversationTitle = title || lastMessage.slice(0, 50) || "Nueva conversación";

    if (conversationId) {
      // Actualizar conversación existente
      await pool.query(
        `UPDATE gusi_conversations 
         SET messages = $1, cv_data = $2, last_message = $3, title = $4, updated_at = NOW()
         WHERE id = $5 AND user_id = $6`,
        [JSON.stringify(messages), cvData ? JSON.stringify(cvData) : null, lastMessage, conversationTitle, conversationId, userId]
      );
      return NextResponse.json({ success: true, id: conversationId });
    } else {
      // Crear nueva conversación
      const result = await pool.query(
        `INSERT INTO gusi_conversations (user_id, title, messages, cv_data, last_message)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [userId, conversationTitle, JSON.stringify(messages), cvData ? JSON.stringify(cvData) : null, lastMessage]
      );
      return NextResponse.json({ success: true, id: result.rows[0].id });
    }
  } catch (error) {
    console.error("Error POST conversation:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE - Eliminar conversación
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const conversationId = searchParams.get("conversationId");

    if (!userId || !conversationId) {
      return NextResponse.json({ error: "userId y conversationId requeridos" }, { status: 400 });
    }

    const pool = getPool();
    await pool.query(
      `DELETE FROM gusi_conversations WHERE id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE conversation:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
