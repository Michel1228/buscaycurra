"use client";

/**
 * /admin/metricas — Contador en vivo de cómo va BuscayCurra.
 *
 * Entra con la sesión normal de la app: si tu email está en ADMIN_EMAILS, ves
 * el panel. Antes pedía una clave escrita a mano, pero eso obliga a recordarla
 * y a teclearla en el móvil; con la sesión ya sabemos quién eres.
 * Se refresca solo cada 60 segundos.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Metricas {
  generado: string;
  usuarios: { total: number; alta1: number; alta7: number; alta30: number; porDia: Record<string, number> };
  planes: Record<string, number>;
  suscriptores: { activos: number; conOrigenPago: number };
  actividad: { cvTotal: number; cv7: number; cv30: number; conversaciones: number };
  ofertas: { vivas: number; conEmail: number; paises: number; nuevas24h: number };
  cobros: { numero: number; importe: number; moneda: string; disponible: boolean };
}

function Tarjeta({ titulo, valor, pie, color = "#22c55e" }: {
  titulo: string; valor: string | number; pie?: string; color?: string;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
      <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "#64748b" }}>{titulo}</p>
      <p className="text-3xl font-bold leading-none" style={{ color }}>{valor}</p>
      {pie && <p className="text-[11px] mt-1.5" style={{ color: "#94a3b8" }}>{pie}</p>}
    </div>
  );
}

/** Gráfico de barras sencillo: sin librerías, que pesan más que el propio panel. */
function Barras({ datos }: { datos: Record<string, number> }) {
  const dias = Object.keys(datos);
  const max = Math.max(1, ...Object.values(datos));
  return (
    <div className="rounded-xl p-4" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
      <p className="text-[11px] uppercase tracking-wide mb-3" style={{ color: "#64748b" }}>
        Altas de los últimos 30 días
      </p>
      <div className="flex items-end gap-[3px]" style={{ height: 90 }}>
        {dias.map(d => {
          const v = datos[d];
          return (
            <div key={d} className="flex-1 rounded-t transition-all" title={`${d}: ${v} alta${v === 1 ? "" : "s"}`}
              style={{
                height: `${Math.max(3, (v / max) * 100)}%`,
                background: v > 0 ? "#22c55e" : "#2d3142",
                opacity: v > 0 ? 1 : 0.4,
              }} />
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px]" style={{ color: "#64748b" }}>
        <span>{dias[0]?.slice(5)}</span>
        <span>hoy</span>
      </div>
    </div>
  );
}

export default function PanelMetricas() {
  const [datos, setDatos] = useState<Metricas | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { setError("sin-sesion"); return; }

      const res = await fetch("/api/admin/metricas", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 401) { setError("sin-permiso"); return; }
      if (!res.ok) { setError("No se pudieron cargar las métricas"); return; }
      setDatos(await res.json());
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Refresco automático cada minuto, solo si ya hay datos
  useEffect(() => {
    if (!datos) return;
    const t = setInterval(cargar, 60000);
    return () => clearInterval(t);
  }, [datos, cargar]);

  if (!datos) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0f1117" }}>
        <div className="w-full max-w-sm text-center">
          <h1 className="text-lg font-bold mb-2" style={{ color: "#f1f5f9" }}>Métricas de BuscayCurra</h1>

          {cargando && (
            <p className="text-xs" style={{ color: "#64748b" }}>Cargando…</p>
          )}

          {!cargando && error === "sin-sesion" && (
            <>
              <p className="text-xs mb-5" style={{ color: "#94a3b8" }}>
                Entra con tu cuenta para ver el panel.
              </p>
              <Link href="/auth/login?redirect=/admin/metricas" className="btn-game inline-block text-sm">
                Iniciar sesión
              </Link>
            </>
          )}

          {!cargando && error === "sin-permiso" && (
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              Tu cuenta no tiene acceso a las métricas.
            </p>
          )}

          {!cargando && error && !["sin-sesion", "sin-permiso"].includes(error) && (
            <>
              <p className="text-xs mb-4" style={{ color: "#ef4444" }}>{error}</p>
              <button onClick={cargar} className="btn-game text-sm">Reintentar</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const d = datos;
  const pctEmail = d.ofertas.vivas ? Math.round((d.ofertas.conEmail / d.ofertas.vivas) * 100) : 0;

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: "#0f1117" }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#f1f5f9" }}>Cómo va BuscayCurra</h1>
            <p className="text-[11px]" style={{ color: "#64748b" }}>
              {new Date(d.generado).toLocaleString("es-ES")} · se actualiza solo cada minuto
            </p>
          </div>
          <button onClick={cargar} disabled={cargando}
            className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
            {cargando ? "…" : "Actualizar"}
          </button>
        </div>

        <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "#64748b" }}>Usuarios</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <Tarjeta titulo="Registrados" valor={d.usuarios.total} />
          <Tarjeta titulo="Hoy" valor={`+${d.usuarios.alta1}`} color={d.usuarios.alta1 > 0 ? "#22c55e" : "#64748b"} />
          <Tarjeta titulo="7 días" valor={`+${d.usuarios.alta7}`} />
          <Tarjeta titulo="30 días" valor={`+${d.usuarios.alta30}`} />
        </div>

        <div className="mb-5"><Barras datos={d.usuarios.porDia} /></div>

        <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "#64748b" }}>Dinero</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Tarjeta titulo="Suscriptores activos" valor={d.suscriptores.activos}
            color={d.suscriptores.activos > 0 ? "#22c55e" : "#f59e0b"} />
          <Tarjeta titulo="Han pasado por caja" valor={d.suscriptores.conOrigenPago} pie="alguna vez" />
          <Tarjeta titulo="Cobros" valor={d.cobros.disponible ? d.cobros.numero : "—"} />
          <Tarjeta titulo="Facturado" valor={d.cobros.disponible ? `${d.cobros.importe.toFixed(2)} €` : "—"} />
        </div>

        <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "#64748b" }}>Uso</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Tarjeta titulo="CVs enviados" valor={d.actividad.cvTotal} pie={`${d.actividad.cv30} en 30 días`} />
          <Tarjeta titulo="CVs esta semana" valor={d.actividad.cv7} />
          <Tarjeta titulo="Charlas con Guzzi" valor={d.actividad.conversaciones} />
          <Tarjeta titulo="Planes de pago" valor={Object.entries(d.planes).filter(([k]) => k !== "free").reduce((s, [, v]) => s + v, 0)} />
        </div>

        <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "#64748b" }}>Ofertas</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Tarjeta titulo="Vivas" valor={d.ofertas.vivas.toLocaleString("es-ES")} color="#3b82f6" />
          <Tarjeta titulo="Con email" valor={`${pctEmail}%`} pie={d.ofertas.conEmail.toLocaleString("es-ES")} color="#3b82f6" />
          <Tarjeta titulo="Países" valor={d.ofertas.paises} color="#3b82f6" />
          <Tarjeta titulo="Nuevas hoy" valor={d.ofertas.nuevas24h.toLocaleString("es-ES")} color="#3b82f6" />
        </div>

        <div className="rounded-xl p-4" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
          <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "#64748b" }}>Descargas de las tiendas</p>
          <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>
            Apple y Google no dejan consultarlas desde aquí. Se miran en sus paneles:
          </p>
          <div className="flex flex-col gap-1.5">
            <a href="https://appstoreconnect.apple.com/analytics/app/d30/6775232067/metrics"
               target="_blank" rel="noopener noreferrer"
               className="text-xs hover:underline" style={{ color: "#22c55e" }}>App Store Connect →</a>
            <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer"
               className="text-xs hover:underline" style={{ color: "#22c55e" }}>Google Play Console →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
