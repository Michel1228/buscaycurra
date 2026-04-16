"use client";

/**
 * app/auth/login/page.tsx — Página de inicio de sesión
 *
 * Formulario de login con email y contraseña.
 * Incluye enlace a "¿Olvidaste tu contraseña?" y a la página de registro.
 * Usa supabase.auth.signInWithPassword() para autenticar al usuario.
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Cliente de Supabase ──────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();

  // Estado del formulario
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  /**
   * Maneja el inicio de sesión con email y contraseña.
   * Redirige al panel de control si el login es exitoso.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      // Autenticar con Supabase
      const { error: supabaseError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: contrasena,
      });

      if (supabaseError) {
        // Traducir mensajes de error al español
        if (supabaseError.message.includes("Invalid login credentials")) {
          setError("Email o contraseña incorrectos. Comprueba tus datos e inténtalo de nuevo.");
        } else if (supabaseError.message.includes("Email not confirmed")) {
          setError("Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.");
        } else {
          setError("No se pudo iniciar sesión. Por favor, inténtalo de nuevo.");
        }
        return;
      }

      // Login exitoso — redirigir al panel principal
      router.push("/app/envios");
    } catch {
      setError("Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">

        {/* ── Logotipo y título ──────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white text-2xl font-bold mb-4"
            style={{ backgroundColor: "#2563EB" }}
          >
            B
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>
          <p className="text-gray-500 text-sm mt-1">
            Bienvenido de nuevo a BuscayCurra
          </p>
        </div>

        {/* ── Tarjeta del formulario ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Campo: email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
              />
            </div>

            {/* Campo: contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="contrasena"
                  className="block text-sm font-medium text-gray-700"
                >
                  Contraseña
                </label>
                {/* Enlace a recuperación de contraseña */}
                <Link
                  href="/auth/recuperar"
                  className="text-xs font-medium hover:underline"
                  style={{ color: "#2563EB" }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                id="contrasena"
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Tu contraseña"
                required
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
              />
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Botón de inicio de sesión */}
            <button
              type="submit"
              disabled={cargando || !email.trim() || !contrasena}
              className="w-full text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#2563EB" }}
            >
              {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>

          </form>
        </div>

        {/* ── Enlace a registro ──────────────────────────────────────── */}
        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{" "}
          <Link
            href="/auth/registro"
            className="font-semibold hover:underline"
            style={{ color: "#F97316" }}
          >
            Regístrate gratis
          </Link>
        </p>

      </div>
    </div>
  );
}
