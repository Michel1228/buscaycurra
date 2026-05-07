"use client";

// Deshabilitar prerenderizado estático — la página requiere autenticación dinámica
export const dynamic = "force-dynamic";

/**
 * app/app/empresas/page.tsx — Extractor de información de empresas
 *
 * Permite al usuario:
 *   - Introducir la URL de una empresa
 *   - Obtener: nombre, email de RRHH, teléfono y página de empleo
 *   - Ver el resultado en una tarjeta limpia
 *   - Ir directamente a enviar el CV a esa empresa
 *
 * Llama a GET /api/empresas/analizar?url=X.
 * Si el usuario no está logado, redirige a /auth/login.
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";


// ─── Tipos ────────────────────────────────────────────────────────────────────

interface InfoEmpresa {
  nombre: string;
  emailRrhh?: string;
  telefono?: string;
  paginaEmpleo?: string;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

function EmpresasPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [urlEmpresa, setUrlEmpresa] = useState("");
  const [infoEmpresa, setInfoEmpresa] = useState<InfoEmpresa | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState("");

  const analizar = useCallback(async (url: string) => {
    if (!url.trim()) return;
    try { new URL(url); } catch {
      setError("La URL no es válida. Ejemplo: https://www.empresa.com");
      return;
    }
    setAnalizando(true);
    setError("");
    setInfoEmpresa(null);
    try {
      const res = await fetch(`/api/empresas/analizar?${new URLSearchParams({ url: url.trim() })}`);
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error || "Error al analizar la empresa");
      }
      setInfoEmpresa(await res.json() as InfoEmpresa);
    } catch (err) {
      setError((err as Error).message || "Error al analizar la empresa");
    } finally {
      setAnalizando(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const urlParam = searchParams.get("url");
      if (urlParam) {
        setUrlEmpresa(urlParam);
        void analizar(urlParam);
      }
    }
    void init();
  }, [router, searchParams, analizar]);

  function analizarEmpresa(e: React.FormEvent) {
    e.preventDefault();
    void analizar(urlEmpresa);
  }

  return (
    <div className="min-h-screen pt-16">

      {/* ── Cabecera de la página ──────────────────────────────────────── */}
      <div className="text-white py-10 px-4" style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">🏢 Extractor de empresas</h1>
          <p className="text-blue-100 mt-1 text-sm">
            Encuentra el email de RRHH de cualquier empresa automáticamente
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── Formulario de análisis ─────────────────────────────────────── */}
        <div className="card-game p-6 mb-6">
          <form onSubmit={analizarEmpresa} className="flex flex-col sm:flex-row gap-3">
            {/* Input de URL */}
            <input
              type="url"
              value={urlEmpresa}
              onChange={(e) => setUrlEmpresa(e.target.value)}
              placeholder="https://www.empresa.com"
              className="flex-1 text-sm border border-[#3d3c30] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {/* Botón analizar */}
            <button
              type="submit"
              disabled={analizando || !urlEmpresa.trim()}
              className="px-6 py-3 text-sm font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}
            >
              {analizando ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analizando...
                </span>
              ) : (
                "🔍 Analizar empresa"
              )}
            </button>
          </form>
        </div>

        {/* ── Mensaje de error ───────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ── Skeleton de carga ──────────────────────────────────────────── */}
        {analizando && (
          <div className="card-game p-6 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tarjeta de resultados ──────────────────────────────────────── */}
        {!analizando && infoEmpresa && (
          <div className="card-game overflow-hidden">

            {/* Cabecera de la tarjeta */}
            <div className="px-6 py-5 border-b border-[#3d3c30]">
              <h2 className="font-bold text-[#f0ebe0] text-lg">{infoEmpresa.nombre}</h2>
              <p className="text-sm text-[#706a58] mt-0.5">{urlEmpresa}</p>
            </div>

            {/* Datos extraídos */}
            <div className="px-6 py-5 space-y-4">

              {/* Email de RRHH */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="text-xs text-[#706a58] uppercase tracking-wide font-medium">
                    Email de RRHH
                  </p>
                  {infoEmpresa.emailRrhh ? (
                    <a
                      href={`mailto:${infoEmpresa.emailRrhh}`}
                      className="text-sm font-medium hover:underline"
                      style={{ color: "#7ed56f" }}
                    >
                      {infoEmpresa.emailRrhh}
                    </a>
                  ) : (
                    <p className="text-sm text-[#504a3a]">No encontrado</p>
                  )}
                </div>
              </div>

              {/* Teléfono */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">📞</span>
                <div>
                  <p className="text-xs text-[#706a58] uppercase tracking-wide font-medium">
                    Teléfono
                  </p>
                  {infoEmpresa.telefono ? (
                    <a
                      href={`tel:${infoEmpresa.telefono}`}
                      className="text-sm font-medium hover:underline"
                      style={{ color: "#7ed56f" }}
                    >
                      {infoEmpresa.telefono}
                    </a>
                  ) : (
                    <p className="text-sm text-[#504a3a]">No encontrado</p>
                  )}
                </div>
              </div>

              {/* Página de empleo interna */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">💼</span>
                <div>
                  <p className="text-xs text-[#706a58] uppercase tracking-wide font-medium">
                    Página de empleo
                  </p>
                  {infoEmpresa.paginaEmpleo ? (
                    <a
                      href={infoEmpresa.paginaEmpleo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline"
                      style={{ color: "#7ed56f" }}
                    >
                      Ver ofertas internas
                    </a>
                  ) : (
                    <p className="text-sm text-[#504a3a]">No encontrada</p>
                  )}
                </div>
              </div>
            </div>

            {/* Botón de acción principal */}
            <div className="px-6 py-5 border-t border-[#3d3c30]">
              <Link
                href={`/app/envios?empresa=${encodeURIComponent(infoEmpresa.nombre)}`}
                className="block w-full text-center py-3 text-sm font-bold rounded-xl transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}
              >
                📧 Enviar CV a esta empresa
              </Link>
            </div>
          </div>
        )}

        {/* ── Estado inicial (sin búsqueda) ──────────────────────────────── */}
        {!analizando && !infoEmpresa && !error && (
          <div className="card-game p-12 text-center">
            <p className="text-5xl mb-4">🏢</p>
            <p className="font-semibold text-[#f0ebe0] mb-2">Analiza cualquier empresa</p>
            <p className="text-[#706a58] text-sm leading-relaxed">
              Introduce la URL de la empresa y encontraremos automáticamente
              su email de RRHH, teléfono y página de empleo.
            </p>
          </div>
        )}

        {/* ── Sección ETTs ──────────────────────────────────────────── */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: "#f0ebe0" }}>🏢 ETTs y Agencias de Empleo</h2>
          <p className="text-sm mb-4" style={{ color: "#706a58" }}>
            Las ETTs son una de las mejores vías para encontrar trabajo rápido. Aquí tienes las principales en España:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { nombre: "Adecco", url: "https://www.adecco.es", desc: "Líder mundial en RRHH", icon: "🔵" },
              { nombre: "Randstad", url: "https://www.randstad.es", desc: "Segunda ETT más grande", icon: "🟠" },
              { nombre: "ManpowerGroup", url: "https://www.manpower.es", desc: "Presente en 80 países", icon: "🔴" },
              { nombre: "Eurofirms", url: "https://www.eurofirms.es", desc: "ETT española líder", icon: "🟢" },
              { nombre: "Synergie", url: "https://www.synergie.es", desc: "Especialista en industria", icon: "🟡" },
              { nombre: "Gi Group", url: "https://www.gigroup.es", desc: "Global, multisector", icon: "🟣" },
              { nombre: "Page Personnel", url: "https://www.pagepersonnel.es", desc: "Perfiles cualificados", icon: "⚪" },
              { nombre: "Hays", url: "https://www.hays.es", desc: "Especialista en selección", icon: "🔵" },
              { nombre: "SEPE", url: "https://www.sepe.es", desc: "Servicio público de empleo", icon: "🏛️" },
              { nombre: "InfoJobs", url: "https://www.infojobs.net", desc: "Portal #1 en España", icon: "🟦" },
            ].map((ett) => (
              <div key={ett.nombre} className="card-game p-4 flex items-center gap-3 group cursor-pointer"
                onClick={() => { setUrlEmpresa(ett.url); }}>
                <span className="text-xl">{ett.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: "#f0ebe0" }}>{ett.nombre}</p>
                  <p className="text-[11px]" style={{ color: "#706a58" }}>{ett.desc}</p>
                </div>
                <div className="flex gap-2">
                  <a href={ett.url} target="_blank" rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition hover:opacity-80"
                    style={{ border: "1px solid rgba(126,213,111,0.2)", color: "#b0a890" }}
                    onClick={(e) => e.stopPropagation()}>Visitar</a>
                  <button onClick={(e) => { e.stopPropagation(); setUrlEmpresa(ett.url); }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}>Analizar</button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-4 text-center" style={{ color: "#504a3a" }}>
            💡 Tip: Inscríbete en al menos 3-4 ETTs para maximizar tus opciones
          </p>
        </div>

      </div>
    </div>
  );
}

export default function EmpresasPage() {
  return (
    <Suspense>
      <EmpresasPageInner />
    </Suspense>
  );
}
