"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Step {
  id: string;
  icon: string;
  titulo: string;
  desc: string;
  cta: string;
  href: string;
  done: boolean;
}

export default function OnboardingChecklist() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("bcv_onboarding_done") === "1") {
      setDismissed(true);
      setLoading(false);
      return;
    }
    loadSteps();
  }, []);

  async function loadSteps() {
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const token = session.access_token;
      const userId = session.user.id;

      const [cvRes, statusRes, alertasRes] = await Promise.all([
        fetch("/api/gusi/cv", { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/cv-sender/status?userId=${encodeURIComponent(userId)}`),
        fetch("/api/jobs/alertas", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const cvData = cvRes.ok ? await cvRes.json() as { cvData?: { nombre?: string } } : null;
      const statusData = statusRes.ok ? await statusRes.json() as { stats?: { totalEnviados: number } } : null;
      const alertasData = alertasRes.ok ? await alertasRes.json() as { alertas?: unknown[] } : null;

      const cvDone = !!(cvData?.cvData?.nombre?.trim());
      const enviosDone = !!(statusData?.stats && statusData.stats.totalEnviados > 0);
      const alertaDone = !!(alertasData?.alertas && alertasData.alertas.length > 0);
      const busquedaDone = typeof window !== "undefined" && localStorage.getItem("bcv_searched") === "1";

      const stepsList: Step[] = [
        {
          id: "cv",
          icon: "📄",
          titulo: "Completa tu CV",
          desc: "Añade tu experiencia, foto y datos de contacto.",
          cta: "Ir a mi CV →",
          href: "/app/curriculum",
          done: cvDone,
        },
        {
          id: "envios",
          icon: "🤖",
          titulo: "Activa envíos automáticos",
          desc: "Guzzi envía tu CV personalizado a empresas mientras duermes.",
          cta: "Activar envíos →",
          href: "/app/envios",
          done: enviosDone,
        },
        {
          id: "alerta",
          icon: "🔔",
          titulo: "Crea tu alerta de empleo",
          desc: "Recibe notificaciones cuando aparezcan ofertas para ti.",
          cta: "Crear alerta →",
          href: "/app/buscar",
          done: alertaDone,
        },
        {
          id: "buscar",
          icon: "🔍",
          titulo: "Explora ofertas de empleo",
          desc: "Busca y guarda las que más te interesen.",
          cta: "Buscar ofertas →",
          href: "/app/buscar",
          done: busquedaDone,
        },
      ];

      setSteps(stepsList);

      // Si todos los pasos están completos, guardamos en localStorage
      if (stepsList.every((s) => s.done)) {
        localStorage.setItem("bcv_onboarding_done", "1");
      }
    } catch {
      // Si falla, no mostramos el widget
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    localStorage.setItem("bcv_onboarding_done", "1");
    setDismissed(true);
  }

  if (loading || dismissed) return null;
  if (steps.length === 0) return null;

  const completados = steps.filter((s) => s.done).length;
  const pct = Math.round((completados / steps.length) * 100);
  const todoCompleto = completados === steps.length;

  if (todoCompleto) {
    // Mostrar mensaje de enhorabuena y desaparecer
    return (
      <div className="rounded-xl p-5 mb-6 flex items-center justify-between gap-4"
        style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: "#22c55e" }}>¡Todo configurado!</p>
            <p className="text-xs" style={{ color: "#64748b" }}>Guzzi ya está trabajando para ti. Revisa el pipeline cuando quieras.</p>
          </div>
        </div>
        <button onClick={dismiss} className="text-xs px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl mb-6" style={{ background: "#161922", border: "1px solid #2d3142" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🐛</span>
          <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
            Primeros pasos — {completados}/{steps.length} completados
          </p>
        </div>
        <button onClick={dismiss} className="text-xs" style={{ color: "#475569" }}>
          Omitir
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="px-5 pb-4">
        <div className="h-1.5 rounded-full" style={{ background: "#252836" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, #22c55e, #16a34a)" }}
          />
        </div>
      </div>

      {/* Pasos */}
      <div className="px-3 pb-3 space-y-1">
        {steps.map((step) => (
          <div key={step.id}
            className="flex items-center gap-3 px-3 py-3 rounded-lg"
            style={{ background: step.done ? "rgba(34,197,94,0.04)" : "transparent" }}>

            {/* Check / número */}
            <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: step.done ? "rgba(34,197,94,0.15)" : "rgba(45,49,66,0.8)",
                border: step.done ? "1.5px solid rgba(34,197,94,0.4)" : "1.5px solid #2d3142",
              }}>
              {step.done
                ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : <span className="text-xs">{step.icon}</span>
              }
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: step.done ? "#64748b" : "#f1f5f9", textDecoration: step.done ? "line-through" : "none" }}>
                {step.titulo}
              </p>
              {!step.done && (
                <p className="text-[10px] mt-0.5" style={{ color: "#475569" }}>{step.desc}</p>
              )}
            </div>

            {/* CTA */}
            {!step.done && (
              <Link href={step.href}
                className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                {step.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
