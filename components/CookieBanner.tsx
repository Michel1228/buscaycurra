/**
 * components/CookieBanner.tsx — Aviso de cookies (RGPD)
 *
 * Sale en la primera visita y desaparece en cuanto se elige. La decisión se
 * guarda en localStorage, así que no vuelve a aparecer.
 *
 * POR QUÉ SE REHIZO. Este es el elemento más visible de toda la web: sale en
 * todas las páginas, fijo abajo, y es lo primero que ve quien llega. Y estaba
 * pintado con #2563EB (azul) y #F97316 (naranja), que la cabecera del fichero
 * llamaba «colores de marca». No lo son: la marca es verde #22c55e. El aviso
 * parecía de otra aplicación.
 *
 * Además ocupaba una quinta parte de la pantalla del móvil, porque los botones
 * se apilaban debajo del texto. En la página de precios llegaba a tapar la lista
 * de lo que incluye el plan, que es justo lo que se intenta vender.
 *
 * Ahora: colores de la paleta, una sola línea siempre que quepa, y bastante más
 * bajo. Sigue cumpliendo lo mismo — se puede rechazar con un clic, y rechazar
 * cuesta lo mismo que aceptar.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setVisible(true);
  }, []);

  // Mientras se ve, la página deja debajo el mismo hueco que ocupa el aviso:
  // en el móvil tapaba los últimos botones ("Contestar" en el simulador de
  // entrevistas, por ejemplo) hasta que se aceptaba (auditoría del 19 oct 2026).
  useEffect(() => {
    if (!visible || !caja.current) return;
    const antes = document.body.style.paddingBottom;
    const ajustar = () => { document.body.style.paddingBottom = `${caja.current?.offsetHeight ?? 0}px`; };
    ajustar();
    window.addEventListener("resize", ajustar);
    return () => { window.removeEventListener("resize", ajustar); document.body.style.paddingBottom = antes; };
  }, [visible]);

  function decidir(valor: "accepted" | "necessary") {
    localStorage.setItem("cookie-consent", valor);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      ref={caja}
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{ background: "rgba(8,11,16,0.96)", borderColor: "rgba(163,230,53,0.2)", backdropFilter: "blur(14px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
    >
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-xs sm:text-[13px] leading-snug flex-1 min-w-[180px]" style={{ color: "#cbd5e1" }}>
          Solo usamos cookies necesarias para que el servicio funcione. Ninguna de publicidad.{" "}
          <Link href="/cookies" className="underline hover:no-underline" style={{ color: "#22c55e" }}>
            Más información
          </Link>
        </p>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => decidir("necessary")}
            className="px-3.5 min-h-[40px] text-xs font-medium rounded-full transition hover:opacity-80"
            style={{ color: "#cbd5e1", border: "1px solid rgba(148,163,184,0.3)" }}
          >
            Solo necesarias
          </button>
          <button
            onClick={() => decidir("accepted")}
            className="px-4 min-h-[40px] text-xs font-bold rounded-full transition hover:opacity-90"
            style={{ background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406" }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
