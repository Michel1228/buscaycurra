/**
 * API para obtener una conversación específica de Gusi
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      `SELECT id, title, messages, cv_data, last_message, created_at, updated_at 
       FROM gusi_conversations 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
    }

    const conv = result.rows[0];
    return NextResponse.json({
      id: conv.id,
      title: conv.title,
      messages: conv.messages,
      cvData: conv.cv_data,
      lastMessage: conv.last_message,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    });
  } catch (error) {
    console.error("Error GET conversation:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
