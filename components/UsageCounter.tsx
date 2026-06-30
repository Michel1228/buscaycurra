"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface UsageData {
  plan: string;
  planName: string;
  guzzi: { used: number; max: number | null; remaining: number | null; unlimited: boolean };
  envios: { hoy: number; maxDia: number; remainingDia: number; semana: number; maxSemana: number; remainingSemana: number };
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

  if (loading || !usage || usage.plan === "free") return null;

  const barH = compact ? 4 : 6;
  const textSize = compact ? "text-[10px]" : "text-[11px]";

  return (
    <div className="px-3 py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      {!compact && (
        <p className="text-[10px] font-medium mb-1.5" style={{ color: "#6b7280" }}>
          Plan {usage.planName}
        </p>
      )}

      {/* Guzzi consultas */}
      {!usage.guzzi.unlimited && usage.guzzi.max && (
        <div className="flex items-center gap-2 mb-1">
          <span className={textSize + " w-16 flex-shrink-0"} style={{ color: "#64748b" }}>
            Guzzi
          </span>
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: barH, background: "rgba(255,255,255,0.05)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (usage.guzzi.used / usage.guzzi.max) * 100)}%`,
                background: usage.guzzi.remaining && usage.guzzi.remaining > 5
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : "linear-gradient(90deg, #f59e0b, #ef4444)",
              }}
            />
          </div>
          <span className={textSize + " w-14 text-right flex-shrink-0"} style={{ color: "#64748b" }}>
            {usage.guzzi.remaining !== null ? `${usage.guzzi.remaining} quedan` : "∞"}
          </span>
        </div>
      )}

      {/* Envíos CV hoy */}
      {usage.envios.maxDia > 0 && (
        <div className="flex items-center gap-2">
          <span className={textSize + " w-16 flex-shrink-0"} style={{ color: "#64748b" }}>
            Envíos
          </span>
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: barH, background: "rgba(255,255,255,0.05)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (usage.envios.hoy / usage.envios.maxDia) * 100)}%`,
                background: usage.envios.remainingDia > 3
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : "linear-gradient(90deg, #f59e0b, #ef4444)",
              }}
            />
          </div>
          <span className={textSize + " w-14 text-right flex-shrink-0"} style={{ color: "#64748b" }}>
            {usage.envios.remainingDia}/{usage.envios.maxDia}
          </span>
        </div>
      )}
    </div>
  );
}
