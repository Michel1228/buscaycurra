"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import JobCard, { type PropiedadesJobCard } from "@/components/JobCard";
import { AlertTriangle, Heart, Lightbulb } from "lucide-react";

interface Guardado {
  job_id: string;
  created_at: string;
}

export default function GuardadosPage() {
  const router = useRouter();
  const [guardados, setGuardados] = useState<Guardado[]>([]);
  const [ofertas, setOfertas] = useState<PropiedadesJobCard[]>([]);
  const [recomendaciones, setRecomendaciones] = useState<PropiedadesJobCard[]>([]);
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
          // Cargar recomendaciones basadas en el perfil del usuario
          try {
            const { data: profile } = await getSupabaseBrowser()
              .from("profiles")
              .select("ciudad, sector")
              .eq("id", session.user.id)
              .single();

            const ciudad = profile?.ciudad || "";
            const sector = profile?.sector || "";

            if (ciudad || sector) {
              const searchParams = new URLSearchParams();
              if (sector) searchParams.set("keyword", sector);
              if (ciudad) searchParams.set("location", ciudad);
              const searchRes = await fetch(`/api/jobs/search?${searchParams.toString()}`);
              if (searchRes.ok) {
                const searchData = await searchRes.json() as {
                  ofertas?: PropiedadesJobCard[];
                };
                setRecomendaciones((searchData.ofertas || []).slice(0, 20));
              }
            }
          } catch {
            // Si falla la carga de recomendaciones, simplemente mostramos vacío
          }
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
            <AlertTriangle size={14} strokeWidth={2} className="inline mr-1" />{error}
          </div>
        )}
        
        {ofertas.length === 0 && recomendaciones.length === 0 ? (
          <div className="card-game p-10 text-center">
            <Heart size={40} strokeWidth={1.2} className="mx-auto mb-3" style={{ color: "#475569" }} />
            <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>No tienes ofertas guardadas</p>
            <p className="text-xs mt-1 mb-4" style={{ color: "#64748b" }}>Guarda las ofertas que te interesen desde el buscador</p>
            <button onClick={() => router.push("/app/buscar")} className="btn-game text-xs">Buscar ofertas</button>
          </div>
        ) : ofertas.length === 0 && recomendaciones.length > 0 ? (
          <div className="space-y-6">
            {/* Mensaje sutil de que no hay guardados */}
            <div className="card-game p-6 text-center">
              <Heart size={28} strokeWidth={1.3} className="mx-auto mb-2" style={{ color: "#475569" }} />
              <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>No tienes ofertas guardadas aún</p>
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>Guarda las que te interesen desde el buscador</p>
              <button onClick={() => router.push("/app/buscar")} className="btn-game text-xs mt-3">Buscar ofertas</button>
            </div>

            {/* Recomendaciones basadas en tu perfil */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={18} strokeWidth={1.5} style={{ color: "#f59e0b" }} />
                <h2 className="text-sm font-bold" style={{ color: "#f1f5f9" }}>Recomendaciones para ti</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {recomendaciones.map((oferta) => (
                  <JobCard key={oferta.id} {...oferta} />
                ))}
              </div>
            </div>
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
