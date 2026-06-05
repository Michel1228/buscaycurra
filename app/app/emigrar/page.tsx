"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";

// ─── Tipos ─────────────────────────────────────────────────
type Pestaña = "visado" | "alojamiento" | "aupair" | "programas" | "derechos";

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
      { nombre: "Workaway UK", emoji: "🌍", desc: "Voluntariado a cambio de alojamiento y comida. Más de 2.000 anfitriones en UK. Regístrate gratis y filtra por 'United Kingdom'.", url: "https://www.workaway.info" },
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
      { nombre: "Assistants de langue — France Éducation International", emoji: "📚", desc: "Trabaja como asistente de español en colegios franceses. Beca + alojamiento. (CIEP se renombró a France Éducation International en 2020)", url: "https://www.france-education-international.fr" },
      { nombre: "France Travail — Ofertas internacionales", emoji: "💼", desc: "El nuevo nombre de Pôle Emploi desde 2024. Ofertas de empleo en Francia y asesoramiento para trabajadores extranjeros.", url: "https://www.francetravail.fr" },
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
      { nombre: "Harvest Trail — Trabajo rural para renovar WHV", emoji: "🌾", desc: "Haz 88 días de trabajo en zona rural y renueva tu WHV un año más. Portal oficial del gobierno australiano.", url: "https://www.workforceaustralia.gov.au" },
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

  italia: {
    visado: {
      tipoVisado: "Libre circulación UE",
      resumen:
        "Como ciudadano español tienes derecho de libre circulación en Italia. Puedes trabajar sin visado. Si te quedas más de 3 meses, debes registrarte en el Comune local y obtener el Codice Fiscale (número de identificación fiscal) en la Agenzia delle Entrate — imprescindible para trabajar y alquilar.",
      requisitos: [
        "DNI o pasaporte español válido",
        "Codice Fiscale — número fiscal italiano, se obtiene gratis en la Agenzia delle Entrate",
        "Registrazione al Comune (empadronamiento) si resides más de 3 meses",
        "Cuenta bancaria italiana o europea para cobrar el salario",
        "Permesso di soggiorno NO requerido para ciudadanos UE",
      ],
      enlaces: [
        { texto: "Trabajar en Italia — Portal oficial del Ministerio de Trabajo", url: "https://www.lavoro.gov.it" },
        { texto: "Codice Fiscale — Agenzia delle Entrate", url: "https://www.agenziaentrate.gov.it/portale/web/guest/schede/altri-servizi/codice-fiscale-e-tessera-sanitaria/richiesta-del-codice-fiscale" },
        { texto: "EURES Italia — Empleo en Europa", url: "https://eures.europa.eu" },
        { texto: "Cliclavoro — Portal empleo italiano", url: "https://www.cliclavoro.gov.it" },
      ],
    },
    alojamiento: {
      desc: "Milán es la ciudad más cara (habitación media 700-1.200€/mes). Roma, Bolonia y Florencia rondan 500-900€. El sur de Italia (Nápoles, Sicilia) es mucho más económico (300-500€). Los contratos suelen exigir fianza de 2-3 meses.",
      plataformas: [
        { nombre: "Idealista.it", url: "https://www.idealista.it", desc: "Portal español con gran presencia en Italia — pisos y habitaciones" },
        { nombre: "Immobiliare.it", url: "https://www.immobiliare.it", desc: "El mayor portal inmobiliario italiano" },
        { nombre: "Bakeca.it", url: "https://www.bakeca.it", desc: "Clasificados de habitaciones — muchas ofertas sin agencia" },
        { nombre: "Spotahome", url: "https://www.spotahome.com/it", desc: "Empresa española con visita virtual — muy usada por expats en Italia" },
      ],
      consejos: [
        "Exige siempre contrato registrado en la Agenzia delle Entrate (evita el 'nero')",
        "La fianza no puede superar 3 meses de alquiler por ley",
        "En Milán busca en zonas bien conectadas por metro (MM): Navigli, Lambrate, Nolo",
        "Los pisos amueblados (ammobiliato) son habituales y más fáciles para recién llegados",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-30 años",
        "Nivel de italiano A2 recomendado (muchas familias aceptan inglés)",
        "Sin hijos propios",
        "Certificado de antecedentes penales",
        "Experiencia con niños valorada",
      ],
      condiciones: [
        "Regulado en Italia: máximo 25 horas semanales de cuidado",
        "Paga de bolsillo: 250-350€/mes",
        "Manutención y alojamiento incluidos",
        "Contrato oficial recomendado (contratto di lavoro au pair)",
        "Máximo 24 meses",
      ],
      agencias: [
        { nombre: "PortaleAuPair.it", url: "https://www.portaleaupair.it", desc: "Portal de referencia para au pairs en Italia — familias verificadas" },
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "La plataforma más grande del mundo — muchas familias en Italia" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Filtra por Italia — registro gratuito" },
      ],
      enlaceOficial: { texto: "Trabajar en Italia — Ministerio de Trabajo", url: "https://www.lavoro.gov.it" },
    },
    programas: [
      { nombre: "EURES Italia — Empleo en Europa", emoji: "🇪🇺", desc: "Portal oficial de la UE con ofertas de empleo en Italia filtradas por sector y región.", url: "https://eures.europa.eu" },
      { nombre: "Cliclavoro — Portal oficial de empleo", emoji: "💼", desc: "Portal del Ministerio de Trabajo italiano con ofertas de empleo en todo el país.", url: "https://www.cliclavoro.gov.it" },
      { nombre: "Erasmus+ — Prácticas en Italia", emoji: "🎓", desc: "Becas para prácticas remuneradas en empresas italianas para titulados y estudiantes.", url: "https://www.erasmusplus.it" },
    ],
  },

  suecia: {
    visado: {
      tipoVisado: "Libre circulación UE",
      resumen:
        "Como ciudadano español (UE) puedes trabajar en Suecia sin visado. Si resides más de 3 meses, debes registrarte en Skatteverket (Agencia Tributaria sueca) para obtener el Personnummer — número de identidad imprescindible para acceder a servicios, alquilar y cobrar el salario.",
      requisitos: [
        "DNI o pasaporte español válido",
        "Personnummer — número de identidad sueco, se solicita en Skatteverket",
        "Registro en Skatteverket si resides más de 1 año",
        "Cuenta bancaria sueca (BankID) para cobros — muy recomendable",
        "Seguro médico cubierto por la Seguridad Social sueca (Försäkringskassan) una vez registrado",
      ],
      enlaces: [
        { texto: "Trabajar en Suecia — Arbetsförmedlingen (portal oficial)", url: "https://arbetsformedlingen.se" },
        { texto: "Personnummer — Skatteverket", url: "https://www.skatteverket.se/privat/folkbokforing/omfolkbokforing/personnummer.4.3810a01c150939e893f18c29.html" },
        { texto: "EURES Suecia — Empleo en Europa", url: "https://eures.europa.eu" },
        { texto: "Migrationsverket — Inmigración Suecia", url: "https://www.migrationsverket.se/English/Private-individuals/EU-citizens-and-Nordic-citizens.html" },
      ],
    },
    alojamiento: {
      desc: "Estocolmo tiene una crisis de vivienda importante — las colas para pisos de alquiler público pueden durar años. Gotemburgo y Malmö son alternativas más accesibles. Habitación media en Estocolmo: 600-1.100€/mes.",
      plataformas: [
        { nombre: "Blocket.se", url: "https://www.blocket.se/bostad", desc: "El portal de clasificados más popular de Suecia — habitaciones y pisos" },
        { nombre: "Bostad.se", url: "https://www.bostad.se", desc: "Pisos en alquiler en toda Suecia" },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/se", desc: "Contratos medios sin necesidad de fiador local — ideal para recién llegados" },
        { nombre: "Samtrygg", url: "https://www.samtrygg.se", desc: "Subarriendos verificados — popular entre trabajadores internacionales" },
      ],
      consejos: [
        "Inscríbete en la cola de Stockholms Stads Bostadsförmedling cuanto antes (años de espera)",
        "Los contratos en segunda mano (andrahandskontrakt) son más rápidos pero más caros",
        "Comprueba que el casero tiene permiso para subarrendar",
        "Malmö y Gotemburgo tienen mercados más accesibles que Estocolmo",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-30 años (orientativo)",
        "Nivel de inglés B1 o sueco básico",
        "Sin hijos propios",
        "Certificado de antecedentes penales",
        "Experiencia demostrable con niños",
      ],
      condiciones: [
        "Máximo 25 horas semanales de cuidado",
        "Paga de bolsillo: SEK 3.500-5.000/mes (aproximadamente 320-460€)",
        "Manutención y alojamiento incluidos",
        "Acceso a clases de sueco recomendado",
        "Contrato por escrito recomendado",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Mayor plataforma — familias suecas verificadas" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Filtra por Suecia — registro gratuito" },
        { nombre: "GreatAuPair", url: "https://www.greataupair.com", desc: "Verificación de familias y contrato modelo" },
      ],
      enlaceOficial: { texto: "Vivir y trabajar en Suecia — Migrationsverket", url: "https://www.migrationsverket.se/English/Private-individuals/EU-citizens-and-Nordic-citizens.html" },
    },
    programas: [
      { nombre: "Arbetsförmedlingen — Portal de empleo oficial", emoji: "🇸🇪", desc: "La agencia pública de empleo sueca. Ofertas en todos los sectores, incluidos empleos para no sueco-hablantes.", url: "https://arbetsformedlingen.se/other-languages" },
      { nombre: "EURES Suecia — Empleo en Europa", emoji: "🇪🇺", desc: "Portal oficial UE con ofertas filtradas por Suecia y apoyo de consejeros EURES.", url: "https://eures.europa.eu" },
      { nombre: "SFI — Svenska för invandrare", emoji: "📚", desc: "Aprende sueco gratis con el programa oficial del gobierno sueco para inmigrantes.", url: "https://www.skolverket.se/undervisning/vuxenutbildningen/kommunal-vuxenutbildning-komvux/svenska-for-invandrare-sfi" },
    ],
  },

  suiza: {
    visado: {
      tipoVisado: "Permiso L o B — Acuerdo Bilateral UE-Suiza",
      resumen:
        "Suiza no es UE pero tiene un Acuerdo de Libre Circulación con la UE. Los ciudadanos españoles pueden trabajar en Suiza con un permiso automático: Permiso L (hasta 1 año) o Permiso B (hasta 5 años, renovable). No se necesita visa previa — el permiso se solicita en la oficina cantonal una vez en Suiza con oferta de trabajo.",
      requisitos: [
        "Pasaporte o DNI español válido",
        "Permiso L (corta duración, hasta 1 año) o Permiso B (residencia, hasta 5 años) — se obtiene en la oficina cantonal de migración",
        "Contrato de trabajo firmado con empresa suiza",
        "Registro en la comunidad (Einwohnerkontrolle / contrôle des habitants) en los primeros 14 días",
        "Seguro de salud obligatorio (LaMal) — debes contratar uno dentro de los 3 meses de llegada",
      ],
      enlaces: [
        { texto: "Permiso B para ciudadanos UE/EFTA — SEM Suiza", url: "https://www.sem.admin.ch/sem/es/home/themen/aufenthalt/eu_efta/ausweis_b_eu_efta.html" },
        { texto: "Trabajar en Suiza — ch.ch (portal oficial)", url: "https://www.ch.ch/es/trabajo/trabajar-en-suiza/" },
        { texto: "EURES Suiza — Empleo en Europa", url: "https://eures.europa.eu" },
        { texto: "Jobs.ch — Portal de empleo suizo", url: "https://www.jobs.ch" },
      ],
    },
    alojamiento: {
      desc: "Suiza es uno de los países más caros del mundo. Zúrich y Ginebra tienen habitaciones desde 1.200-2.000 CHF/mes. Berna, Basilea y Lausana son algo más asequibles. Los salarios suizos compensan el alto coste de vida.",
      plataformas: [
        { nombre: "Homegate.ch", url: "https://www.homegate.ch", desc: "El mayor portal inmobiliario suizo — pisos y habitaciones" },
        { nombre: "Comparis.ch", url: "https://www.comparis.ch/immobilien", desc: "Comparador de pisos con alertas de precio" },
        { nombre: "ImmoScout24.ch", url: "https://www.immoscout24.ch", desc: "Gran oferta de pisos en alquiler en toda Suiza" },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/ch", desc: "Contratos medios para trabajadores internacionales" },
      ],
      consejos: [
        "Registra tu dirección en la oficina cantonal nada más llegar — es obligatorio",
        "El seguro de salud (Krankenkasse / caisse maladie) es obligatorio y tiene un coste elevado",
        "Los salarios suizos son muy altos — un salario medio compensa el alto coste de vida",
        "Busca en ciudades secundarias como Winterthur o Lucerna si Zúrich se excede de presupuesto",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-25 años (límite por regulación suiza)",
        "Nivel de alemán, francés o italiano A2 según el cantón de la familia",
        "Sin hijos propios",
        "Certificado de antecedentes penales",
        "Permiso L o B requerido",
      ],
      condiciones: [
        "Regulado: máximo 30 horas semanales de cuidado",
        "Paga de bolsillo: CHF 700-900/mes (aproximadamente 700-900€ — uno de los más altos de Europa)",
        "Manutención y alojamiento incluidos",
        "La familia paga el 50% de las clases de idioma (obligatorio por ley)",
        "Máximo 12 meses (ampliable a 24 en casos especiales)",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Mayor plataforma — familias suizas verificadas" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Filtra por Suiza — muchas familias en Zúrich y Ginebra" },
        { nombre: "Pro Filia", url: "https://www.profilia.ch", desc: "Agencia suiza de referencia especializada en au pairs" },
      ],
      enlaceOficial: { texto: "Au Pair en Suiza — SEM (Secretaría de Estado de Migraciones)", url: "https://www.sem.admin.ch/sem/es/home/themen/aufenthalt/eu_efta/ausweis_b_eu_efta.html" },
    },
    programas: [
      { nombre: "Jobs.ch — Portal de empleo suizo", emoji: "🇨🇭", desc: "El mayor portal de empleo de Suiza. Ofertas en alemán, francés e inglés para todos los sectores.", url: "https://www.jobs.ch" },
      { nombre: "EURES Suiza — Empleo en Europa", emoji: "🇪🇺", desc: "Portal oficial UE con ofertas en Suiza y apoyo para el proceso de solicitud de permiso.", url: "https://eures.europa.eu" },
      { nombre: "Swissinfo — Vivir en Suiza", emoji: "📋", desc: "Guía oficial para expatriados: permisos, sanidad, impuestos y trámites prácticos.", url: "https://www.swissinfo.ch/spa/vivir-en-suiza" },
    ],
  },

  belgica: {
    visado: {
      tipoVisado: "Libre circulación UE",
      resumen:
        "Como ciudadano español (UE) puedes vivir y trabajar en Bélgica sin visado. Debes registrarte en la commune (ayuntamiento) local en los primeros 90 días y solicitar la eID card (tarjeta de identidad europea). El número de registro (NISS) es imprescindible para trabajar y acceder a servicios.",
      requisitos: [
        "DNI o pasaporte español válido",
        "Registro en la commune local — te asignan el número NISS",
        "eID card — tarjeta de identidad electrónica belga",
        "Cuenta bancaria belga o europea",
        "Seguro médico — cubierto por la mutualidad (mutualité/ziekenfonds) una vez registrado",
      ],
      enlaces: [
        { texto: "Vivir y trabajar en Bélgica — Belgium.be", url: "https://www.belgium.be/es/trabajo/trabajar_en_belgica" },
        { texto: "VDAB — Servicio de empleo de Flandes", url: "https://www.vdab.be" },
        { texto: "Actiris — Servicio de empleo de Bruselas", url: "https://www.actiris.brussels" },
        { texto: "EURES Bélgica — Empleo en Europa", url: "https://eures.europa.eu" },
      ],
    },
    alojamiento: {
      desc: "Bruselas es la ciudad más cara (habitación media 600-1.000€/mes). Gante, Amberes, Lieja y Brujas son más asequibles (400-700€). El mercado de alquiler es competitivo pero menos extremo que otras capitales europeas.",
      plataformas: [
        { nombre: "Immoweb.be", url: "https://www.immoweb.be", desc: "El mayor portal inmobiliario belga — pisos y habitaciones" },
        { nombre: "Spotahome", url: "https://www.spotahome.com/be", desc: "Empresa española con visita virtual — muy usada por expats" },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/be", desc: "Contratos medios sin fiador local — ideal para recién llegados" },
        { nombre: "Logic-immo.be", url: "https://www.logic-immo.be", desc: "Portal inmobiliario en francés y neerlandés" },
      ],
      consejos: [
        "Registra tu dirección en la commune antes de buscar trabajo — el NISS es imprescindible",
        "El estado de vía (état des lieux) al inicio del contrato es obligatorio y te protege",
        "La garantía máxima legal es de 2 meses de alquiler",
        "Bruselas tiene excelente transporte público (metro, tram, STIB/MIVB)",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-26 años (orientativo)",
        "Nivel de francés o neerlandés A2 según la región",
        "Sin hijos propios",
        "Certificado de antecedentes penales",
        "Experiencia con niños recomendada",
      ],
      condiciones: [
        "No hay regulación específica au pair en Bélgica — se rige por acuerdo privado",
        "Máximo 25 horas semanales de cuidado",
        "Paga de bolsillo: 350-450€/mes",
        "Manutención y alojamiento incluidos",
        "Contrato por escrito muy recomendado",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Mayor plataforma — familias belgas verificadas" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Filtra por Bélgica — muchas familias en Bruselas" },
        { nombre: "GreatAuPair", url: "https://www.greataupair.com", desc: "Verificación de familias y referencias incluidas" },
      ],
      enlaceOficial: { texto: "Trabajar en Bélgica — Belgium.be", url: "https://www.belgium.be/es/trabajo/trabajar_en_belgica" },
    },
    programas: [
      { nombre: "VDAB — Empleo en Flandes", emoji: "🇧🇪", desc: "La agencia pública de empleo de Flandes. Ofertas en neerlandés, formación y orientación laboral.", url: "https://www.vdab.be" },
      { nombre: "Actiris — Empleo en Bruselas", emoji: "💼", desc: "Agencia de empleo de la Región de Bruselas-Capital. Muchas multinacionales buscan perfiles bilingües.", url: "https://www.actiris.brussels" },
      { nombre: "EURES Bélgica — Empleo en Europa", emoji: "🇪🇺", desc: "Portal oficial UE con ofertas en Bélgica para ciudadanos europeos.", url: "https://eures.europa.eu" },
    ],
  },

  portugal: {
    visado: {
      tipoVisado: "Libre circulación UE",
      resumen:
        "Portugal es uno de los destinos más fáciles para españoles: mismo idioma latino, libre circulación UE y trámites sencillos. Debes registrarte en la Junta de Freguesia local y obtener el NIF (Número de Identificação Fiscal) en las Finanças — imprescindible para trabajar, alquilar y abrir cuenta bancaria.",
      requisitos: [
        "DNI o pasaporte español válido",
        "NIF — Número de Identificação Fiscal, se solicita en las Finanças (AT)",
        "Registro en la Junta de Freguesia local si resides más de 3 meses",
        "Número de Segurança Social — se obtiene en el Centro Distrital del ISS",
        "Cuenta bancaria portuguesa o europea",
      ],
      enlaces: [
        { texto: "IEFP — Instituto de Emprego e Formação Profissional", url: "https://www.iefp.pt" },
        { texto: "NIF — Portal das Finanças Portugal", url: "https://www.portaldasfinancas.gov.pt" },
        { texto: "EURES Portugal — Empleo en Europa", url: "https://eures.europa.eu" },
        { texto: "Emprego.gov.pt — Portal oficial de empleo", url: "https://www.emprego.ine.pt" },
      ],
    },
    alojamiento: {
      desc: "Lisboa y Oporto se han encarecido mucho en los últimos años (habitación media 600-1.000€). Ciudades como Braga, Coimbra, Faro o Setúbal son mucho más asequibles (300-500€). El mercado está tensionado por el turismo y los nómadas digitales.",
      plataformas: [
        { nombre: "Idealista.pt", url: "https://www.idealista.pt", desc: "Portal español muy activo en Portugal — pisos y habitaciones" },
        { nombre: "OLX.pt", url: "https://www.olx.pt", desc: "Clasificados muy populares — habitaciones sin agencia" },
        { nombre: "Uniplaces", url: "https://www.uniplaces.com/pt", desc: "Enfocado en estudiantes y jóvenes trabajadores — Lisboa y Oporto" },
        { nombre: "Imovirtual.com", url: "https://www.imovirtual.com", desc: "Gran portal inmobiliario portugués con muchas opciones" },
      ],
      consejos: [
        "El contrato de arrendamiento debe registrarse en las Finanças para ser válido",
        "La fianza máxima legal en Portugal es de 2 meses",
        "Busca en grupos de Facebook 'Españoles en Lisboa/Oporto' para ofertas directas",
        "El Programa de Arrendamento Acessível ofrece pisos a precio reducido para residentes",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-27 años (orientativo)",
        "Español como lengua materna (ventaja enorme para familias que quieren enseñar español a sus hijos)",
        "Sin hijos propios",
        "Certificado de antecedentes penales",
        "Conocimientos básicos de portugués muy valorados",
      ],
      condiciones: [
        "No hay regulación específica au pair en Portugal — se rige por acuerdo privado",
        "Máximo 25 horas semanales de cuidado",
        "Paga de bolsillo: 200-300€/mes",
        "Manutención y alojamiento incluidos",
        "Integración muy fácil por la similitud cultural e idiomática",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Mayor plataforma — familias portuguesas verificadas" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Filtra por Portugal — muchas familias en Lisboa" },
        { nombre: "GreatAuPair", url: "https://www.greataupair.com", desc: "Verificación de familias y referencias" },
      ],
      enlaceOficial: { texto: "IEFP — Emprego e Formação Profissional Portugal", url: "https://www.iefp.pt" },
    },
    programas: [
      { nombre: "IEFP — Bolsa de empleo oficial", emoji: "🇵🇹", desc: "Portal de empleo del gobierno portugués. Ofertas en todos los sectores, incluidos empleos para hispanohablantes.", url: "https://www.iefp.pt" },
      { nombre: "EURES Portugal — Empleo en Europa", emoji: "🇪🇺", desc: "Portal oficial UE con ofertas en Portugal y apoyo de consejeros EURES en español.", url: "https://eures.europa.eu" },
      { nombre: "Startup Portugal — Ecosistema emprendedor", emoji: "🚀", desc: "Portugal tiene un ecosistema de startups muy activo (Lisboa Startup Hub). Visa de nómada digital y tech jobs.", url: "https://www.startupportugal.com" },
    ],
  },

  noruega: {
    visado: {
      tipoVisado: "Libre circulación EEA (Espacio Económico Europeo)",
      resumen:
        "Noruega no es UE pero pertenece al EEA, por lo que los ciudadanos españoles tienen libre circulación. Puedes trabajar sin visado. Si resides más de 3 meses, debes registrarte en el Registro Nacional de Residentes (Folkeregisteret) a través de Skatteetaten para obtener el número D/F.",
      requisitos: [
        "DNI o pasaporte español válido",
        "Número de identificación noruego (D-nummer o F-nummer) — se obtiene en Skatteetaten",
        "Registro en Folkeregisteret si resides más de 6 meses",
        "Cuenta bancaria noruega (BankID) muy recomendable para cobrar el salario",
        "Seguro médico cubierto por el NAV una vez registrado",
      ],
      enlaces: [
        { texto: "Registro de residencia — Skatteetaten", url: "https://www.skatteetaten.no/en/" },
        { texto: "NAV — Empleo y bienestar social Noruega", url: "https://www.nav.no/en/home" },
        { texto: "EURES Noruega — Empleo en Europa", url: "https://eures.europa.eu" },
        { texto: "Work in Norway — Portal oficial", url: "https://www.workingnorway.no" },
      ],
    },
    alojamiento: {
      desc: "Oslo es una de las capitales más caras de Europa (habitación media 900-1.500€/mes). Bergen, Trondheim y Stavanger son algo más asequibles. Los salarios noruegos son muy elevados y compensan el alto coste de vida.",
      plataformas: [
        { nombre: "Finn.no", url: "https://www.finn.no/realestate/lettings", desc: "EL portal de referencia en Noruega — habitaciones y pisos" },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/no", desc: "Contratos medios para trabajadores internacionales" },
        { nombre: "Hybel.no", url: "https://www.hybel.no", desc: "Específico para habitaciones en Noruega — muy usado por jóvenes" },
      ],
      consejos: [
        "El mercado de alquiler en Oslo es muy competitivo — actúa rápido",
        "Los anuncios en Finn.no se publican y cubren en horas en Oslo",
        "El depósito máximo es de 6 meses de alquiler por ley",
        "Muchas empresas en Noruega ofrecen ayuda con el alojamiento inicial",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-30 años",
        "Nivel de inglés B1 o noruego básico",
        "Sin hijos propios",
        "Certificado de antecedentes penales",
        "Experiencia con niños recomendada",
      ],
      condiciones: [
        "Regulado por la UDI (Dirección de Inmigración de Noruega)",
        "Máximo 30 horas semanales de cuidado",
        "Paga de bolsillo: NOK 5.000-6.000/mes (aproximadamente 430-520€)",
        "Manutención y alojamiento incluidos",
        "Acceso a clases de noruego recomendado",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Mayor plataforma — familias noruegas verificadas" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Filtra por Noruega — registro gratuito" },
        { nombre: "GreatAuPair", url: "https://www.greataupair.com", desc: "Verificación y referencias incluidas" },
      ],
      enlaceOficial: { texto: "Au Pair en Noruega — UDI (Dirección de Inmigración)", url: "https://www.udi.no/en/want-to-apply/family-immigration/au-pair/" },
    },
    programas: [
      { nombre: "NAV — Empleo en Noruega", emoji: "🇳🇴", desc: "La agencia pública de empleo y bienestar social de Noruega. Ofertas en todos los sectores.", url: "https://www.nav.no/en/home" },
      { nombre: "EURES Noruega — Empleo en Europa", emoji: "🇪🇺", desc: "Portal oficial UE con ofertas en Noruega y apoyo de consejeros EURES.", url: "https://eures.europa.eu" },
      { nombre: "Work in Norway — Portal oficial", emoji: "💼", desc: "Portal oficial del gobierno noruego para trabajadores extranjeros: trámites, sectores y salarios.", url: "https://www.workingnorway.no" },
    ],
  },

  dinamarca: {
    visado: {
      tipoVisado: "Libre circulación UE",
      resumen:
        "Como ciudadano español (UE) tienes derecho de libre circulación en Dinamarca. Puedes trabajar sin visado. Si resides más de 3 meses, debes registrarte en la SIRI (Agencia danesa para el Reclutamiento Internacional) y obtener el CPR-nummer (número de registro civil) en el Borgerservice.",
      requisitos: [
        "DNI o pasaporte español válido",
        "Certificado de registro de la UE — se solicita en SIRI si resides más de 3 meses",
        "CPR-nummer — número de identidad danés, imprescindible para todo",
        "Cuenta bancaria danesa (NemKonto) para cobrar el salario",
        "Seguro médico cubierto por el sistema público (sundhedskort) una vez registrado",
      ],
      enlaces: [
        { texto: "SIRI — Agencia danesa de reclutamiento internacional", url: "https://siri.dk" },
        { texto: "Jobnet.dk — Portal de empleo oficial de Dinamarca", url: "https://www.jobnet.dk" },
        { texto: "EURES Dinamarca — Empleo en Europa", url: "https://eures.europa.eu" },
        { texto: "New to Denmark — Portal oficial para inmigrantes", url: "https://www.nyidanmark.dk/en-GB" },
      ],
    },
    alojamiento: {
      desc: "Copenhague es cara (habitación media 700-1.200€/mes). Aarhus, Odense y Aalborg son más asequibles (450-750€). El mercado de alquiler tiene mucha demanda — se recomienda buscar antes de llegar.",
      plataformas: [
        { nombre: "Boligportal.dk", url: "https://www.boligportal.dk", desc: "El portal de alquiler más grande de Dinamarca" },
        { nombre: "Lejebolig.dk", url: "https://www.lejebolig.dk", desc: "Pisos y habitaciones en toda Dinamarca" },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/dk", desc: "Contratos medios para trabajadores internacionales" },
      ],
      consejos: [
        "Inscríbete en Boligportal con suscripción Premium para ver los anuncios al publicarse",
        "El depósito máximo legal es de 3 meses de alquiler",
        "Muchas empresas danesas ofrecen relocation allowance",
        "Copenhague tiene excelente red de bicicletas — factor importante al elegir zona",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-28 años (regulado por SIRI)",
        "Nivel de inglés B1 o danés básico",
        "Sin hijos propios",
        "Certificado de antecedentes penales",
        "Experiencia con niños recomendada",
      ],
      condiciones: [
        "Regulado por la SIRI (Agencia danesa para el Reclutamiento Internacional)",
        "Máximo 30 horas semanales de cuidado",
        "Paga de bolsillo mínima: DKK 3.200/mes (aproximadamente 430€)",
        "Manutención y alojamiento incluidos",
        "Acceso a clases de danés obligatorio",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Mayor plataforma — familias danesas verificadas" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Filtra por Dinamarca — registro gratuito" },
        { nombre: "GreatAuPair", url: "https://www.greataupair.com", desc: "Verificación y referencias incluidas" },
      ],
      enlaceOficial: { texto: "Au Pair en Dinamarca — SIRI", url: "https://siri.dk/en/au-pairs/" },
    },
    programas: [
      { nombre: "Jobnet.dk — Portal de empleo oficial", emoji: "🇩🇰", desc: "Portal de empleo del gobierno danés con ofertas en todos los sectores. Muchas empresas buscan perfiles internacionales.", url: "https://www.jobnet.dk" },
      { nombre: "SIRI — Reclutamiento internacional", emoji: "💼", desc: "La agencia danesa para el reclutamiento internacional gestiona permisos de trabajo y residencia para ciudadanos UE.", url: "https://siri.dk" },
      { nombre: "EURES Dinamarca — Empleo en Europa", emoji: "🇪🇺", desc: "Portal oficial UE con ofertas en Dinamarca y apoyo de consejeros EURES.", url: "https://eures.europa.eu" },
    ],
  },

  austria: {
    visado: {
      tipoVisado: "Libre circulación UE",
      resumen:
        "Como ciudadano español (UE) puedes vivir y trabajar en Austria sin visado. Debes registrar tu dirección en el Meldeamt (oficina de empadronamiento) en los primeros 3 días de llegada — es obligatorio por ley. El número de identificación fiscal (Steuer-ID) se asigna automáticamente.",
      requisitos: [
        "DNI o pasaporte español válido",
        "Anmeldung (registro de dirección) en el Meldeamt — obligatorio en los primeros 3 días",
        "Número de identificación fiscal (Steuer-ID) — se asigna automáticamente tras el registro",
        "Cuenta bancaria austriaca o europea",
        "Seguro médico cubierto por la Sozialversicherung una vez empleado",
      ],
      enlaces: [
        { texto: "AMS — Arbeitsmarktservice Austria (empleo oficial)", url: "https://www.ams.at" },
        { texto: "Anmeldung — Registro de residencia Austria", url: "https://www.oesterreich.gv.at/themen/leben_in_oesterreich/wohnen/3/Seite.3220500.html" },
        { texto: "EURES Austria — Empleo en Europa", url: "https://eures.europa.eu" },
        { texto: "WKO — Cámara de Comercio Austria (empleo)", url: "https://www.wko.at" },
      ],
    },
    alojamiento: {
      desc: "Viena es la capital más asequible de Europa occidental para su tamaño (habitación media 600-1.000€/mes). Graz, Linz y Salzburgo rondan 450-750€. Austria tiene un mercado de alquiler muy regulado.",
      plataformas: [
        { nombre: "Willhaben.at", url: "https://www.willhaben.at/iad/immobilien", desc: "El mayor portal de clasificados de Austria — pisos y habitaciones" },
        { nombre: "Immobilien.net", url: "https://www.immobilien.net", desc: "Portal inmobiliario austriaco con gran oferta de alquiler" },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/at", desc: "Contratos medios para trabajadores internacionales" },
      ],
      consejos: [
        "El Anmeldung (empadronamiento) es obligatorio en los 3 primeros días — multas por incumplimiento",
        "Viena tiene WG (pisos compartidos) muy bien comunicados con el metro (U-Bahn)",
        "La Wiener Wohnen gestiona pisos sociales para residentes registrados",
        "Los pisos de la Gemeindebau (vivienda pública) de Viena son excelente opción a largo plazo",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-28 años (obligatorio por ley austriaca)",
        "Nivel de alemán A2 mínimo",
        "Sin hijos propios",
        "Certificado de antecedentes penales",
        "Experiencia con niños valorada",
      ],
      condiciones: [
        "Regulado por ley en Austria",
        "Máximo 30 horas semanales de cuidado",
        "Paga de bolsillo: 500-600€/mes — uno de los más altos de Europa",
        "Manutención y alojamiento incluidos",
        "Clases de alemán obligatorias",
        "Máximo 12 meses",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Mayor plataforma — familias austriacas verificadas" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Filtra por Austria — muchas familias en Viena" },
        { nombre: "GreatAuPair", url: "https://www.greataupair.com", desc: "Verificación y referencias incluidas" },
      ],
      enlaceOficial: { texto: "AMS Austria — Arbeitsmarktservice", url: "https://www.ams.at" },
    },
    programas: [
      { nombre: "AMS Austria — Portal de empleo oficial", emoji: "🇦🇹", desc: "La agencia pública de empleo austriaca. Ofertas en todos los sectores, cursos de formación y orientación laboral.", url: "https://www.ams.at" },
      { nombre: "EURES Austria — Empleo en Europa", emoji: "🇪🇺", desc: "Portal oficial UE con ofertas en Austria y apoyo de consejeros EURES.", url: "https://eures.europa.eu" },
      { nombre: "WKO — Oportunidades en empresas austriacas", emoji: "💼", desc: "La Cámara de Comercio de Austria conecta a empresas con trabajadores internacionales cualificados.", url: "https://www.wko.at" },
    ],
  },

  finlandia: {
    visado: {
      tipoVisado: "Libre circulación UE",
      resumen:
        "Como ciudadano español (UE) puedes trabajar en Finlandia sin visado. Si resides más de 3 meses, debes registrarte en el Maistraatti (registro de población) y obtener el Henkilötunnus (número de identidad finlandés) — imprescindible para trabajar, alquilar y acceder a servicios.",
      requisitos: [
        "DNI o pasaporte español válido",
        "Henkilötunnus — número de identidad finlandés, se obtiene en el DVV (registro de población)",
        "Registro en el DVV si resides más de 3 meses",
        "Cuenta bancaria finlandesa o europea",
        "Seguro médico cubierto por el sistema público (KELA) una vez registrado",
      ],
      enlaces: [
        { texto: "TE-palvelut — Servicio de empleo de Finlandia", url: "https://www.te-palvelut.fi/en" },
        { texto: "DVV — Registro de población Finlandia", url: "https://dvv.fi/en/individuals" },
        { texto: "EURES Finlandia — Empleo en Europa", url: "https://eures.europa.eu" },
        { texto: "Jobs in Finland — Portal oficial", url: "https://www.jobsinfinland.fi" },
      ],
    },
    alojamiento: {
      desc: "Helsinki es cara para ser una capital nórdica (habitación media 600-1.000€/mes). Tampere, Turku y Oulu son más asequibles (400-700€). El mercado es estable y regulado.",
      plataformas: [
        { nombre: "Vuokraovi.com", url: "https://vuokraovi.com", desc: "El mayor portal de alquiler de Finlandia" },
        { nombre: "Oikotie.fi", url: "https://asunnot.oikotie.fi/vuokra-asunnot", desc: "Portal de pisos muy popular en Finlandia" },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/fi", desc: "Contratos medios para trabajadores internacionales" },
      ],
      consejos: [
        "SATO y VVO son las mayores empresas de alquiler público en Finlandia — inscríbete en sus listas",
        "Muchos pisos se alquilan sin muebles (unfurnished) — prepara presupuesto para equipar",
        "El depósito máximo es de 3 meses de alquiler",
        "Tampere y Turku tienen mercado más accesible que Helsinki",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-28 años (orientativo)",
        "Nivel de inglés B1 o finlandés básico",
        "Sin hijos propios",
        "Certificado de antecedentes penales",
        "Experiencia con niños recomendada",
      ],
      condiciones: [
        "No hay regulación específica au pair en Finlandia — se rige por acuerdo privado",
        "Máximo 25-30 horas semanales de cuidado",
        "Paga de bolsillo: 200-300€/mes",
        "Manutención y alojamiento incluidos",
        "Acceso a clases de finlandés recomendado",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Mayor plataforma — familias finlandesas verificadas" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Filtra por Finlandia — registro gratuito" },
        { nombre: "GreatAuPair", url: "https://www.greataupair.com", desc: "Verificación y referencias incluidas" },
      ],
      enlaceOficial: { texto: "TE-palvelut — Empleo en Finlandia", url: "https://www.te-palvelut.fi/en" },
    },
    programas: [
      { nombre: "TE-palvelut — Servicio de empleo oficial", emoji: "🇫🇮", desc: "La agencia pública de empleo de Finlandia. Ofertas en todos los sectores y orientación laboral en inglés.", url: "https://www.te-palvelut.fi/en" },
      { nombre: "EURES Finlandia — Empleo en Europa", emoji: "🇪🇺", desc: "Portal oficial UE con ofertas en Finlandia y apoyo de consejeros EURES.", url: "https://eures.europa.eu" },
      { nombre: "Jobs in Finland — Portal oficial", emoji: "💼", desc: "Portal oficial del gobierno finlandés para trabajadores internacionales. Trámites, sectores y oportunidades.", url: "https://www.jobsinfinland.fi" },
    ],
  },

  nueva_zelanda: {
    visado: {
      tipoVisado: "Working Holiday Visa (18-35 años)",
      resumen:
        "Nueva Zelanda ofrece la Working Holiday Visa para ciudadanos españoles de 18 a 35 años. Permite trabajar hasta 12 meses en cualquier empresa. Es una de las experiencias más valoradas por jóvenes españoles: naturaleza, calidad de vida y salarios altos.",
      requisitos: [
        "18-35 años (obligatorio)",
        "Pasaporte español válido con al menos 15 meses de validez",
        "NZD 4.200 de fondos mínimos (aproximadamente 2.300€)",
        "Billete de vuelta o fondos para comprarlo",
        "Sin dependientes que te acompañen",
        "Sin antecedentes penales (declaración jurada)",
        "Seguro médico de viaje para toda la estancia",
      ],
      enlaces: [
        { texto: "Working Holiday Visa NZ — Immigration New Zealand", url: "https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/about-visa/working-holiday-visa" },
        { texto: "Solicitar WHV Nueva Zelanda — Portal online", url: "https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/about-visa/working-holiday-visa" },
        { texto: "EURES — Empleo en Europa", url: "https://eures.europa.eu" },
        { texto: "Work and Income NZ — Empleo en Nueva Zelanda", url: "https://www.workandincome.govt.nz" },
      ],
    },
    alojamiento: {
      desc: "Auckland y Wellington son las ciudades más caras (habitación media NZD 250-400/semana). Christchurch y Queenstown son más asequibles. El coste de vida es alto pero los salarios también lo son.",
      plataformas: [
        { nombre: "TradeMe.co.nz", url: "https://www.trademe.co.nz/a/property/residential/rent", desc: "EL portal de referencia en Nueva Zelanda — pisos y habitaciones" },
        { nombre: "Flatmates.co.nz", url: "https://www.flatmates.co.nz", desc: "Específico para flatmates (pisos compartidos) — el más usado" },
        { nombre: "Realestate.co.nz", url: "https://www.realestate.co.nz", desc: "Gran portal inmobiliario con pisos en alquiler" },
      ],
      consejos: [
        "Los backpacker hostels (BBH / YHA) son la opción habitual la primera semana",
        "El Bond (fianza) máximo legal es de 4 semanas de alquiler",
        "Tenancy Services NZ protege a los inquilinos — conoce tus derechos",
        "Auckland: zonas bien comunicadas por tren (AT Metro) ofrecen mejor precio",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-35 años (con Working Holiday Visa)",
        "Inglés nivel B1-B2",
        "Working Holiday Visa válida",
        "Certificado de antecedentes penales",
        "Primeros auxilios recomendado",
        "Experiencia con niños",
      ],
      condiciones: [
        "Los au pairs en Nueva Zelanda tienen derechos laborales plenos",
        "Salario mínimo NZ 2024: NZD 23,15/hora (uno de los más altos del mundo)",
        "Como nanny con WHV: NZD 18-20/hora habitual",
        "Máximo 40 horas semanales",
        "Alojamiento con la familia incluido en el acuerdo",
        "Contrato por escrito obligatorio por ley",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Mayor plataforma — familias en Nueva Zelanda verificadas" },
        { nombre: "GreatAuPair", url: "https://www.greataupair.com", desc: "Verificación y referencias incluidas" },
        { nombre: "Nanny.com.au", url: "https://www.nanny.com.au", desc: "Portal de nannies en Australia y Nueva Zelanda" },
      ],
      enlaceOficial: { texto: "Working Holiday Visa — Immigration New Zealand", url: "https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/about-visa/working-holiday-visa" },
    },
    programas: [
      { nombre: "Working Holiday Visa NZ", emoji: "🥝", desc: "Para 18-35 años. Trabaja en cualquier empresa neozelandesa hasta 12 meses. La experiencia más popular entre jóvenes españoles.", url: "https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/about-visa/working-holiday-visa" },
      { nombre: "Work and Income NZ — Empleo oficial", emoji: "💼", desc: "Portal oficial del gobierno de Nueva Zelanda para encontrar trabajo. Incluye orientación para recién llegados.", url: "https://www.workandincome.govt.nz" },
      { nombre: "EURES — Empleo en Europa", emoji: "🇪🇺", desc: "Portal oficial UE con información sobre convenios de trabajo y movilidad internacional.", url: "https://eures.europa.eu" },
    ],
  },

  polonia: {
    visado: {
      tipoVisado: "Libre circulación UE",
      resumen:
        "Como ciudadano español (UE) tienes derecho de libre circulación en Polonia. Es uno de los destinos europeos emergentes más interesantes por su bajo coste de vida, economía en crecimiento y calidad de vida. Debes registrar tu residencia en la Urząd Gminy (oficina municipal) y obtener el PESEL (número de identidad polaco).",
      requisitos: [
        "DNI o pasaporte español válido",
        "PESEL — número de identidad polaco, se obtiene en la Urząd Gminy local",
        "Registro de residencia en la Urząd Gminy si resides más de 3 meses",
        "Cuenta bancaria polaca o europea",
        "Seguro médico cubierto por el NFZ (sistema público) una vez registrado y empleado",
      ],
      enlaces: [
        { texto: "Praca.gov.pl — Portal oficial de empleo de Polonia", url: "https://www.praca.gov.pl" },
        { texto: "Gov.pl — Vivir y trabajar en Polonia", url: "https://www.gov.pl/web/diplomacy" },
        { texto: "EURES Polonia — Empleo en Europa", url: "https://eures.europa.eu" },
        { texto: "Pracuj.pl — Portal de empleo privado líder en Polonia", url: "https://www.pracuj.pl" },
      ],
    },
    alojamiento: {
      desc: "Polonia tiene uno de los costes de vida más bajos de la UE occidental. Varsovia es la ciudad más cara (habitación media 350-600€/mes). Cracovia, Breslavia y Gdansk rondan 250-450€. Excelente calidad de vida por el precio.",
      plataformas: [
        { nombre: "OtoDOM.pl", url: "https://www.otodom.pl", desc: "El mayor portal inmobiliario de Polonia — pisos y habitaciones" },
        { nombre: "OLX.pl", url: "https://www.olx.pl/nieruchomosci", desc: "Clasificados muy populares — habitaciones sin agencia" },
        { nombre: "Gratka.pl", url: "https://gratka.pl/nieruchomosci/mieszkania/wynajem", desc: "Portal de alquiler con gran oferta en toda Polonia" },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com/pl", desc: "Contratos medios para trabajadores internacionales" },
      ],
      consejos: [
        "El coste de vida en Polonia es un 40-50% más bajo que en Europa occidental",
        "Varsovia tiene metro, tranvía y autobús — bien conectada",
        "Cracovia es muy popular entre expats por su ambiente y bajo coste",
        "Breslavia (Wroclaw) tiene un ecosistema tech muy activo con muchas startups",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-26 años (orientativo)",
        "Inglés B1 o polaco básico",
        "Sin hijos propios",
        "Certificado de antecedentes penales",
        "Experiencia con niños recomendada",
      ],
      condiciones: [
        "No hay regulación específica au pair en Polonia — se rige por acuerdo privado",
        "Máximo 25 horas semanales de cuidado",
        "Paga de bolsillo: PLN 800-1.200/mes (aproximadamente 180-270€) — bajo pero el coste de vida es muy bajo",
        "Manutención y alojamiento incluidos",
        "Contrato por escrito recomendado",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Mayor plataforma — familias polacas verificadas" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Filtra por Polonia — registro gratuito" },
        { nombre: "GreatAuPair", url: "https://www.greataupair.com", desc: "Verificación y referencias incluidas" },
      ],
      enlaceOficial: { texto: "Praca.gov.pl — Empleo en Polonia", url: "https://www.praca.gov.pl" },
    },
    programas: [
      { nombre: "Praca.gov.pl — Portal de empleo oficial", emoji: "🇵🇱", desc: "Portal de empleo del gobierno polaco con ofertas en todos los sectores. Polonia tiene muy baja tasa de desempleo.", url: "https://www.praca.gov.pl" },
      { nombre: "EURES Polonia — Empleo en Europa", emoji: "🇪🇺", desc: "Portal oficial UE con ofertas en Polonia y apoyo de consejeros EURES en español.", url: "https://eures.europa.eu" },
      { nombre: "Pracuj.pl — Mayor portal de empleo privado", emoji: "💼", desc: "El portal de empleo más grande de Polonia. Muchas multinacionales con sedes en Varsovia, Cracovia y Breslavia.", url: "https://www.pracuj.pl" },
    ],
  },
  grecia: {
    visado: {
      tipoVisado: "Sin visado — Libre circulación UE",
      resumen: "Como ciudadano español y de la UE, puedes vivir y trabajar en Grecia sin visado ni permiso de trabajo. Solo necesitas tu DNI o pasaporte en vigor. Si te quedas más de 3 meses, conviene registrarse en el Registro de Ciudadanos de la UE (KEP local).",
      requisitos: [
        "DNI o pasaporte español en vigor",
        "Para estancias >3 meses: registro en KEP (Κέντρo Εξυπηρέτησης Πολιτών) local",
        "Para trabajar: alta en la Seguridad Social griega (EFKA) — lo gestiona tu empleador",
        "AMKA (número de seguridad social griego) — se obtiene en cualquier KEP o EFKA",
        "AFM (número fiscal griego, equivalente al NIF español) — en cualquier oficina de Hacienda griega (ΔΟΥ)",
      ],
      enlaces: [
        { texto: "OAED — Servicio de empleo de Grecia (traducción automática)", url: "https://www.dypa.gov.gr" },
        { texto: "EFKA — Seguridad Social griega", url: "https://www.efka.gov.gr" },
        { texto: "EURES Grecia — Empleo en Europa", url: "https://eures.europa.eu/living-and-working/countries/greece_es" },
      ],
    },
    alojamiento: {
      desc: "Atenas y Salónica son las ciudades con más oferta de trabajo. El alquiler en Atenas es asequible para Europa occidental: habitaciones desde 350-500€/mes en zonas céntricas. El turismo y la hostelería generan mucho empleo estacional.",
      plataformas: [
        { nombre: "Spitogatos", url: "https://www.spitogatos.gr", desc: "Portal inmobiliario líder en Grecia — pisos y habitaciones" },
        { nombre: "Xe.gr", url: "https://www.xe.gr", desc: "Anuncios inmobiliarios — amplia oferta en Atenas y alrededores" },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com", desc: "Alquiler medio plazo — muy usado por expats y estudiantes" },
        { nombre: "Airbnb", url: "https://www.airbnb.es", desc: "Para los primeros meses mientras buscas piso fijo" },
      ],
      consejos: [
        "Busca en barrios como Koukaki, Pagrati o Exarchia en Atenas (accesibles y bien conectados)",
        "El metro de Atenas es barato y eficiente — base ideal para desplazarte",
        "Exige siempre contrato de alquiler escrito — protección como inquilino en la UE",
        "El coste de vida en Grecia es 30-40% más bajo que en España occidental",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-30 años",
        "Sin requisito oficial de idioma (griego básico ayuda mucho)",
        "Experiencia con niños valorada",
      ],
      condiciones: [
        "Paga de bolsillo: 250-350 €/mes (sin regulación nacional específica — varía por familia)",
        "Alojamiento y manutención incluidos",
        "Máx. 30h/semana — sin regulación nacional específica, rige la buena fe del contrato",
        "Contrato privado escrito — muy recomendado",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Familias griegas verificadas — filtra por Grecia" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Registro gratuito — amplia oferta en Atenas y zonas turísticas" },
      ],
    },
    programas: [
      { nombre: "DYPA — Servicio de empleo griego", emoji: "🇬🇷", desc: "Portal oficial de empleo de Grecia con ofertas en todos los sectores. Especialmente fuerte en turismo y hostelería.", url: "https://www.dypa.gov.gr" },
      { nombre: "EURES Grecia — Empleo en Europa", emoji: "🇪🇺", desc: "Portal oficial UE para buscar trabajo en Grecia con apoyo de consejeros EURES.", url: "https://eures.europa.eu" },
      { nombre: "Kariera.gr — Portal privado de empleo", emoji: "💼", desc: "Mayor portal de empleo privado de Grecia. Muchas ofertas en turismo, IT y servicios.", url: "https://www.kariera.gr" },
    ],
  },
  luxemburgo: {
    visado: {
      tipoVisado: "Sin visado — Libre circulación UE",
      resumen: "Luxemburgo es el país con el salario mínimo más alto de la UE (2.637 €/mes brutos en 2025). Como español, tienes libre circulación. Es un hub financiero y europeo con altísima demanda de profesionales cualificados. Muchos trabajadores cruzan la frontera desde Francia, Bélgica o Alemania.",
      requisitos: [
        "DNI o pasaporte español en vigor",
        "Para estancias >3 meses: declaración de residencia en el ayuntamiento (Administration communale)",
        "Número de matrícula de seguro social (CNSS) — lo gestiona tu empleador",
        "Sin requisito de idioma oficial para ciudadanos UE, aunque luxemburgués, francés o alemán son ventajosos",
      ],
      enlaces: [
        { texto: "ADEM — Agencia de empleo de Luxemburgo", url: "https://www.adem.lu/es/candidats/trouver-un-emploi" },
        { texto: "Guichet.lu — Vivir y trabajar en Luxemburgo", url: "https://guichet.public.lu/es.html" },
        { texto: "EURES Luxemburgo — Empleo europeo", url: "https://eures.europa.eu/living-and-working/countries/luxembourg_es" },
      ],
    },
    alojamiento: {
      desc: "Luxemburgo es uno de los países más caros de Europa para la vivienda. Ciudad de Luxemburgo: habitaciones desde 900-1.400€/mes. Muchos trabajadores viven en las zonas fronterizas de Francia (Metz, Thionville), Bélgica o Alemania y cruzan cada día — reduce costes a la mitad.",
      plataformas: [
        { nombre: "Athome.lu", url: "https://www.athome.lu", desc: "Portal inmobiliario líder en Luxemburgo — compra y alquiler" },
        { nombre: "Immotop.lu", url: "https://www.immotop.lu", desc: "Amplia oferta de pisos y habitaciones en todo el Gran Ducado" },
        { nombre: "Expat.com Luxembourg", url: "https://www.expat.com/forum/viewforum.php?id=189", desc: "Foro de expats con consejos de alojamiento y vida en Luxemburgo" },
        { nombre: "HousingAnywhere", url: "https://housinganywhere.com", desc: "Alquiler medio plazo — ideal para los primeros meses" },
      ],
      consejos: [
        "Considera vivir en Thionville (Francia) o Trier (Alemania) — 30-40% más barato y bien conectado",
        "El transporte público en Luxemburgo es completamente gratuito desde 2020",
        "El salario mínimo luxemburgués (2.637€/mes) compensa el alto coste de vida",
        "Muchas empresas ofrecen ayuda con el relocation y primeros meses de alojamiento",
      ],
    },
    aupair: {
      disponible: true,
      requisitos: [
        "18-27 años",
        "Nivel básico de francés (idioma predominante en las familias)",
        "Experiencia con niños valorada",
      ],
      condiciones: [
        "Paga de bolsillo: 400-500 €/mes (más alto que la media UE, refleja el alto SMI)",
        "Alojamiento y manutención incluidos",
        "Máx. 25-30h/semana según contrato",
        "Contrato de trabajo au pair obligatorio (Code du Travail luxemburgués)",
      ],
      agencias: [
        { nombre: "AuPairWorld", url: "https://www.aupairworld.com", desc: "Familias luxemburguesas verificadas — filtra por Luxemburgo" },
        { nombre: "AuPair.com", url: "https://www.aupair.com", desc: "Registro gratuito — buen catálogo de familias en Luxemburgo" },
      ],
      enlaceOficial: { texto: "Guichet.lu — Derechos del au pair en Luxemburgo", url: "https://guichet.public.lu/es.html" },
    },
    programas: [
      { nombre: "ADEM — Agencia de empleo oficial de Luxemburgo", emoji: "🇱🇺", desc: "Portal oficial de empleo del Gran Ducado. Alta demanda en finanzas, IT, logística y sector europeo (UE/instituciones).", url: "https://www.adem.lu" },
      { nombre: "EURES Luxemburgo — Empleo europeo", emoji: "🇪🇺", desc: "Portal oficial UE. Luxemburgo tiene una de las tasas de desempleo más bajas de Europa (<5%).", url: "https://eures.europa.eu" },
      { nombre: "Jobs.lu — Mayor portal de empleo", emoji: "💼", desc: "Portal privado líder en Luxemburgo. Muchas ofertas multilingüe en banca, IT y servicios financieros.", url: "https://www.jobs.lu" },
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
  { id: "italia", label: "Italia", flag: "🇮🇹" },
  { id: "suecia", label: "Suecia", flag: "🇸🇪" },
  { id: "suiza", label: "Suiza", flag: "🇨🇭" },
  { id: "belgica", label: "Bélgica", flag: "🇧🇪" },
  { id: "portugal", label: "Portugal", flag: "🇵🇹" },
  { id: "noruega", label: "Noruega", flag: "🇳🇴" },
  { id: "dinamarca", label: "Dinamarca", flag: "🇩🇰" },
  { id: "austria", label: "Austria", flag: "🇦🇹" },
  { id: "finlandia", label: "Finlandia", flag: "🇫🇮" },
  { id: "nueva_zelanda", label: "N. Zelanda", flag: "🇳🇿" },
  { id: "polonia", label: "Polonia", flag: "🇵🇱" },
  { id: "canada", label: "Canadá", flag: "🇨🇦" },
  { id: "australia", label: "Australia", flag: "🇦🇺" },
  { id: "usa", label: "EE.UU.", flag: "🇺🇸" },
  { id: "grecia", label: "Grecia", flag: "🇬🇷" },
  { id: "luxemburgo", label: "Luxemburgo", flag: "🇱🇺" },
];

const PESTAÑAS: { id: Pestaña; label: string; emoji: string }[] = [
  { id: "visado", label: "Visado", emoji: "📋" },
  { id: "alojamiento", label: "Alojamiento", emoji: "🏠" },
  { id: "aupair", label: "Au Pair", emoji: "👶" },
  { id: "programas", label: "Programas", emoji: "✨" },
  { id: "derechos", label: "Papeles", emoji: "⚖️" },
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
        <div className="grid grid-cols-5 gap-1 rounded-xl p-1" style={{ background: "#1a1f2e" }}>
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

          {/* ── PAPELES Y DERECHOS ── */}
          {pestaña === "derechos" && (
            <div className="space-y-4">

              {/* Finiquito y derechos al terminar */}
              <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
                <h2 className="text-base font-bold text-white mb-3">⚖️ Tus derechos al terminar el trabajo</h2>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#d1d5db" }}>
                  Cuando terminas un contrato en el extranjero —sea porque lo finalizas, te despiden o decides irte—
                  tienes derechos laborales que debes conocer y reclamar antes de volver a España.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: "💶", titulo: "Finiquito", desc: "Tienes derecho a cobrar los días trabajados del mes en curso, las vacaciones no disfrutadas y cualquier paga extra proporcional. Exige siempre el finiquito por escrito." },
                    { icon: "📜", titulo: "Certificado de empresa", desc: "Documento que acredita la relación laboral, fechas, categoría y motivo de la baja. Imprescindible para tramitar el paro en España." },
                    { icon: "🏥", titulo: "Informe de vida laboral extranjero", desc: "En países de la UE puedes solicitar tu historial de cotizaciones para que cuenten en España. En UK post-Brexit hay acuerdos específicos de Seguridad Social." },
                    { icon: "📋", titulo: "Carta de despido o acuerdo de baja", desc: "Si te despiden, exige siempre la comunicación escrita con el motivo. Esto es fundamental para acceder al desempleo." },
                    { icon: "🔑", titulo: "Derechos de la vivienda", desc: "Si la empresa te proporcionaba vivienda, tienes derecho a un preaviso razonable antes de tener que abandonarla. Guarda todos los contratos." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 rounded-xl p-3" style={{ background: "#0f1117", border: "1px solid #1f2937" }}>
                      <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-white mb-0.5">{item.titulo}</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#9ca3af" }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEPE — Paro al volver a España */}
              <div className="rounded-2xl p-5" style={{ background: "#0d2818", border: "1px solid #065f46" }}>
                <h2 className="text-base font-bold mb-3" style={{ color: "#d1fae5" }}>🏛️ SEPE — Cobrar el paro al volver a España</h2>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#a7f3d0" }}>
                  Si has trabajado en un país de la UE/EEE y vuelves a España sin trabajo, puedes transferir
                  tus cotizaciones extranjeras y solicitar la prestación por desempleo en el SEPE.
                </p>
                <div className="space-y-2 mb-4">
                  {[
                    "✅ Haber cotizado al menos 360 días (sumando España + UE/EEE con formulario U1/E301)",
                    "✅ Estar en situación legal de desempleo — no haber dimitido voluntariamente (salvo causas justificadas)",
                    "✅ Inscribirse como demandante de empleo en el SEPE en los 15 días hábiles tras el despido",
                    "✅ No tener rentas superiores al 75% del SMI (Salario Mínimo Interprofesional)",
                    "✅ Residir en España — la prestación no se cobra en el extranjero salvo excepciones",
                  ].map((req, i) => (
                    <p key={i} className="text-xs leading-relaxed" style={{ color: "#d1fae5" }}>{req}</p>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold mb-2" style={{ color: "#6ee7b7" }}>DOCUMENTOS QUE NECESITAS:</p>
                  {[
                    "DNI o NIE + pasaporte",
                    "Formulario U1 (antiguo E301) — lo pide el SEPE directamente a tu país de trabajo",
                    "Certificado de empresa del país extranjero (con fecha y motivo de baja)",
                    "Vida laboral española (gratis en Seguridad Social)",
                    "Número de cuenta bancaria española",
                  ].map((doc, i) => (
                    <p key={i} className="text-xs" style={{ color: "#a7f3d0" }}>📄 {doc}</p>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <a href="https://www.sepe.es/HomeSepe/Personas/distributiva-prestaciones/solicitar-prestacion.html"
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm rounded-xl px-3 py-2.5"
                    style={{ background: "#065f46", color: "#d1fae5", border: "1px solid #047857" }}>
                    🏛️ Solicitar prestación por desempleo — SEPE.es →
                  </a>
                  <a href="https://portal.seg-social.gob.es/wps/portal/importass/importass/Sedes/SedeElectronica/tramites-y-gestiones/Cotizacion/INFVidaLaboral"
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm rounded-xl px-3 py-2.5"
                    style={{ background: "#065f46", color: "#d1fae5", border: "1px solid #047857" }}>
                    📋 Tu Vida Laboral — Seguridad Social →
                  </a>
                  <a href="https://www.sepe.es/HomeSepe/que-es-el-sepe/comunicacion-institucional/publicaciones/publicaciones-oficiales/listado-de-publicaciones.html?folder=/publicaciones/prestaciones/internacionales"
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm rounded-xl px-3 py-2.5"
                    style={{ background: "#065f46", color: "#d1fae5", border: "1px solid #047857" }}>
                    🌍 Formulario U1 / Prestaciones internacionales — SEPE →
                  </a>
                </div>
              </div>

              {/* Cuánto cubro cobrar */}
              <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
                <h2 className="text-base font-bold text-white mb-3">💰 ¿Cuánto puedo cobrar?</h2>
                <div className="space-y-2">
                  {[
                    { dias: "De 360 a 539 días cotizados", duracion: "4 meses de prestación" },
                    { dias: "De 540 a 719 días cotizados", duracion: "6 meses de prestación" },
                    { dias: "De 720 a 899 días cotizados", duracion: "8 meses de prestación" },
                    { dias: "De 900 a 1.079 días cotizados", duracion: "10 meses de prestación" },
                    { dias: "Más de 2.160 días cotizados", duracion: "24 meses (máximo)" },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-lg"
                      style={{ background: "#0f1117", border: "1px solid #1f2937" }}>
                      <span style={{ color: "#9ca3af" }}>{row.dias}</span>
                      <span className="font-bold shrink-0" style={{ color: "#10b981" }}>{row.duracion}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-3" style={{ color: "#6b7280" }}>
                  La cuantía es el 70% de tu base reguladora los primeros 180 días y el 60% el resto.
                  La base reguladora se calcula con las últimas 180 cotizaciones.
                </p>
              </div>

              {/* BAJA VOLUNTARIA — cuándo sí tienes derecho al paro */}
              <div className="rounded-2xl p-5" style={{ background: "#1a0a0a", border: "1px solid #7f1d1d" }}>
                <h2 className="text-base font-bold mb-3" style={{ color: "#fca5a5" }}>⚠️ Baja voluntaria y el paro</h2>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: "#fca5a5" }}>
                  Normalmente si te vas voluntariamente <strong>NO</strong> tienes derecho al paro.
                  Pero hay excepciones reconocidas legalmente:
                </p>
                <div className="space-y-1.5">
                  {[
                    "Impago de salario o retrasos reiterados",
                    "Acoso laboral o sexual acreditado",
                    "Modificación sustancial de condiciones de trabajo (horario, salario, puesto)",
                    "Traslado geográfico a más de 60 km del domicilio habitual",
                    "Incumplimiento grave del contrato por parte del empleador",
                    "Violencia de género (víctima reconocida por sentencia o orden de protección)",
                  ].map((excepcion, i) => (
                    <p key={i} className="text-xs flex gap-2" style={{ color: "#fca5a5" }}>
                      <span className="shrink-0">⛔</span>{excepcion}
                    </p>
                  ))}
                </div>
                <p className="text-xs mt-3 font-semibold" style={{ color: "#f87171" }}>
                  En estos casos consulta con un abogado laboralista antes de dimitir — necesitas documentar bien la situación.
                </p>
              </div>

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
