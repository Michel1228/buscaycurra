"use client";

/**
 * AvatarMariposa — Avatares de mariposas con profesiones
 * Cada mariposa tiene cuerpo, alas, bracitos, piernitas y accesorios del trabajo
 * + opción "sube tu foto"
 */

import { useState } from "react";

export interface MariposaAvatar {
  id: string;
  nombre: string;
  profesion: string;
  emoji: string;
  // Colores: alas, cuerpo, accesorio
  alasColor: string;
  cuerpoColor: string;
  accesorioColor: string;
  // Detalles especiales
  accesorio?: string;
  tatuajes?: boolean;
  especial?: string;
}

export const MARIPOSAS_AVATARES: MariposaAvatar[] = [
  {
    id: "camarero", nombre: "Marip-Camarero", profesion: "Hostelería",
    emoji: "🍽️", alasColor: "#7ed56f", cuerpoColor: "#8b6f47", accesorioColor: "#f5f0e0",
    accesorio: "bandeja", especial: "Delantal y bandeja"
  },
  {
    id: "enfermera", nombre: "Marip-Enfermera", profesion: "Sanidad",
    emoji: "💉", alasColor: "#60d0e0", cuerpoColor: "#f0ebe0", accesorioColor: "#ff4040",
    accesorio: "cofia", especial: "Uniforme blanco y cruz roja"
  },
  {
    id: "albañil", nombre: "Marip-Albañil", profesion: "Construcción",
    emoji: "🔨", alasColor: "#f0c040", cuerpoColor: "#c4a265", accesorioColor: "#f0c040",
    accesorio: "casco", tatuajes: true, especial: "Fortachón con tatuajes y casco"
  },
  {
    id: "programador", nombre: "Marip-Dev", profesion: "Tecnología",
    emoji: "💻", alasColor: "#a070d0", cuerpoColor: "#2a2a1e", accesorioColor: "#00ff88",
    accesorio: "gafas", especial: "Gafas y portátil"
  },
  {
    id: "cocinero", nombre: "Marip-Chef", profesion: "Cocina",
    emoji: "👨‍🍳", alasColor: "#ff8040", cuerpoColor: "#f5f0e0", accesorioColor: "#f5f0e0",
    accesorio: "gorro_chef", especial: "Gorro de chef y espátula"
  },
  {
    id: "mecanico", nombre: "Marip-Mecánico", profesion: "Automoción",
    emoji: "🔧", alasColor: "#708090", cuerpoColor: "#333", accesorioColor: "#c0c0c0",
    accesorio: "llave", tatuajes: true, especial: "Mono manchado de grasa, tatuajes"
  },
  {
    id: "profesora", nombre: "Marip-Profe", profesion: "Educación",
    emoji: "📚", alasColor: "#e07850", cuerpoColor: "#f5f0e0", accesorioColor: "#8b4513",
    accesorio: "libro", especial: "Gafas redondas y libro"
  },
  {
    id: "repartidor", nombre: "Marip-Rider", profesion: "Logística",
    emoji: "📦", alasColor: "#40c060", cuerpoColor: "#2a2a1e", accesorioColor: "#ff6600",
    accesorio: "mochila", especial: "Mochila de reparto y casco"
  },
  {
    id: "peluquera", nombre: "Marip-Estilista", profesion: "Belleza",
    emoji: "💇", alasColor: "#ff69b4", cuerpoColor: "#f5f0e0", accesorioColor: "#c0c0c0",
    accesorio: "tijeras", especial: "Tijeras y peine, pelo colorido"
  },
  {
    id: "electricista", nombre: "Marip-Electri", profesion: "Electricidad",
    emoji: "⚡", alasColor: "#ffd700", cuerpoColor: "#4169e1", accesorioColor: "#ffd700",
    accesorio: "rayo", especial: "Cinturón de herramientas"
  },
  {
    id: "vendedor", nombre: "Marip-Ventas", profesion: "Comercio",
    emoji: "🛒", alasColor: "#20b2aa", cuerpoColor: "#2a2a1e", accesorioColor: "#f0c040",
    accesorio: "corbata", especial: "Corbata y maletín"
  },
  {
    id: "limpieza", nombre: "Marip-Clean", profesion: "Limpieza",
    emoji: "🧹", alasColor: "#87ceeb", cuerpoColor: "#4682b4", accesorioColor: "#f5f0e0",
    accesorio: "escoba", especial: "Uniforme azul y escoba"
  },
  {
    id: "seguridad", nombre: "Marip-Guard", profesion: "Seguridad",
    emoji: "🛡️", alasColor: "#2f2f2f", cuerpoColor: "#1a1a1a", accesorioColor: "#c0c0c0",
    accesorio: "placa", tatuajes: true, especial: "Gafas de sol, placa, fortachón"
  },
  {
    id: "agricultor", nombre: "Marip-Campo", profesion: "Agricultura",
    emoji: "🌾", alasColor: "#8fbc8f", cuerpoColor: "#8b6f47", accesorioColor: "#deb887",
    accesorio: "sombrero", especial: "Sombrero de paja y azada"
  },
  {
    id: "fitness", nombre: "Marip-Gym", profesion: "Deporte/Fitness",
    emoji: "💪", alasColor: "#ff4500", cuerpoColor: "#d2691e", accesorioColor: "#c0c0c0",
    accesorio: "pesas", tatuajes: true, especial: "Musculoso con tatuajes tribales, pesas"
  },
  {
    id: "DJ", nombre: "Marip-DJ", profesion: "Música/Ocio",
    emoji: "🎧", alasColor: "#9400d3", cuerpoColor: "#1a1a1a", accesorioColor: "#00ff88",
    accesorio: "auriculares", especial: "Auriculares LED, gafas neón"
  },
];

/** Renderiza una mariposa SVG con cuerpo y accesorios */
function MariposaBody({ m, size = 80, selected = false }: { m: MariposaAvatar; size?: number; selected?: boolean }) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="transition-transform hover:scale-110"
      style={{ filter: selected ? `drop-shadow(0 0 8px ${m.alasColor}80)` : "none" }}>
      
      {/* Alas traseras (más grandes) */}
      <ellipse cx={cx - s*0.22} cy={cy - s*0.05} rx={s*0.22} ry={s*0.28}
        fill={m.alasColor} opacity="0.6" transform={`rotate(-15 ${cx - s*0.22} ${cy - s*0.05})`}>
        <animateTransform attributeName="transform" type="rotate"
          values={`-15 ${cx - s*0.22} ${cy - s*0.05}; -20 ${cx - s*0.22} ${cy - s*0.05}; -15 ${cx - s*0.22} ${cy - s*0.05}`}
          dur="2s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx={cx + s*0.22} cy={cy - s*0.05} rx={s*0.22} ry={s*0.28}
        fill={m.alasColor} opacity="0.6" transform={`rotate(15 ${cx + s*0.22} ${cy - s*0.05})`}>
        <animateTransform attributeName="transform" type="rotate"
          values={`15 ${cx + s*0.22} ${cy - s*0.05}; 20 ${cx + s*0.22} ${cy - s*0.05}; 15 ${cx + s*0.22} ${cy - s*0.05}`}
          dur="2s" repeatCount="indefinite" />
      </ellipse>

      {/* Alas delanteras (más pequeñas, más brillantes) */}
      <ellipse cx={cx - s*0.18} cy={cy + s*0.05} rx={s*0.15} ry={s*0.2}
        fill={m.alasColor} opacity="0.8" transform={`rotate(-10 ${cx - s*0.18} ${cy + s*0.05})`} />
      <ellipse cx={cx + s*0.18} cy={cy + s*0.05} rx={s*0.15} ry={s*0.2}
        fill={m.alasColor} opacity="0.8" transform={`rotate(10 ${cx + s*0.18} ${cy + s*0.05})`} />

      {/* Cuerpo (tórax) */}
      <ellipse cx={cx} cy={cy} rx={s*0.08} ry={s*0.18} fill={m.cuerpoColor} />
      
      {/* Cabeza */}
      <circle cx={cx} cy={cy - s*0.22} r={s*0.09} fill={m.cuerpoColor} />
      
      {/* Ojos */}
      <circle cx={cx - s*0.04} cy={cy - s*0.24} r={s*0.025} fill="#f0ebe0" />
      <circle cx={cx + s*0.04} cy={cy - s*0.24} r={s*0.025} fill="#f0ebe0" />
      <circle cx={cx - s*0.035} cy={cy - s*0.24} r={s*0.012} fill="#1a1a12" />
      <circle cx={cx + s*0.045} cy={cy - s*0.24} r={s*0.012} fill="#1a1a12" />

      {/* Sonrisa */}
      <path d={`M${cx - s*0.03} ${cy - s*0.19} Q${cx} ${cy - s*0.16} ${cx + s*0.03} ${cy - s*0.19}`}
        stroke="#1a1a12" strokeWidth="1" fill="none" />

      {/* Antenas */}
      <line x1={cx - s*0.03} y1={cy - s*0.3} x2={cx - s*0.1} y2={cy - s*0.38}
        stroke={m.alasColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1={cx + s*0.03} y1={cy - s*0.3} x2={cx + s*0.1} y2={cy - s*0.38}
        stroke={m.alasColor} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={cx - s*0.1} cy={cy - s*0.38} r={s*0.02} fill={m.alasColor} />
      <circle cx={cx + s*0.1} cy={cy - s*0.38} r={s*0.02} fill={m.alasColor} />

      {/* Bracitos */}
      <line x1={cx - s*0.07} y1={cy - s*0.05} x2={cx - s*0.16} y2={cy + s*0.02}
        stroke={m.cuerpoColor} strokeWidth="2" strokeLinecap="round" />
      <line x1={cx + s*0.07} y1={cy - s*0.05} x2={cx + s*0.16} y2={cy + s*0.02}
        stroke={m.cuerpoColor} strokeWidth="2" strokeLinecap="round" />

      {/* Piernitas */}
      <line x1={cx - s*0.04} y1={cy + s*0.16} x2={cx - s*0.08} y2={cy + s*0.28}
        stroke={m.cuerpoColor} strokeWidth="2" strokeLinecap="round" />
      <line x1={cx + s*0.04} y1={cy + s*0.16} x2={cx + s*0.08} y2={cy + s*0.28}
        stroke={m.cuerpoColor} strokeWidth="2" strokeLinecap="round" />

      {/* Tatuajes (líneas tribales en las alas) */}
      {m.tatuajes && (
        <>
          <path d={`M${cx - s*0.25} ${cy - s*0.15} Q${cx - s*0.2} ${cy - s*0.05} ${cx - s*0.15} ${cy + s*0.05}`}
            stroke="#1a1a1280" strokeWidth="1.5" fill="none" />
          <path d={`M${cx + s*0.25} ${cy - s*0.15} Q${cx + s*0.2} ${cy - s*0.05} ${cx + s*0.15} ${cy + s*0.05}`}
            stroke="#1a1a1280" strokeWidth="1.5" fill="none" />
          <path d={`M${cx - s*0.22} ${cy - s*0.1} L${cx - s*0.18} ${cy - s*0.02}`}
            stroke="#1a1a1240" strokeWidth="1" fill="none" />
          <path d={`M${cx + s*0.22} ${cy - s*0.1} L${cx + s*0.18} ${cy - s*0.02}`}
            stroke="#1a1a1240" strokeWidth="1" fill="none" />
        </>
      )}

      {/* Accesorio emoji */}
      <text x={cx + s*0.2} y={cy + s*0.05} fontSize={s*0.15} textAnchor="middle">{m.emoji}</text>
    </svg>
  );
}

interface Props {
  selected: string | null;
  onSelect: (id: string | null) => void;
  onUploadPhoto?: () => void;
  fotoUrl?: string | null;
}

export default function AvatarMariposa({ selected, onSelect, onUploadPhoto, fotoUrl }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const hovered = MARIPOSAS_AVATARES.find(m => m.id === hoverId);

  return (
    <div className="space-y-3">
      {/* Info del hover */}
      <div className="h-10 flex items-center justify-center">
        {hovered ? (
          <div className="text-center">
            <p className="text-xs font-bold" style={{ color: hovered.alasColor }}>{hovered.nombre}</p>
            <p className="text-[10px]" style={{ color: "#706a58" }}>{hovered.especial}</p>
          </div>
        ) : (
          <p className="text-xs" style={{ color: "#504a3a" }}>Elige tu mariposa o sube tu foto</p>
        )}
      </div>

      {/* Grid de mariposas */}
      <div className="grid grid-cols-4 gap-2">
        {MARIPOSAS_AVATARES.map(m => (
          <button key={m.id} type="button"
            onClick={() => onSelect(m.id)}
            onMouseEnter={() => setHoverId(m.id)}
            onMouseLeave={() => setHoverId(null)}
            className="flex flex-col items-center gap-1 p-1.5 rounded-xl transition"
            style={{
              background: selected === m.id ? `${m.alasColor}15` : "transparent",
              border: selected === m.id ? `2px solid ${m.alasColor}40` : "2px solid transparent",
            }}>
            <MariposaBody m={m} size={56} selected={selected === m.id} />
            <span className="text-[9px] font-medium truncate w-full text-center"
              style={{ color: selected === m.id ? m.alasColor : "#706a58" }}>
              {m.profesion}
            </span>
          </button>
        ))}

        {/* Botón subir foto */}
        <button type="button" onClick={onUploadPhoto}
          className="flex flex-col items-center gap-1 p-1.5 rounded-xl transition hover:opacity-80"
          style={{
            background: fotoUrl ? "rgba(126,213,111,0.1)" : "rgba(42,42,30,0.5)",
            border: fotoUrl ? "2px solid rgba(126,213,111,0.3)" : "2px dashed #3d3c30",
          }}>
          {fotoUrl ? (
            <img src={fotoUrl} alt="Tu foto" className="w-14 h-14 rounded-xl object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📷</span>
            </div>
          )}
          <span className="text-[9px] font-medium" style={{ color: fotoUrl ? "#7ed56f" : "#706a58" }}>
            {fotoUrl ? "Tu foto" : "Subir foto"}
          </span>
        </button>
      </div>
    </div>
  );
}
