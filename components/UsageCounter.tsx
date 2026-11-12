"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface UsageData {
  plan: string;
  planName: string;
  guzzi: { used: number; max: number | null; remaining: number | null; unlimited: boolean };
  envios: { hoy: number; maxDia: number; remainingDia: number; semana: number; maxSemana: number; remainingSemana: number; extra?: number };
  features: { cartaIA: boolean; codigosPromo: boolean; apiAccess: boolean };
}

export default function UsageCounter({ compact = false }: { compact?: boolean }) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return; }
      try {
        const res = await fetch("/api/usage", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) setUsage(await res.json());
      } catch {}
      setLoading(false);
    });
  }, []);

  // También en el plan gratis: quien llega de una ONG tiene que ver que le
  // quedan 3 envíos hoy, y no descubrirlo cuando ya no le deja (19 oct 2026).
  if (loading || !usage) return null;
  // Lo que de verdad queda: el menor entre el límite del día y el de la semana.
  const enviosQuedan = Math.min(usage.envios.remainingDia, usage.envios.remainingSemana ?? usage.envios.remainingDia);

  const barH = compact ? 4 : 6;
  const textSize = compact ? "text-[10px]" : "text-[11px]";

  return (
    <div className="px-3 py-1.5" style={{ borderBottom: "1px solid rgba(163,230,53,0.12)", background: "rgba(8,11,16,0.82)" }}>
      {!compact && (
        <p className="text-[10px] font-medium mb-1.5" style={{ color: "#8b98ad" }}>
          Plan {usage.planName}
        </p>
      )}

      {/* Guzzi consultas */}
      {!usage.guzzi.unlimited && usage.guzzi.max && (
        <div className="flex items-center gap-2 mb-1">
          <span className={textSize + " w-16 flex-shrink-0"} style={{ color: "#8b98ad" }}>
            Guzzi
          </span>
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: barH, background: "rgba(255,255,255,0.05)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (usage.guzzi.used / usage.guzzi.max) * 100)}%`,
                background: usage.guzzi.remaining && usage.guzzi.remaining > 5
                  ? "linear-gradient(90deg, #84cc16, #bef264)"
                  : "linear-gradient(90deg, #f59e0b, #ef4444)",
              }}
            />
          </div>
          <span className={textSize + " w-14 text-right flex-shrink-0"} style={{ color: "#8b98ad" }}>
            {usage.guzzi.remaining !== null ? `${usage.guzzi.remaining} quedan` : "∞"}
          </span>
        </div>
      )}

      {/* Envíos CV hoy */}
      {usage.envios.maxDia > 0 && (
        <div className="flex items-center gap-2">
          <span className={textSize + " w-16 flex-shrink-0"} style={{ color: "#8b98ad" }}>
            Envíos
          </span>
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: barH, background: "rgba(255,255,255,0.05)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (usage.envios.hoy / usage.envios.maxDia) * 100)}%`,
                background: usage.envios.remainingDia > 3
                  ? "linear-gradient(90deg, #84cc16, #bef264)"
                  : "linear-gradient(90deg, #f59e0b, #ef4444)",
              }}
            />
          </div>
          <span className={textSize + " text-right flex-shrink-0 whitespace-nowrap"} style={{ color: "#8b98ad" }}>
            {enviosQuedan} quedan{usage.envios.extra ? ` · +${usage.envios.extra} extra` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
