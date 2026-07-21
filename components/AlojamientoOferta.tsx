"use client";

/**
 * components/AlojamientoOferta.tsx
 *
 * Cuando alguien mira una oferta en otro país (España → Australia, p.ej.), le
 * muestra AQUÍ MISMO dónde puede quedarse: plataformas de alquiler reales,
 * consejo y precio medio de ese país. El dato ya existe en lib/primeros-pasos
 * (lo usa /app/emigrar), pero estaba aislado — el usuario tenía que buscarlo.
 *
 * No se muestra para ofertas de España (país de origen de los usuarios): ahí no
 * hay que "emigrar para quedarse".
 */
import Link from "next/link";
import { Home, ExternalLink } from "lucide-react";
import { getPrimerosPasos } from "@/lib/primeros-pasos";
import { PAISES } from "@/lib/paises";

export default function AlojamientoOferta({ country }: { country?: string }) {
  if (!country) return null;
  const codigo = country.trim().toUpperCase();
  if (codigo === "ES") return null; // España es el origen, no destino

  const info = getPrimerosPasos(codigo);
  if (!info?.alojamiento?.plataformas?.length) return null;

  const pais = PAISES[codigo];
  const nombrePais = pais?.nombre || codigo;
  const bandera = pais?.bandera || "🏠";
  const plataformas = info.alojamiento.plataformas.slice(0, 4);
  const precio = info.alojamiento.preciosMedios?.[0];

  return (
    <div className="mt-4 pt-4" style={{ borderTop: "1px solid #2d3142" }}>
      <h2 className="text-sm font-semibold mb-1 flex items-center gap-1.5" style={{ color: "#f1f5f9" }}>
        <Home size={14} style={{ color: "#22c55e" }} /> ¿Dónde quedarte en {nombrePais} {bandera}?
      </h2>
      <p className="text-xs mb-3" style={{ color: "#64748b" }}>
        Si consigues este empleo, aquí tienes dónde buscar alojamiento nada más llegar.
        {precio ? ` Precio medio: ${precio.rango} ${precio.moneda}.` : ""}
      </p>

      <div className="grid sm:grid-cols-2 gap-2">
        {plataformas.map((p) => (
          <a
            key={p.url}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-3 transition group"
            style={{ background: "#0f1117", border: "1px solid #2d3142" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: "#e2e8f0" }}>{p.nombre}</span>
              <ExternalLink size={12} style={{ color: "#64748b" }} />
            </div>
            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "#64748b" }}>{p.descripcion}</p>
          </a>
        ))}
      </div>

      {info.alojamiento.consejo && (
        <p className="text-[11px] mt-3 rounded-lg p-2.5" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", color: "#94a3b8" }}>
          💡 {info.alojamiento.consejo}
        </p>
      )}

      <Link
        href={`/app/emigrar?pais=${codigo}`}
        className="inline-flex items-center gap-1 text-[11px] mt-3 font-medium hover:underline"
        style={{ color: "#22c55e" }}
      >
        Ver guía completa de {nombrePais} (visado, au pair, programas) →
      </Link>
    </div>
  );
}
