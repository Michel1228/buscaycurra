"use client";

/**
 * BosqueAmbiente — Enredaderas, hormiguitas y sonido de bosque
 * Se muestra en todas las páginas /app/*
 * - Enredaderas SVG en las 4 esquinas
 * - Hormiguitas animadas caminando por las enredaderas
 * - Botón de sonido ambiente (grillos, búhos, naturaleza)
 */

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function BosqueAmbiente() {
  const pathname = usePathname();
  const [sonidoActivo, setSonidoActivo] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Solo en /app/*
  if (!pathname.startsWith("/app")) return null;

  const toggleSonido = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/bosque-ambient.wav");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.15;
    }
    if (sonidoActivo) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setSonidoActivo(!sonidoActivo);
  };

  return (
    <>
      {/* ── Enredaderas SVG en las esquinas ──── */}
      {/* Esquina superior izquierda */}
      <div className="fixed top-0 left-0 pointer-events-none z-[5] opacity-40" style={{ width: "180px", height: "220px" }}>
        <svg viewBox="0 0 180 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 C20 40, 40 80, 30 130 C25 160, 15 180, 10 220" stroke="#5a8a3c" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7"/>
          <path d="M0 20 C30 50, 50 60, 45 100 C40 130, 25 150, 20 190" stroke="#4a7a2c" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5"/>
          <path d="M0 0 C40 20, 70 25, 100 20" stroke="#5a8a3c" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5"/>
          {/* Hojas */}
          <ellipse cx="30" cy="60" rx="8" ry="4" fill="#7ed56f" opacity="0.4" transform="rotate(-30 30 60)"/>
          <ellipse cx="25" cy="100" rx="7" ry="3.5" fill="#7ed56f" opacity="0.35" transform="rotate(20 25 100)"/>
          <ellipse cx="20" cy="140" rx="9" ry="4" fill="#7ed56f" opacity="0.3" transform="rotate(-15 20 140)"/>
          <ellipse cx="45" cy="40" rx="6" ry="3" fill="#a8e6a1" opacity="0.3" transform="rotate(40 45 40)"/>
          <ellipse cx="15" cy="170" rx="8" ry="3.5" fill="#7ed56f" opacity="0.25" transform="rotate(-25 15 170)"/>
          <ellipse cx="70" cy="22" rx="6" ry="3" fill="#a8e6a1" opacity="0.25" transform="rotate(10 70 22)"/>
        </svg>
      </div>

      {/* Esquina superior derecha (reflejada) */}
      <div className="fixed top-0 right-0 pointer-events-none z-[5] opacity-35" style={{ width: "150px", height: "200px", transform: "scaleX(-1)" }}>
        <svg viewBox="0 0 150 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 C15 35, 35 70, 28 120 C22 150, 12 170, 8 200" stroke="#5a8a3c" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.6"/>
          <path d="M0 10 C25 45, 40 55, 38 90 C35 120, 20 140, 15 175" stroke="#4a7a2c" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
          <ellipse cx="28" cy="55" rx="7" ry="3.5" fill="#7ed56f" opacity="0.35" transform="rotate(-25 28 55)"/>
          <ellipse cx="22" cy="95" rx="8" ry="3.5" fill="#7ed56f" opacity="0.3" transform="rotate(15 22 95)"/>
          <ellipse cx="18" cy="135" rx="7" ry="3" fill="#a8e6a1" opacity="0.25" transform="rotate(-20 18 135)"/>
        </svg>
      </div>

      {/* Esquina inferior izquierda */}
      <div className="fixed bottom-0 left-0 pointer-events-none z-[5] opacity-30" style={{ width: "160px", height: "180px", transform: "scaleY(-1)" }}>
        <svg viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 C18 35, 35 65, 28 110 C22 140, 12 160, 8 180" stroke="#5a8a3c" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.6"/>
          <path d="M0 15 C28 42, 42 52, 38 85" stroke="#4a7a2c" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
          <ellipse cx="25" cy="50" rx="7" ry="3" fill="#7ed56f" opacity="0.3" transform="rotate(-30 25 50)"/>
          <ellipse cx="20" cy="90" rx="8" ry="3.5" fill="#a8e6a1" opacity="0.25" transform="rotate(20 20 90)"/>
        </svg>
      </div>

      {/* Esquina inferior derecha */}
      <div className="fixed bottom-0 right-0 pointer-events-none z-[5] opacity-30" style={{ width: "140px", height: "170px", transform: "scale(-1, -1)" }}>
        <svg viewBox="0 0 140 170" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0 C15 30, 30 60, 25 100 C20 130, 10 150, 5 170" stroke="#5a8a3c" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6"/>
          <ellipse cx="22" cy="45" rx="6" ry="3" fill="#7ed56f" opacity="0.3" transform="rotate(-20 22 45)"/>
          <ellipse cx="18" cy="85" rx="7" ry="3" fill="#a8e6a1" opacity="0.25" transform="rotate(25 18 85)"/>
        </svg>
      </div>

      {/* ── Hormiguitas animadas ──── */}
      <div className="fixed inset-0 pointer-events-none z-[6] overflow-hidden">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="absolute text-[8px]" style={{
            animation: `hormiga-${i} ${18 + i * 4}s linear infinite`,
            opacity: 0.5,
          }}>🐜</div>
        ))}
      </div>

      {/* ── Botón de sonido ──── */}
      <button onClick={toggleSonido}
        className="fixed bottom-4 left-4 z-[9997] w-10 h-10 rounded-full flex items-center justify-center transition hover:scale-110"
        style={{
          background: sonidoActivo ? "rgba(126,213,111,0.2)" : "rgba(42,42,30,0.6)",
          border: `1.5px solid ${sonidoActivo ? "rgba(126,213,111,0.3)" : "rgba(61,60,48,0.4)"}`,
        }}
        title={sonidoActivo ? "Silenciar bosque" : "Sonido de bosque"}>
        <span className="text-sm">{sonidoActivo ? "🔊" : "🔇"}</span>
      </button>

      {/* ── CSS Hormiguitas ──── */}
      <style jsx global>{`
        @keyframes hormiga-1 {
          0% { top: -10px; left: 20px; }
          25% { top: 80px; left: 15px; }
          50% { top: 160px; left: 25px; }
          75% { top: 240px; left: 10px; }
          100% { top: 320px; left: 20px; }
        }
        @keyframes hormiga-2 {
          0% { top: -10px; left: 40px; }
          30% { top: 100px; left: 35px; }
          60% { top: 200px; left: 45px; }
          100% { top: 350px; left: 30px; }
        }
        @keyframes hormiga-3 {
          0% { bottom: -10px; right: 25px; }
          25% { bottom: 60px; right: 20px; }
          50% { bottom: 130px; right: 30px; }
          75% { bottom: 200px; right: 15px; }
          100% { bottom: 280px; right: 25px; }
        }
        @keyframes hormiga-4 {
          0% { top: 50%; right: -10px; }
          25% { top: 45%; right: 15px; }
          50% { top: 35%; right: 10px; }
          75% { top: 25%; right: 20px; }
          100% { top: 10%; right: 5px; }
        }
        @keyframes hormiga-5 {
          0% { bottom: 50%; left: -10px; }
          25% { bottom: 55%; left: 20px; }
          50% { bottom: 65%; left: 15px; }
          75% { bottom: 75%; left: 25px; }
          100% { bottom: 90%; left: 10px; }
        }
      `}</style>
    </>
  );
}
