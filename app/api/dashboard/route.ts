/**
 * GET /api/dashboard — Datos para el dashboard de bienvenida
 * Devuelve: stats del usuario, ofertas recomendadas, quick actions
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";
import { ESTADOS_QUE_GASTAN_CUOTA } from "@/lib/cv-sender/rate-limiter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Autenticar
    const authHeader = request.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabasePublico = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabasePublico.auth.getUser(authHeader.slice(7));
      if (user) userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // ── Stats ──
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Ofertas nuevas hoy desde la BD local (JobListing PostgreSQL)
    let ofertasHoy = 0;
    try {
      const pool = getPool();
      const res = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::int AS count FROM "JobListing"
         WHERE "isActive" = true AND "createdAt" >= $1`,
        [hoy.toISOString()]
      );
      ofertasHoy = parseInt(res.rows[0]?.count || "0", 10);
    } catch { /* fallback a 0 si la BD local no está disponible */ }

    // CVs enviados (total y hoy)
    const { count: cvsEnviadosTotal } = await supabaseAdmin
      .from("cv_sends")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ESTADOS_QUE_GASTAN_CUOTA);

    const { count: cvsEnviadosHoy } = await supabaseAdmin
      .from("cv_sends")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ESTADOS_QUE_GASTAN_CUOTA)
      .gte("created_at", hoy.toISOString());

    // Entrevistas pendientes (pipeline estado "entrevista") — filtrado en SQL
    const { count: entrevistasPendientes } = await supabaseAdmin
      .from("cv_sends")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("error_message", "is", null)
      .like("error_message", '%"pipeline_estado":"entrevista"%');

    // Ofertas en pipeline activas
    const { count: pipelineActivo } = await supabaseAdmin
      .from("cv_sends")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("status", "is", null);

    // ── Ofertas recomendadas (basadas en ubicación/sector del perfil) ──
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("ciudad, sector")
      .eq("id", userId)
      .single();

    // LAS SEIS OFERTAS DE LA PORTADA.
    //
    // Esto leia la tabla `ofertas` de Supabase, que lleva congelada desde el 5
    // de julio. Pero la tarjeta enlaza a /app/ofertas/<id>, y esa pagina
    // consulta JobListing en la base propia. Son dos espacios de identificador
    // distintos: ninguno de los seis enlaces llevaba a ninguna parte.
    //
    // No daba error. Salian seis ofertas con buena pinta, con su titulo y su
    // empresa, y al pulsar cualquiera aparecia "Oferta no encontrada". Es lo
    // primero que ve alguien al entrar en la aplicacion.
    //
    // Ahora se leen de la misma tabla a la que apunta el enlace.
    let ofertasRecomendadas: any[] = [];
    try {
      const pool = getPool();
      // Se piden por ciudad si la sabemos, y si no hay suficientes se
      // completan con las mas recientes. En una sola consulta, ordenando por
      // "las de tu ciudad primero", en vez de dos viajes a la base.
      const { rows } = await pool.query(
        `SELECT id, title, company, city, salary, "sourceName", sector
           FROM "JobListing"
          WHERE "isActive"
            AND ($1::text IS NULL OR city ILIKE '%' || $1 || '%')
          ORDER BY "createdAt" DESC
          LIMIT 6`,
        [profile?.ciudad || null]
      );

      let filas = rows;
      // Si su ciudad no tiene seis, se rellena con lo mas reciente de donde sea:
      // una portada con dos tarjetas se ve rota.
      if (filas.length < 6) {
        const { rows: extra } = await pool.query(
          `SELECT id, title, company, city, salary, "sourceName", sector
             FROM "JobListing"
            WHERE "isActive" AND id <> ALL($1::text[])
            ORDER BY "createdAt" DESC
            LIMIT $2`,
          [filas.map((r: any) => r.id), 6 - filas.length]
        );
        filas = [...filas, ...extra];
      }

      ofertasRecomendadas = filas.map((r: any) => ({
        id: r.id,
        titulo: r.title,
        empresa: r.company,
        ubicacion: r.city,
        salario: r.salary,
        fuente: r.sourceName,
        sector: r.sector,
      }));
    } catch (e) {
      // Sin ofertas la portada sigue en pie: quedan las estadisticas y los
      // accesos rapidos. Pero que se vea en el registro, que antes un fallo
      // aqui era indistinguible de "no hay ofertas".
      console.error("[dashboard] No se pudieron leer las ofertas recomendadas:", e);
    }

    // ── Quick actions ──
    // OJO CON EL NOMBRE DEL ICONO. Aqui iban emoji ("✨", "📄", "🔍", "📊"),
    // pero el cliente los resuelve con un switch que espera nombres en
    // mayusculas (SPARKLES, FILETEXT, SEARCH, BARCHART3) y cae en `default:
    // <Zap/>` con cualquier otra cosa.
    //
    // Resultado: las cuatro acciones rapidas salian con EL MISMO RAYO, para
    // cuatro cosas distintas —hablar con Guzzi, mejorar el CV, buscar ofertas y
    // el pipeline—, asi que el icono no decia absolutamente nada. Michel lo vio
    // a simple vista antes que nadie.
    //
    // Alguien migro el cliente de emoji a iconos y se dejo esta ruta. El
    // respaldo escrito a mano dentro del componente SI tenia los nombres
    // buenos, pero nunca se usaba: esta lista siempre gana.
    const quickActions = [
      { icon: "SPARKLES", label: "Hablar con Guzzi", href: "/app/gusi", color: "#22c55e" },
      { icon: "FILETEXT", label: "Mejorar mi CV", href: "/app/curriculum", color: "#f59e0b" },
      { icon: "SEARCH",   label: "Buscar ofertas", href: "/app/buscar", color: "#3b82f6" },
      { icon: "BARCHART3", label: "Mi pipeline", href: "/app/pipeline", color: "#a855f7" },
    ];

    return NextResponse.json({
      stats: {
        ofertasNuevasHoy: ofertasHoy,
        cvsEnviados: cvsEnviadosTotal || 0,
        cvsEnviadosHoy: cvsEnviadosHoy || 0,
        entrevistasPendientes,
        pipelineActivo: pipelineActivo || 0,
      },
      ofertasRecomendadas: ofertasRecomendadas.map((o: any) => ({
        id: o.id,
        titulo: o.titulo,
        empresa: o.empresa || "Empresa",
        ubicacion: o.ubicacion || "",
        salario: o.salario || "Consultar",
        fuente: o.fuente || "buscaycurra",
        url: o.url || "",
        sector: o.sector || "",
      })),
      quickActions,
    });
  } catch (error) {
    console.error("[dashboard] Error:", (error as Error).message);
    return NextResponse.json(
      {
        stats: { ofertasNuevasHoy: 0, cvsEnviados: 0, cvsEnviadosHoy: 0, entrevistasPendientes: 0, pipelineActivo: 0 },
        ofertasRecomendadas: [],
        quickActions: [],
      },
      { status: 200 }
    );
  }
}
