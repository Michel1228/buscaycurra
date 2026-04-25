"use client";

import GusiChat from "@/components/GusiChat";

export default function GusiPage() {
  return (
    <div className="flex flex-col pt-14" style={{ background: "#1a1a12", minHeight: "100vh" }}>

      {/* Hero Guzzi */}
      <div className="text-center px-4 pt-6 pb-3 shrink-0">
        {/* Icono animado */}
        <div className="relative inline-flex items-center justify-center mb-4">
          {/* Halo exterior */}
          <div className="absolute w-24 h-24 rounded-full" style={{
            background: "radial-gradient(circle, rgba(126,213,111,0.15) 0%, transparent 70%)",
            animation: "guzzi-halo 3s ease-in-out infinite",
          }} />
          {/* Círculo principal */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl relative z-10" style={{
            background: "linear-gradient(135deg, rgba(126,213,111,0.2), rgba(92,184,72,0.08))",
            border: "2px solid rgba(126,213,111,0.4)",
            boxShadow: "0 0 30px rgba(126,213,111,0.15)",
            animation: "guzzi-float 4s ease-in-out infinite",
          }}>
            🐛
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-1" style={{ color: "#7ed56f", letterSpacing: "-0.5px" }}>Guzzi</h1>
        <p className="text-sm font-medium mb-1" style={{ color: "#b0a890" }}>Tu agente de empleo con IA</p>
        <p className="text-xs" style={{ color: "#504a3a" }}>Yo busco. Yo envío. Tú decides.</p>

        {/* Los 3 pasos */}
        <div className="flex items-center justify-center gap-1.5 mt-4 mb-1">
          {[
            { n: "1", label: "Tu CV", color: "rgba(126,213,111,0.8)" },
            { n: "→", label: "", color: "" },
            { n: "2", label: "Busco ofertas", color: "rgba(126,213,111,0.6)" },
            { n: "→", label: "", color: "" },
            { n: "3", label: "Envío auto", color: "rgba(126,213,111,0.4)" },
          ].map((s, i) => s.n === "→" ? (
            <span key={i} className="text-xs" style={{ color: "#3d3c30" }}>→</span>
          ) : (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(126,213,111,0.12)", color: s.color, border: `1.5px solid ${s.color}` }}>
                {s.n}
              </div>
              <span className="text-[9px] font-medium" style={{ color: "#706a58" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat — ocupa todo el espacio restante */}
      <div className="flex-1 flex flex-col px-4 pb-6 max-w-2xl w-full mx-auto min-h-0">
        <GusiChat modoIncrustado />
      </div>

      <style jsx global>{`
        @keyframes guzzi-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes guzzi-halo {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
