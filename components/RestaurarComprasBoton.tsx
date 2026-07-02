"use client";

/**
 * RestaurarComprasBoton — Botón "Restaurar compras" (obligatorio por Apple).
 *
 * Apple exige que cualquier app con In-App Purchase ofrezca restaurar compras
 * previas (ej. reinstalación o segundo dispositivo). Solo se muestra dentro de
 * la app nativa de iOS; en web devuelve null.
 */

import { useState } from "react";
import { isNativeIOS } from "@/lib/utils/platform";
import { useRevenueCat } from "@/lib/hooks/useRevenueCat";

export default function RestaurarComprasBoton({ className = "" }: { className?: string }) {
  const { restaurarCompras, restaurando } = useRevenueCat();
  const [msg, setMsg] = useState<string | null>(null);

  // Chequeo defensivo (además del que haga el padre).
  if (typeof window !== "undefined" && !isNativeIOS()) return null;

  async function onRestaurar() {
    setMsg(null);
    const res = await restaurarCompras();
    if (res.ok) {
      setMsg(res.encontrado ? "Compras restauradas correctamente." : "No se encontraron compras anteriores para esta cuenta.");
    } else {
      setMsg(res.error ?? "No se pudieron restaurar las compras.");
    }
  }

  return (
    <div className={`text-center ${className}`}>
      <button
        onClick={() => void onRestaurar()}
        disabled={restaurando}
        className="text-xs font-medium underline hover:opacity-80 transition disabled:opacity-50"
        style={{ color: "#94a3b8" }}
      >
        {restaurando ? "Restaurando..." : "Restaurar compras"}
      </button>
      <p className="text-[11px] mt-1" style={{ color: "#64748b" }}>
        ¿Ya compraste un plan en otro dispositivo? Recupéralo aquí.
      </p>
      {msg && (
        <p role="status" className="text-[11px] mt-2" style={{ color: "#22c55e" }}>
          {msg}
        </p>
      )}
    </div>
  );
}
