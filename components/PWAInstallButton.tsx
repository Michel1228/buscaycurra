"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Ya instalada como PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed || !installEvent) return null;

  const handleInstall = async () => {
    if (!installEvent) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      const result = await installEvent.userChoice;
      if (result.outcome === "accepted") setInstalled(true);
    } finally {
      setInstalling(false);
      setInstallEvent(null);
    }
  };

  return (
    <button
      onClick={() => void handleInstall()}
      disabled={installing}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
      style={{
        background: "rgba(126,213,111,0.12)",
        border: "1px solid rgba(126,213,111,0.35)",
        color: "#7ed56f",
        backdropFilter: "blur(8px)",
      }}
      aria-label="Instalar aplicación"
    >
      <span className="text-base">📲</span>
      <span>{installing ? "Instalando..." : "Instalar app"}</span>
    </button>
  );
}
