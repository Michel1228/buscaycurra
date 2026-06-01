/**
 * /api/gusi/chat — Guzzi v4: asistente de empleo con contexto de CV real
 *
 * Cambio clave: el system prompt se construye dinámicamente inyectando
 * los datos reales del CV del usuario. Guzzi nunca pregunta lo que ya sabe.
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─── Prompt base ─────────────────────────────────────────────────────────────

const PROMPT_BASE = `[IDIOMA: ESPAÑOL OBLIGATORIO]
Tu idioma es el ESPAÑOL. Toda tu respuesta debe estar en español de España, sin excepción.
- Nunca mezcles idiomas. Ni una sola frase en inglés en la respuesta visible.
- Si el usuario escribe en inglés, respóndele en español.
- Esta instrucción tiene prioridad absoluta sobre cualquier otra.

Eres Guzzi 🐛, el asistente de empleo de BuscayCurra (plataforma GLOBAL de empleo con IA, 21 países, 3.000.000+ ofertas activas).

PERSONALIDAD:
- Natural y cercano, como un amigo que sabe mucho de empleo en Europa.
- Puedes charlar de cualquier tema, no solo de trabajo.
- Responde de forma conversacional — ni demasiado corto ni demasiado largo.
- Usa el emoji 🐛 con moderación, no en cada mensaje.
- Cuando des datos salariales o legales, cita la fuente brevemente (ej: "según el SMI 2025").

════════ CONOCIMIENTO DEL MERCADO LABORAL ESPAÑOL ════════

CONTRATOS Y DERECHOS:
- Tipos de contrato: indefinido, temporal (máx 6 meses), fijo-discontinuo, formación, ETT, obra y servicio
- SMI 2025: 1.184 €/mes brutos (16 pagas) = 14.208 €/año
- Finiquito: suma de: días de preaviso no dados, vacaciones no disfrutadas, parte proporcional de pagas extra
- Indemnización despido improcedente: 33 días/año trabajado (máx 24 mensualidades)
- SEPE (antiguo INEM): solicitar paro en los 15 días hábiles siguientes al despido. Necesitas: DNI, IBAN, certificado de empresa, historial laboral
- Prestación por desempleo: necesitas 360 días cotizados en los últimos 6 años. Cobras el 70% base reguladora los primeros 6 meses, luego 50%
- ERTE: empresa propone reducción jornada/suspensión. Trabajador cobra 70% base reguladora por el SEPE
- Período de prueba máximo: 6 meses técnicos/licenciados, 2 meses resto (excepto pymes: 3 meses indefinidos)
- Horas extras: máximo 80/año, voluntarias salvo convenio. Puedes cobrarlas o compensarlas con días libres

DERECHOS LABORALES CLAVE:
- Vacaciones: 30 días naturales/año (mínimo legal). No se pueden cambiar por dinero salvo al final del contrato
- Baja médica: primeros 3 días sin cobrar (salvo convenio), del 4º al 20º el 60% base reguladora, a partir del 21º el 75%
- Reducción de jornada: derecho por guarda de menor <12 años o familiar dependiente. Reducción del 12,5% al 50%
- Teletrabajo: si supera el 30% de la jornada en 3 meses, la empresa DEBE firmar acuerdo escrito

SECTORES CON MÁS DEMANDA EN ESPAÑA (2025):
- IT/Tech: developers (React, Python, Java), data engineers, ciberseguridad, DevOps — los más demandados y mejor pagados
- Salud: enfermería (1.800-2.500€), médicos (2.500-5.000€), auxiliares, fisioterapeutas — escasez crónica
- Logística/almacén: operarios, carretilleros, gestores de almacén — Amazon, Mercadona, DHL contratan masivo
- Hostelería/turismo: camareros, cocineros, recepcionistas — temporada alta brutal, muchos contratos fijos-discontinuos
- Construcción: electricistas, fontaneros, aparejadores — muy demandados en Madrid y Barcelona
- RRHH/administración: gestores, contables, técnicos de nóminas — salarios moderados pero estables

SALARIOS ORIENTATIVOS EN ESPAÑA (bruto/mes):
- Desarrollador junior: 1.600-2.200€ | Senior: 3.000-5.000€ | Tech Lead: 4.500-7.000€
- Comercial/ventas: 1.400-2.000€ fijo + comisiones | KAM: 2.500-4.000€
- Enfermero/a: 1.800-2.500€ | Médico: 2.500-5.000€ | Auxiliar enfermería: 1.200-1.600€
- Camarero/a: 1.200-1.500€ | Cocinero: 1.400-1.800€ | Jefe de cocina: 2.000-3.500€
- Transportista: 1.400-2.000€ | Carretillero: 1.300-1.700€
- Administrativo: 1.200-1.600€ | Contable: 1.800-2.800€
- Profesor particular/academia: 1.200-1.800€

════════ CONOCIMIENTO DEL MERCADO LABORAL EUROPEO ════════

PAÍSES TOP PARA EMIGRAR DESDE ESPAÑA:
- Alemania 🇩🇪: SMI 2.151€/mes. MUY demandado: ingenieros (3.500-6.000€), IT (3.000-6.000€), enfermeros (2.500-3.800€), cocineros (1.800-2.500€). Sin visado (UE). Idioma alemán imprescindible para sanidad/oficios, inglés suficiente en IT. Ciudades: Berlín, Múnich, Hamburgo, Fráncfort.
- Irlanda 🇮🇪: SMI 2.200€/mes. Tech hub de Europa (Google, Facebook, Apple tienen HQ). IT (3.500-7.000€), farmacéutica (3.000-5.000€), hostelería (1.900-2.400€). Inglés. Muy buen ambiente para españoles. Ciudades: Dublín, Cork, Galway.
- Países Bajos 🇳🇱: SMI 2.070€/mes. Logística (Amazon, DHL), IT (3.000-5.500€), agricultura (1.800-2.200€ + alojamiento a veces). Inglés suficiente en muchos trabajos. Ciudades: Amsterdam, Rotterdam, La Haya, Utrecht.
- Suecia 🇸🇪 / Noruega 🇳🇴 / Dinamarca 🇩🇰: Salarios muy altos (2.500-4.500€/mes neto), pero alto coste de vida. Construcción, IT, salud, oil & gas (Noruega). Inglés aceptado en muchos sectores.
- Suiza 🇨🇭: Salarios altísimos (4.000-8.000 CHF/mes). Banca, farmacéutica, IT, hostelería de lujo. Coste de vida muy alto. Idiomas locales muy valorados.
- Francia 🇫🇷: SMI 1.802€/mes. Hostelería/turismo (especialmente París), aeronáutica (Airbus en Toulouse), construcción. Francés muy necesario. Ciudades: París, Lyon, Marsella.
- Portugal 🇵🇹: SMI 870€/mes (bajo pero vida más barata). Turismo, tecnología (Lisboa está creciendo mucho), construcción. Facilísimo para españoles — no necesitan adaptarse.
- Polonia 🇵🇱: SMI ~1.000€/mes. IT (Cracovia, Varsovia son hubs tecnológicos), manufactura, logística. Salarios bajos pero coste de vida muy bajo.
- Italia 🇮🇹: SMI ~1.200€/mes (sin ley de SMI fijo). Moda (Milán), turismo, gastronomía, automoción. Mucho trabajo negro en hostelería — ojo.
- Bélgica 🇧🇪: Bruselas, sede instituciones UE. Muchos trabajos en organismos europeos.
- Austria 🇦🇹: SMI ~1.700€/mes. Hostelería de montaña, IT, medicina. Alemán imprescindible.

PARA TRABAJAR EN LA UE SIENDO ESPAÑOL:
- NO necesitas visado. Eres ciudadano europeo.
- Sí necesitas: inscribirte en el registro de extranjeros del país (suele ser gratuito y fácil)
- Equivalente al NIF/NIE: A-nummer (Suecia), BSN (Países Bajos), Codice Fiscale (Italia), PPS Number (Irlanda), NIF (Portugal)
- Sanitaria: la tarjeta sanitaria europea cubre 3 meses. Después, dar de alta en el sistema del país
- El traslado: tener 3-6 meses de ahorros (mínimo 3.000-5.000€). Buscar alojamiento ANTES de llegar (pisos compartidos en Airbnb las primeras semanas)

FUERA DE LA UE — VISADOS:
- Estados Unidos 🇺🇸: H-1B (cualificados, lotería), L-1 (traslado empresa), O-1 (talento extraordinario), Working Holiday NO existe. Salarios: IT 6.000-15.000$/mes en Silicon Valley. Muy difícil sin patrocinador.
- Canadá 🇨🇦: Express Entry (puntos por idioma, edad, experiencia). Working Holiday Visa hasta 35 años. Salarios: 3.500-6.000 CAD/mes. Ciudades: Toronto, Vancouver, Montreal.
- Australia 🇦🇺: Working Holiday Visa (482) hasta 35 años — ¡muy fácil de conseguir! Salario mínimo 23 AUD/hora. Minería y construcción hasta 8.000 AUD/mes. Ciudades: Sydney, Melbourne, Perth, Brisbane.
- Nueva Zelanda 🇳🇿: Working Holiday Visa. Parecido a Australia pero más pequeño y tranquilo.
- Emiratos Árabes 🇦🇪: Sin impuestos sobre renta. Muy demandado en construcción, sanidad, hostelería de lujo. Necesitas contrato previo — la empresa te sponsorea el visado.

════════ ESTRATEGIAS DE BÚSQUEDA AVANZADA ════════

CV Y ATS (APPLICANT TRACKING SYSTEM):
- El 75% de los CVs son rechazados por software automático antes de que los vea un humano
- CV ATS-friendly: PDF limpio, sin tablas/columnas complejas, fuente Arial o Calibri, márgenes normales
- Palabras clave: copiar exactamente las del anuncio (el ATS hace match literal)
- Longitud: 1 página si <10 años experiencia, 2 páginas máximo si más
- Foto: obligatoria en España y Alemania, no recomendada en UK/USA
- Formato fecha: mes/año (ej: 03/2022 – 09/2024), no "2022-2024"
- El error más común: poner las habilidades antes que la experiencia laboral

LINKEDIN — OPTIMIZACIÓN:
- Foto profesional: fondo neutro, ropa de trabajo, sonrisa natural. Una buena foto = 14x más visitas al perfil
- Headline (eslogan): no pongas tu cargo actual. Pon: "[Puesto] | Especialista en [X] | Abierto a nuevas oportunidades"
- URL personalizada: linkedin.com/in/tu-nombre (mejora el SEO)
- Sección "Sobre mí": 3-5 líneas sobre qué haces, qué te diferencia y qué buscas. Incluye palabras clave del sector
- Conexiones: conecta con al menos 50 personas de tu sector. Los reclutadores buscan por palabras clave + conexiones
- "Open to Work": activalo. Configúralo para que solo lo vean reclutadores (no tu empresa actual) si es tu caso
- Recomendaciones: pide al menos 2-3. Valen más que todos los cursos del mundo
- Publicar contenido: 1-2 posts/semana aumenta visibilidad x10 con reclutadores

ENTREVISTAS — MÉTODO STAR:
- Situación: describe el contexto ("Trabajaba en X empresa, en el equipo de Y")
- Tarea: cuál era tu responsabilidad ("Me encargué de...")
- Acción: qué hiciste exactamente ("Implementé...", "Coordiné...", "Reduje...")
- Resultado: logro cuantificable ("Aumenté ventas un 20%", "Reducí tiempo de proceso en 3 horas/semana")
- Preguntas trampa comunes:
  * "¿Cuál es tu mayor debilidad?" → nombra UNA real pero que no afecte al puesto, y di cómo la estás mejorando
  * "¿Dónde te ves en 5 años?" → alineado con la empresa, con ganas de crecer dentro
  * "¿Por qué te fuiste de tu último trabajo?" → NUNCA hablar mal del ex-jefe. Siempre buscar oportunidades nuevas
  * "¿Cuál es tu expectativa salarial?" → investiga el rango ANTES e indica una horquilla (ver negociación abajo)

NEGOCIACIÓN SALARIAL — GUIÓN:
1. Investiga el rango del mercado (Glassdoor, LinkedIn Salary, Infojobs Salarios, Nuestros datos en BuscayCurra)
2. Pide siempre un 15-20% más de lo que quieres (te van a bajar)
3. Cuando pregunten expectativa: "Basándome en el mercado y mi experiencia, busco entre X€ y Y€. Estoy abierto a hablar si hay otros beneficios"
4. Si dicen "es lo máximo": "¿Hay posibilidad de revisar en 6 meses según objetivos? ¿Hay bonus/variable?"
5. NO aceptes la primera oferta verbal — pide 24-48h para "pensar lo" aunque lo tengas claro
6. Beneficios negociables además del salario: días de teletrabajo, horario flexible, formación pagada, días extra de vacaciones, coche de empresa, ticket restaurante

GAPS EN EL CV — CÓMO MANEJARLOS:
- Un gap de <6 meses: ni lo menciones si no te preguntan
- Gap de 6-18 meses: prepara una frase honesta y breve ("Tomé un tiempo para cuidar a un familiar / viaje personal / formación / proyecto freelance")
- Gap de >18 meses: menciona qué hiciste durante ese tiempo (voluntariado, cursos, proyecto propio, etc.)
- En la entrevista: sé directo, no te disculpes, enfócate en el presente ("Hoy estoy 100% disponible y motivado para...")
- El gap no elimina tu candidatura — tu actitud al explicarlo sí puede eliminarte

PARO Y TRÁMITES LEGALES:
- Tramitar el paro (prestación por desempleo):
  1. Solicitar cita en el SEPE (sepe.es) o en tu oficina de empleo más cercana
  2. Necesitas: DNI/NIE, IBAN bancario, certificado de empresa (te lo da tu empleador), vida laboral (sepe.es o Seguridad Social)
  3. Plazo: 15 días hábiles desde el cese. Si te pasas, pierdes días de prestación
  4. La prestación dura: 2-6 meses si cotizaste 1-2 años, hasta 2 años si cotizaste 6+ años
- Subsidio por desempleo: si no tienes derecho a prestación (cotizaste <360 días), puedes pedir subsidio (~570€/mes)
- Autónomo: puedes "compatibilizar" los primeros 9 meses de paro si te haces autónomo. Preguntar en el SEPE

SECTOR IT — KEYWORDS PARA ATS Y CV:
- Frontend: React, Vue, Angular, TypeScript, Next.js, Tailwind, HTML/CSS
- Backend: Node.js, Python (Django, FastAPI), Java (Spring), PHP (Laravel), Go, Rust
- Data: SQL, Python, Pandas, Spark, Tableau, PowerBI, BigQuery, Snowflake
- DevOps/Cloud: Docker, Kubernetes, AWS, Azure, GCP, CI/CD, Terraform, GitHub Actions
- Móvil: React Native, Flutter, iOS (Swift), Android (Kotlin)
- Seguridad: pentesting, OWASP, ISO 27001, SIEM, SOC

AU PAIR — INFORMACIÓN ESPECÍFICA:
- Qué es: cuidar niños en el extranjero a cambio de alojamiento, comida y paga de bolsillo (200-400€/semana)
- Requisitos habituales: 18-30 años, sin hijos, soltero/a, sin antecedentes
- Paga de bolsillo: Alemania 260€/sem, Francia 80€/sem + Metro, USA 200$/sem, Australia 200AUD/sem
- Horas de trabajo: máximo 30-45h/semana según país
- Plataformas: AuPairWorld, Au Pair in America, GreatAuPair, Cultural Care
- Beneficios: idioma, experiencia, conocer mundo, muchas familias pagan cursos de idioma
- En BuscayCurra: tienes sección /app/au-pair para crear tu carta "Dear Family" y perfil profesional

════════ CAPACIDADES DE GUZZI (menciona cuando sean relevantes) ════════
1. 🔍 Buscar ofertas → búsqueda en BD + APIs de 21 países según lo que pides
2. 📧 Enviar CV automático → la función estrella: Guzzi envía tu CV adaptado por ti
3. ✨ Mejorar el CV → reescribe con verbos de acción, logros cuantificables, ATS-optimizado
4. 🎯 Preparar entrevistas → ficha de empresa + preguntas + qué resaltar de tu perfil
5. ✉️ Carta de presentación → personalizada para cada empresa con tus datos reales
6. 💰 Orientación salarial → rangos reales del mercado según puesto, experiencia y país
7. 📋 Plan de búsqueda personalizado → según perfil, país objetivo y urgencia
8. 📊 Skill Gap → pega una oferta y te digo qué tienes, qué te falta y cómo conseguirlo
9. 💼 Negociación salarial → guión real con datos del mercado ("prepárame para negociar")
10. 🌍 Guía de emigración → salarios, requisitos, visados, ciudades para tu sector específico
11. 🔗 LinkedIn Optimizer → cómo optimizar tu perfil para que los reclutadores te encuentren
12. 📝 Gestión del paro → cómo tramitar el SEPE, finiquito, derechos laborales
13. 👶 Perfil Au Pair → ayuda con tu carta "Dear Family" y búsqueda internacional
14. 💬 Charlar → sobre cualquier tema, soy tu amigo

CUANDO USES EL CV DEL USUARIO:
- Si tienes sus datos, úsalos directamente — nunca preguntes lo que ya sabes.
- Si dice "busco trabajo de CAMARERO" → busca camarero, NO su puesto del CV.
- Solo usa el puesto del CV si el usuario no especifica qué tipo de trabajo busca.
- Adapta siempre los consejos a su perfil real.

RECUERDA: SIEMPRE en español. Esta es la regla número uno.`;

// ─── Prompts especializados ───────────────────────────────────────────────────

const PROMPT_ENTREVISTA = `IDIOMA OBLIGATORIO: ESPAÑOL. Nunca respondas en inglés.

Eres Guzzi, coach de entrevistas de BuscayCurra. SIEMPRE en español.
Genera una ficha de preparación con estas 4 secciones:

**1. Lo que valora [empresa]**
3-4 puntos sobre cultura, valores y perfil buscado. Si no conoces la empresa, usa el sector.

**2. Preguntas que te pueden hacer**
3 preguntas típicas con pista breve de cómo responder.

**3. Qué resaltar de tu perfil**
Si tienes CV: 2-3 puntos concretos de experiencia o habilidades que encajan.
Sin CV: consejos generales del puesto.

**4. Ánimo**
Un mensaje corto, sincero y cálido.

Formato markdown. Tono: mentor cercano. Emojis con moderación.`;

const PROMPT_CV_MEJORADO = `IDIOMA OBLIGATORIO: ESPAÑOL. Nunca respondas en inglés.

Eres un experto en RRHH y redacción de CVs. SIEMPRE en español.
Mejora el CV usando los datos reales que te dan. Estructura OBLIGATORIA:

# [Nombre Completo]
📞 [Teléfono] | ✉ [Email] | 📍 [Ciudad]

## 🎯 Perfil Profesional
[2-3 frases impactantes. Años de experiencia + fortalezas + sector]

## 💼 Experiencia Laboral
### [Puesto] — [Empresa] | [Fechas]
- [Logro cuantificable con verbo de acción]
- [Logro cuantificable]

## 🎓 Formación
- [Título] — [Centro] | [Año]

## 🛠️ Habilidades
[Habilidades por orden de relevancia, separadas por comas]

## 🌍 Idiomas
- [Idioma]: [Nivel]

REGLAS: verbos de acción (Gestioné, Coordiné, Optimicé...), cuantifica siempre,
adapta perfil al sector, NO inventes datos, usa [PENDIENTE] si falta algo.`;

const PROMPT_CARTA = `IDIOMA OBLIGATORIO: ESPAÑOL. Nunca respondas en inglés.

Eres experto en cartas de presentación. SIEMPRE en español.
Genera una carta personalizada (máx 250 palabras).

[CIUDAD], [FECHA]

Estimado/a responsable de selección de [EMPRESA]:

[Párrafo de presentación con experiencia y por qué encaja en ESTA empresa concreta]

[Párrafo de valor: qué aporta, logros cuantificables, habilidades clave]

Quedo a su disposición para una entrevista.

Atentamente,
[NOMBRE]
📞 [TELÉFONO] · ✉ [EMAIL]

REGLAS: menciona la empresa mínimo 3 veces, tono adaptado al sector (formal para banca,
cercano para startups), NO inventes datos.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function analyzeCVDensity(cvData: string): { isSparse: boolean; isRich: boolean } {
  try {
    const cv = JSON.parse(cvData);
    let wordCount = 0;
    let sectionsFilled = 0;

    const textFields = ["perfilProfesional", "aptitudes", "subtitulo", "habilidades", "idiomas", "formacion"];
    textFields.forEach(f => {
      const val = cv[f];
      if (val && String(val).trim().length > 5) {
        wordCount += String(val).split(/\s+/).length;
        sectionsFilled++;
      }
    });

    if (Array.isArray(cv.experiencia)) {
      cv.experiencia.forEach((e: Record<string, unknown>) => {
        sectionsFilled++;
        if (e.descripcion) wordCount += String(e.descripcion).split(/\s+/).length;
      });
    }

    return {
      isSparse: wordCount < 80 || sectionsFilled < 3,
      isRich: wordCount > 300 && sectionsFilled >= 5,
    };
  } catch {
    return { isSparse: true, isRich: false };
  }
}

function parseStringList(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return (val as unknown[]).map(v => typeof v === "object" ? (v as { nombre?: string }).nombre || "" : String(v)).filter(Boolean);
  return String(val).split(/[,\n]/).map(s => s.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
}

interface CVParsed {
  nombre: string;
  ciudad: string;
  ultimoPuesto: string;
  ultimaEmpresa: string;
  sector: string;
  habilidades: string;
  resumenTexto: string;
}

function parseCVData(raw: string): CVParsed | null {
  try {
    const cv = JSON.parse(raw);
    const nombre = String(cv.nombre || cv.full_name || "").trim();
    const ciudad = String(cv.ciudad || cv.location || "").trim();
    const sector = String(cv.sector || "").trim();

    let ultimoPuesto = "";
    let ultimaEmpresa = "";
    const exp = cv.experiencia || cv.experience;

    if (Array.isArray(exp) && exp.length > 0) {
      // Ordenar por año descendente (más reciente primero) para coger el último puesto real
      const expOrdenada = [...exp].sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const getYear = (f: string) => { const m = String(f || "").match(/(\d{4})/g); return m ? parseInt(m[m.length - 1]) : 0; };
        return getYear(String(b.fechas || "")) - getYear(String(a.fechas || ""));
      });
      const e0 = expOrdenada[0] as { puesto?: string; empresa?: string; descripcion?: string };
      ultimoPuesto = e0.puesto || "";
      ultimaEmpresa = e0.empresa || "";
    } else if (typeof exp === "string" && exp.trim()) {
      // "2020-2023 — Camarero en Bar La Plaza (Madrid)"
      const m = exp.match(/(?:—|–|-)\s*(.+?)\s+en\s+(.+?)(?:\s*[\n(]|$)/i);
      ultimoPuesto = m?.[1]?.trim() || "";
      ultimaEmpresa = m?.[2]?.trim() || "";
    }

    const habilidades = parseStringList(cv.aptitudes || cv.habilidades || cv.skills).slice(0, 5).join(", ");

    const resumenTexto = [
      nombre && `Nombre: ${nombre}`,
      ciudad && `Ciudad: ${ciudad}`,
      ultimoPuesto && `Último puesto: ${ultimoPuesto}`,
      ultimaEmpresa && `Última empresa: ${ultimaEmpresa}`,
      sector && `Sector: ${sector}`,
      habilidades && `Habilidades: ${habilidades}`,
    ].filter(Boolean).join("\n");

    return { nombre, ciudad, ultimoPuesto, ultimaEmpresa, sector, habilidades, resumenTexto };
  } catch {
    return null;
  }
}

function buildSystemPrompt(cvData?: string, pais?: string): string {
  const paisInfo = pais && pais !== "ES"
    ? `\nEl usuario está buscando trabajo en ${pais}. Adapta tus consejos al mercado laboral de ese país (salarios, requisitos, idioma).\n`
    : "";

  if (!cvData) return PROMPT_BASE + paisInfo;

  const cv = parseCVData(cvData);
  if (!cv || !cv.resumenTexto) return PROMPT_BASE + paisInfo;

  return `${PROMPT_BASE}${paisInfo}

━━━ DATOS REALES DEL CV DEL USUARIO (usa esto en TODAS tus respuestas) ━━━
${cv.resumenTexto}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cuando el usuario pregunte qué trabajo buscar → sugiérele ofertas de "${cv.ultimoPuesto || cv.sector || "su sector"}" en "${cv.ciudad || "su zona"}".
Cuando mejores el CV → usa exactamente los datos de arriba, no los inventes.
Cuando generes una carta → pon el nombre "${cv.nombre}" y la ciudad "${cv.ciudad}" reales.`;
}

function detectIntent(text: string): string {
  const t = text.toLowerCase();
  if (/(mejorar|mejora|optimizar|reescrib).*(cv|curriculum)|(cv|curriculum).*(mejorar|mejorado|profesional|limpio)/.test(t)) return "cv_mejorado";
  if (/(carta.*(recomendaci|presentaci|para\s+\w)|presentaci.*carta)/.test(t)) return "carta_recomendacion";
  if (/(busco|buscar|necesito|quiero).*(trabajo|empleo|oferta|puesto)|(trabajo|empleo).*(busco|buscar|hay)/.test(t)) return "buscar";
  if (/(envi|manda|submit).*(cv|candidatura)|cv.*(envi|manda|automátic)/.test(t)) return "enviar";
  if (/foto|imagen\s+cv|foto.*cv/.test(t)) return "foto";
  if (/(preparar|practicar|simul).*(entrevista)|entrevista.*(preparar|practica)/.test(t)) return "entrevista_prep";
  if (/(crear|hacer|nuevo).*(cv|curriculum)/.test(t)) return "crear_cv";
  if (/(info|informacion|datos|busca|conoce|saber|dime).*(sobre\s+)?(la\s+)?empresa\s+\w|(qué|quien)\s+(es|conoces)\s+\w+\s*(empresa)?/.test(t)) return "info_empresa";
  return "chat";
}

async function searchJobsReal(query: string, city: string, limit = 5, countryCode = "ES") {
  try {
    // Mapear código de país a nombre para búsqueda
    const countryMap: Record<string, string> = {
      ES: "spain", DE: "germany", FR: "france", IT: "italy", PT: "portugal",
      GB: "united kingdom", UK: "united kingdom", US: "united states", CA: "canada",
      AU: "australia", NL: "netherlands", SE: "sweden", CH: "switzerland",
      BE: "belgium", IE: "ireland", NO: "norway", DK: "denmark", AT: "austria",
      FI: "finland", NZ: "new zealand", PL: "poland",
    };
    const countryName = countryMap[countryCode?.toUpperCase()] || "spain";

    // ── PRIMERO: consultar la BD local ──
    const { getPool } = await import("@/lib/db");
    const pool = getPool();
    
    const cityPattern = city ? `%${city.toLowerCase()}%` : "%";
    const keywordPattern = `%${query.toLowerCase()}%`;
    
    const dbResult = await pool.query(
      `SELECT id, title, company, city, province, salary, description, \"sourceName\", \"sourceUrl\", \"scrapedAt\"
       FROM \"JobListing\"
       WHERE LOWER(title) LIKE $1
         AND (LOWER(city) LIKE $2 OR LOWER(province) LIKE $2)
         AND (LOWER(country) LIKE $3 OR country IS NULL)
       ORDER BY scrapedat DESC
       LIMIT $4`,
      [keywordPattern, cityPattern, `%${countryName}%`, Math.min(limit * 2, 30)]
    );
    
    if (dbResult.rows.length > 0) {
      console.log(`[Guzzi] BD local: ${dbResult.rows.length} ofertas para "${query}" en "${city}"`);
      return dbResult.rows.slice(0, limit).map((j: Record<string, unknown>) => ({
        id: `db-${j.id}`,
        titulo: j.title as string,
        empresa: (j.company as string) || "Ver en oferta",
        ubicacion: (j.city || j.province || city) as string,
        salario: (j.salary as string) || "Ver en oferta",
        fuente: (j.sourceName as string) || "BuscayCurra",
        url: (j.sourceUrl as string) || "",
        match: 65,
      }));
    }
    
    // ── FALLBACK: APIs externas (Jooble, Adzuna, Careerjet) ──
    console.log(`[Guzzi] Sin resultados en BD local, buscando en APIs externas...`);
    const { buscarOfertasReales } = await import("@/lib/job-search/real-search");
    const ofertas = await Promise.race([
      buscarOfertasReales(query, city, Math.min(limit * 2, 20)),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    
    if (!ofertas) {
      console.log(`[Guzzi] Timeout APIs externas (8s)`);
      return null;
    }
    
    return ofertas.slice(0, limit).map(o => ({
      id: o.id,
      titulo: o.titulo,
      empresa: o.empresa,
      ubicacion: o.ubicacion,
      salario: o.salario,
      fuente: o.fuente,
      match: o.match,
      url: o.url,
    }));
  } catch (e) {
    console.error("[Guzzi] Error en searchJobsReal:", (e as Error).message);
    return null;
  }
}

function fallbackMessage(puesto: string, ciudad: string): string {
  return `🔍 No encontré ofertas activas ahora mismo para **${puesto}**${ciudad ? ` en **${ciudad}**` : ""}.\n\nPuedes:\n• 🔄 Pedirme que busque con otras palabras\n• 📍 Probar otra ciudad\n• 📧 Usar el botón de abajo para búsqueda automática\n\n🐛 ¡No te desanimes! El mercado se mueve a diario.`;
}

function buildJobsText(puesto: string, ciudad: string, ofertas: unknown[]): string {
  let text = `🔍 **${ofertas.length} ofertas** de **${puesto}**${ciudad ? ` en **${ciudad}**` : ""}:\n\n`;
  (ofertas as Array<{ titulo?: string; empresa?: string; ubicacion?: string; salario?: string; match?: number }>)
    .forEach((o, i) => {
      const em = ["🥇", "🥈", "🥉", "📌"][i] || "📌";
      text += `${em} **${o.titulo}**\n   📍 ${o.ubicacion} · 💰 ${o.salario || "Ver oferta"}\n\n`;
    });
  text += `📧 **¿Envío tu CV a todas?** Di "sí" y me encargo. O usa el botón en cada oferta del buscador. 🐛`;
  return text;
}

function extractCompanyName(text: string): string | null {
  const patterns = [
    /empresa\s+[""]?(\w[\w\s]{2,40}?)[""]?\s*(?:es|tiene|ofrece|busca|contrata|$)/i,
    /(?:info|información|datos)\s+(?:sobre\s+)?(?:la\s+)?empresa\s+[""]?([\w\s]{2,40}?)[""]?$/i,
    /(?:qué|quien|quién)\s+(?:es|conoces)\s+(?:a\s+)?[""]?([\w\s]{2,40}?)[""]?\s*(?:empresa)?/i,
    /(?:busca|conoce[sr]?|sabes?\s+(?:algo\s+)?(?:de|sobre))\s+(?:la\s+)?(?:empresa\s+)?[""]?([\w\s]{2,40}?)[""]?\s*(?:empresa)?/i,
    /dime\s+(?:algo\s+)?(?:de|sobre)\s+(?:la\s+)?(?:empresa\s+)?[""]?([\w\s]{2,40}?)[""]?/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].trim();
  }
  // Fallback: si el texto es corto y parece nombre de empresa
  const clean = text.replace(/^(?:busca|info|información|datos|dime|conoce|saber)\s+(?:sobre\s+)?(?:la\s+)?(?:empresa\s+)?/i, "").trim();
  if (clean.length >= 3 && clean.length <= 50 && !/(?:trabajo|empleo|cv|curriculum|oferta|buscar)/i.test(clean)) {
    return clean;
  }
  return null;
}

function localReply(intent: string, cv?: CVParsed | null): string {
  switch (intent) {
    case "foto":
      return "📸 **Cómo mejorar tu foto de CV con IA:**\n\nSube tu foto a ChatGPT (o cualquier IA con imagen) y usa este prompt:\n\n---\n*Utiliza esta foto para realizar los siguientes cambios:\n\n1. Crear un fondo blanco y cambiar todo el fondo actual.\n2. Cambiar la camiseta por una camisa blanca.\n3. Poner la figura en posición sentada.\n\nFotografía tamaño carnet hasta la altura de los hombros. Preséntalo para un currículum.*\n\n---\n\n**Resultado:** foto profesional lista para el CV. Una buena foto = +40% más respuestas. 🐛";
    case "buscar":
      if (cv?.ultimoPuesto) {
        return `🔍 Conozco tu perfil (**${cv.ultimoPuesto}**${cv.ciudad ? ` en **${cv.ciudad}**` : ""}). Dime "buscar ofertas" y te muestro las que mejor encajan ahora mismo. También puedes usar el buscador avanzado. 🐛`;
      }
      return "🔍 Dime qué trabajo buscas y en qué ciudad o país, y te busco las mejores ofertas en toda Europa. 🐛";
    case "enviar":
      return cv?.ultimoPuesto
        ? `📧 Basándome en tu CV (${cv.ultimoPuesto}), busca en 🔍 Buscar y usa el botón "Enviar CV" en cada oferta.`
        : "📧 Sube tu CV primero (botón clip de abajo) y luego te busco ofertas que encajen.";
    case "crear_cv":
      return "📝 ¡Vamos! ¿Cuál es tu nombre completo? (Te pregunto de uno en uno, facilísimo) 🐛";
    default:
      return "🐛 Puedo ayudarte a buscar trabajo en España y Europa, mejorar tu CV, preparar entrevistas o generar una carta de presentación. ¿Qué necesitas?";
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message, history = [], mode = "chat",
      cvData: cvDataFromClient, empresa, puesto, userId, pais,
    } = body as {
      message: string;
      history?: Array<{ role: string; text: string }>;
      mode?: string;
      cvData?: string;
      empresa?: string;
      puesto?: string;
      userId?: string;
      pais?: string;
    };

    if (!message) return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });

    // Si hay userId, leer el CV fresco desde la BD (ignora el cvData del cliente)
    let cvData = cvDataFromClient;
    if (userId) {
      try {
        const { getPool } = await import("@/lib/db");
        const pool = getPool();
        const row = await pool.query(
          "SELECT form_data FROM user_cvs WHERE user_id = $1",
          [userId]
        );
        if (row.rows[0]?.form_data) {
          cvData = JSON.stringify(row.rows[0].form_data);
        }
      } catch {
        // Si falla la BD, usar el cvData del cliente como fallback
      }
    }

    const cvParsed = cvData ? parseCVData(cvData) : null;
    const groqKey = process.env.GROQ_API_KEY;

    async function callGroq(systemPrompt: string, userContent: string, maxTokens = 600) {
      if (!groqKey) return null;
      // /no_think desactiva el modo reasoning de Qwen3 → responde directamente en el idioma del sistema (español)
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen/qwen3-32b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "/no_think " + userContent },
          ],
          temperature: 0.6,
          max_tokens: maxTokens,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return null;
      const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      const raw = data.choices?.[0]?.message?.content || null;
      // Por si acaso aún aparecen bloques <think>...</think>, los eliminamos
      return raw ? raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() : null;
    }

    // ── Modo preparación de entrevista ───────────────────────────────────────
    if (mode === "prep_entrevista") {
      const ctx = cvData ? `Datos del candidato:\n${cvParsed?.resumenTexto || cvData.slice(0, 400)}` : "";
      const content = `Entrevista: "${message}". ${ctx}`;
      const reply = await callGroq(PROMPT_ENTREVISTA, content, 800) || localReply("entrevista_prep");
      return NextResponse.json({ reply });
    }

    // ── Modo CV mejorado ─────────────────────────────────────────────────────
    if (mode === "cv_mejorado" || detectIntent(message) === "cv_mejorado") {
      if (!cvData) {
        return NextResponse.json({
          reply: "📝 Para mejorar tu CV necesito tus datos. Súbelo en PDF (botón clip) o cuéntame tus datos aquí. 🐛",
          action: "need_cv_data",
        });
      }

      const density = analyzeCVDensity(cvData);
      let densityNote = "";
      let maxTokens = 1200;

      if (density.isSparse) {
        densityNote = `

INSTRUCCIÓN CRÍTICA — CV CON POCA INFORMACIÓN:
El candidato tiene poca experiencia o datos. NUNCA INVENTES información, pero SÍ:
- Elabora cada experiencia con 3-4 responsabilidades típicas del puesto (ej: "Camarero" → atención al cliente, gestión de pedidos, preparación de bebidas, trabajo en equipo bajo presión)
- Escribe el perfil profesional con 4-5 frases descriptivas, no solo 2
- Añade habilidades implícitas del sector aunque no las hayan mencionado (las que cualquiera con ese puesto tendría)
- Expande la sección de formación si hay datos
- Objetivo: que el CV parezca sólido y completo aunque la base sea escasa`;
        maxTokens = 1500;
      } else if (density.isRich) {
        densityNote = `

INSTRUCCIÓN CRÍTICA — CV CON MUCHA INFORMACIÓN:
El candidato tiene mucha experiencia.
- Selecciona y resume los 2-3 logros más relevantes por empresa
- Perfil profesional: máx 3 frases impactantes
- Prioriza lo más reciente y elimina redundancias`;
        maxTokens = 1000;
      }

      const promptConDensidad = PROMPT_CV_MEJORADO + densityNote;
      const content = `Mejora este CV con los datos reales que te doy:\n\n${cvData}`;
      const reply = await callGroq(promptConDensidad, content, maxTokens) || localReply("cv_mejorado");
      return NextResponse.json({ reply, action: "cv_mejorado" });
    }

    // ── Modo carta ───────────────────────────────────────────────────────────
    if (mode === "carta_recomendacion" || detectIntent(message) === "carta_recomendacion") {
      if (!empresa || !puesto) {
        return NextResponse.json({
          reply: "✉️ Para la carta necesito:\n1. 🏢 Nombre de la empresa\n2. 🎯 Puesto al que aplicas\n\nDime los dos y te la genero ahora. 🐛",
          action: "need_empresa_puesto",
        });
      }
      const ctx = cvData ? `Datos del candidato: ${cvParsed?.resumenTexto || cvData.slice(0, 400)}` : "";
      const content = `Empresa: ${empresa}. Puesto: ${puesto}. ${ctx}`;
      const reply = await callGroq(PROMPT_CARTA, content, 800) || localReply("carta_recomendacion");
      return NextResponse.json({ reply, action: "carta_recomendacion", empresa, puesto });
    }

    // ── Intent: info empresa (Google Places) ──────────────────────────────────
    const preIntent = detectIntent(message);
    if (preIntent === "info_empresa") {
      const companyName = extractCompanyName(message);
      if (!companyName) {
        return NextResponse.json({
          reply: "🏢 Dime el nombre de la empresa y te busco toda la información: email, teléfono, web, valoraciones... 🐛",
          action: "need_company_name",
        });
      }

      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://buscaycurra.es";
        const extractRes = await fetch(`${siteUrl}/api/company/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: companyName }),
          signal: AbortSignal.timeout(15000),
        });

        if (!extractRes.ok) {
          return NextResponse.json({
            reply: `🏢 No encontré información de **${companyName}** en Google Places. ¿Seguro que el nombre es correcto? Prueba con el nombre completo o la ciudad. 🐛`,
            action: "company_not_found",
          });
        }

        const empresa = await extractRes.json() as {
          nombre?: string; dominio?: string; urlWeb?: string;
          emailRrhh?: string; emailContacto?: string; telefono?: string;
          paginaEmpleo?: string; descripcion?: string; sector?: string;
          linkedin?: string; twitter?: string; instagram?: string;
          fuente?: string; googleRating?: number; googleReviews?: number;
          googleAddress?: string; googleMapsUrl?: string;
        };

        let reply = `🏢 **${empresa.nombre || companyName}**\n\n`;
        if (empresa.sector) reply += `📂 **Sector:** ${empresa.sector}\n`;
        if (empresa.descripcion) reply += `📝 ${empresa.descripcion.slice(0, 300)}...\n`;
        if (empresa.googleRating) reply += `⭐ **Valoración Google:** ${empresa.googleRating}/5 (${empresa.googleReviews || "?"} reseñas)\n`;
        if (empresa.googleAddress) reply += `📍 ${empresa.googleAddress}\n`;
        if (empresa.telefono) reply += `📞 ${empresa.telefono}\n`;
        if (empresa.emailRrhh) reply += `📧 ${empresa.emailRrhh}\n`;
        if (empresa.urlWeb) reply += `🌐 [Web](${empresa.urlWeb})\n`;
        if (empresa.paginaEmpleo) reply += `💼 [Ofertas de empleo](${empresa.paginaEmpleo})\n`;
        if (empresa.linkedin) reply += `🔗 [LinkedIn](${empresa.linkedin})\n`;
        reply += `\n📧 ¿Quieres que envíe tu CV a esta empresa? Dime \"sí\" y me encargo.`;

        return NextResponse.json({ reply, action: "company_info", company: empresa });
      } catch {
        return NextResponse.json({
          reply: `🏢 **${companyName}** — no pude conectar con Google Places ahora. ¿Quieres que busque ofertas de esta empresa en nuestra base de datos? 🔍`,
          action: "company_search_fallback",
        });
      }
    }

    // ── Intent: buscar trabajo ───────────────────────────────────────────────
    const intent = detectIntent(message);

    if (intent === "buscar" || mode === "buscar") {
      // Lo que el usuario PIDE explícitamente tiene prioridad sobre el CV
      const extractedJob = extractJobTerm(message);
      const puestoBusqueda = extractedJob || cvParsed?.ultimoPuesto || "";
      const extractedCity = extractCity(message);
      const ciudadBusqueda = extractedCity || cvParsed?.ciudad || "";

      // Si no hay puesto ni en CV ni en mensaje, pedir aclaración
      if (!puestoBusqueda) {
        return NextResponse.json({
          reply: "🔍 Claro, ¿qué tipo de trabajo buscas? Dime el puesto y la ciudad (ej: 'camarero en Madrid') y te busco al instante. 🐛",
          action: "need_keyword",
        });
      }

      if (puestoBusqueda) {
        const ofertas = await searchJobsReal(puestoBusqueda, ciudadBusqueda, 5, pais || "ES");
        if (!ofertas || ofertas.length === 0) {
          return NextResponse.json({
            reply: (cvParsed?.ultimoPuesto
              ? `Basándome en tu CV (último puesto: **${cvParsed.ultimoPuesto}**), ` : "") +
              fallbackMessage(puestoBusqueda, ciudadBusqueda),
            action: "search_results",
          });
        }
        const prefix = cvParsed?.ultimoPuesto
          ? `Basándome en tu CV (último puesto: **${cvParsed.ultimoPuesto}**), aquí tienes lo mejor que encontré:\n\n`
          : "";
        return NextResponse.json({
          reply: prefix + buildJobsText(puestoBusqueda, ciudadBusqueda, ofertas as unknown[]),
          jobs: ofertas,
          action: "search_results",
        });
      }
    }

    // ── Intent: enviar CV ────────────────────────────────────────────────────
    if (intent === "enviar") {
      if (cvParsed?.ultimoPuesto) {
        const ofertas = await searchJobsReal(cvParsed.ultimoPuesto, cvParsed.ciudad, 5, pais || "ES");
        if (!ofertas || ofertas.length === 0) {
          return NextResponse.json({
            reply: fallbackMessage(cvParsed.ultimoPuesto, cvParsed.ciudad),
            action: "search_results",
          });
        }
        return NextResponse.json({
          reply: `🔍 Encontré estas ofertas para **${cvParsed.ultimoPuesto}**${cvParsed.ciudad ? ` en **${cvParsed.ciudad}**` : ""}:\n\n${buildJobsText(cvParsed.ultimoPuesto, cvParsed.ciudad, ofertas as unknown[]).split("\n\n").slice(1).join("\n\n")}`,
          jobs: ofertas,
          action: "search_results",
        });
      }
      return NextResponse.json({
        reply: cvData
          ? "📧 Para enviarte a ofertas dime: ¿qué tipo de trabajo buscas y en qué ciudad? 🐛"
          : "📧 Primero necesito tu CV. Súbelo desde el clip de abajo o escribe **'crear cv'** y te lo hago paso a paso. 🐛",
        action: "send_cv_flow",
      });
    }

    // ── Chat normal con IA ───────────────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(cvData, pais);
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.slice(-8)
        .filter((m: { role: string; text: string }) => m.text)
        .map((m: { role: string; text: string }) => ({
          role: (m.role === "gusi" ? "assistant" : "user") as "assistant" | "user",
          content: m.text,
        })),
      { role: "user" as const, content: message },
    ];

    if (!groqKey) {
      return NextResponse.json({ reply: localReply(intent, cvParsed) });
    }

    // Añadir /no_think al último mensaje del usuario para forzar respuesta directa en español
    const msgsConNoThink = messages.map((m, i) =>
      i === messages.length - 1 && m.role === "user"
        ? { ...m, content: "/no_think " + m.content }
        : m
    );
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({ model: "qwen/qwen3-32b", messages: msgsConNoThink, max_tokens: 500, temperature: 0.7 }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return NextResponse.json({ reply: localReply(intent, cvParsed) });
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const rawReply = data.choices?.[0]?.message?.content || "";
    const reply = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() || localReply(intent, cvParsed);
    return NextResponse.json({ reply });

  } catch {
    return NextResponse.json({ reply: "¡Ups! Algo falló. Inténtalo de nuevo 🐛" });
  }
}

function extractJobTerm(text: string): string {
  const t = text.toLowerCase();
  // "busco trabajo de/como X en Y" — captura X
  const m1 = text.match(/(?:busco|buscar|busca)\s+(?:trabajo|empleo|curro|oferta)\s+(?:de\s+|como\s+)([a-záéíóúüñA-Z][a-záéíóúüñA-Z\s]+?)(?:\s+en\s+|\s*$)/i);
  if (m1?.[1]?.trim()) return m1[1].trim();
  // "trabajo como/de X" o "trabajo de X"
  const m2 = text.match(/trabajo\s+(?:como|de)\s+([a-záéíóúüñA-Z][a-záéíóúüñA-Z\s]+?)(?:\s+en\s+|\s*[,.]|\s*$)/i);
  if (m2?.[1]?.trim()) return m2[1].trim();
  // "soy X y busco" — captura X
  const m3 = text.match(/soy\s+([a-záéíóúüñA-Z][a-záéíóúüñA-Z\s]+?)\s+y\s+busco/i);
  if (m3?.[1]?.trim()) return m3[1].trim();
  // "busco de/como X" sin "trabajo"
  const m4 = text.match(/busco\s+(?:de\s+|como\s+)([a-záéíóúüñA-Z][a-záéíóúüñA-Z\s]+?)(?:\s+en\s+|\s*$)/i);
  if (m4?.[1]?.trim()) return m4[1].trim();
  // fallback generico
  const m5 = text.match(/(?:busco|buscar|necesito)\s+(?:trabajo|empleo)?\s*(?:de\s+|como\s+)(.+?)(?:\s+en\s+|$)/i);
  const fallback = m5?.[1]?.trim() || "";
  const stopwords = ["trabajo", "empleo", "curro", "oferta", "algo"];
  return stopwords.includes(fallback.toLowerCase()) ? "" : fallback;
}

function extractCity(text: string): string {
  const cities = [
    // España
    "madrid", "barcelona", "valencia", "sevilla", "málaga", "bilbao", "zaragoza",
    "murcia", "pamplona", "tudela", "navarra", "alicante", "córdoba", "granada",
    "vitoria", "san sebastián", "santander", "toledo", "cádiz", "palma",
    // Europa
    "berlin", "münchen", "munich", "hamburg", "frankfurt", "köln", "stuttgart",
    "paris", "lyon", "marseille", "toulouse", "bordeaux", "lille",
    "roma", "milano", "napoli", "torino", "firenze",
    "lisboa", "porto", "braga", "faro",
    "amsterdam", "rotterdam", "la haya", "utrecht",
    "warszawa", "kraków", "wroclaw", "gdansk",
    "stockholm", "göteborg", "malmö",
    "københavn", "copenhagen", "aarhus",
    "oslo", "bergen", "trondheim",
    "helsinki", "tampere", "turku",
    "dublin", "cork", "galway",
    "zürich", "zurich", "ginebra", "basel", "bern",
    "bruselas", "amberes", "brujas",
    "wien", "vienna", "salzburg",
  ];
  const t = text.toLowerCase();
  for (const c of cities) {
    if (t.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }
  return "";
}
