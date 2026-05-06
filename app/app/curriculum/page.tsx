"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

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

type Paso = "form" | "preview" | "mejorado";

export default function CurriculumPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("form");
  const [form, setForm] = useState<CVForm>(emptyForm);
  const [previewHTML, setPreviewHTML] = useState("");
  const [mejoradoHTML, setMejoradoHTML] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [subiendoPDF, setSubiendoPDF] = useState(false);
  const [pdfSubido, setPdfSubido] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeMejRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    async function init() {
      const sb = getSupabaseBrowser();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { router.push("/auth/login"); return; }
      setToken(session.access_token);
      const { data: p } = await sb.from("profiles")
        .select("full_name, phone, ciudad, email")
        .eq("id", session.user.id).single();
      if (p) {
        const parts = (p.full_name || "").split(" ");
        setForm(prev => ({
          ...prev,
          nombre: parts[0] || "",
          apellidos: parts.slice(1).join(" ") || "",
          telefono: p.phone || "",
          email: p.email || session.user.email || "",
          ciudad: p.ciudad || "",
        }));
        if ((p as Record<string, string>).avatar_url) setFotoUrl((p as Record<string, string>).avatar_url);
      }
    }
    init();
  }, [router]);

  async function subirPDF(file: File) {
    if (file.type !== "application/pdf") { setError("Solo se aceptan archivos PDF."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("El PDF no puede superar 5 MB."); return; }
    setSubiendoPDF(true);
    setError("");
    try {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { setError("Sesión expirada. Recarga la página."); return; }

      // 1. Subir PDF a Supabase Storage
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

      // 2. Extraer datos del PDF con IA (un solo paso: texto + parseo)
      const extractData = new FormData();
      extractData.append("file", file);
      const extractRes = await fetch("/api/cv/extraer", {
        method: "POST",
        body: extractData,
      });

      if (extractRes.ok) {
        const parsed = await extractRes.json();
        if (!parsed.error && parsed.fuente) {
          // Normalizar aptitudes: puede venir como array o string
          let aptStr = "";
          if (Array.isArray(parsed.aptitudes)) aptStr = parsed.aptitudes.join(", ");
          else if (typeof parsed.aptitudes === "string") aptStr = parsed.aptitudes;

          // Normalizar idiomas: puede venir como array de objetos o string
          let idiomaStr = "";
          if (Array.isArray(parsed.idiomas)) {
            idiomaStr = parsed.idiomas.map((i: { nombre: string; nivel: number } | string) =>
              typeof i === "string" ? i : `${i.nombre}:${i.nivel}`
            ).join(", ");
          } else if (typeof parsed.idiomas === "string") idiomaStr = parsed.idiomas;

          // Normalizar experiencia
          const normExp = (parsed.experiencia || []).map((e: Exp & { descripcion: string | string[] }) => ({
            fechas: e.fechas || "",
            puesto: e.puesto || "",
            empresa: e.empresa || "",
            ubicacion: e.ubicacion || "",
            descripcion: Array.isArray(e.descripcion) ? e.descripcion.join("\n") : (e.descripcion || ""),
          }));

          // Normalizar formación
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

      setPdfSubido(true);
    } catch {
      setError("No se pudo subir el PDF. Comprueba tu conexión.");
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

  function buildCVData() {
    return {
      fotoUrl: fotoUrl || undefined,
      nombre: form.nombre,
      apellidos: form.apellidos,
      subtitulo: form.subtitulo,
      telefono: form.telefono,
      email: form.email,
      ciudad: form.ciudad,
      perfilProfesional: form.perfilProfesional,
      aptitudes: form.aptitudes.split(",").map(a => a.trim()).filter(Boolean),
      idiomas: form.idiomas.split(",").map(i => {
        const [nombre, nivel] = i.trim().split(":");
        return { nombre: nombre?.trim() || "", nivel: parseInt(nivel) || 50 };
      }).filter(i => i.nombre),
      experiencia: form.experiencia.filter(e => e.puesto).map(e => ({
        ...e,
        // descripcion puede llegar como string (textarea) o array (parsear AI)
        descripcion: Array.isArray(e.descripcion)
          ? (e.descripcion as string[]).filter(Boolean)
          : (e.descripcion || "").split("\n").filter(Boolean),
      })),
      formacion: form.formacion.filter(f => f.titulo),
    };
  }

  // Un solo botón: genera CV + mejora con IA en un paso
  async function generarYMejorar() {
    if (!form.nombre.trim()) { setError("Escribe tu nombre para continuar"); return; }
    setProcesando(true);
    setError("");
    try {
      const cvText = [
        `${form.nombre} ${form.apellidos}${form.subtitulo ? ` — ${form.subtitulo}` : ""}`,
        form.perfilProfesional,
        form.experiencia.filter(e => e.puesto).map(e =>
          `${e.puesto} en ${e.empresa}${e.fechas ? ` (${e.fechas})` : ""}:\n${Array.isArray(e.descripcion) ? (e.descripcion as string[]).join("\n") : e.descripcion}`
        ).join("\n\n"),
        form.aptitudes ? `Aptitudes: ${form.aptitudes}` : "",
        form.idiomas ? `Idiomas: ${form.idiomas}` : "",
        form.formacion.filter(f => f.titulo).map(f => `${f.titulo} · ${f.centro}`).join("\n"),
      ].filter(Boolean).join("\n\n");

      const mejorarRes = await fetch("/api/cv/mejorar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cvText, jobTitle: form.subtitulo }),
      });
      if (!mejorarRes.ok) throw new Error("Error al mejorar");
      const { cvMejorado } = await mejorarRes.json();

      if (cvMejorado) {
        // Extraer perfil profesional: primer párrafo sustancial del resultado IA
        const lineas = cvMejorado.split("\n").filter((l: string) => l.trim().length > 30);
        const perfilMejorado = lineas.slice(0, 3).join(" ").replace(/^[^a-zA-ZáéíóúÁÉÍÓÚ]+/, "").trim();
        const cvData = { ...buildCVData(), perfilProfesional: perfilMejorado || cvMejorado.slice(0, 500) };
        const genRes = await fetch("/api/cv/generar-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cvData),
        });
        const genData = await genRes.json();
        if (genData.html) { setMejoradoHTML(genData.html); setPaso("mejorado"); }
        else setError("Error generando CV mejorado");
      }
    } catch { setError("Error al mejorar con IA"); }
    finally { setProcesando(false); }
  }

  async function descargar(html: string) {
    // Convertir foto a base64 para garantizar que aparezca en el PDF
    let htmlFinal = html;
    if (fotoUrl && html.includes(fotoUrl)) {
      try {
        const res = await fetch(fotoUrl);
        const blob = await res.blob();
        const b64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        htmlFinal = htmlFinal.split(fotoUrl).join(b64);
      } catch { /* usar URL original si falla */ }
    }
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(htmlFinal);
      win.document.close();
      setTimeout(() => {
        try { win.print(); } catch { /* mobile may block */ }
      }, 1500);
    } else {
      // Fallback: descargar como HTML
      const blob = new Blob([htmlFinal], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CV-${form.nombre}-${form.apellidos}.html`;
      a.click();
      URL.revokeObjectURL(url);
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

  const stepLabels = ["Tus datos", "CV con IA"];
  const stepIdx = paso === "form" ? 0 : 1;

  return (
    <div className="min-h-screen pt-16">
      <div className="py-8 px-4" style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📄 Tu Currículum</h1>
            <p className="text-sm mt-1 opacity-75">Completa tus datos y mejóralos con IA</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  i === stepIdx ? "bg-white text-[#1a1a12]" : i < stepIdx ? "bg-white/50 text-white" : "bg-white/20 text-white/50"
                }`}>
                  {i < stepIdx ? "✓" : i + 1}
                </div>
                <span className={`hidden sm:inline ${i === stepIdx ? "text-white" : "text-white/50"}`}>{label}</span>
                {i < 2 && <div className="w-4 h-0.5 mx-1" style={{ background: i < stepIdx ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        {/* ── PASO 1: FORMULARIO ─────────────────────────────────── */}
        {paso === "form" && (
          <div className="space-y-5">

            {/* Upload PDF */}
            <div className="card-game p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "#f0ebe0" }}>¿Ya tienes un CV en PDF?</p>
                <p className="text-xs mt-0.5" style={{ color: "#706a58" }}>Súbelo y los campos se rellenan solos</p>
                {pdfSubido && <p className="text-xs mt-1 font-medium" style={{ color: "#7ed56f" }}>✅ PDF procesado — revisa los campos</p>}
              </div>
              <label className={`shrink-0 px-5 py-2.5 text-sm font-semibold rounded-xl cursor-pointer transition ${subiendoPDF ? "opacity-50 pointer-events-none" : ""}`}
                style={{ background: "linear-gradient(135deg,#7ed56f,#5cb848)", color: "#1a1a12" }}>
                {subiendoPDF ? "Procesando…" : "📎 Subir PDF"}
                <input type="file" accept=".pdf" className="hidden"
                  onChange={e => e.target.files?.[0] && subirPDF(e.target.files[0])}
                  disabled={subiendoPDF} />
              </label>
            </div>

            {/* Foto para el CV */}
            <div className="card-game p-6 space-y-4">
              <h2 className="font-bold" style={{ color: "#f0ebe0" }}>📸 Foto para el CV</h2>
              
              {/* Truco: prompt para ChatGPT */}
              <div className="p-4 rounded-xl" style={{ background: "rgba(126,213,111,0.08)", border: "1px solid rgba(126,213,111,0.15)" }}>
                <p className="text-sm font-bold mb-2" style={{ color: "#7ed56f" }}>Truco: Consigue una foto profesional GRATIS</p>
                <p className="text-xs mb-3" style={{ color: "#b0a890" }}>Hazte un selfie cualquiera y usa este prompt en ChatGPT para que te la retoque:</p>
                <div className="relative">
                  <div className="p-3 rounded-lg text-xs leading-relaxed" style={{ background: "#111", color: "#ffffff", border: "1px solid #3d3c30", fontFamily: "monospace" }}>
                    Retoca esta foto para un currículum profesional: pon fondo blanco liso, iluminación frontal suave, aspecto limpio y formal tipo foto carnet. No cambies mi cara ni mis rasgos, solo mejora la luz, limpia el fondo y haz que parezca una foto de estudio profesional. Tamaño cuadrado.
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("Retoca esta foto para un currículum profesional: pon fondo blanco liso, iluminación frontal suave, aspecto limpio y formal tipo foto carnet. No cambies mi cara ni mis rasgos, solo mejora la luz, limpia el fondo y haz que parezca una foto de estudio profesional. Tamaño cuadrado.");
                      const btn = document.getElementById("copy-prompt-btn");
                      if (btn) { btn.textContent = "¡Copiado!"; setTimeout(() => btn.textContent = "Copiar prompt", 2000); }
                    }}
                    id="copy-prompt-btn"
                    className="mt-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition"
                    style={{ background: "#7ed56f", color: "#1a1a12" }}
                  >
                    Copiar prompt
                  </button>
                </div>
                <div className="mt-3 flex items-start gap-2">
                  <span style={{ color: "#f0c040" }}>💡</span>
                  <p className="text-xs" style={{ color: "#706a58" }}>Sube cualquier foto tuya a ChatGPT junto con ese texto. En segundos tendrás una foto profesional lista para tu CV.</p>
                </div>
              </div>

              {/* Upload + preview */}
              <div className="flex items-center gap-5">
                <div className="shrink-0 w-24 h-24 rounded-full overflow-hidden" style={{ border: "3px solid rgba(126,213,111,0.4)", background: "#111" }}>
                  {fotoUrl ? (
                    <img src={fotoUrl} alt="Tu foto" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">📷</div>
                  )}
                </div>
                <div className="flex-1">
                  <label className={`inline-block px-5 py-2.5 text-sm font-semibold rounded-xl cursor-pointer transition ${subiendoFoto ? "opacity-50 pointer-events-none" : ""}`}
                    style={{ background: "linear-gradient(135deg,#7ed56f,#5cb848)", color: "#1a1a12" }}>
                    {subiendoFoto ? "Subiendo…" : fotoUrl ? "Cambiar foto" : "Subir foto"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={e => e.target.files?.[0] && subirFoto(e.target.files[0])}
                      disabled={subiendoFoto} />
                  </label>
                  {fotoUrl && (
                    <button onClick={() => setFotoUrl("")} className="ml-3 text-xs" style={{ color: "#ef4444" }}>Quitar foto</button>
                  )}
                  <p className="text-xs mt-2" style={{ color: "#706a58" }}>JPG o PNG, máximo 3 MB</p>
                </div>
              </div>
            </div>

            {/* Datos personales */}
            <div className="card-game p-6 space-y-4">
              <h2 className="font-bold" style={{ color: "#f0ebe0" }}>👤 Datos personales</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Nombre" value={form.nombre} onChange={e => f("nombre", e.target.value)} className="input-game" />
                <input placeholder="Apellidos" value={form.apellidos} onChange={e => f("apellidos", e.target.value)} className="input-game" />
                <input placeholder="Título profesional (ej: Operario · Atención al Cliente)" value={form.subtitulo}
                  onChange={e => f("subtitulo", e.target.value)} className="input-game sm:col-span-2" />
                <input placeholder="Teléfono" value={form.telefono} onChange={e => f("telefono", e.target.value)} className="input-game" />
                <input placeholder="Email" value={form.email} onChange={e => f("email", e.target.value)} className="input-game" />
                <input placeholder="Ciudad, Provincia CP" value={form.ciudad}
                  onChange={e => f("ciudad", e.target.value)} className="input-game sm:col-span-2" />
              </div>
            </div>

            {/* Experiencia */}
            <div className="card-game p-6 space-y-4">
              <h2 className="font-bold" style={{ color: "#f0ebe0" }}>💼 Experiencia laboral</h2>
              {form.experiencia.map((exp, i) => (
                <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: "rgba(42,42,30,0.5)", border: "1px solid #3d3c30" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold" style={{ color: "#7ed56f" }}>Experiencia {i + 1}</span>
                    {form.experiencia.length > 1 && (
                      <button onClick={() => setForm(p => ({ ...p, experiencia: p.experiencia.filter((_, j) => j !== i) }))}
                        className="text-xs" style={{ color: "#ef4444" }}>Eliminar</button>
                    )}
                  </div>
                  <input placeholder="Fechas (ej: May 2021 – Sep 2025)" value={exp.fechas}
                    onChange={e => updExp(i, "fechas", e.target.value)} className="input-game" />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Puesto" value={exp.puesto} onChange={e => updExp(i, "puesto", e.target.value)} className="input-game" />
                    <input placeholder="Empresa" value={exp.empresa} onChange={e => updExp(i, "empresa", e.target.value)} className="input-game" />
                  </div>
                  <input placeholder="Ubicación" value={exp.ubicacion} onChange={e => updExp(i, "ubicacion", e.target.value)} className="input-game" />
                  <textarea placeholder="Tareas (una por línea)" value={exp.descripcion} rows={3}
                    onChange={e => updExp(i, "descripcion", e.target.value)} className="input-game resize-none" />
                </div>
              ))}
              <button onClick={() => setForm(p => ({ ...p, experiencia: [...p.experiencia, { fechas: "", puesto: "", empresa: "", ubicacion: "", descripcion: "" }] }))}
                className="text-sm font-medium" style={{ color: "#7ed56f" }}>+ Añadir experiencia</button>
            </div>

            {/* Formación */}
            <div className="card-game p-6 space-y-4">
              <h2 className="font-bold" style={{ color: "#f0ebe0" }}>🎓 Formación</h2>
              {form.formacion.map((edu, i) => (
                <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: "rgba(42,42,30,0.5)", border: "1px solid #3d3c30" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold" style={{ color: "#f0c040" }}>Formación {i + 1}</span>
                    {form.formacion.length > 1 && (
                      <button onClick={() => setForm(p => ({ ...p, formacion: p.formacion.filter((_, j) => j !== i) }))}
                        className="text-xs" style={{ color: "#ef4444" }}>Eliminar</button>
                    )}
                  </div>
                  <input placeholder="Título / Estudios" value={edu.titulo}
                    onChange={e => updEdu(i, "titulo", e.target.value)} className="input-game" />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Centro" value={edu.centro} onChange={e => updEdu(i, "centro", e.target.value)} className="input-game" />
                    <input placeholder="Ubicación" value={edu.ubicacion} onChange={e => updEdu(i, "ubicacion", e.target.value)} className="input-game" />
                  </div>
                </div>
              ))}
              <button onClick={() => setForm(p => ({ ...p, formacion: [...p.formacion, { titulo: "", centro: "", ubicacion: "" }] }))}
                className="text-sm font-medium" style={{ color: "#f0c040" }}>+ Añadir formación</button>
            </div>

            {/* Habilidades */}
            <div className="card-game p-6 space-y-4">
              <h2 className="font-bold" style={{ color: "#f0ebe0" }}>🎯 Habilidades</h2>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "#b0a890" }}>Aptitudes (separadas por comas)</label>
                <input placeholder="Trabajo en equipo, Organización, Polivalente…" value={form.aptitudes}
                  onChange={e => f("aptitudes", e.target.value)} className="input-game" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "#b0a890" }}>Idiomas (nombre:nivel 0–100, separados por comas)</label>
                <input placeholder="Español:95, Inglés:30, Francés:15" value={form.idiomas}
                  onChange={e => f("idiomas", e.target.value)} className="input-game" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "#b0a890" }}>Perfil profesional (opcional — la IA lo mejora)</label>
                <textarea placeholder="Escribe un resumen o déjalo vacío y la IA lo creará…" value={form.perfilProfesional}
                  onChange={e => f("perfilProfesional", e.target.value)} rows={3} className="input-game resize-none" />
              </div>
            </div>

            <div className="flex justify-end pb-8">
              <button onClick={generarYMejorar} disabled={procesando || !form.nombre.trim()}
                className="btn-game px-12 py-3 text-base disabled:opacity-50">
                {procesando ? "Generando con IA…" : "✨ Generar CV con IA →"}
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 2: CV CON IA ─────────────────────────────────── */}
        {paso === "mejorado" && mejoradoHTML && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl text-sm font-medium"
              style={{ background: "rgba(126,213,111,0.1)", color: "#7ed56f", border: "1px solid rgba(126,213,111,0.2)" }}>
              ✅ Tu CV ha sido mejorado con IA
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-bold text-lg" style={{ color: "#f0ebe0" }}>CV mejorado con IA</h2>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setPaso("form")}
                  className="px-4 py-2 text-sm rounded-xl" style={{ border: "1px solid #3d3c30", color: "#b0a890" }}>
                  ← Editar datos
                </button>
                <button onClick={() => descargar(mejoradoHTML)}
                  className="btn-game px-6 py-2 text-sm">
                  ⬇️ Descargar PDF
                </button>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid rgba(126,213,111,0.3)" }}>
              <iframe ref={iframeMejRef} srcDoc={mejoradoHTML} className="w-full bg-white"
                style={{ height: "900px", border: "none" }} title="CV Mejorado" />
            </div>
            <div className="text-center py-4">
              <button onClick={() => router.push("/app/buscar")}
                className="btn-game px-12 py-3 text-base">
                🔍 Siguiente: Buscar ofertas →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
