"use client";

/**
 * /app/envios/[id] — Un envío de CV, con todo lo que salió.
 *
 * POR QUÉ (21 nov 2026, Michel): «cuando le das a "Han visto tu CV" o "Tu CV
 * no se ha mandado", te tiene que abrir lo que has enviado, no algo genérico;
 * hasta la misma carta de presentación». Aquí llegan las notificaciones de cada
 * envío (lib/notificaciones/destino.ts) y la lista de «Mis envíos».
 *
 * Se ve: a qué empresa y a qué correo, el puesto y la oferta, cómo ha ido paso
 * a paso (programado, enviado, entregado, visto, respondido; o falló / no
 * llegó, con el motivo), la carta y el CV tal y como salieron.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import LogoEmpresa from "@/components/neon/LogoEmpresa";
import { formatLocalDate } from "@/lib/timezone";
import { ArrowLeft, Briefcase, CheckCircle2, Circle, Clock, ExternalLink, Eye, FileText, Mail, MailCheck, MailX, MessageCircle, X, Ban, Copy } from "lucide-react";

interface Envio {
  id: string; colaJobId: string | null; empresa: string; correo: string; oferta: string | null; puesto: string | null;
  estado: string; creado: string; enviado: string | null; entregado: string | null; rebotado: string | null;
  motivoRebote: string | null; error: string | null; carta: string | null; cv: Record<string, unknown> | null;
}

const TEXTO: Record<string, string> = {
  pendiente: "Programado", enviado: "Enviado", entregado: "Entregado", visto: "Visto", respondido: "Respondido",
  fallido: "No se pudo enviar", rebotado: "No llegó", cancelado: "Cancelado",
};
const COLOR: Record<string, string> = {
  pendiente: "#93c5fd", enviado: "#4ade80", entregado: "#4ade80", visto: "#c084fc", respondido: "#fbbf24",
  fallido: "#f87171", rebotado: "#f87171", cancelado: "#94a3b8",
};
const caja = { background: "rgba(6,9,11,0.8)", border: "1px solid rgba(148,163,184,0.18)" };
const t = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const fecha = (s: string | null) => (s ? formatLocalDate(s, "ES", { month: "long" }) : "");

/** Lo que significa cada estado, en palabras de la persona. */
function explicacion(e: Envio): string {
  switch (e.estado) {
    case "pendiente": return "Está en la cola: sale en un día laborable y en horario de oficina. Puedes cancelarlo antes.";
    case "enviado": return "Salió de BuscayCurra hacia su correo. Cuando su servidor lo acepte, pasará a «Entregado».";
    case "entregado": return "Su servidor de correo lo ha recibido: está en su buzón.";
    case "visto": return "Su programa de correo cargó las imágenes del mensaje. Algunos lo hacen solos y otros lo bloquean, así que es orientativo.";
    case "respondido": return "La empresa ha contestado. Mira tu correo.";
    case "rebotado": return `El correo no llegó${e.motivoRebote ? ` (${e.motivoRebote})` : ""}: esa empresa no tiene tu CV. Busca otro contacto suyo.`;
    case "fallido": return "No llegó a salir y no te gastó cuota: puedes volver a intentarlo.";
    case "cancelado": return "Lo cancelaste antes de que saliera.";
    default: return "";
  }
}

export default function EnvioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [envio, setEnvio] = useState<Envio | null>(null);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { router.push(`/auth/login?redirect=${encodeURIComponent(`/app/envios/${id}`)}`); return; }
      const r = await fetch(`/api/cv-sender/envio?id=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setError(j.error || "No se pudo abrir este envío."); return; }
      setEnvio(j.envio);
    })();
  }, [id, router]);

  async function cancelar() {
    if (!envio?.colaJobId || !confirm(`¿Cancelar el envío a ${envio.empresa}? No saldrá.`)) return;
    setCancelando(true);
    try {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      const r = await fetch("/api/cv-sender/cancel", {
        method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ jobId: envio.colaJobId }),
      });
      if (r.ok) setEnvio({ ...envio, estado: "cancelado" });
      else setError("No se pudo cancelar. Puede que ya haya salido.");
    } finally { setCancelando(false); }
  }

  if (error) {
    return (
      <div className="ui-neon min-h-screen pt-16 px-4">
        <div className="max-w-2xl mx-auto pt-10 text-center">
          <p className="text-sm mb-4" style={{ color: "#cbd5e1" }}>{error}</p>
          <Link href="/app/envios" className="boton-neon">Ver mis envíos</Link>
        </div>
      </div>
    );
  }
  if (!envio) return <div className="ui-neon min-h-screen pt-24 text-center text-sm" style={{ color: "#a7b3c6" }}>Cargando el envío…</div>;

  // Cómo ha ido, paso a paso. Los que no han pasado salen apagados; un fallo corta el camino.
  const malo = ["fallido", "rebotado", "cancelado"].includes(envio.estado);
  const orden = ["pendiente", "enviado", "entregado", "visto", "respondido"];
  const alcanzado = (paso: string) => {
    if (paso === "pendiente") return true;
    if (paso === "enviado") return !!envio.enviado || orden.indexOf(envio.estado) >= 1 || envio.estado === "rebotado";
    if (paso === "entregado") return !!envio.entregado || orden.indexOf(envio.estado) >= 3;
    return orden.indexOf(envio.estado) >= orden.indexOf(paso);
  };
  const pasos: { id: string; texto: string; cuando: string; Icono: typeof Clock }[] = [
    { id: "pendiente", texto: "Programado", cuando: fecha(envio.creado), Icono: Clock },
    { id: "enviado", texto: "Enviado", cuando: fecha(envio.enviado), Icono: Mail },
    ...(envio.estado === "rebotado" ? [{ id: "rebotado", texto: "No llegó", cuando: fecha(envio.rebotado), Icono: MailX }]
      : envio.estado === "fallido" ? [{ id: "fallido", texto: "No se pudo enviar", cuando: "", Icono: X }]
      : envio.estado === "cancelado" ? [{ id: "cancelado", texto: "Cancelado", cuando: "", Icono: Ban }]
      : [
        { id: "entregado", texto: "Entregado", cuando: fecha(envio.entregado), Icono: MailCheck },
        { id: "visto", texto: "Visto", cuando: "", Icono: Eye },
        { id: "respondido", texto: "Respondido", cuando: "", Icono: MessageCircle },
      ]),
  ];

  const cv = envio.cv || {};
  const experiencia = (Array.isArray(cv.experiencia) ? cv.experiencia : []) as Record<string, unknown>[];
  const formacion = (Array.isArray(cv.formacion) ? cv.formacion : []) as Record<string, unknown>[];
  const aptitudes = Array.isArray(cv.aptitudes) ? (cv.aptitudes as unknown[]).map(t).filter(Boolean) : t(cv.aptitudes).split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  const idiomas = Array.isArray(cv.idiomas) ? (cv.idiomas as Record<string, unknown>[]).map((i) => t(i?.nombre)).filter(Boolean) : t(cv.idiomas) ? [t(cv.idiomas)] : [];
  const perfil = t(cv.perfilProfesional) || t(cv.perfil);
  const descripcion = (d: unknown) => (Array.isArray(d) ? d.map(t).filter(Boolean).join("\n") : t(d));

  return (
    <div className="ui-neon min-h-screen pt-16">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-12 space-y-5">
        <Link href="/app/envios" className="inline-flex items-center gap-1.5 text-[13px] min-h-[40px]" style={{ color: "#a7b3c6" }}>
          <ArrowLeft size={16} aria-hidden="true" /> Mis envíos
        </Link>

        {/* A quién y cómo va */}
        <section className="cristal tono-lima p-5 space-y-4">
          <div className="flex items-start gap-3">
            <LogoEmpresa empresa={envio.empresa} correo={envio.correo} tono="lima" size={48} />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-extrabold leading-tight" style={{ color: "#f8fafc" }}>{envio.empresa}</h1>
              {envio.puesto && <p className="flex items-center gap-1.5 text-[14px] mt-0.5" style={{ color: "#cbd5e1" }}><Briefcase size={14} aria-hidden="true" />{envio.puesto}</p>}
              <p className="flex items-center gap-1.5 text-[13px] mt-0.5 break-all" style={{ color: "#a7b3c6" }}><Mail size={13} aria-hidden="true" />{envio.correo}</p>
            </div>
            <span className="text-[12px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: `${COLOR[envio.estado] ?? "#94a3b8"}22`, color: COLOR[envio.estado] ?? "#94a3b8" }}>
              {TEXTO[envio.estado] ?? envio.estado}
            </span>
          </div>
          <p className="text-[13.5px] leading-relaxed" style={{ color: "#dbe3ee" }}>{explicacion(envio)}</p>
          {envio.estado === "fallido" && envio.error && !envio.error.trim().startsWith("{") && <p className="text-[12px]" style={{ color: "#fca5a5" }}>Motivo: {envio.error}</p>}

          {/* Paso a paso */}
          <ol className="grid gap-2" aria-label="Cómo ha ido el envío">
            {pasos.map((p) => {
              const hecho = p.id === envio.estado || (!malo || ["pendiente", "enviado"].includes(p.id) ? alcanzado(p.id) : false);
              const rojo = ["rebotado", "fallido"].includes(p.id);
              const color = rojo ? "#f87171" : hecho ? "#a3e635" : "#475569";
              return (
                <li key={p.id} className="flex items-center gap-2.5 text-[13.5px]">
                  {hecho ? <CheckCircle2 size={18} style={{ color }} aria-hidden="true" /> : <Circle size={18} style={{ color }} aria-hidden="true" />}
                  <p.Icono size={14} style={{ color }} aria-hidden="true" />
                  <span style={{ color: hecho ? "#f1f5f9" : "#64748b" }}>{p.texto}</span>
                  {p.cuando && <span className="text-[12px] ml-auto" style={{ color: "#a7b3c6" }}>{p.cuando}</span>}
                </li>
              );
            })}
          </ol>

          <div className="flex flex-wrap gap-2 pt-1">
            {envio.oferta && /^https?:\/\//.test(envio.oferta) && (
              <a href={envio.oferta} target="_blank" rel="noopener noreferrer" className="boton-cristal tono-lima">
                <ExternalLink size={16} aria-hidden="true" /> Ver la oferta
              </a>
            )}
            {envio.estado === "pendiente" && envio.colaJobId && (
              <button type="button" onClick={() => void cancelar()} disabled={cancelando} className="boton-cristal tono-neutro">
                <Ban size={16} aria-hidden="true" /> {cancelando ? "Cancelando…" : "Cancelar el envío"}
              </button>
            )}
            {["fallido", "rebotado"].includes(envio.estado) && (
              <Link href="/app/empresas?seccion=buscar" className="boton-neon">Buscar otro contacto</Link>
            )}
          </div>
        </section>

        {/* La carta, entera */}
        <section className="cristal tono-neutro p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="flex items-center gap-1.5 text-[15px] font-bold" style={{ color: "#d9f99d" }}><FileText size={16} aria-hidden="true" /> Carta de presentación</h2>
            {envio.carta && (
              <button type="button" className="inline-flex items-center gap-1 text-[12px] min-h-[36px] px-2" style={{ color: "#a7b3c6" }}
                onClick={() => { void navigator.clipboard?.writeText(envio.carta!).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); }); }}>
                <Copy size={13} aria-hidden="true" /> {copiado ? "Copiada" : "Copiar"}
              </button>
            )}
          </div>
          {envio.carta
            ? <div className="rounded-xl p-4 text-[14px] leading-relaxed whitespace-pre-line" style={{ ...caja, color: "#dbe3ee" }}>{envio.carta}</div>
            : <p className="text-[13px]" style={{ color: "#a7b3c6" }}>{envio.estado === "pendiente" ? "La carta se escribe para esta empresa justo antes de salir: la verás aquí cuando se envíe." : "Este envío no guardó la carta (es de antes de que se guardaran)."}</p>}
        </section>

        {/* El CV tal y como salió */}
        <section className="cristal tono-neutro p-5">
          <h2 className="text-[15px] font-bold mb-3" style={{ color: "#d9f99d" }}>El CV que se envió</h2>
          {envio.cv ? (
            <div className="rounded-xl p-4 space-y-3 text-[13.5px]" style={caja}>
              <div>
                <p className="font-bold text-[15px]" style={{ color: "#f1f5f9" }}>{[t(cv.nombre), t(cv.apellidos)].filter(Boolean).join(" ")}</p>
                {t(cv.subtitulo) && <p style={{ color: "#cbd5e1" }}>{t(cv.subtitulo)}</p>}
                <p className="text-[12.5px]" style={{ color: "#a7b3c6" }}>{[t(cv.ciudad), t(cv.email), t(cv.telefono)].filter(Boolean).join(" · ")}</p>
              </div>
              {perfil && <p className="leading-relaxed" style={{ color: "#cbd5e1" }}>{perfil}</p>}
              {experiencia.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "#a7b3c6" }}>Experiencia</p>
                  <ul className="space-y-2">
                    {experiencia.map((x, i) => (
                      <li key={i}>
                        <p className="font-semibold" style={{ color: "#f1f5f9" }}>{[t(x.puesto), t(x.empresa)].filter(Boolean).join(" · ")}</p>
                        {(t(x.fechas) || t(x.ubicacion)) && <p className="text-[12px]" style={{ color: "#a7b3c6" }}>{[t(x.fechas), t(x.ubicacion)].filter(Boolean).join(" · ")}</p>}
                        {descripcion(x.descripcion) && <p className="text-[12.5px] whitespace-pre-line" style={{ color: "#cbd5e1" }}>{descripcion(x.descripcion)}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {formacion.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "#a7b3c6" }}>Formación</p>
                  <ul className="space-y-1">
                    {formacion.map((f, i) => <li key={i} style={{ color: "#dbe3ee" }}>{[t(f.titulo), t(f.centro)].filter(Boolean).join(" · ")}</li>)}
                  </ul>
                </div>
              )}
              {aptitudes.length > 0 && <p style={{ color: "#cbd5e1" }}><span className="font-semibold" style={{ color: "#a7b3c6" }}>Aptitudes: </span>{aptitudes.join(", ")}</p>}
              {idiomas.length > 0 && <p style={{ color: "#cbd5e1" }}><span className="font-semibold" style={{ color: "#a7b3c6" }}>Idiomas: </span>{idiomas.join(", ")}</p>}
            </div>
          ) : (
            <p className="text-[13px]" style={{ color: "#a7b3c6" }}>
              {envio.estado === "pendiente" ? "Se adjunta tu CV tal y como esté cuando salga." : "Este envío no guardó la copia del CV (es de antes de que se guardara)."}{" "}
              <Link href="/app/curriculum" style={{ color: "#d9f99d" }}>Ver mi CV →</Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
