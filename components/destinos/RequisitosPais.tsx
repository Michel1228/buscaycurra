/**
 * components/destinos/RequisitosPais.tsx — Qué te piden en este país.
 *
 * POR QUÉ ESTÁ EN LA PÁGINA PÚBLICA Y NO DENTRO DE LA APLICACIÓN. La página
 * `/trabajar-en/[pais]` la ve cualquiera, sin registrarse, y es la que llega por
 * Google. Ahí no sabemos quién está leyendo, así que no se puede personalizar:
 * hay que enseñar los dos casos a la vez y dejar que cada uno se reconozca.
 *
 * Eso arregla el problema de fondo. Hasta ahora la sección de visado decía
 * «Ciudadano UE: libre circulación, sin visado» y punto. Es verdad, pero solo
 * para quien es de la UE. Un argentino, un colombiano o un marroquí leían eso y
 * se llevaban la idea contraria a la correcta, sin una sola línea que les
 * dijera que no iba con ellos.
 *
 * No es un componente interactivo: se pinta en el servidor y va en el HTML, que
 * es justo lo que hace falta para que Google lo indexe.
 */

import { REQUISITOS, type RequisitosDestino } from "@/lib/destinos/requisitos";

const CAJA = { background: "#1a1d2e", border: "1px solid #2d3142" };

function Lista({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
          <span aria-hidden className="select-none shrink-0 mt-[7px] rounded-full"
                style={{ width: 5, height: 5, background: color }} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export default function RequisitosPais({ codigo }: { codigo: string }) {
  const ficha: RequisitosDestino | undefined = REQUISITOS.find(r => r.codigo === codigo.toUpperCase());
  if (!ficha) return null;

  const { movilidadJoven: mj } = ficha;

  return (
    <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto border-t" style={{ borderColor: "#2d3142" }}>
      <h2 className="text-xl font-bold mb-1" style={{ color: "#f1f5f9" }}>
        Qué te piden para trabajar en {ficha.nombre}
      </h2>
      <p className="text-sm mb-6" style={{ color: "#64748b" }}>
        Lo que hace falta depende de tu nacionalidad, no de dónde vivas ahora. Mira el caso que sea el
        tuyo.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Con nacionalidad de la UE */}
        <div className="rounded-xl p-5" style={CAJA}>
          <div className="flex items-center gap-2 mb-3">
            <span aria-hidden className="rounded-full" style={{ width: 8, height: 8, background: "#22c55e" }} />
            <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>
              Si tienes nacionalidad de la UE, del EEE o suiza
            </h3>
          </div>
          <Lista items={ficha.siEresDeLaUE} color="#22c55e" />
        </div>

        {/* Sin nacionalidad de la UE */}
        <div className="rounded-xl p-5" style={CAJA}>
          <div className="flex items-center gap-2 mb-3">
            <span aria-hidden className="rounded-full" style={{ width: 8, height: 8, background: "#f59e0b" }} />
            <h3 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>
              Si tienes otra nacionalidad
            </h3>
          </div>
          <Lista items={ficha.siNoEresDeLaUE} color="#f59e0b" />
        </div>
      </div>

      {/* Movilidad joven: es la vía que más gente desconoce y la que más sirve */}
      {mj && (
        <div className="rounded-xl p-5 mt-4"
             style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.22)" }}>
          <h3 className="font-semibold text-sm mb-1" style={{ color: "#22c55e" }}>
            {mj.nombre} · {mj.edad}
          </h3>
          <p className="text-xs mb-3" style={{ color: "#64748b" }}>
            Una vía pensada para gente joven, que no necesita que una empresa te patrocine.
          </p>
          <Lista items={mj.condiciones} color="#22c55e" />

          {mj.nota && (
            <p className="text-xs leading-relaxed mt-3 pt-3 border-t" style={{ color: "#94a3b8", borderColor: "rgba(34,197,94,0.18)" }}>
              {mj.nota}
            </p>
          )}

          <a href={mj.url} target="_blank" rel="noopener noreferrer"
             className="text-xs inline-block mt-3 hover:underline" style={{ color: "#22c55e" }}>
            → Condiciones y solicitud, en la web oficial
          </a>
        </div>
      )}

      {/* El error concreto que comete la gente con este país */}
      {ficha.ojoCon && (
        <div className="rounded-xl p-5 mt-4"
             style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <h3 className="font-semibold text-sm mb-1.5" style={{ color: "#f59e0b" }}>Ojo con esto</h3>
          <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{ficha.ojoCon}</p>
        </div>
      )}

      {/* La autoridad. Es el enlace más útil de toda la sección. */}
      <div className="rounded-xl p-4 mt-4 flex flex-wrap items-center justify-between gap-3" style={CAJA}>
        <p className="text-xs" style={{ color: "#64748b" }}>
          Las cuantías, las tasas y los cupos cambian. Quien manda es la administración del país:
        </p>
        <a href={ficha.autoridad.url} target="_blank" rel="noopener noreferrer"
           className="text-sm font-medium hover:underline" style={{ color: "#22c55e" }}>
          {ficha.autoridad.nombre} →
        </a>
      </div>
    </section>
  );
}
