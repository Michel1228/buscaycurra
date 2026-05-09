"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import JobCard, { type PropiedadesJobCard } from "@/components/JobCard";

interface Guardado {
  job_id: string;
  created_at: string;
}

export default function GuardadosPage() {
  const router = useRouter();
  const [guardados, setGuardados] = useState<Guardado[]>([]);
  const [ofertas, setOfertas] = useState<PropiedadesJobCard[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const session = (await getSupabaseBrowser().auth.getSession()).data.session;
        if (!session) { 
          router.push("/auth/login"); 
          return; 
        }

        // Cargar guardados
        const res = await fetch(`/api/jobs/guardar?userId=${session.user.id}`);
        
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || `Error ${res.status}`);
        }
        
        const data = await res.json() as { guardados: Guardado[] };
        const listaGuardados = data.guardados || [];
        setGuardados(listaGuardados);

        if (listaGuardados.length === 0) {
          setCargando(false);
          return;
        }

        // Cargar detalles de cada oferta
        const ofertasDetalle: PropiedadesJobCard[] = [];
        
        for (const g of listaGuardados) {
          try {
            const jobRes = await fetch(`/api/jobs/detail?id=${encodeURIComponent(g.job_id)}`);
            if (jobRes.ok) {
              const jobData = await jobRes.json() as { oferta?: PropiedadesJobCard };
              if (jobData.oferta) {
                ofertasDetalle.push(jobData.oferta);
              }
            }
          } catch { 
            // Ignorar errores individuales
          }
        }
        
        setOfertas(ofertasDetalle);
      } catch (error) {
        console.error("Error cargando guardados:", error);
        setError((error as Error).message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cargando) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center" style={{ background: "#0f1117" }}>
        <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      <div className="py-8 px-4" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(34,197,94,0.05))" }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>Ofertas guardadas</h1>
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>
            {guardados.length} oferta{guardados.length !== 1 ? "s" : ""} guardada{guardados.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
            ⚠️ {error}
          </div>
        )}
        
        {ofertas.length === 0 ? (
          <div className="card-game p-10 text-center">
            <p className="text-4xl mb-3">🤍</p>
            <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>No tienes ofertas guardadas</p>
            <p className="text-xs mt-1 mb-4" style={{ color: "#64748b" }}>Guarda las ofertas que te interesen desde el buscador</p>
            <button onClick={() => router.push("/app/buscar")} className="btn-game text-xs">Buscar ofertas</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {ofertas.map((oferta) => (
              <JobCard key={oferta.id} {...oferta} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
