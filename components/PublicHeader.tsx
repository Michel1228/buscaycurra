"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, BookOpen, LayoutGrid, LogIn, Megaphone, Sparkles, Smartphone, Tag } from "lucide-react";
import LogoGusano from "@/components/LogoGusano";
import FondoOleaje from "@/components/FondoOleaje";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  // CON SESIÓN, ESTA CABECERA NO PUEDE DECIR "EMPEZAR GRATIS" (7 nov 2026).
  // Las páginas públicas (cursos, guías, países...) se abren también desde la
  // app: "Dónde sacarlo" en la ficha de una oferta lleva a /cursos/... Quien ya
  // tenía cuenta se encontraba "Entrar" y "Empezar gratis", sin el menú de la
  // app, y tenía que volver por ajustes. Ahora ve "Volver a la app", que le
  // devuelve a la pantalla de la que venía.
  const [conSesion, setConSesion] = useState(false);
  useEffect(() => {
    getSupabaseBrowser().auth.getSession()
      .then(({ data }) => setConSesion(!!data.session))
      .catch(() => { /* sin sesión: cabecera pública */ });
  }, []);
  function volverALaApp(e: React.MouseEvent) {
    setMenuOpen(false);
    // Si venía de una pantalla de la app (la ficha de la oferta), vuelve a ella.
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.host === window.location.host && ref.pathname.startsWith("/app") && window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
    } catch { /* se va a /app */ }
  }

  return (
    <>
    {/* El mismo fondo de oleaje que dentro de la app (7 nov 2026): la web
        pública y la app se ven como una sola cosa. */}
    <FondoOleaje />
    <header
      className="barra-app sticky top-0 z-50"
      style={{
        background: "rgba(6,9,11,0.84)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(163,230,53,0.12)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <LogoGusano size={30} />
          <span className="font-extrabold text-[17px] tracking-tight">
            <span style={{ color: "#f8fafc" }}>Buscay</span><span className="texto-neon">Curra</span>
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          {/* /descargar existía pero no la enlazaba nadie: era inalcanzable
              salvo escribiendo la URL. Ahí está la app de iPhone y el QR. */}
          <Link
            href="/descargar"
            className="text-sm font-medium transition hover:opacity-80"
            style={{ color: "#a7b3c6" }}
          >
            Descargar app
          </Link>
          {/* /precios estaba en el sitemap con prioridad 0.9 pero no la
              enlazaba ninguna navegación: solo se llegaba por el ancla #precios
              de la home. */}
          {/* Las guías son la puerta de entrada de quien llega desde Google sin
              conocernos: si no se enlazan desde arriba, no las ve nadie. */}
          <Link
            href="/funciones"
            className="text-sm font-medium transition hover:opacity-80"
            style={{ color: "#a7b3c6" }}
          >
            Funciones
          </Link>
          <Link
            href="/guias"
            className="text-sm font-medium transition hover:opacity-80"
            style={{ color: "#a7b3c6" }}
          >
            Guías
          </Link>
          <Link
            href="/precios"
            className="text-sm font-medium transition hover:opacity-80"
            style={{ color: "#a7b3c6" }}
          >
            Precios
          </Link>
          <Link
            href="/empresas"
            className="text-sm font-medium transition hover:opacity-80"
            style={{ color: "#a7b3c6" }}
          >
            Para empresas
          </Link>
          {conSesion ? (
            <Link
              href="/app"
              onClick={volverALaApp}
              className="text-sm font-bold px-4 py-2 rounded-full transition hover:opacity-90"
              style={{ background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406", boxShadow: "0 6px 20px -8px rgba(163,230,53,0.7)", }}
            >
              Volver a la app
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium transition hover:opacity-80"
                style={{ color: "#94a3b8" }}
              >
                Entrar
              </Link>
              <Link
                href="/auth/registro"
                className="text-sm font-bold px-4 py-2 rounded-full transition hover:opacity-90"
                style={{
                  background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406", boxShadow: "0 6px 20px -8px rgba(163,230,53,0.7)",
                }}
              >
                Empezar gratis
              </Link>
            </>
          )}
        </div>

        {/* Mobile: hamburger + CTA */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href={conSesion ? "/app" : "/auth/registro"}
            onClick={conSesion ? volverALaApp : undefined}
            className="text-xs font-bold px-3.5 py-2 rounded-full transition hover:opacity-90"
            style={{
              background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406", boxShadow: "0 6px 20px -8px rgba(163,230,53,0.7)",
            }}
          >
            {conSesion ? "Volver a la app" : "Empezar gratis"}
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center w-11 h-11 rounded-full"
            style={{ color: "#94a3b8" }}
            aria-label="Menú"
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="5" y1="5" x2="15" y2="15" />
                <line x1="15" y1="5" x2="5" y2="15" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute top-14 left-4 right-4 rounded-xl p-4"
            style={{ background: "#1e212b", border: "1px solid #2d3142" }}
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col gap-1">
              <Link
                href="/descargar"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm transition"
                style={{ color: "#94a3b8" }}
              >
                <Smartphone size={14} strokeWidth={1.8} className="inline mr-1.5" />Descargar app
              </Link>
              <Link
                href="/funciones"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm transition"
                style={{ color: "#94a3b8" }}
              >
                <LayoutGrid size={14} strokeWidth={1.8} className="inline mr-1.5" />Todo lo que hace
              </Link>
              <Link
                href="/guias"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm transition"
                style={{ color: "#94a3b8" }}
              >
                <BookOpen size={14} strokeWidth={1.8} className="inline mr-1.5" />Guías de uso
              </Link>
              <Link
                href="/novedades"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm transition"
                style={{ color: "#94a3b8" }}
              >
                <Megaphone size={14} strokeWidth={1.8} className="inline mr-1.5" />Novedades
              </Link>
              <Link
                href="/precios"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm transition"
                style={{ color: "#94a3b8" }}
              >
                <Tag size={14} strokeWidth={1.8} className="inline mr-1.5" />Precios
              </Link>
              <Link
                href="/empresas"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm transition"
                style={{ color: "#94a3b8" }}
              >
                <Building2 size={14} strokeWidth={1.8} className="inline mr-1.5" />Para empresas
              </Link>
              {conSesion ? (
                <Link
                  href="/app"
                  onClick={volverALaApp}
                  className="px-4 py-3 rounded-lg text-sm font-semibold transition"
                  style={{ color: "#22c55e" }}
                >
                  <LayoutGrid size={14} strokeWidth={1.8} className="inline mr-1.5" />Volver a la app
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm transition"
                    style={{ color: "#94a3b8" }}
                  >
                    <LogIn size={14} strokeWidth={1.8} className="inline mr-1.5" />Entrar
                  </Link>
                  <div style={{ height: "1px", background: "#252836", margin: "4px 0" }} />
                  <Link
                    href="/auth/registro"
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-semibold transition"
                    style={{ color: "#22c55e" }}
                  >
                    <Sparkles size={14} strokeWidth={1.8} className="inline mr-1.5" />Crear cuenta gratis
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
    </>
  );
}
