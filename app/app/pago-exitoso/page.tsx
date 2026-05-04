"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

function PagoExitosoContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [planActivo, setPlanActivo] = useState<string>("Pro");

  useEffect(() => {
    const obtenerPlan = async () => {
      try {
        const { data: { session } } = await getSupabaseBrowser().auth.getSession();
        if (!session) return;
        const { data: perfil } = await getSupabaseBrowser()
          .from("profiles").select("plan").eq("id", session.user.id).single();
        if (perfil?.plan === "empresa") setPlanActivo("Empresa");
        else if (perfil?.plan === "basico") setPlanActivo("Básico");
        else setPlanActivo("Pro");
      } catch { /* default Pro */ }
    };
    void obtenerPlan();
  }, [searchParams]);

  const caracteristicas =
    planActivo === "Empresa"
      ? ["Envíos ilimitados de CV", "IA avanzada activada", "Acceso a API", "Soporte dedicado 24/7"]
      : planActivo === "Básico"
      ? ["5 CVs enviados por día", "Buscador básico", "Mejora CV con IA"]
      : ["10 CVs enviados por día", "IA avanzada activada", "Estadísticas detalladas", "Soporte prioritario"];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16" style={{ background: "#0f1117" }}>
      <div className="w-full max-w-md rounded-2xl p-8 text-center" style={{ background: "#161922", border: "1px solid #2d3142" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
          style={{ background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.2)" }}>
          🎉
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>¡Pago completado!</h1>
        <p className="text-sm mb-1" style={{ color: "#94a3b8" }}>
          Ya tienes el plan <strong style={{ color: "#22c55e" }}>{planActivo}</strong> activado.
        </p>
        <p className="text-xs mb-6" style={{ color: "#64748b" }}>
          Tu plan estará activo en unos segundos.
        </p>

        <div className="rounded-xl p-4 mb-6 text-left space-y-2"
          style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
          {caracteristicas.map((item) => (
            <p key={item} className="text-sm flex items-center gap-2" style={{ color: "#94a3b8" }}>
              <span style={{ color: "#22c55e" }}>✓</span> {item}
            </p>
          ))}
        </div>

        <button onClick={() => router.push("/app/gusi")}
          className="btn-game w-full py-3 text-sm font-semibold mb-3">
          Ir a Guzzi →
        </button>
        <button onClick={() => router.push("/app/perfil")}
          className="text-xs hover:underline" style={{ color: "#64748b" }}>
          Ver mi plan en el perfil
        </button>
      </div>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1117" }}>
        <div className="animate-spin rounded-full h-10 w-10" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
      </div>
    }>
      <PagoExitosoContenido />
    </Suspense>
  );
}
