/**
 * /api/au-pair/profile
 * GET  — obtener perfil del usuario autenticado
 * POST — guardar/actualizar perfil
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ojesordjedovnpyxspxi.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("au_pair_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Error en perfil au pair' }, { status: 500 });
  }

  return NextResponse.json({ profile: data || null });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user_id, ...profile } = body;

  if (!user_id) {
    return NextResponse.json({ error: "user_id requerido" }, { status: 400 });
  }

  // Ver si ya existe
  const { data: existing } = await supabase
    .from("au_pair_profiles")
    .select("id")
    .eq("user_id", user_id)
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
      .eq("user_id", user_id)
      .select("*")
      .single();
  } else {
    // Insert
    result = await supabase
      .from("au_pair_profiles")
      .insert({
        user_id,
        ...profile,
      })
      .select("*")
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: 'Error en perfil au pair' }, { status: 500 });
  }

  return NextResponse.json({ profile: result.data, ok: true });
}
