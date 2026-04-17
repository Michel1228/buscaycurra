"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import AutoSendSetup from "@/components/AutoSendSetup";
import CVSenderDashboard from "@/components/CVSenderDashboard";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type TabId = "nuevo" | "envios" | "estadisticas";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "nuevo", label: "Nuevo envío", emoji: "📧" },
  { id: "envios", label: "Mis envíos", emoji: "📋" },
  { id: "estadisticas", label: "Estadísticas", emoji: "📊" },
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
    <div className="min-h-screen pt-16">

      {/* Header */}
      <div className="py-10 px-4" style={{ background: "linear-gradient(135deg, rgba(126,213,111,0.08), rgba(139,111,71,0.05))" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📧</span>
            <h1 className="text-2xl font-bold" style={{ color: "#f0ebe0" }}>Envíos automáticos de CV</h1>
          </div>
          <p className="text-sm" style={{ color: "#b0a890" }}>
            Tu CV se envía cada 4-5 días a nuevas empresas, en horario laboral, con carta personalizada por IA.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {["🤖 IA personaliza", "⏰ Lun-Vie 9-18h", "🔄 Cada 4-5 días", "📊 Seguimiento"].map(f => (
              <span key={f} className="text-xs px-3 py-1 rounded-full"
                style={{ background: "rgba(126,213,111,0.1)", color: "#7ed56f", border: "1px solid rgba(126,213,111,0.15)" }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10" style={{ background: "#1a1a12", borderBottom: "1px solid #3d3c30" }}>
        <div className="max-w-3xl mx-auto px-4">
          <nav className="flex">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-4 text-sm font-medium transition"
                style={{
                  borderBottom: activeTab === tab.id ? "2px solid #7ed56f" : "2px solid transparent",
                  color: activeTab === tab.id ? "#7ed56f" : "#706a58",
                }}>
                <span>{tab.emoji}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === "nuevo" && <AutoSendSetup userId={userId} onJobScheduled={handleJobScheduled} />}
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
      <div className="animate-spin rounded-full h-8 w-8" style={{ border: "4px solid #3d3c30", borderTopColor: "#7ed56f" }} />
    </div>
  );

  if (!stats) return (
    <div className="card-game p-10 text-center">
      <p style={{ color: "#504a3a" }}>No hay estadísticas disponibles</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "#f0ebe0" }}>Tu actividad de envíos</h2>
        <p className="text-sm" style={{ color: "#706a58" }}>Resumen de todos tus envíos automáticos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { val: stats.totalEnviados, label: "CVs enviados", color: "#7ed56f" },
          { val: stats.empresasContactadas, label: "Empresas", color: "#f0c040" },
          { val: stats.enviadosEsteMes, label: "Este mes", color: "#a8e6a1" },
        ].map((s, i) => (
          <div key={i} className="card-game p-6 text-center">
            <p className="text-4xl font-bold" style={{ color: s.color }}>{s.val}</p>
            <p className="text-sm mt-1" style={{ color: "#706a58" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card-game p-6">
        <h3 className="font-bold mb-4" style={{ color: "#f0ebe0" }}>Desglose</h3>
        <div className="space-y-3">
          {[
            { label: "Hoy", value: stats.enviadosHoy, max: 10 },
            { label: "Esta semana", value: stats.enviadosEstaSemana, max: 50 },
            { label: "Este mes", value: stats.enviadosEsteMes, max: 200 },
            { label: "Total", value: stats.totalEnviados, max: stats.totalEnviados || 1 },
          ].map(({ label, value, max }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: "#b0a890" }}>{label}</span>
                <span className="font-bold" style={{ color: "#f0ebe0" }}>{value}</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "#2a2a1e" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: "linear-gradient(135deg, #7ed56f, #5cb848)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-game p-5">
        <h3 className="font-bold mb-2" style={{ color: "#a8e6a1" }}>ℹ️ Cómo funciona</h3>
        <ul className="space-y-2 text-sm" style={{ color: "#b0a890" }}>
          <li>📅 CVs enviados lun-vie 9:00-18:00 horario España</li>
          <li>🤖 Carta personalizada por IA para cada empresa</li>
          <li>🔄 Envío automático cada 4-5 días a nuevas empresas</li>
          <li>⏱️ Distribuidos para no parecer spam</li>
          <li>🔄 Reintentos automáticos si falla (hasta 3x)</li>
          <li>🛡️ Mínimo 90 días entre envíos a la misma empresa</li>
        </ul>
      </div>
    </div>
  );
}
