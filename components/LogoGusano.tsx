"use client";

/**
 * components/LogoGusano.tsx — Logo del gusano verde elegante en SVG
 *
 * Gusano segmentado hecho 100% en SVG inline, sin imágenes externas.
 * Props:
 *   size     — tamaño en px del viewBox (cuadrado)
 *   animated — activa animación ondulante
 */

interface LogoGusanoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export default function LogoGusano({
  size = 40,
  animated = false,
  className = "",
}: LogoGusanoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? "animate-worm-wiggle" : ""} ${className}`}
      aria-label="Logo gusano BuscayCurra"
      role="img"
    >
      <defs>
        {/* Gradiente para el brillo del cuerpo */}
        <radialGradient id="bodyGrad" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0.85" />
        </radialGradient>
        {/* Sombra / brillo suave */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Cuerpo segmentado (5 círculos solapados) ─────────────────── */}
      {/* Segmento trasero */}
      <circle cx="14" cy="50" r="10" fill="url(#bodyGrad)" filter="url(#glow)" />
      <circle cx="14" cy="50" r="10" fill="none" stroke="#00ff88" strokeWidth="0.8" strokeOpacity="0.5" />

      {/* Segmento 2 */}
      <circle cx="26" cy="46" r="11" fill="url(#bodyGrad)" filter="url(#glow)" />
      <circle cx="26" cy="46" r="11" fill="none" stroke="#00ff88" strokeWidth="0.8" strokeOpacity="0.5" />

      {/* Segmento 3 */}
      <circle cx="39" cy="44" r="11.5" fill="url(#bodyGrad)" filter="url(#glow)" />
      <circle cx="39" cy="44" r="11.5" fill="none" stroke="#00ff88" strokeWidth="0.8" strokeOpacity="0.5" />

      {/* Segmento 4 */}
      <circle cx="52" cy="43" r="11" fill="url(#bodyGrad)" filter="url(#glow)" />
      <circle cx="52" cy="43" r="11" fill="none" stroke="#00ff88" strokeWidth="0.8" strokeOpacity="0.5" />

      {/* Cabeza */}
      <circle cx="65" cy="40" r="13" fill="url(#bodyGrad)" filter="url(#glow)" />
      <circle cx="65" cy="40" r="13" fill="none" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.6" />

      {/* ── Ojos ─────────────────────────────────────────────────────── */}
      {/* Ojo izquierdo */}
      <circle cx="60" cy="36" r="3.5" fill="#0a0a0a" />
      <circle cx="60" cy="36" r="1.5" fill="#f0f0f0" />
      <circle cx="61" cy="35" r="0.7" fill="#0a0a0a" />

      {/* Ojo derecho */}
      <circle cx="69" cy="35" r="3.5" fill="#0a0a0a" />
      <circle cx="69" cy="35" r="1.5" fill="#f0f0f0" />
      <circle cx="70" cy="34" r="0.7" fill="#0a0a0a" />

      {/* ── Sonrisa ───────────────────────────────────────────────────── */}
      <path
        d="M59 42 Q64.5 46 71 42"
        stroke="#0a0a0a"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Antenas ───────────────────────────────────────────────────── */}
      <line x1="61" y1="28" x2="57" y2="18" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="57" cy="17" r="2.2" fill="#00ff88" />

      <line x1="68" y1="27" x2="72" y2="16" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="72" cy="15" r="2.2" fill="#00ff88" />

      {/* ── Patas pequeñas ────────────────────────────────────────────── */}
      <line x1="26" y1="56" x2="23" y2="63" stroke="#00ff88" strokeWidth="1" strokeLinecap="round" />
      <line x1="32" y1="57" x2="32" y2="64" stroke="#00ff88" strokeWidth="1" strokeLinecap="round" />
      <line x1="39" y1="55" x2="37" y2="62" stroke="#00ff88" strokeWidth="1" strokeLinecap="round" />
      <line x1="46" y1="54" x2="47" y2="61" stroke="#00ff88" strokeWidth="1" strokeLinecap="round" />
      <line x1="52" y1="54" x2="54" y2="61" stroke="#00ff88" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
