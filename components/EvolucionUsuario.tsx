"use client";

/**
 * components/EvolucionUsuario.tsx — Sistema de evolución del usuario
 *
 * Fases evolutivas según puntos de progreso (máx 75 pts → 100%):
 *
 * Puntos | %display | Fase
 * -------|----------|---------------------
 *  0     |   0%     | Huevo
 *  10    |  13%     | Oruga pequeña
 *  30    |  40%     | Oruga grande
 *  50    |  67%     | Capullo
 *  60+   |  80%+    | Mariposa emergiendo
 *  75 + trabajo_encontrado → REVELACIÓN (mariposa dorada)
 *
 * Cálculo de puntos:
 *   full_name:          +10
 *   phone:              +10
 *   linkedin_url:       +10
 *   CV subido (cvs):    +20
 *   CVs enviados 1–10:  +10
 *   CVs enviados 11–50: +20
 *   CVs enviados 50+:   +25
 */

interface EvolucionUsuarioProps {
  tieneNombre?: boolean;
  tieneTelefono?: boolean;
  tieneLinkedin?: boolean;
  tieneCv?: boolean;
  cvsEnviados?: number;
  trabajoEncontrado?: boolean;
  compact?: boolean;
}

const PUNTOS_MAX = 75;

function calcularPuntos(props: EvolucionUsuarioProps): number {
  let puntos = 0;
  if (props.tieneNombre)   puntos += 10;
  if (props.tieneTelefono) puntos += 10;
  if (props.tieneLinkedin) puntos += 10;
  if (props.tieneCv)       puntos += 20;
  const enviados = props.cvsEnviados ?? 0;
  if (enviados >= 50)      puntos += 25;
  else if (enviados >= 11) puntos += 20;
  else if (enviados >= 1)  puntos += 10;
  return Math.min(puntos, PUNTOS_MAX);
}

function calcularProgreso(props: EvolucionUsuarioProps): number {
  if (props.trabajoEncontrado) return 100;
  const puntos = calcularPuntos(props);
  return Math.min(Math.round((puntos / PUNTOS_MAX) * 100), 99);
}

interface Fase {
  nombre: string;
  emoji: string;
  mensaje: string;
  color: string;
}

function getFase(progreso: number, trabajoEncontrado: boolean): Fase {
  if (trabajoEncontrado || progreso === 100) {
    return { nombre: "¡Metamorfosis completa!", emoji: "✨", mensaje: "¡Lo conseguiste! Tu mariposa se ha revelado.", color: "#fbbf24" };
  }
  if (progreso >= 76) {
    return { nombre: "Mariposa emergiendo", emoji: "🦋", mensaje: "Ya casi estás. ¡Sigue enviando CVs!", color: "#00ff88" };
  }
  if (progreso >= 56) {
    return { nombre: "Capullo", emoji: "🫘", mensaje: "Preparándote para algo grande.", color: "#00e07a" };
  }
  if (progreso >= 31) {
    return { nombre: "Oruga grande", emoji: "🐛", mensaje: "Cogiendo ritmo. ¡Buen trabajo!", color: "#4ade80" };
  }
  if (progreso >= 11) {
    return { nombre: "Oruga pequeña", emoji: "🐛", mensaje: "Dando tus primeros pasos.", color: "#86efac" };
  }
  return { nombre: "Huevo", emoji: "🥚", mensaje: "Acabas de llegar. ¡Completa tu perfil!", color: "#a0a0a0" };
}

function HuevoSVG({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 60 72" fill="none">
      <defs>
        <radialGradient id="eg" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#c0c0c0" />
          <stop offset="60%" stopColor="#707070" />
          <stop offset="100%" stopColor="#404040" />
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="40" rx="22" ry="30" fill="url(#eg)" />
      <ellipse cx="23" cy="28" rx="6" ry="8" fill="#fff" fillOpacity="0.12" />
    </svg>
  );
}

function OrugaPequenaSVG({ size = 50 }: { size?: number }) {
  return (
    <svg width={size * 1.4} height={size} viewBox="0 0 100 60" fill="none"
      style={{ animation: "worm-wiggle 1.2s ease-in-out infinite" }}>
      <defs>
        <radialGradient id="op" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#6ee7a0" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <circle cx="18" cy="40" r="9" fill="url(#op)" />
      <circle cx="30" cy="36" r="10" fill="url(#op)" />
      <circle cx="44" cy="34" r="10" fill="url(#op)" />
      <circle cx="58" cy="31" r="9.5" fill="url(#op)" />
      <circle cx="71" cy="28" r="11" fill="url(#op)" />
      <circle cx="66" cy="24" r="3" fill="#0a0a0a" /><circle cx="66" cy="24" r="1.3" fill="#f0f0f0" />
      <circle cx="75" cy="23" r="3" fill="#0a0a0a" /><circle cx="75" cy="23" r="1.3" fill="#f0f0f0" />
      <line x1="67" y1="17" x2="63" y2="8" stroke="#4ade80" strokeWidth="1" strokeLinecap="round" />
      <circle cx="63" cy="7" r="1.8" fill="#4ade80" />
      <line x1="74" y1="16" x2="78" y2="7" stroke="#4ade80" strokeWidth="1" strokeLinecap="round" />
      <circle cx="78" cy="6" r="1.8" fill="#4ade80" />
    </svg>
  );
}

function OrugaGrandeSVG({ size = 60 }: { size?: number }) {
  return (
    <svg width={size * 1.6} height={size} viewBox="0 0 120 60" fill="none"
      style={{ animation: "worm-wiggle 1.2s ease-in-out infinite" }}>
      <defs>
        <radialGradient id="og" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="40" r="10" fill="url(#og)" />
      <circle cx="28" cy="36" r="11" fill="url(#og)" />
      <circle cx="42" cy="33" r="11.5" fill="url(#og)" />
      <circle cx="56" cy="31" r="11" fill="url(#og)" />
      <circle cx="70" cy="29" r="11" fill="url(#og)" />
      <circle cx="84" cy="26" r="13" fill="url(#og)" />
      <circle cx="79" cy="22" r="3.5" fill="#0a0a0a" /><circle cx="79" cy="22" r="1.5" fill="#f0f0f0" />
      <circle cx="88" cy="21" r="3.5" fill="#0a0a0a" /><circle cx="88" cy="21" r="1.5" fill="#f0f0f0" />
      <path d="M80 28 Q83.5 31.5 88 28" stroke="#0a0a0a" strokeWidth="1" strokeLinecap="round" fill="none" />
      <line x1="80" y1="14" x2="76" y2="4" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="76" cy="3" r="2" fill="#00ff88" />
      <line x1="87" y1="13" x2="91" y2="3" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="91" cy="2" r="2" fill="#00ff88" />
      {[28, 36, 44, 52, 60].map((x, i) => (
        <line key={i} x1={x} y1="43" x2={x - 2} y2="53" stroke="#00ff88" strokeWidth="1" strokeLinecap="round" />
      ))}
    </svg>
  );
}

function CrisalidaSVG({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.7} viewBox="0 0 60 102" fill="none"
      style={{ animation: "glow-pulse 2s ease-in-out infinite" }}>
      <defs>
        <radialGradient id="cg2" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="55" rx="21" ry="40" fill="url(#cg2)" />
      <ellipse cx="30" cy="55" rx="21" ry="40" fill="none" stroke="#00ff88" strokeWidth="0.8" strokeOpacity="0.6" />
      {[30, 40, 50, 60, 70, 80].map((y, i) => (
        <path key={i} d={`M${16 - i * 0.4} ${y} Q30 ${y - 6} ${44 + i * 0.4} ${y}`}
          stroke="#4ade80" strokeWidth="0.7" strokeOpacity="0.5" fill="none" />
      ))}
      <ellipse cx="24" cy="35" rx="6" ry="4" fill="#f0fff0" fillOpacity="0.2" />
      <path d="M30 15 Q33 8 30 2" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round" fill="none" />
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
      <path d="M65 50 C50 30 20 15 18 42 C16 55 38 66 65 58 Z" fill="url(#mwg1)" fillOpacity="0.8" />
      <path d="M65 50 C80 30 110 15 112 42 C114 55 92 66 65 58 Z" fill="url(#mwg2)" fillOpacity="0.8" />
      <path d="M65 57 C50 60 22 68 26 86 C30 97 55 94 65 78 Z" fill="url(#mwg1)" fillOpacity="0.7" />
      <path d="M65 57 C80 60 108 68 104 86 C100 97 75 94 65 78 Z" fill="url(#mwg2)" fillOpacity="0.7" />
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
      style={{ filter: "drop-shadow(0 0 12px #fbbf24)", animation: "glow-pulse 2s ease-in-out infinite, wing-flap 0.8s ease-in-out infinite" }}>
      <defs>
        <radialGradient id="bwg1" cx="30%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.7" />
        </radialGradient>
        <radialGradient id="bwg2" cx="70%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <path d="M80 60 C60 30, 10 10, 8 45 C6 65, 40 80, 80 70 Z" fill="url(#bwg1)" />
      <path d="M80 60 C100 30, 150 10, 152 45 C154 65, 120 80, 80 70 Z" fill="url(#bwg2)" />
      <path d="M80 68 C60 72, 15 80, 20 105 C24 120, 60 118, 80 95 Z" fill="url(#bwg1)" fillOpacity="0.85" />
      <path d="M80 68 C100 72, 145 80, 140 105 C136 120, 100 118, 80 95 Z" fill="url(#bwg2)" fillOpacity="0.85" />
      {[{cx:35,cy:45},{cx:125,cy:45},{cx:30,cy:90},{cx:130,cy:90}].map((p,i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r="3" fill="#fff" fillOpacity="0.35" />
      ))}
      <ellipse cx="80" cy="78" rx="5" ry="28" fill="#f59e0b" />
      <ellipse cx="80" cy="52" rx="6" ry="14" fill="#fbbf24" />
      <circle cx="80" cy="38" r="7" fill="#fbbf24" />
      <path d="M77 33 C72 22 68 12 65 6" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <circle cx="65" cy="5" r="2.5" fill="#fbbf24" />
      <path d="M83 33 C88 22 92 12 95 6" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <circle cx="95" cy="5" r="2.5" fill="#fbbf24" />
    </svg>
  );
}

export default function EvolucionUsuario(props: EvolucionUsuarioProps) {
  const progreso = calcularProgreso(props);
  const fase = getFase(progreso, props.trabajoEncontrado ?? false);

  if (props.compact) {
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

  const puntos = calcularPuntos(props);

  return (
    <div className="rounded-2xl p-6 border" style={{ backgroundColor: "#0d1f0d", borderColor: "#00ff8830" }}>
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold" style={{ color: "#f0f0f0" }}>Tu evolución</h3>
          <p className="text-sm mt-0.5" style={{ color: "#a0a0a0" }}>{fase.nombre}</p>
        </div>
        <span className="text-3xl font-extrabold" style={{ color: fase.color }}>
          {props.trabajoEncontrado ? "✨" : `${progreso}%`}
        </span>
      </div>

      {/* SVG de la fase */}
      <div className="flex justify-center my-4">
        {progreso <= 10  && <HuevoSVG size={70} />}
        {progreso >= 11 && progreso <= 30 && <OrugaPequenaSVG size={50} />}
        {progreso >= 31 && progreso <= 55 && <OrugaGrandeSVG size={55} />}
        {progreso >= 56 && progreso <= 75 && <CrisalidaSVG size={60} />}
        {progreso >= 76 && progreso <= 99 && <MariposaSemiSVG size={70} />}
        {progreso === 100 && <MariposaSVG size={80} />}
      </div>

      {/* Barra de progreso */}
      <div className="relative mt-4 mb-3">
        <div className="h-3 rounded-full" style={{ backgroundColor: "#1a2e1a" }}>
          <div
            className="h-3 rounded-full transition-all duration-700 animate-progress-glow"
            style={{
              width: `${props.trabajoEncontrado ? 100 : progreso}%`,
              background: props.trabajoEncontrado
                ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                : "linear-gradient(90deg, #00ff88, #4ade80)",
            }}
          />
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 text-sm"
          style={{ left: `calc(${props.trabajoEncontrado ? 100 : progreso}% - 10px)`, transition: "left 0.7s" }}
        >
          {progreso >= 76 || props.trabajoEncontrado ? "🦋" : "🐛"}
        </div>
      </div>

      {/* Texto motivacional */}
      <p className="text-sm text-center mt-4" style={{ color: "#a0a0a0" }}>{fase.mensaje}</p>

      {/* Checklist de puntos */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {[
          { label: "Nombre completo",    ok: props.tieneNombre,                    pts: 10 },
          { label: "Teléfono",           ok: props.tieneTelefono,                  pts: 10 },
          { label: "LinkedIn",           ok: props.tieneLinkedin,                  pts: 10 },
          { label: "CV subido",          ok: props.tieneCv,                        pts: 20 },
          { label: "CVs enviados",       ok: (props.cvsEnviados ?? 0) > 0,         pts: 10 },
          { label: "Trabajo encontrado", ok: props.trabajoEncontrado ?? false,     pts: "🦋" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <span style={{ color: item.ok ? "#00ff88" : "#555" }}>{item.ok ? "✓" : "○"}</span>
            <span style={{ color: item.ok ? "#f0f0f0" : "#555" }}>{item.label}</span>
            <span className="ml-auto" style={{ color: "#a0a0a0" }}>
              {typeof item.pts === "number" ? `+${item.pts}` : item.pts}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-right" style={{ color: "#555" }}>
        {puntos}/{PUNTOS_MAX} pts
      </div>
    </div>
  );
}
