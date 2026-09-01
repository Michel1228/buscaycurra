/**
 * components/emigrar/ParoEuropeo.tsx — Llevarte el paro contigo.
 *
 * ORDEN DE LA PÁGINA. Primero lo que se lleva o se pierde en euros, porque es
 * lo que hace que alguien siga leyendo un texto sobre formularios. Después los
 * dos plazos que lo tiran todo si se fallan. Y al final el U1, que es para
 * cuando vuelva — pero que hay que pedir mientras todavía está allí, y por eso
 * no puede quedarse fuera.
 *
 * Los plazos van con la cuenta de lo que pasa si se fallan, no como consejos.
 * «Recuerda inscribirte pronto» no mueve a nadie; «siete días o lo pierdes»,
 * sí. Y es la verdad.
 */
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Clock, Globe, Wallet } from "lucide-react";
import { U2, U1, FUENTES, ACTUALIZADO } from "@/lib/emigrar/paro-europeo";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="text-base font-bold mb-3" style={{ color: "#f1f5f9" }}>{titulo}</h2>
      {children}
    </section>
  );
}

export default function ParoEuropeo({ base }: { base: string }) {
  return (
    <>
      <Link href={base} className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-80"
            style={{ color: "#64748b", textDecoration: "none" }}>
        <ArrowLeft size={13} strokeWidth={1.9} />
        Volver a Emigrar
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={20} strokeWidth={1.8} style={{ color: "#22c55e" }} />
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
            Hasta 6 meses
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
          Si te vas a buscar trabajo fuera, puedes llevarte el paro
        </h1>
        <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#94a3b8" }}>
          Mucha gente da por hecho que al irse de España pierde la prestación, así que se va sin nada
          o no se va. No es así: existe un derecho europeo para seguir cobrándola mientras buscas
          trabajo en otro país. Pero hay dos plazos que, si se fallan, lo tiran todo.
        </p>
      </div>

      {/* ── Lo que se juega, en euros ── */}
      <div className="rounded-xl p-4 mb-8" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)" }}>
        <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
          Con una prestación de <span style={{ color: "#f1f5f9", fontWeight: 600 }}>1.000 € al mes</span>,
          exportarla son{" "}
          <span style={{ color: "#22c55e", fontWeight: 700 }}>3.000 €</span> los tres primeros meses y
          hasta <span style={{ color: "#22c55e", fontWeight: 700 }}>6.000 €</span> si te la prorrogan.
          Justo en el momento en que estás pagando una mudanza a otro país.
        </p>
      </div>

      {/* ── Los plazos, que es lo que de verdad hay que retener ── */}
      <Seccion titulo="Los dos plazos que lo tiran todo">
        <div className="flex flex-col gap-3">
          {U2.plazos.map(p => (
            <div key={p.cuanto} className="rounded-xl p-4"
                 style={{ background: "#1e212b", border: "1px solid rgba(245,158,11,0.25)" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Clock size={14} strokeWidth={1.9} style={{ color: "#f59e0b" }} />
                <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>{p.cuanto}</span>
              </div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: "#94a3b8" }}>{p.que}</p>
              <p className="text-[11px] leading-relaxed pt-2 flex gap-2 items-start"
                 style={{ color: "#ef4444", borderTop: "1px solid #2d3142" }}>
                <AlertTriangle size={12} strokeWidth={2} className="shrink-0 mt-0.5" />
                <span>{p.siFallas}</span>
              </p>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo={`${U2.nombre}: qué es y quién puede`}>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
          {U2.queEs} Antes se llamaba {U2.antesSeLlamaba}. Lo pides tú al SEPE, antes de irte.
        </p>
        <p className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#64748b" }}>
          Hace falta cumplir las tres
        </p>
        <ul className="flex flex-col gap-2 mb-4">
          {U2.requisitos.map(r => (
            <li key={r} className="text-xs leading-relaxed pl-3 relative" style={{ color: "#94a3b8" }}>
              <span className="absolute left-0" style={{ color: "#22c55e" }}>·</span>{r}
            </li>
          ))}
        </ul>
        <p className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#64748b" }}>
          Y esto conviene saberlo
        </p>
        <ul className="flex flex-col gap-2">
          {U2.avisos.map(a => (
            <li key={a} className="text-xs leading-relaxed pl-3 relative" style={{ color: "#94a3b8" }}>
              <span className="absolute left-0" style={{ color: "#64748b" }}>·</span>{a}
            </li>
          ))}
        </ul>
      </Seccion>

      {/* ── El de la vuelta ── */}
      <Seccion titulo={`Y para cuando vuelvas: el ${U1.nombre}`}>
        <div className="rounded-xl p-4" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>{U1.porQueImporta}</p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "#64748b" }}>
            {U1.queEs} Se pide {U1.quienLoPide.toLowerCase()}
          </p>
          <ul className="flex flex-col gap-2">
            {U1.avisos.map(a => (
              <li key={a} className="text-xs leading-relaxed pl-3 relative" style={{ color: "#94a3b8" }}>
                <span className="absolute left-0" style={{ color: "#22c55e" }}>·</span>{a}
              </li>
            ))}
          </ul>
        </div>
      </Seccion>

      {/* ── A dónde ir de verdad ── */}
      <Seccion titulo="Por dónde se empieza">
        <div className="flex flex-col gap-3">
          {[U2.enlaceSepe, U2.enlace, U1.enlace].map(e => (
            <a key={e.url} href={e.url} target="_blank" rel="noopener noreferrer"
               className="rounded-xl p-4 flex items-center justify-between gap-3 hover:opacity-90"
               style={{ background: "#1e212b", border: "1px solid #2d3142", textDecoration: "none" }}>
              <span className="text-sm" style={{ color: "#f1f5f9" }}>{e.titulo}</span>
              <ArrowRight size={14} strokeWidth={1.9} className="shrink-0" style={{ color: "#22c55e" }} />
            </a>
          ))}
        </div>
      </Seccion>

      <div className="rounded-xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-3"
           style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
        <Wallet size={20} strokeWidth={1.8} className="shrink-0" style={{ color: "#22c55e" }} />
        <div className="flex-1">
          <p className="text-sm font-semibold mb-0.5" style={{ color: "#f1f5f9" }}>
            ¿No sabes si te toca?
          </p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            Dile a Guzzi desde cuándo estás apuntado al paro y a dónde te quieres ir.
          </p>
        </div>
        <Link href="/app/gusi" className="btn-game text-xs shrink-0 text-center" style={{ textDecoration: "none" }}>
          Hablar con Guzzi
        </Link>
      </div>

      <div className="pt-6" style={{ borderTop: "1px solid #2d3142" }}>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Globe size={12} strokeWidth={1.9} style={{ color: "#64748b" }} />
          <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "#64748b" }}>
            De dónde sale esta información
          </span>
        </div>
        <ul className="flex flex-col gap-1.5 mb-3">
          {FUENTES.map(f => (
            <li key={f.url}>
              <a href={f.url} target="_blank" rel="noopener noreferrer"
                 className="text-xs hover:underline" style={{ color: "#64748b" }}>
                {f.titulo}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-[11px] leading-relaxed" style={{ color: "#4b5563" }}>
          Revisado en {ACTUALIZADO}. Esto es información, no asesoramiento: cada caso tiene sus
          particularidades y quien decide es el SEPE. Confírmalo con ellos antes de comprar el billete.
        </p>
      </div>
    </>
  );
}
