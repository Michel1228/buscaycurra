"use client";

/**
 * components/MariposEspecie.tsx — Mariposa SVG parametrizada por especie
 *
 * Recibe una `Especie` y dibuja una mariposa SVG con los colores reales
 * de esa especie. Hay 6 morfologías de alas asignadas según `especie.id % 6`.
 *
 * Props:
 *   especie   — objeto Especie con colores y metadata
 *   size      — tamaño base en px (width = size * 1.4, height = size)
 *   animated  — activa animación de aleteo suave
 *   className — clase CSS adicional
 */

import { Especie } from "@/lib/especies";

interface MariposEspecieProps {
  especie: Especie;
  size?: number;
  animated?: boolean;
  className?: string;
}

// ─── Paleta de colores de una especie ────────────────────────────────────────

function getColores(especie: Especie) {
  const c = especie.colores;
  return {
    c1: c[0] ?? "#4ade80",
    c2: c[1] ?? c[0] ?? "#00ff88",
    c3: c[2] ?? c[0] ?? "#4ade80",
    c4: c[3] ?? c[1] ?? "#1A1A1A",
  };
}

// ─── Morfología 0: Morpho / Grandes alas redondeadas ─────────────────────────

function MorfologiaMorpho({ c1, c2, c3, c4, uid }: { c1: string; c2: string; c3: string; c4: string; uid: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`m0a-${uid}`} cx="35%" cy="40%" r="65%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} stopOpacity="0.8" />
        </radialGradient>
        <radialGradient id={`m0b-${uid}`} cx="65%" cy="40%" r="65%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} stopOpacity="0.8" />
        </radialGradient>
        <filter id={`glow0-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Alas superiores grandes y redondeadas */}
      <path d="M80 58 C55 25, 5 5, 5 42 C5 65, 42 80, 80 68 Z"
        fill={`url(#m0a-${uid})`} filter={`url(#glow0-${uid})`} />
      <path d="M80 58 C105 25, 155 5, 155 42 C155 65, 118 80, 80 68 Z"
        fill={`url(#m0b-${uid})`} filter={`url(#glow0-${uid})`} />
      {/* Alas inferiores pequeñas */}
      <path d="M80 66 C62 70, 20 78, 24 100 C28 116, 60 112, 80 92 Z"
        fill={`url(#m0a-${uid})`} fillOpacity="0.8" />
      <path d="M80 66 C98 70, 140 78, 136 100 C132 116, 100 112, 80 92 Z"
        fill={`url(#m0b-${uid})`} fillOpacity="0.8" />
      {/* Patrón iridiscente */}
      <path d="M80 62 C60 48 28 28 12 18" stroke={c3} strokeWidth="0.7" strokeOpacity="0.5" fill="none" />
      <path d="M80 62 C100 48 132 28 148 18" stroke={c3} strokeWidth="0.7" strokeOpacity="0.5" fill="none" />
      <ellipse cx="40" cy="42" rx="10" ry="7" fill={c3} fillOpacity="0.15" />
      <ellipse cx="120" cy="42" rx="10" ry="7" fill={c3} fillOpacity="0.15" />
      {/* Cuerpo */}
      <ellipse cx="80" cy="76" rx="4.5" ry="26" fill={c2} />
      <ellipse cx="80" cy="52" rx="5.5" ry="13" fill={c1} />
      <circle cx="80" cy="39" r="6.5" fill={c1} />
      {/* Antenas */}
      <path d="M77 34 C72 22 67 12 64 5" stroke={c2} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="64" cy="4" r="2.5" fill={c2} />
      <path d="M83 34 C88 22 93 12 96 5" stroke={c2} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="96" cy="4" r="2.5" fill={c2} />
      {/* Ojos */}
      <circle cx="77" cy="38" r="2" fill={c4} />
      <circle cx="83" cy="38" r="2" fill={c4} />
    </>
  );
}

// ─── Morfología 1: Cola de Golondrina / Swallowtail ──────────────────────────

function MorfologiaSwallowtail({ c1, c2, c3, c4, uid }: { c1: string; c2: string; c3: string; c4: string; uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`m1a-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
        <linearGradient id={`m1b-${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      {/* Alas superiores */}
      <path d="M80 55 C62 28, 15 8, 12 40 C10 60, 44 75, 80 65 Z"
        fill={`url(#m1a-${uid})`} />
      <path d="M80 55 C98 28, 145 8, 148 40 C150 60, 116 75, 80 65 Z"
        fill={`url(#m1b-${uid})`} />
      {/* Alas inferiores con cola */}
      <path d="M80 63 C60 70, 18 82, 14 105 C10 125, 50 125, 65 100 C68 110, 72 120, 72 130 C76 122, 80 112, 80 100 Z"
        fill={`url(#m1a-${uid})`} fillOpacity="0.9" />
      <path d="M80 63 C100 70, 142 82, 146 105 C150 125, 110 125, 95 100 C92 110, 88 120, 88 130 C84 122, 80 112, 80 100 Z"
        fill={`url(#m1b-${uid})`} fillOpacity="0.9" />
      {/* Detalles de color */}
      <circle cx="28" cy="35" r="6" fill={c3} fillOpacity="0.5" />
      <circle cx="132" cy="35" r="6" fill={c3} fillOpacity="0.5" />
      <circle cx="35" cy="98" r="5" fill={c3} fillOpacity="0.4" />
      <circle cx="125" cy="98" r="5" fill={c3} fillOpacity="0.4" />
      {/* Manchas azules/de color en la cola */}
      <ellipse cx="72" cy="120" rx="4" ry="6" fill={c4} fillOpacity="0.7" />
      <ellipse cx="88" cy="120" rx="4" ry="6" fill={c4} fillOpacity="0.7" />
      {/* Cuerpo */}
      <ellipse cx="80" cy="74" rx="4.5" ry="24" fill={c2} />
      <ellipse cx="80" cy="52" rx="5" ry="12" fill={c1} />
      <circle cx="80" cy="40" r="6" fill={c1} />
      {/* Antenas */}
      <path d="M77 35 C71 23 66 12 63 5" stroke={c2} strokeWidth="1.1" strokeLinecap="round" fill="none" />
      <circle cx="63" cy="4" r="2.2" fill={c2} />
      <path d="M83 35 C89 23 94 12 97 5" stroke={c2} strokeWidth="1.1" strokeLinecap="round" fill="none" />
      <circle cx="97" cy="4" r="2.2" fill={c2} />
      <circle cx="77" cy="39" r="1.8" fill={c4} />
      <circle cx="83" cy="39" r="1.8" fill={c4} />
    </>
  );
}

// ─── Morfología 2: Polilla / Moth triangular ──────────────────────────────────

function MorfologiaMoth({ c1, c2, c3, c4, uid }: { c1: string; c2: string; c3: string; c4: string; uid: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`m2a-${uid}`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor={c3} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c1} />
        </radialGradient>
        <radialGradient id={`m2b-${uid}`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor={c3} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c2} />
        </radialGradient>
      </defs>
      {/* Alas superiores triangulares */}
      <path d="M80 52 C65 35, 20 10, 8 38 C2 55, 28 75, 80 68 Z"
        fill={`url(#m2a-${uid})`} />
      <path d="M80 52 C95 35, 140 10, 152 38 C158 55, 132 75, 80 68 Z"
        fill={`url(#m2b-${uid})`} />
      {/* Alas inferiores amplias */}
      <path d="M80 65 C55 68, 10 75, 8 100 C6 118, 45 122, 80 100 Z"
        fill={c1} fillOpacity="0.85" />
      <path d="M80 65 C105 68, 150 75, 152 100 C154 118, 115 122, 80 100 Z"
        fill={c2} fillOpacity="0.85" />
      {/* "Ojos" en las alas (característico de polillas) */}
      <circle cx="38" cy="48" rx="8" ry="8" fill={c4} fillOpacity="0.6" />
      <circle cx="38" cy="48" rx="4" ry="4" fill={c3} fillOpacity="0.8" />
      <circle cx="122" cy="48" rx="8" ry="8" fill={c4} fillOpacity="0.6" />
      <circle cx="122" cy="48" rx="4" ry="4" fill={c3} fillOpacity="0.8" />
      {/* Patrón en alas inferiores */}
      <ellipse cx="50" cy="90" rx="8" ry="5" fill={c3} fillOpacity="0.3" />
      <ellipse cx="110" cy="90" rx="8" ry="5" fill={c3} fillOpacity="0.3" />
      {/* Cuerpo peludo */}
      <ellipse cx="80" cy="78" rx="6" ry="24" fill={c2} />
      <ellipse cx="80" cy="55" rx="7" ry="14" fill={c1} />
      <ellipse cx="80" cy="40" rx="7" ry="9" fill={c1} />
      {/* Antenas pectinadas (plumosas) */}
      <path d="M76 33 C68 24 60 16 54 8" stroke={c2} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M72 30 C67 23 62 18 56 10" stroke={c3} strokeWidth="0.7" strokeOpacity="0.5" fill="none" />
      <path d="M84 33 C92 24 100 16 106 8" stroke={c2} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M88 30 C93 23 98 18 104 10" stroke={c3} strokeWidth="0.7" strokeOpacity="0.5" fill="none" />
      <circle cx="76" cy="38" r="2" fill={c4} />
      <circle cx="84" cy="38" r="2" fill={c4} />
    </>
  );
}

// ─── Morfología 3: Apollo / Alas redondeadas con manchas ─────────────────────

function MorfologiaApollo({ c1, c2, c3, c4, uid }: { c1: string; c2: string; c3: string; c4: string; uid: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`m3a-${uid}`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.95" />
          <stop offset="100%" stopColor={c2} stopOpacity="0.6" />
        </radialGradient>
        <radialGradient id={`m3b-${uid}`} cx="60%" cy="35%" r="60%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.95" />
          <stop offset="100%" stopColor={c2} stopOpacity="0.6" />
        </radialGradient>
      </defs>
      {/* Alas superiores */}
      <path d="M80 56 C62 32, 18 12, 16 42 C14 62, 46 78, 80 68 Z"
        fill={`url(#m3a-${uid})`} />
      <path d="M80 56 C98 32, 142 12, 144 42 C146 62, 114 78, 80 68 Z"
        fill={`url(#m3b-${uid})`} />
      {/* Alas inferiores redondeadas */}
      <path d="M80 66 C60 70, 16 80, 18 108 C20 124, 58 120, 80 96 Z"
        fill={`url(#m3a-${uid})`} fillOpacity="0.85" />
      <path d="M80 66 C100 70, 144 80, 142 108 C140 124, 102 120, 80 96 Z"
        fill={`url(#m3b-${uid})`} fillOpacity="0.85" />
      {/* Manchas características del Apollo */}
      <circle cx="35" cy="38" r="7" fill={c3} fillOpacity="0.7" />
      <circle cx="35" cy="38" r="3" fill={c1} fillOpacity="0.5" />
      <circle cx="125" cy="38" r="7" fill={c3} fillOpacity="0.7" />
      <circle cx="125" cy="38" r="3" fill={c1} fillOpacity="0.5" />
      <circle cx="38" cy="92" r="9" fill={c4} fillOpacity="0.5" />
      <circle cx="38" cy="92" r="5" fill={c3} fillOpacity="0.7" />
      <circle cx="122" cy="92" r="9" fill={c4} fillOpacity="0.5" />
      <circle cx="122" cy="92" r="5" fill={c3} fillOpacity="0.7" />
      {/* Nervaduras */}
      <path d="M80 60 C65 50 38 34 22 24" stroke={c4} strokeWidth="0.5" strokeOpacity="0.3" fill="none" />
      <path d="M80 60 C95 50 122 34 138 24" stroke={c4} strokeWidth="0.5" strokeOpacity="0.3" fill="none" />
      {/* Cuerpo */}
      <ellipse cx="80" cy="76" rx="5" ry="26" fill={c2} />
      <ellipse cx="80" cy="52" rx="6" ry="13" fill={c1} />
      <circle cx="80" cy="39" r="6.5" fill={c1} />
      {/* Antenas con punta en maza */}
      <path d="M77 34 C72 22 68 12 65 5" stroke={c2} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <ellipse cx="65" cy="4" rx="3" ry="2" fill={c2} />
      <path d="M83 34 C88 22 92 12 95 5" stroke={c2} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <ellipse cx="95" cy="4" rx="3" ry="2" fill={c2} />
      <circle cx="77" cy="38" r="2" fill={c4} />
      <circle cx="83" cy="38" r="2" fill={c4} />
    </>
  );
}

// ─── Morfología 4: Skipper / Alas compactas angulosas ────────────────────────

function MorfologiaSkipper({ c1, c2, c3, c4, uid }: { c1: string; c2: string; c3: string; c4: string; uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`m4a-${uid}`} x1="0%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
        <linearGradient id={`m4b-${uid}`} x1="100%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      {/* Alas superiores angulosas */}
      <path d="M80 58 C68 42, 35 20, 22 38 C12 52, 38 76, 80 68 Z"
        fill={`url(#m4a-${uid})`} />
      <path d="M80 58 C92 42, 125 20, 138 38 C148 52, 122 76, 80 68 Z"
        fill={`url(#m4b-${uid})`} />
      {/* Alas inferiores pequeñas y redondeadas */}
      <path d="M80 66 C65 72, 30 80, 32 100 C34 114, 62 115, 80 96 Z"
        fill={c1} fillOpacity="0.8" />
      <path d="M80 66 C95 72, 130 80, 128 100 C126 114, 98 115, 80 96 Z"
        fill={c2} fillOpacity="0.8" />
      {/* Manchas en las alas */}
      <circle cx="50" cy="42" r="5" fill={c3} fillOpacity="0.6" />
      <circle cx="62" cy="35" r="4" fill={c3} fillOpacity="0.5" />
      <circle cx="110" cy="42" r="5" fill={c3} fillOpacity="0.6" />
      <circle cx="98" cy="35" r="4" fill={c3} fillOpacity="0.5" />
      {/* Cuerpo robusto */}
      <ellipse cx="80" cy="78" rx="5.5" ry="22" fill={c2} />
      <ellipse cx="80" cy="58" rx="6.5" ry="12" fill={c1} />
      <ellipse cx="80" cy="44" rx="6" ry="8" fill={c1} />
      {/* Antenas cortas con punta */}
      <path d="M77 37 C73 28 69 20 67 14" stroke={c2} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <circle cx="67" cy="13" r="3" fill={c3} />
      <path d="M83 37 C87 28 91 20 93 14" stroke={c2} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <circle cx="93" cy="13" r="3" fill={c3} />
      <circle cx="77" cy="41" r="2" fill={c4} />
      <circle cx="83" cy="41" r="2" fill={c4} />
    </>
  );
}

// ─── Morfología 5: Heliconius / Alas alargadas con patrones ──────────────────

function MorfologiaHeliconius({ c1, c2, c3, c4, uid }: { c1: string; c2: string; c3: string; c4: string; uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`m5a-${uid}`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="60%" stopColor={c2} />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
        <filter id={`glow5-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Alas superiores alargadas */}
      <path d="M80 54 C68 35, 25 10, 10 36 C3 52, 30 72, 80 66 Z"
        fill={`url(#m5a-${uid})`} filter={`url(#glow5-${uid})`} />
      <path d="M80 54 C92 35, 135 10, 150 36 C157 52, 130 72, 80 66 Z"
        fill={`url(#m5a-${uid})`} filter={`url(#glow5-${uid})`} />
      {/* Alas inferiores medianas */}
      <path d="M80 64 C62 68, 22 78, 22 102 C22 118, 56 118, 80 98 Z"
        fill={c2} fillOpacity="0.82" />
      <path d="M80 64 C98 68, 138 78, 138 102 C138 118, 104 118, 80 98 Z"
        fill={c2} fillOpacity="0.82" />
      {/* Bandas de color características */}
      <path d="M52 28 Q66 45 66 66" stroke={c3} strokeWidth="8" strokeOpacity="0.6" strokeLinecap="round" fill="none" />
      <path d="M108 28 Q94 45 94 66" stroke={c3} strokeWidth="8" strokeOpacity="0.6" strokeLinecap="round" fill="none" />
      {/* Manchas en extremo de ala */}
      <circle cx="18" cy="38" r="5" fill={c3} fillOpacity="0.7" />
      <circle cx="142" cy="38" r="5" fill={c3} fillOpacity="0.7" />
      {/* Cuerpo */}
      <ellipse cx="80" cy="76" rx="4.5" ry="25" fill={c2} />
      <ellipse cx="80" cy="52" rx="5.5" ry="13" fill={c1} />
      <circle cx="80" cy="39" r="6" fill={c1} />
      {/* Antenas largas y delgadas */}
      <path d="M77 33 C73 20 69 10 66 3" stroke={c1} strokeWidth="1" strokeLinecap="round" fill="none" />
      <circle cx="66" cy="2" r="2.5" fill={c3} />
      <path d="M83 33 C87 20 91 10 94 3" stroke={c1} strokeWidth="1" strokeLinecap="round" fill="none" />
      <circle cx="94" cy="2" r="2.5" fill={c3} />
      <circle cx="77" cy="38" r="1.8" fill={c4} />
      <circle cx="83" cy="38" r="1.8" fill={c4} />
    </>
  );
}

// ─── Selector de morfología ───────────────────────────────────────────────────

const MORFOLOGIAS = [
  MorfologiaMorpho,
  MorfologiaSwallowtail,
  MorfologiaMoth,
  MorfologiaApollo,
  MorfologiaSkipper,
  MorfologiaHeliconius,
];

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function MariposEspecie({
  especie,
  size = 80,
  animated = false,
  className = "",
}: MariposEspecieProps) {
  const { c1, c2, c3, c4 } = getColores(especie);
  const morfIdx = especie.id % MORFOLOGIAS.length;
  const Morfologia = MORFOLOGIAS[morfIdx];
  const uid = `esp${especie.id}`;

  const animStyle = animated
    ? { animation: "wing-flap 0.9s ease-in-out infinite" }
    : {};

  return (
    <svg
      width={size * 1.4}
      height={size * 1.1}
      viewBox="0 0 160 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={animStyle}
      aria-label={`${especie.nombre} — ${especie.nombreCientifico}`}
      role="img"
    >
      <Morfologia c1={c1} c2={c2} c3={c3} c4={c4} uid={uid} />
    </svg>
  );
}
