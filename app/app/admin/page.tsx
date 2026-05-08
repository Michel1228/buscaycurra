"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "michelbatistagonzalez1992@gmail.com";

interface Stats {
  totalUsuarios: number;
  porPlan: Record<string, number>;
  pagando: number;
  ingresosMes: number;
  nuevosHoy: number;
  nuevosSemana: number;
  nuevosMes: number;
  tendencia: { fecha: string; count: number }[];
  totalEnvios: number;
  enviosHoy: number;
}

const PLAN_LABELS: Record<string, { label: string; color: string; precio: number }> = {
  free:    { label: "Free",    color: "#64748b", precio: 0 },
  esencial:{ label: "Esencial",color: "#60a5fa", precio: 2.99 },
  basico:  { label: "Básico",  color: "#a78bfa", precio: 4.99 },
  pro:     { label: "Pro",     color: "#22c55e", precio: 9.99 },
  empresa: { label: "Empresa", color: "#f59e0b", precio: 49.99 },
};

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session || session.user.email !== ADMIN_EMAIL) {
        router.replace("/app/gusi");
        return;
      }
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { setError("Error al cargar estadísticas."); setCargando(false); return; }
      setStats(await res.json() as Stats);
      setCargando(false);
    };
    void cargar();
  }, [router]);

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1117" }}>
      <div className="animate-spin rounded-full h-10 w-10" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1117" }}>
      <p style={{ color: "#ef4444" }}>{error}</p>
    </div>
  );

  if (!stats) return null;

  const maxTendencia = Math.max(...stats.tendencia.map(d => d.count), 1);

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "#0f1117" }}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Panel de control</h1>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Métricas en tiempo real — BuscayCurra</p>
          </div>
          <button onClick={() => void (async () => {
            const { data: { session } } = await getSupabaseBrowser().auth.getSession();
            if (!session) return;
            const res = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${session.access_token}` } });
            if (res.ok) setStats(await res.json() as Stats);
          })()}
            className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "#1e212b", color: "#94a3b8", border: "1px solid #2d3142" }}>
            Actualizar
          </button>
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Usuarios registrados" value={stats.totalUsuarios} color="#22c55e" />
          <KpiCard label="Suscriptores activos" value={stats.pagando} color="#60a5fa" />
          <KpiCard label="Ingresos estimados/mes" value={`${stats.ingresosMes.toFixed(2)}€`} color="#f59e0b" />
          <KpiCard label="CVs enviados (total)" value={stats.totalEnvios} color="#a78bfa" />
        </div>

        {/* Nuevos usuarios */}
        <div className="grid grid-cols-3 gap-4">
          <MiniCard label="Nuevos hoy" value={stats.nuevosHoy} />
          <MiniCard label="Esta semana" value={stats.nuevosSemana} />
          <MiniCard label="Este mes" value={stats.nuevosMes} />
        </div>

        {/* Distribución por plan */}
        <div className="rounded-2xl p-6" style={{ background: "#161922", border: "1px solid #2d3142" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#94a3b8" }}>Usuarios por plan</h2>
          <div className="space-y-3">
            {Object.entries(PLAN_LABELS).map(([key, info]) => {
              const count = stats.porPlan[key] ?? 0;
              const total = stats.totalUsuarios || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs w-16 text-right" style={{ color: "#64748b" }}>{info.label}</span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "#1e212b" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: info.color, opacity: 0.8 }} />
                  </div>
                  <span className="text-sm font-semibold w-8 text-right" style={{ color: "#f1f5f9" }}>{count}</span>
                  <span className="text-xs w-8" style={{ color: "#64748b" }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tendencia 30 días */}
        <div className="rounded-2xl p-6" style={{ background: "#161922", border: "1px solid #2d3142" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#94a3b8" }}>Nuevos registros — últimos 30 días</h2>
          <div className="flex items-end gap-1" style={{ height: "100px" }}>
            {stats.tendencia.map((d) => (
              <div key={d.fecha} className="flex-1 flex flex-col items-center justify-end group relative" style={{ height: "100%" }}>
                <div className="w-full rounded-t transition-all duration-300 hover:opacity-100"
                  style={{
                    height: `${Math.max(4, (d.count / maxTendencia) * 90)}%`,
                    background: d.count > 0 ? "rgba(34,197,94,0.6)" : "#1e212b",
                    minHeight: "4px",
                  }} />
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10"
                  style={{ background: "#2d3142", color: "#f1f5f9" }}>
                  {d.fecha.slice(5)}: {d.count}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px]" style={{ color: "#64748b" }}>{stats.tendencia[0]?.fecha.slice(5)}</span>
            <span className="text-[10px]" style={{ color: "#64748b" }}>{stats.tendencia[stats.tendencia.length - 1]?.fecha.slice(5)}</span>
          </div>
        </div>

        {/* CV envíos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl p-5" style={{ background: "#161922", border: "1px solid #2d3142" }}>
            <p className="text-xs mb-1" style={{ color: "#64748b" }}>CVs enviados hoy</p>
            <p className="text-3xl font-black" style={{ color: "#a78bfa" }}>{stats.enviosHoy}</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "#161922", border: "1px solid #2d3142" }}>
            <p className="text-xs mb-1" style={{ color: "#64748b" }}>CVs enviados (total)</p>
            <p className="text-3xl font-black" style={{ color: "#a78bfa" }}>{stats.totalEnvios}</p>
          </div>
        </div>

      </div>
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#161922", border: "1px solid #2d3142" }}>
      <p className="text-xs mb-2" style={{ color: "#64748b" }}>{label}</p>
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl p-4 text-center" style={{ background: "#161922", border: "1px solid #2d3142" }}>
      <p className="text-xs mb-1" style={{ color: "#64748b" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: "#22c55e" }}>+{value}</p>
    </div>
  );
}
