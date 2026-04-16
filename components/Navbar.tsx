"use client";

/**
 * components/Navbar.tsx — Barra de navegación principal de BuscayCurra
 *
 * Muestra el logo, los enlaces de navegación principales,
 * el enlace a "Mi Cuenta" y el botón de cerrar sesión.
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function Navbar() {
  const router = useRouter();

  // Estado para el menú móvil (abierto/cerrado)
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  /**
   * Cierra la sesión del usuario y redirige al login.
   */
  const handleCerrarSesion = async () => {
    setCerrando(true);
    try {
      await getSupabaseBrowser().auth.signOut();
      router.push("/auth/login");
    } catch {
      // Si hay error al cerrar sesión, redirigir igualmente
      router.push("/auth/login");
    } finally {
      setCerrando(false);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* ── Logotipo ───────────────────────────────────────────── */}
          <Link href="/app/envios" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: "#2563EB" }}
            >
              B
            </div>
            <span className="font-bold text-gray-900">BuscayCurra</span>
          </Link>

          {/* ── Navegación principal (escritorio) ─────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/app"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              🏠 Inicio
            </Link>
            <Link
              href="/app/buscar"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              🔍 Buscar
            </Link>
            <Link
              href="/app/curriculum"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              📄 CV
            </Link>
            <Link
              href="/app/envios"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              📧 Envíos
            </Link>
            <Link
              href="/app/empresas"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              🏢 Empresas
            </Link>
            <Link
              href="/app/perfil"
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              👤 Mi Cuenta
            </Link>
          </div>

          {/* ── Acciones de usuario (escritorio) ──────────────────── */}
          <div className="hidden md:flex items-center gap-2">
            {/* Botón cerrar sesión */}
            <button
              onClick={handleCerrarSesion}
              disabled={cerrando}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              {cerrando ? "Cerrando..." : "Cerrar sesión"}
            </button>
          </div>

          {/* ── Botón menú móvil ───────────────────────────────────── */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            aria-label="Abrir menú"
          >
            {menuAbierto ? (
              // Icono X para cerrar
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Icono hamburguesa
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

        </div>
      </div>

      {/* ── Menú móvil (desplegable) ─────────────────────────────── */}
      {menuAbierto && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
          <Link
            href="/app"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            onClick={() => setMenuAbierto(false)}
          >
            🏠 Inicio
          </Link>
          <Link
            href="/app/buscar"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            onClick={() => setMenuAbierto(false)}
          >
            🔍 Buscar ofertas
          </Link>
          <Link
            href="/app/curriculum"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            onClick={() => setMenuAbierto(false)}
          >
            📄 Mejorar CV
          </Link>
          <Link
            href="/app/envios"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            onClick={() => setMenuAbierto(false)}
          >
            📧 Envíos
          </Link>
          <Link
            href="/app/empresas"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            onClick={() => setMenuAbierto(false)}
          >
            🏢 Empresas
          </Link>
          <Link
            href="/app/perfil"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            onClick={() => setMenuAbierto(false)}
          >
            👤 Mi Cuenta
          </Link>
          {/* Separador */}
          <div className="border-t border-gray-200 my-2" />
          {/* Botón cerrar sesión en móvil */}
          <button
            onClick={handleCerrarSesion}
            disabled={cerrando}
            className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
          >
            🚪 {cerrando ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </div>
      )}

    </nav>
  );
}
