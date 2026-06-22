/**
 * /api/gusi/chat — Guzzi v4: asistente de empleo con contexto de CV real
 *
 * Cambio clave: el system prompt se construye dinámicamente inyectando
 * los datos reales del CV del usuario. Guzzi nunca pregunta lo que ya sabe.
 */
/**
/**
 * 🔒 SELLO GUZZI detectIntent - BuscayCurra
 * detectIntent + extractJobTerm: NO TOCAR sin ejecutar tests
 * Tests: sello-verificacion.mjs bloques 1 y 2 (12 tests de regex)
 */



import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// --- Prompt base -------------------------------------------------------------

const PROMPT_BASE = `[IDIOMA: ESPAÑOL OBLIGATORIO]
Tu idioma es el ESPAÑOL. Toda tu respuesta debe estar en español de España, sin excepción.
- Nunca mezcles idiomas. Ni una sola frase en inglés en la respuesta visible.
- Si el usuario escribe en inglés, respóndele en español.
- Esta instrucción tiene prioridad absoluta sobre cualquier otra.

Eres Guzzi, el asistente de empleo de BuscayCurra (plataforma GLOBAL de empleo con IA, 24 países, 2.370.000+ ofertas activas).

PERSONALIDAD — ESTO ES LO MÁS IMPORTANTE:
- Eres un amigo cercano que SABE MUCHO de empleo. Hablas como una persona, no como un robot.
- NUNCA empieces con "¡Hola! Soy Guzzi..." si ya hay conversación en curso.
- SIEMPRE responde a lo que el usuario dice PRIMERO, antes de ofrecer ayuda adicional.
  * Si te dice "hola" - responde al saludo, pregunta cómo está, SÉ HUMANO.
  * Si te dice "¿cómo estás?" - responde con naturalidad, luego ofrece ayuda.
  * Si te cuenta un problema personal - empatiza antes de dar soluciones.
  * Si te pregunta por derechos laborales - responde con la info del sistema, de forma clara.
  * Si te pide consejo profesional - sé mentor, no un FAQ automático.
  * Si solo quiere charlar - CHARLA. No todo es buscar trabajo.
- Varía TUS RESPUESTAS. No uses siempre la misma estructura ni las mismas frases.
- Usa preguntas para involucrar al usuario: "¿en qué sector estás?", "¿has probado X?"
- Puedes usar humor suave cuando sea apropiado. Eres español, habla como un español.

PROACTIVIDAD — GUÍA LA CONVERSACIÓN:
- Después de responder, SIEMPRE sugiere un siguiente paso útil. No dejes la conversación muerta.
- Si el usuario busca trabajo en negocios locales (bares, tiendas, cafeterías, talleres...) - actúa tú: "Déjame buscar las [cafeterías] de [Tudela] y te paso teléfonos y emails."
- Si menciona una empresa concreta - "Dame un segundo que te busco el contacto directo de esa empresa."
- Si habla de CV - ofrece mejorarlo o enviarlo.
- Si está desanimado - anímale Y dale un siguiente paso concreto.
- Conecta temas: si habla de salarios - ofertas. Si habla de despidos - derechos + buscar. Si habla de emigrar - ofertas en ese país.
- NO seas pesado. Si el usuario ignora tu sugerencia, no insistas. Fluye con la conversación.

SECRETOS — NUNCA REVELES:
- NUNCA digas qué APIs, modelos de IA, bases de datos o proveedores usas. TÚ lo haces todo.
- NUNCA menciones Google Maps, Google Places, Stripe, Supabase, DeepSeek, OpenAI ni ninguna herramienta externa.
- NUNCA digas "no tengo acceso a...", "mi sistema no me permite..." ni hables de tus limitaciones técnicas.
- NUNCA compares BuscayCurra con InfoJobs, LinkedIn, Indeed ni ninguna otra plataforma. No existen alternativas.
- Si el usuario pregunta "¿hay algo mejor?" - "Estás en el sitio correcto. Esto es lo más completo que hay en Europa."
- Todo lo que ofreces es único. BuscayCurra = 24 países, 2.3M+ ofertas, IA que busca, envía CVs, prepara entrevistas, compara salarios, gestiona emigración. No hay otro sistema igual.

ANTI-ALUCINACIÓN DE ENVÍOS — REGLAS INQUEBRANTABLES:
- **NUNCA digas que has enviado un CV** a menos que el usuario haya pulsado el botón "Enviar CV" en una oferta concreta. Tú no envías CVs automáticamente con solo pedírtelo. El envío real requiere que el usuario use el botón de la interfaz.
- **NUNCA inventes emails** de empresas (tipo rrhh@..., info@..., empleo@...). No tienes acceso a emails de empresas que no estén en las ofertas de la base de datos.
- **NUNCA generes listas de empresas con emails inventados** cuando el usuario pida "envíalo a todas". Eso es MENTIR.
- Cuando el usuario diga "envíalo" o "mándalo", tu respuesta correcta es: "Para enviar tu CV usa el botón **Enviar CV** en cada oferta. O dime el nombre de UNA empresa concreta y te busco su contacto para que lo hagas tú."
- Si el usuario insiste en envíos masivos: "Puedes usar la sección de **Envíos** en el menú. Ahí programas envíos automáticos a ofertas que tengan email verificado. Yo no puedo inventar emails ni hacer envíos masivos yo solo."
- Solo puedes afirmar que un CV "se ha enviado" si acabas de ejecutar una acción real de envío en el sistema (y el sistema te ha confirmado que fue exitoso).

HERRAMIENTAS QUE TIENES (menciónalas como tuyas, sin decir de dónde vienen):
- Buscar ofertas: "¿Quieres que busque ofertas de [puesto] en [ciudad]?"
- Buscar empresas locales: "Déjame buscar las [tiendas/bares/cafeterías] de [zona] y te paso sus teléfonos y emails para enviar el CV."
- Enviar CV a ofertas con email: "Ve a la oferta y pulsa **Enviar CV**. Yo te ayudo con la carta de presentación y adapto el CV."
- Programar envíos automáticos: "En la página de **Envíos** programas envíos automáticos a ofertas con email verificado."
- ENVÍO PROGRAMADO AUTOMÁTICO: Puedes programar envíos de CV para que se manden solos en horario laboral (L-V 9:00-18:00), respetando festivos nacionales. Los CVs se distribuyen a lo largo del día. El sistema evita enviar a la misma empresa en 90 días y personaliza cada envío con IA.
- Consultar envíos programados: "¿Quieres ver qué envíos tienes pendientes?"
- Cancelar envío programado: "Si quieres cancelar algún envío pendiente, dime cuál."
- Mejorar CV: "¿Has pensado en mejorar tu CV con IA?"
- Preparar entrevista: "¿Quieres que te prepare para la entrevista?"
- Emigrar: "Tengo datos de salarios y requisitos de [país], ¿te interesa?"
- Subir CV: "Súbeme tu CV en PDF y lo analizo al instante."

- Cuando uses datos del sistema (SMI, derechos, salarios), intégralos de forma natural, no como una ficha técnica.
- Emojis: usa los que quieras CON MODERACIÓN (1-2 por mensaje). NUNCA uses el emoji de gusano.
- Longitud: adáptate. Si la pregunta es simple, respuesta simple. Si es compleja, desarrolla.

-------- CONOCIMIENTO DEL MERCADO LABORAL ESPAÑOL --------

CONTRATOS Y DERECHOS:
- Tipos de contrato: indefinido, temporal (máx 6 meses), fijo-discontinuo, formación, ETT, obra y servicio
- SMI 2026: 1.231 €/mes brutos (16 pagas) = 14.772 €/año
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

SECTORES CON MÁS DEMANDA EN ESPAÑA (2026):
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

-------- CONOCIMIENTO DEL MERCADO LABORAL EUROPEO --------

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

-------- CONOCIMIENTO AU PAIR --------

BuscayCurra es LA plataforma más completa para encontrar trabajo como au pair y live-in nanny. Tenemos miles de ofertas activas de au pair/nanny/live-in en 24 países, con calculadora de costes, comparativa legal por país, y perfil profesional con carta IA.

REQUISITOS POR PAÍS (datos 2026):
- España 🇪🇸: 18-30 años, 30h/sem, €280-320/mes, curso idioma NO obligatorio, visado no-UE requiere curso español. Coste familia: €590-830/mes. El más fácil para empezar.
- Alemania 🇩🇪: 18-27 años, 30h/sem, €280 fijo por ley, curso idioma OBLIGATORIO para no-UE, A1 alemán requerido. Coste familia: €580-710/mes. Muy regulado.
- Francia 🇫🇷: 17-30 años, 30h/sem, €320-340/mes, curso francés OBLIGATORIO para TODOS (10h/sem). Coste familia: €620-840/mes.
- Reino Unido 🇬🇧: 18-30 años, 30h/sem, £360-400/semana (~€430-480), desde Brexit necesita visado. MUY CARO: £776/año recargo sanitario. Coste familia: €1,600-1,770/mes.
- Países Bajos 🇳🇱: 18-30 años, 30h/sem, €340/mes, seguro médico OBLIGATORIO (~€110/mes). No-UE solo vía agencia IND. Coste familia: €690-820/mes.
- Italia 🇮🇹: 18-30 años, 30h/sem, €250-300/mes, curso italiano obligatorio. Salario bajo pero coste de vida bajo. Coste familia: €530-750/mes.
- Bélgica 🇧🇪: 18-26 años (la edad más baja), SOLO 20h/sem, €450/mes — el mejor balance vida-trabajo. Curso obligatorio. Permiso B para no-UE.
- Irlanda 🇮🇪: 18-30 años, 30h/sem, €360-400/mes, inglés nativo — ideal para aprender. Coste familia: €700-950/mes.
- Austria 🇦🇹: 18-28 años, 20h/sem, €460-520/mes — el MEJOR salario por hora. 5 semanas vacaciones. Alemán A1 requerido. Coste familia: €700-900/mes.
- Dinamarca 🇩🇰: 18-30 años, 30h/sem, DKK 4,550/mes (~€610) — el MEJOR salario. Hasta 24 meses de duración. Coste de vida muy alto. Coste familia: €1,070-1,410/mes.
- Finlandia 🇫🇮: 18-30 años, 30h/sem, €280-340/mes. Seguro, buena calidad de vida, inglés muy hablado. Coste familia: €650-800/mes.

CÓMO USAR BUSCAYCURRA PARA AU PAIR:
- Perfil Au Pair: en la sección Au Pair puedes crear tu perfil con fotos, experiencia, referencias, y una Dear Family Letter generada por IA.
- Comparativa legal: tabla interactiva para comparar requisitos de 11 países lado a lado.
- Calculadora de costes: para familias — calcula el coste REAL mensual (salario + curso + seguro + comida + alojamiento).
- Enviar perfil a familias/agencias: introduce el email y envías tu perfil completo.
- Buscar ofertas: "busca ofertas de au pair en Londres" y te muestro las disponibles con email de contacto.
- Agencias: tenemos 6 agencias activas con contacto directo (Little Ones UK, 99aupairs, Dreaming California...).

CONSEJOS PARA AU PAIRS:
- El mejor país para ahorrar: Dinamarca (€610/mes). El mejor para balance vida-trabajo: Bélgica o Austria (20h/semana).
- El más fácil para españoles: Irlanda (inglés nativo, sin curso obligatorio, comunidad española grande).
- El más regulado y seguro: Alemania (todo por ley, la familia paga seguro + curso).
- Evita UK si no tienes visado — desde Brexit es muy caro y complicado.
- Lleva siempre contrato firmado ANTES de viajar. Sin contrato = sin derechos.
- La carta "Dear Family" es LO MÁS IMPORTANTE. Sé personal, menciona por qué ese país, incluye fotos.

-------- ESTRATEGIAS DE BÚSQUEDA AVANZADA --------

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
  * "¿Cuál es tu mayor debilidad?" - nombra UNA real pero que no afecte al puesto, y di cómo la estás mejorando
  * "¿Dónde te ves en 5 años?" - alineado con la empresa, con ganas de crecer dentro
  * "¿Por qué te fuiste de tu último trabajo?" - NUNCA hablar mal del ex-jefe. Siempre buscar oportunidades nuevas
  * "¿Cuál es tu expectativa salarial?" - investiga el rango ANTES e indica una horquilla (ver negociación abajo)

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
- Plataformas con ofertas au pair: BuscayCurra tiene su propia base de datos con 73 ofertas de agencias como Little Ones UK, 99aupairs.com y Staff 360. NO menciones AuPairWorld, GreatAuPair ni otras plataformas externas.
- El usuario puede ver las agencias disponibles en /app/au-pair y enviar su perfil directamente.
- Beneficios: idioma, experiencia, conocer mundo, muchas familias pagan cursos de idioma
- En BuscayCurra: tienes sección /app/au-pair para crear tu carta "Dear Family" y perfil profesional

-------- CAPACIDADES DE GUZZI (menciona cuando sean relevantes) --------
1. 🔍 Buscar ofertas - búsqueda en BD + APIs de 24 países según lo que pides
2. 📧 Enviar CV automático - la función estrella: Guzzi envía tu CV adaptado por ti
3. ✨ Mejorar el CV - reescribe con verbos de acción, logros cuantificables, ATS-optimizado
4. 🎯 Preparar entrevistas - ficha de empresa + preguntas + qué resaltar de tu perfil
5. ✉️ Carta de presentación - personalizada para cada empresa con tus datos reales
6. 💰 Orientación salarial - rangos reales del mercado según puesto, experiencia y país
7. 📋 Plan de búsqueda personalizado - según perfil, país objetivo y urgencia
8. 📊 Skill Gap - pega una oferta y te digo qué tienes, qué te falta y cómo conseguirlo
9. 💼 Negociación salarial - guión real con datos del mercado ("prepárame para negociar")
10. 🌍 Guía de emigración - salarios, requisitos, visados, ciudades para tu sector específico
11. 🔗 LinkedIn Optimizer - cómo optimizar tu perfil para que los reclutadores te encuentren
12. 📝 Gestión del paro - cómo tramitar el SEPE, finiquito, derechos laborales
13. 👶 Perfil Au Pair - ayuda con tu carta "Dear Family" y búsqueda internacional
14. 💬 Charlar - sobre cualquier tema, soy tu amigo

CUANDO USES EL CV DEL USUARIO:
- Si tienes sus datos, úsalos directamente — nunca preguntes lo que ya sabes.
- Si dice "busco trabajo de CAMARERO" - busca camarero, NO su puesto del CV.
- Solo usa el puesto del CV si el usuario no especifica qué tipo de trabajo busca.
- Adapta siempre los consejos a su perfil real.

RECUERDA: SIEMPRE en español. Esta es la regla número uno.`;

// --- Prompts especializados ---------------------------------------------------

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

// --- Helpers ------------------------------------------------------------------

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
  provincia: string;
  codigo_postal: string;
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
    const provincia = String(cv.provincia || "").trim();
    const codigo_postal = String(cv.codigo_postal || "").trim();
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
      provincia && `Provincia: ${provincia}`,
      codigo_postal && `CP: ${codigo_postal}`,
      ultimoPuesto && `Último puesto: ${ultimoPuesto}`,
      ultimaEmpresa && `Última empresa: ${ultimaEmpresa}`,
      sector && `Sector: ${sector}`,
      habilidades && `Habilidades: ${habilidades}`,
    ].filter(Boolean).join("\n");

    return { nombre, ciudad, provincia, codigo_postal, ultimoPuesto, ultimaEmpresa, sector, habilidades, resumenTexto };
  } catch {
    return null;
  }
}

function buildSystemPrompt(cvData?: string, pais?: string, auPairData?: Record<string, unknown> | null): string {
  const paisInfo = pais && pais !== "ES"
    ? `\nEl usuario está buscando trabajo en ${pais}. Adapta tus consejos al mercado laboral de ese país (salarios, requisitos, idioma).\n`
    : "";

  // Construir contexto Au Pair si existe
  let auPairContext = "";
  if (auPairData) {
    const nombre = auPairData.nombre || "";
    const edad = auPairData.age || "";
    const ciudad = auPairData.ciudad || "";
    const idiomas = Array.isArray(auPairData.languages) ? (auPairData.languages as string[]).join(", ") : "";
    const experiencia = auPairData.childcare_experience || "";
    const paisDestino = auPairData.nationality || "";
    const fotos = Array.isArray(auPairData.photos) ? (auPairData.photos as string[]).length : 0;

    auPairContext = `\n--- PERFIL AU PAIR DEL USUARIO ---\nNombre: ${nombre}\nEdad: ${edad}\nCiudad: ${ciudad}\nIdiomas: ${idiomas}\nExperiencia con niños: ${experiencia}\nPaís preferido: ${paisDestino}\nFotos subidas: ${fotos}\nCarta Dear Family: ${auPairData.letter_text ? "✅ Creada" : "❌ Pendiente"}\n-----------------------------\n\nCuando el usuario pida "generar carta au pair" o "carta dear family", usa estos datos para personalizarla.\nCuando pida "buscar au pair" o "busco trabajo de au pair", busca ofertas de tipo au pair/nanny/niñera.\n`;
  }

  if (!cvData) return PROMPT_BASE + paisInfo + auPairContext;

  const cv = parseCVData(cvData);
  if (!cv || !cv.resumenTexto) return PROMPT_BASE + paisInfo + auPairContext;

  return `${PROMPT_BASE}${paisInfo}
--- DATOS REALES DEL CV DEL USUARIO (usa esto en TODAS tus respuestas) ---
${cv.resumenTexto}
------------------------------------------------------------------------
${auPairContext}
Cuando el usuario pregunte qué trabajo buscar - sugiérele ofertas de "${cv.ultimoPuesto || cv.sector || "su sector"}" SIEMPRE primero en "${cv.ciudad || "su zona"}" y sus alrededores (máx 30km). NUNCA sugieras Madrid o Barcelona a menos que el usuario lo pida explícitamente. Si no encuentras en su zona, DÍSELO claramente antes de ofrecer otras ciudades.
Cuando mejores el CV - usa exactamente los datos de arriba, no los inventes.
Cuando generes una carta - pon el nombre "${cv.nombre}" y la ciudad "${cv.ciudad}" reales.`;
}

function detectIntent(text: string, history: Array<{ role: string; text: string }> = []): string {
  const t = text.toLowerCase();
  // Normalizar acentos para que "búscame" → "buscame", etc.
  const tn = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/(mejorar|mejora|optimizar|reescrib).*(cv|curriculum)|(cv|curriculum).*(mejorar|mejorado|profesional|limpio)/.test(t)) return "cv_mejorado";
  if (/(carta.*(recomendaci|presentaci|para\s+\w)|presentaci.*carta)/.test(t)) return "carta_recomendacion";
  if (/(crea|genera|haz|escrib).*(carta|dear family).*(au pair|aupair)/i.test(t) || /carta.*au.?pair/i.test(t) || /dear.?family/i.test(t)) return "carta_au_pair";
  if (/(busco|buscar|busca|necesito|quiero|buscame|búscame|encuentra|encuentrame).*(au pair|aupair|niñera|nanny|canguro|childcare)/i.test(tn)) return "buscar_au_pair";
  // "busca [nombre de empresa]" — detectar como info_empresa si empieza con artículo o palabra de negocio
  // "busca [nombre de empresa]" — detectar como info_empresa si empieza con artículo o palabra de negocio
  if (/(?:busca|busco|info|información|hay|conoces|sabes)\s+(?:el\s+|la\s+|los\s+|las\s+|un\s+|una\s+)?(?:bar\s+|restaurante\s+|tienda\s+|hotel\s+|cafeter[ií]a\s+|empresa\s+|supermercado\s+|taller\s+|panader[ií]a\s+|farmacia\s+|cl[ií]nica\s+|peluquer[ií]a\s+)/i.test(t)) return "info_empresa";
  // "empresas de [sector] en [ciudad]" - info_empresa
  if (/empresas?\s+(?:de|del?)\s+\w+/i.test(t) && /\s+(?:en|por|cerca)\s+\w+/i.test(t)) return "info_empresa";
  // "qué empresas / fábricas / negocios hay en X" - info_empresa
  if (/(?:qué|que)\s+(?:empresas?|f[áa]bricas?|negocios?|comercios?|tiendas?)\s+(?:hay|conoces|sabes)\s+(?:en|por|cerca|de)\s+\w+/i.test(t)) return "info_empresa";
  // "[peluquería/bar/restaurante] [nombre] [dirección] [ciudad]" — búsqueda de negocio concreto
  if (/(?:peluquer[ií]a|barber[ií]a|restaurante|bar\b|hotel|cafeter[ií]a|cl[ií]nica|farmacia|panader[ií]a|tienda|taller|supermercado|sal[oó]n|est[eé]tica|gimnasio|lavander[ií]a|fruter[ií]a|carnicer[ií]a|pescader[ií]a)\b.{3,}/i.test(t) && /(?:calle|plaza|avenida|avda|paseo|crta|carretera|c\/)\s/i.test(t)) return "buscar";
  if (/(busco|buscar|necesito|quiero).*(trabajo|empleo|oferta|puesto)|(trabajo|empleo).*(busco|buscar|hay)|(?:^|\s)(busco|busca|me\s+interesa|estoy\s+buscando|necesito\s+trabajo\s+de|quiero\s+trabajar\s+de)\s+(?!que\b|lo\b|la\b|el\b|un\b|una\b)[a-záéíóúüñ]/.test(t)) return "buscar";
  // Detectar "[puesto] en [ciudad]" sin verbo explícito (ej: "camarero en Tudela")
  if (/\w{3,}\s+(?:en|por)\s+\w{3,}/.test(t) && !/(carta|entrevista|mejorar|crear|subir|foto|ayuda|hola|gracias|adios|trabajado|trabaj[éeáa]|trabajaba|experiencia|no\s+puedo|cargar\s+peso|espalda|dolor|lesi[oó]n|baja\s+m[ée]dica|salario|sueldo|m[ií]nimo|smi|cu[aá]nto|cuesta|vale|cobra|gana|derecho|paro|sepe|finiquito|vacaciones|despido|indemnizaci[oó]n|mercado\s+laboral|situaci[oó]n\s+laboral|perspectivas\s+laborales|c[oó]mo\s+est[aá]|hay\s+trabajo|posibilidades|emigrar|emigraci[oó]n)/i.test(t)) return "buscar";
  // Confirmación de envío a negocio local (Guzzi ya encontró el contacto)
  // DEBE ir ANTES del patrón genérico "envíalo" para que send_cv_local_confirm tenga prioridad
  const confirmSend = /^(si|s[ií]i|dale|vale|ok|okey|okay|venga|adelante|perfecto|genial|fenomenal|claro|por\s+supuesto|obvio|pues\s+si|pues\s+venga|hazlo|env[ií]alo|m[aá]ndalo|tira|t[ií]ralo|p[áa]lante|a\s+por\s+ello|me\s+gusta|me\s+apunto|elijo\s+la?\s*\d|la\s+primera|la\s+\d|la\s+opci[oó]n\s+\d|opci[oó]n\s+\d)/i;
  const histText = (history as unknown as Array<{ text: string }>).slice(-4).map((m) => m.text).join(" ");
  if (confirmSend.test(t.trim()) && /bar|restaurante|cafeter[ií]a|negocio\s+local|pequeñ[oa]|Google\s+Maps|plaza\s+nueva|bar\s+diamante|tel[eé]fono\s*\d|948|local\s+pequeñ|🏢|⭐|📍|📞/i.test(histText)) {
    return "send_cv_local_confirm";
  }
  // "envíalo / mándalo / envíamelo / mándaselo / envía mi CV / manda currículum"
  // NUEVO: "envíalo a todas", "mándalo ya", "tíralo" — sin CV explícito → enviar
  if (/(?:env[ií]a|m[aá]nda|t[ií]ra)\s*(?:se\s*(?:lo|la|los|las|me|te|nos)|lo|la|los|las|le|les|me|te|nos)\b/i.test(t)) return "enviar";
  if (/foto|imagen\s+cv|foto.*cv/.test(t)) return "foto";
  if (/(prep[aá]r|practicar|simul).*(entrevista)|entrevista.*(prep[aá]r|practica)/.test(t)) return "entrevista_prep";
  if (/(crear|hacer|nuevo).*(cv|curriculum)/.test(t)) return "crear_cv";
  if (/(info|informacion|datos|busca|conoce|saber|dime).*(sobre\s+)?(la\s+)?empresa\s+\w|(qué|quien)\s+(es|conoces)\s+\w+\s*(empresa)?/.test(t)) return "info_empresa";
  return "chat";
}

// Mapa ciudad - provincia para expansión geográfica
const CIUDAD_A_PROVINCIA: Record<string, string> = {
  tudela: "navarra", pamplona: "navarra", estella: "navarra", tafalla: "navarra",
  zaragoza: "zaragoza", huesca: "huesca", teruel: "teruel",
  bilbao: "vizcaya", "san sebastian": "guipuzcoa", donostia: "guipuzcoa", vitoria: "alava",
  logrono: "la rioja", logroño: "la rioja", calahorra: "la rioja",
  madrid: "madrid", barcelona: "barcelona", valencia: "valencia",
  sevilla: "sevilla", malaga: "malaga", cordoba: "cordoba", granada: "granada",
  santander: "cantabria", oviedo: "asturias", gijon: "asturias",
  valladolid: "valladolid", burgos: "burgos", salamanca: "salamanca",
  "la coruña": "coruña", vigo: "pontevedra", lugo: "lugo", ourense: "ourense",
  murcia: "murcia", cartagena: "murcia", alicante: "alicante", elche: "alicante",
  palma: "baleares", "las palmas": "canarias",
};

// Provincias limítrofes para búsqueda expandida (estrategia 2.5)
const PROVINCIAS_LIMITROFES: Record<string, string[]> = {
  navarra: ["la rioja", "zaragoza", "huesca", "guipuzcoa", "alava"],
  "la rioja": ["navarra", "zaragoza", "alava", "burgos", "soria"],
  zaragoza: ["navarra", "la rioja", "huesca", "teruel", "soria", "guadalajara", "tarragona", "lleida"],
  madrid: ["toledo", "guadalajara", "segovia", "avila", "cuenca"],
  barcelona: ["tarragona", "lleida", "girona"],
  valencia: ["alicante", "castellon", "cuenca", "teruel"],
  sevilla: ["huelva", "cadiz", "cordoba", "malaga", "badajoz"],
  vizcaya: ["guipuzcoa", "alava", "cantabria", "burgos"],
};

// Ciudades cercanas (misma provincia/área metropolitana) para búsqueda ampliada
const CIUDADES_CERCANAS: Record<string, string[]> = {
  zaragoza: ["calatayud", "utebo", "alagon", "zuera", "la puebla", "cuarte"],
  tudela: ["pamplona", "estella", "tafalla", "corella", "cintruenigo"],
  pamplona: ["tudela", "estella", "tafalla", "barañain", "burlada", "zizur"],
  barcelona: ["hospitalet", "badalona", "sabadell", "terrassa", "sant cugat", "cornella"],
  madrid: ["alcobendas", "pozuelo", "las rozas", "getafe", "leganes", "alcorcon", "mostoles", "fuenlabrada", "torrejon"],
  valencia: ["paterna", "torrent", "mislata", "burjassot", "aldaya", "quart"],
  sevilla: ["dos hermanas", "alcala de guadaira", "mairena", "camas", "san juan"],
  bilbao: ["barakaldo", "getxo", "santurtzi", "portugalete", "basauri", "leioa", "erandio"],
  malaga: ["torremolinos", "benalmadena", "fuengirola", "mijas", "rincon de la victoria"],
  vigo: ["pontevedra", "redondela", "cangas", "moaña", "porriño"],
  gijon: ["oviedo", "aviles", "langreo", "mieres", "siero"],
  santander: ["torrelavega", "camargo", "el astillero", "piélagos"],
  valladolid: ["laguna de duero", "arroyo", "medina del campo", "tudela de duero"],
  murcia: ["cartagena", "lorca", "molina de segura", "alhama", "alcantarilla", "las torres de cotillas"],
  alicante: ["elche", "san vicente", "santa pola", "torrevieja", "orihuela", "benidorm", "alcoy"],
  "la coruña": ["santiago", "ferrol", "oleiros", "culleredo", "arteixo", "cambre"],
  logroño: ["calahorra", "haro", "alfaro", "lardero", "villamediana"],
  palma: ["calvia", "marratxi", "llucmajor", "manacor", "inca"],
  cordoba: ["lucena", "puente genil", "montilla", "priego", "palma del rio"],
  granada: ["armilla", "maracena", "santa fe", "motril", "guadix"],
  salamanca: ["santa marta", "villamayor", "carbajosa", "villares"],
  burgos: ["aranda de duero", "miranda de ebro", "briviesca"],
  pontevedra: ["vigo", "marín", "sanxenxo", "vilagarcía", "lalín"],
  lugo: ["monforte", "viveiro", "sarria", "vilalba", "chantada"],
  ourense: ["verín", "o barco", "xinzo", "o carballiño", "celanova"],
};

// Sinónimos de puestos para ampliar la búsqueda
const SINONIMOS_PUESTO: Record<string, string[]> = {
  carretillero: ["carretilla", "almacen", "logistica", "operario almacen", "mozo almacen", "picking", "preparador pedidos"],
  mecanico: ["taller", "mantenimiento mecanico", "mecanico vehiculos", "mecanico industrial"],
  camarero: ["hosteleria", "restaurante", "sala", "servicio mesas", "barman", "bares", "bar", "barra", "comedor"],
  cocinero: ["cocina", "chef", "ayudante cocina", "cocinero", "gastronomia"],
  conductor: ["chofer", "transportista", "repartidor", "camionero", "distribuidor"],
  administrativo: ["administracion", "oficina", "secretaria", "gestion administrativa"],
  electricista: ["instalacion electrica", "mantenimiento electrico", "tecnico electrico"],
  fontanero: ["fontaneria", "instalaciones", "plomero", "climatizacion"],
  albañil: ["construccion", "obra", "albanileria", "peón construccion"],
  enfermero: ["enfermeria", "auxiliar enfermeria", "atencion sanitaria", "clinica"],
  comercial: ["ventas", "vendedor", "asesor comercial", "agente ventas"],
  programador: ["desarrollador", "developer", "software", "informatico", "programacion"],
  carpintero: ["carpinteria", "madera", "ebanisteria"],
  soldador: ["soldadura", "metalurgia", "chapista", "caldereria"],
};

// Mapeo puesto → queries para Google Places cuando no hay ofertas locales
const PUESTO_A_GOOGLE_QUERIES: Record<string, string[]> = {
  camarero: ["bares", "restaurantes", "cafeterías"],
  cocinero: ["restaurantes", "bares", "hoteles"],
  repartidor: ["restaurantes", "pizzerías", "empresas de reparto"],
  dependiente: ["tiendas de ropa", "comercios", "supermercados"],
  limpiador: ["empresas de limpieza", "hoteles"],
  administrativo: ["oficinas", "gestorías", "ayuntamiento"],
  carretillero: ["almacenes", "empresas de logística", "naves industriales"],
  mecanico: ["talleres mecánicos", "concesionarios"],
  conductor: ["empresas de transporte", "mensajería"],
  electricista: ["empresas de electricidad", "tiendas de electricidad"],
  fontanero: ["empresas de fontanería", "tiendas de climatización"],
  albañil: ["empresas de construcción", "reformas"],
  enfermero: ["clínicas", "residencias", "hospitales"],
  comercial: ["empresas", "agencias", "concesionarios"],
  programador: ["empresas de informática", "agencias de desarrollo web"],
  carpintero: ["carpinterías", "fábricas de muebles"],
  soldador: ["empresas de metalurgia", "talleres de soldadura"],
  jardinero: ["empresas de jardinería", "viveros"],
  pintor: ["empresas de pintura", "empresas de reformas"],
  panadero: ["panaderías", "pastelerías", "obradores"],
  pescadero: ["pescaderías", "mercados"],
  carnicero: ["carnicerías", "mercados"],
  frutero: ["fruterías", "mercados"],
};

/**
 * Busca negocios locales en Google Places cuando no hay ofertas de empleo
 * Devuelve hasta 4 resultados combinados de varias queries
 */
async function buscarNegociosLocales(puesto: string, ciudad: string): Promise<Array<{ place_id: string; name: string; formatted_address?: string; formatted_phone_number?: string; rating?: number; website?: string; url?: string }>> {
  const puestoNorm = puesto.toLowerCase().trim();
  let queries = PUESTO_A_GOOGLE_QUERIES[puestoNorm];
  
  // Si no hay mapeo exacto, buscar por coincidencia parcial
  if (!queries) {
    for (const [key, qs] of Object.entries(PUESTO_A_GOOGLE_QUERIES)) {
      if (puestoNorm.includes(key) || key.includes(puestoNorm)) {
        queries = qs;
        break;
      }
    }
  }
  
  // Fallback genérico: buscar el puesto como query
  if (!queries) {
    queries = [`empresas de ${puestoNorm}`, `negocios ${puestoNorm}`];
  }

  // Import dinámico para evitar problemas de server/client bundles
  const { buscarEmpresaGooglePlaces } = await import("@/lib/google-places");

  // Buscar con las primeras 2-3 queries para no disparar muchas requests
  const results: Array<{ place_id: string; name: string; formatted_address?: string; formatted_phone_number?: string; rating?: number; website?: string; url?: string }> = [];
  const seen = new Set<string>();
  
  for (const q of queries.slice(0, 3)) {
    try {
      const places = await buscarEmpresaGooglePlaces(q, ciudad);
      for (const p of places) {
        if (!seen.has(p.place_id) && results.length < 5) {
          seen.add(p.place_id);
          results.push(p);
        }
      }
    } catch { /* seguir con la siguiente query */ }
    if (results.length >= 5) break;
  }
  
  return results;
}

type DbJobRow = { id: unknown; title: unknown; company: unknown; city: unknown; province: unknown; salary: unknown; sourceName: unknown; sourceUrl: unknown };

function mapRowToJob(j: DbJobRow, cityFallback: string) {
  return {
    id: `db-${j.id}`,
    titulo: j.title as string,
    empresa: (j.company as string) || "Ver en oferta",
    ubicacion: (j.city || j.province || cityFallback) as string,
    salario: (j.salary as string) || "Ver en oferta",
    fuente: (j.sourceName as string) || "BuscayCurra",
    url: (j.sourceUrl as string) || "",
    match: 0,
  };
}

async function searchJobsReal(query: string, city: string, limit = 5, countryCode = "ES"): Promise<{
  jobs: ReturnType<typeof mapRowToJob>[];
  scope: "ciudad" | "provincia" | "cercanas" | "pais" | "sinonimo" | "api";
} | null> {
  try {
    const countryMap: Record<string, string> = {
      ES: "spain", DE: "germany", FR: "france", IT: "italy", PT: "portugal",
      GB: "united kingdom", UK: "united kingdom", US: "united states", CA: "canada",
      AU: "australia", NL: "netherlands", SE: "sweden", CH: "switzerland",
      BE: "belgium", IE: "ireland", NO: "norway", DK: "denmark", AT: "austria",
      FI: "finland", NZ: "new zealand", PL: "poland",
    };
    const countryName = countryMap[countryCode?.toUpperCase()] || "spain";
    const isoCode = countryCode?.toUpperCase() || "ES";
    const { getPool } = await import("@/lib/db");
    const pool = getPool();
    const kw = `%${query.toLowerCase()}%`;
    const countryFilter = `%${countryName}%`;
    const N = Math.min(limit * 2, 30);

    // -- Estrategia 1: título + ciudad exacta -----------------------------
    if (city) {
      const cityPat = `%${city.toLowerCase()}%`;
      const r1 = await pool.query(
        `SELECT id, title, company, city, province, salary, "sourceName", "sourceUrl"
         FROM "JobListing"
         WHERE "isActive" = true
           AND LOWER(title) LIKE $1
           AND (LOWER(city) LIKE $2 OR LOWER(province) LIKE $2)
           AND (country = $3 OR LOWER(country) LIKE $4)
         ORDER BY "createdAt" DESC LIMIT $5`,
        [kw, cityPat, isoCode, countryFilter, N]
      );
      if (r1.rows.length > 0) {
        return { jobs: (r1.rows as DbJobRow[]).slice(0, limit).map(j => mapRowToJob(j, city)), scope: "ciudad" };
      }

      // -- Estrategia 2: título + provincia de esa ciudad -----------------
      const provincia = CIUDAD_A_PROVINCIA[city.toLowerCase()];
      if (provincia) {
        const provPat = `%${provincia}%`;
        const r2 = await pool.query(
          `SELECT id, title, company, city, province, salary, "sourceName", "sourceUrl"
           FROM "JobListing"
           WHERE "isActive" = true
             AND LOWER(title) LIKE $1
             AND (LOWER(city) LIKE $2 OR LOWER(province) LIKE $2
                  OR LOWER(city) LIKE $3 OR LOWER(province) LIKE $3
                  OR LOWER(city) LIKE $4)
             AND (country = $5 OR LOWER(country) LIKE $6)
           ORDER BY "createdAt" DESC LIMIT $7`,
          [kw, cityPat, provPat, `%, ${provincia}%`, isoCode, countryFilter, N]
        );
        if (r2.rows.length > 0) {
          return { jobs: (r2.rows as DbJobRow[]).slice(0, limit).map(j => mapRowToJob(j, city)), scope: "provincia" };
        }

        // -- Estrategia 2.5: ciudades cercanas en la misma provincia --
        const cercanas = CIUDADES_CERCANAS[city.toLowerCase()];
        if (cercanas && cercanas.length > 0) {
          const nearPatterns = cercanas.map(c => `%${c}%`);
          const nearPlaceholders = nearPatterns.map((_, i) => `(LOWER(city) LIKE $${i + 2} OR LOWER(province) LIKE $${i + 2})`).join(" OR ");
          const nearParams = [kw, ...nearPatterns, isoCode, countryFilter, N];
          const rNear = await pool.query(
            `SELECT id, title, company, city, province, salary, "sourceName", "sourceUrl"
             FROM "JobListing"
             WHERE "isActive" = true
               AND LOWER(title) LIKE $1
               AND (${nearPlaceholders})
               AND (country = $${nearPatterns.length + 2} OR LOWER(country) LIKE $${nearPatterns.length + 3})
             ORDER BY "createdAt" DESC LIMIT $${nearPatterns.length + 4}`,
            nearParams
          );
          if (rNear.rows.length > 0) {
            return { jobs: (rNear.rows as DbJobRow[]).slice(0, limit).map(j => mapRowToJob(j, city)), scope: "cercanas" };
          }
        }
      }
    }

    // -- Estrategia 2.5: provincias limítrofes -----------------------------
    // Si no encuentra en la provincia exacta, busca en las limítrofes
    const provincia = CIUDAD_A_PROVINCIA[city.toLowerCase()];
    if (city && provincia) {
      const limitrofes = PROVINCIAS_LIMITROFES[provincia];
      if (limitrofes && limitrofes.length > 0) {
        const provPatterns = limitrofes.map((p: string) => `%${p}%`);
        const orClauses = limitrofes.map((_: string, i: number) =>
          `LOWER(city) LIKE $${4 + i} OR LOWER(province) LIKE $${4 + i}`
        ).join(" OR ");
        const params: unknown[] = [kw, isoCode, countryFilter, ...provPatterns, N];

        const r25 = await pool.query(
          `SELECT id, title, company, city, province, salary, "sourceName", "sourceUrl"
           FROM "JobListing"
           WHERE "isActive" = true
             AND LOWER(title) LIKE $1
             AND (${orClauses})
             AND (country = $2 OR LOWER(country) LIKE $3)
           ORDER BY "createdAt" DESC LIMIT $${params.length}`,
          params
        );
        if (r25.rows.length > 0) {
          return { jobs: (r25.rows as DbJobRow[]).slice(0, limit).map((j: DbJobRow) => mapRowToJob(j, city)), scope: "provincia" };
        }
      }
    }

    // -- Estrategia 3: título en cualquier lugar del país -----------------
    const r3 = await pool.query(
      `SELECT id, title, company, city, province, salary, "sourceName", "sourceUrl"
       FROM "JobListing"
       WHERE "isActive" = true
         AND LOWER(title) LIKE $1
         AND (country = $2 OR LOWER(country) LIKE $3)
       ORDER BY "createdAt" DESC LIMIT $4`,
      [kw, isoCode, countryFilter, N]
    );
    if (r3.rows.length > 0) {
      return { jobs: (r3.rows as DbJobRow[]).slice(0, limit).map(j => mapRowToJob(j, city)), scope: "pais" };
    }

    // -- Estrategia 4: sinónimos del puesto -------------------------------
    const queryNorm = query.toLowerCase();
    for (const [key, syns] of Object.entries(SINONIMOS_PUESTO)) {
      if (queryNorm.includes(key) || syns.some(s => queryNorm.includes(s))) {
        for (const syn of [key, ...syns]) {
          const synPat = `%${syn}%`;
          const r4 = await pool.query(
            `SELECT id, title, company, city, province, salary, "sourceName", "sourceUrl"
             FROM "JobListing"
             WHERE "isActive" = true
               AND (LOWER(title) LIKE $1 OR LOWER(description) LIKE $1)
               AND (country = $2 OR LOWER(country) LIKE $3)
             ORDER BY "createdAt" DESC LIMIT $4`,
            [synPat, isoCode, countryFilter, N]
          );
          if (r4.rows.length > 0) {
            return { jobs: (r4.rows as DbJobRow[]).slice(0, limit).map(j => mapRowToJob(j, city)), scope: "sinonimo" };
          }
        }
        break;
      }
    }

    // -- Estrategia 5: APIs externas --------------------------------------
    const { buscarOfertasReales } = await import("@/lib/job-search/real-search");
    const extOfertas = await Promise.race([
      buscarOfertasReales(query, city, Math.min(limit * 2, 20)),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    if (extOfertas && extOfertas.length > 0) {
      return {
        jobs: extOfertas.slice(0, limit).map(o => ({
          id: String(o.id), titulo: String(o.titulo), empresa: String(o.empresa),
          ubicacion: String(o.ubicacion), salario: String(o.salario ?? "Ver en oferta"),
          fuente: String(o.fuente), match: Number(o.match ?? 0), url: String(o.url ?? ""),
        })),
        scope: "api",
      };
    }

    return null;
  } catch (e) {
    console.error("[Guzzi] Error en searchJobsReal:", (e as Error).message);
    return null;
  }
}

function fallbackMessage(puesto: string, ciudad: string): string {
  const syn = Object.entries(SINONIMOS_PUESTO).find(([k, v]) =>
    puesto.toLowerCase().includes(k) || v.some(s => puesto.toLowerCase().includes(s))
  );
  const sugerencias = syn
    ? `\n• 🔄 Prueba: "${syn[1][0]}" o "${syn[1][1]}"`
    : "\n• 🔄 Prueba con otro nombre del puesto";
  return `🔍 No encontré ofertas activas para **${puesto}**${ciudad ? ` en **${ciudad}**` : ""}.\n${sugerencias}\n• 📍 Amplía la zona (provincia o comunidad)\n• 🔍 Usa el buscador avanzado con más filtros\n• 📧 Activa alertas y te aviso cuando lleguen\n• 🏢 ¿Es una empresa pequeña o local? Dime el nombre y te busco en Google Maps con teléfono, email y web para enviar el CV directamente.\n\n✨ ¡El mercado se mueve a diario, vuelvo a mirar mañana!`;
}

function buildJobsText(puesto: string, ciudad: string, ofertas: unknown[], scope?: string): string {
  const scopeMsg = scope === "provincia"
    ? ` (en la provincia de ${ciudad})`
    : scope === "cercanas"
      ? ` (cerca de ${ciudad})`
      : scope === "pais"
        ? ` (en toda España)`
        : scope === "sinonimo"
          ? " (puestos relacionados)"
          : ciudad ? ` en **${ciudad}**` : "";

  let text = `🔍 **${ofertas.length} oferta${ofertas.length !== 1 ? "s" : ""}** de **${puesto}**${scopeMsg}:\n\n`;
  (ofertas as Array<{ titulo?: string; empresa?: string; ubicacion?: string; salario?: string; url?: string }>)
    .forEach((o, i) => {
      const em = ["🥇", "🥈", "🥉", "📌"][i] || "📌";
      const link = o.url ? ` — [Ver oferta](${o.url})` : "";
      text += `${em} **${o.titulo}**\n   📍 ${o.ubicacion} · 💰 ${o.salario || "Ver en oferta"}${link}\n\n`;
    });

  if (scope && scope !== "ciudad") {
    text += `ℹ️ _No encontré resultados exactos en "${ciudad}", te muestro los más cercanos._\n\n`;
  }
  text += `📧 **¿Envío tu CV a todas?** Di "sí" y me encargo.\n\n💡 _¿Buscas una empresa que no sale? Dime "busca [nombre]" y te doy email y teléfono con Google Maps._`;
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
  let clean = text.replace(/^(?:busca|busco|info|información|datos|dime|conoce|saber|rastrea|rastreame)\s+(?:sobre\s+)?(?:la\s+)?(?:empresa\s+)?/i, "").trim();
  // Quitar artículos y palabras de tipo de negocio del principio
  clean = clean.replace(/^(?:el|la|los|las|un|una)\s+/i, "");
  clean = clean.replace(/^(?:bar|restaurante|tienda|hotel|cafeter[ií]a|empresa|supermercado|taller|panader[ií]a|farmacia|cl[ií]nica|peluquer[ií]a|pizzer[ií]a|hamburgueser[ií]a|asador|sidrer[ií]a|taberna|bodega|mes[óo]n)\s+/i, "");
  // Quitar "en [ciudad]" o ", [ciudad]" del final
  clean = clean.replace(/\s+(?:en|por)\s+\w[\w\s]*$/i, "");
  clean = clean.replace(/,\s*\w[\w\s]*$/i, "");
  clean = clean.replace(/\s+para\s+echar\s+(?:el\s+)?curr[ií]culum.*$/i, "");
  if (clean.length >= 3 && clean.length <= 50 && !/(?:trabajo|empleo|cv|curriculum|oferta|buscar)/i.test(clean)) {
    return clean;
  }
  return null;
}

function localReply(intent: string, cv?: CVParsed | null): string {
  switch (intent) {
    case "foto":
      return "📸 **Cómo mejorar tu foto de CV con IA:**\n\nSube tu foto a ChatGPT (o cualquier IA con imagen) y usa este prompt:\n\n---\n*Utiliza esta foto para realizar los siguientes cambios:\n\n1. Crear un fondo blanco y cambiar todo el fondo actual.\n2. Cambiar la camiseta por una camisa blanca.\n3. Poner la figura en posición sentada.\n\nFotografía tamaño carnet hasta la altura de los hombros. Preséntalo para un currículum.*\n\n---\n\n**Resultado:** foto profesional lista para el CV. Una buena foto = +40% más respuestas. ";
    case "buscar":
      if (cv?.ultimoPuesto) {
        return `🔍 Conozco tu perfil (**${cv.ultimoPuesto}**${cv.ciudad ? ` en **${cv.ciudad}**` : ""}). Dime "buscar ofertas" y te muestro las que mejor encajan ahora mismo. También puedes usar el buscador avanzado. `;
      }
      return "🔍 Dime qué trabajo buscas y en qué ciudad o país, y te busco las mejores ofertas en toda Europa. ";
    case "enviar":
      return cv?.ultimoPuesto
        ? `📧 Basándome en tu CV (${cv.ultimoPuesto}), busca en 🔍 Buscar y usa el botón "Enviar CV" en cada oferta.`
        : "📧 Sube tu CV primero (botón clip de abajo) y luego te busco ofertas que encajen.";
    case "crear_cv":
      return "📝 ¡Vamos! ¿Cuál es tu nombre completo? (Te pregunto de uno en uno, facilísimo) ";
    case "cv_mejorado":
      return "✨ **Mejora de CV no disponible ahora mismo.**\n\nPuedo ayudarte con estos consejos mientras tanto:\n• Usa verbos de acción (logré, implementé, coordiné)\n• Incluye logros cuantificables (\"aumenté ventas un 20%\")\n• Adapta las palabras clave al puesto que buscas\n• Mantén el CV en 1-2 páginas máximo\n\n¿Quieres que te dé más consejos personalizados? ";
    case "entrevista_prep":
      return "🎯 **Preparación de entrevistas no disponible ahora mismo.**\n\nMientras tanto, aquí tienes un guion rápido:\n• Prepara 3 ejemplos con método STAR (Situación, Tarea, Acción, Resultado)\n• Investiga la empresa: sector, tamaño, noticias recientes\n• Prepara preguntas para hacer tú al final\n• Ensaya tu presentación de 1 minuto en voz alta\n\n¿Sobre qué puesto es la entrevista? Te ayudo a enfocarla. ";
    case "carta_recomendacion":
      return "✉️ **Carta de presentación no disponible en este momento.**\n\nMientras tanto, puedes estructurarla así:\n1. **Asunto**: Candidatura [Puesto] — [Tu Nombre]\n2. **Apertura**: por qué te interesa esa empresa en concreto\n3. **Cuerpo**: 2-3 logros que conecten con lo que buscan\n4. **Cierre**: disponibilidad para entrevista y despedida cordial\n\n¿Te ayudo a redactarla paso a paso? ";
    case "info_empresa":
      return "🏢 **No puedo consultar información de esa empresa ahora mismo.**\n\nPuedes buscar en:\n• **LinkedIn** — página de empresa y empleados\n• **Glassdoor** — opiniones de empleados y rangos salariales\n• **Google Maps** — sede, tamaño, sector\n\n¿Quieres que busque ofertas activas de esa empresa en nuestra base de datos? 🔍";
    case "buscar_au_pair":
      return "👶 **Búsqueda Au Pair** — dime el país donde quieres ser au pair (ej: 'busca au pair en Alemania' o 'au pair en Reino Unido') y te busco ofertas con familias que necesitan cuidadores. También puedo ayudarte con tu carta 'Dear Family'. ";
    case "carta_au_pair":
      return "💌 **Carta 'Dear Family'** — primero completa tu perfil Au Pair en la sección 🧒 del menú. Luego vuelve y dime 'crea mi carta au pair' para generarla personalizada con tus datos, experiencia con niños y fotos. ";
    default:
      return "¡Hola! Soy Guzzi, tu asistente de empleo. Puedo ayudarte con:\n\n🔍 Buscar ofertas de trabajo\n📝 Crear o mejorar tu CV\n🎯 Preparar entrevistas\n✉️ Cartas de presentación\n🌍 Información para emigrar\n💰 Comparar salarios\n\n¿En qué quieres que te ayude hoy?";
  }
}

// --- Rate Limiting ----------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minuto
const RATE_LIMIT_MAX = 20; // 20 mensajes por minuto

function checkRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, retryAfter: 0 };
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

// Limpieza periódica del Map (cada 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

// --- Handler principal --------------------------------------------------------

export async function POST(req: NextRequest) {
  // Rate limiting: por IP o userId
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
  const { allowed, retryAfter } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: `Demasiados mensajes. Espera ${retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

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

    // -- Verificar límites del plan --
    if (userId) {
      const { checkGuzziAccess } = await import("@/lib/guzzi-limits");
      const access = await checkGuzziAccess(userId);
      if (!access.allowed) {
        return NextResponse.json(
          { 
            error: access.errorMessage,
            plan: access.plan,
            planName: access.planName,
            upgradeUrl: "/app/perfil",
          },
          { status: 402 }
        );
      }
    }

    // Si hay userId, leer el CV fresco desde la BD (ignora el cvData del cliente)
    let cvData = cvDataFromClient;
    let auPairProfile: Record<string, unknown> | null = null;
    if (userId) {
      try {
        const { getPool } = await import("@/lib/db");
        const pool = getPool();
        // 1. Buscar en user_cvs (CV subido a Guzzi)
        const row = await pool.query(
          "SELECT form_data FROM user_cvs WHERE user_id = $1",
          [userId]
        );
        if (row.rows[0]?.form_data) {
          cvData = JSON.stringify(row.rows[0].form_data);
        }
        // 2. Si no hay en user_cvs, buscar en CV (editor de currículum Prisma)
        if (!cvData || cvData === "{}") {
          const cvRow = await pool.query(
            `SELECT "formData" FROM "CV" WHERE "userId" = $1 ORDER BY "updatedAt" DESC LIMIT 1`,
            [userId]
          );
          if (cvRow.rows[0]?.formData) {
            cvData = typeof cvRow.rows[0].formData === "string"
              ? cvRow.rows[0].formData
              : JSON.stringify(cvRow.rows[0].formData);
          }
        }
      } catch {
        // Si falla la BD, usar el cvData del cliente como fallback
      }

      // Cargar perfil Au Pair desde Supabase
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ojesordjedovnpyxspxi.supabase.co",
          process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        );
        const { data } = await supabase
          .from("au_pair_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        if (data) auPairProfile = data as Record<string, unknown>;
      } catch {
        // Sin perfil au pair, continuar normalmente
      }
    }

    const cvParsed = cvData ? parseCVData(cvData) : null;
    const groqKey = process.env.GROQ_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;

    async function callGroq(systemPrompt: string, userContent: string, maxTokens = 600) {
      if (!groqKey) return null;
      // /no_think desactiva el modo reasoning de Qwen3 - responde directamente en el idioma del sistema (español)
      const body = JSON.stringify({
        model: "qwen/qwen3-32b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "/no_think " + userContent },
        ],
        temperature: 0.6,
        max_tokens: maxTokens,
      });

      // Hasta 2 intentos con backoff
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
            body,
            signal: AbortSignal.timeout(20000),
          });
          if (!res.ok) {
            if (attempt === 0) { await new Promise(r => setTimeout(r, 800)); continue; }
            return null;
          }
          const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
          const raw = data.choices?.[0]?.message?.content || null;
          return raw ? raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() : null;
        } catch {
          if (attempt === 0) { await new Promise(r => setTimeout(r, 800)); continue; }
          return null;
        }
      }
      return null;
    }

    async function callDeepSeek(systemPrompt: string, userContent: string, maxTokens = 800) {
      if (!deepseekKey) return null;
      const body = JSON.stringify({
        model: "deepseek-v4-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.5,
        max_tokens: maxTokens,
      });

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${deepseekKey}`, "Content-Type": "application/json" },
            body,
            signal: AbortSignal.timeout(35000),
          });
          if (!res.ok) {
            if (attempt === 0) { await new Promise(r => setTimeout(r, 800)); continue; }
            return null;
          }
          const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
          return data.choices?.[0]?.message?.content?.trim() || null;
        } catch {
          if (attempt === 0) { await new Promise(r => setTimeout(r, 800)); continue; }
          return null;
        }
      }
      return null;
    }

    // -- Modo preparación de entrevista ---------------------------------------
    if (mode === "prep_entrevista") {
      const ctx = cvData ? `Datos del candidato:\n${cvParsed?.resumenTexto || cvData.slice(0, 400)}` : "";
      const content = `Entrevista: "${message}". ${ctx}`;
      const reply = await callGroq(PROMPT_ENTREVISTA, content, 800) || localReply("entrevista_prep");
      return NextResponse.json({ reply });
    }

    // -- Modo CV mejorado -----------------------------------------------------
    if (mode === "cv_mejorado" || detectIntent(message, history) === "cv_mejorado") {
      if (!cvData) {
        return NextResponse.json({
          reply: "📝 Para mejorar tu CV necesito tus datos. Súbelo en PDF (botón clip) o cuéntame tus datos aquí. ",
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
- Elabora cada experiencia con 3-4 responsabilidades típicas del puesto (ej: "Camarero" - atención al cliente, gestión de pedidos, preparación de bebidas, trabajo en equipo bajo presión)
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

    // -- Modo carta -----------------------------------------------------------
    if (mode === "carta_recomendacion" || detectIntent(message, history) === "carta_recomendacion") {
      // Extraer empresa/puesto del mensaje si el frontend no los pasó
      let cartaEmpresa = empresa || "";
      let cartaPuesto = puesto || "";
      if (!cartaEmpresa || !cartaPuesto) {
        // Patrones: "carta para [EMPRESA] de [PUESTO]", "carta de [PUESTO] en [EMPRESA]"
        const empMatch = message.match(/(?:carta\s+(?:de\s+)?(?:presentaci[oó]n|recomendaci[oó]n)\s+)?(?:para|en)\s+([A-ZÁÉÍÓÚÑ][A-Za-záéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúüñ]+){0,4})(?:\s+de\s+(.+?))?(?:\s*$)/);
        if (empMatch) {
          cartaEmpresa = cartaEmpresa || empMatch[1]?.trim() || "";
          cartaPuesto = cartaPuesto || empMatch[2]?.trim() || "";
        }
        // También: "de [PUESTO] en [EMPRESA]"
        if (!cartaPuesto) {
          const puestoMatch = message.match(/de\s+([a-záéíóúüñ]+(?:\s+[a-záéíóúüñ]+){0,3})\s+en\s+([A-ZÁÉÍÓÚÑ][A-Za-záéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúüñ]+){0,4})/i);
          if (puestoMatch) {
            cartaPuesto = cartaPuesto || puestoMatch[1]?.trim() || "";
            cartaEmpresa = cartaEmpresa || puestoMatch[2]?.trim() || "";
          }
        }
      }
      if (!cartaEmpresa || !cartaPuesto) {
        return NextResponse.json({
          reply: "✉️ Para la carta necesito:\n1. 🏢 Nombre de la empresa\n2. 🎯 Puesto al que aplicas\n\nDime los dos y te la genero ahora. ",
          action: "need_empresa_puesto",
        });
      }
      const ctx = cvData ? `Datos del candidato: ${cvParsed?.resumenTexto || cvData.slice(0, 400)}` : "";
      const content = `Empresa: ${cartaEmpresa}. Puesto: ${cartaPuesto}. ${ctx}`;
      // DeepSeek primario (mejor español), Groq fallback
      const reply = await callDeepSeek(PROMPT_CARTA, content, 800) || await callGroq(PROMPT_CARTA, content, 800) || localReply("carta_recomendacion");
      return NextResponse.json({ reply, action: "carta_recomendacion", empresa: cartaEmpresa, puesto: cartaPuesto });
    }

    // -- Intent: info empresa (Google Places) ----------------------------------
    const preIntent = detectIntent(message, history);
    if (preIntent === "info_empresa") {
      const companyName = extractCompanyName(message);
      const searchCity = extractCity(message) || "";

      // Si no es un nombre de empresa concreto, pero es búsqueda por sector+ciudad
      // (ej: "empresas de limpieza en Tudela", "bares en Corella")
      if (!companyName) {
        const sectorMatch = message.match(
          /(?:empresas?|negocios?|comercios?|tiendas?|f[aá]bricas?|bares?|restaurantes?|cafeter[ií]as?|talleres?|panader[ií]as?|farmacias?|cl[ií]nicas?|peluquer[ií]as?|supermercados?|hoteles?|de\\s+limpieza|de\\s+reparto)\\s+(?:de\\s+)?([a-záéíóúüñA-Z][\\w\\s]{2,40}?)(?:\\s+(?:en|por|cerca|de)\\s+(\\w[\\w\\s]+))?$/i
        );
        const sectorRaw = sectorMatch?.[2]?.trim();
        const cityFromSector = sectorMatch?.[3]?.trim() || searchCity;

        if (sectorRaw && cityFromSector) {
          return NextResponse.json({
            reply: `🏢 **${sectorRaw} en ${cityFromSector}** — ¿cómo quieres que busque?\n\n**1. 🔍 Empresa grande** — busco ofertas publicadas en portales de empleo\n**2. 📍 Negocio local** — busco en Google Maps (email, teléfono, para enviar CV directo)\n\nResponde **"grande"** o **"pequeña"** y me pongo.`,
            action: "choose_size",
            sector: sectorRaw,
            city: cityFromSector,
          });
        }

        return NextResponse.json({
          reply: "🏢 Dime el nombre de la empresa y te busco toda la información: email, teléfono, web, valoraciones... ",
          action: "need_company_name",
        });
      }

      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://buscaycurra.es";
        const searchCity = extractCity(message) || "";
        const extractRes = await fetch(`${siteUrl}/api/company/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: companyName, city: searchCity || undefined }),
          signal: AbortSignal.timeout(15000),
        });

        if (!extractRes.ok) {
          return NextResponse.json({
            reply: `🏢 No encontré información de **${companyName}** en Google Places. ¿Seguro que el nombre es correcto? Prueba con el nombre completo o la ciudad. `,
            action: "company_not_found",
          });
        }

        const extractData = await extractRes.json() as {
          success?: boolean;
          empresas?: Array<{
            nombre?: string; dominio?: string; urlWeb?: string;
            emailRrhh?: string; emailContacto?: string; emailsExtraidos?: string[];
            telefono?: string; paginaEmpleo?: string; descripcion?: string;
            sector?: string; linkedin?: string; twitter?: string; instagram?: string;
            fuente?: string; googleRating?: number; googleReviews?: number;
            googleAddress?: string; googleMapsUrl?: string;
          }>;
        };

        const empresa = extractData.empresas?.[0];
        if (!empresa || !empresa.nombre) {
          return NextResponse.json({
            reply: `🏢 No encontré información de **${companyName}** en Google Places. ¿Seguro que el nombre es correcto? Prueba con el nombre completo o la ciudad. `,
            action: "company_not_found",
          });
        }

        let reply = `🏢 **${empresa.nombre}**\n\n`;
        if (empresa.sector) reply += `📂 **Sector:** ${empresa.sector}\n`;
        if (empresa.googleRating) reply += `⭐ **Valoración Google:** ${empresa.googleRating}/5 (${empresa.googleReviews || "?"} reseñas)\n`;
        if (empresa.googleAddress) reply += `📍 ${empresa.googleAddress}\n`;
        if (empresa.telefono) reply += `📞 ${empresa.telefono}\n`;
        if (empresa.emailRrhh) reply += `📧 ${empresa.emailRrhh}\n`;
        if (empresa.urlWeb) reply += `🌐 [Web](${empresa.urlWeb})\n`;
        if (empresa.googleMapsUrl) reply += `🗺️ [Google Maps](${empresa.googleMapsUrl})\n`;
        reply += `\n📧 **¿Envío tu CV a ${empresa.nombre}?** Responde \"sí\" y me encargo.`;

        return NextResponse.json({
          reply,
          action: "company_info",
          company: empresa,
        });
      } catch {
        return NextResponse.json({
          reply: `🏢 **${companyName}** — no pude conectar con Google Places ahora. ¿Quieres que busque ofertas de esta empresa en nuestra base de datos? 🔍`,
          action: "company_search_fallback",
        });
      }
    }

    // -- Respuesta a choose_size: "grande" o "pequeña" -------------------------
    const isChooseSizeReply = /^(grande|pequeñ[oa]|pequen[oa]|local|negocio\\s+local|empresa\\s+grande|pequeñas?\\s+empresas?)$/i.test(message.trim());
    if (isChooseSizeReply) {
      const wantSmall = /^(pequeñ[oa]|pequen[oa]|local|negocio\\s+local|pequeñas?\\s+empresas?)$/i.test(message.trim());
      // Extraer sector+ciudad del último mensaje de Guzzi en el historial
      let sector = "";
      let city = "";
      const lastGuzziMsg = [...history].reverse().find((h: {role: string; text: string}) => h.role === "gusi");
      if (lastGuzziMsg) {
        const m = lastGuzziMsg.text.match(/\*\*(.+?)\*\*\s+en\s+\*\*(.+?)\*\*/);
        if (m) { sector = m[1]; city = m[2]; }
      }

      if (!sector || !city) {
        return NextResponse.json({
          reply: "Perdona, he perdido el hilo. ¿Qué sector y ciudad buscabas?",
          action: "need_keyword",
        });
      }

      if (wantSmall) {
        // Google Places para negocios locales
        try {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://buscaycurra.es";
          const extractRes = await fetch(`${siteUrl}/api/company/extract`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: `${sector} ${city}`, city }),
            signal: AbortSignal.timeout(15000),
          });

          if (extractRes.ok) {
            const extractData = await extractRes.json() as {
              empresas?: Array<{ nombre?: string; emailRrhh?: string; telefono?: string; googleAddress?: string; googleRating?: number; googleReviews?: number; sector?: string; }>;
            };
            const empresas = (extractData.empresas || []).slice(0, 5);
            if (empresas.length > 0) {
              const conEmail = empresas.filter(e => e.emailRrhh);
              let reply = `📍 **${empresas.length} negocios de ${sector} en ${city}** (Google Maps)\n\n`;
              empresas.forEach((e, i) => {
                reply += `${["🥇","🥈","🥉","📌","📌"][i]} **${e.nombre}**\n`;
                if (e.telefono) reply += `   📞 ${e.telefono}\n`;
                if (e.emailRrhh) reply += `   📧 ${e.emailRrhh}\n`;
                if (e.googleAddress) reply += `   📍 ${e.googleAddress}\n`;
                reply += "\n";
              });
              if (conEmail.length > 0) reply += `📧 ¿Envío tu CV a las ${conEmail.length} con email? Responde "sí" y las enviamos.`;
              return NextResponse.json({ reply, action: "sector_search_results" });
            }
          }
          return NextResponse.json({
            reply: `📍 No encontré negocios de **${sector}** en **${city}** en Google Maps.\n\n¿Quieres que busque por nombre exacto? Dame el nombre y te busco email y teléfono.`,
            action: "need_company_name",
          });
        } catch {
          return NextResponse.json({
            reply: `📍 No pude conectar con Google Maps. ¿Buscamos ofertas grandes de **${sector}** en **${city}**? Responde "grande".`,
            action: "need_keyword",
          });
        }
      } else {
        // Empresa grande - buscar en BD
        const result = await searchJobsReal(sector, city, 5, pais || "ES");
        if (result && result.jobs.length > 0) {
          return NextResponse.json({
            reply: `🔍 **${result.jobs.length} ofertas de ${sector} en ${city}**\n\n${buildJobsText(sector, city, result.jobs, result.scope)}`,
            jobs: result.jobs,
            action: "search_results",
          });
        }
        return NextResponse.json({
          reply: `🔍 No encontré ofertas grandes de **${sector}** en **${city}**.\n\n¿Quieres que busque **negocios locales** en Google Maps? Responde "pequeña".`,
          action: "need_keyword",
        });
      }
    }

    // -- Intent: buscar trabajo -----------------------------------------------
    const intent = detectIntent(message, history);

    // -- Intent: buscar au pair ----------------------------------------------
    if (intent === "buscar_au_pair" || mode === "buscar_au_pair") {
      const extractedCity = extractCity(message);
      const extractedCountry = extractCountryCode(message);
      const cityOrCountry = extractedCountry || extractedCity || (auPairProfile?.nationality as string) || "UK";

      const ofertas = await searchAuPairJobs(cityOrCountry, 5);
      if (!ofertas || ofertas.length === 0) {
        return NextResponse.json({
          reply: `👶 No encontré ofertas au pair para **${cityOrCountry}** ahora mismo.\n\nPero puedo ayudarte:\n• 💌 **Crear tu carta "Dear Family"** — dime "crea mi carta au pair"\n• 🌍 **Buscar en otro país** — dime "busca au pair en Alemania"\n• 📄 **Completar tu perfil** — en la sección Au Pair del menú `,
          action: "au_pair_no_results",
        });
      }
      return NextResponse.json({
        reply: `👶 **${ofertas.length} ofertas Au Pair** en **${cityOrCountry}**:\n\n${ofertas.map((o: Record<string, unknown>, i: number) => {
          const em = ["🥇", "🥈", "🥉", "📌"][i] || "📌";
          return `${em} **${(o as { titulo?: string }).titulo}**\n   🏠 ${(o as { empresa?: string }).empresa} · 📍 ${(o as { ubicacion?: string }).ubicacion}\n   💰 ${(o as { salario?: string }).salario}\n`;
        }).join("\n")}\n📧 **¿Quieres aplicar?** Ve a la sección Au Pair del menú para completar tu perfil con fotos y carta. `,
        jobs: ofertas,
        action: "au_pair_search_results",
      });
    }

    // -- Intent: carta au pair -----------------------------------------------
    if (intent === "carta_au_pair" || mode === "carta_au_pair") {
      if (!auPairProfile) {
        return NextResponse.json({
          reply: "💌 Para generar tu carta \"Dear Family\" primero necesitas crear tu perfil Au Pair.\n\nVe a la sección **Au Pair** del menú (🧒) y rellena:\n• Tus datos personales\n• Experiencia con niños\n• Fotos\n\nLuego vuelve y dime \"crea mi carta au pair\". ",
          action: "need_au_pair_profile",
        });
      }

      // Usar DeepSeek para generar carta personalizada
      try {
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        const nombre = auPairProfile.nombre || "el/la candidato/a";
        const edad = auPairProfile.age || "";
        const ciudad = auPairProfile.ciudad || "";
        const idiomas = Array.isArray(auPairProfile.languages) ? (auPairProfile.languages as string[]).join(", ") : "";
        const experiencia = auPairProfile.childcare_experience || "";
        const hobbies = auPairProfile.hobbies || "";
        const paisDestino = auPairProfile.nationality || "";

        if (deepseekKey) {
          const res = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${deepseekKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "deepseek-v4-pro",
              messages: [{
                role: "system",
                content: `Eres experto en cartas "Dear Family" para au pairs. Escribe en INGLÉS (idioma estándar internacional para au pair). La carta debe ser cálida, personal y profesional. Máximo 300 palabras. NO uses placeholders — usa los datos reales proporcionados.`
              }, {
                role: "user",
                content: `Genera una carta "Dear Family" para una au pair con estos datos:\n\nNombre: ${nombre}\nEdad: ${edad}\nCiudad: ${ciudad}\nIdiomas: ${idiomas}\nExperiencia con niños: ${experiencia}\nHobbies: ${hobbies}\nPaís de destino: ${paisDestino}\n\nLa carta debe incluir: presentación personal, experiencia con niños, por qué quiere ser au pair en ese país, hobbies y personalidad, y despedida cálida.`
              }],
              temperature: 0.7,
              max_tokens: 800,
            }),
            signal: AbortSignal.timeout(20000),
          });

          if (res.ok) {
            const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
            const letter = data.choices?.[0]?.message?.content || "";
            if (letter) {
              return NextResponse.json({
                reply: `💌 **Aquí tienes tu carta "Dear Family" personalizada:**\n\n${letter}\n\n✅ **¿Te gusta?** Puedes copiarla y pegarla en tu perfil Au Pair, o dime "cambia [lo que quieras modificar]" y la ajusto. \n\n🧒 También puedes ir a la sección **Au Pair** para guardarla en tu perfil.`,
                action: "au_pair_letter_generated",
                auPairLetter: letter,
              });
            }
          }
        }
        // Fallback: generar con plantilla si DeepSeek no disponible
        const { generarPlantillaLetter } = await import("@/lib/au-pair");
        const letter = generarPlantillaLetter({
          nombre: nombre as string,
          edad: edad ? parseInt(edad as string) : undefined,
          nacionalidad: paisDestino as string,
          ciudad: ciudad as string,
          idiomas: Array.isArray(auPairProfile.languages) ? auPairProfile.languages as string[] : [],
          experiencia: experiencia as string,
          hobbies: hobbies as string,
          paisDestino: paisDestino as string,
        });

        return NextResponse.json({
          reply: `💌 **Aquí tienes tu carta "Dear Family":**\n\n${letter}\n\n✅ Personalízala a tu gusto en la sección **Au Pair** del menú. `,
          action: "au_pair_letter_generated",
          auPairLetter: letter,
        });
      } catch (e) {
        return NextResponse.json({
          reply: `❌ Error al generar la carta: ${(e as Error).message}. Inténtalo de nuevo. `,
          action: "au_pair_letter_error",
        });
      }
    }

    if (intent === "buscar" || mode === "buscar") {
      // Detectar si el usuario está INSATISFECHO con los resultados anteriores
      const isDissatisfied = /(est[áa]n?\s+(muy\s+)?lejos|no\s+me\s+sirve|demasiado\s+lejos|busca\s+otra?\s+cosa|algo\s+diferente|mejor\s+(salario|horario|sueldo)|no\s+es\s+lo\s+que\s+busco|cerca\s+de|m[áa]s\s+cerca)/i.test(message);

      // Lo que el usuario PIDE explícitamente tiene prioridad sobre el CV
      const extractedJob = extractJobTerm(message);
      const puestoBusqueda = extractedJob || cvParsed?.ultimoPuesto || "";
      const extractedCity = extractCity(message);
      const ciudadBusqueda = extractedCity || cvParsed?.ciudad || "";

      // Si el usuario está insatisfecho y no especifica nuevo puesto, pedir aclaración
      // en vez de repetir los mismos resultados
      if (isDissatisfied && !extractedJob) {
        return NextResponse.json({
          reply: `Entendido, busquemos algo diferente. ¿Qué tipo de trabajo te interesa? Dime el puesto (ej: "camarero", "administrativo", "electricista") y te busco al instante.`,
          action: "need_keyword",
        });
      }

      // Si el usuario menciona una ciudad pero NO un puesto, no usar el puesto del CV
      if (!puestoBusqueda) {
        return NextResponse.json({
          reply: "🔍 Claro, ¿qué tipo de trabajo buscas? Dime el puesto y la ciudad (ej: 'camarero en Madrid') y te busco al instante. ",
          action: "need_keyword",
        });
      }

      // Si no hay ciudad ni en mensaje ni en CV, preguntar ANTES de buscar
      if (!ciudadBusqueda) {
        return NextResponse.json({
          reply: `🔍 Vale, busco ofertas de **${puestoBusqueda}**. Pero necesito saber dónde. ¿En qué ciudad o zona estás buscando?`,
          action: "need_city",
        });
      }

      if (puestoBusqueda) {
        const result = await searchJobsReal(puestoBusqueda, ciudadBusqueda, 5, pais || "ES");
        if (!result || result.jobs.length === 0) {
          // Buscar negocios locales en Google Places como alternativa
          let googleReply = "";
          if (ciudadBusqueda) {
            try {
              const negocios = await buscarNegociosLocales(puestoBusqueda, ciudadBusqueda);
              if (negocios.length > 0) {
                googleReply = `\n\nPero he buscado negocios locales en **${ciudadBusqueda}** que podrían necesitar a alguien como tú:\n\n`;
                for (const n of negocios.slice(0, 4)) {
                  const ratingStr = n.rating ? ` ⭐ ${n.rating}/5` : "";
                  const addrStr = n.formatted_address ? `\n   📍 ${n.formatted_address}` : "";
                  const phoneStr = n.formatted_phone_number ? `\n   📞 ${n.formatted_phone_number}` : "";
                  googleReply += `🏢 **${n.name}**${ratingStr}${addrStr}${phoneStr}\n\n`;
                }
                googleReply += `📧 ¿Quieres que envíe tu CV a alguno de estos? Responde **"sí"** y elige cuál.`;
              }
            } catch { /* sin Google Places, solo mensaje normal */ }
          }

          return NextResponse.json({
            reply: (cvParsed?.ultimoPuesto
              ? `Basándome en tu CV (último puesto: **${cvParsed.ultimoPuesto}**), ` : "") +
              (googleReply || fallbackMessage(puestoBusqueda, ciudadBusqueda)),
            action: googleReply ? "search_results" : "no_results",
          });
        }
        // Si los resultados NO son de la ciudad exacta, buscar en Google Places
        if (ciudadBusqueda && result.scope && result.scope !== "ciudad") {
          // Buscar negocios locales automáticamente
          let googleReply = "";
          try {
            const negocios = await buscarNegociosLocales(puestoBusqueda, ciudadBusqueda);
            if (negocios.length > 0) {
              googleReply = `\n\nPero he buscado negocios locales en **${ciudadBusqueda}** que podrían necesitar a alguien como tú:\n\n`;
              for (const n of negocios.slice(0, 4)) {
                const ratingStr = n.rating ? ` ⭐ ${n.rating}/5` : "";
                const addrStr = n.formatted_address ? `\n   📍 ${n.formatted_address}` : "";
                const phoneStr = n.formatted_phone_number ? `\n   📞 ${n.formatted_phone_number}` : "";
                googleReply += `🏢 **${n.name}**${ratingStr}${addrStr}${phoneStr}\n\n`;
              }
              googleReply += `📧 ¿Quieres que envíe tu CV a alguno de estos? Responde **"sí"** y elige cuál.`;
            }
          } catch { /* sin Google Places, solo mensaje normal */ }

          return NextResponse.json({
            reply: `🔍 No encontré ofertas de **${puestoBusqueda}** en **${ciudadBusqueda}** ni en sus alrededores.${googleReply}\n\n¿Buscamos en **toda España**? Responde **"sí, busca en toda España"** y amplío.`,
            action: "search_scope_pais",
          });
        }
        const prefix = cvParsed?.ultimoPuesto
          ? `Basándome en tu CV (último puesto: **${cvParsed.ultimoPuesto}**), aquí tienes lo mejor que encontré:\n\n`
          : "";
        return NextResponse.json({
          reply: prefix + buildJobsText(puestoBusqueda, ciudadBusqueda, result.jobs, result.scope),
          jobs: result.jobs,
          action: "search_results",
        });
      }
    }

    // -- Intent: enviar CV a negocio local (GOOGLE PLACES - REAL SEND) --------
    if (intent === "send_cv_local_confirm") {
      // Extraer contexto del historial: empresa, teléfono, puesto
      const histText = history.slice(-6).map((m: { text: string }) => m.text).join("\n");
      const empresaMatch = histText.match(/(?:BAR|Bar|Restaurante|Cafeter[ií]a|Tienda|Hotel|Taller|Panader[ií]a|Farmacia|Cl[ií]nica|Peluquer[ií]a|Barber[ií]a|Centro\\s+de\\s+[Bb]elleza|Sal[oó]n|Est[eé]tica|SPA|Gimnasio|Lavander[ií]a|Supermercado|Fruter[ií]a|Carnicer[ií]a|Pescader[ií]a)\\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúüñ\\s]+?)(?:\\n|\\||·|-|—|\\.|$)/);
      const telefonoMatch = histText.match(/(?:tel[eé]fono|telf?|📞)\s*[:\s]*\+?(\(?\d{2,3}\)?[\s\-]?\d{2,3}[\s\-]?\d{2,3}[\s\-]?\d{2,3})/i);
      const puestoMatch = histText.match(/(?:puesto|trabajo|como|de)\s+(camarero[\/a]*|cocinero[\/a]*|ayudante[\s\w]*|repartidor[\/a]*|limpiador[\/a]*|dependiente[\/a]*|mozo[\/a]*)/i);

      const empresaNombre = empresaMatch?.[1]?.trim() || "Empresa local";
      const telefono = telefonoMatch?.[1]?.replace(/[\s\-\(\)]/g, "") || "";
      const puesto = puestoMatch?.[1]?.trim() || cvParsed?.ultimoPuesto || "Candidatura espontánea";

      // Construir datos reales del CV para la carta
      const cvResumen = cvData ? JSON.stringify(cvData).slice(0, 800) : (
        cvParsed ? [
          cvParsed.nombre ? `Nombre: ${cvParsed.nombre}` : "",
          cvParsed.ultimoPuesto ? `Último puesto: ${cvParsed.ultimoPuesto}` : "",
          cvParsed.resumenTexto ? `Experiencia: ${cvParsed.resumenTexto}` : "",
          cvParsed.ciudad ? `Ciudad: ${cvParsed.ciudad}` : "",
        ].filter(Boolean).join(". ") : "Sin datos de CV"
      );

      // Generar carta adaptada y CV usando DeepSeek
      const deepseekKey = process.env.DEEPSEEK_API_KEY || "";
      let adaptedCv = "";
      let coverLetter = "";

      if (deepseekKey) {
        const promptAdaptacion = `Eres un experto en recruiting. Adapta un CV para el puesto de "${puesto}" en "${empresaNombre}". 

Datos del candidato (CV real):
- Puesto: ${cvParsed?.ultimoPuesto || "No especificado"}
- Experiencia: ${cvResumen}
- Ciudad: ${cvParsed?.ciudad || "Tudela"}

El negocio es local/pequeño (hostelería, comercio, etc.). 
IMPORTANTE: NO inventes experiencia que no existe. Usa SOLO los datos proporcionados arriba. Si no hay suficiente información, sé honesto y sugiere un CV genérico con habilidades transferibles.

Responde en JSON exactamente así:
{"carta":"<carta breve 2-3 frases, personal, cálida, directa al dueño/encargado>","cv":"<CV adaptado: perfil profesional + experiencia relevante + habilidades, máximo 200 palabras>"}`;

        try {
          const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekKey}` },
            body: JSON.stringify({
              model: "deepseek-v4-pro",
              messages: [{ role: "user", content: promptAdaptacion }],
              max_tokens: 800,
              temperature: 0.5,
              extra_body: { thinking: { type: "disabled" } },
            }),
            signal: AbortSignal.timeout(30000),
          });
          if (dsRes.ok) {
            const dsData = await dsRes.json() as { choices?: Array<{ message?: { content?: string } }> };
            const content = dsData.choices?.[0]?.message?.content || "";
            const jsonMatch = content.match(/\{[^}]*"carta"[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              coverLetter = parsed.carta || "";
              adaptedCv = parsed.cv || "";
            }
          }
        } catch (e) { console.error("[send_cv_local_confirm] DeepSeek error:", (e as Error).message); }
      }

      if (!adaptedCv) {
        adaptedCv = `Profesional con experiencia en ${cvParsed?.ultimoPuesto || "atención al público"} buscando oportunidad en hostelería. Destaco por mi capacidad de aprendizaje rápido, trabajo en equipo y actitud proactiva.`;
      }
      if (!coverLetter) {
        coverLetter = `Hola, equipo de ${empresaNombre}. Soy ${cvParsed?.nombre || "Michel"}, vivo en ${cvParsed?.ciudad || "Tudela"} y me encantaría trabajar con vosotros. Tengo muchas ganas de aprender y aportar mi energía al equipo. ¿Podemos hablar?`;
      }

      // Llamar al endpoint de envío real
      try {
        const sendRes = await fetch(`http://localhost:3000/api/gusi/send-cv-local`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            companyName: empresaNombre,
            companyPhone: telefono,
            companyEmail: "",
            puesto,
            adaptedCv,
            coverLetter,
          }),
        });
        const sendData = await sendRes.json();

        if (sendData.needsEmail) {
          // Sin email — pedir al usuario
          return NextResponse.json({
            reply: `No tengo el email de **${sendData.companyName || empresaNombre}**${sendData.companyPhone ? ` (📞 ${sendData.companyPhone})` : ""}.\n\n📧 ¿Me lo puedes pasar? Así lo envío ahora mismo.\n\nTambién puedes:\n- Pasarte en persona con el CV (causa mejor impresión)\n- Llamar y preguntar por el email de RRHH`,
            action: "send_cv_flow",
          });
        }

        return NextResponse.json({
          reply: `✅ **¡Hecho!**\n\nHe generado tu CV adaptado con la plantilla profesional y la carta de presentación para **${empresaNombre}**.\n\n${sendData.message}\n\n📄 ${sendData.pdfUrl ? `[Ver CV generado](${sendData.pdfUrl})` : ""}\n\n💡 **Recomendación**: Pásate mañana a media mañana por ${empresaNombre} y refuerza la candidatura en persona. ¡Así te recuerdan!`,
          action: "cv_sent_local",
        });
      } catch (sendErr) {
        console.error("[send_cv_local_confirm] Send error:", (sendErr as Error).message);
        return NextResponse.json({
          reply: `Lo siento, ha fallado el envío automático. Pero tengo tu CV y la carta listos.\n\n📧 Ve a [la página de envíos](/app/envios) o dime un email de ${empresaNombre} y lo intentamos de nuevo.`,
          action: "send_cv_flow",
        });
      }
    }

    // -- Intent: enviar CV ----------------------------------------------------
    if (intent === "enviar") {
      if (!cvData) {
        return NextResponse.json({
          reply: "📧 Para enviar tu CV necesito que lo subas primero.\n\nUsa el clip 📎 de abajo para subir tu CV en PDF o escribe **'crear cv'** y te lo hago paso a paso. ",
          action: "send_cv_flow",
        });
      }
      // ¿El usuario menciona una empresa concreta?
      const empresaMatch = message.match(/(?:a|para|en)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúüñ]+){0,3})\s*$/);
      const empresaNombre = empresaMatch?.[1]?.trim();
      if (empresaNombre && empresaNombre.length >= 3) {
        return NextResponse.json({
          reply: `📧 ¡Perfecto! Para enviar tu CV a **${empresaNombre}** necesito el email de la empresa.\n\nTienes 3 opciones:\n\n**1. Pegar la web** de la empresa - busco el email de RRHH yo solo\n**2. Darme el email** directamente - si ya lo tienes\n**3. Solo registrar** - si ya aplicaste y quieres hacer seguimiento\n\nVe a la página de envíos para completar el proceso - [✍️ Ir a Envíos](/app/envios?empresa=${encodeURIComponent(empresaNombre)})`,
          action: "send_cv_flow",
        });
      }
      // Buscar ofertas del perfil del usuario que tengan email para enviar
      const puestoEnviar = extractJobTerm(message) || cvParsed?.ultimoPuesto || "";
      const ciudadEnviar = extractCity(message) || cvParsed?.ciudad || "";
      if (puestoEnviar) {
        if (!ciudadEnviar) {
          return NextResponse.json({
            reply: `📧 Vale, busco ofertas de **${puestoEnviar}** para enviar CVs. ¿En qué ciudad?`,
            action: "need_city",
          });
        }
        const enviarResult = await searchJobsReal(puestoEnviar, ciudadEnviar, 5, pais || "ES");
        if (enviarResult && enviarResult.jobs.length > 0) {
          // Filtrar resultados no locales
          if (ciudadEnviar && enviarResult.scope && !["ciudad","provincia","cercanas"].includes(enviarResult.scope)) {
            return NextResponse.json({
              reply: `📧 No encontré ofertas de **${puestoEnviar}** en **${ciudadEnviar}** ni cerca. ¿Busco en toda España?`,
              action: "search_scope_pais",
            });
          }
          return NextResponse.json({
            reply: `📧 **¡A enviar CVs!**\n\nEncontré ${enviarResult.jobs.length} ofertas de **${puestoEnviar}**${ciudadEnviar ? ` en **${ciudadEnviar}**` : ""}.\n\nPulsa **"Enviar CV"** en cualquiera de ellas para personalizar la carta, elegir la hora de envío y mandarlo.\n\n${buildJobsText(puestoEnviar, ciudadEnviar, enviarResult.jobs, enviarResult.scope)}`,
            jobs: enviarResult.jobs,
            action: "search_results",
          });
        }
        return NextResponse.json({
          reply: fallbackMessage(puestoEnviar, ciudadEnviar) + "\n\n📧 Si conoces alguna empresa directamente, dime su nombre y te ayudo a enviarle el CV. ",
          action: "search_results",
        });
      }
      return NextResponse.json({
        reply: "📧 Claro, ¿para qué tipo de trabajo quieres enviar CVs? Dime el puesto y la ciudad (ej: 'camarero en Tudela') y te busco ofertas con email para enviar directamente. ",
        action: "send_cv_flow",
      });
    }

    // -- Chat normal con IA ---------------------------------------------------
    const systemPrompt = buildSystemPrompt(cvData, pais, auPairProfile);
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

    // Chat normal: DeepSeek primero (mejor español), Groq como fallback
    let rawReply = "";

    // Intento 1: DeepSeek (sin /no_think, no lo necesita)
    if (deepseekKey) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekKey}` },
            body: JSON.stringify({ model: "deepseek-v4-pro", messages, max_tokens: 1024, temperature: 0.5 }),
            signal: AbortSignal.timeout(35000),
          });
          if (res.ok) {
            const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
            rawReply = data.choices?.[0]?.message?.content || "";
            if (rawReply) break;
          } else {
            console.error("[Guzzi] DeepSeek HTTP", res.status, await res.text().catch(()=>""));
          }
        } catch (e) { console.error("[Guzzi] DeepSeek error:", (e as Error).message); }
        if (attempt === 0) await new Promise(r => setTimeout(r, 600));
      }
    } else {
      console.error("[Guzzi] DeepSeek key MISSING");
    }

    // Intento 2: Groq (fallback con /no_think)
    if (!rawReply && groqKey) {
      const msgsConNoThink = messages.map((m, i) =>
        i === messages.length - 1 && m.role === "user"
          ? { ...m, content: "/no_think " + m.content }
          : m
      );
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
            body: JSON.stringify({ model: "qwen/qwen3-32b", messages: msgsConNoThink, max_tokens: 1024, temperature: 0.7 }),
            signal: AbortSignal.timeout(20000),
          });
          if (res.ok) {
            const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
            rawReply = data.choices?.[0]?.message?.content || "";
            if (rawReply) break;
          } else {
            console.error("[Guzzi] Groq HTTP", res.status, await res.text().catch(()=>""));
          }
        } catch (e) { console.error("[Guzzi] Groq error:", (e as Error).message); }
        if (attempt === 0) await new Promise(r => setTimeout(r, 800));
      }
    } else if (!rawReply) {
      console.error("[Guzzi] Groq key MISSING or DeepSeek already succeeded");
    }

    if (!rawReply) {
      console.error("[Guzzi] AI call failed — both DeepSeek and Groq returned no reply. Falling back to localReply.");
      return NextResponse.json({ reply: localReply(intent, cvParsed) });
    }
    let reply = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() || localReply(intent, cvParsed);

    // 🔒 ANTI-ALUCINACIÓN: detectar emails inventados en respuestas del chat general
    const hasFakeEmails = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(reply);
    const claimsSending = /(?:he\\s+enviado|estoy\\s+enviando|envi[ée]\\s+tu\\s+CV|CV\\s+enviado|te\\s+lo\\s+he\\s+enviado|les\\s+estoy\\s+enviando|les\\s+he\\s+enviado|ya\\s+est[aá]n?\\s+enviados|enviados?\\s+a\\s+\\d+\\s+empresas)/i.test(reply);
    if (hasFakeEmails && claimsSending && intent === "chat") {
      console.error("[Guzzi] ANTI-ALUCINACIÓN: bloqueada respuesta con emails inventados + afirmación de envío");
      reply = "📧 Para enviar tu CV, usa el botón **Enviar CV** en cada oferta. Yo no puedo inventar emails ni hacer envíos masivos automáticos.\n\nSi quieres, dime el nombre de UNA empresa concreta y te busco su contacto real.";
    }

    return NextResponse.json({ reply });

  } catch (err) {
    console.error("[Guzzi] FATAL catch:", (err as Error).message, (err as Error).stack?.split("\n").slice(0,3).join(" | "));
    return NextResponse.json({ reply: "¡Ups! Algo falló. Inténtalo de nuevo " });
  }
}

function extractJobTerm(text: string): string {
  // "[categoría] [nombre negocio] [dirección] [ciudad]" — buscar negocio concreto por nombre
  // ej: "peluquería enjoy estilistas calle almajares 17 tudela"
  const negocioMatch = text.match(/(?:peluquer[ií]a|barber[ií]a|restaurante|bar\b|hotel|cafeter[ií]a|cl[ií]nica|farmacia|panader[ií]a|tienda|taller|supermercado|sal[oó]n|est[eé]tica|gimnasio|lavander[ií]a|fruter[ií]a|carnicer[ií]a|pescader[ií]a)\s+(.+?)(?:\s+(?:calle|plaza|avenida|avda|paseo|crta|carretera|c\/)\s|\s+\d{4,5}\s|\s*$)/i);
  if (negocioMatch?.[1]?.trim()) {
    const nombre = negocioMatch[1].trim();
    const words = nombre.split(/\s+/);
    // Tomar solo las palabras que forman el nombre (antes de calle/plaza/números)
    const nameParts: string[] = [];
    for (const w of words) {
      if (/^(calle|plaza|avenida|avda|paseo|crta|carretera|c\/|\d+)$/i.test(w)) break;
      nameParts.push(w);
    }
    const businessName = nameParts.join(" ");
    if (businessName.length >= 3) return businessName;
  }
  const stopwords = new Set(["trabajo", "empleo", "curro", "oferta", "algo", "en", "por", "para", "que", "lo", "la", "el", "un", "una"]);
  // "[puesto] en [ciudad]" — patrón más común (ej: "camarero en Tudela")
  const mDirect = text.match(/(?:^|\s)([a-záéíóúüñA-Z][a-záéíóúüñA-Z\s]+?)\s+(?:en|por)\s+\w+/i);
  if (mDirect?.[1]?.trim()) {
    let job = mDirect[1].trim();
    const prefixVerbs = ["busca", "busco", "buscar", "buscando", "necesito", "necesita", "quiero", "quiere", "búsqueda de", "busqueda de", "me interesa", "me gustaría", "estoy buscando", "quiero trabajar de", "quiero curro de", "rastreame", "rastrea", "rastrear", "búscame", "encuéntrame", "localízame", "encuentrame", "localizame", "échame un ojo a", "quiero echar", "quiero tirar", "quiero dejar", "voy a echar", "voy a tirar", "voy a dejar", "echar", "tirar", "dejar"];
    // Limpiar "currículum/CV en [lugar]" del job term
    job = job.replace(/\s+(?:el\s+)?(?:curr[ií]culum|curriculo|cv)\s*(?:en|por)?\s*$/i, "");
    job = job.replace(/\s+(?:el\s+)?(?:curr[ií]culum|curriculo|cv)\s+(?:en|por)\s+\w[\w\s]*$/i, "");
    for (const v of prefixVerbs) {
      job = job.replace(new RegExp(`^${v}\\s+`, "i"), "");
    }
    const genericPrefixes = ["trabajo de", "trabajo como", "empleo de", "empleo como", "trabajo", "empleo", "curro", "oferta"];
    // Limpiar sufijos: "para echar currículum", "para enviar CV", etc.
    job = job.replace(/\s+para\s+echar\s+(?:el\s+)?curr[íi]culum.*$/i, "");
    job = job.replace(/\s+para\s+(?:enviar|mandar|tirar)\s+(?:el\s+)?(?:cv|curr[íi]culum).*$/i, "");
    for (const g of genericPrefixes) {
      job = job.replace(new RegExp(`^${g}\\s+`, "i"), "");
    }
    job = job.trim();
    const genericWords = ["trabajo", "empleo", "curro", "oferta", "algo", "hola"];
    if (!genericWords.includes(job.toLowerCase()) && job.length >= 3) return job;
  }
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
  // "busco camarero en Madrid" — captura directamente el puesto sin "trabajo de"
  const m5 = text.match(/(?:busco|busca)\s+((?!trabajo\b|empleo\b|curro\b|oferta\b)[a-záéíóúüñA-Z][a-záéíóúüñA-Z\s]{1,30}?)(?:\s+en\s+|\s*$)/i);
  if (m5?.[1]?.trim() && !stopwords.has(m5[1].trim().toLowerCase())) return m5[1].trim();
  // "me interesa / estoy buscando [puesto]"
  const m6 = text.match(/(?:me\s+interesa|estoy\s+buscando|necesito\s+trabajo\s+de|quiero\s+trabajar\s+de)\s+([a-záéíóúüñA-Z][a-záéíóúüñA-Z\s]+?)(?:\s+en\s+|\s*$)/i);
  if (m6?.[1]?.trim()) return m6[1].trim();
  // "echar/tirar/dejar (el) currículum/CV en [puesto/lugar]" - extraer puesto
  const m6b = text.match(/(?:echar|tirar|dejar|entregar|repartir)\s+(?:el\s+)?(?:curr[ií]culum|curriculo|cv)\s+(?:en|por)\s+(?:el\s+|la\s+|los\s+|las\s+)?([a-záéíóúüñA-Z][a-záéíóúüñA-Z\s]+?)(?:\s+(?:en|por|de)\s+\w+|\s*$)/i);
  if (m6b?.[1]?.trim()) return m6b[1].trim();
  // fallback generico
  const m7 = text.match(/(?:busco|buscar|necesito)\s+(?:trabajo|empleo)?\s*(?:de\s+|como\s+)(.+?)(?:\s+en\s+|$)/i);
  const fallback = m7?.[1]?.trim() || "";
  return stopwords.has(fallback.toLowerCase()) ? "" : fallback;
}

function extractCity(text: string): string {
  const cities = [
    // España — grandes ciudades + municipios navarros y cercanos
    "madrid", "barcelona", "valencia", "sevilla", "málaga", "bilbao", "zaragoza",
    "murcia", "pamplona", "tudela", "navarra", "alicante", "córdoba", "granada",
    "vitoria", "san sebastián", "santander", "toledo", "cádiz", "palma",
    // Navarra (comunes)
    "fustiñana", "cintruénigo", "corella", "estella", "tafalla", "tudelilla",
    "cascante", "castejón", "burlada", "barañain", "zizur", "villava",
    "murchante", "monteagudo", "milagro", "azagra", "san adrián", "peralta",
    "andosilla", "marcilla", "olite", "tudela de duero",
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
  
  // 1. Lista hardcodeada (rápido, ciudades grandes)
  for (const c of cities) {
    if (t.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }
  
  // 2. Regex genérico: cualquier palabra(s) tras "en" → captura municipios no listados
  //    Ej: "operario en Fustiñana" → "Fustiñana"
  //    Ej: "camarero en San Sebastián de los Reyes" → "San Sebastián de los Reyes"
  const enMatch = t.match(/en\s+([a-záéíóúñü]+(?:\s+(?:de\s+|la\s+|las\s+|los\s+|el\s+|del\s+)?[a-záéíóúñü]+){0,3})/i);
  if (enMatch) {
    const city = enMatch[1].trim();
    // Filtrar palabras que NO son ciudades
    const nonCities = ['españa', 'alemania', 'francia', 'italia', 'portugal', 'irlanda',
      'holanda', 'suiza', 'suecia', 'noruega', 'dinamarca', 'finlandia', 'austria',
      'bélgica', 'canadá', 'australia', 'remoto', 'casa', 'oficina', 'híbrido',
      'teletrabajo', 'mi', 'el', 'la', 'los', 'las', 'todo', 'cualquier',
      'empresa', 'general', 'total'];
    if (!nonCities.includes(city) && city.length > 2) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  
  return "";
}

// Detecta código de país en el mensaje (para búsquedas au pair)
function extractCountryCode(text: string): string {
  const t = text.toLowerCase();
  const countryMap: Record<string, string> = {
    "reino unido": "GB", "uk": "GB", "inglaterra": "GB", "londres": "GB", "united kingdom": "GB",
    "alemania": "DE", "germany": "DE", "berlin": "DE", "berlín": "DE",
    "francia": "FR", "france": "FR", "paris": "FR", "parís": "FR",
    "irlanda": "IE", "ireland": "IE", "dublin": "IE", "dublín": "IE",
    "holanda": "NL", "netherlands": "NL", "países bajos": "NL", "amsterdam": "NL",
    "dinamarca": "DK", "denmark": "DK", "copenhagen": "DK", "copenhague": "DK",
    "suecia": "SE", "sweden": "SE", "stockholm": "SE", "estocolmo": "SE",
    "noruega": "NO", "norway": "NO", "oslo": "NO",
    "bélgica": "BE", "belgium": "BE", "bruselas": "BE",
    "australia": "AU", "sydney": "AU", "melbourne": "AU",
    "canadá": "CA", "canada": "CA", "toronto": "CA", "vancouver": "CA",
    "nueva zelanda": "NZ", "new zealand": "NZ",
    "suiza": "CH", "switzerland": "CH", "zurich": "CH", "zúrich": "CH",
    "austria": "AT", "vienna": "AT", "viena": "AT",
    "finlandia": "FI", "finland": "FI", "helsinki": "FI",
    "italia": "IT", "italy": "IT", "roma": "IT",
    "portugal": "PT", "lisboa": "PT",
    "españa": "ES", "spain": "ES", "madrid": "ES",
    "estados unidos": "US", "usa": "US", "eeuu": "US", "united states": "US",
  };
  for (const [name, code] of Object.entries(countryMap)) {
    if (t.includes(name)) return code;
  }
  return "";
}

// --- Búsqueda de ofertas Au Pair ------------------------------------------

async function searchAuPairJobs(country: string, limit = 5) {
  try {
    const { getPool } = await import("@/lib/db");
    const pool = getPool();

    // Palabras clave au pair en varios idiomas
    const auPairTerms = ["au pair", "aupair", "au-pair", "nanny", "niñera", "childcare", "child care", "babysitter", "canguro", "live-in caregiver", "live in nanny", "live-in nanny", "niñera interna", "nanny profesional", "full-time nanny"];
    const conditions = auPairTerms.map((_, i) => `LOWER(title) LIKE $${i + 1}`).join(" OR ");
    const params = auPairTerms.map(t => `%${t}%`);

    let countryCondition = "";
    const auPairCountries = "'GB','UK','IE','DE','FR','NL','DK','SE','NO','BE','AU','US','NZ','CA','ES','IT','PT','CH','AT','FI'";
    
    if (country && country !== "ES") {
      // Si el usuario pide un país específico, filtrar SOLO ese país
      // UK/GB: DB tiene 'uk' y 'GB' mezclados — buscar ambos
      if (country === "GB" || country === "UK") {
        params.push(`%uk%`, `%gb%`);
        countryCondition = `AND (LOWER(country) LIKE $${params.length - 1} OR LOWER(country) LIKE $${params.length})`;
      } else {
        params.push(`%${country.toLowerCase()}%`);
        countryCondition = `AND LOWER(country) LIKE $${params.length}`;
      }
    }

    const limitParamIndex = params.length + 1;
    const query = `
      SELECT id, title, company, city, province, country, salary, description, "sourceName", "sourceUrl", "scrapedAt"
      FROM "JobListing"
      WHERE (${conditions})
        AND (${country && country !== "ES" ? "1=1" : `country IN (${auPairCountries})`}${countryCondition})
      ORDER BY "scrapedAt" DESC
      LIMIT $${limitParamIndex}::int
    `;
    params.push(String(limit));

    const result = await pool.query(query, params);

    if (result.rows.length > 0) {
      console.log(`[Guzzi] Au Pair BD: ${result.rows.length} ofertas`);
      return result.rows.map((j: Record<string, unknown>) => ({
        id: `db-${j.id}`,
        titulo: j.title as string,
        empresa: (j.company as string) || "Familia anfitriona",
        ubicacion: (j.city || j.country || "") as string,
        salario: (j.salary as string) || "Paga de bolsillo + alojamiento",
        fuente: (j.sourceName as string) || "BuscayCurra",
        url: (j.sourceUrl as string) || "",
        match: 0,
      }));
    }
    return null;
  } catch (e) {
    console.error("[Guzzi] Error en searchAuPairJobs:", (e as Error).message);
    return null;
  }
}
