"use client";

import LogoEmpresa from "@/components/neon/LogoEmpresa";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { encajeConPuestos } from "@/lib/guzzi/consejo-encaje";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { esOfertaAuPair } from "@/lib/au-pair";
import AlojamientoOferta from "@/components/AlojamientoOferta";
import { CheckCircle2, FileText, Users, ClipboardList, Bookmark, ArrowLeft } from "lucide-react";
import { confirmarEnvioADireccion } from "@/lib/confirmar-direccion";
import { servicioOficial } from "@/lib/job-search/fuente-oficial";
import { ciudadParaBuscarEmpresa } from "@/lib/job-search/ciudad-oferta";
import { senalesDeEstafa } from "@/lib/job-search/senales-estafa";

export interface OfertaDetalle {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  provincia?: string;
  salario?: string;
  descripcion?: string;
  fuente?: string;
  url: string;
  email_empresa?: string;
  /** alta = hallado en la web de la empresa · media = patrón con MX válido */
  email_confianza?: "alta" | "media" | "baja";
  sector?: string;
  fecha?: string;
  country?: string;
}

/** Limpia nombres de fuente: ADZUNA_ES → Adzuna, EURES_MAD → Careerjet */
function formatSource(raw: string): string {
  // "EURES_ESP", "EURES_UNI", "EURES_SEA"... NO son EURES: son Careerjet,
  // guardado así por un error histórico (fetchCareerjetGlobal). Aquí ponía
  // "EURES España" o "EURES Europa" en ofertas de Careerjet, también en las de
  // Estados Unidos o Japón. EURES de verdad es "EURES" a secas.
  if (/^EURES_/i.test(raw || "")) return "Careerjet";
  const m: Record<string, string> = {
    "ADZUNA_ES": "Adzuna",
    "ADZUNA_UK": "Adzuna UK",
    "ADZUNA_US": "Adzuna USA",
    "ADZUNA_DE": "Adzuna DE",
    "ADZUNA_FR": "Adzuna FR",
    "ADZUNA_AU": "Adzuna AU",
    "JOOBLE": "Jooble",
    "CAREERJET": "Careerjet",
  };
  // Latinoamérica entra como CAREERJET_CO, CAREERJET_PE...: se enseña "Careerjet".
  if (/^CAREERJET_/i.test(raw || "")) return "Careerjet";
  return m[raw?.toUpperCase()] || raw?.replace(/_/g, " ") || "Desconocida";
}

/** Separa secciones pegadas en la descripción: "textoRequisitos..." → "texto\nRequisitos..." */
function formatDescription(desc: string): string {
  if (!desc) return "";
  return desc
    .replace(/([a-záéíóúüñ])(Requisitos|Funciones|Responsabilidades|Experiencia|Formación|Ofrecemos|Beneficios|Se ofrece|Se requiere|Imprescindible|Condiciones|Horario|Contrato|Salario|Incorporación)/g, "$1\n\n$2")
    .replace(/(Requisitos|Funciones|Responsabilidades|Experiencia|Formación|Ofrecemos|Beneficios|Se ofrece|Se requiere|Imprescindible|Condiciones|Horario|Contrato|Salario|Incorporación)([a-záéíóúüñ])/g, "$1: $2");
}

function colorFuente(fuente: string): { bg: string; text: string } {
  const mapa: Record<string, { bg: string; text: string }> = {
    infojobs: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa" },
    linkedin: { bg: "rgba(10,102,194,0.12)", text: "#0a66c2" },
    indeed: { bg: "rgba(37,87,167,0.12)", text: "#2557a7" },
    adzuna: { bg: "rgba(52,211,153,0.12)", text: "#34d399" },
    jooble: { bg: "rgba(251,146,60,0.12)", text: "#fb923c" },
    careerjet: { bg: "rgba(96,165,250,0.12)", text: "#60a5fa" },
    remoteok: { bg: "rgba(168,85,247,0.12)", text: "#a855f7" },
    arbeitnow: { bg: "rgba(34,197,94,0.12)", text: "#22c55e" },
  };
  const key = fuente?.toLowerCase() || "";
  return mapa[key] ?? { bg: "rgba(148,163,184,0.12)", text: "#94a3b8" };
}

export default function OfertaDetalleClient({ oferta: ofertaInicial }: { oferta: OfertaDetalle }) {
  const router = useRouter();
  const [oferta] = useState<OfertaDetalle>(ofertaInicial);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [cvListo, setCvListo] = useState(false);
  const [cvDatos, setCvDatos] = useState<unknown>(null);
  const [perfilAuPair, setPerfilAuPair] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [retirada, setRetirada] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const esAuPair = esOfertaAuPair(oferta.titulo);
  // Lanbide y SEF Murcia no dicen la empresa: se solicitan en su web oficial.
  // Mandar el CV aquí acababa en un correo deducido de la administración.
  const oficial = servicioOficial(oferta.fuente);

  function showToast(msg: string, type: "error" | "success" = "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    checkCV();
    if (esAuPair) checkAuPairProfile();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function checkCV() {
    try {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`/api/gusi/cv?userId=${user.id}`);
      const json = await res.json() as { cv_exists?: boolean; cv?: unknown };
      setCvListo(json.cv_exists === true || !!json.cv);
      setCvDatos(json.cv ?? null);
    } catch (err) { console.error('[OfertaDetalle] Error verificar CV:', err) }
  }

  // Cómo encaja con su CV, sin IA: si ya ha trabajado de esto y qué curso piden
  // para el puesto que su CV no nombra (lib/guzzi/consejo-encaje.ts).
  const encaje = useMemo(
    () => (cvDatos && !oficial && !esAuPair ? encajeConPuestos(cvDatos, [oferta.titulo], (oferta.country || "es").toUpperCase()) : null),
    [cvDatos, oficial, esAuPair, oferta.titulo, oferta.country]
  );

  // Señales que se repiten en las estafas (pagar por empezar, datos del banco,
  // dinero fácil desde casa). Avisa, no acusa: lib/job-search/senales-estafa.ts.
  const senales = useMemo(
    () => senalesDeEstafa({ titulo: oferta.titulo, empresa: oferta.empresa, descripcion: oferta.descripcion }),
    [oferta.titulo, oferta.empresa, oferta.descripcion]
  );

  async function checkAuPairProfile() {
    try {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Con la cabecera: sin ella el endpoint devuelve 401 y aquí se
      // interpretaba como "este usuario no tiene perfil de Au Pair".
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/au-pair/profile?userId=${user.id}`, {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const json = await res.json() as { profile?: unknown };
      setPerfilAuPair(!!json.profile);
    } catch { /* ignorar */ }
  }

  async function enviarCV() {
    if (!oferta || enviando || retirada) return;
    setEnviando(true);
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { showToast("Inicia sesión para enviar tu CV"); setEnviando(false); return; }

      // Buscar email de la empresa: campo en BD → Google Places → fallback de dominio
      let email = oferta.email_empresa || "";
      let confianza: string | undefined = oferta.email_empresa ? oferta.email_confianza : undefined;
      let construida = false;
      if (!email && oferta.empresa) {
        try {
          const r = await fetch("/api/company/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: oferta.empresa, city: ciudadParaBuscarEmpresa(oferta.ubicacion), deOferta: true }),
            signal: AbortSignal.timeout(8000),
          });
          const d = await r.json() as { empresas?: Array<{ emailRrhh?: string; emailsExtraidos?: string[]; emailConfianza?: string }>; emailRrhh?: string };
          email = d.empresas?.[0]?.emailRrhh || d.empresas?.[0]?.emailsExtraidos?.[0] || d.emailRrhh || "";
          confianza = d.empresas?.[0]?.emailConfianza;
        } catch { /* continuar */ }
      }

      // Fallback: construir email desde el dominio de la URL de la oferta
      if (!email && oferta.url) {
        try {
          const domain = new URL(oferta.url).hostname.replace(/^www\./, "");
          const jobBoards = ["adzuna", "jooble", "careerjet", "infojobs", "jobviewtrack", "indeed", "linkedin", "monster", "tecnoempleo"];
          if (!jobBoards.some(b => domain.includes(b))) {
            email = `empleo@${domain}`;
            construida = true;
          }
        } catch { /* ignorar */ }
      }

      if (!email) {
        showToast("Aún no tenemos el email de esta empresa. Guarda la oferta y te avisamos cuando lo encontremos.");
        setEnviando(false);
        return;
      }

      // El finally de abajo quita el "enviando" también al cancelar.
      if (!(await confirmarEnvioADireccion({ email, empresa: oferta.empresa, confianza, construidaAqui: construida }))) return;

      const res = await fetch("/api/cv-sender/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          companyName: oferta.empresa,
          companyEmail: email,
          companyUrl: oferta.url,
          jobTitle: oferta.titulo,
          strategy: "ahora",
        }),
      });
      if (res.ok) {
        setEnviado(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setEnviado(false), 3000);
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        showToast(err.error || "Error al enviar CV");
      }
    } catch (err) {
      showToast("Error de conexión al enviar CV");
    } finally {
      setEnviando(false);
    }
  }

  // ¿La sigue teniendo la web de origen? Si no, se avisa antes de gastar un
  // envío en un puesto cerrado (ver lib/job-search/oferta-viva.ts).
  useEffect(() => {
    fetch(`/api/jobs/comprobar?id=${encodeURIComponent(String(oferta.id))}`)
      .then((r) => r.json())
      .then((d: { viva?: boolean | null }) => { if (d.viva === false) setRetirada(true); })
      .catch(() => {});
  }, [oferta.id]);

  // Al abrir la ficha se mira si ya está guardada. Antes el botón empezaba
  // siempre en "Guardar", decía "Guardada" tres segundos y volvía a "Guardar",
  // y no había forma de quitarla (auditoría del 3 oct 2026).
  useEffect(() => {
    (async () => {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) return;
      const res = await fetch("/api/jobs/guardar", { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!res.ok) return;
      const data = await res.json() as { guardados?: Array<{ job_id: string }> };
      setGuardado(!!data.guardados?.some((g) => String(g.job_id) === String(oferta.id)));
    })().catch(() => {});
  }, [oferta.id]);

  // El botón alterna: guardar si no lo está, quitar si ya lo está.
  async function guardarOferta() {
    if (guardando) return;
    setGuardando(true);
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { showToast("Inicia sesión para guardar ofertas"); setGuardando(false); return; }

      const quitar = guardado;
      const res = await fetch("/api/jobs/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ jobId: oferta.id, action: quitar ? "unsave" : "save" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error || (quitar ? "Error al quitar la oferta" : "Error al guardar"));
      }

      setGuardado(!quitar);
      showToast(quitar ? "Quitada de tus ofertas guardadas" : "Oferta guardada. La tienes en Guardados; pulsa otra vez para quitarla.", "success");
    } catch (err) {
      // Se leia el motivo de la respuesta y luego se tiraba: el usuario veia
      // "Error al guardar la oferta" aunque el servidor dijera exactamente que
      // pasaba (por ejemplo, haber llegado al tope de guardadas de su plan).
      showToast((err as Error).message || "Error al guardar la oferta");
    } finally {
      setGuardando(false);
    }
  }

  const fuenteStyle = colorFuente(oferta.fuente || "");

  return (
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-6">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* VOLVER ATRAS.
          En el iPhone no hay boton de atras del sistema ni gesto dentro de la
          app nativa: si esta pantalla no trae su propia flecha, el usuario se
          queda encerrado. En Android el gesto si existe, pero la flecha se pone
          igual para que las dos plataformas se comporten igual.

          El tamano no es capricho: 44px es el minimo que pide Apple para algo
          que se toca con el dedo. Antes era texto gris de 12px, imposible de
          acertar — y ademas quedaba TAPADO por la barra de navegacion fija,
          que es de 56px mientras esta pagina solo dejaba 24px de margen.

          El respaldo del history: si se llega aqui desde una notificacion o un
          enlace compartido no hay historial al que volver y back() no hace
          nada, dejando al usuario encerrado igual. */}
      <button
        onClick={() => {
          if (window.history.length > 1) router.back();
          else router.push("/app/buscar");
        }}
        aria-label="Volver"
        className="mb-4 inline-flex items-center gap-2 rounded-full px-4 text-sm font-medium transition hover:opacity-80"
        style={{ color: "#94a3b8", minHeight: "44px", background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" }}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
        Volver
      </button>

      <div className="cristal tono-lima p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          {/* Logo solo con dominio comprobado (marca verificada o el correo
              que la empresa puso en la oferta); si no, sus iniciales. */}
          <LogoEmpresa empresa={oficial ? oficial.corto : oferta.empresa}
            correo={oferta.email_confianza === "alta" ? oferta.email_empresa : null} tono="lima" size={52} />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight leading-tight" style={{ color: "#f8fafc" }}>
              {oferta.titulo}
            </h1>
            <p className="text-base mt-1 font-semibold" style={{ color: "#bef264" }}>
              {oficial ? `Publicada por ${oficial.nombre}` : oferta.empresa}
            </p>
          </div>
          {oferta.fuente && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
              style={{ background: fuenteStyle.bg, color: fuenteStyle.text }}>
              {formatSource(oferta.fuente || "Desconocida")}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mb-5 text-sm" style={{ color: "#94a3b8" }}>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {oferta.ubicacion}{oferta.provincia ? `, ${oferta.provincia}` : ""}
          </span>
          {oferta.salario && (
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              {oferta.salario}
            </span>
          )}
          {oferta.fecha && (
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {new Date(oferta.fecha).toLocaleDateString("es-ES")}
            </span>
          )}
        </div>

        {retirada && (
          <div className="rounded-lg px-4 py-3 mb-4 text-sm" style={{ background: "rgba(240,192,64,0.1)", border: "1px solid rgba(240,192,64,0.3)", color: "#f0c040" }}>
            La web donde se publicó ya ha retirado esta oferta: lo más probable es que el puesto esté cubierto. Mejor no gastes un envío aquí.
            <button
              onClick={() => router.push(`/app/buscar?keyword=${encodeURIComponent(oferta.titulo)}&location=${encodeURIComponent(oferta.ubicacion || "")}`)}
              className="block mt-2 font-medium underline" style={{ color: "#22c55e" }}>
              Buscar ofertas parecidas
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-5">
          {oficial && oferta.url ? (
            <a
              href={oferta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-game text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2">
              Inscribirme en {oficial.corto}
            </a>
          ) : esAuPair ? (
            <>
              <button
                onClick={enviarCV}
                disabled={enviando || !perfilAuPair || retirada}
                className="btn-game text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50 flex items-center gap-2"
                style={enviado ? { background: "#22c55e" } : {}}>
                {enviando ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white" />
                ) : enviado ? (
                  <><CheckCircle2 size={16} className="inline mr-1" />Perfil enviado</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Enviar perfil Au Pair
                  </>
                )}
              </button>
              {!perfilAuPair && (
                <button
                  onClick={() => router.push("/app/au-pair")}
                  className="text-sm px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-1.5"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <Users size={14} />Crear perfil Au Pair primero
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={enviarCV}
                disabled={enviando || !cvListo || retirada}
                className="btn-game text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50 flex items-center gap-2"
                style={enviado ? { background: "#22c55e" } : {}}>
                {enviando ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white" />
                ) : enviado ? (
                  <><CheckCircle2 size={16} className="inline mr-1" />CV Enviado</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Enviar mi CV
                  </>
                )}
              </button>
              {!cvListo && (
                <button
                  onClick={() => router.push(`/app/curriculum?volver=${encodeURIComponent(`/app/ofertas/${oferta.id}`)}`)}
                  className="text-sm px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-1.5"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <FileText size={14} />Crear CV primero
                </button>
              )}
            </>
          )}
          {/* Botón Guardar */}
          <button
            onClick={guardarOferta}
            disabled={guardando}
            aria-label={guardado ? "Quitar de guardadas" : "Guardar oferta"}
            title={guardado ? "Pulsa para quitarla de tus guardadas" : undefined}
            className="text-sm font-medium px-5 py-2.5 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
            style={guardado
              ? { background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }
              : { background: "transparent", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.18)" }}
          >
            {guardando ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-[#94a3b8]" />
            ) : guardado ? (
              <><CheckCircle2 size={16} />Guardada</>
            ) : (
              <><Bookmark size={16} />Guardar</>
            )}
          </button>
        </div>

        {encaje && (
          <div className="rounded-lg px-4 py-3 mb-5 text-sm space-y-2" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", color: "#94a3b8" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#22c55e" }}>Cómo encajas, según tu CV</p>
            {encaje.encaja[0] ? (
              <p>
                <strong style={{ color: "#f1f5f9" }}>Encajas:</strong> has trabajado de {encaje.encaja[0].suyo.toLowerCase()}
                {encaje.encaja[0].empresa ? ` en ${encaje.encaja[0].empresa}` : ""}. Destácalo en tu CV y nómbralo en la carta.
              </p>
            ) : (
              <p>En tu CV no aparece este puesto. Si lo has hecho alguna vez, aunque fuera poco tiempo, añádelo antes de mandarlo.</p>
            )}
            {encaje.curso && (
              <p>
                <strong style={{ color: "#f1f5f9" }}>Te daría ventaja:</strong> {encaje.curso.nombre}. Lo piden para este puesto
                {encaje.curso.obligatorio ? " (es un curso obligatorio por ley)" : ""} y tu CV no lo nombra.{" "}
                <Link href={`/app/formacion/${encaje.curso.slug}`} className="underline font-medium" style={{ color: "#22c55e" }}>Dónde sacarlo</Link>
              </p>
            )}
          </div>
        )}

        {senales.length > 0 && (
          <div role="note" className="mt-4 rounded-xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)" }}>
            <p className="text-sm font-semibold mb-2" style={{ color: "#f87171" }}>
              Ojo: esta oferta tiene señales que se repiten en las estafas
            </p>
            <ul className="text-sm space-y-1.5 list-disc pl-5" style={{ color: "#f1f5f9" }}>
              {senales.map(s => <li key={s.codigo}>{s.texto}</li>)}
            </ul>
            <p className="text-xs mt-3" style={{ color: "#94a3b8" }}>
              Nunca pagues para conseguir un trabajo ni des datos del banco antes de firmar un contrato.
              {(oferta.country || "es").toLowerCase() === "es" ? " Si dudas, llama gratis al 017, la línea de ayuda en ciberseguridad de INCIBE." : ""}
            </p>
          </div>
        )}

        {oferta.descripcion && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(148,163,184,0.14)" }}>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: "#f1f5f9" }}>
              <ClipboardList size={14} />Descripción
            </h2>
            <div
              className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "#94a3b8" }}>
              {formatDescription(oferta.descripcion)}
            </div>
          </div>
        )}

        {/* Alojamiento en el país de destino (solo si no es España) */}
        <AlojamientoOferta country={oferta.country} />

        {(oferta.sector || oferta.email_empresa) && (
          <div className="mt-4 pt-4 flex flex-wrap gap-4 text-xs" style={{ borderTop: "1px solid rgba(148,163,184,0.14)", color: "#8b98ad" }}>
            {oferta.sector && (
              <span>Sector: <strong style={{ color: "#94a3b8" }}>{oferta.sector}</strong></span>
            )}
            {oferta.email_empresa && (
              <span className="inline-flex items-center gap-1.5 flex-wrap">
                Email: <strong style={{ color: "#94a3b8" }}>{oferta.email_empresa}</strong>
                {/* Distinguir un email real de un patrón deducido: sin esto el
                    usuario gasta envíos creyendo que la dirección es segura. */}
                {oferta.email_confianza === "alta" && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                    title="Email encontrado en la web oficial de la empresa"
                    style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                    Verificado
                  </span>
                )}
                {oferta.email_confianza === "media" && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                    title="Dirección deducida del dominio. El dominio sí recibe correo, pero no hemos podido confirmar este buzón"
                    style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
                    Probable
                  </span>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
