"use client";

import { useState, useEffect } from "react";
import { DATOS } from "@/lib/datos-reales";
import Link from "next/link";
import GusiChat from "@/components/GusiChat";
import { isNativeIOS } from "@/lib/utils/platform";
import UsageCounter from "@/components/UsageCounter";
import { Users, Mail, Rocket, Trophy } from "lucide-react";

export default function GusiPage() {
  const [iosNativo, setIosNativo] = useState(false);
  useEffect(() => { setIosNativo(isNativeIOS()); }, []);

  return (
    <div className="flex pt-14" style={{ minHeight: "100dvh" }}>

      {/* SIDEBAR IZQUIERDO — marketing/SEO, solo desktop */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 overflow-y-auto"
        style={{ borderRight: "1px solid #1a1d27", padding: "16px 12px", gap: "16px" }}>

        {/* Stats */}
        <div className="cristal tono-neutro p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "#8b98ad" }}>
            BuscayCurra en cifras
          </p>
          <div className="space-y-2">
            {[
              // "2.400+ personas" y "18.000+ CVs este mes" eran inventados:
              // habia 51 usuarios y 112 CVs en total. Estos estan contados.
              { Icon: Users, stat: DATOS.ofertasActivasTexto, desc: "ofertas donde buscar", color: "#22c55e" },
              { Icon: Mail,  stat: DATOS.conEmailTexto, desc: "traen email de la empresa", color: "#3b82f6" },
              { Icon: Rocket, stat: "3 min", desc: "para enviar tu primer CV", color: "#f59e0b" },
              { Icon: Trophy, stat: "x4", desc: "más respuestas que en portales", color: "#a855f7" },
            ].map(item => (
              <div key={item.stat} className="flex items-center gap-2.5">
                <span className="icono-circulo shrink-0" style={{ width: 30, height: 30, color: item.color, background: `radial-gradient(circle at 30% 25%, ${item.color}55, ${item.color}12 72%)`, borderColor: `${item.color}66`, boxShadow: "none" }} aria-hidden="true"><item.Icon size={14} /></span>
                <div>
                  <span className="text-sm font-bold" style={{ color: "#bef264" }}>{item.stat}</span>
                  <span className="text-[11px] ml-1" style={{ color: "#8b98ad" }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <div className="cristal tono-lima p-3 text-center">
          <p className="text-xs font-bold" style={{ color: "#f1f5f9" }}>Los portales son de 2005</p>
          <p className="text-xs font-bold texto-neon">BuscayCurra es 2026</p>
          <p className="text-[10px] mt-1.5" style={{ color: "#8b98ad" }}>
            IA que trabaja por ti, no un portal que te deja solo
          </p>
        </div>


        {/* Diferenciadores clave */}
        <div className="cristal tono-neutro p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "#8b98ad" }}>
            Por qué BuscayCurra
          </p>
          <div className="space-y-2">
            {[
              "Tu CV, directo a la empresa",
              "Guzzi prepara tus entrevistas",
              "Envío masivo en segundos",
              "Contacto directo con la empresa",
              "Sin colas, sin esperas",
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-[10px] mt-0.5" style={{ color: "#a3e635" }}>✓</span>
                <p className="text-[11px]" style={{ color: "#94a3b8" }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA mejorar plan — en iOS lleva al perfil (compra In-App); en web a /precios */}
        <Link href={iosNativo ? "/app/perfil?tab=plan" : "/precios"}
          className="block rounded-2xl p-3 text-center transition hover:brightness-105"
          style={{ background: "linear-gradient(180deg, #d9f99d 0%, #a3e635 55%, #84cc16 100%)", color: "#0b1406", boxShadow: "inset 0 0 0 1px rgba(217,249,157,0.55), 0 8px 28px -8px rgba(163,230,53,0.7)" }}>
          <p className="text-xs font-bold">Ver planes de pago</p>
          <p className="text-[10px] mt-0.5 opacity-80">Esencial · Pro · Empresa desde 2,99 €</p>
        </Link>

      </aside>

      {/* DERECHA: pills + chat */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Contador de uso */}
        <UsageCounter />

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
