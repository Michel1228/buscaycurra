"use client";

/**
 * app/app/perfil/page.tsx — Página completa de gestión de cuenta de usuario
 *
 * Organizada en tres pestañas:
 *   - "Mi Perfil":       Editar nombre, teléfono, ciudad y sector. Avatar con iniciales.
 *   - "Seguridad":       Cambiar contraseña y limpiar historial de envíos.
 *   - "Zona de peligro": Borrar cuenta permanentemente (requiere escribir "BORRAR").
 *
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import PerfilForm, { type DatosPerfil } from "@/components/PerfilForm";
import CVUploader from "@/components/CVUploader";


// ─── Tipos ────────────────────────────────────────────────────────────────────

type TabId = "perfil" | "cv" | "seguridad" | "peligro";

interface Tab {
  id: TabId;
  label: string;
  emoji: string;
}

// ─── Pestañas disponibles ────────────────────────────────────────────────────

const TABS: Tab[] = [
  { id: "perfil", label: "Mi Perfil", emoji: "👤" },
  { id: "cv", label: "Mi CV", emoji: "📄" },
  { id: "seguridad", label: "Seguridad", emoji: "🔒" },
  { id: "peligro", label: "Zona de peligro", emoji: "⚠️" },
];

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function PerfilPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado de la sesión y el perfil del usuario
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [datosPerfil, setDatosPerfil] = useState<Partial<DatosPerfil>>({});
  const [cargando, setCargando] = useState(true);

  // Pestaña activa — lee ?tab= de la URL si se especifica
  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && ["perfil", "cv", "seguridad", "peligro"].includes(tabParam)
      ? tabParam
      : "perfil"
  );

  /**
   * Carga los datos de la sesión y el perfil del usuario al montar el componente.
   */
  const cargarDatos = useCallback(async () => {
    try {
      // Obtener sesión activa de Supabase
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();

      if (!session) {
        // Si no hay sesión, redirigir al login
        router.push("/auth/login");
        return;
      }

      setUserId(session.user.id);
      setToken(session.access_token);
      setEmail(session.user.email ?? "");

      // Cargar perfil desde la tabla profiles
      const { data: perfil } = await getSupabaseBrowser()
        .from("profiles")
        .select("full_name, phone, city, sector")
        .eq("id", session.user.id)
        .single();

      if (perfil) {
        setDatosPerfil({
          nombre: perfil.full_name ?? "",
          telefono: perfil.phone ?? "",
          ciudad: perfil.city ?? "",
          sector: perfil.sector ?? "",
        });
      }
    } catch {
      // Error silencioso al cargar datos
    } finally {
      setCargando(false);
    }
  }, [router]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  // Mostrar spinner mientras se cargan los datos
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div
          className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent"
          style={{ borderColor: "#2563EB", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  // Si no hay usuario autenticado (redirigiendo)
  if (!userId) return null;

  /**
   * Genera las iniciales del nombre para el avatar.
   * Ejemplo: "Juan García" → "JG"
   */
  const obtenerIniciales = (): string => {
    const nombre = datosPerfil.nombre ?? email;
    const partes = nombre.trim().split(" ").filter(Boolean);
    if (partes.length === 0) return "?";
    if (partes.length === 1) return partes[0][0].toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Cabecera con avatar y nombre ──────────────────────────── */}
      <div
        className="text-white py-10 px-4"
        style={{ background: "linear-gradient(135deg, #2563EB, #1d4ed8)" }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-5">
          {/* Avatar con iniciales */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: "#F97316" }}
          >
            {obtenerIniciales()}
          </div>
          {/* Información del usuario */}
          <div>
            <h1 className="text-xl font-bold">
              {datosPerfil.nombre || "Mi cuenta"}
            </h1>
            <p className="text-blue-200 text-sm">{email}</p>
            {datosPerfil.sector && (
              <p className="text-blue-100 text-xs mt-0.5">{datosPerfil.sector}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Navegación por pestañas ───────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4">
          <nav className="flex" aria-label="Secciones del perfil">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                <span>{tab.emoji}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Contenido de la pestaña activa ───────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Pestaña: Mi Perfil */}
        {activeTab === "perfil" && (
          <TabPerfil
            userId={userId}
            datosIniciales={datosPerfil}
            onGuardado={(datos) => setDatosPerfil(datos)}
          />
        )}

        {/* Pestaña: Mi CV */}
        {activeTab === "cv" && <TabCV />}

        {/* Pestaña: Seguridad */}
        {activeTab === "seguridad" && (
          <TabSeguridad token={token} />
        )}

        {/* Pestaña: Zona de peligro */}
        {activeTab === "peligro" && (
          <TabPeligro token={token} />
        )}

      </main>
    </div>
  );
}

// ─── Pestaña: Mi Perfil ───────────────────────────────────────────────────────

/**
 * Pestaña de edición del perfil del usuario.
 * Muestra el formulario PerfilForm con los datos actuales.
 */
function TabPerfil({
  userId,
  datosIniciales,
  onGuardado,
}: {
  userId: string;
  datosIniciales: Partial<DatosPerfil>;
  onGuardado: (datos: DatosPerfil) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Información personal</h2>
        <p className="text-sm text-gray-500">
          Esta información se usa para personalizar tu carta de presentación
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <PerfilForm
          userId={userId}
          datosIniciales={datosIniciales}
          onGuardado={onGuardado}
        />
      </div>
    </div>
  );
}

// ─── Pestaña: Mi CV ───────────────────────────────────────────────────────────

function TabCV() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Mi currículum</h2>
        <p className="text-sm text-gray-500">
          Tu CV en PDF se adjuntará automáticamente a cada candidatura que envíes
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <CVUploader />
      </div>
    </div>
  );
}

// ─── Pestaña: Seguridad ───────────────────────────────────────────────────────

/**
 * Pestaña de seguridad con cambio de contraseña y limpieza de historial.
 */
function TabSeguridad({ token }: { token: string | null }) {
  // Estado: cambio de contraseña
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [guardandoContrasena, setGuardandoContrasena] = useState(false);
  const [exitoContrasena, setExitoContrasena] = useState(false);
  const [errorContrasena, setErrorContrasena] = useState("");

  // Estado: limpiar historial
  const [limpiando, setLimpiando] = useState(false);
  const [confirmarLimpiar, setConfirmarLimpiar] = useState(false);
  const [resultadoLimpiar, setResultadoLimpiar] = useState("");
  const [errorLimpiar, setErrorLimpiar] = useState("");

  /**
   * Cambia la contraseña del usuario en Supabase.
   * Primero verifica la contraseña actual, luego actualiza.
   */
  const handleCambiarContrasena = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorContrasena("");
    setExitoContrasena(false);

    // Validaciones básicas
    if (nuevaContrasena.length < 8) {
      setErrorContrasena("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (nuevaContrasena !== confirmarContrasena) {
      setErrorContrasena("Las contraseñas nuevas no coinciden.");
      return;
    }

    setGuardandoContrasena(true);
    try {
      // Verificar la contraseña actual haciendo un sign-in
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      const emailUsuario = session?.user.email;

      if (!emailUsuario) {
        setErrorContrasena("No se pudo verificar tu sesión. Por favor, recarga la página.");
        return;
      }

      // Verificar contraseña actual con signInWithPassword
      const { error: errorVerif } = await getSupabaseBrowser().auth.signInWithPassword({
        email: emailUsuario,
        password: contrasenaActual,
      });

      if (errorVerif) {
        setErrorContrasena("La contraseña actual no es correcta.");
        return;
      }

      // Actualizar la contraseña en Supabase
      const { error: errorUpdate } = await getSupabaseBrowser().auth.updateUser({
        password: nuevaContrasena,
      });

      if (errorUpdate) {
        setErrorContrasena("No se pudo cambiar la contraseña. Por favor, inténtalo de nuevo.");
        return;
      }

      // Éxito: limpiar campos y mostrar mensaje
      setExitoContrasena(true);
      setContrasenaActual("");
      setNuevaContrasena("");
      setConfirmarContrasena("");
      setTimeout(() => setExitoContrasena(false), 4000);
    } catch {
      setErrorContrasena("Ha ocurrido un error inesperado.");
    } finally {
      setGuardandoContrasena(false);
    }
  };

  /**
   * Llama a la API para limpiar el historial de CVs enviados.
   * Solo borra registros con status completado o fallido.
   */
  const handleLimpiarHistorial = async () => {
    if (!token) return;
    setLimpiando(true);
    setErrorLimpiar("");
    setResultadoLimpiar("");

    try {
      const response = await fetch("/api/cuenta/limpiar-historial", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json() as { success?: boolean; mensaje?: string; error?: string };

      if (!response.ok || data.error) {
        setErrorLimpiar(data.error ?? "Error al limpiar el historial.");
        return;
      }

      setResultadoLimpiar(data.mensaje ?? "Historial limpiado correctamente.");
      setConfirmarLimpiar(false);
    } catch {
      setErrorLimpiar("Error de red. Por favor, inténtalo de nuevo.");
    } finally {
      setLimpiando(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* ── Sección: Gestionar suscripción ───────────────────────── */}
      <SuscripcionSection token={token} />

      {/* ── Sección: Cambiar contraseña ──────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Cambiar contraseña</h2>
        <p className="text-sm text-gray-500 mb-4">
          Elige una contraseña segura que no uses en otros sitios
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleCambiarContrasena} className="space-y-4">

            {/* Contraseña actual */}
            <div>
              <label htmlFor="actual" className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña actual
              </label>
              <input
                id="actual"
                type="password"
                value={contrasenaActual}
                onChange={(e) => setContrasenaActual(e.target.value)}
                placeholder="Tu contraseña actual"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Nueva contraseña */}
            <div>
              <label htmlFor="nueva" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Confirmar nueva contraseña */}
            <div>
              <label htmlFor="confirmar" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmar nueva contraseña
              </label>
              <input
                id="confirmar"
                type="password"
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                placeholder="Repite la nueva contraseña"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Mensajes de error/éxito */}
            {errorContrasena && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {errorContrasena}
              </div>
            )}
            {exitoContrasena && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
                ✓ Contraseña actualizada correctamente.
              </div>
            )}

            {/* Botón guardar */}
            <button
              type="submit"
              disabled={guardandoContrasena}
              className="w-full text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              style={{ backgroundColor: "#2563EB" }}
            >
              {guardandoContrasena ? "Guardando..." : "Cambiar contraseña"}
            </button>

          </form>
        </div>
      </div>

      {/* ── Sección: Limpiar historial de envíos ─────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Historial de envíos</h2>
        <p className="text-sm text-gray-500 mb-4">
          Elimina del historial los CVs que ya han sido enviados o han fallado
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Información sobre qué se borra */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm text-orange-800 mb-5">
            <p className="font-medium mb-1">ℹ️ ¿Qué se borra?</p>
            <ul className="list-disc list-inside space-y-0.5 text-orange-700">
              <li>CVs enviados correctamente ✓</li>
              <li>CVs que fallaron al enviarse ✗</li>
              <li>CVs cancelados</li>
            </ul>
            <p className="mt-2 font-medium">Los CVs pendientes de envío NO se borran.</p>
          </div>

          {/* Mensaje de resultado */}
          {resultadoLimpiar && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 mb-4">
              ✓ {resultadoLimpiar}
            </div>
          )}
          {errorLimpiar && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">
              {errorLimpiar}
            </div>
          )}

          {/* Confirmación antes de limpiar */}
          {confirmarLimpiar ? (
            <div className="border border-orange-300 rounded-lg p-4 bg-orange-50">
              <p className="text-sm text-orange-800 font-medium mb-3">
                ¿Estás seguro? Se borrarán todos los CVs enviados del historial.
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleLimpiarHistorial}
                  disabled={limpiando}
                  className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition disabled:opacity-50"
                  style={{ backgroundColor: "#F97316" }}
                >
                  {limpiando ? "Limpiando..." : "Sí, limpiar historial"}
                </button>
                <button
                  onClick={() => setConfirmarLimpiar(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmarLimpiar(true)}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition"
              style={{ backgroundColor: "#F97316" }}
            >
              🧹 Limpiar historial
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Sección: Gestionar suscripción ──────────────────────────────────────────

/**
 * Muestra el plan actual y un botón que abre el Customer Portal de Stripe,
 * donde el usuario puede actualizar método de pago, ver facturas y cancelar.
 */
function SuscripcionSection({ token }: { token: string | null }) {
  const [plan, setPlan] = useState<string>("free");
  const [estado, setEstado] = useState<string>("inactive");
  const [cargando, setCargando] = useState(true);
  const [abriendo, setAbriendo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const { data: { user } } = await getSupabaseBrowser().auth.getUser();
        if (!user) return;
        const { data } = await getSupabaseBrowser()
          .from("profiles")
          .select("plan, subscription_status")
          .eq("id", user.id)
          .single();
        if (data) {
          setPlan((data.plan as string) ?? "free");
          setEstado((data.subscription_status as string) ?? "inactive");
        }
      } finally {
        setCargando(false);
      }
    }
    void cargar();
  }, []);

  const handleAbrirPortal = async () => {
    if (!token) return;
    setAbriendo(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "No se pudo abrir el portal.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setAbriendo(false);
    }
  };

  if (cargando) return null;

  const esPlanPago = plan === "pro" || plan === "empresa";

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Mi suscripción</h2>
      <p className="text-sm text-gray-500 mb-4">
        Gestiona tu plan, método de pago y facturas
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Plan actual */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Plan actual</p>
            <p className="text-xl font-bold text-gray-900 capitalize">{plan}</p>
          </div>
          {estado === "past_due" && (
            <span className="text-xs font-medium bg-red-100 text-red-700 px-3 py-1 rounded-full">
              ⚠️ Pago pendiente
            </span>
          )}
          {estado === "active" && (
            <span className="text-xs font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full">
              ✓ Activa
            </span>
          )}
          {estado === "canceled" && (
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              Cancelada
            </span>
          )}
        </div>

        {estado === "past_due" && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 mb-4">
            Hemos tenido problemas cobrando la última factura. Actualiza tu
            método de pago desde el portal antes de que se cancele la
            suscripción.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {esPlanPago ? (
          <button
            onClick={handleAbrirPortal}
            disabled={abriendo}
            className="w-full py-3 text-sm font-semibold text-white rounded-lg transition disabled:opacity-50"
            style={{ backgroundColor: "#2563EB" }}
          >
            {abriendo ? "Abriendo portal..." : "🧾 Gestionar suscripción y facturas"}
          </button>
        ) : (
          <a
            href="/precios"
            className="block w-full text-center py-3 text-sm font-semibold text-white rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: "#F97316" }}
          >
            🚀 Ver planes disponibles
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Pestaña: Zona de Peligro ─────────────────────────────────────────────────

/**
 * Pestaña de zona de peligro con la opción de borrar la cuenta permanentemente.
 * El usuario debe escribir "BORRAR" exactamente para confirmar la acción.
 */
function TabPeligro({ token }: { token: string | null }) {
  const router = useRouter();

  // Estado del proceso de borrado de cuenta
  const [textoConfirmacion, setTextoConfirmacion] = useState("");
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState("");

  // La palabra exacta que el usuario debe escribir para confirmar
  const PALABRA_CONFIRMACION = "BORRAR";

  // El botón solo se activa si el usuario escribe exactamente "BORRAR"
  const confirmacionCorrecta = textoConfirmacion === PALABRA_CONFIRMACION;

  /**
   * Borra la cuenta del usuario permanentemente.
   * Llama a la API que elimina todos los datos y el usuario de Supabase Auth.
   */
  const handleBorrarCuenta = async () => {
    if (!confirmacionCorrecta || !token) return;

    setBorrando(true);
    setError("");

    try {
      const response = await fetch("/api/cuenta/borrar", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json() as { success?: boolean; mensaje?: string; error?: string };

      if (!response.ok || data.error) {
        setError(data.error ?? "No se pudo eliminar la cuenta. Por favor, contacta con soporte.");
        return;
      }

      // Cuenta eliminada: cerrar sesión local y redirigir a la landing con mensaje de despedida
      await getSupabaseBrowser().auth.signOut();
      router.push("/?despedida=1");
    } catch {
      setError("Error de red. Por favor, inténtalo de nuevo.");
    } finally {
      setBorrando(false);
    }
  };

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Zona de peligro</h2>
        <p className="text-sm text-gray-500">
          Acciones irreversibles. Procede con mucho cuidado.
        </p>
      </div>

      {/* ── Sección de borrado de cuenta (fondo rojo claro) ──────── */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">

        {/* Encabezado con icono de advertencia */}
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold text-red-900 text-base">Borrar mi cuenta</h3>
            <p className="text-red-700 text-sm mt-1">
              Esta acción es <strong>IRREVERSIBLE</strong>. Se borrarán todos tus datos,
              CVs enviados, historial y tu cuenta de acceso. No podrás recuperar nada.
            </p>
          </div>
        </div>

        {/* Lista de lo que se borra */}
        <div className="bg-red-100 border border-red-200 rounded-lg px-4 py-3 mb-5">
          <p className="text-sm font-medium text-red-900 mb-2">Se borrará permanentemente:</p>
          <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
            <li>Tu perfil y datos personales</li>
            <li>Todo el historial de envíos de CV</li>
            <li>Tu cuenta de acceso (email y contraseña)</li>
            <li>Cualquier dato asociado a tu cuenta</li>
          </ul>
        </div>

        {/* Campo de confirmación */}
        <div className="mb-4">
          <label htmlFor="confirmar-borrar" className="block text-sm font-medium text-red-800 mb-1.5">
            Para confirmar, escribe{" "}
            <code className="bg-red-200 px-1.5 py-0.5 rounded font-mono text-red-900">
              {PALABRA_CONFIRMACION}
            </code>{" "}
            en el campo de abajo:
          </label>
          <input
            id="confirmar-borrar"
            type="text"
            value={textoConfirmacion}
            onChange={(e) => setTextoConfirmacion(e.target.value)}
            placeholder={`Escribe "${PALABRA_CONFIRMACION}" para confirmar`}
            className="w-full border border-red-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          />
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-100 border border-red-300 rounded-lg px-4 py-3 text-sm text-red-800 mb-4">
            {error}
          </div>
        )}

        {/* Botón de borrado (solo activo con confirmación correcta) */}
        <button
          onClick={handleBorrarCuenta}
          disabled={!confirmacionCorrecta || borrando}
          className="w-full py-3 text-sm font-bold text-white rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: confirmacionCorrecta ? "#dc2626" : "#9ca3af" }}
        >
          {borrando
            ? "Eliminando cuenta..."
            : "🗑️ Eliminar cuenta permanentemente"}
        </button>

        {/* Indicador de si la confirmación es correcta */}
        {textoConfirmacion.length > 0 && (
          <p className={`text-xs mt-2 text-center ${confirmacionCorrecta ? "text-red-700" : "text-red-400"}`}>
            {confirmacionCorrecta
              ? "✓ Confirmación correcta — el botón ya está activo"
              : `Debes escribir exactamente "${PALABRA_CONFIRMACION}"`}
          </p>
        )}

      </div>

    </div>
  );
}
