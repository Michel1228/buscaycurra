"use client";

/**
 * components/RevelacionMariposa.tsx — Animación de revelación al encontrar trabajo
 *
 * Secuencia de animación:
 *   1. Fondo se oscurece
 *   2. El capullo/mariposa emergiendo tiembla suavemente
 *   3. Flash de luz blanca que llena la pantalla
 *   4. La luz se disipa → aparece la mariposa con sus colores reales
 *   5. Texto con nombre de especie y nombre científico
 *   6. Subtexto motivacional
 *   7. Botón "Compartir mi mariposa" y botón "Continuar"
 *
 * Props:
 *   userId       — id del usuario (para determinar la especie)
 *   onContinuar  — callback al pulsar "Continuar"
 */

import { useState, useEffect } from "react";
import { getEspecieForUser, RAREZA_COLORES, Especie } from "@/lib/especies";
import MariposEspecie from "./MariposEspecie";

interface RevelacionMariposaProps {
  userId: string;
  onContinuar: () => void;
}

type Fase = "shake" | "flash" | "reveal" | "done";

export default function RevelacionMariposa({ userId, onContinuar }: RevelacionMariposaProps) {
  const [fase, setFase] = useState<Fase>("shake");
  const [especie, setEspecie] = useState<Especie | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setEspecie(getEspecieForUser(userId));
  }, [userId]);

  useEffect(() => {
    // Fase 1: temblor (0-1s)
    const t1 = setTimeout(() => setFase("flash"), 1000);
    // Fase 2: flash de luz (1-1.6s)
    const t2 = setTimeout(() => setFase("reveal"), 1600);
    // Fase 3: revelación
    const t3 = setTimeout(() => setFase("done"), 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const handleCompartir = () => {
    if (!especie) return;
    const texto = `🦋 ¡He encontrado trabajo! Mi mariposa es una ${especie.nombre} (${especie.nombreCientifico}) — especie ${especie.rareza}. ${especie.descripcion} #BuscayCurra`;
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    });
  };

  if (!especie) return null;

  const rarezaColores = RAREZA_COLORES[especie.rareza];

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.92)" }}
    >
      {/* Flash de luz blanca */}
      {fase === "flash" && (
        <div
          className="absolute inset-0 z-[9999]"
          style={{ animation: "rev-flash 0.6s ease-out forwards", backgroundColor: "#ffffff" }}
        />
      )}

      {/* ── Fase: temblor del capullo ────────────────────────────────── */}
      {(fase === "shake") && (
        <div
          className="flex flex-col items-center gap-6"
          style={{ animation: "rev-shake 0.8s ease-in-out infinite" }}
        >
          <CocoonSVG />
          <p style={{ color: "#a0a0a0", fontSize: "0.85rem", letterSpacing: "0.15em" }}>
            ALGO ESTÁ PASANDO…
          </p>
        </div>
      )}

      {/* ── Fase: revelación ─────────────────────────────────────────── */}
      {(fase === "reveal" || fase === "done") && (
        <div
          className="flex flex-col items-center gap-6 px-6 max-w-sm text-center"
          style={{
            animation: fase === "reveal" ? "rev-appear 0.7s ease-out forwards" : "none",
            opacity: fase === "done" ? 1 : undefined,
          }}
        >
          {/* Mariposa revelada */}
          <div
            style={{
              animation: "rev-wing-open 1s ease-out forwards",
              filter: `drop-shadow(0 0 20px ${especie.colores[0]})`,
            }}
          >
            <MariposEspecie especie={especie} size={100} animated />
          </div>

          {/* Badge de rareza */}
          <span
            className="text-xs font-bold px-3 py-1 rounded-full border tracking-widest"
            style={{
              backgroundColor: rarezaColores.bg,
              color: rarezaColores.text,
              borderColor: rarezaColores.border,
              textTransform: "capitalize",
            }}
          >
            ✦ {especie.rareza}
          </span>

          {/* Nombre principal */}
          <div>
            <h2
              className="text-3xl font-extrabold leading-tight"
              style={{
                color: especie.colores[0],
                textShadow: `0 0 20px ${especie.colores[0]}, 0 0 40px ${especie.colores[0]}80`,
              }}
            >
              ¡Felicidades!
            </h2>
            <p className="text-xl font-bold mt-1" style={{ color: "#f0f0f0" }}>
              Eres una{" "}
              <span style={{ color: especie.colores[0] }}>
                {especie.nombre}
              </span>
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "#a0a0a0", fontStyle: "italic" }}
            >
              {especie.nombreCientifico}
            </p>
          </div>

          {/* Descripción motivacional */}
          <p
            className="text-base leading-relaxed"
            style={{ color: "#c0c0c0" }}
          >
            &ldquo;{especie.descripcion}&rdquo;
          </p>

          {/* Botones */}
          {fase === "done" && (
            <div className="flex flex-col gap-3 w-full mt-2">
              <button
                onClick={handleCompartir}
                className="w-full py-3 rounded-xl font-bold text-sm transition"
                style={{
                  backgroundColor: copiado ? "#1a3e1a" : `${especie.colores[0]}20`,
                  color: copiado ? "#4ade80" : especie.colores[0],
                  border: `1.5px solid ${copiado ? "#4ade80" : especie.colores[0]}80`,
                }}
              >
                {copiado ? "✓ ¡Copiado al portapapeles!" : "🦋 Compartir mi mariposa"}
              </button>

              <button
                onClick={onContinuar}
                className="w-full py-3 rounded-xl font-bold text-sm transition"
                style={{
                  backgroundColor: "#f0f0f0",
                  color: "#0a0a0a",
                }}
              >
                Continuar →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes rev-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          20%       { transform: translateX(-6px) rotate(-3deg); }
          40%       { transform: translateX(6px) rotate(3deg); }
          60%       { transform: translateX(-4px) rotate(-2deg); }
          80%       { transform: translateX(4px) rotate(2deg); }
        }
        @keyframes rev-flash {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes rev-appear {
          0%   { opacity: 0; transform: scale(0.7) translateY(20px); }
          60%  { opacity: 1; transform: scale(1.04) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rev-wing-open {
          0%   { transform: scaleX(0.1); }
          60%  { transform: scaleX(1.08); }
          100% { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Capullo SVG para la fase de temblor ─────────────────────────────────────

function CocoonSVG() {
  return (
    <svg width="80" height="120" viewBox="0 0 80 120" fill="none">
      <defs>
        <radialGradient id="rvc" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0.7" />
        </radialGradient>
        <filter id="rvglow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="40" cy="62" rx="24" ry="48" fill="url(#rvc)" filter="url(#rvglow)" />
      <path d="M22 38 Q40 26 58 38" stroke="#4ade80" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
      <path d="M19 54 Q40 44 61 54" stroke="#4ade80" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
      <path d="M18 70 Q40 62 62 70" stroke="#4ade80" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
      <path d="M20 86 Q40 78 60 86" stroke="#4ade80" strokeWidth="0.8" strokeOpacity="0.5" fill="none" />
      <ellipse cx="34" cy="42" rx="7" ry="4" fill="#f0fff0" fillOpacity="0.2" />
      <path d="M40 14 Q44 7 40 2" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Fisuras que aparecen */}
      <path d="M38 30 L36 45 M42 32 L44 48" stroke="#00ff88" strokeWidth="0.6" strokeOpacity="0.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}
