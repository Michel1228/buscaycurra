"use client";

/**
 * Cuenta una vista de la ficha pública de oferta y los clics en sus botones de
 * enviar el CV (los que llevan data-medir="clic"), separando lo que llega desde
 * Google. Ver app/api/metricas/visita-ficha. No guarda nada de la persona.
 */
import { useEffect } from "react";

function mandar(tipo: "vista" | "clic", google: boolean) {
  const cuerpo = JSON.stringify({ tipo, google });
  try {
    // sendBeacon sobrevive a que la persona se vaya de la página al pulsar.
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/metricas/visita-ficha", new Blob([cuerpo], { type: "application/json" }));
      return;
    }
  } catch { /* se intenta con fetch */ }
  fetch("/api/metricas/visita-ficha", { method: "POST", headers: { "Content-Type": "application/json" }, body: cuerpo, keepalive: true }).catch(() => {});
}

export default function MedirFicha() {
  useEffect(() => {
    let google = false;
    try { google = /(^|\.)google\./i.test(new URL(document.referrer).hostname); } catch { /* sin referencia */ }
    mandar("vista", google);
    const alPulsar = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[data-medir="clic"]');
      if (el) mandar("clic", google);
    };
    document.addEventListener("click", alPulsar);
    return () => document.removeEventListener("click", alPulsar);
  }, []);
  return null;
}
