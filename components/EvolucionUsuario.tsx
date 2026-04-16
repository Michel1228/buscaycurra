"use client";

/**
 * components/EvolucionUsuario.tsx — Sistema de evolución del usuario
 *
 * Muestra la fase evolutiva del usuario (Huevo → Oruga → Crisálida →
 * Mariposa emergiendo → Mariposa completa) en función de su progreso.
 *
 * Props:
 *   tieneFoto       — tiene foto de perfil (+15)
 *   tieneNombre     — tiene nombre completo (+10)
 *   tieneTelefono   — tiene teléfono (+10)
 *   tieneLinkedin   — tiene URL de LinkedIn (+10)
 *   tieneCv         — tiene CV subido (+20)
 *   cvsEnviados     — número de CVs enviados (1-10 → +10, 11-50 → +20, 50+ → +25)
 *   compact         — versión compacta para la Navbar
 */

interface EvolucionUsuarioProps {
  tieneFoto?: boolean;
  tieneNombre?: boolean;
  tieneTelefono?: boolean;
  tieneLinkedin?: boolean;
  tieneCv?: boolean;
  cvsEnviados?: number;
  compact?: boolean;
}

// ─── Cálculo del progreso ─────────────────────────────────────────────────────

function calcularProgreso(props: EvolucionUsuarioProps): number {
  let puntos = 0;
  if (props.tieneFoto)     puntos += 15;
  if (props.tieneNombre)   puntos += 10;
  if (props.tieneTelefono) puntos += 10;
  if (props.tieneLinkedin) puntos += 10;
  if (props.tieneCv)       puntos += 20;
  const enviados = props.cvsEnviados ?? 0;
  if (enviados >= 50)      puntos += 25;
  else if (enviados >= 11) puntos += 20;
  else if (enviados >= 1)  puntos += 10;
  return Math.min(puntos, 100);
}

// ─── Fases evolutivas ─────────────────────────────────────────────────────────

interface Fase {
  nombre: string;
  emoji: string;
  rango: [number, number];
  mensaje: string;
  color: string;
}

const FASES: Fase[] = [
  { nombre: "Huevo",               emoji: "🥚", rango: [0, 25],   mensaje: "¡Tu aventura laboral está a punto de comenzar!", color: "#a0a0a0" },
  { nombre: "Oruga",               emoji: "🐛", rango: [26, 50],  mensaje: "Estás creciendo. ¡Completa tu perfil y avanza!", color: "#4ade80" },
  { nombre: "Crisálida",           emoji: "🫘", rango: [51, 75],  mensaje: "En transformación. ¡El trabajo soñado se acerca!", color: "#00ff88" },
  { nombre: "Mariposa emergiendo", emoji: "🦋", rango: [76, 99],  mensaje: "¡Casi lista tu metamorfosis! Sigue enviando CVs.", color: "#00ff88" },
  { nombre: "Mariposa completa",   emoji: "✨", rango: [100, 100], mensaje: "¡Metamorfosis completa! Eres un profesional imparable.", color: "#00ff88" },
];

function getFase(progreso: number): Fase {
  return FASES.find(f => progreso >= f.rango[0] && progreso <= f.rango[1]) ?? FASES[0];
}

// ─── SVGs por fase ────────────────────────────────────────────────────────────

function HuevoSVG({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 60 72" fill="none">
      <defs>
        <radialGradient id="eg" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#a0a0a0" />
          <stop offset="100%" stopColor="#555" />
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="40" rx="22" ry="30" fill="url(#eg)" />
      <ellipse cx="24" cy="30" rx="5" ry="7" fill="#fff" fillOpacity="0.15" />
    </svg>
  );
}

function OrugaSVG({ size = 60 }: { size?: number }) {
  const scale = size / 80;
  return (
    <svg width={size * 1.5} height={size} viewBox="0 0 120 60" fill="none"
      style={{ animation: "worm-wiggle 1.2s ease-in-out infinite" }}>
      <defs>
        <radialGradient id="og" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="38" r={10 * scale * 2.5} fill="url(#og)" />
      <circle cx="34" cy="34" r={11 * scale * 2.5} fill="url(#og)" />
      <circle cx="50" cy="32" r={11.5 * scale * 2.5} fill="url(#og)" />
      <circle cx="66" cy="31" r={11 * scale * 2.5} fill="url(#og)" />
      <circle cx="82" cy="28" r={13 * scale * 2.5} fill="url(#og)" />
      <circle cx="77" cy="24" r="3.5" fill="#0a0a0a" />
      <circle cx="77" cy="24" r="1.5" fill="#f0f0f0" />
      <circle cx="86" cy="23" r="3.5" fill="#0a0a0a" />
      <circle cx="86" cy="23" r="1.5" fill="#f0f0f0" />
      <line x1="78" y1="16" x2="74" y2="6" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="74" cy="5" r="2" fill="#00ff88" />
      <line x1="85" y1="15" x2="89" y2="4" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="89" cy="3" r="2" fill="#00ff88" />
    </svg>
  );
}

function CrisalidaSVG({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 60 96" fill="none"
      style={{ animation: "glow-pulse 2s ease-in-out infinite" }}>
      <defs>
        <radialGradient id="cg2" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="52" rx="20" ry="38" fill="url(#cg2)" />
      <ellipse cx="30" cy="52" rx="20" ry="38" fill="none" stroke="#00ff88" strokeWidth="0.8" strokeOpacity="0.6" />
      {[24, 34, 44, 54, 64, 74].map((y, i) => (
        <path key={i}
          d={`M${18 - i * 0.3} ${y} Q30 ${y - 6} ${42 + i * 0.3} ${y}`}
          stroke="#4ade80" strokeWidth="0.7" strokeOpacity="0.5" fill="none"
        />
      ))}
      <ellipse cx="24" cy="30" rx="6" ry="4" fill="#f0fff0" fillOpacity="0.2" />
      <path d="M30 14 Q33 8 30 2" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function MariposaSemiSVG({ size = 70 }: { size?: number }) {
  return (
    <svg width={size * 1.3} height={size} viewBox="0 0 130 100" fill="none"
      style={{ animation: "wing-flap 1s ease-in-out infinite" }}>
      <defs>
        <radialGradient id="mwg1" cx="30%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0.7" />
        </radialGradient>
        <radialGradient id="mwg2" cx="70%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      {/* Alas medio abiertas */}
      <path d="M65 50 C50 30 20 15 18 42 C16 55 38 66 65 58 Z" fill="url(#mwg1)" fillOpacity="0.8" />
      <path d="M65 50 C80 30 110 15 112 42 C114 55 92 66 65 58 Z" fill="url(#mwg2)" fillOpacity="0.8" />
      <path d="M65 57 C50 60 22 68 26 86 C30 97 55 94 65 78 Z" fill="url(#mwg1)" fillOpacity="0.7" />
      <path d="M65 57 C80 60 108 68 104 86 C100 97 75 94 65 78 Z" fill="url(#mwg2)" fillOpacity="0.7" />
      {/* Cuerpo */}
      <ellipse cx="65" cy="65" rx="4" ry="22" fill="#00ff88" />
      <ellipse cx="65" cy="44" rx="5" ry="11" fill="#4ade80" />
      <circle cx="65" cy="33" r="6" fill="#4ade80" />
      <path d="M62 28 C58 18 55 10 52 4" stroke="#00ff88" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
      <circle cx="52" cy="3" r="2" fill="#00ff88" />
      <path d="M68 28 C72 18 75 10 78 4" stroke="#00ff88" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
      <circle cx="78" cy="3" r="2" fill="#00ff88" />
    </svg>
  );
}

function MariposaSVG({ size = 80 }: { size?: number }) {
  return (
    <svg width={size * 1.4} height={size} viewBox="0 0 160 128" fill="none"
      style={{ filter: "drop-shadow(0 0 10px #00ff88)", animation: "glow-pulse 2s ease-in-out infinite, wing-flap 0.8s ease-in-out infinite" }}>
      <defs>
        <radialGradient id="bwg1" cx="30%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0.7" />
        </radialGradient>
        <radialGradient id="bwg2" cx="70%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0.7" />
        </radialGradient>
        <filter id="bwglow">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d="M80 60 C60 30, 10 10, 8 45 C6 65, 40 80, 80 70 Z" fill="url(#bwg1)" filter="url(#bwglow)" />
      <path d="M80 60 C100 30, 150 10, 152 45 C154 65, 120 80, 80 70 Z" fill="url(#bwg2)" filter="url(#bwglow)" />
      <path d="M80 68 C60 72, 15 80, 20 105 C24 120, 60 118, 80 95 Z" fill="url(#bwg1)" filter="url(#bwglow)" fillOpacity="0.85" />
      <path d="M80 68 C100 72, 145 80, 140 105 C136 120, 100 118, 80 95 Z" fill="url(#bwg2)" filter="url(#bwglow)" fillOpacity="0.85" />
      {/* Brillos en las alas */}
      {[{cx:35,cy:45},{cx:125,cy:45},{cx:30,cy:90},{cx:130,cy:90}].map((p,i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r="3" fill="#fff" fillOpacity="0.35" />
      ))}
      <ellipse cx="80" cy="78" rx="5" ry="28" fill="#00ff88" />
      <ellipse cx="80" cy="52" rx="6" ry="14" fill="#4ade80" />
      <circle cx="80" cy="38" r="7" fill="#4ade80" />
      <path d="M77 33 C72 22 68 12 65 6" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <circle cx="65" cy="5" r="2.5" fill="#00ff88" />
      <path d="M83 33 C88 22 92 12 95 6" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <circle cx="95" cy="5" r="2.5" fill="#00ff88" />
    </svg>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function EvolucionUsuario(props: EvolucionUsuarioProps) {
  const progreso = calcularProgreso(props);
  const fase = getFase(progreso);

  if (props.compact) {
    // Versión compacta para la Navbar: solo el emoji y el nombre de fase
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xl" title={`Fase: ${fase.nombre} (${progreso}%)`}>
          {fase.emoji}
        </span>
        <span className="hidden sm:block text-xs font-medium" style={{ color: fase.color }}>
          {fase.nombre}
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6 border"
      style={{
        backgroundColor: "#0d1f0d",
        borderColor: "#00ff8830",
      }}
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold" style={{ color: "#f0f0f0" }}>
            Tu evolución
          </h3>
          <p className="text-sm mt-0.5" style={{ color: "#a0a0a0" }}>
            {fase.nombre}
          </p>
        </div>
        <span className="text-3xl font-extrabold" style={{ color: "#00ff88" }}>
          {progreso}%
        </span>
      </div>

      {/* SVG de la fase */}
      <div className="flex justify-center my-4">
        {progreso <= 25  && <HuevoSVG size={70} />}
        {progreso >= 26 && progreso <= 50  && <OrugaSVG size={50} />}
        {progreso >= 51 && progreso <= 75  && <CrisalidaSVG size={60} />}
        {progreso >= 76 && progreso <= 99  && <MariposaSemiSVG size={70} />}
        {progreso === 100 && <MariposaSVG size={80} />}
      </div>

      {/* Barra de progreso estilo hoja */}
      <div className="relative mt-4 mb-3">
        <div className="h-3 rounded-full" style={{ backgroundColor: "#1a2e1a" }}>
          <div
            className="h-3 rounded-full transition-all duration-700 animate-progress-glow"
            style={{
              width: `${progreso}%`,
              background: "linear-gradient(90deg, #00ff88, #4ade80)",
            }}
          />
        </div>
        {/* Gusano que corre sobre la barra */}
        <div
          className="absolute top-1/2 -translate-y-1/2 text-sm"
          style={{ left: `calc(${progreso}% - 10px)`, transition: "left 0.7s" }}
        >
          {progreso < 76 ? "🐛" : "🦋"}
        </div>
      </div>

      {/* Texto motivacional */}
      <p className="text-sm text-center mt-4" style={{ color: "#a0a0a0" }}>
        {fase.mensaje}
      </p>

      {/* Checklist de puntos */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {[
          { label: "Foto de perfil",   ok: props.tieneFoto,      pts: 15 },
          { label: "Nombre completo",  ok: props.tieneNombre,    pts: 10 },
          { label: "Teléfono",         ok: props.tieneTelefono,  pts: 10 },
          { label: "LinkedIn",         ok: props.tieneLinkedin,  pts: 10 },
          { label: "CV subido",        ok: props.tieneCv,        pts: 20 },
          { label: "CVs enviados",     ok: (props.cvsEnviados ?? 0) > 0, pts: 10 },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <span style={{ color: item.ok ? "#00ff88" : "#555" }}>
              {item.ok ? "✓" : "○"}
            </span>
            <span style={{ color: item.ok ? "#f0f0f0" : "#555" }}>
              {item.label}
            </span>
            <span className="ml-auto" style={{ color: "#a0a0a0" }}>
              +{item.pts}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
