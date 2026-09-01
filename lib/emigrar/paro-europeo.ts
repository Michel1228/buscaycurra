/**
 * lib/emigrar/paro-europeo.ts — Llevarte el paro contigo, y que lo de fuera
 * cuente al volver.
 *
 * POR QUÉ ESTO ES LO MÁS VALIOSO DEL ÁREA DE EMIGRAR.
 *
 * Quien entra en «Emigrar» es, muchas veces, alguien que acaba de quedarse sin
 * trabajo y está cobrando el paro. Y existe un derecho europeo que le permite
 * COBRARLO MIENTRAS BUSCA TRABAJO FUERA, hasta seis meses. No lo sabe casi
 * nadie: la gente da por hecho que al irse lo pierde, así que se va sin nada o
 * no se va.
 *
 * Para alguien con 1.000 € de prestación son 3.000 € que se dejaba en la mesa,
 * y en el peor momento posible: justo cuando se está mudando a otro país.
 *
 * El otro lado es igual de importante y aún menos conocido: si trabajas fuera y
 * vuelves, esos meses CUENTAN para el paro español — pero hay que pedir un
 * papel al salir. Quien no lo pide se encuentra a la vuelta con que no le sale
 * la prestación.
 *
 * ⚠️ AQUÍ HAY DOS PLAZOS QUE, SI SE FALLAN, LO TIRAN TODO:
 *
 *   · Cuatro semanas apuntado al paro ANTES de irte. Si te vas antes, no hay
 *     nada que exportar.
 *   · Siete días para inscribirte en el servicio de empleo de destino. Siete,
 *     desde que sales. Es el plazo que más gente se come.
 *
 * Por eso van escritos como plazos y no como consejos.
 *
 * Fuentes, comprobadas el 2026-09-01:
 *   · Your Europe (Comisión Europea) — transferencia de prestaciones
 *   · Reglamento (CE) 883/2004, artículo 64
 *   · SEPE — trabajar en la UE
 */

export interface FuenteParo {
  titulo: string;
  url: string;
}

export interface Plazo {
  cuanto: string;
  que: string;
  siFallas: string;
}

/** Llevarte el paro español mientras buscas trabajo fuera. */
export const U2 = {
  nombre: "Formulario U2",
  antesSeLlamaba: "E-303",
  queEs:
    "La autorización para seguir cobrando tu paro español mientras buscas trabajo en otro país de la Unión Europea, Islandia, Liechtenstein, Noruega o Suiza.",
  duracion: "Tres meses, ampliables a seis si el SEPE lo aprueba.",
  quienLoPide: "Tú, al SEPE, antes de irte.",

  requisitos: [
    "Estar en desempleo total, no parcial: si trabajas algunas horas, no vale.",
    "Tener derecho a la prestación en España, no al subsidio sin más.",
    "Llevar al menos CUATRO SEMANAS inscrito como demandante de empleo y a disposición del servicio de empleo antes de salir.",
  ],

  plazos: [
    {
      cuanto: "4 semanas antes de irte",
      que: "Tienes que llevar ese tiempo apuntado como demandante de empleo y disponible.",
      siFallas: "No te dan el U2. No hay excepción ni forma de recuperarlo: hay que esperar.",
    },
    {
      cuanto: "7 días desde que sales",
      que: "Inscribirte como demandante de empleo en el servicio de empleo del país de destino y entregar allí el U2.",
      siFallas:
        "Pierdes la exportación. Es el plazo que más gente se come, porque son los días del viaje y la mudanza, justo cuando nadie está para papeleo.",
    },
    {
      cuanto: "Antes de que expire",
      que: "Volver al país que te paga la prestación antes o el mismo día en que se acaba tu derecho.",
      siFallas: "Puedes perder lo que te quedara de prestación.",
    },
  ] as Plazo[],

  avisos: [
    "El U2 vale para UN solo país. Si te vas a Alemania y luego a Países Bajos, hace falta otro.",
    "Sigue pagando España, no el país de destino, y en las condiciones españolas.",
    "Pídelo con tiempo: es un trámite, no un botón.",
  ],

  enlace: {
    titulo: "Transferencia de prestaciones de desempleo — Your Europe (Comisión Europea)",
    url: "https://europa.eu/youreurope/citizens/work/social-security-and-benefits/transferring-unemployment-benefits/index_es.htm",
  },
  enlaceSepe: {
    titulo: "Mi prestación y el trabajo en la UE — SEPE",
    url: "https://www.sepe.es/HomeSepe/Personas/distributiva-prestaciones/mi-prestacion-y-el-trabajo-en-la-UE/trabajos-en-la-UE",
  },
};

/** Que lo trabajado fuera cuente al volver. */
export const U1 = {
  nombre: "Formulario U1",
  antesSeLlamaba: "E-301",
  queEs:
    "El certificado de lo que has cotizado en otro país de la UE. Sirve para que esos meses cuenten cuando pidas el paro en España.",
  quienLoPide:
    "Tú, al servicio de empleo del país DONDE HAS TRABAJADO, antes de volverte o justo al volver.",
  porQueImporta:
    "Si has estado dos años trabajando en Alemania y vuelves, esos dos años cuentan para tu prestación española. Pero hay que acreditarlos, y quien no lo hace se encuentra al llegar con que no le sale.",
  avisos: [
    "Aunque no lo presentes, la administración española puede pedir los datos al otro país. Pero con el papel en la mano tardas semanas en vez de meses.",
    "Pídelo ANTES de volver, mientras sigues allí y tienes acceso a sus oficinas y a tu documentación.",
  ],
  enlace: {
    titulo: "Prestaciones de desempleo en la UE — Your Europe (Comisión Europea)",
    url: "https://europa.eu/youreurope/citizens/work/unemployment-and-benefits/unemployment/index_es.htm",
  },
};

export const FUENTES: FuenteParo[] = [
  {
    titulo: "Transferencia de prestaciones de desempleo — Your Europe",
    url: "https://europa.eu/youreurope/citizens/work/social-security-and-benefits/transferring-unemployment-benefits/index_es.htm",
  },
  {
    titulo: "Preguntas frecuentes sobre la transferencia — Your Europe",
    url: "https://europa.eu/youreurope/citizens/work/social-security-and-benefits/transferring-unemployment-benefits/faq/index_es.htm",
  },
  {
    titulo: "Trabajos en la UE — SEPE",
    url: "https://www.sepe.es/HomeSepe/Personas/distributiva-prestaciones/mi-prestacion-y-el-trabajo-en-la-UE/trabajos-en-la-UE",
  },
];

export const ACTUALIZADO = "2026-09";

/**
 * Cuánto se juega alguien por no pedir el U2, en euros.
 * La prestación media se le pide al usuario; esto solo multiplica.
 */
export function loQueTeJuegas(prestacionMensual: number): { tresMeses: number; seisMeses: number } {
  return {
    tresMeses: Math.round(prestacionMensual * 3),
    seisMeses: Math.round(prestacionMensual * 6),
  };
}
