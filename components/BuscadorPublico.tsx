"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Oferta {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario?: string;
  fuente?: string;
  fecha?: string;
}

export default function BuscadorPublico() {
  const [puesto, setPuesto] = useState("");
  const [ciudad, setCiudad] = useState("Madrid");
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [cargando, setCargando] = useState(true);

  async function buscar(p: string, c: string) {
    setCargando(true);
    try {
      const params = new URLSearchParams({ keyword: p || "operario", location: c || "Madrid", limit: "6" });
      const res = await fetch(`/api/jobs/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOfertas((data.jobs || data.ofertas || []).slice(0, 6));
      }
    } catch {
      // silencioso
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { buscar("", "Madrid"); }, []);

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    buscar(puesto, ciudad);
  }

  return (
    <div>
      {/* Buscador */}
      <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          placeholder="¿Qué trabajo buscas?"
          value={puesto}
          onChange={e => setPuesto(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: "#1a1d24", border: "1px solid #2d3142", color: "#f1f5f9" }}
        />
        <input
          type="text"
          placeholder="Ciudad"
          value={ciudad}
          onChange={e => setCiudad(e.target.value)}
          className="w-full sm:w-40 px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: "#1a1d24", border: "1px solid #2d3142", color: "#f1f5f9" }}
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-xl text-sm font-semibold transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
        >
          Buscar
        </button>
      </form>

      {/* Resultados */}
      {cargando ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "#1a1d24" }} />
          ))}
        </div>
      ) : ofertas.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ofertas.map(o => (
            <Link
              key={o.id}
              href="/auth/registro"
              className="group block p-4 rounded-xl transition hover:border-green-500/30"
              style={{ background: "#1a1d24", border: "1px solid #2d3142" }}
            >
              <p className="text-xs font-semibold mb-1 line-clamp-2 group-hover:text-green-400 transition" style={{ color: "#f1f5f9" }}>
                {o.titulo}
              </p>
              <p className="text-[11px] mb-2" style={{ color: "#64748b" }}>{o.empresa}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>
                  {o.ubicacion}
                </span>
                {o.salario && (
                  <span className="text-[10px]" style={{ color: "#64748b" }}>{o.salario}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm py-8" style={{ color: "#64748b" }}>
          No se encontraron ofertas. Prueba con otro término.
        </p>
      )}

      <div className="text-center mt-5">
        <Link
          href="/auth/registro"
          className="inline-block text-xs font-semibold px-5 py-2.5 rounded-xl transition hover:opacity-90"
          style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          Ver todas las ofertas — Registrarse gratis →
        </Link>
      </div>
    </div>
  );
}
