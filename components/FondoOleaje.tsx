"use client";

/**
 * components/FondoOleaje.tsx — El fondo de todas las pantallas de /app.
 *
 * Lo pidió Michel el 7 nov 2026: "destellos de colores entre verde y negro que
 * se funden, como un efecto oleaje", "oleajes suaves con rayas finas tipo
 * corte de diamante, pero con movimiento". Bandas de luz verde y lima que se
 * mezclan y ondulan muy despacio, hilos finos de luz y facetas en ángulo que
 * brillan cuando pasa la ola.
 *
 * Coste: ninguno para el servidor (es CSS y un SVG dentro de la página) y muy
 * poco para el móvil: todo se mueve con transform/opacity, que lo hace la
 * tarjeta gráfica sin repintar. Los estilos y el porqué de cada capa están en
 * app/globals.css, en "Fondo de oleaje".
 *
 * Se para solo:
 *  - con la pestaña oculta o la app en segundo plano (visibilitychange), y
 *  - con "reducir movimiento" del sistema, queda quieto (globals.css).
 *
 * Lo monta AppNavWrapper, que solo pinta en /app/*. Va detrás de todo
 * (z-index -1) y no recibe toques.
 */
import { useEffect } from "react";

export default function FondoOleaje() {
  useEffect(() => {
    const raiz = document.documentElement;
    const actualizar = () => raiz.classList.toggle("oleaje-quieto", document.hidden);
    actualizar();
    document.addEventListener("visibilitychange", actualizar);
    document.body.classList.add("con-oleaje");
    return () => {
      document.removeEventListener("visibilitychange", actualizar);
      raiz.classList.remove("oleaje-quieto");
      document.body.classList.remove("con-oleaje");
    };
  }, []);

  return (
    <div className="fondo-oleaje" aria-hidden="true">
      <div className="oleaje-banda oleaje-banda-1" />
      <div className="oleaje-banda oleaje-banda-2" />
      <div className="oleaje-banda oleaje-banda-3" />
      {/* Hilos de luz: un haz de curvas finas que se repite cada 1600 de
          ancho, para que el desplazamiento de media anchura no tenga costura. */}
      <svg className="oleaje-hilos" viewBox="0 0 3200 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="oleaje-hilo" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#a3e635" stopOpacity="0.05" />
            <stop offset="0.25" stopColor="#bef264" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#22c55e" stopOpacity="0.12" />
            <stop offset="0.75" stopColor="#bef264" stopOpacity="0.55" />
            <stop offset="1" stopColor="#a3e635" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {[0, 14, 30, 48, 70].map((d, i) => (
          <path
            key={d}
            // La tangente con la que empieza cada tramo es la misma con la que
            // acaba (400, -180): el dibujo empalma consigo mismo sin pico.
            d={`M0 ${300 + d} C 400 ${120 + d}, 1200 ${480 + d}, 1600 ${300 + d} C 2000 ${120 + d}, 2800 ${480 + d}, 3200 ${300 + d}`}
            fill="none"
            stroke="url(#oleaje-hilo)"
            strokeWidth={i === 1 ? 1.4 : 0.8}
            vectorEffect="non-scaling-stroke"
            opacity={1 - i * 0.16}
          />
        ))}
      </svg>
      <div className="oleaje-facetas" />
      <div className="oleaje-destello" />
      <div className="oleaje-velo" />
    </div>
  );
}
