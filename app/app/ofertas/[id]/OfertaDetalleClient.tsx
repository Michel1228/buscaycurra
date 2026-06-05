"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { esOfertaAuPair } from "@/lib/au-pair";

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
  sector?: string;
  fecha?: string;
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
  const [perfilAuPair, setPerfilAuPair] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const esAuPair = esOfertaAuPair(oferta.titulo);

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
    } catch (err) { console.error('[OfertaDetalle] Error verificar CV:', err) }
  }

  async function checkAuPairProfile() {
    try {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`/api/au-pair/profile?userId=${user.id}`);
      const json = await res.json() as { profile?: unknown };
      setPerfilAuPair(!!json.profile);
    } catch { /* ignorar */ }
  }

  async function enviarCV() {
    if (!oferta || enviando) return;
    setEnviando(true);
    try {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert("Inicia sesión para enviar tu CV"); setEnviando(false); return; }

      // Buscar email de la empresa: primero Google Places, luego scraping
      let email = oferta.email_empresa || "";
      if (!email && oferta.empresa) {
        try {
          // Usar el extractor con Google Places (más fiable que scraping)
          const r = await fetch("/api/company/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: oferta.empresa }),
            signal: AbortSignal.timeout(8000),
          });
          const d = await r.json() as { empresas?: Array<{ emailRrhh?: string; emailsExtraidos?: string[] }>; emailRrhh?: string };
          email = d.empresas?.[0]?.emailRrhh || d.empresas?.[0]?.emailsExtraidos?.[0] || d.emailRrhh || "";
        } catch { /* continuar */ }
      }

      // Si tras todo no hay email, NO enviar a dirección falsa
      if (!email) {
        alert("No se encontró email de contacto para esta empresa. Prueba a buscar la oferta en la web original para enviar tu CV.");
        setEnviando(false);
        return;
      }

      const res = await fetch("/api/cv-sender/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          companyName: oferta.empresa,
          companyEmail: email,
          companyUrl: oferta.url,
          jobTitle: oferta.titulo,
        }),
      });
      if (res.ok) {
        setEnviado(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setEnviado(false), 3000);
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        alert(err.error || "Error al enviar CV");
      }
    } catch (err) {
      alert("Error de conexión al enviar CV");
    } finally {
      setEnviando(false);
    }
  }

  const fuenteStyle = colorFuente(oferta.fuente || "");

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button
        onClick={() => router.back()}
        className="text-xs mb-4 inline-flex items-center gap-1 hover:underline"
        style={{ color: "#64748b" }}>
        ← Volver
      </button>

      <div className="rounded-xl p-6" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>
              {oferta.titulo}
            </h1>
            <p className="text-base mt-1 font-medium" style={{ color: "#22c55e" }}>
              {oferta.empresa}
            </p>
          </div>
          {oferta.fuente && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
              style={{ background: fuenteStyle.bg, color: fuenteStyle.text }}>
              {oferta.fuente}
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

        <div className="flex flex-wrap gap-3 mb-5">
          {esAuPair ? (
            <>
              <button
                onClick={enviarCV}
                disabled={enviando || !perfilAuPair}
                className="btn-game text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50 flex items-center gap-2"
                style={enviado ? { background: "#22c55e" } : {}}>
                {enviando ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white" />
                ) : enviado ? (
                  "✅ Perfil enviado"
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
                  className="text-sm px-4 py-2.5 rounded-lg font-medium transition"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                  🧒 Crear perfil Au Pair primero
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={enviarCV}
                disabled={enviando || !cvListo}
                className="btn-game text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50 flex items-center gap-2"
                style={enviado ? { background: "#22c55e" } : {}}>
                {enviando ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white" />
                ) : enviado ? (
                  "✅ CV Enviado"
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Enviar mi CV
                  </>
                )}
              </button>
              {!cvListo && (
                <button
                  onClick={() => router.push("/app/curriculum")}
                  className="text-sm px-4 py-2.5 rounded-lg font-medium transition"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                  📄 Crear CV primero
                </button>
              )}
            </>
          )}
          <a
            href={oferta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-1.5"
            style={{ background: "transparent", color: "#64748b", border: "1px solid #2d3142" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Ver original
          </a>
        </div>

        {oferta.descripcion && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid #2d3142" }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}>
              📋 Descripción
            </h2>
            <div
              className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "#94a3b8" }}>
              {oferta.descripcion}
            </div>
          </div>
        )}

        {(oferta.sector || oferta.email_empresa) && (
          <div className="mt-4 pt-4 flex flex-wrap gap-4 text-xs" style={{ borderTop: "1px solid #2d3142", color: "#475569" }}>
            {oferta.sector && (
              <span>Sector: <strong style={{ color: "#94a3b8" }}>{oferta.sector}</strong></span>
            )}
            {oferta.email_empresa && (
              <span>Email: <strong style={{ color: "#94a3b8" }}>{oferta.email_empresa}</strong></span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
