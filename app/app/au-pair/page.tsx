"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";

// ─── Tipos ──────────────────────────────────────────────────
type Tab = "que-es" | "requisitos" | "por-pais" | "alojamiento" | "estudiantes" | "plataformas" | "al-terminar";

// ─── Datos: Condiciones por país ─────────────────────────────
const PAISES_AUPAIR = [
  {
    flag: "🇩🇪",
    pais: "Alemania",
    edad: "18-27 años",
    horas: "Máx. 30h/semana",
    bolsillo: "280 €/mes",
    extra: "Familia paga 70 €/mes hacia cursos de alemán (840 €/año)",
    idioma: "Alemán A2 mínimo — obligatorio por ley",
    duracion: "12 meses (ampliable a 24 en casos especiales)",
    contrato: "Contrato oficial obligatorio — modelo Arbeitsamt",
    seguro: "Obligatorio — a cargo de la familia",
    clases: "Mínimo 6 horas semanales de alemán — obligatorio",
    ley: "Regulado: no más de 30h/semana, 260 € mínimo legal",
    enlace: { texto: "Make it in Germany — Au Pair oficial", url: "https://www.make-it-in-germany.com/es/trabajar-en-alemania/opciones/au-pair" },
  },
  {
    flag: "🇫🇷",
    pais: "Francia",
    edad: "18-30 años",
    horas: "Máx. 25h/semana",
    bolsillo: "~350-400 €/mes (≈85-100 €/semana)",
    extra: "La familia cubre el abono mensual de transporte público (Navigo en París, o equivalente en otras ciudades francesas)",
    idioma: "Francés A2-B1 recomendado (mayoría de familias lo exigen)",
    duracion: "Máx. 18 meses",
    contrato: "Contrat de travail au pair — modelo oficial obligatorio",
    seguro: "Sécurité Sociale + seguro complementario de la familia",
    clases: "Inscripción en cursos de francés recomendada (algunas familias lo pagan)",
    ley: "Regulado por el Code du Travail — Art. L7221-1",
    enlace: { texto: "Contrato Au Pair — Service-Public.fr", url: "https://www.service-public.fr/particuliers/vosdroits/F1462" },
  },
  {
    flag: "🇮🇪",
    pais: "Irlanda",
    edad: "18-26 años (orientativo)",
    horas: "Máx. 25-30h/semana",
    bolsillo: "100-120 €/semana (~450 €/mes)",
    extra: "Acceso ilimitado a comidas — no se deduce del bolsillo",
    idioma: "Inglés B1-B2 — inmersión total garantizada",
    duracion: "6-12 meses habitual",
    contrato: "Contrato privado por escrito — muy recomendado",
    seguro: "A cargo de la familia anfitriona",
    clases: "No obligatorio, pero muchas familias cubren Academy of English",
    ley: "Sin ley específica — libre circulación UE, derechos laborales aplicables",
    enlace: { texto: "Derechos laborales — Citizens Information Ireland", url: "https://www.citizensinformation.ie/en/employment/employment-rights-and-conditions/" },
  },
  {
    flag: "🇬🇧",
    pais: "Reino Unido",
    edad: "18-27 años (recomendado)",
    horas: "Máx. 25-30h/semana",
    bolsillo: "100-150 £/semana (~115-175 €)",
    extra: "Post-Brexit: necesitas visa para trabajar. No existe visa 'Au Pair' oficial desde 2008",
    idioma: "Inglés — inmersión total en el idioma de trabajo global",
    duracion: "6-12 meses habitual",
    contrato: "Contrato privado por escrito obligatorio (recomendado notarizado)",
    seguro: "El NHS cubre au pairs con visa de trabajo activa",
    clases: "Familias suelen contribuir a academias de inglés",
    ley: "Sin categoría legal 'au pair' — se rige como trabajador doméstico",
    enlace: { texto: "Trabajo doméstico en UK — GOV.UK", url: "https://www.gov.uk/domestic-workers-in-a-private-household-visa" },
  },
  {
    flag: "🇳🇱",
    pais: "Países Bajos",
    edad: "18-26 años",
    horas: "Máx. 30h/semana",
    bolsillo: "340 €/mes (regulado por UWV)",
    extra: "Seguro de salud y accidentes a cargo de la familia",
    idioma: "Inglés B1 o neerlandés A2",
    duracion: "Máx. 12 meses",
    contrato: "Contrato oficial IND obligatorio",
    seguro: "Obligatorio — a cargo de la familia",
    clases: "Clases de neerlandés muy recomendadas — algunas familias las pagan",
    ley: "Regulado por el IND (Servicio de Inmigración)",
    enlace: { texto: "Au Pair en P. Bajos — IND oficial", url: "https://ind.nl/en/au-pair" },
  },
  {
    flag: "🇺🇸",
    pais: "Estados Unidos",
    edad: "18-26 años (obligatorio por ley federal)",
    horas: "Máx. 45h/semana / máx. 10h/día",
    bolsillo: "195,75 $/semana (fijado por ley federal, sin excepciones)",
    extra: "500 $/año para estudios universitarios (OBLIGATORIO por ley). Vacaciones: 2 semanas pagadas/año",
    idioma: "Inglés B2-C1 — examen telefónico en inglés incluido en proceso",
    duracion: "12 meses + posibilidad de extensión 6, 9 o 12 meses más",
    contrato: "VISA J-1 Au Pair obligatoria — gestionada por agencia autorizada Dpto. Estado",
    seguro: "Seguro médico a cargo de la familia — obligatorio por programa J-1",
    clases: "Mínimo 6 créditos universitarios — la familia paga hasta 500 $/año",
    ley: "Exchange Visitor Program — 22 CFR Part 62 (regulación federal)",
    enlace: { texto: "J-1 Au Pair — US State Department", url: "https://j1visa.state.gov/programs/au-pair/" },
  },
  {
    flag: "🇨🇦",
    pais: "Canadá",
    edad: "18-35 años (con IEC Working Holiday)",
    horas: "Máx. 40h/semana",
    bolsillo: "17,20 CAD/h mín. Ontario 2024",
    extra: "Caregiver Program: derechos laborales plenos como trabajador",
    idioma: "Inglés o francés B2",
    duracion: "1-2 años (IEC Working Holiday renovable)",
    contrato: "Contrato de trabajo obligatorio — Fairwork Canada",
    seguro: "Provincial health insurance — cobertura desde 1er día de trabajo",
    clases: "Acceso a universidades y colleges locales como trabajador regular",
    ley: "Home Child Care Provider Pilot — IRCC regulado",
    enlace: { texto: "Home Child Care Provider — IRCC", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/hire-temporary-foreign/caregiver-program/child-care-live-out.html" },
  },
  {
    flag: "🇦🇺",
    pais: "Australia",
    edad: "18-35 años (Working Holiday Visa 417)",
    horas: "Máx. 40h/semana",
    bolsillo: "23,23 AUD/h (mín. Fairwork 2024)",
    extra: "Working With Children Check (WWCC) obligatorio por ley estatal",
    idioma: "Inglés B1-B2",
    duracion: "1 año WHV + renovable hasta 3 años trabajando en zonas rurales",
    contrato: "Contrato según Fairwork Australia — derechos plenos",
    seguro: "Medicare para residentes con visa de trabajo activa",
    clases: "Acceso a TAFE (FP australiana) y universidades locales",
    ley: "Fairwork Act 2009 — protección completa para au pairs con WHV",
    enlace: { texto: "Fairwork Australia — Derechos laborales", url: "https://www.fairwork.gov.au/employee-entitlements/when-you-first-start-a-job" },
  },
  {
    flag: "🇨🇭",
    pais: "Suiza",
    edad: "18-25 años",
    horas: "Máx. 30h/semana",
    bolsillo: "CHF 700-900/mes (~700-900 €) — el más alto de Europa",
    extra: "OBLIGATORIO: la familia paga mínimo el 50% del curso de idioma (alemán/francés/italiano según región)",
    idioma: "Alemán, francés o italiano según región. Nivel A2 mínimo",
    duracion: "Máx. 12 meses",
    contrato: "Contrato oficial obligatorio según cantón",
    seguro: "Seguro de salud y accidentes a cargo de la familia",
    clases: "Familia paga mínimo 50% del curso de idioma — regulado por ley",
    ley: "Regulado: Acuerdo bilateral UE-Suiza — libre circulación, permiso L automático",
    enlace: { texto: "Permiso L Au Pair — SEM Suiza", url: "https://www.sem.admin.ch/sem/es/home/themen/aufenthalt/eu_efta/ausweis_b_eu_efta.html" },
  },
  {
    flag: "🇦🇹",
    pais: "Austria",
    edad: "18-28 años",
    horas: "Máx. 30h/semana",
    bolsillo: "500-600 €/mes — entre los mejores de Europa",
    extra: "Libre circulación UE — Anmeldung obligatorio en los primeros 3 días de llegada",
    idioma: "Alemán A2-B1 — el mismo estándar que Alemania",
    duracion: "Máx. 12 meses",
    contrato: "Contrato oficial obligatorio — modelo Österreich",
    seguro: "Seguro de salud y accidentes a cargo de la familia",
    clases: "Clases de alemán muy recomendadas — algunas familias las financian",
    ley: "Regulado por la Haushaltshilfe-Verordnung austríaca",
    enlace: { texto: "Trabajar en Austria — AMS.at", url: "https://www.ams.at" },
  },
  {
    flag: "🇩🇰",
    pais: "Dinamarca",
    edad: "18-30 años",
    horas: "Máx. 30h/semana",
    bolsillo: "DKK 3.200/mes (~430 €)",
    extra: "Libre circulación UE — CPR-nummer obligatorio para trabajar y cobrar",
    idioma: "Inglés B1-B2 (danés no es obligatorio — mayoría de familias hablan inglés perfectamente)",
    duracion: "Máx. 24 meses",
    contrato: "Contrato oficial regulado por SIRI (agencia nacional)",
    seguro: "Seguro de salud a cargo de la familia — sistema sanitario público excelente",
    clases: "Clases de danés opcionales — muchas familias las cubren",
    ley: "Regulado por SIRI — Danish Agency for International Recruitment",
    enlace: { texto: "Au Pair en Dinamarca — SIRI oficial", url: "https://siri.dk/en/au-pair" },
  },
  {
    flag: "🇳🇴",
    pais: "Noruega",
    edad: "18-30 años",
    horas: "Máx. 30h/semana",
    bolsillo: "NOK 5.000-6.000/mes (~430-520 €)",
    extra: "EEA — libre circulación para ciudadanos UE. Muy alto coste de vida — el sueldo cubre bien los gastos básicos",
    idioma: "Inglés B1-B2 o noruego básico",
    duracion: "Máx. 24 meses",
    contrato: "Contrato regulado por la UDI (Dirección de Inmigración)",
    seguro: "Seguro de salud y accidentes obligatorio a cargo de la familia",
    clases: "Clases de noruego recomendadas — algunas familias las pagan",
    ley: "Regulado: UDI — Utlendingsdirektoratet",
    enlace: { texto: "Au Pair en Noruega — UDI oficial", url: "https://www.udi.no/en/want-to-apply/work-immigration/au-pair/" },
  },
  {
    flag: "🇧🇪",
    pais: "Bélgica",
    edad: "18-26 años",
    horas: "Máx. 25h/semana",
    bolsillo: "350-450 €/mes",
    extra: "Libre circulación UE — 3 comunidades: Flamenca (neerlandés), Valona (francés) y Bruselas (bilingüe). Escoge según idioma",
    idioma: "Neerlandés o francés según región (Bruselas acepta inglés)",
    duracion: "Máx. 12 meses",
    contrato: "Contrato privado por escrito muy recomendado",
    seguro: "Seguro médico y accidentes a cargo de la familia",
    clases: "Clases de idioma recomendadas — pocas familias las financian",
    ley: "Sin ley específica au pair — se rige por derechos laborales generales UE",
    enlace: { texto: "EURES Bélgica — Trabajar en Bélgica", url: "https://eures.europa.eu" },
  },
  {
    flag: "🇸🇪",
    pais: "Suecia",
    edad: "18-30 años",
    horas: "Máx. 25h/semana",
    bolsillo: "SEK 3.500-5.000/mes (~320-460 €)",
    extra: "Libre circulación UE — Personnummer en Skatteverket (esencial para trabajar, cobrar y acceder a sanidad)",
    idioma: "Inglés B1-B2 (sueco no es obligatorio — nivel muy alto de inglés en Suecia)",
    duracion: "Máx. 12 meses",
    contrato: "Contrato privado por escrito — no regulado específicamente",
    seguro: "Seguro de salud y accidentes a cargo de la familia",
    clases: "SFI (Svenska för invandrare): sueco gratis para residentes",
    ley: "Sin ley específica au pair — derechos laborales generales de Suecia (Arbetsrätt)",
    enlace: { texto: "Trabajar en Suecia — Arbetsförmedlingen", url: "https://arbetsformedlingen.se/for-arbetssokande/other-languages/english" },
  },
  {
    flag: "🇮🇹",
    pais: "Italia",
    edad: "18-30 años",
    horas: "Máx. 25h/semana",
    bolsillo: "250-350 €/mes",
    extra: "Libre circulación UE — Codice Fiscale obligatorio (gratis en Agenzia delle Entrate). Ciudades top: Roma, Milán, Florencia, Bolonia",
    idioma: "Italiano A2-B1 (las familias suelen enseñarte — ventaja para aprender rápido)",
    duracion: "Máx. 12 meses",
    contrato: "Contrato oficial según Convenio Colectivo — registrado en el Comune",
    seguro: "INPS (seguro social italiano) — la familia gestiona el alta",
    clases: "Clases de italiano recomendadas — Università per Stranieri de Perugia o Siena",
    ley: "Regulado: Contratto Nazionale di Lavoro Domestico (CCNL Colf)",
    enlace: { texto: "INPS — Trabajadores domésticos Italia", url: "https://www.inps.it/it/it/dati-e-bilanci/dati-statistici-e-attuariali/osservatori/collaboratori-domestici.html" },
  },
  {
    flag: "🇵🇹",
    pais: "Portugal",
    edad: "18-30 años",
    horas: "Máx. 25h/semana",
    bolsillo: "200-300 €/mes",
    extra: "Mismo idioma — integración inmediata. Lisboa y Oporto son las ciudades con más demanda. Bajo coste de vida para Europa occidental",
    idioma: "Portugués — ¡mismo idioma! Adaptación en días",
    duracion: "Máx. 12 meses",
    contrato: "Contrato por escrito recomendado — Código do Trabalho aplicable",
    seguro: "Segurança Social portuguesa — alta obligatoria",
    clases: "No necesarias para el idioma — puedes centrarte en aprender inglés o francés",
    ley: "Sin ley específica au pair — Código do Trabalho doméstico",
    enlace: { texto: "IEFP — Empleo en Portugal", url: "https://www.iefp.pt" },
  },
  {
    flag: "🇫🇮",
    pais: "Finlandia",
    edad: "18-30 años",
    horas: "Máx. 25-30h/semana",
    bolsillo: "200-300 €/mes",
    extra: "Libre circulación UE — muy alto coste de vida pero bajo salario relativo. Helsinki y Turku son las ciudades con más demanda",
    idioma: "Inglés B1-B2 (finlandés es muy difícil — las familias hablan inglés perfectamente)",
    duracion: "Máx. 12 meses",
    contrato: "Contrato privado por escrito recomendado",
    seguro: "Kela (Seguridad Social finlandesa) — acceso con registro",
    clases: "Clases de finlandés gratuitas para residentes (muy difícil pero valorado)",
    ley: "Sin ley específica au pair — derechos laborales generales finlandeses",
    enlace: { texto: "TE-palvelut — Empleo en Finlandia", url: "https://www.te-palvelut.fi/en" },
  },
  {
    flag: "🇳🇿",
    pais: "Nueva Zelanda",
    edad: "18-35 años (Working Holiday Visa)",
    horas: "Máx. 40h/semana",
    bolsillo: "23,15 NZD/h (mín. NZ 2024)",
    extra: "Working Holiday Visa: solicitud online desde España. No existe visa 'Au Pair' específica — se trabaja como nanny con WHV",
    idioma: "Inglés B2-C1 — inmersión total",
    duracion: "12 meses (WHV no renovable para españoles)",
    contrato: "Contrato laboral según Employment Relations Act de Nueva Zelanda",
    seguro: "ACC (Accident Compensation Corporation) cubre accidentes desde llegada. Seguro médico adicional recomendado",
    clases: "Acceso a universidades y politécnicos neozelandeses como trabajador",
    ley: "Employment Relations Act 2000 — derechos plenos como trabajador",
    enlace: { texto: "Working Holiday Visa — Immigration NZ", url: "https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/about-visa/working-holiday-visa" },
  },
  {
    flag: "🇵🇱",
    pais: "Polonia",
    edad: "18-30 años",
    horas: "Máx. 25h/semana",
    bolsillo: "PLN 800-1.200/mes (~180-270 €) — bajo, pero el coste de vida es proporcional",
    extra: "Libre circulación UE — destino emergente. Varsovia, Cracovia y Gdansk tienen mayor demanda. Ideal para ahorrar en coste de vida bajísimo",
    idioma: "Inglés B1-B2 (polaco muy difícil — mayoría de familias en ciudades grandes hablan inglés)",
    duracion: "Máx. 12 meses",
    contrato: "Contrato privado por escrito recomendado — Kodeks Pracy aplicable",
    seguro: "ZUS (seguro social polaco) — alta obligatoria",
    clases: "Clases de polaco opcionales — Erasmus y centros culturales ofrecen cursos baratos",
    ley: "Sin ley específica au pair — Kodeks Pracy (Código Laboral polaco)",
    enlace: { texto: "Praca.gov.pl — Empleo en Polonia", url: "https://www.praca.gov.pl" },
  },
  {
    flag: "🇬🇷",
    pais: "Grecia",
    edad: "18-30 años",
    horas: "Máx. 30h/semana",
    bolsillo: "250-350 €/mes",
    extra: "Libre circulación UE — destino muy popular en verano. Alta demanda en zonas turísticas (Mykonos, Santorini, Creta, Rodas). Coste de vida de los más bajos de Europa occidental",
    idioma: "Inglés B1-B2 (griego básico muy valorado, pero no obligatorio en zonas turísticas)",
    duracion: "Máx. 12 meses (más común: 3-6 meses en temporada de verano)",
    contrato: "Contrato privado por escrito muy recomendado",
    seguro: "EFKA (Seguridad Social griega) — alta obligatoria por parte del empleador",
    clases: "Clases de griego opcionales — centros culturales helénicos en España ofrecen preparación",
    ley: "Sin ley específica au pair — Código Laboral griego (KEN) aplicable",
    enlace: { texto: "DYPA — Empleo en Grecia", url: "https://www.dypa.gov.gr" },
  },
  {
    flag: "🇱🇺",
    pais: "Luxemburgo",
    edad: "18-27 años",
    horas: "Máx. 25-30h/semana",
    bolsillo: "400-500 €/mes (el más alto de Europa — refleja el mayor SMI de la UE)",
    extra: "Libre circulación UE — país trilingüe (luxemburgués, francés, alemán). Hub financiero europeo. Transport público totalmente gratuito desde 2020",
    idioma: "Francés B1 mínimo (idioma principal de las familias). Alemán valorado",
    duracion: "Máx. 12 meses",
    contrato: "Contrato de trabajo au pair obligatorio (Code du Travail luxemburgués)",
    seguro: "CNSS (Seguridad Social de Luxemburgo) — incluida en el contrato",
    clases: "Clases de francés o luxemburgués — IFEN y centros culturales con cursos asequibles",
    ley: "Regulado por el Code du Travail luxemburgués — protección laboral completa UE",
    enlace: { texto: "ADEM — Empleo en Luxemburgo", url: "https://www.adem.lu" },
  },
];

// ─── Plataformas de búsqueda ─────────────────────────────────
const PLATAFORMAS = [
  {
    nombre: "AuPairWorld",
    url: "https://www.aupairworld.com",
    gratis: true,
    descripcion: "La mayor plataforma del mundo. Más de 3 millones de au pairs y familias registradas. Gratuita para au pairs. Sistema de mensajería interno, fotos verificadas.",
    para: "Todos los países",
    destacado: true,
  },
  {
    nombre: "AuPair.com",
    url: "https://www.aupair.com",
    gratis: true,
    descripcion: "Segunda plataforma por volumen. Excelente para Europa. Familias verificadas manualmente. Contratos modelo descargables gratuitos.",
    para: "Europa principalmente",
    destacado: true,
  },
  {
    nombre: "GreatAuPair",
    url: "https://www.greataupair.com",
    gratis: false,
    descripcion: "Verificación de antecedentes incluida. Referencias comprobadas. Ideal para familias exigentes. Suscripción de pago pero con más garantías.",
    para: "USA, Europa",
    destacado: false,
  },
  {
    nombre: "Cultural Care Au Pair",
    url: "https://www.culturalcare.es",
    gratis: false,
    descripcion: "Agencia líder para programa J-1 en USA. También opera en Europa. Gestión completa: visa J-1, seguro, formación previa, coordinador local en USA.",
    para: "USA (J-1) + Europa",
    destacado: true,
  },
  {
    nombre: "Au Pair in America (APIA)",
    url: "https://www.aupairinamerica.com",
    gratis: false,
    descripcion: "La agencia J-1 más grande de USA. Autorizada por el Departamento de Estado americano. Gestión completa del proceso desde España.",
    para: "Solo USA (J-1)",
    destacado: false,
  },
  {
    nombre: "InterExchange Au Pair USA",
    url: "https://www.interexchange.org/au-pair-usa/",
    gratis: false,
    descripcion: "Agencia J-1 autorizada. Soporte en español. Comunidad de au pairs española muy activa.",
    para: "Solo USA (J-1)",
    destacado: false,
  },
  {
    nombre: "FindAuPair",
    url: "https://www.findaupair.com",
    gratis: true,
    descripcion: "Plataforma directa gratuita con familias de todo el mundo. Menos verificación que otras pero buena variedad.",
    para: "Global",
    destacado: false,
  },
  {
    nombre: "IAPA — Verificador de agencias",
    url: "https://www.iapa.org",
    gratis: true,
    descripcion: "No es para buscar familia — es para verificar que una agencia está certificada. SIEMPRE comprueba aquí antes de contratar una agencia.",
    para: "Verificación de agencias",
    destacado: true,
  },
];

// ─── Documentos necesarios ───────────────────────────────────
const DOCUMENTOS = [
  {
    categoria: "Identidad y viaje",
    emoji: "🪪",
    items: [
      { doc: "Pasaporte en vigor", detalle: "Validez mínima 1 año + 2 páginas en blanco. Para países fuera de UE no basta con el DNI.", obligatorio: true },
      { doc: "Fotografías de pasaporte", detalle: "2-4 fotos tipo pasaporte recientes (fondo blanco, sin gafas oscuras).", obligatorio: true },
      { doc: "DNI español", detalle: "Copia + original. Válido solo para países de la UE (Alemania, Francia, Irlanda, Países Bajos...). Para UK, USA, Canadá, Australia y Nueva Zelanda necesitas pasaporte.", obligatorio: true },
    ],
  },
  {
    categoria: "Antecedentes penales",
    emoji: "📋",
    items: [
      { doc: "Certificado de Antecedentes Penales", detalle: "Solicitarlo en el Ministerio de Justicia (mjusticia.gob.es). GRATUITO. Disponible online.", obligatorio: true },
      { doc: "Apostilla de La Haya", detalle: "Para países fuera de la UE (USA, Canadá, Australia, UK post-Brexit): el certificado debe apostillarse. Trámite en el TSJ de tu comunidad. Coste: ~25 €.", obligatorio: true },
      { doc: "Traducción jurada", detalle: "Para países no hispanohablantes: traducción oficial por traductor jurado. Coste: ~40-80 €.", obligatorio: false },
    ],
  },
  {
    categoria: "Salud y capacidades",
    emoji: "🏥",
    items: [
      { doc: "Certificado médico", detalle: "Carta de tu médico de cabecera (Atención Primaria) en papel oficial confirmando buen estado de salud. Máximo 3 meses de antigüedad.", obligatorio: true },
      { doc: "Carnet de conducir", detalle: "B1/B en vigor. Muy valorado — en algunos países (USA, Canada, Australia) es prácticamente obligatorio.", obligatorio: false },
      { doc: "Certificado de primeros auxilios", detalle: "Cruz Roja España ofrece curso de 8 horas (~30 €). Protección Civil también. Válido para la mayoría de países.", obligatorio: false },
    ],
  },
  {
    categoria: "Formación y experiencia",
    emoji: "🎓",
    items: [
      { doc: "Títulos académicos + nota media", detalle: "Copia del título más reciente (ESO, Bachillerato, FP, Universidad). Apostillado para países no-UE.", obligatorio: false },
      { doc: "Certificado de idiomas", detalle: "DELE (español/inglés), DELF (francés), Goethe-Zertifikat (alemán), IELTS/Cambridge (inglés). Cuanto más alto el nivel, más opciones.", obligatorio: false },
      { doc: "Carta de motivación", detalle: "1-2 páginas en el idioma del país destino. Explica por qué quieres ser au pair, tu experiencia con niños, tus objetivos.", obligatorio: true },
    ],
  },
  {
    categoria: "Referencias y experiencia con niños",
    emoji: "👶",
    items: [
      { doc: "Mínimo 2 referencias de familias", detalle: "Cartas de familias para las que hayas cuidado niños: vecinos, familia, canguros, voluntariado. Nombre, teléfono y descripción de la experiencia.", obligatorio: true },
      { doc: "1 referencia personal/laboral", detalle: "De un profesor, jefe o persona de referencia que te conozca. Con datos de contacto verificables.", obligatorio: true },
      { doc: "Experiencia documentada: mínimo 200 horas", detalle: "USA exige 600 horas documentadas. Para el resto: 200 horas reales (canguro, voluntariado, escuela de verano, hermanos menores).", obligatorio: false },
    ],
  },
  {
    categoria: "Contrato y seguro",
    emoji: "📑",
    items: [
      { doc: "Contrato Au Pair firmado", detalle: "Firmado por ti y la familia. Especifica: horas, tareas, bolsillo, días libres, habitación, duración. Nunca vayas sin contrato.", obligatorio: true },
      { doc: "Seguro médico internacional", detalle: "Obligatorio. Cobertura mínima 30.000 €, sin franquicia, repatriación incluida. IATI, AXA Travel, Allianz Travel. Coste medio: 30-80 €/mes.", obligatorio: true },
      { doc: "Seguro de accidentes", detalle: "Muchos países lo exigen aparte del médico. En Alemania y USA lo paga la familia. En otros lo negocias tú.", obligatorio: false },
    ],
  },
];

// ─── Pasos del proceso ───────────────────────────────────────
const PASOS = [
  { num: "01", titulo: "Decide el país y el idioma", desc: "¿Por qué idioma quieres apostar? Alemán, inglés, francés... Elige según el idioma que más te abra puertas laboralmente.", emoji: "🌍" },
  { num: "02", titulo: "Empieza el idioma YA", desc: "Inscríbete en la Escuela Oficial de Idiomas (EOI) o Goethe-Institut / Alliance Française. Las familias piden nivel real comprobado.", emoji: "📚" },
  { num: "03", titulo: "Consigue el curso de primeros auxilios", desc: "Cruz Roja España: Curso de Primeros Auxilios Básicos (8h, ~30 €). Muchas familias lo piden. Lo recibes en 1 fin de semana.", emoji: "🏥" },
  { num: "04", titulo: "Solicita el Certificado de Antecedentes Penales", desc: "Online en mjusticia.gob.es — gratuito. Si vas a USA/Canadá/Australia: apóstillalo en el TSJ de tu comunidad autónoma.", emoji: "📋" },
  { num: "05", titulo: "Consigue 2-3 referencias de niños", desc: "Pide a familias vecinos, familia ampliada, etc. que escriban una carta con su contacto. Es el punto que más diferencia a los candidatos.", emoji: "📝" },
  { num: "06", titulo: "Crea tu perfil en AuPairWorld y AuPair.com", desc: "Fotos reales, video presentación (30-60 seg en el idioma del país), carta de motivación detallada. Cuantos más detalles, más respuestas.", emoji: "🖥️" },
  { num: "07", titulo: "Entrevista con familias por videollamada", desc: "Prepara preguntas: horarios exactos, edades de los niños, habitación, zonas francas, cuántos au pairs anteriores y por qué se fueron.", emoji: "📹" },
  { num: "08", titulo: "Firma el contrato antes de reservar el vuelo", desc: "NUNCA reserves vuelo ni pagues nada hasta tener el contrato firmado. Comparte el contrato con la agencia o un abogado si tienes dudas.", emoji: "✍️" },
  { num: "09", titulo: "Solicita el visado (si aplica)", desc: "UE: no necesitas nada. UK post-Brexit: visa de trabajo. USA: visa J-1 gestionada por la agencia. Canadá: IEC Working Holiday.", emoji: "✈️" },
  { num: "10", titulo: "Contrata el seguro médico internacional", desc: "IATI, AXA Travel o Allianz Travel (30-80 €/mes). Verifica que cubre: hospitalización, urgencias, repatriación, sin carencias.", emoji: "🛡️" },
];

// ─── Ventajas para estudiantes ────────────────────────────────
const VENTAJAS_ESTUDIANTES = [
  { emoji: "🇩🇪", titulo: "Alemania — Alemán gratis", desc: "La familia paga 70 €/mes hacia tus clases de alemán (840 €/año = ~6 meses de academia). Obligatorio asistir 6h/semana. Los cursos del Goethe-Institut son reconocidos mundialmente." },
  { emoji: "🇺🇸", titulo: "USA — 500 $/año para universidad", desc: "La ley federal obliga a la familia a pagar 500 $/año para que hagas créditos universitarios en una Community College o universidad local. Es irrenunciable — si la familia no quiere pagarlo, denuncia." },
  { emoji: "🇨🇭", titulo: "Suiza — Familia paga la mitad de tus clases", desc: "Por ley suiza, la familia paga al menos el 50% del coste del curso de idioma. Con un salario de 700-900 CHF/mes, puedes ahorrar considerablemente." },
  { emoji: "🌍", titulo: "Todos los países UE — Erasmus+ compatible", desc: "Puedes combinar un programa Au Pair con una beca Erasmus+ de aprendizaje de idiomas. Consulta en tu universidad antes de irte — algunos reconocen el año como prácticas internacionales." },
  { emoji: "🎓", titulo: "Convalidación universitaria", desc: "Muchas universidades españolas reconocen el año Au Pair como créditos de libre elección o prácticas externas. Solicítalo en tu facultad antes de salir con carta de la institución." },
  { emoji: "📚", titulo: "Idiomas que disparan tu CV", desc: "Un año Au Pair equivale a C1 real. Con inglés C1, el salario medio en España sube un 30-40%. Con alemán B2, accedes al mercado laboral alemán (el más grande de Europa)." },
  { emoji: "💰", titulo: "Ahorro neto de 150-400 €/mes", desc: "Sin pagar alquiler, ni comida, ni facturas: lo que recibes de bolsillo es prácticamente puro ahorro. En 12 meses puedes acumular 1.800-4.800 € para financiar estudios de máster." },
];

// ─── Derechos sobre el alojamiento ──────────────────────────
const DERECHOS_ALOJAMIENTO = [
  { titulo: "Habitación privada y con llave", desc: "Tienes derecho a una habitación solo para ti. Mínimo 9 m², con ventana, calefacción, amueblada. La puerta debe tener cerradura y las llaves son tuyas. La familia no puede entrar sin llamar.", obligatorio: true },
  { titulo: "3 comidas diarias incluidas", desc: "Desayuno, comida y cena a cargo de la familia. No pueden deducirte el coste de la comida de tu bolsillo. Acceso libre a cocina y despensa para picar entre horas.", obligatorio: true },
  { titulo: "Acceso a zonas comunes", desc: "Baño limpio y propio o compartido con la familia (no con los niños solos). Zona de salón y cocina. Lavadora para tu ropa. Conexión WiFi.", obligatorio: true },
  { titulo: "Sin dormir con los niños", desc: "Bajo ninguna circunstancia puedes compartir habitación con los niños de forma permanente. Si la familia te lo pide, es motivo de rescisión del contrato.", obligatorio: true },
  { titulo: "Días libres regulares", desc: "Al menos 1 día y medio libre a la semana (normalmente sábado tarde + domingo). En USA: 1,5 días fijos + 1 fin de semana completo al mes. Vacaciones: 2 semanas anuales mínimo.", obligatorio: true },
  { titulo: "Privacidad total", desc: "Tu habitación es tu espacio. La familia no puede revisar tus pertenencias, leer tus mensajes ni restringir tus salidas en días libres. Fija un toque de queda razonable en el contrato.", obligatorio: false },
  { titulo: "Qué negociar en el contrato", desc: "Uso del coche familiar. Gastos de móvil (algunas familias lo cubren). Transporte al trabajo/clases. Seguro de accidentes. Acceso a la bicicleta/moto de la familia para los desplazamientos.", obligatorio: false },
];

// ─── Señales de alerta (red flags) ──────────────────────────
const RED_FLAGS = [
  "Te piden más de 30h/semana sin compensación extra",
  "No quieren firmar contrato por escrito",
  "Piden que cuides bebés o niños con necesidades especiales sin formación",
  "No hay referencias de au pairs anteriores — pregunta siempre cuántos han tenido y por qué se fueron",
  "La habitación es compartida con niños o es un salón con biombo",
  "Te piden dinero por adelantado ('reserva', 'señal', 'gastos de gestión')",
  "Solo se comunican por email — nunca quieren hacer videollamada",
  "Prometen condiciones muy por encima del estándar del país (sueldo irreal)",
  "Agencia que no aparece en el buscador de la IAPA (www.iapa.org)",
  "Urgencia extrema: 'tienes que decidir hoy o perdemos la plaza'",
];

// ─── Página ──────────────────────────────────────────────────
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "que-es", label: "Qué es", emoji: "💡" },
  { id: "requisitos", label: "Documentos", emoji: "📋" },
  { id: "por-pais", label: "Por país", emoji: "🌍" },
  { id: "alojamiento", label: "Alojamiento", emoji: "🏠" },
  { id: "estudiantes", label: "Estudiantes", emoji: "🎓" },
  { id: "plataformas", label: "Plataformas", emoji: "🔗" },
  { id: "al-terminar", label: "Al terminar", emoji: "🏁" },
];

export default function AuPairPage() {
  const [tab, setTab] = useState<Tab>("que-es");

  return (
    <div className="min-h-screen pt-14 pb-12 px-4" style={{ background: "#0f1117" }}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="text-center pt-4 pb-1">
          <div className="text-4xl mb-2">👶</div>
          <h1 className="text-xl font-bold text-white">Guía Completa Au Pair</h1>
          <p className="text-xs mt-1 mb-2" style={{ color: "#6b7280" }}>
            Todo lo que necesitas saber · Información verificada 2025-2026
          </p>
          <Link href="/app/emigrar" className="text-xs" style={{ color: "#10b981" }}>
            ← Volver a Emigrar
          </Link>
        </div>

        {/* Tabs — scroll horizontal en móvil */}
        <div className="overflow-x-auto pb-1 -mx-1">
          <div className="flex gap-1 min-w-max px-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition"
                style={{
                  background: tab === t.id ? "#10b981" : "#1a1f2e",
                  color: tab === t.id ? "#fff" : "#9ca3af",
                  border: `1px solid ${tab === t.id ? "#10b981" : "#2d3748"}`,
                }}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── QUÉ ES ── */}
        {tab === "que-es" && (
          <div className="space-y-4">
            {/* Definición */}
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-base font-bold text-white mb-3">¿Qué es ser Au Pair?</h2>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "#d1d5db" }}>
                Au Pair es un programa de intercambio cultural en el que jóvenes de 18-30 años viven
                con una familia anfitriona en otro país. A cambio de cuidar a los niños y colaborar
                con las tareas del hogar (máx. 30h/semana), la familia proporciona <strong style={{ color: "#10b981" }}>alojamiento,
                manutención completa y una paga de bolsillo</strong>. El objetivo principal es la
                inmersión cultural y lingüística.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: "🏠", label: "Alojamiento y comida", desc: "Habitación privada + 3 comidas diarias incluidas" },
                  { icon: "💶", label: "Paga de bolsillo", desc: "Regulada por ley según el país (260-500 €/mes)" },
                  { icon: "📚", label: "Clases de idioma", desc: "Muchos países exigen y/o financian clases" },
                  { icon: "🌍", label: "Experiencia internacional", desc: "CV internacional + idioma real C1 garantizado" },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: "#0f1117", border: "1px solid #1f2937" }}>
                    <div className="text-xl mb-1">{item.icon}</div>
                    <p className="text-xs font-semibold text-white mb-0.5">{item.label}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Proceso paso a paso */}
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-base font-bold text-white mb-4">Proceso paso a paso</h2>
              <div className="space-y-3">
                {PASOS.map((paso, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>
                      {paso.num}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{paso.emoji} {paso.titulo}</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#9ca3af" }}>{paso.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Red Flags */}
            <div className="rounded-2xl p-5" style={{ background: "#1a0a0a", border: "1px solid #7f1d1d" }}>
              <h2 className="text-base font-bold mb-3" style={{ color: "#fca5a5" }}>🚨 Señales de alerta</h2>
              <p className="text-xs mb-3" style={{ color: "#9ca3af" }}>Si detectas alguna de estas señales, cancela el proceso.</p>
              <ul className="space-y-2">
                {RED_FLAGS.map((flag, i) => (
                  <li key={i} className="flex gap-2 text-xs" style={{ color: "#fca5a5" }}>
                    <span className="shrink-0">⛔</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── DOCUMENTOS ── */}
        {tab === "requisitos" && (
          <div className="space-y-4">
            <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: "#0d2818", border: "1px solid #065f46", color: "#d1fae5" }}>
              💡 Esta checklist es para ciudadanos españoles que van a trabajar como au pair en el extranjero.
              Los documentos con ⭐ son imprescindibles — sin ellos no te aceptarán.
            </div>

            {DOCUMENTOS.map((cat, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
                <h2 className="text-sm font-bold text-white mb-3">{cat.emoji} {cat.categoria}</h2>
                <div className="space-y-3">
                  {cat.items.map((item, j) => (
                    <div key={j} className="flex gap-3">
                      <span className="shrink-0 mt-0.5">{item.obligatorio ? "⭐" : "✅"}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{item.doc}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#9ca3af" }}>{item.detalle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Links para conseguir documentos */}
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-sm font-bold text-white mb-3">🔗 Dónde conseguir cada documento en España</h2>
              <div className="space-y-2">
                {[
                  { texto: "Antecedentes Penales — Ministerio de Justicia (gratis, online)", url: "https://www.mjusticia.gob.es/es/ciudadania/tramites/certificado-de-antecedentes-penales" },
                  { texto: "Apostilla de La Haya — Ministerio de Justicia", url: "https://www.mjusticia.gob.es/es/ciudadania/tramites/apostilla" },
                  { texto: "Primeros Auxilios — Cruz Roja España (~30 €)", url: "https://www.cruzroja.es/principal/web/cursos-formacion" },
                  { texto: "Certificado de idiomas — Instituto Cervantes (español/inglés)", url: "https://www.cervantes.es/lengua_y_ensenanza/certificacion_espanol/default.htm" },
                  { texto: "Seguro de viaje internacional — IATI Seguros (referencia)", url: "https://www.iatiseguros.com" },
                  { texto: "INJUVE — Info oficial para jóvenes que emigran", url: "https://www.injuve.es/movilidad-internacional" },
                ].map((e, i) => (
                  <a key={i} href={e.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm rounded-xl px-3 py-2.5"
                    style={{ background: "#0f1117", color: "#10b981", border: "1px solid #1f2937" }}>
                    🔗 <span className="underline underline-offset-2">{e.texto}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── POR PAÍS ── */}
        {tab === "por-pais" && (
          <div className="space-y-4">
            <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: "#0d2818", border: "1px solid #065f46", color: "#d1fae5" }}>
              💶 Datos de bolsillo y condiciones verificados con fuentes oficiales de cada país (2025-2026).
            </div>

            {PAISES_AUPAIR.map((p, i) => (
              <div key={i} className="rounded-2xl p-5 space-y-3" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{p.flag}</span>
                  <h2 className="text-base font-bold text-white">{p.pais}</h2>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Edad", valor: p.edad, icon: "🎂" },
                    { label: "Horas", valor: p.horas, icon: "⏰" },
                    { label: "Bolsillo", valor: p.bolsillo, icon: "💶", destacado: true },
                    { label: "Idioma", valor: p.idioma, icon: "🗣️" },
                    { label: "Duración", valor: p.duracion, icon: "📅" },
                    { label: "Clases", valor: p.clases, icon: "📚" },
                  ].map((campo, j) => (
                    <div key={j} className="rounded-xl px-3 py-2.5" style={{ background: "#0f1117", border: "1px solid #1f2937" }}>
                      <p className="text-xs" style={{ color: "#6b7280" }}>{campo.icon} {campo.label}</p>
                      <p className="text-xs font-semibold mt-0.5 break-words leading-snug" style={{ color: campo.destacado ? "#10b981" : "#e5e7eb" }}>{campo.valor}</p>
                    </div>
                  ))}
                </div>

                {p.extra && (
                  <div className="rounded-xl px-3 py-2.5 text-xs" style={{ background: "#0d2818", color: "#6ee7b7", border: "1px solid #065f46" }}>
                    💡 {p.extra}
                  </div>
                )}

                <div className="text-xs space-y-1" style={{ color: "#9ca3af" }}>
                  <p><span className="text-white">Contrato:</span> {p.contrato}</p>
                  <p><span className="text-white">Seguro:</span> {p.seguro}</p>
                  <p><span className="text-white">Ley aplicable:</span> {p.ley}</p>
                </div>

                <a href={p.enlace.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs rounded-xl px-3 py-2"
                  style={{ background: "#0f1117", color: "#10b981", border: "1px solid #1f2937" }}>
                  🏛️ <span className="underline">{p.enlace.texto}</span>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ── ALOJAMIENTO ── */}
        {tab === "alojamiento" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-base font-bold text-white mb-3">🏠 Tu alojamiento como Au Pair</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#d1d5db" }}>
                Siempre vivirás con la familia anfitriona. El alojamiento es <strong style={{ color: "#10b981" }}>parte del acuerdo Au Pair
                y no se puede deducir de tu bolsillo</strong>. Estos son tus derechos mínimos reconocidos
                por la legislación de la mayoría de países y por los estándares IAPA.
              </p>
            </div>

            {/* Derechos */}
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-sm font-bold text-white mb-3">📌 Tus derechos sobre el alojamiento</h2>
              <div className="space-y-3">
                {DERECHOS_ALOJAMIENTO.map((d, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: "#0f1117", border: `1px solid ${d.obligatorio ? "#065f46" : "#1f2937"}` }}>
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-sm">{d.obligatorio ? "⭐" : "💡"}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{d.titulo}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#9ca3af" }}>{d.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: "#6b7280" }}>⭐ = Derecho fundamental · 💡 = Negociable en el contrato</p>
            </div>

            {/* Checklist para evaluar una familia */}
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-sm font-bold text-white mb-3">✅ Preguntas que debes hacer antes de aceptar</h2>
              <ul className="space-y-2">
                {[
                  "¿Puedo ver fotos de la habitación antes de llegar? ¿Tiene ventana y cerradura?",
                  "¿Cuántos niños hay y cuáles son sus edades exactas?",
                  "¿Cuál es el horario típico de una semana normal?",
                  "¿Han tenido au pairs antes? ¿Por qué se fue el/la anterior?",
                  "¿Puedo hablar con el/la au pair anterior por videollamada?",
                  "¿Qué tareas domésticas se esperan de mí además del cuidado de niños?",
                  "¿Tengo acceso al coche de la familia? ¿Quién paga la gasolina?",
                  "¿Pueden cubrirme el curso de idiomas o contribuir a él?",
                  "¿Qué sucede si alguna de las partes quiere cancelar el contrato?",
                  "¿Tienen niños con necesidades especiales o condiciones médicas que deba conocer?",
                ].map((q, i) => (
                  <li key={i} className="flex gap-2 text-xs" style={{ color: "#d1d5db" }}>
                    <span className="shrink-0 text-green-400">?</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Qué incluye el contrato */}
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-sm font-bold text-white mb-3">📑 Qué debe incluir el contrato</h2>
              <div className="grid grid-cols-1 gap-2">
                {[
                  "Nombre completo de au pair y familia, dirección exacta",
                  "Fecha de inicio y fin del programa",
                  "Número de horas semanales y horario habitual",
                  "Tareas específicas (niños, hogar, horarios nocturnos)",
                  "Importe exacto de la paga de bolsillo y forma de pago",
                  "Días libres semanales y vacaciones anuales",
                  "Descripción de la habitación (m², amueblada, cerradura)",
                  "Cobertura de seguro médico y accidentes",
                  "Contribución de la familia a cursos de idioma (si aplica)",
                  "Condiciones de rescisión del contrato (ambas partes)",
                  "Procedimiento de resolución de conflictos",
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 text-xs py-1.5"
                    style={{ borderBottom: i < 10 ? "1px solid #1f2937" : "none", color: "#d1d5db" }}>
                    <span className="text-green-400 shrink-0">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <a href="https://www.aupairworld.com/en/wiki/accommodation" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs rounded-xl px-3 py-2 mt-3"
                style={{ background: "#0f1117", color: "#10b981", border: "1px solid #1f2937" }}>
                🔗 <span className="underline">Estándares de alojamiento — AuPairWorld</span>
              </a>
            </div>
          </div>
        )}

        {/* ── ESTUDIANTES ── */}
        {tab === "estudiantes" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-base font-bold text-white mb-2">🎓 Au Pair: la opción más inteligente para estudiantes</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#d1d5db" }}>
                Ser Au Pair no es solo cuidar niños. Es la forma más económica y efectiva de
                lograr <strong style={{ color: "#10b981" }}>inmersión lingüística total, experiencia internacional en el CV y
                ahorro real</strong> al mismo tiempo. Sin pagar alquiler ni comida, lo que ganas
                es prácticamente todo tuyo.
              </p>
            </div>

            {/* Ventajas específicas para estudiantes */}
            <div className="space-y-3">
              {VENTAJAS_ESTUDIANTES.map((v, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
                  <div className="flex gap-3 items-start">
                    <span className="text-2xl shrink-0">{v.emoji}</span>
                    <div>
                      <p className="text-sm font-bold text-white mb-1">{v.titulo}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#9ca3af" }}>{v.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cálculo financiero */}
            <div className="rounded-2xl p-5" style={{ background: "#0d2818", border: "1px solid #065f46" }}>
              <h2 className="text-sm font-bold mb-3" style={{ color: "#6ee7b7" }}>💰 Cálculo financiero real — 12 meses en Alemania</h2>
              <div className="space-y-2 text-xs" style={{ color: "#d1fae5" }}>
                {[
                  { concepto: "Paga de bolsillo mensual", valor: "+ 280 €/mes" },
                  { concepto: "Contribución familia a alemán", valor: "+ 70 €/mes" },
                  { concepto: "Alquiler que NO pagas (media Berlín)", valor: "+ ~650 €/mes ahorrado" },
                  { concepto: "Comida que NO pagas (estimación)", valor: "+ ~300 €/mes ahorrado" },
                  { concepto: "Total de valor equivalente mensual", valor: "≈ 1.300 €/mes" },
                  { concepto: "Ahorro neto real en 12 meses", valor: "≈ 3.000-4.000 €" },
                ].map((fila, i) => (
                  <div key={i} className="flex justify-between py-1.5"
                    style={{ borderBottom: i < 5 ? "1px solid #065f46" : "none" }}>
                    <span>{fila.concepto}</span>
                    <span className="font-bold">{fila.valor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compatibilidad con estudios */}
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-sm font-bold text-white mb-3">📚 Cómo compatibilizar Au Pair con estudios</h2>
              <div className="space-y-2">
                {[
                  { titulo: "Matrícula en universidad local", desc: "Trabaja 20-25h/semana como au pair y estudia a media jornada. Muchas universidades europeas son gratuitas o de bajo coste para residentes con visado de trabajo." },
                  { titulo: "Clases nocturnas o en línea", desc: "Goethe-Institut, Alliance Française, academias locales: muchos ofrecen clases de tarde/noche compatibles con el horario Au Pair." },
                  { titulo: "Reconocimiento de créditos", desc: "Habla con tu facultad en España ANTES de salir. Muchas reconocen el año Au Pair como prácticas externas (6-12 créditos ECTS) si presentas informe del empleador." },
                  { titulo: "Formación online certificada", desc: "Coursera, edX, FutureLearn: cursos universitarios certificados online desde 0 €. Combínalos con el Au Pair sin conflicto de horario." },
                  { titulo: "USA: Community College obligatorio", desc: "La ley J-1 obliga a la familia a pagarte mínimo 500 $/año para créditos universitarios. Aprovéchalo para tomar cursos de inglés avanzado, business o especialidad." },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl px-3 py-2.5" style={{ background: "#0f1117", border: "1px solid #1f2937" }}>
                    <p className="text-sm font-semibold text-white mb-0.5">{item.titulo}</p>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recursos para estudiantes */}
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-sm font-bold text-white mb-3">🔗 Recursos oficiales para estudiantes</h2>
              <div className="space-y-2">
                {[
                  { texto: "INJUVE — Programas de movilidad para jóvenes españoles", url: "https://www.injuve.es/movilidad-internacional" },
                  { texto: "Erasmus+ — Becas de idiomas complementarias", url: "https://www.erasmusplus.gob.es" },
                  { texto: "Goethe-Institut España — Alemán oficial (requisito para Alemania)", url: "https://www.goethe.de/es/spr/kur.html" },
                  { texto: "Alliance Française — Francés oficial (requisito para Francia)", url: "https://www.alliancefrancaise.es" },
                  { texto: "Cruz Roja España — Primeros auxilios (~30 €)", url: "https://www.cruzroja.es/principal/web/cursos-formacion" },
                  { texto: "DAAD — Becas para estudiar mientras estás en Alemania", url: "https://www.daad.de/es" },
                ].map((e, i) => (
                  <a key={i} href={e.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs rounded-xl px-3 py-2.5"
                    style={{ background: "#0f1117", color: "#10b981", border: "1px solid #1f2937" }}>
                    🔗 <span className="underline">{e.texto}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PLATAFORMAS ── */}
        {tab === "plataformas" && (
          <div className="space-y-4">
            <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: "#0d2818", border: "1px solid #065f46", color: "#d1fae5" }}>
              💡 Empieza siempre por las plataformas gratuitas (AuPairWorld + AuPair.com). Solo paga por agencias si necesitas gestión de visa J-1 para USA.
            </div>

            {/* Plataformas gratuitas primero */}
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-sm font-bold text-white mb-3">🆓 Plataformas gratuitas para au pairs</h2>
              <div className="space-y-3">
                {PLATAFORMAS.filter(p => p.gratis).map((p, i) => (
                  <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col gap-1 rounded-xl px-4 py-3"
                    style={{
                      background: "#0f1117",
                      border: `1px solid ${p.destacado ? "#10b981" : "#1f2937"}`,
                    }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color: "#10b981" }}>{p.nombre} →</span>
                      {p.destacado && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "#10b98120", color: "#10b981" }}>Recomendada</span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>{p.descripcion}</p>
                    <p className="text-xs font-medium" style={{ color: "#6b7280" }}>📍 {p.para}</p>
                  </a>
                ))}
              </div>
            </div>

            {/* Agencias de pago */}
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-sm font-bold text-white mb-1">💼 Agencias (solo necesarias para visa J-1 USA)</h2>
              <p className="text-xs mb-3" style={{ color: "#6b7280" }}>Para USA necesitas una agencia autorizada por el Dpto. de Estado americano. Sin ella no hay visa J-1.</p>
              <div className="space-y-3">
                {PLATAFORMAS.filter(p => !p.gratis).map((p, i) => (
                  <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col gap-1 rounded-xl px-4 py-3"
                    style={{ background: "#0f1117", border: "1px solid #1f2937" }}>
                    <span className="text-sm font-bold" style={{ color: "#10b981" }}>{p.nombre} →</span>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>{p.descripcion}</p>
                    <p className="text-xs font-medium" style={{ color: "#6b7280" }}>📍 {p.para}</p>
                  </a>
                ))}
              </div>
            </div>

            {/* Cómo crear un perfil que destaque */}
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-sm font-bold text-white mb-3">✨ Cómo crear un perfil que destaque</h2>
              <ul className="space-y-2">
                {[
                  "Foto principal: con niños, sonriendo, luz natural — las familias quieren ver que te gustan los niños",
                  "Vídeo de presentación (30-60 seg): en el idioma del país destino. Vale el nivel que tengas — muestra naturalidad",
                  "Rellena el 100% del perfil — los incompletos no aparecen en las primeras búsquedas",
                  "Especializa tu perfil: si sabes nadar, tienes carnet, hablas tres idiomas — ponlo todo",
                  "Referencias verificadas: sube fotos de las cartas de referencia escaneadas",
                  "Disponibilidad clara: fechas exactas de inicio y países preferidos",
                  "Responde en menos de 24 horas — las familias eligen quien contesta rápido",
                  "Carta de motivación en el idioma del país: dos párrafos sobre por qué quieres vivir allí y qué te dan los niños",
                ].map((tip, i) => (
                  <li key={i} className="flex gap-2 text-xs" style={{ color: "#d1d5db" }}>
                    <span className="text-green-400 shrink-0">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── AL TERMINAR ── */}
        {tab === "al-terminar" && (
          <div className="space-y-4">

            {/* Aviso previo */}
            <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: "#0d2818", border: "1px solid #065f46", color: "#d1fae5" }}>
              🏁 Esta sección es para cuando tu contrato Au Pair esté a punto de terminar o ya haya terminado.
              Hay pasos importantes que hacer antes de coger el avión de vuelta.
            </div>

            {/* Qué hacer ANTES de marcharte */}
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-base font-bold text-white mb-3">📋 Qué hacer ANTES de irte</h2>
              <div className="space-y-3">
                {[
                  { icon: "💶", titulo: "Exige tu finiquito", desc: "Tienes derecho a cobrar los días trabajados del mes en curso y las vacaciones no disfrutadas. Pide el documento por escrito con firma de la familia." },
                  { icon: "📜", titulo: "Pide el certificado de empresa", desc: "Documento que acredita: fechas exactas del contrato, tipo de trabajo, motivo de finalización. Imprescindible para pedir el paro en España." },
                  { icon: "🏥", titulo: "Solicita tu historial de cotizaciones (formulario U1)", desc: "En países UE/EEE, este formulario (antiguo E301) permite sumar tus cotizaciones extranjeras al cómputo español del SEPE. Pídelo en la Seguridad Social del país donde hayas trabajado." },
                  { icon: "🏛️", titulo: "Date de baja en el registro de la ciudad", desc: "Si te registraste como residente extranjero, date de baja. Evita problemas fiscales futuros (impuesto de patrimonio, etc.)." },
                  { icon: "🏦", titulo: "Cierra o mantén la cuenta bancaria", desc: "Si quieres recibir transferencias futuras o reembolsos, mantén la cuenta activa unos meses. Recuerda las comisiones de mantenimiento." },
                  { icon: "📱", titulo: "Cancela contratos locales", desc: "Seguro de salud privado, SIM local, gimnasio, suscripciones de streaming. Hazlo por escrito y guarda los justificantes." },
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

            {/* SEPE al volver */}
            <div className="rounded-2xl p-5" style={{ background: "#0d2818", border: "1px solid #065f46" }}>
              <h2 className="text-base font-bold mb-3" style={{ color: "#d1fae5" }}>🏛️ SEPE al volver — ¿Puedo cobrar el paro?</h2>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: "#a7f3d0" }}>
                Si has cotizado en un país de la UE/EEE y no dimitiste voluntariamente, puedes pedir
                la prestación por desempleo en España sumando tus cotizaciones extranjeras.
              </p>
              <div className="space-y-1.5 mb-4">
                {[
                  "✅ Haber cotizado ≥360 días (España + UE con formulario U1)",
                  "✅ El contrato ha terminado (fin de plazo o despido) — no dimisión voluntaria",
                  "✅ Inscribirte como demandante en el SEPE en los 15 días hábiles siguientes",
                  "✅ No percibir rentas superiores al 75% del SMI",
                ].map((req, i) => (
                  <p key={i} className="text-xs leading-relaxed" style={{ color: "#d1fae5" }}>{req}</p>
                ))}
              </div>
              <div className="space-y-2">
                <a href="https://www.sepe.es/HomeSepe/Personas/distributiva-prestaciones/solicitar-prestacion.html"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm rounded-xl px-3 py-2.5"
                  style={{ background: "#065f46", color: "#d1fae5", border: "1px solid #047857" }}>
                  🏛️ Solicitar paro en el SEPE →
                </a>
                <a href="https://www.sepe.es/HomeSepe/que-es-el-sepe/comunicacion-institucional/publicaciones/publicaciones-oficiales/listado-de-publicaciones.html?folder=/publicaciones/prestaciones/internacionales"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm rounded-xl px-3 py-2.5"
                  style={{ background: "#065f46", color: "#d1fae5", border: "1px solid #047857" }}>
                  📋 Formulario U1 — Prestaciones internacionales →
                </a>
              </div>
            </div>

            {/* Si el contrato Au Pair terminó mal */}
            <div className="rounded-2xl p-5" style={{ background: "#1a0a0a", border: "1px solid #7f1d1d" }}>
              <h2 className="text-base font-bold mb-3" style={{ color: "#fca5a5" }}>🚨 Si el contrato terminó de forma conflictiva</h2>
              <p className="text-xs mb-3" style={{ color: "#fca5a5" }}>
                Si la familia te ha tratado mal, ha incumplido el contrato o te ha despedido de forma injusta, tienes recursos legales.
              </p>
              <div className="space-y-2">
                {[
                  { titulo: "Contacta con la agencia intermediaria", desc: "Si usaste una agencia (AuPairWorld, Cultural Care, etc.), tienen obligación de mediar en conflictos y ayudarte a encontrar otra familia." },
                  { titulo: "Embajada o Consulado español", desc: "En casos graves (impago, acoso, condiciones ilegales), acude a la embajada de España en el país. Pueden ayudarte con repatriación de urgencia." },
                  { titulo: "Sindicatos locales o tribunales laborales", desc: "En países UE tienes los mismos derechos laborales que los nacionales. Los sindicatos locales suelen tener servicios gratuitos de asesoramiento para trabajadores extranjeros." },
                  { titulo: "SEPE con baja voluntaria justificada", desc: "Si te fuiste por condiciones abusivas (impago, acoso, incumplimiento del contrato), puedes solicitar el paro aunque hayas sido tú quien rescindió. Documenta todo." },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: "#1a0a0a", border: "1px solid #991b1b" }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "#fca5a5" }}>⛔ {item.titulo}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#f87171" }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Siguiente paso */}
            <div className="rounded-2xl p-5" style={{ background: "#1a1f2e", border: "1px solid #2d3748" }}>
              <h2 className="text-base font-bold text-white mb-3">🦋 ¿Y ahora qué? Tu siguiente paso</h2>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: "#9ca3af" }}>
                Volver de un año Au Pair con un idioma C1 y experiencia internacional es un cambio de vida real.
                Aprovecha ese capital para dar el salto laboral.
              </p>
              <div className="space-y-2">
                {[
                  "📄 Actualiza tu CV con el idioma, la experiencia y los países — BuscayCurra te ayuda",
                  "🔍 Busca trabajo con filtro de idioma en BuscayCurra — tus opciones se multiplican",
                  "🌍 ¿Repetir? Muchos au pairs hacen 2-3 países consecutivos antes de volver al mercado laboral",
                  "🎓 Comprueba si tu facultad reconoce el año como créditos o prácticas internacionales",
                ].map((item, i) => (
                  <p key={i} className="text-xs leading-relaxed" style={{ color: "#d1d5db" }}>
                    {item}
                  </p>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* CTA buscar */}
        <Link
          href="/app/buscar?q=au+pair"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm"
          style={{ background: "#10b981", color: "#fff" }}
        >
          🔍 Buscar ofertas Au Pair en BuscayCurra
        </Link>
      </div>
    </div>
  );
}
