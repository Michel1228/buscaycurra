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

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

const NAV_ITEMS = [
  { href: "/app/gusi",       label: "Guzzi",      icon: "guzzi", title: "Guzzi - Asistente IA" },
  { href: "/app/buscar",     label: "Buscar",     icon: "buscar", title: "Buscar ofertas" },
  { href: "/app/curriculum", label: "Mi CV",      icon: "cv", title: "Mi currículum" },
  { href: "/app/pipeline",   label: "Pipeline",   icon: "pipeline", title: "Pipeline de candidaturas" },
  { href: "/app/entrevistas",label: "Entrevistas",icon: "entrevistas", title: "Simulador de entrevistas" },
  { href: "/app/emigrar",    label: "Emigrar",    icon: "emigrar", title: "Guía para emigrar" },
  { href: "/app/au-pair",    label: "Au Pair",    icon: "aupair", title: "Perfil y ofertas Au Pair" },
  { href: "/app/au-pair?modo=live_in_nanny", label: "Live-in Nanny", icon: "liveinnanny", title: "Perfil y ofertas Live-in Nanny" },
  { href: "/app/salarios",   label: "Salarios",   icon: "salarios", title: "Comparador de salarios" },
  { href: "/app/guardados",  label: "Guardados",  icon: "guardados", title: "Ofertas guardadas" },
  { href: "/app/reviews",    label: "Reviews",    icon: "reviews", title: "Reviews de empresas" },
  { href: "/app/empresas",   label: "Empresas",   icon: "empresas", title: "Enviar CV a empresas" },
  { href: "/app/referidos",  label: "Invitar",    icon: "referidos", title: "Invitar amigos" },
  { href: "/app/ayuda",      label: "Ayuda",      icon: "ayuda", title: "Centro de ayuda" },
  { href: "/app/perfil?tab=plan",     label: "Mi Plan",    icon: "plan", title: "Mi plan y cuenta" },
];

/** Iconos SVG premium con color — paleta BuscayCurra */
const ICON_COLORS: Record<string, string> = {
  buscar: "#22c55e",
  cv: "#f59e0b",
  pipeline: "#3b82f6", 
  entrevistas: "#a855f7",
  emigrar: "#06b6d4",
  aupair: "#ec4899",
  liveinnanny: "#f97316",
  salarios: "#f59e0b",
  guardados: "#22c55e",
  reviews: "#fbbf24",
  empresas: "#3b82f6",
  referidos: "#a855f7",
  ayuda: "#94a3b8",
  plan: "#22c55e",
};

function NavIcon({ name, size = 22 }: { name: string; size?: number }) {
  const s = size;
  const color = ICON_COLORS[name] || "#22c55e";
  const glow = name !== "ayuda" ? { filter: `drop-shadow(0 0 6px ${color}40)` } : {};
  
  const base = {
    width: s, height: s, viewBox: "0 0 24 24",
    fill: "none", stroke: color, strokeWidth: "1.8",
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    style: { ...glow, transition: "transform 0.2s ease" },
    className: "nav-icon",
  };

  switch (name) {
    case "buscar":
      return <svg {...base}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
    case "cv":
      return <svg {...base}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
    case "pipeline":
      return <svg {...base}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;
    case "entrevistas":
      return <svg {...base}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
    case "emigrar":
      return <svg {...base}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
    case "aupair":
      return <svg {...base}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "salarios":
      return <svg {...base}><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>;
    case "guardados":
      return <svg {...base}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
    case "reviews":
      return <svg {...base} fill={color + "20"}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "empresas":
      return <svg {...base}><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></svg>;
    case "referidos":
      return <svg {...base}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
    case "liveinnanny":
      return <svg {...base}><path d="M12 4a4 4 0 0 1 4 4v1h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2V8a4 4 0 0 1 4-4z"/><circle cx="10" cy="12" r="1.5"/><circle cx="14" cy="12" r="1.5"/><path d="M9 15c.83 1 1.83 1.5 3 1.5s2.17-.5 3-1.5"/></svg>;
    case "ayuda":
      return <svg {...base} style={{...glow, transition: "transform 0.2s ease"}}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "plan":
      return <svg {...base}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
    default:
      return <svg {...base}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>;
  }
}

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

  // FIX: Forzar scroll al top al montar — evita que la nav quede oculta en móviles
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Cargar país guardado
  useEffect(() => {
    const saved = localStorage.getItem("bc_pais");
    if (saved) setPaisSeleccionado(saved);
  }, []);

  function cambiarPais(codigo: string) {
    setPaisSeleccionado(codigo);
    localStorage.setItem("bc_pais", codigo);
    // Auto-ajustar idioma al del país seleccionado
    const idiomaPais = PAISES[codigo]?.idioma;
    if (idiomaPais && IDIOMAS.some(i => i.code === idiomaPais)) {
      setLang(idiomaPais as IdiomaCode);
    }
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
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setEsAdmin(user.email === ADMIN_EMAIL);
      setUserId(user.id);

      // Intentar sacar inicial del nombre real del perfil, no del email
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile?.full_name) {
        setUserInicial(profile.full_name.trim()[0].toUpperCase());
      } else if (user.user_metadata?.full_name) {
        setUserInicial(user.user_metadata.full_name.trim()[0].toUpperCase());
      } else if (user.email) {
        setUserInicial(user.email[0].toUpperCase());
      }
    });
  }, []);

  // Solo mostrar nav en rutas /app/*
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
            {userInicial || (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            )}
          </Link>

          {/* Botón de menú — visible en todos los tamaños */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-lg"
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
            {/* Región e idioma */}
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-[#64748b] px-2 mb-1.5 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Región e idioma
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
                  {item.href === "/app/gusi" ? (
                    <GuzziAvatar size={22} />
                  ) : (
                    <NavIcon name={item.icon} size={22} />
                  )}
                  <span>{navLabel(item.label)}</span>
                </Link>
              );
            })}
            {esAdmin && (
              <Link href="/app/admin" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition"
                style={{ background: pathname === "/app/admin" ? "rgba(245,158,11,0.08)" : "transparent", color: "#f59e0b" }}>
                <NavIcon name="reviews" size={22} />
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
