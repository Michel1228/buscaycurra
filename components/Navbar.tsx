"use client";

/**
 * components/Navbar.tsx — Barra de navegación principal de BuscayCurra
 *
 * Paleta "La Metamorfosis": negro semitransparente + verde neón.
 * Muestra el logo-gusano animado, los enlaces de navegación y,
 * si el usuario está logueado, su fase evolutiva actual.
 */

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LogoGusano from "./LogoGusano";
import EvolucionUsuario from "./EvolucionUsuario";

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function Navbar() {
  const router = useRouter();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  // Datos básicos del perfil para mostrar la fase evolutiva
  const [perfil, setPerfil] = useState<{
    full_name?: string | null;
    phone?: string | null;
    linkedin_url?: string | null;
    avatar_url?: string | null;
    cv_url?: string | null;
  } | null>(null);
  const [cvsEnviados, setCvsEnviados] = useState(0);
  const [tieneCv, setTieneCv] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: p }, { count: enviados }] = await Promise.all([
        supabase.from("profiles").select("full_name,phone,linkedin_url,avatar_url,cv_url").eq("id", user.id).single(),
        supabase.from("cv_sends").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      if (p) setPerfil(p);
      setCvsEnviados(enviados ?? 0);
      setTieneCv(!!(p?.cv_url));
    };
    cargar();
  }, []);

  const handleCerrarSesion = async () => {
    setCerrando(true);
    try {
      await getSupabaseBrowser().auth.signOut();
      router.push("/auth/login");
    } catch {
      router.push("/auth/login");
    } finally {
      setCerrando(false);
    }
  };

  const evolucionProps = {
    tieneFoto:      !!(perfil?.avatar_url),
    tieneNombre:    !!(perfil?.full_name),
    tieneTelefono:  !!(perfil?.phone),
    tieneLinkedin:  !!(perfil?.linkedin_url),
    tieneCv,
    cvsEnviados,
    compact: true,
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "rgba(10, 10, 10, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "#00ff8820",
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* ── Logotipo ──────────────────────────────────────────── */}
          <Link href="/app" className="flex items-center gap-2 group">
            <LogoGusano size={36} animated />
            <span
              className="font-bold text-lg tracking-wide group-hover:opacity-80 transition"
              style={{ color: "#00ff88" }}
            >
              BuscayCurra
            </span>
          </Link>

          {/* ── Navegación principal (escritorio) ─────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "/app",          label: "Inicio"   },
              { href: "/app/buscar",   label: "Buscar"   },
              { href: "/app/curriculum", label: "CV"     },
              { href: "/app/envios",   label: "Envíos"   },
              { href: "/app/empresas", label: "Empresas" },
              { href: "/app/perfil",   label: "Mi Cuenta"},
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-2 rounded-lg text-sm font-medium transition"
                style={{ color: "#a0a0a0" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#00ff88";
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#00ff8812";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#a0a0a0";
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* ── Acciones de usuario (escritorio) ──────────────────── */}
          <div className="hidden md:flex items-center gap-3">
            {/* Fase evolutiva compacta */}
            {perfil !== null && (
              <EvolucionUsuario {...evolucionProps} />
            )}

            {/* Botón cerrar sesión */}
            <button
              onClick={handleCerrarSesion}
              disabled={cerrando}
              className="px-4 py-2 text-sm font-medium rounded-lg border transition disabled:opacity-50"
              style={{ color: "#a0a0a0", borderColor: "#333" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#f0f0f0";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#00ff88";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#a0a0a0";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#333";
              }}
            >
              {cerrando ? "Cerrando..." : "Cerrar sesión"}
            </button>
          </div>

          {/* ── Botón menú móvil ───────────────────────────────────── */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="md:hidden p-2 rounded-lg transition"
            style={{ color: "#a0a0a0" }}
            aria-label="Abrir menú"
          >
            {menuAbierto ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

        </div>
      </div>

      {/* ── Menú móvil (desplegable) ─────────────────────────────── */}
      {menuAbierto && (
        <div
          className="md:hidden border-t px-4 py-3 space-y-1"
          style={{ borderColor: "#00ff8820", backgroundColor: "#0a0a0a" }}
        >
          {[
            { href: "/app",            label: "🏠 Inicio"         },
            { href: "/app/buscar",     label: "🔍 Buscar ofertas" },
            { href: "/app/curriculum", label: "📄 Mejorar CV"     },
            { href: "/app/envios",     label: "📧 Envíos"         },
            { href: "/app/empresas",   label: "🏢 Empresas"       },
            { href: "/app/perfil",     label: "👤 Mi Cuenta"      },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition"
              style={{ color: "#a0a0a0" }}
              onClick={() => setMenuAbierto(false)}
            >
              {label}
            </Link>
          ))}

          {/* Fase evolutiva en móvil */}
          {perfil !== null && (
            <div className="px-3 py-2">
              <EvolucionUsuario {...evolucionProps} />
            </div>
          )}

          <div className="border-t my-2" style={{ borderColor: "#00ff8820" }} />
          <button
            onClick={handleCerrarSesion}
            disabled={cerrando}
            className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
            style={{ color: "#ff4444" }}
          >
            🚪 {cerrando ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </div>
      )}
    </nav>
  );
}
