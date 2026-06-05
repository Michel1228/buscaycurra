"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [instalada, setInstalada] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalada(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostrar después de 5 segundos
      setTimeout(() => setShowPrompt(true), 5000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    const installedHandler = () => {
      setInstalada(true);
      setShowPrompt(false);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  async function instalar() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setInstalada(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  }

  if (instalada || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg animate-bounce"
      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
      <span className="text-sm">📲</span>
      <div>
        <p className="text-xs font-bold">Instalar BuscayCurra</p>
        <p className="text-[10px] opacity-80">Acceso rápido + notificaciones</p>
      </div>
      <button onClick={instalar} className="text-[11px] font-bold px-3 py-1 rounded-lg"
        style={{ background: "rgba(255,255,255,0.2)" }}>
        Instalar
      </button>
      <button onClick={() => setShowPrompt(false)} className="text-xs opacity-60">✕</button>
    </div>
  );
}
