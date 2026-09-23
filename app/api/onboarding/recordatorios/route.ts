/**
 * POST /api/onboarding/recordatorios — Un aviso a quien se quedó a medias.
 *
 * POR QUÉ EXISTE. A 23 sep 2026: 122 personas registradas, 36 con CV subido y
 * solo 6 habían mandado un CV en 30 días. Quien se registra y no termina no
 * vuelve solo; esto le recuerda UNA VEZ el paso que le falta, con su enlace.
 *
 * REGLAS QUE NO SE TOCAN
 *
 *  - UNA SOLA VEZ por persona. La marca es una fila en `notificaciones` con
 *    tipo "recordatorio_primer_dia": si ya está, no se vuelve a mandar. Se
 *    escribe DESPUÉS de que Resend confirme el envío, para no dar por avisado a
 *    quien no recibió nada.
 *  - Solo a quien lleva al menos un día registrado (dar la turra a los diez
 *    minutos es molesto) y menos de treinta (a esas alturas ya no es un
 *    recordatorio, es publicidad).
 *  - Nunca a quien ya ha hecho los tres pasos.
 *  - `?probar=1` enseña a quién se le mandaría SIN mandar nada.
 *
 * Lo llama el crontab del VPS una vez al día (scripts/vps/recordatorios.sh).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { secretIguales } from "@/lib/secret-compare";
import { sendPrimerDiaEmail } from "@/lib/email/smtp-sender";
import { usuariosAMedias } from "@/lib/onboarding/primer-dia";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TIPO = "recordatorio_primer_dia";
const DIAS_MINIMO = 1;
const DIAS_MAXIMO = 30;
/** Tope por pasada: si algo va mal, que no se estropee con todos a la vez. */
const MAX_POR_PASADA = 50;

export async function POST(request: NextRequest) {
  const secreto = request.headers.get("x-admin-secret");
  if (!secreto || !process.env.ADMIN_SECRET || !secretIguales(secreto, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parametros = new URL(request.url).searchParams;
  const soloProbar = parametros.get("probar") === "1";

  // ?muestra=correo@ejemplo.com — manda UNA copia de cortesía a esa dirección
  // para poder leer el texto antes de que lo reciba nadie más. No toca a ningún
  // usuario, no deja marca y no cuenta como aviso.
  const muestra = parametros.get("muestra");
  if (muestra) {
    const salio = await sendPrimerDiaEmail({
      email: muestra,
      nombre: "",
      paso: {
        titulo: "Sube tu CV",
        porQue:
          "Se guarda una vez y ya se usa en todos los envíos. Si no tienes uno, Guzzi te lo monta con lo que le cuentes.",
        ruta: "/app/curriculum",
        textoBoton: "Subir mi CV",
      },
      pasosHechos: 1,
      pasosTotales: 3,
    });
    return NextResponse.json({ ok: salio, muestra: true, enviadoA: muestra });
  }

  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── 1. Quién se registró en la ventana ────────────────────────────────
    const ahora = Date.now();
    const candidatos: Array<{ id: string; email: string; alta: string }> = [];
    for (let pagina = 1; pagina <= 20; pagina++) {
      const { data, error } = await sb.auth.admin.listUsers({ page: pagina, perPage: 200 });
      if (error) throw new Error(error.message);
      const usuarios = data.users || [];
      for (const u of usuarios) {
        if (!u.email) continue;
        const dias = (ahora - new Date(u.created_at).getTime()) / 86400000;
        if (dias >= DIAS_MINIMO && dias <= DIAS_MAXIMO) {
          candidatos.push({ id: u.id, email: u.email, alta: u.created_at });
        }
      }
      if (usuarios.length < 200) break;
    }

    if (!candidatos.length) {
      return NextResponse.json({ ok: true, enviados: 0, motivo: "nadie en la ventana de tiempo" });
    }

    // ── 2. Fuera los que ya recibieron el aviso ───────────────────────────
    const { data: yaAvisados } = await sb
      .from("notificaciones")
      .select("user_id")
      .eq("tipo", TIPO)
      .in("user_id", candidatos.map((c) => c.id));
    const avisados = new Set((yaAvisados || []).map((n: { user_id: string }) => n.user_id));

    const pendientes = candidatos.filter((c) => !avisados.has(c.id));
    if (!pendientes.length) {
      return NextResponse.json({ ok: true, enviados: 0, motivo: "todos avisados ya" });
    }

    // ── 3. Qué le falta a cada uno ────────────────────────────────────────
    const estados = await usuariosAMedias(sb, pendientes.map((p) => p.id));
    const { data: perfiles } = await sb
      .from("profiles")
      .select("id, full_name, nombre")
      .in("id", pendientes.map((p) => p.id));
    const nombres = new Map(
      (perfiles || []).map((p: { id: string; full_name: string | null; nombre: string | null }) => [
        p.id,
        p.full_name || p.nombre || "",
      ])
    );

    const aAvisar = pendientes
      .filter((p) => {
        const e = estados.get(p.id);
        return e && !e.completado && e.siguiente;
      })
      .slice(0, MAX_POR_PASADA);

    if (soloProbar) {
      return NextResponse.json({
        ok: true,
        probar: true,
        candidatos: candidatos.length,
        yaAvisados: avisados.size,
        seAvisaria: aAvisar.length,
        detalle: aAvisar.map((p) => ({
          correo: p.email.replace(/^(.).*(@.*)$/, "$1***$2"),
          dias: Math.floor((ahora - new Date(p.alta).getTime()) / 86400000),
          leFalta: estados.get(p.id)!.siguiente!.titulo,
        })),
      });
    }

    // ── 4. Enviar, y anotar SOLO lo que salió ─────────────────────────────
    let enviados = 0;
    const fallos: string[] = [];
    for (const persona of aAvisar) {
      const estado = estados.get(persona.id)!;
      const paso = estado.siguiente!;
      const salio = await sendPrimerDiaEmail({
        email: persona.email,
        nombre: nombres.get(persona.id) || "",
        paso,
        pasosHechos: estado.hechos,
        pasosTotales: estado.pasos.length,
      });

      if (!salio) {
        fallos.push(persona.id);
        continue;
      }

      enviados++;
      // La misma fila sirve de marca (no repetir) y de aviso dentro de la app.
      await sb.from("notificaciones").insert({
        user_id: persona.id,
        tipo: TIPO,
        titulo: "Te queda un paso",
        mensaje: paso.titulo,
        datos: { ruta: paso.ruta, paso: paso.id },
        leida: false,
      });
    }

    console.log(`[recordatorios] ${enviados} enviados, ${fallos.length} fallidos de ${aAvisar.length}`);
    return NextResponse.json({ ok: true, enviados, fallidos: fallos.length, candidatos: aAvisar.length });
  } catch (error) {
    console.error("[onboarding/recordatorios] Error:", (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
