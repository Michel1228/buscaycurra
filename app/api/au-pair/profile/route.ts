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
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error } = await supabase
      .from("au_pair_profiles")
      .select("*")
      .eq("user_id", userId)
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

/** Campos que acepta el POST para crear/actualizar el perfil */
interface AuPairProfileInput {
  nombre?: string;
  edad?: number;
  nacionalidad?: string;
  nationality?: string; // fallback key inglés
  residencia?: string;
  estatus_residencia?: string;
  ciudad?: string;
  pais_destino?: string;
  nivel_educativo?: string;
  duracion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  idiomas?: string[];
  fotos?: string[];
  referencias?: string;
  experiencia?: string;
  hobbies?: string;
  dieta?: string;
  aptitudes?: Record<string, unknown>;
  tipo_perfil?: string;
  carta_presentacion?: string;
  disponibilidad?: string;
}

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
    const body: AuPairProfileInput = await request.json();

    // ── Mapear campos del frontend a columnas de la BD ────────────────────
    const dbRow: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (body.nombre !== undefined) dbRow.nombre = body.nombre;
    if (body.edad !== undefined) dbRow.age = body.edad;
    if (body.nacionalidad !== undefined) dbRow.nationality = body.nacionalidad;
    if (body.nationality !== undefined) dbRow.nationality = body.nationality; // fallback key inglés
    if (body.residencia !== undefined) dbRow.residencia = body.residencia;
    if (body.estatus_residencia !== undefined) dbRow.estatus_residencia = body.estatus_residencia;
    if (body.ciudad !== undefined) dbRow.ciudad = body.ciudad;
    if (body.nivel_educativo !== undefined) dbRow.nivel_educativo = body.nivel_educativo;
    if (body.duracion !== undefined) dbRow.duracion_preferida = body.duracion;
    if (body.fecha_inicio !== undefined) dbRow.available_from = body.fecha_inicio;
    if (body.fecha_fin !== undefined) dbRow.available_to = body.fecha_fin;
    if (body.idiomas !== undefined) dbRow.languages = body.idiomas;
    if (body.fotos !== undefined) dbRow.photos = body.fotos;
    if (body.referencias !== undefined) {
      // Intentar parsear como JSON; si falla, guardar como string
      try {
        dbRow.references_json = JSON.parse(body.referencias);
      } catch {
        dbRow.references_json = [{ nombre: "Referencia", relacion: body.referencias, email: "", telefono: "" }];
      }
    }
    if (body.experiencia !== undefined) dbRow.childcare_experience = body.experiencia;
    if (body.hobbies !== undefined) dbRow.hobbies = body.hobbies;
    if (body.dieta !== undefined) dbRow.dietary_info = body.dieta;
    if (body.aptitudes !== undefined) {
      // Guardar aptitudes como JSONB en una columna existente o en references_json
      // Como no hay columna específica para aptitudes, las guardamos en una propiedad extra
      // dentro de un campo JSONB existente. Usamos references_json ampliado.
      // Alternativa: guardamos en dietary_info como JSON string (hack)
      // Mejor: usamos una nota en hobbies o creamos un objeto combinado
      dbRow.aptitudes_json = body.aptitudes;
    }
    if (body.carta_presentacion !== undefined) dbRow.letter_text = body.carta_presentacion;

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

    let result;
    if (existing) {
      // Actualizar perfil existente
      result = await supabaseAdmin
        .from("au_pair_profiles")
        .update(dbRow)
        .eq("user_id", userId)
        .select("*")
        .single();
    } else {
      // Crear nuevo perfil
      result = await supabaseAdmin
        .from("au_pair_profiles")
        .insert(dbRow)
        .select("*")
        .single();
    }

    if (result.error) {
      console.error("[au-pair/profile] UPSERT error:", result.error.message);
      // Si falló por la columna aptitudes_json, reintentar sin ella
      if (result.error.message.includes("aptitudes_json")) {
        delete dbRow.aptitudes_json;
        if (existing) {
          result = await supabaseAdmin
            .from("au_pair_profiles")
            .update(dbRow)
            .eq("user_id", userId)
            .select("*")
            .single();
        } else {
          result = await supabaseAdmin
            .from("au_pair_profiles")
            .insert(dbRow)
            .select("*")
            .single();
        }
      }
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
