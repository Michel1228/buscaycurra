"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SalarioData {
  puesto: string;
  provincia: string | null;
  fuente?: "ofertas" | "referencia";
  rangoGeneral: {
    min_salary: number;
    max_salary: number;
    avg_salary: number;
    total: number;
    fuente?: string;
  } | null;
  porProvincia: Array<{
    province: string;
    count: number;
    avg_salary: number;
  }>;
  provinciaDetalle?: {
    count: number;
    avg_salary: number;
  } | null;
  top?: Array<{
    puesto: string;
    total: number;
    avg_salary: number;
    min_salary: number;
    max_salary: number;
  }>;
}

type OcupacionCard = {
  puesto: string;
  total: number;
  avg_salary: number;
  min_salary: number;
  max_salary: number;
};

const PUESTOS_POPULARES = [
  "camarero", "cocinero", "limpieza", "conductor", "electricista",
  "dependiente", "programador", "enfermero", "administrativo", "mecanico",
  "albanil", "almacen", "soldador", "fontanero", "peluquero",
  "cuidador", "operario", "repartidor", "cajero", "vendedor",
];

// Fallback: ocupaciones destacadas si la API no devuelve "top"
const TOP_FALLBACK: OcupacionCard[] = [
  { puesto: "camarero", total: 8540, avg_salary: 19200, min_salary: 15876, max_salary: 28000 },
  { puesto: "dependiente", total: 6200, avg_salary: 18500, min_salary: 15876, max_salary: 26000 },
  { puesto: "administrativo", total: 5100, avg_salary: 22500, min_salary: 18000, max_salary: 35000 },
  { puesto: "programador", total: 4800, avg_salary: 38000, min_salary: 24000, max_salary: 65000 },
  { puesto: "enfermero", total: 3500, avg_salary: 28000, min_salary: 22000, max_salary: 42000 },
  { puesto: "electricista", total: 2900, avg_salary: 24000, min_salary: 18000, max_salary: 36000 },
  { puesto: "conductor", total: 2700, avg_salary: 22000, min_salary: 18000, max_salary: 32000 },
  { puesto: "cocinero", total: 2500, avg_salary: 21000, min_salary: 17000, max_salary: 30000 },
];

const PROVINCIAS = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga",
  "Zaragoza", "Murcia", "A Coruña", "Baleares", "Las Palmas",
  "Vizcaya", "Tenerife", "Granada", "Tarragona", "Córdoba",
];

export default function SalariosPage() {
  const router = useRouter();
  const [puesto, setPuesto] = useState("");
  const [provincia, setProvincia] = useState("");
  const [data, setData] = useState<SalarioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [topCargando, setTopCargando] = useState(true);
  const [topOcupaciones, setTopOcupaciones] = useState<OcupacionCard[]>([]);

  // Precargar top ocupaciones al montar — NUNCA mostrar resultados hasta que el usuario busque
  useEffect(() => {
    async function cargarTop() {
      try {
        const res = await fetch("/api/salarios");
        if (res.ok) {
          const d = await res.json() as SalarioData;
          // Solo usar "top" para las tarjetas de ocupaciones
          if (d.top && d.top.length > 0) {
            setTopOcupaciones(d.top as OcupacionCard[]);
          }
          // NO setData(d) aquí — los resultados solo se muestran tras búsqueda explícita
        }
      } catch (e) {
        console.error("Error cargando top:", e);
      } finally {
        setTopCargando(false);
      }
    }
    cargarTop();
  }, []);

  async function buscar(puestoOverride?: string) {
    const textoBuscar = (puestoOverride ?? puesto).trim();
    if (!textoBuscar) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      params.set("puesto", textoBuscar);
      if (provincia) params.set("provincia", provincia);
      const res = await fetch(`/api/salarios?${params.toString()}`);
      if (res.ok) {
        const d = await res.json() as SalarioData;
        setData(d);
      }
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(val: number | null): string {
    if (!val) return "N/D";
    return val >= 1000 ? `${(val / 1000).toFixed(1)}k €` : `${Math.round(val)} €`;
  }

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      <div className="py-8 px-4" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(34,197,94,0.05))" }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>Comparador de salarios</h1>
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>Descubre cuánto se cobra en tu sector con datos reales del mercado</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Top ocupaciones precargadas — siempre visibles (fallback si la API no devuelve top) */}
        {!topCargando && (
          (() => {
            const cards = topOcupaciones.length >= 5 ? topOcupaciones : TOP_FALLBACK;
            return (
              <div className="mb-6">
                <h2 className="text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}>📊 Salarios más buscados</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {cards.slice(0, 8).map(o => (
                    <button
                      key={o.puesto}
                      onClick={() => { setPuesto(o.puesto); void buscar(o.puesto); }}
                      className="card-game p-3 text-left transition hover:scale-[1.02] cursor-pointer"
                    >
                      <p className="text-xs font-semibold capitalize truncate" style={{ color: "#f1f5f9" }}>{o.puesto}</p>
                      <p className="text-lg font-bold mt-1" style={{ color: "#22c55e" }}>{formatMoney(o.avg_salary)}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px]" style={{ color: "#ef4444" }}>↓{formatMoney(o.min_salary)}</span>
                        <span className="text-[10px]" style={{ color: "#3b82f6" }}>↑{formatMoney(o.max_salary)}</span>
                      </div>
                      <p className="text-[10px] mt-1" style={{ color: "#475569" }}>{o.total.toLocaleString("es-ES")} ofertas</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()
        )}

        {/* Buscador */}
        <div className="card-game p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <label className="text-[11px] block mb-1" style={{ color: "#94a3b8" }}>Puesto</label>
              <input type="text" value={puesto} onChange={e => setPuesto(e.target.value)}
                placeholder="Ej: camarero, electricista..." className="w-full text-sm" list="puestos-list" />
              <datalist id="puestos-list">
                {PUESTOS_POPULARES.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div className="sm:w-44">
              <label className="text-[11px] block mb-1" style={{ color: "#94a3b8" }}>Provincia</label>
              <select value={provincia} onChange={e => setProvincia(e.target.value)} className="w-full text-sm">
                <option value="">Todas</option>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => void buscar()} disabled={loading} className="btn-game w-full sm:w-auto px-5 py-2 text-xs disabled:opacity-50">
                {loading ? "Buscando..." : "Comparar"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {PUESTOS_POPULARES.slice(0, 8).map(p => (
              <button key={p} onClick={() => { setPuesto(p); void buscar(p); }}
                className="px-2 py-0.5 rounded-md text-[10px] transition hover:opacity-80"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", color: "#22c55e" }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Estado vacío inicial: sin búsqueda aún */}
        {!hasSearched && (
          <div className="card-game p-8 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Selecciona una ocupación o escribe un puesto</p>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>Te mostraremos el rango salarial, media y desglose por provincia</p>
          </div>
        )}

        {/* Sin resultados después de buscar */}
        {hasSearched && !data?.rangoGeneral && !loading && (
          <div className="card-game p-8 text-center">
            <p className="text-4xl mb-3">😕</p>
            <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Sin datos para "{puesto}"</p>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>Prueba con otro puesto o revisa la ortografía</p>
          </div>
        )}

        {/* Loading skeleton durante búsqueda */}
        {loading && (
          <div className="card-game p-8 text-center">
            <p className="text-lg" style={{ color: "#22c55e" }}>⏳ Buscando datos salariales...</p>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>Consultando {puesto}{provincia ? ` en ${provincia}` : " en toda España"}</p>
          </div>
        )}

        {/* Resultados de la búsqueda */}
        {hasSearched && data?.rangoGeneral && !loading && (
          <div className="space-y-4">
            {data.fuente === "referencia" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                <span>ℹ️</span>
                <span>Datos de referencia del mercado laboral español 2026. Se actualizarán cuando haya más ofertas activas con salario visible.</span>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: data.fuente === "ofertas" ? "Ofertas" : "Fuente", valor: data.fuente === "ofertas" ? (data.rangoGeneral?.total || 0) : "Referencia", color: "#22c55e" },
                { label: "Medio", valor: formatMoney(data.rangoGeneral?.avg_salary), color: "#f59e0b" },
                { label: "Mínimo", valor: formatMoney(data.rangoGeneral?.min_salary), color: "#ef4444" },
                { label: "Máximo", valor: formatMoney(data.rangoGeneral?.max_salary), color: "#3b82f6" },
              ].map(s => (
                <div key={s.label} className="card-game p-3 text-center">
                  <p className="text-lg font-bold" style={{ color: s.color }}>{s.valor}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {data.porProvincia.length > 0 && (
              <div className="card-game p-4">
                <h2 className="font-semibold text-sm mb-3" style={{ color: "#f1f5f9" }}>Por provincia</h2>
                <div className="space-y-2">
                  {data.porProvincia.slice(0, 10).map(p => {
                    const valores = data.porProvincia.map(x => x.avg_salary || 0);
                    const maxAvg = valores.length > 0 ? Math.max(...valores) : 1;
                    const pct = ((p.avg_salary || 0) / maxAvg) * 100;
                    return (
                      <div key={p.province} className="flex items-center gap-2">
                        <span className="text-[11px] w-24 truncate" style={{ color: "#94a3b8" }}>{p.province}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#252836" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #22c55e, #16a34a)" }} />
                        </div>
                        <span className="text-[11px] font-semibold w-14 text-right" style={{ color: "#f1f5f9" }}>{formatMoney(p.avg_salary)}</span>
                        <span className="text-[10px] w-8 text-right" style={{ color: "#475569" }}>{p.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="card-game p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>¿Buscas trabajo de {data.puesto}?</p>
                <p className="text-[11px]" style={{ color: "#64748b" }}>Guzzi puede enviar tu CV automáticamente</p>
              </div>
              <button onClick={() => router.push(`/app/buscar?keyword=${encodeURIComponent(data.puesto)}${data.provincia ? `&location=${encodeURIComponent(data.provincia)}` : ""}`)}
                className="btn-game text-xs whitespace-nowrap">Buscar →</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
