"use client";

/**
 * Tu puntuación para empresas — la misma que ven las empresas verificadas
 * (lib/empresas/reglas.ts), con lo que le falta a cada apartado. Va en el
 * editor del CV, junto a «Visible para empresas».
 *
 * Solo cuenta lo que se puede comprobar: cartas de recomendación confirmadas,
 * lo que tiene el CV y si está al día. Ninguna IA valora a la persona.
 */
import { useEffect, useState } from "react";

interface Parte { id: string; nombre: string; puntos: number; max: number; consejo: string | null }
interface Puntuacion { total: number; nivelTexto: string; partes: Parte[] }

export default function TuPuntuacion({ token, actualizar }: { token: string; actualizar?: unknown }) {
  const [p, setP] = useState<Puntuacion | null>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    fetch("/api/perfil/puntuacion", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (vivo) setP(j?.puntuacion ?? null); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [token, actualizar]);

  if (!p) return null;
  const pendientes = p.partes.filter((x) => x.consejo).sort((a, b) => (b.max - b.puntos) - (a.max - a.puntos));

  return (
    <div className="rounded-xl p-5" style={{ background: "rgba(12,15,22,0.78)", border: "1px solid rgba(148,163,184,0.18)" }}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Tu puntuación para empresas</p>
        <p className="text-sm tabular-nums" style={{ color: "#22c55e" }}>
          <strong className="text-xl">{p.total}</strong><span className="text-xs" style={{ color: "#8b98ad" }}>/100 · {p.nivelTexto}</span>
        </p>
      </div>
      <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: "#0f1117" }} aria-hidden="true">
        <div className="h-full rounded-full" style={{ width: `${p.total}%`, background: "linear-gradient(90deg, #84cc16, #22c55e)" }} />
      </div>
      <p className="text-[11px] mt-2" style={{ color: "#8b98ad" }}>
        Las empresas verificadas ven antes a quien tiene más. Solo cuenta lo que se puede comprobar: la carta de recomendación confirmada es lo que más suma.
      </p>
      {pendientes.length > 0 && (
        <>
          <button onClick={() => setAbierto(!abierto)} className="text-xs font-semibold mt-3" style={{ color: "#22c55e" }} aria-expanded={abierto}>
            {abierto ? "Ocultar" : `Cómo subirla (${pendientes.length} ${pendientes.length === 1 ? "cosa" : "cosas"})`}
          </button>
          {abierto && (
            <ul className="mt-2 space-y-1.5">
              {pendientes.map((x) => (
                <li key={x.id} className="text-xs flex gap-2" style={{ color: "#cbd5e1" }}>
                  <span className="tabular-nums flex-shrink-0" style={{ color: "#8b98ad" }}>+{x.max - x.puntos}</span>
                  <span>{x.consejo}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
