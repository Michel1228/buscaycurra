"use client";

/**
 * components/origen/AvisoNacionalidad.tsx — «Esto igual no te sirve a ti».
 *
 * POR QUÉ EXISTE. Las páginas de acreditar la experiencia, llevarte el paro y
 * derechos de au pair están escritas para quien tiene nacionalidad española o
 * de la Unión Europea. Para un argentino, un colombiano o un marroquí, buena
 * parte no aplica — y hasta ahora se lo enseñábamos igual, con una nota al pie
 * que se lee después de haberse hecho ilusiones.
 *
 * Este aviso va ARRIBA y dice lo que hay antes de que siga leyendo. Prefiero
 * que alguien se lleve el chasco en la primera línea a que organice su vida y
 * lo descubra en la ventanilla.
 *
 * Tres estados, y ninguno es «suponer que es español»:
 *   · No lo sabemos  → se le pregunta, con un desplegable.
 *   · Es de la UE    → no se enseña nada; la página le vale entera.
 *   · No es de la UE → se le dice qué parte no le aplica y a dónde ir.
 */

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Globe, Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { esDeLaUE, movilidadDe } from "@/lib/origen/movilidad";
import { LISTA_PAISES } from "@/lib/paises";

interface Props {
  /** Qué se pierde quien no sea de la UE en ESTA página. */
  queNoAplica: string;
  /** Destino del que habla la página, si es uno concreto. */
  destino?: string;
}

type Estado = "cargando" | "sin_sesion" | "sin_declarar" | "ue" | "fuera_ue";

export default function AvisoNacionalidad({ queNoAplica, destino }: Props) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [nacionalidad, setNacionalidad] = useState<string>("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const sb = getSupabaseBrowser();
        const { data: { user } } = await sb.auth.getUser();
        if (!vivo) return;
        if (!user) return setEstado("sin_sesion");

        const { data } = await sb.from("profiles").select("nacionalidad").eq("id", user.id).single();
        if (!vivo) return;

        const n = data?.nacionalidad || "";
        setNacionalidad(n);
        if (!n) setEstado("sin_declarar");
        else setEstado(esDeLaUE(n) ? "ue" : "fuera_ue");
      } catch {
        if (vivo) setEstado("sin_sesion");
      }
    })();
    return () => { vivo = false; };
  }, []);

  async function guardar(codigo: string) {
    setGuardando(true);
    try {
      const sb = getSupabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      await sb.from("profiles").update({ nacionalidad: codigo }).eq("id", user.id);
      setNacionalidad(codigo);
      setEstado(esDeLaUE(codigo) ? "ue" : "fuera_ue");
    } finally {
      setGuardando(false);
    }
  }

  // Si es de la UE la página le vale entera: no se le estorba con nada.
  if (estado === "ue" || estado === "cargando" || estado === "sin_sesion") return null;

  if (estado === "sin_declarar") {
    return (
      <div className="rounded-xl p-4 mb-6" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
        <div className="flex items-start gap-2.5 mb-3">
          <Globe size={17} strokeWidth={1.8} className="shrink-0 mt-0.5" style={{ color: "#94a3b8" }} />
          <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: "#f1f5f9" }}>
              ¿De dónde eres?
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
              Lo que puedes hacer depende de tu nacionalidad, y buena parte de esta página solo vale
              para quien tiene la española o de la Unión Europea. Dínoslo y te avisamos de lo que sí
              te aplica.
            </p>
          </div>
        </div>
        <select
          onChange={e => e.target.value && guardar(e.target.value)}
          disabled={guardando}
          defaultValue=""
          aria-label="Elige tu nacionalidad"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }}
        >
          <option value="" disabled>Elige tu nacionalidad…</option>
          {LISTA_PAISES.map(p => (
            <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>
          ))}
        </select>
        {guardando && (
          <p className="text-[11px] mt-2 flex items-center gap-1.5" style={{ color: "#64748b" }}>
            <Loader2 size={11} className="animate-spin" /> Guardando…
          </p>
        )}
      </div>
    );
  }

  // fuera_ue
  const info = destino ? movilidadDe(nacionalidad, destino) : null;

  return (
    <div className="rounded-xl p-4 mb-6"
         style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={17} strokeWidth={1.9} className="shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
        <div className="flex-1">
          <p className="text-sm font-semibold mb-1" style={{ color: "#f59e0b" }}>
            Ojo: esto está escrito para nacionalidad española o de la UE
          </p>
          <p className="text-xs leading-relaxed mb-2" style={{ color: "#94a3b8" }}>
            {queNoAplica}
          </p>
          {info?.explicacion && (
            <p className="text-xs leading-relaxed mb-2" style={{ color: "#94a3b8" }}>
              <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{info.titulo}.</span>{" "}
              {info.explicacion}
            </p>
          )}
          {info?.enlaceOficial && (
            <a href={info.enlaceOficial.url} target="_blank" rel="noopener noreferrer"
               className="text-xs inline-flex items-center gap-1 hover:underline" style={{ color: "#22c55e" }}>
              {info.enlaceOficial.titulo}
              <ArrowRight size={11} strokeWidth={2} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
