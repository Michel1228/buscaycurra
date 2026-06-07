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
      { nombre: "Bundesagentur für Arbeit", url: "https://www.arbeitsagentur.de/en", descripcion: "La agencia de empleo federal. Registro gratuito. También gestiona el subsidio de desempleo (ALG I)." },
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
      requisitos: "18-30 años, inglés básico, sin antecedentes. POST-BREXIT: los españoles necesitan visado. Opciones: Youth Mobility Scheme (cupo limitado, solicitar antes de enero), o si la familia patrocina, Skilled Worker. Duración: 6-12 meses.",
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
      descripcion: "Post-Brexit, los españoles necesitan visado para trabajar en UK. Opciones: Youth Mobility Scheme (18-30 años, 2 años, sin oferta previa — cupo limitado para españoles, solicitar en enero), Skilled Worker Visa (necesitas oferta de empresa con licencia de patrocinio), Health & Care Worker Visa (sanidad, proceso acelerado).",
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
      descripcion: "Working Holiday Visa (subclass 417) para españoles 18-35 años. Permite trabajar 12 meses en cualquier sector (prorrogable a 24-36 con trabajo regional). Sin oferta previa. Coste: ~635 AUD. Aprobación online en días/semanas. Es el visado más fácil de Australia.",
      enlaceOficial: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-417",
    },
    papeleo: {
      documentos: [
        { nombre: "TFN (Tax File Number)", descripcion: "Número fiscal australiano. Solicítalo en la ATO (Australian Tax Office) online antes incluso de llegar. Si no lo tienes, tu empleador te retendrá el 47% del sueldo.", tiempoObtener: "1-4 semanas (online)", obligatorio: true, enlaceOficial: "https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn" },
        { nombre: "Cuenta bancaria", descripcion: "Commonwealth Bank, ANZ, Westpac o NAB. Puedes abrirla ANTES de llegar a Australia (todo online con pasaporte). Muy recomendable para llegar con cuenta activa.", tiempoObtener: "Online, 1-3 días (antes de llegar)", obligatorio: true },
        { nombre: "Superannuation (fondo de pensiones)", descripcion: "Tu empleador ingresa el 11,5% de tu sueldo en un fondo de pensiones. Al salir de Australia puedes recuperarlo todo (DASP - Departing Australia Superannuation Payment). No lo ignores.", tiempoObtener: "Automático al empezar a trabajar", obligatorio: false, enlaceOficial: "https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/when-you-can-access-your-super/departing-australia-superannuation-payment" },
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
      enlaceOficial: "https://www.government.nl/topics/identification-documents/bsn",
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
      enlaceOficial: "https://www.udi.no/en/want-to-apply/residence-under-the-eueeu-rules/",
    },
    papeleo: {
      documentos: [
        { nombre: "D-number o Personnummer", descripcion: "El D-number es para estancias cortas (< 6 meses). El personnummer es para residentes permanentes. Solicítalo en Skateetaten con pasaporte + contrato de trabajo. Sin él no puedes cobrar ni abrir cuenta.", tiempoObtener: "2-4 semanas", obligatorio: true, enlaceOficial: "https://www.skatteetaten.no/en/person/foreign/d-number/" },
        { nombre: "BankID", descripcion: "La identidad digital noruega. Necesita personnummer o D-number. Sin ella no puedes hacer prácticamente ningún trámite online en Noruega.", tiempoObtener: "1-2 semanas (tras personnummer)", obligatorio: false },
        { nombre: "Cuenta bancaria", descripcion: "DNB, Nordea NO o SpareBank 1. Necesitas D-number/personnummer. Sin él: Wise o N26 para empezar.", tiempoObtener: "1-7 días", obligatorio: true },
        { nombre: "Registro en Helfo", descripcion: "El sistema de salud noruego. Regístrate en Helfo para tener acceso a médico de cabecera (fastlege). Cita en Helfo o online en helsenorge.no.", tiempoObtener: "1-2 semanas", obligatorio: false, enlaceOficial: "https://www.helsenorge.no/en/registration-of-foreign-nationals" },
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
        { nombre: "Codice Fiscale", descripcion: "El equivalente italiano al NIF español. Gratis y rápido. Solicítalo en la Agenzia delle Entrate más cercana con pasaporte. También puedes pedirlo en el consulado italiano en España antes de irte.", tiempoObtener: "El mismo día (presencial) o 1-2 semanas (correo)", obligatorio: true, enlaceOficial: "https://www.agenziaentrate.gov.it/portale/schede/istanze/richiesta-ts_cf/informazioni-cf-ts/richiedere-il-cf/" },
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
      { nombre: "Garantía Juvenil", url: "https://garantiajuvenil.sepe.es", descripcion: "Programa europeo para jóvenes 16-29 años. Formación gratuita, prácticas en empresas y ayudas a la contratación." },
      { nombre: "Programa Vulcanus (UE-Japón)", url: "https://www.eu-japan.eu/vulcanus", descripcion: "Prácticas remuneradas en Japón para estudiantes de ingeniería y ciencia. Convocatoria anual." },
      { nombre: "EURES España", url: "https://eures.sepe.es", descripcion: "Portal oficial de movilidad laboral europea. Ofertas verificadas con condiciones de trabajo transparentes." },
      { nombre: "ICEX Vives", url: "https://www.icex.es/icex/vives", descripcion: "Becas de internacionalización. Prácticas remuneradas en empresas españolas con actividad internacional." },
      { nombre: "Auxiliares de Conversación", url: "https://www.educacionfpydeportes.gob.es/servicios-al-ciudadano/catalogo/profesorado/convocatorias/extranjeros/auxiliares-conversacion-espanoles-extranjero.html", descripcion: "Programa del Ministerio de Educación. Auxiliar de español en colegios de Francia, Alemania, Reino Unido, Italia y más. 700-1.000€/mes." },
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
        { nombre: "Meldezettel (empadronamiento)", descripcion: "Registro de domicilio en el Magistrat o Gemeindeamt. OBLIGATORIO en los 3 primeros días. Llevar pasaporte + carta del casero (Wohnungsgeberbestätigung). Muy importante — sin él no puedes abrir cuenta ni trabajar.", tiempoObtener: "El mismo día", obligatorio: true, enlaceOficial: "https://www.wien.gv.at/amtshelfer/dokumente/statistik/bevoelkerung/meldezettel.html" },
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
      enlaceOficial: "https://www.nyidanmark.dk/en-GB/You-want-to-apply/EU-EEA-and-Nordic-citizens/",
    },
    papeleo: {
      documentos: [
        { nombre: "CPR number (Det Centrale Personregister)", descripcion: "El número de identidad danés. Trámite en la oficina Borgerservice de tu municipio con pasaporte + contrato de trabajo o alquiler. IMPRESCINDIBLE para trabajar y acceder a servicios.", tiempoObtener: "1-3 días hábiles", obligatorio: true, enlaceOficial: "https://lifeindenmark.borger.dk/working-in-denmark/work-rights-and-conditions/cpr-number" },
        { nombre: "MitID (identidad digital)", descripcion: "El sistema de identidad digital danés. Necesita CPR number. Imprescindible para trámites online con el gobierno, banco y casi todo.", tiempoObtener: "1-5 días (tras CPR number)", obligatorio: true, enlaceOficial: "https://www.mitid.dk/en" },
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
      enlaceOficial: "https://dvv.fi/en/persons-moving-to-finland",
    },
    papeleo: {
      documentos: [
        { nombre: "Finnish personal identity code (Henkilötunnus)", descripcion: "El número de identidad finlandés. Solicítalo en el DVV con pasaporte + contrato de trabajo o prueba de residencia. Sin él no puedes abrir cuenta ni trabajar legalmente.", tiempoObtener: "2-4 semanas", obligatorio: true, enlaceOficial: "https://dvv.fi/en/persons-moving-to-finland" },
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
      descripcion: "Working Holiday Visa para españoles 18-35 años. Coste: 215 NZD (~120€). Válida 12 meses (extensible a 23 meses si haces 3 meses de trabajo regional). Sin oferta previa. Tramítala en la web de Immigration New Zealand.",
      enlaceOficial: "https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/about-visa/working-holiday-visa",
    },
    papeleo: {
      documentos: [
        { nombre: "IRD Number (número fiscal)", descripcion: "El número tributario de Nueva Zelanda. Solicítalo en la Inland Revenue Department online. Sin él tu empleador te retiene el 45% del sueldo (rate máximo).", tiempoObtener: "1-2 semanas (online)", obligatorio: true, enlaceOficial: "https://www.ird.govt.nz/roles/individuals/apply-for-an-ird-number" },
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

};

export function getPrimerosPasos(codigo: string): PrimerosPasosInfo | null {
  return BASE_INFO[codigo] || null;
}

/** Lista de todos los códigos con información completa */
export const CODIGOS_CON_INFO = Object.keys(BASE_INFO);
