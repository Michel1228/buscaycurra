/**
 * lib/au-pair/registros-oficiales.ts — ¿Es de fiar esta agencia de au pair?
 *
 * La lista de agencias de la app sale de los portales de ofertas: son las que
 * publican, no las que alguien ha comprobado. Hay registros oficiales que sí
 * lo dicen, y son la mejor defensa contra las estafas del sector (agencias que
 * cobran por adelantado y desaparecen, "familias" que piden dinero para el
 * visado). Aquí van los que se han podido verificar, con lo que significa
 * exactamente estar en cada uno: no es lo mismo un registro obligatorio que un
 * sello voluntario.
 *
 * Comprobado el 2026-10-08.
 */

export interface RegistroAuPair {
  pais: string;
  nombre: string;
  /** Qué significa estar en él, sin exagerar. */
  queSignifica: string;
  url: string;
  /** Agencias del registro, tal y como las escribe, si es una lista cerrada. */
  agencias?: string[];
  fechaLista?: string;
}

export const REGISTROS_AU_PAIR: RegistroAuPair[] = [
  {
    pais: "NL",
    nombre: "Registro público del IND (Países Bajos)",
    queSignifica:
      "Son las únicas agencias reconocidas por el IND para pedir el permiso de residencia de au pair. Si eres de la UE no necesitas ese permiso, pero que la agencia esté aquí es una buena señal.",
    url: "https://ind.nl/en/public-register-recognised-sponsors/public-register-au-pair-and-exchange",
    agencias: [
      "Au Pair Agency Mondial B.V.", "Au Pair Amsterdam B.V.", "Au Pair Exclusive", "Au Pair International B.V.",
      "AUPAIR4ALL", "Baie B.V.", "Beau-pair B.V.", "Complete Au Pair B.V.", "Family aupair",
      "HBN Au Pair Services B.V.", "Hoom Au-Pair", "House o Orange Au Pairs", "Mission Hollandaise",
      "Nedsa Au Pair Nederland B.V.", "Sunshine Au Pair B.V.", "Super Nanny Au Pair Services",
      "Travel Active Programmes B.V.", "World Wide Au Pair B.V.",
    ],
    fechaLista: "2026-10-05",
  },
  {
    pais: "US",
    nombre: "Patrocinadores designados por el Departamento de Estado (EE. UU.)",
    queSignifica:
      "Solo estas organizaciones pueden tramitar el visado J-1 de au pair: no hay otra vía legal. El programa es para personas de 18 a 26 años, con un máximo de 45 horas de cuidado a la semana.",
    url: "https://j1visa.state.gov/participants/how-to-apply/sponsor-search/?program=Au%20Pair",
  },
  {
    pais: "DE",
    nombre: "Sello RAL de la Gütegemeinschaft Au pair (Alemania)",
    queSignifica:
      "Es un sello de calidad voluntario: lo llevan las agencias que se someten a sus normas y controles. No tenerlo no significa que una agencia sea mala, pero tenerlo es una garantía más.",
    url: "https://www.guetegemeinschaft-aupair.de/",
  },
];

function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/\b(b\.?v\.?|gmbh|ltd|llc|inc)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * ¿Esta agencia está en el registro cerrado de su país? true / false si el país
 * tiene lista (Países Bajos); null si no la hay o no se puede saber. Coincidencia
 * por nombre normalizado y completo: "Au Pair International B.V." casa con
 * "Au Pair International", pero "Au Pair" a secas no casa con nada.
 */
export function agenciaEnRegistro(nombre: string, pais: string): boolean | null {
  const reg = REGISTROS_AU_PAIR.find(r => r.pais === pais.toUpperCase() && r.agencias?.length);
  if (!reg) return null;
  const n = normalizar(nombre);
  if (n.length < 5) return false;
  return reg.agencias!.some(a => normalizar(a) === n);
}
