"use client";

/**
 * app/auth/nueva-contrasena/page.tsx — Página para establecer una nueva contraseña
 *
 * El usuario llega aquí desde el email de recuperación enviado por Supabase.
 * Supabase gestiona automáticamente el token en la URL.
 * Valida que las dos contraseñas coincidan y tienen mínimo 8 caracteres.
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";


// ─── Componente Principal ─────────────────────────────────────────────────────

export default function NuevaContrasenaPage() {
  const router = useRouter();

  // Estado del formulario
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");

  // Supabase detecta el token de recuperación en la URL automáticamente
  // al inicializar el cliente, por eso no necesitamos procesarlo manualmente.
  useEffect(() => {
    // Verificar que hay una sesión activa (el token de Supabase es válido)
    const comprobarSesion = async () => {
      const { data } = await getSupabaseBrowser().auth.getSession();
      if (!data.session) {
        // Si no hay sesión, el enlace puede haber expirado
        setError("El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.");
      }
    };
    void comprobarSesion();
  }, []);

  /**
   * Valida los campos del formulario.
   * Devuelve un mensaje de error o cadena vacía si todo es correcto.
   */
  const validar = (): string => {
    if (nuevaContrasena.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres.";
    }
    if (nuevaContrasena !== confirmarContrasena) {
      return "Las contraseñas no coinciden.";
    }
    return "";
  };

  /**
   * Maneja el envío del formulario.
   * Actualiza la contraseña en Supabase y redirige al dashboard.
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
      // Actualizar contraseña en Supabase
      const { error: supabaseError } = await getSupabaseBrowser().auth.updateUser({
        password: nuevaContrasena,
      });

      if (supabaseError) {
        setError("No se pudo cambiar la contraseña. El enlace puede haber expirado.");
        return;
      }

      // Contraseña cambiada correctamente
      setExito(true);

      // Redirigir al dashboard tras 2 segundos
      setTimeout(() => {
        router.push("/app/envios");
      }, 2000);
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
          <h1 className="text-2xl font-bold text-[#f0ebe0]">Nueva contraseña</h1>
          <p className="text-[#706a58] text-sm mt-1">
            Elige una contraseña segura para tu cuenta
          </p>
        </div>

        {/* ── Tarjeta del formulario ─────────────────────────────────── */}
        <div className="card-game p-8">

          {/* Mensaje de éxito tras cambiar la contraseña */}
          {exito ? (
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full text-white text-2xl mb-4"
                style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}
              >
                ✓
              </div>
              <h2 className="text-lg font-semibold text-[#f0ebe0] mb-2">
                ¡Contraseña actualizada!
              </h2>
              <p className="text-[#706a58] text-sm">Redirigiendo al panel de control...</p>
            </div>
          ) : (
            // Formulario para nueva contraseña
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Mensaje de error (enlace expirado, etc.) */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {error}
                  {error.includes("expirado") && (
                    <div className="mt-2">
                      <Link
                        href="/auth/recuperar"
                        className="font-medium underline"
                        style={{ color: "#7ed56f" }}
                      >
                        Solicitar nuevo enlace
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Campo: nueva contraseña */}
              <div>
                <label
                  htmlFor="nueva"
                  className="block text-sm font-medium text-[#b0a890] mb-1.5"
                >
                  Nueva contraseña
                </label>
                <input
                  id="nueva"
                  type="password"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  className="w-full border border-[#3d3c30] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {/* Indicador de longitud */}
                {nuevaContrasena.length > 0 && (
                  <p className={`text-xs mt-1 ${nuevaContrasena.length >= 8 ? "text-green-600" : "text-red-500"}`}>
                    {nuevaContrasena.length >= 8
                      ? "✓ Longitud correcta"
                      : `Faltan ${8 - nuevaContrasena.length} caracteres`}
                  </p>
                )}
              </div>

              {/* Campo: confirmar contraseña */}
              <div>
                <label
                  htmlFor="confirmar"
                  className="block text-sm font-medium text-[#b0a890] mb-1.5"
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
                  className="w-full border border-[#3d3c30] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {/* Indicador de coincidencia */}
                {confirmarContrasena.length > 0 && (
                  <p className={`text-xs mt-1 ${nuevaContrasena === confirmarContrasena ? "text-green-600" : "text-red-500"}`}>
                    {nuevaContrasena === confirmarContrasena
                      ? "✓ Las contraseñas coinciden"
                      : "Las contraseñas no coinciden"}
                  </p>
                )}
              </div>

              {/* Botón de guardar */}
              <button
                type="submit"
                disabled={cargando || !nuevaContrasena || !confirmarContrasena}
                className="w-full text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}
              >
                {cargando ? "Guardando..." : "Guardar nueva contraseña"}
              </button>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
