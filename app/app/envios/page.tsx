"use client";

/**
 * app/app/envios/page.tsx — Página completa de gestión de envíos automáticos de CV
 *
 * Organizada en tres pestañas:
 *   - "Nuevo envío":   Formulario para programar un nuevo envío (AutoSendSetup)
 *   - "Mis envíos":    Panel con la cola y el historial (CVSenderDashboard)
 *   - "Estadísticas":  Resumen visual de la actividad del usuario
 *
 * Nota: En producción, el userId vendría de la sesión de Supabase Auth.
 * Para desarrollo, usamos un ID de ejemplo.
 */

import { useState, useEffect } from "react";
import AutoSendSetup from "@/components/AutoSendSetup";
import CVSenderDashboard from "@/components/CVSenderDashboard";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type TabId = "nuevo" | "envios" | "estadisticas";

interface Tab {
  id: TabId;
  label: string;
  emoji: string;
}

// ─── Definición de las pestañas ──────────────────────────────────────────────

const TABS: Tab[] = [
  { id: "nuevo", label: "Nuevo envío", emoji: "📧" },
  { id: "envios", label: "Mis envíos", emoji: "📋" },
  { id: "estadisticas", label: "Estadísticas", emoji: "📊" },
];

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function EnviosPage() {
  const [activeTab, setActiveTab] = useState<TabId>("nuevo");
  const [refreshKey, setRefreshKey] = useState(0);

  // Cuando se programa un envío, cambiar a "Mis envíos" automáticamente
  const handleJobScheduled = () => {
    // Pequeño delay para que el usuario vea el mensaje de éxito primero
    setTimeout(() => {
      setActiveTab("envios");
      setRefreshKey((prev) => prev + 1);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Cabecera de la página ─────────────────────────────────────── */}
      <div
        className="text-white py-10 px-4"
        style={{ background: "linear-gradient(135deg, #2563EB, #1d4ed8)" }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📧</span>
            <h1 className="text-2xl font-bold">Envíos automáticos de CV</h1>
          </div>
          <p className="text-blue-100 text-sm">
            Tu CV se enviará automáticamente a las empresas que elijas, en horario laboral
            y con una carta personalizada por IA.
          </p>

          {/* Badges de características */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              "🤖 Personalización con IA",
              "⏰ Horario laboral España",
              "🔄 Reintentos automáticos",
              "📊 Seguimiento completo",
            ].map((feature) => (
              <span
                key={feature}
                className="text-xs bg-white bg-opacity-20 text-white px-3 py-1 rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Navegación por pestañas ───────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4">
          <nav className="flex" aria-label="Pestañas de envíos">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                <span>{tab.emoji}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Contenido de la pestaña activa ───────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 py-6">

        {/* Pestaña: Nuevo envío */}
        {activeTab === "nuevo" && (
          <AutoSendSetup
            onJobScheduled={handleJobScheduled}
          />
        )}

        {/* Pestaña: Mis envíos */}
        {activeTab === "envios" && (
          <CVSenderDashboard
            key={refreshKey} // Forzar re-montaje cuando se programa un nuevo envío
          />
        )}

        {/* Pestaña: Estadísticas */}
        {activeTab === "estadisticas" && (
          <StatsTab />
        )}

      </main>
    </div>
  );
}

// ─── Componente de Estadísticas ───────────────────────────────────────────────

/**
 * Pestaña de estadísticas con información más detallada sobre la actividad.
 */
function StatsTab() {
  const [stats, setStats] = useState<{
    totalEnviados: number;
    empresasContactadas: number;
    enviadosEstaSemana: number;
    enviadosEsteMes: number;
    enviadosHoy: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: { session } } = await getSupabaseBrowser().auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) {
          setLoading(false);
          return;
        }
        const response = await fetch(`/api/cv-sender/status`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json() as { stats?: typeof stats };
        if (data.stats) {
          setStats(data.stats);
        }
      } catch {
        // Silenciar errores en estadísticas
      } finally {
        setLoading(false);
      }
    };
    void loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <p className="text-gray-400">No hay estadísticas disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Título de sección */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Tu actividad de envíos</h2>
        <p className="text-sm text-gray-500">Resumen de todos tus envíos automáticos de CV</p>
      </div>

      {/* Tarjetas de estadísticas grandes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div
          className="rounded-xl p-6 text-white text-center"
          style={{ background: "linear-gradient(135deg, #2563EB, #1d4ed8)" }}
        >
          <p className="text-4xl font-bold">{stats.totalEnviados}</p>
          <p className="text-blue-100 text-sm mt-1">CVs enviados en total</p>
        </div>

        <div
          className="rounded-xl p-6 text-white text-center"
          style={{ background: "linear-gradient(135deg, #F97316, #ea6c00)" }}
        >
          <p className="text-4xl font-bold">{stats.empresasContactadas}</p>
          <p className="text-orange-100 text-sm mt-1">Empresas contactadas</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
          <p className="text-4xl font-bold text-gray-800">{stats.enviadosEsteMes}</p>
          <p className="text-gray-500 text-sm mt-1">CVs este mes</p>
        </div>

      </div>

      {/* Desglose semanal */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Desglose por período</h3>
        <div className="space-y-3">
          {[
            { label: "Enviados hoy", value: stats.enviadosHoy, max: 10 },
            { label: "Esta semana", value: stats.enviadosEstaSemana, max: 50 },
            { label: "Este mes", value: stats.enviadosEsteMes, max: 200 },
            { label: "Total histórico", value: stats.totalEnviados, max: stats.totalEnviados || 1 },
          ].map(({ label, value, max }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{label}</span>
                <span className="font-semibold text-gray-800">{value}</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (value / max) * 100)}%`,
                    backgroundColor: "#2563EB",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información sobre el sistema */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Cómo funciona el sistema</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>📅 Los CVs se envían en horario laboral español (lunes-viernes, 9:00-18:00)</li>
          <li>🤖 OpenClaw IA personaliza cada carta según la empresa específica</li>
          <li>⏱️ Los envíos se distribuyen para no parecer spam automatizado</li>
          <li>🔄 Si un envío falla, se reintenta automáticamente hasta 3 veces</li>
          <li>📧 Recibirás un email de confirmación por cada CV enviado</li>
          <li>🛡️ Mínimo 90 días entre envíos a la misma empresa</li>
        </ul>
      </div>

    </div>
  );
}
