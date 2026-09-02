/**
 * components/cursos/Acreditacion.tsx — La página del PEAC, sin envoltorio.
 *
 * Igual que el resto del apartado, se pinta en dos sitios: /cursos/acreditar
 * (pública, la que indexa Google) y /app/formacion/acreditar (dentro, con el
 * menú). `base` es lo único que cambia.
 *
 * El orden de la página está pensado para una persona concreta: alguien que
 * lleva años trabajando, no tiene título y ha entrado buscando un curso. Por
 * eso lo primero no es qué es el procedimiento, sino si le vale a ella.
 */
import Link from "next/link";
import {
  AlertCircle, ArrowLeft, BadgeCheck, Clock, Euro, FileText, Globe, MapPin,
} from "lucide-react";
import {
  REQUISITOS, FASES, DOCUMENTOS, ADVERTENCIAS, ENLACES, FUENTES, ACTUALIZADO,
} from "@/lib/cursos/acreditacion";
import AvisoNacionalidad from "@/components/origen/AvisoNacionalidad";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold mb-3" style={{ color: "#f1f5f9" }}>{titulo}</h2>
      {children}
    </section>
  );
}

export default function Acreditacion({ base }: { base: string }) {
  return (
    <>
      <Link href={base} className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-80"
            style={{ color: "#64748b", textDecoration: "none" }}>
        <ArrowLeft size={13} strokeWidth={1.9} />
        Todos los cursos
      </Link>

      {/* ── Cabecera: la promesa, dicha en la lengua de quien la necesita ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BadgeCheck size={20} strokeWidth={1.8} style={{ color: "#22c55e" }} />
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
            Gratis · Sin volver a estudiar
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
          ¿Llevas años trabajando y no tienes el título?
        </h1>
        <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#94a3b8" }}>
          Se puede acreditar oficialmente lo que ya sabes hacer, sin volver a clase y sin pagar.
          Se llama acreditación de competencias, la lleva el Ministerio y vale en toda España.
        </p>
      </div>

      <AvisoNacionalidad
        queNoAplica="El procedimiento pide nacionalidad española o de la Unión Europea, o permiso de residencia y trabajo en vigor en España. Si no lo tienes, esto todavía no te sirve."
        destino="ES"
      />

      {/* ── Los tres datos que deciden si sigues leyendo ── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icono: <Euro size={12} strokeWidth={1.9} />, etiqueta: "Cuánto cuesta", valor: "Gratis", verde: true },
          { icono: <Clock size={12} strokeWidth={1.9} />, etiqueta: "Cuándo", valor: "Todo el año" },
          { icono: <MapPin size={12} strokeWidth={1.9} />, etiqueta: "Dónde vale", valor: "Toda España" },
        ].map(d => (
          <div key={d.etiqueta} className="rounded-xl p-3" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
            <div className="flex items-center gap-1.5 mb-1" style={{ color: "#64748b" }}>
              {d.icono}
              <span className="text-[10px] uppercase tracking-wide font-semibold">{d.etiqueta}</span>
            </div>
            <p className="text-sm font-bold" style={{ color: d.verde ? "#22c55e" : "#f1f5f9" }}>{d.valor}</p>
          </div>
        ))}
      </div>

      <Seccion titulo="Qué es, en dos frases">
        <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
          Es un procedimiento oficial para que los años que llevas trabajando cuenten como formación.
          Presentas tu vida laboral y tus contratos, demuestras lo que sabes hacer, y te dan una
          acreditación que queda inscrita en el registro del Estado.
        </p>
      </Seccion>

      <Seccion titulo="Si llegas a esto, te vale">
        <div className="flex flex-col gap-3">
          {REQUISITOS.map(r => (
            <div key={r.nivel} className="rounded-xl p-4" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{r.nivel}</span>
                <span className="text-[11px]" style={{ color: "#64748b" }}>desde {r.edadMinima} años</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                <span style={{ color: "#22c55e", fontWeight: 600 }}>
                  {r.experiencia.anios} años trabajando
                </span>
                {" "}y {r.experiencia.horas.toLocaleString("es-ES")} horas en total,
                dentro de los últimos {r.experiencia.ventanaAnios} años.
              </p>
              <p className="text-xs leading-relaxed mt-1.5" style={{ color: "#64748b" }}>
                Si no llegas por experiencia, también vale con {r.formacionHoras} horas de formación
                en los últimos {r.formacionVentanaAnios} años.
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3 leading-relaxed" style={{ color: "#64748b" }}>
          Tres años a jornada completa pasan de las 2.000 horas de sobra. Si has trabajado a media
          jornada o por temporadas, echa la cuenta con la vida laboral en la mano.
        </p>
      </Seccion>

      <Seccion titulo="Cómo va, paso a paso">
        <ol className="flex flex-col gap-3">
          {FASES.map((f, i) => (
            <li key={f.titulo} className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{f.titulo}.</span> {f.texto}
              </span>
            </li>
          ))}
        </ol>
      </Seccion>

      <Seccion titulo="Los papeles que te van a pedir">
        <div className="flex flex-col gap-2">
          {DOCUMENTOS.map(d => (
            <div key={d} className="flex gap-2.5 items-start">
              <FileText size={13} strokeWidth={1.8} className="shrink-0 mt-1" style={{ color: "#64748b" }} />
              <span className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{d}</span>
            </div>
          ))}
        </div>
      </Seccion>

      {/* ── Lo que no anima pero hay que decir ── */}
      <div className="rounded-xl p-4 mb-8" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)" }}>
        <div className="flex items-center gap-2 mb-2.5">
          <AlertCircle size={15} strokeWidth={1.9} style={{ color: "#f59e0b" }} />
          <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Antes de contar con ello</span>
        </div>
        <ul className="flex flex-col gap-2">
          {ADVERTENCIAS.map(a => (
            <li key={a} className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>· {a}</li>
          ))}
        </ul>
      </div>

      {/* ── Adónde va de verdad ── */}
      <Seccion titulo="Por dónde se empieza">
        <div className="flex flex-col gap-3">
          <a href={ENLACES.porComunidad.url} target="_blank" rel="noopener noreferrer"
             className="rounded-xl p-4 block hover:opacity-90"
             style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", textDecoration: "none" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "#22c55e" }}>
              Busca tu comunidad autónoma
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
              El procedimiento lo gestiona cada comunidad. Aquí está la lista oficial con el enlace
              de todas. Es por donde hay que entrar.
            </p>
          </a>
          <a href={ENLACES.ministerio.url} target="_blank" rel="noopener noreferrer"
             className="rounded-xl p-4 block hover:opacity-90"
             style={{ background: "#1e212b", border: "1px solid #2d3142", textDecoration: "none" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "#f1f5f9" }}>
              La explicación del Ministerio
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
              Requisitos y fases, en la fuente. Por si quieres comprobarlo tú mismo.
            </p>
          </a>
        </div>
      </Seccion>

      {/* ── Y de vuelta a lo nuestro ── */}
      <div className="rounded-xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-3"
           style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
        <BadgeCheck size={20} strokeWidth={1.8} className="shrink-0" style={{ color: "#22c55e" }} />
        <div className="flex-1">
          <p className="text-sm font-semibold mb-0.5" style={{ color: "#f1f5f9" }}>
            ¿No sabes si llegas a los requisitos?
          </p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            Dile a Guzzi cuántos años llevas y en qué, y te lo mira contigo.
          </p>
        </div>
        <Link href="/app/gusi" className="btn-game text-xs shrink-0 text-center" style={{ textDecoration: "none" }}>
          Hablar con Guzzi
        </Link>
      </div>

      {/* ── Fuentes ── */}
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
        <p className="text-[11px]" style={{ color: "#4b5563" }}>
          Revisado en {ACTUALIZADO}. Los requisitos del nivel 1 y el estado de las convocatorias
          cambian según la comunidad: comprueba siempre la tuya antes de moverte.
        </p>
      </div>
    </>
  );
}
