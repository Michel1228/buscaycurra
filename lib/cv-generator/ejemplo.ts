/**
 * lib/cv-generator/ejemplo.ts — CV de ejemplo para las miniaturas del selector
 *
 * Datos de muestra realistas y bien rellenos. Se renderizan con CADA plantilla
 * (mismo dato, distinto estilo) para que el usuario vea cómo queda antes de elegir.
 * La foto es un avatar SVG embebido en base64: cero llamadas externas, nunca se rompe
 * y pasa el escapeHtml de las plantillas sin alterarse (base64 no lleva < > " ' &).
 */
import type { CVData } from "./cv-template";

const AVATAR_EJEMPLO =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2RjZmNlNyIvPjxjaXJjbGUgY3g9IjgwIiBjeT0iNjAiIHI9IjMwIiBmaWxsPSIjMTZhMzRhIi8+PHBhdGggZD0iTTI2IDE1MmMwLTMxIDI0LTUyIDU0LTUyczU0IDIxIDU0IDUyeiIgZmlsbD0iIzE2YTM0YSIvPjwvc3ZnPg==";

export const CV_EJEMPLO: CVData = {
  nombre: "Laura",
  apellidos: "Martín Ruiz",
  subtitulo: "Atención al cliente y administración",
  telefono: "612 345 678",
  email: "laura.martin@email.com",
  ciudad: "Valencia",
  fotoUrl: AVATAR_EJEMPLO,
  perfilProfesional:
    "Profesional con más de 6 años de experiencia en atención al cliente y gestión administrativa. Orientada a resultados, resolutiva y con excelente trato con el público. Acostumbrada a trabajar en equipo y bajo objetivos.",
  aptitudes: [
    "Atención al cliente",
    "Excel avanzado",
    "Trabajo en equipo",
    "Gestión de agenda",
    "Resolución de incidencias",
    "Facturación",
  ],
  idiomas: [
    { nombre: "Español", nivel: 100 },
    { nombre: "Inglés", nivel: 75 },
    { nombre: "Francés", nivel: 45 },
  ],
  experiencia: [
    {
      fechas: "2021 - Actualidad",
      puesto: "Responsable de atención al cliente",
      empresa: "Comercial Levante S.L.",
      ubicacion: "Valencia",
      descripcion: [
        "Gestión de una cartera de más de 200 clientes.",
        "Reducción del 30% en el tiempo de respuesta a incidencias.",
        "Coordinación de un equipo de 3 personas.",
      ],
    },
    {
      fechas: "2018 - 2021",
      puesto: "Administrativa",
      empresa: "Gestoría Ribera",
      ubicacion: "Valencia",
      descripcion: [
        "Facturación y control de cobros.",
        "Atención telefónica y presencial.",
      ],
    },
  ],
  formacion: [
    { titulo: "FP Superior en Administración y Finanzas", centro: "IES Ausiàs March", ubicacion: "Valencia" },
    { titulo: "Curso de Excel avanzado", centro: "Cámara de Comercio", ubicacion: "Valencia" },
  ],
};
