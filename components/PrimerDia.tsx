"use client";

/**
 * components/PrimerDia.tsx — Los tres pasos del principio, en el panel.
 *
 * Aparece arriba del todo mientras falte alguno y DESAPARECE SOLA cuando están
 * los tres: no hay botón de "ocultar" ni banderita en la base de datos, porque
 * el estado se calcula de lo que la persona ha hecho de verdad.
 *
 * Solo el paso que toca lleva botón. Con tres botones a la vez, la pantalla
 * vuelve a ser una lista de cosas por hacer, que es justo lo que ya había.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Paso {
  id: string;
  titulo: string;
  porQue: string;
  hecho: boolean;
  ruta: string;
  textoBoton: string;
}

interface Estado {
  pasos: Paso[];
  hechos: number;
  completado: boolean;
  siguiente: Paso | null;
}

export default function PrimerDia() {
  const [estado, setEstado] = useState<Estado | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const session = (await getSupabaseBrowser().auth.getSession()).data.session;
        if (!session) return;
        const res = await fetch("/api/onboarding/estado", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const datos = (await res.json()) as Estado;
        if (vivo) setEstado(datos);
      } catch {
        // Si no se puede calcular, no se enseña nada.
      }
    })();
    return () => { vivo = false; };
  }, []);

  if (!estado || estado.completado || !estado.siguiente) return null;

  const siguiente = estado.siguiente;

  return (
    <div
      className="rounded-xl p-5 mb-5"
      style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-bold" style={{ color: "#22c55e" }}>
          Para empezar a recibir respuestas
        </h2>
        <span className="text-[11px]" style={{ color: "#64748b" }}>
          {estado.hechos} de {estado.pasos.length}
        </span>
      </div>

      <ol className="mt-4 space-y-3">
        {estado.pasos.map((paso, i) => {
          const esSiguiente = paso.id === siguiente.id;
          return (
            <li key={paso.id} className="flex gap-3">
              <span
                className="shrink-0 flex items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  width: 24,
                  height: 24,
                  background: paso.hecho ? "#22c55e" : esSiguiente ? "rgba(34,197,94,0.15)" : "#1e212b",
                  color: paso.hecho ? "#0f1117" : esSiguiente ? "#22c55e" : "#64748b",
                  border: paso.hecho ? "none" : "1px solid #2d3142",
                }}
                aria-hidden="true"
              >
                {paso.hecho ? "✓" : i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: paso.hecho ? "#64748b" : "#f1f5f9",
                    textDecoration: paso.hecho ? "line-through" : "none",
                  }}
                >
                  {paso.titulo}
                </p>

                {esSiguiente && (
                  <>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                      {paso.porQue}
                    </p>
                    <Link
                      href={paso.ruta}
                      className="inline-block mt-2.5 px-4 py-2 rounded-lg text-xs font-semibold"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
                    >
                      {paso.textoBoton}
                    </Link>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
