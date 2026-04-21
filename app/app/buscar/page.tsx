"use client";

// Deshabilitar prerenderizado estático — la página requiere autenticación dinámica
export const dynamic = "force-dynamic";

/**
 * app/app/buscar/page.tsx — Buscador de ofertas de trabajo
 *
 * Permite al usuario:
 *   - Buscar ofertas por palabra clave y ubicación
 *   - Filtrar por tipo de jornada, experiencia y salario mínimo
 *   - Ver resultados en un grid de tarjetas JobCard
 *   - Estado de carga con skeleton animado
 *   - Mensaje si no hay resultados
 *
 * Llama al endpoint GET /api/jobs/search?keyword=X&location=Y.
 * Si el usuario no está logado, redirige a /auth/login.
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { useState, useEffect, Suspense } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import JobCard, { type PropiedadesJobCard } from "@/components/JobCard";


// ─── Opciones de filtros ──────────────────────────────────────────────────────
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

// ─── Componente Principal ─────────────────────────────────────────────────────

function BuscarPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Campos de búsqueda
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [ubicacion, setUbicacion] = useState(searchParams.get("location") || "");
  const [geoDetected, setGeoDetected] = useState(false);

  // Filtros adicionales
  const [jornada, setJornada] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [salarioMin, setSalarioMin] = useState("");

  // Estado de la búsqueda
  const [ofertas, setOfertas] = useState<PropiedadesJobCard[]>([]);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState("");

  // Verificar sesión + geolocalización automática
  useEffect(() => {
    async function init() {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      // Si no hay ubicación, intentar detectarla
      if (!ubicacion) {
        // 1. Primero mirar el perfil del usuario
        const { data: perfil } = await getSupabaseBrowser().from("profiles")
          .select("ciudad").eq("id", user.id).single();
        if (perfil?.ciudad) {
          setUbicacion(perfil.ciudad);
          setGeoDetected(true);
          return;
        }

        // 2. Si no hay ciudad en perfil, usar geolocalización del navegador
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                // Reverse geocode con API gratuita
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=es`
                );
                const data = await res.json();
                const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
                if (city) {
                  setUbicacion(city);
                  setGeoDetected(true);
                  // Guardar en perfil para futuras visitas
                  await getSupabaseBrowser().from("profiles")
                    .update({ ciudad: city })
                    .eq("id", user.id);
                }
              } catch { /* ignore geo errors */ }
            },
            () => { /* user denied geolocation */ },
            { timeout: 5000, enableHighAccuracy: false }
          );
        }
      }
    }
    init();
  }, [router, ubicacion]);

  /**
   * Búsqueda CLIENT-SIDE a Jooble (bypass Cloudflare) — el navegador del usuario SÍ pasa
   */
  async function buscarJoobleCliente(kw: string, loc: string): Promise<PropiedadesJobCard[]> {
    try {
      const res = await fetch("https://jooble.org/api/74a369ac-3511-4f74-ad51-88d5e3c69652", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: kw, location: loc }),
        signal: AbortSignal.timeout(10000),
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
      console.log("[Jooble client] no disponible");
      return [];
    }
  }

  /**
   * Ejecuta búsqueda MULTI-FUENTE: servidor (LinkedIn) + cliente (Jooble) en paralelo
   */
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

      // Lanzar ambas búsquedas en paralelo
      const [serverRes, joobleRes] = await Promise.allSettled([
        fetch(`/api/jobs/search?${params.toString()}`).then(r => r.ok ? r.json() : { ofertas: [] }),
        buscarJoobleCliente(keyword.trim(), ubicacion.trim()),
      ]);

      // Combinar resultados
      const serverOfertas = serverRes.status === "fulfilled" ? (serverRes.value.ofertas || []) : [];
      const joobleOfertas = joobleRes.status === "fulfilled" ? joobleRes.value : [];

      // Deduplicar por título+empresa
      const seen = new Set<string>();
      const todas: PropiedadesJobCard[] = [];
      for (const o of [...joobleOfertas, ...serverOfertas]) {
        const key = `${(o.titulo || "").toLowerCase().replace(/\s+/g, "")}-${(o.empresa || "").toLowerCase().replace(/\s+/g, "")}`;
        if (!seen.has(key)) {
          seen.add(key);
          todas.push(o);
        }
      }

      // Ordenar por match descendente
      todas.sort((a, b) => (b.match || 0) - (a.match || 0));
      setOfertas(todas);
    } catch (err) {
      setError((err as Error).message || "Error al buscar ofertas");
      setOfertas([]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen pt-16">

      {/* ── Cabecera de búsqueda ──────────────────────────────────────── */}
      <div className="text-white py-10 px-4" style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">🔍 Buscar ofertas de trabajo</h1>

          {/* Formulario de búsqueda */}
          <form onSubmit={buscar} className="flex flex-col sm:flex-row gap-3">
            {/* Campo: qué trabajo buscas */}
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="¿Qué trabajo buscas? (electricista, contable...)"
              className="flex-1 px-4 py-3 rounded-xl text-[#f0ebe0] bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            {/* Campo: dónde buscas */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={ubicacion}
                onChange={(e) => { setUbicacion(e.target.value); setGeoDetected(false); }}
                placeholder="¿Dónde? (Madrid, Barcelona...)"
                className="w-full px-4 py-3 rounded-xl text-[#f0ebe0] bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              {geoDetected && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#1a1a12" }}>
                  📍 Auto
                </span>
              )}
            </div>
            {/* Botón buscar */}
            <button
              type="submit"
              disabled={cargando}
              className="px-8 py-3 bg-white font-semibold rounded-xl shadow-sm hover: transition disabled:opacity-50"
              style={{ color: "#7ed56f" }}
            >
              {cargando ? "Buscando..." : "Buscar"}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">

          {/* ── Panel de filtros (columna izquierda) ─────────────────── */}
          <aside className="hidden md:block w-56 shrink-0">
            <div className="card-game p-5 sticky top-20">
              <h2 className="font-semibold text-[#f0ebe0] mb-4">Filtros</h2>

              {/* Filtro: tipo de jornada */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-[#b0a890] mb-2">
                  Tipo de jornada
                </label>
                <select
                  value={jornada}
                  onChange={(e) => setJornada(e.target.value)}
                  className="w-full text-sm border border-[#3d3c30] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {opcionesJornada.map((op) => (
                    <option key={op.valor} value={op.valor}>
                      {op.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro: experiencia requerida */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-[#b0a890] mb-2">
                  Experiencia
                </label>
                <select
                  value={experiencia}
                  onChange={(e) => setExperiencia(e.target.value)}
                  className="w-full text-sm border border-[#3d3c30] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {opcionesExperiencia.map((op) => (
                    <option key={op.valor} value={op.valor}>
                      {op.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro: salario mínimo */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-[#b0a890] mb-2">
                  Salario mínimo (€/año)
                </label>
                <input
                  type="number"
                  value={salarioMin}
                  onChange={(e) => setSalarioMin(e.target.value)}
                  placeholder="Ej: 20000"
                  className="w-full text-sm border border-[#3d3c30] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Botón aplicar filtros */}
              <button
                onClick={() => buscar()}
                className="w-full py-2.5 text-sm font-medium text-white rounded-xl transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}
              >
                Aplicar filtros
              </button>
            </div>
          </aside>

          {/* ── Resultados (columna derecha) ─────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Estado: cargando → mostrar skeleton */}
            {cargando && (
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card-game p-5 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-4" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3 mb-6" />
                    <div className="flex gap-2">
                      <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
                      <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Estado: error en la búsqueda */}
            {!cargando && error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Estado: búsqueda realizada sin resultados */}
            {!cargando && !error && buscado && ofertas.length === 0 && (
              <div className="card-game p-12 text-center">
                <p className="text-5xl mb-4">🔍</p>
                <p className="font-semibold text-[#f0ebe0] mb-2">No se encontraron ofertas</p>
                <p className="text-[#706a58] text-sm">
                  Prueba con otras palabras clave o cambia la ubicación
                </p>
              </div>
            )}

            {/* Estado: sin buscar aún */}
            {!cargando && !buscado && (
              <div className="card-game p-12 text-center">
                <p className="text-5xl mb-4">🚀</p>
                <p className="font-semibold text-[#f0ebe0] mb-2">
                  ¡Empieza tu búsqueda!
                </p>
                <p className="text-[#706a58] text-sm">
                  Introduce el trabajo que buscas y la ciudad para ver ofertas
                </p>
              </div>
            )}

            {/* Estado: hay resultados */}
            {!cargando && ofertas.length > 0 && (
              <>
                <p className="text-sm text-[#706a58] mb-4">
                  {ofertas.length} oferta{ofertas.length !== 1 ? "s" : ""} encontrada
                  {ofertas.length !== 1 ? "s" : ""}
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {ofertas.map((oferta) => (
                    <JobCard key={oferta.id} {...oferta} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Wrapper con Suspense ─────────────────────────────────────────────────────
// useSearchParams() requiere un boundary de Suspense en Next.js 15

export default function BuscarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#2563EB", borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <BuscarPageInner />
    </Suspense>
  );
}
