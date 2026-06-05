"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import NotificationBell from "@/components/NotificationBell";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { PAISES, LISTA_PAISES } from "@/lib/paises";
import { IDIOMAS, type IdiomaCode } from "@/lib/i18n/translations";
import { useLanguage } from "@/components/LanguageProvider";

const navItems = [
  { href: "/app", label: "Inicio", icon: "🏠" },
  { href: "/app/curriculum", label: "CV", icon: "📄" },
  { href: "/app/buscar", label: "Buscar", icon: "🔍" },
  { href: "/app/envios", label: "Envíos", icon: "📧" },
  { href: "/app/entrevistas", label: "Entrevistas", icon: "🎙️" },
  { href: "/app/emigrar", label: "Emigrar", icon: "🌍" },
  { href: "/app/au-pair", label: "Au Pair", icon: "👶" },
  { href: "/app/perfil", label: "Perfil", icon: "👤" },
  { href: "/precios", label: "Pro", icon: "⭐" },
  { href: "/app/empresas", label: "Empresas", icon: "🏢" },
];

export default function AppNavWrapper() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [userId, setUserId] = useState("");
  const [userInicial, setUserInicial] = useState("");
  const [paisSeleccionado, setPaisSeleccionado] = useState("ES");
  const { lang, t, setLang } = useLanguage();
  const navLabel = (key: string) => t(key);

  // Cargar país guardado
  useEffect(() => {
    const saved = localStorage.getItem("bc_pais");
    if (saved) setPaisSeleccionado(saved);
  }, []);

  function cambiarPais(codigo: string) {
    setPaisSeleccionado(codigo);
    localStorage.setItem("bc_pais", codigo);
  }

  async function cerrarSesion() {
    await getSupabaseBrowser().auth.signOut();
    router.push("/auth/login");
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    getSupabaseBrowser().auth.getUser().then(({ data: { user } }) => {
      setEsAdmin(user?.email === ADMIN_EMAIL);
      if (user?.id) setUserId(user.id);
      if (user?.email) setUserInicial(user.email[0].toUpperCase());
    });
  }, []);

  // Solo mostrar nav en rutas /app/*
  if (!pathname.startsWith("/app")) return null;

  return (
    <nav
      className="glass-warm fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out"
      style={{
        borderBottom: "1px solid rgba(126,213,111,0.1)",
        transform: visible ? "translateY(0)" : "translateY(-100%)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/app" className="flex items-center gap-2">
          <span className="text-xl">🐛</span>
          <span className="font-bold text-sm hidden sm:inline" style={{ color: "#7ed56f" }}>
            BuscayCurra
          </span>
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <NotificacionesBell />
          {navItems.map((item) => {
            const activo =
              pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition"
                style={
                  item.href === "/precios"
                    ? {
                        background: activo ? "rgba(240,192,64,0.2)" : "rgba(240,192,64,0.1)",
                        color: "#f0c040",
                        border: "1px solid rgba(240,192,64,0.4)",
                        fontWeight: 700,
                      }
                    : {
                        background: activo ? "rgba(126,213,111,0.12)" : "transparent",
                        color: activo ? "#7ed56f" : "#706a58",
                        border: activo ? "1px solid rgba(126,213,111,0.2)" : "1px solid transparent",
                      }
                }
              >
                <span className="text-sm">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Menu overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-14 left-4 right-4 rounded-xl p-3 overflow-y-auto"
            style={{ background: "#1e212b", border: "1px solid #2d3142", maxHeight: "calc(100vh - 80px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 🌍 Región e idioma */}
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-[#64748b] px-2 mb-1.5">
                🌍 Región e idioma
              </p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <select
                    value={paisSeleccionado}
                    onChange={(e) => cambiarPais(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg text-xs appearance-none cursor-pointer"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#e2e8f0",
                    }}
                  >
                    {LISTA_PAISES.map((p) => (
                      <option key={p.codigo} value={p.codigo} style={{ background: "#1e212b" }}>
                        {p.bandera} {p.nombre} ({p.simboloMoneda})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <select
                    value={lang}
                    onChange={(e) => {
                      const code = e.target.value as IdiomaCode;
                      setLang(code);
                    }}
                    className="w-full px-2.5 py-2 rounded-lg text-xs appearance-none cursor-pointer"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#e2e8f0",
                    }}
                  >
                    {IDIOMAS.map((idioma) => (
                      <option key={idioma.code} value={idioma.code} style={{ background: "#1e212b" }}>
                        {idioma.flag} {idioma.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ height: "1px", background: "#2d3142", margin: "8px 0" }} />

            {NAV_ITEMS.map((item) => {
              const activo =
                pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition"
                  style={{
                    background: activo ? "rgba(34,197,94,0.08)" : "transparent",
                    color: activo ? "#22c55e" : "#94a3b8",
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{navLabel(item.label)}</span>
                </Link>
              );
            })}
            {esAdmin && (
              <Link href="/app/admin" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition"
                style={{ background: pathname === "/app/admin" ? "rgba(245,158,11,0.08)" : "transparent", color: "#f59e0b" }}>
                <span className="text-lg">📊</span>
                <span>Admin</span>
              </Link>
            )}
            <div style={{ height: "1px", background: "#2d3142", margin: "4px 0" }} />
            <button
              onClick={() => { setMobileOpen(false); cerrarSesion(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition"
              style={{ color: "#ef4444" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
