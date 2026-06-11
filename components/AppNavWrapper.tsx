"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import GuzziAvatar from "@/components/GuzziAvatar";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import NotificationBell from "@/components/NotificationBell";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { PAISES, LISTA_PAISES } from "@/lib/paises";
import { IDIOMAS, type IdiomaCode } from "@/lib/i18n/translations";
import { useLanguage } from "@/components/LanguageProvider";
import {
  Search, FileText, TrendingUp, Mic, Globe, Users,
  CircleDollarSign, Bookmark, Star, Building2, Gift,
  CircleHelp, Layers, BarChart2, LogOut,
  type LucideIcon,
} from "lucide-react";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  animClass: string;
  title: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/app/buscar",          label: "Buscar",      Icon: Search,           animClass: "nav-icon-search", title: "Buscar ofertas" },
  { href: "/app/curriculum",      label: "Mi CV",       Icon: FileText,         animClass: "nav-icon-lift",   title: "Mi currículum" },
  { href: "/app/pipeline",        label: "Pipeline",    Icon: TrendingUp,       animClass: "nav-icon-lift",   title: "Pipeline de candidaturas" },
  { href: "/app/entrevistas",     label: "Entrevistas", Icon: Mic,              animClass: "nav-icon-pulse",  title: "Simulador de entrevistas" },
  { href: "/app/emigrar",         label: "Emigrar",     Icon: Globe,            animClass: "nav-icon-spin",   title: "Guía para emigrar" },
  { href: "/app/au-pair",         label: "Au Pair",     Icon: Users,            animClass: "nav-icon-lift",   title: "Perfil y ofertas Au Pair" },
  { href: "/app/salarios",        label: "Salarios",    Icon: CircleDollarSign, animClass: "nav-icon-lift",   title: "Comparador de salarios" },
  { href: "/app/guardados",       label: "Guardados",   Icon: Bookmark,         animClass: "nav-icon-bounce", title: "Ofertas guardadas" },
  { href: "/app/reviews",         label: "Reviews",     Icon: Star,             animClass: "nav-icon-bounce", title: "Reviews de empresas" },
  { href: "/app/empresas",        label: "Empresas",    Icon: Building2,        animClass: "nav-icon-lift",   title: "Enviar CV a empresas" },
  { href: "/app/referidos",       label: "Invitar",     Icon: Gift,             animClass: "nav-icon-bounce", title: "Invitar amigos" },
  { href: "/app/ayuda",           label: "Ayuda",       Icon: CircleHelp,       animClass: "nav-icon-lift",   title: "Centro de ayuda" },
  { href: "/app/perfil?tab=plan", label: "Mi Plan",     Icon: Layers,           animClass: "nav-icon-lift",   title: "Mi plan y cuenta" },
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

  if (!pathname.startsWith("/app")) return null;

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all"
        style={{
          background: scrolled ? "rgba(15,17,23,0.98)" : "rgba(15,17,23,0.95)",
          borderBottom: "1px solid rgba(45,49,66,0.5)",
          backdropFilter: "blur(16px)",
          height: "56px",
        }}
      >
        <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/app/gusi" className="flex items-center gap-2.5">
            <GuzziAvatar size={28} />
            <span className="font-bold text-sm hidden sm:inline" style={{ color: "#22c55e" }}>
              BuscayCurra
            </span>
          </Link>

          {/* Campana de notificaciones */}
          <NotificationBell userId={userId} />

          {/* Avatar de perfil */}
          <Link
            href="/app/perfil"
            className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-opacity hover:opacity-80"
            style={{ background: "rgba(34,197,94,0.15)", border: "1.5px solid rgba(34,197,94,0.4)", color: "#22c55e" }}
            title="Mi perfil"
          >
            {userInicial || "?"}
          </Link>

          {/* Botón menú hamburguesa */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "#64748b" }}
            aria-label="Menú"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="3" y1="5" x2="17" y2="5" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="15" x2="17" y2="15" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Overlay del menú */}
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

            {/* Región e idioma */}
            <div className="mb-2">
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 mb-1.5" style={{ color: "#64748b" }}>
                <Globe size={11} strokeWidth={1.5} />
                <span>{navLabel("region_idioma") || "Región e idioma"}</span>
              </p>
              <div className="flex gap-2">
                <select
                  value={paisSeleccionado}
                  onChange={(e) => cambiarPais(e.target.value)}
                  className="flex-1 w-full px-2.5 py-2 rounded-lg text-xs appearance-none cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}
                >
                  {LISTA_PAISES.map((p) => (
                    <option key={p.codigo} value={p.codigo} style={{ background: "#1e212b" }}>
                      {p.bandera} {p.nombre} ({p.simboloMoneda})
                    </option>
                  ))}
                </select>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as IdiomaCode)}
                  className="flex-1 w-full px-2.5 py-2 rounded-lg text-xs appearance-none cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}
                >
                  {IDIOMAS.map((idioma) => (
                    <option key={idioma.code} value={idioma.code} style={{ background: "#1e212b" }}>
                      {idioma.flag} {idioma.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ height: "1px", background: "#2d3142", margin: "8px 0" }} />

            {/* Guzzi — primer ítem especial */}
            <Link
              href="/app/gusi"
              onClick={() => setMobileOpen(false)}
              className={`nav-link-item${pathname === "/app/gusi" || pathname.startsWith("/app/gusi/") ? " nav-active" : ""}`}
            >
              <GuzziAvatar size={20} />
              <span>{navLabel("Guzzi") || "Guzzi"}</span>
            </Link>

            {/* Resto de ítems */}
            {NAV_ITEMS.map((item) => {
              const activo =
                pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(item.href.split("?")[0] + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`nav-link-item${activo ? " nav-active" : ""}`}
                  title={item.title}
                >
                  <item.Icon
                    className={`nav-icon ${item.animClass}`}
                    size={18}
                    strokeWidth={1.6}
                  />
                  <span>{navLabel(item.label) || item.label}</span>
                </Link>
              );
            })}

            {/* Admin (solo si corresponde) */}
            {esAdmin && (
              <Link
                href="/app/admin"
                onClick={() => setMobileOpen(false)}
                className={`nav-link-item${pathname === "/app/admin" ? " nav-active" : ""}`}
                style={{ color: pathname === "/app/admin" ? "#f59e0b" : "#94a3b8" }}
              >
                <BarChart2 className="nav-icon nav-icon-lift" size={18} strokeWidth={1.6} />
                <span>Admin</span>
              </Link>
            )}

            <div style={{ height: "1px", background: "#2d3142", margin: "4px 0" }} />

            {/* Cerrar sesión */}
            <button
              onClick={() => { setMobileOpen(false); cerrarSesion(); }}
              className="nav-link-item w-full"
              style={{ color: "#ef4444" }}
            >
              <LogOut className="nav-icon nav-icon-lift" size={18} strokeWidth={1.6} />
              <span>Cerrar sesión</span>
            </button>

          </div>
        </div>
      )}
    </>
  );
}
