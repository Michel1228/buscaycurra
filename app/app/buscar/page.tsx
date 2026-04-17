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

import { useState, useEffect, Suspense, useRef } from "react";
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

  // Filtros adicionales
  const [jornada, setJornada] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [salarioMin, setSalarioMin] = useState("");

  // Estado de la búsqueda
  const [ofertas, setOfertas] = useState<PropiedadesJobCard[]>([]);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState("");

  // Referencia para deduplicar búsquedas simultáneas
  const abortControllerRef = useRef<AbortController | null>(null);

  // Verificar sesión al cargar
  useEffect(() => {
    async function verificarSesion() {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();
      if (!user) router.push("/auth/login");
    }
    verificarSesion();
  }, [router]);

  /**
   * Ejecuta la búsqueda llamando al endpoint de la API.
   * Construye los parámetros de búsqueda con los filtros activos.
   * Cancela búsquedas previas si se dispara otra antes de terminar.
   */
  async function buscar(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!keyword.trim() && !ubicacion.trim()) return;

    // Cancelar búsqueda anterior si existe (previene resultados duplicados)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setCargando(true);
    setError("");
    setBuscado(true);

    try {
      // Construir URL con los parámetros de búsqueda y filtros
      const params = new URLSearchParams();
      if (keyword.trim()) params.set("keyword", keyword.trim());
      if (ubicacion.trim()) params.set("location", ubicacion.trim());
      if (jornada) params.set("jornada", jornada);
      if (experiencia) params.set("experiencia", experiencia);
      if (salarioMin) params.set("salarioMin", salarioMin);

      const respuesta = await fetch(`/api/jobs/search?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!respuesta.ok) {
        throw new Error("Error al buscar ofertas. Inténtalo de nuevo.");
      }

      const datos = await respuesta.json();
      setOfertas(datos.ofertas || []);
    } catch (err) {
      // Ignorar errores de cancelación (el usuario lanzó otra búsqueda)
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message || "Error al buscar ofertas");
      setOfertas([]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Cabecera de búsqueda ──────────────────────────────────────── */}
      <div className="text-white py-10 px-4" style={{ backgroundColor: "#2563EB" }}>
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
              aria-label="Palabra clave del trabajo que buscas"
              className="flex-1 px-4 py-3 rounded-xl text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            {/* Campo: dónde buscas */}
            <input
              type="text"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="¿Dónde? (Madrid, Barcelona...)"
              aria-label="Ciudad o ubicación del trabajo"
              className="w-full sm:w-56 px-4 py-3 rounded-xl text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            {/* Botón buscar */}
            <button
              type="submit"
              disabled={cargando}
              className="px-8 py-3 bg-white font-semibold rounded-xl shadow-sm hover:bg-gray-50 transition disabled:opacity-50"
              style={{ color: "#2563EB" }}
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
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
              <h2 className="font-semibold text-gray-900 mb-4">Filtros</h2>

              {/* Filtro: tipo de jornada */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de jornada
                </label>
                <select
                  value={jornada}
                  onChange={(e) => setJornada(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experiencia
                </label>
                <select
                  value={experiencia}
                  onChange={(e) => setExperiencia(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salario mínimo (€/año)
                </label>
                <input
                  type="number"
                  value={salarioMin}
                  onChange={(e) => setSalarioMin(e.target.value)}
                  placeholder="Ej: 20000"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Botón aplicar filtros */}
              <button
                onClick={() => buscar()}
                className="w-full py-2.5 text-sm font-medium text-white rounded-xl transition hover:opacity-90"
                style={{ backgroundColor: "#2563EB" }}
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
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
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
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-5xl mb-4">🔍</p>
                <p className="font-semibold text-gray-900 mb-2">No se encontraron ofertas</p>
                <p className="text-gray-500 text-sm">
                  Prueba con otras palabras clave o cambia la ubicación
                </p>
              </div>
            )}

            {/* Estado: sin buscar aún */}
            {!cargando && !buscado && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-5xl mb-4">🚀</p>
                <p className="font-semibold text-gray-900 mb-2">
                  ¡Empieza tu búsqueda!
                </p>
                <p className="text-gray-500 text-sm">
                  Introduce el trabajo que buscas y la ciudad para ver ofertas
                </p>
              </div>
            )}

            {/* Estado: hay resultados */}
            {!cargando && ofertas.length > 0 && (
              <>
                <p className="text-sm text-gray-500 mb-4">
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
