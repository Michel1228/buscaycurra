/**
 * /api/consultas — Consultas que la persona manda desde la app (lib/consultas/consultas.ts).
 *
 * GET                                              → { consultas, organismos }
 * POST { accion: "borrador", tipo, ref }           → { asunto, cuerpo, destino }
 * POST { accion: "enviar", tipo, ref, asunto, cuerpo, conCV } → { ok }
 *
 * El correo de destino nunca viene del navegador: lo saca el servidor de
 * lib/consultas/destinos.ts (acreditación) o de la plaza en la base (cursos).
 */
import { NextRequest, NextResponse } from "next/server";
import { getUsuario, correoSinVerificar } from "@/lib/auth-server";
import { checkUserRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit-user";
import { ACREDITACION_CCAA } from "@/lib/consultas/destinos";
import { borrador, consultasDe, destinoDe, enviar, type TipoConsulta } from "@/lib/consultas/consultas";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // el CV en PDF y la IA

const TIPOS: TipoConsulta[] = ["acreditacion", "plaza"];

export async function GET(req: NextRequest) {
  const u = await getUsuario(req);
  const organismos = ACREDITACION_CCAA.map((o) => ({ id: o.id, ccaa: o.ccaa, organismo: o.organismo, conCorreo: !!o.email, web: o.web }));
  if (!u) return NextResponse.json({ consultas: [], organismos });
  try {
    return NextResponse.json({ consultas: await consultasDe(u.id), organismos });
  } catch (e) {
    console.error("[consultas] GET:", (e as Error).message);
    return NextResponse.json({ consultas: [], organismos });
  }
}

export async function POST(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  const u = await getUsuario(req);
  if (!u) return NextResponse.json({ error: "Entra para mandar tu consulta" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { accion?: string; tipo?: string; ref?: string; asunto?: string; cuerpo?: string; conCV?: boolean };
  const tipo = body.tipo as TipoConsulta;
  if (!TIPOS.includes(tipo) || !body.ref) return NextResponse.json({ error: "Falta a quién va" }, { status: 400 });
  try {
    const destino = await destinoDe(tipo, String(body.ref).slice(0, 80));
    if (!destino) return NextResponse.json({ error: "No encontramos ese destino" }, { status: 404 });
    if (body.accion === "borrador") {
      if (!(await checkUserRateLimit("consulta-borrador", u.id, 20, 3600))) return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
      const b = await borrador(u.id, u.email, destino);
      return NextResponse.json({ ...b, destino: { nombre: destino.nombre, conCorreo: !!destino.email, web: destino.web, detalle: destino.detalle } });
    }
    if (body.accion === "enviar") {
      const r = await enviar(u.id, u.email, destino, String(body.asunto || ""), String(body.cuerpo || ""), body.conCV !== false);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
      return NextResponse.json({ ok: true, id: r.id });
    }
    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (e) {
    console.error("[consultas] POST:", (e as Error).message);
    return NextResponse.json({ error: "No se pudo ahora. Inténtalo de nuevo." }, { status: 500 });
  }
}
