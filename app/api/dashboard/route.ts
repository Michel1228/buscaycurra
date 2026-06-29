/**
 * GET /api/dashboard — Datos para el dashboard de bienvenida
 * Devuelve: stats del usuario, ofertas recomendadas, quick actions
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";

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
      .in("status", ["enviado", "pendiente"]);

    const { count: cvsEnviadosHoy } = await supabaseAdmin
      .from("cv_sends")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["enviado", "pendiente"])
      .gte("created_at", hoy.toISOString());

    // Entrevistas pendientes (pipeline estado "entrevista")
    const { data: entrevistasData } = await supabaseAdmin
      .from("cv_sends")
      .select("id")
      .eq("user_id", userId)
      .not("error_message", "is", null);

    let entrevistasPendientes = 0;
    if (entrevistasData) {
      for (const row of entrevistasData) {
        try {
          const parsed = JSON.parse((row as any).error_message || "{}");
          if (parsed.pipeline_estado === "entrevista") entrevistasPendientes++;
        } catch { /* ignore */ }
      }
    }

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

    let ofertasRecomendadas: any[] = [];

    // Intentar obtener ofertas con criterio de ubicación/sector
    let query = supabaseAdmin
      .from("ofertas")
      .select("id, titulo, empresa, ubicacion, salario, fuente, url, sector")
      .order("created_at", { ascending: false })
      .limit(12);

    if (profile?.ciudad) {
      query = query.ilike("ubicacion", `%${profile.ciudad}%`);
    }

    const { data: ofertas } = await query;

    if (ofertas && ofertas.length > 0) {
      ofertasRecomendadas = ofertas.slice(0, 6);
    } else {
      // Fallback: ofertas recientes sin filtro
      const { data: recientes } = await supabaseAdmin
        .from("ofertas")
        .select("id, titulo, empresa, ubicacion, salario, fuente, url, sector")
        .order("created_at", { ascending: false })
        .limit(6);

      ofertasRecomendadas = recientes || [];
    }

    // ── Quick actions ──
    const quickActions = [
      { icon: "✨", label: "Hablar con Guzzi", href: "/app/gusi", color: "#22c55e" },
      { icon: "📄", label: "Mejorar mi CV", href: "/app/curriculum", color: "#f59e0b" },
      { icon: "🔍", label: "Buscar ofertas", href: "/app/buscar", color: "#3b82f6" },
      { icon: "📊", label: "Mi pipeline", href: "/app/pipeline", color: "#a855f7" },
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
