"use client";

/**
 * /empresas/alta — Dar de alta la empresa para ver candidatos, y meter el código.
 *
 * 21 nov 2026 (Michel): los candidatos solo los ven empresas, ETT y agencias de
 * colocación verificadas, y de momento gratis. Aquí se manda el alta, se ve cómo
 * va (pendiente, aprobada, activa, rechazada) y se mete el código que llega al
 * correo de la empresa cuando Michel la aprueba (lib/empresas/verificacion.ts).
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { BadgeCheck, Ban, Building2, Check, Clock, FileCheck2, Handshake, KeyRound, Mail, Users, type LucideIcon } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Etiqueta } from "@/components/neon/Neon";
import { AvisoContratacion, MarcoContratacion } from "@/components/empresas/AreaContratacion";

type Estado = "pendiente" | "aprobada" | "activa" | "rechazada" | "suspendida";
type Tipo = "empresa" | "ett" | "agencia";
interface Solicitud {
  razonSocial: string; nif: string; tipo: Tipo; autorizacion: string | null; sectores: string[]; busca: string | null;
  provincia: string | null; web: string | null; correoEmpresa: string; telefono: string | null; estado: Estado; motivo: string | null;
}
interface Opcion { id: string; label: string; ayuda?: string }

const etiqueta = "block text-[12.5px] font-semibold mb-1.5";
const ICONO_TIPO: Record<string, LucideIcon> = { empresa: Building2, ett: Users, agencia: Handshake };

/** Un estado del alta en su tarjeta: icono, título y lo que toque debajo. */
function Estado({ tono, Icono, titulo, children }: { tono: string; Icono: LucideIcon; titulo: string; children?: ReactNode }) {
  return (
    <section className={`cristal tono-${tono} p-5 sm:p-6 space-y-3`}>
      <div className="flex items-center gap-3">
        <span className="icono-circulo" style={{ width: 48, height: 48 }} aria-hidden="true"><Icono size={22} /></span>
        <h2 className="text-[18px] font-extrabold leading-tight" style={{ color: "#f8fafc" }}>{titulo}</h2>
      </div>
      {children}
    </section>
  );
}

const vacio = { razonSocial: "", nif: "", tipo: "empresa" as Tipo, autorizacion: "", sectores: [] as string[], busca: "", provincia: "", web: "", correoEmpresa: "", telefono: "", compromiso: false };

export default function AltaEmpresaPage() {
  const [token, setToken] = useState("");
  const [cargando, setCargando] = useState(true);
  const [sinSesion, setSinSesion] = useState(false);
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [equipo, setEquipo] = useState<string | null>(null);
  const [correoVerificado, setCorreoVerificado] = useState(true);
  const [tipos, setTipos] = useState<Opcion[]>([]);
  const [sectores, setSectores] = useState<Opcion[]>([]);
  const [form, setForm] = useState(vacio);
  const [editando, setEditando] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async (t: string) => {
    const r = await fetch("/api/empresas/alta", { headers: { Authorization: `Bearer ${t}` } });
    if (r.status === 401) { setSinSesion(true); return; }
    const j = await r.json().catch(() => ({}));
    setSolicitud(j.solicitud || null);
    setEquipo(j.equipo?.razonSocial || null);
    setCorreoVerificado(j.correoVerificado !== false);
    setTipos(j.tipos || []);
    setSectores(j.sectores || []);
    if (j.solicitud) {
      const s = j.solicitud as Solicitud;
      setForm({ razonSocial: s.razonSocial, nif: s.nif, tipo: s.tipo, autorizacion: s.autorizacion || "", sectores: s.sectores, busca: s.busca || "",
        provincia: s.provincia || "", web: s.web || "", correoEmpresa: s.correoEmpresa, telefono: s.telefono || "", compromiso: false });
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { setSinSesion(true); setCargando(false); return; }
      setToken(session.access_token);
      await cargar(session.access_token).catch(() => setError("No se pudo cargar. Prueba otra vez."));
      setCargando(false);
    })();
  }, [cargar]);

  async function mandar() {
    setEnviando(true); setError("");
    try {
      const r = await fetch("/api/empresas/alta", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setError(j.mensaje || j.error || "No se pudo mandar."); return; }
      setSolicitud(j.solicitud); setEditando(false);
    } finally { setEnviando(false); }
  }

  async function activar() {
    setEnviando(true); setError("");
    try {
      const r = await fetch("/api/empresas/activar", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ codigo }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setError(j.mensaje || j.error || "No se pudo comprobar el código."); return; }
      setSolicitud(j.solicitud);
    } finally { setEnviando(false); }
  }

  const alternar = (id: string) => setForm((f) => ({
    ...f, sectores: f.sectores.includes(id) ? f.sectores.filter((x) => x !== id) : f.sectores.length >= 3 ? f.sectores : [...f.sectores, id],
  }));

  if (cargando) return <AvisoContratacion titulo="Cargando…" />;
  if (sinSesion) {
    return <AvisoContratacion titulo="Da de alta tu empresa" texto="Primero entra o crea tu cuenta. Luego rellenas los datos de la empresa."
      enlace="/auth/login?redirect=%2Fempresas%2Falta" boton="Entrar" secundario={{ href: "/auth/registro", texto: "Crear cuenta" }} />;
  }
  if (equipo && !solicitud) {
    return <AvisoContratacion titulo={`Ya entras con ${equipo}`} texto="Estás en el equipo de una empresa verificada: no hace falta otra alta."
      enlace="/empresas/candidatos" boton="Ver candidatos" />;
  }

  const estado = solicitud?.estado;
  const mostrarFormulario = !solicitud || editando || estado === "rechazada";

  return (
    <MarcoContratacion seccion={estado === "activa" ? "candidatos" : undefined} titulo="Alta de empresa" Icono={Building2}
      empresa={solicitud?.razonSocial} pestanas={estado === "activa"}>
      {!estado && (
        <div className="flex flex-wrap gap-2">
          <Etiqueta tono="verde"><Check size={12} aria-hidden="true" />Gratis</Etiqueta>
          <Etiqueta tono="cian"><FileCheck2 size={12} aria-hidden="true" />Comprobamos el NIF</Etiqueta>
          <Etiqueta tono="cian"><Mail size={12} aria-hidden="true" />Código al correo de la empresa</Etiqueta>
        </div>
      )}

      {estado === "activa" && (
        <Estado tono="verde" Icono={BadgeCheck} titulo={`${solicitud!.razonSocial} está verificada`}>
          <p className="text-[13.5px]" style={{ color: "#a7b3c6" }}>
            {solicitud!.tipo === "empresa" ? "Veis a los candidatos de vuestros sectores." : "Como ETT o agencia de colocación, veis todos los sectores."}
          </p>
          <div className="grid sm:grid-cols-3 gap-2.5 pt-1">
            <Link href="/empresas/candidatos" className="boton-neon">Ver candidatos</Link>
            <Link href="/empresas/entrevistas" className="boton-cristal tono-cian">Entrevistas</Link>
            <Link href="/empresas/equipo" className="boton-cristal tono-cian">Equipo</Link>
          </div>
        </Estado>
      )}

      {estado === "aprobada" && (
        <Estado tono="cian" Icono={KeyRound} titulo="Aprobada: mete vuestro código">
          <p className="text-[13.5px]" style={{ color: "#a7b3c6" }}>Lo hemos mandado a <strong style={{ color: "#e2e8f0" }}>{solicitud!.correoEmpresa}</strong>. Mira también en spam.</p>
          <div className="grid sm:grid-cols-[1fr_auto] gap-2.5">
            <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && void activar()}
              placeholder="XXXX-XXXX" maxLength={12} className="w-full text-lg tracking-[0.3em] font-mono text-center" aria-label="Código de empresa" />
            <button type="button" onClick={() => void activar()} disabled={enviando || codigo.replace(/[^A-Z0-9]/g, "").length < 8} className="boton-neon disabled:opacity-50">
              {enviando ? "Comprobando…" : "Activar"}
            </button>
          </div>
          {error && <p role="alert" className="text-[13px]" style={{ color: "#fca5a5" }}>{error}</p>}
        </Estado>
      )}

      {estado === "pendiente" && !editando && (
        <Estado tono="ambar" Icono={Clock} titulo="Lo estamos revisando">
          <p className="text-[13.5px]" style={{ color: "#a7b3c6" }}>
            {solicitud!.razonSocial} ({solicitud!.nif}). El código llegará a {solicitud!.correoEmpresa}.
          </p>
          <button type="button" onClick={() => setEditando(true)} className="boton-cristal tono-ambar">Corregir los datos</button>
        </Estado>
      )}

      {estado === "suspendida" && (
        <Estado tono="rosa" Icono={Ban} titulo="Acceso suspendido">
          {solicitud!.motivo && <p className="text-[13.5px]" style={{ color: "#cbd5e1" }}>{solicitud!.motivo}</p>}
          <p className="text-[13px]" style={{ color: "#a7b3c6" }}>Si crees que es un error, escríbenos.</p>
        </Estado>
      )}

      {estado === "rechazada" && (
        <Estado tono="ambar" Icono={FileCheck2} titulo="No hemos podido verificarla">
          {solicitud!.motivo && <p className="text-[13.5px]" style={{ color: "#cbd5e1" }}>{solicitud!.motivo}</p>}
          <p className="text-[13px]" style={{ color: "#a7b3c6" }}>Corrige los datos abajo y vuelve a mandarlos.</p>
        </Estado>
      )}

      {mostrarFormulario && (
        <section className="cristal tono-neutro p-5 sm:p-6 space-y-5">
          {!correoVerificado && (
            <p className="text-[13px] rounded-xl p-3" style={{ background: "rgba(245,158,11,0.1)", color: "#fcd34d" }}>
              Antes confirma el correo de tu cuenta: te mandamos un enlace al registrarte.
            </p>
          )}

          <fieldset>
            <legend className={etiqueta} style={{ color: "#cbd5e1" }}>¿Qué sois?</legend>
            <div className="grid grid-cols-3 gap-2">
              {tipos.map((t) => {
                const si = form.tipo === t.id;
                const I = ICONO_TIPO[t.id] || Building2;
                return (
                  <label key={t.id} className="rounded-2xl p-3 cursor-pointer text-center flex flex-col items-center gap-1.5"
                    style={si
                      ? { background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.6)", color: "#f1f5f9" }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(148,163,184,0.2)", color: "#cbd5e1" }}>
                    <input type="radio" name="tipo" className="sr-only" checked={si} onChange={() => setForm({ ...form, tipo: t.id as Tipo })} />
                    <I size={24} style={{ color: si ? "#99f6e4" : "#a7b3c6" }} aria-hidden="true" />
                    <span className="text-[13.5px] font-bold leading-tight">{t.label}</span>
                  </label>
                );
              })}
            </div>
            {tipos.find((t) => t.id === form.tipo)?.ayuda && (
              <p className="text-[12px] mt-1.5" style={{ color: "var(--texto-tenue)" }}>{tipos.find((t) => t.id === form.tipo)!.ayuda}</p>
            )}
          </fieldset>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block"><span className={etiqueta} style={{ color: "#cbd5e1" }}>Razón social</span>
              <input value={form.razonSocial} maxLength={160} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} placeholder="Como figura en el NIF" className="w-full" /></label>
            <label className="block"><span className={etiqueta} style={{ color: "#cbd5e1" }}>NIF</span>
              <input value={form.nif} maxLength={12} onChange={(e) => setForm({ ...form, nif: e.target.value.toUpperCase() })} placeholder="B12345674 o tu DNI" className="w-full" /></label>
            {form.tipo !== "empresa" && (
              <label className="block sm:col-span-2"><span className={etiqueta} style={{ color: "#cbd5e1" }}>{form.tipo === "ett" ? "Número de autorización como ETT" : "Número de agencia de colocación"}</span>
                <input value={form.autorizacion} maxLength={30} onChange={(e) => setForm({ ...form, autorizacion: e.target.value })}
                  placeholder={form.tipo === "ett" ? "8 cifras, o la forma antigua (31/0012/95)" : "10 cifras, del Servicio Público de Empleo"} className="w-full" /></label>
            )}
          </div>

          {form.tipo === "empresa" && (
            <fieldset>
              <legend className={etiqueta} style={{ color: "#cbd5e1" }}>Sectores <span style={{ color: "var(--texto-tenue)" }}>(hasta 3)</span></legend>
              <div className="flex flex-wrap gap-2">
                {sectores.map((s) => {
                  const si = form.sectores.includes(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => alternar(s.id)} aria-pressed={si}
                      className="inline-flex items-center gap-1 text-[13px] font-semibold px-3.5 min-h-[38px] rounded-full"
                      style={si
                        ? { background: "rgba(45,212,191,0.18)", color: "#99f6e4", border: "1px solid rgba(45,212,191,0.55)" }
                        : { background: "rgba(255,255,255,0.03)", color: "#a7b3c6", border: "1px solid rgba(148,163,184,0.2)" }}>
                      {si && <Check size={14} aria-hidden="true" />}{s.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <label className="block"><span className={etiqueta} style={{ color: "#cbd5e1" }}>¿Qué perfiles buscáis? <span style={{ color: "var(--texto-tenue)" }}>(opcional)</span></span>
            <textarea rows={2} value={form.busca} maxLength={300} onChange={(e) => setForm({ ...form, busca: e.target.value })} placeholder="Ej.: camareros de sala en Pamplona" className="w-full" /></label>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block"><span className={etiqueta} style={{ color: "#cbd5e1" }}>Correo de la empresa <span style={{ color: "var(--texto-tenue)" }}>(aquí llega el código)</span></span>
              <input type="email" value={form.correoEmpresa} maxLength={200} onChange={(e) => setForm({ ...form, correoEmpresa: e.target.value })} placeholder="rrhh@vuestraempresa.es" className="w-full" /></label>
            <label className="block"><span className={etiqueta} style={{ color: "#cbd5e1" }}>Teléfono <span style={{ color: "var(--texto-tenue)" }}>(opcional)</span></span>
              <input type="tel" value={form.telefono} maxLength={30} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full" /></label>
            <label className="block"><span className={etiqueta} style={{ color: "#cbd5e1" }}>Web <span style={{ color: "var(--texto-tenue)" }}>(opcional)</span></span>
              <input value={form.web} maxLength={200} onChange={(e) => setForm({ ...form, web: e.target.value })} placeholder="vuestraempresa.es" className="w-full" /></label>
            <label className="block"><span className={etiqueta} style={{ color: "#cbd5e1" }}>Provincia <span style={{ color: "var(--texto-tenue)" }}>(opcional)</span></span>
              <input value={form.provincia} maxLength={80} onChange={(e) => setForm({ ...form, provincia: e.target.value })} className="w-full" /></label>
          </div>
          <p className="text-[12px]" style={{ color: "var(--texto-tenue)" }}>Con un correo del dominio de la empresa se verifica antes que con uno de Gmail u Hotmail.</p>

          <label className="flex items-start gap-2.5 text-[13px] cursor-pointer" style={{ color: "#cbd5e1" }}>
            <input type="checkbox" className="mt-0.5 w-5 h-5 shrink-0" style={{ accentColor: "#2dd4bf" }} checked={form.compromiso} onChange={(e) => setForm({ ...form, compromiso: e.target.checked })} />
            <span>Los datos son ciertos, y usaremos los de los candidatos solo para nuestros procesos de selección, sin cederlos a nadie, como manda el RGPD. <Link href="/privacidad" style={{ color: "#99f6e4" }}>Privacidad</Link></span>
          </label>

          {error && <p role="alert" className="text-[13px]" style={{ color: "#fca5a5" }}>{error}</p>}
          <div className="grid sm:grid-cols-[1fr_auto] gap-2.5">
            <button type="button" onClick={() => void mandar()} disabled={enviando} className="boton-neon disabled:opacity-50">
              {enviando ? "Mandando…" : estado ? "Mandar los datos corregidos" : "Mandar para verificar"}
            </button>
            {editando && <button type="button" onClick={() => { setEditando(false); setError(""); }} className="boton-cristal tono-neutro">Cancelar</button>}
          </div>
        </section>
      )}
    </MarcoContratacion>
  );
}
