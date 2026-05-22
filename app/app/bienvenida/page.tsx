"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import OnboardingChecklist from "@/components/OnboardingChecklist";

export default function BienvenidaPage() {
  const router = useRouter();
  const [cvReady, setCvReady] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkCV() {
      try {
        const session = (await getSupabaseBrowser().auth.getSession()).data.session;
        if (!session) { router.push("/auth/login"); return; }
        const res = await fetch(`/api/gusi/cv?userId=${session.user.id}`);
        const data = await res.json() as { cv?: Record<string, unknown> };
        setCvReady(!!(data.cv && Object.keys(data.cv).length > 0));
      } catch { /* asumir que no */ }
      finally { setChecking(false); }
    }
    checkCV();
  }, [router]);

  return (
    <div className="min-h-screen px-4 pt-20 pb-12" style={{ background: "#0f1117" }}>
      <div className="max-w-2xl mx-auto">

        <OnboardingChecklist />

        {/* Cabecera */}
        <div className="text-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.06))",
              border: "2px solid rgba(34,197,94,0.25)",
            }}
          >
            🐛
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
            ¡Bienvenido a BuscayCurra!
          </h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Elige cómo quieres buscar trabajo. Puedes cambiar de modo en cualquier momento.
          </p>
        </div>

        {/* Aviso si no hay CV */}
        {!checking && !cvReady && (
          <div className="mb-8 p-4 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "2px solid rgba(245,158,11,0.25)" }}>
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>
                  No tienes tu CV creado todavía
                </p>
                <p className="text-[11px] mt-1" style={{ color: "#94a3b8" }}>
                  Para enviar candidaturas necesitas un CV. Guzzi puede ayudarte a crear uno profesional en 2 minutos.
                </p>
                <Link href="/app/curriculum"
                  className="inline-block mt-2 text-[11px] font-semibold px-4 py-2 rounded-lg transition"
                  style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
                  Crear mi CV ahora →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Comparativa rápida vs portales */}
        <div className="mb-8 p-4 rounded-xl text-center" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)" }}>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            <span style={{ color: "#22c55e" }}>💡 Dato:</span>{" "}
            En InfoJobs tu CV compite con{" "}<span style={{ color: "#f59e0b" }}>hasta 2.000 candidatos</span> por oferta.
            Con Guzzi llega personalizado y en el momento exacto.{" "}
            <span style={{ color: "#22c55e" }}>La diferencia se nota.</span>
          </p>
        </div>

        {/* Tarjetas de elección */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">

          {/* Opción Guzzi */}
          <button
            onClick={() => router.push("/app/gusi")}
            className="group flex flex-col items-start gap-4 p-6 rounded-2xl text-left transition-all hover:scale-[1.02] hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(22,163,74,0.04))",
              border: "2px solid rgba(34,197,94,0.30)",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🐛</span>
              <div>
                <p className="font-bold text-sm" style={{ color: "#22c55e" }}>Con Guzzi</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                  Recomendado
                </span>
              </div>
            </div>
            <ul className="space-y-1.5 text-[11px] w-full" style={{ color: "#94a3b8" }}>
              <li>✅ Mejora tu CV con IA</li>
              <li>✅ Busca ofertas adaptadas a tu perfil</li>
              <li>✅ Envía candidaturas automáticamente</li>
              <li>✅ Carta personalizada por empresa</li>
              <li>✅ Prepara entrevistas con IA</li>
            </ul>
            <p className="text-[10px] italic" style={{ color: "#64748b" }}>
              La IA hace el trabajo. Tú solo apruebas.
            </p>
            <span
              className="w-full text-center py-2.5 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: "rgba(34,197,94,0.18)", color: "#22c55e" }}
            >
              Hablar con Guzzi →
            </span>
          </button>

          {/* Opción Manual */}
          <Link
            href="/app/buscar"
            className="group flex flex-col items-start gap-4 p-6 rounded-2xl text-left transition-all hover:scale-[1.02] hover:shadow-lg"
            style={{
              background: "#1a1d24",
              border: "1.5px solid #2d3142",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔍</span>
              <div>
                <p className="font-bold text-sm" style={{ color: "#f1f5f9" }}>Modo manual</p>
                <p className="text-[10px]" style={{ color: "#64748b" }}>Control total</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-[11px] w-full" style={{ color: "#94a3b8" }}>
              <li>🔍 Busca y filtra ofertas tú mismo</li>
              <li>📊 Gestiona tu pipeline de candidaturas</li>
              <li>📧 Controla cada envío manualmente</li>
              <li>💰 Compara salarios por sector</li>
              <li>⭐ Lee reviews de empresas</li>
            </ul>
            <p className="text-[10px] italic" style={{ color: "#64748b" }}>
              Tú decides cada paso. Sin automatismos.
            </p>
            <span
              className="w-full text-center py-2.5 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: "#252836", color: "#94a3b8", border: "1px solid #2d3142" }}
            >
              Ir al buscador →
            </span>
          </Link>
        </div>

        {/* Accesos rápidos al resto de herramientas */}
        <div className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #252836" }}>
          <p className="text-[11px] font-semibold mb-3" style={{ color: "#64748b" }}>ACCESOS RÁPIDOS</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: "📄", label: "Mi CV", href: "/app/curriculum" },
              { icon: "📊", label: "Pipeline", href: "/app/pipeline" },
              { icon: "💰", label: "Salarios", href: "/app/salarios" },
              { icon: "👤", label: "Mi perfil", href: "/app/perfil" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition hover:bg-[#1e212b]"
                style={{ border: "1px solid #2d3142" }}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-[10px] font-medium" style={{ color: "#94a3b8" }}>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] mt-6" style={{ color: "#334155" }}>
          Puedes cambiar entre modos en cualquier momento desde el menú
        </p>
      </div>
    </div>
  );
}
