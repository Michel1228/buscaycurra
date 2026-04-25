"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/app/gusi",   label: "Guzzi",     icon: "🐛" },
  { href: "/app/buscar", label: "Buscar",     icon: "🔍" },
  { href: "/app/envios", label: "Envíos",     icon: "📧" },
  { href: "/app/perfil", label: "Mi cuenta",  icon: "👤" },
];

export default function AppNavWrapper() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Solo mostrar nav en rutas /app/*
  if (!pathname.startsWith("/app")) return null;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all"
      style={{
        background: scrolled ? "rgba(15,26,10,0.97)" : "rgba(15,26,10,0.90)",
        borderBottom: "1px solid rgba(126,213,111,0.1)",
        backdropFilter: "blur(12px)",
        height: "56px",
      }}
    >
      <div className="h-full max-w-5xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/app/gusi" className="flex items-center gap-2">
          <span className="text-xl">🐛</span>
          <span className="font-bold text-sm hidden sm:inline" style={{ color: "#7ed56f" }}>
            BuscayCurra
          </span>
        </Link>

        {/* Nav items */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const activo =
              pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition"
                style={{
                  background: activo ? "rgba(126,213,111,0.12)" : "transparent",
                  color: activo ? "#7ed56f" : "#706a58",
                  border: activo ? "1px solid rgba(126,213,111,0.2)" : "1px solid transparent",
                }}
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
