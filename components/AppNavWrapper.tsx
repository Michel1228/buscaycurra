"use client";

/**
 * AppNavWrapper — Nav que se oculta/muestra al hacer scroll
 * Solo visible en rutas /app/*
 * Scroll down → se esconde suavemente
 * Scroll up → aparece suavemente
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const navItems = [
  { href: "/app", label: "Inicio", icon: "🏠" },
  { href: "/app/curriculum", label: "CV", icon: "📄" },
  { href: "/app/buscar", label: "Buscar", icon: "🔍" },
  { href: "/app/envios", label: "Envíos", icon: "📧" },
  { href: "/app/perfil", label: "Perfil", icon: "👤" },
  { href: "/precios", label: "Pro", icon: "⭐" },
  { href: "/empresas/publicar", label: "Empresas", icon: "🏢" },
];

export default function AppNavWrapper() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      // Mostrar si scrollea hacia arriba o está cerca del top
      if (currentY < 60 || currentY < lastScrollY.current - 5) {
        setVisible(true);
      }
      // Ocultar si scrollea hacia abajo más de 5px
      else if (currentY > lastScrollY.current + 5) {
        setVisible(false);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Solo mostrar en /app y /app/*
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
          {navItems.map((item) => {
            const activo =
              pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition"
                style={{
                  background: activo ? "rgba(126,213,111,0.12)" : "transparent",
                  color: activo ? "#7ed56f" : "#706a58",
                  border: activo ? "1px solid rgba(126,213,111,0.2)" : "1px solid transparent",
                }}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
