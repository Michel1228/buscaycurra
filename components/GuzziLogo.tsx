export default function GuzziLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  const s = size;
  const scale = s / 64;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ minWidth: s, minHeight: s }}
    >
      {/* Cuerpo del gusano (verde) */}
      <ellipse cx="32" cy="40" rx="12" ry="14" fill="url(#guzziBody)" />

      {/* Traje (chaqueta oscura sobre el cuerpo) */}
      <path
        d="M22 34 L22 52 Q32 50 42 52 L42 34 Q32 38 22 34Z"
        fill="url(#guzziSuit)"
      />
      {/* Solapa izquierda */}
      <path d="M28 34 L30 44 L26 44Z" fill="#1a1a2e" />
      {/* Solapa derecha */}
      <path d="M36 34 L34 44 L38 44Z" fill="#1a1a2e" />

      {/* Corbata roja */}
      <path
        d="M31 36 L33 36 L34 46 L32 50 L30 46Z"
        fill="#dc2626"
      />

      {/* Camisa blanca (cuello) */}
      <path
        d="M28 33 L32 37 L36 33"
        stroke="#e5e7eb"
        strokeWidth="2"
        fill="none"
      />

      {/* Maletín (brazo derecho) */}
      <rect
        x="38"
        y="41"
        width="9"
        height="7"
        rx="1.5"
        fill="#8B6914"
        stroke="#6B4F12"
        strokeWidth="0.8"
      />
      {/* Asa maletín */}
      <path
        d="M40 41 L40 39 Q42.5 38 45 39 L45 41"
        fill="none"
        stroke="#6B4F12"
        strokeWidth="1.2"
      />
      {/* Detalle maletín */}
      <rect x="41.5" y="43" width="2" height="1.5" rx="0.5" fill="#6B4F12" />

      {/* Cabeza */}
      <circle cx="32" cy="22" r="9" fill="url(#guzziBody)" />

      {/* Ojos */}
      <circle cx="29" cy="21" r="2.2" fill="white" />
      <circle cx="35" cy="21" r="2.2" fill="white" />
      <circle cx="29.5" cy="20.5" r="1.2" fill="#1a1a2e" />
      <circle cx="35.5" cy="20.5" r="1.2" fill="#1a1a2e" />

      {/* Brillo en ojos */}
      <circle cx="30.2" cy="19.8" r="0.5" fill="white" />
      <circle cx="36.2" cy="19.8" r="0.5" fill="white" />

      {/* Sonrisa */}
      <path
        d="M29 25 Q32 28 35 25"
        fill="none"
        stroke="#1a1a2e"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Antenas */}
      <path
        d="M28 14 Q25 8 22 6"
        fill="none"
        stroke="#22c55e"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="22" cy="6" r="1.8" fill="#22c55e" />
      <path
        d="M36 14 Q39 8 42 6"
        fill="none"
        stroke="#22c55e"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="42" cy="6" r="1.8" fill="#22c55e" />

      {/* Gradientes */}
      <defs>
        <linearGradient id="guzziBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="guzziSuit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2d3142" />
          <stop offset="100%" stopColor="#1a1f2e" />
        </linearGradient>
      </defs>
    </svg>
  );
}
