"use client";

/**
 * components/PerfilForm.tsx — Formulario reutilizable para editar el perfil del usuario
 *
 * Permite editar: nombre completo, teléfono, ciudad y sector profesional.
 * Valida los campos antes de guardar y muestra mensajes de éxito/error.
 * Se usa en la pestaña "Mi Perfil" de la página /app/perfil.
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";


// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Datos del perfil del usuario */
export interface DatosPerfil {
  nombre: string;
  telefono: string;
  ciudad: string;
  sector: string;
}

/** Props del componente */
interface PerfilFormProps {
  /** ID del usuario autenticado */
  userId: string;
  /** Datos iniciales del perfil (pueden estar vacíos) */
  datosIniciales?: Partial<DatosPerfil>;
  /** Callback que se llama cuando el perfil se guarda correctamente */
  onGuardado?: (datos: DatosPerfil) => void;
}

// ─── Sectores profesionales disponibles ──────────────────────────────────────
const SECTORES = [
  "Tecnología e informática",
  "Marketing y publicidad",
  "Ventas y comercial",
  "Finanzas y contabilidad",
  "Recursos humanos",
  "Diseño y creatividad",
  "Educación",
  "Sanidad y medicina",
  "Ingeniería",
  "Legal y jurídico",
  "Logística y transporte",
  "Hostelería y turismo",
  "Construcción",
  "Otro",
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PerfilForm({ userId, datosIniciales = {}, onGuardado }: PerfilFormProps) {
  // Estado de los campos del formulario
  const [nombre, setNombre] = useState(datosIniciales.nombre ?? "");
  const [telefono, setTelefono] = useState(datosIniciales.telefono ?? "");
  const [ciudad, setCiudad] = useState(datosIniciales.ciudad ?? "");
  const [sector, setSector] = useState(datosIniciales.sector ?? "");

  // Estado de la operación
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");

  /**
   * Valida los campos del formulario.
   * El nombre es obligatorio; el resto son opcionales.
   */
  const validar = (): string => {
    if (!nombre.trim()) {
      return "El nombre completo es obligatorio.";
    }
    // Validar teléfono (solo si se ha rellenado)
    if (telefono && !/^[+\d\s()-]{6,20}$/.test(telefono)) {
      return "El teléfono no tiene un formato válido.";
    }
    return "";
  };

  /**
   * Guarda los cambios del perfil en la tabla `profiles` de Supabase.
   * Usa upsert para insertar si no existe o actualizar si ya existe.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setExito(false);

    // Validar formulario
    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      return;
    }

    setGuardando(true);
    try {
      // Guardar perfil en Supabase (tabla profiles)
      const { error: supabaseError } = await getSupabaseBrowser()
        .from("profiles")
        .upsert({
          id: userId,
          full_name: nombre.trim(),
          phone: telefono.trim() || null,
          city: ciudad.trim() || null,
          sector: sector || null,
        });

      if (supabaseError) {
        setError("No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.");
        return;
      }

      // Éxito: notificar al componente padre y mostrar mensaje
      setExito(true);
      onGuardado?.({ nombre, telefono, ciudad, sector });

      // Ocultar el mensaje de éxito después de 3 segundos
      setTimeout(() => setExito(false), 3000);
    } catch {
      setError("Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Campo: nombre completo */}
      <div>
        <label htmlFor="pf-nombre" className="block text-sm font-medium text-gray-700 mb-1.5">
          Nombre completo <span className="text-red-500">*</span>
        </label>
        <input
          id="pf-nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre completo"
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Campo: teléfono */}
      <div>
        <label htmlFor="pf-telefono" className="block text-sm font-medium text-gray-700 mb-1.5">
          Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <input
          id="pf-telefono"
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="+34 600 000 000"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Campo: ciudad */}
      <div>
        <label htmlFor="pf-ciudad" className="block text-sm font-medium text-gray-700 mb-1.5">
          Ciudad <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <input
          id="pf-ciudad"
          type="text"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          placeholder="Madrid, Barcelona, Valencia..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Campo: sector profesional */}
      <div>
        <label htmlFor="pf-sector" className="block text-sm font-medium text-gray-700 mb-1.5">
          Sector profesional <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <select
          id="pf-sector"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
        >
          <option value="">Selecciona tu sector</option>
          {SECTORES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Mensaje de éxito */}
      {exito && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          ✓ Los cambios se han guardado correctamente.
        </div>
      )}

      {/* Botón guardar */}
      <button
        type="submit"
        disabled={guardando}
        className="w-full text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#2563EB" }}
      >
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>

    </form>
  );
}
