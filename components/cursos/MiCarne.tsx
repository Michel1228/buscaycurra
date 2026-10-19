"use client";

/**
 * components/cursos/MiCarne.tsx — "Ya lo tengo": cuándo caduca mi carné.
 *
 * Va dentro del bloque de renovación de la ficha. Dentro de la app guarda la
 * fecha y enseña cuánto le queda; en la web pública invita a entrar para que
 * le avisemos (es la razón para crearse la cuenta de quien ya trabaja de esto).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, CalendarCheck, Loader2, Trash2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Carne {
  curso_slug: string;
  obtenido_en: string;
  caduca_en: string;
  avisos: boolean;
}

const fechaEs = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

function sumarAnios(iso: string, anios: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + anios);
  return d.toISOString().slice(0, 10);
}

/** Cuánto le queda, en palabras, y de qué color pintarlo. */
export function estadoCarne(caduca: string, hoy = new Date()) {
  const dias = Math.round((new Date(`${caduca}T00:00:00`).getTime() - new Date(hoy.toDateString()).getTime()) / 86400000);
  if (dias < 0) return { color: "#ef4444", etiqueta: "Caducado", queda: `Caducó hace ${-dias === 1 ? "1 día" : -dias < 60 ? `${-dias} días` : `${Math.round(-dias / 30.44)} meses`}` };
  const queda = dias > 730 ? `Quedan ${Math.floor(dias / 365)} años` : dias > 60 ? `Quedan ${Math.round(dias / 30.44)} meses` : dias === 1 ? "Queda 1 día" : `Quedan ${dias} días`;
  if (dias <= 90) return { color: "#f59e0b", etiqueta: "Renuévalo pronto", queda };
  return { color: "#22c55e", etiqueta: "En vigor", queda };
}

async function cabecera(): Promise<HeadersInit> {
  const { data } = await getSupabaseBrowser().auth.getSession();
  const token = data.session?.access_token;
  return token ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : { "Content-Type": "application/json" };
}

export default function MiCarne({ slug, nombre, anios, dentroDeLaApp }: {
  slug: string;
  nombre: string;
  /** Años de validez; null si la caducidad la pone la persona (soldador). */
  anios: number | null;
  dentroDeLaApp: boolean;
}) {
  const [carne, setCarne] = useState<Carne | null | undefined>(undefined);
  const [editando, setEditando] = useState(false);
  const [obtenido, setObtenido] = useState("");
  const [caducaManual, setCaducaManual] = useState("");
  const [otraFecha, setOtraFecha] = useState(false);
  const [avisos, setAvisos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!dentroDeLaApp) return;
    (async () => {
      try {
        const r = await fetch("/api/cursos/carnes", { headers: await cabecera() });
        const j = await r.json();
        setCarne((j.carnes as Carne[] | undefined)?.find(c => c.curso_slug === slug) ?? null);
      } catch { setCarne(null); }
    })();
  }, [dentroDeLaApp, slug]);

  // ── En la web pública: la invitación ──
  if (!dentroDeLaApp) {
    return (
      <Link
        href={`/app/formacion/${slug}`}
        className="mt-2.5 rounded-xl p-3.5 flex items-center gap-3 hover:opacity-90"
        style={{ background: "#1e212b", border: "1px solid #2d3142", textDecoration: "none" }}
      >
        <BellRing size={18} strokeWidth={1.8} className="shrink-0" style={{ color: "#22c55e" }} />
        <span className="text-sm" style={{ color: "#f1f5f9" }}>
          <strong>¿Ya lo tienes?</strong> Pon cuándo lo sacaste y te avisamos antes de que caduque.
        </span>
      </Link>
    );
  }

  if (carne === undefined) return null;

  const caducaPrevista = obtenido ? (anios && !otraFecha ? sumarAnios(obtenido, anios) : caducaManual) : "";

  async function guardar() {
    setError("");
    if (!obtenido) { setError("Pon la fecha en que lo sacaste."); return; }
    if (!anios && !caducaManual) { setError("Pon la fecha de caducidad que diga tu certificado."); return; }
    setGuardando(true);
    try {
      const r = await fetch("/api/cursos/carnes", {
        method: "POST",
        headers: await cabecera(),
        body: JSON.stringify({ slug, obtenidoEn: obtenido, caducaEn: !anios || otraFecha ? caducaManual : undefined, avisos }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setError(j.error || "No se ha podido guardar."); return; }
      setCarne(j.carne);
      setEditando(false);
    } catch {
      setError("No se ha podido guardar. Inténtalo otra vez.");
    } finally {
      setGuardando(false);
    }
  }

  async function quitar() {
    setCarne(null);
    try { await fetch(`/api/cursos/carnes?slug=${encodeURIComponent(slug)}`, { method: "DELETE", headers: await cabecera() }); } catch { /* se verá al volver */ }
  }

  async function cambiarAvisos() {
    if (!carne) return;
    const nuevo = { ...carne, avisos: !carne.avisos };
    setCarne(nuevo);
    try {
      await fetch("/api/cursos/carnes", {
        method: "POST",
        headers: await cabecera(),
        body: JSON.stringify({ slug, obtenidoEn: carne.obtenido_en, caducaEn: carne.caduca_en, avisos: nuevo.avisos }),
      });
    } catch { /* se verá al volver */ }
  }

  function abrirEdicion() {
    setObtenido(carne?.obtenido_en ?? "");
    setCaducaManual(carne?.caduca_en ?? "");
    setOtraFecha(!!carne && !!anios && carne.caduca_en !== sumarAnios(carne.obtenido_en, anios));
    setAvisos(carne?.avisos ?? true);
    setEditando(true);
  }

  // ── Ya guardado: cuánto le queda ──
  if (carne && !editando) {
    const e = estadoCarne(carne.caduca_en);
    return (
      <div className="mt-2.5 rounded-xl p-3.5" style={{ background: "#1e212b", border: `1px solid ${e.color}55` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: e.color }}>{e.etiqueta}</p>
            <p className="text-base font-bold" style={{ color: "#f1f5f9" }}>Caduca el {fechaEs(carne.caduca_en)}</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>{e.queda}</p>
          </div>
          <button onClick={quitar} aria-label="Quitar este carné" className="p-1.5 rounded-lg shrink-0" style={{ color: "#64748b" }}>
            <Trash2 size={14} strokeWidth={1.8} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button onClick={cambiarAvisos} aria-pressed={carne.avisos}
                  className="text-[11px] px-2.5 py-1 rounded-full"
                  style={{ border: `1px solid ${carne.avisos ? "#22c55e" : "#2d3142"}`, color: carne.avisos ? "#22c55e" : "#64748b" }}>
            {carne.avisos ? "Te avisaremos 3 meses y 1 mes antes" : "Sin avisos"}
          </button>
          <button onClick={abrirEdicion} className="text-[11px] px-2.5 py-1 rounded-full"
                  style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
            Cambiar fechas
          </button>
        </div>
      </div>
    );
  }

  // ── Sin guardar: el botón, y al pulsarlo las fechas ──
  if (!editando) {
    return (
      <button onClick={abrirEdicion}
              className="mt-2.5 w-full rounded-xl p-3.5 flex items-center gap-3 text-left hover:opacity-90"
              style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
        <CalendarCheck size={18} strokeWidth={1.8} className="shrink-0" style={{ color: "#22c55e" }} />
        <span className="text-sm" style={{ color: "#f1f5f9" }}>
          <strong>Ya lo tengo.</strong> Avísame antes de que caduque.
        </span>
      </button>
    );
  }

  return (
    <div className="mt-2.5 rounded-xl p-3.5 space-y-3" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
      <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{nombre}</p>
      <label className="block">
        <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "#64748b" }}>Lo sacaste el</span>
        <input id={`obtenido-${slug}`} type="date" value={obtenido} max={new Date().toISOString().slice(0, 10)}
               onChange={e => setObtenido(e.target.value)}
               className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
               style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9", colorScheme: "dark" }} />
      </label>

      {anios && !otraFecha ? (
        <p className="text-xs" style={{ color: "#94a3b8" }}>
          {caducaPrevista ? <>Caduca el <strong style={{ color: "#f1f5f9" }}>{fechaEs(caducaPrevista)}</strong>. </> : null}
          <button type="button" onClick={() => setOtraFecha(true)} className="underline" style={{ color: "#64748b" }}>
            ¿Tu tarjeta dice otra fecha?
          </button>
        </p>
      ) : (
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "#64748b" }}>
            Caduca el {anios ? "" : "(la que diga tu certificado)"}
          </span>
          <input id={`caduca-${slug}`} type="date" value={caducaManual} onChange={e => setCaducaManual(e.target.value)}
                 className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
                 style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9", colorScheme: "dark" }} />
        </label>
      )}

      <label className="flex items-center gap-2 text-xs" style={{ color: "#94a3b8" }}>
        <input id={`avisos-${slug}`} type="checkbox" checked={avisos} onChange={e => setAvisos(e.target.checked)} />
        Avisarme 3 meses y 1 mes antes de que caduque
      </label>

      {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}

      <div className="flex gap-2">
        <button onClick={guardar} disabled={guardando} className="btn-game flex-1 py-2.5 text-sm">
          {guardando ? <Loader2 size={14} className="animate-spin inline" /> : "Guardar"}
        </button>
        <button onClick={() => setEditando(false)} className="px-4 py-2.5 rounded-xl text-sm"
                style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
