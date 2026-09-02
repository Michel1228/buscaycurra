/**
 * lib/entrevistas/por-pais.ts — La entrevista no es igual en todas partes.
 *
 * EL PROBLEMA. El simulador tenía escrito en el prompt «Eres un entrevistador de
 * recursos humanos profesional en España» y «usar español de España», sin
 * ninguna opción de país. Pero mandamos ofertas de veintiséis países, así que
 * quien se prepara una entrevista en Berlín, Londres o Ámsterdam ensayaba una
 * entrevista española y se encontraba otra cosa.
 *
 * No es un matiz. En Alemania la entrevista es formal, cronológica y factual, y
 * la gente contesta con datos; en el Reino Unido, Irlanda y Países Bajos casi
 * todo son preguntas por competencias («cuéntame una vez que…»), que se
 * responden con el método STAR y que a quien no lo sabe le pillan a contrapié.
 * Ensayar el estilo equivocado no es no prepararse: es prepararse mal.
 *
 * Aquí no hay cifras que caduquen. Son costumbres de selección, y se presentan
 * como lo que son: costumbres, no reglas.
 */

export interface EstiloEntrevista {
  /** Cómo se comporta quien entrevista allí. Va dentro del prompt. */
  estilo: string;
  /** Lo que conviene ensayar para ese país. */
  prepara: string[];
}

const COMPETENCIAS: EstiloEntrevista = {
  estilo:
    "Formulas casi todas las preguntas por competencias: «cuéntame una vez que…», «dame un ejemplo de…». Esperas respuestas estructuradas, con situación, tarea, acción y resultado. Eres cordial y directo, y no preguntas por la vida personal.",
  prepara: [
    "Casi todo son preguntas por competencias: prepara tres o cuatro historias reales de tu trabajo y cuéntalas con la estructura situación, tarea, acción y resultado.",
    "Lleva números: cuántas mesas, cuántos pedidos, cuánto tiempo ahorraste. Ahí se valora mucho.",
    "No preguntan por edad, estado civil ni familia, y si lo hacen es una mala señal.",
  ],
};

const FORMAL_CENTROEUROPA: EstiloEntrevista = {
  estilo:
    "Eres formal y vas al grano. Preguntas por la trayectoria en orden cronológico, sin saltos ni huecos sin explicar, y te interesan los datos concretos y las titulaciones más que la charla. Tuteas poco.",
  prepara: [
    "Repasa tu trayectoria en orden y ten explicado cualquier hueco entre trabajos: allí se pregunta y no pasa nada si tiene explicación.",
    "Los títulos y certificados pesan más que aquí, y en muchos oficios hay que homologarlos. Ten claro el estado del tuyo.",
    "Puntualidad absoluta, y mejor pecar de formal que de confianzudo.",
  ],
};

const NORDICO: EstiloEntrevista = {
  estilo:
    "Eres cercano y poco jerárquico. Te interesa cómo trabaja en equipo, cómo toma decisiones por su cuenta y si encaja en una cultura plana. No te impresionan los títulos por sí solos.",
  prepara: [
    "Se valora la autonomía y el trabajo en equipo por encima de la jerarquía: cuenta decisiones que tomaste tú.",
    "El equilibrio entre trabajo y vida personal es un tema normal en la entrevista, no un tabú. Puedes preguntarlo.",
    "Presumir queda mal. Cuenta lo que hiciste con naturalidad y sin inflarlo.",
  ],
};

const LATINO: EstiloEntrevista = {
  estilo:
    "Eres profesional pero cercano. Mezclas preguntas de trayectoria con otras de motivación y encaje en el equipo, y das pie a que se explique.",
  prepara: [
    "Prepara bien el «háblame de ti»: suele abrir la entrevista y marca el tono de todo lo demás.",
    "Ten a mano por qué quieres ESE puesto en ESA empresa. Es la pregunta que más se falla.",
    "Lleva preparadas dos preguntas para hacer al final. No preguntar nada se interpreta como desinterés.",
  ],
};

const ESTILO_POR_PAIS: Record<string, EstiloEntrevista> = {
  UK: COMPETENCIAS, IE: COMPETENCIAS, NL: COMPETENCIAS, US: COMPETENCIAS,
  CA: COMPETENCIAS, AU: COMPETENCIAS, NZ: COMPETENCIAS, SG: COMPETENCIAS,
  DE: FORMAL_CENTROEUROPA, AT: FORMAL_CENTROEUROPA, CH: FORMAL_CENTROEUROPA,
  CZ: FORMAL_CENTROEUROPA, PL: FORMAL_CENTROEUROPA, HU: FORMAL_CENTROEUROPA,
  JP: FORMAL_CENTROEUROPA,
  SE: NORDICO, NO: NORDICO, DK: NORDICO, FI: NORDICO,
  ES: LATINO, PT: LATINO, IT: LATINO, FR: LATINO, GR: LATINO, RO: LATINO, BE: LATINO,
};

export function estiloEntrevistaDe(codigo: string | null | undefined): EstiloEntrevista {
  const c = (codigo || "ES").toUpperCase().trim();
  return ESTILO_POR_PAIS[c === "GB" ? "UK" : c] || LATINO;
}

/**
 * El trozo de prompt que cambia según el país.
 *
 * `nombrePais` viene de lib/paises.ts para que no haya dos listas de nombres.
 * Ojo con el idioma: antes el prompt imponía «usar español de España» a todo el
 * mundo, incluidos los usuarios latinoamericanos. Ahora se pide español neutro,
 * que le vale a todos.
 */
export function promptDePais(codigo: string | null | undefined, nombrePais: string): string {
  const { estilo } = estiloEntrevistaDe(codigo);
  return `Entrevistas para un puesto en ${nombrePais}, y entrevistas como se hace allí: ${estilo}
Hablas en español neutro, entendible tanto en España como en Latinoamérica.${
    (codigo || "ES").toUpperCase() !== "ES"
      ? `\nSi el candidato dice algo que en ${nombrePais} se hace distinto que en España, díselo: para eso está el ensayo.`
      : ""
  }`;
}
