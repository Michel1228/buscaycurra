"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";

interface Stats {
  usuarios: number;
  pagados: number;
  ofertas: number;
  planes: Record<string, number>;
  recientes: string[];
  ts: string;
}

const PLAN_META: Record<string, { label: string; precio: number; color: string }> = {
  esencial: { label: "Esencial",  precio: 2.99,  color: "#a78bfa" },
  basico:   { label: "Basico",    precio: 4.99,  color: "#60a5fa" },
  pro:      { label: "Pro",       precio: 9.99,  color: "#22c55e" },
  empresa:  { label: "Empresa",   precio: 49.99, color: "#f59e0b" },
  free:     { label: "Free",      precio: 0,     color: "#475569" },
};

function fmt(n: number) { return n.toLocaleString("es-ES"); }

function calcMRR(planes: Record<string, number>) {
  return Object.entries(planes).reduce((sum, [plan, count]) => {
    return sum + (PLAN_META[plan]?.precio ?? 0) * count;
  }, 0);
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchStats = useCallback(async (key: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/stats?secret=${encodeURIComponent(key)}`);
      if (res.status === 401) { setError("Clave incorrecta"); setAuthed(false); return; }
      if (!res.ok) { setError("Error del servidor"); return; }
      const data = await res.json() as Stats;
      setStats(data);
      setAuthed(true);
      setLastUpdate(new Date().toLocaleTimeString("es-ES"));
    } catch {
      setError("No se pudo conectar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authed || !secret) return;
    const id = setInterval(() => { void fetchStats(secret); }, 30_000);
    return () => clearInterval(id);
  }, [authed, secret, fetchStats]);

  const card: React.CSSProperties = {
    background: "#111520", border: "1px solid #1e2538", borderRadius: 16,
  };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#090c10" }}>
        <div style={{ ...card, padding: "40px 48px", width: 360 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <span style={{ fontSize: 36 }}>🐛</span>
            <h1 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, margin: "10px 0 4px" }}>Panel Admin</h1>
            <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>BuscayCurra</p>
          </div>
          <input
            type="password"
            placeholder="Clave de administrador"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            onKeyDown={e => e.key === "Enter" && void fetchStats(secret)}
            style={{
              width: "100%", background: "#0f1520", border: "1.5px solid #2d3142",
              color: "#f1f5f9", borderRadius: 10, padding: "11px 14px",
              fontSize: 14, boxSizing: "border-box", outline: "none",
            }}
          />
          {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 8, marginBottom: 0 }}>{error}</p>}
          <button
            onClick={() => void fetchStats(secret)}
            disabled={loading || !secret}
            style={{
              width: "100%", marginTop: 14, background: "linear-gradient(135deg,#22c55e,#16a34a)",
              color: "#fff", border: "none", borderRadius: 10, padding: "12px 0",
              fontWeight: 700, fontSize: 14, cursor: loading || !secret ? "not-allowed" : "pointer",
              opacity: loading || !secret ? 0.5 : 1,
            }}
          >
            {loading ? "Verificando..." : "Entrar →"}
          </button>
        </div>
      </div>
    );
  }

  const totalMRR = stats ? calcMRR(stats.planes) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#090c10", padding: "32px 20px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700, margin: 0 }}>🐛 BuscayCurra — Admin</h1>
            <p style={{ color: "#475569", fontSize: 12, margin: "4px 0 0" }}>
              Actualizado: {lastUpdate}
              {loading && <span style={{ color: "#22c55e", marginLeft: 8 }}>• actualizando...</span>}
            </p>
          </div>
          <button
            onClick={() => void fetchStats(secret)}
            disabled={loading}
            style={{
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
              color: "#22c55e", borderRadius: 10, padding: "8px 18px",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            ↻ Refrescar
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
          {[
            { icon: "👤", label: "Usuarios totales",    value: fmt(stats?.usuarios ?? 0), color: "#f1f5f9" },
            { icon: "💳", label: "Suscriptores de pago", value: fmt(stats?.pagados ?? 0),  color: "#22c55e" },
            { icon: "💶", label: "MRR estimado",         value: `${totalMRR.toFixed(2)}€`, color: "#f59e0b" },
            { icon: "📋", label: "Ofertas de empleo",    value: fmt(stats?.ofertas ?? 0),  color: "#3b82f6" },
          ].map(k => (
            <div key={k.label} style={{ ...card, padding: "20px 18px" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{k.icon}</div>
              <div style={{ color: k.color, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{k.value}</div>
              <div style={{ color: "#475569", fontSize: 11, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Desglose plan + últimos registros */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

          <div style={{ ...card, padding: 24 }}>
            <h2 style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, margin: "0 0 18px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Suscriptores por plan</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(PLAN_META).map(([plan, meta]) => {
                const count = stats?.planes[plan] ?? 0;
                const maxVal = Math.max(...Object.values(stats?.planes ?? { _: 1 }), 1);
                const pct = (count / maxVal) * 100;
                return (
                  <div key={plan}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ color: meta.color, fontSize: 13, fontWeight: 600 }}>{meta.label}</span>
                      <span style={{ color: "#64748b", fontSize: 13 }}>{count}</span>
                    </div>
                    <div style={{ height: 5, background: "#1a2030", borderRadius: 999 }}>
                      <div style={{
                        height: "100%", width: `${pct}%`,
                        background: meta.color, borderRadius: 999,
                        transition: "width 0.6s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...card, padding: 24 }}>
            <h2 style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, margin: "0 0 18px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Últimos registros</h2>
            {!stats?.recientes.length && (
              <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>Sin registros aún</p>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {stats?.recientes.map((ts, i) => {
                const d = new Date(ts);
                const isLast = i === (stats.recientes.length - 1);
                return (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "9px 0", borderBottom: isLast ? "none" : "1px solid #1a2030",
                  }}>
                    <span style={{ color: "#22c55e", fontSize: 13 }}>✦ Nuevo usuario</span>
                    <span style={{ color: "#475569", fontSize: 12 }}>
                      {d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      {" "}
                      {d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Estado del sistema */}
        <div style={{ ...card, padding: "18px 24px" }}>
          <h2 style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.8px" }}>Estado del sistema</h2>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            {[
              { name: "App web",        url: "https://buscaycurra.es" },
              { name: "Stripe Webhook", url: "https://buscaycurra.es/api/stripe/webhook" },
              { name: "Job Sync",       url: "https://buscaycurra.es/api/jobs/sync-status" },
            ].map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#22c55e", display: "inline-block",
                  boxShadow: "0 0 6px #22c55e",
                }} />
                <span style={{ color: "#64748b", fontSize: 13 }}>{s.name}</span>
              </a>
            ))}
          </div>
        </div>

        <p style={{ textAlign: "center", color: "#1e2538", fontSize: 11, marginTop: 20 }}>
          Auto-refresco cada 30 segundos
        </p>
      </div>
    </div>
  );
}
