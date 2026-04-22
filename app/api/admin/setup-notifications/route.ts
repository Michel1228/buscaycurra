/**
 * /api/admin/setup-notifications — Crear tabla de notificaciones
 * Solo accesible con ADMIN_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "public" } }
  );

  // We can't run raw SQL via Supabase JS client directly
  // But we CAN create the table by trying to insert and checking if it exists
  try {
    // Check if table exists by querying it
    const { error: checkError } = await supabase
      .from("notificaciones")
      .select("id")
      .limit(1);

    if (checkError && checkError.message.includes("does not exist")) {
      return NextResponse.json({
        status: "TABLE_MISSING",
        message: "La tabla 'notificaciones' no existe. Ejecuta este SQL en Supabase Dashboard → SQL Editor:",
        sql: `
-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'info',
  titulo text NOT NULL,
  mensaje text DEFAULT '',
  datos jsonb DEFAULT '{}',
  leida boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notif_user ON notificaciones(user_id, leida);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notificaciones(created_at DESC);

-- RLS
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden leer sus propias notificaciones
CREATE POLICY "Users can read own notifications" ON notificaciones
  FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden marcar como leídas
CREATE POLICY "Users can update own notifications" ON notificaciones
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role puede insertar (para el sistema)
CREATE POLICY "Service can insert notifications" ON notificaciones
  FOR INSERT WITH CHECK (true);
        `.trim(),
      });
    }

    // Table exists, check count
    const { count } = await supabase
      .from("notificaciones")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      status: "OK",
      message: "Tabla 'notificaciones' existe",
      count: count || 0,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
