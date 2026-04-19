"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { jsPDF } from "jspdf";
import CVUploader from "@/components/CVUploader";

type Paso = 1 | 2 | 3;

export default function CurriculumPage() {
  const router = useRouter();
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [paso, setPaso] = useState<Paso>(1);

  // Paso 2
  const [textoCv, setTextoCv] = useState("");
  const [puesto, setPuesto] = useState("");
  const [infoExtra, setInfoExtra] = useState("");
  const [fotoDatos, setFotoDatos] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [cargandoTexto, setCargandoTexto] = useState(false);
  const [error, setError] = useState("");

  // Paso 3
  const [cvMejorado, setCvMejorado] = useState("");
  const [esCarta, setEsCarta] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();
      if (!user) router.push("/auth/login");
    }
    void verificar();
  }, [router]);

  // Comprueba que el texto extraído del PDF es legible (no binario/garbled)
  function esTextoLegible(texto: string): boolean {
    if (!texto || texto.length < 20) return false;
    let legibles = 0;
    for (const c of texto) {
      const code = c.charCodeAt(0);
      // Contar como legibles: ASCII imprimible, saltos de línea/tab, Latin-1 (acentos, ñ, ü...)
      if (
        (code >= 32 && code <= 126) ||
        code === 10 || code === 13 || code === 9 ||
        (code >= 160 && code <= 255)
      ) legibles++;
    }
    return legibles / texto.length >= 0.80; // 80%+ de chars legibles
  }

  // Al pasar al paso 2, cargar el texto del CV subido automáticamente
  async function irAPaso2() {
    setPaso(2);
    if (textoCv.trim()) return; // ya hay texto, no sobreescribir
    setCargandoTexto(true);
    try {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) return;
      const res = await fetch("/api/cv/texto", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const datos = await res.json() as { texto?: string | null; error?: string };
      if (datos.texto && esTextoLegible(datos.texto)) {
        setTextoCv(datos.texto);
      }
      // Si el texto es ilegible o vacío, el textarea queda en blanco para pegar manualmente
    } catch {
      // Si falla, el usuario puede pegar manualmente — no es crítico
    } finally {
      setCargandoTexto(false);
    }
  }

  async function mejorarCV() {
    if (!textoCv.trim()) { setError("Por favor, pega el texto de tu CV."); return; }
    setProcesando(true);
    setError("");
    try {
      const textoFinal = infoExtra.trim()
        ? `${textoCv}\n\n--- INFORMACIÓN ADICIONAL ---\n${infoExtra}`
        : textoCv;
      const res = await fetch("/api/cv/mejorar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: textoFinal, jobTitle: puesto }),
      });
      const datos = await res.json() as { cvMejorado?: string; error?: string };
      if (!res.ok) throw new Error(datos.error ?? "Error al mejorar el CV");
      setCvMejorado(datos.cvMejorado ?? "");
      setEsCarta(false);
      setPaso(3);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcesando(false);
    }
  }

  async function generarCarta() {
    if (!textoCv.trim() || !puesto.trim()) {
      setError("Necesitas el CV y el nombre del puesto para generar la carta.");
      return;
    }
    setProcesando(true);
    setError("");
    try {
      const res = await fetch("/api/cv/mejorar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: textoCv, jobTitle: puesto, tipo: "carta" }),
      });
      const datos = await res.json() as { cvMejorado?: string; error?: string };
      if (!res.ok) throw new Error(datos.error ?? "Error al generar la carta");
      setCvMejorado(datos.cvMejorado ?? "");
      setEsCarta(true);
      setPaso(3);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcesando(false);
    }
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFotoDatos(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function descargarPDF() {
    if (!cvMejorado) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const mL = 40, mR = 40;
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    let y = 50;

    if (fotoDatos) {
      try { doc.addImage(fotoDatos, "JPEG", w - mR - 80, 30, 80, 80); } catch { /* ignorar */ }
    }

    doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(37, 99, 235);
    doc.text("BuscayCurra", mL, y);
    doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(100, 116, 139);
    doc.text("buscaycurra.es", mL, y + 18);
    y += 34;

    doc.setDrawColor(249, 115, 22).setLineWidth(2).line(mL, y, w - mR, y);
    y += 20;

    if (puesto) {
      doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(17, 24, 39);
      doc.text(esCarta ? `Carta de presentación — ${puesto}` : `CV mejorado — ${puesto}`, mL, y);
      y += 24;
    }

    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(55, 65, 81);
    const lineas = doc.splitTextToSize(cvMejorado, w - mL - mR) as string[];
    for (const linea of lineas) {
      if (y > h - 60) { doc.addPage(); y = 40; }
      doc.text(linea, mL, y);
      y += 14;
    }

    doc.setFontSize(8).setTextColor(156, 163, 175);
    doc.text("Generado por BuscayCurra — buscaycurra.es", w / 2, h - 20, { align: "center" });

    const p = puesto.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]/g, "") || "Documento";
    doc.save(esCarta ? `Carta_${p}_BuscayCurra.pdf` : `CV_Mejorado_${p}_BuscayCurra.pdf`);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(cvMejorado);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("No se pudo copiar. Selecciona el texto manualmente.");
    }
  }

  const pasoLabels = ["Subir CV", "Mejorar con IA", "Descargar"];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Cabecera */}
      <div className="text-white py-8 px-4" style={{ backgroundColor: "#2563EB" }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">📄 Mi Currículum</h1>
          <p className="text-blue-100 mt-1 text-sm">
            Sube tu CV, mejóralo con IA y descárgalo listo para enviar
          </p>
        </div>
      </div>

      {/* Indicador de pasos */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          {([1, 2, 3] as Paso[]).map((n, i) => (
            <div key={n} className="flex items-center gap-2">
              {i > 0 && <div className="w-10 h-px bg-gray-200 flex-shrink-0" />}
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors"
                  style={{
                    backgroundColor: paso > n ? "#10b981" : paso === n ? "#2563EB" : "#e5e7eb",
                    color: paso >= n ? "white" : "#6b7280",
                  }}
                >
                  {paso > n ? "✓" : n}
                </div>
                <span
                  className="text-sm font-medium hidden sm:block transition-colors"
                  style={{ color: paso === n ? "#2563EB" : "#9ca3af" }}
                >
                  {pasoLabels[n - 1]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* ── Paso 1: Subir CV ─────────────────────────────────────────── */}
        {paso === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Sube tu CV en PDF</h2>
              <p className="text-sm text-gray-500 mt-1">
                Tu CV se adjuntará automáticamente a cada candidatura que envíes
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <CVUploader />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => void irAPaso2()}
                className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition"
                style={{ backgroundColor: "#2563EB" }}
              >
                Continuar: Mejorar con IA →
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 2: Mejorar con IA ───────────────────────────────────── */}
        {paso === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Mejora tu CV con IA</h2>
              <p className="text-sm text-gray-500 mt-1">
                Pega el texto de tu CV y la IA lo optimizará para pasar los filtros ATS
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                ⚠️ {error}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ¿Para qué puesto? <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value)}
                  placeholder="Ej: Desarrollador Full Stack, Administrativo, Electricista..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Texto de tu CV
                  {cargandoTexto && (
                    <span className="ml-2 text-blue-500 font-normal text-xs">
                      Cargando desde tu PDF...
                    </span>
                  )}
                </label>
                {cargandoTexto ? (
                  <div className="w-full border border-gray-200 rounded-xl px-4 py-10 flex items-center justify-center gap-2 bg-gray-50">
                    <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Extrayendo texto del PDF...</span>
                  </div>
                ) : (
                  <textarea
                    value={textoCv}
                    onChange={(e) => setTextoCv(e.target.value)}
                    placeholder="El texto de tu CV aparecerá aquí automáticamente, o pégalo manualmente..."
                    rows={10}
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none leading-relaxed transition"
                  />
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {textoCv.split(/\s+/).filter(Boolean).length} palabras
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ¿Quieres añadir algo más? <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={infoExtra}
                  onChange={(e) => setInfoExtra(e.target.value)}
                  placeholder="Cursos recientes, habilidades nuevas, logros que quieras destacar..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto de perfil para el PDF <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fotoInputRef.current?.click()}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
                    style={{ backgroundColor: "#F97316" }}
                  >
                    📷 Elegir foto
                  </button>
                  {fotoDatos ? (
                    <div className="flex items-center gap-2">
                      <img src={fotoDatos} alt="Preview foto" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                      <span className="text-xs text-green-600 font-medium">Foto lista ✓</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Se incluirá en la esquina del PDF</span>
                  )}
                </div>
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFoto}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
              <button
                onClick={() => setPaso(1)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
              >
                ← Volver
              </button>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => void generarCarta()}
                  disabled={procesando || !textoCv.trim() || !puesto.trim()}
                  className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#F97316" }}
                >
                  {procesando ? "Generando..." : "✉️ Generar carta de presentación"}
                </button>
                <button
                  onClick={() => void mejorarCV()}
                  disabled={procesando || !textoCv.trim()}
                  className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#2563EB" }}
                >
                  {procesando ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mejorando...
                    </span>
                  ) : "✨ Mejorar CV con IA →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Paso 3: Resultado y descarga ─────────────────────────────── */}
        {paso === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {esCarta ? "Carta de presentación lista" : "CV mejorado listo"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Revisa el resultado, descárgalo y empieza a enviar candidaturas
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => void copiar()}
                  className="px-4 py-2 text-sm font-medium text-white rounded-xl hover:opacity-90 transition"
                  style={{ backgroundColor: "#F97316" }}
                >
                  {copiado ? "✓ Copiado" : "📋 Copiar"}
                </button>
                <button
                  onClick={descargarPDF}
                  className="px-4 py-2 text-sm font-medium text-white rounded-xl hover:opacity-90 transition"
                  style={{ backgroundColor: "#2563EB" }}
                >
                  ⬇️ Descargar PDF
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 max-h-[500px] overflow-y-auto">
              {esTextoLegible(cvMejorado) ? (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                  {cvMejorado}
                </pre>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-2xl mb-2">⚠️</p>
                  <p className="text-sm">La IA no pudo procesar el contenido. Pega el texto del CV manualmente y vuelve a intentarlo.</p>
                  <button
                    onClick={() => { setCvMejorado(""); setPaso(2); }}
                    className="mt-4 px-4 py-2 text-sm font-medium text-white rounded-xl"
                    style={{ backgroundColor: "#2563EB" }}
                  >
                    ← Volver a intentarlo
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <button
                onClick={() => { setError(""); setPaso(2); }}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
              >
                ← Volver a mejorar
              </button>
              <Link
                href="/app/buscar"
                className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition text-center"
                style={{ backgroundColor: "#2563EB" }}
              >
                🔍 Buscar ofertas de trabajo →
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
