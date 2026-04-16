"use client";

/**
 * components/MariposaSector.tsx — Mariposa personalizada por sector profesional
 *
 * La mariposa es siempre verde (#00ff88 / #4ade80) y elegante.
 * Cada sector añade un detalle sutil SVG integrado en las alas.
 *
 * Props:
 *   sector   — sector profesional (ver lista)
 *   size     — tamaño base en px
 *   animated — activa aleteo suave
 */

interface MariposaSectorProps {
  sector?: string;
  size?: number;
  animated?: boolean;
  className?: string;
}

// ─── Detalles SVG por sector (coordenadas para viewBox 160×128) ───────────────

function DetalleSector({ sector }: { sector: string }) {
  switch (sector?.toLowerCase()) {

    case "tecnologia":
    case "tecnología":
      // Circuito impreso sutil en el ala superior izquierda
      return (
        <g opacity="0.55" stroke="#0a0a0a" strokeWidth="0.9" fill="none">
          <rect x="22" y="30" width="6" height="4" rx="0.5" />
          <line x1="28" y1="32" x2="34" y2="32" />
          <line x1="34" y1="32" x2="34" y2="28" />
          <line x1="34" y1="28" x2="40" y2="28" />
          <line x1="16" y1="32" x2="22" y2="32" />
          <line x1="25" y1="30" x2="25" y2="26" />
          <circle cx="40" cy="28" r="1.5" fill="#0a0a0a" />
          <circle cx="16" cy="32" r="1.5" fill="#0a0a0a" />
        </g>
      );

    case "sanidad":
      // Cruz pequeña en el ala superior izquierda
      return (
        <g opacity="0.6">
          <rect x="26" y="28" width="8" height="2.5" rx="0.8" fill="#0a0a0a" />
          <rect x="29" y="25.5" width="2.5" height="7" rx="0.8" fill="#0a0a0a" />
        </g>
      );

    case "construccion":
    case "construcción":
      // Casco de obra diminuto encima de la cabeza de la mariposa
      return (
        <g opacity="0.65">
          {/* Casco */}
          <ellipse cx="80" cy="22" rx="10" ry="5" fill="#0a0a0a" />
          <path d="M70 24 Q80 30 90 24" fill="#0a0a0a" />
          <rect x="73" y="24" width="14" height="2" rx="0.5" fill="#0a0a0a" />
        </g>
      );

    case "hosteleria":
    case "hostelería":
      // Tenedor y cuchillo mini en el ala izquierda
      return (
        <g opacity="0.55" stroke="#0a0a0a" strokeWidth="0.9" strokeLinecap="round" fill="none">
          {/* Tenedor */}
          <line x1="24" y1="24" x2="24" y2="38" />
          <line x1="22" y1="24" x2="22" y2="29" />
          <line x1="24" y1="24" x2="24" y2="29" />
          <line x1="26" y1="24" x2="26" y2="29" />
          <path d="M22 29 Q24 32 26 29" />
          {/* Cuchillo */}
          <line x1="30" y1="24" x2="30" y2="38" />
          <path d="M30 24 Q34 28 30 32" fill="#0a0a0a" fillOpacity="0.5" />
        </g>
      );

    case "educacion":
    case "educación":
      // Birrete de graduación encima
      return (
        <g opacity="0.6">
          <polygon points="80,16 92,22 80,28 68,22" fill="#0a0a0a" />
          <rect x="86" y="22" width="2" height="7" fill="#0a0a0a" />
          <circle cx="87" cy="30" r="2" fill="#0a0a0a" />
          <line x1="80" y1="22" x2="80" y2="28" stroke="#0a0a0a" strokeWidth="0.8" />
        </g>
      );

    case "finanzas":
      // Símbolo € sutil en el ala izquierda
      return (
        <g opacity="0.55" fill="#0a0a0a" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
          <text x="22" y="40" fontSize="12">€</text>
        </g>
      );

    case "logistica":
    case "logística":
      // Flecha de ruta en el ala izquierda
      return (
        <g opacity="0.55" stroke="#0a0a0a" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 38 Q26 28 34 28 Q34 24 40 28 Q34 32 34 28" />
          <polygon points="40,28 36,25 36,31" fill="#0a0a0a" />
        </g>
      );

    case "comercial":
      // Maletín pequeño en el ala derecha
      return (
        <g opacity="0.55" stroke="#0a0a0a" strokeWidth="0.9" fill="none">
          <rect x="114" y="30" width="12" height="9" rx="1.5" />
          <path d="M117 30 L117 27 Q120 25 123 27 L123 30" />
          <line x1="120" y1="30" x2="120" y2="39" />
          <line x1="114" y1="34" x2="126" y2="34" />
        </g>
      );

    default:
      // Mariposa estándar sin detalle
      return null;
  }
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function MariposaSector({
  sector = "otros",
  size = 80,
  animated = false,
  className = "",
}: MariposaSectorProps) {
  const animStyle = animated
    ? { animation: "wing-flap 0.8s ease-in-out infinite" }
    : {};

  return (
    <svg
      width={size * 1.4}
      height={size}
      viewBox="0 0 160 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={animStyle}
      aria-label={`Mariposa sector ${sector}`}
      role="img"
    >
      <defs>
        <radialGradient id={`wg1-${sector}`} cx="30%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0.75" />
        </radialGradient>
        <radialGradient id={`wg2-${sector}`} cx="70%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0.75" />
        </radialGradient>
        <filter id={`glow-${sector}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Alas superiores ────────────────────────────────────────── */}
      <path
        d="M80 60 C60 30, 10 10, 8 45 C6 65, 40 80, 80 70 Z"
        fill={`url(#wg1-${sector})`}
        filter={`url(#glow-${sector})`}
      />
      <path
        d="M80 60 C100 30, 150 10, 152 45 C154 65, 120 80, 80 70 Z"
        fill={`url(#wg2-${sector})`}
        filter={`url(#glow-${sector})`}
      />

      {/* ── Alas inferiores ────────────────────────────────────────── */}
      <path
        d="M80 68 C60 72, 15 80, 20 105 C24 120, 60 118, 80 95 Z"
        fill={`url(#wg1-${sector})`}
        filter={`url(#glow-${sector})`}
        fillOpacity="0.85"
      />
      <path
        d="M80 68 C100 72, 145 80, 140 105 C136 120, 100 118, 80 95 Z"
        fill={`url(#wg2-${sector})`}
        filter={`url(#glow-${sector})`}
        fillOpacity="0.85"
      />

      {/* ── Nervaduras sutiles ─────────────────────────────────────── */}
      <path d="M80 62 C65 50 30 30 20 22" stroke="#f0f0f0" strokeWidth="0.6" strokeOpacity="0.25" fill="none" />
      <path d="M80 62 C115 50 130 30 140 22" stroke="#f0f0f0" strokeWidth="0.6" strokeOpacity="0.25" fill="none" />

      {/* ── Detalle sector ─────────────────────────────────────────── */}
      <DetalleSector sector={sector} />

      {/* ── Cuerpo ────────────────────────────────────────────────── */}
      <ellipse cx="80" cy="78" rx="5" ry="28" fill="#00ff88" />
      <ellipse cx="80" cy="52" rx="6" ry="14" fill="#4ade80" />

      {/* ── Cabeza ────────────────────────────────────────────────── */}
      <circle cx="80" cy="38" r="7" fill="#4ade80" />

      {/* ── Antenas ───────────────────────────────────────────────── */}
      <path d="M77 33 C72 22 68 12 65 6" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="65" cy="5" r="2.5" fill="#00ff88" />
      <path d="M83 33 C88 22 92 12 95 6" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="95" cy="5" r="2.5" fill="#00ff88" />
    </svg>
  );
}
