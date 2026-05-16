"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import NotificationBell from "@/components/NotificationBell";

const ADMIN_EMAIL = "michelbatistagonzalez1992@gmail.com";

const NAV_ITEMS = [
  { href: "/app/gusi",       label: "Guzzi",      icon: "🐛", title: "Guzzi - Asistente IA" },
  { href: "/app/buscar",     label: "Buscar",     icon: "🔍", title: "Buscar ofertas" },
  { href: "/app/curriculum", label: "Mi CV",      icon: "📄", title: "Mi currículum" },
  { href: "/app/guardados",  label: "Guardados",  icon: "❤️", title: "Ofertas guardadas" },
  { href: "/app/pipeline",   label: "Pipeline",   icon: "📊", title: "Pipeline de candidaturas" },
  { href: "/app/salarios",   label: "Salarios",   icon: "💰", title: "Comparador de salarios" },
  { href: "/app/reviews",    label: "Reviews",    icon: "⭐", title: "Reviews de empresas" },
  { href: "/app/envios",     label: "Envíos",     icon: "📧", title: "Envíos de CV" },
  { href: "/app/referidos",  label: "Invitar",    icon: "🎁", title: "Invitar amigos" },
  { href: "/app/perfil",     label: "Cuenta",     icon: "👤", title: "Mi cuenta y planes" },
];

export default function AppNavWrapper() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [userId, setUserId] = useState("");

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
            <span className="text-xl">🐛</span>
            <span className="font-bold text-sm hidden sm:inline" style={{ color: "#22c55e" }}>
              BuscayCurra
            </span>
          </Link>

          {/* Campana de notificaciones */}
          {userId && <NotificationBell userId={userId} />}

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
            className="absolute top-14 left-4 right-4 rounded-xl p-3"
            style={{ background: "#1e212b", border: "1px solid #2d3142" }}
            onClick={(e) => e.stopPropagation()}
          >
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
                  <span>{item.label}</span>
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
