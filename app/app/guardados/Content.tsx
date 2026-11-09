"use client";

import { useState, useEffect } from "react";
import { Bookmark, Lightbulb } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import JobCard, { type PropiedadesJobCard } from "@/components/JobCard";
import { puestosDelCv } from "@/lib/job-search/puestos-del-cv";

interface Guardado {
  job_id: string;
  created_at: string;
}

export default function GuardadosPage() {
  const router = useRouter();
  const [guardados, setGuardados] = useState<Guardado[]>([]);
  // Cada oferta con el id con el que se guardó (para poder quitarla).
  const [ofertas, setOfertas] = useState<Array<{ jobId: string; oferta: PropiedadesJobCard }>>([]);
  // Guardadas que ya no existen (la oferta caducó y se borró). Antes contaban
  // para el tope del plan sin verse ni poder quitarse (auditoría del 3 oct 2026).
  const [perdidas, setPerdidas] = useState<string[]>([]);
  const [quitando, setQuitando] = useState<string | null>(null);
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
            // Lo primero que dice su CV, como la portada (17 oct 2026); el
            // sector del perfil, que casi nadie rellena, solo si no hay CV.
            let puesto = "";
            try {
              const resCv = await fetch(`/api/gusi/cv?userId=${session.user.id}`);
              if (resCv.ok) puesto = puestosDelCv(((await resCv.json()) as { cv?: unknown }).cv)[0] || "";
            } catch { /* sin CV */ }
            const sector = puesto || profile?.sector || "";

            if (sector) {
              const searchParams = new URLSearchParams();
              searchParams.set("keyword", sector);
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
        const ofertasDetalle: Array<{ jobId: string; oferta: PropiedadesJobCard }> = [];
        const noEstan: string[] = [];
        
        for (const g of listaGuardados) {
          try {
            const jobRes = await fetch(`/api/jobs/detail?id=${encodeURIComponent(g.job_id)}`);
            if (jobRes.ok) {
              const jobData = await jobRes.json() as { oferta?: PropiedadesJobCard; notFound?: boolean };
              if (jobData.oferta) {
                ofertasDetalle.push({ jobId: String(g.job_id), oferta: jobData.oferta });
              } else if (jobData.notFound) {
                noEstan.push(String(g.job_id));
              }
            }
          } catch { 
            // Ignorar errores individuales
          }
        }
        
        setOfertas(ofertasDetalle);
        setPerdidas(noEstan);
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

  // No había forma de quitar una oferta guardada (y el aviso del tope del plan
  // decía "borra alguna").
  async function quitar(ids: string[]) {
    setQuitando(ids[0]);
    setError("");
    try {
      const session = (await getSupabaseBrowser().auth.getSession()).data.session;
      for (const jobId of ids) {
        const r = await fetch("/api/jobs/guardar", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
          body: JSON.stringify({ jobId, action: "unsave" }),
        });
        if (!r.ok) throw new Error();
      }
      setOfertas((o) => o.filter((x) => !ids.includes(x.jobId)));
      setPerdidas((p) => p.filter((x) => !ids.includes(x)));
      setGuardados((g) => g.filter((x) => !ids.includes(String(x.job_id))));
    } catch {
      setError("No se ha podido quitar. Inténtalo otra vez en un momento.");
    } finally {
      setQuitando(null);
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center" style={{ background: "#0f1117" }}>
        <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      <div className="">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "#f8fafc" }}>Ofertas guardadas</h1>
          <p className="text-xs mt-1" style={{ color: "#8b98ad" }}>
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
        
        {perdidas.length > 0 && (
          <div className="card-game p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-xs flex-1" style={{ color: "#94a3b8" }}>
              {perdidas.length === 1
                ? "1 oferta que guardaste ya no está publicada: la empresa la retiró o caducó."
                : `${perdidas.length} ofertas que guardaste ya no están publicadas: las empresas las retiraron o caducaron.`}
            </p>
            <button onClick={() => quitar(perdidas)} disabled={quitando !== null}
              className="text-xs font-medium px-3 py-2 rounded-lg disabled:opacity-50"
              style={{ color: "#f1f5f9", border: "1px solid rgba(148,163,184,0.18)" }}>
              {perdidas.length === 1 ? "Quitarla" : "Quitarlas"}
            </button>
          </div>
        )}

        {ofertas.length === 0 && recomendaciones.length === 0 && perdidas.length > 0 ? null
        : ofertas.length === 0 && recomendaciones.length === 0 ? (
          <div className="card-game p-10 text-center">
            <div className="flex justify-center mb-3"><span className="icono-circulo tono-verde" style={{ width: 56, height: 56 }} aria-hidden="true"><Bookmark size={24} /></span></div>
            <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>No tienes ofertas guardadas</p>
            <p className="text-xs mt-1 mb-4" style={{ color: "#8b98ad" }}>Guarda las ofertas que te interesen desde el buscador</p>
            <button onClick={() => router.push("/app/buscar")} className="btn-game text-xs">Buscar ofertas</button>
          </div>
        ) : ofertas.length === 0 && recomendaciones.length > 0 ? (
          <div className="space-y-6">
            {/* Mensaje sutil de que no hay guardados */}
            <div className="card-game p-6 text-center">
              <div className="flex justify-center mb-2"><span className="icono-circulo tono-verde" style={{ width: 44, height: 44 }} aria-hidden="true"><Bookmark size={20} /></span></div>
              <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>No tienes ofertas guardadas aún</p>
              <p className="text-xs mt-1" style={{ color: "#8b98ad" }}>Guarda las que te interesen desde el buscador</p>
              <button onClick={() => router.push("/app/buscar")} className="btn-game text-xs mt-3">Buscar ofertas</button>
            </div>

            {/* Recomendaciones basadas en tu perfil */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="icono-circulo tono-ambar" style={{ width: 32, height: 32 }} aria-hidden="true"><Lightbulb size={15} /></span>
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
            {ofertas.map(({ jobId, oferta }) => (
              <div key={jobId} className="flex flex-col gap-1.5">
                <JobCard {...oferta} />
                <button onClick={() => quitar([jobId])} disabled={quitando !== null}
                  className="self-end text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
                  style={{ color: "#94a3b8", border: "1px solid rgba(148,163,184,0.18)" }}
                  aria-label={`Quitar de guardadas: ${oferta.titulo}`}>
                  {quitando === jobId ? "Quitando..." : "Quitar de guardadas"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
