"use client";

// Deshabilitar prerenderizado estático — la página requiere autenticación dinámica
export const dynamic = "force-dynamic";

/**
 * app/app/curriculum/page.tsx — Mejorador de CV con IA
 *
 * Diseño en dos columnas:
 *   - Izquierda: textarea con el CV del usuario, input con el puesto objetivo
 *                y botón "Mejorar con IA"
 *   - Derecha:   área con el CV mejorado por la IA y botón "Copiar"
 *
 * También incluye un botón inferior para generar carta de presentación.
 * Llama a POST /api/cv/mejorar con el texto del CV y el título del puesto.
 * Si el usuario no está logado, redirige a /auth/login.
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import CVUploader from "@/components/CVUploader";


// ─── Componente Principal ─────────────────────────────────────────────────────

export default function CurriculumPage() {
  const router = useRouter();

  // Texto del CV original (introducido por el usuario)
  const [textoCv, setTextoCv] = useState("");
  // Puesto al que quiere aplicar
  const [puesto, setPuesto] = useState("");
  // CV mejorado devuelto por la IA
  const [cvMejorado, setCvMejorado] = useState("");
  // Estado de carga mientras la IA procesa
  const [procesando, setProcesando] = useState(false);
  // Mensaje de error
  const [error, setError] = useState("");
  // Indica si se ha copiado el texto al portapapeles
  const [copiado, setCopiado] = useState(false);
  // Indica si el resultado actual es una carta de presentación (true) o CV mejorado (false)
  const [esCarta, setEsCarta] = useState(false);

  // Referencia al área de resultados para hacer scroll automático
  const resultadoRef = useRef<HTMLDivElement>(null);

  // Verificar sesión al cargar
  useEffect(() => {
    async function verificarSesion() {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();
      if (!user) router.push("/auth/login");
    }
    verificarSesion();
  }, [router]);

  /**
   * Envía el CV a la API de IA para mejorarlo.
   * Valida que haya texto antes de llamar.
   */
  async function mejorarCV(e: React.FormEvent) {
    e.preventDefault();

    if (!textoCv.trim()) {
      setError("Por favor, pega tu CV antes de continuar.");
      return;
    }

    setProcesando(true);
    setError("");
    setCvMejorado("");

    try {
      const respuesta = await fetch("/api/cv/mejorar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: textoCv, jobTitle: puesto }),
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json();
        throw new Error(datos.error || "Error al mejorar el CV. Inténtalo de nuevo.");
      }

      const datos = await respuesta.json();
      setCvMejorado(datos.cvMejorado || "");
      // Marcar que el resultado es un CV mejorado (no carta)
      setEsCarta(false);

      // Scroll automático al resultado
      setTimeout(() => {
        resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError((err as Error).message || "Error al procesar tu CV");
    } finally {
      setProcesando(false);
    }
  }

  /**
   * Genera una carta de presentación basada en el CV mejorado.
   * Llama a la misma API con una petición especial.
   */
  async function generarCarta() {
    if (!textoCv.trim() || !puesto.trim()) {
      setError("Necesitas el CV y el nombre del puesto para generar la carta.");
      return;
    }

    setProcesando(true);
    setError("");

    try {
      const respuesta = await fetch("/api/cv/mejorar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText: textoCv,
          jobTitle: puesto,
          tipo: "carta",
        }),
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json();
        throw new Error(datos.error || "Error al generar la carta");
      }

      const datos = await respuesta.json();
      setCvMejorado(datos.cvMejorado || "");
      // Marcar que el resultado es una carta de presentación
      setEsCarta(true);

      setTimeout(() => {
        resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError((err as Error).message || "Error al generar la carta");
    } finally {
      setProcesando(false);
    }
  }

  /**
   * Genera y descarga un PDF con el texto del CV mejorado o la carta de presentación.
   * Usa jsPDF para crear el documento en el cliente, sin necesidad de API.
   *
   * Estructura del PDF:
   *   - Cabecera con el nombre "BuscayCurra" en azul (#2563EB)
   *   - Línea separadora naranja (#F97316)
   *   - Texto del contenido bien formateado con saltos de línea
   *   - Pie de página con "Generado por BuscayCurra — buscaycurra.es"
   *
   * @param esCarta - true si es carta de presentación, false si es CV mejorado
   */
  function descargarComoPDF(esCarta: boolean) {
    if (!cvMejorado) return;

    // Crear nuevo documento PDF (A4, puntos)
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    const margenIzq = 40;
    const margenDer = 40;
    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPagina = doc.internal.pageSize.getHeight();
    const anchoUtil = anchoPagina - margenIzq - margenDer;
    let y = 50; // Posición vertical actual

    // ── Cabecera: nombre de la marca en azul ─────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Azul #2563EB en RGB
    doc.text("BuscayCurra", margenIzq, y);
    y += 8;

    // Subtítulo de la marca
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // Gris neutro
    doc.text("buscaycurra.es", margenIzq, y + 10);
    y += 28;

    // ── Línea separadora naranja ──────────────────────────────────────────────
    doc.setDrawColor(249, 115, 22); // Naranja #F97316 en RGB
    doc.setLineWidth(2);
    doc.line(margenIzq, y, anchoPagina - margenDer, y);
    y += 20;

    // ── Título del documento ──────────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39); // Gris oscuro
    const tituloDoc = esCarta
      ? `Carta de presentación — ${puesto}`
      : `CV mejorado — ${puesto}`;
    doc.text(tituloDoc, margenIzq, y);
    y += 24;

    // ── Contenido del CV/carta ────────────────────────────────────────────────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81); // Gris texto

    // Dividir el texto en líneas que quepan en el ancho disponible
    const lineas = doc.splitTextToSize(cvMejorado, anchoUtil) as string[];

    for (const linea of lineas) {
      // Si la línea no cabe en la página actual, crear una nueva
      if (y > altoPagina - 60) {
        doc.addPage();
        y = 40;
      }
      doc.text(linea, margenIzq, y);
      y += 14; // Interlineado
    }

    // ── Pie de página en la última página ────────────────────────────────────
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // Gris claro
    doc.text(
      "Generado por BuscayCurra — buscaycurra.es",
      anchoPagina / 2,
      altoPagina - 20,
      { align: "center" }
    );

    // ── Nombre del archivo según el tipo de documento ─────────────────────────
    // Limpiamos el nombre del puesto para usarlo en el nombre de archivo
    const puestoLimpio = puesto.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]/g, "") || "Puesto";
    const nombreArchivo = esCarta
      ? `Carta_Presentacion_${puestoLimpio}_BuscayCurra.pdf`
      : `CV_Mejorado_${puestoLimpio}_BuscayCurra.pdf`;

    // Guardar y descargar el PDF en el cliente
    doc.save(nombreArchivo);
  }

  /**
   * Copia el texto del CV mejorado al portapapeles.
   */
  async function copiarAlPortapapeles() {
    if (!cvMejorado) return;
    try {
      await navigator.clipboard.writeText(cvMejorado);
      setCopiado(true);
      // Restaurar el texto del botón tras 2 segundos
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("No se pudo copiar al portapapeles. Selecciona el texto manualmente.");
    }
  }

  return (
    <div className="min-h-screen pt-16">

      {/* ── Cabecera de la página ──────────────────────────────────────── */}
      <div className="text-white py-10 px-4" style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold">📄 Mejorar CV con IA</h1>
          <p className="text-blue-100 mt-1 text-sm">
            Nuestra IA adapta tu CV al puesto perfecto en segundos
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Mensaje de error ───────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ── Dos columnas: entrada y resultado ─────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Columna izquierda: formulario de entrada */}
          <div className="card-game p-6">
            <h2 className="font-semibold text-[#f0ebe0] mb-5">Tu CV actual</h2>
            <form onSubmit={mejorarCV} className="flex flex-col gap-4">

              {/* Campo: puesto objetivo */}
              <div>
                <label className="block text-sm font-medium text-[#b0a890] mb-1.5">
                  ¿Para qué puesto?
                </label>
                <input
                  type="text"
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value)}
                  placeholder="Ej: Desarrollador Full Stack, Contable, Electricista..."
                  className="w-full text-sm border border-[#3d3c30] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Campo: texto del CV */}
              <div>
                <label className="block text-sm font-medium text-[#b0a890] mb-1.5">
                  Pega tu CV aquí
                </label>
                <textarea
                  value={textoCv}
                  onChange={(e) => setTextoCv(e.target.value)}
                  placeholder="Copia y pega el texto de tu CV actual..."
                  rows={14}
                  className="w-full text-sm border border-[#3d3c30] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none leading-relaxed"
                />
                <p className="text-xs text-[#504a3a] mt-1">
                  {textoCv.split(/\s+/).filter(Boolean).length} palabras
                </p>
              </div>

              {/* Botón mejorar CV */}
              <button
                type="submit"
                disabled={procesando || !textoCv.trim()}
                className="w-full py-3 font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}
              >
                {procesando ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    La IA está mejorando tu CV...
                  </span>
                ) : (
                  "✨ Mejorar con IA"
                )}
              </button>
            </form>
          </div>

          {/* Columna derecha: resultado de la IA */}
          <div ref={resultadoRef} className="card-game p-6">
            <div className="flex items-center justify-between mb-5">
              {/* Título dinámico según si es CV o carta de presentación */}
              <h2 className="font-semibold text-[#f0ebe0]">
                {esCarta ? "Carta de presentación" : "CV mejorado"}
              </h2>
              {/* Botones de acción: solo visibles cuando hay resultado */}
              {cvMejorado && (
                <div className="flex items-center gap-2">
                  {/* Botón copiar al portapapeles */}
                  <button
                    onClick={copiarAlPortapapeles}
                    className="px-4 py-2 text-sm font-medium text-white rounded-xl transition hover:opacity-90"
                    style={{ backgroundColor: "#F97316" }}
                  >
                    {copiado ? "✓ Copiado" : "📋 Copiar"}
                  </button>
                  {/* Botón descargar como PDF — generación 100% en el cliente con jspdf */}
                  <button
                    onClick={() => descargarComoPDF(esCarta)}
                    className="px-4 py-2 text-sm font-medium text-white rounded-xl transition hover:opacity-90"
                    style={{ backgroundColor: "#F97316" }}
                  >
                    {esCarta ? "⬇️ Descargar carta en PDF" : "⬇️ Descargar CV mejorado en PDF"}
                  </button>
                </div>
              )}
            </div>

            {/* Área del resultado */}
            {procesando ? (
              // Skeleton de carga mientras la IA procesa
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-3 bg-gray-200 rounded"
                    style={{ width: `${60 + (i % 4) * 10}%` }}
                  />
                ))}
              </div>
            ) : cvMejorado ? (
              // CV mejorado con formato preservado
              <pre className="text-sm text-[#b0a890] whitespace-pre-wrap leading-relaxed font-sans">
                {cvMejorado}
              </pre>
            ) : (
              // Estado vacío inicial
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <p className="text-4xl mb-3">🤖</p>
                <p className="text-[#706a58] text-sm">
                  Aquí aparecerá tu CV mejorado por la IA
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Subir CV PDF ──────────────────────────── */}
        <div className="mt-6 card-game p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#f0ebe0]">Sube tu CV en PDF</h3>
              <p className="text-sm text-[#706a58] mt-0.5">
                Tu CV PDF se enviará automáticamente a las empresas
              </p>
            </div>
          </div>
          <CVUploader />
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push("/app/buscar")}
              className="px-6 py-3 text-sm font-semibold rounded-xl transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}>
              🔍 Siguiente: Buscar ofertas →
            </button>
          </div>
        </div>

        {/* ── Sección inferior: carta de presentación ───────────────────── */}
        <div className="mt-6 card-game p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-[#f0ebe0]">Carta de presentación</h3>
            <p className="text-sm text-[#706a58] mt-0.5">
              Genera una carta personalizada para el puesto que elijas
            </p>
          </div>
          <button
            onClick={generarCarta}
            disabled={procesando || !textoCv.trim() || !puesto.trim()}
            className="shrink-0 px-6 py-3 text-sm font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#F97316" }}
          >
            {procesando ? "Generando..." : "✉️ Generar carta de presentación"}
          </button>
        </div>

      </div>
    </div>
  );
}
