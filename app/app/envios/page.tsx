"use client";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import AutoSendSetup from "@/components/AutoSendSetup";
import CVSenderDashboard from "@/components/CVSenderDashboard";
import InfoTooltip from "@/components/InfoTooltip";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type TabId = "nuevo" | "envios" | "estadisticas";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "nuevo", label: "Nuevo envío", icon: "📧" },
  { id: "envios", label: "Mis envíos", icon: "📋" },
  { id: "estadisticas", label: "Estadísticas", icon: "📊" },
];

export default function EnviosPage() {
  const [userId, setUserId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("nuevo");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await getSupabaseBrowser().auth.getUser();
        if (user) setUserId(user.id);
      } catch {}
    }
    loadUser();
  }, []);

  const handleJobScheduled = () => {
    setTimeout(() => {
      setActiveTab("envios");
      setRefreshKey(prev => prev + 1);
    }, 2000);
  };

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>

      <div className="py-8 px-4" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(59,130,246,0.05))" }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>Envíos automáticos de CV</h1>
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>
            Tu CV se envía cada 4-5 días a nuevas empresas, en horario laboral, con carta personalizada por IA.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {["🤖 IA personaliza", "⏰ Lun-Vie 9-18h", "🔄 Cada 4-5 días", "📊 Seguimiento"].map(f => (
              <span key={f} className="text-[10px] px-2.5 py-1 rounded-md font-medium"
                style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.15)" }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky top-14 z-10" style={{ background: "#0f1117", borderBottom: "1px solid #2d3142" }}>
        <div className="max-w-3xl mx-auto px-4">
          <nav className="flex">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium transition"
                style={{
                  borderBottom: activeTab === tab.id ? "2px solid #22c55e" : "2px solid transparent",
                  color: activeTab === tab.id ? "#22c55e" : "#64748b",
                }}>
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === "nuevo" && <Suspense fallback={null}><AutoSendSetup userId={userId} onJobScheduled={handleJobScheduled} /></Suspense>}
        {activeTab === "envios" && <CVSenderDashboard key={refreshKey} userId={userId} />}
        {activeTab === "estadisticas" && <StatsTab userId={userId} />}
      </main>
    </div>
  );
}

function StatsTab({ userId }: { userId: string }) {
  const [stats, setStats] = useState<{
    totalEnviados: number; empresasContactadas: number;
    enviadosEstaSemana: number; enviadosEsteMes: number; enviadosHoy: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/cv-sender/status?userId=${encodeURIComponent(userId)}`);
        const data = await res.json() as { stats?: typeof stats };
        if (data.stats) setStats(data.stats);
      } catch {} finally { setLoading(false); }
    })();
  }, [userId]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
    </div>
  );

  if (!stats) return (
    <div className="card-game p-10 text-center">
      <p className="text-sm" style={{ color: "#475569" }}>No hay estadísticas disponibles</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: "#f1f5f9" }}>Tu actividad</h2>
        <p className="text-xs" style={{ color: "#64748b" }}>Resumen de envíos automáticos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { val: stats.totalEnviados, label: "CVs enviados", color: "#22c55e", tip: "Total de CVs que Guzzi ha enviado a empresas desde que activaste los envíos automáticos." },
          { val: stats.empresasContactadas, label: "Empresas", color: "#f59e0b", tip: "Número de empresas distintas a las que se ha enviado tu CV. No se repite empresa antes de 90 días." },
          { val: stats.enviadosEsteMes, label: "Este mes", color: "#3b82f6", tip: "CVs enviados en el mes actual. El límite mensual depende de tu plan (60 en Esencial, 200 en Pro)." },
        ].map((s, i) => (
          <div key={i} className="card-game p-5 text-center">
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.val}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <p className="text-xs" style={{ color: "#64748b" }}>{s.label}</p>
              <InfoTooltip text={s.tip} position="top" />
            </div>
          </div>
        ))}
      </div>

      <div className="card-game p-5">
        <h3 className="font-semibold text-sm mb-4" style={{ color: "#f1f5f9" }}>Desglose</h3>
        <div className="space-y-3">
          {[
            { label: "Hoy", value: stats.enviadosHoy, max: 10, tip: "CVs enviados hoy. Límite diario: 5 en Esencial, 10 en Pro." },
            { label: "Esta semana", value: stats.enviadosEstaSemana, max: 50, tip: "CVs enviados en los últimos 7 días." },
            { label: "Este mes", value: stats.enviadosEsteMes, max: 200, tip: "CVs enviados en el mes actual." },
            { label: "Total histórico", value: stats.totalEnviados, max: stats.totalEnviados || 1, tip: "Total acumulado de todas las candidaturas enviadas." },
          ].map(({ label, value, max, tip }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <div className="flex items-center gap-1">
                  <span style={{ color: "#94a3b8" }}>{label}</span>
                  <InfoTooltip text={tip} position="right" />
                </div>
                <span className="font-semibold" style={{ color: "#f1f5f9" }}>{value}</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "#252836" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: "linear-gradient(135deg, #22c55e, #16a34a)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-game p-5">
        <h3 className="font-semibold text-sm mb-3" style={{ color: "#22c55e" }}>ℹ️ Cómo funciona</h3>
        <ul className="space-y-2 text-xs" style={{ color: "#94a3b8" }}>
          <li>📅 Envíos lun-vie 9:00-18:00 horario España</li>
          <li>🤖 Carta personalizada por IA para cada empresa</li>
          <li>🔄 Automático cada 4-5 días a nuevas empresas</li>
          <li>⏱️ Distribuidos para no parecer spam</li>
          <li>🔄 Reintentos automáticos si falla (hasta 3x)</li>
          <li>🛡️ Mínimo 90 días entre envíos a la misma empresa</li>
        </ul>
      </div>
    </div>
  );
}
