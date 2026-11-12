"use client";

import SelectorIdiomas from "@/components/cv/SelectorIdiomas";
import TusReferencias from "@/components/cv/TusReferencias";
import Link from "next/link";

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

import { Trash2, Save, Check, Palette, User, GraduationCap, PenLine, Globe, FileText } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { descargarCVComoPDF } from "@/lib/cv-generator/descargar-pdf";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { generarCV, LISTA_PLANTILLAS, PLANTILLAS, TEMPLATE_IDS, type TemplateId } from "@/lib/cv-generator/plantillas";
import { normalizar } from "@/lib/cv-generator/normalizar";
import { CV_EJEMPLO } from "@/lib/cv-generator/ejemplo";
import type { CVData } from "@/lib/cv-generator/cv-template";
import { IDIOMAS_CV } from "@/lib/cv-generator/idiomas-cv";
import InfoTooltip from "@/components/InfoTooltip";
import { fotoParaSubir } from "@/lib/imagen/foto-para-subir";

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
  // Si viene de una oferta ("Crear CV primero"), se le ofrece volver a ella
  // para mandar el CV. Antes, al hacer el CV, la oferta se perdía (18 oct 2026).
  const [volver, setVolver] = useState<string | null>(null);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("volver");
    if (v && /^\/app\/ofertas\/[a-z0-9]{8,40}$/i.test(v)) setVolver(v);
  }, []);
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
  /** Si ya llegó el CV guardado. Hasta entonces NO se autoguarda (ver más abajo). */
  const [cvCargado, setCvCargado] = useState(false);
  const [visibleEmpresas, setVisibleEmpresas] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [esPreviewIA, setEsPreviewIA] = useState(false);
  /** Copia del CV de antes de pulsar "Mejorar con IA", para poder deshacer. */
  const [formAntesDeMejorar, setFormAntesDeMejorar] = useState<CVForm | null>(null);
  /** Qué ha reescrito la IA. Hace falta en el móvil, donde la vista previa no se ve. */
  const [avisoMejora, setAvisoMejora] = useState("");
  /** En el móvil, si se enseñan todas las plantillas o solo la elegida. */
  const [verPlantillas, setVerPlantillas] = useState(false);
  /** Lo último del formulario sin guardar todavía (ver el guardado al salir). */
  const datosAGuardarRef = useRef("");
  const pendienteRef = useRef(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [templateId, setTemplateId] = useState<TemplateId>("clasica");
  const [accentColor, setAccentColor] = useState("#16a34a");
  const [ejemploVista, setEjemploVista] = useState<TemplateId | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // HTML de ejemplo por plantilla (mismos datos, distinto estilo) — refleja el color elegido
  const ejemplosHTML = useMemo(
    () => Object.fromEntries(
      LISTA_PLANTILLAS.map(p => [p.id, p.generar({ ...CV_EJEMPLO, templateId: p.id, accentColor })])
    ) as Record<TemplateId, string>,
    [accentColor]
  );

  // ── CV traducido (lib/cv-generator/traducir.ts) ──
  // Va aparte del formulario: traducir NO cambia el CV en español. Se guarda el
  // contenido traducido y se pinta con la plantilla y el color de ahora, así
  // que cambiar de plantilla no obliga a volver a traducir.
  const [idiomaDestino, setIdiomaDestino] = useState<string>("en");
  const [traduciendo, setTraduciendo] = useState(false);
  const [traducido, setTraducido] = useState<CVData | null>(null);
  const [traducidoSinTraducir, setTraducidoSinTraducir] = useState(0);

  // ── Múltiples CVs ──
  const [listaCVs, setListaCVs] = useState<CVListItem[]>([]);
  const [cvActivoId, setCvActivoId] = useState<string>("");

  // ── LIVE PREVIEW: genera HTML en tiempo real con cada cambio del formulario ──
  const livePreviewHTML = useMemo(() => {
    if (!form.nombre.trim()) return "";
    return generarCV(formToCVDataRaw());
  }, [form.nombre, form.apellidos, form.subtitulo, form.telefono, form.email, form.ciudad,
      form.perfilProfesional, form.aptitudes, form.idiomas,
      JSON.stringify(form.experiencia), JSON.stringify(form.formacion), fotoUrl, templateId, accentColor]);

  // El CV traducido, con la plantilla, el color y la foto de ahora.
  const traducidoHTML = useMemo(() => {
    if (!traducido) return "";
    return generarCV({ ...traducido, templateId, accentColor, fotoUrl: fotoUrl || undefined });
  }, [traducido, templateId, accentColor, fotoUrl]);

  // Si se cambia el CV en español, la traducción ya no corresponde: se quita
  // para no descargar una versión vieja en otro idioma.
  const contenidoCV = JSON.stringify(form);
  useEffect(() => { setTraducido(null); }, [contenidoCV]);

  /**
   * El CV que se pinta, se descarga, se guarda y se ENVÍA sale de UNA sola
   * conversión: normalizar(), la misma que usa el envío a empresas.
   *
   * Había tres copias (la vista previa, la mejora con IA y el envío) y no
   * coincidían: el CV que recibía la empresa salía en otro orden, con la fila
   * en blanco del formulario y con un "Español 100 %" que la persona no había
   * puesto. Comprobado el 2 oct 2026 con los 40 CV guardados que se pueden
   * pintar: con normalizar() ya salen idénticos, byte a byte.
   */
  function formToCVDataRaw(): CVData {
    return formToCVDataDe(form);
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

            // Restaurar la plantilla y el color elegidos (si no, el autosave los machaca)
            if (typeof cv.templateId === "string" && (TEMPLATE_IDS as string[]).includes(cv.templateId)) {
              setTemplateId(cv.templateId as TemplateId);
            }
            if (typeof cv.accentColor === "string") setAccentColor(cv.accentColor);

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

      // A partir de aquí el formulario ya tiene lo que había guardado, así que
      // el autoguardado puede empezar sin peligro. Ver el comentario de abajo.
      setCvCargado(true);
      setCargando(false);
    }
    init();
  }, [router]);

  // Cargar lista de CVs cuando tengamos token
  useEffect(() => {
    if (token) { cargarListaCVs(); }
  }, [token]);

  // Auto-guardar
  //
  // ⚠️ EL GUARD DE `cvCargado` NO SE PUEDE QUITAR: sin él se pierde el CV.
  //
  // Antes esto solo miraba `userId`, que se pone nada más recuperar la sesión,
  // MUCHO antes de que llegue el CV guardado (son dos peticiones distintas).
  // Resultado: arrancaba el temporizador de 3 s con el formulario todavía
  // vacío, y si la carga del CV tardaba más de esos 3 s —cosa habitual, el
  // servidor va con un 85 % de CPU robada por el hipervisor— el autoguardado
  // disparaba primero y escribía el formulario VACÍO encima del CV bueno.
  //
  // No es hipotético: así se perdieron el nombre y el teléfono de una cuenta
  // real, quedando solo el email. Ahora no se guarda nada hasta que lo que hay
  // en pantalla es de verdad lo que estaba guardado.
  useEffect(() => {
    if (!userId || !cvCargado) return;
    // Lo último que hay en pantalla, listo para mandarse aunque se salga ya.
    datosAGuardarRef.current = JSON.stringify({
      userId,
      cvData: { ...form, fotoUrl: fotoUrl || undefined, templateId, accentColor },
      cvId: cvActivoId || undefined,
    });
    pendienteRef.current = true;
    const timeout = setTimeout(() => {
      guardarCV();
    }, 3000);
    return () => clearTimeout(timeout);
  }, [form, fotoUrl, userId, cvCargado, templateId, accentColor, cvActivoId]);

  // LO ÚLTIMO QUE SE ESCRIBE NO SE PIERDE AL SALIR.
  //
  // El autoguardado espera 3 s, y si en ese tiempo la persona cambiaba de
  // pantalla, recargaba o cerraba la app, el temporizador se cancelaba y el
  // cambio se perdía: el teléfono que acababa de corregir volvía a ser el viejo
  // (auditoría del 2 oct 2026). Ahora, si queda algo sin guardar, se manda al
  // salir de la pantalla, al ocultarse la app o al cerrarse la página.
  // `keepalive` hace que la petición termine aunque la página ya no esté.
  useEffect(() => {
    const guardarYa = () => {
      if (!pendienteRef.current || !datosAGuardarRef.current) return;
      pendienteRef.current = false;
      fetch("/api/gusi/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: datosAGuardarRef.current,
        keepalive: true,
      }).catch(() => { /* se volverá a guardar al volver */ });
    };
    const alOcultarse = () => { if (document.visibilityState === "hidden") guardarYa(); };
    document.addEventListener("visibilitychange", alOcultarse);
    window.addEventListener("pagehide", guardarYa);
    return () => {
      document.removeEventListener("visibilitychange", alOcultarse);
      window.removeEventListener("pagehide", guardarYa);
      guardarYa(); // cambiar de pantalla dentro de la app también desmonta esto
    };
  }, []);

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
          if (typeof fd.templateId === "string" && (TEMPLATE_IDS as string[]).includes(fd.templateId)) setTemplateId(fd.templateId as TemplateId);
          if (typeof fd.accentColor === "string") setAccentColor(fd.accentColor);
        }
        setCvActivoId(cvId);
        setMejoradoHTML("");
        setEsPreviewIA(false);
        setFormAntesDeMejorar(null);
        setAvisoMejora("");
      }
    } catch { setError("Error cargando CV"); }
  }

  async function guardarComoNuevo() {
    if (!token || !userId) return;
    const nombre = prompt("Nombre para esta versión del CV:", `CV ${new Date().toLocaleDateString("es-ES")}`);
    if (!nombre) return;
    setGuardando(true);
    try {
      const cvData = { ...form, fotoUrl: fotoUrl || undefined, templateId, accentColor };
      const html = generarCV(formToCVDataRaw());
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
        // 403 = límite de CVs del plan alcanzado → mostrar el mensaje del servidor
        const err = await res.json().catch(() => ({}));
        setError((err as { error?: string }).error || "No se pudo guardar el CV");
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
      // cvId: el autosave actualiza el CV que está abierto, no el último tocado.
      // El CV montado (columna "html") ya no lo manda la pantalla: lo monta el
      // servidor desde los datos (lib/cv-generator/html-guardado.ts). Aquí iba
      // JSON.stringify(cvData), y "CVs guardados" descargaba ese texto en bruto.
      const enviado = datosAGuardarRef.current || JSON.stringify({
        userId,
        cvData: { ...form, fotoUrl: fotoUrl || undefined, templateId, accentColor },
        cvId: cvActivoId || undefined,
      });
      const res = await fetch("/api/gusi/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: enviado,
      });
      // Solo se da por guardado si nadie ha escrito nada nuevo mientras tanto.
      if (res.ok && datosAGuardarRef.current === enviado) pendienteRef.current = false;
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
    // EL IPHONE NO SIEMPRE DICE QUE ES UN PDF.
    //
    // Cuando el fichero se elige desde Archivos o iCloud Drive, iOS entrega
    // `file.type` VACÍO. Comparar contra "application/pdf" a secas rechazaba
    // el currículum antes de subirlo, así que el usuario de iPhone veía "Solo
    // se aceptan archivos PDF" con un PDF perfectamente válido en la mano, y
    // no llegaba ni a la parte que lee los datos.
    //
    // Se acepta por tipo O por extensión: basta con que una de las dos cosas
    // diga que es un PDF.
    const esPDF = file.type === "application/pdf"
      || file.type === "application/x-pdf"
      || /.pdf$/i.test(file.name);
    if (!esPDF) { setError("Solo se aceptan archivos PDF."); return; }
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
      // LA CABECERA HACE FALTA. /api/cv/extraer exige sesión y sin ella
      // devuelve 401, así que el autorrelleno no llegaba a ejecutarse nunca:
      // el usuario subía su PDF, veía "✅ PDF procesado" y los campos seguían
      // vacíos. La sesión ya estaba cogida diez líneas más arriba, para subir
      // el fichero; simplemente no se pasaba aquí.
      const extractRes = await fetch("/api/cv/extraer", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: extractData,
      });

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
      if (!extractRes.ok) {
        // Se dice lo que ha pasado. Antes salía "✅ PDF procesado" tanto si se
        // habían rellenado los campos como si no se había leído nada.
        setError("Tu PDF está guardado, pero no hemos podido leer los datos para rellenar los campos. Complétalos a mano.");
        setTimeout(() => setError(""), 6000);
      } else {
        setError("✅ PDF procesado — revisa los campos");
        setTimeout(() => setError(""), 3000);
      }
    } catch {
      setError("Error al procesar el PDF.");
    } finally {
      setSubiendoPDF(false);
    }
  }

  async function subirFoto(original: File) {
    if (!original.type.startsWith("image/")) { setError("Solo se aceptan imágenes."); return; }
    setSubiendoFoto(true);
    setError("");
    try {
      // Una foto del móvil pesa 3-6 MB y el límite es 3: se reduce antes (lib/imagen/foto-para-subir.ts).
      const file = await fotoParaSubir(original);
      if (file.size > 3 * 1024 * 1024) { setError("La imagen no puede superar 3 MB."); return; }
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

  /** El CV de un formulario concreto (el actual o el recién mejorado). */
  function formToCVDataDe(datos: CVForm): CVData {
    return normalizar({ ...datos, fotoUrl: fotoUrl || undefined, templateId, accentColor } as unknown as Record<string, unknown>);
  }

  /**
   * LA MEJORA SE ESCRIBE EN EL FORMULARIO, no solo en la vista previa.
   *
   * Antes el texto mejorado vivía únicamente en `mejoradoHTML`: el formulario
   * se quedaba con lo que había escrito la persona y al guardar se guardaba lo
   * de antes, así que la mejora se perdía al salir. Y por debajo de 1024 px la
   * vista previa está oculta, así que en el móvil pulsar "Mejorar con IA" no
   * cambiaba NADA a la vista. Michel lo contó el 2 oct 2026: "le das al botón
   * de mejorar y no mejora nada, lo deja tal cual".
   *
   * Ahora el texto mejorado entra en los campos —se ve, se puede retocar y se
   * guarda— y "Deshacer la mejora" devuelve el original.
   */
  async function generarYMejorar() {
    if (!form.nombre.trim()) { setError("Escribe tu nombre para continuar"); return; }
    setProcesando(true);
    setError("");
    setAvisoMejora("");
    try {
      const pedirMejora = async (cvText: string, jobTitle: string): Promise<string | null> => {
        const res = await fetch("/api/cv/mejorar", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ cvText, jobTitle }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(err.error || "La IA no ha podido con este texto.");
        }
        const data = await res.json() as { cvMejorado?: string };
        const texto = (data.cvMejorado || "").trim();
        return texto || null;
      };

      // Sin perfil escrito no hay nada que mejorar: se dice, en vez de
      // "mejorar" un texto de relleno que la persona no ha escrito.
      const hayPerfil = !!form.perfilProfesional.trim();
      const experienciasAMejorar = form.experiencia
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.descripcion.trim() && e.puesto.trim())
        .slice(0, 3);

      if (!hayPerfil && experienciasAMejorar.length === 0) {
        setError("Escribe tu perfil profesional o lo que hacías en algún trabajo, y vuelvo a intentarlo.");
        return;
      }

      const antes = form;
      let perfilMejorado: string | null = null;
      const fallos: string[] = [];

      // El tope por hora se cuenta por petición, y una pulsación son hasta
      // cuatro. Si se alcanza, se para y se dice UNA vez, en vez de repetir el
      // aviso con el nombre de cada puesto delante.
      let topeAlcanzado = "";
      const anotar = (e: unknown, donde: string) => {
        const err = e as Error & { parar?: boolean };
        if (err.parar) topeAlcanzado = err.message;
        else fallos.push(donde);
      };

      if (hayPerfil) {
        try {
          perfilMejorado = await pedirMejora(form.perfilProfesional, form.subtitulo);
        } catch (e) { anotar(e, "el perfil"); }
      }

      const experienciaMejorada = [...form.experiencia];
      for (const { e: exp, i } of experienciasAMejorar) {
        if (topeAlcanzado) break;
        try {
          const mejor = await pedirMejora(
            `Puesto: ${exp.puesto}${exp.empresa ? ` en ${exp.empresa}` : ""}.\nFunciones realizadas:\n${exp.descripcion}`,
            exp.puesto
          );
          if (mejor) experienciaMejorada[i] = { ...exp, descripcion: mejor };
        } catch (e) { anotar(e, exp.puesto); }
      }

      const cambios = (perfilMejorado ? 1 : 0)
        + experienciaMejorada.filter((e, i) => e.descripcion !== form.experiencia[i].descripcion).length;

      if (cambios === 0) {
        setError(topeAlcanzado || (fallos.length
          ? `No se ha podido mejorar ${fallos[0]}. Inténtalo otra vez.`
          : "La IA ha devuelto el mismo texto. Inténtalo otra vez."));
        return;
      }

      const nuevo: CVForm = {
        ...form,
        perfilProfesional: perfilMejorado || form.perfilProfesional,
        experiencia: experienciaMejorada,
      };
      setFormAntesDeMejorar(antes);
      setForm(nuevo);
      setMejoradoHTML(generarCV(formToCVDataDe(nuevo)));
      setEsPreviewIA(true);
      setAvisoMejora(
        `✨ Reescrito: ${cambios === 1 ? "1 apartado" : `${cambios} apartados`}. Está en tus campos, puedes retocarlo.`
        + (topeAlcanzado ? ` ${topeAlcanzado} Vuelve a darle para el resto.` : "")
        + (fallos.length ? ` No se pudo con ${fallos.length === 1 ? fallos[0] : `${fallos.length} apartados`}.` : "")
      );
    } catch { setError("Error al generar el CV"); }
    finally { setProcesando(false); }
  }

  /** Devuelve el CV a como estaba antes de pulsar "Mejorar con IA". */
  function deshacerMejora() {
    if (formAntesDeMejorar) setForm(formAntesDeMejorar);
    setFormAntesDeMejorar(null);
    setMejoradoHTML("");
    setEsPreviewIA(false);
    setAvisoMejora("");
  }

  async function descargarPDF() {
    const htmlToUse = traducidoHTML || mejoradoHTML || livePreviewHTML;
    if (!htmlToUse || descargando) return;
    setDescargando(true);
    setError("");
    // Todo el lío de bajarse el PDF está en un solo sitio, que lo comparte con
    // la pantalla de CVs guardados: lib/cv-generator/descargar-pdf.ts.
    const fallo = traducido
      ? await descargarCVComoPDF(htmlToUse, token, `CV_BuscayCurra_${(traducido.idioma || "").toUpperCase()}`)
      : await descargarCVComoPDF(htmlToUse, token);
    if (fallo) setError(fallo);
    setDescargando(false);
  }

  /** Traduce el CV al idioma elegido, sin tocar el formulario en español. */
  async function traducirCV() {
    if (traduciendo || !livePreviewHTML) return;
    setTraduciendo(true);
    setError("");
    try {
      const res = await fetch("/api/cv/traducir", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cv: formToCVDataRaw(), idioma: idiomaDestino }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.cv) { setError(j.error || "No hemos podido traducirlo ahora. Vuelve a intentarlo."); return; }
      setTraducido(j.cv as CVData);
      setTraducidoSinTraducir(Number(j.sinTraducir) || 0);
    } catch {
      setError("No hemos podido traducirlo ahora. Vuelve a intentarlo.");
    } finally {
      setTraduciendo(false);
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
        <div className="animate-spin rounded-full h-10 w-10 border-[3px]" style={{ borderColor: "#2d3142", borderTopColor: "#22c55e" }} />
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

  // Quien llega con su CV de siempre empieza por aquí: si el CV está casi vacío,
  // subirlo va lo primero, antes de plantillas y colores.
  const bloqueSubirPDF = (
    <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)" }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: "rgba(59,130,246,0.15)" }}>
        📎
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>¿Ya tienes un CV en PDF?</h3>
        <p className="text-xs mt-0.5" style={{ color: "#8b98ad" }}>Súbelo y extraigo los datos automáticamente</p>
      </div>
      <label className={`shrink-0 px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer transition ${subiendoPDF ? "opacity-50 pointer-events-none" : ""}`}
        style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff" }}>
        {subiendoPDF ? "Procesando…" : "📎 Subir PDF"}
        <input type="file" accept="application/pdf,.pdf" className="hidden"
          onChange={e => e.target.files?.[0] && subirPDF(e.target.files[0])}
          disabled={subiendoPDF} />
      </label>
    </div>
  );

  // ── HTML para la preview (traducido, mejorado con IA o en vivo) ──
  const previewHTML = traducidoHTML || mejoradoHTML || livePreviewHTML;
  const nombreIdiomaTraducido = traducido ? (IDIOMAS_CV.find(i => i.codigo === traducido.idioma)?.nombre ?? "") : "";

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117", overflowX: "hidden" }}>
      {volver && (
        <div className="mx-3 mt-3 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
          <p className="text-sm" style={{ color: "#f1f5f9" }}>Rellena tu CV y vuelve a la oferta para mandarlo. Se guarda solo.</p>
          <Link href={volver} className="btn-game text-xs px-4 py-2">Volver a la oferta →</Link>
        </div>
      )}
      {/* Header */}
      {/* Mismo acabado suave que el resto: fondo tenido, borde sutil y esquinas
          redondeadas, en vez del bloque de verde macizo que habia antes. */}
      <div className="px-4 py-5 mx-3 mt-3 rounded-2xl"
           style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}>
        {/* En el movil el titulo y la barra de botones peleaban por el mismo
            hueco: "Mi Curriculum" se partia en tres lineas y el ultimo boton se
            salia de la pantalla, cortado por la derecha. Con flex-wrap la barra
            baja debajo del titulo cuando no cabe, en vez de desbordarse. */}
        <div className="max-w-[100rem] mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "#f8fafc" }}>Mi Currículum</h1>
            <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Completa tus datos — la plantilla se actualiza en vivo</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* ── Selector de CVs ── */}
            {listaCVs.length > 0 && (
              <div className="flex items-center gap-1.5">
                <select
                  value={cvActivoId}
                  onChange={(e) => { const id = e.target.value; if (id) cargarCVporId(id); }}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                  style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9", maxWidth: "180px" }}
                >
                  {listaCVs.map(cv => (
                    <option key={cv.id} value={cv.id} style={{ background: "rgba(12,15,22,0.86)", color: "#f1f5f9" }}>
                      {cv.nombre || "Sin nombre"}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => cvActivoId && eliminarCV(cvActivoId)}
                  className="text-[10px] px-1.5 py-1 rounded opacity-50 hover:opacity-100"
                  style={{ color: "#ef4444" }}
                  title="Eliminar esta versión"
                  aria-label="Eliminar esta versión"
                ><Trash2 size={13} strokeWidth={1.9} /></button>
              </div>
            )}
            <button
              onClick={guardarComoNuevo}
              disabled={guardando}
              className="text-[10px] px-2 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
              style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }}
            >
              {guardando ? "..." : (
                <span className="inline-flex items-center gap-1.5">
                  <Save size={12} strokeWidth={2} /> Nueva versión
                </span>
              )}
            </button>
            {guardado && (
              <span className="text-xs font-medium px-3 py-1 rounded-full inline-flex items-center gap-1.5" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
                <Check size={12} strokeWidth={2.5} /> Guardado
              </span>
            )}
            {!mejoradoHTML && !traducido && (
              <button onClick={generarYMejorar} disabled={procesando}
                className="px-4 py-2 text-xs font-semibold rounded-xl transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #fff, #e2e8f0)", color: "#16a34a" }}>
                {procesando ? "Mejorando..." : "✨ Mejorar con IA"}
              </button>
            )}
            {/* Traducir el CV para trabajar fuera (lib/cv-generator/traducir.ts). */}
            {livePreviewHTML && !traducido && (
              <div className="flex items-center gap-1.5">
                <select
                  value={idiomaDestino}
                  onChange={e => setIdiomaDestino(e.target.value)}
                  aria-label="Idioma al que traducir el CV"
                  className="px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                  style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }}
                >
                  {IDIOMAS_CV.map(i => (
                    <option key={i.codigo} value={i.codigo} style={{ background: "rgba(12,15,22,0.86)", color: "#f1f5f9" }}>{i.nombre}</option>
                  ))}
                </select>
                <button onClick={traducirCV} disabled={traduciendo}
                  className="px-3 py-2 text-xs font-semibold rounded-xl disabled:opacity-50"
                  style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }}>
                  {traduciendo ? "Traduciendo..." : "🌍 Traducir"}
                </button>
              </div>
            )}
            {traducido && (
              <button onClick={() => setTraducido(null)}
                className="px-3 py-2 text-xs rounded-xl"
                style={{ border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
                ↶ Volver al español
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
              <button onClick={deshacerMejora}
                className="px-3 py-2 text-xs rounded-xl"
                style={{ border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
                ↶ Deshacer la mejora
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de completitud */}
      <div className="px-4 py-3 max-w-[100rem] mx-auto">
        <div className="rounded-xl p-4" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>
              Tu CV
            </p>
            <span className="text-sm font-bold" style={{ color: completitudColor }}>{pct === 100 ? "Completo" : `${pct} % hecho`}</span>
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

      {/* Impide el auto-zoom de iOS en inputs (font-size < 16px lo dispara) */}
      <style>{`.cv-form-inputs input,.cv-form-inputs textarea,.cv-form-inputs select{font-size:16px!important}`}</style>

      {/* ── LAYOUT 2 COLUMNAS: formulario + previsualización EN VIVO ── */}
      <main className="max-w-[100rem] mx-auto px-4 py-6">
        {avisoMejora && (
          <div className="mb-4 p-3 rounded-lg text-xs flex items-start justify-between gap-3"
            style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.15)" }}>
            <span>{avisoMejora}</span>
            <button onClick={deshacerMejora} className="shrink-0 underline" style={{ color: "#94a3b8" }}>
              Deshacer
            </button>
          </div>
        )}

        {traducido && (
          <div className="mb-4 p-3 rounded-lg text-xs flex items-start justify-between gap-3"
            style={{ background: "rgba(59,130,246,0.08)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.2)" }}>
            <span>
              Estás viendo tu CV en {nombreIdiomaTraducido.toLowerCase()}. Lo ha traducido la IA: revísalo antes de
              mandarlo. Tu CV en español no ha cambiado; si lo editas, vuelve a traducirlo.
              {traducidoSinTraducir > 0 && ` ${traducidoSinTraducir} ${traducidoSinTraducir === 1 ? "apartado se ha quedado" : "apartados se han quedado"} en español porque la traducción no salió bien: vuelve a intentarlo o cámbialo a mano.`}
            </span>
            <button onClick={() => setTraducido(null)} className="shrink-0 underline" style={{ color: "#94a3b8" }}>
              Volver al español
            </button>
          </div>
        )}

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
          <div className="cv-form-inputs flex-1 min-w-0 xl:max-w-[50%] space-y-5">
            {pct < 50 && bloqueSubirPDF}

            {/* Selector de plantilla */}
            <div className="rounded-xl p-5" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)" }}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}><Palette size={14} strokeWidth={1.9} /> Plantilla del CV</h2>
                <InfoTooltip text="La Clásica (dos columnas con foto) es visual e ideal para hostelería, comercio y trato con cliente. La Profesional ATS (una columna) está optimizada para pasar los filtros automáticos que usan la mayoría de empresas medianas y grandes." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LISTA_PLANTILLAS.map(p => {
                  const activa = templateId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setTemplateId(p.id)}
                      // En el móvil, plegadas salvo la elegida y la recomendada (ver más abajo).
                      className={`text-left rounded-lg transition cursor-pointer overflow-hidden ${!activa && !p.recomendada && !verPlantillas ? "hidden sm:block" : ""}`}
                      style={{
                        background: activa ? "rgba(34,197,94,0.08)" : "#0f1117",
                        border: `1.5px solid ${activa ? "#22c55e" : "#2d3142"}`,
                      }}
                    >
                      {/* Miniatura en vivo con datos de ejemplo */}
                      <div className="relative" style={{ height: "180px", overflow: "hidden", background: "#fff" }}>
                        <iframe
                          srcDoc={ejemplosHTML[p.id]}
                          title={`Ejemplo de la plantilla ${p.nombre}`}
                          tabIndex={-1}
                          aria-hidden="true"
                          scrolling="no"
                          style={{ width: "794px", height: "1123px", border: "none", transformOrigin: "top left", transform: "scale(0.34)", pointerEvents: "none" }}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); setEjemploVista(p.id); }}
                          className="absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded-md font-medium transition hover:scale-105"
                          style={{ background: "rgba(15,17,23,0.85)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                        >Ver ejemplo
                        </button>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: activa ? "#22c55e" : "#f1f5f9" }}>
                            {p.nombre}
                            {/* La sobria de toda la vida: la que se aconseja mandar (22 oct 2026). */}
                            {p.recomendada && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>Recomendada</span>
                            )}
                          </span>
                          {activa && <span className="text-[10px]" style={{ color: "#22c55e" }}>✓ activa</span>}
                        </div>
                        <p className="text-[11px] leading-snug" style={{ color: "#94a3b8" }}>{p.descripcion}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* EN EL MÓVIL LAS PLANTILLAS VAN PLEGADAS. Eran diez miniaturas de
                  unos 300 px en una columna, y el primer campo del formulario
                  quedaba a 4.200 px: cinco pantallas de desplazamiento antes de
                  poder escribir tu nombre (auditoría del 2 oct 2026). Ahora se ve
                  la elegida y un botón para ver las demás. */}
              <button
                onClick={() => setVerPlantillas(v => !v)}
                className="sm:hidden mt-3 w-full py-2.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
              >
                {verPlantillas ? "Ocultar las demás plantillas" : `Cambiar de plantilla (${LISTA_PLANTILLAS.length} para elegir)`}
              </button>

              {/* Selector de color de acento */}
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(148,163,184,0.14)" }}>
                <p className="text-xs font-semibold mb-2.5" style={{ color: "#f1f5f9" }}>Color del CV</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { nombre: "Verde", valor: "#16a34a" },
                    { nombre: "Azul", valor: "#2563eb" },
                    { nombre: "Marino", valor: "#1e3a5f" },
                    { nombre: "Rosa", valor: "#db2777" },
                    { nombre: "Morado", valor: "#7c3aed" },
                    { nombre: "Rojo", valor: "#dc2626" },
                    { nombre: "Naranja", valor: "#ea580c" },
                    { nombre: "Turquesa", valor: "#0d9488" },
                  ].map(c => {
                    const activo = accentColor.toLowerCase() === c.valor.toLowerCase();
                    return (
                      <button
                        key={c.valor}
                        onClick={() => setAccentColor(c.valor)}
                        title={c.nombre}
                        aria-label={`Color ${c.nombre}`}
                        className="rounded-full transition"
                        style={{
                          width: "26px", height: "26px", background: c.valor,
                          border: activo ? "2px solid #fff" : "2px solid transparent",
                          boxShadow: activo ? `0 0 0 2px ${c.valor}` : "none",
                          transform: activo ? "scale(1.12)" : "scale(1)",
                        }}
                      />
                    );
                  })}
                </div>
                <p className="text-[10px] mt-2" style={{ color: "#8b98ad" }}>Se aplica a la plantilla elegida. La <b>Ejecutiva</b> y la <b>Coqueta</b> son las que más lo lucen.</p>
              </div>
            </div>

            {/* Visibilidad para empresas */}
            <div className="rounded-xl p-5" style={{
              background: visibleEmpresas ? "rgba(34,197,94,0.07)" : "#161922",
              border: `1px solid ${visibleEmpresas ? "rgba(34,197,94,0.3)" : "#2d3142"}`,
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
                    <p className="text-xs mt-0.5" style={{ color: "#8b98ad" }}>
                      {visibleEmpresas
                        ? "Tu perfil aparece en el portal de empresas"
                        : "Activa esto para que empresas y ETTs puedan encontrarte"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => void toggleVisibilidad(!visibleEmpresas)}
                  className="relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200"
                  style={{ background: visibleEmpresas ? "#22c55e" : "#2d3142" }}
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

            {/* Cartas de recomendación confirmadas por quien las firmó */}
            {token && <TusReferencias token={token} />}

            {/* Subir PDF: aquí si el CV ya está avanzado; si no, arriba del todo */}
            {pct >= 50 && bloqueSubirPDF}

            {/* Foto profesional */}
            <div className="rounded-xl p-5" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)" }}>
              <h2 className="font-semibold text-sm mb-4" style={{ color: "#f1f5f9" }}>Foto profesional para tu CV</h2>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ border: "2px solid rgba(34,197,94,0.3)" }}>
                  {fotoUrl ? (
                    <img src={fotoUrl} alt="Foto CV" className="w-full h-full object-cover" width={80} height={80} loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: "rgba(12,15,22,0.86)", color: "#8b98ad" }}>👤</div>
                  )}
                </div>
                <div>
                  <label className={`inline-block px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer transition ${subiendoFoto ? "opacity-50" : ""}`}
                    style={{ background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406" }}>
                    {subiendoFoto ? "Subiendo…" : fotoUrl ? "Cambiar foto" : "Subir foto"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && subirFoto(e.target.files[0])} />
                  </label>
                  <p className="text-[10px] mt-1.5" style={{ color: "#8b98ad" }}>JPG/PNG, máx 3MB</p>
                </div>
              </div>

              {/* ── LA FOTO NO VALE EN TODAS PARTES ──
                  Va aquí, pegado al botón de subirla, porque es donde se toma
                  la decisión. En Alemania la foto se espera y no ponerla se
                  nota; en Reino Unido, Irlanda, Países Bajos y Estados Unidos
                  muchas empresas descartan los CV que la llevan para no
                  exponerse a una reclamación por discriminación. Mandamos CVs
                  a veintiséis países y el editor no lo decía en ningún sitio. */}
              <Link
                href="/app/curriculum/por-pais"
                className="p-3 rounded-lg flex items-start gap-2.5 mb-3 hover:opacity-90"
                style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", textDecoration: "none" }}
              >
                <Globe size={15} className="shrink-0" style={{ color: "#93c5fd" }} aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "#f59e0b" }}>
                    ¿A qué país mandas el CV?
                  </p>
                  <p className="text-[11px] leading-relaxed" style={{ color: "#94a3b8" }}>
                    En Alemania la foto se espera. En Reino Unido, Irlanda, Países Bajos y Estados
                    Unidos puede hacer que ni lo lean. Mira qué cambiar antes de enviarlo.
                  </p>
                </div>
              </Link>

              <div className="p-3 rounded-lg" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#22c55e" }}>Truco: Foto profesional gratis con IA</p>
                <p className="text-[11px] mb-2" style={{ color: "#94a3b8" }}>Hazte un selfie, copia este texto y pégalo en ChatGPT junto con tu foto:</p>
                <div className="p-2.5 rounded-md text-[10px] leading-relaxed font-mono" style={{ background: "#0a0c10", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.18)" }}>
                  Utiliza este personaje, pero en tamaño carnet, desde los hombros hacia arriba. Ponme una camisa blanca y adáptalo para un currículum. Que sea fiel a las características de mi rostro.
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("Utiliza este personaje, pero en tamaño carnet, desde los hombros hacia arriba. Ponme una camisa blanca y adáptalo para un currículum. Que sea fiel a las características de mi rostro.");
                    }}
                    className="px-3 py-1 text-[10px] font-semibold rounded-md" style={{ background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406" }}>
                    1. Copiar el texto
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("Utiliza este personaje, pero en tamaño carnet, desde los hombros hacia arriba. Ponme una camisa blanca y adáptalo para un currículum. Que sea fiel a las características de mi rostro.");
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
            <div className="rounded-xl p-5" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)" }}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}><span className="icono-circulo tono-azul align-middle mr-2" style={{ width: 28, height: 28 }} aria-hidden="true"><User size={14} /></span>Datos personales</h2>
                <InfoTooltip text="Tu nombre, teléfono, email y ciudad aparecen en la cabecera del CV. El título profesional resume tu perfil (ej: 'Camarero con 5 años de experiencia')." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cv-nombre" className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Nombre</label>
                  <input id="cv-nombre" placeholder="Nombre" value={form.nombre} onChange={e => f("nombre", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                    style={{ background: "#0f1117", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                </div>
                <div>
                  <label htmlFor="cv-apellidos" className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Apellidos</label>
                  <input id="cv-apellidos" placeholder="Apellidos" value={form.apellidos} onChange={e => f("apellidos", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                    style={{ background: "#0f1117", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="cv-subtitulo" className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Tu oficio o el puesto que buscas</label>
                  <input id="cv-subtitulo" placeholder="Título profesional" value={form.subtitulo} onChange={e => f("subtitulo", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                    style={{ background: "#0f1117", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                </div>
                <div>
                  <label htmlFor="cv-telefono" className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Teléfono</label>
                  <input id="cv-telefono" placeholder="Teléfono" value={form.telefono} onChange={e => f("telefono", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                    style={{ background: "#0f1117", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                </div>
                <div>
                  <label htmlFor="cv-email" className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Correo electrónico</label>
                  <input id="cv-email" placeholder="Email" value={form.email} onChange={e => f("email", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                    style={{ background: "#0f1117", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="cv-ciudad" className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Ciudad</label>
                  <input id="cv-ciudad" placeholder="Ciudad" value={form.ciudad} onChange={e => f("ciudad", e.target.value)}
                    autoComplete="off"
                    className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/30 transition"
                    style={{ background: "#0f1117", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                </div>
              </div>
            </div>

            {/* Experiencia */}
            <div className="rounded-xl p-5" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)" }}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Experiencia laboral</h2>
                <InfoTooltip text="Añade tus trabajos del más reciente al más antiguo. Incluye fechas, puesto, empresa y una descripción breve de tus tareas con verbos de acción (Gestioné, Coordiné...)." />
              </div>
              {form.experiencia.map((exp, i) => (
                <div key={i} className="p-3 rounded-lg space-y-2.5 mb-3" style={{ background: "#0f1117", border: "1px solid rgba(148,163,184,0.18)" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold" style={{ color: "#22c55e" }}>Experiencia {i + 1}</span>
                    {form.experiencia.length > 1 && (
                      <button onClick={() => setForm(p => ({ ...p, experiencia: p.experiencia.filter((_, j) => j !== i) }))}
                        className="text-[11px]" style={{ color: "#ef4444" }}>Eliminar</button>
                    )}
                  </div>
                  <div>
                    <label htmlFor={`cv-exp-fechas-${i}`} className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Fechas</label>
                    <input id={`cv-exp-fechas-${i}`} placeholder="Fechas (ej: 2020 - 2023)" value={exp.fechas}
                      onChange={e => updExp(i, "fechas", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor={`cv-exp-puesto-${i}`} className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Puesto</label>
                      <input id={`cv-exp-puesto-${i}`} placeholder="Puesto" value={exp.puesto} onChange={e => updExp(i, "puesto", e.target.value)}
                        className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                    </div>
                    <div>
                      <label htmlFor={`cv-exp-empresa-${i}`} className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Empresa</label>
                      <input id={`cv-exp-empresa-${i}`} placeholder="Empresa" value={exp.empresa} onChange={e => updExp(i, "empresa", e.target.value)}
                        className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor={`cv-exp-ubicacion-${i}`} className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Ciudad</label>
                    <input id={`cv-exp-ubicacion-${i}`} placeholder="Ubicación" value={exp.ubicacion} onChange={e => updExp(i, "ubicacion", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                  </div>
                  <div>
                    <label htmlFor={`cv-exp-descripcion-${i}`} className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Qué hacías (una tarea por línea)</label>
                    <textarea id={`cv-exp-descripcion-${i}`} placeholder="Descripción de tareas (una por línea)" value={exp.descripcion} rows={3}
                      onChange={e => updExp(i, "descripcion", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg text-sm resize-none" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                  </div>
                </div>
              ))}
              <button onClick={() => setForm(p => ({ ...p, experiencia: [...p.experiencia, { fechas: "", puesto: "", empresa: "", ubicacion: "", descripcion: "" }] }))}
                className="text-xs font-medium" style={{ color: "#22c55e" }}>+ Añadir experiencia</button>
            </div>

            {/* Formación */}
            <div className="rounded-xl p-5" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)" }}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}><span className="icono-circulo tono-morado align-middle mr-2" style={{ width: 28, height: 28 }} aria-hidden="true"><GraduationCap size={14} /></span>Formación</h2>
                <InfoTooltip text="Tus estudios y cursos relevantes. Incluye el título (ej: ESO, FP, Grado), el centro educativo y la ciudad." />
              </div>
              {form.formacion.map((edu, i) => (
                <div key={i} className="p-3 rounded-lg space-y-2.5 mb-3" style={{ background: "#0f1117", border: "1px solid rgba(148,163,184,0.18)" }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold" style={{ color: "#f59e0b" }}>Formación {i + 1}</span>
                    {form.formacion.length > 1 && (
                      <button onClick={() => setForm(p => ({ ...p, formacion: p.formacion.filter((_, j) => j !== i) }))}
                        className="text-[11px]" style={{ color: "#ef4444" }}>Eliminar</button>
                    )}
                  </div>
                  <div>
                    <label htmlFor={`cv-edu-titulo-${i}`} className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Estudios o curso</label>
                    <input id={`cv-edu-titulo-${i}`} placeholder="Título / Estudios" value={edu.titulo}
                      onChange={e => updEdu(i, "titulo", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor={`cv-edu-centro-${i}`} className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Centro</label>
                      <input id={`cv-edu-centro-${i}`} placeholder="Centro" value={edu.centro} onChange={e => updEdu(i, "centro", e.target.value)}
                        className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                    </div>
                    <div>
                      <label htmlFor={`cv-edu-ubicacion-${i}`} className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Ciudad</label>
                      <input id={`cv-edu-ubicacion-${i}`} placeholder="Ubicación" value={edu.ubicacion} onChange={e => updEdu(i, "ubicacion", e.target.value)}
                        className="w-full px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setForm(p => ({ ...p, formacion: [...p.formacion, { titulo: "", centro: "", ubicacion: "" }] }))}
                className="text-xs font-medium" style={{ color: "#f59e0b" }}>+ Añadir formación</button>
            </div>

            {/* Habilidades e idiomas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl p-5" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Habilidades</h2>
                  <InfoTooltip text="Tus puntos fuertes separados por comas. Ej: Trabajo en equipo, Excel, Liderazgo, Resolución de problemas." position="right" />
                </div>
                <div>
                  <label htmlFor="cv-aptitudes" className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Lo que sabes hacer (separado por comas)</label>
                  <input id="cv-aptitudes" placeholder="Separadas por comas" value={form.aptitudes}
                    onChange={e => f("aptitudes", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-sm" style={{ background: "#0f1117", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
                </div>
              </div>
              <div className="rounded-xl p-5" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Idiomas</h2>
                  <InfoTooltip text="Cada idioma que hablas y con qué soltura. En el CV sale como una barra." position="left" />
                </div>
                <SelectorIdiomas valor={form.idiomas} onChange={v => f("idiomas", v)} />
              </div>
            </div>

            {/* Perfil profesional */}
            <div className="rounded-xl p-5" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)" }}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}><span className="icono-circulo tono-ambar align-middle mr-2" style={{ width: 28, height: 28 }} aria-hidden="true"><PenLine size={14} /></span>Perfil profesional (opcional)</h2>
                <InfoTooltip text="2-3 frases que resumen quién eres como profesional. Si lo dejas vacío, la IA lo generará automáticamente a partir de tu experiencia." />
              </div>
              <div>
                <label htmlFor="cv-perfil-profesional" className="block text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>Cuéntalo en dos o tres frases</label>
                <textarea id="cv-perfil-profesional" placeholder="Breve descripción de ti como profesional... (la IA lo mejorará)"
                  value={form.perfilProfesional} onChange={e => f("perfilProfesional", e.target.value)} rows={3}
                  className="w-full px-4 py-2.5 rounded-lg text-sm resize-none" style={{ background: "#0f1117", border: "1px solid rgba(148,163,184,0.18)", color: "#f1f5f9" }} />
              </div>
            </div>
          </div>

          {/* ── COLUMNA DERECHA: Previsualización EN VIVO (solo escritorio) ── */}
          {/* LA VISTA PREVIA EN VIVO.
              Estaba en "hidden xl:block", o sea que solo aparecia a partir
              de 1280 pixeles de ancho. En un portatil normal, una tablet o
              un movil NO se veia, y parecia que la funcion se habia perdido
              al meter las diez plantillas. El codigo estaba, pero escondido.
              Ahora entra desde 1024 px; por debajo esta el boton flotante. */}
          <div className="hidden lg:block lg:flex-1 lg:min-w-0 lg:sticky lg:top-20 lg:max-w-[50%]">
            <div className="rounded-xl overflow-hidden" style={{ border: "2px solid #22c55e40", background: "#fff" }}>
              {/* Cabecera de la preview */}
              <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "rgba(12,15,22,0.78)", borderBottom: "1px solid rgba(148,163,184,0.14)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
                  <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>
                    {traducido ? `CV en ${nombreIdiomaTraducido.toLowerCase()} 🌍` : mejoradoHTML ? "CV Mejorado con IA ✨" : "Previsualización en vivo"}
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
                  <div className="mb-4 opacity-40 flex justify-center"><FileText size={44} strokeWidth={1.3} aria-hidden="true" /></div>
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
                style={{ background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406" }}>
                {procesando ? "✨ Mejorando..." : "✨ Mejorar con IA"}
              </button>
              <button onClick={descargarPDF} disabled={descargando || !previewHTML}
                className="flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition disabled:opacity-50"
                style={{ background: "rgba(12,15,22,0.86)", border: "1.5px solid #22c55e", color: "#22c55e" }}>
                {descargando ? "Generando PDF..." : "⬇ Descargar PDF"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── FULLSCREEN CV ── */}
      {/* En pantallas por debajo de 1024 px la vista previa lateral no cabe,
          asi que se ofrece a pantalla completa con un boton flotante. Sin esto,
          en el movil no habia NINGUNA forma de ver como iba quedando el CV: el
          boton de pantalla completa estaba dentro del panel que se ocultaba. */}
      {previewHTML && !fullscreen && (
        <button
          onClick={() => setFullscreen(true)}
          className="lg:hidden fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-sm shadow-lg"
          // Por encima de la barra de abajo del móvil (--barra-inferior, globals.css).
          style={{ bottom: "calc(var(--barra-inferior) + 20px)", background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406", boxShadow: "0 8px 24px rgba(34,197,94,0.35)" }}
        >
          👁️ Ver mi CV
        </button>
      )}

      {fullscreen && previewHTML && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col"
          style={{ background: "#0f1117" }}
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: "rgba(12,15,22,0.78)", borderBottom: "1px solid rgba(148,163,184,0.14)" }}>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
              <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>
                {traducido ? `CV en ${nombreIdiomaTraducido.toLowerCase()} 🌍` : mejoradoHTML ? "CV Mejorado con IA ✨" : "Vista previa del CV"}
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
                style={{ background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406" }}
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

      {/* ── EJEMPLO DE PLANTILLA (pantalla completa) ── */}
      {ejemploVista && (
        <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: "#0f1117" }}>
          <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: "rgba(12,15,22,0.78)", borderBottom: "1px solid rgba(148,163,184,0.14)" }}>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>
                Ejemplo — {PLANTILLAS[ejemploVista].nombre}
              </span>
              <span className="text-[11px] hidden sm:inline" style={{ color: "#8b98ad" }}>
                Datos de muestra · así quedará tu CV con esta plantilla
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setTemplateId(ejemploVista); setEjemploVista(null); }}
                className="text-xs px-4 py-1.5 rounded-lg font-semibold transition hover:scale-105"
                style={{ background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406" }}
              >
                ✓ Usar esta plantilla
              </button>
              <button
                onClick={() => setEjemploVista(null)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition hover:scale-105"
                style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                ✕ Cerrar
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto flex justify-center bg-neutral-200 py-4">
            <iframe
              srcDoc={ejemplosHTML[ejemploVista]}
              className="bg-white shadow-2xl"
              style={{ width: "210mm", minHeight: "297mm", border: "none", maxWidth: "100%" }}
              title={`Ejemplo de la plantilla ${PLANTILLAS[ejemploVista].nombre}`}
            />
          </div>
        </div>
      )}

    </div>
  );
}
