"use client";

/**
 * «Manda tu consulta» (26 nov 2026, Michel: «somos el intermediario; que lo
 * manden todo desde aquí»). Guzzi escribe la consulta con lo que dice su CV,
 * la persona la cambia si quiere y sale a su nombre desde BuscayCurra, con su
 * CV si lo marca; la respuesta le llega a su correo (lib/consultas/consultas.ts).
 *
 * Dos usos: acreditación (elige su comunidad) y plaza de un curso (ya trae el
 * centro). Si el organismo no publica un correo, se le deja el texto escrito
 * para copiarlo y el enlace a su web: nunca se manda a un correo inventado.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Copy, ExternalLink, FileText, MapPin, PenLine, Send } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Organismo { id: string; ccaa: string; organismo: string; conCorreo: boolean; web: string }
interface Destino { nombre: string; conCorreo: boolean; web: string; detalle: string }
interface Consulta { id: string; tipo: string; destino_nombre: string; asunto: string; con_cv: boolean; estado: string; creado: string }

const CLAVE_CCAA = "bc_ccaa_acreditacion";

export default function MandarConsulta({ tipo, plazaId, compacto = false }: { tipo: "acreditacion" | "plaza"; plazaId?: string; compacto?: boolean }) {
  const [token, setToken] = useState<string | null>(null);
  const [organismos, setOrganismos] = useState<Organismo[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [ccaa, setCcaa] = useState("");
  const [destino, setDestino] = useState<Destino | null>(null);
  const [asunto, setAsunto] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [conCV, setConCV] = useState(true);
  const [fase, setFase] = useState<"elegir" | "escribiendo" | "lista" | "mandando" | "hecho">("elegir");
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    (async () => {
      const t = (await getSupabaseBrowser().auth.getSession()).data.session?.access_token ?? null;
      setToken(t);
      const r = await fetch("/api/consultas", { headers: t ? { Authorization: `Bearer ${t}` } : {} }).catch(() => null);
      const j = r?.ok ? await r.json().catch(() => null) : null;
      setOrganismos(j?.organismos || []);
      setConsultas(j?.consultas || []);
      try { const g = localStorage.getItem(CLAVE_CCAA); if (g) setCcaa(g); } catch { /* da igual */ }
    })();
  }, []);

  const ref = tipo === "plaza" ? plazaId || "" : ccaa;
  const elegido = organismos.find((o) => o.id === ccaa);

  async function escribir() {
    if (!ref) return;
    setFase("escribiendo"); setError("");
    const r = await fetch("/api/consultas", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ accion: "borrador", tipo, ref }),
    }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok) { setError(j.error || "No se pudo escribir ahora. Prueba otra vez."); setFase("elegir"); return; }
    setAsunto(j.asunto); setCuerpo(j.cuerpo); setDestino(j.destino); setFase("lista");
  }

  async function mandar() {
    setFase("mandando"); setError("");
    const r = await fetch("/api/consultas", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ accion: "enviar", tipo, ref, asunto, cuerpo, conCV }),
    }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok) { setError(j.error || "No se pudo mandar. Prueba otra vez."); setFase("lista"); return; }
    setFase("hecho");
    setConsultas([{ id: j.id, tipo, destino_nombre: destino?.nombre || "", asunto, con_cv: conCV, estado: "enviada", creado: new Date().toISOString() }, ...consultas]);
  }

  const mias = consultas.filter((c) => c.tipo === tipo).slice(0, 5);

  return (
    <section className={`cristal tono-lima ${compacto ? "p-4" : "p-5 sm:p-6"} space-y-4`} aria-labelledby={`consulta-${tipo}`}>
      <div className="flex items-center gap-3.5">
        <span className="icono-circulo" style={{ width: 48, height: 48 }} aria-hidden="true"><Send size={21} /></span>
        <div className="min-w-0">
          <h2 id={`consulta-${tipo}`} className="text-[18px] font-extrabold leading-tight" style={{ color: "#f8fafc" }}>
            {tipo === "acreditacion" ? "Manda tu consulta" : "Pide tu plaza desde aquí"}
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: "#a7b3c6" }}>Guzzi la escribe con tu experiencia. Sale a tu nombre y la respuesta te llega a tu correo.</p>
        </div>
      </div>

      {!token ? (
        <Link href={`/auth/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/app/formacion/acreditar")}`} className="boton-neon w-full">Entra para mandarla</Link>
      ) : fase === "hecho" ? (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)" }} role="status">
          <span className="icono-circulo tono-verde" style={{ width: 40, height: 40 }} aria-hidden="true"><CheckCircle2 size={20} /></span>
          <p className="flex-1 text-[14px] font-semibold" style={{ color: "#dcfce7" }}>Mandada a {destino?.nombre}. La respuesta te llegará a tu correo.</p>
        </div>
      ) : (
        <>
          {tipo === "acreditacion" && (
            <label className="block">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold mb-1.5" style={{ color: "#cbd5e1" }}><MapPin size={14} aria-hidden="true" />Tu comunidad</span>
              <select value={ccaa} onChange={(e) => { setCcaa(e.target.value); setFase("elegir"); setDestino(null); try { localStorage.setItem(CLAVE_CCAA, e.target.value); } catch { /* da igual */ } }} className="w-full">
                <option value="">Elige tu comunidad</option>
                {organismos.map((o) => <option key={o.id} value={o.id}>{o.ccaa}</option>)}
              </select>
              {elegido && <span className="block text-[12.5px] mt-1.5" style={{ color: "var(--texto-tenue)" }}>{elegido.organismo}{elegido.conCorreo ? "" : " · no publica un correo: te dejamos la consulta escrita y su web"}</span>}
            </label>
          )}

          {(fase === "elegir" || fase === "escribiendo") && (
            <button type="button" onClick={() => void escribir()} disabled={!ref || fase === "escribiendo"} className="boton-neon w-full disabled:opacity-50">
              <PenLine size={18} aria-hidden="true" />{fase === "escribiendo" ? "Guzzi la está escribiendo…" : "Escribir mi consulta"}
            </button>
          )}

          {(fase === "lista" || fase === "mandando") && destino && (
            <div className="space-y-3">
              <label className="block">
                <span className="block text-[12.5px] font-semibold mb-1" style={{ color: "#a7b3c6" }}>Asunto</span>
                <input type="text" value={asunto} maxLength={150} onChange={(e) => setAsunto(e.target.value)} className="w-full" />
              </label>
              <label className="block">
                <span className="block text-[12.5px] font-semibold mb-1" style={{ color: "#a7b3c6" }}>Tu consulta (cámbiala si quieres)</span>
                <textarea rows={9} value={cuerpo} maxLength={4000} onChange={(e) => setCuerpo(e.target.value)} className="w-full" />
              </label>
              {destino.conCorreo ? (
                <>
                  <label className="flex items-center gap-2.5 text-[14px] cursor-pointer" style={{ color: "#e2e8f0" }}>
                    <input type="checkbox" checked={conCV} onChange={(e) => setConCV(e.target.checked)} className="w-5 h-5" style={{ accentColor: "#a3e635" }} />
                    <FileText size={16} aria-hidden="true" />Adjuntar mi CV en PDF
                  </label>
                  <button type="button" onClick={() => void mandar()} disabled={fase === "mandando"} className="boton-neon w-full disabled:opacity-60">
                    <Send size={18} aria-hidden="true" />{fase === "mandando" ? "Mandando…" : `Mandar a ${destino.nombre}`}
                  </button>
                </>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2.5">
                  <button type="button" onClick={() => { void navigator.clipboard?.writeText(cuerpo).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); }); }} className="boton-cristal tono-lima">
                    {copiado ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}{copiado ? "Copiada" : "Copiar la consulta"}
                  </button>
                  <a href={destino.web} target="_blank" rel="noopener noreferrer" className="boton-neon"><ExternalLink size={17} aria-hidden="true" />Ir a su web</a>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {error && <p role="alert" className="text-[13px]" style={{ color: "#fca5a5" }}>{error}</p>}

      {mias.length > 0 && (
        <div className="pt-3 space-y-2" style={{ borderTop: "1px solid rgba(148,163,184,0.16)" }}>
          <p className="text-[12px] font-bold tracking-[0.12em] uppercase" style={{ color: "var(--texto-tenue)" }}>Tus consultas</p>
          {mias.map((c) => (
            <div key={c.id} className="flex items-center gap-2.5 text-[13px]">
              <CheckCircle2 size={15} style={{ color: c.estado === "fallida" ? "#fca5a5" : "#86efac" }} aria-hidden="true" className="shrink-0" />
              <span className="flex-1 min-w-0 truncate" style={{ color: "#dbe3ee" }}>{c.destino_nombre}</span>
              <span className="shrink-0" style={{ color: "var(--texto-tenue)" }}>{new Date(c.creado).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}{c.con_cv ? " · con CV" : ""}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
