"use client";

/**
 * app/auth/nueva-contrasena/page.tsx — Página para establecer una nueva contraseña
 *
 * El usuario llega aquí desde el email de recuperación enviado por Supabase.
 * El enlace trae ?token_hash=... (ver /api/auth/recuperar) y se verifica al guardar.
 * Valida que las dos contraseñas coincidan y tienen mínimo 8 caracteres.
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { pedirBienvenida } from "@/lib/onboarding/pedir-bienvenida";


// ─── Componente Principal ─────────────────────────────────────────────────────

export default function NuevaContrasenaPage() {
  const router = useRouter();

  // Estado del formulario
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");
  const [pedirOtro, setPedirOtro] = useState(false);
  // El enlace de nuestro correo (/api/auth/recuperar) trae ?token_hash=...: se
  // verifica al guardar y vale en CUALQUIER navegador. Antes el enlace era el de
  // Supabase, que solo funcionaba en el navegador donde se pidió: abierto desde
  // Gmail en el móvil decía "no es válido" (auditoría del 3 oct 2026).
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const verificadoRef = useRef(false);

  useEffect(() => {
    const enlaceCaducado = () => {
      setError("Este enlace ya se ha usado o ha caducado (dura una hora). Pide uno nuevo y ábrelo en cuanto te llegue.");
      setPedirOtro(true);
    };
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("error") || hash.get("error_code")) { enlaceCaducado(); return; }
    const th = query.get("token_hash");
    if (th && query.get("type") === "recovery") { setTokenHash(th); return; }

    // Enlaces antiguos de Supabase (?code=...): el cliente los canjea solo si se
    // abren en el mismo navegador. Si no hay sesión, no se puede cambiar nada.
    const comprobarSesion = async () => {
      const { data } = await getSupabaseBrowser().auth.getSession();
      if (!data.session) enlaceCaducado();
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
      const supabase = getSupabaseBrowser();
      // Primero el enlace (una sola vez: si luego falla la contraseña, se
      // reintenta sin volver a gastarlo).
      if (tokenHash && !verificadoRef.current) {
        const { error: errorEnlace } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (errorEnlace) {
          setError("Este enlace ya se ha usado o ha caducado (dura una hora). Pide uno nuevo y ábrelo en cuanto te llegue.");
          setPedirOtro(true);
          return;
        }
        verificadoRef.current = true;
      }

      const { error: supabaseError } = await supabase.auth.updateUser({
        password: nuevaContrasena,
      });

      if (supabaseError) {
        const codigo = (supabaseError as { code?: string }).code;
        setError(
          codigo === "same_password" ? "Esa es la contraseña que ya tienes. Elige una distinta."
          : codigo === "weak_password" ? "Esa contraseña es demasiado fácil. Mezcla letras, números y algún símbolo."
          : "No se pudo cambiar la contraseña. Inténtalo otra vez en un momento."
        );
        return;
      }

      // Contraseña cambiada correctamente. El enlace ya no sirve: fuera de la barra.
      window.history.replaceState(null, "", "/auth/nueva-contrasena");
      // Quien nunca confirmó su cuenta (el enlace la confirma) tampoco tuvo la
      // bienvenida: ficha, ciudad y alerta. Se pide aquí; el servidor la hace
      // una sola vez por cuenta.
      pedirBienvenida((await supabase.auth.getSession()).data.session?.access_token);
      setExito(true);

      // Redirigir al dashboard tras 2 segundos
      setTimeout(() => {
        router.push("/app/gusi");
      }, 4000);
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
          <h1 className="text-2xl font-bold text-[#f1f5f9]">Nueva contraseña</h1>
          <p className="text-[#94a3b8] text-sm mt-1">
            Elige una contraseña segura para tu cuenta
          </p>
        </div>

        {/* ── Tarjeta del formulario ─────────────────────────────────── */}
        <div className="card-game p-8">

          {/* Mensaje de éxito tras cambiar la contraseña */}
          {exito ? (
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full text-white mb-4"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#ffffff" }}
              >
                <Check size={28} strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-semibold text-[#f1f5f9] mb-2">
                ¡Contraseña actualizada!
              </h2>
              <p className="text-[#94a3b8] text-sm">Te llevamos a BuscayCurra... Si usas la app, entra en ella con tu correo y la contraseña nueva.</p>
            </div>
          ) : (
            // Formulario para nueva contraseña
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Mensaje de error (enlace expirado, etc.) */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {error}
                  {pedirOtro && (
                    <div className="mt-2">
                      <Link
                        href="/auth/recuperar"
                        className="font-medium underline"
                        style={{ color: "#22c55e" }}
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
                  className="block text-sm font-medium text-[#94a3b8] mb-1.5"
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
                      ? "Longitud correcta"
                      : `Faltan ${8 - nuevaContrasena.length} caracteres`}
                  </p>
                )}
              </div>

              {/* Campo: confirmar contraseña */}
              <div>
                <label
                  htmlFor="confirmar"
                  className="block text-sm font-medium text-[#94a3b8] mb-1.5"
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
                      ? "Las contraseñas coinciden"
                      : "Las contraseñas no coinciden"}
                  </p>
                )}
              </div>

              {/* Botón de guardar */}
              <button
                type="submit"
                disabled={cargando || !nuevaContrasena || !confirmarContrasena}
                className="w-full text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#ffffff" }}
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
