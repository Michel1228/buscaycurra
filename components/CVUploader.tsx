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
          style={{ borderColor: "#2563EB", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Mensajes de éxito ────────────────────────────────────────── */}
      {exito && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          {exito}
        </div>
      )}

      {/* ── Mensajes de error ─────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* ── Vista: CV ya subido ───────────────────────────────────────── */}
      {estadoCV.url ? (
        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <div className="flex items-center gap-3 mb-4">
            {/* Icono de PDF */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg flex-shrink-0"
              style={{ backgroundColor: "#2563EB" }}
            >
              📄
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">cv.pdf</p>
              <p className="text-gray-400 text-xs">CV subido · listo para enviar</p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2">
            {/* Ver CV */}
            <a
              href={estadoCV.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              aria-label="Ver CV en una nueva pestaña"
            >
              👁️ Ver CV
            </a>

            {/* Descargar CV — descarga directamente al dispositivo del usuario */}
            <button
              onClick={() => void handleDescargarCV()}
              disabled={descargando}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#2563EB" }}
              aria-label="Descargar CV en PDF"
            >
              {descargando ? "⏳ Descargando..." : "⬇️ Descargar CV"}
            </button>

            {/* Actualizar CV */}
            <button
              onClick={() => inputRef.current?.click()}
              disabled={subiendo}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#F97316" }}
              aria-label="Subir un nuevo CV para reemplazar el actual"
            >
              🔄 Actualizar CV
            </button>

            {/* Eliminar CV */}
            {!confirmarBorrar ? (
              <button
                onClick={() => setConfirmarBorrar(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition"
                aria-label="Eliminar CV"
              >
                🗑️ Eliminar
              </button>
            ) : (
              // Confirmación de borrado
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">¿Seguro?</span>
                <button
                  onClick={() => void handleBorrarCV()}
                  disabled={borrando}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-60"
                >
                  {borrando ? "Borrando..." : "Sí, eliminar"}
                </button>
                <button
                  onClick={() => setConfirmarBorrar(false)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition"
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
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !subiendo) {
              if (e.key === " ") e.preventDefault(); // Evitar scroll de página
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Zona para subir CV. Arrastra un archivo PDF aquí o pulsa para seleccionar"
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            arrastrandoEncima
              ? "bg-blue-50 border-blue-400"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          {/* Icono */}
          <div className="text-4xl mb-3">{subiendo ? "⏳" : "📤"}</div>

          {subiendo ? (
            /* Estado: subiendo */
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Subiendo tu CV...</p>
              {/* Barra de progreso */}
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${progreso}%`,
                    backgroundColor: "#2563EB",
                  }}
                />
              </div>
              <p className="text-xs text-gray-400">{progreso}%</p>
            </div>
          ) : (
            /* Estado: sin CV */
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                Arrastra tu CV aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-400">Solo PDF · Máximo 5 MB</p>
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
