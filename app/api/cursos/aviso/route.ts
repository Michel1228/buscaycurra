/**
 * /api/cursos/aviso — Encender y apagar el aviso de un curso.
 *
 * GET  ?slug=carretillero  → si lo tengo encendido
 * POST { slug, activo }    → lo enciendo o lo apago
 *
 * Quien lo enciende entra en el reparto diario de /api/cursos/alertas, que le
 * avisa cuando hay ofertas de trabajo que piden ese curso. No es una lista de
 * correo: es un interruptor por curso, y se apaga desde el mismo sitio.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserId } from "@/lib/auth-server";
import { tipoPorSlug } from "@/lib/cursos/tipos";

export const dynamic = "force-dynamic";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Falta slug" }, { status: 400 });

  const userId = await getUserId(req);
  // Sin sesión no es un error: la ficha es pública y el interruptor sale
  // apagado, invitando a entrar.
  if (!userId) return NextResponse.json({ sesion: false, activo: false });

  const { data } = await admin()
    .from("curso_aviso")
    .select("activo")
    .eq("user_id", userId)
    .eq("curso_slug", slug)
    .maybeSingle();

  return NextResponse.json({ sesion: true, activo: data?.activo === true });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Entra para activar el aviso" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { slug?: string; activo?: boolean };
  const slug = body.slug;
  if (!slug) return NextResponse.json({ error: "Falta slug" }, { status: 400 });

  // Que el curso exista de verdad: si no, se llenaría la tabla de avisos que
  // no se pueden cumplir porque no hay ficha detrás.
  const tipo = tipoPorSlug(slug, "ES");
  if (!tipo) return NextResponse.json({ error: "Ese curso no existe" }, { status: 404 });

  const activo = body.activo !== false;

  const { error } = await admin()
    .from("curso_aviso")
    .upsert(
      {
        user_id: userId,
        curso_slug: slug,
        curso_nombre: tipo.nombre,
        activo,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,curso_slug" }
    );

  if (error) {
    console.error("[cursos/aviso] Error guardando:", error.message);
    return NextResponse.json({ error: "No se pudo guardar el aviso" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, activo });
}
