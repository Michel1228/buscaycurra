"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import GuzziAvatar from "@/components/GuzziAvatar";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface DashboardStats {
  ofertasNuevasHoy: number;
  cvsEnviados: number;
  cvsEnviadosHoy: number;
  entrevistasPendientes: number;
  pipelineActivo: number;
}

interface OfertaRec {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario: string;
  fuente: string;
  url: string;
  sector: string;
}

interface QuickAction {
  icon: string;
  label: string;
  href: string;
  color: string;
}

export default function BienvenidaClient() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    ofertasNuevasHoy: 0,
    cvsEnviados: 0,
    cvsEnviadosHoy: 0,
    entrevistasPendientes: 0,
    pipelineActivo: 0,
  });
  const [ofertas, setOfertas] = useState<OfertaRec[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const session = (await getSupabaseBrowser().auth.getSession()).data.session;
        if (!session) { router.push("/auth/login"); return; }

        // Obtener nombre real del perfil
        const { data: perfil } = await getSupabaseBrowser()
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();
        const nombre = perfil?.full_name?.split(" ")[0] || session.user.email?.split("@")[0] || "";
        setUserName(nombre);

        // Cargar dashboard
        const res = await fetch("/api/dashboard", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setOfertas(data.ofertasRecomendadas || []);
          setQuickActions(data.quickActions || []);
        }
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [router]);

  // ── Stat cards ──
  const statCards = [
    {
      icon: "🆕",
      label: "Ofertas nuevas hoy",
      value: stats.ofertasNuevasHoy,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
      href: "/app/buscar",
    },
    {
      icon: "📧",
      label: "CVs enviados hoy",
      value: stats.cvsEnviadosHoy,
      color: "#22c55e",
      bg: "rgba(34,197,94,0.1)",
      href: "/app/envios",
    },
    {
      icon: "📊",
      label: "Pipeline activo",
      value: stats.pipelineActivo,
      color: "#a855f7",
      bg: "rgba(168,85,247,0.1)",
      href: "/app/pipeline",
    },
    {
      icon: "🎯",
      label: "Entrevistas",
      value: stats.entrevistasPendientes,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
      href: "/app/entrevistas",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16" style={{ background: "#0f1117" }}>
        <div className="animate-spin rounded-full h-10 w-10 border-3" style={{ borderColor: "#2d3142", borderTopColor: "#22c55e" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-20" style={{ background: "#0f1117" }}>
      {/* Header saludo */}
      <div className="px-4 py-10" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(22,163,74,0.04))" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <GuzziAvatar size={48} />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
                ¡Hola{userName ? `, ${userName}` : ""}! Soy Guzzi
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>
                Tu asistente de empleo con IA. ¿Qué quieres hacer hoy?
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-xl p-4 transition hover:scale-[1.02] cursor-pointer block"
              style={{ background: s.bg, border: `1px solid ${s.color}20` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{s.icon}</span>
                <span className="text-2xl font-bold" style={{ color: s.color }}>
                  {s.value.toLocaleString()}
                </span>
              </div>
              <p className="text-xs" style={{ color: "#94a3b8" }}>{s.label}</p>
              <p className="text-[10px] mt-1 font-medium" style={{ color: s.color, opacity: 0.7 }}>Ver →</p>
            </Link>
          ))}
        </div>

        {/* ── Main 2 cards: Guzzi vs Manual ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Opción Guzzi */}
          <button
            onClick={() => router.push("/app/gusi")}
            className="group flex flex-col items-start gap-3 p-6 rounded-2xl text-left transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(22,163,74,0.06))",
              border: "2px solid rgba(34,197,94,0.3)",
            }}
          >
            <div className="flex items-center gap-3">
              <GuzziAvatar size={44} />
              <div>
                <p className="font-bold text-sm" style={{ color: "#22c55e" }}>Usar a Guzzi</p>
                <p className="text-[11px] font-medium" style={{ color: "#16a34a" }}>Recomendado</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-[11px]" style={{ color: "#94a3b8" }}>
              <li>✅ Busca ofertas adaptadas a ti</li>
              <li>✅ Mejora tu CV con IA</li>
              <li>✅ Envía candidaturas automáticamente</li>
              <li>✅ Tú apruebas cada envío</li>
            </ul>
            <span
              className="w-full text-center py-2 rounded-xl text-xs font-semibold mt-1"
              style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
            >
              Hablar con Guzzi →
            </span>
          </button>

          {/* Opción Manual */}
          <Link
            href="/app/buscar"
            className="group flex flex-col items-start gap-3 p-6 rounded-2xl text-left transition-all hover:scale-[1.02]"
            style={{
              background: "#1e212b",
              border: "1.5px solid #2d3142",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔍</span>
              <div>
                <p className="font-bold text-sm" style={{ color: "#f1f5f9" }}>Modo manual</p>
                <p className="text-[11px]" style={{ color: "#64748b" }}>Control total</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-[11px]" style={{ color: "#94a3b8" }}>
              <li>🔍 Busca ofertas tú mismo</li>
              <li>📊 Gestiona tu pipeline</li>
              <li>📧 Controla los envíos</li>
              <li>💰 Compara salarios</li>
            </ul>
            <span
              className="w-full text-center py-2 rounded-xl text-xs font-semibold mt-1"
              style={{ background: "#2d3142", color: "#94a3b8" }}
            >
              Ir al buscador →
            </span>
          </Link>
        </div>

        {/* ── Ofertas recomendadas ── */}
        {ofertas.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">💼</span>
                <h2 className="text-sm font-bold" style={{ color: "#f1f5f9" }}>
                  Ofertas recomendadas para ti
                </h2>
              </div>
              <Link href="/app/buscar" className="text-xs font-medium" style={{ color: "#22c55e" }}>
                Ver todas →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ofertas.slice(0, 6).map((oferta) => (
                <Link
                  key={oferta.id}
                  href={`/app/ofertas/${encodeURIComponent(oferta.id)}`}
                  className="rounded-xl p-4 transition-all hover:scale-[1.02] cursor-pointer"
                  style={{ background: "#161922", border: "1px solid #252836" }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#f1f5f9" }}>
                        {oferta.titulo}
                      </p>
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: "#64748b" }}>
                        {oferta.empresa}
                      </p>
                    </div>
                    {oferta.salario && oferta.salario !== "Consultar" && oferta.salario !== "Ver en oferta" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                        style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                        {oferta.salario}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px]" style={{ color: "#475569" }}>
                    <span>📍 {oferta.ubicacion || "Sin ubicación"}</span>
                    <span>·</span>
                    <span>{oferta.fuente}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick actions ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">⚡</span>
            <h2 className="text-sm font-bold" style={{ color: "#f1f5f9" }}>
              Acciones rápidas
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(quickActions.length > 0 ? quickActions : [
              { icon: "🐛", label: "Hablar con Guzzi", href: "/app/gusi", color: "#22c55e" },
              { icon: "📄", label: "Mejorar mi CV", href: "/app/curriculum", color: "#f59e0b" },
              { icon: "🔍", label: "Buscar ofertas", href: "/app/buscar", color: "#3b82f6" },
              { icon: "📊", label: "Mi pipeline", href: "/app/pipeline", color: "#a855f7" },
            ]).map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-[1.03]"
                style={{ background: "#161922", border: "1px solid #252836" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: `${action.color}18`, border: `1px solid ${action.color}30` }}>
                  {action.icon}
                </div>
                <span className="text-[11px] font-medium text-center" style={{ color: "#94a3b8" }}>
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Footer tagline ── */}
        <p className="text-center text-xs" style={{ color: "#475569" }}>
          🐛 BuscayCurra — La alternativa real a InfoJobs y LinkedIn
        </p>
      </div>
    </div>
  );
}
