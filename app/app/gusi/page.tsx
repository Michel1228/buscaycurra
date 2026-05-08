"use client";

import Link from "next/link";
import GusiChat from "@/components/GusiChat";

const ACCESOS = [
  { href: "/app/curriculum", icon: "📄", label: "Mi CV" },
  { href: "/app/buscar",     icon: "🔍", label: "Buscar trabajo" },
  { href: "/app/envios",     icon: "📬", label: "Mis envíos" },
  { href: "/app/pipeline",   icon: "📊", label: "Pipeline" },
  { href: "/app/guardados",  icon: "❤️", label: "Guardadas" },
];

export default function GusiPage() {
  return (
    <div className="flex flex-col pt-14" style={{ background: "#0f1117", height: "100dvh" }}>

      {/* Acceso rápido — estilo ChatGPT: pills discretas sobre el chat */}
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar"
        style={{ borderBottom: "1px solid #1a1d27" }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider shrink-0 mr-1" style={{ color: "#374151" }}>
          Ir a:
        </span>
        {ACCESOS.map(item => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition hover:opacity-80 shrink-0"
            style={{ background: "#161922", border: "1px solid #252836", color: "#94a3b8" }}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Chat — ocupa todo el espacio restante */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <GusiChat modoIncrustado />
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
