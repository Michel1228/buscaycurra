/**
 * lib/primeros-pasos.ts
 * Información práctica verificada para emigrar a cada país.
 * Actualizado: mayo 2026. Fuentes: portales oficiales + Eurostat + embajadas.
 */

export interface PrimerosPasosInfo {
  codigo: string;
  auPair: {
    disponible: boolean;
    plataformas: { nombre: string; url: string; descripcion: string }[];
    requisitos: string;
    sueldoMensual?: string;
  };
  alojamiento: {
    plataformas: { nombre: string; url: string; descripcion: string }[];
    consejo: string;
    preciosMedios: { ciudad: string; rango: string; moneda: string }[];
  };
  visado: {
    tipo: "ue-libre" | "visado-trabajo" | "working-holiday" | "visado-estudiante";
    descripcion: string;
    enlaceOficial?: string;
  };
  papeleo: {
    documentos: {
      nombre: string;
      descripcion: string;
      tiempoObtener: string;
      obligatorio: boolean;
      enlaceOficial?: string;
    }[];
    consejo: string;
  };
  programasExtra?: { nombre: string; url: string; descripcion: string }[];
}

const BASE_INFO: Record<string, PrimerosPasosInfo> = {

  // ─── ALEMANIA ────────────────────────────────────────────────────────────────
  DE: {
    codigo: "DE",
    auPair: {
      disponible: true,
      sueldoMensual: "260-320€/mes + 50€ curso de alemán",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/germany", descripcion: "Destino #1 en Europa continental. Más de 50.000 familias alemanas registradas." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/germany.php", descripcion: "Registro gratuito. Miles de familias verificadas en todo el país." },
        { nombre: "IJAB", url: "https://www.ijab.de/au-pair", descripcion: "Servicio oficial alemán de intercambio juvenil. Muy recomendable para trámites." },
      ],
      requisitos: "18-26 años, alemán A1 mínimo (la familia paga el curso), sin antecedentes penales. Sin visado al ser UE. Contrato oficial obligatorio. Duración: 6-12 meses. La familia cubre el seguro médico y el curso de idioma.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "WG-Gesucht", url: "https://www.wg-gesucht.de", descripcion: "El portal #1 para compartir piso (WG) en Alemania. Imprescindible para recién llegados." },
        { nombre: "ImmobilienScout24", url: "https://www.immobilienscout24.de", descripcion: "El portal de alquiler más grande del país. Pisos, estudios y habitaciones." },
        { nombre: "Spotahome", url: "https://www.spotahome.com/s/berlin", descripcion: "Alquiler verificado en Berlín, Múnich, Frankfurt y Hamburgo. Reserva 100% online." },
        { nombre: "Wohnungsboerse", url: "https://www.wohnungsboerse.net", descripcion: "Buena alternativa a ImmobilienScout. Más barato en ciudades medianas." },
      ],
      consejo: "En Alemania los pisos se alquilan SIN muebles (ni cocina). Busca 'möbliert' para amueblado. Necesitarás SCHUFA (historial crediticio) — para recién llegados, una carta de tu empleador vale. Depósito: 2-3 meses de alquiler frío (Kaltmiete).",
      preciosMedios: [
        { ciudad: "Berlín", rango: "600-1.000", moneda: "€/mes por habitación" },
        { ciudad: "Múnich", rango: "900-1.500", moneda: "€/mes por habitación" },
        { ciudad: "Frankfurt", rango: "800-1.300", moneda: "€/mes por habitación" },
        { ciudad: "Hamburgo", rango: "700-1.200", moneda: "€/mes por habitación" },
        { ciudad: "Colonia", rango: "650-1.000", moneda: "€/mes por habitación" },
        { ciudad: "Stuttgart", rango: "750-1.200", moneda: "€/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: libre circulación. Sin visado. Regístrate en el Bürgeramt (Anmeldung) en los primeros 14 días. Necesitas el Steuer-ID (nº fiscal) que llega automáticamente por correo 4-6 semanas después del registro.",
      enlaceOficial: "https://www.germany.info/es-de/service/03-Visa/spanier-in-deutschland/919118",
    },
    papeleo: {
      documentos: [
        { nombre: "Anmeldung (empadronamiento)", descripcion: "Registro en el Bürgeramt de tu ciudad. Obligatorio en los primeros 14 días. Sin esto no puedes abrir cuenta bancaria ni contratar nada.", tiempoObtener: "El mismo día (pide cita online antes)", obligatorio: true, enlaceOficial: "https://service.berlin.de/dienstleistung/120686/" },
        { nombre: "Steuer-ID (número fiscal)", descripcion: "Llega por correo postal 4-6 semanas después del Anmeldung. Sin él no puedes cobrar nómina correctamente. Si urge, pídelo en el Finanzamt.", tiempoObtener: "4-6 semanas (automático tras Anmeldung)", obligatorio: true },
        { nombre: "Krankenversicherung (seguro médico)", descripcion: "Obligatorio para trabajar. Las públicas más usadas: TK (Techniker Krankenkasse), AOK, Barmer. Cuota: ~7-8% de tu sueldo bruto (la mitad la paga el empleador).", tiempoObtener: "1-3 días (solicitud online)", obligatorio: true, enlaceOficial: "https://www.tk.de/en/international-patients/work-in-germany" },
        { nombre: "SCHUFA", descripcion: "Historial crediticio. Lo pide el casero para alquilar. Para recién llegados: usa una carta de tu empleador como alternativa o pide el SCHUFA Bonitätsauskunft online.", tiempoObtener: "Online inmediato (hay coste) o gratis por correo (4 semanas)", obligatorio: false, enlaceOficial: "https://www.meineschufa.de" },
        { nombre: "Cuenta bancaria", descripcion: "N26 o Bunq son las más fáciles para recién llegados (100% online, sin Anmeldung). Para cuentas tradicionales (Sparkasse, Deutsche Bank) necesitas el Anmeldung.", tiempoObtener: "1-7 días", obligatorio: true },
      ],
      consejo: "El orden correcto: 1) Anmeldung → 2) Abrir cuenta bancaria → 3) Contratar seguro médico → 4) Empezar a trabajar. Con N26 puedes saltar el paso 1 si estás en proceso.",
    },
    programasExtra: [
      { nombre: "Bundesagentur für Arbeit", url: "https://www.arbeitsagentur.de/", descripcion: "La agencia de empleo federal. Registro gratuito. También gestiona el subsidio de desempleo (ALG I)." },
      { nombre: "Make it in Germany", url: "https://www.make-it-in-germany.com/es", descripcion: "Portal oficial del gobierno alemán para extranjeros. Todo sobre visados, reconocimiento de títulos y vivir en Alemania." },
    ],
  },

  // ─── IRLANDA ─────────────────────────────────────────────────────────────────
  IE: {
    codigo: "IE",
    auPair: {
      disponible: true,
      sueldoMensual: "320-480€/mes (80-120€/semana + alojamiento y comida)",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/ireland", descripcion: "Irlanda es top para au pairs por el inglés y la facilidad al ser UE. Cientos de familias en Dublín y Cork." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/ireland.php", descripcion: "Registro gratuito. Proceso sencillo para ciudadanos UE." },
      ],
      requisitos: "18-30 años, inglés básico, sin antecedentes. Sin visado (UE). Duración: 6-12 meses. La familia cubre alojamiento, comida y seguro médico básico.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Daft.ie", url: "https://www.daft.ie", descripcion: "El portal de alquiler #1 de Irlanda. Habitaciones y pisos compartidos en todo el país." },
        { nombre: "Rent.ie", url: "https://www.rent.ie", descripcion: "Segunda opción más popular. También tiene pisos en Cork, Galway y Limerick." },
        { nombre: "Myhome.ie", url: "https://www.myhome.ie", descripcion: "Portal de ventas y alquiler. Más orientado a pisos completos." },
        { nombre: "Spotahome", url: "https://www.spotahome.com/s/dublin", descripcion: "Alquiler verificado en Dublín. Reserva 100% online — ideal si llegas desde España." },
      ],
      consejo: "Dublín está en crisis de vivienda severa. Habitación: 900-1.500€/mes. Cork y Galway son mucho más baratas y tienen buenas oportunidades laborales. Busca en Facebook Groups: 'Rooms to Rent Dublin' o 'Spanish in Dublin'.",
      preciosMedios: [
        { ciudad: "Dublín", rango: "900-1.500", moneda: "€/mes por habitación" },
        { ciudad: "Cork", rango: "600-950", moneda: "€/mes por habitación" },
        { ciudad: "Galway", rango: "650-1.000", moneda: "€/mes por habitación" },
        { ciudad: "Limerick", rango: "500-800", moneda: "€/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: libre circulación. Sin visado. Para trabajar y residir, tramita el PPS Number en una oficina Intreo. Con DNI o pasaporte es suficiente.",
      enlaceOficial: "https://www.gov.ie/en/service/12e6de-get-a-personal-public-service-pps-number/",
    },
    papeleo: {
      documentos: [
        { nombre: "PPS Number", descripcion: "Personal Public Service Number. El equivalente al NIE español. Sin él no puedes trabajar ni cobrar legalmente. Trámite en oficina Intreo (lleva pasaporte + justificante de domicilio).", tiempoObtener: "1-5 días hábiles", obligatorio: true, enlaceOficial: "https://www.gov.ie/en/service/12e6de-get-a-personal-public-service-pps-number/" },
        { nombre: "Revenue MyAccount", descripcion: "Registro en la agencia tributaria irlandesa (Revenue). Necesario para que te apliquen el tramo correcto del IRPF. Si no lo haces, te cobrarán el tipo máximo de emergencia.", tiempoObtener: "Online, 1-3 días", obligatorio: true, enlaceOficial: "https://www.ros.ie/myaccount-web/home.html" },
        { nombre: "Cuenta bancaria", descripcion: "N26 o Revolut para empezar (sin dirección irlandesa). Para cuentas locales: Bank of Ireland, AIB o An Post Money (más fácil para recién llegados).", tiempoObtener: "1-7 días", obligatorio: true },
        { nombre: "Tarjeta de médico (GP)", descripcion: "Regístrate con un médico de cabecera (GP). Para urgencias: Urgent Care Centres privados (~50-70€ la consulta). La sanidad pública (HSE) requiere residencia.", tiempoObtener: "1-2 semanas", obligatorio: false, enlaceOficial: "https://www2.hse.ie/services/find-a-gp/" },
      ],
      consejo: "Consigue el PPS Number en los primeros 7 días. Sin él tu primer sueldo puede tener retención de emergencia (40%). Lleva al Intreo: pasaporte, carta de tu empleador y justificante de domicilio.",
    },
  },

  // ─── REINO UNIDO ─────────────────────────────────────────────────────────────
  UK: {
    codigo: "UK",
    auPair: {
      disponible: true,
      sueldoMensual: "400-680€/mes (£100-170/semana)",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/united-kingdom", descripcion: "El más grande para UK. Atención: post-Brexit necesitas visado — el proceso ha cambiado." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/united-kingdom.php", descripcion: "Miles de familias británicas. Verificadas y con contratos estándar." },
        { nombre: "GreatAuPair", url: "https://www.greataupair.com/uk-au-pair.cfm", descripcion: "Opción alternativa con buenas reseñas. También gestiona el proceso de visado." },
      ],
      requisitos: "POST-BREXIT el visado específico de au pair YA NO EXISTE, desapareció en enero de 2021. Y ojo con el Youth Mobility Scheme, que se cita mucho: NO incluye a España ni a ningún país de la UE, así que esa vía no está disponible (comprobado en gov.uk, septiembre de 2026). Queda el Skilled Worker, que exige una empresa con licencia de patrocinio: una familia particular no puede patrocinarte. Si una familia te propone ir sin papeles, quien se juega la expulsión eres tú.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "SpareRoom", url: "https://www.spareroom.co.uk", descripcion: "El portal #1 en UK para habitaciones. Perfecto para recién llegados. Versión gratuita funciona bien." },
        { nombre: "Rightmove", url: "https://www.rightmove.co.uk/property-to-rent.html", descripcion: "Portal más grande de UK. Más orientado a pisos completos." },
        { nombre: "Zoopla", url: "https://www.zoopla.co.uk/to-rent", descripcion: "Segunda opción popular. Buenos filtros por zona y precio." },
        { nombre: "Spotahome", url: "https://www.spotahome.com/s/london", descripcion: "Alquiler verificado en Londres, Manchester, Birmingham. Sin visitas — reserva online." },
      ],
      consejo: "Londres es muy caro. Comparte piso siempre al principio. Manchester, Birmingham, Leeds y Bristol tienen salarios parecidos pero costes mucho menores. Pide 2 meses de fianza + primer mes = 3 meses de alquiler por adelantado.",
      preciosMedios: [
        { ciudad: "Londres", rango: "1.000-1.800", moneda: "£/mes por habitación" },
        { ciudad: "Manchester", rango: "550-900", moneda: "£/mes por habitación" },
        { ciudad: "Birmingham", rango: "500-800", moneda: "£/mes por habitación" },
        { ciudad: "Edimburgo", rango: "650-1.000", moneda: "£/mes por habitación" },
        { ciudad: "Leeds", rango: "500-750", moneda: "£/mes por habitación" },
        { ciudad: "Bristol", rango: "600-950", moneda: "£/mes por habitación" },
      ],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Post-Brexit ningún país de la UE tiene libre circulación aquí: hace falta visado, seas español, italiano o polaco. La vía normal es el Skilled Worker Visa, que exige oferta de una empresa con licencia de patrocinio; en sanidad y cuidados está el Health & Care Worker Visa, más rápido. IMPORTANTE: el Youth Mobility Scheme NO incluye a España ni a la UE — sí a Australia, Canadá, Nueva Zelanda, Corea del Sur, Andorra, Islandia, Japón, Mónaco, San Marino y Uruguay (comprobado en gov.uk, septiembre de 2026).",
      enlaceOficial: "https://www.gov.uk/browse/visas-immigration/work-visas",
    },
    papeleo: {
      documentos: [
        { nombre: "National Insurance Number (NI)", descripcion: "El equivalente al número de la Seguridad Social. Necesario para trabajar y pagar impuestos. Solicítalo en HMRC por teléfono o carta. Llega por correo postal.", tiempoObtener: "3-6 semanas", obligatorio: true, enlaceOficial: "https://www.gov.uk/apply-national-insurance-number" },
        { nombre: "Cuenta bancaria", descripcion: "Monzo o Revolut son las más fáciles para empezar (solo con pasaporte). Para cuentas tradicionales (Barclays, HSBC, Lloyds) necesitas prueba de domicilio.", tiempoObtener: "1-7 días", obligatorio: true },
        { nombre: "Registro con médico de cabecera (GP)", descripcion: "El NHS es gratuito para quienes tienen permiso de residencia. Regístrate en una consulta local con tu pasaporte y dirección.", tiempoObtener: "1-2 semanas", obligatorio: false, enlaceOficial: "https://www.nhs.uk/nhs-services/gps/how-to-register-with-a-gp-surgery/" },
        { nombre: "HMRC Personal Tax Account", descripcion: "Gestiona tus impuestos online. Asegúrate de que tu código fiscal (tax code) sea correcto — si aparece 'emergency tax', llama a HMRC.", tiempoObtener: "Online inmediato", obligatorio: true, enlaceOficial: "https://www.gov.uk/personal-tax-account" },
      ],
      consejo: "Abre Monzo o Revolut el primer día — no necesitas dirección. El NI Number puede tardar semanas pero puedes trabajar sin él mientras lo tramitas (solo informa a tu empleador).",
    },
    programasExtra: [
      { nombre: "Workaway UK", url: "https://www.workaway.info/en/hostlist/GB", descripcion: "Voluntariado a cambio de alojamiento y comida. Más de 2.000 anfitriones en UK." },
    ],
  },

  // ─── ESTADOS UNIDOS ──────────────────────────────────────────────────────────
  US: {
    codigo: "US",
    auPair: {
      disponible: true,
      sueldoMensual: "~1.000-1.200€/mes ($250-300/semana + alojamiento, comida y 500$ para estudios)",
      plataformas: [
        { nombre: "Cultural Care Au Pair", url: "https://www.culturalcare.com", descripcion: "La agencia más grande de EEUU. Gestionan el visado J-1 de principio a fin." },
        { nombre: "AuPairCare", url: "https://www.aupaircare.com", descripcion: "Programa de 12-24 meses con familias verificadas. Coordinador local asignado." },
        { nombre: "AuPair in America", url: "https://www.aupairinamerica.com", descripcion: "Uno de los programas más antiguos y reputados. Muy buena red de apoyo." },
        { nombre: "Go Au Pair", url: "https://www.goaupair.com", descripcion: "Proceso online ágil. Buena comunidad de au pairs españoles en EEUU." },
      ],
      requisitos: "18-26 años, inglés intermedio, título de secundaria, mínimo 200h de experiencia documentada con niños, carnet de conducir internacional. Visado J-1 obligatorio a través de agencia oficial (no se puede gestionar solo). Duración: 12-24 meses.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Zillow", url: "https://www.zillow.com/homes/for_rent", descripcion: "El portal de alquiler más grande de EEUU. Cobertura nacional completa." },
        { nombre: "Apartments.com", url: "https://www.apartments.com", descripcion: "Especializado en complejos residenciales. Bueno para ciudades grandes." },
        { nombre: "Roomies.com", url: "https://www.roomies.com", descripcion: "Para compartir piso (roommates). Ideal para recién llegados sin historial crediticio." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.es/s/United-States/homes?monthly_stay=true", descripcion: "Para el primer mes mientras buscas algo fijo. Más caro pero sin contrato." },
      ],
      consejo: "Sin credit score (historial crediticio) es difícil alquilar directamente. Opciones: paga 2-3 meses de fianza, pide a alguien que sea tu guarantor, o busca sublets (subarrendamientos). Los grupos de Facebook de 'Españoles en [ciudad]' son la mejor fuente.",
      preciosMedios: [
        { ciudad: "Nueva York", rango: "1.500-2.800", moneda: "$/mes por habitación" },
        { ciudad: "Los Ángeles", rango: "1.200-2.200", moneda: "$/mes por habitación" },
        { ciudad: "Chicago", rango: "900-1.500", moneda: "$/mes por habitación" },
        { ciudad: "Miami", rango: "1.200-2.000", moneda: "$/mes por habitación" },
        { ciudad: "San Francisco", rango: "1.500-2.800", moneda: "$/mes por habitación" },
        { ciudad: "Boston", rango: "1.200-2.000", moneda: "$/mes por habitación" },
      ],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Los españoles necesitan visado para trabajar en EEUU. Opciones: J-1 (au pair, prácticas, verano — el más accesible), H-1B (profesionales, sorteo anual en marzo, muy difícil), L-1 (traslado interno en empresa), O-1 (talento extraordinario). Para au pair siempre se tramita el J-1 a través de la agencia.",
      enlaceOficial: "https://travel.state.gov/content/travel/en/us-visas/employment.html",
    },
    papeleo: {
      documentos: [
        { nombre: "Social Security Number (SSN)", descripcion: "El NIF americano. Solo se obtiene si tienes autorización de trabajo (visado J-1, H-1B, etc.). Solicítalo en la oficina Social Security Administration más cercana. Lleva pasaporte + visado + I-94.", tiempoObtener: "2-4 semanas tras entrada", obligatorio: true, enlaceOficial: "https://www.ssa.gov/ssnumber/" },
        { nombre: "Cuenta bancaria", descripcion: "Chase, Bank of America o Wells Fargo son los más comunes. Con pasaporte + SSN (o ITIN) + dirección. Alternativa: Wise o Revolut para empezar.", tiempoObtener: "1-5 días", obligatorio: true },
        { nombre: "Driver's License o State ID", descripcion: "El carnet de identidad local. Ve al DMV (Department of Motor Vehicles) de tu estado con pasaporte, SSN y prueba de domicilio. Necesario para casi todo en EEUU.", tiempoObtener: "2-6 semanas (cita + correo)", obligatorio: false, enlaceOficial: "https://www.usa.gov/motor-vehicle-services" },
        { nombre: "Health Insurance", descripcion: "No hay sanidad pública universal. Como au pair, tu agencia incluye seguro médico obligatorio. Para otros visados: marketplace del ACA o seguro del empleador.", tiempoObtener: "Variable", obligatorio: true },
      ],
      consejo: "Primer día: activa tu visado J-1, guarda el I-94 (llega por email), y solicita el SSN. Sin SSN no puedes cobrar correctamente. Para au pairs la agencia te guía en todos los pasos.",
    },
    programasExtra: [
      { nombre: "Work & Travel USA (J-1 Summer)", url: "https://j1visa.state.gov/programs/summer-work-travel", descripcion: "Programa de verano para universitarios. 3-4 meses trabajando en EEUU. Muy popular entre españoles." },
      { nombre: "Camp Counselor", url: "https://www.campleaders.com", descripcion: "Monitor de campamento de verano. Alojamiento + comida + sueldo. Inglés B2 recomendado." },
    ],
  },

  // ─── CANADÁ ───────────────────────────────────────────────────────────────────
  CA: {
    codigo: "CA",
    auPair: {
      disponible: true,
      sueldoMensual: "600-750€/mes (800-1.000 CAD + alojamiento y comida)",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/canada", descripcion: "Muchas familias en Toronto, Vancouver y Montreal. El programa IEC facilita el visado." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/canada.php", descripcion: "Registro gratuito. Comunidad activa de españoles en Canadá." },
      ],
      requisitos: "18-35 años (IEC Working Holiday), inglés o francés funcional, experiencia con niños. Canadá integra el au pair dentro del programa IEC (International Experience Canada). Duración: hasta 12 meses.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Kijiji", url: "https://www.kijiji.ca/b-room-rental/canada", descripcion: "El portal más usado en Canadá para habitaciones. Amplia oferta en todo el país." },
        { nombre: "PadMapper", url: "https://www.padmapper.com", descripcion: "Mapa interactivo de alquileres. Muy visual para elegir barrio." },
        { nombre: "Spotahome", url: "https://www.spotahome.com/s/canada", descripcion: "Alquiler verificado en Montreal, Toronto y Vancouver. Sin visitas." },
        { nombre: "Facebook Marketplace", url: "https://www.facebook.com/marketplace/canada/rentals", descripcion: "Muy popular en Canadá para sublets y habitaciones. Muchos españoles lo usan." },
      ],
      consejo: "Toronto y Vancouver están entre las ciudades más caras del mundo. Montreal es hasta un 40% más barata, también habla francés y tiene mucha demanda laboral. El invierno es muy frío — busca alojamiento con calefacción incluida (heating included).",
      preciosMedios: [
        { ciudad: "Toronto", rango: "1.000-1.700", moneda: "CAD/mes por habitación" },
        { ciudad: "Vancouver", rango: "1.100-1.800", moneda: "CAD/mes por habitación" },
        { ciudad: "Montreal", rango: "700-1.200", moneda: "CAD/mes por habitación" },
        { ciudad: "Calgary", rango: "800-1.300", moneda: "CAD/mes por habitación" },
        { ciudad: "Ottawa", rango: "800-1.300", moneda: "CAD/mes por habitación" },
      ],
    },
    visado: {
      tipo: "working-holiday",
      descripcion: "Programa IEC (International Experience Canada) para españoles 18-35 años. Modalidades: Working Holiday (visa abierta 1 año, sin oferta previa — la más usada), Young Professionals (si tienes oferta de trabajo cualificada), Co-op (prácticas de estudios). Se abre por cupos una vez al año — suscríbete a las notificaciones del IRCC.",
      enlaceOficial: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/iec.html",
    },
    papeleo: {
      documentos: [
        { nombre: "SIN (Social Insurance Number)", descripcion: "El equivalente al número de la SS canadiense. Tramítalo en Service Canada el primer o segundo día. Solo necesitas tu pasaporte y el permiso de trabajo IEC. Sale el mismo día.", tiempoObtener: "El mismo día", obligatorio: true, enlaceOficial: "https://www.canada.ca/en/employment-social-development/services/sin.html" },
        { nombre: "Cuenta bancaria", descripcion: "TD Bank, RBC, BMO o Scotiabank. Con pasaporte + SIN + dirección. Alternativa sin SIN: Wise o Koho (cuenta digital). TD tiene convenio con Santander para españoles.", tiempoObtener: "1-5 días", obligatorio: true },
        { nombre: "Tarjeta sanitaria provincial", descripcion: "Cada provincia tiene su propio sistema. Ontario (OHIP): 3 meses de espera. BC (MSP): 3 meses. Durante la espera, busca seguro privado temporal (~80-100 CAD/mes).", tiempoObtener: "90 días + 2-4 semanas para la tarjeta", obligatorio: false, enlaceOficial: "https://www.ontario.ca/page/apply-ohip-and-get-health-card" },
        { nombre: "CRA My Account", descripcion: "Agencia Tributaria canadiense. Regístrate online para gestionar impuestos. Importante si trabajas desde enero a diciembre — habrá devolución en abril.", tiempoObtener: "Online, 1-3 días", obligatorio: false, enlaceOficial: "https://www.canada.ca/en/revenue-agency/services/e-services/cra-login-services/cra-user-password-help-faqs/registration-login.html" },
      ],
      consejo: "Saca el SIN el primer o segundo día. Sin él algunos empleadores no pueden contratarte. La tarjeta sanitaria tarda 3 meses — contrata un seguro privado temporal para ese período (desde 50 CAD/mes).",
    },
  },

  // ─── AUSTRALIA ───────────────────────────────────────────────────────────────
  AU: {
    codigo: "AU",
    auPair: {
      disponible: true,
      sueldoMensual: "120-210€/semana (200-350 AUD + alojamiento y comida)",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/australia", descripcion: "Con la Working Holiday Visa el proceso es muy sencillo. Muchas familias en Sídney y Melbourne." },
        { nombre: "Smart Au Pairs", url: "https://www.smartaupairs.com.au", descripcion: "Agencia australiana especializada. Te asignan coordinador local y hacen seguimiento continuo." },
        { nombre: "Gumtree Au Pair", url: "https://www.gumtree.com.au/s-au-pair+wanted/k0", descripcion: "La versión australiana de Wallapop. Muchas familias buscan au pair directamente aquí." },
      ],
      requisitos: "18-35 años (Working Holiday Visa 417 o 462), inglés funcional, experiencia con niños. La WHV permite trabajar de au pair sin trámite adicional. Duración: 6-12 meses (algunos se renuevan con 88 días de trabajo regional).",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Flatmates.com.au", url: "https://flatmates.com.au", descripcion: "El portal #1 para compartir casa en Australia. Miles de habitaciones en Sídney, Melbourne y Brisbane." },
        { nombre: "Domain", url: "https://www.domain.com.au/rent", descripcion: "Portal de alquiler premium. Más orientado a pisos completos y estancias largas." },
        { nombre: "Gumtree", url: "https://www.gumtree.com.au/s-flatshare-houseshare/k0", descripcion: "Buena opción para habitaciones baratas. Muy usado por mochileros y backpackers." },
        { nombre: "Hostelworld Australia", url: "https://www.hostelworld.com/st/hostels/p/australia", descripcion: "Albergues desde 25-40 AUD/noche para los primeros días." },
      ],
      consejo: "En Australia el alquiler se paga POR SEMANA (no por mes). Sídney y Melbourne son muy caros. Brisbane, Perth y Adelaide son más asequibles. Los primeros días en un hostel mientras buscas habitación es lo normal entre los recién llegados.",
      preciosMedios: [
        { ciudad: "Sídney", rango: "300-450", moneda: "AUD/semana por habitación" },
        { ciudad: "Melbourne", rango: "250-400", moneda: "AUD/semana por habitación" },
        { ciudad: "Brisbane", rango: "200-350", moneda: "AUD/semana por habitación" },
        { ciudad: "Perth", rango: "200-350", moneda: "AUD/semana por habitación" },
        { ciudad: "Adelaide", rango: "180-300", moneda: "AUD/semana por habitación" },
      ],
    },
    visado: {
      tipo: "working-holiday",
      descripcion: "OJO CON EL NÚMERO DEL VISADO, que no da igual. A España y a Latinoamérica les corresponde la subclase 462 (Work and Holiday), de 18 a 30 años, NO la 417, que es la de Francia, Alemania, Italia, Irlanda, Países Bajos o Reino Unido. La 462 pide, además del pasaporte, estudios superiores, acreditar nivel de inglés y unos ahorros mínimos, y tiene cupo anual por nacionalidad: cuando se agota no se conceden más hasta el 1 de julio siguiente. Permite trabajar 12 meses, prorrogables haciendo el trabajo especificado en zonas regionales. El importe y el cupo los publica el Departamento de Interior: míralos ahí, que cambian.",
      enlaceOficial: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462",
    },
    papeleo: {
      documentos: [
        { nombre: "TFN (Tax File Number)", descripcion: "Número fiscal australiano. Solicítalo en la ATO (Australian Tax Office) online antes incluso de llegar. Si no lo tienes, tu empleador te retendrá el 47% del sueldo.", tiempoObtener: "1-4 semanas (online)", obligatorio: true, enlaceOficial: "https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn" },
        { nombre: "Cuenta bancaria", descripcion: "Commonwealth Bank, ANZ, Westpac o NAB. Puedes abrirla ANTES de llegar a Australia (todo online con pasaporte). Muy recomendable para llegar con cuenta activa.", tiempoObtener: "Online, 1-3 días (antes de llegar)", obligatorio: true },
        { nombre: "Superannuation (fondo de pensiones)", descripcion: "Tu empleador ingresa el 11,5% de tu sueldo en un fondo de pensiones. Al salir de Australia puedes recuperarlo todo (DASP - Departing Australia Superannuation Payment). No lo ignores.", tiempoObtener: "Automático al empezar a trabajar", obligatorio: false, enlaceOficial: "https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families" },
        { nombre: "Medicare", descripcion: "La sanidad pública australiana. Solo disponible para residentes permanentes y ciudadanos. Con Working Holiday Visa NO tienes acceso. Contrata seguro privado (desde 30-50 AUD/mes con Bupa o Medibank).", tiempoObtener: "No aplica para WHV", obligatorio: false },
      ],
      consejo: "Abre la cuenta bancaria antes de salir de España (todo online). Solicita el TFN en cuanto tengas dirección australiana. Estos dos pasos te ahorran semanas de bloqueos administrativos al llegar.",
    },
    programasExtra: [
      { nombre: "HelpX", url: "https://www.helpx.net", descripcion: "Trabajo voluntario a cambio de alojamiento y comida. Muy popular — granjas, hostels, familias. Perfecto para recorrer el país." },
      { nombre: "WWOOF Australia", url: "https://wwoof.com.au", descripcion: "Vive y trabaja en granjas orgánicas. Alojamiento y comida gratis. También sirve para los 88 días de trabajo regional que extienden el visado." },
    ],
  },

  // ─── FRANCIA ─────────────────────────────────────────────────────────────────
  FR: {
    codigo: "FR",
    auPair: {
      disponible: true,
      sueldoMensual: "320-380€/mes + alojamiento, comida y curso de francés",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/france", descripcion: "Francia es destino clásico de au pair. Muchas familias en París, Lyon y Burdeos." },
        { nombre: "Familles.com", url: "https://www.familles.com/au-pair", descripcion: "Portal francés especializado. Las familias son verificadas y los contratos están registrados." },
      ],
      requisitos: "18-30 años, francés básico (A2 recomendado), sin antecedentes. Sin visado (UE). El contrato au pair debe registrarse en la DREETS (inspección de trabajo). Duración: 12 meses. La familia paga el seguro y el curso de idioma.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Leboncoin", url: "https://www.leboncoin.fr/locations", descripcion: "El portal de anuncios más usado en Francia. Habitaciones, estudios y pisos de todo tipo." },
        { nombre: "SeLoger", url: "https://www.seloger.com", descripcion: "Portal profesional. Más orientado a pisos completos con agencia." },
        { nombre: "La Carte des Colocs", url: "https://www.lacartedescolocs.fr", descripcion: "Especializado en pisos compartidos (colocation). El mejor para recién llegados." },
        { nombre: "PAP (De particulier à particulier)", url: "https://www.pap.fr/location", descripcion: "Alquiler directo entre particulares. Sin comisión de agencia." },
      ],
      consejo: "Para alquilar en Francia piden muchos documentos (dossier: nóminas, contrato, aval). Para recién llegados sin historial: busca colocation (piso compartido) o plataformas como Spotahome o Studapart. París es muy cara — Lyon, Toulouse, Burdeos y Nantes son excelentes alternativas.",
      preciosMedios: [
        { ciudad: "París", rango: "900-1.500", moneda: "€/mes por habitación" },
        { ciudad: "Lyon", rango: "550-850", moneda: "€/mes por habitación" },
        { ciudad: "Burdeos", rango: "500-750", moneda: "€/mes por habitación" },
        { ciudad: "Toulouse", rango: "450-700", moneda: "€/mes por habitación" },
        { ciudad: "Nantes", rango: "480-720", moneda: "€/mes por habitación" },
        { ciudad: "Marsella", rango: "480-750", moneda: "€/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: libre circulación y trabajo. Sin trámites de entrada. Para estancias largas conviene registrarse en la Sécurité Sociale para obtener cobertura sanitaria y la Carte Vitale.",
    },
    papeleo: {
      documentos: [
        { nombre: "Numéro de Sécurité Sociale", descripcion: "El número de la Seguridad Social francesa. Imprescindible para trabajar y acceder al sistema sanitario. Solicítalo en la CPAM de tu zona con pasaporte + contrato + justificante de domicilio.", tiempoObtener: "2-6 semanas", obligatorio: true, enlaceOficial: "https://www.ameli.fr/assure/droits-demarches/europe-international/vous-arrivez-en-france" },
        { nombre: "Carte Vitale", descripcion: "Tarjeta sanitaria verde que da acceso al reembolso de consultas médicas. Se solicita una vez tienes el numéro de Sécurité Sociale. Sin ella pagas todo y luego te reembolsan.", tiempoObtener: "2-4 semanas tras el número SS", obligatorio: false },
        { nombre: "CAF (Aide au logement)", descripcion: "Ayuda para el alquiler. Si ganas poco, puedes recibir 100-350€/mes en función de tu sueldo y ciudad. Solicítalo en cuanto firmes contrato de alquiler.", tiempoObtener: "4-8 semanas", obligatorio: false, enlaceOficial: "https://www.caf.fr" },
        { nombre: "Cuenta bancaria", descripcion: "BNP Paribas, Crédit Agricole, Société Générale. Para recién llegados sin historial: N26, Lydia o Revolut para empezar.", tiempoObtener: "1-7 días", obligatorio: true },
      ],
      consejo: "La CAF (ayuda al alquiler) puede ahorrarte cientos de euros al mes. Solicítala el mismo día que firmes el contrato de alquiler. Muchos españoles no lo saben y pierden meses de subvención.",
    },
  },

  // ─── PAÍSES BAJOS ────────────────────────────────────────────────────────────
  NL: {
    codigo: "NL",
    auPair: {
      disponible: true,
      sueldoMensual: "300-340€/mes + alojamiento y comida",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/netherlands", descripcion: "Países Bajos es muy popular: todos hablan inglés, salario bueno y buen ambiente." },
        { nombre: "Gastouderbureau", url: "https://www.gastouderbureau.nl", descripcion: "Agencia neerlandesa oficial de cuidado de niños. Contratos registrados y seguros." },
      ],
      requisitos: "18-30 años, inglés básico (el neerlandés no es obligatorio), sin antecedentes. Sin visado (UE). Máximo 12 meses. Necesitas BSN (número de registro municipal) para trabajar legalmente.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Kamernet", url: "https://kamernet.nl/en", descripcion: "El portal #1 para habitaciones en Países Bajos. Imprescindible para buscar WG (piso compartido)." },
        { nombre: "Pararius", url: "https://www.pararius.com/apartments/netherlands", descripcion: "Portal en inglés y neerlandés. Pisos completos y habitaciones." },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/Netherlands", descripcion: "Muy usado por expats e internacionales. Contratos digitales en inglés." },
        { nombre: "Funda", url: "https://www.funda.nl/huur", descripcion: "Portal más grande de NL. Más orientado a pisos completos." },
      ],
      consejo: "Ámsterdam tiene crisis de vivienda severa — las habitaciones se van en horas. Rotterdam, Utrecht y Eindhoven son alternativas más baratas con mucha oferta laboral. El país es pequeño: vivir fuera y ir en tren es habitual.",
      preciosMedios: [
        { ciudad: "Ámsterdam", rango: "1.200-2.000", moneda: "€/mes por habitación" },
        { ciudad: "Rotterdam", rango: "800-1.200", moneda: "€/mes por habitación" },
        { ciudad: "Utrecht", rango: "900-1.300", moneda: "€/mes por habitación" },
        { ciudad: "Eindhoven", rango: "700-1.100", moneda: "€/mes por habitación" },
        { ciudad: "Den Haag", rango: "850-1.300", moneda: "€/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: sin visado. Regístrate en el municipio para obtener el BSN (Burger Service Nummer). Lo necesitas para trabajar, abrir cuenta bancaria y alquilar.",
      enlaceOficial: "https://www.government.nl/topics/personal-data/citizen-service-number-bsn",
    },
    papeleo: {
      documentos: [
        { nombre: "BSN (Burger Service Nummer)", descripcion: "El número de identidad fiscal neerlandés. Regístrate en el Gemeente (ayuntamiento) de tu ciudad con pasaporte + contrato de alquiler. Sin BSN no puedes trabajar.", tiempoObtener: "1-5 días hábiles", obligatorio: true, enlaceOficial: "https://www.government.nl/topics/personal-data/citizen-service-number-bsn" },
        { nombre: "DigiD", descripcion: "Tu identidad digital para todos los trámites con el gobierno holandés (impuestos, seguridad social, sanidad). Solícitalo online en cuanto tengas el BSN.", tiempoObtener: "Online, 5-10 días (llega carta con código)", obligatorio: true, enlaceOficial: "https://www.digid.nl/en" },
        { nombre: "Cuenta bancaria", descripcion: "ING, ABN AMRO o Rabobank. Necesitas BSN. Para empezar sin BSN: N26 o Revolut.", tiempoObtener: "1-7 días", obligatorio: true },
        { nombre: "Toeslagen (subsidios)", descripcion: "Ayudas gubernamentales para alquiler y salud (huurtoeslag, zorgtoeslag). Si tu sueldo es bajo-medio, puedes recibir 100-400€/mes. Solicítalo en la Belastingdienst.", tiempoObtener: "2-4 semanas", obligatorio: false, enlaceOficial: "https://www.belastingdienst.nl/wps/wcm/connect/nl/toeslagen/toeslagen" },
      ],
      consejo: "El Zorgverzekering (seguro médico obligatorio) cuesta ~135€/mes. Pero si ganas menos de ~24.000€/año puedes recibir el zorgtoeslag (subsidio sanitario) de ~100€/mes. No te olvides de solicitarlo.",
    },
  },

  // ─── SUIZA ───────────────────────────────────────────────────────────────────
  CH: {
    codigo: "CH",
    auPair: {
      disponible: true,
      sueldoMensual: "550-800 CHF/mes (580-840€) — el mejor sueldo de au pair en Europa",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/switzerland", descripcion: "Suiza ofrece el mayor sueldo de au pair en Europa. Familias en Zúrich, Ginebra y Basilea." },
        { nombre: "HelvetiaAuPair", url: "https://www.helvetiaupair.ch", descripcion: "Agencia suiza especializada. Gestionan el permiso de residencia para el au pair." },
      ],
      requisitos: "18-30 años, alemán/francés/italiano básico (según zona), sin antecedentes. Suiza no es UE pero tiene acuerdos — los españoles pueden ser au pair con permiso especial. La familia gestiona el permiso ante la autoridad cantonal. Duración: máximo 12 meses.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Flatfox", url: "https://flatfox.ch", descripcion: "Portal suizo moderno. Habitaciones, WG y estudios en todo el país." },
        { nombre: "Homegate", url: "https://www.homegate.ch/mieten", descripcion: "El portal de alquiler más grande de Suiza. Muy completo." },
        { nombre: "Comparis", url: "https://www.comparis.ch/immobilien/miete", descripcion: "Comparador de alquileres. Muy usado para encontrar los mejores precios." },
        { nombre: "Anibis", url: "https://www.anibis.ch/fr/rubrique-appartements-louer--29.htm", descripcion: "Popular en la Suiza francófona (Ginebra, Lausana)." },
      ],
      consejo: "Suiza es el país más caro de Europa. Una habitación compartida en Zúrich: 1.500-2.500 CHF/mes. Pero los sueldos compensan. El WG (piso compartido) es muy común. Berna y Basilea son algo más baratas que Zúrich y Ginebra.",
      preciosMedios: [
        { ciudad: "Zúrich", rango: "1.500-2.500", moneda: "CHF/mes por habitación" },
        { ciudad: "Ginebra", rango: "1.400-2.200", moneda: "CHF/mes por habitación" },
        { ciudad: "Basilea", rango: "1.200-1.800", moneda: "CHF/mes por habitación" },
        { ciudad: "Berna", rango: "1.100-1.600", moneda: "CHF/mes por habitación" },
        { ciudad: "Lausana", rango: "1.300-2.000", moneda: "CHF/mes por habitación" },
      ],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Suiza no es UE pero tiene acuerdo de libre circulación con España. Puedes trabajar sin visado pero necesitas permiso de residencia: Permiso L (contratos < 1 año), Permiso B (residencia de más de 1 año). Lo tramita tu empleador o la familia au pair ante la oficina de migración cantonal.",
    },
    papeleo: {
      documentos: [
        { nombre: "Permiso de residencia (L o B)", descripcion: "Tu empleador o familia au pair lo tramita ante el Amt für Migration del cantón. Imprescindible para residir legalmente. El Permiso L es para contratos < 1 año, el B para > 1 año.", tiempoObtener: "2-6 semanas (tramita el empleador)", obligatorio: true },
        { nombre: "Anmeldung (Gemeinde)", descripcion: "Empadronamiento en la oficina comunal (Einwohnerkontrolle). Dentro de los 14 días de llegada. Llevar pasaporte + contrato de arrendamiento.", tiempoObtener: "El mismo día (con cita)", obligatorio: true },
        { nombre: "AHV-Nummer (Seguridad Social)", descripcion: "Número de seguridad social suizo. Tu empleador lo gestiona automáticamente al contratarte. Cubre pensión, desempleo y accidentes laborales.", tiempoObtener: "Automático al empezar a trabajar", obligatorio: true },
        { nombre: "Krankenversicherung (seguro médico)", descripcion: "OBLIGATORIO por ley. Cuesta entre 350-600 CHF/mes. Compara precios en Comparis.ch. Hay subsidios (Prämienverbilligung) para ingresos bajos.", tiempoObtener: "1-5 días (contratación online)", obligatorio: true, enlaceOficial: "https://www.comparis.ch/krankenkasse" },
      ],
      consejo: "El seguro médico es caro (400-600 CHF/mes) pero obligatorio. Solicita el subsidio de primas (Prämienverbilligung) en tu cantón si tu salario es bajo-medio — muchos recién llegados no lo saben y pierden 1.000-3.000 CHF al año.",
    },
  },

  // ─── SUECIA ──────────────────────────────────────────────────────────────────
  SE: {
    codigo: "SE",
    auPair: {
      disponible: true,
      sueldoMensual: "~320-370€/mes (3.500-4.000 SEK + alojamiento y comida + curso de sueco)",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/sweden", descripcion: "Suecia es uno de los mejores países de Europa para calidad de vida. Muy popular entre au pairs españoles." },
      ],
      requisitos: "18-30 años, inglés básico (el sueco no es obligatorio). Sin visado (UE). La familia paga el seguro y el curso de sueco. Duración: 12 meses máximo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Blocket Bostad", url: "https://bostad.blocket.se", descripcion: "El portal de alquiler más popular de Suecia. Habitaciones, estudios y pisos en todo el país." },
        { nombre: "Qasa", url: "https://qasa.se", descripcion: "Plataforma moderna con contratos digitales en inglés. Muy usada por internacionales." },
        { nombre: "Samtrygg", url: "https://samtrygg.se", descripcion: "Especializado en subarrendamientos (andrahandsuthyrning). La forma más común de encontrar piso en Suecia." },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/Sweden", descripcion: "Alquiler para expats. Contratos en inglés. Buena opción para empezar." },
      ],
      consejo: "Estocolmo tiene una cola de AÑOS para alquiler de primera mano (hyresrätt). La única opción realista es subarrendar (andrahand). Presupuesta 6.000-10.000 SEK/mes para habitación en Estocolmo. Gotemburgo y Malmö son algo más baratas.",
      preciosMedios: [
        { ciudad: "Estocolmo", rango: "6.000-12.000", moneda: "SEK/mes por habitación" },
        { ciudad: "Gotemburgo", rango: "5.000-9.000", moneda: "SEK/mes por habitación" },
        { ciudad: "Malmö", rango: "4.500-7.500", moneda: "SEK/mes por habitación" },
        { ciudad: "Uppsala", rango: "5.000-8.000", moneda: "SEK/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: sin visado. Para trabajar necesitas el personnummer (número de identidad sueco), que tramitas en Skatteverket. Sin él no puedes tener cuenta bancaria sueca ni acceder a servicios.",
      enlaceOficial: "https://www.skatteverket.se/privat/folkbokforing/omduflyttartillsverige.4.18e1b10334ebe8bc80001234.html",
    },
    papeleo: {
      documentos: [
        { nombre: "Personnummer", descripcion: "El número de identidad personal sueco. Tramítalo en Skatteverket con pasaporte + contrato de trabajo o alquiler (prueba de que vivirás en Suecia). Sin él no puedes abrir cuenta bancaria sueca ni tener acceso al sistema sanitario.", tiempoObtener: "2-6 semanas", obligatorio: true, enlaceOficial: "https://www.skatteverket.se/privat/folkbokforing" },
        { nombre: "Cuenta bancaria", descripcion: "Handelsbanken, Swedbank, SEB o Nordea. Requieren personnummer. Sin él usa Revolut o N26 para empezar. Alternativa: Wise con tu cuenta española.", tiempoObtener: "1-7 días (con personnummer)", obligatorio: true },
        { nombre: "ID-kort (tarjeta de identidad sueca)", descripcion: "Una vez tienes el personnummer puedes solicitar la tarjeta de identidad sueca en Skatteverket o el pasaporte sueco en Police. Muy útil para trámites cotidianos.", tiempoObtener: "2-4 semanas", obligatorio: false },
        { nombre: "Försäkringskassan", descripcion: "La Seguridad Social sueca. Regístrate para acceder a bajas médicas, prestaciones familiares y otros subsidios. Necesitas personnummer.", tiempoObtener: "Online inmediato (con personnummer)", obligatorio: false, enlaceOficial: "https://www.forsakringskassan.se" },
      ],
      consejo: "El personnummer es el cuello de botella — sin él todo es difícil. Trae contrato de trabajo firmado o contrato de alquiler cuando vayas a Skatteverket: es la prueba de que vas a vivir en Suecia y acelera el proceso.",
    },
  },

  // ─── NORUEGA ─────────────────────────────────────────────────────────────────
  NO: {
    codigo: "NO",
    auPair: {
      disponible: true,
      sueldoMensual: "~520-560€/mes (5.900-6.200 NOK — sueldo mínimo regulado por ley)",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/norway", descripcion: "Noruega regula el sueldo au pair por ley (5.900 NOK mínimo). Muy buenas condiciones laborales." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/norway.php", descripcion: "Familias verificadas en Oslo, Bergen y Trondheim." },
      ],
      requisitos: "18-30 años, inglés fluido (noruego básico recomendado), sin antecedentes. Noruega está en el EEE — libre circulación para españoles. El sueldo mínimo está fijado por la UDI (Directorate of Immigration). Duración: máximo 24 meses.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Finn.no", url: "https://www.finn.no/realestate/lettings/search.html", descripcion: "El portal noruego para todo — alquiler, trabajo, segunda mano. El equivalente noruego al Idealista." },
        { nombre: "Hybel.no", url: "https://hybel.no", descripcion: "Especializado en habitaciones individuales y estudios. Muy usado en Oslo." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.es/s/Norway/homes?monthly_stay=true", descripcion: "Para los primeros días hasta encontrar algo fijo. Caro pero sin burocracia." },
      ],
      consejo: "Noruega es el país más caro de Europa en alquiler. Una habitación en Oslo: 7.000-12.000 NOK/mes. Pero los sueldos son altos y la relación calidad-vida es excelente. Bergen y Trondheim son algo más baratas.",
      preciosMedios: [
        { ciudad: "Oslo", rango: "7.000-12.000", moneda: "NOK/mes por habitación" },
        { ciudad: "Bergen", rango: "6.000-10.000", moneda: "NOK/mes por habitación" },
        { ciudad: "Trondheim", rango: "5.500-9.000", moneda: "NOK/mes por habitación" },
        { ciudad: "Stavanger", rango: "6.500-11.000", moneda: "NOK/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "España es UE — Noruega es EEE. Libre circulación total. Para estancias superiores a 3 meses, regístrate en la policía local (Politiet). Necesitarás D-number o personnummer para trabajar.",
      enlaceOficial: "https://www.udi.no/en/",
    },
    papeleo: {
      documentos: [
        { nombre: "D-number o Personnummer", descripcion: "El D-number es para estancias cortas (< 6 meses). El personnummer es para residentes permanentes. Solicítalo en Skateetaten con pasaporte + contrato de trabajo. Sin él no puedes cobrar ni abrir cuenta.", tiempoObtener: "2-4 semanas", obligatorio: true, enlaceOficial: "https://www.skatteetaten.no/en/person/foreign/" },
        { nombre: "BankID", descripcion: "La identidad digital noruega. Necesita personnummer o D-number. Sin ella no puedes hacer prácticamente ningún trámite online en Noruega.", tiempoObtener: "1-2 semanas (tras personnummer)", obligatorio: false },
        { nombre: "Cuenta bancaria", descripcion: "DNB, Nordea NO o SpareBank 1. Necesitas D-number/personnummer. Sin él: Wise o N26 para empezar.", tiempoObtener: "1-7 días", obligatorio: true },
        { nombre: "Registro en Helfo", descripcion: "El sistema de salud noruego. Regístrate en Helfo para tener acceso a médico de cabecera (fastlege). Cita en Helfo o online en helsenorge.no.", tiempoObtener: "1-2 semanas", obligatorio: false, enlaceOficial: "https://www.helsenorge.no/en/foreigners-in-norway/" },
      ],
      consejo: "El invierno noruego es extremo. Cuando busques alojamiento, asegúrate de que la calefacción está incluida en el precio (varme inkludert) — si no, puede añadir 1.000-2.000 NOK adicionales al mes.",
    },
  },

  // ─── ITALIA ──────────────────────────────────────────────────────────────────
  IT: {
    codigo: "IT",
    auPair: {
      disponible: true,
      sueldoMensual: "250-300€/mes + alojamiento y comida",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/italy", descripcion: "Italia, cerca de España. Ideal para aprender italiano. Familias en Roma, Milán y Florencia." },
        { nombre: "Bakeca.it", url: "https://www.bakeca.it/annunci/au-pair/", descripcion: "Portal italiano de anuncios. Muchas familias buscan au pair directamente aquí." },
      ],
      requisitos: "18-30 años, italiano o inglés básico, sin antecedentes. Sin visado (UE). Duración: 12 meses. La familia paga el seguro médico.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Idealista Italia", url: "https://www.idealista.it/affitto", descripcion: "El mismo portal que España. Habitaciones, estudios y pisos en toda Italia." },
        { nombre: "Casa.it", url: "https://www.casa.it/affitto", descripcion: "Portal italiano de referencia. Buena cobertura en ciudades medianas." },
        { nombre: "Spotahome", url: "https://www.spotahome.com/s/rome", descripcion: "Alquiler verificado en Roma, Milán, Florencia y Turín. Reserva 100% online." },
        { nombre: "Subito.it", url: "https://www.subito.it/annunci-italia/affitto/camere-posti-letto/", descripcion: "Anuncios clasificados. Habitaciones a buen precio, especialmente en ciudades medianas." },
      ],
      consejo: "En Italia los contratos de alquiler son muy rígidos (mínimo 4 años para pisos completos). Para estancias cortas: busca coliving, habitación en piso compartido o subarrendamiento. Milán es muy cara. Roma, Florencia y Bolonia tienen buena relación calidad-precio.",
      preciosMedios: [
        { ciudad: "Milán", rango: "800-1.400", moneda: "€/mes por habitación" },
        { ciudad: "Roma", rango: "600-1.000", moneda: "€/mes por habitación" },
        { ciudad: "Florencia", rango: "600-950", moneda: "€/mes por habitación" },
        { ciudad: "Bolonia", rango: "550-900", moneda: "€/mes por habitación" },
        { ciudad: "Turín", rango: "500-800", moneda: "€/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: libre circulación. Para residir más de 3 meses: regístrate en el Comune (municipio) y obtén el Attestato di Iscrizione. Necesitas el Codice Fiscale para trabajar.",
    },
    papeleo: {
      documentos: [
        { nombre: "Codice Fiscale", descripcion: "El equivalente italiano al NIF español. Gratis y rápido. Solicítalo en la Agenzia delle Entrate más cercana con pasaporte. También puedes pedirlo en el consulado italiano en España antes de irte.", tiempoObtener: "El mismo día (presencial) o 1-2 semanas (correo)", obligatorio: true, enlaceOficial: "https://www.agenziaentrate.gov.it/portale/web/english" },
        { nombre: "Residenza (empadronamiento)", descripcion: "Registro en el Ufficio Anagrafe del Comune. Para estancias largas, obligatorio. Llevar pasaporte + contrato de alquiler.", tiempoObtener: "1-4 semanas (el municipio verifica la dirección)", obligatorio: false },
        { nombre: "Tessera Sanitaria", descripcion: "La tarjeta sanitaria italiana que da acceso al SSN (Servizio Sanitario Nazionale). Solicítala en la ASL local con Codice Fiscale + empadronamiento.", tiempoObtener: "1-4 semanas", obligatorio: false, enlaceOficial: "https://www.salute.gov.it" },
        { nombre: "Cuenta bancaria", descripcion: "Intesa Sanpaolo, UniCredit, Banca Sella. Para recién llegados sin residencia: N26, Revolut o Wise.", tiempoObtener: "1-7 días", obligatorio: true },
      ],
      consejo: "El Codice Fiscale es lo primero que debes tramitar — lo necesitas para todo: alquilar piso, contratar SIM, abrir cuenta. Tarda solo 15 minutos en la Agenzia delle Entrate.",
    },
  },

  // ─── PORTUGAL ────────────────────────────────────────────────────────────────
  PT: {
    codigo: "PT",
    auPair: {
      disponible: true,
      sueldoMensual: "200-280€/mes + alojamiento y comida",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/portugal", descripcion: "Portugal, el más cercano a España. Vida más barata aunque sueldos bajos. Familias en Lisboa y Oporto." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/portugal.php", descripcion: "Buen portal para encontrar familias en Portugal. Registro gratuito." },
      ],
      requisitos: "18-30 años, portugués o español (muy similares), sin antecedentes. Sin visado (UE). Duración: 12 meses. Buena opción para quien quiere empezar a emigrar con suavidad.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Idealista Portugal", url: "https://www.idealista.pt/arrendar-casas", descripcion: "El mismo portal que España. Habitaciones y pisos en Lisboa, Oporto y Faro." },
        { nombre: "OLX Portugal", url: "https://www.olx.pt/imoveis/arrendamento", descripcion: "Portal de anuncios muy popular para alquileres directos entre particulares." },
        { nombre: "Imovirtual", url: "https://www.imovirtual.com/arrendamento", descripcion: "Portal profesional de alquiler. Buena cobertura nacional." },
        { nombre: "Uniplaces", url: "https://www.uniplaces.com/en/rooms/portugal", descripcion: "Habitaciones para jóvenes. Muy usado en Lisboa y Oporto. Contratos cortos disponibles." },
      ],
      consejo: "Lisboa y Oporto se han encarecido mucho. Braga, Coimbra y Aveiro ofrecen excelente calidad de vida a precios razonables. El coste de vida en Portugal es bajo pero los sueldos también — ajusta tus expectativas salariales.",
      preciosMedios: [
        { ciudad: "Lisboa", rango: "700-1.200", moneda: "€/mes por habitación" },
        { ciudad: "Oporto", rango: "550-950", moneda: "€/mes por habitación" },
        { ciudad: "Braga", rango: "350-580", moneda: "€/mes por habitación" },
        { ciudad: "Coimbra", rango: "350-550", moneda: "€/mes por habitación" },
        { ciudad: "Faro", rango: "400-700", moneda: "€/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: libre circulación total. Para residir en Portugal más de 3 meses, regístrate en la Câmara Municipal. Necesitas el NIF para trabajar.",
    },
    papeleo: {
      documentos: [
        { nombre: "NIF (Número de Identificação Fiscal)", descripcion: "El equivalente al NIF español. Gratis y rápido en cualquier oficina de Finanças con tu pasaporte/DNI. También puedes pedirlo en el consulado portugués antes de irte.", tiempoObtener: "El mismo día (presencial)", obligatorio: true, enlaceOficial: "https://www.portaldasfinancas.gov.pt/at/html/index.html" },
        { nombre: "NISS (Número Identificação Segurança Social)", descripcion: "El número de la Seguridad Social portuguesa. Necesario para trabajar legalmente. Solicítalo en el Centro Distrital de Segurança Social con NIF + contrato de trabajo.", tiempoObtener: "1-2 semanas", obligatorio: true, enlaceOficial: "https://www.seg-social.pt" },
        { nombre: "Inscrição no SNS (Salud)", descripcion: "Acceso al Sistema Nacional de Saúde. Regístrate en el Centro de Saúde más cercano con NIF + NISS + prueba de domicilio.", tiempoObtener: "1-2 semanas", obligatorio: false, enlaceOficial: "https://www.sns.gov.pt" },
        { nombre: "Cuenta bancaria", descripcion: "Millennium BCP, Santander Portugal, Caixa Geral de Depósitos. Con pasaporte + NIF + dirección. Para recién llegados: N26 o Revolut mientras tramitas el NIF.", tiempoObtener: "1-5 días", obligatorio: true },
      ],
      consejo: "El NIF es el primer paso y tarda 15 minutos. Con él puedes abrir cuenta bancaria y firmar contratos. El NISS es el segundo paso — sin él no cotizas a la Seguridad Social.",
    },
  },

  // ─── ESPAÑA ──────────────────────────────────────────────────────────────────
  ES: {
    codigo: "ES",
    auPair: {
      disponible: true,
      sueldoMensual: "70-100€/semana + alojamiento y comida",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/spain", descripcion: "España es un destino muy popular para au pairs. Familias en Madrid, Barcelona, Valencia, Sevilla y zonas costeras." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/spain.php", descripcion: "Registro gratuito. Muchas familias buscan au pairs nativos en inglés, francés o alemán." },
        { nombre: "Cultural Care", url: "https://www.culturalcare.es/au-pair-en-espana", descripcion: "Agencia con sede en España. Soporte en español durante toda la estancia." },
      ],
      requisitos: "17-30 años, español básico (A1), soltero/a y sin hijos. Contrato de al menos 6 meses. La familia debe proporcionar habitación propia, manutención completa y al menos 70€ semanales. El au pair no es un empleado — es un intercambio cultural.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Idealista", url: "https://www.idealista.com/alquiler-viviendas/", descripcion: "El portal de alquiler líder en España. Amplia cobertura nacional." },
        { nombre: "Fotocasa", url: "https://www.fotocasa.es/es/alquiler/viviendas/", descripcion: "Segunda opción más popular. Buena interfaz y filtros avanzados." },
        { nombre: "Habitaclia", url: "https://www.habitaclia.com/alquiler", descripcion: "Especializado en Cataluña y Levante. Muy usado en Barcelona y Valencia." },
        { nombre: "Spotahome", url: "https://www.spotahome.com/es/s/madrid", descripcion: "Alquiler verificado en Madrid, Barcelona, Valencia y Sevilla. Sin visitas." },
      ],
      consejo: "Madrid y Barcelona son caras. Valencia, Sevilla, Bilbao, Málaga y Zaragoza ofrecen buena calidad de vida a precios más razonables. En España los pisos suelen alquilarse amueblados, lo que facilita la llegada.",
      preciosMedios: [
        { ciudad: "Madrid", rango: "700-1.200", moneda: "€/mes por habitación" },
        { ciudad: "Barcelona", rango: "750-1.300", moneda: "€/mes por habitación" },
        { ciudad: "Valencia", rango: "450-750", moneda: "€/mes por habitación" },
        { ciudad: "Sevilla", rango: "400-700", moneda: "€/mes por habitación" },
        { ciudad: "Bilbao", rango: "500-850", moneda: "€/mes por habitación" },
        { ciudad: "Málaga", rango: "500-900", moneda: "€/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Para ciudadanos de otros países UE que llegan a España: libre circulación total. Solo necesitas DNI/pasaporte en vigor. Para estancias largas, regístrate en el Registro Central de Extranjeros (Certificado de Registro de Ciudadano de la UE).",
      enlaceOficial: "https://extranjeros.inclusion.gob.es",
    },
    papeleo: {
      documentos: [
        { nombre: "Empadronamiento", descripcion: "Registro en el padrón municipal del ayuntamiento. Necesario para acceder a servicios públicos, sanidad y colegios. Lleva pasaporte + contrato de alquiler.", tiempoObtener: "El mismo día", obligatorio: true },
        { nombre: "Número de la Seguridad Social", descripcion: "Para trabajar en España. Solicítalo en la Tesorería General de la Seguridad Social con pasaporte + NIE/certificado UE.", tiempoObtener: "1-5 días", obligatorio: true, enlaceOficial: "https://sede.seg-social.gob.es" },
        { nombre: "NIE (para no UE) o Certificado UE (para ciudadanos UE)", descripcion: "Los ciudadanos UE no necesitan NIE sino un Certificado de Registro de Ciudadano de la UE. Trámite en la Oficina de Extranjeros con pasaporte + justificante de empleo/estudios/medios económicos.", tiempoObtener: "1-4 semanas (cita)", obligatorio: false },
        { nombre: "Cuenta bancaria", descripcion: "Santander, BBVA, CaixaBank, ING España. Con pasaporte o DNI. ING y N26 son las más fáciles para recién llegados.", tiempoObtener: "1-3 días", obligatorio: true },
      ],
      consejo: "El empadronamiento es el primer paso para todo. Con él puedes solicitar la tarjeta sanitaria (TSI) en el Centro de Salud y acceder al sistema público de empleo (SEPE).",
    },
    programasExtra: [
      { nombre: "Garantía Juvenil", url: "https://www.sepe.es/HomeSepe/Personas/encontrar-trabajo/Garantia-Juvenil.html", descripcion: "Programa europeo para jóvenes 16-29 años. Formación gratuita, prácticas en empresas y ayudas a la contratación." },
      { nombre: "Programa Vulcanus (UE-Japón)", url: "https://www.eu-japan.eu/vulcanus", descripcion: "Prácticas remuneradas en Japón para estudiantes de ingeniería y ciencia. Convocatoria anual." },
      { nombre: "EURES España", url: "https://www.sepe.es/HomeSepe/Personas/encontrar-trabajo/empleo-europa.html", descripcion: "Portal oficial de movilidad laboral europea. Ofertas verificadas con condiciones de trabajo transparentes." },
      { nombre: "ICEX Vives", url: "https://www.icex.es/icex/vives", descripcion: "Becas de internacionalización. Prácticas remuneradas en empresas españolas con actividad internacional." },
      { nombre: "Auxiliares de Conversación", url: "https://www.educacionfpydeportes.gob.es/", descripcion: "Programa del Ministerio de Educación. Auxiliar de español en colegios de Francia, Alemania, Reino Unido, Italia y más. 700-1.000€/mes." },
    ],
  },

  // ─── BÉLGICA ─────────────────────────────────────────────────────────────────
  BE: {
    codigo: "BE",
    auPair: {
      disponible: true,
      sueldoMensual: "420-480€/mes + alojamiento y comida",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/belgium", descripcion: "Bélgica tiene buenas condiciones para au pairs. Familias en Bruselas, Amberes y Gante." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/belgium.php", descripcion: "Registro gratuito. El contrato au pair debe registrarse en el RVA/ONEM (empleo)." },
      ],
      requisitos: "18-26 años, inglés o francés/neerlandés básico, sin antecedentes. Sin visado (UE). Contrato oficial requerido y registrado ante las autoridades laborales. Duración: 12 meses máximo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Immoweb", url: "https://www.immoweb.be/es/busqueda/apartamento/en-alquiler", descripcion: "El portal de alquiler #1 de Bélgica. Habitaciones, estudios y pisos en todo el país." },
        { nombre: "Zimmo", url: "https://www.zimmo.be/fr/louer", descripcion: "Segunda opción popular. Buena cobertura en Flandes y Bruselas." },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/Belgium", descripcion: "Ideal para internacionales. Contratos en inglés. Muy usado en Bruselas por expatriados EU." },
        { nombre: "Spotahome", url: "https://www.spotahome.com/s/brussels", descripcion: "Alquiler verificado en Bruselas y Amberes. Sin visitas previas." },
      ],
      consejo: "Bruselas tiene mucha demanda laboral internacional (instituciones UE, multinacionales). Amberes, Gante y Lieja son más baratas y tienen buenas conexiones de tren. El país es muy pequeño — vivir fuera de Bruselas y ir en tren es habitual.",
      preciosMedios: [
        { ciudad: "Bruselas", rango: "700-1.200", moneda: "€/mes por habitación" },
        { ciudad: "Amberes", rango: "600-1.000", moneda: "€/mes por habitación" },
        { ciudad: "Gante", rango: "550-900", moneda: "€/mes por habitación" },
        { ciudad: "Lieja", rango: "450-750", moneda: "€/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: libre circulación. Regístrate en el municipio (commune/gemeente) en los primeros 10 días para obtener la tarjeta E (EU citizen). Necesitas el Numéro National / Rijksregisternummer para trabajar.",
    },
    papeleo: {
      documentos: [
        { nombre: "Registro municipal (commune/gemeente)", descripcion: "Inscríbete en el ayuntamiento de tu municipio en los primeros 10 días. Llevar pasaporte + contrato de alquiler. Recibirás una tarjeta E (ciudadano UE) y el Numéro National.", tiempoObtener: "1-3 semanas (visita domiciliaria antes de aprobar)", obligatorio: true },
        { nombre: "Numéro National / Rijksregisternummer", descripcion: "El número de identidad nacional belga. Lo recibes al registrarte en el municipio. Imprescindible para trabajar, banco y servicios públicos.", tiempoObtener: "Automático tras el registro municipal", obligatorio: true },
        { nombre: "Cuenta bancaria", descripcion: "ING Bélgica, BNP Paribas Fortis, KBC (Flandes) o Belfius. Con pasaporte + Numéro National. Para empezar sin número: N26 o Revolut.", tiempoObtener: "1-7 días", obligatorio: true },
        { nombre: "CPAS/OCMW (asistencia social)", descripcion: "Centro de ayuda social. Si llegas sin trabajo, puedes solicitar ayuda provisional mientras lo buscas. No es para todo el mundo pero existe y es legal.", tiempoObtener: "1-4 semanas", obligatorio: false },
      ],
      consejo: "El registro municipal es clave — sin el Numéro National no puedes hacer casi nada. La visita domiciliaria (el municipio manda a alguien a comprobar que vives en la dirección declarada) puede tardar 2 semanas.",
    },
  },

  // ─── AUSTRIA ─────────────────────────────────────────────────────────────────
  AT: {
    codigo: "AT",
    auPair: {
      disponible: true,
      sueldoMensual: "500-600€/mes + alojamiento y comida",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/austria", descripcion: "Austria es destino poco conocido pero muy bien pagado. Familias en Viena, Graz y Salzburgo." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/austria.php", descripcion: "Registro gratuito. El contrato se registra en el AMS (agencia de empleo)." },
      ],
      requisitos: "18-28 años, alemán A2 recomendado (aunque muchas familias hablan inglés), sin antecedentes. Sin visado (UE). Contrato formal registrado ante AMS. Duración: 12 meses.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Willhaben", url: "https://www.willhaben.at/iad/immobilien/mietwohnungen", descripcion: "El portal de alquiler #1 de Austria. Habitaciones, estudios y pisos en todo el país." },
        { nombre: "ImmobilienScout24 AT", url: "https://www.immobilienscout24.at/wohnen/mieten", descripcion: "Versión austriaca del portal alemán. Buena cobertura en Viena y Graz." },
        { nombre: "Immonet", url: "https://www.immonet.at", descripcion: "Alternativa al ImmobilienScout. Más orientado a Viena." },
        { nombre: "WG-Gesucht Austria", url: "https://www.wg-gesucht.de/wg-zimmer-in-Wien.67.0.1.0.html", descripcion: "El portal alemán funciona también para Austria. Muy usado en Viena." },
      ],
      consejo: "Viena tiene un sistema de alquiler público subvencionado (Gemeindebau) con precios bajos, pero las colas son largas. Para recién llegados: WG (piso compartido) es la mejor opción. Graz, Salzburgo e Innsbruck son más asequibles que Viena.",
      preciosMedios: [
        { ciudad: "Viena", rango: "700-1.300", moneda: "€/mes por habitación" },
        { ciudad: "Graz", rango: "550-900", moneda: "€/mes por habitación" },
        { ciudad: "Salzburgo", rango: "650-1.100", moneda: "€/mes por habitación" },
        { ciudad: "Linz", rango: "550-850", moneda: "€/mes por habitación" },
        { ciudad: "Innsbruck", rango: "650-1.100", moneda: "€/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: libre circulación. Empadrónate (Meldezettel) en los primeros 3 días. Tras 3 meses de residencia, solicita la tarjeta de registro de ciudadano UE (Anmeldebescheinigung).",
    },
    papeleo: {
      documentos: [
        { nombre: "Meldezettel (empadronamiento)", descripcion: "Registro de domicilio en el Magistrat o Gemeindeamt. OBLIGATORIO en los 3 primeros días. Llevar pasaporte + carta del casero (Wohnungsgeberbestätigung). Muy importante — sin él no puedes abrir cuenta ni trabajar.", tiempoObtener: "El mismo día", obligatorio: true, enlaceOficial: "https://www.wien.gv.at/english/" },
        { nombre: "SV-Nummer (Seguridad Social)", descripcion: "Tu número de seguridad social austriaco. Lo asigna automáticamente el Hauptverband der österreichischen Sozialversicherungsträger cuando tu empleador te da de alta.", tiempoObtener: "Automático al empezar a trabajar", obligatorio: true },
        { nombre: "E-card (tarjeta sanitaria)", descripcion: "Da acceso al sistema sanitario público (ÖGK). Llega por correo postal automáticamente tras el alta en Seguridad Social.", tiempoObtener: "2-4 semanas", obligatorio: false },
        { nombre: "Cuenta bancaria", descripcion: "Bank Austria, Raiffeisen, BAWAG o Erste Bank. Con pasaporte + Meldezettel. Para empezar: N26 o Revolut.", tiempoObtener: "1-7 días", obligatorio: true },
      ],
      consejo: "El Meldezettel es el documento más importante en Austria. Sin él no puedes hacer nada — ni abrir cuenta ni cobrar. Consíguelo el primer o segundo día. El casero está obligado a dártelo.",
    },
  },

  // ─── DINAMARCA ───────────────────────────────────────────────────────────────
  DK: {
    codigo: "DK",
    auPair: {
      disponible: true,
      sueldoMensual: "~540-600€/mes (4.000-4.500 DKK + alojamiento y comida)",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/denmark", descripcion: "Dinamarca paga bien y tiene excelente calidad de vida. Familias en Copenhague, Aarhus y Odense." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/denmark.php", descripcion: "Registro gratuito. El contrato au pair se registra en la Styrelsen for International Rekruttering." },
      ],
      requisitos: "18-30 años, inglés básico (danés no obligatorio), sin antecedentes. Sin visado (UE/EEE). Contrato oficial requerido. Duración: máximo 12 meses.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Boligportal", url: "https://www.boligportal.dk", descripcion: "El portal de alquiler #1 de Dinamarca. Habitaciones y pisos en todo el país." },
        { nombre: "Lejebolig", url: "https://www.lejebolig.dk", descripcion: "Segunda opción popular. Buena cobertura fuera de Copenhague." },
        { nombre: "BoligerTilLeje", url: "https://www.boligertilleje.dk", descripcion: "Alternativa con muchos anuncios directos de propietarios." },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/Denmark", descripcion: "Ideal para internacionales. Contratos en inglés. Muy usado en Copenhague." },
      ],
      consejo: "Copenhague tiene grave escasez de vivienda y precios muy altos. Aarhus y Odense son más baratas y también tienen mucho trabajo. El transporte público danés es excelente — vivir a 30 min del centro es habitual.",
      preciosMedios: [
        { ciudad: "Copenhague", rango: "6.000-12.000", moneda: "DKK/mes por habitación" },
        { ciudad: "Aarhus", rango: "5.000-8.500", moneda: "DKK/mes por habitación" },
        { ciudad: "Odense", rango: "4.000-7.000", moneda: "DKK/mes por habitación" },
        { ciudad: "Aalborg", rango: "3.500-6.000", moneda: "DKK/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "España es UE — Dinamarca también. Libre circulación total. Para estancias > 3 meses, regístrate en el EU Citizens Registration (borgerservice). Necesitas el CPR number para trabajar.",
      enlaceOficial: "https://www.nyidanmark.dk/en-GB",
    },
    papeleo: {
      documentos: [
        { nombre: "CPR number (Det Centrale Personregister)", descripcion: "El número de identidad danés. Trámite en la oficina Borgerservice de tu municipio con pasaporte + contrato de trabajo o alquiler. IMPRESCINDIBLE para trabajar y acceder a servicios.", tiempoObtener: "1-3 días hábiles", obligatorio: true, enlaceOficial: "https://lifeindenmark.borger.dk/" },
        { nombre: "MitID (identidad digital)", descripcion: "El sistema de identidad digital danés. Necesita CPR number. Imprescindible para trámites online con el gobierno, banco y casi todo.", tiempoObtener: "1-5 días (tras CPR number)", obligatorio: true, enlaceOficial: "https://www.mitid.dk/" },
        { nombre: "Sundhedskort (tarjeta sanitaria amarilla)", descripcion: "La tarjeta sanitaria amarilla da acceso al médico de cabecera (læge). Se solicita automáticamente al registrarse en el sistema con el CPR number.", tiempoObtener: "2-4 semanas", obligatorio: false },
        { nombre: "Cuenta bancaria", descripcion: "Danske Bank, Nordea DK, Jyske Bank o Nykredit. Necesitas CPR number. Para empezar: N26 o Revolut.", tiempoObtener: "1-7 días", obligatorio: true },
      ],
      consejo: "El CPR number es la llave de todo en Dinamarca. Sin él no puedes abrir cuenta bancaria ni acceder al sistema sanitario. Consíguelo en el Borgerservice el primer o segundo día — lleva contrato de trabajo o alquiler.",
    },
  },

  // ─── FINLANDIA ───────────────────────────────────────────────────────────────
  FI: {
    codigo: "FI",
    auPair: {
      disponible: true,
      sueldoMensual: "350-450€/mes + alojamiento, comida y seguro",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/finland", descripcion: "Finlandia es un destino poco común pero con excelentes condiciones. Familias sobre todo en Helsinki y Tampere." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/finland.php", descripcion: "Registro gratuito. El inglés es suficiente — los finlandeses lo hablan muy bien." },
      ],
      requisitos: "18-30 años, inglés básico (el finlandés no es obligatorio), sin antecedentes. Sin visado (UE). Duración: 12 meses máximo. La familia cubre el seguro médico.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Vuokraovi", url: "https://vuokraovi.com/vuokra-asunnot", descripcion: "El portal de alquiler #1 de Finlandia. Habitaciones y pisos en todo el país." },
        { nombre: "Tori.fi / Oikotie", url: "https://asunnot.oikotie.fi/vuokra-asunnot", descripcion: "Portal de anuncios finlandés. Muy popular para alquileres directos." },
        { nombre: "Etuovi", url: "https://www.etuovi.com/hae/vuokra-asunnot", descripcion: "Alternativa con buena cobertura en Helsinki y ciudades medianas." },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/Finland", descripcion: "Para internacionales. Contratos en inglés en Helsinki." },
      ],
      consejo: "Helsinki es más asequible que Estocolmo o Oslo pero los inviernos son extremos (oscuro y frío 5 meses). Tampere, Turku y Oulu son buenas alternativas con costes más bajos. El alojamiento en Finlandia se paga por mes.",
      preciosMedios: [
        { ciudad: "Helsinki", rango: "700-1.200", moneda: "€/mes por habitación" },
        { ciudad: "Tampere", rango: "550-900", moneda: "€/mes por habitación" },
        { ciudad: "Turku", rango: "500-800", moneda: "€/mes por habitación" },
        { ciudad: "Espoo", rango: "700-1.100", moneda: "€/mes por habitación" },
        { ciudad: "Oulu", rango: "450-700", moneda: "€/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: libre circulación. Para trabajar más de 3 meses, regístrate en el DVV (Digital and Population Data Services Agency) para obtener el número de identidad finlandés.",
      enlaceOficial: "https://dvv.fi/en/moving-to-finland",
    },
    papeleo: {
      documentos: [
        { nombre: "Finnish personal identity code (Henkilötunnus)", descripcion: "El número de identidad finlandés. Solicítalo en el DVV con pasaporte + contrato de trabajo o prueba de residencia. Sin él no puedes abrir cuenta ni trabajar legalmente.", tiempoObtener: "2-4 semanas", obligatorio: true, enlaceOficial: "https://dvv.fi/en/moving-to-finland" },
        { nombre: "KELA card (Kansaneläkelaitos)", descripcion: "La tarjeta de la Seguridad Social finlandesa. Da acceso a prestaciones (sanidad, desempleo, familia). Regístrate en Kela en cuanto tengas el número de identidad.", tiempoObtener: "1-2 semanas", obligatorio: false, enlaceOficial: "https://www.kela.fi/web/en/moving-to-finland" },
        { nombre: "Cuenta bancaria", descripcion: "OP Financial, Nordea FI, Danske Bank FI o S-Pankki. Con pasaporte + número de identidad finlandés. Para empezar: N26 o Revolut.", tiempoObtener: "1-7 días", obligatorio: true },
        { nombre: "Terveyskeskus (médico público)", descripcion: "Registro en el centro de salud público más cercano (terveyskeskus). Con KELA card tienes acceso a consultas por 20-30€ (precio simbólico).", tiempoObtener: "1-2 semanas", obligatorio: false },
      ],
      consejo: "Finlandia tiene un sistema público excelente pero necesitas el número de identidad para acceder a todo. El proceso es más lento que en otros países nórdicos (2-4 semanas). Ten paciencia y usa Revolut mientras tanto.",
    },
  },

  // ─── POLONIA ─────────────────────────────────────────────────────────────────
  PL: {
    codigo: "PL",
    auPair: {
      disponible: true,
      sueldoMensual: "350-460€/mes (1.500-2.000 PLN + alojamiento y comida)",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/poland", descripcion: "Polonia está creciendo como destino. Familias en Varsovia, Cracovia y Gdańsk. Vida muy asequible." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/poland.php", descripcion: "Registro gratuito. Muchas familias de clase media alta en las grandes ciudades polacas." },
      ],
      requisitos: "18-30 años, inglés básico, sin antecedentes. Sin visado (UE). Polonia tiene coste de vida muy bajo — el dinero cunde mucho. Duración: 12 meses.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Otodom", url: "https://www.otodom.pl/wynajem", descripcion: "El portal de alquiler #1 de Polonia. Habitaciones y pisos en todo el país." },
        { nombre: "OLX Polska", url: "https://www.olx.pl/nieruchomosci/mieszkania/wynajem/", descripcion: "Portal de anuncios muy popular. Muchas ofertas directas de propietarios." },
        { nombre: "Gratka", url: "https://gratka.pl/nieruchomosci/mieszkania/wynajem", descripcion: "Alternativa a Otodom. Buena cobertura en ciudades medianas." },
        { nombre: "Spotahome", url: "https://www.spotahome.com/s/warsaw", descripcion: "Alquiler verificado en Varsovia y Cracovia. Contratos en inglés." },
      ],
      consejo: "Polonia es uno de los países más baratos de la UE. Varsovia y Cracovia son las más caras pero aun así muy asequibles comparado con Europa occidental. El coste de vida es 40-60% más barato que España. Buena oportunidad para ahorrar.",
      preciosMedios: [
        { ciudad: "Varsovia", rango: "1.500-2.800", moneda: "PLN/mes por habitación" },
        { ciudad: "Cracovia", rango: "1.200-2.200", moneda: "PLN/mes por habitación" },
        { ciudad: "Wrocław", rango: "1.200-2.000", moneda: "PLN/mes por habitación" },
        { ciudad: "Gdańsk", rango: "1.300-2.200", moneda: "PLN/mes por habitación" },
        { ciudad: "Poznań", rango: "1.100-1.900", moneda: "PLN/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: libre circulación total. Para estancias largas, regístrate en el Urząd Miasta (ayuntamiento). Necesitas el PESEL para trabajar y acceder a servicios.",
    },
    papeleo: {
      documentos: [
        { nombre: "PESEL", descripcion: "El número de identidad nacional polaco. Para ciudadanos UE que residen en Polonia. Tramítalo en el Urząd Miasta (ayuntamiento) con pasaporte + contrato de alquiler o trabajo.", tiempoObtener: "1-3 semanas", obligatorio: true, enlaceOficial: "https://www.gov.pl/web/gov/zamelduj-sie-przez-internet" },
        { nombre: "NIP (Numer Identyfikacji Podatkowej)", descripcion: "El NIF polaco. Lo necesitas para declarar impuestos. Tu empleador suele tramitarlo al darte de alta.", tiempoObtener: "Automático al empezar a trabajar", obligatorio: true },
        { nombre: "ZUS (Seguridad Social)", descripcion: "Zakład Ubezpieczeń Społecznych — el sistema de Seguridad Social polaco. Tu empleador te registra automáticamente.", tiempoObtener: "Automático", obligatorio: true, enlaceOficial: "https://www.zus.pl/en" },
        { nombre: "Cuenta bancaria", descripcion: "PKO BP, Santander Polska, mBank o ING Polonia. Con pasaporte + PESEL. Para empezar: N26 o Revolut.", tiempoObtener: "1-5 días", obligatorio: true },
      ],
      consejo: "Polonia es ideal para ahorrar dinero viviendo bien. El salario mínimo en 2025 es de 4.666 PLN/mes (~1.080€). Muchos trabajos en el sector IT y logística pagan bien en moneda local que vale mucho en España.",
    },
  },

  // ─── NUEVA ZELANDA ────────────────────────────────────────────────────────────
  NZ: {
    codigo: "NZ",
    auPair: {
      disponible: true,
      sueldoMensual: "120-200€/semana (250-350 NZD + alojamiento y comida)",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/new-zealand", descripcion: "Nueva Zelanda es destino top para quien busca aventura. La WHV lo facilita enormemente." },
        { nombre: "AuPair.com NZ", url: "https://www.aupair.com/en/au-pair/new-zealand.php", descripcion: "Familias verificadas en Auckland, Wellington y Christchurch." },
        { nombre: "Gumtree NZ", url: "https://www.gumtree.co.nz", descripcion: "Anuncios clasificados neozelandeses. Muchas familias buscan au pair directamente." },
      ],
      requisitos: "18-35 años (Working Holiday Visa), inglés funcional, experiencia con niños. La Working Holiday Visa de Nueva Zelanda es fácil de conseguir para españoles. Duración: 6-12 meses.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "TradeMe", url: "https://www.trademe.co.nz/a/property/rentals", descripcion: "El portal de alquiler #1 de Nueva Zelanda. El equivalente neozelandés al Wallapop para todo." },
        { nombre: "Flatmates NZ", url: "https://www.flatmates.co.nz", descripcion: "Especializado en habitaciones compartidas. Ideal para recién llegados." },
        { nombre: "Realestate.co.nz", url: "https://www.realestate.co.nz/residential/rent", descripcion: "Portal profesional de alquiler. Más orientado a pisos completos." },
        { nombre: "Hostelworld NZ", url: "https://www.hostelworld.com/st/hostels/p/new-zealand", descripcion: "Albergues desde 25-40 NZD/noche para los primeros días." },
      ],
      consejo: "Auckland es muy cara y tiene un serio problema de vivienda. Wellington es más manejable. Christchurch, Hamilton y Dunedin son buenas opciones más económicas. Como en Australia, el alquiler se paga por semana.",
      preciosMedios: [
        { ciudad: "Auckland", rango: "250-450", moneda: "NZD/semana por habitación" },
        { ciudad: "Wellington", rango: "200-380", moneda: "NZD/semana por habitación" },
        { ciudad: "Christchurch", rango: "180-320", moneda: "NZD/semana por habitación" },
        { ciudad: "Hamilton", rango: "160-280", moneda: "NZD/semana por habitación" },
      ],
    },
    visado: {
      tipo: "working-holiday",
      descripcion: "Working Holiday Visa para españoles de 18 a 30 años — no hasta los 35, que es la franja de otros países. Hay cupo anual para España y se agota. Válida 12 meses, ampliables a 23 si haces tres meses de trabajo regional. Sin oferta previa. El importe lo publica Immigration New Zealand: míralo ahí, que cambia.",
      enlaceOficial: "https://www.immigration.govt.nz/work/working-holiday-visas/",
    },
    papeleo: {
      documentos: [
        { nombre: "IRD Number (número fiscal)", descripcion: "El número tributario de Nueva Zelanda. Solicítalo en la Inland Revenue Department online. Sin él tu empleador te retiene el 45% del sueldo (rate máximo).", tiempoObtener: "1-2 semanas (online)", obligatorio: true, enlaceOficial: "https://www.ird.govt.nz/managing-my-tax/ird-numbers" },
        { nombre: "Cuenta bancaria", descripcion: "ANZ NZ, ASB, BNZ o Westpac NZ. Puedes abrir la cuenta ANTES de llegar a Nueva Zelanda (todo online). Muy recomendable para llegar ya con cuenta activa.", tiempoObtener: "Online, 1-3 días (antes de llegar)", obligatorio: true },
        { nombre: "KiwiSaver", descripcion: "El fondo de pensiones voluntario neozelandés. Tu empleador contribuye un 3% adicional a tu sueldo. Al salir del país puedes recuperarlo todo.", tiempoObtener: "Automático al empezar a trabajar", obligatorio: false, enlaceOficial: "https://www.kiwisaver.govt.nz" },
        { nombre: "Seguro médico privado", descripcion: "Nueva Zelanda tiene el ACC (cubre accidentes) pero no cubre enfermedades generales para titulares de WHV. Contrata seguro privado (desde 30-50 NZD/mes con Southern Cross o NIB).", tiempoObtener: "Online, 1-2 días", obligatorio: false },
      ],
      consejo: "Abre la cuenta bancaria antes de salir de España (ANZ NZ y ASB lo permiten online). Con ella llegar sin estrés administrativo. El IRD number es urgente — sin él pierdes mucho dinero en retenciones.",
    },
    programasExtra: [
      { nombre: "WWOOF New Zealand", url: "https://www.wwoof.co.nz", descripcion: "Trabajo en granjas orgánicas a cambio de alojamiento y comida. Perfecto para el trabajo regional que extiende el visado." },
    ],
  },

  // ─── GRECIA ───────────────────────────────────────────────────────────────────
  GR: {
    codigo: "GR",
    auPair: {
      disponible: true,
      sueldoMensual: "200-280€/mes + alojamiento y comida",
      plataformas: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com/en/au-pair/greece", descripcion: "Grecia es popular en verano. Las familias suelen estar en Atenas y Tesalónica. Experiencia de vida única." },
        { nombre: "AuPair.com", url: "https://www.aupair.com/en/au-pair/greece.php", descripcion: "Registro gratuito. Más demanda en los meses de verano." },
      ],
      requisitos: "18-30 años, inglés básico (el griego no es obligatorio en muchas familias), sin antecedentes. Sin visado (UE). El sueldo es bajo pero el coste de vida también. Ideal para quien quiere una experiencia mediterránea.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Spitogatos", url: "https://www.spitogatos.gr/enikiaseis", descripcion: "El portal de alquiler #1 de Grecia. Habitaciones y pisos en Atenas, Tesalónica y las islas." },
        { nombre: "XE.gr", url: "https://www.xe.gr/property/enikiasi_katoikia", descripcion: "Segunda opción popular. Amplia cobertura en toda Grecia." },
        { nombre: "Airbnb Grecia", url: "https://www.airbnb.es/s/Greece/homes?monthly_stay=true", descripcion: "Para los primeros días o meses. En temporada baja los precios bajan mucho." },
        { nombre: "Booking mensual", url: "https://www.booking.com/searchresults.es.html?ss=Greece&nflt=review_score%3D70", descripcion: "Apartamentos mensuales fuera de temporada. En invierno Atenas es muy asequible." },
      ],
      consejo: "Atenas y las islas son caras en verano (mayo-septiembre). En invierno los precios bajan un 40-60%. Tesalónica es más barata que Atenas y tiene muy buena calidad de vida. Para vivir bien con poco dinero en la UE, Grecia es una opción excelente.",
      preciosMedios: [
        { ciudad: "Atenas", rango: "400-800", moneda: "€/mes por habitación" },
        { ciudad: "Tesalónica", rango: "300-600", moneda: "€/mes por habitación" },
        { ciudad: "Heraclión (Creta)", rango: "350-650", moneda: "€/mes por habitación" },
        { ciudad: "Patras", rango: "280-500", moneda: "€/mes por habitación" },
      ],
    },
    visado: {
      tipo: "ue-libre",
      descripcion: "Ciudadano UE: libre circulación total. Para estancias largas, regístrate en la KEP (Centro de Atención al Ciudadano) local. Necesitas el AFM para trabajar.",
    },
    papeleo: {
      documentos: [
        { nombre: "AFM (Αριθμός Φορολογικού Μητρώου — número fiscal)", descripcion: "El NIF griego. Trámite en la oficina de Hacienda (Εφορία/DOY) de tu zona con pasaporte. Gratis y rápido. Imprescindible para trabajar y firmar contratos.", tiempoObtener: "El mismo día (presencial)", obligatorio: true, enlaceOficial: "https://www.aade.gr/en/taxpayers/afm" },
        { nombre: "AMKA (Αριθμός Μητρώου Κοινωνικής Ασφάλισης)", descripcion: "El número de la Seguridad Social griega. Trámite en el KEP (Centro de Atención al Ciudadano) con pasaporte + AFM. Necesario para trabajar legalmente y acceder al sistema sanitario.", tiempoObtener: "1-5 días", obligatorio: true, enlaceOficial: "https://www.amka.gr" },
        { nombre: "Cuenta bancaria", descripcion: "Alpha Bank, Eurobank, Piraeus Bank o National Bank of Greece. Con pasaporte + AFM + dirección. Para empezar: N26 o Revolut.", tiempoObtener: "1-7 días", obligatorio: true },
        { nombre: "ΕΦΚΑ (salud pública)", descripcion: "El seguro médico público griego. Accesible una vez tienes AMKA y empiezas a cotizar. Para acceder al médico: regístrate en el ΕΟΠΥΥ (organismo de salud).", tiempoObtener: "1-2 semanas", obligatorio: false, enlaceOficial: "https://www.efka.gov.gr" },
      ],
      consejo: "El AFM se consigue en 15 minutos. Llévalo siempre encima — te lo pedirán para casi todo en Grecia (contratos, banco, médico). El AMKA tarda unos días más pero también es sencillo.",
    },
    programasExtra: [
      { nombre: "Workaway Grecia", url: "https://www.workaway.info/en/hostlist/GR", descripcion: "Voluntariado en granjas, hostels e islas griegas a cambio de alojamiento y comida. Excelente para conocer el país." },
    ],
  },

  // ─── MÉXICO (5 nov 2026) ──────────────────────────────────────────────────
  // Fuentes: INM y la ficha de la visa de residencia temporal (gob.mx), CURP
  // (gob.mx/curp), SAT, IMSS. Precios: guía de vivienda para estudiantes de
  // mayo de 2026 (study-abroad.org), en dólares; no hemos encontrado una media
  // oficial de cuartos en pesos y no se inventa.
  MX: {
    codigo: "MX",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "México no tiene un visado de au pair: cuidar niños en una casa es un trabajo como otro y pide el mismo permiso que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Mercado Libre — cuartos", url: "https://inmuebles.mercadolibre.com.mx/cuartos/", descripcion: "Cuartos en renta en todo México. Un cuarto en departamento compartido es lo más fácil para empezar." },
        { nombre: "Inmuebles24", url: "https://www.inmuebles24.com", descripcion: "Uno de los portales de renta más grandes del país: departamentos y casas." },
        { nombre: "Vivanuncios", url: "https://www.vivanuncios.com.mx", descripcion: "Anuncios de particulares e inmobiliarias, también de cuartos." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.mx/s/Mexico/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo. Más caro, pero sin contrato." },
      ],
      consejo: "Para rentar un departamento suelen pedir un aval (alguien con una propiedad en la misma ciudad que responda por ti) o una póliza jurídica, además del depósito. Sin historial en México, lo práctico es empezar por un cuarto. Los precios de abajo son una estimación en dólares de una guía de vivienda de mayo de 2026.",
      preciosMedios: [
        { ciudad: "Ciudad de México", rango: "300-500", moneda: "US$/mes por cuarto compartido" },
        { ciudad: "Otras ciudades", rango: "180-400", moneda: "US$/mes por cuarto compartido" },
      ],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Hace falta una oferta de una empresa inscrita ante el Instituto Nacional de Migración, que es quien pide la autorización. Con ella recoges la visa en un consulado de México y, ya dentro, tienes 30 días naturales para canjearla por la tarjeta de residente.",
      enlaceOficial: "https://www.gob.mx/tramites/ficha/visa-de-residencia-temporal/SRE138",
    },
    papeleo: {
      documentos: [
        { nombre: "Tarjeta de residente", descripcion: "El canje de tu visa en una oficina del INM. Es tu identificación en México y la piden para todo lo demás.", tiempoObtener: "Hay que pedirla en los 30 días naturales desde que entras", obligatorio: true, enlaceOficial: "https://www.gob.mx/inm" },
        { nombre: "CURP (Clave Única de Registro de Población)", descripcion: "Tu clave personal en México. A quien tiene residencia se le asigna con su documento migratorio; se consulta y se imprime en gob.mx.", tiempoObtener: "Consulta en línea", obligatorio: true, enlaceOficial: "https://www.gob.mx/curp/" },
        { nombre: "RFC (Registro Federal de Contribuyentes)", descripcion: "Tu número ante Hacienda (SAT). Sin él no te pueden pagar en nómina.", tiempoObtener: "En línea o con cita en el SAT", obligatorio: true, enlaceOficial: "https://www.sat.gob.mx" },
        { nombre: "NSS (Número de Seguridad Social)", descripcion: "Con él la empresa te da de alta en el IMSS y tienes médico. Se tramita con la CURP.", tiempoObtener: "En línea", obligatorio: true, enlaceOficial: "https://www.imss.gob.mx" },
        { nombre: "Cuenta bancaria", descripcion: "Muchas empresas abren ellas la cuenta de nómina. Si la abres tú, el banco pedirá la tarjeta de residente.", tiempoObtener: "Depende del banco", obligatorio: false },
      ],
      consejo: "El orden: visa en el consulado → al entrar, tarjeta de residente en el INM (30 días) → CURP → RFC y NSS para cobrar en nómina.",
    },
  },

  // ─── BRASIL (5 nov 2026) ──────────────────────────────────────────────────
  // Fuentes: Decreto 9.199/2017 (art. 64: registro en 90 días), Acuerdo de
  // Residencia del Mercosur (Decreto 6.975/2009), Receita Federal (CPF gratis),
  // gov.br (Carteira de Trabalho con el CPF), Lei do Inquilinato 8.245/1991
  // (art. 38: caución de hasta tres meses), índice FipeZap de septiembre de 2026.
  BR: {
    codigo: "BR",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "Brasil no tiene un visado de au pair: cuidar niños en una casa pide el mismo permiso de trabajo que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "QuintoAndar", url: "https://www.quintoandar.com.br", descripcion: "Alquiler sin fiador, todo por internet. Muy usado en las ciudades grandes." },
        { nombre: "ZAP Imóveis", url: "https://www.zapimoveis.com.br", descripcion: "De los portales de alquiler más grandes de Brasil." },
        { nombre: "VivaReal", url: "https://www.vivareal.com.br", descripcion: "Pisos y casas de particulares e inmobiliarias en todo el país." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com.br/s/Brasil/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo." },
      ],
      consejo: "Para alquilar piden una garantía: un fiador, un seguro-fiança o una caución en dinero, que por ley no puede pasar de tres meses de alquiler. Sin fiador en Brasil, las plataformas que alquilan sin él te ahorran el problema. Los precios son la media por metro cuadrado del índice FipeZap (septiembre de 2026): un piso de 50 m² en São Paulo sale por unos 3.300 reales al mes.",
      preciosMedios: [
        { ciudad: "São Paulo", rango: "65,78", moneda: "R$ por m² al mes" },
        { ciudad: "Rio de Janeiro", rango: "61,86", moneda: "R$ por m² al mes" },
        { ciudad: "Media de 36 ciudades", rango: "54,77", moneda: "R$ por m² al mes" },
      ],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Con nacionalidad de Argentina, Bolivia, Chile, Colombia, Ecuador, Paraguay, Perú o Uruguay hay residencia de dos años sin oferta (Acuerdo del Mercosur). Desde España o el resto de la UE hace falta una oferta formal para pedir la autorización de residencia para trabajar o el visado temporal de trabajo.",
      enlaceOficial: "https://www.gov.br/pf/pt-br/assuntos/imigracao",
    },
    papeleo: {
      documentos: [
        { nombre: "CPF (Cadastro de Pessoas Físicas)", descripcion: "Tu número para todo en Brasil: contrato, banco, móvil. Lo da la Receita Federal, también en los consulados, y es gratis.", tiempoObtener: "Unos días hábiles", obligatorio: true, enlaceOficial: "https://www.gov.br/pt-br/servicos/inscrever-no-cpf" },
        { nombre: "Registro en la Polícia Federal (CRNM)", descripcion: "La Carteira de Registro Nacional Migratório, tu documento de residente. Con visado temporal es obligatorio pedirla al llegar.", tiempoObtener: "Plazo: 90 días desde que entras", obligatorio: true, enlaceOficial: "https://www.gov.br/pf/pt-br/assuntos/imigracao" },
        { nombre: "Carteira de Trabalho Digital", descripcion: "Donde la empresa apunta tu contrato. La saca cualquiera que tenga CPF, en la app o en gov.br, y ahí salen también ofertas del SINE.", tiempoObtener: "En línea", obligatorio: true, enlaceOficial: "https://www.gov.br/pt-br/servicos/obter-a-carteira-de-trabalho" },
        { nombre: "Cuenta bancaria", descripcion: "Con el CPF y tu documento de residente. Los bancos digitales suelen ser lo más rápido.", tiempoObtener: "Depende del banco", obligatorio: false },
      ],
      consejo: "El orden: CPF (mejor en el consulado antes de salir) → al llegar, registro en la Polícia Federal → Carteira de Trabalho Digital → cuenta bancaria.",
    },
  },

  // ─── COLOMBIA (5 nov 2026) ────────────────────────────────────────────────
  // Fuentes: Resolución 5477 de 2022 de la Cancillería (art. 74, visa M
  // Trabajador; art. 118, cédula en 15 días), Ley 820 de 2003 (arts. 15 y 16:
  // prohibido el depósito en dinero; solo uno para servicios públicos) según
  // el concepto de la Secretaría del Hábitat de Bogotá de 2026, y Ciencuadras
  // (primer trimestre de 2026) para el precio por m² en Bogotá.
  CO: {
    codigo: "CO",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "Colombia no tiene una visa de au pair: cuidar niños en una casa pide el mismo permiso de trabajo que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Fincaraíz", url: "https://www.fincaraiz.com.co", descripcion: "El portal de arriendos más conocido de Colombia: apartamentos, casas y habitaciones." },
        { nombre: "Metrocuadrado", url: "https://www.metrocuadrado.com", descripcion: "Arriendos de inmobiliarias y particulares en las ciudades grandes." },
        { nombre: "Ciencuadras", url: "https://www.ciencuadras.com", descripcion: "Otro de los grandes portales de arriendo, con filtros por estrato." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com.co/s/Colombia/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo. Más caro, pero sin codeudor." },
      ],
      consejo: "Para arrendar suelen pedir un codeudor (alguien con ingresos o propiedad en Colombia que responda por ti) o una póliza de arrendamiento de una aseguradora. Lo que no te pueden pedir es un depósito en dinero: la Ley 820 de 2003 lo prohíbe, salvo uno para los servicios públicos. Sin historial en Colombia, lo práctico es empezar por una habitación. El precio de abajo es la media de los apartamentos de Bogotá en el primer trimestre de 2026 según Ciencuadras: uno de 79 m² salía por unos 3,76 millones al mes.",
      preciosMedios: [
        { ciudad: "Bogotá (apartamentos)", rango: "47.821", moneda: "$ por m² al mes" },
      ],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Desde España o el resto de la UE hace falta una empresa colombiana que pida por ti la visa M Trabajador, que vale solo para ese puesto. Si eres de Argentina, Brasil, Bolivia, Ecuador, Paraguay, Perú o Uruguay, tienes la visa M Mercosur: dos años sin oferta de trabajo.",
      enlaceOficial: "https://www.cancilleria.gov.co/atencion-y-servicio-al-ciudadano/tramites-y-servicios/visa",
    },
    papeleo: {
      documentos: [
        { nombre: "Visa", descripcion: "Se pide en línea a la Cancillería y llega como visa electrónica al correo. Con ella entras y trabajas.", tiempoObtener: "La envían en los 10 días hábiles siguientes al pago", obligatorio: true, enlaceOficial: "https://www.cancilleria.gov.co/atencion-y-servicio-al-ciudadano/tramites-y-servicios/visa" },
        { nombre: "Cédula de extranjería", descripcion: "Tu documento de identidad en Colombia: la piden para el contrato, el banco y la salud. Se tramita en Migración Colombia.", tiempoObtener: "Hay que pedirla en los 15 días naturales desde que entras", obligatorio: true, enlaceOficial: "https://www.migracioncolombia.gov.co" },
        { nombre: "Afiliación a salud, pensión y riesgos laborales", descripcion: "Con contrato, la empresa te afilia a una EPS (salud), a un fondo de pensiones y a una ARL. La EPS y el fondo los eliges tú.", tiempoObtener: "Al firmar el contrato", obligatorio: true },
        { nombre: "Cuenta bancaria", descripcion: "Para cobrar la nómina. Los bancos suelen pedir la cédula de extranjería; algunas empresas abren ellas la cuenta.", tiempoObtener: "Depende del banco", obligatorio: false },
      ],
      consejo: "El orden: visa (en línea, antes de viajar) → al entrar, cédula de extranjería en Migración Colombia (15 días) → contrato y afiliaciones → cuenta bancaria.",
    },
  },

  // ─── PERÚ (5 nov 2026) ────────────────────────────────────────────────────
  // Fuentes: Decreto Legislativo 689 (contratación de extranjeros, art. 3.c),
  // reglamento de la Ley de Migraciones (contrato aprobado y calidad
  // migratoria antes de empezar), gob.pe (Migraciones y residencia Mercosur).
  // Alquiler: lo que piden los anuncios de Lima (dos meses de garantía y uno de
  // adelanto, contrato de un año); no hemos encontrado una media oficial de
  // precios y no se inventa.
  PE: {
    codigo: "PE",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "Perú no tiene una visa de au pair: cuidar niños en una casa pide el mismo permiso de trabajo que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Urbania", url: "https://urbania.pe", descripcion: "De los portales de alquiler más usados de Perú: departamentos y habitaciones." },
        { nombre: "Adondevivir", url: "https://www.adondevivir.com", descripcion: "Alquileres de inmobiliarias y particulares, sobre todo en Lima." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com.pe/s/Peru/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo. Más caro, pero sin garantía." },
      ],
      consejo: "En Lima los anuncios suelen pedir dos meses de garantía y uno de adelanto, con contrato de un año, y comprueban tus ingresos y tu historial en las centrales de riesgo. Sin historial en Perú, lo práctico es empezar por una habitación o un alquiler mensual.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Desde España o el resto de la UE hace falta una empresa que te contrate: el contrato se aprueba en el Ministerio de Trabajo y con él pides en Migraciones la calidad de trabajador residente. Con nacionalidad de un país del Mercosur o de la Comunidad Andina hay residencia de dos años sin oferta.",
      enlaceOficial: "https://www.gob.pe/migraciones",
    },
    papeleo: {
      documentos: [
        { nombre: "Contrato aprobado por el Ministerio de Trabajo", descripcion: "La empresa registra tu contrato en el Ministerio de Trabajo y Promoción del Empleo. Sin él aprobado no se puede pedir el permiso.", tiempoObtener: "Antes de pedir la residencia", obligatorio: true, enlaceOficial: "https://www.gob.pe/mtpe" },
        { nombre: "Calidad migratoria de trabajador residente", descripcion: "El permiso para vivir y trabajar en Perú. Se pide en Migraciones, en línea, con el contrato aprobado. No puedes empezar a trabajar antes.", tiempoObtener: "Antes de empezar a trabajar", obligatorio: true, enlaceOficial: "https://www.gob.pe/migraciones" },
        { nombre: "Carné de extranjería", descripcion: "Tu documento de identidad en Perú. Lo da Migraciones cuando te aprueban la residencia, y lo piden para el banco, el alquiler y el seguro de salud.", tiempoObtener: "Tras aprobar la residencia", obligatorio: true, enlaceOficial: "https://www.gob.pe/migraciones" },
        { nombre: "EsSalud y pensiones", descripcion: "Con contrato, la empresa te inscribe en EsSalud (salud). Para la pensión eliges entre la ONP y una AFP.", tiempoObtener: "Al firmar el contrato", obligatorio: true },
        { nombre: "Cuenta bancaria", descripcion: "Para cobrar la nómina. Los bancos piden el carné de extranjería; algunas empresas abren ellas la cuenta.", tiempoObtener: "Depende del banco", obligatorio: false },
      ],
      consejo: "El orden: contrato aprobado en el Ministerio de Trabajo → calidad de trabajador residente en Migraciones → carné de extranjería → EsSalud, pensión y cuenta bancaria.",
    },
  },

  // ─── CHILE (5 nov 2026) ───────────────────────────────────────────────────
  // Fuentes: Ley 21.325 (residencia temporal desde el extranjero), Servicio
  // Nacional de Migraciones, ChileAtiende (cédula en 30 días, se retira en unos
  // 20 días hábiles). Alquiler: lo que piden los anuncios y las guías (aval, un
  // mes de garantía, ingresos de unas tres veces el arriendo); sin media
  // oficial de precios, no se inventa.
  CL: {
    codigo: "CL",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "Chile no tiene una visa de au pair: cuidar niños en una casa pide el mismo permiso de trabajo que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Portal Inmobiliario", url: "https://www.portalinmobiliario.com", descripcion: "El portal de arriendos más grande de Chile." },
        { nombre: "TocToc", url: "https://www.toctoc.com", descripcion: "Arriendos de inmobiliarias y particulares en las ciudades grandes." },
        { nombre: "Yapo", url: "https://www.yapo.cl", descripcion: "Anuncios de particulares, también de piezas (habitaciones)." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.cl/s/Chile/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo. Más caro, pero sin aval." },
      ],
      consejo: "Para arrendar suelen pedir un aval (alguien con RUT que responda por ti), un mes de garantía y demostrar ingresos de unas tres veces el arriendo. Sin historial en Chile, lo práctico es empezar por una pieza o un alquiler mensual.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Desde España o el resto de la UE, la residencia temporal para trabajar se pide desde fuera de Chile en el portal del Servicio Nacional de Migraciones, normalmente con una oferta o un contrato. Con nacionalidad de Argentina, Bolivia, Brasil, Paraguay o Uruguay hay residencia por el Mercosur.",
      enlaceOficial: "https://serviciomigraciones.cl/",
    },
    papeleo: {
      documentos: [
        { nombre: "Residencia temporal", descripcion: "El permiso para vivir y trabajar en Chile. Se pide en línea al Servicio Nacional de Migraciones antes de viajar.", tiempoObtener: "Antes de entrar a Chile", obligatorio: true, enlaceOficial: "https://serviciomigraciones.cl/" },
        { nombre: "Cédula de identidad para extranjeros (RUN)", descripcion: "Te la da el Registro Civil y con ella tienes tu RUN, el número para el contrato, el banco y la salud.", tiempoObtener: "Hay que pedirla en los 30 días desde que rige la residencia; se retira en unos 20 días hábiles", obligatorio: true, enlaceOficial: "https://www.chileatiende.gob.cl/fichas/3337-cedula-de-identidad-para-extranjeros" },
        { nombre: "AFP y salud", descripcion: "Con contrato, la empresa descuenta y paga tu AFP (pensión) y tu salud, en Fonasa o en una Isapre.", tiempoObtener: "Al firmar el contrato", obligatorio: true },
        { nombre: "Cuenta bancaria", descripcion: "Para cobrar el sueldo. Con el RUN puedes abrir una cuenta en BancoEstado o en un banco digital.", tiempoObtener: "Depende del banco", obligatorio: false },
      ],
      consejo: "El orden: residencia temporal (antes de viajar) → al llegar, cédula en el Registro Civil (30 días) → contrato, AFP y salud → cuenta bancaria.",
    },
  },

  // ─── ARGENTINA (5 nov 2026) ───────────────────────────────────────────────
  // Fuentes: argentina.gob.ar (residencia Mercosur y Dirección Nacional de
  // Migraciones), la Cancillería (movilidad de jóvenes con España). Alquiler:
  // desde el DNU 70/2023, que derogó la Ley de Alquileres, casi todo se pacta
  // libre; lo habitual según las guías es garantía propietaria o seguro de
  // caución, depósito e ingresos de unas tres veces el alquiler. Con la
  // inflación, una media de precios caducaría enseguida: no se pone.
  AR: {
    codigo: "AR",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "Argentina no tiene una visa de au pair: cuidar niños en una casa pide el mismo permiso de trabajo que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Zonaprop", url: "https://www.zonaprop.com.ar", descripcion: "De los portales de alquiler más usados de Argentina." },
        { nombre: "Argenprop", url: "https://www.argenprop.com", descripcion: "Alquileres de inmobiliarias y particulares; explica también las garantías." },
        { nombre: "Mercado Libre Inmuebles", url: "https://inmuebles.mercadolibre.com.ar/alquiler/", descripcion: "Muchos anuncios de particulares, también de habitaciones." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com.ar/s/Argentina/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo. Sin garantía." },
      ],
      consejo: "Desde 2023 los contratos se pactan casi libres (plazo, ajuste y moneda). Suelen pedir una garantía propietaria (una casa a nombre de alguien que responda por ti) o un seguro de caución, más un depósito y demostrar ingresos de unas tres veces el alquiler. Sin garantía en Argentina, el seguro de caución o un alquiler mensual son lo práctico.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Desde España: si eres joven, la visa de vacaciones y trabajo de 12 meses del programa de movilidad; si no, una empresa inscrita en el RENURE que te contrate. Con nacionalidad de un país del Mercosur o asociado, residencia de dos años sin oferta.",
      enlaceOficial: "https://www.argentina.gob.ar/interior/migraciones",
    },
    papeleo: {
      documentos: [
        { nombre: "Residencia temporaria", descripcion: "El permiso para vivir y trabajar en Argentina. Se pide a la Dirección Nacional de Migraciones: por nacionalidad Mercosur o como trabajador migrante, con contrato.", tiempoObtener: "Antes de empezar a trabajar", obligatorio: true, enlaceOficial: "https://www.argentina.gob.ar/interior/migraciones" },
        { nombre: "DNI para extranjeros", descripcion: "Tu documento de identidad en Argentina. Se tramita con la residencia y lo emite el Registro Nacional de las Personas (RENAPER).", tiempoObtener: "Tras la residencia", obligatorio: true },
        { nombre: "CUIL", descripcion: "El número con el que la empresa te da de alta, aporta a tu jubilación y a tu obra social (salud). Lo da la ANSES.", tiempoObtener: "En línea o en la ANSES, con el DNI", obligatorio: true },
        { nombre: "Cuenta bancaria", descripcion: "Para cobrar el sueldo, que en blanco se paga por banco. Suele abrirla la empresa con tu DNI y CUIL.", tiempoObtener: "Al empezar", obligatorio: false },
      ],
      consejo: "El orden: residencia (o visa de movilidad de jóvenes) → DNI para extranjeros → CUIL → contrato y cuenta sueldo.",
    },
  },

  // ─── ECUADOR (5 nov 2026) ─────────────────────────────────────────────────
  // Fuentes: gob.ec (visas de residencia temporal de trabajo, Mercosur y
  // andina; todo en línea), Ley Orgánica de Movilidad Humana. Alquiler: la Ley
  // de Inquilinato no obliga a dar garantía, pero se suele pedir de uno a dos
  // meses (El Universo, Expreso, El Comercio); en julio de 2026 se debatía una
  // reforma con topes. Sin media oficial de precios, no se pone.
  EC: {
    codigo: "EC",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "Ecuador no tiene una visa de au pair: cuidar niños en una casa pide el mismo permiso de trabajo que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Plusvalía", url: "https://www.plusvalia.com", descripcion: "El portal de alquileres más usado de Ecuador, sobre todo en Quito y Guayaquil." },
        { nombre: "Properati", url: "https://www.properati.com.ec", descripcion: "Departamentos y casas de inmobiliarias y particulares." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com.ec/s/Ecuador/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo. Más caro, pero sin garantía." },
      ],
      consejo: "La ley no obliga a dar garantía, pero lo habitual es de uno a dos meses de arriendo, que te deben devolver si dejas la vivienda como la recibiste y sin deudas. Pon en el contrato cuánto es y cuándo te la devuelven.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Desde España o el resto de la UE hace falta un contrato con una empresa ecuatoriana, registrado en el Ministerio del Trabajo, para pedir en línea la visa de residencia temporal de trabajo. Con nacionalidad de un país del Mercosur o de la Comunidad Andina, residencia de dos años sin oferta.",
      enlaceOficial: "https://www.gob.ec/mremh/tramites/concesion-visa-residencia-temporal-trabajo-actividades-laborales-relacion-dependencia",
    },
    papeleo: {
      documentos: [
        { nombre: "Contrato registrado en el Ministerio del Trabajo", descripcion: "La empresa registra tu contrato; el certificado de ese registro es uno de los requisitos de la visa.", tiempoObtener: "Antes de pedir la visa", obligatorio: true },
        { nombre: "Visa de residencia temporal", descripcion: "Se pide en línea (e-VISAS) a la Cancillería. Dura dos años.", tiempoObtener: "Antes de empezar a trabajar", obligatorio: true, enlaceOficial: "https://www.gob.ec/mremh/tramites/concesion-visa-residencia-temporal-trabajo-actividades-laborales-relacion-dependencia" },
        { nombre: "Cédula de identidad de extranjero", descripcion: "Con la visa, la sacas en el Registro Civil. Es tu documento para el banco, el alquiler y el seguro social.", tiempoObtener: "Tras la visa", obligatorio: true },
        { nombre: "Afiliación al IESS", descripcion: "Con contrato, la empresa te afilia al Instituto Ecuatoriano de Seguridad Social: salud y jubilación.", tiempoObtener: "Desde el primer día de trabajo", obligatorio: true },
      ],
      consejo: "El orden: contrato registrado → visa en línea → cédula de extranjero en el Registro Civil → afiliación al IESS.",
    },
  },

  // ─── GUATEMALA (5 nov 2026) ───────────────────────────────────────────────
  // Fuentes: Agencia Guatemalteca de Noticias (permiso de trabajo en línea, lo
  // pide el empleador), Instituto Guatemalteco de Migración. Alquiler: sin una
  // fuente fiable sobre garantías ni precios, no se afirma nada que no conste.
  GT: {
    codigo: "GT",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "Guatemala no tiene una visa de au pair: cuidar niños en una casa pide el mismo permiso de trabajo que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Encuentra24", url: "https://www.encuentra24.com/guatemala-es/bienes-raices-alquiler-apartamentos", descripcion: "El portal de anuncios más usado de Guatemala, con apartamentos y habitaciones en alquiler." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com/s/Guatemala/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo." },
      ],
      consejo: "Sin historial en Guatemala, lo práctico es empezar por un alquiler mensual o una habitación. Pide por escrito cuánto es el depósito y cuándo te lo devuelven.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Hace falta una empresa que te contrate y pida tu permiso de trabajo al Ministerio de Trabajo, y además la residencia temporal como trabajador del Instituto Guatemalteco de Migración.",
      enlaceOficial: "https://igm.gob.gt/",
    },
    papeleo: {
      documentos: [
        { nombre: "Permiso de trabajo", descripcion: "Lo pide la empresa al Ministerio de Trabajo, en línea. Vale solo para esa empresa.", tiempoObtener: "Antes de empezar a trabajar", obligatorio: true, enlaceOficial: "https://www.mintrabajo.gob.gt/" },
        { nombre: "Residencia temporal como trabajador", descripcion: "La da el Instituto Guatemalteco de Migración. Sin ella, el permiso de trabajo no basta.", tiempoObtener: "Antes de empezar a trabajar", obligatorio: true, enlaceOficial: "https://igm.gob.gt/" },
        { nombre: "DPI de extranjero domiciliado", descripcion: "Tu documento de identidad en Guatemala. Lo da el RENAP cuando tienes la residencia.", tiempoObtener: "Tras la residencia", obligatorio: true },
        { nombre: "Afiliación al IGSS", descripcion: "Con contrato, la empresa te inscribe en el Instituto Guatemalteco de Seguridad Social.", tiempoObtener: "Al empezar a trabajar", obligatorio: true },
      ],
      consejo: "El orden: oferta de una empresa → permiso de trabajo (lo pide ella) y residencia temporal en Migración → DPI en el RENAP → IGSS.",
    },
  },

  // ─── COSTA RICA (5 nov 2026) ──────────────────────────────────────────────
  // Fuentes: Ley General de Migración 8764 (art. 80) y guías sobre la
  // residencia con permiso de trabajo. Sin una fuente fiable sobre alquileres,
  // no se afirma nada que no conste.
  CR: {
    codigo: "CR",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "Costa Rica no tiene una visa de au pair: cuidar niños en una casa pide el mismo permiso que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Encuentra24", url: "https://www.encuentra24.com/costa-rica-es/bienes-raices-alquiler-apartamentos", descripcion: "El portal de anuncios más usado de Costa Rica, con apartamentos y habitaciones." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.co.cr/s/Costa-Rica/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo." },
      ],
      consejo: "Sin historial en Costa Rica, lo práctico es empezar por un alquiler mensual o una habitación. Pide por escrito cuánto es el depósito y cuándo te lo devuelven.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Hace falta una empresa que te contrate: ella hace su parte ante el Ministerio de Trabajo y tú pides la residencia con permiso de trabajo en la Dirección General de Migración. Va ligada a esa empresa.",
      enlaceOficial: "https://www.migracion.go.cr/",
    },
    papeleo: {
      documentos: [
        { nombre: "Residencia con permiso de trabajo", descripcion: "La da la Dirección General de Migración y Extranjería, con el criterio del Ministerio de Trabajo. Sin ella no puedes trabajar.", tiempoObtener: "Suele tardar meses", obligatorio: true, enlaceOficial: "https://www.migracion.go.cr/" },
        { nombre: "DIMEX", descripcion: "El documento de identidad de los residentes extranjeros. Te lo dan con la residencia.", tiempoObtener: "Tras aprobar la residencia", obligatorio: true },
        { nombre: "Afiliación a la CCSS", descripcion: "Con contrato, la empresa te asegura en la Caja Costarricense de Seguro Social: salud y pensión.", tiempoObtener: "Al empezar a trabajar", obligatorio: true },
      ],
      consejo: "El orden: oferta de una empresa → residencia con permiso de trabajo (meses) → DIMEX → CCSS.",
    },
  },

  // ─── URUGUAY (5 nov 2026) ─────────────────────────────────────────────────
  // Fuentes: Ley 19.254 y la guía «Tipos de residencia» de Cancillería; gub.uy
  // (Garantía de alquiler del Ministerio de Vivienda con la Contaduría General
  // de la Nación, y la de jóvenes de 18 a 29 años). Sin media oficial de
  // precios, no se pone.
  UY: {
    codigo: "UY",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "Uruguay no tiene una visa de au pair: cuidar niños en una casa pide la misma residencia que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Gallito", url: "https://www.gallito.com.uy/inmuebles/alquiler", descripcion: "El portal de anuncios de toda la vida en Uruguay, con alquileres en todo el país." },
        { nombre: "InfoCasas", url: "https://www.infocasas.com.uy/alquiler", descripcion: "Alquileres de inmobiliarias y particulares." },
        { nombre: "Mercado Libre Inmuebles", url: "https://listado.mercadolibre.com.uy/inmuebles/alquiler", descripcion: "Muchos anuncios de particulares." },
      ],
      consejo: "Para alquilar piden una garantía. El Estado da una (Garantía de alquiler del Ministerio de Vivienda con la Contaduría General de la Nación): se paga una comisión mensual del 3 % del alquiler. Si tienes de 18 a 29 años y estudias o trabajas, hay una garantía para jóvenes.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Con nacionalidad de un país del Mercosur o asociado, residencia permanente gratis por la Ley 19.254. Desde España o el resto de la UE, residencia temporaria por categorías (por ejemplo, profesional contratado) o legal definitiva con medios de vida.",
      enlaceOficial: "https://www.gub.uy/ministerio-relaciones-exteriores/",
    },
    papeleo: {
      documentos: [
        { nombre: "Residencia", descripcion: "Por la Ley 19.254 si eres del Mercosur o asociado (gratis, 30 días hábiles); si no, temporaria o legal definitiva.", tiempoObtener: "Al llegar o desde el consulado", obligatorio: true, enlaceOficial: "https://www.gub.uy/ministerio-relaciones-exteriores/" },
        { nombre: "Cédula de identidad", descripcion: "Al iniciar la residencia te dan una cédula provisoria; la definitiva llega con la residencia.", tiempoObtener: "Desde que empiezas el trámite", obligatorio: true },
        { nombre: "BPS y FONASA", descripcion: "Con contrato, la empresa te da de alta en el Banco de Previsión Social, que incluye la salud por el FONASA.", tiempoObtener: "Al empezar a trabajar", obligatorio: true },
        { nombre: "Garantía de alquiler", descripcion: "La del Estado (Contaduría General de la Nación) o, de 18 a 29 años, la de jóvenes.", tiempoObtener: "Antes de firmar el alquiler", obligatorio: false, enlaceOficial: "https://www.gub.uy/tramites/garantia-alquiler" },
      ],
      consejo: "El orden: residencia (y cédula provisoria) → contrato, BPS y FONASA → garantía y alquiler.",
    },
  },

  // ─── EL SALVADOR (5 nov 2026) ─────────────────────────────────────────────
  // Fuentes: Diario El Mundo (residencia temporal por oferta de empleo, hasta
  // dos años) y la prensa sobre los «Lunes de Empleo» del Ministerio de
  // Trabajo. Sin una fuente fiable sobre alquileres, no se afirma nada.
  SV: {
    codigo: "SV",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "El Salvador no tiene una visa de au pair: cuidar niños en una casa pide la misma residencia que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Encuentra24", url: "https://www.encuentra24.com/el-salvador-es/bienes-raices-alquiler-apartamentos", descripcion: "El portal de anuncios más usado de El Salvador, con apartamentos y habitaciones." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com/s/El-Salvador/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo." },
      ],
      consejo: "Sin historial en El Salvador, lo práctico es empezar por un alquiler mensual o una habitación. Pide por escrito cuánto es el depósito y cuándo te lo devuelven.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Hace falta una oferta de empleo de una empresa salvadoreña para pedir la residencia temporal en la Dirección General de Migración y Extranjería, de hasta dos años.",
      enlaceOficial: "https://www.migracion.gob.sv/",
    },
    papeleo: {
      documentos: [
        { nombre: "Residencia temporal", descripcion: "La da la Dirección General de Migración y Extranjería con tu oferta de empleo. Dura hasta dos años y se prorroga.", tiempoObtener: "Antes de empezar a trabajar", obligatorio: true, enlaceOficial: "https://www.migracion.gob.sv/" },
        { nombre: "Carné de residente", descripcion: "Tu documento de identidad como residente. Te lo dan con la residencia.", tiempoObtener: "Tras la residencia", obligatorio: true },
        { nombre: "Afiliación al ISSS y a una AFP", descripcion: "Con contrato, la empresa te inscribe en el Instituto Salvadoreño del Seguro Social (salud) y en una administradora de pensiones.", tiempoObtener: "Al empezar a trabajar", obligatorio: true },
      ],
      consejo: "El orden: oferta de empleo → residencia temporal → carné de residente → ISSS y AFP.",
    },
  },

  // ─── PANAMÁ (5 nov 2026) ──────────────────────────────────────────────────
  // Fuentes: decreto de Países Amigos y su ampliación a Ecuador (Decreto
  // Ejecutivo 16, 2026), guías jurídicas sobre la vía por contrato y el
  // permiso de trabajo del MITRADEL. Sin una fuente fiable sobre alquileres,
  // no se afirma nada.
  PA: {
    codigo: "PA",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "Panamá no tiene una visa de au pair: cuidar niños en una casa pide el mismo permiso de trabajo que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Encuentra24", url: "https://www.encuentra24.com/panama-es/bienes-raices-alquiler-apartamentos", descripcion: "El portal de anuncios más usado de Panamá, con apartamentos y habitaciones." },
        { nombre: "Compreoalquile", url: "https://www.compreoalquile.com", descripcion: "Alquileres de inmobiliarias y particulares en Panamá." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com/s/Panama/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo." },
      ],
      consejo: "Sin historial en Panamá, lo práctico es empezar por un alquiler mensual o una habitación. Pide por escrito cuánto es el depósito y cuándo te lo devuelven.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Desde España (País Amigo): con un contrato de trabajo en Panamá, residencia provisional de dos años y luego permanente, más el permiso de trabajo del Ministerio de Trabajo, que se pide aparte.",
      enlaceOficial: "https://www.migracion.gob.pa/",
    },
    papeleo: {
      documentos: [
        { nombre: "Residencia (Países Amigos u otra)", descripcion: "La da el Servicio Nacional de Migración. Por Países Amigos con contrato de trabajo: provisional de dos años y luego permanente.", tiempoObtener: "Antes de empezar a trabajar", obligatorio: true, enlaceOficial: "https://www.migracion.gob.pa/" },
        { nombre: "Permiso de trabajo", descripcion: "Lo da el Ministerio de Trabajo (MITRADEL). La residencia no te exime de él.", tiempoObtener: "Antes de empezar a trabajar", obligatorio: true },
        { nombre: "Carné de residente", descripcion: "Tu documento de identidad como residente. Te lo da Migración con la residencia.", tiempoObtener: "Tras la residencia", obligatorio: true },
        { nombre: "Caja de Seguro Social", descripcion: "Con contrato, la empresa te inscribe en la CSS: salud y pensión.", tiempoObtener: "Al empezar a trabajar", obligatorio: true },
      ],
      consejo: "El orden: contrato → residencia en Migración y permiso de trabajo en el MITRADEL → carné de residente → Caja de Seguro Social.",
    },
  },

  // ─── REPÚBLICA DOMINICANA (5 nov 2026) ────────────────────────────────────
  // Fuentes: Dirección General de Migración (RT-3), Diario Libre (Resolución
  // 001-2026), Código de Trabajo (80/20). Sin una fuente fiable sobre
  // alquileres, no se afirma nada.
  DO: {
    codigo: "DO",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "República Dominicana no tiene una visa de au pair: cuidar niños en una casa pide el mismo permiso de trabajo que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com/s/Dominican-Republic/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo." },
      ],
      consejo: "Sin historial en República Dominicana, lo práctico es empezar por un alquiler mensual o una habitación. Pide por escrito cuánto es el depósito y cuándo te lo devuelven.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Hace falta una empresa que te contrate, con el contrato registrado en el Ministerio de Trabajo, y entrar con visa de negocios para pedir la Residencia Temporal Laboral (RT-3) en la Dirección General de Migración.",
      enlaceOficial: "https://migracion.gob.do/",
    },
    papeleo: {
      documentos: [
        { nombre: "Contrato registrado en el Ministerio de Trabajo", descripcion: "Sin contrato formal registrado no se concede ni se renueva el permiso (Resolución 001-2026).", tiempoObtener: "Antes de pedir la residencia", obligatorio: true },
        { nombre: "Residencia Temporal Laboral (RT-3)", descripcion: "La da la Dirección General de Migración. Se pide con la visa de negocios (NM1) con la que entras.", tiempoObtener: "Antes de empezar a trabajar", obligatorio: true, enlaceOficial: "https://migracion.gob.do/" },
        { nombre: "Cédula de identidad de extranjero", descripcion: "Tu documento como residente; te la dan con la residencia.", tiempoObtener: "Tras la residencia", obligatorio: true },
        { nombre: "Alta en la Tesorería de la Seguridad Social", descripcion: "Con contrato, la empresa te inscribe en la TSS: salud, pensión y riesgos laborales.", tiempoObtener: "Al empezar a trabajar", obligatorio: true },
      ],
      consejo: "El orden: contrato registrado → visa de negocios → Residencia Temporal Laboral (RT-3) → cédula de extranjero → TSS.",
    },
  },

  // ─── HONDURAS (5 nov 2026) ────────────────────────────────────────────────
  // Fuentes: Código de Trabajo (art. 11, 90 %) y guías sobre el permiso de la
  // Secretaría de Trabajo y la residencia del Instituto Nacional de Migración.
  // Sin una fuente fiable sobre alquileres, no se afirma nada.
  HN: {
    codigo: "HN",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "Honduras no tiene una visa de au pair: cuidar niños en una casa pide el mismo permiso de trabajo que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Encuentra24", url: "https://www.encuentra24.com/honduras-es/bienes-raices-alquiler-apartamentos", descripcion: "Anuncios de apartamentos y habitaciones en alquiler en Honduras." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com/s/Honduras/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo." },
      ],
      consejo: "Sin historial en Honduras, lo práctico es empezar por un alquiler mensual o una habitación. Pide por escrito cuánto es el depósito y cuándo te lo devuelven.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Hace falta una empresa que te contrate: permiso de trabajo de la Secretaría de Trabajo y residencia del Instituto Nacional de Migración.",
      enlaceOficial: "https://inm.gob.hn/",
    },
    papeleo: {
      documentos: [
        { nombre: "Permiso de trabajo", descripcion: "Lo autoriza la Secretaría de Trabajo y Seguridad Social, a petición de la empresa.", tiempoObtener: "Antes de empezar a trabajar", obligatorio: true, enlaceOficial: "https://www.trabajo.gob.hn/" },
        { nombre: "Residencia", descripcion: "La da el Instituto Nacional de Migración. Sin ella el permiso de trabajo no basta.", tiempoObtener: "Antes de empezar a trabajar", obligatorio: true, enlaceOficial: "https://inm.gob.hn/" },
        { nombre: "Carné de residente", descripcion: "Tu documento de identidad como residente; te lo dan con la residencia.", tiempoObtener: "Tras la residencia", obligatorio: true },
        { nombre: "Afiliación al IHSS", descripcion: "Con contrato, la empresa te inscribe en el Instituto Hondureño de Seguridad Social.", tiempoObtener: "Al empezar a trabajar", obligatorio: true },
      ],
      consejo: "El orden: oferta de una empresa → permiso de la Secretaría de Trabajo y residencia en Migración → carné de residente → IHSS.",
    },
  },

  // ─── VENEZUELA (6 nov 2026) ───────────────────────────────────────────────
  // Fuentes: Exteriores (visado de trabajo; prórroga en el SAIME), Finanzas
  // Digital (prórroga de la TR-L, 17 feb 2025), LOTTT art. 27, y la Embajada
  // de España en Caracas (Seguro Social: el trabajador aporta un 4 % y la
  // empresa entre un 9 y un 11 % según el riesgo). Sin un portal local de
  // alquiler que se haya podido abrir ni una fuente fiable de precios, solo se
  // pone el alquiler mensual de Airbnb. La cédula de extranjero y el RIF no se
  // han podido confirmar para quien entra con visa de trabajo: no se ponen.
  VE: {
    codigo: "VE",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "No hemos encontrado una visa de au pair en Venezuela: cuidar niños en una casa pide el mismo permiso de trabajo que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com/s/Venezuela/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo." },
      ],
      consejo: "Sin historial en Venezuela, lo práctico es empezar por un alquiler mensual o una habitación. Pide por escrito cuánto es el depósito, en qué moneda y cuándo te lo devuelven.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Hace falta una empresa que te contrate y una visa de trabajo (transeúnte laboral) de un consulado de Venezuela. Se prorroga cada año en el SAIME.",
      enlaceOficial: "https://www.saime.gob.ve/",
    },
    papeleo: {
      documentos: [
        { nombre: "Visa de trabajo (transeúnte laboral, TR-L)", descripcion: "La pides en un consulado de Venezuela, con la empresa que te contrata. Con entrada de turista no puedes trabajar.", tiempoObtener: "Antes de viajar", obligatorio: true },
        { nombre: "Prórroga en el SAIME", descripcion: "La visa se prorroga por un año en el SAIME, con la autorización laboral renovada (y un poder notariado de la empresa si tramita otra persona).", tiempoObtener: "Antes de que venza", obligatorio: true, enlaceOficial: "https://www.saime.gob.ve/" },
        { nombre: "Seguro Social (IVSS)", descripcion: "Con contrato cotizas al Seguro Social: a ti te descuentan un 4 % y la empresa pone entre un 9 y un 11 %, según el riesgo del trabajo.", tiempoObtener: "Al empezar a trabajar", obligatorio: true, enlaceOficial: "https://www.ivss.gov.ve/" },
      ],
      consejo: "El orden: oferta de una empresa → visa de trabajo en un consulado → al empezar, Seguro Social → prórroga en el SAIME cada año, antes de que venza.",
    },
  },

  // ─── NICARAGUA (6 nov 2026) ───────────────────────────────────────────────
  // Fuentes: Embajada de España en Managua (residencia en la Dirección General
  // de Migración y Extranjería o en un consulado; temporal de 1 a 3 años;
  // partida de nacimiento y antecedentes legalizados; depósito del billete de
  // vuelta), Código del Trabajo (art. 14, 90 %), PRONicaragua (cédula de
  // residencia en vigor) y La Prensa (afiliados al INSS). Encuentra24 tiene
  // sección de alquiler en Nicaragua (comprobado por buscador; su web responde
  // 403 a los robots, como la de Honduras). Sin una fuente fiable de precios,
  // no se pone ninguno.
  NI: {
    codigo: "NI",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "No hemos encontrado una visa de au pair en Nicaragua: cuidar niños en una casa pide la misma residencia que cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Encuentra24", url: "https://www.encuentra24.com/nicaragua-es/bienes-raices-alquiler-apartamentos", descripcion: "Anuncios de apartamentos y habitaciones en alquiler en Nicaragua, sobre todo en Managua." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com/s/Nicaragua/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo." },
      ],
      consejo: "Sin historial en Nicaragua, lo práctico es empezar por un alquiler mensual o una habitación. No pagues nada sin haber visto el sitio, y pide por escrito cuánto es el depósito y cuándo te lo devuelven.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Hace falta una empresa que te contrate y la residencia temporal (de uno a tres años) de la Dirección General de Migración y Extranjería, o de un consulado de Nicaragua si estás fuera.",
      enlaceOficial: "https://www.migob.gob.ni/migracion/",
    },
    papeleo: {
      documentos: [
        { nombre: "Partida de nacimiento y antecedentes penales", descripcion: "Legalizados. Los piden para la residencia: tráelos de tu país.", tiempoObtener: "Antes de viajar", obligatorio: true },
        { nombre: "Residencia temporal", descripcion: "La da la Dirección General de Migración y Extranjería y dura de uno a tres años. Piden además un depósito igual al billete de vuelta a tu país.", tiempoObtener: "Antes de empezar a trabajar", obligatorio: true, enlaceOficial: "https://www.migob.gob.ni/migracion/" },
        { nombre: "Cédula de residencia", descripcion: "Tu documento como residente. La empresa te la pide para contratarte y tiene que estar en vigor mientras trabajes.", tiempoObtener: "Tras la residencia", obligatorio: true },
        { nombre: "Seguro social (INSS)", descripcion: "Con contrato formal cotizas al Instituto Nicaragüense de Seguridad Social.", tiempoObtener: "Al empezar a trabajar", obligatorio: true },
      ],
      consejo: "El orden: papeles legalizados en tu país → oferta de una empresa → residencia en Migración → cédula de residencia → INSS.",
    },
  },

  // ─── INDIA (6 nov 2026) ───────────────────────────────────────────────────
  // Fuentes: consulados y embajadas de India (Employment Visa, sin e-Visa,
  // registro en la FRRO en 14 días si pasa de 180 días), e-FRRO del Bureau of
  // Immigration y el Income Tax Department (PAN). Sin una fuente fiable sobre
  // alquileres, no se afirma nada de precios.
  IN: {
    codigo: "IN",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "India no tiene visado de au pair: no está entre sus tipos de visado. Cuidar niños en una casa pide el Employment Visa, como cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "NoBroker", url: "https://www.nobroker.in/", descripcion: "Pisos y habitaciones de particulares en las ciudades grandes, sin agente de por medio." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com/s/India/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo." },
      ],
      consejo: "Sin historial en India, lo práctico es empezar por un alquiler mensual o una habitación compartida. Pide por escrito cuánto es el depósito y cuándo te lo devuelven.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Employment Visa: una empresa de India te contrata y lo pides en la embajada o el consulado (no hay e-Visa de empleo). Es para profesionales cualificados con sueldo alto; los profesores de idiomas que no sean de inglés y los traductores no tienen que llegar a ese sueldo.",
      enlaceOficial: "https://indianvisaonline.gov.in/",
    },
    papeleo: {
      documentos: [
        { nombre: "Employment Visa", descripcion: "Con la carta de la empresa, en la embajada o el consulado de India de tu país. Las prórrogas se hacen ya en India.", tiempoObtener: "Antes de viajar", obligatorio: true, enlaceOficial: "https://indianvisaonline.gov.in/" },
        { nombre: "Registro en la FRRO (e-FRRO)", descripcion: "La oficina de extranjeros. Si tu visado es de más de 180 días, es obligatorio y se hace en línea.", tiempoObtener: "En los 14 días desde que llegas", obligatorio: true, enlaceOficial: "https://indianfrro.gov.in/efrro/" },
        { nombre: "PAN (Permanent Account Number)", descripcion: "Tu número ante Hacienda (Income Tax Department), para la nómina y los impuestos. Los extranjeros no pueden sacarlo al momento con Aadhaar: se pide por la vía normal.", tiempoObtener: "Al empezar a trabajar", obligatorio: true, enlaceOficial: "https://www.incometax.gov.in/iec/foportal/" },
        { nombre: "Cuenta bancaria", descripcion: "Para cobrar la nómina. El banco pedirá el pasaporte con el visado y el registro.", tiempoObtener: "Depende del banco", obligatorio: false },
      ],
      consejo: "El orden: oferta y carta de la empresa → Employment Visa en la embajada → al llegar, registro en la FRRO (14 días) → PAN y cuenta bancaria.",
    },
  },

  // ─── SUDÁFRICA (6 nov 2026) ───────────────────────────────────────────────
  // Fuentes: listas de requisitos de Home Affairs (Critical Skills y General
  // Work, en vigor desde el 9 oct 2024; se entregan en VFS Global), SAQA y
  // SARS. Sin una fuente fiable sobre alquileres, no se afirma nada de precios.
  ZA: {
    codigo: "ZA",
    auPair: {
      disponible: false,
      plataformas: [],
      requisitos: "No hemos encontrado un visado de au pair entre los de Home Affairs: cuidar niños en una casa pide un visado de trabajo, como cualquier empleo.",
    },
    alojamiento: {
      plataformas: [
        { nombre: "Property24", url: "https://www.property24.com/to-rent", descripcion: "De los portales de alquiler más grandes de Sudáfrica: pisos y casas en todo el país." },
        { nombre: "Private Property", url: "https://www.privateproperty.co.za/to-rent", descripcion: "Alquileres de particulares e inmobiliarias." },
        { nombre: "Airbnb mensual", url: "https://www.airbnb.com/s/South-Africa/homes?monthly_stay=true", descripcion: "Para el primer mes, mientras buscas algo fijo." },
      ],
      consejo: "Sin historial en Sudáfrica, lo práctico es empezar por un alquiler mensual o una habitación. Pide el contrato por escrito y un recibo del depósito.",
      preciosMedios: [],
    },
    visado: {
      tipo: "visado-trabajo",
      descripcion: "Critical Skills Work Visa si tu profesión está en la lista oficial; si no, General Work Visa. Los dos piden oferta de empresa y 100 puntos, y se entregan en VFS Global.",
      enlaceOficial: "https://www.dha.gov.za/index.php/immigration-services",
    },
    papeleo: {
      documentos: [
        { nombre: "Visado de trabajo", descripcion: "Critical Skills o General Work, de Home Affairs. Hasta cinco años.", tiempoObtener: "Antes de empezar a trabajar", obligatorio: true, enlaceOficial: "https://www.dha.gov.za/index.php/immigration-services" },
        { nombre: "Evaluación del título en SAQA", descripcion: "SAQA comprueba tu título extranjero, traducido por un traductor jurado. Si el resultado no ha llegado, el visado se da por un año.", tiempoObtener: "Antes de pedir el visado", obligatorio: true, enlaceOficial: "https://www.saqa.org.za/" },
        { nombre: "Certificados médico y de antecedentes penales", descripcion: "De cada país donde hayas vivido más de un año en los últimos cinco.", tiempoObtener: "No más de seis meses de antigüedad al entregarlos", obligatorio: true },
        { nombre: "Número de contribuyente (SARS)", descripcion: "Para la nómina. La empresa puede pedirlo por ti en eFiling, o lo pides tú en SARS.", tiempoObtener: "Al empezar a trabajar", obligatorio: true, enlaceOficial: "https://www.sars.gov.za/individuals/how-do-i-register-for-tax/" },
        { nombre: "Cuenta bancaria", descripcion: "Para cobrar la nómina. El banco pedirá pasaporte con visado y justificante de domicilio.", tiempoObtener: "Depende del banco", obligatorio: false },
      ],
      consejo: "El orden: oferta → título en SAQA (y colegio profesional si toca) → visado en VFS Global → al empezar, número de SARS y cuenta bancaria.",
    },
  },

};

export function getPrimerosPasos(codigo: string): PrimerosPasosInfo | null {
  return BASE_INFO[codigo] || null;
}

/** Lista de todos los códigos con información completa */
export const CODIGOS_CON_INFO = Object.keys(BASE_INFO);
