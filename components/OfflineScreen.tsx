"use client";

import { useEffect, useState } from "react";

export function useIsOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
}

export default function OfflineScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: "#0f1117" }}>
      <div className="text-center px-8 max-w-sm">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-xl font-bold text-white mb-3">Sin conexión</h1>
        <p className="text-sm mb-6" style={{ color: "#64748b" }}>
          BuscayCurra necesita conexión a internet para funcionar.
          Comprueba tu wifi o datos móviles.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl font-semibold text-sm transition"
          style={{ background: "#22c55e", color: "#0a0a0a" }}>
          Reintentar
        </button>
      </div>
    </div>
  );
}
