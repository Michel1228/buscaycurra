"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  type AuPairProfile,
  type AuPairReference,
  generarPlantillaLetter,
  PAISES_AU_PAIR,
} from "@/lib/au-pair";
import { NACIONALIDADES, ESTATUS_RESIDENCIA } from "@/lib/au-pair-legal-data";
import { PAISES } from "@/lib/paises";
import AuPairPlantilla from "@/components/AuPairPlantilla";
import AuPairComparativaLegal from "@/components/AuPairComparativaLegal";
import AuPairCalculadoraCostes from "@/components/AuPairCalculadoraCostes";
import AuPairOfertasRecientes from "@/components/AuPairOfertasRecientes";
import {
  Users, Sparkles, User, Check, Globe, Camera, Star, ClipboardList,
  Mail, FileText, Eye, Upload, Save, X, CheckCircle2,
} from "lucide-react";

const MAX_FOTOS = 6;

export default function AuPairProfilePage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Form fields
  const [nombre, setNombre] = useState("");
  const [letterText, setLetterText] = useState("");
  const [age, setAge] = useState("");
  const [nationality, setNationality] = useState("ES");
  const [residencia, setResidencia] = useState("ES"); // País donde vive actualmente
  const [estatusResidencia, setEstatusResidencia] = useState(""); // Ciudadano UE, residente, etc.
  const [ciudad, setCiudad] = useState("");
  const [languages, setLanguages] = useState<string[]>(["Español"]);
  const [langInput, setLangInput] = useState("");
  const [childcareExperience, setChildcareExperience] = useState("");
  const [hasDrivingLicense, setHasDrivingLicense] = useState(false);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [dietaryInfo, setDietaryInfo] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [nivelEducativo, setNivelEducativo] = useState("");
  const [duracionPreferida, setDuracionPreferida] = useState("");
  const [fumador, setFumador] = useState(false);
  const [primerosAuxilios, setPrimerosAuxilios] = useState(false);
  const [sabeNadar, setSabeNadar] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [references, setReferences] = useState<AuPairReference[]>([]);
  const [paisDestino, setPaisDestino] = useState("UK");
  const [tipoPerfil, setTipoPerfil] = useState<"joven_estudiante" | "con_experiencia" | "profesional_cambio">("joven_estudiante");
  const [generandoIA, setGenerandoIA] = useState(false);
  const [auPairStats, setAuPairStats] = useState({ hoy: 0, limiteHoy: 2, disponibles: 2, plan: "free" });
  const [previewHTML, setPreviewHTML] = useState("");
  const [showPlantilla, setShowPlantilla] = useState(true);
  const [descargandoCarta, setDescargandoCarta] = useState(false);
  const iframeCartaRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Enviar perfil a familia ──
  const [familyEmail, setFamilyEmail] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [enviandoPerfil, setEnviandoPerfil] = useState(false);
  const [envioExito, setEnvioExito] = useState("");
  const [envioError, setEnvioError] = useState("");

  // ── Agencias Au Pair ──
  const [agencias, setAgencias] = useState<{nombre:string; email:string; pais:string; ofertas:number}[]>([]);
  const [cargandoAgencias, setCargandoAgencias] = useState(true);

  useEffect(() => {
    fetch("/api/au-pair/agencias")
      .then(r => r.json())
      .then(d => { if (d.agencias) setAgencias(d.agencias); })
      .catch(() => {})
      .finally(() => setCargandoAgencias(false));
  }, []);

  // ── Preview & Confirmación ──
  const [showPreview, setShowPreview] = useState(false);
  const [previewSubject, setPreviewSubject] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState<{familyName: string; email: string; subject: string; carta: string} | null>(null);

  // Modal referencia
  const [refNombre, setRefNombre] = useState("");
  const [refEmail, setRefEmail] = useState("");
  const [refTelefono, setRefTelefono] = useState("");
  const [refRelacion, setRefRelacion] = useState("");
  const [showRefForm, setShowRefForm] = useState(false);

  // Cargar perfil
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);

      try {
        const res = await fetch(`/api/au-pair/profile?userId=${user.id}`);
        const json = await res.json();
        if (json.profile) {
          const p = json.profile as AuPairProfile;
          setNombre(p.nombre || "");
          setLetterText(p.letter_text || "");
          setAge(p.age?.toString() || "");
          setNationality(p.nationality || "ES");
          setResidencia(p.residencia || "ES");
          setEstatusResidencia(p.estatus_residencia || "");
          setCiudad(p.ciudad || "");
          setLanguages(p.languages || ["Español"]);
          setChildcareExperience(p.childcare_experience || "");
          setHasDrivingLicense(p.has_driving_license || false);
          setAvailableFrom(p.available_from || "");
          setAvailableTo(p.available_to || "");
          setDietaryInfo(p.dietary_info || "");
          setHobbies(p.hobbies || "");
          setNivelEducativo(p.nivel_educativo || "");
          setDuracionPreferida(p.duracion_preferida || "");
          setFumador(p.fumador || false);
          setPrimerosAuxilios(p.primeros_auxilios || false);
          setSabeNadar(p.sabe_nadar || false);
          setPhotos(Array.isArray(p.photos) ? p.photos : []);
          setReferences(Array.isArray(p.references_json) ? p.references_json : []);
        }
      } catch (e) {
        console.warn("[AU Pair] Error cargando perfil:", e);
      }

      const saved = localStorage.getItem("bc_pais");
      if (saved) setPaisDestino(saved);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      fetch(`/api/user/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => {
        setAuPairStats({ hoy: d.cv.hoy, limiteHoy: d.cv.limiteHoy, disponibles: d.cv.disponibles, plan: d.plan });
      }).catch(() => {});

      setLoading(false);
    });
  }, [router, supabase]);

  // ── Idiomas ──
  const addLanguage = useCallback(() => {
    const lang = langInput.trim();
    if (lang && !languages.includes(lang)) {
      setLanguages([...languages, lang]);
      setLangInput("");
    }
  }, [langInput, languages]);

  const removeLanguage = useCallback((lang: string) => {
    setLanguages(languages.filter((l) => l !== lang));
  }, [languages]);

  // ── Fotos ──
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= MAX_FOTOS) {
      setError(`Máximo ${MAX_FOTOS} fotos`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La foto no puede superar 5 MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Solo JPG, PNG o WebP");
      return;
    }

    setUploadingPhoto(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Sesión expirada");
      setUploadingPhoto(false);
      return;
    }

    const form = new FormData();
    form.append("foto", file);

    const res = await fetch("/api/au-pair/upload-photo", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: form,
    });
    const json = await res.json();
    setUploadingPhoto(false);

    if (json.url) {
      setPhotos(prev => [...prev, json.url]);
    } else {
      setError(json.error || "Error al subir foto");
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [photos, supabase]);

  const removePhoto = useCallback(async (url: string) => {
    setPhotos(prev => prev.filter(p => p !== url));

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      fetch("/api/au-pair/upload-photo", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url }),
      }).catch(() => {});
    }
  }, [supabase]);

  // ── Referencias ──
  const addReference = useCallback(() => {
    if (!refNombre || !refEmail) return;
    setReferences([...references, { nombre: refNombre, email: refEmail, telefono: refTelefono, relacion: refRelacion }]);
    setRefNombre(""); setRefEmail(""); setRefTelefono(""); setRefRelacion("");
    setShowRefForm(false);
  }, [refNombre, refEmail, refTelefono, refRelacion, references]);

  const removeReference = useCallback((idx: number) => {
    setReferences(references.filter((_, i) => i !== idx));
  }, [references]);

  // ── Carta ──
  const generarCarta = useCallback(() => {
    const plantilla = generarPlantillaLetter({
      nombre: nombre || undefined,
      edad: age ? parseInt(age) : undefined,
      nacionalidad: PAISES[nationality]?.nombre || nationality,
      ciudad: ciudad || undefined,
      idiomas: languages,
      experiencia: childcareExperience,
      hobbies,
      paisDestino: PAISES[paisDestino]?.nombre || paisDestino,
      nivelEducativo: nivelEducativo || undefined,
      duracion: duracionPreferida || undefined,
    });
    setLetterText(plantilla);
    setMensaje("Plantilla generada. ¡Personalízala a tu estilo!");
    setTimeout(() => setMensaje(""), 4000);
  }, [nombre, age, nationality, ciudad, languages, childcareExperience, hobbies, paisDestino, nivelEducativo, duracionPreferida]);

  const generarConIA = useCallback(async () => {
    setGenerandoIA(true);
    setError("");
    try {
      const res = await fetch("/api/au-pair/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre || undefined,
          edad: age ? parseInt(age) : undefined,
          nacionalidad: nationality,
          ciudad: ciudad || undefined,
          idiomas: languages.join(", "),
          idiomaDestino: PAISES[paisDestino]?.idioma || "English",
          experiencia: childcareExperience || undefined,
          sector: "",
          hobbies,
          disponibleDesde: availableFrom || undefined,
          tipoPerfil,
          nivelEducativo: nivelEducativo || undefined,
          duracion: duracionPreferida || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLetterText(json.letter);
        setMensaje("¡Carta generada por IA! Personaliza los detalles a tu gusto.");
      } else {
        setError(json.error || "Error al generar");
      }
    } catch {
      setError("Error de conexión al generar con IA");
    } finally {
      setGenerandoIA(false);
    }
  }, [nombre, age, nationality, ciudad, languages, paisDestino, childcareExperience, hobbies, availableFrom, tipoPerfil, nivelEducativo, duracionPreferida]);

  // ── Guardar ──
  const guardar = useCallback(async () => {
    if (!letterText.trim()) {
      setError("La carta 'Dear Family' es obligatoria");
      return;
    }
    setSaving(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Sesión expirada"); setSaving(false); return; }

    const res = await fetch("/api/au-pair/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        user_id: userId,
        nombre,
        letter_text: letterText,
        age: age ? parseInt(age) : null,
        nationality,
        residencia,
        estatus_residencia: estatusResidencia,
        ciudad,
        pais_destino: paisDestino,
        languages,
        childcare_experience: childcareExperience,
        has_driving_license: hasDrivingLicense,
        available_from: availableFrom || null,
        available_to: availableTo || null,
        dietary_info: dietaryInfo,
        hobbies,
        nivel_educativo: nivelEducativo,
        fumador,
        primeros_auxilios: primerosAuxilios,
        sabe_nadar: sabeNadar,
        duracion_preferida: duracionPreferida,
        fotos: photos,
        references_json: references,
      }),
    });

    const json = await res.json();
    setSaving(false);

    if (json.success) {
      setMensaje("Perfil Au Pair guardado correctamente");
      setTimeout(() => setMensaje(""), 4000);
    } else {
      setError(json.error || "Error al guardar");
    }
  }, [
    userId, nombre, letterText, age, nationality, ciudad, languages, childcareExperience,
    hasDrivingLicense, availableFrom, availableTo, dietaryInfo, hobbies,
    nivelEducativo, fumador, primerosAuxilios, sabeNadar, duracionPreferida, photos, references,
  ]);

  // ── Preview carta ──
  function verCarta() {
    if (!letterText.trim()) { setError("Escribe o genera tu carta antes de previsualizar."); return; }
    const pais = PAISES[paisDestino];

    // Construir galería de fotos para el preview
    const fotosHTML = photos.length > 0 ? `
    <div class="photos-section">
      <div class="photos-title">📸 Photo Gallery</div>
      <div class="photos-grid">
        ${photos.map(url => `
        <div class="photo-card">
          <img src="${url}" alt="Au Pair photo" loading="lazy" />
        </div>`).join("")}
      </div>
    </div>` : "";

    // Construir badges de aptitudes
    const aptitudesBadges: string[] = [];
    if (hasDrivingLicense) aptitudesBadges.push("🚗 Driving License");
    if (!fumador) aptitudesBadges.push("🚭 Non-smoker");
    if (primerosAuxilios) aptitudesBadges.push("⛑️ First Aid Certified");
    if (sabeNadar) aptitudesBadges.push("🏊 Can Swim");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Au Pair Letter — ${nombre || "Profile"}</title>
<link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Lato', sans-serif; background: #f8f6f0; color: #2c2c2c; min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px; }
  .page { background: #fff; width: 210mm; max-width: 100%; box-shadow: 0 4px 40px rgba(0,0,0,0.12); border-radius: 2px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #2d5a4e 0%, #1a3d34 100%); color: #fff; padding: 40px 48px 32px; }
  .name { font-family: 'Crimson Text', serif; font-size: 32px; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; }
  .tagline { font-size: 13px; opacity: 0.75; letter-spacing: 1.5px; text-transform: uppercase; }
  .meta { display: flex; gap: 24px; margin-top: 20px; flex-wrap: wrap; }
  .meta-item { font-size: 12px; opacity: 0.85; display: flex; align-items: center; gap: 6px; }
  .body { padding: 48px; }
  .date { font-size: 13px; color: #888; margin-bottom: 32px; font-style: italic; }
  .photos-section { margin-bottom: 32px; }
  .photos-title { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #888; font-weight: 700; margin-bottom: 12px; }
  .photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
  .photo-card { aspect-ratio: 4/3; border-radius: 8px; overflow: hidden; background: #f0ede6; }
  .photo-card img { width: 100%; height: 100%; object-fit: cover; }
  .aptitudes { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 32px; }
  .aptitud-badge { font-size: 10px; padding: 4px 12px; border-radius: 20px; background: #e8f5e9; color: #1a3d34; letter-spacing: 0.3px; }
  .letter-text { font-family: 'Crimson Text', serif; font-size: 16px; line-height: 1.85; color: #2c2c2c; white-space: pre-wrap; word-break: break-word; }
  .divider { width: 48px; height: 3px; background: linear-gradient(90deg, #2d5a4e, #4a9d84); border-radius: 2px; margin: 40px 0 32px; }
  .refs-title { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #888; font-weight: 700; margin-bottom: 16px; }
  .ref-card { border-left: 3px solid #2d5a4e; padding: 10px 16px; margin-bottom: 10px; background: #f8faf9; }
  .ref-name { font-weight: 700; font-size: 14px; color: #1a3d34; }
  .ref-detail { font-size: 12px; color: #666; margin-top: 2px; }
  .footer { background: #f8f6f0; padding: 20px 48px; border-top: 1px solid #e8e4d9; display: flex; justify-content: space-between; align-items: center; }
  .footer-logo { font-size: 11px; color: #aaa; letter-spacing: 1px; text-transform: uppercase; }
  .destination-badge { background: #2d5a4e; color: #fff; font-size: 11px; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; }
  @media print { body { background: #fff; padding: 0; } .page { box-shadow: none; width: 100%; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="name">${nombre || (age ? `Au Pair, ${age} años` : "Au Pair Profile")}</div>
    <div class="tagline">Childcare Professional · Dear Family Letter</div>
    <div class="meta">
      ${PAISES[nationality] ? `<div class="meta-item">🌍 ${PAISES[nationality].bandera} ${PAISES[nationality].nombre}${ciudad ? ` · ${ciudad}` : ""}</div>` : ""}
      ${languages.length > 0 ? `<div class="meta-item">🗣 ${languages.join(" · ")}</div>` : ""}
      ${availableFrom ? `<div class="meta-item">📅 Available from ${availableFrom}</div>` : ""}
    </div>
    ${nivelEducativo ? `<div style="margin-top:12px;font-size:12px;opacity:0.75">🎓 ${nivelEducativo}</div>` : ""}
  </div>
  <div class="body">
    <div class="date">${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
    ${fotosHTML}
    ${aptitudesBadges.length > 0 ? `<div class="aptitudes">${aptitudesBadges.map(b => `<span class="aptitud-badge">${b}</span>`).join("")}</div>` : ""}
    <div class="letter-text">${letterText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    ${references.length > 0 ? `
    <div class="divider"></div>
    <div class="refs-title">References</div>
    ${references.map(r => `
    <div class="ref-card">
      <div class="ref-name">${r.nombre}</div>
      <div class="ref-detail">${r.relacion} · ${r.email}${r.telefono ? ` · ${r.telefono}` : ""}</div>
    </div>`).join("")}` : ""}
  </div>
  <div class="footer">
    <div class="footer-logo">BuscayCurra · buscaycurra.es</div>
    ${pais ? `<div class="destination-badge">${pais.bandera} Destino: ${pais.nombre}</div>` : ""}
  </div>
</div>
</body>
</html>`;
    setPreviewHTML(html);
  }

  async function descargarCarta() {
    if (!previewHTML || descargandoCarta) return;
    setDescargandoCarta(true);
    try {
      const res = await fetch("/api/cv/pdf-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: previewHTML }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Carta_AuPair_${nombre || "BuscayCurra"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      if (iframeCartaRef.current?.contentWindow) {
        iframeCartaRef.current.contentWindow.print();
      }
    } finally {
      setDescargandoCarta(false);
    }
  }

  async function enviarPerfil() {
    if (!familyEmail || !familyEmail.includes("@")) {
      setEnvioError("Introduce un email válido");
      return;
    }
    setEnvioError("");
    setEnvioExito("");

    // Generar asunto de preview
    const subject = `Au Pair Application — ${nombre || "Candidato"} from ${PAISES[nationality] || nationality || "Spain"}`;
    setPreviewSubject(subject);
    setShowPreview(true);
  }

  async function confirmarEnvioAuPair() {
    setShowPreview(false);
    setEnviandoPerfil(true);
    setEnvioError("");
    setEnvioExito("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/au-pair/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ familyEmail, familyName: familyName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");

      // Mostrar confirmación detallada
      setConfirmData({
        familyName: familyName || familyEmail,
        email: familyEmail,
        subject: previewSubject,
        carta: letterText || "Carta de presentación Au Pair",
      });
      setShowConfirm(true);
      setEnvioExito(`Perfil enviado a ${familyName || familyEmail}`);
      setFamilyEmail("");
      setFamilyName("");
      setAuPairStats(prev => ({ ...prev, hoy: prev.hoy + 1, disponibles: Math.max(0, prev.disponibles - 1) }));
    } catch (err) {
      setEnvioError((err as Error).message);
    } finally {
      setEnviandoPerfil(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <p className="text-[#94a3b8]">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f1117] text-[#f1f5f9]">
      {/* Hero */}
      <section className="py-10 px-4 sm:px-6 max-w-3xl mx-auto text-center">
        <div className="flex justify-center mb-4"><Users size={40} strokeWidth={1.2} style={{ color: "#22c55e" }} /></div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Tu Perfil Au Pair</h1>
        <p className="text-[#94a3b8] max-w-lg mx-auto text-sm">
          Las familias no buscan un CV. Buscan conocerte. Crea tu perfil completo con fotos
          y tu carta de presentación para aplicar a ofertas au pair.
        </p>
        {auPairStats.plan && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="flex items-center justify-between text-[10px] text-[#94a3b8] mb-1">
              <span>Envíos au pair hoy</span>
              <span className="tabular-nums">{auPairStats.hoy}/{auPairStats.limiteHoy}</span>
            </div>
            <div className="h-1 rounded-full bg-[#1e212b]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (auPairStats.hoy / auPairStats.limiteHoy) * 100)}%`,
                  background: auPairStats.disponibles <= 0 ? "#ef4444" : "#22c55e",
                }}
              />
            </div>
            <p className="text-[9px] text-[#22c55e] mt-1">
              {auPairStats.disponibles} disponible{auPairStats.disponibles !== 1 ? "s" : ""} hoy — ¡vuelve mañana!
            </p>
          </div>
        )}
      </section>

      {/* ── Ofertas Au Pair en vivo ── */}
      <AuPairOfertasRecientes />

      {/* Formulario */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 space-y-6">
        {mensaje && (
          <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-4 text-sm text-[#22c55e]">{mensaje}</div>
        )}
        {error && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 text-sm text-[#ef4444]">{error}</div>
        )}

        {/* ── Datos personales ── */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
            <User size={13} strokeWidth={1.8} /> Datos personales
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-[#64748b] block mb-1">Nombre completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="María García López"
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Edad</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="18"
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Nacionalidad (pasaporte)</label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              >
                {NACIONALIDADES.map((n) => (
                  <option key={n.code} value={n.code}>{n.bandera} {n.nombre} ({n.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">País de residencia actual</label>
              <select
                value={residencia}
                onChange={(e) => setResidencia(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              >
                {NACIONALIDADES.map((n) => (
                  <option key={n.code} value={n.code}>{n.bandera} {n.nombre} ({n.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Estatus legal en país de residencia</label>
              <select
                value={estatusResidencia}
                onChange={(e) => setEstatusResidencia(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                {ESTATUS_RESIDENCIA.map((s) => (
                  <option key={s.value} value={s.value} title={s.desc}>{s.label}</option>
                ))}
              </select>
              {estatusResidencia && (
                <p className="text-[10px] text-[#64748b] mt-1">
                  {ESTATUS_RESIDENCIA.find(s => s.value === estatusResidencia)?.desc}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Ciudad</label>
              <input
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Madrid"
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">País de destino</label>
              <select
                value={paisDestino}
                onChange={(e) => setPaisDestino(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              >
                {PAISES_AU_PAIR.map((code) => (
                  <option key={code} value={code}>{PAISES[code]?.bandera || ""} {PAISES[code]?.nombre || code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Nivel educativo</label>
              <select
                value={nivelEducativo}
                onChange={(e) => setNivelEducativo(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                <option value="ESO / Secundaria">ESO / Secundaria</option>
                <option value="Bachillerato">Bachillerato</option>
                <option value="FP / Grado Medio">FP / Grado Medio</option>
                <option value="FP / Grado Superior">FP / Grado Superior</option>
                <option value="Universitario en curso">Universitario en curso</option>
                <option value="Universitario terminado">Universitario terminado</option>
                <option value="Máster / Postgrado">Máster / Postgrado</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Duración preferida</label>
              <select
                value={duracionPreferida}
                onChange={(e) => setDuracionPreferida(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                <option value="3-6 meses">3-6 meses (verano)</option>
                <option value="6-12 meses">6-12 meses</option>
                <option value="12-24 meses">12-24 meses</option>
                <option value=">24 meses">&gt;24 meses</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Disponible desde</label>
              <input
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Disponible hasta</label>
              <input
                type="date"
                value={availableTo}
                onChange={(e) => setAvailableTo(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ── Aptitudes (toggles) ── */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
            <Check size={13} strokeWidth={1.8} /> Aptitudes
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: "Carnet de conducir", state: hasDrivingLicense, set: setHasDrivingLicense },
              { label: "No fumador/a", state: !fumador, set: (v: boolean) => setFumador(!v), invert: true },
              { label: "Primeros auxilios", state: primerosAuxilios, set: setPrimerosAuxilios },
              { label: "Sabe nadar", state: sabeNadar, set: setSabeNadar },
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-3 bg-[#0f1117] border border-[#2d3142] rounded-lg px-4 py-3 cursor-pointer hover:border-[#22c55e]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={item.state}
                  onChange={(e) => item.set(item.invert ? !e.target.checked : e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${item.state ? "bg-[#22c55e] border-[#22c55e]" : "border-[#2d3142]"}`}>
                  {item.state && <Check size={12} strokeWidth={3} />}
                </div>
                <span className="text-sm text-[#94a3b8] peer-checked:text-[#e2e8f0]">{item.label}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 bg-[#0f1117] border border-[#2d3142] rounded-lg px-4 py-3 cursor-pointer hover:border-[#ef4444]/30 transition-colors">
              <input
                type="checkbox"
                checked={fumador}
                onChange={(e) => setFumador(e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${fumador ? "bg-[#ef4444] border-[#ef4444]" : "border-[#2d3142]"}`}>
                {fumador && <Check size={12} strokeWidth={3} />}
              </div>
              <span className={`text-sm ${fumador ? "text-[#ef4444]" : "text-[#94a3b8]"}`}>Fumador/a</span>
            </label>
          </div>
        </div>

        {/* ── Idiomas ── */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
            <Globe size={13} strokeWidth={1.8} /> Idiomas
          </h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={langInput}
              onChange={(e) => setLangInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLanguage()}
              placeholder="Ej: Inglés avanzado"
              className="flex-1 bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
            />
            <button
              onClick={addLanguage}
              className="bg-[#22c55e] hover:bg-[#1ea34d] text-black font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
            >
              Añadir
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <span key={lang} className="inline-flex items-center gap-1.5 bg-[#252839] border border-[#2d3142] rounded-full px-3 py-1 text-xs text-[#e2e8f0]">
                {lang}
                <button onClick={() => removeLanguage(lang)} className="text-[#64748b] hover:text-[#ef4444] transition-colors">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* ── Fotos ── */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
            <Camera size={13} strokeWidth={1.8} /> Fotos <span className="text-[10px] text-[#64748b] font-normal">({photos.length}/{MAX_FOTOS})</span>
          </h3>
          <p className="text-xs text-[#64748b] mb-4">
            Las familias quieren verte. Sube fotos tuyas, con niños, haciendo actividades.
            La primera foto será tu foto de portada.
          </p>

          {/* Grid de fotos */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {photos.map((url, idx) => (
                <div key={url} className="relative group aspect-[4/3] rounded-lg overflow-hidden bg-[#0f1117] border border-[#2d3142]">
                  <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" width={400} height={300} loading="lazy" />
                  {idx === 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-[#22c55e] text-black text-[9px] font-bold px-1.5 py-0.5 rounded">PORTADA</span>
                  )}
                  <button
                    onClick={() => removePhoto(url)}
                    className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-all"
                    title="Eliminar foto"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botón subir */}
          {photos.length < MAX_FOTOS && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center gap-2 bg-[#0f1117] border-2 border-dashed border-[#2d3142] hover:border-[#22c55e]/40 rounded-xl px-5 py-4 text-sm text-[#94a3b8] hover:text-[#22c55e] transition-all disabled:opacity-50 w-full justify-center"
              >
                {uploadingPhoto ? (
                  <>Subiendo...</>
                ) : (
                  <><Camera size={14} strokeWidth={1.8} className="inline mr-1.5" />Añadir foto {photos.length > 0 ? `(${photos.length}/${MAX_FOTOS})` : ""}</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Experiencia con niños ── */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
            <Users size={13} strokeWidth={1.8} /> Experiencia con niños
          </h3>
          <textarea
            value={childcareExperience}
            onChange={(e) => setChildcareExperience(e.target.value)}
            placeholder="Describe tu experiencia: ¿qué edades? ¿en qué contexto? ¿por cuánto tiempo? ¿qué actividades hacías? Sé específica — esto es lo que más miran las familias."
            rows={5}
            className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-4 py-3 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none resize-y"
          />
        </div>

        {/* ── Hobbies ── */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
            <Star size={13} strokeWidth={1.8} /> Sobre ti
          </h3>
          <textarea
            value={hobbies}
            onChange={(e) => setHobbies(e.target.value)}
            placeholder="Hobbies, intereses, qué te gusta hacer en tu tiempo libre, cómo eres como persona..."
            rows={3}
            className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-4 py-3 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none resize-y"
          />
          <input
            type="text"
            value={dietaryInfo}
            onChange={(e) => setDietaryInfo(e.target.value)}
            placeholder="Restricciones alimentarias (opcional)"
            className="w-full mt-3 bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
          />
        </div>

        {/* ── Referencias ── */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
            <ClipboardList size={13} strokeWidth={1.8} /> Referencias
          </h3>
          {references.length > 0 && (
            <div className="space-y-2 mb-4">
              {references.map((ref, idx) => (
                <div key={idx} className="flex justify-between items-center bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5">
                  <div className="text-sm">
                    <span className="text-[#e2e8f0] font-medium">{ref.nombre}</span>
                    <span className="text-[#64748b] mx-2">—</span>
                    <span className="text-[#94a3b8]">{ref.relacion}</span>
                    <span className="text-[#64748b] text-xs block">{ref.email}</span>
                  </div>
                  <button onClick={() => removeReference(idx)} className="text-[#64748b] hover:text-[#ef4444] transition-colors text-lg">×</button>
                </div>
              ))}
            </div>
          )}
          {showRefForm ? (
            <div className="space-y-3 bg-[#0f1117]/60 rounded-lg p-4 border border-[#2d3142]">
              <input type="text" value={refNombre} onChange={(e) => setRefNombre(e.target.value)} placeholder="Nombre" className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none" />
              <input type="email" value={refEmail} onChange={(e) => setRefEmail(e.target.value)} placeholder="Email" className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none" />
              <input type="text" value={refTelefono} onChange={(e) => setRefTelefono(e.target.value)} placeholder="Teléfono" className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none" />
              <input type="text" value={refRelacion} onChange={(e) => setRefRelacion(e.target.value)} placeholder="Relación (ej: ex-empleadora, madre de niños que cuidé)" className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none" />
              <div className="flex gap-2">
                <button onClick={addReference} className="bg-[#22c55e] hover:bg-[#1ea34d] text-black font-medium px-4 py-2 rounded-lg text-sm transition-colors">Guardar referencia</button>
                <button onClick={() => setShowRefForm(false)} className="bg-[#2d3142] hover:bg-[#3d4152] text-[#94a3b8] font-medium px-4 py-2 rounded-lg text-sm transition-colors">Cancelar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowRefForm(true)} className="text-sm text-[#22c55e] hover:underline">+ Añadir referencia</button>
          )}
        </div>

        {/* ── Dear Family Letter ── */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <Mail size={13} strokeWidth={1.8} /> Dear Family Letter
            </h3>
            <div className="flex gap-2 flex-wrap">
              <button onClick={generarCarta} className="text-[11px] bg-[#252839] hover:bg-[#2d3142] border border-[#2d3142] text-[#22c55e] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><FileText size={11} strokeWidth={1.8} /> Plantilla</button>
              <button
                onClick={generarConIA}
                disabled={generandoIA}
                className="text-[11px] bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#1ea34d] hover:to-[#15803d] text-black font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
              >
                {generandoIA ? <>Generando...</> : <><Sparkles size={12} /> IA</>}
              </button>
              <button onClick={verCarta} className="text-[11px] border font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1" style={{ borderColor: "rgba(34,197,94,0.3)", color: "#22c55e", background: "rgba(34,197,94,0.06)" }}><Eye size={12} strokeWidth={1.8} />Ver carta</button>
            </div>
          </div>

          {/* Selector tipo perfil */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {[
              { id: "joven_estudiante", label: "Joven", desc: "Estudiante, primera vez" },
              { id: "con_experiencia", label: "Experiencia", desc: "Ya he cuidado niños" },
              { id: "profesional_cambio", label: "Cambio", desc: "Dejo trabajo por esto" },
            ].map(tipo => (
              <button
                key={tipo.id}
                onClick={() => { setTipoPerfil(tipo.id as typeof tipoPerfil); }}
                className="text-[10px] px-2.5 py-1.5 rounded-lg transition-all border"
                style={{
                  background: tipoPerfil === tipo.id ? "rgba(34,197,94,0.12)" : "transparent",
                  borderColor: tipoPerfil === tipo.id ? "rgba(34,197,94,0.3)" : "#2d3142",
                  color: tipoPerfil === tipo.id ? "#22c55e" : "#94a3b8",
                }}
              >
                {tipo.label}
                <span className="block text-[8px] opacity-60">{tipo.desc}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-[#64748b] mb-3">
            Rellena tus datos y fotos arriba, elige tu perfil, y pulsa <strong>IA</strong> para que Guzzi genere tu carta perfecta.
          </p>

          <textarea
            value={letterText}
            onChange={(e) => setLetterText(e.target.value)}
            placeholder={"Dear Host Family,\n\nMy name is... (o pulsa IA para generarla automáticamente)"}
            rows={14}
            className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-4 py-3 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none resize-y font-serif leading-relaxed"
          />

          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Añade anécdotas personales", "Sube fotos con niños", "Sé auténtica, no genérica", "Menciona por qué ese país"].map(tip => (
              <span key={tip} className="text-[9px] px-2 py-1 rounded-full bg-[#252839] text-[#94a3b8] border border-[#2d3142]">{tip}</span>
            ))}
          </div>
        </div>

        {/* Vista previa */}
        {/* ── Plantilla en vivo ── */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <FileText size={13} strokeWidth={1.8} /> Plantilla profesional <span className="text-[10px] text-[#4ade80] font-normal">(vista previa en vivo)</span>
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setShowPlantilla(!showPlantilla)} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
                {showPlantilla ? "Ocultar" : "Mostrar"}
              </button>
              <button onClick={descargarCarta} disabled={descargandoCarta} className="text-xs font-semibold px-4 py-1.5 rounded-lg disabled:opacity-60" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                {descargandoCarta ? "Generando PDF..." : "⬇ Descargar PDF"}
              </button>
            </div>
          </div>
          {showPlantilla && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #252836", maxHeight: "80vh", overflowY: "auto" }}>
              <AuPairPlantilla
                nombre={nombre}
                age={age}
                nationality={nationality}
                ciudad={ciudad}
                languages={languages}
                childcareExperience={childcareExperience}
                hobbies={hobbies}
                letterText={letterText}
                photos={photos}
                paisDestino={paisDestino}
                nivelEducativo={nivelEducativo}
                duracionPreferida={duracionPreferida}
                availableFrom={availableFrom}
                hasDrivingLicense={hasDrivingLicense}
                fumador={fumador}
                primerosAuxilios={primerosAuxilios}
                sabeNadar={sabeNadar}
                dietaryInfo={dietaryInfo}
                references={references}
                tipoPerfil={tipoPerfil}
              />
            </div>
          )}
        </div>

        {/* ── Enviar perfil a familia ── */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-1 flex items-center gap-2">
            <Upload size={13} strokeWidth={1.8} /> Enviar perfil a una familia
          </h3>
          <p className="text-xs text-[#64748b] mb-4">
            Introduce el email de la familia o agencia para enviarles tu perfil Au Pair completo.
          </p>

          {/* ── Agencias disponibles ── */}
          {!cargandoAgencias && agencias.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">🏠 Agencias disponibles</p>
              {agencias.map((a, i) => (
                <button
                  key={i}
                  onClick={() => { setFamilyEmail(a.email); setFamilyName(a.nombre); }}
                  className="w-full text-left bg-[#0f1117] border border-[#2d3142] hover:border-[#22c55e]/40 rounded-lg px-3 py-2.5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#e2e8f0] font-medium truncate">{a.nombre}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>{a.ofertas}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-[#64748b]">
                    <span>{a.pais}</span>
                    <span className="truncate">{a.email}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Contador */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold" style={{ color: auPairStats.disponibles <= 0 ? "#fca5a5" : "#22c55e" }}>
              {auPairStats.disponibles} envíos disponibles hoy
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
              {auPairStats.plan}
            </span>
          </div>

          {/* Éxito / Error */}
          {envioExito && (
            <div className="mb-3 rounded-lg p-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <p className="text-xs font-medium" style={{ color: "#22c55e" }}>{envioExito}</p>
            </div>
          )}
          {envioError && (
            <div className="mb-3 rounded-lg p-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <p className="text-xs font-medium" style={{ color: "#ef4444" }}>{envioError}</p>
            </div>
          )}

          {/* Formulario */}
          <div className="space-y-3">
            <input
              type="email"
              value={familyEmail}
              onChange={(e) => setFamilyEmail(e.target.value)}
              placeholder="Email de la familia o agencia *"
              className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-4 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
            />
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Nombre de la familia (opcional)"
              className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-4 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
            />
            <button
              onClick={enviarPerfil}
              disabled={enviandoPerfil || !familyEmail}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
              style={{
                background: enviandoPerfil ? "#252836" : "linear-gradient(135deg, #22c55e, #16a34a)",
                color: enviandoPerfil ? "#64748b" : "#fff",
              }}
            >
              {enviandoPerfil ? "Enviando..." : <><Upload size={14} strokeWidth={1.8} className="inline mr-1.5" />Enviar perfil Au Pair</>}
            </button>
          </div>
        </div>

        {/* Guardar */}
        <div className="flex gap-3 justify-end">
          <button onClick={() => router.push("/app/emigrar")} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[#2d3142] text-[#94a3b8] hover:bg-[#3d4152] transition-colors">Cancelar</button>
          <button onClick={guardar} disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#22c55e] hover:bg-[#1ea34d] text-black transition-colors disabled:opacity-50">
            {saving ? "Guardando..." : <><Save size={14} strokeWidth={1.8} className="inline mr-1.5" />Guardar perfil Au Pair</>}
          </button>
        </div>
      </section>

      {/* ── Comparativa legal Au Pair ── */}
      <AuPairComparativaLegal />

      {/* ── Calculadora de costes Au Pair ── */}
      <AuPairCalculadoraCostes />

      {/* ── MODAL: Preview antes de enviar perfil Au Pair ── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="card-game max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4" style={{ background: "#111827", border: "1px solid #2d3142" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "#f1f5f9" }}><FileText size={14} strokeWidth={1.8} /> Previsualizar envío</h3>
              <button onClick={() => setShowPreview(false)} className="text-sm" style={{ color: "#64748b" }}><X size={16} strokeWidth={1.8} /></button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span style={{ color: "#64748b" }}>Para:</span>
                <span className="font-medium" style={{ color: "#22c55e" }}>{familyEmail}</span>
              </div>
              {familyName && (
                <div className="flex items-center gap-2">
                  <span style={{ color: "#64748b" }}>Familia:</span>
                  <span style={{ color: "#94a3b8" }}>{familyName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span style={{ color: "#64748b" }}>Asunto:</span>
                <span style={{ color: "#94a3b8" }}>{previewSubject}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: "#64748b" }}>Adjunto:</span>
                <span style={{ color: "#94a3b8" }}>Perfil Au Pair completo (foto, datos, experiencia, referencias)</span>
              </div>
            </div>

            {/* Carta */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "#94a3b8" }}>Carta de presentación:</label>
              <div className="rounded-lg p-4 text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto" style={{ background: "#0f1117", border: "1px solid #1e212b", color: "#cbd5e1" }}>
                {letterText || "No has escrito tu carta de presentación aún. Ve a la sección «Carta de presentación» para redactarla."}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid #2d3142" }}>
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-2.5 rounded-lg text-xs font-medium transition"
                style={{ background: "#252836", color: "#94a3b8" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEnvioAuPair}
                className="flex-1 py-2.5 rounded-lg text-xs font-bold transition"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
              >
                <Check size={13} strokeWidth={2.5} className="inline mr-1" />Confirmar envío
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirmación post-envío ── */}
      {showConfirm && confirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="card-game max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4" style={{ background: "#111827", border: "1px solid #22c55e" }}>
            <div className="text-center">
              <CheckCircle2 size={32} strokeWidth={1.5} style={{ color: "#22c55e", margin: "0 auto" }} />
              <h3 className="text-lg font-bold mt-2" style={{ color: "#22c55e" }}>¡Perfil Au Pair enviado!</h3>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg p-4 space-y-2" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.1)" }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748b" }}>Familia:</span>
                  <span className="font-medium" style={{ color: "#f1f5f9" }}>{confirmData.familyName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748b" }}>Email:</span>
                  <span className="font-medium" style={{ color: "#22c55e" }}>{confirmData.email}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748b" }}>Asunto:</span>
                  <span className="font-medium" style={{ color: "#94a3b8" }}>{confirmData.subject}</span>
                </div>
              </div>

              {/* Carta enviada */}
              <div>
                <label className="block text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: "#94a3b8" }}><Mail size={11} strokeWidth={1.8} className="inline mr-1" /> Carta enviada:</label>
                <div className="rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto" style={{ background: "#0f1117", border: "1px solid #1e212b", color: "#cbd5e1" }}>
                  {confirmData.carta}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowConfirm(false)}
              className="w-full py-2.5 rounded-lg text-sm font-bold transition"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
