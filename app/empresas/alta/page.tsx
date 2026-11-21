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
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import FondoOleaje from "@/components/FondoOleaje";

type Estado = "pendiente" | "aprobada" | "activa" | "rechazada" | "suspendida";
type Tipo = "empresa" | "ett" | "agencia";
interface Solicitud {
  razonSocial: string; nif: string; tipo: Tipo; autorizacion: string | null; sectores: string[]; busca: string | null;
  provincia: string | null; web: string | null; correoEmpresa: string; telefono: string | null; estado: Estado; motivo: string | null;
}
interface Opcion { id: string; label: string; ayuda?: string }

const caja = { background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" };
const etiqueta = "block text-[11px] font-semibold mb-1";
const verde = "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)";

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

  const cabecera = (
    <header className="sticky top-0 z-50" style={{ background: "rgba(15,17,23,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(45,49,66,0.4)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/empresas" className="flex items-center gap-2.5">
          <img src="/icon-192.png" alt="Guzzi" width={24} height={24} style={{ borderRadius: "50%" }} />
          <span className="font-bold text-sm" style={{ color: "#22c55e" }}>BuscayCurra</span>
          <span className="hidden sm:inline text-xs" style={{ color: "#8b98ad" }}>/ Alta de empresa</span>
        </Link>
        <Link href="/empresas/candidatos" className="text-xs font-semibold" style={{ color: "#22c55e" }}>Candidatos →</Link>
      </div>
    </header>
  );

  const marco = (hijos: ReactNode) => (
    <div className="min-h-screen pb-16" style={{ background: "#0f1117" }}>
      <FondoOleaje />
      {cabecera}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">{hijos}</div>
    </div>
  );

  if (cargando) return marco(<p className="text-sm" style={{ color: "#94a3b8" }}>Cargando…</p>);
  if (sinSesion) {
    return marco(
      <div className="text-center py-16">
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#f8fafc" }}>Da de alta tu empresa</h1>
        <p className="text-sm mb-5" style={{ color: "#8b98ad" }}>Primero entra o crea una cuenta con tu correo; luego vuelve a buscaycurra.es/empresas/alta y rellenas los datos de la empresa.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/auth/login?redirect=%2Fempresas%2Falta" className="btn-game text-sm px-5 py-2.5 rounded-lg">Entrar</Link>
          <Link href="/auth/registro" className="text-sm px-5 py-2.5 rounded-lg" style={{ border: "1px solid rgba(148,163,184,0.25)", color: "#e2e8f0" }}>Crear cuenta</Link>
        </div>
      </div>
    );
  }
  if (equipo && !solicitud) {
    return marco(
      <div className="rounded-xl p-6" style={caja}>
        <h1 className="text-xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Ya entras con {equipo}</h1>
        <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>Tu cuenta está en el equipo de una empresa verificada: no hace falta que des de alta otra.</p>
        <Link href="/empresas/candidatos" className="btn-game text-sm px-5 py-2.5 rounded-lg inline-block">Ver candidatos →</Link>
      </div>
    );
  }

  const estado = solicitud?.estado;
  const mostrarFormulario = !solicitud || editando || estado === "rechazada";

  return marco(
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "#f8fafc" }}>Alta de empresa</h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: "#8b98ad" }}>
          Los candidatos de BuscayCurra solo los ven empresas, ETT y agencias de colocación que hemos verificado. Es gratis: revisamos vuestros datos en los registros oficiales y os mandamos un código al correo de la empresa.
        </p>
      </div>

      {estado === "activa" && (
        <div className="rounded-xl p-6" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.3)" }}>
          <p className="text-lg font-bold" style={{ color: "#22c55e" }}>✓ {solicitud!.razonSocial} está verificada</p>
          <p className="text-sm mt-1 mb-4" style={{ color: "#94a3b8" }}>
            {solicitud!.tipo === "empresa" ? "Veis a los candidatos de vuestros sectores." : "Como ETT o agencia de colocación, veis a los candidatos de todos los sectores."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/empresas/candidatos" className="btn-game text-sm px-5 py-2.5 rounded-lg">Ver candidatos →</Link>
            <Link href="/empresas/entrevistas" className="text-sm px-4 py-2.5 rounded-lg" style={{ border: "1px solid rgba(148,163,184,0.25)", color: "#e2e8f0" }}>Vuestras entrevistas</Link>
            <Link href="/empresas/equipo" className="text-sm px-4 py-2.5 rounded-lg" style={{ border: "1px solid rgba(148,163,184,0.25)", color: "#e2e8f0" }}>Vuestro equipo</Link>
          </div>
        </div>
      )}

      {estado === "aprobada" && (
        <div className="rounded-xl p-6 space-y-3" style={caja}>
          <p className="text-lg font-bold" style={{ color: "#f1f5f9" }}>Aprobada: mete vuestro código</p>
          <p className="text-sm" style={{ color: "#94a3b8" }}>Lo hemos mandado a <strong style={{ color: "#e2e8f0" }}>{solicitud!.correoEmpresa}</strong>. Mira también en la carpeta de spam.</p>
          <div className="flex flex-wrap gap-3">
            <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && void activar()}
              placeholder="XXXX-XXXX" maxLength={12} className="text-lg tracking-widest font-mono" style={{ maxWidth: 220 }} aria-label="Código de empresa" />
            <button onClick={() => void activar()} disabled={enviando || codigo.replace(/[^A-Z0-9]/g, "").length < 8}
              className="px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50" style={{ background: verde, color: "#0b1406" }}>
              {enviando ? "Comprobando…" : "Activar"}
            </button>
          </div>
          {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
        </div>
      )}

      {estado === "pendiente" && !editando && (
        <div className="rounded-xl p-6 space-y-2" style={caja}>
          <p className="text-lg font-bold" style={{ color: "#f1f5f9" }}>Lo estamos revisando</p>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Comprobamos {solicitud!.razonSocial} ({solicitud!.nif}) en los registros oficiales. Cuando esté, os llega el código a {solicitud!.correoEmpresa}.
          </p>
          <button onClick={() => setEditando(true)} className="text-xs font-semibold" style={{ color: "#22c55e" }}>Corregir los datos</button>
        </div>
      )}

      {estado === "suspendida" && (
        <div className="rounded-xl p-6" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-lg font-bold" style={{ color: "#fca5a5" }}>Acceso suspendido</p>
          {solicitud!.motivo && <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>{solicitud!.motivo}</p>}
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Si crees que es un error, escríbenos.</p>
        </div>
      )}

      {estado === "rechazada" && (
        <div className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.3)" }}>
          <p className="text-sm font-semibold" style={{ color: "#fbbf24" }}>No hemos podido verificarla con estos datos</p>
          {solicitud!.motivo && <p className="text-sm mt-1" style={{ color: "#cbd5e1" }}>{solicitud!.motivo}</p>}
          <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Corrígelos abajo y vuelve a mandarlos.</p>
        </div>
      )}

      {mostrarFormulario && (
        <div className="rounded-xl p-5 sm:p-6 space-y-5" style={caja}>
          {!correoVerificado && (
            <p className="text-xs rounded-lg p-3" style={{ background: "rgba(245,158,11,0.08)", color: "#fbbf24" }}>
              Antes confirma el correo de tu cuenta: te mandamos un enlace al registrarte.
            </p>
          )}

          <fieldset>
            <legend className={etiqueta} style={{ color: "#94a3b8" }}>¿Qué sois?</legend>
            <div className="grid sm:grid-cols-3 gap-2">
              {tipos.map((t) => (
                <label key={t.id} className="rounded-lg p-3 cursor-pointer text-sm"
                  style={{ background: form.tipo === t.id ? "rgba(34,197,94,0.1)" : "#0f1117", border: `1px solid ${form.tipo === t.id ? "rgba(34,197,94,0.45)" : "rgba(148,163,184,0.18)"}`, color: "#e2e8f0" }}>
                  <input type="radio" name="tipo" className="sr-only" checked={form.tipo === t.id} onChange={() => setForm({ ...form, tipo: t.id as Tipo })} />
                  <span className="font-semibold block">{t.label}</span>
                  <span className="text-[11px]" style={{ color: "#8b98ad" }}>{t.ayuda}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block"><span className={etiqueta} style={{ color: "#94a3b8" }}>Razón social</span>
              <input value={form.razonSocial} maxLength={160} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} placeholder="Como figura en el NIF" className="w-full text-sm" /></label>
            <label className="block"><span className={etiqueta} style={{ color: "#94a3b8" }}>NIF</span>
              <input value={form.nif} maxLength={12} onChange={(e) => setForm({ ...form, nif: e.target.value.toUpperCase() })} placeholder="B12345674 (o tu DNI si eres autónomo)" className="w-full text-sm" /></label>
            {form.tipo !== "empresa" && (
              <label className="block sm:col-span-2"><span className={etiqueta} style={{ color: "#94a3b8" }}>{form.tipo === "ett" ? "Número de autorización como ETT" : "Número de agencia de colocación"}</span>
                <input value={form.autorizacion} maxLength={30} onChange={(e) => setForm({ ...form, autorizacion: e.target.value })}
                  placeholder={form.tipo === "ett" ? "8 cifras, o la forma antigua (31/0012/95)" : "10 cifras, del Servicio Público de Empleo"} className="w-full text-sm" /></label>
            )}
          </div>

          {form.tipo === "empresa" && (
            <fieldset>
              <legend className={etiqueta} style={{ color: "#94a3b8" }}>¿En qué sector buscáis gente? (hasta 3)</legend>
              <div className="flex flex-wrap gap-2">
                {sectores.map((s) => {
                  const si = form.sectores.includes(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => alternar(s.id)} aria-pressed={si}
                      className="text-xs px-3 py-1.5 rounded-full"
                      style={{ background: si ? "rgba(34,197,94,0.15)" : "#0f1117", color: si ? "#4ade80" : "#94a3b8", border: `1px solid ${si ? "rgba(34,197,94,0.4)" : "rgba(148,163,184,0.18)"}` }}>
                      {si ? "✓ " : ""}{s.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: "#8b98ad" }}>Veréis a los candidatos de estos sectores. Las ETT y agencias de colocación ven todos.</p>
            </fieldset>
          )}

          <label className="block"><span className={etiqueta} style={{ color: "#94a3b8" }}>¿Qué perfiles buscáis? (opcional)</span>
            <textarea rows={2} value={form.busca} maxLength={300} onChange={(e) => setForm({ ...form, busca: e.target.value })} placeholder="Ej.: camareros de sala y ayudantes de cocina en Pamplona" className="w-full text-sm" /></label>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block"><span className={etiqueta} style={{ color: "#94a3b8" }}>Correo de la empresa (aquí llega el código)</span>
              <input type="email" value={form.correoEmpresa} maxLength={200} onChange={(e) => setForm({ ...form, correoEmpresa: e.target.value })} placeholder="rrhh@vuestraempresa.es" className="w-full text-sm" /></label>
            <label className="block"><span className={etiqueta} style={{ color: "#94a3b8" }}>Teléfono (opcional)</span>
              <input value={form.telefono} maxLength={30} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full text-sm" /></label>
            <label className="block"><span className={etiqueta} style={{ color: "#94a3b8" }}>Web (opcional)</span>
              <input value={form.web} maxLength={200} onChange={(e) => setForm({ ...form, web: e.target.value })} placeholder="vuestraempresa.es" className="w-full text-sm" /></label>
            <label className="block"><span className={etiqueta} style={{ color: "#94a3b8" }}>Provincia (opcional)</span>
              <input value={form.provincia} maxLength={80} onChange={(e) => setForm({ ...form, provincia: e.target.value })} className="w-full text-sm" /></label>
          </div>
          <p className="text-[11px]" style={{ color: "#8b98ad" }}>Con un correo del dominio de la empresa se verifica antes que con uno de Gmail u Hotmail.</p>

          <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: "#cbd5e1" }}>
            <input type="checkbox" className="mt-0.5" style={{ accentColor: "#22c55e" }} checked={form.compromiso} onChange={(e) => setForm({ ...form, compromiso: e.target.checked })} />
            <span>Los datos son ciertos, y usaremos los datos de los candidatos solo para nuestros procesos de selección, sin cederlos a nadie, como manda el RGPD. <Link href="/privacidad" style={{ color: "#22c55e" }}>Privacidad</Link></span>
          </label>

          {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => void mandar()} disabled={enviando} className="px-5 py-2.5 text-sm font-semibold rounded-lg disabled:opacity-50" style={{ background: verde, color: "#0b1406" }}>
              {enviando ? "Mandando…" : estado ? "Mandar los datos corregidos" : "Mandar para verificar"}
            </button>
            {editando && <button onClick={() => { setEditando(false); setError(""); }} className="text-sm px-4 py-2.5 rounded-lg" style={{ border: "1px solid rgba(148,163,184,0.18)", color: "#94a3b8" }}>Cancelar</button>}
          </div>
        </div>
      )}
    </div>
  );
}
