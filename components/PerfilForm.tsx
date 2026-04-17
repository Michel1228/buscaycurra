"use client";

/**
 * PerfilForm.tsx — Formulario de perfil con foto y avatar
 * Tema: Bosque Encantado (oscuro)
 */

import { useState, useRef } from "react";
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

const AVATARES = ["🐛", "🦋", "🌿", "🌳", "🍃", "🐜", "🦎", "🐸", "🌻", "🦉"];

export default function PerfilForm({ userId, datosIniciales = {}, onGuardado }: PerfilFormProps) {
  const [nombre, setNombre] = useState(datosIniciales.nombre ?? "");
  const [telefono, setTelefono] = useState(datosIniciales.telefono ?? "");
  const [ciudad, setCiudad] = useState(datosIniciales.ciudad ?? "");
  const [sector, setSector] = useState(datosIniciales.sector ?? "");
  const [avatarEmoji, setAvatarEmoji] = useState("🐛");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const subirFoto = async (file: File) => {
    setSubiendoFoto(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `avatars/${userId}.${ext}`;
      const { error: err } = await getSupabaseBrowser().storage
        .from("profiles")
        .upload(path, file, { upsert: true });
      if (err) throw err;
      const { data } = getSupabaseBrowser().storage.from("profiles").getPublicUrl(path);
      setFotoUrl(data.publicUrl);
      // Save to profile
      await getSupabaseBrowser().from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
    } catch (e) {
      console.error("Error subiendo foto:", e);
      setError("No se pudo subir la foto. Inténtalo de nuevo.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setExito(false);
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }
    if (telefono && !/^[+\d\s()-]{6,20}$/.test(telefono)) { setError("Teléfono no válido"); return; }

    setGuardando(true);
    try {
      const { error: err } = await getSupabaseBrowser().from("profiles").upsert({
        id: userId,
        full_name: nombre.trim(),
        phone: telefono.trim() || null,
        city: ciudad.trim() || null,
        sector: sector || null,
      });
      if (err) { setError("No se pudieron guardar los cambios"); return; }
      setExito(true);
      onGuardado?.({ nombre, telefono, ciudad, sector });
      setTimeout(() => setExito(false), 3000);
    } catch { setError("Error inesperado"); }
    finally { setGuardando(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Foto de perfil / Avatar */}
      <div className="flex flex-col items-center gap-3 mb-2">
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          {fotoUrl ? (
            <img src={fotoUrl} alt="Foto" className="w-20 h-20 rounded-2xl object-cover"
              style={{ border: "3px solid rgba(126,213,111,0.3)" }} />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: "linear-gradient(135deg, rgba(126,213,111,0.15), rgba(92,184,72,0.1))", border: "3px solid rgba(126,213,111,0.2)" }}>
              {avatarEmoji}
            </div>
          )}
          <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            style={{ background: "rgba(0,0,0,0.5)" }}>
            <span className="text-sm">📷</span>
          </div>
          {subiendoFoto && (
            <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "#7ed56f", borderTopColor: "transparent" }} />
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) subirFoto(f); }} />

        {/* Selector de avatar emoji */}
        {!fotoUrl && (
          <div className="flex gap-2 flex-wrap justify-center">
            {AVATARES.map(a => (
              <button key={a} type="button" onClick={() => setAvatarEmoji(a)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition"
                style={{
                  background: avatarEmoji === a ? "rgba(126,213,111,0.2)" : "rgba(42,42,30,0.5)",
                  border: avatarEmoji === a ? "2px solid rgba(126,213,111,0.4)" : "1px solid #3d3c30",
                }}>
                {a}
              </button>
            ))}
          </div>
        )}
        <p className="text-[10px]" style={{ color: "#504a3a" }}>Toca para subir foto o elige un avatar</p>
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
          Nombre completo <span style={{ color: "#f87171" }}>*</span>
        </label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre completo" required className="w-full" />
      </div>

      {/* Teléfono */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
          Teléfono <span className="font-normal" style={{ color: "#504a3a" }}>(opcional)</span>
        </label>
        <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)}
          placeholder="+34 600 000 000" className="w-full" />
      </div>

      {/* Ciudad */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
          Ciudad <span className="font-normal" style={{ color: "#504a3a" }}>(opcional)</span>
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
          ❌ {error}
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
