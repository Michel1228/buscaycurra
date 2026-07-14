/**
 * GET  /api/au-pair/profile?userId=xxx — Obtiene el perfil Au Pair
 * POST /api/au-pair/profile         — Crea/actualiza el perfil Au Pair (UPSERT)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ─── GET — Obtener perfil ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabasePublico = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabasePublico.auth.getUser(
      authHeader.slice(7)
    );
    if (authError || !user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }
    const authenticatedUserId = user.id;

    // userId debe coincidir con el usuario autenticado
    const requestedUserId = request.nextUrl.searchParams.get("userId");
    if (!requestedUserId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }
    if (requestedUserId !== authenticatedUserId) {
      return NextResponse.json({ error: "No puedes ver el perfil de otro usuario" }, { status: 403 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error } = await supabase
      .from("au_pair_profiles")
      .select("*")
      .eq("user_id", authenticatedUserId)
      .maybeSingle();

    if (error) {
      console.error("[au-pair/profile] Supabase error:", error.message);
      return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 });
    }

    return NextResponse.json({ profile: profile || null });
  } catch (error) {
    console.error("[au-pair/profile] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ─── POST — Crear/actualizar perfil (UPSERT) ───────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabasePublico = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabasePublico.auth.getUser(
      authHeader.slice(7)
    );
    if (authError || !user) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }
    const userId = user.id;

    // ── Parsear body ──────────────────────────────────────────────────────
    const body: Record<string, unknown> = await request.json();

    // ── Mapear campos del frontend a columnas de la BD ────────────────────
    // La página envía las claves NATIVAS de la tabla (letter_text, age, languages...).
    // El mapeador antiguo solo entendía alias en español (carta_presentacion, edad...)
    // y descartaba EN SILENCIO la mitad del perfil (carta, edad, idiomas, experiencia,
    // carné, disponibilidad, dieta, referencias...). Ahora: whitelist de columnas
    // reales + alias antiguos por compatibilidad.
    const dbRow: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    const COLUMNAS = [
      "nombre", "letter_text", "age", "nationality", "residencia", "estatus_residencia",
      "ciudad", "pais_destino", "languages", "childcare_experience", "has_driving_license",
      "available_from", "available_to", "dietary_info", "hobbies", "nivel_educativo",
      "fumador", "primeros_auxilios", "sabe_nadar", "duracion_preferida", "photos",
      "references_json",
    ];
    for (const col of COLUMNAS) {
      if (body[col] !== undefined) dbRow[col] = body[col];
    }

    // Alias antiguos (clientes/versiones previas)
    if (body.edad !== undefined) dbRow.age = body.edad;
    if (body.nacionalidad !== undefined) dbRow.nationality = body.nacionalidad;
    if (body.duracion !== undefined) dbRow.duracion_preferida = body.duracion;
    if (body.fecha_inicio !== undefined) dbRow.available_from = body.fecha_inicio;
    if (body.fecha_fin !== undefined) dbRow.available_to = body.fecha_fin;
    if (body.idiomas !== undefined) dbRow.languages = body.idiomas;
    if (body.fotos !== undefined) dbRow.photos = body.fotos;
    if (body.experiencia !== undefined) dbRow.childcare_experience = body.experiencia;
    if (body.dieta !== undefined) dbRow.dietary_info = body.dieta;
    if (body.carta_presentacion !== undefined) dbRow.letter_text = body.carta_presentacion;
    if (typeof body.referencias === "string") {
      try {
        dbRow.references_json = JSON.parse(body.referencias);
      } catch {
        dbRow.references_json = [{ nombre: "Referencia", relacion: body.referencias, email: "", telefono: "" }];
      }
    }

    // ── UPSERT en au_pair_profiles ────────────────────────────────────────
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verificar si ya existe un perfil para este usuario
    const { data: existing } = await supabaseAdmin
      .from("au_pair_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const intentar = () => existing
      ? supabaseAdmin.from("au_pair_profiles").update(dbRow).eq("user_id", userId).select("*").single()
      : supabaseAdmin.from("au_pair_profiles").insert(dbRow).select("*").single();

    let result = await intentar();

    // Resiliencia a migraciones pendientes: si la tabla aún no tiene alguna columna
    // (p. ej. estatus_residencia/residencia/pais_destino), se quita del row y se
    // reintenta, en vez de romper TODO el guardado del perfil con un 500.
    for (let i = 0; i < 5 && result.error; i++) {
      const m = result.error.message.match(/Could not find the '([^']+)' column/);
      if (!m) break;
      console.warn(`[au-pair/profile] columna '${m[1]}' no existe aún (falta migración) — guardando sin ella`);
      delete dbRow[m[1]];
      result = await intentar();
    }

    if (result.error) {
      console.error("[au-pair/profile] UPSERT final error:", result.error.message);
      return NextResponse.json(
        { error: "Error al guardar perfil: " + result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: result.data,
      message: existing ? "Perfil actualizado correctamente" : "Perfil creado correctamente",
    });
  } catch (error) {
    console.error("[au-pair/profile] POST Error:", (error as Error).message);
    return NextResponse.json({ error: "Error interno al guardar perfil" }, { status: 500 });
  }
}
