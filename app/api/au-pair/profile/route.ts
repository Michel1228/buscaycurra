/**
 * /api/au-pair/profile
 * GET  — obtener perfil del usuario autenticado
 * POST — guardar/actualizar perfil
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserId } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ojesordjedovnpyxspxi.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("au_pair_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data || null });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { ...profile } = body;

  // Ver si ya existe
  const { data: existing } = await supabase
    .from("au_pair_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  let result;

  if (existing) {
    // Update
    result = await supabase
      .from("au_pair_profiles")
      .update({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("*")
      .single();
  } else {
    // Insert
    result = await supabase
      .from("au_pair_profiles")
      .insert({
        user_id: userId,
        ...profile,
      })
      .select("*")
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: result.data, ok: true });
}
