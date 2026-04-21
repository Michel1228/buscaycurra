"use client";

/**
 * PerfilForm.tsx — Formulario de perfil robusto
 * Tema: Bosque Encantado (oscuro)
 * 
 * Guarda datos paso a paso, con manejo de errores real
 * y soporte para columnas que puedan no existir aún.
 */

import { useState, useRef, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export interface DatosPerfil {
  nombre: string;
  telefono: string;
  ciudad: string;
  sector: string;
}

interface PerfilFormProps {
  userId: string;
  datosIniciales?: Partial<DatosPerfil>;
  onGuardado?: (datos: DatosPerfil) => void;
}

const SECTORES = [
  "Tecnología e informática", "Marketing y publicidad", "Ventas y comercial",
  "Finanzas y contabilidad", "Recursos humanos", "Diseño y creatividad",
  "Educación", "Sanidad y medicina", "Ingeniería", "Legal y jurídico",
  "Logística y transporte", "Hostelería y turismo", "Construcción",
  "Limpieza y mantenimiento", "Agricultura", "Industria", "Otro",
];

// Avatar emojis removed — avatar selection is in AvatarMariposa component

export default function PerfilForm({ userId, datosIniciales = {}, onGuardado }: PerfilFormProps) {
  const [nombre, setNombre] = useState(datosIniciales.nombre ?? "");
  const [telefono, setTelefono] = useState(datosIniciales.telefono ?? "");
  const [ciudad, setCiudad] = useState(datosIniciales.ciudad ?? "");
  const [sector, setSector] = useState(datosIniciales.sector ?? "");

  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Cargar avatar actual del perfil
  useEffect(() => {
    async function loadAvatar() {
      try {
        const { data } = await getSupabaseBrowser().from("profiles")
          .select("avatar_url").eq("id", userId).single();
        if (data?.avatar_url) setFotoUrl(data.avatar_url);
      } catch { /* ignore */ }
    }
    loadAvatar();
  }, [userId]);

  const subirFoto = async (file: File) => {
    const aceptados = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!aceptados.includes(file.type)) { setError("Solo se aceptan imágenes JPG, PNG o WebP"); return; }
    if (file.size > 3 * 1024 * 1024) { setError("La imagen no puede superar 3 MB"); return; }
    setSubiendoFoto(true);
    setError("");
    try {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { setError("Sesión expirada. Recarga la página."); return; }
      const formData = new FormData();
      formData.append("foto", file);
      const res = await fetch("/api/perfil/foto", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || "No se pudo subir la foto"); return; }
      setFotoUrl(data.url);
    } catch {
      setError("Error de conexión al subir la foto");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setExito(false);

    if (!nombre.trim()) {
      setError("Escribe tu nombre para continuar");
      return;
    }
    if (telefono && !/^[+\d\s()-]{6,20}$/.test(telefono)) {
      setError("El teléfono no parece válido");
      return;
    }

    setGuardando(true);
    try {
      // Guardar todo en un solo update (el perfil ya existe por el trigger de Supabase)
      const datos: Record<string, unknown> = {
        full_name: nombre.trim(),
        phone: telefono.trim() || null,
        ciudad: ciudad.trim() || null,
        sector: sector || null,
      };

      // Usar update en vez de upsert (más compatible con RLS)
      const { error: err1 } = await getSupabaseBrowser()
        .from("profiles")
        .update(datos)
        .eq("id", userId);

      if (err1) {
        console.error("Supabase update error:", err1);
        // Si update falla, intentar upsert como fallback
        const { error: err2 } = await getSupabaseBrowser()
          .from("profiles")
          .upsert({ id: userId, ...datos });
        
        if (err2) {
          console.error("Supabase upsert error:", err2);
          setError(`No se pudo guardar: ${err2.message}`);
          return;
        }
      }

      setExito(true);
      onGuardado?.({ nombre, telefono, ciudad, sector });
    } catch (ex) {
      console.error("Error inesperado:", ex);
      setError("Error de conexión. Comprueba tu internet.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Foto de perfil */}
      <div className="flex flex-col items-center gap-3 mb-2">
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          {fotoUrl ? (
            <img src={fotoUrl} alt="Foto" className="w-20 h-20 rounded-2xl object-cover"
              style={{ border: "3px solid rgba(126,213,111,0.3)" }} />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: "linear-gradient(135deg, rgba(126,213,111,0.15), rgba(92,184,72,0.1))", border: "3px solid rgba(126,213,111,0.2)" }}>
              📷
            </div>
          )}
          <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            style={{ background: "rgba(0,0,0,0.5)" }}>
            <span className="text-sm text-white">Cambiar foto</span>
          </div>
          {subiendoFoto && (
            <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "#7ed56f", borderTopColor: "transparent" }} />
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) subirFoto(f); }} />
        <p className="text-[10px]" style={{ color: "#504a3a" }}>Toca para subir tu foto de perfil</p>
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
          Nombre completo
        </label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre completo"
          className="w-full" />
      </div>

      {/* Teléfono */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
          Teléfono
        </label>
        <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)}
          placeholder="+34 600 000 000" className="w-full" />
      </div>

      {/* Ciudad */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
          Ciudad
        </label>
        <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)}
          placeholder="Madrid, Barcelona, Tudela..." className="w-full" />
      </div>

      {/* Sector */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
          Sector profesional
        </label>
        <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full">
          <option value="">Selecciona tu sector</option>
          {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          {error}
        </div>
      )}

      {/* Éxito */}
      {exito && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(126,213,111,0.1)", border: "1px solid rgba(126,213,111,0.2)", color: "#7ed56f" }}>
          ✅ Perfil guardado correctamente
        </div>
      )}

      {/* Guardar */}
      <button type="submit" disabled={guardando}
        className="w-full font-bold py-3 rounded-xl transition"
        style={{
          background: guardando ? "#3d3c30" : "linear-gradient(135deg, #7ed56f, #5cb848)",
          color: guardando ? "#706a58" : "#1a1a12",
          boxShadow: guardando ? "none" : "0 4px 16px rgba(126,213,111,0.25)",
        }}>
        {guardando ? "Guardando..." : "💾 Guardar perfil"}
      </button>
    </form>
  );
}
