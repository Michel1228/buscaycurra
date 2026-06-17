"use client";

/**
 * Curriculum — Generador de CV profesional con previsualización EN VIVO
 * Layout de 2 columnas: formulario (izq) + plantilla siempre visible (der)
 * La plantilla se actualiza en tiempo real al escribir.
 * 1. Subir PDF (extrae datos automáticamente)
 * 2. Foto profesional + tips
 * 3. Formulario completo con plantilla profesional
 * 4. Mejorar CV con IA
 * 5. Descargar PDF
 * 6. Auto-guardado
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { generarCVHTML } from "@/lib/cv-generator/cv-template";
import type { CVData } from "@/lib/cv-generator/cv-template";
import InfoTooltip from "@/components/InfoTooltip";

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

interface CVListItem {
  id: string;
  nombre: string;
  created_at: string;
  updated_at: string;
}

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
  const [descargando, setDescargando] = useState(false);
  const [esPreviewIA, setEsPreviewIA] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Múltiples CVs ──
  const [listaCVs, setListaCVs] = useState<CVListItem[]>([]);
  const [cvActivoId, setCvActivoId] = useState<string>("");

  // ── LIVE PREVIEW: genera HTML en tiempo real con cada cambio del formulario ──
  const livePreviewHTML = useMemo(() => {
    if (!form.nombre.trim()) return "";
    return generarCVHTML(formToCVDataRaw());
  }, [form.nombre, form.apellidos, form.subtitulo, form.telefono, form.email, form.ciudad,
      form.perfilProfesional, form.aptitudes, form.idiomas,
      JSON.stringify(form.experiencia), JSON.stringify(form.formacion), fotoUrl]);

  // ⚠️ NO incluye useMemo como dependencia — necesitamos la función pura
  function formToCVDataRaw(): CVData {
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
      perfilProfesional: form.perfilProfesional || undefined,
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
          if (data.visibleEmpresas !== undefined) {
            setVisibleEmpresas(data.visibleEmpresas === true);
          }
          if (data.cv) {
            const cv = data.cv as Record<string, unknown>;

            // Normalizar experiencia
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

            // Normalizar formacion
            let formacion = emptyForm.formacion;
            if (Array.isArray(cv.formacion) && (cv.formacion as unknown[]).length > 0) {
              formacion = (cv.formacion as Record<string, unknown>[]).map(f => ({
                titulo: String(f.titulo || ""),
                centro: String(f.centro || ""),
                ubicacion: String(f.ubicacion || ""),
              }));
            }

            const aptRaw = cv.aptitudes || cv.habilidades || cv.skills;
            const aptitudes = Array.isArray(aptRaw)
              ? (aptRaw as string[]).join(", ")
              : String(aptRaw || "");

            const idiomasRaw = cv.idiomas || cv.languages;
            const idiomas = Array.isArray(idiomasRaw)
              ? (idiomasRaw as Record<string, unknown>[]).map(i =>
                  typeof i === "string" ? i : `${i.nombre}:${i.nivel || 70}`
                ).join(", ")
              : String(idiomasRaw || "");

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

      const { data: p } = await getSupabaseBrowser().from("profiles")
        .select("full_name, phone, ciudad, sector")
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
      }

      setCargando(false);
    }
    init();
  }, [router]);

  // Cargar lista de CVs cuando tengamos token
  useEffect(() => {
    if (token) { cargarListaCVs(); }
  }, [token]);

  // Auto-guardar
  useEffect(() => {
    if (!userId) return;
    const timeout = setTimeout(() => {
      guardarCV();
    }, 3000);
    return () => clearTimeout(timeout);
  }, [form, fotoUrl, userId]);

  // ── Funciones auxiliares (sin cambios funcionales) ──
  async function toggleVisibilidad(value: boolean) {
    setVisibleEmpresas(value);
    if (!token) return;
    try {
      const res = await fetch("/api/perfil/visibilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ visible: value }),
      });
      if (!res.ok) throw new Error("Error del servidor");
    } catch {
      setVisibleEmpresas(!value);
      setError("No se pudo guardar la visibilidad. Inténtalo de nuevo.");
    }
  }

  async function cargarListaCVs() {
    if (!token) return;
    try {
      const res = await fetch("/api/cv/lista", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json() as { cvs: CVListItem[] };
        setListaCVs(data.cvs || []);
        if (!cvActivoId && data.cvs?.length > 0) {
          setCvActivoId(data.cvs[0].id);
        }
      }
    } catch { /* ignorar */ }
  }

  async function cargarCVporId(cvId: string) {
    if (!token) return;
    try {
      const res = await fetch("/api/cv/lista", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: cvId }),
      });
      if (res.ok) {
        const data = await res.json() as { form_data?: Record<string, unknown>; nombre?: string; error?: string };
        if (data.error) { setError(data.error); return; }
        if (data.form_data) {
          const fd = data.form_data as Record<string, unknown>;
          setForm({
            nombre: String(fd.nombre || ""),
            apellidos: String(fd.apellidos || ""),
            subtitulo: String(fd.subtitulo || ""),
            telefono: String(fd.telefono || ""),
            email: String(fd.email || ""),
            ciudad: String(fd.ciudad || ""),
            perfilProfesional: String(fd.perfilProfesional || ""),
            aptitudes: String(fd.aptitudes || ""),
            idiomas: String(fd.idiomas || ""),
            experiencia: Array.isArray(fd.experiencia) && fd.experiencia.length > 0
              ? fd.experiencia as Exp[]
              : [{ fechas: "", puesto: "", empresa: "", ubicacion: "", descripcion: "" }],
            formacion: Array.isArray(fd.formacion) && fd.formacion.length > 0
              ? fd.formacion as Edu[]
              : [{ titulo: "", centro: "", ubicacion: "" }],
          });
          if (fd.fotoUrl) setFotoUrl(String(fd.fotoUrl));
        }
        setCvActivoId(cvId);
        setMejoradoHTML("");
        setEsPreviewIA(false);
      }
    } catch { setError("Error cargando CV"); }
  }

  async function guardarComoNuevo() {
    if (!token || !userId) return;
    const nombre = prompt("Nombre para esta versión del CV:", `CV ${new Date().toLocaleDateString("es-ES")}`);
    if (!nombre) return;
    setGuardando(true);
    try {
      const cvData = { ...form, fotoUrl: fotoUrl || undefined };
      const html = generarCVHTML(formToCVDataRaw());
      const res = await fetch("/api/cv/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre, html, formData: cvData }),
      });
      if (res.ok) {
        const nuevo = await res.json() as { id: string };
        setCvActivoId(nuevo.id);
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2000);
        await cargarListaCVs();
      } else {
        setError("No se pudo guardar el CV");
      }
    } catch { setError("Error guardando CV"); }
    finally { setGuardando(false); }
  }

  async function eliminarCV(cvId: string) {
    if (!token || !confirm("¿Eliminar esta versión del CV?")) return;
    try {
      const res = await fetch(`/api/cv/borrar/${cvId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setListaCVs(prev => prev.filter(c => c.id !== cvId));
        if (cvActivoId === cvId) {
          setCvActivoId("");
          setForm(emptyForm);
        }
      }
    } catch { setError("Error eliminando CV"); }
  }

  async function guardarCV() {
    if (!userId) return;
    try {
      const cvData = { ...form, fotoUrl: fotoUrl || undefined };
      const res = await fetch("/api/gusi/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, cvData, cvText: JSON.stringify(cvData) }),
      });
      if (!res.ok) {
        setError("No se pudo guardar el CV. Inténtalo de nuevo.");
        return;
      }
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
      await cargarListaCVs();
    } catch {
      setError("Error de conexión al guardar el CV.");
    }
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

  function formToCVData(perfilMejorado?: string, experienciaOverride?: Exp[]): CVData {
    const expBase = experienciaOverride ?? form.experiencia;
    const expOrdenada = [...expBase]
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

      const experienciaMejorada = [...form.experiencia];
      for (let i = 0; i < Math.min(form.experiencia.length, 3); i++) {
        const exp = form.experiencia[i];
        if (!exp.descripcion.trim() || !exp.puesto.trim()) continue;
        try {
          const expRes = await fetch("/api/cv/mejorar", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              cvText: `Puesto: ${exp.puesto}${exp.empresa ? ` en ${exp.empresa}` : ""}.\nFunciones realizadas:\n${exp.descripcion}`,
              jobTitle: exp.puesto,
            }),
          });
          if (expRes.ok) {
            const expData = await expRes.json();
            if (expData.cvMejorado) {
              experienciaMejorada[i] = { ...exp, descripcion: expData.cvMejorado };
            }
          }
        } catch { /* mantiene descripción original si la IA falla */ }
      }

      setForm(prev => ({ ...prev, experiencia: experienciaMejorada }));

      const html = generarCVHTML(formToCVData(perfilMejorado, experienciaMejorada));
      setMejoradoHTML(html);
      setEsPreviewIA(true);
    } catch { setError("Error al generar el CV"); }
    finally { setProcesando(false); }
  }

  async function descargarPDF() {
    const htmlToUse = mejoradoHTML || livePreviewHTML;
    if (!htmlToUse || descargando) return;
    setDescargando(true);
    try {
      const res = await fetch("/api/cv/pdf-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: htmlToUse }),
      });
      if (!res.ok) throw new Error("Error generando PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "CV_BuscayCurra.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.print();
      }
    } finally {
      setDescargando(false);
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

  // ── Completitud checks ──
  const completitudChecks = [
    { label: "Nombre", done: !!form.nombre.trim() },
    { label: "Teléfono", done: !!form.telefono.trim() },
    { label: "Ciudad", done: !!form.ciudad.trim() },
    { label: "Puesto", done: !!form.subtitulo.trim() },
    { label: "Perfil", done: form.perfilProfesional.trim().length > 30 },
    { label: "Experiencia", done: form.experiencia.some(e => e.puesto.trim()) },
    { label: "Aptitudes", done: !!form.aptitudes.trim() },
    { label: "Foto", done: !!fotoUrl },
  ];
  const doneCount = completitudChecks.filter(c => c.done).length;
  const pct = Math.round((doneCount / completitudChecks.length) * 100);
  const completitudColor = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";

  // ── HTML para la preview (IA o en vivo) ──
  const previewHTML = mejoradoHTML || livePreviewHTML;

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      {/* Header */}
      <div className="px-4 py-6" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
        <div className="max-w-[100rem] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Mi Currículum</h1>
            <p className="text-xs mt-1 text-white/80">Completa tus datos — la plantilla se actualiza en vivo</p>
          </div>
          <div className="flex items-center gap-3">
            {/* ── Selector de CVs ── */}
            {listaCVs.length > 0 && (
              <div className="flex items-center gap-1.5">
                <select
                  value={cvActivoId}
                  onChange={(e) => { const id = e.target.value; if (id) cargarCVporId(id); }}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", maxWidth: "180px" }}
                >
                  {listaCVs.map(cv => (
                    <option key={cv.id} value={cv.id} style={{ background: "#1e212b", color: "#f1f5f9" }}>
                      {cv.nombre || "Sin nombre"}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => cvActivoId && eliminarCV(cvActivoId)}
                  className="text-[10px] px-1.5 py-1 rounded opacity-50 hover:opacity-100"
                  style={{ color: "#ef4444" }}
                  title="Eliminar esta versión"
                >🗑</button>
              </div>
            )}
            <button
              onClick={guardarComoNuevo}
              disabled={guardando}
              className="text-[10px] px-2 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
            >
              {guardando ? "..." : "💾 Nueva versión"}
            </button>
            {guardado && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/20 text-white">
                ✅ Guardado
              </span>
            )}
            {!mejoradoHTML && (
              <button onClick={generarYMejorar} disabled={procesando}
                className="px-4 py-2 text-xs font-semibold rounded-xl transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #fff, #e2e8f0)", color: "#16a34a" }}>
                {procesando ? "Mejorando..." : "✨ Mejorar con IA"}
              </button>
            )}
            {previewHTML && (
              <button onClick={descargarPDF} disabled={descargando}
                className="px-4 py-2 text-xs font-semibold rounded-xl disabled:opacity-70"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
                {descargando ? "Generando..." : "⬇ PDF"}
              </button>
            )}
            {mejoradoHTML && (
              <button onClick={() => { setMejoradoHTML(""); setEsPreviewIA(false); }}
                className="px-3 py-2 text-xs rounded-xl"
                style={{ border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
                ← Volver a vivo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de completitud */}
      <div className="px-4 py-3 max-w-[100rem] mx-auto">
        <div className="rounded-xl p-4" style={{ background: "#161922", border: "1px solid #252836" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>
              Completitud del CV
            </p>
            <span className="text-sm font-bold" style={{ color: completitudColor }}>{pct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: "#252836" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${completitudColor}, ${completitudColor}cc)` }} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {completitudChecks.map(c => (
              <span key={c.label}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: c.done ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
                  color: c.done ? "#22c55e" : "#94a3b8",
                  border: `1px solid ${c.done ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)"}`,
                }}>
                {c.done ? "✓" : "○"} {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── LAYOUT 2 COLUMNAS: formulario + previsualización EN VIVO ── */}
      <main className="max-w-[100rem] mx-auto px-4 py-6">
        {error && (
          <div className={`mb-4 p-3 rounded-lg text-xs ${error.startsWith("✅") ? "" : ""}`}
            style={{ background: error.startsWith("✅") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", 
                     color: error.startsWith("✅") ? "#22c55e" : "#ef4444",
                     border: `1px solid ${error.startsWith("✅") ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}` }}>
            {error}
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-6">
          {/* ── COLUMNA IZQUIERDA: Formulario ── */}
          <div className="flex-1 min-w-0 xl:max-w-[50%] space-y-5">
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

              <div className="p-3 rounded-lg" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#22c55e" }}>💡 Truco: Foto profesional gratis con IA</p>
                <p className="text-[11px] mb-2" style={{ color: "#94a3b8" }}>Hazte un selfie, copia el prompt y pégalo en ChatGPT con tu foto:</p>
                <div className="p-2.5 rounded-md text-[10px] leading-relaxed font-mono" style={{ background: "#0a0c10", color: "#94a3b8", border: "1px solid #2d3142" }}>
                  Utiliza personajes pero en tamaño carnet desde los hombros ponme la camisa blanca y adaptada para un currículum que sea fiel a las características de rostro
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("Utiliza personajes pero en tamaño carnet desde los hombros ponme la camisa blanca y adaptada para un currículum que sea fiel a las características de rostro");
                    }}
                    className="px-3 py-1 text-[10px] font-semibold rounded-md" style={{ background: "#22c55e", color: "#fff" }}>
                    1. Copiar prompt
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("Utiliza personajes pero en tamaño carnet desde los hombros ponme la camisa blanca y adaptada para un currículum que sea fiel a las características de rostro");
                      window.open("https://chatgpt.com", "_blank");
                    }}
                    className="px-3 py-1 text-[10px] font-semibold rounded-md"
                    style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
                    2. Abrir ChatGPT →
                  </button>
                </div>
              </div>
            </div>

            {/* Datos personales */}
            <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>👤 Datos personales</h2>
                <InfoTooltip text="Tu nombre, teléfono, email y ciudad aparecen en la cabecera del CV. El título profesional resume tu perfil (ej: 'Camarero con 5 años de experiencia')." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="sr-only" htmlFor="cv-nombre">Nombre</label>
                <input id="cv-nombre" placeholder="Nombre" value={form.nombre} onChange={e => f("nombre", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <label className="sr-only" htmlFor="cv-apellidos">Apellidos</label>
                <input id="cv-apellidos" placeholder="Apellidos" value={form.apellidos} onChange={e => f("apellidos", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <label className="sr-only" htmlFor="cv-subtitulo">Título profesional</label>
                <input id="cv-subtitulo" placeholder="Título profesional" value={form.subtitulo} onChange={e => f("subtitulo", e.target.value)}
                  className="sm:col-span-2 w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <label className="sr-only" htmlFor="cv-telefono">Teléfono</label>
                <input id="cv-telefono" placeholder="Teléfono" value={form.telefono} onChange={e => f("telefono", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <label className="sr-only" htmlFor="cv-email">Email</label>
                <input id="cv-email" placeholder="Email" value={form.email} onChange={e => f("email", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <label className="sr-only" htmlFor="cv-ciudad">Ciudad</label>
                <input id="cv-ciudad" placeholder="Ciudad" value={form.ciudad} onChange={e => f("ciudad", e.target.value)}
                  className="sm:col-span-2 w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                  style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
              </div>
            </div>

            {/* Experiencia */}
            <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>💼 Experiencia laboral</h2>
                <InfoTooltip text="Añade tus trabajos del más reciente al más antiguo. Incluye fechas, puesto, empresa y una descripción breve de tus tareas con verbos de acción (Gestioné, Coordiné...)." />
              </div>
              {form.experiencia.map((exp, i) => (
                <div key={i} className="p-3 rounded-lg space-y-2.5 mb-3" style={{ background: "#0f1117", border: "1px solid #252836" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold" style={{ color: "#22c55e" }}>Experiencia {i + 1}</span>
                    {form.experiencia.length > 1 && (
                      <button onClick={() => setForm(p => ({ ...p, experiencia: p.experiencia.filter((_, j) => j !== i) }))}
                        className="text-[11px]" style={{ color: "#ef4444" }}>Eliminar</button>
                    )}
                  </div>
                  <label className="sr-only" htmlFor={`cv-exp-fechas-${i}`}>Fechas</label>
                  <input id={`cv-exp-fechas-${i}`} placeholder="Fechas (ej: 2020 - 2023)" value={exp.fechas}
                    onChange={e => updExp(i, "fechas", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="sr-only" htmlFor={`cv-exp-puesto-${i}`}>Puesto</label>
                    <input id={`cv-exp-puesto-${i}`} placeholder="Puesto" value={exp.puesto} onChange={e => updExp(i, "puesto", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                    <label className="sr-only" htmlFor={`cv-exp-empresa-${i}`}>Empresa</label>
                    <input id={`cv-exp-empresa-${i}`} placeholder="Empresa" value={exp.empresa} onChange={e => updExp(i, "empresa", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                  </div>
                  <label className="sr-only" htmlFor={`cv-exp-ubicacion-${i}`}>Ubicación</label>
                  <input id={`cv-exp-ubicacion-${i}`} placeholder="Ubicación" value={exp.ubicacion} onChange={e => updExp(i, "ubicacion", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                  <label className="sr-only" htmlFor={`cv-exp-descripcion-${i}`}>Descripción</label>
                  <textarea id={`cv-exp-descripcion-${i}`} placeholder="Descripción de tareas (una por línea)" value={exp.descripcion} rows={3}
                    onChange={e => updExp(i, "descripcion", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-sm resize-none" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                </div>
              ))}
              <button onClick={() => setForm(p => ({ ...p, experiencia: [...p.experiencia, { fechas: "", puesto: "", empresa: "", ubicacion: "", descripcion: "" }] }))}
                className="text-xs font-medium" style={{ color: "#22c55e" }}>+ Añadir experiencia</button>
            </div>

            {/* Formación */}
            <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>🎓 Formación</h2>
                <InfoTooltip text="Tus estudios y cursos relevantes. Incluye el título (ej: ESO, FP, Grado), el centro educativo y la ciudad." />
              </div>
              {form.formacion.map((edu, i) => (
                <div key={i} className="p-3 rounded-lg space-y-2.5 mb-3" style={{ background: "#0f1117", border: "1px solid #252836" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold" style={{ color: "#f59e0b" }}>Formación {i + 1}</span>
                    {form.formacion.length > 1 && (
                      <button onClick={() => setForm(p => ({ ...p, formacion: p.formacion.filter((_, j) => j !== i) }))}
                        className="text-[11px]" style={{ color: "#ef4444" }}>Eliminar</button>
                    )}
                  </div>
                  <label className="sr-only" htmlFor={`cv-edu-titulo-${i}`}>Título / Estudios</label>
                  <input id={`cv-edu-titulo-${i}`} placeholder="Título / Estudios" value={edu.titulo}
                    onChange={e => updEdu(i, "titulo", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="sr-only" htmlFor={`cv-edu-centro-${i}`}>Centro</label>
                    <input id={`cv-edu-centro-${i}`} placeholder="Centro" value={edu.centro} onChange={e => updEdu(i, "centro", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                    <label className="sr-only" htmlFor={`cv-edu-ubicacion-${i}`}>Ubicación</label>
                    <input id={`cv-edu-ubicacion-${i}`} placeholder="Ubicación" value={edu.ubicacion} onChange={e => updEdu(i, "ubicacion", e.target.value)}
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
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>🎯 Habilidades</h2>
                  <InfoTooltip text="Tus puntos fuertes separados por comas. Ej: Trabajo en equipo, Excel, Liderazgo, Resolución de problemas." position="right" />
                </div>
                <label className="sr-only" htmlFor="cv-aptitudes">Habilidades</label>
                <input id="cv-aptitudes" placeholder="Separadas por comas" value={form.aptitudes}
                  onChange={e => f("aptitudes", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm" style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
              </div>
              <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>🌍 Idiomas</h2>
                  <InfoTooltip text="Escribe cada idioma con un nivel del 0 al 100. Ej: Español:95, Inglés:60, Francés:40. El número controla la barra de progreso en el CV." position="left" />
                </div>
                <label className="sr-only" htmlFor="cv-idiomas">Idiomas</label>
                <input id="cv-idiomas" placeholder="Español:95, Inglés:60, Francés:40" value={form.idiomas}
                  onChange={e => f("idiomas", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm" style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
                <p className="text-[10px] mt-1" style={{ color: "#475569" }}>Formato: Idioma:nivel (0-100). Ej: Español:95, Inglés:60</p>
              </div>
            </div>

            {/* Perfil profesional */}
            <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>📝 Perfil profesional (opcional)</h2>
                <InfoTooltip text="2-3 frases que resumen quién eres como profesional. Si lo dejas vacío, la IA lo generará automáticamente a partir de tu experiencia." />
              </div>
              <label className="sr-only" htmlFor="cv-perfil-profesional">Perfil profesional</label>
              <textarea id="cv-perfil-profesional" placeholder="Breve descripción de ti como profesional... (la IA lo mejorará)"
                value={form.perfilProfesional} onChange={e => f("perfilProfesional", e.target.value)} rows={3}
                className="w-full px-4 py-2.5 rounded-lg text-sm resize-none" style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }} />
            </div>
          </div>

          {/* ── COLUMNA DERECHA: Previsualización EN VIVO ── */}
          <div className="flex-1 min-w-0 xl:sticky xl:top-20 xl:max-w-[50%]">
            <div className="rounded-xl overflow-hidden" style={{ border: "2px solid #22c55e40", background: "#fff" }}>
              {/* Cabecera de la preview */}
              <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "#161922", borderBottom: "1px solid #252836" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
                  <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>
                    {mejoradoHTML ? "CV Mejorado con IA ✨" : "Previsualización en vivo"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {mejoradoHTML && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                      IA activa
                    </span>
                  )}
                  {previewHTML && (
                    <button
                      onClick={() => setFullscreen(true)}
                      className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition hover:scale-105"
                      style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}
                      title="Ver en pantalla completa"
                    >
                      ⛶ Pantalla completa
                    </button>
                  )}
                </div>
              </div>

              {previewHTML ? (
                <iframe
                  ref={iframeRef}
                  srcDoc={previewHTML}
                  className="w-full bg-white"
                  style={{ height: "1100px", border: "none", maxHeight: "calc(100vh - 200px)" }}
                  title="CV en vivo"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-6" style={{ background: "#f8fafc", minHeight: "400px" }}>
                  <div className="text-5xl mb-4 opacity-30">📄</div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Tu CV aparecerá aquí</p>
                  <p className="text-xs text-slate-300 text-center max-w-xs">
                    Escribe tu nombre y completa los campos de la izquierda para ver la plantilla en tiempo real
                  </p>
                </div>
              )}
            </div>

            {/* Acciones rápidas debajo de la preview */}
            <div className="mt-4 flex gap-3 flex-wrap">
              <button onClick={generarYMejorar} disabled={procesando || !form.nombre.trim()}
                className="flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                {procesando ? "✨ Mejorando..." : "✨ Mejorar con IA"}
              </button>
              <button onClick={descargarPDF} disabled={descargando || !previewHTML}
                className="flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition disabled:opacity-50"
                style={{ background: "#1e212b", border: "1.5px solid #22c55e", color: "#22c55e" }}>
                {descargando ? "Generando PDF..." : "⬇ Descargar PDF"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── FULLSCREEN CV ── */}
      {fullscreen && previewHTML && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col"
          style={{ background: "#0f1117" }}
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: "#161922", borderBottom: "1px solid #252836" }}>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
              <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>
                {mejoradoHTML ? "CV Mejorado con IA ✨" : "Vista previa del CV"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setFullscreen(false); }}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition hover:scale-105"
                style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                ✕ Cerrar
              </button>
              <button
                onClick={descargarPDF}
                disabled={descargando}
                className="text-xs px-4 py-1.5 rounded-lg font-semibold transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
              >
                {descargando ? "Generando..." : "⬇ Descargar PDF"}
              </button>
            </div>
          </div>
          {/* Iframe a pantalla completa */}
          <div className="flex-1 overflow-auto flex justify-center bg-neutral-200 py-4">
            <iframe
              srcDoc={previewHTML}
              className="bg-white shadow-2xl"
              style={{ width: "210mm", minHeight: "297mm", border: "none", maxWidth: "100%" }}
              title="CV en pantalla completa"
            />
          </div>
        </div>
      )}

    </div>
  );
}
