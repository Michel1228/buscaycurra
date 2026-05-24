/**
 * lib/primeros-pasos.ts
 * Información práctica para españoles que quieren trabajar en cada país.
 * Au pair, alojamiento temporal, visados, Working Holiday, etc.
 */

export interface PrimerosPasosInfo {
  /** Código ISO del país */
  codigo: string;
  /** ¿Hay programas au pair disponibles? */
  auPair: {
    disponible: boolean;
    plataformas: { nombre: string; url: string; descripcion: string }[];
    requisitos: string;
  };
  /** Alojamiento temporal para los primeros días */
  alojamiento: {
    plataformas: { nombre: string; url: string; descripcion: string }[];
    consejo: string;
  };
  /** Requisitos legales para españoles */
  visado: {
    tipo: "ue-libre" | "visado-trabajo" | "working-holiday" | "visado-estudiante";
    descripcion: string;
    enlaceOficial?: string;
  };
  /** Programas extra disponibles */
  programasExtra?: { nombre: string; url: string; descripcion: string }[];
}

const BASE_INFO: Record<string, PrimerosPasosInfo> = {
  UK: {
    codigo: "UK",
    auPair: {
      disponible: true,
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/united-kingdom", descripcion: "La plataforma más grande de au pairs. Reino Unido es uno de los destinos más populares." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/united-kingdom.php", descripcion: "Miles de familias británicas buscando au pair. Registro gratuito." },
      ],
      requisitos: "18-30 años, inglés básico, sin antecedentes penales, disponibilidad 6-12 meses. El visado se tramita como Youth Mobility Scheme o Skilled Worker (post-Brexit, más difícil).",
    },
    alojamiento: {
      plataformas: [
        { nombre: "SpareRoom", url: "https://www.spareroom.co.uk", descripcion: "El portal #1 en UK para alquilar habitaciones. Ideal para recién llegados." },
        { nombre: "Spotahome", url: "https://www.spotahome.com/london", descripcion: "Alquiler verificado mensual. Sin visitas presenciales — reservas online." },
        { nombre: "Hostelworld", url: "https://www.hostelworld.com/hostels/London", descripcion: "Albergues desde 15-25€/noche para los primeros días mientras buscas piso." },
      ],
      consejo: "Calcula 2-3 meses de alquiler por adelantado (fianza + primer mes). Un depósito típico son £500-800. Londres es caro — mejor empezar en Manchester, Birmingham o Leeds.",
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Post-Brexit, los españoles necesitan visado para trabajar en UK. Las opciones: Skilled Worker Visa (si tienes oferta de trabajo cualificada), Youth Mobility Scheme (18-30 años, 2 años, sin oferta previa — cupo limitado para españoles), o Health & Care Worker Visa (sanidad).",
      enlaceOficial: "https://www.gov.uk/browse/visas-immigration/work-visas",
    },
    programasExtra: [
      { nombre: "Workaway UK", url: "https://www.workaway.info/en/hostlist/UK", descripcion: "Voluntariado a cambio de alojamiento y comida. Más de 2,000 anfitriones en Reino Unido." },
    ],
  },

  IE: {
    codigo: "IE",
    auPair: {
      disponible: true,
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/ireland", descripcion: "Irlanda es destino top para au pairs españoles por el inglés y la cercanía." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/ireland.php", descripcion: "Cientos de familias irlandesas. El proceso es sencillo al estar en la UE." },
      ],
      requisitos: "18-30 años, inglés básico, sin antecedentes. Al estar en la UE, no necesitas visado. Estancia típica: 6-12 meses. Sueldo: 80-120€/semana + alojamiento y comida.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Daft.ie", url: "https://www.daft.ie", descripcion: "El portal de alquiler #1 de Irlanda. Miles de habitaciones y pisos compartidos." },
        { nombre: "Spotahome", url: "https://www.spotahome.com/dublin", descripcion: "Alquiler verificado en Dublín. Reserva 100% online sin visitas." },
        { nombre: "Hostelworld", url: "https://www.hostelworld.com/hostels/Dublin", descripcion: "Albergues en Dublín desde 20€/noche. Bueno para aterrizar." },
      ],
      consejo: "Dublín es MUY caro y hay crisis de vivienda. Alquilar habitación: 600-1000€/mes. Muchos españoles se van a Cork o Galway que son más baratos y también tienen mucha oferta de trabajo.",
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Como ciudadano UE, puedes vivir y trabajar en Irlanda sin visado. Solo necesitas pasaporte o DNI en vigor. Para estancias largas, tramita el PPS Number (equivalente al NIE) en la oficina de Intreo.",
      enlaceOficial: "https://www.gov.ie/en/service/12e6de-get-a-personal-public-service-pps-number/",
    },
  },

  US: {
    codigo: "US",
    auPair: {
      disponible: true,
      plataformas: [
        { nombre: "Cultural Care Au Pair", url: "https://www.culturalcare.com", descripcion: "La agencia más grande para au pairs en EEUU. Gestionan el visado J-1." },
        { nombre: "AuPairCare", url: "https://www.aupaircare.com", descripcion: "Otra agencia top. Programa de 12-24 meses con familias verificadas." },
        { nombre: "AuPair in America", url: "https://www.aupairinamerica.com", descripcion: "El programa original de au pair en EEUU. Muy buena reputación." },
      ],
      requisitos: "18-26 años, inglés intermedio, título de secundaria, experiencia demostrable con niños (mín 200h), carnet de conducir. Se tramita con visado J-1 a través de una agencia oficial. Sueldo: ~$200/semana + alojamiento y comida + $500 para estudios.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Zillow", url: "https://www.zillow.com/rent", descripcion: "El portal de alquiler más grande de EEUU. Cubre todo el país." },
        { nombre: "Spotahome", url: "https://www.spotahome.com/us", descripcion: "Alquiler verificado en ciudades principales. Reserva online sin visitas." },
        { nombre: "Hostelworld", url: "https://www.hostelworld.com/hostels/United-States-of-America", descripcion: "Albergues para los primeros días. NYC desde $40/noche." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com/s/United-States/homes?monthly_stay=true", descripcion: "Alquileres mensuales en Airbnb — ideal para el primer mes mientras buscas algo fijo." },
      ],
      consejo: "En EEUU el alquiler funciona por 'credit score'. Los recién llegados no tienen historial → prepara 2-3 meses de fianza o busca subarrendar (sublet). Compartir piso (roommates) es lo normal al principio. Usa Craigslist o grupos de Facebook de españoles en la ciudad.",
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Los españoles necesitan visado para trabajar en EEUU. Opciones principales: H-1B (profesionales cualificados, sorteo anual en marzo), L-1 (traslado dentro de misma empresa), J-1 (intercambio cultural, incluye au pair, prácticas, summer camp), o O-1 (talento extraordinario). Las ofertas en BuscayCurra pueden requerir sponsorship (patrocinio de visado por la empresa).",
      enlaceOficial: "https://travel.state.gov/content/travel/en/us-visas/employment.html",
    },
    programasExtra: [
      { nombre: "Work & Travel USA", url: "https://j1visa.state.gov/programs/summer-work-travel", descripcion: "Programa de verano para universitarios. Trabajas 3-4 meses en hostelería/parques temáticos. Miles de españoles lo hacen cada año." },
      { nombre: "Camp Counselor", url: "https://www.campleaders.com", descripcion: "Monitor de campamento de verano en EEUU. Alojamiento + comida + sueldo. Inglés intermedio requerido." },
    ],
  },

  CA: {
    codigo: "CA",
    auPair: {
      disponible: true,
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/canada", descripcion: "Familias canadienses buscando au pairs. Al ser programa IEC, el visado es más fácil." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/canada.php", descripcion: "Registro gratuito, muchas familias en Toronto, Vancouver y Montreal." },
      ],
      requisitos: "18-35 años (IEC Working Holiday), inglés o francés básico, experiencia con niños, sin antecedentes. Canadá incluye el au pair dentro del programa International Experience Canada (IEC) — más fácil que el visado de trabajo normal. Sueldo: ~$800-1000 CAD/mes + alojamiento y comida.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Kijiji", url: "https://www.kijiji.ca/b-room-rental/canada", descripcion: "El portal más usado en Canadá para alquilar habitaciones. Mucha oferta." },
        { nombre: "PadMapper", url: "https://www.padmapper.com", descripcion: "Mapa interactivo de alquileres. Muy visual para elegir zona." },
        { nombre: "Spotahome", url: "https://www.spotahome.com/canada", descripcion: "Alquiler verificado en Montreal, Toronto y Vancouver." },
        { nombre: "Hostelworld", url: "https://www.hostelworld.com/hostels/Canada", descripcion: "Albergues canadienses desde $25 CAD/noche." },
      ],
      consejo: "Toronto y Vancouver son carísimos (habitación $800-1200 CAD). Montreal es más barato y también tiene mucho trabajo. Muchos españoles empiezan en Montreal por el costo de vida. El invierno es DURO — busca alojamiento con calefacción incluida.",
    },
    visado: {
      tipo: "working-holiday",
      descripcion: "Canadá tiene el programa IEC (International Experience Canada) para españoles de 18-35 años: Working Holiday (visa abierta, 1 año), Young Professionals (si tienes oferta de trabajo cualificada), o Co-op (prácticas de estudios). Se abre por cupos una vez al año — hay que estar atento. La visa Working Holiday es la más flexible: puedes trabajar en lo que quieras sin oferta previa.",
      enlaceOficial: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/iec.html",
    },
  },

  AU: {
    codigo: "AU",
    auPair: {
      disponible: true,
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/australia", descripcion: "Muchas familias australianas. Con la Working Holiday Visa es muy fácil." },
        { nombre: "Smart Au Pairs", url: "https://www.smartaupairs.com.au", descripcion: "Agencia australiana especializada. Te ayudan con todo el proceso." },
      ],
      requisitos: "18-35 años (Working Holiday Visa), inglés intermedio, experiencia con niños. Australia es el destino más fácil para au pairs españoles porque la Working Holiday visa lo permite sin trámites adicionales. Sueldo: $200-350 AUD/semana + alojamiento y comida.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Flatmates.com.au", url: "https://flatmates.com.au", descripcion: "El portal #1 para compartir piso en Australia. Miles de habitaciones." },
        { nombre: "Domain", url: "https://www.domain.com.au/rent", descripcion: "Alquileres de todo tipo. Ideal para cuando ya llevas un tiempo." },
        { nombre: "Hostelworld", url: "https://www.hostelworld.com/hostels/Australia", descripcion: "Albergues desde $20 AUD/noche. Muchos mochileros empiezan aquí." },
      ],
      consejo: "Los alquileres en Australia se pagan por semana, no por mes. Sídney es caro ($250-400 AUD/semana por habitación). Melbourne y Brisbane son más baratos. Muchos españoles viven en hostels las primeras semanas mientras buscan piso. Compartir casa es lo normal.",
    },
    visado: {
      tipo: "working-holiday",
      descripcion: "Los españoles de 18 a 35 años pueden solicitar la Working Holiday Visa (subclass 417). Permite trabajar 12 meses (prorrogable a 24 si haces 88 días de trabajo regional — granjas, etc). No necesitas oferta de trabajo previa. Cuesta ~$635 AUD y se tramita online. Se aprueba en días/semanas. Es el visado más fácil para trabajar en Australia.",
      enlaceOficial: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-417",
    },
    programasExtra: [
      { nombre: "HelpX", url: "https://www.helpx.net", descripcion: "Trabajo voluntario a cambio de alojamiento y comida. Muy popular en Australia — granjas, hostels, familias." },
      { nombre: "WWOOF Australia", url: "https://wwoof.com.au", descripcion: "Vive y trabaja en granjas orgánicas. Alojamiento y comida gratis. Experiencia rural única." },
    ],
  },

  DE: {
    codigo: "DE",
    auPair: {
      disponible: true,
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/germany", descripcion: "Alemania es el destino #1 en Europa continental para au pairs. Sueldo: 260€/mes + 50€ para curso de alemán." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/germany.php", descripcion: "Miles de familias alemanas. Muy buena organización." },
      ],
      requisitos: "18-26 años, alemán básico (A1), sin antecedentes. Al estar en la UE no necesitas visado. Alemania exige que el au pair tome un curso de alemán (la familia paga 50€/mes). Estancia: 6-12 meses. El visado Schengen cubre los primeros 3 meses — después te registras en la oficina de extranjería (Ausländerbehörde).",
    },
    alojamiento: {
      plataformas: [
        { nombre: "WG-Gesucht", url: "https://www.wg-gesucht.de", descripcion: "El portal #1 para compartir piso (WG) en Alemania. Imprescindible." },
        { nombre: "ImmobilienScout24", url: "https://www.immobilienscout24.de", descripcion: "El portal de alquiler más grande. Pisos, estudios, habitaciones." },
        { nombre: "Spotahome", url: "https://www.spotahome.com/berlin", descripcion: "Alquiler verificado en Berlin, Munich, Frankfurt. Reserva online." },
      ],
      consejo: "En Alemania se alquila mucho sin muebles (hasta la cocina). Busca 'möbliert' (amueblado). Necesitarás SCHUFA (certificado de solvencia) — para recién llegados, una carta de tu empleador o extracto bancario suele valer. Deposito típico: 2-3 meses de alquiler frío (Kaltmiete).",
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: sin visado. Puedes vivir y trabajar libremente. Solo necesitas registrarte en la oficina de empadronamiento (Anmeldung) en los primeros 14 días. Para trabajar necesitas número de identificación fiscal (Steuer-ID) que recibes automáticamente tras el registro.",
    },
  },

  NL: {
    codigo: "NL",
    auPair: {
      disponible: true,
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/netherlands", descripcion: "Países Bajos es muy popular. Todo el mundo habla inglés. Sueldo: 300-340€/mes." },
      ],
      requisitos: "18-30 años, inglés básico (el neerlandés no es obligatorio), sin antecedentes. Al estar en la UE no necesitas visado. Necesitas registrarte en el municipio (BSN number). Estancia típica: 12 meses máximo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Kamernet", url: "https://kamernet.nl", descripcion: "El portal #1 para habitaciones y estudios en Países Bajos." },
        { nombre: "Pararius", url: "https://www.pararius.com", descripcion: "Alquileres en todo el país. También en inglés." },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/Netherlands", descripcion: "Alquiler para expats. Muy usado por internacionales en Ámsterdam." },
      ],
      consejo: "Ámsterdam es extremadamente caro y hay crisis de vivienda. Rotterdam, Utrecht y Eindhoven son buenas alternativas más baratas con mucho trabajo. Muchos españoles viven en ciudades cercanas y viajan en tren (el país es pequeño).",
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: sin visado. Regístrate en el municipio para obtener el BSN (Burger Service Nummer) — lo necesitas para trabajar, abrir cuenta bancaria y alquilar.",
    },
  },

  CH: {
    codigo: "CH",
    auPair: {
      disponible: true,
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/switzerland", descripcion: "Suiza paga el mejor sueldo de au pair de Europa: 500-800 CHF/mes." },
      ],
      requisitos: "18-30 años, alemán/francés/italiano básico (según zona), sin antecedentes. Suiza no es UE pero tiene acuerdos — los españoles pueden ser au pair con permiso especial. La familia gestiona el permiso. Estancia: 12 meses máximo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Flatfox", url: "https://flatfox.ch", descripcion: "Portal de alquiler suizo. Habitaciones y pisos compartidos." },
        { nombre: "Homegate", url: "https://www.homegate.ch", descripcion: "El portal más grande de alquiler en Suiza." },
      ],
      consejo: "Suiza es MUY caro. Una habitación en Zúrich: 800-1200 CHF/mes. Pero los sueldos son altos y compensa. Compartir piso (WG) es lo normal para recién llegados. Necesitarás permiso de residencia (la empresa o la familia au pair te lo gestionan).",
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Suiza no es UE pero tiene acuerdos de libre circulación con España. Puedes trabajar sin visado pero necesitas permiso de residencia (B permit para estancias largas, L permit para cortas). Lo tramita tu empleador o la familia au pair ante la oficina de migración cantonal.",
    },
  },

  FR: {
    codigo: "FR",
    auPair: {
      disponible: true,
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/france", descripcion: "Francia es destino clásico de au pair. Muy cerca de España. Sueldo: 320€/mes." },
      ],
      requisitos: "18-30 años, francés básico, sin antecedentes. Sin visado (UE). Francia es estricta con el contrato au pair — debe registrarse en la DIRECCTE. Estancia: 12 meses. La familia paga curso de francés y seguro médico.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Leboncoin", url: "https://www.leboncoin.fr/locations", descripcion: "El portal de anuncios más usado en Francia. Alquileres de todo tipo." },
        { nombre: "SeLoger", url: "https://www.seloger.com", descripcion: "Portal profesional de alquiler. Pisos y estudios." },
        { nombre: "La Carte des Colocs", url: "https://www.lacartedescolocs.fr", descripcion: "Especializado en pisos compartidos. Ideal para recién llegados." },
      ],
      consejo: "En Francia piden muchos documentos para alquilar (aval francés o garantía bancaria). Para recién llegados, lo más fácil es compartir piso (colocation) o subarrendar. París es muy caro — Lyon, Toulouse y Burdeos son buenas alternativas.",
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: sin visado. Libertad total de circulación y trabajo. Para estancias largas, conviene registrarse en la Sécurité Sociale para tener cobertura sanitaria.",
    },
  },

  SE: { codigo: "SE", auPair: { disponible: true, plataformas: [{ nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/sweden", descripcion: "Suecia paga bien al au pair: 3,500 SEK/mes + curso de sueco." }], requisitos: "18-30 años, inglés básico (el sueco no es obligatorio). Sin visado (UE). Muy buena calidad de vida." }, alojamiento: { plataformas: [{ nombre: "Blocket Bostad", url: "https://bostad.blocket.se", descripcion: "Portal de alquiler sueco. Muy popular en Estocolmo y Gotemburgo." }, { nombre: "Qasa", url: "https://qasa.se", descripcion: "Alquiler moderno. Contratos digitales en inglés." }], consejo: "Estocolmo tiene colas de años para alquiler de primera mano. Lo normal es subarrendar (andrahandsuthyrning). Presupuesta 500-800€ para habitación." }, visado: { tipo: "ue-libre", descripcion: "Ciudadano UE: sin visado. Necesitas personnummer (número de identidad fiscal) para trabajar — se tramita en Skatteverket." } },

  NO: { codigo: "NO", auPair: { disponible: true, plataformas: [{ nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/norway", descripcion: "Noruega paga muy bien: 5,900 NOK/mes. Pero exige curso de noruego." }], requisitos: "18-30 años, inglés fluido (noruego básico recomendado). Sin visado para UE/EFTA. Sueldo mínimo de au pair regulado por el estado." }, alojamiento: { plataformas: [{ nombre: "Finn.no", url: "https://www.finn.no/realestate/lettings", descripcion: "El portal noruego para todo. Alquiler, trabajo, segunda mano." }, { nombre: "Hybel", url: "https://hybel.no", descripcion: "Especializado en alquiler. Muy usado en Oslo." }], consejo: "Noruega es carísimo. Habitación en Oslo: 6000-9000 NOK/mes. Pero los sueldos son altos. Muchos au pairs noruegos ahorran bastante." }, visado: { tipo: "ue-libre", descripcion: "España está en la UE — Noruega está en el EEE. Libre circulación: sin visado. Necesitas D-number o personnummer para trabajar." } },

  IT: { codigo: "IT", auPair: { disponible: true, plataformas: [{ nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/italy", descripcion: "Italia, cerca de casa. Sueldo: 250-300€/mes. Ideal para aprender italiano." }], requisitos: "18-30 años, italiano o inglés básico, sin antecedentes. Sin visado (UE)." }, alojamiento: { plataformas: [{ nombre: "Idealista Italia", url: "https://www.idealista.it", descripcion: "El Idealista de Italia. Alquileres y habitaciones." }, { nombre: "Spotahome", url: "https://www.spotahome.com/rome", descripcion: "Alquiler verificado en Roma, Milán, Florencia." }], consejo: "Italia tiene contratos de alquiler muy rígidos. Para estancias cortas, mejor buscar habitaciones en grupos de Facebook de españoles en Italia." }, visado: { tipo: "ue-libre", descripcion: "Ciudadano UE: sin visado. Necesitas codice fiscale para trabajar — se tramita en la Agenzia delle Entrate." } },

  PT: { codigo: "PT", auPair: { disponible: true, plataformas: [{ nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/portugal", descripcion: "Portugal, el más cercano. Sueldo bajo pero vida barata." }], requisitos: "18-30 años, portugués o inglés básico. Sin visado (UE)." }, alojamiento: { plataformas: [{ nombre: "Idealista Portugal", url: "https://www.idealista.pt", descripcion: "Alquileres en Lisboa, Oporto, Algarve." }, { nombre: "Uniplaces", url: "https://www.uniplaces.com", descripcion: "Alquiler para estudiantes y jóvenes. Muy usado en Lisboa." }], consejo: "Lisboa y Oporto están caros para el sueldo portugués. Busca en ciudades medianas como Braga, Coimbra o Aveiro. Mucho más baratas y con buena calidad de vida." }, visado: { tipo: "ue-libre", descripcion: "Ciudadano UE: sin visado. Necesitas NIF (Número de Identificação Fiscal) para trabajar." } },

  ES: { codigo: "ES", auPair: { disponible: false, plataformas: [], requisitos: "" }, alojamiento: { plataformas: [{ nombre: "Idealista", url: "https://www.idealista.com", descripcion: "El portal de alquiler líder en España." }, { nombre: "Spotahome", url: "https://www.spotahome.com/madrid", descripcion: "Alquiler verificado en Madrid, Barcelona, Valencia." }], consejo: "Madrid y Barcelona son caros. Ciudades como Valencia, Sevilla, Málaga o Bilbao ofrecen buena calidad de vida a mejor precio." }, visado: { tipo: "ue-libre", descripcion: "Ciudadano español: ningún trámite. Tu DNI y número de Seguridad Social son suficientes." } },
};

// Países con info genérica (misma estructura para no llenar de undefineds)
const PAISES_GENERICOS: string[] = ["BE", "AT", "DK", "FI", "PL"];

for (const code of PAISES_GENERICOS) {
  const nombres: Record<string, string> = {
    BE: "Bélgica", AT: "Austria", DK: "Dinamarca", FI: "Finlandia", PL: "Polonia",
  };
  BASE_INFO[code] = {
    codigo: code,
    auPair: {
      disponible: true,
      plataformas: [
        { nombre: "AuPairWorld", url: `https://www.aupairworld.com/en/au-pair/${code.toLowerCase()}`, descripcion: `Familias en ${nombres[code]} buscando au pair. Registro gratuito.` },
      ],
      requisitos: "18-30 años, idioma local o inglés básico. Sin visado (UE). Condiciones según legislación local.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Spotahome", url: "https://www.spotahome.com", descripcion: "Alquiler verificado en principales ciudades europeas." },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com", descripcion: "Alquiler para expats y estudiantes. Reserva online." },
        { nombre: "Hostelworld", url: "https://www.hostelworld.com", descripcion: "Albergues para los primeros días." },
      ],
      consejo: "Busca grupos de Facebook de españoles en la ciudad de destino. Suelen ser la mejor fuente de pisos compartidos para recién llegados.",
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: sin visado. Libre circulación y trabajo. Solo necesitas registrarte en el municipio y obtener número de identificación fiscal local.",
    },
  };
}

export function getPrimerosPasos(codigo: string): PrimerosPasosInfo | null {
  return BASE_INFO[codigo] || null;
}
