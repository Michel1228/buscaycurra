"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import JobCard, { type PropiedadesJobCard } from "@/components/JobCard";

const opcionesJornada = [
  { valor: "", etiqueta: "Todas" },
  { valor: "completa", etiqueta: "Jornada completa" },
  { valor: "parcial", etiqueta: "Jornada parcial" },
  { valor: "remoto", etiqueta: "Remoto" },
];

const opcionesExperiencia = [
  { valor: "", etiqueta: "Cualquier experiencia" },
  { valor: "sin-experiencia", etiqueta: "Sin experiencia" },
  { valor: "1-3", etiqueta: "1 – 3 años" },
  { valor: "3-5", etiqueta: "3 – 5 años" },
  { valor: "5+", etiqueta: "Más de 5 años" },
];

function BuscarPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [ubicacion, setUbicacion] = useState(searchParams.get("location") || "");
  const [geoDetected, setGeoDetected] = useState(false);
  const [jornada, setJornada] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [salarioMin, setSalarioMin] = useState("");

  const [ofertas, setOfertas] = useState<PropiedadesJobCard[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const [fuenteResultados, setFuenteResultados] = useState<string>("");

  const [mostrarAlertaModal, setMostrarAlertaModal] = useState(false);
  const [alertaCreada, setAlertaCreada] = useState(false);
  const [creandoAlerta, setCreandoAlerta] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      if (!ubicacion) {
        const { data: perfil } = await getSupabaseBrowser().from("profiles")
          .select("ciudad").eq("id", user.id).single();
        if (perfil?.ciudad) {
          setUbicacion(perfil.ciudad);
          setGeoDetected(true);
          return;
        }

        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=es`
                );
                const data = await res.json();
                const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
                if (city) {
                  setUbicacion(city);
                  setGeoDetected(true);
                  await getSupabaseBrowser().from("profiles").update({ ciudad: city }).eq("id", user.id);
                }
              } catch { /* ignore */ }
            },
            () => { /* denied */ },
            { timeout: 5000, enableHighAccuracy: false }
          );
        }
      }
    }
    init();
  }, [router, ubicacion]);

  async function buscarJoobleCliente(kw: string, loc: string): Promise<PropiedadesJobCard[]> {
    // Solo buscar en Jooble si hay keyword, no para búsquedas solo por ciudad
    if (!kw.trim()) return [];
    try {
      const res = await fetch("/api/jobs/jooble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: kw, location: loc }),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const jobs = data.jobs || [];
      return jobs.slice(0, 20).map((j: Record<string, string>, i: number) => ({
        id: `jooble-${Date.now()}-${i}`,
        titulo: j.title || kw,
        empresa: j.company || "Ver en oferta",
        ubicacion: j.location || loc,
        salario: j.salary || "Ver en oferta",
        descripcion: (j.snippet || j.title || "").replace(/<[^>]+>/g, "").slice(0, 200),
        fuente: "Jooble",
        url: j.link || `https://es.jooble.org/SearchResult?ukw=${encodeURIComponent(kw)}&loc=${encodeURIComponent(loc)}`,
        fecha: j.updated || new Date().toISOString(),
        match: Math.max(88 - i * 3, 40),
        distancia: "🏠 Tu ciudad",
      }));
    } catch {
      return [];
    }
  }

  const scrollRef = useRef<HTMLDivElement>(null);

  async function buscar(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!keyword.trim() && !ubicacion.trim()) return;

    setCargando(true);
    setError("");
    setBuscado(true);

    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.set("keyword", keyword.trim());
      if (ubicacion.trim()) params.set("location", ubicacion.trim());
      if (jornada) params.set("jornada", jornada);
      if (experiencia) params.set("experiencia", experiencia);
      if (salarioMin) params.set("salarioMin", salarioMin);

      const [serverRes, joobleRes] = await Promise.allSettled([
        fetch(`/api/jobs/search?${params.toString()}`).then(r => r.ok ? r.json() : { ofertas: [] }),
        buscarJoobleCliente(keyword.trim(), ubicacion.trim()),
      ]);

      const serverOfertas = serverRes.status === "fulfilled" ? (serverRes.value.ofertas || []) : [];
      const joobleOfertas = joobleRes.status === "fulfilled" ? joobleRes.value : [];
      const serverTotal = serverRes.status === "fulfilled" ? (serverRes.value.total || 0) : 0;
      const serverHasMore = serverRes.status === "fulfilled" ? (serverRes.value.hasMore || false) : false;
      
      console.log(`[Buscar] Server: ${serverOfertas.length} ofertas, total: ${serverTotal}, hasMore: ${serverHasMore}`);

      // Priorizar ofertas de la BD (más completas) sobre Jooble
      const seen = new Set<string>();
      const todas: PropiedadesJobCard[] = [];
      
      // Primero las de la base de datos
      for (const o of serverOfertas) {
        const key = `${(o.titulo || "").toLowerCase().replace(/\s+/g, "")}-${(o.empresa || "").toLowerCase().replace(/\s+/g, "")}`;
        if (!seen.has(key)) {
          seen.add(key);
          todas.push(o);
        }
      }
      
      // Luego las de Jooble si no están duplicadas
      for (const o of joobleOfertas) {
        const key = `${(o.titulo || "").toLowerCase().replace(/\s+/g, "")}-${(o.empresa || "").toLowerCase().replace(/\s+/g, "")}`;
        if (!seen.has(key)) {
          seen.add(key);
          todas.push(o);
        }
      }

      todas.sort((a, b) => (b.match || 0) - (a.match || 0));
      setOfertas(todas);
      setCurrentPage(1);
      const source = serverRes.status === "fulfilled" ? (serverRes.value.source || "") : "";
      setFuenteResultados(source);
      setTotalResultados(serverTotal > 0 ? serverTotal : todas.length);
      setHayMas(serverHasMore);
      console.log(`[Buscar] Final: ${todas.length} ofertas, hayMas: ${serverHasMore}, total: ${serverTotal}`);
    } catch (err) {
      setError((err as Error).message || "Error al buscar ofertas");
      setOfertas([]);
    } finally {
      setCargando(false);
    }
  }

  async function cargarMas() {
    if (cargandoMas || !hayMas) return;
    setCargandoMas(true);
    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams();
      if (keyword.trim()) params.set("keyword", keyword.trim());
      if (ubicacion.trim()) params.set("location", ubicacion.trim());
      if (jornada) params.set("jornada", jornada);
      params.set("page", String(nextPage));
      const res = await fetch(`/api/jobs/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const nuevas = data.ofertas || [];
        const seen = new Set(ofertas.map(o => o.id));
        const sinDuplicados = nuevas.filter((o: {id: string}) => !seen.has(o.id));
        setOfertas(prev => [...prev, ...sinDuplicados]);
        setCurrentPage(nextPage);
        setHayMas(data.hasMore || false);
        setTotalResultados(data.total || totalResultados);
        setFuenteResultados(data.source || fuenteResultados);
      }
    } catch (err) { console.error("Error cargarMas:", err); }
    finally { setCargandoMas(false); }
  }



  const esEnTiempoReal = fuenteResultados.startsWith("live-api");

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>

      {/* Cabecera de búsqueda */}
      <div className="py-8 px-4" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#ffffff" }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold mb-4">Buscar ofertas de trabajo</h1>
          <form onSubmit={buscar} className="flex flex-col sm:flex-row gap-2">
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
              placeholder="¿Qué trabajo buscas?" className="flex-1 px-4 py-2.5 rounded-lg text-sm"
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff" }} />
            <div className="relative w-full sm:w-56">
              <input type="text" value={ubicacion} onChange={(e) => { setUbicacion(e.target.value); setGeoDetected(false); }}
                placeholder="¿Dónde?" className="w-full px-4 py-2.5 rounded-lg text-sm"
                style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff" }} />
              {geoDetected && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] opacity-70">📍 Auto</span>}
            </div>
            <button type="submit" disabled={cargando}
              className="px-6 py-2.5 bg-white font-semibold rounded-lg text-sm transition disabled:opacity-50"
              style={{ color: "#16a34a" }}>
              {cargando ? "Buscando..." : "Buscar"}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Filtros */}
          <aside className="hidden md:block w-52 shrink-0">
            <div className="card-game p-4 sticky top-20">
              <h2 className="font-semibold text-sm mb-4" style={{ color: "#f1f5f9" }}>Filtros</h2>
              <div className="mb-4">
                <label className="block text-xs mb-1.5" style={{ color: "#94a3b8" }}>Tipo de jornada</label>
                <select value={jornada} onChange={(e) => setJornada(e.target.value)} className="w-full text-sm">
                  {opcionesJornada.map(op => <option key={op.valor} value={op.valor}>{op.etiqueta}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-xs mb-1.5" style={{ color: "#94a3b8" }}>Experiencia</label>
                <select value={experiencia} onChange={(e) => setExperiencia(e.target.value)} className="w-full text-sm">
                  {opcionesExperiencia.map(op => <option key={op.valor} value={op.valor}>{op.etiqueta}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-xs mb-1.5" style={{ color: "#94a3b8" }}>Salario mínimo (€/año)</label>
                <input type="number" value={salarioMin} onChange={(e) => setSalarioMin(e.target.value)}
                  placeholder="Ej: 20000" className="w-full text-sm" />
              </div>
              <button onClick={() => buscar()} className="btn-game w-full text-xs py-2">Aplicar filtros</button>
            </div>
          </aside>

          {/* Resultados */}
          <div className="flex-1 min-w-0">
            {cargando && (
              <div className="grid sm:grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card-game p-4 animate-pulse">
                    <div className="h-3 rounded w-1/4 mb-3" style={{ background: "#252836" }} />
                    <div className="h-4 rounded w-3/4 mb-2" style={{ background: "#252836" }} />
                    <div className="h-3 rounded w-1/2 mb-2" style={{ background: "#252836" }} />
                    <div className="h-3 rounded w-1/3 mb-4" style={{ background: "#252836" }} />
                    <div className="flex gap-2">
                      <div className="flex-1 h-9 rounded-lg" style={{ background: "#252836" }} />
                      <div className="flex-1 h-9 rounded-lg" style={{ background: "#252836" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!cargando && error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                ⚠️ {error}
              </div>
            )}

            {!cargando && !error && buscado && ofertas.length === 0 && (
              <div className="card-game p-10 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>No se encontraron ofertas</p>
                <p className="text-xs mt-1" style={{ color: "#64748b" }}>Prueba con otras palabras clave</p>
              </div>
            )}

            {!cargando && !buscado && (
              <div className="card-game p-10 text-center">
                <p className="text-4xl mb-3">🚀</p>
                <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>¡Empieza tu búsqueda!</p>
                <p className="text-xs mt-1" style={{ color: "#64748b" }}>Introduce el trabajo y la ciudad</p>
              </div>
            )}

            {!cargando && ofertas.length > 0 && (
              <>
                <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs" style={{ color: "#64748b" }}>
                      {esEnTiempoReal ? `${ofertas.length} ofertas` : `${ofertas.length} de ${(totalResultados > ofertas.length ? totalResultados : ofertas.length).toLocaleString("es-ES")} ofertas`}
                    </p>
                    {esEnTiempoReal && <p className="text-[10px]" style={{ color: "#475569" }}>Resultados en tiempo real</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setMostrarAlertaModal(true)}
                      className="text-[11px] px-3 py-1.5 rounded-lg font-medium transition"
                      style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
                      🔔 Alerta
                    </button>
                    <a href="/app/guardados"
                      className="text-[11px] px-3 py-1.5 rounded-lg font-medium transition"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                      ❤️ Guardados
                    </a>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {ofertas.map(oferta => <JobCard key={oferta.id} {...oferta} />)}
                </div>
                
                {hayMas && (
                  <div className="flex flex-col items-center mt-6 gap-2">
                    <button
                      onClick={cargarMas}
                      disabled={cargandoMas}
                      className="px-8 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
                    >
                      {cargandoMas ? "⏳ Cargando..." : `📥 Cargar más ofertas (${(totalResultados - ofertas.length).toLocaleString("es-ES")} restantes)`}
                    </button>
                    <p className="text-[10px]" style={{ color: "#475569" }}>
                      Mostrando {ofertas.length.toLocaleString("es-ES")} de {totalResultados.toLocaleString("es-ES")} ofertas
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal alerta */}
      {mostrarAlertaModal && (
        <AlertaModal keyword={keyword} location={ubicacion}
          onClose={() => setMostrarAlertaModal(false)} onCreada={() => setAlertaCreada(true)} />
      )}

      {alertaCreada && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl text-xs font-medium"
          style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
          ✅ Alerta creada. Te avisaremos de nuevas ofertas.
        </div>
      )}
    </div>
  );
}

function AlertaModal({ keyword, location, onClose, onCreada }: {
  keyword: string; location: string; onClose: () => void; onCreada: () => void;
}) {
  const [freq, setFreq] = useState<"daily" | "weekly">("daily");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function crear() {
    setLoading(true);
    setError("");
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      if (!session) { setError("Debes iniciar sesión"); return; }
      const res = await fetch("/api/jobs/alertas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ keyword, location, frequency: freq }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "Error al crear alerta");
        return;
      }
      onCreada(); onClose();
    } catch { setError("Error de red"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl p-5 space-y-4" style={{ background: "#1e212b", border: "1px solid #2d3142" }} onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>🔔 Crear alerta de empleo</h3>
        <p className="text-xs" style={{ color: "#64748b" }}>Te avisaremos cuando haya nuevas ofertas para:</p>
        <div className="p-2.5 rounded-lg" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <p className="text-xs font-medium" style={{ color: "#22c55e" }}>{keyword || "Cualquier puesto"} {location ? `en ${location}` : ""}</p>
        </div>
        <div>
          <label className="text-[11px] block mb-1.5" style={{ color: "#94a3b8" }}>Frecuencia</label>
          <div className="flex gap-2">
            {(["daily", "weekly"] as const).map(f => (
              <button key={f} onClick={() => setFreq(f)}
                className="flex-1 py-2 rounded-lg text-[11px] font-medium transition"
                style={{
                  background: freq === f ? "rgba(34,197,94,0.12)" : "#252836",
                  border: freq === f ? "1px solid rgba(34,197,94,0.3)" : "1px solid #2d3142",
                  color: freq === f ? "#22c55e" : "#64748b",
                }}>
                {f === "daily" ? "📅 Diaria" : "📆 Semanal"}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-[11px]" style={{ color: "#ef4444" }}>{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[11px] rounded-lg" style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>Cancelar</button>
          <button onClick={crear} disabled={loading} className="btn-game px-5 py-2 text-[11px] disabled:opacity-50">{loading ? "Creando..." : "Crear"}</button>
        </div>
      </div>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
      </div>
    }>
      <BuscarPageInner />
    </Suspense>
  );
}
