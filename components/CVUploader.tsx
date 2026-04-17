/**
 * components/CVUploader.tsx — Componente para subir, ver y gestionar el CV en PDF
 *
 * Funcionalidades:
 *   - Zona de drag & drop para arrastrar el PDF
 *   - Validación: solo PDF, máximo 5MB
 *   - Barra de progreso durante la subida
 *   - Vista cuando ya hay CV: nombre, botones de Ver, Actualizar y Eliminar
 *
 * Usa las APIs:
 *   - POST /api/cv/subir       → subir o actualizar el CV
 *   - GET  /api/cv/obtener    → obtener la URL del CV actual
 *   - GET  /api/cv/descargar  → descargar el PDF directamente al dispositivo
 *   - DELETE /api/cv/borrar   → eliminar el CV
 *
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

"use client";

import { useState, useEffect, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Tamaño máximo permitido: 5 MB */
const TAMANIO_MAXIMO = 5 * 1024 * 1024;

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface EstadoCV {
  /** URL firmada para previsualizar el CV */
  url: string | null;
  /** Indica si se está cargando la información */
  cargando: boolean;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function CVUploader() {
  // ─── Estado del CV ──────────────────────────────────────────────
  const [estadoCV, setEstadoCV] = useState<EstadoCV>({
    url: null,
    cargando: true,
  });

  // ─── Estado de subida ────────────────────────────────────────────
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string>("");
  const [exito, setExito] = useState<string>("");

  // ─── Estado de drag & drop ───────────────────────────────────────
  const [arrastrandoEncima, setArrastrandoEncima] = useState(false);

  // ─── Estado de confirmación de borrado ───────────────────────────
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  // ─── Estado de descarga del CV ───────────────────────────────────
  const [descargando, setDescargando] = useState(false);

  // ─── Referencia al input de archivo ─────────────────────────────
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Obtiene el token de autenticación del usuario actual.
   */
  const obtenerToken = async (): Promise<string | null> => {
    const { data: { session } } = await getSupabaseBrowser().auth.getSession();
    return session?.access_token ?? null;
  };

  /**
   * Carga la URL del CV actual desde la API.
   */
  const cargarCV = useCallback(async () => {
    setEstadoCV((prev) => ({ ...prev, cargando: true }));

    try {
      const token = await obtenerToken();
      if (!token) {
        setEstadoCV({ url: null, cargando: false });
        return;
      }

      const response = await fetch("/api/cv/obtener", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json() as { cvUrl?: string | null; error?: string };
      setEstadoCV({ url: data.cvUrl ?? null, cargando: false });
    } catch {
      setEstadoCV({ url: null, cargando: false });
    }
  }, []);

  // Cargar el CV al montar el componente
  useEffect(() => {
    void cargarCV();
  }, [cargarCV]);

  /**
   * Valida el archivo antes de subirlo.
   * Retorna un mensaje de error o null si es válido.
   */
  const validarArchivo = (archivo: File): string | null => {
    if (archivo.type !== "application/pdf") {
      return "Solo se aceptan archivos PDF. Por favor, selecciona un archivo .pdf";
    }
    if (archivo.size > TAMANIO_MAXIMO) {
      return "El archivo supera el límite de 5 MB. Por favor, comprime el PDF.";
    }
    return null;
  };

  /**
   * Sube el archivo a la API con simulación de progreso.
   */
  const subirArchivo = async (archivo: File) => {
    setError("");
    setExito("");

    // Validar el archivo antes de subir
    const mensajeError = validarArchivo(archivo);
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    const token = await obtenerToken();
    if (!token) {
      setError("No estás autenticado. Por favor, recarga la página.");
      return;
    }

    setSubiendo(true);
    setProgreso(10);

    try {
      // Construir el FormData con el archivo
      const formData = new FormData();
      formData.append("cv", archivo);

      // Simular progreso visual antes de recibir respuesta
      const intervalo = setInterval(() => {
        setProgreso((prev) => Math.min(prev + 15, 85));
      }, 300);

      const response = await fetch("/api/cv/subir", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      clearInterval(intervalo);
      setProgreso(100);

      const data = await response.json() as {
        url?: string;
        mensaje?: string;
        error?: string;
      };

      if (!response.ok || data.error) {
        setError(data.error ?? "No se pudo subir el CV. Por favor, inténtalo de nuevo.");
        return;
      }

      // CV subido correctamente: actualizar estado
      setExito(data.mensaje ?? "CV subido correctamente ✓");
      setTimeout(() => setExito(""), 4000);

      // Recargar la URL del CV
      await cargarCV();
    } catch {
      setError("Error de red. Por favor, comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setSubiendo(false);
      setTimeout(() => setProgreso(0), 800);
    }
  };

  /**
   * Maneja la selección de archivo desde el input.
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) void subirArchivo(archivo);
    // Limpiar el input para poder volver a seleccionar el mismo archivo
    e.target.value = "";
  };

  /**
   * Maneja el evento de soltar archivo en la zona de drop.
   */
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setArrastrandoEncima(false);

    const archivo = e.dataTransfer.files?.[0];
    if (archivo) void subirArchivo(archivo);
  };

  /**
   * Descarga el CV del usuario directamente al dispositivo.
   * Llama a GET /api/cv/descargar que devuelve el PDF con cabeceras de descarga.
   */
  const handleDescargarCV = async () => {
    const token = await obtenerToken();
    if (!token) {
      setError("No estás autenticado. Por favor, recarga la página.");
      return;
    }

    setDescargando(true);
    setError("");

    try {
      // Llamar a la API de descarga con autenticación
      const response = await fetch("/api/cv/descargar", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const datos = await response.json() as { error?: string };
        setError(datos.error ?? "No se pudo descargar el CV. Por favor, inténtalo de nuevo.");
        return;
      }

      // Convertir la respuesta a Blob y crear un enlace de descarga temporal
      const blob = await response.blob();
      const urlDescarga = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = urlDescarga;
      enlace.download = "CV_BuscayCurra.pdf";
      document.body.appendChild(enlace);
      enlace.click();

      // Limpiar el enlace y la URL temporal tras la descarga
      document.body.removeChild(enlace);
      URL.revokeObjectURL(urlDescarga);
    } catch {
      setError("Error de red al intentar descargar el CV.");
    } finally {
      setDescargando(false);
    }
  };

  /**
   * Borra el CV del usuario tras confirmación.
   */
  const handleBorrarCV = async () => {
    const token = await obtenerToken();
    if (!token) return;

    setBorrando(true);
    setError("");

    try {
      const response = await fetch("/api/cv/borrar", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json() as { success?: boolean; error?: string };

      if (!response.ok || data.error) {
        setError(data.error ?? "No se pudo eliminar el CV.");
        return;
      }

      // CV borrado correctamente
      setEstadoCV({ url: null, cargando: false });
      setConfirmarBorrar(false);
      setExito("CV eliminado correctamente ✓");
      setTimeout(() => setExito(""), 3000);
    } catch {
      setError("Error de red al intentar eliminar el CV.");
    } finally {
      setBorrando(false);
    }
  };

  // ─── Renderizado ──────────────────────────────────────────────────────────

  // Cargando el estado inicial
  if (estadoCV.cargando) {
    return (
      <div className="flex items-center justify-center py-10">
        <div
          className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent"
          style={{ borderColor: "#7ed56f", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Mensajes de éxito ────────────────────────────────────────── */}
      {exito && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(126,213,111,0.1)", border: "1px solid rgba(126,213,111,0.2)", color: "#7ed56f" }}>
          {exito}
        </div>
      )}

      {/* ── Mensajes de error ─────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(220,60,60,0.1)", border: "1px solid rgba(220,60,60,0.2)", color: "#e05050" }}>
          {error}
        </div>
      )}

      {/* ── Vista: CV ya subido ───────────────────────────────────────── */}
      {estadoCV.url ? (
        <div className="card-game p-5">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: "rgba(126,213,111,0.15)", border: "1px solid rgba(126,213,111,0.2)" }}
            >
              📄
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm" style={{ color: "#f0ebe0" }}>cv.pdf</p>
              <p className="text-xs" style={{ color: "#706a58" }}>CV subido · listo para enviar</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={estadoCV.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
              style={{ border: "1px solid rgba(126,213,111,0.2)", color: "#b0a890" }}
            >
              👁️ Ver CV
            </a>

            <button
              onClick={() => void handleDescargarCV()}
              disabled={descargando}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}
            >
              {descargando ? "⏳ Descargando..." : "⬇️ Descargar CV"}
            </button>

            <button
              onClick={() => inputRef.current?.click()}
              disabled={subiendo}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90 disabled:opacity-60"
              style={{ background: "rgba(240,192,64,0.15)", border: "1px solid rgba(240,192,64,0.3)", color: "#f0c040" }}
            >
              🔄 Actualizar CV
            </button>

            {!confirmarBorrar ? (
              <button
                onClick={() => setConfirmarBorrar(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
                style={{ border: "1px solid rgba(220,60,60,0.2)", color: "#e05050" }}
              >
                🗑️ Eliminar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: "#706a58" }}>¿Seguro?</span>
                <button
                  onClick={() => void handleBorrarCV()}
                  disabled={borrando}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition disabled:opacity-60"
                  style={{ background: "#c03030" }}
                >
                  {borrando ? "Borrando..." : "Sí, eliminar"}
                </button>
                <button
                  onClick={() => setConfirmarBorrar(false)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition hover:opacity-80"
                  style={{ border: "1px solid #3d3c30", color: "#706a58" }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Vista: Sin CV — zona drag & drop ──────────────────────── */
        <div
          onDragEnter={() => setArrastrandoEncima(true)}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setArrastrandoEncima(false)}
          onDrop={handleDrop}
          onClick={() => !subiendo && inputRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
          style={{
            borderColor: arrastrandoEncima ? "rgba(126,213,111,0.5)" : "rgba(61,60,48,0.6)",
            background: arrastrandoEncima ? "rgba(126,213,111,0.05)" : "transparent",
          }}
        >
          <div className="text-4xl mb-3">{subiendo ? "⏳" : "📤"}</div>

          {subiendo ? (
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: "#f0ebe0" }}>Subiendo tu CV...</p>
              <div className="w-full max-w-xs mx-auto rounded-full h-2" style={{ background: "#2a2a1e" }}>
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progreso}%`, background: "linear-gradient(90deg, #7ed56f, #5cb848)" }}
                />
              </div>
              <p className="text-xs" style={{ color: "#706a58" }}>{progreso}%</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium" style={{ color: "#f0ebe0" }}>
                Arrastra tu CV aquí o haz clic para seleccionar
              </p>
              <p className="text-xs" style={{ color: "#706a58" }}>Solo PDF · Máximo 5 MB</p>
            </div>
          )}
        </div>
      )}

      {/* Input de archivo oculto (aceptar solo PDFs) */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleInputChange}
        aria-label="Seleccionar archivo CV en PDF"
      />
    </div>
  );
}
