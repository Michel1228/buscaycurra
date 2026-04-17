"use client";

/**
 * components/SplashScreen.tsx — Pantalla de carga con animación de metamorfosis
 *
 * Secuencia de ~3 segundos:
 *   1. Gusano se arrastra de izquierda a derecha sobre una hoja
 *   2. Gusano se envuelve formando un capullo
 *   3. Del capullo emerge una mariposa verde
 *   4. La mariposa vuela hacia arriba y desaparece
 *   5. Aparece el nombre "BuscayCurra" con brillo neón
 *
 * Props:
 *   onComplete — callback que se llama al terminar la animación
 */

import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

// Fases de la animación
type Fase = "worm" | "cocoon" | "butterfly" | "title" | "done";

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fase, setFase] = useState<Fase>("worm");

  useEffect(() => {
    // Fase 1: gusano durante 1s
    const t1 = setTimeout(() => setFase("cocoon"), 900);
    // Fase 2: capullo durante 0.8s
    const t2 = setTimeout(() => setFase("butterfly"), 1700);
    // Fase 3: mariposa abre alas 0.8s, luego vuela
    const t3 = setTimeout(() => setFase("title"), 2500);
    // Fase 4: título aparece 0.8s, luego llama onComplete
    const t4 = setTimeout(() => {
      setFase("done");
      onComplete();
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* ── Fase 1: Gusano que se arrastra ──────────────────────────── */}
      {(fase === "worm") && (
        <div className="flex flex-col items-center gap-6">
          {/* Gusano con animación de crawl */}
          <div style={{ animation: "splash-worm-crawl 0.9s ease-in-out forwards" }}>
            <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
              <defs>
                <radialGradient id="sg" cx="50%" cy="35%" r="55%">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity="0.85" />
                </radialGradient>
              </defs>
              {/* Cuerpo */}
              <circle cx="20" cy="38" r="10" fill="url(#sg)" />
              <circle cx="34" cy="34" r="11" fill="url(#sg)" />
              <circle cx="50" cy="32" r="11.5" fill="url(#sg)" />
              <circle cx="66" cy="31" r="11" fill="url(#sg)" />
              <circle cx="82" cy="28" r="13" fill="url(#sg)" />
              {/* Ojos */}
              <circle cx="77" cy="24" r="3.5" fill="#0a0a0a" />
              <circle cx="77" cy="24" r="1.5" fill="#f0f0f0" />
              <circle cx="86" cy="23" r="3.5" fill="#0a0a0a" />
              <circle cx="86" cy="23" r="1.5" fill="#f0f0f0" />
              {/* Antenas */}
              <line x1="78" y1="16" x2="74" y2="6" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="74" cy="5" r="2" fill="#00ff88" />
              <line x1="85" y1="15" x2="89" y2="4" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="89" cy="3" r="2" fill="#00ff88" />
              {/* Patas */}
              {[34, 42, 50, 58, 66].map((x, i) => (
                <line key={i} x1={x} y1="42" x2={x - 2} y2="52" stroke="#00ff88" strokeWidth="1" strokeLinecap="round" />
              ))}
              {/* Hoja bajo el gusano */}
              <ellipse cx="60" cy="52" rx="52" ry="5" fill="#0d1f0d" />
              <line x1="8" y1="52" x2="112" y2="52" stroke="#00ff88" strokeWidth="0.5" strokeOpacity="0.4" />
            </svg>
          </div>
          <p style={{ color: "#a0a0a0", fontSize: "0.8rem", letterSpacing: "0.15em" }}>
            CARGANDO...
          </p>
        </div>
      )}

      {/* ── Fase 2: Capullo / Crisálida ──────────────────────────────── */}
      {fase === "cocoon" && (
        <div style={{ animation: "splash-cocoon-appear 0.5s ease-out forwards" }}>
          <svg width="100" height="130" viewBox="0 0 100 130" fill="none">
            <defs>
              <radialGradient id="cg" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#00ff88" stopOpacity="0.7" />
              </radialGradient>
              <filter id="cglow">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {/* Capullo */}
            <ellipse cx="50" cy="65" rx="28" ry="50" fill="url(#cg)" filter="url(#cglow)" />
            <ellipse cx="50" cy="65" rx="28" ry="50" fill="none" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.6" />
            {/* Líneas de seda */}
            <path d="M30 35 Q50 20 70 35" stroke="#4ade80" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
            <path d="M25 50 Q50 38 75 50" stroke="#4ade80" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
            <path d="M24 65 Q50 55 76 65" stroke="#4ade80" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
            <path d="M25 80 Q50 70 75 80" stroke="#4ade80" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
            <path d="M30 95 Q50 88 70 95" stroke="#4ade80" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
            {/* Brillo superior */}
            <ellipse cx="43" cy="42" rx="8" ry="5" fill="#f0fff0" fillOpacity="0.2" />
            {/* Gancho superior */}
            <path d="M50 15 Q55 8 50 2" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      )}

      {/* ── Fase 3: Mariposa emergiendo ───────────────────────────────── */}
      {fase === "butterfly" && (
        <div style={{ animation: "splash-butterfly-up 0.9s ease-in-out forwards" }}>
          <ButterflyFullSVG size={160} />
        </div>
      )}

      {/* ── Fase 4: Título BuscayCurra ───────────────────────────────── */}
      {fase === "title" && (
        <div
          className="flex flex-col items-center gap-4"
          style={{ animation: "splash-title-appear 0.8s ease-out forwards" }}
        >
          <ButterflyFullSVG size={90} small />
          <h1
            className="text-5xl font-extrabold tracking-widest"
            style={{
              color: "#00ff88",
              textShadow: "0 0 20px #00ff88, 0 0 50px #4ade80",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.08em",
            }}
          >
            BuscayCurra
          </h1>
          <p
            style={{
              color: "#4ade80",
              fontSize: "0.85rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}
          >
            Encuentra trabajo con IA
          </p>
        </div>
      )}

      {/* Estilos de keyframes inline */}
      <style>{`
        @keyframes splash-worm-crawl {
          0%   { transform: translateX(-80px); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes splash-cocoon-appear {
          0%   { transform: scale(0.3) rotate(-15deg); opacity: 0; }
          60%  { transform: scale(1.05) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes splash-butterfly-up {
          0%   { transform: translateY(40px) scale(0.4); opacity: 0; }
          40%  { transform: translateY(-5px) scale(1.05); opacity: 1; }
          70%  { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-100px) scale(0.6); opacity: 0; }
        }
        @keyframes splash-title-appear {
          0%   { transform: translateY(24px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Mariposa SVG completa (verde elegante) ───────────────────────────────────

interface ButterflyFullSVGProps {
  size?: number;
  small?: boolean;
}

function ButterflyFullSVG({ size = 160, small = false }: ButterflyFullSVGProps) {
  return (
    <svg
      width={size}
      height={size * 0.8}
      viewBox="0 0 160 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={small ? {} : { animation: "splash-wing-flap 0.5s ease-in-out 3" }}
    >
      <defs>
        <radialGradient id="wg1" cx="30%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0.7" />
        </radialGradient>
        <radialGradient id="wg2" cx="70%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0.7" />
        </radialGradient>
        <filter id="bfglow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Ala superior izquierda */}
      <path
        d="M80 60 C60 30, 10 10, 8 45 C6 65, 40 80, 80 70 Z"
        fill="url(#wg1)"
        filter="url(#bfglow)"
      />
      {/* Ala superior derecha */}
      <path
        d="M80 60 C100 30, 150 10, 152 45 C154 65, 120 80, 80 70 Z"
        fill="url(#wg2)"
        filter="url(#bfglow)"
      />
      {/* Ala inferior izquierda */}
      <path
        d="M80 68 C60 72, 15 80, 20 105 C24 120, 60 118, 80 95 Z"
        fill="url(#wg1)"
        filter="url(#bfglow)"
        fillOpacity="0.85"
      />
      {/* Ala inferior derecha */}
      <path
        d="M80 68 C100 72, 145 80, 140 105 C136 120, 100 118, 80 95 Z"
        fill="url(#wg2)"
        filter="url(#bfglow)"
        fillOpacity="0.85"
      />

      {/* Nervaduras sutiles */}
      <path d="M80 62 C65 50 30 30 20 22" stroke="#f0f0f0" strokeWidth="0.6" strokeOpacity="0.3" fill="none"/>
      <path d="M80 62 C115 50 130 30 140 22" stroke="#f0f0f0" strokeWidth="0.6" strokeOpacity="0.3" fill="none"/>

      {/* Cuerpo (abdomen) */}
      <ellipse cx="80" cy="78" rx="5" ry="28" fill="#00ff88" />
      <ellipse cx="80" cy="52" rx="6" ry="14" fill="#4ade80" />

      {/* Cabeza */}
      <circle cx="80" cy="38" r="7" fill="#4ade80" />

      {/* Antenas */}
      <path d="M77 33 C72 22 68 12 65 6" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <circle cx="65" cy="5" r="2.5" fill="#00ff88" />
      <path d="M83 33 C88 22 92 12 95 6" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <circle cx="95" cy="5" r="2.5" fill="#00ff88" />

      <style>{`
        @keyframes splash-wing-flap {
          0%, 100% { transform: scaleX(1); }
          50%       { transform: scaleX(0.5); }
        }
      `}</style>
    </svg>
  );
}
