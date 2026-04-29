/**
 * /api/jobs/alertas — Gestión de alertas de empleo
 * POST: crear alerta { keyword, location, frequency }
 * GET: listar alertas del usuario
 * DELETE: eliminar alerta { alertId }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── POST: crear alerta ───────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }

    const body = await request.json() as {
      keyword?: string;
      location?: string;
      frequency?: "daily" | "weekly";
    };

    if (!body.keyword?.trim() && !body.location?.trim()) {
      return NextResponse.json({ error: "Keyword o location requeridos" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("job_alerts")
      .insert({
        user_id: user.id,
        keyword: body.keyword?.trim() || "",
        location: body.location?.trim() || "",
        frequency: body.frequency || "daily",
        created_at: new Date().toISOString(),
        last_sent_at: null,
      });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[jobs/alertas] Error POST:", (error as Error).message);
    return NextResponse.json({ error: "Error al crear alerta" }, { status: 500 });
  }
}

// ─── GET: listar alertas ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }

    const { data: alertas, error } = await supabaseAdmin
      .from("job_alerts")
      .select("id, keyword, location, frequency, created_at, last_sent_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ alertas: alertas || [] });
  } catch (error) {
    console.error("[jobs/alertas] Error GET:", (error as Error).message);
    return NextResponse.json({ error: "Error al obtener alertas" }, { status: 500 });
  }
}

// ─── DELETE: eliminar alerta ──────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("id");
    if (!alertId) {
      return NextResponse.json({ error: "id requerido" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("job_alerts")
      .delete()
      .eq("id", alertId)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[jobs/alertas] Error DELETE:", (error as Error).message);
    return NextResponse.json({ error: "Error al eliminar alerta" }, { status: 500 });
  }
}
