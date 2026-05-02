"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BienvenidaPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-16" style={{ background: "#0f1117" }}>
      <div className="w-full max-w-lg text-center mb-10">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5"
          style={{
            background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.06))",
            border: "2px solid rgba(34,197,94,0.25)",
          }}
        >
          🐛
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
          ¡Hola! Soy Guzzi
        </h1>
        <p className="text-sm" style={{ color: "#94a3b8" }}>
          Tu asistente de empleo con IA. Puedo buscar ofertas, mejorar tu CV y enviar candidaturas por ti —
          o puedes gestionarlo todo tú mismo si lo prefieres.
        </p>
      </div>

      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Opción Guzzi */}
        <button
          onClick={() => router.push("/app/gusi")}
          className="group flex flex-col items-start gap-3 p-6 rounded-2xl text-left transition-all hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(22,163,74,0.06))",
            border: "2px solid rgba(34,197,94,0.3)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐛</span>
            <div>
              <p className="font-bold text-sm" style={{ color: "#22c55e" }}>Usar a Guzzi</p>
              <p className="text-[11px] font-medium" style={{ color: "#16a34a" }}>Recomendado</p>
            </div>
          </div>
          <ul className="space-y-1.5 text-[11px]" style={{ color: "#94a3b8" }}>
            <li>✅ Busca ofertas adaptadas a ti</li>
            <li>✅ Mejora tu CV con IA</li>
            <li>✅ Envía candidaturas automáticamente</li>
            <li>✅ Tú apruebas cada envío</li>
          </ul>
          <span
            className="w-full text-center py-2 rounded-xl text-xs font-semibold mt-1"
            style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
          >
            Hablar con Guzzi →
          </span>
        </button>

        {/* Opción Manual */}
        <Link
          href="/app/buscar"
          className="group flex flex-col items-start gap-3 p-6 rounded-2xl text-left transition-all hover:scale-[1.02]"
          style={{
            background: "#1e212b",
            border: "1.5px solid #2d3142",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔍</span>
            <div>
              <p className="font-bold text-sm" style={{ color: "#f1f5f9" }}>Modo manual</p>
              <p className="text-[11px]" style={{ color: "#64748b" }}>Control total</p>
            </div>
          </div>
          <ul className="space-y-1.5 text-[11px]" style={{ color: "#94a3b8" }}>
            <li>🔍 Busca ofertas tú mismo</li>
            <li>📊 Gestiona tu pipeline</li>
            <li>📧 Controla los envíos</li>
            <li>💰 Compara salarios</li>
          </ul>
          <span
            className="w-full text-center py-2 rounded-xl text-xs font-semibold mt-1"
            style={{ background: "#252836", color: "#94a3b8", border: "1px solid #2d3142" }}
          >
            Ir al buscador →
          </span>
        </Link>
      </div>

      <p className="text-[11px] mt-8" style={{ color: "#475569" }}>
        Puedes cambiar entre modos en cualquier momento desde el menú
      </p>
    </div>
  );
}
