"use client";

/**
 * app/auth/recuperar/page.tsx — Página "Olvidé mi contraseña"
 *
 * Permite al usuario solicitar un email de recuperación de contraseña.
 * Llama a Supabase para enviar el enlace de restablecimiento.
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";


// ─── Componente Principal ─────────────────────────────────────────────────────

export default function RecuperarPage() {
  // Estado del formulario
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  /**
   * Maneja el envío del formulario de recuperación.
   * Llama a Supabase para enviar el email con el enlace de recuperación.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      // Llamada a Supabase: enviar email de recuperación
      const { error: supabaseError } = await getSupabaseBrowser().auth.resetPasswordForEmail(
        email.trim(),
        {
          // URL a la que redirigirá el enlace del email
          redirectTo: `${window.location.origin}/auth/nueva-contrasena`,
        }
      );

      if (supabaseError) {
        setError("No hemos podido enviar el email. Comprueba que el email es correcto.");
        return;
      }

      // Email enviado con éxito
      setEnviado(true);
    } catch {
      setError("Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* ── Logotipo y título ──────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white text-2xl font-bold mb-4"
            style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}
          >
            B
          </div>
          <h1 className="text-2xl font-bold text-[#f0ebe0]">¿Olvidaste tu contraseña?</h1>
          <p className="text-[#706a58] text-sm mt-1">
            Te enviaremos un enlace para que puedas recuperar tu cuenta
          </p>
        </div>

        {/* ── Tarjeta del formulario ─────────────────────────────────── */}
        <div className="card-game p-8">

          {/* Mensaje de éxito tras enviar el email */}
          {enviado ? (
            <div className="text-center">
              {/* Icono de éxito */}
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full text-white text-2xl mb-4"
                style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}
              >
                ✓
              </div>
              {/* Mensaje principal */}
              <h2 className="text-lg font-semibold text-[#f0ebe0] mb-2">Email enviado</h2>
              <p className="text-gray-600 text-sm mb-6">
                Te hemos enviado un email con el enlace para recuperar tu cuenta.
                Revisa también la carpeta de spam.
              </p>
              {/* Enlace de vuelta al login */}
              <Link
                href="/auth/login"
                className="text-sm font-medium"
                style={{ color: "#7ed56f" }}
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            // Formulario de recuperación
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Campo email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#b0a890] mb-1.5"
                >
                  Tu email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full border border-[#3d3c30] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  style={{ "--tw-ring-color": "#2563EB" } as React.CSSProperties}
                />
              </div>

              {/* Mensaje de error si ocurre algún problema */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={cargando || !email.trim()}
                className="w-full text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}
              >
                {cargando ? "Enviando..." : "Enviar email de recuperación"}
              </button>

              {/* Enlace de vuelta al login */}
              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm"
                  style={{ color: "#7ed56f" }}
                >
                  ← Volver al inicio de sesión
                </Link>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
