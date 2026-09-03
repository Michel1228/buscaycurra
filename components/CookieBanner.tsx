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

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setVisible(true);
  }, []);

  function decidir(valor: "accepted" | "necessary") {
    localStorage.setItem("cookie-consent", valor);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{ background: "#1e212b", borderColor: "#2d3142" }}
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
    >
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-xs sm:text-[13px] leading-snug flex-1 min-w-[180px]" style={{ color: "#94a3b8" }}>
          Solo usamos cookies necesarias para que el servicio funcione. Ninguna de publicidad.{" "}
          <Link href="/cookies" className="underline hover:no-underline" style={{ color: "#22c55e" }}>
            Más información
          </Link>
        </p>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => decidir("necessary")}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition hover:opacity-80"
            style={{ color: "#94a3b8", border: "1px solid #2d3142" }}
          >
            Solo necesarias
          </button>
          <button
            onClick={() => decidir("accepted")}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition hover:opacity-90"
            style={{ background: "#22c55e", color: "#0f1117" }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
