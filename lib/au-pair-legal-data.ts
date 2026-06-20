/**
 * Datos de requisitos legales Au Pair por país europeo
 * Fuente: investigación directa de AuPairWorld, AuPair.com, EURES, Wikipedia y webs gubernamentales (Junio 2026)
 * 
 * ⚠️ Los datos cambian anualmente. Última revisión: 20/06/2026
 */

export interface PaisAuPair {
  codigo: string;
  nombre: string;
  bandera: string;
  edadMin: number;
  edadMax: number;
  horasSemanales: number;
  salarioMinMensual: string; // en EUR salvo indicación
  cursoIdioma: string;       // "Obligatorio", "Recomendado", "No"
  visadoUE: string;          // para ciudadanos UE
  visadoNoUE: string;        // para ciudadanos NO UE
  vacaciones: string;
  seguroMedico: string;
  duracionMax: string;
  costeMensualFamilia: string; // coste TOTAL aproximado para la familia
  documentacion: string;       // docs necesarios
  notaAdicional: string;
}

export const PAISES_AU_PAIR_LEGAL: PaisAuPair[] = [
  {
    codigo: "ES",
    nombre: "España",
    bandera: "🇪🇸",
    edadMin: 18,
    edadMax: 30,
    horasSemanales: 30,
    salarioMinMensual: "€280 – 320",
    cursoIdioma: "No obligatorio",
    visadoUE: "No necesita (registro de ciudadano UE)",
    visadoNoUE: "Visado de estancia por estudios (curso de español de 20h/semana obligatorio)",
    vacaciones: "1 día libre/semana + 2 semanas pagadas al año",
    seguroMedico: "Tarjeta Sanitaria Europea (UE) o seguro privado",
    duracionMax: "12 meses (prorrogable en algunas CCAA)",
    costeMensualFamilia: "€590 – 830",
    documentacion: "Contrato au pair firmado, inscripción en curso de español (si no-UE)",
    notaAdicional: "El país más fácil para empezar. Poca burocracia para comunitarios.",
  },
  {
    codigo: "DE",
    nombre: "Alemania",
    bandera: "🇩🇪",
    edadMin: 18,
    edadMax: 27,
    horasSemanales: 30,
    salarioMinMensual: "€280",
    cursoIdioma: "Obligatorio para no-UE. Muy recomendado para todos.",
    visadoUE: "No necesita (Anmeldung = registro de residencia)",
    visadoNoUE: "Visado de au pair (requiere A1 de alemán). Máx 12 meses.",
    vacaciones: "1.5 días libres/semana + 4 semanas pagadas/año",
    seguroMedico: "Obligatorio (la familia lo paga). ~€50-70/mes para no-UE.",
    duracionMax: "12 meses (no renovable como au pair en la misma familia)",
    costeMensualFamilia: "€580 – 710",
    documentacion: "Contrato au pair estándar alemán (Au-Pair-Vertrag), A1 alemán, Anmeldung",
    notaAdicional: "MUY regulado. El salario de €280 es fijo por ley. La familia paga seguro + curso.",
  },
  {
    codigo: "FR",
    nombre: "Francia",
    bandera: "🇫🇷",
    edadMin: 17,
    edadMax: 30,
    horasSemanales: 30,
    salarioMinMensual: "€320 – 340",
    cursoIdioma: "Obligatorio (10h/semana de francés). La familia paga una parte.",
    visadoUE: "No necesita",
    visadoNoUE: "Visado 'jeune au pair' (requiere inscripción en curso de francés). Máx 12 meses.",
    vacaciones: "1 día libre/semana completo + festivos",
    seguroMedico: "Tarjeta Sanitaria Europea (UE). Para no-UE: seguro privado obligatorio.",
    duracionMax: "12 meses (renovable hasta 24 meses máximo total)",
    costeMensualFamilia: "€620 – 840",
    documentacion: "Convenio au pair (CERFA), inscripción en curso de francés, certificado médico",
    notaAdicional: "País muy regulado. El curso de francés es OBLIGATORIO incluso para ciudadanos UE. La familia debe inscribir al au pair en la sécurité sociale.",
  },
  {
    codigo: "UK",
    nombre: "Reino Unido",
    bandera: "🇬🇧",
    edadMin: 18,
    edadMax: 30,
    horasSemanales: 30,
    salarioMinMensual: "£360 – 400 (~€430-480)",
    cursoIdioma: "Recomendado, no obligatorio",
    visadoUE: "Desde Brexit: necesita visado. Youth Mobility Scheme (cupo limitado) o Skilled Worker.",
    visadoNoUE: "Youth Mobility Scheme (para ciertos países). O visado de estudiante con permiso de trabajo limitado.",
    vacaciones: "1.5 días libres/semana + 5.6 semanas pagadas/año (proporcional)",
    seguroMedico: "Recargo sanitario de inmigración (IHS): £776/año. La familia suele ayudar.",
    duracionMax: "24 meses (Youth Mobility Scheme). 12-24 meses otros visados.",
    costeMensualFamilia: "£1,340 – 1,480 (~€1,600-1,770)",
    documentacion: "Certificate of Sponsorship (CoS), contrato au pair, prueba de fondos, IHS pago",
    notaAdicional: "MUY CARO para familias desde Brexit. £776/año solo de recargo sanitario. El au pair paga vuelo. Es el país más caro para familias.",
  },
  {
    codigo: "NL",
    nombre: "Países Bajos",
    bandera: "🇳🇱",
    edadMin: 18,
    edadMax: 30,
    horasSemanales: 30,
    salarioMinMensual: "€340",
    cursoIdioma: "No obligatorio para UE. Muy recomendado.",
    visadoUE: "No necesita (registro BSN en el municipio)",
    visadoNoUE: "MVV + VVR de intercambio cultural (solo a través de agencia reconocida por IND). Máx 12 meses.",
    vacaciones: "2 días libres/semana",
    seguroMedico: "Seguro médico holandés OBLIGATORIO para todos (~€110/mes). La familia ayuda.",
    duracionMax: "12 meses (no renovable como au pair)",
    costeMensualFamilia: "€690 – 820",
    documentacion: "Contrato au pair, BSN, seguro médico, inscripción en municipio (gemeente)",
    notaAdicional: "MUY BUROCRÁTICO para no-UE: solo vía agencia reconocida por IND. La agencia cuesta ~€600-900 extra.",
  },
  {
    codigo: "IT",
    nombre: "Italia",
    bandera: "🇮🇹",
    edadMin: 18,
    edadMax: 30,
    horasSemanales: 30,
    salarioMinMensual: "€250 – 300",
    cursoIdioma: "Obligatorio (curso de italiano). La familia debe facilitarlo.",
    visadoUE: "No necesita (registro de residencia en el municipio)",
    visadoNoUE: "Permesso di soggiorno per studio (requiere inscripción en curso de italiano de 20h/semana)",
    vacaciones: "1 día libre/semana + 2 semanas pagadas",
    seguroMedico: "Tarjeta Sanitaria Europea (UE) o seguro privado para no-UE",
    duracionMax: "12 meses (renovable)",
    costeMensualFamilia: "€530 – 750",
    documentacion: "Contrato au pair, inscripción en curso, permesso di soggiorno (no-UE)",
    notaAdicional: "Poco regulado comparado con Alemania/Francia. Mucho trabajo informal. El salario es bajo pero el coste de vida también.",
  },
  {
    codigo: "BE",
    nombre: "Bélgica",
    bandera: "🇧🇪",
    edadMin: 18,
    edadMax: 26,
    horasSemanales: 20,
    salarioMinMensual: "€450",
    cursoIdioma: "Obligatorio. La familia debe inscribirte en un curso.",
    visadoUE: "No necesita (registro en la commune/gemeente)",
    visadoNoUE: "Permiso de trabajo B (a través de agencia reconocida). Máx 12 meses.",
    vacaciones: "1.5 días/semana + 3 semanas pagadas",
    seguroMedico: "Tarjeta Sanitaria Europea (UE) o seguro privado",
    duracionMax: "12 meses (no renovable como au pair)",
    costeMensualFamilia: "Consultar con agencia",
    documentacion: "Contrato au pair, permiso B (no-UE), inscripción en curso",
    notaAdicional: "SOLO 20h/semana — el mejor balance vida-trabajo. Salario más alto por hora trabajada. Edad máxima 26 (la más baja de Europa).",
  },
  {
    codigo: "IE",
    nombre: "Irlanda",
    bandera: "🇮🇪",
    edadMin: 18,
    edadMax: 30,
    horasSemanales: 30,
    salarioMinMensual: "€360 – 400",
    cursoIdioma: "No obligatorio. Inglés es el idioma nativo.",
    visadoUE: "No necesita (PPS Number para trabajar)",
    visadoNoUE: "Working Holiday Authorisation (para ciertos países) o visado de estudiante",
    vacaciones: "1.5 días libres/semana + 4 semanas pagadas",
    seguroMedico: "Tarjeta Sanitaria Europea (UE). Seguro privado recomendado para no-UE.",
    duracionMax: "12-24 meses (dependiendo del visado)",
    costeMensualFamilia: "€700 – 950",
    documentacion: "PPS Number, contrato au pair, GNIB card (no-UE)",
    notaAdicional: "La ventaja: es de habla inglesa nativa. Ideal para mejorar inglés. Salario decente. Mucha comunidad española en Dublín.",
  },
  {
    codigo: "AT",
    nombre: "Austria",
    bandera: "🇦🇹",
    edadMin: 18,
    edadMax: 28,
    horasSemanales: 20,
    salarioMinMensual: "€460 – 520",
    cursoIdioma: "Obligatorio (curso de alemán). La familia paga una parte.",
    visadoUE: "No necesita (Anmeldebescheinigung tras 3 meses)",
    visadoNoUE: "Visado de au pair (requiere A1 de alemán)",
    vacaciones: "1.5 días /semana + 5 semanas pagadas al año",
    seguroMedico: "Tarjeta Sanitaria Europea (UE). Seguro austriaco para no-UE (familia lo paga).",
    duracionMax: "12 meses",
    costeMensualFamilia: "€700 – 900",
    documentacion: "Contrato au pair austriaco, A1 alemán, Anmeldebescheinigung, seguro",
    notaAdicional: "El MEJOR salario por hora trabajada (solo 20h/semana). 5 semanas de vacaciones. Muy buena calidad de vida pero necesitas alemán.",
  },
  {
    codigo: "DK",
    nombre: "Dinamarca",
    bandera: "🇩🇰",
    edadMin: 18,
    edadMax: 30,
    horasSemanales: 30,
    salarioMinMensual: "DKK 4.550 (~€610)",
    cursoIdioma: "Obligatorio (curso de danés). La familia debe facilitarlo.",
    visadoUE: "No necesita (registro CPR en el municipio)",
    visadoNoUE: "Visado de au pair (requiere conocimientos básicos de inglés o danés)",
    vacaciones: "1 día libre/semana + 5 semanas pagadas al año",
    seguroMedico: "Tarjeta Sanitaria Europea (UE). Seguro danés para no-UE (cubierto por el estado).",
    duracionMax: "24 meses (18 meses como au pair + 6 meses prórroga)",
    costeMensualFamilia: "DKK 8.000 – 10.500 (~€1,070-1,410)",
    documentacion: "Contrato au pair danés, CPR number, inscripción en curso de danés",
    notaAdicional: "El MEJOR salario de Europa (~€610/mes netos). Pero coste de vida MUY alto. Las familias pagan impuestos extra por tener au pair. Máxima duración: 24 meses.",
  },
  {
    codigo: "FI",
    nombre: "Finlandia",
    bandera: "🇫🇮",
    edadMin: 18,
    edadMax: 30,
    horasSemanales: 30,
    salarioMinMensual: "€280 – 340",
    cursoIdioma: "Recomendado, no obligatorio",
    visadoUE: "No necesita (registro en el municipio)",
    visadoNoUE: "Visado de au pair (requiere carta de invitación de la familia)",
    vacaciones: "1 día libre/semana + 2 semanas pagadas al año (ley de vacaciones finlandesa)",
    seguroMedico: "Tarjeta Sanitaria Europea (UE). Seguro privado recomendado para no-UE.",
    duracionMax: "12 meses",
    costeMensualFamilia: "€650 – 800",
    documentacion: "Contrato au pair, registro en municipio (maistraatti), seguro",
    notaAdicional: "País seguro, buena calidad de vida. El inglés se habla mucho. Familias suelen ser muy respetuosas con los horarios.",
  },
];

/** Calcula el coste mensual estimado para la familia */
export function calcularCosteFamilia(pais: PaisAuPair, extras?: { curso?: number; transporte?: number }): {
  salario: number;
  comidaAlojamiento: number;
  cursoIdioma: number;
  seguro: number;
  transporte: number;
  total: number;
} {
  // Extraer el valor numérico medio del salario
  const salarioMatch = pais.salarioMinMensual.match(/[\d,.]+/);
  let salario = salarioMatch ? parseFloat(salarioMatch[0].replace(",", ".")) : 300;

  // Si el salario es en libras, convertir
  if (pais.salarioMinMensual.includes("£")) salario = salario * 1.19;
  if (pais.salarioMinMensual.includes("DKK")) salario = salario / 7.45;

  const comidaAlojamiento = 250; // € estimado de manutención
  const cursoIdioma = extras?.curso ?? (pais.cursoIdioma.includes("Obligatorio") ? 80 : 0);
  const seguro = pais.seguroMedico.includes("OBLIGATORIO") || pais.seguroMedico.includes("Obligatorio") ? 70 : 30;
  const transporte = extras?.transporte ?? 40;

  return {
    salario: Math.round(salario),
    comidaAlojamiento,
    cursoIdioma,
    seguro,
    transporte,
    total: Math.round(salario + comidaAlojamiento + cursoIdioma + seguro + transporte),
  };
}
