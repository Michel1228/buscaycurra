/**
 * /api/cursos/progreso — Lo que cada uno lleva hecho con sus cursos.
 *
 * GET               → todos mis cursos guardados, el más reciente primero
 * POST { slug, ... } → guardar o actualizar uno
 * DELETE ?slug=     → quitarlo de mi lista
 *
 * Es el equivalente de saved_jobs y el pipeline, pero para formación. Hasta
 * ahora la carta de solicitud se generaba, se enseñaba en pantalla y se perdía
 * al cerrar la pestaña.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserId } from "@/lib/auth-server";
import { tipoPorSlug } from "@/lib/cursos/tipos";

export const dynamic = "force-dynamic";

const ESTADOS = ["guardado", "preparado", "inscrito", "haciendo", "terminado"] as const;
type Estado = (typeof ESTADOS)[number];

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Entra para ver tus cursos" }, { status: 401 });

  const { data, error } = await admin()
    .from("curso_progreso")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[cursos/progreso] GET:", error.message);
    return NextResponse.json({ error: "No se pudo leer tu lista" }, { status: 500 });
  }

  return NextResponse.json({ cursos: data ?? [] });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Entra para guardar el curso" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    slug?: string;
    estado?: string;
    notas?: string;
    documentosHechos?: string[];
  };

  const slug = body.slug;
  if (!slug) return NextResponse.json({ error: "Falta slug" }, { status: 400 });

  const tipo = tipoPorSlug(slug, "ES");
  if (!tipo) return NextResponse.json({ error: "Ese curso no existe" }, { status: 404 });

  // Solo se escribe lo que venga: así el mismo endpoint sirve para "guardar el
  // curso", "marcar un papel" y "cambiar de estado" sin pisarse entre ellos.
  const fila: Record<string, unknown> = {
    user_id: userId,
    curso_slug: slug,
    curso_nombre: tipo.nombre,
    updated_at: new Date().toISOString(),
  };

  if (body.estado && (ESTADOS as readonly string[]).includes(body.estado)) {
    fila.estado = body.estado as Estado;
  }
  if (typeof body.notas === "string") fila.notas = body.notas.slice(0, 2000);
  if (Array.isArray(body.documentosHechos)) {
    fila.documentos_hechos = body.documentosHechos.slice(0, 40).map(String);
  }

  const { error } = await admin()
    .from("curso_progreso")
    .upsert(fila, { onConflict: "user_id,curso_slug" });

  if (error) {
    console.error("[cursos/progreso] POST:", error.message);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Falta slug" }, { status: 400 });

  const { error } = await admin()
    .from("curso_progreso")
    .delete()
    .eq("user_id", userId)
    .eq("curso_slug", slug);

  if (error) {
    console.error("[cursos/progreso] DELETE:", error.message);
    return NextResponse.json({ error: "No se pudo quitar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
