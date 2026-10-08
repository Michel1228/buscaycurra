/**
 * /api/cursos/alertas — Avisa a quien encendió el aviso de un curso de que hay
 * trabajo que lo pide.
 *
 * POR QUÉ ESTA ALERTA Y NO LA OBVIA. Lo natural habría sido avisar cuando salga
 * una convocatoria del curso, pero esas plazas no las tenemos: los datos
 * abiertos solo cubren algunas comunidades y para media España no hay nada.
 * Prometer un aviso que casi nunca llegaría es peor que no prometerlo.
 *
 * Lo que sí tenemos son 2,2 millones de ofertas y, en cada ficha de curso, la
 * lista de puestos que lo piden. Así que el aviso es el motivo por el que esa
 * persona se estaba formando: "hay 167 ofertas de gerocultor que piden esto".
 * Eso lo podemos decir hoy y es verdad.
 *
 * QUIÉN RECIBE. Solo quien encendió el interruptor en la ficha (tabla
 * curso_aviso, activo = true). No se avisa a nadie por haber mirado el curso ni
 * por haber preparado una solicitud: eso sería suscribir a la gente sin que lo
 * pida, que es como se acaba en la carpeta de spam — y ahí se cae TODO nuestro
 * correo, no solo este.
 *
 * CÓMO NO REPETIRSE. `avisado_en` en la propia fila, no en Redis: un vaciado de
 * caché no puede provocar una segunda tanda de correos.
 *
 * DÓNDE LLEGA. Correo y campana de la aplicación, las dos cosas. Quien no abre
 * el correo entra a la web y lo ve igual.
 *
 * Se lanza desde el crontab del servidor (scripts/vps/alertas-cursos.sh, 09:00
 * UTC) con la cabecera x-sync-secret. Hasta el 8 oct 2026 solo estaba en
 * .github/workflows/alertas-cursos.yml, que en esta rama no se ejecuta: no
 * llegó a mandarse ni una alerta.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import { secretIguales } from "@/lib/secret-compare";
import { sendCursoAlertaEmail } from "@/lib/email/smtp-sender";
import { tipoPorSlug } from "@/lib/cursos/tipos";
import { quedaSitioParaLoQuePuedeEsperar } from "@/lib/email/presupuesto-diario";
import { enlaceBajaAviso } from "@/lib/cursos/baja-aviso";
import { buscarPlazas } from "@/lib/cursos/plazas/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Días entre dos avisos del mismo curso a la misma persona. */
const DIAS_ENTRE_AVISOS = 14;

/**
 * Tope por ejecución. Era 200, el doble de lo que deja Resend gratis en un día
 * entero (100): una sola pasada podía dejar sin correo de confirmación a quien
 * se registrase esa tarde. Además, cada envío mira el presupuesto diario
 * (lib/email/presupuesto-diario.ts) y lo que no quepa sale al día siguiente.
 */
const MAX_CORREOS = 40;

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sync-secret");
  if (!secretIguales(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const simular = new URL(req.url).searchParams.get("simular") === "1";
  const sb = supabaseAdmin();

  const corte = new Date(Date.now() - DIAS_ENTRE_AVISOS * 24 * 60 * 60 * 1000).toISOString();

  // Avisos encendidos a los que les toca: o nunca se les avisó, o hace más de
  // catorce días.
  const { data: avisos, error } = await sb
    .from("curso_aviso")
    .select("id, user_id, curso_slug, curso_nombre, avisado_en")
    .eq("activo", true)
    .or(`avisado_en.is.null,avisado_en.lt.${corte}`)
    .limit(MAX_CORREOS * 2);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo leer curso_aviso: " + error.message },
      { status: 500 }
    );
  }

  const pool = getPool();

  // Las ofertas por curso se cuentan UNA vez aunque haya cien personas
  // esperando el mismo carretillero. Con el servidor como está, repetir una
  // consulta de 2,2 millones de filas por persona sería tumbarlo.
  const porCurso = new Map<string, { total: number; ejemplo?: { title: string; company: string; city: string | null } }>();

  let enviados = 0;
  let sinOfertas = 0;
  let sinEmail = 0;
  let aplazados = 0;
  let fallidos = 0;
  const plazasPorCurso = new Map<string, number>();
  const detalle: Array<{ curso: string; ofertas: number }> = [];

  for (const aviso of avisos ?? []) {
    if (enviados >= MAX_CORREOS) break;

    const tipo = tipoPorSlug(aviso.curso_slug, "ES");
    if (!tipo || tipo.puestos.length === 0) continue;

    if (!porCurso.has(aviso.curso_slug)) {
      // PALABRA ENTERA Y SOLO EL PAÍS DEL CURSO. Las dos cosas hacen falta, y
      // medido en producción las dos importan:
      //
      //   · ILIKE '%dependiente%' casa con "Agente comercial INDEPENDIENTE", y
      //     '%cuidador%' con "Cuidador/a de Mascotas". Poner eso de ejemplo en
      //     un correo sobre el certificado de gerocultor nos deja en ridículo.
      //   · Sin filtrar por país contábamos las ofertas del mundo entero: la
      //     alerta de atención al cliente decía 5.034 cuando en España hay
      //     1.333, y la de carretillero metía 51 ofertas de Suecia.
      //
      // `\y` es el límite de palabra de Postgres. Los puestos salen de nuestro
      // catálogo, pero se escapan igual: el día que alguien escriba un puesto
      // con un paréntesis, esto no se puede convertir en una regex rota.
      const patron =
        "\\y(" +
        tipo.puestos
          .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|") +
        ")\\y";

      // count(*) OVER () cuenta el total ANTES del LIMIT, así que sale el
      // número real con una sola consulta. Contar rows.length sobre un LIMIT
      // 200 decía "200 ofertas" cuando había 696, y ese número va en el correo.
      const { rows } = await pool.query(
        `SELECT title, company, city, count(*) OVER ()::int AS total
           FROM "JobListing"
          WHERE "isActive" = true
            AND lower(country) = lower($2)
            AND title ~* $1
          LIMIT 1`,
        [patron, tipo.pais]
      );
      porCurso.set(aviso.curso_slug, {
        total: rows[0]?.total ?? 0,
        ejemplo: rows[0]
          ? { title: rows[0].title, company: rows[0].company, city: rows[0].city }
          : undefined,
      });
    }

    const hallazgo = porCurso.get(aviso.curso_slug)!;
    if (hallazgo.total === 0 || !hallazgo.ejemplo) { sinOfertas++; continue; }

    if (!detalle.some(d => d.curso === aviso.curso_slug)) {
      detalle.push({ curso: aviso.curso_slug, ofertas: hallazgo.total });
    }

    if (simular) { enviados++; continue; }

    // Sin cupo para lo que puede esperar, se para aquí: estos avisos no se
    // marcan y salen en la siguiente pasada.
    if (!(await quedaSitioParaLoQuePuedeEsperar())) { aplazados++; break; }

    const nombre = aviso.curso_nombre || tipo.nombre;

    // Plazas gratis con fecha de ese curso, una vez por curso.
    if (!plazasPorCurso.has(aviso.curso_slug)) {
      const n = await buscarPlazas({ ficha: aviso.curso_slug, limite: 1 }).then(r => r.total).catch(() => 0);
      plazasPorCurso.set(aviso.curso_slug, n);
    }

    // El correo está en auth.users, no en curso_aviso.
    const { data: usuario } = await sb.auth.admin.getUserById(aviso.user_id);
    const email = usuario?.user?.email;

    if (email) {
      const salio = await sendCursoAlertaEmail({
        userEmail: email,
        cursoNombre: nombre,
        cursoSlug: aviso.curso_slug,
        total: hallazgo.total,
        ejemploTitle: hallazgo.ejemplo.title,
        ejemploCompany: hallazgo.ejemplo.company || "Empresa",
        ejemploCity: hallazgo.ejemplo.city || undefined,
        obligatorio: tipo.obligatorioLegal,
        ofertasUrl: `https://buscaycurra.es/app/buscar?keyword=${encodeURIComponent(tipo.puestos[0])}`,
        plazas: plazasPorCurso.get(aviso.curso_slug) ?? 0,
        bajaUrl: enlaceBajaAviso(String(aviso.id)),
      });
      // Si no salió, no se marca: se reintenta en la siguiente pasada en vez
      // de dar por avisada a una persona a la que no le llegó nada.
      if (!salio) { fallidos++; continue; }
    } else {
      sinEmail++;
    }

    // La campana de la aplicación, para quien no abre el correo. Va aunque no
    // haya email: es el mismo aviso por otra puerta.
    await sb.from("notificaciones").insert({
      user_id: aviso.user_id,
      tipo: "curso",
      titulo: `${hallazgo.total} ofertas piden ${nombre}`,
      mensaje: `Por ejemplo: ${hallazgo.ejemplo.title}${hallazgo.ejemplo.city ? ` en ${hallazgo.ejemplo.city}` : ""}.`,
      // El destino son LAS OFERTAS QUE ANUNCIA, no un listado cualquiera. Si el
      // aviso dice "200 ofertas piden carretillero", al pulsarlo tienen que
      // salir esas 200 y no la búsqueda vacía.
      datos: {
        curso_slug: aviso.curso_slug,
        total: hallazgo.total,
        url: `/app/buscar?keyword=${encodeURIComponent(tipo.puestos[0])}`,
      },
    });

    await sb
      .from("curso_aviso")
      .update({ avisado_en: new Date().toISOString() })
      .eq("id", aviso.id);

    enviados++;
  }

  return NextResponse.json({
    simulado: simular,
    avisosActivos: avisos?.length ?? 0,
    enviados,
    sinOfertas,
    sinEmail,
    aplazados,
    fallidos,
    detalle: detalle.slice(0, 20),
  });
}
