/**
 * lib/cursos/acreditacion.ts — Acreditar por experiencia lo que ya sabes hacer.
 *
 * POR QUÉ ESTO ES LO MÁS IMPORTANTE DE TODO EL APARTADO DE FORMACIÓN.
 *
 * Nuestra gente son camareros, limpiadoras, cuidadores y gente de almacén.
 * Muchos llevan diez años haciendo un trabajo y no tienen ningún papel que lo
 * acredite. Un catálogo de cursos les dice "estudia 450 horas y paga hasta
 * 1.500 euros". El PEAC les dice "demuestra lo que ya sabes hacer y no pagas
 * nada". Para quien lleva media vida trabajando, esa es la diferencia entre
 * poder optar a un puesto o no.
 *
 * Y no lo cuenta bien ningún portal de empleo español. InfoJobs, LinkedIn e
 * Indeed listan ofertas; los directorios de cursos venden cursos. Nadie le dice
 * a la señora que lleva doce años cuidando a mayores que puede sacarse el
 * título sin volver a clase.
 *
 * ⚠️ AQUÍ NO SE PUEDE FALLAR NI UN DATO. Alguien va a organizar su vida con
 * esto: pedir cita, juntar papeles, tal vez pedir un día libre en el trabajo.
 * Cada cifra de este fichero sale de la página oficial del Ministerio o del
 * procedimiento de una comunidad concreta, y va con su fuente. Lo que no se ha
 * podido verificar se dice que no se ha podido verificar.
 *
 * Fuentes principales, comprobadas el 2026-09-01:
 *   · Ministerio de Educación y FP — TodoFP, procedimiento y requisitos
 *   · Comunidad de Madrid — cifras por nivel y gratuidad
 *   · Real Decreto 659/2023, Título VI — la norma que lo ordena
 */

import type { Fuente } from "./tipos";

export interface RequisitoNivel {
  nivel: string;
  edadMinima: number;
  /** Años de trabajo y horas totales. */
  experiencia: { anios: number; horas: number; ventanaAnios: number };
  /** Alternativa por formación, si no llegas por experiencia. */
  formacionHoras: number;
  formacionVentanaAnios: number;
}

/**
 * Cifras de la página oficial del Ministerio. Las comunidades pueden pedir algo
 * distinto para el nivel 1 — Madrid publica 2 años y 1.000 horas — así que la
 * ficha manda siempre a comprobarlo en la de cada uno.
 */
export const REQUISITOS: RequisitoNivel[] = [
  {
    nivel: "Nivel 1",
    edadMinima: 18,
    experiencia: { anios: 2, horas: 1000, ventanaAnios: 10 },
    formacionHoras: 200,
    formacionVentanaAnios: 10,
  },
  {
    nivel: "Niveles 2 y 3",
    edadMinima: 20,
    experiencia: { anios: 3, horas: 2000, ventanaAnios: 15 },
    formacionHoras: 300,
    formacionVentanaAnios: 10,
  },
];

export const FASES: { titulo: string; texto: string }[] = [
  {
    titulo: "Presentas la solicitud",
    texto:
      "En el organismo de tu comunidad autónoma. Es donde eliges qué unidades de competencia quieres acreditar.",
  },
  {
    titulo: "Te asesoran",
    texto:
      "Un asesor mira tu vida laboral y tus papeles y te dice si te conviene seguir o qué te falta. Esta fase es gratis y existe precisamente para que no te la juegues: hazla aunque parezca un trámite de más.",
  },
  {
    titulo: "Te evalúan",
    texto:
      "Tienes que demostrar lo que no quede claro con los papeles. Puede ser una entrevista, una prueba práctica o que te observen trabajando.",
  },
  {
    titulo: "Te acreditan",
    texto:
      "Lo que apruebes queda inscrito en el RECEX, el registro estatal, y vale en toda España. No caduca.",
  },
  {
    titulo: "Te dan un plan",
    texto:
      "Si te falta algo para el título completo, te dicen exactamente qué módulos te quedan. Ya no empiezas de cero: solo cursas lo que falta.",
  },
];

export const DOCUMENTOS: string[] = [
  "Vida laboral, que se pide gratis en la Seguridad Social",
  "Contratos de trabajo, o certificado de la empresa donde diga qué hacías y cuánto tiempo",
  "Diplomas de los cursos que hayas hecho, aunque fueran cortos",
  "DNI, NIE o pasaporte",
];

/**
 * Lo que NO se puede omitir aunque anime menos. Si alguien pide cita, junta los
 * papeles y se encuentra con la puerta cerrada, la culpa es nuestra.
 */
export const ADVERTENCIAS: string[] = [
  "El procedimiento es de convocatoria abierta y permanente, pero hay comunidades que lo tienen parado mientras adaptan la normativa nueva: Madrid suspendió las nuevas admisiones el 16 de julio de 2026. Mira la de la tuya antes de contar con ello.",
  "Los requisitos del nivel 1 cambian algo según la comunidad. Las cifras de aquí son las del Ministerio; la tuya manda.",
  "Se acreditan unidades de competencia, no siempre el título entero. Es acumulable: lo que saques hoy cuenta para el resto.",
  "Pide nacionalidad española o de la UE, o permiso de residencia y trabajo en vigor. Si tu situación es otra, pregunta antes en el organismo de tu comunidad.",
];

export const ENLACES = {
  ministerio: {
    titulo: "Ministerio de Educación y FP — Acreditación de competencias",
    url: "https://todofp.es/acreditacion-de-competencias/acreditacion-de-competencias-profesionales.html",
  },
  porComunidad: {
    titulo: "El procedimiento de cada comunidad autónoma",
    url: "https://todofp.es/acreditacion-de-competencias/acreditacion-de-competencias-profesionales/webs-acreditacion-ccaa.html",
  },
};

export const FUENTES: Fuente[] = [
  {
    titulo: "Ministerio de Educación y FP — requisitos y fases del procedimiento",
    url: "https://todofp.es/acreditacion-de-competencias/acreditacion-de-competencias-profesionales.html",
  },
  {
    titulo: "Comunidad de Madrid — acreditación por experiencia laboral (gratuidad y cifras por nivel)",
    url: "https://www.comunidad.madrid/empleo/acreditacion-experiencia-laboral",
  },
  {
    titulo: "Real Decreto 659/2023, Título VI — ordenación del procedimiento",
    url: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-16889",
  },
];

export const ACTUALIZADO = "2026-09";

/**
 * ¿Le sale a cuenta a esta persona? Lo usa el bloque de la ficha de curso y
 * puede usarlo Guzzi cuando alguien le diga cuántos años lleva trabajando.
 *
 * Deliberadamente prudente: solo dice "puedes" cuando pasa el listón del
 * Ministerio con margen. Ilusionar a alguien que no llega es peor que callarse.
 */
export function puedeAcreditar(aniosExperiencia: number): {
  encaja: boolean;
  nivel?: string;
  mensaje: string;
} {
  if (aniosExperiencia >= 3) {
    return {
      encaja: true,
      nivel: "Niveles 2 y 3",
      mensaje:
        "Con tres años o más de experiencia entras en los requisitos generales. Hacen falta 2.000 horas trabajadas en los últimos quince años, que con tres años a jornada completa se cumplen de sobra.",
    };
  }
  if (aniosExperiencia >= 2) {
    return {
      encaja: true,
      nivel: "Nivel 1",
      mensaje:
        "Con dos años puedes optar al nivel 1. Para los niveles 2 y 3 te harían falta tres. Comprueba las cifras exactas en tu comunidad, que en el nivel 1 varían.",
    };
  }
  return {
    encaja: false,
    mensaje:
      "Con menos de dos años todavía no llegas al mínimo. Guarda las nóminas y los contratos desde ya: cuando llegues, la vida laboral es lo primero que te van a pedir.",
  };
}
