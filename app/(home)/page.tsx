import { Rocket, ChartBar, Mail } from "lucide-react";
     1|import Link from "next/link";
     2|import LogoGusano from "@/components/LogoGusano";
     3|import BuscadorPublico from "@/components/BuscadorPublico";
     4|import PWAInstallButton from "@/components/PWAInstallButton";
     5|import PublicHeader from "@/components/PublicHeader";
     6|import { getPool } from "@/lib/db";
     7|import { NUM_PAISES } from "@/lib/paises";
     8|
     9|export const dynamic = "force-dynamic";
    10|
    11|function formatOfertas(n: number): string {
    12|  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} millones de`;
    13|  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
    14|  return String(n);
    15|}
    16|
    17|async function getRealStats() {
    18|  try {
    19|    const pool = getPool();
    20|    const { rows } = await pool.query(`
    21|      SELECT UPPER(country) AS code, COUNT(*)::int AS total
    22|      FROM "JobListing"
    23|      WHERE "isActive" = true AND country IS NOT NULL AND country != ''
    24|      GROUP BY UPPER(country)
    25|      ORDER BY total DESC
    26|    `);
    27|    const totalGlobal = rows.reduce((sum: number, r: {total: number}) => sum + r.total, 0);
    28|    const countryCount = rows.filter((r: {code: string}) => r.code !== '' && r.code !== null).length;
    29|    return { totalGlobal, rows, countryCount };
    30|  } catch {
    31|    return null;
    32|  }
    33|}
    34|
    35|export default async function LandingPage() {
    36|  // ── Datos reales desde la DB (con fallback a hardcoded) ──
    37|  const stats = await getRealStats();
    38|  
    39|  const OFERTAS = stats ? formatOfertas(stats.totalGlobal) : "miles de";
    40|  const PAISES = String(NUM_PAISES);
    41|  const OBJETIVO = "10.000.000";
    42|
    43|  // Mapa flags + nombres para traducir códigos ISO
    44|  const FLAG_MAP: Record<string, { flag: string; nombre: string }> = {
    45|    US: { flag: "🇺🇸", nombre: "Estados Unidos" },
    46|    DE: { flag: "🇩🇪", nombre: "Alemania" },
    47|    ES: { flag: "🇪🇸", nombre: "España" },
    48|    FR: { flag: "🇫🇷", nombre: "Francia" },
    49|    GB: { flag: "🇬🇧", nombre: "Reino Unido" },
    50|    CA: { flag: "🇨🇦", nombre: "Canadá" },
    51|    AU: { flag: "🇦🇺", nombre: "Australia" },
    52|    SE: { flag: "🇸🇪", nombre: "Suecia" },
    53|    IT: { flag: "🇮🇹", nombre: "Italia" },
    54|    NL: { flag: "🇳🇱", nombre: "Países Bajos" },
    55|    CH: { flag: "🇨🇭", nombre: "Suiza" },
    56|    IE: { flag: "🇮🇪", nombre: "Irlanda" },
    57|    BE: { flag: "🇧🇪", nombre: "Bélgica" },
    58|    PT: { flag: "🇵🇹", nombre: "Portugal" },
    59|    NO: { flag: "🇳🇴", nombre: "Noruega" },
    60|    PL: { flag: "🇵🇱", nombre: "Polonia" },
    61|    DK: { flag: "🇩🇰", nombre: "Dinamarca" },
    62|    AT: { flag: "🇦🇹", nombre: "Austria" },
    63|    NZ: { flag: "🇳🇿", nombre: "Nueva Zelanda" },
    64|    FI: { flag: "🇫🇮", nombre: "Finlandia" },
    65|    GR: { flag: "🇬🇷", nombre: "Grecia" },
    66|  };
    67|
    68|  const PAISES_DATA = stats
    69|    ? stats.rows
    70|        .filter((r: {code: string}) => FLAG_MAP[r.code])
    71|        .slice(0, 21)
    72|        .map((r: {code: string; total: number}) => ({
    73|          flag: FLAG_MAP[r.code].flag,
    74|          nombre: FLAG_MAP[r.code].nombre,
    75|          ofertas: formatOfertas(r.total),
    76|        }))
    77|    : [
    78|        { flag: "🇺🇸", nombre: "Estados Unidos", ofertas: "477K" },
    79|        { flag: "🇩🇪", nombre: "Alemania", ofertas: "401K" },
    80|        { flag: "🇪🇸", nombre: "España", ofertas: "171K" },
    81|        { flag: "🇫🇷", nombre: "Francia", ofertas: "129K" },
    82|        { flag: "🇬🇧", nombre: "Reino Unido", ofertas: "113K" },
    83|        { flag: "🇨🇦", nombre: "Canadá", ofertas: "89K" },
    84|        { flag: "🇦🇺", nombre: "Australia", ofertas: "72K" },
    85|        { flag: "🇸🇪", nombre: "Suecia", ofertas: "60K" },
    86|        { flag: "🇮🇹", nombre: "Italia", ofertas: "56K" },
    87|        { flag: "🇳🇱", nombre: "Países Bajos", ofertas: "41K" },
    88|        { flag: "🇨🇭", nombre: "Suiza", ofertas: "40K" },
    89|        { flag: "🇮🇪", nombre: "Irlanda", ofertas: "30K" },
    90|        { flag: "🇧🇪", nombre: "Bélgica", ofertas: "28K" },
    91|        { flag: "🇵🇹", nombre: "Portugal", ofertas: "23K" },
    92|        { flag: "🇳🇴", nombre: "Noruega", ofertas: "20K" },
    93|        { flag: "🇵🇱", nombre: "Polonia", ofertas: "14K" },
    94|        { flag: "🇩🇰", nombre: "Dinamarca", ofertas: "8K" },
    95|        { flag: "🇦🇹", nombre: "Austria", ofertas: "6K" },
    96|        { flag: "🇳🇿", nombre: "Nueva Zelanda", ofertas: "5K" },
    97|        { flag: "🇫🇮", nombre: "Finlandia", ofertas: "5K" },
    98|        { flag: "🇬🇷", nombre: "Grecia", ofertas: "3K" },
    99|      ];
   100|
   101|  // ── Planes ──
   102|  const planes = [
   103|    { 
   104|      nombre: "Gratis", precio: "0", periodo: "", 
   105|      desc: "Para probar sin compromiso", 
   106|      items: [
   107|        "Búsqueda de ofertas en 21 países", 
   108|        "Pipeline de candidaturas", 
   109|        "Comparador de salarios",
   110|        "1 CV guardado"
   111|      ], 
   112|      nota: "Sin tarjeta de crédito · Sin Guzzi · Sin envíos", 
   113|      destacado: false, 
   114|      cta: "Empezar gratis",
   115|      limitado: true
   116|    },
   117|    { 
   118|      nombre: "Esencial", precio: "2,99", periodo: "/mes", 
   119|      desc: "Menos que un café al mes", 
   120|      items: [
   121|        "Guzzi con IA (GPT-4o-mini)",
   122|        "20 consultas al día",
   123|        "10 envíos de CV al día",
   124|        "50 envíos a la semana",
   125|        "Carta personalizada por IA",
   126|        "3 CVs guardados",
   127|        "50 ofertas guardadas"
   128|      ], 
   129|      nota: "Sin permanencia · Cancela cuando quieras", 
   130|      destacado: true, 
   131|      cta: "Contratar Esencial", 
   132|      tag: "🔥 Más elegido" 
   133|    },
   134|    { 
   135|      nombre: "Pro", precio: "9,99", periodo: "/mes", 
   136|      desc: "Para profesionales serios", 
   137|      items: [
   138|        "Guzzi con IA avanzada (GPT-4o)",
   139|        "100 consultas al día",
   140|        "50 envíos de CV al día",
   141|        "300 envíos a la semana",
   142|        "Carta personalizada premium",
   143|        "10 CVs guardados",
   144|        "200 ofertas guardadas",
   145|        "Códigos promocionales",
   146|        "Soporte prioritario"
   147|      ], 
   148|      nota: "Sin permanencia · Cancela cuando quieras", 
   149|      destacado: false, 
   150|      cta: "Contratar Pro" 
   151|    },
   152|    { 
   153|      nombre: "Empresa", precio: "49,99", periodo: "/mes", 
   154|      desc: "Para RRHH y reclutadores", 
   155|      items: [
   156|        "Guzzi IA ilimitado (GPT-4o)",
   157|        "Consultas sin límite",
   158|        "200 envíos de CV al día",
   159|        "1.000 envíos a la semana",
   160|        "CVs guardados ilimitados",
   161|        "Ofertas guardadas ilimitadas",
   162|        "API e integraciones",
   163|        "Dashboard de equipo",
   164|        "Códigos promocionales",
   165|        "Soporte 24/7"
   166|      ], 
   167|      nota: "Sin permanencia · Facturación mensual", 
   168|      destacado: false, 
   169|      cta: "Contactar" 
   170|    },
   171|  ];
   172|
   173|  // ── Cómo funciona ──
   174|  const pasos = [
   175|    { num: "1", icon: "📎", titulo: "Sube tu CV o cuéntaselo a Guzzi", desc: "En 2 minutos Guzzi analiza tu experiencia, la mejora con IA y la adapta al formato que esperan las empresas." },
   176|    { num: "2", icon: "🌍", titulo: "Elige dónde quieres trabajar", desc: `España, Alemania, Irlanda... Guzzi escanea cientos de miles de ofertas en ${PAISES} países. Filtra por salario, sector y tipo de contrato.` },
   177|    { num: "3", Icon: Rocket, titulo: "Guzzi envía. Tú solo vas a la entrevista.", desc: "Carta personalizada para cada empresa. Envío en el momento exacto en que el reclutador abre el email. Automático." },
   178|  ];
   179|
   180|  // ── Superpotencias ──
   181|  const superpotencias = [
   182|    { icon: "🌍", titulo: `${PAISES} países, un solo agente`, desc: "Busca trabajo en España o emigra. Guzzi habla 12 idiomas y adapta tu CV al formato de cada país. De España a Alemania, de Irlanda a Australia — sin mover un dedo.", acento: "#22c55e" },
   183|    { icon: "🎯", titulo: "CV único para cada oferta. Cero spam.", desc: "Tu CV no se dispara a lo loco. Guzzi lo adapta a cada empresa: palabras clave, formato, tono. Supera los filtros ATS que descartan al 75% de candidatos antes de que un humano lo vea.", acento: "#f59e0b" },
   184|    { icon: "⏰", titulo: "Enviado cuando el reclutador está leyendo", desc: "Analizamos la hora de actividad de cada empresa. Tu candidatura llega a las 8:32am del martes — no a las 3am de un sábado. La diferencia entre abrirlo o borrarlo sin leer.", acento: "#a855f7" },
   185|    { icon: "🤖", titulo: "24/7. No duerme. No se cansa. No se rinde.", desc: "Mientras tú vives tu vida, duermes o ves Netflix, Guzzi está escaneando ofertas, adaptando candidaturas y enviando. Como tener un comercial trabajando para ti a tiempo completo.", acento: "#e07850" },
   186|    { Icon: ChartBar, titulo: "Pipeline visual: sabes dónde está cada CV", desc: "Deja de preguntarte \"¿lo habrán leído?\". Ve en tiempo real el estado de cada candidatura: enviada, abierta, en revisión, entrevista, oferta. Sin agujeros negros.", acento: "#3b82f6" },
   187|    { icon: "💰", titulo: "Comparador de salarios reales", desc: "¿Cuánto pagan por tu puesto en Berlín vs Barcelona? ¿Merece la pena emigrar? Datos reales de cientos de miles de ofertas. Decide con números, no con intuición.", acento: "#f59e0b" },
   188|  ];
   189|
   190|  // ── La verdad incómoda ──
   191|  const verdades = [
   192|    { stat: "95%", label: "de CVs no los lee nadie", fuente: "InfoJobs / Randstad" },
   193|    { stat: "78%", label: "de candidatos ghosteados", fuente: "Adecco Spain" },
   194|    { stat: "3-5%", label: "tasa de respuesta real", fuente: "Portales tradicionales" },
   195|    { stat: "35-45 días", label: "de media hasta encontrar trabajo", fuente: "Infoempleo" },
   196|  ];
   197|
   198|  // ── Comparativa ──
   199|  const comparativa = [
   200|    { ellos: "Tú buscas, filtras y envías a mano", nosotros: "Guzzi busca, filtra y envía por ti" },
   201|    { ellos: "Mismo CV para 200 ofertas distintas", nosotros: "CV adaptado por IA a cada empresa" },
   202|    { ellos: "Ofertas caducadas y empresas fantasma", nosotros: `${OFERTAS} ofertas actualizadas a diario` },
   203|    { ellos: "Sin saber si tu CV fue leído", nosotros: "Pipeline visual: enviado → abierto → entrevista" },
   204|    { ellos: "Solo España. Si quieres emigrar, busca tú.", nosotros: `${PAISES} países. Guzzi busca en todos a la vez.` },
   205|    { ellos: "ATS descarta tu CV sin leerlo", nosotros: "IA que optimiza para pasar los filtros ATS" },
   206|    { ellos: "29€/mes para que te ignoren", nosotros: "Gratis para candidatos. Sin permanencia." },
   207|  ];
   208|
   209|  // ── Testimonios ──
   210|  const testimonios = [
   211|    { nombre: "María G.", ciudad: "Madrid", puesto: "Diseñadora gráfica", texto: "En 3 semanas tenía 4 entrevistas. Con InfoJobs estuve 2 meses enviando CVs a mano sin respuesta." },
   212|    { nombre: "Carlos R.", ciudad: "Barcelona", puesto: "Programador junior", texto: "Me fui a Berlín. Guzzi me encontró ofertas que ni sabía que existían. En 10 días tenía contrato. Sin hablar alemán." },
   213|    { nombre: "Ana M.", ciudad: "Valencia", puesto: "Administrativa", texto: "Nunca pensé que un software podría mejorar tanto mi CV. Lo mandé a 200 empresas y tuve respuesta de 47." },
   214|    { nombre: "Pedro L.", ciudad: "Sevilla", puesto: "Electricista", texto: "Me sorprendió que encontrara empresas de mi sector que yo no conocía. Y el CV adaptado a cada una marcó la diferencia." },
   215|  ];
   216|
   217|  // ── FAQ ──
   218|  const faq = [
   219|    { q: "¿Es realmente gratis para los candidatos?", a: "Sí, completamente. El plan gratuito permite buscar ofertas, usar el pipeline y comparar salarios. No incluye Guzzi (asistente IA) ni envío de CVs. Para enviar candidaturas y usar Guzzi necesitas un plan de pago — desde 2,99€/mes con 10 envíos al día y 20 consultas a Guzzi." },
   220|    { q: "¿En cuántos países busca Guzzi?", a: `Actualmente en ${PAISES} países: España, Alemania, Reino Unido, Estados Unidos, Canadá, Francia, Suecia, Australia, Países Bajos, Italia, Suiza, Irlanda, Bélgica, Portugal, Noruega, Polonia, Dinamarca, Austria, Finlandia y más. Añadimos países nuevos constantemente.` },
   221|    { q: "¿Cómo funciona el envío automático de CVs?", a: "Nuestra IA adapta tu CV a cada oferta antes de enviarlo. No es spam — cada candidatura se personaliza con el perfil y palabras clave de la empresa. Tú marcas sector, países y tipo de contrato, y Guzzi trabaja por ti." },
   222|    { q: "¿Es legal enviar CVs automáticamente?", a: "Totalmente legal. Enviar tu currículum a ofertas de trabajo publicadas es un derecho tuyo. Actuamos como un agente inteligente que te representa — sin cobrarte comisiones ni quedarse con parte de tu salario." },
   223|    { q: "¿Puedo buscar trabajo en el extranjero sin hablar el idioma?", a: "Sí. Guzzi traduce ofertas a 12 idiomas y adapta tu CV al formato de cada país. Muchas empresas multinacionales trabajan en inglés. Además, si quieres emigrar, te mostramos qué países tienen más demanda de tu perfil y qué salarios ofrecen." },
   224|    { q: "¿Qué diferencia hay con InfoJobs, LinkedIn o Indeed?", a: `InfoJobs, LinkedIn e Indeed son tablones de anuncios: tú buscas, tú filtras, tú envías. El 95% de esos CVs no llegan a ningún humano. BuscayCurra es activo: Guzzi trabaja por ti 24/7, adapta tu CV a cada oferta y envía candidaturas automáticamente en ${NUM_PAISES} países. No es un portal de empleo. Es tu agente personal de búsqueda.` },
   225|    { q: "¿Puedo ver las ofertas sin registrarme?", a: "Sí. El buscador público está disponible sin cuenta. Puedes explorar ofertas por país, salario y sector. Para enviar candidaturas y usar la IA necesitas crear una cuenta — es gratis y tarda 30 segundos." },
   226|    { q: "¿En cuánto tiempo puedo encontrar trabajo?", a: "La media de nuestros usuarios activos que usan envío automático es de 3 semanas. Con CV bien optimizado y búsqueda en varios países, los usuarios suelen recibir respuesta en 1-2 semanas. Tu caso depende de tu sector y experiencia." },
   227|  ];
   228|  return (
   229|    <div className="min-h-screen" style={{ background: "#0f1117" }}>
   230|      {/* ═══════════ HEADER ═══════════ */}
   231|      <PublicHeader />
   232|
   233|
   234|      <main>
   235|        {/* ═══════════ HERO ═══════════ */}
   236|        <section className="relative py-20 md:py-28 px-6 overflow-hidden">
   237|          <div
   238|            className="absolute inset-0"
   239|            style={{
   240|              background:
   241|                "radial-gradient(ellipse at 50% -10%, rgba(34,197,94,0.12) 0%, transparent 55%)",
   242|            }}
   243|          />
   244|          <div className="max-w-3xl mx-auto text-center relative">
   245|            {/* Mascota */}
   246|            <div className="flex justify-center mb-6">
   247|              <div className="relative">
   248|                <div
   249|                  className="absolute inset-0 rounded-full"
   250|                  style={{
   251|                    boxShadow: "0 0 80px rgba(34,197,94,0.30)",
   252|                    background: "radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 70%)",
   253|                  }}
   254|                />
   255|                <LogoGusano size={90} animated />
   256|              </div>
   257|            </div>
   258|
   259|            {/* Badge */}
   260|            <div className="flex justify-center mb-6">
   261|              <span
   262|                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium"
   263|                style={{
   264|                  background: "rgba(239,68,68,0.08)",
   265|                  border: "1px solid rgba(239,68,68,0.15)",
   266|                  color: "#ef4444",
   267|                }}
   268|              >
   269|                El 95% de los CVs no los lee nadie. Esto se acaba hoy.
   270|              </span>
   271|            </div>
   272|
   273|            {/* Headline */}
   274|            <h1
   275|              className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.08] mb-5 tracking-tight"
   276|              style={{ color: "#f1f5f9" }}
   277|            >
   278|              Deja de enviar CVs
   279|              <br />
   280|              <span style={{ color: "#22c55e" }}>al vacío.</span>
   281|            </h1>
   282|
   283|            {/* Subheadline */}
   284|            <p
   285|              className="text-base md:text-lg mb-4 leading-relaxed max-w-xl mx-auto"
   286|              style={{ color: "#94a3b8" }}
   287|            >
   288|              Guzzi es el primer agente IA que busca, adapta y envía candidaturas por ti.
   289|              <br />
   290|              <strong style={{ color: "#cbd5e1" }}>
   291|                En {PAISES} países. 24 horas al día. Sin que muevas un dedo.
   292|              </strong>
   293|            </p>
   294|
   295|            {/* Trust bar */}
   296|            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-6">
   297|              {[
   298|                { num: OFERTAS, label: "ofertas activas" },
   299|                { num: PAISES, label: "países" },
   300|                { num: "24/7", label: "trabajando por ti" },
   301|                { num: OBJETIVO, label: "ofertas objetivo" },
   302|              ].map((s) => (
   303|                <div key={s.label} className="text-center">
   304|                  <div className="text-lg font-extrabold" style={{ color: "#22c55e" }}>
   305|                    {s.num}
   306|                  </div>
   307|                  <div className="text-[10px]" style={{ color: "#64748b" }}>
   308|                    {s.label}
   309|                  </div>
   310|                </div>
   311|              ))}
   312|            </div>
   313|
   314|            {/* Ventajas rápidas — visible sin scroll */}
   315|            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mb-6 text-[11px] font-medium" style={{ color: "#94a3b8" }}>
   316|              <span>🤖 CV personalizado con IA</span>
   317|              <span style={{ color: "#2d3142" }}>·</span>
   318|              <span><Mail size={14} className="inline mr-1" />Envío automático 24/7</span>
   319|              <span style={{ color: "#2d3142" }}>·</span>
   320|              <span>🌍 {PAISES} países</span>
   321|              <span style={{ color: "#2d3142" }}>·</span>
   322|              <span><ChartBar size={14} className="inline mr-1" />Pipeline visual</span>
   323|              <span style={{ color: "#2d3142" }}>·</span>
   324|              <span>💰 Comparador de salarios</span>
   325|            </div>
   326|
   327|            {/* CTAs */}
   328|            <div className="flex flex-col sm:flex-row gap-3 justify-center">
   329|              <Link
   330|                href="/auth/registro"
   331|                className="text-center text-sm font-semibold py-3.5 px-10 rounded-xl transition hover:opacity-90"
   332|                style={{
   333|                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
   334|                  color: "#fff",
   335|                }}
   336|              >
   337|                Activar mi agente IA — gratis
   338|              </Link>
   339|              <Link
   340|                href="/auth/login"
   341|                className="text-center text-sm font-medium py-3.5 px-8 rounded-xl transition hover:bg-[#1e212b]"
   342|                style={{ border: "1px solid #2d3142", color: "#94a3b8" }}
   343|              >
   344|                Ya tengo cuenta → Entrar
   345|              </Link>
   346|            </div>
   347|            <p className="mt-3 text-[11px]" style={{ color: "#475569" }}>
   348|              Sin tarjeta de crédito. En 30 segundos.
   349|            </p>
   350|            <div className="mt-4">
   351|