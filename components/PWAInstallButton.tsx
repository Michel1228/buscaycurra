"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function PWAInstallButton() {
  const { install, canInstall, isInstalled, isIOS } = usePWAInstall();

  if (isInstalled) return null;

  if (canInstall) {
    return (
      <button
        onClick={install}
        className="text-center text-sm font-medium py-3 px-6 rounded-xl transition hover:opacity-90 flex items-center gap-2 mx-auto"
        style={{
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.3)",
          color: "#22c55e",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        📲 Instalar App
      </button>
    );
  }

  if (isIOS) {
    return (
      <p className="text-center text-xs mt-2" style={{ color: "#64748b" }}>
        📲 iOS: toca <strong style={{ color: "#94a3b8" }}>Compartir</strong> →{" "}
        <strong style={{ color: "#22c55e" }}>Añadir a pantalla de inicio</strong>
      </p>
    );
  }

  return null;
}
