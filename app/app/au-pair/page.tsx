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
import { PAISES } from "@/lib/paises";

export default function AuPairProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Form fields
  const [letterText, setLetterText] = useState("");
  const [age, setAge] = useState("");
  const [nationality, setNationality] = useState("ES");
  const [languages, setLanguages] = useState<string[]>(["Español"]);
  const [langInput, setLangInput] = useState("");
  const [childcareExperience, setChildcareExperience] = useState("");
  const [hasDrivingLicense, setHasDrivingLicense] = useState(false);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [dietaryInfo, setDietaryInfo] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [references, setReferences] = useState<AuPairReference[]>([]);
  const [paisDestino, setPaisDestino] = useState("UK");
  const [tipoPerfil, setTipoPerfil] = useState<"joven_estudiante" | "con_experiencia" | "profesional_cambio">("joven_estudiante");
  const [generandoIA, setGenerandoIA] = useState(false);
  const [auPairStats, setAuPairStats] = useState({ hoy: 0, limiteHoy: 2, disponibles: 2, plan: "free" });
  const [previewHTML, setPreviewHTML] = useState("");
  const [descargandoCarta, setDescargandoCarta] = useState(false);
  const iframeCartaRef = useRef<HTMLIFrameElement>(null);

  // Nuevo: modal de referencia
  const [refNombre, setRefNombre] = useState("");
  const [refEmail, setRefEmail] = useState("");
  const [refTelefono, setRefTelefono] = useState("");
  const [refRelacion, setRefRelacion] = useState("");
  const [showRefForm, setShowRefForm] = useState(false);

  // Cargar perfil existente
  useEffect(() => {
    getSupabaseBrowser().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);

      // Cargar perfil si existe
      const res = await fetch(`/api/au-pair/profile?userId=${user.id}`);
      const json = await res.json();
      if (json.profile) {
        const p = json.profile as AuPairProfile;
        setLetterText(p.letter_text || "");
        setAge(p.age?.toString() || "");
        setNationality(p.nationality || "ES");
        setLanguages(p.languages || ["Español"]);
        setChildcareExperience(p.childcare_experience || "");
        setHasDrivingLicense(p.has_driving_license || false);
        setAvailableFrom(p.available_from || "");
        setAvailableTo(p.available_to || "");
        setDietaryInfo(p.dietary_info || "");
        setHobbies(p.hobbies || "");
        setReferences(
          Array.isArray(p.references_json)
            ? p.references_json
            : []
        );
      }

      // Cargar país del localStorage
      const saved = localStorage.getItem("bc_pais");
      if (saved) setPaisDestino(saved);

      // Cargar stats de envíos
      fetch(`/api/user/stats?userId=${user.id}`).then(r => r.json()).then(d => {
        setAuPairStats({ hoy: d.auPair.hoy, limiteHoy: d.auPair.limiteHoy, disponibles: d.auPair.disponibles, plan: d.plan });
      }).catch(() => {});

      setLoading(false);
    });
  }, [router]);

  const addLanguage = useCallback(() => {
    const lang = langInput.trim();
    if (lang && !languages.includes(lang)) {
      setLanguages([...languages, lang]);
      setLangInput("");
    }
  }, [langInput, languages]);

  const removeLanguage = useCallback(
    (lang: string) => {
      setLanguages(languages.filter((l) => l !== lang));
    },
    [languages]
  );

  const addReference = useCallback(() => {
    if (!refNombre || !refEmail) return;
    setReferences([
      ...references,
      { nombre: refNombre, email: refEmail, telefono: refTelefono, relacion: refRelacion },
    ]);
    setRefNombre("");
    setRefEmail("");
    setRefTelefono("");
    setRefRelacion("");
    setShowRefForm(false);
  }, [refNombre, refEmail, refTelefono, refRelacion, references]);

  const removeReference = useCallback(
    (idx: number) => {
      setReferences(references.filter((_, i) => i !== idx));
    },
    [references]
  );

  const generarCarta = useCallback(() => {
    const plantilla = generarPlantillaLetter({
      nombre: "",
      edad: age ? parseInt(age) : undefined,
      nacionalidad: PAISES[nationality]?.nombre || nationality,
      idiomas: languages,
      experiencia: childcareExperience,
      hobbies,
      paisDestino: PAISES[paisDestino]?.nombre || paisDestino,
    });
    setLetterText(plantilla);
    setMensaje("✅ Plantilla generada. ¡Personalízala a tu estilo!");
    setTimeout(() => setMensaje(""), 4000);
  }, [age, nationality, languages, childcareExperience, hobbies, paisDestino]);

  const generarConIA = useCallback(async () => {
    setGenerandoIA(true);
    setError("");
    try {
      const res = await fetch("/api/au-pair/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: "",
          edad: age ? parseInt(age) : undefined,
          nacionalidad: nationality,
          idiomas: languages.join(", "),
          idiomaDestino: PAISES[paisDestino]?.idioma || "English",
          experiencia: childcareExperience || undefined,
          sector: "",
          hobbies,
          disponibleDesde: availableFrom || undefined,
          tipoPerfil,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLetterText(json.letter);
        setMensaje("✅ ¡Carta generada por IA! Personaliza los detalles a tu gusto.");
      } else {
        setError(json.error || "Error al generar");
      }
    } catch {
      setError("Error de conexión al generar con IA");
    } finally {
      setGenerandoIA(false);
    }
  }, [age, nationality, languages, paisDestino, childcareExperience, hobbies, availableFrom, tipoPerfil]);

  const guardar = useCallback(async () => {
    if (!letterText.trim()) {
      setError("La carta 'Dear Family' es obligatoria");
      return;
    }
    setSaving(true);
    setError("");

    const res = await fetch("/api/au-pair/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        letter_text: letterText,
        age: age ? parseInt(age) : null,
        nationality,
        languages,
        childcare_experience: childcareExperience,
        has_driving_license: hasDrivingLicense,
        available_from: availableFrom || null,
        available_to: availableTo || null,
        dietary_info: dietaryInfo,
        hobbies,
        photos: [],
        references_json: references,
      }),
    });

    const json = await res.json();
    setSaving(false);

    if (json.ok) {
      setMensaje("✅ Perfil Au Pair guardado correctamente");
      setTimeout(() => setMensaje(""), 4000);
    } else {
      setError(json.error || "Error al guardar");
    }
  }, [
    userId, letterText, age, nationality, languages, childcareExperience,
    hasDrivingLicense, availableFrom, availableTo, dietaryInfo, hobbies, references,
  ]);

  function verCarta() {
    if (!letterText.trim()) { setError("Escribe o genera tu carta antes de previsualizar."); return; }
    const pais = PAISES[paisDestino];
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Au Pair Letter</title>
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
    <div class="name">${age ? `Au Pair, ${age} años` : "Au Pair Profile"}</div>
    <div class="tagline">Childcare Professional · Dear Family Letter</div>
    <div class="meta">
      ${PAISES[nationality] ? `<div class="meta-item">🌍 ${PAISES[nationality].bandera} ${PAISES[nationality].nombre}</div>` : ""}
      ${languages.length > 0 ? `<div class="meta-item">🗣 ${languages.join(" · ")}</div>` : ""}
      ${hasDrivingLicense ? `<div class="meta-item">🚗 Driving license</div>` : ""}
      ${availableFrom ? `<div class="meta-item">📅 Available from ${availableFrom}</div>` : ""}
    </div>
  </div>
  <div class="body">
    <div class="date">${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
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
      a.download = "Carta_AuPair_BuscayCurra.pdf";
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
        <span className="text-5xl mb-4 block">🧒</span>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Tu Perfil Au Pair</h1>
        <p className="text-[#94a3b8] max-w-lg mx-auto text-sm">
          Las familias no buscan un CV. Buscan conocerte. Crea tu carta de presentación
          y tu perfil para aplicar a ofertas au pair.
        </p>
        {/* Stats de envíos */}
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
              ✨ {auPairStats.disponibles} disponible{auPairStats.disponibles !== 1 ? "s" : ""} hoy — ¡vuelve mañana!
            </p>
          </div>
        )}
      </section>

      {/* Formulario */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 space-y-6">
        {mensaje && (
          <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-4 text-sm text-[#22c55e]">
            {mensaje}
          </div>
        )}
        {error && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 text-sm text-[#ef4444]">
            {error}
          </div>
        )}

        {/* Datos personales */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
            <span>👤</span> Datos personales
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
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
              <label className="text-xs text-[#64748b] block mb-1">Nacionalidad</label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              >
                {Object.entries(PAISES).map(([code, p]) => (
                  <option key={code} value={code}>
                    {p.bandera} {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">País de destino</label>
              <select
                value={paisDestino}
                onChange={(e) => setPaisDestino(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              >
                {PAISES_AU_PAIR.map((code) => (
                  <option key={code} value={code}>
                    {PAISES[code]?.bandera || ""} {PAISES[code]?.nombre || code}
                  </option>
                ))}
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
            <div className="flex items-center gap-3 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDrivingLicense}
                  onChange={(e) => setHasDrivingLicense(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#2d3142] rounded-full peer peer-checked:bg-[#22c55e] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
              <span className="text-sm text-[#94a3b8]">Carnet de conducir</span>
            </div>
          </div>
        </div>

        {/* Idiomas */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
            <span>🗣️</span> Idiomas
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
              <span
                key={lang}
                className="inline-flex items-center gap-1.5 bg-[#252839] border border-[#2d3142] rounded-full px-3 py-1 text-xs text-[#e2e8f0]"
              >
                {lang}
                <button
                  onClick={() => removeLanguage(lang)}
                  className="text-[#64748b] hover:text-[#ef4444] transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Experiencia con niños */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
            <span>👶</span> Experiencia con niños
          </h3>
          <textarea
            value={childcareExperience}
            onChange={(e) => setChildcareExperience(e.target.value)}
            placeholder="Describe tu experiencia: ¿qué edades? ¿en qué contexto? ¿por cuánto tiempo? ¿qué actividades hacías? Sé específica — esto es lo que más miran las familias."
            rows={5}
            className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-4 py-3 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none resize-y"
          />
        </div>

        {/* Hobbies y personalidad */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
            <span>🌟</span> Sobre ti
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

        {/* Referencias */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
            <span>📋</span> Referencias
          </h3>
          {references.length > 0 && (
            <div className="space-y-2 mb-4">
              {references.map((ref, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5"
                >
                  <div className="text-sm">
                    <span className="text-[#e2e8f0] font-medium">{ref.nombre}</span>
                    <span className="text-[#64748b] mx-2">—</span>
                    <span className="text-[#94a3b8]">{ref.relacion}</span>
                    <span className="text-[#64748b] text-xs block">{ref.email}</span>
                  </div>
                  <button
                    onClick={() => removeReference(idx)}
                    className="text-[#64748b] hover:text-[#ef4444] transition-colors text-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {showRefForm ? (
            <div className="space-y-3 bg-[#0f1117]/60 rounded-lg p-4 border border-[#2d3142]">
              <input
                type="text"
                value={refNombre}
                onChange={(e) => setRefNombre(e.target.value)}
                placeholder="Nombre"
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              />
              <input
                type="email"
                value={refEmail}
                onChange={(e) => setRefEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              />
              <input
                type="text"
                value={refTelefono}
                onChange={(e) => setRefTelefono(e.target.value)}
                placeholder="Teléfono"
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              />
              <input
                type="text"
                value={refRelacion}
                onChange={(e) => setRefRelacion(e.target.value)}
                placeholder="Relación (ej: ex-empleadora, madre de niños que cuidé)"
                className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={addReference}
                  className="bg-[#22c55e] hover:bg-[#1ea34d] text-black font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Guardar referencia
                </button>
                <button
                  onClick={() => setShowRefForm(false)}
                  className="bg-[#2d3142] hover:bg-[#3d4152] text-[#94a3b8] font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowRefForm(true)}
              className="text-sm text-[#22c55e] hover:underline"
            >
              + Añadir referencia
            </button>
          )}
        </div>

        {/* Dear Family Letter */}
        <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-6">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-[#e2e8f0] flex items-center gap-2">
              <span>💌</span> Dear Family Letter
            </h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={generarCarta}
                className="text-[11px] bg-[#252839] hover:bg-[#2d3142] border border-[#2d3142] text-[#22c55e] px-3 py-1.5 rounded-lg transition-colors"
              >
                📝 Plantilla
              </button>
              <button
                onClick={generarConIA}
                disabled={generandoIA}
                className="text-[11px] bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#1ea34d] hover:to-[#15803d] text-black font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
              >
                {generandoIA ? <>⏳ Generando...</> : <>✨ IA</>}
              </button>
              <button
                onClick={verCarta}
                className="text-[11px] border font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ borderColor: "rgba(34,197,94,0.3)", color: "#22c55e", background: "rgba(34,197,94,0.06)" }}
              >
                👁 Ver carta
              </button>
            </div>
          </div>

          {/* Selector de tipo de perfil */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {[
              { id: "joven_estudiante", label: "🎓 Joven", desc: "Estudiante, primera vez" },
              { id: "con_experiencia", label: "👶 Experiencia", desc: "Ya he cuidado niños" },
              { id: "profesional_cambio", label: "💼 Cambio", desc: "Dejo trabajo por esto" },
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
            ⚡ Elige tu perfil, rellena tus datos arriba, y pulsa <strong>✨ IA</strong> para que Guzzi genere tu carta perfecta. O usa <strong>📝 Plantilla</strong> para empezar con un ejemplo.
          </p>

          <textarea
            value={letterText}
            onChange={(e) => setLetterText(e.target.value)}
            placeholder="Dear Host Family,

My name is... (o pulsa ✨ IA para generarla automáticamente)"
            rows={14}
            className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-4 py-3 text-sm text-[#f1f5f9] focus:border-[#22c55e]/40 focus:outline-none resize-y font-serif leading-relaxed"
          />

          {/* Sugerencias */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              "✏️ Añade anécdotas personales",
              "📸 Sube fotos con niños",
              "💬 Sé auténtica, no genérica",
              "🔍 Menciona por qué ese país",
            ].map(tip => (
              <span key={tip} className="text-[9px] px-2 py-1 rounded-full bg-[#252839] text-[#94a3b8] border border-[#2d3142]">
                {tip}
              </span>
            ))}
          </div>
        </div>

        {/* Vista previa de la carta */}
        {previewHTML && (
          <div className="bg-[#1a1d2e] border border-[#2d3142] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-[#e2e8f0]">Vista previa — Plantilla profesional</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewHTML("")}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ border: "1px solid #2d3142", color: "#94a3b8" }}
                >
                  ← Cerrar
                </button>
                <button
                  onClick={descargarCarta}
                  disabled={descargandoCarta}
                  className="text-xs font-semibold px-4 py-1.5 rounded-lg disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
                >
                  {descargandoCarta ? "Generando PDF..." : "⬇ Descargar carta PDF"}
                </button>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #252836" }}>
              <iframe
                ref={iframeCartaRef}
                srcDoc={previewHTML}
                className="w-full bg-white"
                style={{ height: "700px", border: "none" }}
                title="Vista previa carta Au Pair"
              />
            </div>
          </div>
        )}

        {/* Guardar */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => router.push("/app/emigrar")}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[#2d3142] text-[#94a3b8] hover:bg-[#3d4152] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#22c55e] hover:bg-[#1ea34d] text-black transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : "💾 Guardar perfil Au Pair"}
          </button>
        </div>
      </section>
    </main>
  );
}
