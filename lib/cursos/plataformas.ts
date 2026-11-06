/**
 * lib/cursos/plataformas.ts — Dónde hay formación gratuita de verdad.
 *
 * POR QUÉ EXISTE ESTE FICHERO APARTE DE tipos.ts. tipos.ts describe CURSOS
 * concretos, uno a uno, escritos a mano y verificados: el carretillero, el
 * manipulador de alimentos. Eso da profundidad pero no da volumen — cada ficha
 * cuesta horas de comprobación y nunca vamos a tener mil.
 *
 * Esto es la otra mitad: las PLATAFORMAS donde ya hay cientos o miles de cursos
 * gratuitos montados por otros. Una sola entrada aquí (Santander Open Academy)
 * abre más de mil cursos en varios idiomas. Es la única manera honesta de dar
 * amplitud sin inventarse un catálogo que no tenemos.
 *
 * Y es lo que resuelve el multi-país: BuscayCurra está en 26 países, y las
 * plataformas online no tienen ubicación — la EU Academy sirve igual en Sevilla
 * que en Nápoles. Los cursos presenciales subvencionados, en cambio, solo
 * existen donde hay convocatoria, y por eso van por servicio público de empleo
 * de cada país.
 *
 * ⚠️ MISMA REGLA QUE EN tipos.ts: nada entra aquí sin haberlo abierto y mirado.
 * En particular, NO se afirma que dan certificado si no lo dicen ellos: mucha
 * gente elige el curso justamente por el papel del final, y prometerlo en falso
 * le hace perder semanas. Cuando no consta, se dice que no consta.
 *
 * Bajas comprobadas (para que nadie las vuelva a meter):
 *   · Conecta Empleo (Fundación Telefónica) — su plataforma propia
 *     conectaempleo-formacion.fundaciontelefonica.com ya redirige a la web
 *     general y el catálogo de formación solo ofrece ProFuturo, que es para
 *     docentes. Estaba en el plan original; a 2026-08 ya no es una opción real.
 *
 * Miradas y que NO entran (2026-11-06):
 *   · INSAFORP (El Salvador) — disuelto por ley en noviembre de 2023 y
 *     sustituido por el INCAF; su dominio insaforp.org.sv ya no existe. El
 *     INCAF solo lista cursos presenciales para plantilla de empresas; para
 *     particulares va Certifícate.
 *   · INTECAP (Guatemala) — casi todo su catálogo se paga. Lo gratis (cursos
 *     abiertos en línea) solo se ve con cuenta; pendiente de comprobar.
 *   · Capacitar (Ministerio de Economía, Argentina) — gratis y comprobado en
 *     su web, pero es para pymes y emprendedores, no para quien busca empleo.
 *
 * Miradas y que NO entran (2026-10-08):
 *   · Aula Mentor (Ministerio de Educación) — es de pago, y su web oficial no
 *     respondía para confirmar el precio. Sin precio comprobado, no se publica.
 *   · Microsoft Learn — gratis y con miles de lecciones en español, pero casi
 *     todo es para informáticos (Azure, Copilot, administración de sistemas).
 *     No es lo que busca nuestra gente.
 */

import type { Fuente } from "./tipos";

/** Alcance: dónde sirve la plataforma. */
export type Alcance =
  | { tipo: "global" }
  /** Toda la Unión Europea. */
  | { tipo: "ue" }
  /** Solo estos países (códigos ISO de lib/paises.ts). */
  | { tipo: "paises"; codigos: string[] };

export interface PlataformaFormacion {
  id: string;
  nombre: string;
  /** Una frase. Es lo que se lee en la tarjeta. */
  resumen: string;
  url: string;
  alcance: Alcance;
  /** Idiomas en los que hay material, no los del menú de la web. */
  idiomas: string[];
  /** Etiquetas de búsqueda. En español, que es como la gente escribe. */
  temas: string[];
  /**
   * "si" solo si lo dice la propia plataforma. "no_consta" cuando lo hemos
   * mirado y no lo dicen — que no es lo mismo que decir que no lo dan.
   */
  certificado: "si" | "no" | "no_consta";
  /** Tamaño del catálogo, tal y como lo declaran ellos. */
  volumen?: string;
  /** Quién puede apuntarse. Vacío = cualquiera. */
  requisitos?: string;
  /** Lo que hay que saber antes de meterse. Se muestra en la tarjeta. */
  aviso?: string;
  fuentes: Fuente[];
  /** YYYY-MM de la última vez que se abrió y se comprobó. */
  actualizado: string;
}

// ─── Plataformas abiertas: no dependen de dónde vivas ───────────────────────

export const PLATAFORMAS: PlataformaFormacion[] = [
  // ── Latinoamérica y Brasil (comprobadas el 5 nov 2026) ──
  // Solo salen a quien está en ese país: el catálogo de cursos se pinta para
  // el país de cada uno (ListaCursos, ?pais=).
  {
    id: "jovenes-construyendo-el-futuro",
    nombre: "Jóvenes Construyendo el Futuro",
    resumen:
      "Un año aprendiendo un oficio dentro de una empresa, cobrando 9.582,47 pesos al mes y con seguro del IMSS. Del Gobierno de México.",
    url: "https://jovenesconstruyendoelfuturo.stps.gob.mx/",
    alcance: { tipo: "paises", codigos: ["MX"] },
    idiomas: ["Español"],
    temas: ["primer empleo", "aprendiz", "oficio", "beca", "jóvenes", "sin experiencia"],
    certificado: "no_consta",
    requisitos: "De 18 a 29 años, sin estudiar ni trabajar.",
    aviso:
      "No es un curso en línea: es capacitación en un centro de trabajo durante 12 meses. Las inscripciones van por convocatorias; mira en la web cuándo abre la siguiente.",
    fuentes: [
      { titulo: "Jóvenes Construyendo el Futuro elevará su apoyo mensual a 9,582 pesos en 2026 — Programas para el Bienestar", url: "https://programasparaelbienestar.gob.mx/2025/12/05/" },
      { titulo: "Así es la cobertura del IMSS para Jóvenes Construyendo el Futuro — Programas para el Bienestar", url: "https://www.programasparaelbienestar.gob.mx/noticias-y-comunicados/noticia/asi-es-la-cobertura-del-imss-para-jovenes-construyendo-el-futuro/" },
    ],
    actualizado: "2026-11",
  },
  {
    id: "capacitate-para-el-empleo",
    nombre: "Capacítate para el Empleo",
    resumen:
      "Cursos de oficios gratis y en línea, sin límite de edad ni requisitos: de la Fundación Carlos Slim.",
    url: "https://capacitateparaelempleo.org/",
    alcance: { tipo: "paises", codigos: ["MX"] },
    idiomas: ["Español"],
    temas: ["oficios", "comercio", "atención al cliente", "seguridad industrial", "primeros auxilios", "cocina", "repostería", "informática"],
    certificado: "si",
    aviso:
      "El certificado se imprime al aprobar todos los cuestionarios del curso. Es de la fundación, no un título oficial (salvo el diplomado de Big Data, que tiene validez de la SEP).",
    fuentes: [
      { titulo: "El ABC de cómo inscribirte en Capacítate para el Empleo — Fundación Carlos Slim", url: "https://fundacioncarlosslim.org/abc-inscribirte-en-capacitate-empleo/" },
      { titulo: "Conoce la plataforma Capacítate para el empleo — Fundación Carlos Slim", url: "https://fundacioncarlosslim.org/conoce-la-plataforma-capacitate-para-el-empleo-de-fundacion-carlos-slim/" },
    ],
    actualizado: "2026-11",
  },
  {
    id: "escola-virtual-gov",
    nombre: "Escola Virtual.Gov (Enap)",
    resumen:
      "La escuela en línea del Gobierno de Brasil: cursos gratis para cualquier persona, con certificado al aprobar.",
    url: "https://www.escolavirtual.gov.br/",
    alcance: { tipo: "paises", codigos: ["BR"] },
    idiomas: ["Portugués"],
    temas: ["informática", "inteligencia artificial", "administración", "logística", "compras", "atención al público", "gestión"],
    certificado: "si",
    requisitos: "Entrar con la cuenta gov.br.",
    aviso:
      "Mucho catálogo está pensado para funcionarios; filtra por tema antes de apuntarte.",
    fuentes: [
      { titulo: "Inscrever-se em cursos autoinstrucionais na Escola Virtual de Governo — gov.br", url: "https://www.gov.br/pt-br/servicos/inscrever-se-em-cursos-autoinstrucionais-na-escola-virtual-de-governo" },
    ],
    actualizado: "2026-11",
  },
  {
    id: "sena-sofia-plus",
    nombre: "SENA — Sofía Plus",
    resumen:
      "Los cursos del Servicio Nacional de Aprendizaje de Colombia, cortos y virtuales, sin costo.",
    url: "https://www.senasofiaplus.edu.co/",
    alcance: { tipo: "paises", codigos: ["CO"] },
    idiomas: ["Español"],
    temas: ["oficios", "inglés", "excel", "servicio al cliente", "seguridad y salud en el trabajo", "técnico", "tecnólogo"],
    certificado: "no_consta",
    requisitos: "Registrarse en Sofía Plus con el documento de identidad vigente.",
    aviso:
      "Los cursos cortos duran entre 40 horas y tres meses, con inscripción abierta todo el año. Los técnicos y tecnólogos van por convocatorias.",
    fuentes: [
      { titulo: "Formación — SENA Regional Distrito Capital", url: "https://www.sena.edu.co/blog/regional-distrito-capital/pagina/rp-form" },
    ],
    actualizado: "2026-11",
  },
  {
    id: "capacita-t",
    nombre: "Capacita-T (Ministerio de Trabajo del Perú)",
    resumen:
      "La plataforma gratuita del Ministerio de Trabajo del Perú: 204 cursos virtuales y 42 rutas de aprendizaje, con certificado sin costo.",
    url: "https://capacitacionlaboral.trabajo.gob.pe/",
    alcance: { tipo: "paises", codigos: ["PE"] },
    idiomas: ["Español"],
    temas: ["capacitación laboral", "personas mayores", "lengua de señas"],
    certificado: "si",
    aviso:
      "Hay cursos para personas mayores y en lengua de señas peruana. En 2026 el ministerio ya había dado más de 64.000 certificados.",
    fuentes: [
      { titulo: "Plataforma Capacíta-T: conocimientos transformadores — El Peruano (17 jul 2026)", url: "https://elperuano.pe/noticia/300533-plataforma-capacita-t-conocimientos-transformadores" },
    ],
    actualizado: "2026-11",
  },
  {
    id: "inefop-uruguay",
    nombre: "INEFOP (Instituto Nacional de Empleo y Formación Profesional)",
    resumen:
      "Cursos gratuitos para quien vive en Uruguay, trabaje o no: idiomas, oficios y habilidades digitales, por convocatorias.",
    url: "https://www.inefop.org.uy/",
    alcance: { tipo: "paises", codigos: ["UY"] },
    idiomas: ["Español"],
    temas: ["idiomas", "inglés", "portugués", "oficios", "habilidades digitales"],
    certificado: "no_consta",
    requisitos: "Vivir en Uruguay y ser mayor de edad.",
    aviso:
      "Las inscripciones se abren por convocatorias y se cierran al llenarse las plazas: mira las abiertas en su portal.",
    fuentes: [
      { titulo: "INEFOP promueve el acceso de personas, empresas y organizaciones a cursos gratuitos — Presidencia de Uruguay", url: "https://www.gub.uy/presidencia/comunicacion/noticias/inefop-promueve-acceso-personas-empresas-organizaciones-cursos-gratuitos" },
      { titulo: "INEFOP abrió inscripciones para cursos de inglés en todo el país — Presidencia de Uruguay", url: "https://www.gub.uy/presidencia/comunicacion/noticias/inefop-abrio-inscripciones-para-cursos-ingles-todo-pais" },
    ],
    actualizado: "2026-11",
  },
  {
    id: "capacitate-en-linea-ecuador",
    nombre: "Capacítate en línea (Ministerio del Trabajo del Ecuador)",
    resumen:
      "Los cursos del Servicio Público de Empleo del Ecuador, sin costo, para mayores de 18 años ecuatorianos o extranjeros, con certificado digital.",
    url: "https://encuentraempleo.trabajo.gob.ec/",
    alcance: { tipo: "paises", codigos: ["EC"] },
    idiomas: ["Español"],
    temas: ["habilidades técnicas", "habilidades blandas"],
    certificado: "si",
    requisitos: "Registrarse en Encuentra Empleo y entrar en «Capacítate en Línea».",
    aviso:
      "El certificado es de asistencia: se descarga en «Capacitaciones vigentes» al terminar.",
    fuentes: [
      { titulo: "Inscripción en los cursos que oferta el Ministerio del Trabajo — gob.ec (31 mar 2026)", url: "https://www.gob.ec/mt/tramites/inscripcion-cursos-oferta-ministerio-trabajo-fortalecimiento-perfil-laboral" },
    ],
    actualizado: "2026-11",
  },
  // Comprobados el 5 nov 2026 en sus webs y en prensa del país (fuentes abajo).
  {
    id: "sence-cursos-en-linea",
    nombre: "SENCE — cursos en línea",
    resumen:
      "Capacitación gratuita del Servicio Nacional de Capacitación y Empleo de Chile, en áreas con mucha demanda de trabajo.",
    url: "https://sence.gob.cl/personas/cursos-en-linea",
    alcance: { tipo: "paises", codigos: ["CL"] },
    idiomas: ["Español"],
    temas: ["oficios", "informática", "atención al cliente", "logística", "administración"],
    certificado: "no_consta",
    requisitos: "Mayores de 18 años.",
    aviso: "Además de los cursos en línea hay cursos presenciales por programa; se buscan en el buscador de cursos del SENCE.",
    fuentes: [
      { titulo: "SENCE — Servicio Nacional de Capacitación y Empleo", url: "https://sence.gob.cl/" },
    ],
    actualizado: "2026-11",
  },
  {
    id: "ina-costa-rica",
    nombre: "INA — Instituto Nacional de Aprendizaje",
    resumen:
      "La formación técnica pública de Costa Rica: cursos gratuitos, presenciales y virtuales, pensados para lo que piden las empresas.",
    url: "https://www.ina.ac.cr/BusquedaCursos",
    alcance: { tipo: "paises", codigos: ["CR"] },
    idiomas: ["Español"],
    temas: ["oficios", "técnico", "informática", "turismo", "inglés", "agricultura", "salud ocupacional"],
    certificado: "no_consta",
    aviso: "Algunos programas, como el de inglés con Open English, piden ser costarricense o residente con DIMEX.",
    fuentes: [
      { titulo: "Explore los 280 cursos gratuitos que el INA ofrece en línea — La Nación", url: "https://www.nacion.com/el-pais/educacion/explore-280-cursos-gratuitos-que-el-ina-ofrece-en/IKQPLSCZBZEOXP7IA7XTRPXI3I/story/" },
      { titulo: "INA abre 7.000 cupos para cursos gratuitos sobre ciberseguridad — El Observador", url: "https://observador.cr/ina-abre-7-000-cupos-para-cursos-gratuitos-sobre-ciberseguridad/" },
    ],
    actualizado: "2026-11",
  },
  {
    id: "snpp-paraguay",
    nombre: "SNPP — Servicio Nacional de Promoción Profesional",
    resumen:
      "Cientos de cursos de oficios gratuitos cada mes en todo Paraguay, presenciales y a distancia, con certificado.",
    url: "https://www.snpp.edu.py/",
    alcance: { tipo: "paises", codigos: ["PY"] },
    idiomas: ["Español"],
    temas: ["oficios", "costura", "electricidad", "gastronomía", "informática", "emprendimiento"],
    certificado: "si",
    requisitos: "Inscripción en línea con la cuenta del sistema Identidad del Ministerio de Trabajo.",
    fuentes: [
      { titulo: "SNPP habilita más de 500 cursos formativos gratuitos y con certificación — Última Hora", url: "https://www.ultimahora.com/snpp-habilita-mas-de-500-cursos-formativos-gratuitos-y-con-certificacion" },
      { titulo: "SNPP — Servicio Nacional de Promoción Profesional", url: "https://www.snpp.edu.py/" },
    ],
    actualizado: "2026-11",
  },
  // ── Seis países más de Latinoamérica (comprobados el 6 nov 2026) ──

  // ARGENTINA (1/2). Abierto el buscador oficial el 6 nov 2026: responde, se
  // presenta como «oferta gratuita y oficial» y enseña comisiones con plazas
  // («Últimos cupos», «Cupo completo») y filtro por municipio. La página del
  // IPFL en la web del Ministerio de Trabajo bonaerense dice que coordina 223
  // Centros de Formación Laboral con «cursos y trayectos formativos gratuitos»
  // y «reconocimiento oficial»: de ahí el certificado "si". Requisitos y la
  // lista de oficios, de El Destape (26 feb 2026). Es solo para la Provincia de
  // Buenos Aires (no la Ciudad): lo dice el resumen porque el alcance es por país.
  {
    id: "ipfl-provincia-buenos-aires",
    nombre: "IPFL — formación laboral de la Provincia de Buenos Aires",
    resumen:
      "Cursos de oficios gratis y con reconocimiento oficial en 223 centros de la Provincia de Buenos Aires. Solo te sirve si vives allí.",
    url: "https://cursosipfl.trabajo.gba.gob.ar/",
    alcance: { tipo: "paises", codigos: ["AR"] },
    idiomas: ["Español"],
    temas: ["oficios", "gastronomía", "panadería", "herrería", "manicuría", "ventas", "vigilador", "presencial"],
    certificado: "si",
    volumen: "223 centros de formación laboral",
    requisitos: "Tener más de 16 años y DNI. Algunos cursos piden la primaria o la secundaria terminada.",
    aviso:
      "Son presenciales y solo en municipios de la Provincia de Buenos Aires, no en la Ciudad. En el buscador filtras por municipio, ves fechas y horarios y te preinscribes; si pone «Cupo completo», ya no hay plaza.",
    fuentes: [
      { titulo: "Instituto Provincial de Formación Laboral — Ministerio de Trabajo de la Provincia de Buenos Aires", url: "https://www.trabajo.gba.gov.ar/ipfl/" },
      { titulo: "Cursos gratuitos con certificación oficial y salida laboral en la Provincia de Buenos Aires — El Destape (26 feb 2026)", url: "https://www.eldestapeweb.com/sociedad/cursos/cursos-gratuitos-con-certificacion-oficial-y-salida-laboral-en-la-provincia-de-buenos-aires-202622615240" },
    ],
    actualizado: "2026-11",
  },

  // ARGENTINA (2/2). Lo que sigue vivo a nivel nacional en 2026: Formando
  // Capital Humano, creado en abril de 2026 (Resolución 295/2026) tras cerrar
  // Volver al Trabajo. La web oficial NO se pudo abrir: da error de certificado
  // y su cortafuegos bloquea el lector automático («The URL you requested has
  // been blocked»). Todo sale de prensa seria reciente: La Gaceta (1 sep 2026:
  // «completamente gratuita», más de 60 cursos en línea, cinco categorías),
  // Infobae (6 oct 2026: vouchers para plomería, soldadura, electricidad
  // domiciliaria, carpintería…), El Cronista (27 abr 2026: quién puede pedir
  // voucher) y BAE Negocios (26 jul 2026). Las cifras de cursos no cuadran entre
  // medios (46, más de 60, 4.300): ponemos la más reciente. Certificado
  // "no_consta": BAE habla de una «constancia digital», pero no lo hemos podido
  // ver en la plataforma. Ojo: la resolución dice que cada curso puede ser
  // «parcial o totalmente gratuito»; va en el aviso.
  {
    id: "formando-capital-humano",
    nombre: "Formando Capital Humano (Ministerio de Capital Humano)",
    resumen:
      "La plataforma de formación del Gobierno argentino: cursos en línea gratis y vouchers para cursos presenciales de oficios.",
    url: "https://formando.capitalhumano.gob.ar/",
    alcance: { tipo: "paises", codigos: ["AR"] },
    idiomas: ["Español"],
    temas: ["oficios", "plomería", "soldadura", "electricidad", "carpintería", "excel", "canva", "inteligencia artificial", "currículum y entrevista"],
    certificado: "no_consta",
    volumen: "Más de 60 cursos en línea",
    requisitos:
      "Los cursos en línea, cualquiera con internet. Los vouchers de oficios son para mayores de 18 años sin empleo formal, monotributistas sociales o de categoría A, trabajadoras de casas particulares, trabajadores rurales temporarios y asalariados que cobren hasta tres salarios mínimos.",
    aviso:
      "Buena parte de lo que hay en línea es de familia, cuidados y nutrición; lo de trabajo está en «Promoción Humana» y en los vouchers. La norma permite que un curso sea solo «parcialmente gratuito»: mira el detalle antes de apuntarte. El voucher depende de que haya cupo.",
    fuentes: [
      { titulo: "El Gobierno ofrece más de 60 cursos de formación profesional gratis y online — La Gaceta (1 sep 2026)", url: "https://www.lagaceta.com.ar/nota/1152126/sociedad/gobierno-ofrece-mas-60-cursos-formacion-profesional-gratis-online-como-inscribirse.html" },
      { titulo: "Estos son los cursos que ofrecen el Gobierno y las empresas para aprender oficios — Infobae (6 oct 2026)", url: "https://www.infobae.com/economia/2026/10/06/estos-son-los-cursos-que-ofrecen-el-gobierno-y-las-empresas-para-aprender-oficios-quienes-pueden-acceder-y-como-inscribirse/" },
      { titulo: "Formando Capital Humano: el nuevo programa de empleo del Gobierno y cómo anotarte — El Cronista (27 abr 2026)", url: "https://www.cronista.com/economia-politica/formando-capital-humano-el-nuevo-programa-de-empleo-del-gobierno-y-como-anotarte/" },
    ],
    actualizado: "2026-11",
  },

  // GUATEMALA. Abierta el 6 nov 2026 el aula virtual de la DIGEEX (Dirección
  // General de Educación Extraescolar, Ministerio de Educación): lista cuatro
  // NOOC gratuitos de 10 horas, virtuales y a tu ritmo (Habilidades Blandas;
  // Búsqueda de Empleo y Autoempleo; Herramientas Tecnológicas y Redes
  // Sociales; y uno solo para técnicos-docentes) y dice que al terminar se da
  // una «constancia de formación o de participación». Es poco, pero es lo único
  // gratis y abierto a todo el mundo que hemos podido confirmar en Guatemala.
  // Las fechas de inicio que enseña no llevan año. Una nota del Gobierno del
  // 13 oct 2026 (guatemala.gob.gt) los anuncia, pero devuelve 403 al lector
  // automático: no se cita. INTECAP va en el bloque B.
  {
    id: "digeex-aula-virtual",
    nombre: "Aula Virtual DIGEEX (Ministerio de Educación de Guatemala)",
    resumen:
      "Cursos cortos gratis del Ministerio de Educación, en línea y a tu ritmo: búsqueda de empleo, habilidades blandas y redes sociales.",
    url: "https://aulavirtual.pronea.gt/",
    alcance: { tipo: "paises", codigos: ["GT"] },
    idiomas: ["Español"],
    temas: ["buscar trabajo", "autoempleo", "habilidades blandas", "redes sociales", "herramientas tecnológicas"],
    certificado: "si",
    volumen: "4 cursos cortos de 10 horas (uno es solo para docentes)",
    requisitos: "Crear una cuenta en el aula virtual.",
    aviso:
      "Son cursos de 10 horas, no una carrera. Lo que dan al terminar es una constancia de participación del Ministerio de Educación, no un título.",
    fuentes: [
      { titulo: "Aula Virtual DIGEEX — Dirección General de Educación Extraescolar (Mineduc)", url: "https://aulavirtual.pronea.gt/" },
    ],
    actualizado: "2026-11",
  },

  // EL SALVADOR. INSAFORP ya no existe: la Asamblea lo disolvió en noviembre de
  // 2023 y lo sustituyó el INCAF; su dominio insaforp.org.sv no resuelve. El
  // INCAF tiene un listado con 68 cursos presenciales del 7 nov al 2 dic de
  // 2026, casi todos para plantilla de empresas (comités de seguridad,
  // liderazgo, exportación): no lo metemos. Lo que sí sirve es Certifícate:
  // Platzi pagado por el Gobierno. Su web (certificate.gob.sv redirige a
  // diaspora.certificate.gob.sv) dice «más de 2000 cursos», gratis «durante el
  // año 2026 para todos los salvadoreños», sin tarjeta, y que los certificados
  // son tuyos. El Diario de Hoy (11 ago 2026) habla de 12 meses desde que
  // activas la cuenta: no cuadra con la web, va en el aviso. Infobae (15 ago
  // 2026): el INCAF certifica además más de 37 rutas, gratis.
  {
    id: "certificate-el-salvador",
    nombre: "Certifícate (Gobierno de El Salvador y Platzi)",
    resumen:
      "Más de 2.000 cursos en línea de Platzi gratis para salvadoreños, pagados por el Gobierno: tecnología, inglés, marketing, finanzas e inteligencia artificial.",
    url: "https://certificate.gob.sv/",
    alcance: { tipo: "paises", codigos: ["SV"] },
    idiomas: ["Español"],
    temas: ["tecnología", "programación", "inteligencia artificial", "inglés", "marketing digital", "diseño", "finanzas", "emprendimiento"],
    certificado: "si",
    volumen: "Más de 2.000 cursos",
    requisitos:
      "Registrarte desde El Salvador, sin VPN. Los salvadoreños que viven fuera entran con la identidad digital del Gobierno. Solo piden nombre, apellidos y correo; nada de tarjeta.",
    aviso:
      "El acceso gratis caduca: la web lo anuncia para todo 2026 y la prensa habla de 12 meses desde que activas la cuenta. Antes de empezar una ruta larga, mira cuánto te queda. Los certificados que saques son tuyos para siempre, y más de 37 rutas, como la de inglés, las certifica además el INCAF.",
    fuentes: [
      { titulo: "Certifícate — Platzi y Presidencia de El Salvador (preguntas frecuentes)", url: "https://diaspora.certificate.gob.sv/" },
      { titulo: "Más de 1,600 cursos gratis: cómo usar Certifícate en El Salvador — El Diario de Hoy (23 dic 2025)", url: "https://www.elsalvador.com/noticias/nacional/educacion-el-salvador-cursos-de-ingles-certificate/1256061/2025/" },
      { titulo: "El Salvador le pone sello oficial a la plataforma Certifícate con más de 37 rutas de formación — Infobae (15 ago 2026)", url: "https://www.infobae.com/el-salvador/2026/08/15/el-salvador-le-pone-sello-oficial-a-la-plataforma-certificate-con-mas-de-37-rutas-de-formacion/" },
    ],
    actualizado: "2026-11",
  },

  // PANAMÁ. Abierta la web del INADEH el 6 nov 2026 (noticias de octubre de
  // 2026, memoria 2025). La preinscripción digital responde. En «Servicios en
  // línea» dice que en el Portal del Aprendiz «descarga tus certificados
  // virtuales»: certificado "si". Gratuidad, cifra y requisitos, de Telemetro
  // (3 oct 2026) y Metro Libre (29 sep 2026): 1.663 cursos y programas
  // gratuitos en el cuarto y último periodo de 2026, clases desde el 5 oct.
  {
    id: "inadeh-panama",
    nombre: "INADEH — Instituto Nacional de Formación Profesional y Capacitación para el Desarrollo Humano",
    resumen:
      "Los cursos de oficios gratis del Gobierno de Panamá, en todo el país: construcción, electricidad, gastronomía, turismo, idiomas y mucho más.",
    url: "https://digital.inadeh.edu.pa/preinscrip/",
    alcance: { tipo: "paises", codigos: ["PA"] },
    idiomas: ["Español"],
    temas: ["oficios", "construcción", "electricidad", "refrigeración", "mecánica", "logística", "tecnología", "gastronomía", "turismo", "idiomas", "belleza", "energías renovables"],
    certificado: "si",
    volumen: "1.663 cursos y programas en el último periodo de 2026",
    requisitos:
      "Tener 18 años (de 16 a 17, con el permiso correspondiente) y ser panameño o tener cédula con condición E o N. Para la preinscripción hace falta un correo electrónico.",
    aviso:
      "Va por periodos: el último de 2026 empezó a dar clase el 5 de octubre. Las plazas dependen de cada centro; si no hay en el tuyo, mira el siguiente periodo. También te puedes apuntar en cualquier centro del INADEH.",
    fuentes: [
      { titulo: "Cursos INADEH 2026: abren preinscripción para 1,663 capacitaciones gratuitas — Telemetro (3 oct 2026)", url: "https://www.telemetro.com/nacionales/cursos-inadeh-2026-abren-preinscripcion-1663-capacitaciones-gratuitas-n6093937" },
      { titulo: "INADEH abre su último periodo de formación de 2026 con 1,663 cursos gratuitos — Metro Libre (29 sep 2026)", url: "https://www.metrolibre.com/nacionales/inadeh-abre-su-ultimo-periodo-de-formacion-de-2026-con-1663-cursos-gratuitos-en-todo-el-pais-CD26070323" },
      { titulo: "INADEH — Servicios en línea (preinscripción y certificados)", url: "https://www.inadeh.edu.pa/servicios-en-linea/" },
    ],
    actualizado: "2026-11",
  },

  // REPÚBLICA DOMINICANA. La web general (infotep.gob.do) devuelve 403 al lector
  // automático. INFOTEP Virtual sí responde: sus preguntas frecuentes dan los
  // requisitos y que «los certificados se emiten por lo regular, a los 45 días
  // laborables» (certificado "si"); la página de cupos tenía el 6 nov 2026 doce
  // cursos con plaza (Secretariado Auxiliar, Operaciones Básicas de Programas de
  // Oficina, Huawei HCIA) que empiezan entre el 9 y el 16 de noviembre. Diario
  // Libre (9 oct 2026): 163 ofertas virtuales abiertas ese día, máximo dos
  // cursos a la vez. Gratuidad: Ensegundos (10 oct 2026) y el comunicado de
  // INFOTEP en El Nuevo Diario (2023): «no cobra ni un sólo centavo».
  {
    id: "infotep-virtual",
    nombre: "INFOTEP Virtual (Instituto Nacional de Formación Técnico Profesional)",
    resumen:
      "Los cursos en línea gratis del INFOTEP dominicano, con certificado: ofimática, secretariado, ventas, marketing digital, Excel e inteligencia artificial.",
    url: "https://infotepvirtual.com/index.php/component/gestion/?contr=oferta&task=oferta&Itemid=290",
    alcance: { tipo: "paises", codigos: ["DO"] },
    idiomas: ["Español"],
    temas: ["ofimática", "excel", "secretariado", "ventas", "marketing digital", "redes sociales", "inteligencia artificial", "python", "servicio al cliente", "seguridad y salud ocupacional"],
    certificado: "si",
    volumen: "163 cursos virtuales abiertos en octubre de 2026",
    requisitos:
      "Tener 16 años o más, cédula y una certificación de estudios. Según el curso, piden ser bachiller y haber hecho antes «Operaciones Básicas de Programas de Oficina».",
    aviso:
      "Solo puedes estar en dos cursos a la vez y, una vez empezado, no te puedes retirar. Las plazas vuelan: mira «Cupos disponibles». El certificado llega unos 45 días laborables después de terminar. INFOTEP no cobra: si alguien te pide dinero por una plaza, no es INFOTEP.",
    fuentes: [
      { titulo: "Infotep abre más de 160 cursos virtuales: conozca las ofertas y cómo inscribirse — Diario Libre (9 oct 2026)", url: "https://www.diariolibre.com/actualidad/educacion/2026/10/09/capacitacion-online-infotep-con-163-ofertas-disponibles/3683070" },
      { titulo: "163 cursos virtuales gratuitos en INFOTEP: conoce cómo inscribirte — Ensegundos (10 oct 2026)", url: "https://ensegundos.do/2026/10/10/163-cursos-virtuales-gratuitos-en-infotep-conoce-como-inscribirte/" },
      { titulo: "INFOTEP Virtual — requisitos y certificados (preguntas frecuentes)", url: "https://www.infotepvirtual.com/" },
      { titulo: "Infotep aclara que los servicios que ofrece son libres de costo — El Nuevo Diario (3 jun 2023)", url: "https://elnuevodiario.com.do/infotep-aclara-servicios-que-ofrece-son-libres-de-costo-llama-a-denunciar-cobro-de-desaprensivos/" },
    ],
    actualizado: "2026-11",
  },

  // HONDURAS. Abiertas el 6 nov 2026 la inscripción (inscripciones.infop.hn:
  // «Todos nuestros cursos son completamente gratuitos», ser hondureño, mayor
  // de 15 años, máximo tres cursos), infopvirtual.com («Mas de 80 cursos», todos
  // marcados «Gratuito») e infop.hn/cursos (110 cursos, los vistos marcados
  // «Gratis»). Las dos webs tienen un portal de «Certificados» y La Prensa
  // (27 feb 2026) explica qué hay que aprobar para sacarlo: certificado "si".
  // El Heraldo (26 mar 2026): Infop Virtual 2026, cursos de 20 horas en dos
  // semanas, «completamente gratuitos».
  {
    id: "infop-honduras",
    nombre: "INFOP — Instituto Nacional de Formación Profesional",
    resumen:
      "Cursos gratis del Gobierno de Honduras: más de 80 en línea y otros presenciales en sus centros de todo el país.",
    url: "https://inscripciones.infop.hn/",
    alcance: { tipo: "paises", codigos: ["HN"] },
    idiomas: ["Español"],
    temas: ["oficios", "ofimática", "administración", "pymes", "tecnología", "turismo", "gastronomía", "inglés", "inteligencia artificial", "seguridad y salud ocupacional", "servicio al cliente"],
    certificado: "si",
    volumen: "Más de 80 cursos en línea",
    requisitos: "Ser hondureño y mayor de 15 años, con computadora o celular con internet. Máximo tres cursos a la vez.",
    aviso:
      "Los cursos en línea suelen ser de 20 horas en dos semanas, y para el certificado hay que hacer todas las actividades y aprobar las evaluaciones. Los presenciales (barbería, carpintería, cocina, reparación de celulares…) están en infop.hn/cursos y se apuntan en el propio centro.",
    fuentes: [
      { titulo: "Infop lanza plataforma virtual con más de 40 cursos gratis — El Heraldo (26 mar 2026)", url: "https://www.elheraldo.hn/honduras/infop-lanza-plataforma-virtual-con-mas-40-cursos-gratuitos-distintas-areas-HC29900272" },
      { titulo: "Así puede matricularse en los cursos gratuitos del Infop — La Prensa (27 feb 2026)", url: "https://www.laprensa.hn/honduras/cursos-gratis-infop-modalidad-linea-matricula-inscripcion-KG29492954" },
      { titulo: "INFOP — inscripción a cursos virtuales", url: "https://inscripciones.infop.hn/" },
    ],
    actualizado: "2026-11",
  },

  // VENEZUELA. Abierto el campus virtual del INCES el 6 nov 2026: sus preguntas
  // frecuentes dicen «formaciones gratuitas», «más de 90 formaciones», «todo
  // público mayor de 14 años», que no hay horario y que el certificado llega
  // por correo al terminar el trimestre si apruebas con 14 puntos o más. La
  // portada del INCES tenía noticias del 6 nov 2026. (Otra comprobación del
  // mismo día lo encontró con error 502: si falla, puede ser pasajero.)
  {
    id: "inces-campus-virtual",
    nombre: "INCES — Campus virtual",
    resumen:
      "Más de 90 formaciones virtuales gratuitas del INCES de Venezuela, sin horario fijo y con certificado.",
    url: "https://campus.inces.edu.ve/",
    alcance: { tipo: "paises", codigos: ["VE"] },
    idiomas: ["Español"],
    temas: ["formación técnica", "competencias digitales", "formación laboral"],
    certificado: "si",
    volumen: "Más de 90 formaciones",
    requisitos: "Mayores de 14 años.",
    aviso:
      "El certificado llega por correo al terminar el trimestre, si apruebas con 14 puntos o más. Los cursos presenciales del INCES se buscan aparte, en hacer.inces.gob.ve.",
    fuentes: [
      { titulo: "Campus virtual del INCES — preguntas frecuentes (6 nov 2026)", url: "https://campus.inces.edu.ve/" },
      { titulo: "INCES — portada, con noticias del 6 nov 2026", url: "https://www.inces.gob.ve/" },
    ],
    actualizado: "2026-11",
  },

  // NICARAGUA. Abierta la web del Tecnológico Nacional (el antiguo INATEC) el
  // 6 nov 2026: se presenta como «Capacitación y Educación Técnica y
  // Tecnológica gratuita», con noticias de octubre y noviembre de 2026 y un
  // cartel de «Oferta 2027». Su nota del 6 nov 2025 da la oferta de 2026: 79
  // carreras técnicas en 73 centros, presencial, virtual, dual y a distancia;
  // para matricularse, 14 años cumplidos y cédula o partida de nacimiento. La
  // matrícula en línea responde y pide cédula o partida, foto y diploma o
  // certificado de notas. Ojo: casi toda la prensa que lo cubre (Canal 4, TN8)
  // es oficialista; por eso la fuente principal es la propia institución. No
  // dicen qué título dan: "no_consta".
  {
    id: "tecnologico-nacional-nicaragua",
    nombre: "Tecnológico Nacional (INATEC)",
    resumen:
      "La formación técnica pública de Nicaragua: carreras técnicas y cursos gratis en más de 70 centros, presenciales y en línea.",
    url: "https://serviciosenlinea.tecnacional.edu.ni/academicos/registro/cursos",
    alcance: { tipo: "paises", codigos: ["NI"] },
    idiomas: ["Español"],
    temas: ["oficios", "técnico", "agropecuario", "industria", "construcción", "comercio", "servicios", "inglés", "mecánica"],
    certificado: "no_consta",
    volumen: "79 carreras técnicas en 73 centros (oferta de 2026)",
    requisitos:
      "Tener 14 años cumplidos y cédula o partida de nacimiento, foto tamaño carné y el diploma o certificado de notas. Las carreras piden noveno grado o bachillerato según el nivel.",
    aviso:
      "Las carreras técnicas van por matrícula una o dos veces al año; la de 2026 abrió el 6 de enero. Los cursos cortos de capacitación salen por programas y por municipio: búscalos en la web por departamento.",
    fuentes: [
      { titulo: "Oferta Formativa 2026 de Educación Técnica — Tecnológico Nacional (6 nov 2025)", url: "https://www.tecnacional.edu.ni/noticias/oferta-formativa-2026-de-educacion-tecnica-decidite-por-un-futuro-de-oportunidades/" },
      { titulo: "Educación técnica: carreras y requisitos — Tecnológico Nacional", url: "https://tecnacional.edu.ni/educacion-tecnica/" },
    ],
    actualizado: "2026-11",
  },

  // ── India y Sudáfrica (comprobadas el 6 nov 2026) ──
  // Skill India Digital Hub NO entra todavía: su web no se deja leer y las
  // notas del PIB no dicen si los cursos son gratis. Sin precio comprobado, no
  // se publica.
  {
    id: "swayam",
    nombre: "SWAYAM (Ministerio de Educación de India)",
    resumen:
      "Cursos en línea gratis de universidades e institutos públicos de India, desde secundaria hasta posgrado.",
    url: "https://swayam.gov.in/",
    alcance: { tipo: "paises", codigos: ["IN"] },
    idiomas: ["Inglés"],
    temas: ["ingeniería", "informática", "gestión", "comercio", "derecho", "salud", "diseño", "humanidades"],
    certificado: "si",
    aviso:
      "Los cursos son gratis, pero el certificado no: hay que apuntarse a un examen presencial de pago, en un centro y en fecha fija.",
    fuentes: [
      { titulo: "About SWAYAM — Ministerio de Educación de India", url: "https://swayam.gov.in/about" },
    ],
    actualizado: "2026-11",
  },
  {
    id: "nemisa",
    nombre: "NEMISA (National Electronic Media Institute of South Africa)",
    resumen:
      "Instituto público de Sudáfrica para habilidades digitales y de medios: la mayoría de sus cursos son gratis, y muchos se hacen en línea.",
    url: "https://www.nemisa.co.za/",
    alcance: { tipo: "paises", codigos: ["ZA"] },
    idiomas: ["Inglés"],
    temas: ["habilidades digitales", "informática", "radio", "televisión y cine", "animación", "diseño"],
    certificado: "no_consta",
    requisitos: "Pensado para quien vive en Sudáfrica: para apuntarte piden copia del documento de identidad, notas y justificante de domicilio.",
    aviso:
      "Da prioridad a jóvenes, mujeres, personas con discapacidad y zonas rurales. Dice que sus cursos están acreditados; si necesitas el certificado, confírmalo en cada curso.",
    fuentes: [
      { titulo: "NEMISA — preguntas frecuentes de su web", url: "https://www.nemisa.co.za/" },
    ],
    actualizado: "2026-11",
  },

  {
    id: "santander-open-academy",
    nombre: "Santander Open Academy",
    resumen:
      "Más de mil cursos y becas gratis. No hace falta ser cliente del banco ni estudiante de nada.",
    url: "https://app.santanderopenacademy.com/program/search",
    alcance: { tipo: "global" },
    idiomas: ["Español", "Inglés", "Portugués"],
    temas: [
      "idiomas", "inglés", "informática", "ofimática", "excel", "tecnología",
      "programación", "marketing", "negocios", "finanzas", "liderazgo",
      "comunicación", "habilidades profesionales", "sostenibilidad",
    ],
    certificado: "no_consta",
    volumen: "Más de 1.000 cursos, contenidos y becas",
    aviso:
      "Ellos mismos dicen que es gratis y sin ser cliente. Lo que no dicen en la página de inicio es si dan certificado; míralo en cada curso antes de empezar si lo necesitas para enseñárselo a una empresa.",
    fuentes: [
      {
        titulo: "Santander Open Academy — plataforma gratuita de Banco Santander",
        url: "https://www.santanderopenacademy.com/es/index.html",
      },
    ],
    actualizado: "2026-08",
  },
  {
    id: "eu-academy",
    nombre: "EU Academy",
    resumen:
      "La plataforma de formación de la propia Unión Europea. Gratis y en más de 30 idiomas.",
    url: "https://academy.europa.eu/courses/",
    alcance: { tipo: "ue" },
    idiomas: [
      "Español", "Inglés", "Francés", "Alemán", "Italiano", "Portugués",
      "Neerlandés", "Polaco", "y más de 20 idiomas",
    ],
    temas: [
      "agricultura", "digital", "tecnología", "datos", "energía", "medio ambiente",
      "educación", "derecho", "migración", "integración", "transporte", "idiomas",
    ],
    certificado: "no_consta",
    aviso:
      "Es formación institucional de la UE: muy útil para lo digital, lo agrario y todo lo relacionado con moverse por Europa. No esperes aquí un curso de camarero.",
    fuentes: [
      { titulo: "EU Academy — plataforma oficial de la Unión Europea", url: "https://academy.europa.eu/" },
    ],
    actualizado: "2026-08",
  },
  {
    id: "grow-with-google",
    nombre: "Google — Actívate / Grow with Google",
    resumen:
      "29 cursos gratis de lo digital: marketing, programación, nube, productividad y búsqueda de empleo.",
    url: "https://grow.google/intl/es/courses-and-tools/?category=career&type=online-courses",
    alcance: { tipo: "global" },
    idiomas: ["Español", "Inglés"],
    temas: [
      "marketing digital", "programación", "cloud", "nube", "comercio electrónico",
      "ciberseguridad", "productividad", "ofimática", "competencias digitales",
      "inteligencia artificial", "hablar en público", "buscar trabajo",
    ],
    certificado: "no_consta",
    volumen: "29 cursos gratuitos en español",
    aviso:
      "Google reorganizó Actívate y ahora los cursos viven dentro de Skillshop y Grow with Google. Si buscas el certificado antiguo de Actívate, comprueba en cada curso qué acredita hoy: la validación de los certificados antiguos no está garantizada.",
    fuentes: [
      {
        titulo: "Grow with Google — catálogo de cursos gratuitos en español",
        url: "https://grow.google/intl/es/courses-and-tools/?category=career&type=online-courses",
      },
    ],
    actualizado: "2026-08",
  },

  // ─── Añadidas el 2026-10-08, abiertas y comprobadas en su web oficial ─────

  {
    id: "fundae-buscador",
    nombre: "FUNDAE — buscador oficial de cursos",
    resumen:
      "El buscador de la fundación estatal de formación para el empleo: cursos subvencionados para gente en paro y para gente que trabaja.",
    url: "https://experienciafundae.es/buscador",
    alcance: { tipo: "paises", codigos: ["ES"] },
    idiomas: ["Español"],
    temas: [
      "subvencionado", "desempleados", "paro", "trabajadores", "ocupados", "certificado de profesionalidad",
      "hostelería", "logística", "administración", "comercio", "sanidad", "informática", "idiomas",
    ],
    certificado: "no_consta",
    requisitos: "Para trabajadores y personas en paro residentes en España.",
    aviso:
      "Es la puerta para toda España, también donde no tenemos las plazas con fecha. Cada curso tiene sus requisitos y su centro: el certificado depende del curso, míralo antes de apuntarte.",
    fuentes: [
      { titulo: "FUNDAE — Trabajadores (enlaza al buscador de cursos)", url: "https://www.fundae.es/trabajadores" },
      { titulo: "Experiencia Fundae — buscador de cursos", url: "https://experienciafundae.es/buscador" },
    ],
    actualizado: "2026-10",
  },
  {
    id: "ibm-skillsbuild",
    nombre: "IBM SkillsBuild",
    resumen:
      "Formación gratis de IBM en español: inteligencia artificial, ciberseguridad, datos y competencias para el trabajo.",
    url: "https://skillsbuild.org/es",
    alcance: { tipo: "global" },
    idiomas: ["Español", "Inglés"],
    temas: [
      "inteligencia artificial", "IA", "ciberseguridad", "datos", "nube", "cloud",
      "competencias digitales", "tecnología", "informática",
    ],
    certificado: "si",
    aviso:
      "Ellos lo llaman \"títulos reconocidos en el sector\": son credenciales digitales de IBM, no títulos oficiales. Sirven para enseñar en el currículum lo que has aprendido.",
    fuentes: [
      { titulo: "IBM SkillsBuild — formación 100 % gratuita (página en español)", url: "https://skillsbuild.org/es" },
    ],
    actualizado: "2026-10",
  },
  {
    id: "cisco-netacad",
    nombre: "Cisco Networking Academy",
    resumen:
      "Cursos gratis de Cisco para empezar en informática: ciberseguridad, redes y programación, muchos en español.",
    url: "https://www.netacad.com/es",
    alcance: { tipo: "global" },
    idiomas: ["Español", "Inglés", "Portugués"],
    temas: [
      "ciberseguridad", "redes", "informática", "programación", "python", "tecnología",
      "competencias digitales",
    ],
    certificado: "no_consta",
    aviso:
      "Hay cursos de iniciación gratuitos, como Introducción a la Ciberseguridad. Si necesitas un papel al terminar, comprueba en cada curso qué dan antes de empezar.",
    fuentes: [
      {
        titulo: "Cisco Networking Academy — Introducción a la Ciberseguridad, curso gratuito en línea",
        url: "https://www.netacad.com/es/courses/introduction-to-cybersecurity",
      },
    ],
    actualizado: "2026-10",
  },
  {
    id: "dw-aprender-aleman",
    nombre: "DW — Aprender alemán gratis",
    resumen:
      "Cursos de alemán gratis de Deutsche Welle, del A1 al C1, con prueba de nivel y alemán para el trabajo.",
    url: "https://learngerman.dw.com/es/overview",
    alcance: { tipo: "global" },
    idiomas: ["Alemán", "explicaciones en español"],
    temas: [
      "alemán", "idiomas", "emigrar", "Alemania", "Austria", "Suiza", "trabajar en Alemania",
      "Nicos Weg", "alemán para el trabajo",
    ],
    certificado: "si",
    aviso:
      "Es la radiotelevisión pública alemana y no cobra nada. Lo que da al terminar no es un título oficial: para trabajar allí te pedirán un examen oficial (Goethe, telc…), y DW explica cuál.",
    fuentes: [
      { titulo: "DW Aprender alemán — cursos gratuitos de A1 a C1", url: "https://learngerman.dw.com/es/overview" },
    ],
    actualizado: "2026-10",
  },
];

// ─── Servicio público de empleo de cada país ────────────────────────────────
//
// Aquí es donde está lo subvencionado y lo presencial, que es lo que de verdad
// sirve para carretillero, soldadura o atención sociosanitaria. Cambia por país
// y muchas veces por región, así que lo que damos es la puerta oficial de
// entrada, no una lista de plazas que se quedaría vieja en una semana.

export interface ServicioEmpleo {
  pais: string;
  nombre: string;
  url: string;
  /** Qué se hace exactamente ahí. */
  queHacer: string;
  actualizado: string;
}

export const SERVICIOS_EMPLEO: ServicioEmpleo[] = [
  {
    pais: "ES",
    nombre: "SEPE — Formación para el empleo",
    url: "https://www.sepe.es/HomeSepe/Personas/formacion",
    queHacer:
      "Buscar cursos gratuitos para trabajadores y desempleados. Los certificados de profesionalidad se piden aquí y en el servicio de empleo de tu comunidad.",
    actualizado: "2026-08",
  },
  {
    pais: "DE",
    nombre: "Bundesagentur für Arbeit — buscador de formación",
    url: "https://web.arbeitsagentur.de/weiterbildungssuche/",
    queHacer:
      "Buscador oficial alemán de cursos. Muchos se pagan con el Bildungsgutschein, un bono de formación que te da la agencia si cumples requisitos.",
    actualizado: "2026-08",
  },
  {
    pais: "FR",
    nombre: "Mon Compte Formation",
    url: "https://www.moncompteformation.gouv.fr/espace-prive/html/#/",
    queHacer:
      "En Francia cada trabajador acumula un saldo en euros para formarse. Se entra con identidad digital y se paga el curso con ese saldo.",
    actualizado: "2026-08",
  },
  {
    pais: "IT",
    nombre: "Cliclavoro",
    url: "https://www.cliclavoro.gov.it/",
    queHacer:
      "Portal público italiano de empleo y formación. Las plazas concretas las gestiona cada región.",
    actualizado: "2026-08",
  },
  {
    pais: "PT",
    nombre: "IEFP — Formação",
    url: "https://www.iefp.pt/formacao",
    queHacer:
      "Instituto público portugués de empleo y formación profesional. Cursos gratuitos y con certificado.",
    actualizado: "2026-08",
  },
  {
    pais: "NL",
    nombre: "UWV",
    url: "https://www.uwv.nl/particulieren",
    queHacer:
      "Organismo público neerlandés de empleo. Desde aquí se llega a las ayudas de formación y reorientación.",
    actualizado: "2026-08",
  },
  {
    // Era "GB" y la aplicación usa "UK" (lib/paises.ts): nunca llegaba a salir.
    pais: "UK",
    nombre: "National Careers Service",
    url: "https://nationalcareers.service.gov.uk/explore-careers",
    queHacer:
      "Servicio público británico de orientación. Explica qué se necesita para cada oficio y qué formación gratuita hay.",
    actualizado: "2026-08",
  },

  // ─── Añadidos el 2026-10-08: los 19 países de la app que no tenían ───────
  // Cada dirección se abrió ese día y respondía con la web oficial. El texto
  // dice solo lo que se ha comprobado; los detalles de cada curso los da el
  // propio servicio.
  {
    pais: "IE",
    nombre: "FET Course Hub (SOLAS)",
    url: "https://www.fetchcourses.ie/",
    queHacer:
      "El buscador oficial de cursos de formación profesional de Irlanda (Further Education and Training). Muchos son gratis; mira los requisitos de residencia de cada uno.",
    actualizado: "2026-10",
  },
  {
    pais: "PL",
    nombre: "Publiczne Służby Zatrudnienia",
    url: "https://psz.praca.gov.pl/",
    queHacer:
      "El portal de los servicios públicos de empleo de Polonia. Desde aquí se llega a la oficina de empleo de tu zona (urząd pracy), que es la que da los cursos.",
    actualizado: "2026-10",
  },
  {
    pais: "SE",
    nombre: "Arbetsförmedlingen",
    url: "https://arbetsformedlingen.se/",
    queHacer: "El servicio público de empleo de Suecia: ofertas, orientación y formación para el empleo.",
    actualizado: "2026-10",
  },
  {
    pais: "DK",
    nombre: "Jobnet",
    url: "https://www.jobnet.dk/",
    queHacer: "El portal público de empleo de Dinamarca. Desde aquí se llega al jobcenter de tu municipio, que lleva la formación.",
    actualizado: "2026-10",
  },
  {
    pais: "NO",
    nombre: "NAV",
    url: "https://www.nav.no/",
    queHacer: "El servicio público de empleo y prestaciones de Noruega: ofertas, orientación y cursos para el empleo.",
    actualizado: "2026-10",
  },
  {
    pais: "FI",
    nombre: "Työmarkkinatori",
    url: "https://tyomarkkinatori.fi/",
    queHacer: "El portal público de empleo de Finlandia: ofertas, servicios de empleo y formación para el empleo.",
    actualizado: "2026-10",
  },
  {
    pais: "BE",
    nombre: "Actiris (Bruselas)",
    url: "https://www.actiris.brussels/fr/citoyens/",
    queHacer:
      "En Bélgica cada región tiene el suyo: Actiris en Bruselas, VDAB en Flandes (vdab.be) y Le Forem en Valonia (leforem.be). Ahí están las ofertas y los cursos.",
    actualizado: "2026-10",
  },
  {
    pais: "AT",
    nombre: "AMS",
    url: "https://www.ams.at/",
    queHacer: "El servicio público de empleo de Austria (Arbeitsmarktservice): ofertas, orientación y cursos para quien busca trabajo.",
    actualizado: "2026-10",
  },
  {
    pais: "CH",
    nombre: "arbeit.swiss",
    url: "https://www.arbeit.swiss/",
    queHacer: "El portal oficial suizo del seguro de desempleo y de las oficinas públicas de empleo (RAV/ORP).",
    actualizado: "2026-10",
  },
  {
    pais: "GR",
    nombre: "DYPA",
    url: "https://www.dypa.gov.gr/",
    queHacer: "El servicio público de empleo de Grecia (antes OAED): ofertas, prestaciones y programas de formación.",
    actualizado: "2026-10",
  },
  {
    pais: "CZ",
    nombre: "Úřad práce ČR",
    url: "https://up.gov.cz/",
    queHacer: "La oficina pública de empleo de la República Checa: ofertas, prestaciones y recualificación.",
    actualizado: "2026-10",
  },
  {
    pais: "HU",
    nombre: "Nemzeti Foglalkoztatási Szolgálat",
    url: "https://nfsz.munka.hu/",
    queHacer: "El servicio nacional de empleo de Hungría: ofertas, orientación y formación.",
    actualizado: "2026-10",
  },
  {
    pais: "RO",
    nombre: "ANOFM",
    url: "https://www.anofm.ro/",
    queHacer: "La agencia nacional de empleo de Rumanía: ofertas y cursos de formación profesional gratuitos para quien está inscrito.",
    actualizado: "2026-10",
  },
  {
    pais: "US",
    nombre: "CareerOneStop",
    url: "https://www.careeronestop.org/FindTraining/find-training.aspx",
    queHacer:
      "Del Departamento de Trabajo de EE. UU. Tiene un buscador de centros y programas de formación por oficio y zona, y la red de American Job Centers.",
    actualizado: "2026-10",
  },
  {
    pais: "CA",
    nombre: "Job Bank",
    url: "https://www.jobbank.gc.ca/",
    queHacer: "El portal de empleo del Gobierno de Canadá: ofertas, salarios por oficio y orientación.",
    actualizado: "2026-10",
  },
  {
    pais: "AU",
    nombre: "Your Career",
    url: "https://www.yourcareer.gov.au/",
    queHacer:
      "Del Gobierno de Australia: compara cursos de formación profesional reconocidos y centros, y te dice qué formación pide cada oficio.",
    actualizado: "2026-10",
  },
  {
    pais: "NZ",
    nombre: "Tahatū Career Navigator",
    url: "https://tahatu.govt.nz/",
    queHacer:
      "De la Tertiary Education Commission de Nueva Zelanda (sustituye a careers.govt.nz): más de 4.000 cursos y titulaciones y qué centros los dan.",
    actualizado: "2026-10",
  },
  {
    pais: "JP",
    nombre: "Hello Work",
    url: "https://www.hellowork.mhlw.go.jp/",
    queHacer: "Las oficinas públicas de empleo de Japón (Ministerio de Sanidad, Trabajo y Bienestar). La web está en japonés.",
    actualizado: "2026-10",
  },
  {
    pais: "SG",
    nombre: "MySkillsFuture",
    url: "https://www.myskillsfuture.gov.sg/",
    queHacer:
      "El portal oficial de formación de Singapur. El crédito SkillsFuture para pagar cursos es para ciudadanos singapurenses; los cursos se pueden mirar igual.",
    actualizado: "2026-10",
  },
  {
    pais: "MX",
    nombre: "Portal del Empleo",
    url: "https://www.empleo.gob.mx/",
    queHacer:
      "Del Servicio Nacional de Empleo (Secretaría del Trabajo y Previsión Social): ofertas, ferias de empleo y orientación gratuita en todo México.",
    actualizado: "2026-11",
  },
  {
    pais: "BR",
    nombre: "Portal Emprega Brasil (SINE)",
    url: "https://empregabrasil.mte.gov.br/",
    queHacer:
      "Las ofertas de las agencias del SINE, el servicio público de empleo, con la cuenta gov.br. Las mismas salen en la app Carteira de Trabalho Digital, en «vagas de emprego».",
    actualizado: "2026-11",
  },
  // El resto de Latinoamérica (5 nov 2026). Se le enseñan a quien está allí,
  // porque de esos países todavía no tenemos ofertas. Venezuela no está: no
  // hemos encontrado una bolsa de empleo oficial que se pueda comprobar.
  // Revisado otra vez el 6 nov 2026: la LOTTT convirtió las agencias públicas
  // de empleo en «Centros de Encuentro para la Educación y el Trabajo»
  // (disposición transitoria quinta) y trabajo.gob.ve no responde. Nicaragua
  // tampoco: el Código del Trabajo (art. 16) manda tener un servicio público
  // de empleo (el SEPEM), pero mitrab.gob.ni no se abre desde fuera del país y
  // su última lista de vacantes archivada es de 2018. Sin comprobar que
  // funciona, no se publica.
  // Fuentes: Andina y dplnews (Perú); Publimetro y Noticias RCN (Colombia);
  // Los Andes y BAE Negocios (Argentina); ChileAtiende (Chile); instructivo
  // del Ministerio del Trabajo (Ecuador); gub.uy (Uruguay); MTSS y Delfino
  // (Costa Rica).
  {
    pais: "PE",
    nombre: "Empleos Perú",
    url: "https://www.empleosperu.gob.pe/",
    queHacer:
      "La bolsa de trabajo gratuita del Ministerio de Trabajo: te registras con tu DNI, haces tu CV y te postulas. El ministerio nunca contacta por WhatsApp ni Telegram.",
    actualizado: "2026-11",
  },
  {
    pais: "CO",
    nombre: "Servicio Público de Empleo",
    url: "https://www.serviciodeempleo.gov.co/",
    queHacer:
      "Junta en un buscador las vacantes de toda la red pública y autorizada (cajas de compensación, alcaldías, el SENA). Registras tu hoja de vida y te postulas gratis.",
    actualizado: "2026-11",
  },
  {
    pais: "AR",
    nombre: "Portal Empleo",
    url: "https://www.portalempleo.gob.ar/",
    queHacer:
      "De la Secretaría de Trabajo: subes tu CV, buscas ofertas y te postulas en línea, gratis. También da acceso a cursos.",
    actualizado: "2026-11",
  },
  {
    pais: "CL",
    nombre: "Bolsa Nacional de Empleo",
    url: "https://www.bne.cl/",
    queHacer:
      "La bolsa gratuita del Ministerio del Trabajo. Para registrarte hace falta tener 18 años y cédula chilena vigente; también se hace en ChileAtiende o en la OMIL de tu municipio.",
    actualizado: "2026-11",
  },
  {
    pais: "EC",
    nombre: "Encuentra Empleo",
    url: "https://encuentraempleo.trabajo.gob.ec/",
    queHacer:
      "La plataforma del Ministerio del Trabajo, con vacantes públicas y privadas: te registras con tu cédula, completas tu hoja de vida y te postulas.",
    actualizado: "2026-11",
  },
  {
    pais: "UY",
    nombre: "Vía Trabajo",
    url: "https://viatrabajo.mtss.gub.uy/",
    queHacer:
      "Del Ministerio de Trabajo, gratis: completas tu «Mi Perfil Laboral» y te postulas a ofertas. También en los Centros Públicos de Empleo de cada departamento.",
    actualizado: "2026-11",
  },
  {
    pais: "HN",
    nombre: "Servicio Nacional de Empleo de Honduras (SENAEH)",
    url: "https://www.trabajo.gob.hn/",
    queHacer:
      "De la Secretaría de Trabajo, gratis: bolsa electrónica de trabajo con vacantes por departamento y ferias de empleo.",
    actualizado: "2026-11",
  },
  {
    pais: "DO",
    nombre: "Servicio Nacional de Empleo (Ministerio de Trabajo)",
    url: "https://mt.gob.do/",
    queHacer:
      "Del Ministerio de Trabajo, gratis: bolsa de empleo «RD Trabaja», ferias y jornadas de empleo por todo el país. En 2025 registró 17.368 vacantes.",
    actualizado: "2026-11",
  },
  {
    pais: "PA",
    nombre: "Empleos Panamá (MITRADEL)",
    url: "https://www.empleospanama.gob.pa/",
    queHacer:
      "El portal de empleo del Ministerio de Trabajo, gratis: publica cada semana vacantes de empresas de todo el país. Ojo con los portales falsos que lo imitan.",
    actualizado: "2026-11",
  },
  {
    pais: "SV",
    nombre: "Lunes de Empleo (Ministerio de Trabajo)",
    url: "https://www.mtps.gob.sv/",
    queHacer:
      "No hay bolsa en línea: el Ministerio de Trabajo recoge currículums y ofrece vacantes cada lunes en sus 14 oficinas departamentales. Gratis.",
    actualizado: "2026-11",
  },
  {
    pais: "GT",
    nombre: "Tu Empleo (Servicio Nacional de Empleo)",
    url: "https://tuempleo.mintrabajo.gob.gt/",
    queHacer:
      "Del Ministerio de Trabajo, gratis: creas tu perfil y postulas en línea a las vacantes. También organiza ferias de empleo por todo el país.",
    actualizado: "2026-11",
  },
  {
    pais: "CR",
    nombre: "Agencia Nacional de Empleo",
    url: "https://www.ane.cr/",
    queHacer:
      "Del Ministerio de Trabajo y el INA, gratis: creas tu perfil, lo activas y ves las vacantes al momento.",
    actualizado: "2026-11",
  },
  // India y Sudáfrica (6 nov 2026). Fuentes: la portada del NCS (Ministerio
  // de Trabajo y Empleo de India) y la guía oficial de ESSA del Departamento
  // de Empleo y Trabajo de Sudáfrica.
  {
    pais: "IN",
    nombre: "National Career Service (NCS)",
    url: "https://www.ncs.gov.in/",
    queHacer:
      "Del Ministerio de Trabajo y Empleo de India, gratis: ofertas públicas y privadas, ferias de empleo y orientación. En noviembre de 2026 anunciaba unas 390.000 vacantes activas.",
    actualizado: "2026-11",
  },
  {
    pais: "ZA",
    nombre: "ESSA (Employment Services of South Africa)",
    url: "https://essa.labour.gov.za/EssaOnline/WebBeans/",
    queHacer:
      "La bolsa pública del Departamento de Empleo y Trabajo. Para registrarte en línea piden el número de identidad sudafricano; sin él, pregunta en un labour centre.",
    actualizado: "2026-11",
  },
];

// ─── Reconocer fuera lo que ya tienes ───────────────────────────────────────

export const EUROPASS = {
  nombre: "Europass",
  url: "https://europa.eu/europass/es",
  resumen:
    "Servicio oficial de la UE para hacer el CV europeo y, sobre todo, para saber si tu titulación vale en otro país.",
  actualizado: "2026-08",
};

// ─── Utilidades ─────────────────────────────────────────────────────────────

/** Las plataformas que sirven en un país dado. */
export function plataformasPorPais(pais: string): PlataformaFormacion[] {
  const UE = new Set([
    "ES", "DE", "FR", "IT", "PT", "NL", "BE", "AT", "IE", "PL", "SE", "DK",
    "FI", "CZ", "GR", "HU", "RO", "BG", "HR", "SK", "SI", "LT", "LV", "EE",
    "LU", "CY", "MT",
  ]);
  return PLATAFORMAS.filter(p => {
    if (p.alcance.tipo === "global") return true;
    if (p.alcance.tipo === "ue") return UE.has(pais);
    return p.alcance.codigos.includes(pais);
  });
}

export function servicioEmpleoDe(pais: string): ServicioEmpleo | undefined {
  return SERVICIOS_EMPLEO.find(s => s.pais === pais);
}
