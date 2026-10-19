"use client";

/**
 * components/PolyfillBanderas.tsx — Banderas también en Windows.
 *
 * Windows no dibuja las banderas de emoji: en Chrome o Edge sale "GB Reino
 * Unido" en vez de la bandera. Se notaba en las presentaciones, que se hacen
 * con un portátil (oct 2026). En móviles y en Mac se ven bien.
 *
 * Si el navegador no sabe dibujar banderas, se carga una fuente que SOLO
 * tiene banderas (public/fonts/banderas.woff2, 78 KB: el subconjunto de
 * Twemoji del paquete country-flag-emoji-polyfill, MIT; gráficos de Twemoji,
 * CC-BY 4.0, citados en el aviso legal). Por el unicode-range, el resto del
 * texto sigue con su fuente de siempre, y quien ya ve banderas no descarga nada.
 */
import { useEffect } from "react";

/** ¿Pinta en color una bandera? En Windows sale en letras grises. */
function dibujaBanderas(): boolean {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const x = c.getContext("2d", { willReadFrequently: true });
    if (!x) return true;
    x.font = "24px sans-serif";
    x.textBaseline = "top";
    x.fillText("\u{1F1EA}\u{1F1F8}", 0, 0);
    const d = x.getImageData(0, 0, 32, 32).data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 0 && (Math.abs(d[i] - d[i + 1]) > 20 || Math.abs(d[i + 1] - d[i + 2]) > 20)) return true;
    }
    return false;
  } catch {
    return true;
  }
}

const PILA = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

export default function PolyfillBanderas() {
  useEffect(() => {
    if (dibujaBanderas()) return;
    const estilo = document.createElement("style");
    estilo.textContent = `
@font-face {
  font-family: "Banderas";
  src: url("/fonts/banderas.woff2") format("woff2");
  unicode-range: U+1F1E6-1F1FF, U+1F3F4, U+E0062-E0063, U+E0065, U+E0067, U+E006C, U+E006E, U+E0073-E0074, U+E0077, U+E007F;
  font-display: swap;
}
body { font-family: "Banderas", ${PILA}; }
input, select, textarea, option, label { font-family: "Banderas", ${PILA} !important; }`;
    document.head.appendChild(estilo);
  }, []);
  return null;
}
