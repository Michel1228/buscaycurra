"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Candidato {
  id: string;
  nombre: string;
  ciudad: string;
  puesto: string;
  aptitudes: string[];
  email: string | null;
  telefono: string | null;
  updatedAt: string;
}

const SECTORES = [
  "Hostelería", "Construcción", "Logística", "Comercio", "Tecnología",
  "Sanidad", "Limpieza", "Administración", "Industria", "Educación",
];

function iniciales(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map(n => n[0] || "").join("").toUpperCase() || "?";
}

function colorAvatar(id: string): string {
  const colores = ["#22c55e", "#3b82f6", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6"];
  const idx = id.charCodeAt(0) % colores.length;
  return colores[idx];
}

export default function CandidatosPage() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [cargando, setCargando] = useState(true);
  const [esEmpresa, setEsEmpresa] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [ciudad, setCiudad] = useState("");
  const [keyword, setKeyword] = useState("");
  const [pagina, setPagina] = useState(1);
  const [busquedaActiva, setBusquedaActiva] = useState({ ciudad: "", keyword: "" });

  useEffect(() => {
    async function init() {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();
      if (user) setUserId(user.id);
    }
    init();
  }, []);

  const cargar = useCallback(async (p = 1) => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (busquedaActiva.ciudad) params.set("ciudad", busquedaActiva.ciudad);
      if (busquedaActiva.keyword) params.set("q", busquedaActiva.keyword);
      if (userId) params.set("userId", userId);

      const res = await fetch(`/api/empresas/candidatos?${params}`);
      const data = await res.json() as { candidatos: Candidato[]; esEmpresa: boolean };
      setCandidatos(data.candidatos || []);
      setEsEmpresa(data.esEmpresa || false);
      setPagina(p);
    } catch { /* silencioso */ }
    finally { setCargando(false); }
  }, [busquedaActiva, userId]);

  useEffect(() => { cargar(1); }, [cargar]);

  function buscar() {
    setBusquedaActiva({ ciudad, keyword });
  }

  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>

      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: "rgba(15,17,23,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(45,49,66,0.4)" }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/empresas" className="flex items-center gap-2.5">
            <span className="text-xl">🐛</span>
            <span className="font-bold text-sm" style={{ color: "#22c55e" }}>BuscayCurra</span>
            <span className="hidden sm:inline text-xs" style={{ color: "#475569" }}>/ Candidatos</span>
          </Link>
          {!esEmpresa && (
            <Link href="/precios"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
              💎 Plan Empresa — Ver contactos
            </Link>
          )}
          {esEmpresa && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
              ✓ Plan Empresa activo
            </span>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Título + búsqueda */}
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-1" style={{ color: "#f1f5f9" }}>Candidatos disponibles</h1>
          <p className="text-xs mb-6" style={{ color: "#64748b" }}>
            Profesionales buscando trabajo activamente en España. CVs optimizados con IA.
            {!esEmpresa && <> <Link href="/precios" style={{ color: "#22c55e" }}> Activa Plan Empresa</Link> para ver contacto completo.</>}
          </p>

          <div className="flex flex-wrap gap-3">
            <input
              type="text" value={ciudad} onChange={e => setCiudad(e.target.value)}
              onKeyDown={e => e.key === "Enter" && buscar()}
              placeholder="Ciudad (ej: Madrid, Valencia...)"
              className="text-sm flex-1 min-w-[160px]" style={{ maxWidth: "220px" }}
            />
            <input
              type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && buscar()}
              placeholder="Perfil (ej: electricista, camarero...)"
              className="text-sm flex-1 min-w-[200px]"
            />
            <button onClick={buscar}
              className="px-5 py-2 text-sm font-semibold rounded-lg transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
              Buscar
            </button>
          </div>

          {/* Sectores rápidos */}
          <div className="flex flex-wrap gap-2 mt-3">
            {SECTORES.map(s => (
              <button key={s} onClick={() => { setKeyword(s); setBusquedaActiva(prev => ({ ...prev, keyword: s })); }}
                className="text-[10px] px-2.5 py-1 rounded-full transition hover:opacity-80"
                style={{
                  background: busquedaActiva.keyword === s ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.03)",
                  border: busquedaActiva.keyword === s ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(45,49,66,0.5)",
                  color: busquedaActiva.keyword === s ? "#22c55e" : "#64748b",
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Aviso plan empresa */}
        {!esEmpresa && (
          <div className="mb-6 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between"
            style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#22c55e" }}>Estás viendo perfiles anonimizados</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Con Plan Empresa (49,99€/mes) ves nombre completo, email y teléfono de cada candidato.</p>
            </div>
            <Link href="/precios"
              className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
              Contratar acceso →
            </Link>
          </div>
        )}

        {/* Grid de candidatos */}
        {cargando ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="card-game p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full" style={{ background: "#252836" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded" style={{ background: "#252836", width: "60%" }} />
                    <div className="h-2.5 rounded" style={{ background: "#1e212b", width: "40%" }} />
                  </div>
                </div>
                <div className="h-2.5 rounded mb-2" style={{ background: "#1e212b" }} />
                <div className="h-2.5 rounded" style={{ background: "#1e212b", width: "70%" }} />
              </div>
            ))}
          </div>
        ) : candidatos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#f1f5f9" }}>Sin resultados</p>
            <p className="text-xs" style={{ color: "#64748b" }}>Prueba con otra ciudad o perfil diferente.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidatos.map(c => (
              <div key={c.id} className="card-game p-5 flex flex-col gap-3 relative">

                {/* Avatar + nombre */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `${colorAvatar(c.id)}22`, color: colorAvatar(c.id), border: `1.5px solid ${colorAvatar(c.id)}44` }}>
                    {iniciales(c.nombre)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#f1f5f9" }}>{c.nombre}</p>
                    <p className="text-[11px]" style={{ color: "#64748b" }}>📍 {c.ciudad}</p>
                  </div>
                </div>

                {/* Puesto */}
                {c.puesto && (
                  <p className="text-[11px] font-medium" style={{ color: "#94a3b8" }}>💼 {c.puesto}</p>
                )}

                {/* Aptitudes */}
                {c.aptitudes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.aptitudes.map((a, i) => (
                      <span key={i} className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)" }}>
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                {/* Contacto / lock */}
                {esEmpresa ? (
                  <div className="mt-auto space-y-1 pt-2" style={{ borderTop: "1px solid rgba(45,49,66,0.5)" }}>
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-[11px] hover:opacity-80 transition"
                        style={{ color: "#22c55e" }}>
                        ✉️ {c.email}
                      </a>
                    )}
                    {c.telefono && (
                      <a href={`tel:${c.telefono}`} className="flex items-center gap-2 text-[11px] hover:opacity-80 transition"
                        style={{ color: "#94a3b8" }}>
                        📞 {c.telefono}
                      </a>
                    )}
                    {!c.email && !c.telefono && (
                      <p className="text-[10px]" style={{ color: "#475569" }}>Sin contacto en CV</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-auto pt-2" style={{ borderTop: "1px solid rgba(45,49,66,0.5)" }}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]">🔒</span>
                          <div className="h-2 w-28 rounded" style={{ background: "rgba(45,49,66,0.8)", filter: "blur(2px)" }} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]">🔒</span>
                          <div className="h-2 w-20 rounded" style={{ background: "rgba(45,49,66,0.8)", filter: "blur(2px)" }} />
                        </div>
                      </div>
                      <Link href="/precios"
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition hover:opacity-90"
                        style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                        Ver →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {candidatos.length === 24 && (
          <div className="flex justify-center gap-3 mt-8">
            {pagina > 1 && (
              <button onClick={() => cargar(pagina - 1)}
                className="px-4 py-2 text-xs rounded-lg transition hover:opacity-80"
                style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
                ← Anterior
              </button>
            )}
            <button onClick={() => cargar(pagina + 1)}
              className="px-4 py-2 text-xs rounded-lg transition hover:opacity-80"
              style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
              Siguiente →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
