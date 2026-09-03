import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ⚠️ TEMA ABANDONADO. Esta paleta cálida —marrones, oliva, dorados— no
        // la usa NADIE: cero referencias en app/ y components/, comprobado.
        // Es de una dirección visual anterior que se dejó a medias.
        //
        // No se borra por si estaba ahí a propósito, pero OJO: si escribes
        // `text-marca-texto` te sale crema, y la aplicación va en gris frío
        // (#f1f5f9 / #94a3b8 / #64748b / #22c55e), que es lo que documenta
        // CLAUDE.md y lo que usan los 80 ficheros restantes. Usa esos.
        marca: {
          fondo: "#1a1a12",
          fondoAlt: "#22211a",
          superficie: "#2a2a1e",
          superficie2: "#33322a",
          borde: "#3d3c30",
          verde: "#7ed56f",
          verdeClaro: "#a8e6a1",
          verdeNeon: "#00ff88",
          marron: "#8b6f47",
          marronClaro: "#c4a265",
          dorado: "#f0c040",
          doradoSuave: "#e8d48b",
          crema: "#f5f0e0",
          texto: "#f0ebe0",
          textoSec: "#b0a890",
          textoDim: "#9a9378",
        },
      },
      borderRadius: {
        "xl": "1.5rem",
        "pill": "9999px",
      },
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
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        wiggle: "wiggle 1.2s ease-in-out infinite",
        "wing-flap": "wingFlap 0.6s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
