"use client";

/**
 * Curriculum — Generador de CV profesional
 * 1. Subir PDF (extrae datos automáticamente)
 * 2. Foto profesional + tips
 * 3. Formulario completo con plantilla profesional
 * 4. Generar CV con IA
 * 5. Descargar PDF
 * 6. Auto-guardado
 */

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { generarCVHTML } from "@/lib/cv-generator/cv-template";
import type { CVData } from "@/lib/cv-generator/cv-template";

interface Exp {
  fechas: string;
  puesto: string;
  empresa: string;
  ubicacion: string;
  descripcion: string;
}

interface Edu {
  titulo: string;
  centro: string;
  ubicacion: string;
}

interface CVForm {
  nombre: string;
  apellidos: string;
  subtitulo: string;
  telefono: string;
  email: string;
  ciudad: string;
  perfilProfesional: string;
  aptitudes: string;
  idiomas: string;
  experiencia: Exp[];
  formacion: Edu[];
}

const emptyForm: CVForm = {
  nombre: "", apellidos: "", subtitulo: "", telefono: "", email: "", ciudad: "",
  perfilProfesional: "", aptitudes: "", idiomas: "",
  experiencia: [{ fechas: "", puesto: "", empresa: "", ubicacion: "", descripcion: "" }],
  formacion: [{ titulo: "", centro: "", ubicacion: "" }],
};

export default function CurriculumPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [form, setForm] = useState<CVForm>(emptyForm);
  const [fotoUrl, setFotoUrl] = useState("");
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [subiendoPDF, setSubiendoPDF] = useState(false);
  const [mejoradoHTML, setMejoradoHTML] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardadoId, setGuardadoId] = useState("");
  const [nombreCV, setNombreCV] = useState("");
  const [mostrarModalGuardar, setMostrarModalGuardar] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [visibleEmpresas, setVisibleEmpresas] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      setUserId(session.user.id);
      setToken(session.access_token);

      // Cargar CV guardado
      let fotoUrlCargada = "";
      try {
        const res = await fetch(`/api/gusi/cv?userId=${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.cv) {
            const cv = data.cv as Record<string, unknown>;

            // Normalizar experiencia (puede ser string o array con distinto formato)
            let experiencia = emptyForm.experiencia;
            if (Array.isArray(cv.experiencia) && (cv.experiencia as unknown[]).length > 0) {
              experiencia = (cv.experiencia as Record<string, unknown>[]).map(e => ({
                fechas: String(e.fechas || ""),
                puesto: String(e.puesto || ""),
                empresa: String(e.empresa || ""),
                ubicacion: String(e.ubicacion || ""),
                descripcion: Array.isArray(e.descripcion)
                  ? (e.descripcion as string[]).join("\n")
                  : String(e.descripcion || ""),
              }));
            }

            // Normalizar formacion (puede ser string o array)
            let formacion = emptyForm.formacion;
            if (Array.isArray(cv.formacion) && (cv.formacion as unknown[]).length > 0) {
              formacion = (cv.formacion as Record<string, unknown>[]).map(f => ({
                titulo: String(f.titulo || ""),
                centro: String(f.centro || ""),
                ubicacion: String(f.ubicacion || ""),
              }));
            }

            // Normalizar aptitudes (puede ser string[] o string)
            const aptRaw = cv.aptitudes || cv.habilidades || cv.skills;
            const aptitudes = Array.isArray(aptRaw)
              ? (aptRaw as string[]).join(", ")
              : String(aptRaw || "");

            // Normalizar idiomas (puede ser array de objetos o string)
            const idiomasRaw = cv.idiomas || cv.languages;
            const idiomas = Array.isArray(idiomasRaw)
              ? (idiomasRaw as Record<string, unknown>[]).map(i =>
                  typeof i === "string" ? i : `${i.nombre}:${i.nivel || 70}`
                ).join(", ")
              : String(idiomasRaw || "");

            // Foto desde CV guardado
            if (cv.fotoUrl && typeof cv.fotoUrl === "string") {
              fotoUrlCargada = cv.fotoUrl;
              setFotoUrl(cv.fotoUrl);
            }

            setForm(prev => ({
              ...prev,
              nombre: String(cv.nombre || cv.full_name || prev.nombre),
              apellidos: String(cv.apellidos || prev.apellidos),
              subtitulo: String(cv.subtitulo || prev.subtitulo),
              telefono: String(cv.telefono || cv.phone || cv.contacto || prev.telefono),
              email: String(cv.email || prev.email),
              ciudad: String(cv.ciudad || cv.location || prev.ciudad),
              perfilProfesional: String(cv.perfilProfesional || cv.perfil || cv.summary || prev.perfilProfesional),
              aptitudes: aptitudes || prev.aptitudes,
              idiomas: idiomas || prev.idiomas,
              experiencia,
              formacion,
            }));
          }
        }
      } catch { /* ignore */ }

      // Cargar perfil (solo para rellenar huecos que no estén en el CV)
      const { data: p } = await getSupabaseBrowser().from("profiles")
        .select("full_name, phone, ciudad, sector, visible_empresas, avatar_url")
        .eq("id", session.user.id).single();

      if (p) {
        const parts = (p.full_name || "").split(" ");
        setForm(prev => ({
          ...prev,
          nombre: prev.nombre || parts[0] || "",
          apellidos: prev.apellidos || parts.slice(1).join(" ") || "",
          telefono: prev.telefono || p.phone || "",
          email: prev.email || session.user.email || "",
          ciudad: prev.ciudad || p.ciudad || "",
        }));
        setVisibleEmpresas(p.visible_empresas === true);
        // Fallback: usar avatar_url del perfil si no hay foto en el CV guardado
        if (!fotoUrlCargada && p.avatar_url) {
          setFotoUrl(p.avatar_url as string);
        }
      }

      setCargando(false);
    }
    init();
  }, [router]);

  // Auto-guardar
  useEffect(() => {
    if (!userId) return;
    const timeout = setTimeout(() => {
      guardarCV();
    }, 3000);
    return () => clearTimeout(timeout);
  }, [form, fotoUrl, userId]);

  async function toggleVisibilidad(value: boolean) {
    setVisibleEmpresas(value);
    if (!userId) return;
    await getSupabaseBrowser()
      .from("profiles")
      .update({ visible_empresas: value })
      .eq("id", userId);
  }

  async function guardarCV() {
    if (!userId) return;
    try {
      const cvData = { ...form, fotoUrl: fotoUrl || undefined };
      await fetch("/api/gusi/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, cvData, cvText: JSON.stringify(cvData) }),
      });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } catch { /* ignore */ }
  }

  async function subirPDF(file: File) {
    if (file.type !== "application/pdf") { setError("Solo se aceptan archivos PDF."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("El PDF no puede superar 5 MB."); return; }
    setSubiendoPDF(true);
    setError("");
    try {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { setError("Sesión expirada."); return; }

      const uploadData = new FormData();
      uploadData.append("cv", file);
      const subirRes = await fetch("/api/cv/subir", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: uploadData,
      });
      if (!subirRes.ok) {
        const err = await subirRes.json().catch(() => ({}));
        setError((err as { error?: string }).error || "No se pudo subir el PDF.");
        return;
      }

      // Extraer datos del PDF
      const extractData = new FormData();
      extractData.append("file", file);
      const extractRes = await fetch("/api/cv/extraer", { method: "POST", body: extractData });

      if (extractRes.ok) {
        const parsed = await extractRes.json();
        if (!parsed.error && parsed.fuente) {
          let aptStr = "";
          if (Array.isArray(parsed.aptitudes)) aptStr = parsed.aptitudes.join(", ");
          else if (typeof parsed.aptitudes === "string") aptStr = parsed.aptitudes;

          let idiomaStr = "";
          if (Array.isArray(parsed.idiomas)) {
            idiomaStr = parsed.idiomas.map((i: { nombre: string; nivel: number } | string) =>
              typeof i === "string" ? i : `${i.nombre}:${i.nivel}`
            ).join(", ");
          } else if (typeof parsed.idiomas === "string") idiomaStr = parsed.idiomas;

          const normExp = (parsed.experiencia || []).map((e: Exp & { descripcion: string | string[] }) => ({
            fechas: e.fechas || "",
            puesto: e.puesto || "",
            empresa: e.empresa || "",
            ubicacion: e.ubicacion || "",
            descripcion: Array.isArray(e.descripcion) ? e.descripcion.join("\n") : (e.descripcion || ""),
          }));

          const normEdu = (parsed.formacion || []).map((f: Edu) => ({
            titulo: f.titulo || "",
            centro: f.centro || "",
            ubicacion: f.ubicacion || "",
          }));

          setForm(prev => ({
            nombre: parsed.nombre || prev.nombre,
            apellidos: parsed.apellidos || prev.apellidos,
            subtitulo: parsed.subtitulo || prev.subtitulo,
            telefono: parsed.telefono || prev.telefono,
            email: parsed.email || prev.email,
            ciudad: parsed.ciudad || prev.ciudad,
            perfilProfesional: parsed.perfilProfesional || prev.perfilProfesional,
            aptitudes: aptStr || prev.aptitudes,
            idiomas: idiomaStr || prev.idiomas,
            experiencia: normExp.length > 0 ? normExp : prev.experiencia,
            formacion: normEdu.length > 0 ? normEdu : prev.formacion,
          }));
        }
      }
      setError("✅ PDF procesado — revisa los campos");
      setTimeout(() => setError(""), 3000);
    } catch {
      setError("Error al procesar el PDF.");
    } finally {
      setSubiendoPDF(false);
    }
  }

  async function subirFoto(file: File) {
    if (!file.type.startsWith("image/")) { setError("Solo se aceptan imágenes."); return; }
    if (file.size > 3 * 1024 * 1024) { setError("La imagen no puede superar 3 MB."); return; }
    setSubiendoFoto(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("foto", file);
      const res = await fetch("/api/perfil/foto", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const { url } = await res.json();
        setFotoUrl(url);
      } else {
        const err = await res.json().catch(() => ({}));
        setError((err as { error?: string }).error || "No se pudo subir la foto.");
      }
    } catch { setError("Error al subir la foto."); }
    finally { setSubiendoFoto(false); }
  }

  function formToCVData(perfilMejorado?: string): CVData {
    const expOrdenada = [...form.experiencia]
      .filter(e => e.puesto)
      .sort((a, b) => {
        const getYear = (f: string) => { const m = f.match(/(\d{4})/g); return m ? parseInt(m[m.length - 1]) : 0; };
        return getYear(b.fechas) - getYear(a.fechas);
      });

    return {
      nombre: form.nombre,
      apellidos: form.apellidos || undefined,
      subtitulo: form.subtitulo || undefined,
      telefono: form.telefono || undefined,
      email: form.email || undefined,
      ciudad: form.ciudad || undefined,
      fotoUrl: fotoUrl || undefined,
      perfilProfesional: perfilMejorado || form.perfilProfesional || undefined,
      aptitudes: form.aptitudes
        ? form.aptitudes.split(",").map(a => a.trim()).filter(Boolean)
        : undefined,
      idiomas: form.idiomas
        ? form.idiomas.split(",").map(i => {
            const parts = i.trim().split(":");
            return { nombre: parts[0].trim(), nivel: parts[1] ? Math.min(100, Math.max(0, parseInt(parts[1]) || 70)) : 70 };
          }).filter(i => i.nombre)
        : undefined,
      experiencia: expOrdenada.map(e => ({
        fechas: e.fechas,
        puesto: e.puesto,
        empresa: e.empresa,
        ubicacion: e.ubicacion || undefined,
        descripcion: e.descripcion ? e.descripcion.split("\n").filter(d => d.trim()).map(d => d.trim().replace(/^[-•]\s*/, "")) : undefined,
      })),
      formacion: form.formacion.filter(f => f.titulo).map(f => ({
        titulo: f.titulo,
        centro: f.centro,
        ubicacion: f.ubicacion || undefined,
      })),
    };
  }

  async function generarYMejorar() {
    if (!form.nombre.trim()) { setError("Escribe tu nombre para continuar"); return; }
    setProcesando(true);
    setError("");
    try {
      const cvText = form.perfilProfesional || "Profesional con experiencia en diversos sectores. Actitud dinámica y proactiva.";

      let perfilMejorado: string | undefined;
      try {
        const mejorarRes = await fetch("/api/cv/mejorar", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ cvText, jobTitle: form.subtitulo }),
        });
        if (mejorarRes.ok) {
          const data = await mejorarRes.json();
          perfilMejorado = data.cvMejorado || undefined;
        }
      } catch { /* usa el perfil original si la IA falla */ }

      const html = generarCVHTML(formToCVData(perfilMejorado));
      setMejoradoHTML(html);
    } catch { setError("Error al generar el CV"); }
    finally { setProcesando(false); }
  }

  function descargarPDF() {
    if (!mejoradoHTML) return;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(mejoradoHTML);
      win.document.close();
      win.print();
    }
  }

  function f(field: keyof CVForm, val: string) {
    setForm(p => ({ ...p, [field]: val }));
  }

  function updExp(i: number, k: string, v: string) {
    setForm(p => { const e = [...p.experiencia]; e[i] = { ...e[i], [k]: v }; return { ...p, experiencia: e }; });
  }

  function updEdu(i: number, k: string, v: string) {
    setForm(p => { const e = [...p.formacion]; e[i] = { ...e[i], [k]: v }; return { ...p, formacion: e }; });
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16" style={{ background: "#0f1117" }}>
        <div className="animate-spin rounded-full h-10 w-10 border-3" style={{ borderColor: "#2d3142", borderTopColor: "#22c55e" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      {/* Header */}
      <div className="px-4 py-8" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Mi Currículum</h1>
            <p className="text-xs mt-1 text-white/80">Completa tus datos y genera un CV profesional</p>
          </div>
          {guardado && (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/20 text-white">
              ✅ Guardado
            </span>
          )}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className={`mb-4 p-3 rounded-lg text-xs ${error.startsWith("✅") ? "" : ""}`}
            style={{ background: error.startsWith("✅") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", 
                     color: error.startsWith("✅") ? "#22c55e" : "#ef4444",
                     border: `1px solid ${error.startsWith("✅") ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}` }}>
            {error}
          </div>
        )}

        {!mejoradoHTML ? (
          <div className="space-y-6">
            {/* Visibilidad para empresas */}
            <div className="rounded-xl p-5" style={{
              background: visibleEmpresas ? "rgba(34,197,94,0.07)" : "#161922",
              border: `1px solid ${visibleEmpresas ? "rgba(34,197,94,0.3)" : "#252836"}`,
              transition: "all 0.2s",
            }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: visibleEmpresas ? "rgba(34,197,94,0.15)" : "rgba(100,116,139,0.15)" }}>
                    {visibleEmpresas ? "👁️" : "🔒"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
                      Visible para empresas
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                      {visibleEmpresas
                        ? "Tu perfil aparece en el portal de empresas"
                        : "Activa esto para que empresas y ETTs puedan encontrarte"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => void toggleVisibilidad(!visibleEmpresas)}
                  className="relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200"
                  style={{ background: visibleEmpresas ? "#22c55e" : "#374151" }}
                  aria-label="Activar visibilidad para empresas"
                >
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                    style={{ transform: visibleEmpresas ? "translateX(24px)" : "translateX(0)" }} />
                </button>
              </div>
              {visibleEmpresas && (
                <p className="text-[11px] mt-3 pt-3" style={{ color: "#22c55e", borderTop: "1px solid rgba(34,197,94,0.15)" }}>
                  ✓ Activo — empresas y ETTs pueden ver tu perfil y contactarte
                </p>
              )}
            </div>

            {/* Subir PDF */}
            <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: "#161922", border: "1px solid #252836" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "rgba(59,130,246,0.15)" }}>
                📎
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>¿Ya tienes un CV en PDF?</h3>
                <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Súbelo y extraigo los datos automáticamente</p>
              </div>
              <label className={`shrink-0 px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer transition ${subiendoPDF ? "opacity-50 pointer-events-none" : ""}`}
                style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff" }}>
                {subiendoPDF ? "Procesando…" : "📎 Subir PDF"}
                <input type="file" accept=".pdf" className="hidden"
                  onChange={e => e.target.files?.[0] && subirPDF(e.target.files[0])}
                  disabled={subiendoPDF} />
              </label>
            </div>

            {/* Foto profesional */}
            <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
              <h2 className="font-semibold text-sm mb-4" style={{ color: "#f1f5f9" }}>📸 Foto profesional para tu CV</h2>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ border: "2px solid rgba(34,197,94,0.3)" }}>
                  {fotoUrl ? (
                    <img src={fotoUrl} alt="Foto CV" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: "#1e212b", color: "#475569" }}>👤</div>
                  )}
                </div>
                <div>
                  <label className={`inline-block px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer transition ${subiendoFoto ? "opacity-50" : ""}`}
                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                    {subiendoFoto ? "Subiendo…" : fotoUrl ? "Cambiar foto" : "Subir foto"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && subirFoto(e.target.files[0])} />
                  </label>
                  <p className="text-[10px] mt-1.5" style={{ color: "#64748b" }}>JPG/PNG, máx 3MB</p>
                </div>
              </div>

              {/* Tips de foto */}
              <div className="p-3 rounded-lg" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#22c55e" }}>💡 Truco: Foto profesional gratis con IA</p>
                <p className="text-[11px] mb-2" style={{ color: "#94a3b8" }}>Hazte un selfie y usa este prompt en ChatGPT:</p>
                <div className="p-2.5 rounded-md text-[10px] leading-relaxed font-mono" style={{ background: "#0a0c10", color: "#94a3b8", border: "1px solid #2d3142" }}>
                  Retoca esta foto para un currículum profesional: pon fondo blanco liso, iluminación frontal suave, aspecto limpio y formal tipo foto carnet. No cambies mi cara ni mis rasgos, solo mejora la luz, limpia el fondo y haz que parezca una foto de estudio profesional.
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText("Retoca esta foto para un currículum profesional: pon fondo blanco liso, iluminación frontal suave, aspecto limpio y formal tipo foto carnet. No cambies mi cara ni mis rasgos, solo mejora la luz, limpia el fondo y haz que parezca una foto de estudio profesional.")}
                    className="px-3 py-1 text-[10px] font-semibold rounded-md" style={{ background: "#22c55e", color: "#fff" }}>
                    Copiar prompt
                  </button>
                  <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1 text-[10px] font-semibold rounded-md"
                    style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
                    Abrir ChatGPT →
                  </a>
                </div>
              </div>
            </div>

            {/* Datos personales */}
            <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
              <h2 className="font-semibold text-sm mb-4" style={{ color: "#f1f5f9" }}>👤 Datos personales</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Nombre" value={form.nombre} onChange={e => f("nombre", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <input placeholder="Apellidos" value={form.apellidos} onChange={e => f("apellidos", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <input placeholder="Título profesional" value={form.subtitulo} onChange={e => f("subtitulo", e.target.value)}
                  className="sm:col-span-2 w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <input placeholder="Teléfono" value={form.telefono} onChange={e => f("telefono", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <input placeholder="Email" value={form.email} onChange={e => f("email", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <input placeholder="Ciudad" value={form.ciudad} onChange={e => f("ciudad", e.target.value)}
                  className="sm:col-span-2 w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
              </div>
            </div>

            {/* Experiencia */}
            <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
              <h2 className="font-semibold text-sm mb-4" style={{ color: "#f1f5f9" }}>💼 Experiencia laboral</h2>
              {form.experiencia.map((exp, i) => (
                <div key={i} className="p-3 rounded-lg space-y-2.5 mb-3" style={{ background: "#0f1117", border: "1px solid #252836" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold" style={{ color: "#22c55e" }}>Experiencia {i + 1}</span>
                    {form.experiencia.length > 1 && (
                      <button onClick={() => setForm(p => ({ ...p, experiencia: p.experiencia.filter((_, j) => j !== i) }))}
                        className="text-[11px]" style={{ color: "#ef4444" }}>Eliminar</button>
                    )}
                  </div>
                  <input placeholder="Fechas (ej: 2020 - 2023)" value={exp.fechas}
                    onChange={e => updExp(i, "fechas", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Puesto" value={exp.puesto} onChange={e => updExp(i, "puesto", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                    <input placeholder="Empresa" value={exp.empresa} onChange={e => updExp(i, "empresa", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                  </div>
                  <input placeholder="Ubicación" value={exp.ubicacion} onChange={e => updExp(i, "ubicacion", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                  <textarea placeholder="Descripción de tareas (una por línea)" value={exp.descripcion} rows={3}
                    onChange={e => updExp(i, "descripcion", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-sm resize-none" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                </div>
              ))}
              <button onClick={() => setForm(p => ({ ...p, experiencia: [...p.experiencia, { fechas: "", puesto: "", empresa: "", ubicacion: "", descripcion: "" }] }))}
                className="text-xs font-medium" style={{ color: "#22c55e" }}>+ Añadir experiencia</button>
            </div>

            {/* Formación */}
            <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
              <h2 className="font-semibold text-sm mb-4" style={{ color: "#f1f5f9" }}>🎓 Formación</h2>
              {form.formacion.map((edu, i) => (
                <div key={i} className="p-3 rounded-lg space-y-2.5 mb-3" style={{ background: "#0f1117", border: "1px solid #252836" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold" style={{ color: "#f59e0b" }}>Formación {i + 1}</span>
                    {form.formacion.length > 1 && (
                      <button onClick={() => setForm(p => ({ ...p, formacion: p.formacion.filter((_, j) => j !== i) }))}
                        className="text-[11px]" style={{ color: "#ef4444" }}>Eliminar</button>
                    )}
                  </div>
                  <input placeholder="Título / Estudios" value={edu.titulo}
                    onChange={e => updEdu(i, "titulo", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Centro" value={edu.centro} onChange={e => updEdu(i, "centro", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                    <input placeholder="Ubicación" value={edu.ubicacion} onChange={e => updEdu(i, "ubicacion", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                  </div>
                </div>
              ))}
              <button onClick={() => setForm(p => ({ ...p, formacion: [...p.formacion, { titulo: "", centro: "", ubicacion: "" }] }))}
                className="text-xs font-medium" style={{ color: "#f59e0b" }}>+ Añadir formación</button>
            </div>

            {/* Habilidades e idiomas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
                <h2 className="font-semibold text-sm mb-3" style={{ color: "#f1f5f9" }}>🎯 Habilidades</h2>
                <input placeholder="Separadas por comas" value={form.aptitudes}
                  onChange={e => f("aptitudes", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm" style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
              </div>
              <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
                <h2 className="font-semibold text-sm mb-3" style={{ color: "#f1f5f9" }}>🌍 Idiomas</h2>
                <input placeholder="Español:95, Inglés:60, Francés:40" value={form.idiomas}
                  onChange={e => f("idiomas", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm" style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <p className="text-[10px] mt-1" style={{ color: "#475569" }}>Formato: Idioma:nivel (0-100). Ej: Español:95, Inglés:60</p>
              </div>
            </div>

            {/* Perfil profesional */}
            <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
              <h2 className="font-semibold text-sm mb-3" style={{ color: "#f1f5f9" }}>📝 Perfil profesional (opcional)</h2>
              <textarea placeholder="Breve descripción de ti como profesional... (la IA lo mejorará)"
                value={form.perfilProfesional} onChange={e => f("perfilProfesional", e.target.value)} rows={3}
                className="w-full px-4 py-2.5 rounded-lg text-sm resize-none" style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
            </div>

            {/* Completitud del CV */}
            {(() => {
              const checks = [
                { ok: !!form.nombre.trim(), label: "Nombre" },
                { ok: !!form.apellidos.trim(), label: "Apellidos" },
                { ok: !!form.telefono.trim(), label: "Teléfono" },
                { ok: !!form.email.trim(), label: "Email" },
                { ok: !!fotoUrl, label: "Foto" },
                { ok: form.experiencia.some(e => e.puesto.trim()), label: "Experiencia" },
                { ok: form.formacion.some(f => f.titulo.trim()), label: "Formación" },
                { ok: !!form.aptitudes.trim(), label: "Habilidades" },
                { ok: !!form.idiomas.trim(), label: "Idiomas" },
                { ok: !!form.perfilProfesional.trim(), label: "Perfil profesional" },
              ];
              const pct = Math.round((checks.filter(c => c.ok).length / checks.length) * 100);
              const color = pct < 50 ? "#ef4444" : pct < 80 ? "#f59e0b" : "#22c55e";
              const pending = checks.filter(c => !c.ok).map(c => c.label);
              return (
                <div className="rounded-xl p-4" style={{ background: "#161922", border: "1px solid #252836" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>Completitud del CV</span>
                    <span className="text-sm font-extrabold" style={{ color }}>{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full mb-2" style={{ background: "#252836" }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  {pending.length > 0 && (
                    <p className="text-[10px]" style={{ color: "#64748b" }}>
                      Faltan: {pending.join(", ")}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Generar CV */}
            <div className="rounded-xl p-6 text-center" style={{ background: "#161922", border: "1px solid #252836" }}>
              <p className="text-3xl mb-3">✨</p>
              <h3 className="font-semibold text-sm mb-2" style={{ color: "#f1f5f9" }}>¿Listo para crear tu CV profesional?</h3>
              <p className="text-xs mb-4" style={{ color: "#64748b" }}>La IA mejorará tu perfil y generará un CV en formato PDF con diseño profesional de dos columnas</p>
              <button onClick={generarYMejorar} disabled={procesando}
                className="px-8 py-3 text-sm font-semibold rounded-xl transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                {procesando ? "Generando..." : "🚀 Generar mi CV con IA"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Tu CV generado</h2>
              <div className="flex gap-2">
                <button onClick={() => setMejoradoHTML("")}
                  className="px-3 py-1.5 text-xs rounded-lg" style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
                  ← Volver a editar
                </button>
                <button onClick={descargarPDF}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg"
                  style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                  ⬇️ Descargar PDF
                </button>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #252836" }}>
              <iframe srcDoc={mejoradoHTML} className="w-full bg-white" style={{ height: "1200px", border: "none" }} title="CV Generado" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
