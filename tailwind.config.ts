// tailwind.config.ts — Configuración de Tailwind CSS para BuscayCurra
// Paleta "La Metamorfosis": verde neón sobre negro

import type { Config } from "tailwindcss";

const config: Config = {
  // Rutas donde Tailwind buscará clases CSS usadas
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Colores personalizados de la marca — paleta metamorfosis
      colors: {
        marca: {
          // Paleta original (mantenida por compatibilidad)
          azul: "#2563EB",
          naranja: "#F97316",
          // Nueva paleta metamorfosis
          fondo: "#0a0a0a",
          neon: "#00ff88",
          verde: "#4ade80",
          superficie: "#0d1f0d",
          texto: "#f0f0f0",
          textoSec: "#a0a0a0",
        },
      },
      // Animaciones personalizadas
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(-3px) rotate(2deg)" },
          "75%": { transform: "translateY(3px) rotate(-2deg)" },
        },
        wingFlap: {
          "0%, 100%": { transform: "scaleX(1)" },
          "50%": { transform: "scaleX(0.4)" },
        },
        neonPulse: {
          "0%, 100%": { textShadow: "0 0 8px #00ff88, 0 0 20px #00ff88" },
          "50%": { textShadow: "0 0 20px #00ff88, 0 0 50px #00ff88, 0 0 80px #00ff88" },
        },
      },
      animation: {
        wiggle: "wiggle 1.2s ease-in-out infinite",
        "wing-flap": "wingFlap 0.6s ease-in-out infinite",
        "neon-pulse": "neonPulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
