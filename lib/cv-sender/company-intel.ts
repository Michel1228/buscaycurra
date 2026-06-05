/**
 * company-intel.ts — Inteligencia de empresa destino
 *
 * Detecta:
 *   1. Zona horaria de la empresa (por dominio email, TLD, o ubicación conocida)
 *   2. Sector probable (por nombre de empresa y dominio)
 *   3. Ventana óptima de envío (hora local de la empresa con mayor tasa de apertura)
 *   4. Información sobre turnos/horarios típicos del sector
 *
 * Estrategia:
 *   - "ahora"   → enviar inmediatamente (ignora zona horaria)
 *   - "optimo"  → calcular la ventana de 9-10:30am hora local de la empresa
 *
 * Esto posiciona a BuscayCurra frente a InfoJobs: no solo envías el CV,
 * lo envías CUANDO LO VAN A LEER.
 */

// ─── Timezone por TLD ─────────────────────────────────────────────────────────
const TLD_TIMEZONE: Record<string, string> = {
  es: "Europe/Madrid",
  pt: "Europe/Lisbon",
  fr: "Europe/Paris",
  de: "Europe/Berlin",
  it: "Europe/Rome",
  uk: "Europe/London",
  nl: "Europe/Amsterdam",
  be: "Europe/Brussels",
  ch: "Europe/Zurich",
  at: "Europe/Vienna",
  ie: "Europe/Dublin",
  se: "Europe/Stockholm",
  dk: "Europe/Copenhagen",
  no: "Europe/Oslo",
  fi: "Europe/Helsinki",
  pl: "Europe/Warsaw",
  cz: "Europe/Prague",
  ro: "Europe/Bucharest",
  gr: "Europe/Athens",
  mx: "America/Mexico_City",
  ar: "America/Argentina/Buenos_Aires",
  co: "America/Bogota",
  cl: "America/Santiago",
  pe: "America/Lima",
  br: "America/Sao_Paulo",
  us: "America/New_York",
  ca: "America/Toronto",
  jp: "Asia/Tokyo",
  cn: "Asia/Shanghai",
  in: "Asia/Kolkata",
  au: "Australia/Sydney",
  nz: "Pacific/Auckland",
  ae: "Asia/Dubai",
  sa: "Asia/Riyadh",
  za: "Africa/Johannesburg",
};

// ─── Timezone por dominio conocido ────────────────────────────────────────────
const DOMAIN_TIMEZONE: Record<string, string> = {
  "mercadona.es": "Europe/Madrid",
  "carrefour.es": "Europe/Madrid",
  "elcorteingles.es": "Europe/Madrid",
  "inditex.com": "Europe/Madrid",
  "santander.es": "Europe/Madrid",
  "bbva.es": "Europe/Madrid",
  "caixabank.es": "Europe/Madrid",
  "telefonica.es": "Europe/Madrid",
  "repsol.com": "Europe/Madrid",
  "iberdrola.es": "Europe/Madrid",
  "bancosantander.es": "Europe/Madrid",
  "mapfre.es": "Europe/Madrid",
  "adecco.es": "Europe/Madrid",
  "randstad.es": "Europe/Madrid",
  "infojobs.net": "Europe/Madrid",
  "linkedin.com": "America/Los_Angeles",
  "microsoft.com": "America/Los_Angeles",
  "google.com": "America/Los_Angeles",
  "amazon.com": "America/Los_Angeles",
  "amazon.es": "Europe/Madrid",
  "booking.com": "Europe/Amsterdam",
};

// ─── Sector por keywords ──────────────────────────────────────────────────────
const SECTOR_KEYWORDS: Array<{ sector: string; keywords: string[]; ventanaOptima: { hora: number; min: number }; turnos: string }> = [
  {
    sector: "Hostelería / Restauración",
    keywords: ["hotel", "restaurante", "bar", "cafetería", "catering", "hostel", "turismo", "hospedaje", "alojamiento", "cocina", "camarero"],
    ventanaOptima: { hora: 10, min: 0 },
    turnos: "Suelen revisar CVs entre 10-11:30h (antes del pico de servicio). Evitar 13-16h (comidas) y 20-23h (cenas).",
  },
  {
    sector: "Retail / Comercio",
    keywords: ["tienda", "comercio", "supermercado", "mercadona", "carrefour", "lidl", "aldi", "dia", "alcampo", "eroski", "consum", "retail", "dependiente"],
    ventanaOptima: { hora: 9, min: 0 },
    turnos: "RRHH revisa CVs a primera hora (8-10h). Lunes y martes son los mejores días. Evitar viernes tarde y sábados.",
  },
  {
    sector: "Tecnología / IT",
    keywords: ["software", "tech", "tecnología", "developer", "programador", "ingeniero", "sistemas", "devops", "cloud", "data", "ia", "ciberseguridad", "startup"],
    ventanaOptima: { hora: 9, min: 30 },
    turnos: "Equipos de tech revisan CVs entre 9-11h. Martes y miércoles tienen mayor tasa de respuesta. Evitar lunes (mucho email acumulado).",
  },
  {
    sector: "Sanidad / Salud",
    keywords: ["hospital", "clínica", "sanidad", "salud", "médico", "enfermero", "farmacia", "farmacéutico", "quirófano", "ambulancia", "geriátrico", "residencia"],
    ventanaOptima: { hora: 8, min: 30 },
    turnos: "RRHH sanitario revisa CVs temprano (8-10h). Los cambios de turno suelen ser a las 8h, 15h y 22h. Mejor enviar justo después del cambio.",
  },
  {
    sector: "Logística / Transporte",
    keywords: ["logística", "transporte", "almacén", "distribución", "paquetería", "mensajería", "flota", "conductor", "repartidor", "carretillero", "mozo"],
    ventanaOptima: { hora: 8, min: 0 },
    turnos: "RRHH de logística revisa CVs muy temprano (7-9h) antes de que arranque la operativa. Turnos rotativos: mañana (6-14h), tarde (14-22h), noche (22-6h).",
  },
  {
    sector: "Banca / Finanzas",
    keywords: ["banco", "financiero", "seguros", "inversión", "banca", "contable", "auditor", "finanzas", "actuario", "riesgos", "compliance"],
    ventanaOptima: { hora: 9, min: 0 },
    turnos: "RRHH de banca revisa CVs entre 9-10:30h. Evitar cierres de mes (días 28-31). Mejor enviar primera semana del mes.",
  },
  {
    sector: "Construcción / Industria",
    keywords: ["construcción", "obra", "industrial", "fábrica", "manufactura", "producción", "montaje", "soldador", "electricista", "fontanero", "mecánico", "taller"],
    ventanaOptima: { hora: 7, min: 30 },
    turnos: "Encargados revisan CVs muy temprano (7-8:30h) antes de entrar a obra/planta. Turnos típicos: 7-15h o 8-16h.",
  },
  {
    sector: "Educación",
    keywords: ["colegio", "instituto", "universidad", "academia", "formación", "profesor", "docente", "educador", "maestro", "escuela"],
    ventanaOptima: { hora: 9, min: 0 },
    turnos: "RRHH educativo revisa CVs entre 9-11h. Mejor enviar martes-jueves. Evitar julio-agosto (vacaciones escolares) y períodos de exámenes.",
  },
  {
    sector: "Administración Pública",
    keywords: ["ayuntamiento", "gobierno", "ministerio", "público", "administración", "oposición", "funcionario", "diputación", "junta", "consejería"],
    ventanaOptima: { hora: 9, min: 0 },
    turnos: "Administración revisa CVs entre 9-11h. Procesos lentos. Solo aplica si hay convocatoria abierta. L-V 8-15h típicamente.",
  },
];

// ─── Detección ────────────────────────────────────────────────────────────────

export interface CompanyIntel {
  /** Zona horaria IANA detectada */
  timezone: string;
  /** País probable */
  country: string;
  /** Sector detectado (o null si no se pudo) */
  sector: string | null;
  /** Ventana óptima de envío (hora local de la empresa) */
  ventanaOptima: { hora: number; min: number };
  /** Info sobre turnos y horarios del sector */
  infoTurnos: string | null;
  /** Hora actual en la zona de la empresa */
  horaLocalEmpresa: string;
  /** Diferencia horaria con España */
  diffConEspana: string;
}

/**
 * Detecta la zona horaria desde el dominio del email de la empresa.
 * Prioridad: dominio conocido > TLD > geo-IP fallback.
 */
function detectarTimezone(domain: string): { tz: string; country: string } {
  const lower = domain.toLowerCase().trim();

  // 1. Dominio conocido exacto
  if (DOMAIN_TIMEZONE[lower]) {
    const tz = DOMAIN_TIMEZONE[lower];
    return { tz, country: tz.split("/")[1]?.replace(/_/g, " ") ?? "Desconocido" };
  }

  // 2. Dominio conocido parcial (e.g., amazon.es → .es TLD)
  const parts = lower.split(".");
  const tld = parts[parts.length - 1];
  if (tld && TLD_TIMEZONE[tld]) {
    const tz = TLD_TIMEZONE[tld];
    const countryNames: Record<string, string> = {
      es: "España", pt: "Portugal", fr: "Francia", de: "Alemania", it: "Italia",
      uk: "Reino Unido", nl: "Países Bajos", be: "Bélgica", ch: "Suiza",
      ie: "Irlanda", se: "Suecia", dk: "Dinamarca", no: "Noruega", fi: "Finlandia",
      pl: "Polonia", cz: "Rep. Checa", ro: "Rumanía", gr: "Grecia",
      mx: "México", ar: "Argentina", co: "Colombia", cl: "Chile", pe: "Perú",
      br: "Brasil", us: "EEUU", ca: "Canadá", jp: "Japón", cn: "China",
      in: "India", au: "Australia", nz: "Nueva Zelanda",
      ae: "Emiratos Árabes", sa: "Arabia Saudí", za: "Sudáfrica",
    };
    return { tz, country: countryNames[tld] ?? tld.toUpperCase() };
  }

  // 3. Gmail.com / Outlook.com / genéricos → fallback España
  if (["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "proton.me", "icloud.com"].includes(lower)) {
    return { tz: "Europe/Madrid", country: "España (asumido por email genérico)" };
  }

  return { tz: "Europe/Madrid", country: "España (asumido)" };
}

/**
 * Detecta el sector de la empresa por su nombre y dominio.
 */
function detectarSector(nombreEmpresa: string, domain: string): {
  sector: string | null;
  ventanaOptima: { hora: number; min: number };
  infoTurnos: string | null;
} {
  const texto = `${nombreEmpresa} ${domain}`.toLowerCase();

  for (const entry of SECTOR_KEYWORDS) {
    for (const kw of entry.keywords) {
      if (texto.includes(kw)) {
        return {
          sector: entry.sector,
          ventanaOptima: entry.ventanaOptima,
          infoTurnos: entry.turnos,
        };
      }
    }
  }

  // Fallback: ventana genérica 9:00-10:30
  return {
    sector: null,
    ventanaOptima: { hora: 9, min: 0 },
    infoTurnos: null,
  };
}

/**
 * Analiza la empresa destino y devuelve inteligencia completa:
 * zona horaria, sector, ventana óptima de envío, info de turnos.
 */
export function analizarEmpresa(
  companyEmail: string,
  companyName: string,
  companyUrl?: string
): CompanyIntel {
  // Extraer dominio del email (o usar URL como fallback)
  const domain = companyEmail.includes("@")
    ? companyEmail.split("@")[1]
    : companyUrl
      ? new URL(companyUrl.startsWith("http") ? companyUrl : `https://${companyUrl}`).hostname
      : "desconocido.es";

  const { tz, country } = detectarTimezone(domain);
  const { sector, ventanaOptima, infoTurnos } = detectarSector(companyName, domain);

  // Hora local actual de la empresa
  const ahoraLocal = new Date().toLocaleTimeString("es-ES", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  });

  // Diferencia con España
  const ahoraEsp = new Date();
  const ahoraEmp = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  const diffHoras = Math.round((ahoraEmp.getTime() - ahoraEsp.getTime()) / 3_600_000);
  const diffStr = diffHoras === 0
    ? "Misma hora que España"
    : diffHoras > 0
      ? `+${diffHoras}h respecto a España`
      : `${diffHoras}h respecto a España`;

  return {
    timezone: tz,
    country,
    sector,
    ventanaOptima,
    infoTurnos,
    horaLocalEmpresa: ahoraLocal,
    diffConEspana: diffStr,
  };
}

/**
 * Calcula la fecha/hora óptima de envío para la empresa.
 * Devuelve el próximo momento en que la empresa esté en su ventana óptima (9-10:30am hora local).
 *
 * @param timezone - Zona horaria IANA de la empresa
 * @param ventanaOptima - Hora local óptima {hora, min}
 * @returns Fecha JS del próximo momento óptimo
 */
export function calcularEnvioOptimo(
  timezone: string,
  ventanaOptima: { hora: number; min: number }
): Date {
  // 1. Obtener la hora actual en la zona destino usando Intl (formato 24h)
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const partes = formatter.formatToParts(new Date());
  const horaActual = parseInt(partes.find(p => p.type === "hour")?.value ?? "0");
  const minActual = parseInt(partes.find(p => p.type === "minute")?.value ?? "0");

  // 2. Calcular los minutos desde medianoche en la zona destino
  const minutosAhora = horaActual * 60 + minActual;
  const minutosOptimo = ventanaOptima.hora * 60 + ventanaOptima.min;

  // 3. Calcular cuántos minutos faltan para la ventana óptima
  let minutosHastaObjetivo = minutosOptimo - minutosAhora;
  if (minutosHastaObjetivo <= 0) {
    // Ya pasó la ventana hoy → mañana
    minutosHastaObjetivo += 24 * 60;
  }

  // 4. Añadir un jitter aleatorio (0-25 min) para no enviar todos a la vez
  minutosHastaObjetivo += Math.floor(Math.random() * 30);

  // 5. Construir la fecha UTC sumando los minutos al now()
  const ahoraUTC = Date.now();
  const fechaEnvio = new Date(ahoraUTC + minutosHastaObjetivo * 60_000);

  // 6. Saltar fines de semana si caemos en sábado o domingo
  while (fechaEnvio.getUTCDay() === 0 || fechaEnvio.getUTCDay() === 6) {
    fechaEnvio.setUTCDate(fechaEnvio.getUTCDate() + 1);
  }

  return fechaEnvio;
}

/**
 * Formatea la información de la empresa para mostrar al usuario.
 */
export function formatearInfoEmpresa(intel: CompanyIntel): string {
  const partes: string[] = [];

  partes.push(`📍 ${intel.country} (${intel.horaLocalEmpresa} hora local, ${intel.diffConEspana})`);

  if (intel.sector) {
    partes.push(`🏢 Sector: ${intel.sector}`);
  }

  if (intel.infoTurnos) {
    partes.push(`🕐 ${intel.infoTurnos}`);
  }

  return partes.join("\n");
}
