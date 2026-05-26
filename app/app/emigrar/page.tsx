"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";

// ─── Tipos ─────────────────────────────────────────────────
type Pestaña = "visado" | "alojamiento" | "aupair" | "programas";

interface Agencia { nombre: string; url: string; desc: string }
interface Plataforma { nombre: string; url: string; desc: string }
interface Enlace { texto: string; url: string }
interface Programa { nombre: string; desc: string; url: string; emoji: string }

interface InfoPais {
  visado: {
    resumen: string;
    requisitos: string[];
    tipoVisado?: string;
    enlaces: Enlace[];
  };
  alojamiento: {
    desc: string;
    plataformas: Plataforma[];
    consejos: string[];
  };
  aupair: {
    disponible: boolean;
    requisitos: string[];
    condiciones: string[];
    agencias: Agencia[];
    enlaceOficial?: Enlace;
  };
  programas: Programa[];
}

// ─── Datos por país (información verificada con fuentes oficiales) ────────────
const INFO: Record<string, InfoPais> = {
  uk: {
    visado: {
      tipoVisado: "Skilled Worker / Graduate / Student",
      resumen:
        "Desde el Brexit (2021) los ciudadanos españoles necesitan visado para trabajar en el Reino Unido. Las principales opciones son la Skilled Worker Visa (necesitas oferta de empresa autorizada), la Graduate Visa (si ya estudiaste en UK) y la Student Visa.",
      requisitos: [
        "Oferta de trabajo de empleador autorizado por el Home Office (Skilled Worker)",
        "Nivel de inglés B1 o superior (certificado IELTS/PTE)",
        "Salario mínimo de £26.200/año o el umbral del sector (el mayor)",
        "Pasaporte válido",
        "Fondos suficientes (£1.270 mínimo si llevas menos de 12 meses en UK)",
        "Pago del IHS (Immigration Health Surcharge): £1.035/año",
      ],
      enlaces: [
        { texto: "Solicitar visado de trabajo en UK — GOV.UK", url: "https://www.gov.uk/apply-to-come-to-the-uk" },
        { texto: "Skilled Worker Visa — GOV.UK", url: "https://www.gov.uk/skilled-worker-visa" },
        { texto: "Graduate Visa — GOV.UK", url: "https://www.gov.uk/graduate-visa" },
        { texto: "Check if you need a UK visa — GOV.UK", url: "https://www.gov.uk/check-uk-visa" },
      ],
    },
    alojamiento: {
      desc: "Londres y otras ciudades UK son caras. Busca habitaciones compartidas (houseshare) para reducir costes. La media de una habitación en Londres es £900-1.300/mes; en otras ciudades £450-750/mes.",
      plataformas: [
        { nombre: "SpareRoom", url: "https://www.spareroom.co.uk", desc: "El portal más grande de UK para habitaciones compartidas" },
        { nombre: "Zoopla", url: "https://www.zoopla.co.uk", desc: "Pisos completos y habitaciones en todo UK" },
        { nombre: "Rightmove", url: "https://www.rightmove.co.uk", desc: "El mayor portal inmobiliario de UK" },
        { nombre: "Spotahome", url: "https://www.spotahome.com", desc: "Empresa española, visitas virtuales, muy popular entre expats" },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com", desc: "Enfocado en estancias medias para trabajadores y estudiantes" },
      ],
      consejos: [
        "Busca en zona 2-4 del metro de Londres y usa el Oyster card",
        "Pide referencias del casero antes de pagar",
        "Exige contrato de arrendamiento (tenancy agreement)",
        "Registra tu dirección en el ayuntamiento (Council)",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-27 años (recomendado, no hay ley específica post-Brexit)",
        "Nivel de inglés mínimo A2-B1",
        "Certificado de antecedentes penales (DBS check o equivalente español)",
        "Certificado de primeros auxilios recomendado",
        "Carnet de conducir (valorado positivamente)",
      ],
      condiciones: [
        "Nota: UK eliminó la categoría oficial 'Au Pair Visa' en 2008. Actualmente los au pairs entran con Skilled Worker o Student Visa",
        "Máximo 25-30 horas semanales de cuidado",
        "Alojamiento y manutención incluidos",
        "Paga de bolsillo: £100-150/semana (orientativo, no regulado por ley)",
        "Se recomienda formalizar contrato por escrito aunque no es obligatorio",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "La mayor plataforma de au pairs del mundo — gratuita para candidatos" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Miles de familias en UK — registro gratuito" },
        { nombre: "GreatAuPair", url: "https://www.greataupair.com", desc: "Plataforma con verificación y contrato modelo" },
        { nombre: "Cultural Care Au Pair", url: "https://www.culturalcare.com", desc: "Agencia de referencia para au pairs en UK (y USA)" },
      ],
      enlaceOficial: { texto: "Trabajo doméstico en UK — GOV.UK", url: "https://www.gov.uk/domestic-workers-in-a-private-household-visa" },
    },
    programas: [
      { nombre: "EURES — Empleo en Europa", emoji: "🇪🇺", desc: "Portal oficial de la UE para encontrar trabajo en cualquier país europeo. Aunque UK salió de la UE, sigue teniendo portal EURES.", url: "https://eures.europa.eu" },
      { nombre: "British Council — Programa de Asistentes de Idiomas", emoji: "🎓", desc: "Trabaja como asistente de español en colegios del Reino Unido con beca oficial.", url: "https://www.britishcouncil.es/programas/auxiliares-de-conversacion" },
      { nombre: "Teach English in UK (CELTA/TESOL)", emoji: "📚", desc: "Con certificado CELTA puedes enseñar inglés como negocio propio. Reconocido internacionalmente.", url: "https://www.cambridgeenglish.org/teaching-english/teaching-qualifications/celta/" },
    ],
  },

  alemania: {
    visado: {
      tipoVisado: "Libre circulación UE / Visa de búsqueda de empleo",
      resumen:
        "Como ciudadano español (UE) tienes derecho a trabajar en Alemania sin visado. Solo necesitas registrarte en la oficina local (Anmeldung) en los primeros 14 días. Para buscar trabajo desde España puedes solicitar la Visa de Búsqueda de Empleo (válida 6 meses).",
      requisitos: [
        "Pasaporte o DNI español en vigor",
        "Anmeldung (empadronamiento) en la Einwohnermeldeamt local",
        "Número de identificación fiscal alemán (Steuer-ID) — se asigna automáticamente",
        "Cuenta bancaria alemana (IBAN DE) para recibir salario",
        "Seguro médico (Krankenversicherung) — obligatorio para trabajar",
      ],
      enlaces: [
        { texto: "Trabajar en Alemania — Make it in Germany (oficial)", url: "https://www.make-it-in-germany.com/es" },
        { texto: "Anmeldung — registro de residencia", url: "https://www.make-it-in-germany.com/es/vivir-en-alemania/tramites/registro-de-residencia" },
        { texto: "Visa de búsqueda de empleo — Auswärtiges Amt", url: "https://www.auswaertiges-amt.de/es/visa-service/buerger/jobs-qualis/jobseeker-991964" },
        { texto: "BAMF — Oficina Federal de Migración", url: "https://www.bamf.de/ES/Themen/MigrationAufenthalt/ZuwandererDrittstaaten/zuwandererdrittstaaten-node.html" },
      ],
    },
    alojamiento: {
      desc: "Berlín, Múnich, Frankfurt y Hamburgo son las ciudades con más empleo. La oferta de pisos es escasa — se recomienda buscar WG (Wohngemeinschaft / piso compartido) nada más llegar.",
      plataformas: [
        { nombre: "WG-Gesucht", url: "https://www.wg-gesucht.de", desc: "El portal de referencia para pisos compartidos (WG) en Alemania" },
        { nombre: "ImmoScout24", url: "https://www.immobilienscout24.de", desc: "El mayor portal inmobiliario alemán" },
        { nombre: "Spotahome", url: "https://www.spotahome.com/de", desc: "Empresa española con visita virtual — muy usada por expats" },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/de", desc: "Contratos desde 1 mes, sin alemán necesario" },
        { nombre: "Nestpick", url: "https://www.nestpick.com", desc: "Pisos amueblados para trabajadores internacionales" },
      ],
      consejos: [
        "Haz el Anmeldung antes de buscar piso — algunas agencias lo piden",
        "Prepara una Schufa (historial crediticio) si llevas tiempo en Alemania",
        "Berlín: más asequible. Múnich: más caro pero más empleo cualificado",
        "Las WG (pisos compartidos) son la opción más rápida para recién llegados",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-27 años (obligatorio por ley alemana)",
        "Nivel de alemán A2 mínimo (obligatorio)",
        "Sin hijos propios",
        "Certificado de antecedentes penales (Führungszeugnis equivalente español)",
        "Seguro de salud y accidentes obligatorio",
        "Carnet de conducir recomendado",
      ],
      condiciones: [
        "Regulado por ley: máximo 30 horas semanales",
        "Paga de bolsillo mínima legal: 260€/mes",
        "Manutención y alojamiento incluidos",
        "Obligatorio: mínimo 6 horas de curso de alemán por semana",
        "Máximo 12 meses (ampliable a 24 en casos excepcionales)",
        "Contratos a través de agencias reconocidas por el Arbeitsamt",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "La plataforma más grande — directa con familias" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Miles de familias alemanas registradas" },
        { nombre: "IAPA — Asociación Internacional Au Pair", url: "https://www.iapa.org", desc: "Estándar internacional de calidad — busca agencias certificadas" },
        { nombre: "Cultural Care Au Pair", url: "https://www.culturalcare.com", desc: "Agencia con sede en España y Alemania" },
        { nombre: "Au Pair International", url: "https://www.aupair-international.com", desc: "Especializada en au pairs para Alemania" },
      ],
      enlaceOficial: { texto: "Au Pair en Alemania — Make it in Germany", url: "https://www.make-it-in-germany.com/es/trabajar-en-alemania/opciones/au-pair" },
    },
    programas: [
      { nombre: "Make it in Germany — Portal Oficial", emoji: "🇩🇪", desc: "Portal del gobierno alemán para trabajadores extranjeros: reconocimiento de títulos, búsqueda de empleo, visa.", url: "https://www.make-it-in-germany.com/es" },
      { nombre: "EURES — Empleo en Europa", emoji: "🇪🇺", desc: "Portal de movilidad laboral de la UE. Ofertas de empleo en Alemania filtradas por sector.", url: "https://eures.europa.eu/jobs-and-learning/search-jobs_es" },
      { nombre: "Goethe-Institut — Aprender alemán", emoji: "📚", desc: "Aprende alemán con el instituto oficial. Certificaciones reconocidas internacionalmente para visa.", url: "https://www.goethe.de/es/spr/kur.html" },
      { nombre: "Reconocimiento de Títulos — anabin", emoji: "🎓", desc: "Comprueba si tu titulación española está reconocida en Alemania antes de emigrar.", url: "https://anabin.kmk.org" },
    ],
  },

  francia: {
    visado: {
      tipoVisado: "Libre circulación UE",
      resumen:
        "Como ciudadano español tienes derecho a vivir y trabajar en Francia sin visado. Solo necesitas inscribirte en el ayuntamiento (mairie) si vas a residir más de 3 meses.",
      requisitos: [
        "DNI o pasaporte español válido",
        "Inscripción en la Mairie local si resides más de 3 meses",
        "Número de Sécurité Sociale (se obtiene al inicio del primer contrato)",
        "Cuenta bancaria francesa (IBAN FR) para cobrar el salario",
        "Justificante de domicilio (quittance de loyer o factura de luz)",
      ],
      enlaces: [
        { texto: "Trabajar en Francia — Service-Public.fr", url: "https://www.service-public.fr/particuliers/vosdroits/N19806" },
        { texto: "Pôle Emploi — Ofertas de empleo oficiales", url: "https://www.pole-emploi.fr" },
        { texto: "Vivir en Francia — Embajada Española", url: "https://www.exteriores.gob.es/Embajadas/paris/es/Paginas/inicio.aspx" },
        { texto: "France Visas — Portal oficial de visados", url: "https://france-visas.gouv.fr" },
      ],
    },
    alojamiento: {
      desc: "París es la ciudad más cara (media de una habitación: 900-1.400€). Lyon, Bordeaux, Marsella o Toulouse son más asequibles (400-700€/mes). Los propietarios suelen pedir garantías (CAF, fiador).",
      plataformas: [
        { nombre: "PAP", url: "https://www.pap.fr", desc: "Particuliers à Particuliers — sin agencia, sin comisión" },
        { nombre: "SeLoger", url: "https://www.seloger.com", desc: "El portal inmobiliario más grande de Francia" },
        { nombre: "Leboncoin", url: "https://www.leboncoin.fr", desc: "El equivalente al Wallapop francés — muchas habitaciones" },
        { nombre: "Spotahome", url: "https://www.spotahome.com/fr", desc: "Empresa española, visita virtual, contrato online" },
        { nombre: "La Carte des Colocs", url: "https://www.lacartedescolocs.fr", desc: "Pisos compartidos en toda Francia" },
      ],
      consejos: [
        "La CAF (Caisse d'Allocations Familiales) puede subvencionarte parte del alquiler",
        "LOCA-PASS del organismo Action Logement para avalar el depósito",
        "Busca residencias universitarias si tienes menos de 30 años",
        "Evita pagar sin ver el piso — fraudes frecuentes en París",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-30 años",
        "Nivel de francés mínimo A2 (la mayoría de familias piden B1)",
        "Sin hijos propios",
        "Certificado de antecedentes penales apostillado",
        "Carta de motivación en francés",
      ],
      condiciones: [
        "Regulado: máximo 25 horas semanales de cuidado",
        "Paga de bolsillo mínima: 4,33€/hora (SMIC pro-rata) ≈ 300-400€/mes",
        "Manutención y habitación incluidos",
        "Periodo de prueba: 1 mes (rescisión sin penalización)",
        "Máximo 18 meses en total",
        "Contrato oficial obligatorio — modelo 'contrat de travail au pair'",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Mayor plataforma — contrato modelo descargable" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Familias verificadas en toda Francia" },
        { nombre: "InterExchange Au Pair USA", url: "https://www.interexchange.org", desc: "También opera en Europa" },
      ],
      enlaceOficial: { texto: "Contrato Au Pair — Service-Public.fr", url: "https://www.service-public.fr/particuliers/vosdroits/F1462" },
    },
    programas: [
      { nombre: "EURES — Empleo en Francia", emoji: "🇪🇺", desc: "Ofertas de trabajo en Francia con posibilidad de ayuda para el traslado (RED EURES).", url: "https://eures.europa.eu/jobs-and-learning/search-jobs_es" },
      { nombre: "Campus France — Estudios en Francia", emoji: "🎓", desc: "Estudia en Francia con beca — Masters y doctorados en universidades públicas.", url: "https://www.campusfrance.org/es" },
      { nombre: "Assistants de langue — CIEP", emoji: "📚", desc: "Trabaja como asistente de español en colegios franceses. Beca + alojamiento.", url: "https://www.ciep.fr/assistants-de-langue" },
      { nombre: "Pôle Emploi International", emoji: "💼", desc: "Versión internacional del SEPE francés — ofertas especiales para extranjeros.", url: "https://www.pole-emploi-international.fr" },
    ],
  },

  irlanda: {
    visado: {
      tipoVisado: "Libre circulación UE",
      resumen:
        "Irlanda es parte de la UE — los ciudadanos españoles tienen derecho de libre circulación. Puedes entrar solo con DNI y empezar a trabajar de inmediato. No existe Registro Central de Residentes, pero debes solicitar el PPS Number (número de contribuyente) antes del primer salario.",
      requisitos: [
        "DNI o pasaporte español válido",
        "PPS Number (Personal Public Service Number) — imprescindible para trabajar",
        "Cuenta bancaria irlandesa o europea",
        "Justificante de domicilio en Irlanda para el PPS",
      ],
      enlaces: [
        { texto: "PPS Number — Gov.ie", url: "https://www.gov.ie/en/service/12e6f5-get-a-public-services-card/" },
        { texto: "Trabajar en Irlanda — Citizens Information", url: "https://www.citizensinformation.ie/en/moving-country/working-in-ireland/" },
        { texto: "Department of Social Protection", url: "https://www.gov.ie/en/organisation/department-of-social-protection/" },
      ],
    },
    alojamiento: {
      desc: "Dublín tiene una crisis de vivienda severa. Una habitación en Dublín cuesta 1.000-1.800€/mes. Cork, Galway y Limerick son alternativas más baratas (600-900€). Se recomienda buscar alojamiento ANTES de llegar.",
      plataformas: [
        { nombre: "Daft.ie", url: "https://www.daft.ie", desc: "EL portal de referencia en Irlanda — habitaciones y pisos" },
        { nombre: "Rent.ie", url: "https://www.rent.ie", desc: "Alternativa a Daft con menos competencia" },
        { nombre: "SpareRoom Ireland", url: "https://www.spareroom.ie", desc: "Habitaciones compartidas — muy popular entre expats" },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/ie", desc: "Para estancias medias sin necesidad de fiador local" },
      ],
      consejos: [
        "Únete a grupos de Facebook 'Españoles en Dublín' — habitaciones a buen precio",
        "El Irish Rental Deposit Protection Scheme protege tu fianza (máx. 2 meses)",
        "Evita pagar adelantado sin contrato — Threshold.ie es la asociación de inquilinos",
        "Corredores del DART (tren) y Luas (tranvía) — mejores precios",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-26 años (orientativo — no existe ley específica)",
        "Nivel de inglés mínimo B1-B2",
        "Certificado de antecedentes penales",
        "Motivación genuina por el aprendizaje del inglés",
      ],
      condiciones: [
        "No hay regulación específica au pair en Irlanda — se rige por acuerdo privado",
        "Paga de bolsillo habitual: 100-150€/semana",
        "Máximo 25-30 horas de cuidado semanales (por convenio)",
        "Manutención y alojamiento incluidos",
        "Contrato por escrito muy recomendado",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Perfil gratuito — familias verificadas en Irlanda" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Filtra por Irlanda — muchas familias en Dublín" },
        { nombre: "Great Au Pair", url: "https://www.greataupair.com", desc: "Contratos y referencias incluidas" },
      ],
      enlaceOficial: { texto: "Derechos laborales en Irlanda — Citizens Information", url: "https://www.citizensinformation.ie/en/employment/employment-rights-and-conditions/" },
    },
    programas: [
      { nombre: "EURES Irlanda", emoji: "🇪🇺", desc: "Ofertas de trabajo en Irlanda para trabajadores europeos. Información sobre el mercado laboral local.", url: "https://eures.europa.eu/jobs-and-learning/search-jobs_es" },
      { nombre: "Language Schools — Trabajar enseñando español", emoji: "🎓", desc: "Irlanda tiene una industria enorme de academias de idiomas. Puedes trabajar como profesor de español con titulación.", url: "https://www.acels.ie" },
      { nombre: "IDA Ireland — Tech & Multinacionales", emoji: "💼", desc: "Google, Meta, LinkedIn, Airbnb tienen su sede europea en Dublín. Portal oficial para candidatos internacionales.", url: "https://www.idaireland.com" },
    ],
  },

  canada: {
    visado: {
      tipoVisado: "Working Holiday (IEC) / Express Entry / Permiso de Trabajo",
      resumen:
        "Canadá ofrece varias rutas para españoles. La más popular para jóvenes es la Working Holiday (IEC) para 18-35 años, válida 1-2 años. Para residencia permanente, Express Entry es el sistema de puntos principal.",
      requisitos: [
        "IEC Working Holiday: 18-35 años, pasaporte válido, 2.500 CAD de fondos mínimos, sin antecedentes penales, certificado médico",
        "Express Entry: Mínimo 67 puntos en la CRS (inglés/francés, experiencia laboral, estudios, edad)",
        "Permiso de trabajo específico: oferta de trabajo de empleador canadiense registrado (LMIA)",
        "Inglés o francés nivel B2+ (IELTS/TEF)",
      ],
      enlaces: [
        { texto: "IEC — International Experience Canada", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/iec.html" },
        { texto: "Express Entry — Residencia permanente", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html" },
        { texto: "Portal oficial de inmigración de Canadá", url: "https://www.canada.ca/en/immigration-refugees-citizenship.html" },
        { texto: "Calcular puntos CRS — IRCC", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.html" },
      ],
    },
    alojamiento: {
      desc: "Toronto y Vancouver son las más caras (1.200-2.000 CAD/habitación). Montreal, Calgary y Edmonton son más asequibles (800-1.200 CAD). Los pisos compartidos son la norma para recién llegados.",
      plataformas: [
        { nombre: "Kijiji", url: "https://www.kijiji.ca", desc: "El portal de anuncios más usado en Canadá — habitaciones y pisos" },
        { nombre: "Craigslist Canadá", url: "https://toronto.craigslist.org", desc: "Clasifiados en Toronto, Vancouver, Montreal y otras ciudades" },
        { nombre: "PadMapper", url: "https://www.padmapper.com", desc: "Agrega anuncios de varios portales con mapa interactivo" },
        { nombre: "RentSeeker", url: "https://www.rentseeker.ca", desc: "Pisos y habitaciones en todo Canadá" },
        { nombre: "Facebook Marketplace — Españoles en Canadá", url: "https://www.facebook.com/groups", desc: "Grupos de Facebook de la comunidad española son muy útiles" },
      ],
      consejos: [
        "En Toronto o Vancouver considera zonas bien conectadas por metro (TTC / SkyTrain)",
        "Exige siempre contrato por escrito — Residential Tenancies Act",
        "El depósito máximo legal es 1 mes de alquiler",
        "La Rental Housing Enforcement Unit protege a los inquilinos en Ontario",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-35 años (para IEC Working Holiday)",
        "Inglés o francés nivel B2",
        "Permiso de trabajo válido (IEC o permiso específico)",
        "Certificado de antecedentes penales apostillado",
        "Certificado médico para la visa",
        "Experiencia con niños (6-12 meses recomendado)",
      ],
      condiciones: [
        "Au pairs en Canadá tienen derechos laborales completos — salario mínimo provincial",
        "Ontario: mínimo 17,20 CAD/hora (2024) — unas 600-700 CAD/semana",
        "Contrato de trabajo obligatorio por ley",
        "Máximo 40 horas semanales",
        "Alojamiento con la familia incluido en el acuerdo",
        "Permiso de trabajo específico requerido (Live-in/Live-out Caregiver Program)",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Plataforma directa con familias canadienses" },
        { nombre: "Cultural Care Au Pair", url: "https://www.culturalcare.com", desc: "Agencia con programa específico para Canadá" },
        { nombre: "GreatAuPair", url: "https://www.greataupair.com", desc: "Verificación de familias incluida" },
      ],
      enlaceOficial: { texto: "Home Child Care Provider Pilot — IRCC", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/hire-temporary-foreign/caregiver-program/child-care-live-out.html" },
    },
    programas: [
      { nombre: "IEC — Working Holiday Visa", emoji: "✈️", desc: "Para 18-35 años. Trabaja en cualquier empresa canadiense durante 1-2 años. La ruta más rápida para emigrar.", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/iec.html" },
      { nombre: "Express Entry — Residencia Permanente", emoji: "🏠", desc: "Sistema de puntos (CRS) para obtener residencia permanente. Con 6 meses de experiencia en Canadá, los puntos aumentan considerablemente.", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html" },
      { nombre: "Coop Education — Universidades canadienses", emoji: "🎓", desc: "Estudia en una universidad canadiense con períodos de prácticas remuneradas integrados.", url: "https://www.cewilcanada.ca" },
      { nombre: "PNP — Provincial Nominee Programs", emoji: "🗺️", desc: "Cada provincia tiene su propio programa de selección de inmigrantes. Alberta, BC y Ontario son los más populares.", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html" },
    ],
  },

  australia: {
    visado: {
      tipoVisado: "Working Holiday Visa 417 / Skilled Worker (482/189)",
      resumen:
        "Australia ofrece la Working Holiday Visa 417 para ciudadanos españoles de 18-35 años. Permite trabajar un año (ampliable a 2 y 3 años trabajando en zonas rurales). Para residencia permanente, los visados 189 y 190 son los principales.",
      requisitos: [
        "Working Holiday 417: 18-35 años, pasaporte español, 5.000 AUD de fondos mínimos, sin dependientes en el viaje, sin antecedentes penales, seguro médico de viaje",
        "Solicitud online desde España: formulario 1150 en ImmiAccount",
        "Tasa de solicitud WHV: 635 AUD (2024)",
        "Skill Assessment requerido para visados de residencia permanente",
      ],
      enlaces: [
        { texto: "Working Holiday Visa 417 — Immigration Australia", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-417" },
        { texto: "ImmiAccount — Solicitar visa online", url: "https://immi.homeaffairs.gov.au/help-support/departmental-forms/online-lodgement-form/immi-account" },
        { texto: "SkillSelect — Residencia permanente", url: "https://immi.homeaffairs.gov.au/skills-subsite/Pages/skillselect.aspx" },
        { texto: "Portal oficial de inmigración de Australia", url: "https://immi.homeaffairs.gov.au" },
      ],
    },
    alojamiento: {
      desc: "Sídney y Melbourne son las ciudades más caras (1.000-1.800 AUD/mes por habitación). Brisbane, Perth y Adelaida son más asequibles (700-1.100 AUD). Los backpacker hostels y flatshares son la opción habitual al llegar.",
      plataformas: [
        { nombre: "Domain.com.au", url: "https://www.domain.com.au", desc: "El portal inmobiliario de referencia en Australia" },
        { nombre: "Realestate.com.au", url: "https://www.realestate.com.au", desc: "El mayor portal de Australia — pisos y habitaciones" },
        { nombre: "Flatmates.com.au", url: "https://flatmates.com.au", desc: "Específico para flatshares — el más usado por trabajadores" },
        { nombre: "Gumtree Australia", url: "https://www.gumtree.com.au", desc: "Clasificados — muchas habitaciones y trabajo temporal" },
        { nombre: "Backpacker Jobs Board", url: "https://www.backpackerjobboard.com.au", desc: "Trabajo y alojamiento para recién llegados con WHV" },
      ],
      consejos: [
        "Los backpacker hostels (HI Hostels) son seguros y económicos para la primera semana",
        "Bond (fianza) máximo: 4 semanas de alquiler según la ley estatal",
        "Fairwork Australia protege a trabajadores con WHV — salario mínimo 23,23 AUD/hora (2024)",
        "Zonas rurales: más trabajo estacional disponible para renovar el WHV",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-30 años (35 para algunos países — España: 35 elegible)",
        "Working Holiday Visa 417 o Student Visa",
        "Nivel de inglés B1-B2",
        "Working With Children Check (WWCC) — obligatorio por ley",
        "Primeros auxilios recomendado",
        "Experiencia demostrable con niños",
      ],
      condiciones: [
        "Au pairs en Australia tienen derechos laborales plenos — salario mínimo 23,23 AUD/hora",
        "Máximo 40 horas semanales",
        "Alojamiento y manutención con la familia",
        "Paga habitual: 200-350 AUD/semana + alojamiento",
        "Contrato por escrito recomendado (Fairwork Australia)",
      ],
      agencias: [
        { nombre: "Au Pair Australia", url: "https://www.aupairaustralia.com.au", desc: "Agencia especializada en Australia — familias verificadas" },
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Filtra por Australia — directo con familias" },
        { nombre: "GreatAuPair", url: "https://www.greataupair.com", desc: "Perfil verificado y referencias" },
        { nombre: "Cultural Care Au Pair", url: "https://www.culturalcare.com", desc: "Programa en Australia incluido" },
      ],
      enlaceOficial: { texto: "Derechos laborales Australia — Fairwork", url: "https://www.fairwork.gov.au/employee-entitlements/when-you-first-start-a-job" },
    },
    programas: [
      { nombre: "Working Holiday Visa 417", emoji: "🏄", desc: "La ruta más popular para españoles de 18-35 años. Trabaja en cualquier sector — se renueva trabajando en zonas rurales.", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-417" },
      { nombre: "Work & Holiday Visa 462", emoji: "🌿", desc: "Similar al 417 pero para otras nacionalidades. Verifica tu elegibilidad en el portal oficial.", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462" },
      { nombre: "Harvest Trail — Trabajo rural para renovar WHV", emoji: "🌾", desc: "Haz 88 días de trabajo en zona rural y renueva tu WHV un año más. Portal oficial del gobierno australiano.", url: "https://jobsearch.gov.au/harvesttrail" },
      { nombre: "TAFE — Formación profesional australiana", emoji: "🎓", desc: "Centros de FP reconocidos internacionalmente. Títulos homologables en España.", url: "https://www.tafecourses.com.au" },
    ],
  },

  paises_bajos: {
    visado: {
      tipoVisado: "Libre circulación UE",
      resumen:
        "Como ciudadano español tienes derecho de libre circulación en los Países Bajos. Solo necesitas registrarte en el municipio (BRP) en los primeros 5 días si te quedas más de 4 meses.",
      requisitos: [
        "DNI o pasaporte español válido",
        "BSN (Burgerservicenummer) — número de identificación — se obtiene al registrarse en el BRP",
        "BRP (Basisregistratie Personen) — registro municipal obligatorio si resides más de 4 meses",
        "Cuenta bancaria neerlandesa o europea",
        "Seguro médico (Zorgverzekering) — obligatorio por ley",
      ],
      enlaces: [
        { texto: "BRP — Registro municipal — Government.nl", url: "https://www.government.nl/topics/personal-data/question-and-answer/how-do-i-register-at-a-municipality" },
        { texto: "IND — Servicio de Inmigración Países Bajos", url: "https://ind.nl/en" },
        { texto: "Expatcenter Amsterdam", url: "https://www.iamsterdam.com/en/live-work-study/in-amsterdam/registration-and-official-matters/registration-as-a-resident/expatcenter" },
        { texto: "Work.nl — Portal oficial de empleo", url: "https://www.werk.nl" },
      ],
    },
    alojamiento: {
      desc: "Ámsterdam tiene una crisis de vivienda muy severa. Se recomienda buscar en Eindhoven, Rotterdam, La Haya o Utrecht (más asequibles). Habitación media en Ámsterdam: 900-1.500€/mes.",
      plataformas: [
        { nombre: "Kamernet", url: "https://kamernet.nl", desc: "El portal específico de habitaciones en Países Bajos" },
        { nombre: "Funda", url: "https://www.funda.nl", desc: "El mayor portal inmobiliario — pisos completos" },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/nl", desc: "Contratos medios sin necesidad de fiador local" },
        { nombre: "Spotahome", url: "https://www.spotahome.com/nl", desc: "Empresa española con visita virtual" },
      ],
      consejos: [
        "El mercado de pisos en Países Bajos es muy competitivo — actúa rápido",
        "La Huurcommissie es el organismo que regula los alquileres sociales",
        "Muchas empresas ofrecen 'relocation allowance' para cubrir gastos de mudanza",
        "Eindhoven y Utrecht tienen más oferta y mejores precios que Ámsterdam",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-26 años (límite de edad por regulación neerlandesa)",
        "Nivel de inglés B1 o neerlandés A2",
        "Sin hijos propios",
        "Seguro de salud y accidentes",
        "Antecedentes penales limpios",
      ],
      condiciones: [
        "Máximo 30 horas semanales",
        "Paga de bolsillo mínima: 340€/mes (regulado por el UWV)",
        "Manutención y alojamiento con la familia",
        "Máximo 12 meses",
        "Clases de neerlandés recomendadas",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Familias neerlandesas verificadas — gratuito para candidatos" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Filtra por Países Bajos" },
      ],
      enlaceOficial: { texto: "Au Pair en Países Bajos — IND", url: "https://ind.nl/en/au-pair" },
    },
    programas: [
      { nombre: "EURES Países Bajos", emoji: "🇪🇺", desc: "Ofertas de trabajo para europeos con apoyo de consejeros EURES en el UWV neerlandés.", url: "https://eures.europa.eu" },
      { nombre: "Dutch Tech Week — Sector tecnológico", emoji: "💻", desc: "Los Países Bajos tienen uno de los ecosistemas tech más fuertes de Europa. ASML, Booking.com, Philips.", url: "https://www.dutchtechweek.nl" },
      { nombre: "Nuffic — Homologación de títulos", emoji: "🎓", desc: "Reconocimiento oficial de tu titulación española en Países Bajos.", url: "https://www.nuffic.nl/en/diploma-recognition" },
    ],
  },

  usa: {
    visado: {
      tipoVisado: "J-1 / H-1B / L-1 / O-1 (muy restrictivo)",
      resumen:
        "EE.UU. no tiene acuerdo de libre circulación con España. Las opciones más realistas para trabajar son el J-1 (intercambio cultural/prácticas), el H-1B (trabajo cualificado, sorteo), el L-1 (traslado intraempresarial) y el O-1 (talentos extraordinarios). No existe 'working holiday visa' para ciudadanos españoles.",
      requisitos: [
        "J-1 Trainee/Intern: Empresa americana + sponsor J-1 autorizado por el Dpto. de Estado",
        "H-1B: Oferta de trabajo + grado universitario + ganar el sorteo anual (solo 65.000 cupos)",
        "L-1: Llevar mínimo 1 año trabajando en empresa multinacional y trasladarse a oficina USA",
        "O-1: Demostrar logros extraordinarios (premios, publicaciones, reconocimientos nacionales/internacionales)",
        "Pasaporte MACHINE READABLE vigente para todos",
      ],
      enlaces: [
        { texto: "Visados de trabajo — US Department of State", url: "https://travel.state.gov/content/travel/en/us-visas/employment.html" },
        { texto: "J-1 Visa Exchange Programs", url: "https://j1visa.state.gov" },
        { texto: "H-1B — USCIS", url: "https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations" },
        { texto: "ESTA — Viaje sin visa (hasta 90 días, sin trabajar)", url: "https://esta.cbp.dhs.gov" },
      ],
    },
    alojamiento: {
      desc: "Nueva York, San Francisco y Los Ángeles son extremadamente caras (2.000-4.000 USD/mes por habitación en Manhattan). Austin, Atlanta, Phoenix o Charlotte son opciones más asequibles con economía en crecimiento.",
      plataformas: [
        { nombre: "Craigslist", url: "https://www.craigslist.org", desc: "El portal clásico americano para habitaciones y pisos" },
        { nombre: "Zillow", url: "https://www.zillow.com", desc: "El mayor portal inmobiliario de USA" },
        { nombre: "Apartments.com", url: "https://www.apartments.com", desc: "Pisos verificados con precio y disponibilidad en tiempo real" },
        { nombre: "Facebook Marketplace", url: "https://www.facebook.com/marketplace", desc: "Muy activo para habitaciones en USA" },
        { nombre: "Roomies.com", url: "https://www.roomies.com", desc: "Habitaciones compartidas — fácil para recién llegados" },
      ],
      consejos: [
        "Sin Social Security Number (SSN) es difícil alquilar — busca con guarantor español",
        "El primer mes + depósito + comisión de agente puede superar 5.000 USD",
        "Zonas con metro en NYC: busca fuera de Manhattan (Queens, Brooklyn)",
        "Muchos empleadores ofrecen 'relocation package' para perfil cualificado",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-26 años (OBLIGATORIO — no hay excepciones en el programa J-1 Au Pair)",
        "Inglés nivel B2-C1 (examen telefónico en inglés)",
        "600 horas de experiencia documentada con niños",
        "Carnet de conducir válido (obligatorio)",
        "Sin antecedentes penales",
        "Carta de motivación + referencias de 2-3 familias o empleadores anteriores",
      ],
      condiciones: [
        "VISA OBLIGATORIA: J-1 Au Pair — gestionada por agencia autorizada por el Dpto. de Estado",
        "Paga semanal fija: 195,75 USD/semana (fijada por ley federal)",
        "Máximo 45 horas semanales / 10 horas diarias",
        "2 semanas de vacaciones pagadas al año",
        "500 USD para estudios universitarios (obligatorio por ley)",
        "Alojamiento y manutención con la familia anfitriona",
        "Duración: 12 meses (ampliable 6/9/12 meses más)",
      ],
      agencias: [
        { nombre: "Au Pair in America (APIA)", url: "https://www.aupairinamerica.com", desc: "La agencia más grande y antigua autorizada por el Dpto. de Estado USA" },
        { nombre: "Cultural Care Au Pair", url: "https://www.culturalcare.es", desc: "Oficina en España — visa J-1 incluida" },
        { nombre: "InterExchange Au Pair USA", url: "https://www.interexchange.org/au-pair-usa/", desc: "Agencia autorizada con soporte en español" },
        { nombre: "Au Pair Care", url: "https://www.aupaircare.com", desc: "Familias verificadas en todo USA" },
      ],
      enlaceOficial: { texto: "J-1 Au Pair Program — US State Department", url: "https://j1visa.state.gov/programs/au-pair/" },
    },
    programas: [
      { nombre: "J-1 Trainee — Prácticas en USA", emoji: "🏢", desc: "Hasta 18 meses de prácticas en empresa americana de tu sector. Necesitas sponsor J-1 + oferta de empresa.", url: "https://j1visa.state.gov/programs/intern-trainee/" },
      { nombre: "Fulbright — Becas para estudios en USA", emoji: "🎓", desc: "La beca más prestigiosa para estudiar en USA. Financiación completa. Gestión por la Comisión Fulbright España.", url: "https://www.fulbright.es" },
      { nombre: "SEVIS — Sistema de registro de estudiantes", emoji: "📋", desc: "Para estudiar en USA necesitas estar registrado en SEVIS antes de solicitar la visa F-1.", url: "https://www.ice.gov/sevis" },
    ],
  },
};

// ─── Países disponibles ─────────────────────────────────────
const PAISES = [
  { id: "uk", label: "Reino Unido", flag: "🇬🇧" },
  { id: "alemania", label: "Alemania", flag: "🇩🇪" },
  { id: "francia", label: "Francia", flag: "🇫🇷" },
  { id: "irlanda", label: "Irlanda", flag: "🇮🇪" },
  { id: "paises_bajos", label: "P. Bajos", flag: "🇳🇱" },
  { id: "canada", label: "Canadá", flag: "🇨🇦" },
  { id: "australia", label: "Australia", flag: "🇦🇺" },
  { id: "usa", label: "EE.UU.", flag: "🇺🇸" },
];

const PESTAÑAS: { id: Pestaña; label: string; emoji: string }[] = [
  { id: "visado", label: "Visado", emoji: "📋" },
  { id: "alojamiento", label: "Alojamiento", emoji: "🏠" },
  { id: "aupair", label: "Au Pair", emoji: "👶" },
  { id: "programas", label: "Programas", emoji: "✨" },
];

// ─── Componente principal ────────────────────────────────────
export default function EmigrarPage() {
  const [pais, setPais] = useState("uk");
  const [pestaña, setPestaña] = useState<Pestaña>("visado");

  const info = INFO[pais];
  const paisObj = PAISES.find(p => p.id === pais)!;

  return (
    <div className="min-h-screen pt-14 pb-10 px-4" style={{ background: "#0f1117" }}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="text-center pt-4 pb-1">
          <div className="text-4xl mb-2">🌍</div>
          <h1 className="text-xl font-bold text-white">Emigrar y trabajar en el extranjero</h1>
          <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
            Información verificada con fuentes oficiales · Actualizado 2025-2026
          </p>
        </div>

        {/* Selector de países */}
        <div className="flex flex-wrap gap-2 justify-center">
          {PAISES.map(p => (
            <button
              key={p.id}
              onClick={() => setPais(p.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition"
              style={{
                background: pais === p.id ? "#10b981" : "#1a1f2e",
                color: pais === p.id ? "#fff" : "#9ca3af",
                border: `1px solid ${pais === p.id ? "#10b981" : "#2d3748"}`,
              }}
            >
              <span>{p.flag}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1 rounded-xl p-1" style={{ background: "#1a1f2e" }}>
          {PESTAÑAS.map(t => (
            <button
              key={t.id}
              onClick={() => setPestaña(t.id)}
              className="py-2 rounded-lg text-xs font-medium transition flex flex-col items-center gap-0.5"
              style={{
                background: pestaña === t.id ? "#10b981" : "transparent",
                color: pestaña === t.id ? "#fff" : "#6b7280",
              }}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>

          {/* ── VISADO ── */}
          {pestaña === "visado" && (
            <div className="space-y-4">
              {info.visado.tipoVisado && (
                <div className="text-xs font-bold px-3 py-1.5 rounded-full inline-block"
                  style={{ background: "#0d2818", color: "#10b981", border: "1px solid #065f46" }}>
                  {paisObj.flag} {info.visado.tipoVisado}
                </div>
              )}
              <p className="text-sm leading-relaxed" style={{ color: "#d1d5db" }}>{info.visado.resumen}</p>

              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#9ca3af" }}>REQUISITOS PRINCIPALES</p>
                <ul className="space-y-2">
                  {info.visado.requisitos.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: "#d1d5db" }}>
                      <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#9ca3af" }}>FUENTES OFICIALES</p>
                <div className="space-y-2">
                  {info.visado.enlaces.map((e, i) => (
                    <a key={i} href={e.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 transition"
                      style={{ background: "#0f1117", color: "#10b981", border: "1px solid #1f2937" }}>
                      <span>🔗</span>
                      <span className="underline underline-offset-2">{e.texto}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ALOJAMIENTO ── */}
          {pestaña === "alojamiento" && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: "#d1d5db" }}>{info.alojamiento.desc}</p>

              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#9ca3af" }}>PLATAFORMAS DE ALOJAMIENTO</p>
                <div className="space-y-2">
                  {info.alojamiento.plataformas.map((p, i) => (
                    <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                      className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition"
                      style={{ background: "#0f1117", border: "1px solid #1f2937" }}>
                      <span className="text-sm font-semibold" style={{ color: "#10b981" }}>{p.nombre} →</span>
                      <span className="text-xs" style={{ color: "#6b7280" }}>{p.desc}</span>
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#9ca3af" }}>CONSEJOS PRÁCTICOS</p>
                <ul className="space-y-1.5">
                  {info.alojamiento.consejos.map((c, i) => (
                    <li key={i} className="flex gap-2 text-sm" style={{ color: "#d1d5db" }}>
                      <span className="text-yellow-400 shrink-0">💡</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ── AU PAIR ── */}
          {pestaña === "aupair" && (
            <div className="space-y-4">
              {/* Banner guía completa */}
              <Link href="/app/au-pair"
                className="flex items-center justify-between rounded-xl px-4 py-3.5"
                style={{ background: "linear-gradient(135deg,#0d2818,#0a1a1a)", border: "1px solid #10b981" }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#10b981" }}>👶 Ver Guía Completa Au Pair</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6ee7b7" }}>
                    Documentos, alojamiento, salarios por país, ventajas para estudiantes
                  </p>
                </div>
                <span className="text-xl">→</span>
              </Link>

              {!info.aupair.disponible ? (
                <p className="text-sm" style={{ color: "#9ca3af" }}>
                  El programa Au Pair no está regulado específicamente en este país.
                  Consulta directamente con las agencias internacionales.
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-bold mb-2" style={{ color: "#9ca3af" }}>REQUISITOS EN {paisObj.label.toUpperCase()}</p>
                    <ul className="space-y-1.5">
                      {info.aupair.requisitos.map((r, i) => (
                        <li key={i} className="flex gap-2 text-sm" style={{ color: "#d1d5db" }}>
                          <span className="text-green-400 shrink-0">✓</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-bold mb-2" style={{ color: "#9ca3af" }}>CONDICIONES Y DERECHOS</p>
                    <ul className="space-y-1.5">
                      {info.aupair.condiciones.map((c, i) => (
                        <li key={i} className="flex gap-2 text-sm" style={{ color: c.startsWith("Nota:") || c.startsWith("VISA") ? "#f59e0b" : "#d1d5db" }}>
                          <span className="shrink-0">{c.startsWith("Nota:") || c.startsWith("VISA") ? "⚠️" : "📌"}</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-bold mb-2" style={{ color: "#9ca3af" }}>AGENCIAS VERIFICADAS</p>
                    <div className="space-y-2">
                      {info.aupair.agencias.map((a, i) => (
                        <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                          className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition"
                          style={{ background: "#0f1117", border: "1px solid #1f2937" }}>
                          <span className="text-sm font-semibold" style={{ color: "#10b981" }}>{a.nombre} →</span>
                          <span className="text-xs" style={{ color: "#6b7280" }}>{a.desc}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  {info.aupair.enlaceOficial && (
                    <a href={info.aupair.enlaceOficial.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm rounded-xl px-3 py-2.5"
                      style={{ background: "#0d2818", color: "#10b981", border: "1px solid #065f46" }}>
                      🏛️ <span className="underline underline-offset-2">{info.aupair.enlaceOficial.texto}</span>
                    </a>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── PROGRAMAS ── */}
          {pestaña === "programas" && (
            <div className="space-y-3">
              {info.programas.map((p, i) => (
                <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                  className="flex gap-3 rounded-xl p-4 transition"
                  style={{ background: "#0f1117", border: "1px solid #1f2937" }}>
                  <span className="text-2xl shrink-0">{p.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "#10b981" }}>{p.nombre} →</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#9ca3af" }}>{p.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Buscar ofertas en este país */}
        <Link
          href={`/app/buscar?pais=${paisObj.label}`}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm"
          style={{ background: "#10b981", color: "#fff" }}
        >
          🔍 Buscar ofertas de trabajo en {paisObj.flag} {paisObj.label}
        </Link>

        {/* Disclaimer */}
        <p className="text-center text-xs" style={{ color: "#4b5563" }}>
          Información basada en fuentes oficiales. Verifica siempre los requisitos actuales antes de iniciar cualquier trámite.
        </p>
      </div>
    </div>
  );
}
