"use client";

/**
 * app/auth/recuperar/page.tsx — Página "Olvidé mi contraseña"
 *
 * Permite al usuario solicitar un email de recuperación de contraseña.
 * Llama a Supabase para enviar el enlace de restablecimiento.
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";


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
      // El correo lo mandamos nosotros (ver /api/auth/recuperar): el de
      // Supabase salía en inglés y su enlace no funcionaba abierto desde Gmail.
      const res = await fetch("/api/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const datos = await res.json().catch(() => ({})) as { error?: string };
        setError(datos.error || "No hemos podido enviar el email. Inténtalo de nuevo en unos minutos.");
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
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#ffffff" }}
          >
            B
          </div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">¿Olvidaste tu contraseña?</h1>
          <p className="text-[#94a3b8] text-sm mt-1">
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
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#ffffff" }}
              >
                <Check size={28} strokeWidth={2.5} />
              </div>
              {/* Mensaje principal */}
              <h2 className="text-lg font-semibold text-[#f1f5f9] mb-2">Mira tu correo</h2>
              <p className="text-[#94a3b8] text-sm mb-3">
                Si hay una cuenta con <strong className="text-[#f1f5f9] break-all">{email.trim()}</strong>, en un minuto
                te llega un correo de BuscayCurra con el asunto «Cambia tu contraseña de BuscayCurra».
              </p>
              <p className="text-[#94a3b8] text-sm mb-6">
                Mira también en spam y en promociones. Si no llega, comprueba que es el mismo correo con el que te registraste.
              </p>
              {/* Enlace de vuelta al login */}
              <Link
                href="/auth/login"
                className="text-sm font-medium"
                style={{ color: "#22c55e" }}
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
                  className="block text-sm font-medium text-[#94a3b8] mb-1.5"
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
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#ffffff" }}
              >
                {cargando ? "Enviando..." : "Enviar email de recuperación"}
              </button>

              {/* Enlace de vuelta al login */}
              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm"
                  style={{ color: "#22c55e" }}
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
