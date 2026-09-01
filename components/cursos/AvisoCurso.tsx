"use client";

/**
 * components/cursos/AvisoCurso.tsx — El interruptor de avisos de un curso.
 *
 * QUÉ PROMETE, EXACTAMENTE. Que le avisaremos cuando haya ofertas de trabajo
 * que pidan este curso. No cuando salga convocatoria del curso: esas plazas no
 * las tenemos y en media España no saldría nunca, así que prometerlo sería
 * vender humo. Aquí el texto dice lo que de verdad va a pasar.
 *
 * POR QUÉ ES UN INTERRUPTOR Y NO UN BOTÓN DE "APUNTARME". Porque tiene que
 * poder apagarse desde el mismo sitio donde se encendió. Un aviso que solo se
 * puede activar es una suscripción con truco, y acaba en gente marcando el
 * correo como spam — que nos hace daño a todos los envíos, no solo a este.
 *
 * Sin sesión no se esconde: se explica y se invita a entrar, que para eso está
 * la ficha pública. Lo que no se hace es pedir el correo aquí y ya: el aviso
 * necesita saber quién eres para cruzarlo con tu CV y tu ciudad.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BellOff, Check, Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Estado = "cargando" | "sin-sesion" | "apagado" | "encendido" | "guardando" | "error";

export default function AvisoCurso({ slug, nombre }: { slug: string; nombre: string }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const pathname = usePathname();

  async function cabecera(): Promise<HeadersInit> {
    const { data } = await getSupabaseBrowser().auth.getSession();
    const token = data.session?.access_token;
    return token
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      : { "Content-Type": "application/json" };
  }

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await fetch(`/api/cursos/aviso?slug=${encodeURIComponent(slug)}`, {
          headers: await cabecera(),
        });
        const j = await res.json();
        if (!vivo) return;
        if (!j.sesion) setEstado("sin-sesion");
        else setEstado(j.activo ? "encendido" : "apagado");
      } catch {
        if (vivo) setEstado("apagado");
      }
    })();
    return () => { vivo = false; };
  }, [slug]);

  async function cambiar(activo: boolean) {
    const anterior = estado;
    setEstado("guardando");
    try {
      const res = await fetch("/api/cursos/aviso", {
        method: "POST",
        headers: await cabecera(),
        body: JSON.stringify({ slug, activo }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setEstado(activo ? "encendido" : "apagado");
    } catch {
      // Devolver el interruptor a donde estaba: dejarlo "encendido" cuando no
      // se guardó sería mentirle a quien está mirando la pantalla.
      setEstado(anterior === "guardando" ? "apagado" : anterior);
    }
  }

  const marco = {
    background: estado === "encendido" ? "rgba(34,197,94,0.06)" : "#1e212b",
    border: `1px solid ${estado === "encendido" ? "rgba(34,197,94,0.25)" : "#2d3142"}`,
  };

  if (estado === "cargando") {
    return (
      <div className="rounded-xl p-4 mb-8 flex items-center gap-2.5" style={marco}>
        <Loader2 size={16} className="animate-spin" style={{ color: "#64748b" }} />
        <span className="text-xs" style={{ color: "#64748b" }}>Comprobando…</span>
      </div>
    );
  }

  if (estado === "sin-sesion") {
    return (
      <div className="rounded-xl p-4 mb-8" style={marco}>
        <div className="flex items-start gap-2.5 mb-3">
          <Bell size={17} strokeWidth={1.8} className="shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
          <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: "#f1f5f9" }}>
              Avísame cuando haya trabajo que lo pida
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
              Te escribimos cuando salgan ofertas que pidan {nombre}. Como mucho una vez cada dos semanas,
              y solo si hay ofertas de verdad.
            </p>
          </div>
        </div>
        <Link
          href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
          className="btn-game text-xs inline-block"
          style={{ textDecoration: "none" }}
        >
          Entrar para activarlo
        </Link>
      </div>
    );
  }

  const encendido = estado === "encendido";
  const guardando = estado === "guardando";

  return (
    <div className="rounded-xl p-4 mb-8 flex items-start gap-3" style={marco}>
      {encendido
        ? <Check size={17} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
        : <Bell size={17} strokeWidth={1.8} className="shrink-0 mt-0.5" style={{ color: "#22c55e" }} />}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold mb-0.5" style={{ color: "#f1f5f9" }}>
          {encendido ? "Aviso activado" : "Avísame cuando haya trabajo que lo pida"}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
          {encendido
            ? `Te escribiremos cuando salgan ofertas que pidan ${nombre}. Como mucho una vez cada dos semanas.`
            : "Solo cuando haya ofertas de verdad, y como mucho una vez cada dos semanas."}
        </p>
      </div>

      <button
        onClick={() => cambiar(!encendido)}
        disabled={guardando}
        aria-pressed={encendido}
        aria-label={encendido ? "Desactivar el aviso de este curso" : "Activar el aviso de este curso"}
        className="shrink-0 text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1.5"
        style={{
          background: encendido ? "transparent" : "#22c55e",
          border: `1px solid ${encendido ? "#2d3142" : "#22c55e"}`,
          color: encendido ? "#94a3b8" : "#0f1117",
          opacity: guardando ? 0.6 : 1,
        }}
      >
        {guardando
          ? <Loader2 size={13} className="animate-spin" />
          : encendido && <BellOff size={13} strokeWidth={1.9} />}
        {guardando ? "Guardando" : encendido ? "Quitar" : "Activar"}
      </button>
    </div>
  );
}
