/**
 * components/aupair/Derechos.tsx — Los derechos de una au pair, sin envoltorio.
 *
 * ORDEN DE LA PÁGINA, Y NO ES CASUAL. Primero la pregunta que de verdad le
 * quita el sueño —«¿esto que me piden es normal?»— y solo después el articulado.
 * Una chica de veintidós años sola en Múnich a las dos de la mañana no entra
 * aquí a leer un tratado de 1969: entra a saber si lo que le está pasando está
 * bien o no.
 *
 * Por eso las señales de alarma van arriba, la comparación de dinero en el
 * medio, y el texto legal al final, para cuando necesite enseñárselo a alguien.
 */
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Check, Globe, Scale, ShieldCheck, X } from "lucide-react";
import {
  DERECHOS_ACUERDO, SENALES_DE_ALARMA, SI_ES_TRABAJO, PAISES_CON_ACUERDO,
  PAISES_SIN_ACUERDO, REINO_UNIDO_INTERNAS, FUENTES, ACTUALIZADO, diferenciaAnual,
} from "@/lib/au-pair/derechos";
import {
  REALIDAD_POR_PAIS, ETIQUETA_DIFICULTAD, COLOR_DIFICULTAD,
} from "@/lib/au-pair/puedes-ir";
import AvisoNacionalidad from "@/components/origen/AvisoNacionalidad";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="text-base font-bold mb-3" style={{ color: "#f1f5f9" }}>{titulo}</h2>
      {children}
    </section>
  );
}

export default function DerechosAuPair({ base }: { base: string }) {
  const euros = (n: number) => n.toLocaleString("es-ES");

  return (
    <>
      <Link href={base} className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-80"
            style={{ color: "#64748b", textDecoration: "none" }}>
        <ArrowLeft size={13} strokeWidth={1.9} />
        Volver a Au Pair
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={20} strokeWidth={1.8} style={{ color: "#22c55e" }} />
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
            Tus derechos
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
          ¿Lo que te están pidiendo sigue siendo ser au pair?
        </h1>
        <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#94a3b8" }}>
          Ser au pair es un intercambio cultural: ayudas unas horas y a cambio vives con la familia,
          aprendes el idioma y recibes dinero de bolsillo. Cuando eso se convierte en jornada
          completa, ya no es un intercambio: es un trabajo. Y un trabajo se paga.
        </p>
      </div>

      <AvisoNacionalidad
        queNoAplica="La tabla de países de más abajo dice quién puede ir sin visado, y está calculada para nacionalidad española o de la UE. Con otra nacionalidad casi todos esos destinos piden visado."
      />

      {/* ── Lo primero: las señales ── */}
      <div className="rounded-xl p-4 mb-8"
           style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.22)" }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} strokeWidth={1.9} style={{ color: "#ef4444" }} />
          <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
            Señales de que ya no es un intercambio
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {SENALES_DE_ALARMA.map(s => (
            <li key={s} className="flex gap-2.5 items-start">
              <X size={13} strokeWidth={2.2} className="shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
              <span className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── El dinero, que es el argumento que convence ── */}
      <Seccion titulo="Lo que va de una cosa a la otra">
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div className="rounded-xl p-4" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
            <p className="text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#64748b" }}>
              Au pair · dinero de bolsillo
            </p>
            <p className="text-xl font-bold" style={{ color: "#94a3b8" }}>
              ~{euros(SI_ES_TRABAJO.bolsilloAuPairTipico)} € <span className="text-xs font-normal">al mes</span>
            </p>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>
              Unos {euros(SI_ES_TRABAJO.bolsilloAuPairTipico * 12)} € al año. No cotizas.
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <p className="text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#22c55e" }}>
              Empleada de hogar · salario
            </p>
            <p className="text-xl font-bold" style={{ color: "#22c55e" }}>
              {euros(SI_ES_TRABAJO.smiMensual)} € <span className="text-xs font-normal">al mes</span>
            </p>
            <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
              {euros(SI_ES_TRABAJO.smiAnual)} € al año en catorce pagas, con Seguridad Social.
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
          En España la diferencia son{" "}
          <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{euros(diferenciaAnual())} € al año</span>,
          más sanidad, pensión y derecho al paro. Por eso importa tanto cómo se llame lo que haces.
        </p>
      </Seccion>

      <Seccion titulo="Si es un trabajo, esto es lo que te toca">
        <div className="rounded-xl p-4" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
          <div className="flex items-center gap-2 mb-3">
            <Scale size={15} strokeWidth={1.9} style={{ color: "#22c55e" }} />
            <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{SI_ES_TRABAJO.regimen}</span>
          </div>
          <ul className="flex flex-col gap-2">
            {SI_ES_TRABAJO.puntos.map(p => (
              <li key={p} className="flex gap-2.5 items-start">
                <Check size={13} strokeWidth={2.2} className="shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                <span className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </Seccion>

      {/* ── ¿PUEDES IR SIQUIERA? ──
          Va antes que los derechos a propósito. De poco sirve saber que tienes
          derecho a cinco horas en un país al que no puedes entrar a trabajar.
          Y es un problema NUESTRO: las ofertas de au pair que más tenemos son
          del Reino Unido (1.155), Estados Unidos (648) y Canadá (411), tres
          sitios donde una española no puede presentarse sin más. */}
      <Seccion titulo="Antes de nada: ¿puedes ir a ese país?">
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#94a3b8" }}>
          Muchas ofertas que verás son de países donde hace falta visado, y algunos ya no tienen
          figura de au pair. Esto es lo que hay que tener para poder aceptarlas, con nacionalidad
          española o de la UE.
        </p>
        <div className="flex flex-col gap-3">
          {REALIDAD_POR_PAIS.map(p => (
            <div key={p.codigo} className="rounded-xl p-4"
                 style={{ background: "#1e212b", border: `1px solid ${p.dificultad === "dificil" ? "rgba(239,68,68,0.25)" : "#2d3142"}` }}>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-base leading-none">{p.bandera}</span>
                <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{p.nombre}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${COLOR_DIFICULTAD[p.dificultad]}1f`, color: COLOR_DIFICULTAD[p.dificultad] }}>
                  {ETIQUETA_DIFICULTAD[p.dificultad]}
                </span>
              </div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: "#94a3b8" }}>{p.resumen}</p>
              <ul className="flex flex-col gap-1 mb-2">
                {p.comoSePuede.map(c => (
                  <li key={c} className="text-[11px] leading-relaxed pl-3 relative" style={{ color: "#94a3b8" }}>
                    <span className="absolute left-0" style={{ color: "#64748b" }}>·</span>{c}
                  </li>
                ))}
              </ul>
              {p.cuidadoCon && (
                <p className="text-[11px] leading-relaxed pt-2" style={{ color: "#ef4444", borderTop: "1px solid #2d3142" }}>
                  {p.cuidadoCon}
                </p>
              )}
              {p.enlace && (
                <a href={p.enlace.url} target="_blank" rel="noopener noreferrer"
                   className="text-[11px] inline-block mt-2 hover:underline" style={{ color: "#22c55e" }}>
                  {p.enlace.titulo} →
                </a>
              )}
            </div>
          ))}
        </div>
      </Seccion>

      {/* ── Reino Unido: la exención que ya no existe ── */}
      <Seccion titulo="Si vas de interna al Reino Unido, esto cambió">
        <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)" }}>
          <p className="text-sm font-semibold mb-2" style={{ color: "#22c55e" }}>
            {REINO_UNIDO_INTERNAS.cambio}
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            Desde 1999 se podía pagar por debajo del mínimo a quien vivía en casa de la familia y era
            «tratada como una más». Se creó pensando en las au pairs y acabó amparando jornadas
            completas por doscientas libras al mes. Son veinticinco años de costumbre diciendo lo
            contrario de lo que dice la ley hoy: muchas familias no se han enterado.
          </p>
          <ul className="flex flex-col gap-2">
            {REINO_UNIDO_INTERNAS.puntos.map(t => (
              <li key={t} className="flex gap-2.5 items-start">
                <Check size={13} strokeWidth={2.2} className="shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                <span className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{t}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 mt-3 pt-3" style={{ borderTop: "1px solid #2d3142" }}>
            {REINO_UNIDO_INTERNAS.fuentes.map(f => (
              <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer"
                 className="text-[11px] hover:underline" style={{ color: "#64748b" }}>
                {f.titulo}
              </a>
            ))}
          </div>
        </div>
      </Seccion>

      {/* ── El tratado, con el matiz de dónde vale ── */}
      <Seccion titulo="Lo que dice el Acuerdo Europeo">
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#94a3b8" }}>
          Existe un tratado de 1969 que fija lo mínimo de una colocación au pair. España lo ratificó
          y está publicado en el BOE, así que aquí se puede reclamar.
        </p>
        <div className="flex flex-col gap-3">
          {DERECHOS_ACUERDO.map(d => (
            <div key={d.articulo} className="rounded-xl p-4" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
              <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{d.titulo}</span>
                <span className="text-[10px] font-mono" style={{ color: "#64748b" }}>{d.articulo}</span>
              </div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: "#94a3b8" }}>{d.enCristiano}</p>
              <p className="text-[11px] leading-relaxed pt-2 italic"
                 style={{ color: "#64748b", borderTop: "1px solid #2d3142" }}>
                «{d.texto}»
              </p>
            </div>
          ))}
        </div>
      </Seccion>

      {/* ── El matiz que evita mandarla a discutir con una ley que no aplica ── */}
      <Seccion titulo="Ojo: no vale en todos los países">
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#94a3b8" }}>
          El tratado solo se puede reclamar donde está ratificado. En el resto, tus derechos vienen
          de la ley nacional, que a veces protege más y a veces menos.
        </p>

        <p className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#22c55e" }}>
          Sí está en vigor
        </p>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {PAISES_CON_ACUERDO.map(p => (
            <span key={p.codigo} className="text-[11px] px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>
              {p.nombre}
            </span>
          ))}
        </div>

        <p className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: "#f59e0b" }}>
          No está en vigor, aunque lo parezca
        </p>
        <div className="flex flex-col gap-2">
          {PAISES_SIN_ACUERDO.map(p => (
            <div key={p.codigo} className="rounded-lg p-3"
                 style={{ background: "#161922", border: "1px solid #2d3142" }}>
              <span className="text-xs font-semibold" style={{ color: "#f59e0b" }}>{p.nombre}</span>
              <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: "#94a3b8" }}>{p.motivo}</p>
            </div>
          ))}
        </div>
      </Seccion>

      {/* ── Y de vuelta a lo nuestro ── */}
      <div className="rounded-xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-3"
           style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
        <ShieldCheck size={20} strokeWidth={1.8} className="shrink-0" style={{ color: "#22c55e" }} />
        <div className="flex-1">
          <p className="text-sm font-semibold mb-0.5" style={{ color: "#f1f5f9" }}>
            ¿No sabes si lo tuyo está bien?
          </p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            Cuéntale a Guzzi qué horas haces y qué te piden, y lo miráis juntos.
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
          Revisado en {ACTUALIZADO}. Esto es información, no asesoramiento legal: si tu caso es serio,
          habla con un abogado laboralista o con el sindicato del país donde estés. Si estás en peligro
          o te han retenido el pasaporte, llama a emergencias — en toda la Unión Europea, el 112.
        </p>
      </div>
    </>
  );
}
