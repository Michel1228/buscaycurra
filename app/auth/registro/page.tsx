"use client";

/**
 * app/auth/registro/page.tsx — Página de registro de nueva cuenta
 *
 * Formulario con nombre, email, contraseña y confirmación de contraseña.
 * Usa getSupabaseBrowser().auth.signUp() para crear la cuenta del usuario.
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";


// ─── Componente Principal ─────────────────────────────────────────────────────

export default function RegistroPage() {
  // Estado del formulario
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [registrado, setRegistrado] = useState(false);
  const [error, setError] = useState("");

  /**
   * Valida los campos del formulario antes de enviar.
   * Devuelve un mensaje de error o cadena vacía si todo es correcto.
   */
  const validar = (): string => {
    if (!nombre.trim()) {
      return "El nombre es obligatorio.";
    }
    if (contrasena.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres.";
    }
    if (contrasena !== confirmarContrasena) {
      return "Las contraseñas no coinciden.";
    }
    return "";
  };

  /**
   * Maneja el envío del formulario de registro.
   * Crea la cuenta en Supabase y muestra mensaje de confirmación.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validar antes de enviar
    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    setCargando(true);
    try {
      // Crear cuenta en Supabase con metadatos del usuario
      const { error: supabaseError } = await getSupabaseBrowser().auth.signUp({
        email: email.trim(),
        password: contrasena,
        options: {
          // Guardar el nombre completo en los metadatos del usuario
          data: {
            full_name: nombre.trim(),
          },
        },
      });

      if (supabaseError) {
        // Traducir mensajes de error al español
        if (supabaseError.message.includes("already registered")) {
          setError("Este email ya está registrado. ¿Quizás quieres iniciar sesión?");
        } else if (supabaseError.message.includes("weak password")) {
          setError("La contraseña es demasiado débil. Usa al menos 8 caracteres con letras y números.");
        } else {
          setError("No se pudo crear la cuenta. Por favor, inténtalo de nuevo.");
        }
        return;
      }

      // Cuenta creada: mostrar mensaje de confirmación por email
      setRegistrado(true);
    } catch {
      setError("Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">

        {/* ── Logotipo y título ──────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white text-2xl font-bold mb-4"
            style={{ backgroundColor: "#2563EB" }}
          >
            B
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">
            Empieza a enviar tu CV automáticamente
          </p>
        </div>

        {/* ── Tarjeta del formulario ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* Mensaje de éxito: cuenta creada, pendiente de confirmar email */}
          {registrado ? (
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full text-white text-2xl mb-4"
                style={{ backgroundColor: "#2563EB" }}
              >
                ✓
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">¡Cuenta creada!</h2>
              <p className="text-gray-600 text-sm mb-6">
                Hemos enviado un email de confirmación a <strong>{email}</strong>.
                Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
              </p>
              <Link
                href="/auth/login"
                className="text-sm font-medium"
                style={{ color: "#2563EB" }}
              >
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            // Formulario de registro
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Campo: nombre completo */}
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Nombre completo
                </label>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  autoComplete="name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Campo: contraseña */}
              <div>
                <label
                  htmlFor="contrasena"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Contraseña
                </label>
                <input
                  id="contrasena"
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Campo: confirmar contraseña */}
              <div>
                <label
                  htmlFor="confirmar"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Confirmar contraseña
                </label>
                <input
                  id="confirmar"
                  type="password"
                  value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                  autoComplete="new-password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {/* Indicador de coincidencia */}
                {confirmarContrasena.length > 0 && (
                  <p className={`text-xs mt-1 ${contrasena === confirmarContrasena ? "text-green-600" : "text-red-500"}`}>
                    {contrasena === confirmarContrasena
                      ? "✓ Las contraseñas coinciden"
                      : "Las contraseñas no coinciden"}
                  </p>
                )}
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Botón de crear cuenta */}
              <button
                type="submit"
                disabled={cargando}
                className="w-full text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#2563EB" }}
              >
                {cargando ? "Creando cuenta..." : "Crear cuenta"}
              </button>

            </form>
          )}
        </div>

        {/* ── Enlace al login ────────────────────────────────────────── */}
        {!registrado && (
          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/auth/login"
              className="font-semibold hover:underline"
              style={{ color: "#2563EB" }}
            >
              Inicia sesión
            </Link>
          </p>
        )}

      </div>
    </div>
  );
}
