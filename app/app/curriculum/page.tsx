"use client";

export const dynamic = "force-dynamic";

/**
 * app/app/curriculum/page.tsx — Centro de CV
 * 
 * 3 secciones:
 * 1. Crear CV paso a paso (datos → IA mejora → PDF profesional estilo Erick)
 * 2. Mejorar CV existente con IA (pegar texto → mejorar)
 * 3. Subir CV en PDF (para envío automático)
 */

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import CVUploader from "@/components/CVUploader";

type TabId = "crear" | "mejorar" | "subir";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "crear", label: "Crear CV", emoji: "✨" },
  { id: "mejorar", label: "Mejorar con IA", emoji: "🤖" },
  { id: "subir", label: "Subir PDF", emoji: "📎" },
];

// ── Datos del CV para el creador paso a paso ─────────────────────
interface CVFormData {
  nombre: string;
  apellidos: string;
  subtitulo: string;
  telefono: string;
  email: string;
  ciudad: string;
  perfilProfesional: string;
  aptitudes: string;
  idiomas: string;
  experiencia: {
    fechas: string;
    puesto: string;
    empresa: string;
    ubicacion: string;
    descripcion: string;
  }[];
  formacion: {
    titulo: string;
    centro: string;
    ubicacion: string;
  }[];
}

const initialForm: CVFormData = {
  nombre: "", apellidos: "", subtitulo: "", telefono: "", email: "", ciudad: "",
  perfilProfesional: "", aptitudes: "", idiomas: "",
  experiencia: [{ fechas: "", puesto: "", empresa: "", ubicacion: "", descripcion: "" }],
  formacion: [{ titulo: "", centro: "", ubicacion: "" }],
};

export default function CurriculumPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("crear");

  useEffect(() => {
    async function check() {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();
      if (!user) router.push("/auth/login");
    }
    check();
  }, [router]);

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <div className="py-10 px-4" style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">📄 Tu Currículum</h1>
          <p className="text-sm mt-1 opacity-80">Crea, mejora o sube tu CV profesional</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-10" style={{ background: "#1a1a12", borderBottom: "1px solid #3d3c30" }}>
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-4 text-sm font-medium transition"
                style={{
                  borderBottom: activeTab === tab.id ? "2px solid #7ed56f" : "2px solid transparent",
                  color: activeTab === tab.id ? "#7ed56f" : "#706a58",
                }}>
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === "crear" && <CrearCVTab />}
        {activeTab === "mejorar" && <MejorarCVTab />}
        {activeTab === "subir" && <SubirCVTab />}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 1: Crear CV paso a paso
// ══════════════════════════════════════════════════════════════════
function CrearCVTab() {
  const [form, setForm] = useState<CVFormData>(initialForm);
  const [paso, setPaso] = useState(1);
  const [procesando, setProcesando] = useState(false);
  const [previewHTML, setPreviewHTML] = useState("");
  const [error, setError] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-fill from profile
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();
      if (!user) return;
      const { data: p } = await getSupabaseBrowser().from("profiles")
        .select("full_name, phone, ciudad, email")
        .eq("id", user.id).single();
      if (p) {
        const parts = (p.full_name || "").split(" ");
        setForm(prev => ({
          ...prev,
          nombre: parts[0] || "",
          apellidos: parts.slice(1).join(" ") || "",
          telefono: p.phone || "",
          email: p.email || user.email || "",
          ciudad: p.ciudad || "",
        }));
      }
    }
    loadProfile();
  }, []);

  function updateField(field: keyof CVFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function addExperiencia() {
    setForm(prev => ({
      ...prev,
      experiencia: [...prev.experiencia, { fechas: "", puesto: "", empresa: "", ubicacion: "", descripcion: "" }],
    }));
  }

  function updateExp(idx: number, field: string, value: string) {
    setForm(prev => {
      const exp = [...prev.experiencia];
      exp[idx] = { ...exp[idx], [field]: value };
      return { ...prev, experiencia: exp };
    });
  }

  function removeExp(idx: number) {
    setForm(prev => ({ ...prev, experiencia: prev.experiencia.filter((_, i) => i !== idx) }));
  }

  function addFormacion() {
    setForm(prev => ({
      ...prev,
      formacion: [...prev.formacion, { titulo: "", centro: "", ubicacion: "" }],
    }));
  }

  function updateEdu(idx: number, field: string, value: string) {
    setForm(prev => {
      const edu = [...prev.formacion];
      edu[idx] = { ...edu[idx], [field]: value };
      return { ...prev, formacion: edu };
    });
  }

  function removeEdu(idx: number) {
    setForm(prev => ({ ...prev, formacion: prev.formacion.filter((_, i) => i !== idx) }));
  }

  async function generarPreview() {
    setProcesando(true);
    setError("");
    try {
      const cvData = {
        nombre: form.nombre,
        apellidos: form.apellidos,
        subtitulo: form.subtitulo,
        telefono: form.telefono,
        email: form.email,
        ciudad: form.ciudad,
        perfilProfesional: form.perfilProfesional,
        aptitudes: form.aptitudes.split(",").map(a => a.trim()).filter(Boolean),
        idiomas: form.idiomas.split(",").map(i => {
          const parts = i.trim().split(":");
          return { nombre: parts[0]?.trim() || "", nivel: parseInt(parts[1]) || 50 };
        }).filter(i => i.nombre),
        experiencia: form.experiencia.filter(e => e.puesto).map(e => ({
          ...e,
          descripcion: e.descripcion.split("\n").filter(Boolean),
        })),
        formacion: form.formacion.filter(f => f.titulo),
      };

      // Try to let IA improve the profile text first
      if (!form.perfilProfesional && form.experiencia.some(e => e.puesto)) {
        try {
          const aiRes = await fetch("/api/cv/mejorar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cvText: `Nombre: ${form.nombre} ${form.apellidos}\nPuesto: ${form.subtitulo}\nExperiencia: ${form.experiencia.map(e => `${e.puesto} en ${e.empresa}`).join(", ")}`,
              jobTitle: form.subtitulo || form.experiencia[0]?.puesto || "",
              tipo: "perfil",
            }),
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            if (aiData.cvMejorado) {
              cvData.perfilProfesional = aiData.cvMejorado;
              setForm(prev => ({ ...prev, perfilProfesional: aiData.cvMejorado }));
            }
          }
        } catch { /* IA optional */ }
      }

      const res = await fetch("/api/cv/generar-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cvData),
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/pdf")) {
        // Direct PDF download
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `CV_${form.nombre}_BuscayCurra.pdf`; a.click();
        URL.revokeObjectURL(url);
      } else {
        // HTML preview
        const data = await res.json();
        if (data.html) {
          setPreviewHTML(data.html);
          setPaso(4);
        } else if (data.error) {
          setError(data.error);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcesando(false);
    }
  }

  function descargarPDF() {
    if (!previewHTML || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.print();
  }

  return (
    <div className="space-y-6">
      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-6">
        {["Datos", "Experiencia", "Habilidades", "Vista previa"].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: paso > i + 1 ? "#7ed56f" : paso === i + 1 ? "rgba(126,213,111,0.2)" : "#2a2a1e",
                color: paso > i + 1 ? "#1a1a12" : paso === i + 1 ? "#7ed56f" : "#706a58",
                border: paso === i + 1 ? "2px solid #7ed56f" : "2px solid transparent",
              }}>
              {paso > i + 1 ? "✓" : i + 1}
            </div>
            <span className="text-xs hidden sm:inline" style={{ color: paso === i + 1 ? "#f0ebe0" : "#706a58" }}>{label}</span>
            {i < 3 && <div className="w-8 h-0.5 rounded" style={{ background: paso > i + 1 ? "#7ed56f" : "#3d3c30" }} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {/* PASO 1: Datos personales */}
      {paso === 1 && (
        <div className="card-game p-6 space-y-4">
          <h2 className="font-bold text-lg" style={{ color: "#f0ebe0" }}>👤 Datos personales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input placeholder="Nombre" value={form.nombre} onChange={e => updateField("nombre", e.target.value)}
              className="input-game" />
            <input placeholder="Apellidos" value={form.apellidos} onChange={e => updateField("apellidos", e.target.value)}
              className="input-game" />
            <input placeholder="Título / Puesto (ej: Operario · Atención al cliente)" value={form.subtitulo}
              onChange={e => updateField("subtitulo", e.target.value)} className="input-game sm:col-span-2" />
            <input placeholder="Teléfono" value={form.telefono} onChange={e => updateField("telefono", e.target.value)}
              className="input-game" />
            <input placeholder="Email" value={form.email} onChange={e => updateField("email", e.target.value)}
              className="input-game" />
            <input placeholder="Ciudad, Provincia CP" value={form.ciudad} onChange={e => updateField("ciudad", e.target.value)}
              className="input-game sm:col-span-2" />
          </div>
          <div className="flex justify-end">
            <button onClick={() => setPaso(2)} disabled={!form.nombre}
              className="btn-game px-8">Siguiente →</button>
          </div>
        </div>
      )}

      {/* PASO 2: Experiencia + Formación */}
      {paso === 2 && (
        <div className="card-game p-6 space-y-6">
          <h2 className="font-bold text-lg" style={{ color: "#f0ebe0" }}>💼 Experiencia laboral</h2>
          {form.experiencia.map((exp, i) => (
            <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: "rgba(42,42,30,0.5)", border: "1px solid #3d3c30" }}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold" style={{ color: "#7ed56f" }}>Experiencia {i + 1}</span>
                {form.experiencia.length > 1 && (
                  <button onClick={() => removeExp(i)} className="text-xs" style={{ color: "#ef4444" }}>Eliminar</button>
                )}
              </div>
              <input placeholder="Fechas (ej: Mayo 2021 – Sep. 2022)" value={exp.fechas}
                onChange={e => updateExp(i, "fechas", e.target.value)} className="input-game" />
              <input placeholder="Puesto" value={exp.puesto}
                onChange={e => updateExp(i, "puesto", e.target.value)} className="input-game" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Empresa" value={exp.empresa}
                  onChange={e => updateExp(i, "empresa", e.target.value)} className="input-game" />
                <input placeholder="Ubicación" value={exp.ubicacion}
                  onChange={e => updateExp(i, "ubicacion", e.target.value)} className="input-game" />
              </div>
              <textarea placeholder="Tareas (una por línea)" value={exp.descripcion} rows={3}
                onChange={e => updateExp(i, "descripcion", e.target.value)} className="input-game resize-none" />
            </div>
          ))}
          <button onClick={addExperiencia} className="text-sm font-medium" style={{ color: "#7ed56f" }}>
            + Añadir experiencia
          </button>

          <h2 className="font-bold text-lg pt-4" style={{ color: "#f0ebe0" }}>🎓 Formación</h2>
          {form.formacion.map((edu, i) => (
            <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: "rgba(42,42,30,0.5)", border: "1px solid #3d3c30" }}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold" style={{ color: "#f0c040" }}>Formación {i + 1}</span>
                {form.formacion.length > 1 && (
                  <button onClick={() => removeEdu(i)} className="text-xs" style={{ color: "#ef4444" }}>Eliminar</button>
                )}
              </div>
              <input placeholder="Título / Estudios" value={edu.titulo}
                onChange={e => updateEdu(i, "titulo", e.target.value)} className="input-game" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Centro" value={edu.centro}
                  onChange={e => updateEdu(i, "centro", e.target.value)} className="input-game" />
                <input placeholder="Ubicación" value={edu.ubicacion}
                  onChange={e => updateEdu(i, "ubicacion", e.target.value)} className="input-game" />
              </div>
            </div>
          ))}
          <button onClick={addFormacion} className="text-sm font-medium" style={{ color: "#f0c040" }}>
            + Añadir formación
          </button>

          <div className="flex justify-between pt-4">
            <button onClick={() => setPaso(1)} className="btn-game-outline px-6">← Atrás</button>
            <button onClick={() => setPaso(3)} className="btn-game px-8">Siguiente →</button>
          </div>
        </div>
      )}

      {/* PASO 3: Habilidades + Perfil */}
      {paso === 3 && (
        <div className="card-game p-6 space-y-4">
          <h2 className="font-bold text-lg" style={{ color: "#f0ebe0" }}>🎯 Habilidades y perfil</h2>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "#b0a890" }}>
              Aptitudes (separadas por comas)
            </label>
            <input placeholder="Ej: Trabajo en equipo, Organización, Puntualidad, Polivalente"
              value={form.aptitudes} onChange={e => updateField("aptitudes", e.target.value)} className="input-game" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "#b0a890" }}>
              Idiomas (nombre:nivel, separados por comas — nivel de 0 a 100)
            </label>
            <input placeholder="Ej: Español:95, Inglés:30, Francés:15"
              value={form.idiomas} onChange={e => updateField("idiomas", e.target.value)} className="input-game" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "#b0a890" }}>
              Perfil profesional (déjalo vacío y la IA lo escribirá por ti)
            </label>
            <textarea placeholder="Profesional con experiencia en... (la IA lo genera automáticamente si lo dejas vacío)"
              value={form.perfilProfesional} onChange={e => updateField("perfilProfesional", e.target.value)}
              rows={4} className="input-game resize-none" />
          </div>
          <div className="flex justify-between pt-4">
            <button onClick={() => setPaso(2)} className="btn-game-outline px-6">← Atrás</button>
            <button onClick={generarPreview} disabled={procesando}
              className="btn-game px-8">
              {procesando ? "Generando..." : "✨ Generar CV profesional"}
            </button>
          </div>
        </div>
      )}

      {/* PASO 4: Vista previa */}
      {paso === 4 && previewHTML && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg" style={{ color: "#f0ebe0" }}>👀 Vista previa de tu CV</h2>
            <div className="flex gap-3">
              <button onClick={() => setPaso(1)} className="btn-game-outline px-4 text-sm">✏️ Editar</button>
              <button onClick={descargarPDF} className="btn-game px-6 text-sm">⬇️ Descargar PDF</button>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: "2px solid #3d3c30" }}>
            <iframe
              ref={iframeRef}
              srcDoc={previewHTML}
              className="w-full bg-white"
              style={{ height: "800px", border: "none" }}
              title="CV Preview"
            />
          </div>
          <div className="text-center pt-4">
            <a href="/app/buscar" className="btn-game px-8 text-sm inline-block">
              🔍 Siguiente: Buscar ofertas →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 2: Mejorar CV con IA
// ══════════════════════════════════════════════════════════════════
function MejorarCVTab() {
  const [textoCv, setTextoCv] = useState("");
  const [puesto, setPuesto] = useState("");
  const [cvMejorado, setCvMejorado] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [esCarta, setEsCarta] = useState(false);
  const resultadoRef = useRef<HTMLDivElement>(null);

  async function mejorarCV(e: React.FormEvent) {
    e.preventDefault();
    if (!textoCv.trim()) { setError("Pega tu CV primero"); return; }
    setProcesando(true); setError(""); setCvMejorado("");
    try {
      const res = await fetch("/api/cv/mejorar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: textoCv, jobTitle: puesto }),
      });
      if (!res.ok) throw new Error("Error al mejorar");
      const data = await res.json();
      setCvMejorado(data.cvMejorado || ""); setEsCarta(false);
      setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) { setError((err as Error).message); }
    finally { setProcesando(false); }
  }

  async function generarCarta() {
    if (!textoCv.trim() || !puesto.trim()) { setError("Necesitas CV y puesto"); return; }
    setProcesando(true); setError("");
    try {
      const res = await fetch("/api/cv/mejorar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: textoCv, jobTitle: puesto, tipo: "carta" }),
      });
      if (!res.ok) throw new Error("Error al generar carta");
      const data = await res.json();
      setCvMejorado(data.cvMejorado || ""); setEsCarta(true);
    } catch (err) { setError((err as Error).message); }
    finally { setProcesando(false); }
  }

  async function copiar() {
    if (cvMejorado) await navigator.clipboard.writeText(cvMejorado);
  }

  return (
    <div className="space-y-6">
      {error && <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{error}</div>}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-game p-6">
          <h2 className="font-semibold text-[#f0ebe0] mb-4">Tu CV actual</h2>
          <form onSubmit={mejorarCV} className="space-y-4">
            <input placeholder="¿Para qué puesto?" value={puesto} onChange={e => setPuesto(e.target.value)} className="input-game" />
            <textarea placeholder="Pega tu CV aquí..." value={textoCv} onChange={e => setTextoCv(e.target.value)}
              rows={14} className="input-game resize-none" />
            <p className="text-xs" style={{ color: "#504a3a" }}>{textoCv.split(/\s+/).filter(Boolean).length} palabras</p>
            <button type="submit" disabled={procesando || !textoCv.trim()} className="btn-game w-full">
              {procesando ? "Procesando..." : "✨ Mejorar con IA"}
            </button>
          </form>
        </div>
        <div ref={resultadoRef} className="card-game p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#f0ebe0]">{esCarta ? "Carta de presentación" : "CV mejorado"}</h2>
            {cvMejorado && <button onClick={copiar} className="text-xs px-3 py-1 rounded-lg" style={{ background: "#F97316", color: "#fff" }}>📋 Copiar</button>}
          </div>
          {procesando ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-3 rounded" style={{ width: `${60 + (i % 4) * 10}%`, background: "#2a2a1e" }} />)}
            </div>
          ) : cvMejorado ? (
            <pre className="text-sm whitespace-pre-wrap leading-relaxed font-sans" style={{ color: "#b0a890" }}>{cvMejorado}</pre>
          ) : (
            <div className="py-20 text-center"><p className="text-4xl mb-3">🤖</p><p className="text-sm" style={{ color: "#706a58" }}>Tu CV mejorado aparecerá aquí</p></div>
          )}
        </div>
      </div>
      <div className="card-game p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div><h3 className="font-semibold" style={{ color: "#f0ebe0" }}>Carta de presentación</h3><p className="text-sm mt-0.5" style={{ color: "#706a58" }}>Genera una carta personalizada</p></div>
        <button onClick={generarCarta} disabled={procesando || !textoCv.trim() || !puesto.trim()}
          className="shrink-0 px-6 py-3 text-sm font-semibold rounded-xl transition disabled:opacity-50"
          style={{ background: "#F97316", color: "#fff" }}>
          ✉️ Generar carta
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 3: Subir CV en PDF
// ══════════════════════════════════════════════════════════════════
function SubirCVTab() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="card-game p-6">
        <h2 className="font-semibold mb-2" style={{ color: "#f0ebe0" }}>📎 Sube tu CV en PDF</h2>
        <p className="text-sm mb-4" style={{ color: "#706a58" }}>Tu CV se enviará automáticamente a las empresas</p>
        <CVUploader />
      </div>
      <div className="text-center">
        <button onClick={() => router.push("/app/buscar")}
          className="btn-game px-8 text-sm">
          🔍 Siguiente: Buscar ofertas →
        </button>
      </div>
    </div>
  );
}
