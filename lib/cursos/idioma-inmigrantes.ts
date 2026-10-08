/**
 * lib/cursos/idioma-inmigrantes.ts — El curso oficial de idioma para quien
 * llega a vivir a cada país.
 *
 * Casi todos los países tienen uno, muchas veces gratis, pero QUIÉN puede ir
 * cambia muchísimo, y casi siempre la diferencia es ser de la UE o no. Decirle
 * a alguien de Sevilla que en Noruega el curso es gratis le hace planificar con
 * un dinero que no va a tener: allí los europeos lo pagan. Por eso cada ficha
 * dice, por separado, qué pasa si eres de la UE, y sale de la página oficial.
 *
 * Comprobado el 2026-10-08. Los países sin ficha todavía no se han podido
 * verificar con fuente oficial: para ellos, el servicio público de cada país
 * (SERVICIOS_EMPLEO en plataformas.ts).
 */
import type { Fuente } from "./tipos";

export interface CursoIdiomaPais {
  pais: string;
  /** Cómo se llama allí. */
  nombre: string;
  idioma: string;
  /** "si" gratis para quien tiene derecho; "no" hay que pagar; "depende" según tu caso. */
  gratis: "si" | "no" | "depende";
  /** Lo que importa a quien viene de España: qué pasa si eres ciudadano de la UE. */
  siEresDeLaUE: string;
  /** Para quien es de fuera de la UE, si cambia algo. */
  siNoEresDeLaUE?: string;
  coste?: string;
  comoApuntarse: string;
  url: string;
  fuentes: Fuente[];
  actualizado: string;
}

export const CURSOS_IDIOMA: CursoIdiomaPais[] = [
  {
    pais: "DE",
    nombre: "Integrationskurs (BAMF)",
    idioma: "alemán",
    gratis: "no",
    siEresDeLaUE:
      "No tienes derecho al curso, pero puedes pedir plaza al BAMF si te falta alemán. Te admiten si quedan plazas, que dependen del presupuesto, y dan prioridad a quien vuelve al mercado laboral.",
    coste: "2,29 € por hora de clase: el curso completo de 700 horas sale por 1.603 €.",
    comoApuntarse: "Pide la admisión al BAMF (se tramitan por orden de llegada) y, con el certificado, apúntate en una academia autorizada.",
    url: "https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/TeilnahmeKosten/EU-Buerger/eu-buerger-node.html",
    fuentes: [{ titulo: "BAMF — Integrationskurse para ciudadanos de la UE", url: "https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/TeilnahmeKosten/EU-Buerger/eu-buerger-node.html" }],
    actualizado: "2026-10",
  },
  {
    pais: "AT",
    nombre: "Deutschkurse (ÖIF y AMS)",
    idioma: "alemán",
    gratis: "depende",
    siEresDeLaUE:
      "Los cursos gratis del Fondo de Integración (ÖIF) son para refugiados, personas con protección subsidiaria y desplazados de Ucrania, no para ciudadanos de la UE. Si estás inscrito en el AMS como demandante de empleo, pregúntales por cursos de alemán.",
    comoApuntarse: "Si buscas trabajo, a través de tu oficina del AMS.",
    url: "https://www.integrationsfonds.at/themen/foerderungen",
    fuentes: [{ titulo: "Österreichischer Integrationsfonds — Förderungen", url: "https://www.integrationsfonds.at/themen/foerderungen" }],
    actualizado: "2026-10",
  },
  {
    pais: "SE",
    nombre: "SFI — Svenska för invandrare",
    idioma: "sueco",
    gratis: "si",
    siEresDeLaUE:
      "Tienes derecho, igual que el resto: gratis desde los 16 años si vives en Suecia y no tienes sueco básico. Ojo: algunos municipios piden número personal o de coordinación para apuntarte.",
    comoApuntarse: "Se pide en el municipio (kommun) donde vives.",
    url: "https://skovde.se/naringsliv-arbete/flyttahit/information-in-english/childcare-and-educatione/sfi---swedish-for-immigrants",
    fuentes: [
      { titulo: "Skövde kommun — SFI, Swedish for immigrants", url: "https://skovde.se/naringsliv-arbete/flyttahit/information-in-english/childcare-and-educatione/sfi---swedish-for-immigrants" },
      { titulo: "Solna stad — Swedish for immigrants (sfi)", url: "https://www.solna.se/barn--utbildning/svenska-for-invandrare-sfi/swedish-for-immigrants-sfi" },
    ],
    actualizado: "2026-10",
  },
  {
    pais: "NO",
    nombre: "Opplæring i norsk og samfunnskunnskap",
    idioma: "noruego",
    gratis: "no",
    siEresDeLaUE:
      "Los ciudadanos de la UE/EEE no tienen derecho al curso gratis, que es para refugiados y sus familias. Hay que pagarlo: lo ofrecen los municipios, cada uno con su precio.",
    comoApuntarse: "En el centro de formación de adultos (voksenopplæring) de tu municipio.",
    url: "https://arkiv.imdi.no/en/norwegian-language-training/norwegian-language-training-and-social-studies/",
    fuentes: [{ titulo: "IMDi — Norwegian language training and social studies", url: "https://arkiv.imdi.no/en/norwegian-language-training/norwegian-language-training-and-social-studies/" }],
    actualizado: "2026-10",
  },
  {
    pais: "DK",
    nombre: "Danskuddannelse",
    idioma: "danés",
    gratis: "si",
    siEresDeLaUE:
      "Es gratis también para trabajadores y estudiantes de la UE, pero el centro cobra una fianza de 2.000 coronas por cada módulo. Si te la devuelven lo decide el ayuntamiento.",
    coste: "Gratis, con fianza de 2.000 DKK por módulo.",
    comoApuntarse: "Te inscribes a través de tu municipio (kommune).",
    url: "https://www.retsinformation.dk/eli/lta/2026/448",
    fuentes: [{ titulo: "Danskuddannelsesloven (LBK nr. 448 de 16/04/2026)", url: "https://www.retsinformation.dk/eli/lta/2026/448" }],
    actualizado: "2026-10",
  },
  {
    pais: "FI",
    nombre: "Kotoutumiskoulutus (formación de integración)",
    idioma: "finés",
    gratis: "si",
    siEresDeLaUE:
      "Es para inmigrantes de 18 a 64 años inscritos como demandantes de empleo y con un plan de integración hecho por los servicios de empleo, sobre todo en los tres primeros años. Dura alrededor de un año y es gratis.",
    comoApuntarse: "Inscríbete en los servicios de empleo: son ellos quienes te reservan la plaza.",
    url: "https://www.suomi.fi/services/integration-training-city-of-jyvaskyla/23288df3-4a24-4334-9be3-2e95f4e03350",
    fuentes: [{ titulo: "Suomi.fi — Integration training (Jyväskylä)", url: "https://www.suomi.fi/services/integration-training-city-of-jyvaskyla/23288df3-4a24-4334-9be3-2e95f4e03350" }],
    actualizado: "2026-10",
  },
  {
    pais: "NL",
    nombre: "Inburgering",
    idioma: "neerlandés",
    gratis: "no",
    siEresDeLaUE:
      "Si eres de la UE no tienes que hacer la inburgering: es obligatoria solo para quien viene de fuera. Puedes aprender neerlandés por tu cuenta; en muchas bibliotecas hay un Taalhuis para practicar.",
    comoApuntarse: "No hace falta apuntarse a nada. Para practicar, pregunta en la biblioteca de tu ciudad.",
    url: "https://www.rijksoverheid.nl/onderwerpen/immigratie-naar-nederland/vraag-en-antwoord/moet-ik-als-nieuwkomer-inburgeren",
    fuentes: [{ titulo: "Rijksoverheid — Moet ik als nieuwkomer inburgeren?", url: "https://www.rijksoverheid.nl/onderwerpen/immigratie-naar-nederland/vraag-en-antwoord/moet-ik-als-nieuwkomer-inburgeren" }],
    actualizado: "2026-10",
  },
  {
    pais: "BE",
    nombre: "Inburgering y Nederlands als tweede taal (Flandes)",
    idioma: "neerlandés",
    gratis: "no",
    siEresDeLaUE:
      "En Flandes los ciudadanos de la UE no están obligados al programa de integración, pero pueden hacerlo si quieren. Dentro del programa, las clases de neerlandés con un examen cuestan 180 €; el acompañamiento es gratis.",
    coste: "180 € (clases de neerlandés + 1 examen, dentro del programa de integración).",
    comoApuntarse: "El Agentschap Integratie en Inburgering te ayuda a encontrar curso, aunque no lo da él.",
    url: "https://www.vlaanderen.be/en/studying/finding-the-right-dutch-course",
    fuentes: [
      { titulo: "Vlaanderen — Finding the right Dutch course", url: "https://www.vlaanderen.be/en/studying/finding-the-right-dutch-course" },
      { titulo: "Agentschap Integratie en Inburgering — información en español (PDF)", url: "https://integratie-inburgering.be/sites/default/files/2024-05/AgII_WERVINGSBRIEF_BIJLAGE_AGII_ES.pdf" },
    ],
    actualizado: "2026-10",
  },
  {
    pais: "FR",
    nombre: "Formation linguistique del Contrat d'intégration républicaine (OFII)",
    idioma: "francés",
    gratis: "si",
    siEresDeLaUE:
      "Este curso no es para ciudadanos de la UE: es solo para personas de fuera de la UE que firman el Contrat d'intégration républicaine. Si eres de la UE, tendrás que buscar otro curso.",
    siNoEresDeLaUE: "Si vienes de fuera de la UE con permiso para quedarte, el curso va dentro de ese contrato con la OFII.",
    comoApuntarse: "Lo propone la OFII al firmar el contrato.",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F17048",
    fuentes: [{ titulo: "Service-Public.fr — Contrat d'intégration républicaine (CIR)", url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F17048" }],
    actualizado: "2026-10",
  },
  {
    pais: "PT",
    nombre: "Português Língua de Acolhimento (PLA)",
    idioma: "portugués",
    gratis: "si",
    siEresDeLaUE:
      "Es para migrantes desde los 16 años cuya lengua materna no es el portugués, trabajen o no. Gratis. Lo dan el IEFP y escuelas públicas.",
    comoApuntarse: "Busca los cursos y haz la preinscripción en el portal IEFP Online (hay que registrarse).",
    url: "https://iefponline.iefp.pt/",
    fuentes: [
      { titulo: "IEFP Online — portal de inscripción", url: "https://iefponline.iefp.pt/" },
      { titulo: "Citeforma (centro de formación con protocolo del IEFP) — PLA nivel A1/A2", url: "https://www.citeforma.pt/formacao/cursos/linguas-e-literaturas-estrangeiras/portugues-lingua-de-acolhimento-nivel-a1-a2" },
    ],
    actualizado: "2026-10",
  },
  {
    pais: "IE",
    nombre: "ESOL (English for Speakers of Other Languages)",
    idioma: "inglés",
    gratis: "si",
    siEresDeLaUE:
      "Los ciudadanos de la UE tienen el mismo derecho que los irlandeses. Muchas ETB dan clases de inglés gratis, con prioridad para quien está en paro.",
    comoApuntarse: "Pregunta en la Education and Training Board (ETB) de tu zona.",
    url: "https://www.fetchcourses.ie/",
    fuentes: [
      { titulo: "Citizens Information — Adult literacy (clases de inglés en las ETB)", url: "https://www.citizensinformation.ie/en/education/further-education-and-training/adult-literacy/" },
      { titulo: "FET Course Hub (SOLAS)", url: "https://www.fetchcourses.ie/" },
    ],
    actualizado: "2026-10",
  },
  {
    pais: "CA",
    nombre: "LINC / CLIC",
    idioma: "inglés o francés",
    gratis: "si",
    siEresDeLaUE:
      "Ser de la UE no cambia nada aquí: solo pueden ir los adultos con residencia permanente o con protección reconocida. Con un permiso de trabajo temporal no tienes derecho.",
    comoApuntarse: "En una organización de acogida financiada por el Gobierno de Canadá.",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/language-skills/classes.html",
    fuentes: [{ titulo: "Canada.ca — Language classes funded by the Government of Canada", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/language-skills/classes.html" }],
    actualizado: "2026-10",
  },
  {
    pais: "AU",
    nombre: "Adult Migrant English Program (AMEP)",
    idioma: "inglés",
    gratis: "si",
    siEresDeLaUE:
      "Depende de tu visado, no de ser de la UE: es gratis para mayores de 18 con visado permanente y para algunos visados temporales, y ya no tiene límite de horas hasta llegar al inglés de trabajo.",
    comoApuntarse: "Se solicita a través del programa AMEP (Departamento de Interior de Australia).",
    url: "https://immi.homeaffairs.gov.au/amep-subsite/Files/amep-learn-english-for-free-factsheet.pdf",
    fuentes: [{ titulo: "Home Affairs — AMEP: learn English for free (PDF)", url: "https://immi.homeaffairs.gov.au/amep-subsite/Files/amep-learn-english-for-free-factsheet.pdf" }],
    actualizado: "2026-10",
  },
];

export function cursoIdiomaDe(pais: string): CursoIdiomaPais | undefined {
  return CURSOS_IDIOMA.find(c => c.pais === pais);
}
