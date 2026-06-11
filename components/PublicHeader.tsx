"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, LogIn, Sparkles } from "lucide-react";
import LogoGusano from "@/components/LogoGusano";

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(15,17,23,0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(45,49,66,0.4)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <LogoGusano size={28} />
          <span className="font-bold text-sm tracking-tight" style={{ color: "#22c55e" }}>
            BuscayCurra
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          <Link
            href="/empresas"
            className="text-sm font-medium transition hover:opacity-80"
            style={{ color: "#64748b" }}
          >
            Para empresas
          </Link>
          <Link
            href="/auth/login"
            className="text-sm font-medium transition hover:opacity-80"
            style={{ color: "#94a3b8" }}
          >
            Entrar
          </Link>
          <Link
            href="/auth/registro"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
            }}
          >
            Empezar gratis
          </Link>
        </div>

        {/* Mobile: hamburger + CTA */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/auth/registro"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
            }}
          >
            Empezar gratis
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center w-9 h-9 rounded-lg"
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
                href="/empresas"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm transition"
                style={{ color: "#94a3b8" }}
              >
                <Building2 size={14} strokeWidth={1.8} className="inline mr-1.5" />Para empresas
              </Link>
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm transition"
                style={{ color: "#94a3b8" }}
              >
                <LogIn size={14} strokeWidth={1.8} className="inline mr-1.5" />Entrar
              </Link>
              <div style={{ height: "1px", background: "#2d3142", margin: "4px 0" }} />
              <Link
                href="/auth/registro"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm font-semibold transition"
                style={{ color: "#22c55e" }}
              >
                <Sparkles size={14} strokeWidth={1.8} className="inline mr-1.5" />Crear cuenta gratis
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
