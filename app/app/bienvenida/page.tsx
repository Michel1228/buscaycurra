"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function BienvenidaPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [paso, setPaso] = useState(1);

  useEffect(() => {
    async function init() {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      // Intentar sacar el nombre del perfil o del email
      const name = user.user_metadata?.nombre || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
      setNombre(name.charAt(0).toUpperCase() + name.slice(1));
    }
    init();
  }, [router]);

  const pasosOnboarding = [
    { num: 1, icon: "📄", titulo: "Sube o crea tu CV", desc: "Guzzi lo analiza y mejora con IA. Tarda 2 minutos.", link: "/app/curriculum", btn: "Ir a Mi CV →" },
    { num: 2, icon: "🔍", titulo: "Busca ofertas", desc: "Más de 1.7 millones de ofertas en 21 países. Filtra por lo que te importa.", link: "/app/buscar", btn: "Explorar ofertas →" },
    { num: 3, icon: "🤖", titulo: "Habla con Guzzi", desc: "Tu asistente IA 24/7. Pregúntale lo que quieras sobre trabajo.", link: "/app/gusi", btn: "Hablar con Guzzi →" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      {/* Header celebración */}
      <div className="py-12 px-4 text-center" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>
          ¡Bienvenido{nombre ? `, ${nombre}` : ""}!
        </h1>
        <p className="mt-2 text-sm opacity-90" style={{ color: "#fff" }}>
          Tu cuenta está lista. Guzzi está preparado para ayudarte.
        </p>
        <p className="mt-1 text-xs opacity-70" style={{ color: "#fff" }}>
          Esto es lo que puedes hacer ahora:
        </p>
      </div>

      {/* Pasos onboarding */}
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {pasosOnboarding.map((p) => (
          <div
            key={p.num}
            className="card-game p-5 flex items-center gap-4 hover:border-green-500/30 transition cursor-pointer"
            onClick={() => router.push(p.link)}
            style={{ cursor: "pointer" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
              style={{ background: "rgba(34,197,94,0.12)" }}
            >
              {p.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
                {p.num}. {p.titulo}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                {p.desc}
              </p>
            </div>
            <span className="text-xs font-medium shrink-0" style={{ color: "#22c55e" }}>
              {p.btn}
            </span>
          </div>
        ))}

        {/* Stats de bienvenida */}
        <div className="mt-8 p-5 rounded-lg text-center" style={{ background: "#111827", border: "1px solid #1e293b" }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "#94a3b8" }}>
            📊 BUSCAYCURRA EN CIFRAS
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-lg font-bold" style={{ color: "#22c55e" }}>1.7M+</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>ofertas activas</p>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "#22c55e" }}>21</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>países</p>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "#22c55e" }}>3 min</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>primer envío</p>
            </div>
          </div>
        </div>

        <div className="text-center pt-4 pb-12">
          <Link href="/app" className="text-xs underline" style={{ color: "#64748b" }}>
            Ir al panel principal
          </Link>
        </div>
      </div>
    </div>
  );
}
