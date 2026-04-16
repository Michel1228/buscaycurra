// tailwind.config.ts — Configuración de Tailwind CSS para BuscayCurra
// Colores de marca: azul #2563EB y naranja #F97316

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
      // Colores personalizados de la marca
      colors: {
        marca: {
          azul: "#2563EB",
          naranja: "#F97316",
        },
      },
    },
  },
  plugins: [],
};

export default config;
