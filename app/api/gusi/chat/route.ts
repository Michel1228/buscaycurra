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

═══════════════════════════════════════════
CONOCIMIENTO COMPLETO DE LA APP (CRUCIAL)
═══════════════════════════════════════════

BuscayCurra es una plataforma española de empleo con +600.000 ofertas de trabajo en 34 países. Tiene las siguientes secciones — DEBES saber guiar al usuario a la correcta:

📍 /app — Dashboard principal
  - Muestra el "camino de metamorfosis": perfil → CV → buscar → enviar → ¡trabajo!
  - Stats personales: CVs enviados hoy/semana, empresas, tasa de respuesta
  - Botón "¡Encontré trabajo!" que revela la mariposa única del usuario (50 especies)

📄 /app/curriculum — Gestión de CV
  - Sube tu PDF o crea un CV desde cero
  - IA mejora el CV automáticamente para cada sector
  - Genera carta de presentación personalizada
  - Descarga en PDF profesional
  - Score ATS para pasar filtros automáticos de RRHH

🔍 /app/buscar — Búsqueda de ofertas
  - +600.000 ofertas en 19 países destino: UK, USA, Alemania, Francia, Australia, Canadá, Países Bajos, Italia, Suecia, Suiza, Bélgica, Portugal, Irlanda, Noruega, Dinamarca, Austria, Finlandia, Nueva Zelanda, Polonia
  - Filtros por: sector, ubicación, tipo de contrato, experiencia, salario, país
  - Fuentes: Adzuna, Careerjet, EURES, Indeed, InfoJobs y más de 100.000 fuentes
  - Guarda ofertas favoritas para aplicar después

📧 /app/envios — Envío automático de CVs (NUESTRO FUERTE)
  - Envía tu CV a múltiples empresas automáticamente
  - La IA adapta el CV a cada oferta antes de enviarlo
  - Plan gratuito: hasta 3 envíos/día
  - Plan Pro: hasta 50 envíos/día
  - Seguimiento de estado: enviado → visto → respuesta
  - Estadísticas de rendimiento

🎙️ /app/entrevistas — Simulador de entrevistas
  - 5 sectores: General, Hostelería, Tecnología, Comercio, Salud
  - Banco de preguntas específicas por sector (5-7 preguntas por sector)
  - Texto + voz (el usuario habla o escribe su respuesta)
  - Feedback de IA detallado: ✅ lo que hizo bien, ⚠️ a mejorar, 💡 consejo, 📊 puntuación
  - Pantalla resumen final con todas las respuestas y puntuaciones
  - Auto-detecta el sector del perfil del usuario

👤 /app/perfil — Perfil de usuario
  - Datos personales: nombre, teléfono, LinkedIn, ciudad, sector
  - Foto de perfil con mejora por IA
  - Avatar mariposa personalizable (50 especies)
  - Configurar alertas de empleo por WhatsApp/email
  - Subir CV desde el perfil

🌍 /app/emigrar — Emigrar y trabajar en el extranjero
  - Información verificada con fuentes oficiales para 19 países: UK, Alemania, Francia, Irlanda, Países Bajos, Italia, Suecia, Suiza, Bélgica, Portugal, Noruega, Dinamarca, Austria, Finlandia, Nueva Zelanda, Polonia, Canadá, Australia, EE.UU.
  - 4 pestañas por país:
    • Visado: tipo de visa, requisitos exactos, enlaces a portales gubernamentales oficiales
    • Alojamiento: plataformas de alquiler locales, consejos prácticos
    • Au Pair: resumen del país + enlace a la guía completa
    • Programas: Working Holiday, EURES, becas, programas oficiales
  - Botón "Buscar ofertas en [país]" para ir a /app/buscar con el país preseleccionado

👶 /app/au-pair — Guía Completa Au Pair
  - 6 pestañas con toda la información Au Pair:
    • Qué es: explicación, proceso 10 pasos, señales de alerta (red flags)
    • Documentos: checklist completa para españoles — antecedentes penales + apostilla + seguro + carnet + referencias
    • Por país: condiciones legales verificadas de los 19 países con ofertas en la app:
      - Alemania 🇩🇪: 280 €/mes + familia paga 70 €/mes para alemán — obligatorio 6h/semana
      - Francia 🇫🇷: 350-400 €/mes — máx. 25h/semana — familia cubre abono transporte
      - Irlanda 🇮🇪: 100-120 €/semana — libre circulación UE — inglés total
      - Reino Unido 🇬🇧: 100-150 £/semana — sin visa 'au pair' oficial desde 2008 (Brexit)
      - Países Bajos 🇳🇱: 340 €/mes — regulado por IND — libre circulación UE
      - Italia 🇮🇹: 250-350 €/mes — Codice Fiscale obligatorio
      - Suecia 🇸🇪: 3.500-5.000 SEK/mes (~320-460 €) — libre circulación UE
      - Suiza 🇨🇭: 700-900 CHF/mes — el más alto de Europa — familia paga 50% cursos
      - Bélgica 🇧🇪: 350-450 €/mes — 3 regiones (flamenco/francés/bilingüe Bruselas)
      - Portugal 🇵🇹: 200-300 €/mes — mismo idioma — bajo coste de vida
      - Noruega 🇳🇴: 5.000-6.000 NOK/mes (~430-520 €) — regulado por UDI
      - Dinamarca 🇩🇰: 3.200 DKK/mes (~430 €) — regulado por SIRI — máx. 24 meses
      - Austria 🇦🇹: 500-600 €/mes — libre circulación UE — Anmeldung primeros 3 días
      - Finlandia 🇫🇮: 200-300 €/mes — libre circulación UE — alto coste de vida
      - Nueva Zelanda 🇳🇿: 23,15 NZD/h (mín. 2024) — Working Holiday Visa
      - Polonia 🇵🇱: 800-1.200 PLN/mes (~180-270 €) — bajo coste de vida — libre circulación UE
      - Canadá 🇨🇦: 17,20 CAD/h mín. Ontario — Home Child Care Provider Program
      - Australia 🇦🇺: 23,23 AUD/h (mín. Fairwork 2024) — Working Holiday Visa 417
      - EE.UU. 🇺🇸: 195,75 $/semana (ley federal) + 500 $/año universidad — visa J-1 obligatoria
    • Alojamiento: derechos legales (habitación privada mín. 9m², llave propia, 3 comidas incluidas)
    • Estudiantes: ahorro neto 150-400 €/mes, clases pagadas por la familia, créditos universitarios, Erasmus+ compatible
    • Plataformas: AuPairWorld (gratis), AuPair.com (gratis), Cultural Care, IAPA
  - Ideal para jóvenes de 18-30 que quieren idioma + experiencia internacional + ahorro simultáneo

📊 /app/pipeline — Kanban de candidaturas (Claw)
  - Tablero tipo Kanban para gestionar todas tus candidaturas
  - Columnas: Aplicado → En proceso → Entrevista → Oferta → Rechazado
  - Conectado con los envíos de /app/envios

💰 /app/salarios — Calculadora y comparativa de salarios (Claw)
  - Consulta salarios medios por sector, puesto y ciudad
  - Datos del mercado español 2024-2025
  - Comparativa con otros países europeos

🏢 /empresas/publicar — Para empresas
  - Publicar ofertas de empleo gratis
  - Sistema de matching IA con candidatos ideales
  - Recibe CVs adaptados automáticamente

⭐ /precios — Planes
  - Gratis: 3 CVs/día, búsqueda básica, 1 CV subido
  - Pro (9,99€/mes): 50 CVs/día, estadísticas avanzadas, Score ATS, prioridad en matching

═══════════════════════════════════════════
FLUJOS IMPORTANTES
═══════════════════════════════════════════

FLUJO DE BÚSQUEDA Y ENVÍO (nuestro diferencial):
1. Pregunta: "¿Qué tipo de trabajo buscas?"
2. Pregunta: "¿En qué ciudad o zona?" (o país si quiere emigrar)
3. Responde con: "🔍 Buscando ofertas de [puesto] en [ciudad]..."
4. Luego: "He encontrado X ofertas. ¿Quieres que envíe tu CV automáticamente a todas?"
5. Si dice sí: "📧 ¡Listo! Enviando tu CV a X empresas. Te avisaré cuando haya respuestas. ¡A esperar buenas noticias! 🦋"

FLUJO EMIGRAR (si alguien pregunta sobre trabajar en el extranjero):
1. Pregunta qué país le interesa
2. Dirígele a /app/emigrar para ver visado, alojamiento, Au Pair y programas
3. Menciona que tiene +600k ofertas en 34 países en /app/buscar
4. Da un tip útil del país (ej: "Para Alemania necesitas hacer el Anmeldung en los primeros 14 días")

FLUJO ENTREVISTAS:
1. Pregunta en qué sector trabaja
2. Dirígele a /app/entrevistas — el simulador detecta su sector automáticamente
3. Explica que puede hablar o escribir las respuestas
4. Menciona que la IA da puntuación 1-10 y consejos específicos

FOTO DE CV:
- ChatGPT prompt: "Limpia esta foto de perfil profesional, mejora la iluminación, elimina el fondo y pon un fondo gris claro degradado. Mantén la expresión natural y profesional."
- También: Remove.bg (gratis) + Canva para fondo profesional
- Tips: luz natural de ventana, ropa formal, sonrisa natural, encuadre de pecho hacia arriba

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

═══════════════════════════════════════════
REGLAS ABSOLUTAS
═══════════════════════════════════════════
- NUNCA inventes datos de empresas reales
- NUNCA respondas en otro idioma que español
- NUNCA generes información médica, sanitaria ni diagnósticos — eso no es tu ámbito
- Si preguntan por algo de la app, SIEMPRE da el link correcto (/app/emigrar, /app/entrevistas, etc.)
- Si el usuario escribe algo que no entiendes, ofrece las opciones disponibles
- Para preguntas de visados, SIEMPRE recomienda verificar en la fuente oficial del gobierno correspondiente
- Tus respuestas son sobre EMPLEO, EMIGRACIÓN y BÚSQUEDA DE TRABAJO — nada más`;

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

    // Emigrar/au-pair: pasa a la IA (el system prompt tiene toda la info de países, salarios, etc.)

    // Pipeline y Salarios: pasan a la IA (system prompt tiene toda la info)

    // Envío automático → flujo directo (sin IA)
    if (intent === "enviar") {
      return NextResponse.json({
        reply: "📧 ¡Perfecto! Para enviar tu CV automáticamente necesito:\n\n1. ✅ Que tengas tu CV subido (puedes hacerlo desde Perfil o aquí mismo)\n2. 🎯 El puesto y ciudad que buscas\n\n¿Tienes tu CV subido? Si no, ve a 👤 Perfil → Mi CV y súbelo. ¡Luego dime qué trabajo buscas y yo me encargo! 🐛→📧",
        action: "send_cv_flow",
      });
    }

    // Chat normal con IA
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ reply: getLocalReply(message, intent) });
    }

    const systemPrompt = mode === "entrevista" 
      ? SYSTEM_PROMPT + "\n\nMODO ENTREVISTA ACTIVO: Guía al usuario paso a paso para crear su CV. Pregunta UN dato a la vez. Sé paciente y motivador."
      : SYSTEM_PROMPT;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.slice(-10).map((m: { role: string; text: string }) => ({
        role: (m.role === "gusi" ? "assistant" : "user") as "assistant" | "user",
        content: m.text,
      })),
      { role: "user" as const, content: message },
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ reply: getLocalReply(message, intent) });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || getLocalReply(message, intent);

    // Detectar fin de entrevista CV para mostrar botón de generar CV visual
    const cvCompleto = mode === "entrevista" && /cv\s*listo|entrevista.*complet|tengo.*datos|datos.*complet/i.test(reply);

    return NextResponse.json({
      reply,
      action: cvCompleto ? "cv_complete" : (intent === "buscar" ? "suggest_search" : (["emigrar","pipeline","salarios"].includes(intent) ? intent : undefined)),
    });
  } catch {
    return { isSparse: true, isRich: false };
  }
}

/** Detecta la intención del usuario */
function detectIntent(text: string): string {
  const t = text.toLowerCase();
  // Emigrar / trabajar en el extranjero
  if (t.includes("emigrar") || t.includes("extranjero") || t.includes("irme a") || t.includes("vivir en") || t.includes("au pair") || t.includes("working holiday") || t.includes("visa de trabajo") || t.includes("alemania") || t.includes("reino unido") || t.includes("irlanda") || t.includes("canada") || t.includes("australia") || (t.includes("trabajar") && (t.includes("fuera") || t.includes("europa") || t.includes("abroad")))) return "emigrar";
  // Entrevista preparación/simulador
  if (t.includes("entrevista") && (t.includes("preparar") || t.includes("simula") || t.includes("practica") || t.includes("simulador"))) return "entrevista_prep";
  if (t.includes("simulador de entrevista") || t.includes("practicar entrevista")) return "entrevista_prep";
  // Pipeline / kanban de candidaturas
  if (t.includes("pipeline") || t.includes("kanban") || t.includes("seguimiento de candidatura") || t.includes("estado de mis aplicaciones")) return "pipeline";
  // Salarios
  if (t.includes("salario") || t.includes("sueldo") || t.includes("cuánto cobra") || t.includes("cuánto gana") || t.includes("salario medio")) return "salarios";
  // Búsqueda de trabajo — prioridad máxima, muchos patrones
  if (t.includes("busco trabajo") || t.includes("buscar trabajo") || t.includes("busco empleo")) return "buscar";
  if (t.includes("busco") && (t.includes("de ") || t.includes("como "))) return "buscar";
  if (t.includes("trabajo de ") || t.includes("trabajo como ")) return "buscar";
  if (t.includes("ofertas de ") || t.includes("empleo de ")) return "buscar";
  if (t.includes("quiero trabajar") || t.includes("necesito trabajo") || t.includes("buscando trabajo")) return "buscar";
  if (/busco?\s+(?:un\s+)?(?:puesto|trabajo|empleo|oferta)/i.test(t)) return "buscar";
  // Envío automático
  if (t.includes("enviar") || t.includes("envía") || t.includes("manda") || t.includes("automátic") || t.includes("envia mi cv") || t.includes("envía mi cv")) return "enviar";
  if (t.includes("envía a todas") || t.includes("enviar a todas") || t.includes("manda a todas")) return "enviar";
  // Foto
  if (t.includes("foto") || t.includes("imagen") || t.includes("picture")) return "foto";
  // Crear CV
  if (t.includes("cv") && (t.includes("crear") || t.includes("hacer") || t.includes("paso"))) return "crear_cv";
  // Carta
  if (t.includes("carta") && t.includes("presentación")) return "carta";
  return "chat";
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

    // Buscar ofertas reales via la API interna
    type OfertaItem = { id: string; titulo: string; empresa: string; ubicacion: string; salario: string; fuente: string; match?: number; url: string; descripcion?: string; fecha?: string; emailEmpresa?: string; distancia?: string };
    let ofertas: OfertaItem[] = [];
    try {
      const { buscarOfertasReales } = await import("@/lib/job-search/real-search");
      ofertas = await buscarOfertasReales(searchTerm, searchCity || "España", 5);
    } catch {
      ofertas = [];
    }
    // Si no hay resultados, mostrar mensaje honesto (sin datos inventados)
    if (ofertas.length === 0) {
      return {
        text: `🔍 Busqué **${searchTerm}**${searchCity ? ` en **${searchCity}**` : ""} pero no encontré resultados en este momento.\n\n💡 Prueba en **🔍 Buscar** donde tienes más filtros y fuentes, o cambia el término de búsqueda.\n\n📧 Si ya tienes empresas en mente, **¡envío tu CV directamente!** 🐛→🦋`,
        jobs: [],
      };
    }

    let text = `🔍 He encontrado **${ofertas.length} ofertas** de **${searchTerm}**${searchCity ? ` en **${searchCity}**` : ""}:\n\n`;
    
    ofertas.forEach((o) => {
      const emoji = (o.match || 0) >= 80 ? "🟢" : (o.match || 0) >= 60 ? "🟡" : "🟠";
      text += `${emoji} **${o.titulo}** — ${o.empresa}\n`;
      text += `   📍 ${o.ubicacion} · 💰 ${o.salario} · **${o.match || 0}% compatible**\n\n`;
    });
    
    text += `📧 **¿Envío tu CV a todas?** ¡Es nuestro FUERTE! Solo di "envía" y me encargo automáticamente. 🐛→🦋\n\nO ve a 🔍 **Buscar** para más filtros.`;

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

    auPairContext = `\n━━━ PERFIL AU PAIR DEL USUARIO ━━━\nNombre: ${nombre}\nEdad: ${edad}\nCiudad: ${ciudad}\nIdiomas: ${idiomas}\nExperiencia con niños: ${experiencia}\nPaís preferido: ${paisDestino}\nFotos subidas: ${fotos}\nCarta Dear Family: ${auPairData.letter_text ? "✅ Creada" : "❌ Pendiente"}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nCuando el usuario pida "generar carta au pair" o "carta dear family", usa estos datos para personalizarla.\nCuando pida "buscar au pair" o "busco trabajo de au pair", busca ofertas de tipo au pair/nanny/niñera.\n`;
  }

  if (!cvData) return PROMPT_BASE + paisInfo + auPairContext;

  const cv = parseCVData(cvData);
  if (!cv || !cv.resumenTexto) return PROMPT_BASE + paisInfo + auPairContext;

  return `${PROMPT_BASE}${paisInfo}
━━━ DATOS REALES DEL CV DEL USUARIO (usa esto en TODAS tus respuestas) ━━━
${cv.resumenTexto}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${auPairContext}
Cuando el usuario pregunte qué trabajo buscar → sugiérele ofertas de "${cv.ultimoPuesto || cv.sector || "su sector"}" en "${cv.ciudad || "su zona"}".
Cuando mejores el CV → usa exactamente los datos de arriba, no los inventes.
Cuando generes una carta → pon el nombre "${cv.nombre}" y la ciudad "${cv.ciudad}" reales.`;
}

function detectIntent(text: string): string {
  const t = text.toLowerCase();
  if (/(mejorar|mejora|optimizar|reescrib).*(cv|curriculum)|(cv|curriculum).*(mejorar|mejorado|profesional|limpio)/.test(t)) return "cv_mejorado";
  if (/(carta.*(recomendaci|presentaci|para\s+\w)|presentaci.*carta)/.test(t)) return "carta_recomendacion";
  if (/(crea|genera|haz|escrib).*(carta|dear family).*(au pair|aupair)/i.test(t) || /carta.*au.?pair/i.test(t) || /dear.?family/i.test(t)) return "carta_au_pair";
  if (/(busco|buscar|busca|necesito|quiero).*(au pair|aupair|niñera|nanny|canguro|childcare)/i.test(t)) return "buscar_au_pair";
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
        match: 0,
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
    case "cv_mejorado":
      return "✨ **Mejora de CV no disponible ahora mismo.**\n\nPuedo ayudarte con estos consejos mientras tanto:\n• Usa verbos de acción (logré, implementé, coordiné)\n• Incluye logros cuantificables (\"aumenté ventas un 20%\")\n• Adapta las palabras clave al puesto que buscas\n• Mantén el CV en 1-2 páginas máximo\n\n¿Quieres que te dé más consejos personalizados? 🐛";
    case "entrevista_prep":
      return "🎯 **Preparación de entrevistas no disponible ahora mismo.**\n\nMientras tanto, aquí tienes un guion rápido:\n• Prepara 3 ejemplos con método STAR (Situación, Tarea, Acción, Resultado)\n• Investiga la empresa: sector, tamaño, noticias recientes\n• Prepara preguntas para hacer tú al final\n• Ensaya tu presentación de 1 minuto en voz alta\n\n¿Sobre qué puesto es la entrevista? Te ayudo a enfocarla. 🐛";
    case "carta_recomendacion":
      return "✉️ **Carta de presentación no disponible en este momento.**\n\nMientras tanto, puedes estructurarla así:\n1. **Asunto**: Candidatura [Puesto] — [Tu Nombre]\n2. **Apertura**: por qué te interesa esa empresa en concreto\n3. **Cuerpo**: 2-3 logros que conecten con lo que buscan\n4. **Cierre**: disponibilidad para entrevista y despedida cordial\n\n¿Te ayudo a redactarla paso a paso? 🐛";
    case "info_empresa":
      return "🏢 **No puedo consultar información de esa empresa ahora mismo.**\n\nPuedes buscar en:\n• **LinkedIn** — página de empresa y empleados\n• **Glassdoor** — opiniones de empleados y rangos salariales\n• **Google Maps** — sede, tamaño, sector\n\n¿Quieres que busque ofertas activas de esa empresa en nuestra base de datos? 🔍";
    case "buscar_au_pair":
      return "👶 **Búsqueda Au Pair** — dime el país donde quieres ser au pair (ej: 'busca au pair en Alemania' o 'au pair en Reino Unido') y te busco ofertas con familias que necesitan cuidadores. También puedo ayudarte con tu carta 'Dear Family'. 🐛";
    case "carta_au_pair":
      return "💌 **Carta 'Dear Family'** — primero completa tu perfil Au Pair en la sección 🧒 del menú. Luego vuelve y dime 'crea mi carta au pair' para generarla personalizada con tus datos, experiencia con niños y fotos. 🐛";
    default:
      return "🐛 Puedo ayudarte a buscar trabajo en España y Europa, mejorar tu CV, preparar entrevistas o generar una carta de presentación. ¿Qué necesitas?";
  }
}

// ─── Rate Limiting ──────────────────────────────────────────────────────────
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

// ─── Handler principal ────────────────────────────────────────────────────────

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

    // Si hay userId, leer el CV fresco desde la BD (ignora el cvData del cliente)
    let cvData = cvDataFromClient;
    let auPairProfile: Record<string, unknown> | null = null;
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

    // ── Intent: buscar au pair ──────────────────────────────────────────────
    if (intent === "buscar_au_pair" || mode === "buscar_au_pair") {
      const extractedCity = extractCity(message);
      const extractedCountry = extractCountryCode(message);
      const cityOrCountry = extractedCountry || extractedCity || (auPairProfile?.nationality as string) || "UK";

      const ofertas = await searchAuPairJobs(cityOrCountry, 5);
      if (!ofertas || ofertas.length === 0) {
        return NextResponse.json({
          reply: `👶 No encontré ofertas au pair para **${cityOrCountry}** ahora mismo.\n\nPero puedo ayudarte:\n• 💌 **Crear tu carta "Dear Family"** — dime "crea mi carta au pair"\n• 🌍 **Buscar en otro país** — dime "busca au pair en Alemania"\n• 📄 **Completar tu perfil** — en la sección Au Pair del menú 🐛`,
          action: "au_pair_no_results",
        });
      }
      return NextResponse.json({
        reply: `👶 **${ofertas.length} ofertas Au Pair** en **${cityOrCountry}**:\n\n${ofertas.map((o, i) => {
          const em = ["🥇", "🥈", "🥉", "📌"][i] || "📌";
          return `${em} **${(o as { titulo?: string }).titulo}**\n   🏠 ${(o as { empresa?: string }).empresa} · 📍 ${(o as { ubicacion?: string }).ubicacion}\n   💰 ${(o as { salario?: string }).salario}\n`;
        }).join("\n")}\n📧 **¿Quieres aplicar?** Ve a la sección Au Pair del menú para completar tu perfil con fotos y carta. 🐛`,
        jobs: ofertas,
        action: "au_pair_search_results",
      });
    }

    // ── Intent: carta au pair ───────────────────────────────────────────────
    if (intent === "carta_au_pair" || mode === "carta_au_pair") {
      if (!auPairProfile) {
        return NextResponse.json({
          reply: "💌 Para generar tu carta \"Dear Family\" primero necesitas crear tu perfil Au Pair.\n\nVe a la sección **Au Pair** del menú (🧒) y rellena:\n• Tus datos personales\n• Experiencia con niños\n• Fotos\n\nLuego vuelve y dime \"crea mi carta au pair\". 🐛",
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
              model: "deepseek-chat",
              messages: [{
                role: "system",
                content: `Eres experto en cartas "Dear Family" para au pairs. Escribe en INGLÉS (idioma estándar internacional para au pair). La carta debe ser cálida, personal y profesional. Máximo 300 palabras. NO uses placeholders — usa los datos reales proporcionados.`
              }, {
                role: "user",
                content: `Genera una carta "Dear Family" para una au pair con estos datos:\n\nNombre: ${nombre}\nEdad: ${edad}\nCiudad: ${ciudad}\nIdiomas: ${idiomas}\nExperiencia con niños: ${experiencia}\nHobbies: ${hobbies}\nPaís de destino: ${paisDestino}\n\nLa carta debe incluir: presentación personal, experiencia con niños, por qué quiere ser au pair en ese país, hobbies y personalidad, y despedida cálida.`
              }],
              temperature: 0.8,
              max_tokens: 800,
            }),
            signal: AbortSignal.timeout(20000),
          });

          if (res.ok) {
            const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
            const letter = data.choices?.[0]?.message?.content || "";
            if (letter) {
              return NextResponse.json({
                reply: `💌 **Aquí tienes tu carta "Dear Family" personalizada:**\n\n${letter}\n\n✅ **¿Te gusta?** Puedes copiarla y pegarla en tu perfil Au Pair, o dime "cambia [lo que quieras modificar]" y la ajusto. 🐛\n\n🧒 También puedes ir a la sección **Au Pair** para guardarla en tu perfil.`,
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
          reply: `💌 **Aquí tienes tu carta "Dear Family":**\n\n${letter}\n\n✅ Personalízala a tu gusto en la sección **Au Pair** del menú. 🐛`,
          action: "au_pair_letter_generated",
          auPairLetter: letter,
        });
      } catch (e) {
        return NextResponse.json({
          reply: `❌ Error al generar la carta: ${(e as Error).message}. Inténtalo de nuevo. 🐛`,
          action: "au_pair_letter_error",
        });
      }
    }

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
      body: JSON.stringify({ model: "qwen/qwen3-32b", messages: msgsConNoThink, max_tokens: 1024, temperature: 0.7 }),
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

function getLocalReply(_text: string, intent: string): string {
  switch (intent) {
    case "emigrar":
      return "🌍 ¡Te ayudo a emigrar!\n\nTenemos información verificada para **19 países**: 🇬🇧 UK · 🇩🇪 Alemania · 🇫🇷 Francia · 🇮🇪 Irlanda · 🇳🇱 P.Bajos · 🇮🇹 Italia · 🇸🇪 Suecia · 🇨🇭 Suiza · 🇧🇪 Bélgica · 🇵🇹 Portugal · 🇳🇴 Noruega · 🇩🇰 Dinamarca · 🇦🇹 Austria · 🇫🇮 Finlandia · 🇳🇿 N.Zelanda · 🇵🇱 Polonia · 🇨🇦 Canadá · 🇦🇺 Australia · 🇺🇸 EE.UU.\n\n👉 [**Emigrar →**](/app/emigrar) — visados, alojamiento, programas\n👶 [**Au Pair completo →**](/app/au-pair) — documentos, paga por país, ventajas para estudiantes\n\n¿Qué país te interesa? 🐛";
    case "entrevista_prep":
      return "🎙️ ¡Tenemos un simulador de entrevistas!\n\nElige tu sector (general, hostelería, tecnología, comercio o salud) y practica preguntas reales. La IA te da:\n✅ Lo que hiciste bien\n⚠️ Qué mejorar\n📊 Puntuación 1-10\n\n👉 [**Ir al Simulador →**](/app/entrevistas)\n\nO si prefieres, dime tu sector y te hago 3 preguntas aquí mismo. 🐛🎯";
    case "pipeline":
      return "📊 El **Pipeline de candidaturas** te permite gestionar todas tus solicitudes en un tablero tipo Kanban:\n\nAplicado → En proceso → Entrevista → Oferta → Rechazado\n\nEs la forma perfecta de no perder el hilo de dónde has aplicado.\n\n👉 [**Ir al Pipeline →**](/app/pipeline) 🐛";
    case "salarios":
      return "💰 Consulta **salarios medios** por sector, puesto y ciudad en nuestra sección de Salarios.\n\nDatos del mercado español 2024-2025 con comparativa europea.\n\n👉 [**Ver Salarios →**](/app/salarios) 🐛";
    case "foto":
      return "📸 Para mejorar tu foto de CV:\n\n**Opción 1 — ChatGPT:**\nCopia este prompt exacto:\n_\"Limpia esta foto de perfil profesional, mejora la iluminación, elimina el fondo y pon un fondo gris claro degradado. Mantén la expresión natural.\"_\n\n**Opción 2 — Gratis:**\n1. Remove.bg → quita el fondo\n2. Canva → añade fondo profesional\n\n**Tips:** Luz de ventana, ropa formal, sonrisa natural, pecho arriba.\n\n¡Una buena foto = +40% respuestas! 🐛📸";
    case "buscar":
      return "🔍 ¡Vamos a buscar! Dime:\n1. ¿Qué tipo de trabajo?\n2. ¿En qué ciudad?\n\nY yo busco las mejores ofertas para ti. 🐛";
    case "enviar":
      return "📧 ¡Nuestro FUERTE! Envío automático de CVs:\n\n1. Sube tu CV en 👤 Perfil\n2. Dime qué trabajo buscas\n3. ¡Yo envío a todas las empresas!\n\nEs como tener un asistente personal enviando CVs 24/7. 🐛→🦋";
    case "crear_cv":
      return "📝 ¡Vamos a crear tu CV! Te voy preguntando paso a paso:\n\n👉 **¿Cuál es tu nombre completo?**\n\n(Yo pregunto, tú respondes. ¡Facilísimo!) 🐛";
    case "carta":
      return "✉️ Para generar tu carta de presentación:\n\nVe a 📄 CV → abajo verás \"Generar carta de presentación\"\nO dime el puesto y la empresa y te la hago aquí. 🐛";
    default:
      return "¡Hola! 🐛 Soy Gusi y puedo:\n\n📝 Crear tu CV paso a paso\n📸 Mejorar tu foto de CV\n🔍 Buscar ofertas de trabajo en 34 países\n📧 **Enviar tu CV automáticamente** (¡NUESTRO FUERTE!)\n🌍 Guiarte para **emigrar al extranjero**\n🎙️ Simular entrevistas con feedback de IA\n💰 Consultar salarios por sector\n✉️ Generar cartas de presentación\n\n¿Qué necesitas? 🦋";
  }
}
