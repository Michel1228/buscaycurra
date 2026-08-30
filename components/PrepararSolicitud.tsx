"use client";

/**
 * Botón "Prepárame la solicitud" de la ficha de curso.
 *
 * Es la pieza que cierra el embudo: alguien llega desde Google buscando
 * "curso de carretillero", lee la ficha, y aquí se le ofrece algo que solo
 * podemos darle si se registra. La página pública trae la visita; esto la
 * convierte.
 *
 * A quien no ha entrado se le dice para qué sirve registrarse ANTES de pedirle
 * nada, en vez de soltarle un muro de login sin explicación.
 */

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, FileText, Loader2, Sparkles } from "lucide-react";

interface Preparado {
  curso: { slug: string; nombre: string };
  carta: string;
  ficha: { nombre: string; apellidos: string; email: string; telefono: string; ciudad: string };
  documentos: string[];
  dondeApuntarse: { nombre: string; url: string }[];
}

function BotonCopiar({ texto, etiqueta }: { texto: string; etiqueta: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        } catch {
          /* si el navegador no deja copiar, el texto sigue visible para seleccionarlo a mano */
        }
      }}
      className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg transition"
      style={{
        background: copiado ? "rgba(34,197,94,0.15)" : "#252836",
        color: copiado ? "#22c55e" : "#94a3b8",
        border: "1px solid #2d3142",
      }}
    >
      {copiado ? <Check size={11} strokeWidth={2.2} /> : <Copy size={11} strokeWidth={1.9} />}
      {copiado ? "Copiado" : etiqueta}
    </button>
  );
}

export default function PrepararSolicitud({ slug, nombre }: { slug: string; nombre: string }) {
  const [estado, setEstado] = useState<"inicio" | "cargando" | "listo" | "sin-cv" | "sin-sesion" | "error">("inicio");
  const [datos, setDatos] = useState<Preparado | null>(null);
  const [mensajeError, setMensajeError] = useState("");

  async function preparar() {
    setEstado("cargando");
    setMensajeError("");
    try {
      const { getSupabaseBrowser } = await import("@/lib/supabase-browser");
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { setEstado("sin-sesion"); return; }

      const res = await fetch("/api/cursos/preparar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ slug }),
      });

      if (res.status === 428) { setEstado("sin-cv"); return; }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMensajeError((d as { error?: string }).error || "No se pudo preparar la solicitud.");
        setEstado("error");
        return;
      }
      setDatos(await res.json());
      setEstado("listo");
    } catch {
      setMensajeError("Sin conexión. Comprueba tu internet.");
      setEstado("error");
    }
  }

  // ── Resultado ──────────────────────────────────────────────────────────
  if (estado === "listo" && datos) {
    const fichaTexto = [
      `Nombre: ${datos.ficha.nombre} ${datos.ficha.apellidos}`,
      `Email: ${datos.ficha.email}`,
      `Teléfono: ${datos.ficha.telefono}`,
      `Ciudad: ${datos.ficha.ciudad}`,
    ].join("\n");

    return (
      <div className="rounded-xl p-5 mb-8" style={{ background: "#1e212b", border: "1px solid rgba(34,197,94,0.25)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} strokeWidth={1.9} style={{ color: "#22c55e" }} />
          <h3 className="text-sm font-bold" style={{ color: "#f1f5f9" }}>Tu solicitud, lista</h3>
        </div>

        {/* Carta */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#64748b" }}>
              Carta de solicitud
            </span>
            <BotonCopiar texto={datos.carta} etiqueta="Copiar carta" />
          </div>
          <p
            className="text-xs leading-relaxed whitespace-pre-wrap rounded-lg p-3"
            style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#94a3b8" }}
          >
            {datos.carta}
          </p>
        </div>

        {/* Datos para el formulario */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#64748b" }}>
              Tus datos para el formulario
            </span>
            <BotonCopiar texto={fichaTexto} etiqueta="Copiar datos" />
          </div>
          <div
            className="text-xs rounded-lg p-3 flex flex-col gap-1"
            style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#94a3b8" }}
          >
            <span><strong style={{ color: "#f1f5f9" }}>{datos.ficha.nombre} {datos.ficha.apellidos}</strong></span>
            {datos.ficha.email && <span>{datos.ficha.email}</span>}
            {datos.ficha.telefono && <span>{datos.ficha.telefono}</span>}
            {datos.ficha.ciudad && <span>{datos.ficha.ciudad}</span>}
          </div>
        </div>

        {/* Papeles */}
        <div className="mb-5">
          <span className="text-[11px] uppercase tracking-wide font-semibold block mb-2" style={{ color: "#64748b" }}>
            Lo que te van a pedir
          </span>
          <ul className="flex flex-col gap-1.5">
            {datos.documentos.map((d, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                <FileText size={12} strokeWidth={1.8} className="shrink-0 mt-0.5" style={{ color: "#64748b" }} />
                {d}
              </li>
            ))}
          </ul>
        </div>

        {/* Salida al portal oficial */}
        {datos.dondeApuntarse.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {datos.dondeApuntarse.map(d => (
              <a
                key={d.url}
                href={`${d.url}${d.url.includes("?") ? "&" : "?"}utm_source=buscaycurra&utm_medium=referral&utm_campaign=cursos`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-game text-xs"
                style={{ textDecoration: "none" }}
              >
                Ir a {d.nombre} →
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Estados intermedios ────────────────────────────────────────────────
  const caja = (contenido: React.ReactNode) => (
    <div
      className="rounded-xl p-5 mb-8"
      style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.04))", border: "1px solid rgba(34,197,94,0.2)" }}
    >
      {contenido}
    </div>
  );

  if (estado === "sin-sesion") {
    return caja(
      <>
        <p className="text-sm font-semibold mb-1" style={{ color: "#f1f5f9" }}>
          Entra y te la dejo preparada
        </p>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: "#94a3b8" }}>
          Con tu CV te escribo la carta de solicitud, te ordeno los datos para el formulario
          y te digo los papeles exactos que te van a pedir. Es gratis.
        </p>
        <div className="flex gap-2">
          <Link href={`/auth/registro?redirect=/cursos/${slug}`} className="btn-game text-xs" style={{ textDecoration: "none" }}>
            Crear cuenta gratis
          </Link>
          <Link
            href={`/auth/login?redirect=/cursos/${slug}`}
            className="text-xs px-4 py-2 rounded-xl"
            style={{ border: "1px solid #2d3142", color: "#94a3b8", textDecoration: "none" }}
          >
            Ya tengo cuenta
          </Link>
        </div>
      </>
    );
  }

  if (estado === "sin-cv") {
    return caja(
      <>
        <p className="text-sm font-semibold mb-1" style={{ color: "#f1f5f9" }}>
          Me falta tu CV
        </p>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: "#94a3b8" }}>
          Sin él no puedo escribir la carta con tu experiencia. Súbelo en PDF y lo leo yo solo,
          o créalo desde cero: se tarda un par de minutos.
        </p>
        <Link href="/app/curriculum" className="btn-game text-xs" style={{ textDecoration: "none" }}>
          Ir a mi currículum
        </Link>
      </>
    );
  }

  return caja(
    <>
      <p className="text-sm font-semibold mb-1" style={{ color: "#f1f5f9" }}>
        ¿Te preparo la solicitud del {nombre.toLowerCase()}?
      </p>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "#94a3b8" }}>
        Te escribo la carta con tu experiencia, te dejo los datos listos para copiar
        en el formulario y te digo qué papeles necesitas.
      </p>
      {estado === "error" && (
        <p className="text-xs mb-3" style={{ color: "#ef4444" }}>{mensajeError}</p>
      )}
      <button onClick={preparar} disabled={estado === "cargando"} className="btn-game text-xs disabled:opacity-60">
        {estado === "cargando" ? (
          <span className="flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin" /> Preparándola…
          </span>
        ) : (
          "Prepárame la solicitud"
        )}
      </button>
    </>
  );
}
