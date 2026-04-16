// postcss.config.mjs — Configuración de PostCSS para procesar Tailwind CSS

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
