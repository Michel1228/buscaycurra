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

const COMPARATIVA = [
  { aspecto: "Coste", buscaycurra: "2,99 €/mes", infojobs: "Gratis... con publicidad" },
  { aspecto: "Tu CV vs otros", buscaycurra: "Personalizado con IA", infojobs: "Uno entre 2.000" },
  { aspecto: "Contacto empresa", buscaycurra: "Directo", infojobs: "Cola de espera" },
  { aspecto: "Asistente IA", buscaycurra: "Guzzi 24/7", infojobs: "Ninguno" },
  { aspecto: "Envío masivo", buscaycurra: "Automatizado", infojobs: "Manual" },
];

export default function GusiPage() {
  return (
    <div className="flex pt-14" style={{ background: "#0f1117", height: "100dvh" }}>

      {/* SIDEBAR IZQUIERDO — marketing/SEO, solo desktop */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 overflow-y-auto"
        style={{ borderRight: "1px solid #1a1d27", padding: "16px 12px", gap: "16px" }}>

        {/* Stats */}
        <div className="rounded-xl p-3" style={{ background: "#161922", border: "1px solid #1e2130" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "#374151" }}>
            BuscayCurra en cifras
          </p>
          <div className="space-y-2">
            {[
              { icon: "👥", stat: "2.400+", desc: "personas encontraron trabajo" },
              { icon: "📬", stat: "18.000+", desc: "CVs enviados este mes" },
              { icon: "⚡", stat: "3 min", desc: "para enviar tu primer CV" },
              { icon: "🎯", stat: "x4", desc: "más respuestas que en portales" },
            ].map(item => (
              <div key={item.stat} className="flex items-center gap-2.5">
                <span className="text-base w-5 text-center">{item.icon}</span>
                <div>
                  <span className="text-sm font-bold" style={{ color: "#22c55e" }}>{item.stat}</span>
                  <span className="text-[11px] ml-1" style={{ color: "#64748b" }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <div className="rounded-xl p-3 text-center" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(245,158,11,0.05))", border: "1px solid rgba(34,197,94,0.12)" }}>
          <p className="text-xs font-bold" style={{ color: "#f1f5f9" }}>InfoJobs es 2005</p>
          <p className="text-xs font-bold" style={{ color: "#22c55e" }}>BuscayCurra es 2025</p>
          <p className="text-[10px] mt-1.5" style={{ color: "#64748b" }}>
            IA que trabaja por ti, no un portal que te deja solo
          </p>
        </div>

        {/* Comparativa */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e2130" }}>
          <div className="px-3 py-2" style={{ background: "#161922" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#374151" }}>
              Comparativa
            </p>
          </div>
          <table className="w-full text-[10px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#111520" }}>
                <th className="text-left px-2 py-1.5" style={{ color: "#475569", fontWeight: 500 }}></th>
                <th className="text-center px-2 py-1.5" style={{ color: "#22c55e", fontWeight: 700 }}>Nosotros</th>
                <th className="text-center px-2 py-1.5" style={{ color: "#475569", fontWeight: 500 }}>InfoJobs</th>
              </tr>
            </thead>
            <tbody>
              {COMPARATIVA.map((row, i) => (
                <tr key={row.aspecto} style={{ borderTop: "1px solid #1a1d27", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td className="px-2 py-1.5" style={{ color: "#64748b" }}>{row.aspecto}</td>
                  <td className="px-2 py-1.5 text-center font-semibold" style={{ color: "#22c55e" }}>{row.buscaycurra}</td>
                  <td className="px-2 py-1.5 text-center" style={{ color: "#475569" }}>{row.infojobs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Diferenciadores clave */}
        <div className="rounded-xl p-3" style={{ background: "#161922", border: "1px solid #1e2130" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "#374151" }}>
            Por qué BuscayCurra
          </p>
          <div className="space-y-2">
            {[
              "CV propio, no uno entre 2.000",
              "Guzzi prepara tus entrevistas",
              "Envío masivo en segundos",
              "Contrato directo con la empresa",
              "Sin colas, sin esperas",
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-[10px] mt-0.5" style={{ color: "#22c55e" }}>✓</span>
                <p className="text-[11px]" style={{ color: "#94a3b8" }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA mejorar plan */}
        <Link href="/precios"
          className="block rounded-xl p-3 text-center transition hover:opacity-80"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
          <p className="text-xs font-bold">Desbloquea todo</p>
          <p className="text-[10px] mt-0.5 opacity-80">desde 2,99 €/mes</p>
        </Link>

      </aside>

      {/* DERECHA: pills + chat */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Acceso rápido */}
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

        {/* Chat */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <GusiChat modoIncrustado />
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
