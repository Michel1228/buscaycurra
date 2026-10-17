/**
 * /api/cursos/sugerencias-cv — Avisa a quien tiene CV de un curso que le encaja.
 *
 * Cada 3 horas, desde el crontab del servidor (scripts/vps/sugerencias-cursos-cv.sh),
 * con la cabecera x-sync-secret. Lee el último CV de cada persona (user_cvs),
 * ve qué curso le falta para lo que ha trabajado (lib/cursos/sugerencia-cv.ts)
 * y busca una plaza gratis con fecha en su provincia u online. Si la hay, se lo
 * dice con la razón a la vista: "Veo en tu CV que has trabajado de camarera…".
 *
 * QUÉ PLAZA SE PUEDE SUGERIR (primera prueba, 12 oct 2026: se ofrecían cursos
 * del Consorci, en catalán y para gente con trabajo, como "online" a personas
 * de Navarra o Asturias). Una plaza de un servicio autonómico es para la gente
 * de esa comunidad. Así que vale si es presencial en su provincia, u online de
 * un servicio de su comunidad; nunca solo para ocupados (quien nos usa busca
 * trabajo); y que empiece dentro de 3 días o más, para que dé tiempo a apuntarse.
 *
 * PARA NO SER PESADOS, que es como se acaba en spam (y ahí se cae TODO nuestro
 * correo, no solo este):
 *   · Como mucho una sugerencia cada 14 días por persona, y nunca la misma
 *     plaza dos veces. Sin plaza, la ficha del curso, una sola vez por curso.
 *   · Quien la apaga (perfil o enlace del correo) no recibe ninguna más.
 *   · El correo respeta el presupuesto diario (lib/email/presupuesto-diario.ts);
 *     la campana de la aplicación va siempre, que no cuesta nada.
 *   · 15 por pasada.
 *
 * Para ver qué se mandaría sin mandar nada: ?simular=1.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import { secretIguales } from "@/lib/secret-compare";
import { cursosQueEncajan, textoSugerencia, type CvParaSugerir } from "@/lib/cursos/sugerencia-cv";
import { sinSugerencias, enlaceBajaSugerencias } from "@/lib/cursos/sugerencia-cv-baja";
import { buscarPlazas, type PlazaPublica } from "@/lib/cursos/plazas/db";
import { nombreProvincia } from "@/lib/cursos/plazas/provincias";
import { provinciaEnTexto } from "@/lib/guzzi/plazas-cursos";
import { sendCursoSugerenciaEmail } from "@/lib/email/smtp-sender";
import { quedaSitioParaLoQuePuedeEsperar } from "@/lib/email/presupuesto-diario";
import { set as cacheSet } from "@/lib/cache/redis-client";
import { plazaParaEsaPersona, ofertasEnZona } from "@/lib/cursos/para-esa-persona";

export const dynamic = "force-dynamic";
export const maxDuration = 280;

const TIPO = "curso_cv";
const DIAS_ENTRE_SUGERENCIAS = 14;
const MAX_POR_PASADA = 15;
/** Cuentas de prueba: reciben la campana, pero no se gasta correo en ellas. */
const DE_PRUEBA = /@(resend\.dev|buscaycurra\.es)$/i;

// La plaza y el recuento de ofertas, en lib/cursos/para-esa-persona.ts: Guzzi
// usa los mismos al contestar "¿qué curso me conviene?".

export async function POST(req: NextRequest) {
  if (!secretIguales(req.headers.get("x-sync-secret"), process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const simular = new URL(req.url).searchParams.get("simular") === "1";
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // ── El último CV de cada persona ─────────────────────────────────────────
  const { rows: cvs } = await getPool().query<{ user_id: string; form_data: CvParaSugerir & { ciudad?: unknown } }>(
    `SELECT DISTINCT ON (user_id) user_id, form_data
       FROM user_cvs WHERE form_data IS NOT NULL
      ORDER BY user_id, updated_at DESC`
  );
  const apagados = await sinSugerencias(cvs.map((c) => c.user_id));
  const candidatos = cvs.filter((c) => !apagados.has(c.user_id));
  const ids = candidatos.map((c) => c.user_id);

  // ── Lo que ya se les sugirió (la propia notificación hace de registro) ────
  const ultima = new Map<string, number>();
  const plazasVistas = new Map<string, Set<string>>();
  const cursosVistos = new Map<string, Set<string>>();
  const ciudadPerfil = new Map<string, string>();
  if (ids.length) {
    const { data: previas } = await sb.from("notificaciones")
      .select("user_id, created_at, datos").eq("tipo", TIPO).in("user_id", ids);
    for (const n of previas || []) {
      const t = new Date(n.created_at).getTime();
      if (t > (ultima.get(n.user_id) ?? 0)) ultima.set(n.user_id, t);
      const d = (n.datos || {}) as { plaza_id?: string; curso_slug?: string };
      if (d.plaza_id) (plazasVistas.get(n.user_id) ?? plazasVistas.set(n.user_id, new Set()).get(n.user_id)!).add(d.plaza_id);
      if (d.curso_slug) (cursosVistos.get(n.user_id) ?? cursosVistos.set(n.user_id, new Set()).get(n.user_id)!).add(d.curso_slug);
    }
    const { data: perfiles } = await sb.from("profiles").select("id, ciudad, provincia").in("id", ids);
    for (const p of perfiles || []) ciudadPerfil.set(p.id, [p.ciudad, p.provincia].filter(Boolean).join(" "));
  }

  const corte = Date.now() - DIAS_ENTRE_SUGERENCIAS * 86400000;
  const detalle: Array<Record<string, unknown>> = [];
  let enviadas = 0, correos = 0, sinCorreo = 0, sinCurso = 0, recientes = 0;

  for (const cv of candidatos) {
    if (enviadas >= MAX_POR_PASADA) break;
    if ((ultima.get(cv.user_id) ?? 0) > corte) { recientes++; continue; }
    const cursos = cursosQueEncajan(cv.form_data);
    if (!cursos.length) { sinCurso++; continue; }

    const ciudadCv = typeof cv.form_data.ciudad === "string" ? cv.form_data.ciudad : "";
    const provincia = provinciaEnTexto(`${ciudadCv} ${ciudadPerfil.get(cv.user_id) ?? ""}`);
    const zona = provincia ? nombreProvincia(provincia) : null;
    const yaPlazas = plazasVistas.get(cv.user_id) ?? new Set<string>();
    const yaCursos = cursosVistos.get(cv.user_id) ?? new Set<string>();

    // El primer curso que tenga una plaza nueva para esta persona; si ninguno
    // la tiene, la ficha del primero que no se le haya sugerido nunca.
    let elegido: { curso: (typeof cursos)[number]; plaza: PlazaPublica | null } | null = null;
    for (const curso of cursos) {
      // Quien ya trabaja de ello no necesita plaza: necesita saber que puede
      // acreditar su experiencia. Eso se le dice una vez (más abajo).
      if (curso.viaExperiencia || !provincia) continue;
      const nueva = (r: { plazas: PlazaPublica[] }) =>
        r.plazas.find((p) => !yaPlazas.has(p.id) && plazaParaEsaPersona(p, provincia)) ?? null;
      let plaza = nueva(await buscarPlazas({ ficha: curso.slug, provincia, limite: 20 }));
      if (!plaza) plaza = nueva(await buscarPlazas({ ficha: curso.slug, modalidad: "online", limite: 50 }));
      if (plaza) { elegido = { curso, plaza }; break; }
    }
    if (!elegido) {
      const curso = cursos.find((c) => !yaCursos.has(c.slug));
      if (curso) elegido = { curso, plaza: null };
    }
    if (!elegido) { sinCurso++; continue; }

    const { curso, plaza } = elegido;
    const total = zona && !curso.viaExperiencia ? await ofertasEnZona(curso.puestosQueLoPiden, zona).catch(() => 0) : 0;
    const { titulo, mensaje } = textoSugerencia(
      curso,
      plaza ? { ...plaza, provincia: nombreProvincia(plaza.provincia) } : null,
      zona ? { total, zona } : null
    );
    const rutaApp = curso.viaExperiencia ? "/cursos/acreditar"
      : plaza ? `/cursos/plazas?ficha=${encodeURIComponent(curso.slug)}` : `/cursos/${curso.slug}`;

    if (simular) {
      detalle.push({ usuario: cv.user_id.slice(0, 8), curso: curso.slug, plaza: plaza?.id ?? null, inicio: plaza?.inicio ?? null, zona, mensaje });
      enviadas++;
      continue;
    }

    // La campana, siempre: es el registro de lo sugerido y no gasta correo.
    await sb.from("notificaciones").insert({
      user_id: cv.user_id,
      tipo: TIPO,
      titulo,
      mensaje,
      datos: { curso_slug: curso.slug, plaza_id: plaza?.id ?? null, url: rutaApp },
      leida: false,
    });
    enviadas++;
    // El correo de ofertas también recomienda cursos: que no repita en dos semanas.
    await cacheSet(`curso-en-alerta:${cv.user_id}`, curso.slug, 14 * 86400).catch(() => false);

    const { data: usuario } = await sb.auth.admin.getUserById(cv.user_id);
    const email = usuario?.user?.email;
    if (!email || DE_PRUEBA.test(email)) { sinCorreo++; continue; }
    if (!(await quedaSitioParaLoQuePuedeEsperar())) { sinCorreo++; continue; }
    const salio = await sendCursoSugerenciaEmail({
      userEmail: email,
      titulo,
      mensaje,
      cursoNombre: curso.nombre,
      destinoUrl: `https://buscaycurra.es${rutaApp}`,
      conPlaza: !!plaza,
      viaExperiencia: curso.viaExperiencia,
      bajaUrl: enlaceBajaSugerencias(cv.user_id),
    });
    if (salio) correos++; else sinCorreo++;
  }

  return NextResponse.json({
    simulado: simular,
    conCv: cvs.length,
    apagados: apagados.size,
    enviadas,
    correos,
    sinCorreo,
    sinCurso,
    recientes,
    detalle: detalle.slice(0, 30),
  });
}
