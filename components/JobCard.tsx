"use client";

/**
 * JobCard — Tarjeta de oferta con % de compatibilidad
 * Tema oscuro "Bosque Encantado"
 * Badge de fuente, barra de match, botón enviar CV (envío directo inline)
 */

import LogoEmpresa from "@/components/neon/LogoEmpresa";
import { sueldoCreible } from "@/lib/sueldo-visible";
import { useEffect, useState } from "react";
import { Loader2, Check, Send } from "lucide-react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { confirmarEnvioADireccion } from "@/lib/confirmar-direccion";
import { servicioOficial } from "@/lib/job-search/fuente-oficial";
import { ciudadParaBuscarEmpresa } from "@/lib/job-search/ciudad-oferta";
import { senalesDeEstafa } from "@/lib/job-search/senales-estafa";
import { esOfertaDePortal } from "@/lib/job-search/portales-empleo";
import { marcaDeOferta, fechaCorta, type MarcaEnvio } from "@/lib/cv-sender/marca-envio";
import { misEnvios, olvidarMisEnvios } from "@/lib/cv-sender/mis-envios-cliente";

export interface PropiedadesJobCard {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario?: string;
  fuente?: string;
  url: string;
  modalidad?: "presencial" | "remoto" | "hibrido";
  descripcion?: string;
  match?: number; // 0-100 % de compatibilidad
  distancia?: string; // "🏠 Tu ciudad" | "📍 15km" etc.
  emailEmpresa?: string; // email RRHH si disponible
  emailConfianza?: string; // "alta" | "media" | "baja" (ver lib/confirmar-direccion.ts)
}

function colorMatch(pct: number): string {
  if (pct >= 80) return "#22c55e";
  if (pct >= 60) return "#f0c040";
  if (pct >= 40) return "#e07850";
  return "#64748b";
}

// Extrae dominio de la URL de la oferta para construir email fallback
function buildFallbackEmail(url: string): string {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, "");
    const jobBoards = ["adzuna", "jooble", "careerjet", "infojobs", "jobviewtrack", "indeed", "linkedin", "monster", "tecnoempleo"];
    if (jobBoards.some(b => domain.includes(b))) return "";
    return `empleo@${domain}`;
  } catch {
    return "";
  }
}

export default function JobCard({
  id, titulo, empresa, ubicacion, salario, fuente = "Otro",
  url, modalidad, descripcion, match, distancia, emailEmpresa, emailConfianza,
}: PropiedadesJobCard) {
  const matchColor = match !== undefined ? colorMatch(match) : "#64748b";
  // Adzuna España da a veces sueldos imposibles (un cajero a "90000 - 140000":
  // horas mal multiplicadas). De esa fuente, sin cifra creíble, no se enseña.
  const sueldoAdzunaImposible = /^ADZUNA_ES$/i.test(fuente) && !!salario && sueldoCreible(salario) === null;
  // Señales que se repiten en las estafas: el detalle está en la ficha.
  const conSenales = senalesDeEstafa({ titulo, empresa, descripcion }).length > 0;

  // Las ofertas en vivo (Jooble/APIs) llevan id sintético con prefijo y NO existen
  // en la BD → /app/ofertas/[id] mostraría "Oferta no encontrada". Para esas,
  // "Ver oferta" abre su URL externa directamente.
  const esSintetica = /^(jooble|adzuna|cj|li|arb|rem|indeed|tec|fb)-/.test(id);
  // Lanbide y SEF Murcia: se solicitan en su web. "Enviar CV" deducía
  // empleo@web.lanbide.eus y mandaba el CV a la administración.
  const oficial = servicioOficial(fuente);
  // Domestiko, Cronoshare...: portales, no quien contrata. El CV no se manda al
  // portal por correo; la oferta se solicita en su web (portales-empleo.ts).
  const portal = !oficial && esOfertaDePortal({ empresa, correo: emailEmpresa });
  const aWeb = !!oficial || portal;
  // Las de portales (Domestiko...) se leen enteras en NUESTRA ficha (13 nov 2026):
  // desde la lista no se sale a ninguna web de fuera. La única salida, si quiere
  // apuntarse, está al final de la ficha. Las de servicios públicos (Lanbide, SEF)
  // siguen yendo a su web: se solicitan allí y no son publicidad de nadie.
  const enNuestraFicha = portal && !oficial && !esSintetica;

  const [enviando, setEnviando] = useState(false);
  const [estadoEnvio, setEstadoEnvio] = useState<"idle" | "ok" | "sin-email">("idle");

  // Qué se le dice a ESTA persona de ESTA oferta (marca-envio.ts): enviada, o de
  // una empresa a la que ya escribió hace menos de 15 días. Sus envíos, no los de otros.
  const [marca, setMarca] = useState<MarcaEnvio>(null);
  useEffect(() => {
    if (aWeb) return;
    let vivo = true;
    misEnvios().then((lista) => { if (vivo) setMarca(marcaDeOferta(lista, { url, titulo, empresa, correo: emailEmpresa })); });
    return () => { vivo = false; };
  }, [aWeb, url, titulo, empresa, emailEmpresa]);

  // ── Score ATS (encaje profundo con IA) ──
  const [ats, setAts] = useState<{ score: number; resumen: string; faltan: string[]; consejos: string[] } | null>(null);
  const [atsCargando, setAtsCargando] = useState(false);
  const [atsError, setAtsError] = useState("");

  async function analizarEncaje(e: React.MouseEvent) {
    e.preventDefault();
    if (atsCargando) return;
    if (ats) { setAts(null); return; } // segundo clic: plegar
    setAtsCargando(true);
    setAtsError("");
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/auth/login"; return; }
      const res = await fetch("/api/cv/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({ titulo, empresa, descripcion }),
      });
      const data = await res.json();
      if (res.ok) {
        setAts(data);
      } else if (data.error === "sin-cv") {
        setAtsError("Primero crea tu CV en la sección Currículum para analizar el encaje.");
      } else {
        setAtsError(data.error || "No se pudo analizar. Inténtalo de nuevo.");
      }
    } catch {
      setAtsError("Error de conexión.");
    } finally {
      setAtsCargando(false);
    }
  }

  async function enviarCV(e: React.MouseEvent) {
    e.preventDefault();
    if (enviando || estadoEnvio === "ok" || marca) return;
    setEnviando(true);

    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/auth/login"; return; }

      // Resolver email: prop → extract API → fallback de dominio
      let email = emailEmpresa || "";
      let confianza: string | undefined = emailEmpresa ? emailConfianza : undefined;
      let construida = false;
      if (!email) {
        try {
          const r = await fetch("/api/company/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: empresa, city: ciudadParaBuscarEmpresa(ubicacion), deOferta: true }),
            signal: AbortSignal.timeout(6000),
          });
          const d = await r.json() as { empresas?: Array<{ emailRrhh?: string; emailConfianza?: string }>; emailRrhh?: string };
          email = d.empresas?.[0]?.emailRrhh || d.emailRrhh || "";
          confianza = d.empresas?.[0]?.emailConfianza;
        } catch { /* ignorar */ }
      }
      if (!email) {
        email = buildFallbackEmail(url);
        construida = !!email;
      }

      if (!email) {
        setEstadoEnvio("sin-email");
        setTimeout(() => setEstadoEnvio("idle"), 4000);
        return;
      }

      if (!(await confirmarEnvioADireccion({ email, empresa, confianza, construidaAqui: construida }))) return;

      const res = await fetch("/api/cv-sender/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          companyName: empresa,
          companyEmail: email,
          companyUrl: url,
          jobTitle: titulo,
        }),
      });

      if (res.ok) {
        olvidarMisEnvios();
        setMarca({ tipo: "esta-oferta", fecha: new Date() });
        setEstadoEnvio("ok");
        setTimeout(() => setEstadoEnvio("idle"), 4000);
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        alert(err.error || "Error al enviar CV");
      }
    } catch {
      alert("Error de conexión al enviar CV");
    } finally {
      setEnviando(false);
    }
  }

  return (
    // min-w-0 y overflow-wrap (13 nov 2026): un correo o enlace largo sin espacios
    // estiraba la tarjeta a 472 px en un móvil de 390 y la página entera se salía
    // de lado (Michel: "pongo Madrid y sale como en grande"). El zoom, solo con ratón:
    // en el móvil el :hover se queda pegado al tocar y la ensanchaba otro 1 %.
    <div className="card-game p-5 flex flex-col gap-3 min-w-0 [overflow-wrap:anywhere] group [@media(hover:hover)]:hover:scale-[1.01] transition-transform">
      {/* Header: fuente + match + modalidad */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Sin el nombre del agregador (Adzuna, Careerjet...): no se les hace
              publicidad (Michel, 13 nov 2026). */}
          {conSenales && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              title="Tiene señales que se repiten en las estafas. Míralo en la ficha antes de dar ningún dato."
              style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>Ojo: señales de estafa</span>
          )}
          {modalidad && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full capitalize"
              style={{ background: "rgba(112,106,88,0.1)", color: "#94a3b8" }}>{modalidad}</span>
          )}
        </div>
        {match !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#2a2a1e" }} role="progressbar" aria-valuenow={match} aria-valuemin={0} aria-valuemax={100} aria-label={`${match}% de compatibilidad`}>
              <div className="h-full rounded-full transition-all" style={{ width: `${match}%`, background: matchColor }} />
            </div>
            <span className="text-xs font-bold" style={{ color: matchColor }}>{match}%</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        {/* El logo solo con dominio comprobado (marca verificada o el correo
            que la empresa puso en la oferta); si no, sus iniciales. */}
        <div className="flex items-start gap-3">
          <LogoEmpresa empresa={oficial ? oficial.corto : empresa} correo={emailConfianza === "alta" ? emailEmpresa : null} tono="verde" size={40} />
          <div className="min-w-0">
            <h3 className="font-bold text-sm leading-snug" style={{ color: "#f1f5f9" }}>{titulo}</h3>
            <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{oficial ? `Publicada por ${oficial.corto}` : empresa}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: "#8b98ad" }}>
          <span>📍</span><span>{ubicacion}</span>
        </div>
        {salario && !sueldoAdzunaImposible && (
          <div className="flex items-center gap-1 mt-1 text-xs font-semibold" style={{ color: "#22c55e" }}>
            <span>💰</span><span>{salario}</span>
          </div>
        )}
        {distancia && (
          <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: "#a8e6a1" }}>
            <span>{distancia}</span>
          </div>
        )}
        {emailEmpresa && !portal && (
          <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: "#f0c040" }}>
            <span>✉️</span><span>{emailEmpresa}</span>
          </div>
        )}
        {descripcion && (
          <p className="text-[11px] mt-2 line-clamp-2 leading-relaxed" style={{ color: "#8b98ad" }}>{descripcion}</p>
        )}
      </div>

      {/* ── Panel Score ATS ── */}
      <button onClick={analizarEncaje} disabled={atsCargando}
        className="text-left text-[11px] font-semibold transition hover:opacity-80 disabled:opacity-50"
        style={{ color: "#f0c040" }}>
        {atsCargando ? "Analizando tu encaje..." : ats ? "Ocultar análisis" : "¿Encajo en esta oferta? Análisis con IA"}
      </button>
      {atsError && (
        <p className="text-[11px]" style={{ color: "#e07850" }}>{atsError}</p>
      )}
      {ats && (
        <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(240,192,64,0.05)", border: "1px solid rgba(240,192,64,0.15)" }}>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: colorMatch(ats.score) }}>{ats.score}%</span>
            <span className="text-[11px] leading-snug" style={{ color: "#94a3b8" }}>{ats.resumen}</span>
          </div>
          {ats.faltan.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold mb-1" style={{ color: "#e07850" }}>Le falta a tu CV:</p>
              <div className="flex flex-wrap gap-1">
                {ats.faltan.map((f, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(224,120,80,0.1)", border: "1px solid rgba(224,120,80,0.25)", color: "#e07850" }}>{f}</span>
                ))}
              </div>
            </div>
          )}
          {ats.consejos.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold mb-1" style={{ color: "#22c55e" }}>Para mejorar tu encaje:</p>
              <ul className="space-y-1">
                {ats.consejos.map((c, i) => (
                  <li key={i} className="text-[10px] leading-relaxed pl-3 relative" style={{ color: "#94a3b8" }}>
                    <span className="absolute left-0" style={{ color: "#22c55e" }}>✓</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Aviso sin email */}
      {estadoEnvio === "sin-email" && (
        <p className="text-[11px] text-center" style={{ color: "#f0c040" }}>
          Sin email aún. 📌 Guarda esta oferta y te avisamos cuando lo encontremos.
        </p>
      )}

      {portal && (
        <p className="text-[11px] leading-snug" style={{ color: "#94a3b8" }}>
          La empresa recibe las candidaturas en su propia oferta: léela aquí y Guzzi te prepara el CV antes de apuntarte.
        </p>
      )}
      {marca?.tipo === "misma-empresa" && (
        <p className="text-[11px] leading-snug" style={{ color: "#f0c040" }}>{marca.texto}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        {enNuestraFicha ? (
          <Link href={`/app/ofertas/${encodeURIComponent(id)}`}
            className="flex-1 inline-flex items-center justify-center min-h-[44px] text-center text-xs font-bold rounded-full transition hover:opacity-90"
            style={{ background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406", boxShadow: "0 6px 20px -8px rgba(163,230,53,0.7)" }}>
            Ver la oferta completa
          </Link>
        ) : esSintetica && url ? (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center min-h-[44px] text-center text-xs font-semibold rounded-full transition hover:bg-white/[0.05]"
            style={{ border: "1.5px solid rgba(148,163,184,0.25)", color: "#dbe3ee" }}>
            Ver oferta
          </a>
        ) : (
          <Link href={`/app/ofertas/${encodeURIComponent(id)}`}
            className="flex-1 inline-flex items-center justify-center min-h-[44px] text-center text-xs font-semibold rounded-full transition hover:bg-white/[0.05]"
            style={{ border: "1.5px solid rgba(148,163,184,0.25)", color: "#dbe3ee" }}>
            Ver oferta
          </Link>
        )}
        {enNuestraFicha ? null : aWeb && url ? (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center min-h-[44px] text-center text-xs font-bold rounded-full transition hover:opacity-90"
            style={{ background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406", boxShadow: "0 6px 20px -8px rgba(163,230,53,0.7)" }}>
            {oficial ? <>Inscribirme en {oficial.corto}</> : "Inscribirme en la oferta"}
          </a>
        ) : aWeb ? null : (
          <button
            onClick={enviarCV}
            disabled={enviando || !!marca}
            className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] text-center text-xs font-bold rounded-full transition hover:opacity-90 disabled:opacity-60"
            style={{
              background: estadoEnvio === "ok" || marca
                ? "rgba(34,197,94,0.18)"
                : "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)",
              color: estadoEnvio === "ok" || marca ? "#86efac" : "#0b1406",
              border: estadoEnvio === "ok" || marca ? "1px solid rgba(34,197,94,0.45)" : "none",
              boxShadow: estadoEnvio === "ok" || marca ? "none" : "0 6px 20px -8px rgba(163,230,53,0.7)",
            }}>
            {/* Iconos de trazo en vez de emoji (diseño de neón, 7 nov 2026). */}
            {enviando
              ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" />Enviando...</>
              : marca?.tipo === "esta-oferta"
                ? <><Check size={14} aria-hidden="true" />Enviado el {fechaCorta(marca.fecha)}</>
              : marca?.tipo === "misma-empresa"
                ? <>{marca.puedeEl.getTime() > marca.fecha.getTime() ? `Podrás el ${fechaCorta(marca.puedeEl)}` : "En cola"}</>
              : estadoEnvio === "ok"
                ? <><Check size={14} aria-hidden="true" />Enviado</>
                : <><Send size={14} aria-hidden="true" />Enviar CV</>}
          </button>
        )}
      </div>
    </div>
  );
}
