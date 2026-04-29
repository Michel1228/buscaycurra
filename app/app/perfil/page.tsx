"use client";

/**
 * Perfil — Solo datos personales básicos
 * Foto de perfil genérica (avatar), no la foto profesional del CV
 */

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

interface PerfilData {
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
  ciudad: string;
  sector: string;
}

const emptyPerfil: PerfilData = {
  nombre: "", apellidos: "", telefono: "", email: "", ciudad: "", sector: "",
};

export default function PerfilPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState<PerfilData>(emptyPerfil);
  const [guardado, setGuardado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<"perfil" | "seguridad">("perfil");

  useEffect(() => {
    async function init() {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      setUserId(session.user.id);
      setEmail(session.user.email ?? "");

      const { data: p } = await getSupabaseBrowser().from("profiles")
        .select("full_name, phone, ciudad, sector")
        .eq("id", session.user.id).single();

      if (p) {
        const parts = (p.full_name || "").split(" ");
        setPerfil({
          nombre: parts[0] || "",
          apellidos: parts.slice(1).join(" ") || "",
          telefono: p.phone || "",
          email: session.user.email || "",
          ciudad: p.ciudad || "",
          sector: p.sector || "",
        });
      }
      setCargando(false);
    }
    init();
  }, [router]);

  // Auto-guardar
  useEffect(() => {
    if (!userId) return;
    const timeout = setTimeout(() => guardarPerfil(), 3000);
    return () => clearTimeout(timeout);
  }, [perfil, userId]);

  async function guardarPerfil() {
    if (!userId) return;
    try {
      await getSupabaseBrowser().from("profiles").update({
        full_name: `${perfil.nombre} ${perfil.apellidos}`.trim(),
        phone: perfil.telefono,
        ciudad: perfil.ciudad,
        sector: perfil.sector,
      }).eq("id", userId);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } catch { /* ignore */ }
  }

  function updateField(field: keyof PerfilData, value: string) {
    setPerfil(prev => ({ ...prev, [field]: value }));
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16" style={{ background: "#0f1117" }}>
        <div className="animate-spin rounded-full h-10 w-10 border-3" style={{ borderColor: "#2d3142", borderTopColor: "#22c55e" }} />
      </div>
    );
  }

  const iniciales = () => {
    const n = perfil.nombre || email;
    const p = n.trim().split(" ").filter(Boolean);
    if (!p.length) return "?";
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      {/* Header */}
      <div className="px-4 py-8" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(59,130,246,0.05))" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
            {iniciales()}
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>
              {perfil.nombre ? `${perfil.nombre} ${perfil.apellidos}` : "Mi Perfil"}
            </h1>
            <p className="text-sm" style={{ color: "#64748b" }}>{email}</p>
          </div>
          {guardado && (
            <span className="ml-auto text-xs font-medium px-3 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
              ✅ Guardado
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-10" style={{ background: "#0f1117", borderBottom: "1px solid #2d3142" }}>
        <div className="max-w-2xl mx-auto px-4 flex">
          {[
            { id: "perfil" as const, label: "👤 Mi Perfil", icon: "👤" },
            { id: "seguridad" as const, label: "🔒 Seguridad", icon: "🔒" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition"
              style={{
                borderColor: tab === t.id ? "#22c55e" : "transparent",
                color: tab === t.id ? "#22c55e" : "#64748b",
              }}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {tab === "perfil" && (
          <div className="space-y-6">
            <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
              <h2 className="font-semibold text-sm mb-4" style={{ color: "#f1f5f9" }}>👤 Datos personales</h2>
              <p className="text-xs mb-4" style={{ color: "#64748b" }}>
                Estos datos se usan para personalizar tu experiencia. El CV completo (foto, experiencia, formación) está en <button onClick={() => router.push("/app/curriculum")} className="underline" style={{ color: "#22c55e" }}>Mi CV</button>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Nombre" value={perfil.nombre} onChange={e => updateField("nombre", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <input placeholder="Apellidos" value={perfil.apellidos} onChange={e => updateField("apellidos", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <input placeholder="Teléfono" value={perfil.telefono} onChange={e => updateField("telefono", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <input placeholder="Email" value={perfil.email} onChange={e => updateField("email", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <input placeholder="Ciudad" value={perfil.ciudad} onChange={e => updateField("ciudad", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <input placeholder="Sector / Profesión" value={perfil.sector} onChange={e => updateField("sector", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
              </div>
            </div>

            {/* Link al CV */}
            <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: "#161922", border: "1px solid #252836" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "rgba(59,130,246,0.15)" }}>
                📄
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Tu CV completo</h3>
                <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Foto profesional, experiencia, formación, habilidades...</p>
              </div>
              <button onClick={() => router.push("/app/curriculum")}
                className="px-4 py-2 text-xs font-semibold rounded-lg transition"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                Ir a Mi CV →
              </button>
            </div>
          </div>
        )}

        {tab === "seguridad" && (
          <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
            <h2 className="font-semibold text-sm mb-4" style={{ color: "#f1f5f9" }}>🔒 Seguridad</h2>
            <p className="text-xs" style={{ color: "#64748b" }}>Funcionalidad en desarrollo</p>
          </div>
        )}
      </main>
    </div>
  );
}
