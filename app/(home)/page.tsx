import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";
import BuscadorPublico from "@/components/BuscadorPublico";
import PWAInstallButton from "@/components/PWAInstallButton";
import PublicHeader from "@/components/PublicHeader";
import { ofertasPorPais } from "@/lib/job-search/ofertas-por-pais";
import { NUM_PAISES } from "@/lib/paises";
import { LIMITS, LIMITES_EMPRESA } from "@/lib/plan-limits";
import { Bot, BarChart3, DollarSign, Mail, Check, X } from "lucide-react";

// La landing se CACHEA y se regenera cada 30 min (ISR con stale-while-revalidate).
// Antes era force-dynamic → ejecutaba la query pesada de getRealStats (GROUP BY sobre
// 2,68M ofertas) en CADA carga → el servidor tardaba 5-16s en responder → en la app iOS
// (WebView) eso se veía como una PANTALLA NEGRA al arrancar (rechazo Apple 2.1a). Ahora
// el HTML se sirve al instante desde caché y el arranque es inmediato.
export const revalidate = 1800;

// El canonical de la portada va aquí y no en el layout raíz (ver app/layout.tsx).
export const metadata = { alternates: { canonical: "https://buscaycurra.es" } };

function formatOfertas(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} millones de`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

async function getRealStats() {
  try {
    // La misma cuenta que las páginas de país (lib/job-search/ofertas-por-pais.ts):
    // se calcula una vez cada 6 horas y la comparten todas.
    const mapa = await ofertasPorPais();
    if (!mapa) return null;
    const rows = Object.entries(mapa)
      .map(([code, total]) => ({ code, total }))
      .sort((a, b) => b.total - a.total);
    const totalGlobal = rows.reduce((sum: number, r: {total: number}) => sum + r.total, 0);
    const countryCount = rows.filter((r: {code: string}) => r.code !== '' && r.code !== null).length;
    return { totalGlobal, rows, countryCount };
  } catch {
    return null;
  }
}

export default async function LandingPage() {
  // ── Datos reales desde la DB (con fallback a hardcoded) ──
  const stats = await getRealStats();
  
  // A proposito NO ponemos la cifra exacta. Cambia cada dia y nos obligaria a ir
  // detras de ella; "millones" es cierto (2,3 millones activas hoy) y no caduca.
  // Se usa igual en los tres sitios donde aparece.
  const OFERTAS = "Millones de";
  const PAISES = String(NUM_PAISES);

  // Mapa flags + nombres para traducir códigos ISO
  const FLAG_MAP: Record<string, { flag: string; nombre: string }> = {
    US: { flag: "🇺🇸", nombre: "Estados Unidos" },
    DE: { flag: "🇩🇪", nombre: "Alemania" },
    ES: { flag: "🇪🇸", nombre: "España" },
    FR: { flag: "🇫🇷", nombre: "Francia" },
    // OJO: la columna country guarda "uk", NO el codigo ISO "gb". Con solo la
    // clave GB, el Reino Unido —tercer mercado, 250.030 ofertas— no salia en la
    // portada: la bandera aparecia CERO veces mientras Alemania salia dos.
    // Se dejan las dos claves porque el filtro de abajo descarta lo que no este
    // en este mapa.
    GB: { flag: "🇬🇧", nombre: "Reino Unido" },
    UK: { flag: "🇬🇧", nombre: "Reino Unido" },
    CA: { flag: "🇨🇦", nombre: "Canadá" },
    AU: { flag: "🇦🇺", nombre: "Australia" },
    SE: { flag: "🇸🇪", nombre: "Suecia" },
    IT: { flag: "🇮🇹", nombre: "Italia" },
    NL: { flag: "🇳🇱", nombre: "Países Bajos" },
    CH: { flag: "🇨🇭", nombre: "Suiza" },
    IE: { flag: "🇮🇪", nombre: "Irlanda" },
    BE: { flag: "🇧🇪", nombre: "Bélgica" },
    PT: { flag: "🇵🇹", nombre: "Portugal" },
    NO: { flag: "🇳🇴", nombre: "Noruega" },
    PL: { flag: "🇵🇱", nombre: "Polonia" },
    DK: { flag: "🇩🇰", nombre: "Dinamarca" },
    AT: { flag: "🇦🇹", nombre: "Austria" },
    NZ: { flag: "🇳🇿", nombre: "Nueva Zelanda" },
    FI: { flag: "🇫🇮", nombre: "Finlandia" },
    GR: { flag: "🇬🇷", nombre: "Grecia" },
    MX: { flag: "🇲🇽", nombre: "México" },
    BR: { flag: "🇧🇷", nombre: "Brasil" },
    CO: { flag: "🇨🇴", nombre: "Colombia" },
    PE: { flag: "🇵🇪", nombre: "Perú" },
    CL: { flag: "🇨🇱", nombre: "Chile" },
    AR: { flag: "🇦🇷", nombre: "Argentina" },
    EC: { flag: "🇪🇨", nombre: "Ecuador" },
    GT: { flag: "🇬🇹", nombre: "Guatemala" },
    CR: { flag: "🇨🇷", nombre: "Costa Rica" },
    UY: { flag: "🇺🇾", nombre: "Uruguay" },
    SV: { flag: "🇸🇻", nombre: "El Salvador" },
    PA: { flag: "🇵🇦", nombre: "Panamá" },
    DO: { flag: "🇩🇴", nombre: "República Dominicana" },
  };

  const PAISES_DATA = stats
    ? stats.rows
        .filter((r: {code: string}) => FLAG_MAP[r.code])
        .slice(0, 21)
        .map((r: {code: string; total: number}) => ({
          flag: FLAG_MAP[r.code].flag,
          nombre: FLAG_MAP[r.code].nombre,
          ofertas: formatOfertas(r.total),
        }))
    : [
        { flag: "🇺🇸", nombre: "Estados Unidos", ofertas: "477K" },
        { flag: "🇩🇪", nombre: "Alemania", ofertas: "401K" },
        { flag: "🇪🇸", nombre: "España", ofertas: "171K" },
        { flag: "🇫🇷", nombre: "Francia", ofertas: "129K" },
        { flag: "🇬🇧", nombre: "Reino Unido", ofertas: "113K" },
        { flag: "🇨🇦", nombre: "Canadá", ofertas: "89K" },
        { flag: "🇦🇺", nombre: "Australia", ofertas: "72K" },
        { flag: "🇸🇪", nombre: "Suecia", ofertas: "60K" },
        { flag: "🇮🇹", nombre: "Italia", ofertas: "56K" },
        { flag: "🇳🇱", nombre: "Países Bajos", ofertas: "41K" },
        { flag: "🇨🇭", nombre: "Suiza", ofertas: "40K" },
        { flag: "🇮🇪", nombre: "Irlanda", ofertas: "30K" },
        { flag: "🇧🇪", nombre: "Bélgica", ofertas: "28K" },
        { flag: "🇵🇹", nombre: "Portugal", ofertas: "23K" },
        { flag: "🇳🇴", nombre: "Noruega", ofertas: "20K" },
        { flag: "🇵🇱", nombre: "Polonia", ofertas: "14K" },
        { flag: "🇩🇰", nombre: "Dinamarca", ofertas: "8K" },
        { flag: "🇦🇹", nombre: "Austria", ofertas: "6K" },
        { flag: "🇳🇿", nombre: "Nueva Zelanda", ofertas: "5K" },
        { flag: "🇫🇮", nombre: "Finlandia", ofertas: "5K" },
        { flag: "🇬🇷", nombre: "Grecia", ofertas: "3K" },
      ];

  // ── Planes ──
  const planes = [
    { 
      nombre: "Gratis", precio: "0", periodo: "", 
      desc: "Para probar sin compromiso", 
      items: [
        // DE LOS LÍMITES DE VERDAD, como /precios. Esta tarjeta estaba escrita a
        // mano y describía un plan que ya no existe: dos consultas a Guzzi en
        // total y ningún envío, con una etiqueta roja que lo repetía, cuando el
        // gratis tiene 15 consultas y 3 envíos AL DÍA (auditoría del 3 oct
        // 2026). Escondía el mejor argumento que tenemos.
        `📤 ${LIMITS.free.enviosCVDia} envíos de CV al día`,
        `🧠 ${LIMITS.free.guzziMaxConsultasDia} consultas al día a Guzzi`,
        `📸 ${LIMITS.free.camaraMaxUsos} búsquedas por cámara al mes`,
        `📄 ${LIMITS.free.cvConIAGratis} CV creado con IA`,
        `Búsqueda en ${NUM_PAISES} países`,
        "Pipeline de candidaturas",
        "Comparador de salarios",
        `💾 ${LIMITS.free.ofertasGuardadas} ofertas guardadas`
      ], 
      nota: "Sin tarjeta · Con carta escrita por IA en cada envío", 
      destacado: false, 
      cta: "Empezar gratis",
    },
    { 
      nombre: "Esencial", precio: "2,99", periodo: "/mes", 
      desc: "Menos que un café al mes", 
      items: [
        `📸 ${LIMITS.esencial.camaraMaxUsos} búsquedas/mes por cámara`,
        "🧠 30 consultas/día a Guzzi",
        "📤 15 envíos de CV al día",
        "📤 100 envíos a la semana",
        "Ver y editar la carta antes de enviar",
        "Preparación de entrevistas",
        "📄 3 CVs con IA",
        "💾 50 ofertas guardadas"
      ], 
      nota: "Sin permanencia · Cancela cuando quieras", 
      destacado: true, 
      cta: "Contratar Esencial", 
      tag: "⭐ Recomendado" 
    },
    { 
      nombre: "Pro", precio: "9,99", periodo: "/mes", 
      desc: "Para profesionales serios", 
      items: [
        `📸 ${LIMITS.pro.camaraMaxUsos} búsquedas/mes por cámara`,
        "🧠 100 consultas/día a Guzzi",
        "📤 50 envíos de CV al día",
        "📤 350 envíos a la semana",
        "Ver y editar la carta antes de enviar",
        "Preparación de entrevistas",
        "📄 10 CVs con IA",
        "💾 200 ofertas guardadas",
        "Soporte prioritario"
      ], 
      nota: "Sin permanencia · Cancela cuando quieras", 
      destacado: false, 
      cta: "Contratar Pro" 
    },
    { 
      nombre: "Empresa", precio: "49,99", periodo: "/mes", 
      desc: "Para RRHH y reclutadores", 
      // Lo mismo que /precios (17 oct 2026): lo que compra una empresa es ver a
      // los candidatos, y "Soporte 24/7" no existía.
      items: [
        "👥 Ver candidatos con nombre, email y teléfono",
        `📄 Contacto y CV completo de hasta ${LIMITES_EMPRESA.candidatosMes} candidatos al mes`,
        `Hasta ${LIMITES_EMPRESA.usuarios} personas de tu empresa, cada una con su cuenta`,
        "🔍 Buscar candidatos por ciudad y perfil",
        "📨 Mandarnos ofertas sin coste",
        "Guzzi IA ilimitado",
        `${LIMITS.empresa.camaraMaxUsos} búsquedas/mes por cámara`,
        "Todo lo del plan Pro, con más envíos de CV",
        // La API no existe: no se vende (igual que /precios). El equipo sí,
        // desde el 4 nov 2026 (/empresas/equipo).
        "🔌 API e integraciones (próximamente)",
      ], 
      nota: "Sin permanencia · Facturación mensual", 
      destacado: false, 
      cta: "Contactar" 
    },
  ];

  // ── Cómo funciona ──
  const pasos = [
    { num: "1", titulo: "Sube tu CV o cuéntaselo a Guzzi", desc: "En 2 minutos Guzzi analiza tu experiencia, la mejora con IA y la adapta al formato que esperan las empresas." },
    { num: "2", titulo: "Elige dónde quieres trabajar", desc: `España, Alemania, Irlanda... Guzzi escanea cientos de miles de ofertas en ${PAISES} países. Filtra por jornada, experiencia y salario.` },
    { num: "3", titulo: "Guzzi envía. Tú solo vas a la entrevista.", desc: "Carta personalizada para cada empresa. Sale en horario laboral, cuando de verdad se leen los correos. Automático." },
  ];

  // ── Superpotencias ──
  const superpotencias = [
    { titulo: `${PAISES} países, un solo agente`, desc: "Busca trabajo en España o emigra. Guzzi traduce tu CV al inglés, alemán, francés, portugués, italiano o neerlandés y te explica cómo es el CV en cada país. De España a Alemania, de Irlanda a Australia.", acento: "#22c55e" },
    { titulo: "Una carta distinta para cada empresa. Cero spam.", desc: "Tu CV no se dispara a lo loco. Guzzi escribe una carta para cada empresa y cada puesto, y el análisis de encaje te dice qué palabras clave le faltan a tu CV para esa oferta.", acento: "#f59e0b" },
    { titulo: "Enviado en horario laboral", desc: "Tu candidatura sale un día laborable entre las 9:00 y las 18:00 (hora de España), repartida para no llegar en bloque. No a las 3 de la madrugada de un sábado.", acento: "#a855f7" },
    { titulo: "24/7. No duerme. No se cansa. No se rinde.", desc: "Mientras tú vives tu vida, Guzzi revisa las ofertas nuevas que encajan con tus alertas y te avisa, y los envíos que dejaste programados salen solos.", acento: "#e07850" },
    { titulo: "Pipeline visual: sabes dónde está cada CV", desc: "Deja de preguntarte \"¿lo habrán leído?\". Ve en tiempo real el estado de cada candidatura: enviada, abierta, en revisión, entrevista, oferta. Sin agujeros negros.", acento: "#3b82f6" },
    { titulo: "Comparador de salarios reales", desc: "¿Cuánto pagan por tu puesto en Berlín vs Barcelona? ¿Merece la pena emigrar? Datos reales de cientos de miles de ofertas. Decide con números, no con intuición.", acento: "#f59e0b" },
  ];

  // ── La verdad incómoda ──
  // RETIRADAS el 10 oct 2026, antes de presentar la web en CEIN. Las cifras
  // estaban mal atribuidas: el "78 % de candidatos ghosteados" de "Adecco" es
  // de Indeed y mide lo contrario (candidatos que ignoran a empresas), y los
  // "35-45 días" de "Infoempleo" chocan con los 11,6 meses de Asempleo. Las
  // otras dos no tenían fuente localizable. La sección reaparece sola cuando
  // haya cifras con enlace a su estudio.
  const verdades: { stat: string; label: string; fuente: string }[] = [];

  // ── Comparativa ──
  const comparativa = [
    { ellos: "Tú buscas, filtras y envías a mano", nosotros: "Guzzi busca, filtra y envía por ti" },
    { ellos: "La misma carta para 200 ofertas distintas", nosotros: "Carta escrita por IA para cada empresa" },
    { ellos: "Ofertas caducadas y empresas fantasma", nosotros: `${OFERTAS.toLowerCase()} ofertas actualizadas a diario` },
    { ellos: "Sin saber si tu CV fue leído", nosotros: "Pipeline visual: enviado → abierto → entrevista" },
    { ellos: "Para trabajar fuera, un portal distinto en cada país", nosotros: `${PAISES} países. Guzzi busca en todos a la vez.` },
    { ellos: "No sabes por qué te descartan", nosotros: "IA que te dice qué le falta a tu CV para cada oferta" },
  ];

  // ── Testimonios ──
  // TESTIMONIOS RETIRADOS el 17 de agosto de 2026.
//
// Eran inventados: nombre, ciudad, oficio, cinco estrellas y cifras concretas
// ("lo mandé a 200 empresas y tuve respuesta de 47"). Con 51 usuarios
// registrados y ninguno de pago, no había de dónde sacarlos. Es el mismo
// problema que el "2.400+ personas encontraron trabajo" que ya se limpió, pero
// peor: aquello era una cifra, esto son personas que no existen.
//
// Se deja el array vacío a propósito, no se borra: cuando haya usuarios de
// verdad que quieran contar su caso, se rellena aquí y la sección reaparece
// sola. Lo que NO puede es volver a llenarse de invenciones.
const testimonios: { nombre: string; ciudad: string; puesto: string; texto: string }[] = [];

  // ── FAQ ──
  const faq = [
    { q: "¿Es realmente gratis para los candidatos?", a: `Sí. El plan gratuito incluye ${LIMITS.free.enviosCVDia} envíos de CV al día, ${LIMITS.free.guzziMaxConsultasDia} consultas al día a Guzzi, el buscador, el pipeline y el comparador de salarios, sin tarjeta. Si necesitas más, el plan Esencial cuesta 2,99 €/mes: ${LIMITS.esencial.enviosCVDia} envíos y ${LIMITS.esencial.guzziMaxConsultasDia} consultas al día, y puedes ver y editar la carta antes de enviarla.` },
    { q: "¿En cuántos países busca Guzzi?", a: `Actualmente en ${PAISES} países: España, Alemania, Reino Unido, Estados Unidos, Canadá, Francia, Suecia, Australia, Países Bajos, Italia, Suiza, Irlanda, Bélgica, Portugal, Noruega, Polonia, Dinamarca, Austria, Finlandia y más. Añadimos países nuevos constantemente.` },
    { q: "¿Cómo funciona el envío automático de CVs?", a: "Eliges la oferta o la empresa y Guzzi escribe una carta para ese puesto, la envía con tu CV en horario laboral y la apunta en tu pipeline. No es spam: cada envío lleva su propia carta, y antes de mandar a una dirección que no sale de la oferta te pide confirmación." },
    { q: "¿Es legal enviar CVs automáticamente?", a: "Totalmente legal. Enviar tu currículum a ofertas de trabajo publicadas es un derecho tuyo. Actuamos como un agente inteligente que te representa — sin cobrarte comisiones ni quedarse con parte de tu salario." },
    { q: "¿Puedo buscar trabajo en el extranjero sin hablar el idioma?", a: "Sí. Guzzi traduce tu CV a seis idiomas (inglés, alemán, francés, portugués, italiano y neerlandés) y te explica cómo es el CV en cada país. Muchas empresas multinacionales trabajan en inglés. Y si emigras, en 13 países te enseñamos el curso oficial de idioma para recién llegados." },
    { q: "¿Qué diferencia hay con InfoJobs, LinkedIn o Indeed?", a: `Son portales de anuncios: tú buscas cada oferta y mandas tu CV en cada una. BuscayCurra hace ese trabajo contigo: Guzzi busca, escribe una carta para cada empresa y envía tus candidaturas en ${NUM_PAISES} países, también a negocios de tu zona que no han publicado oferta.` },
    { q: "¿Puedo ver las ofertas sin registrarme?", a: "Sí. Las páginas de empleo por país y por puesto (en «Trabajar en…» y «Empleo») se ven sin cuenta. Para buscar con filtros, enviar candidaturas y usar la IA necesitas crear una cuenta: es gratis y tarda 30 segundos." },
    { q: "¿En cuánto tiempo puedo encontrar trabajo?", a: "Depende de tu sector, tu zona y tu experiencia, y no te vamos a dar una cifra que no podamos demostrar. Lo que sí sabemos es que ayuda mandar más candidaturas y mejor dirigidas: con un CV claro y carta adaptada a cada empresa, cada envío cuenta más." },
  ];
  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      {/* ═══════════ HEADER ═══════════ */}
      <PublicHeader />


      <main>
        {/* ═══════════ HERO ═══════════ */}
        <section className="relative py-20 md:py-28 px-6 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% -10%, rgba(34,197,94,0.12) 0%, transparent 55%)",
            }}
          />
          <div className="max-w-3xl mx-auto text-center relative">
            {/* Mascota */}
            <div className="flex justify-center mb-6">
              {/* GUZZI NO SE TOCA. Lo que cambia es el marco, no la mascota.
                  Llevaba un glow difuso de 80px, que es el efecto de neon de
                  cualquier portada generada, y encima dejaba el circulo crema
                  de la imagen flotando sin borde sobre el fondo oscuro: parecia
                  una pegatina pegada encima, no parte de la pagina.
                  Ahora lleva un aro definido en el verde de la marca. El mismo
                  gusano, presentado como un medallon: con borde, con intencion
                  y sin neon. */}
              <div
                className="relative rounded-full p-[3px]"
                style={{
                  background: "linear-gradient(145deg, rgba(34,197,94,0.55), rgba(34,197,94,0.12))",
                  boxShadow: "0 0 0 1px rgba(34,197,94,0.18), 0 10px 30px rgba(0,0,0,0.45)",
                }}
              >
                <div className="rounded-full" style={{ background: "#0f1117", padding: 2 }}>
                  <LogoGusano size={84} animated />
                </div>
              </div>
            </div>

            {/* Badge */}
            <div className="flex justify-center mb-6">
              <span
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  color: "#ef4444",
                }}
              >
                El 95% de los CVs no los lee nadie. Esto se acaba hoy.
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.08] mb-5 tracking-tight"
              style={{ color: "#f1f5f9" }}
            >
              Deja de enviar CVs
              <br />
              <span style={{ color: "#22c55e" }}>al vacío.</span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-base md:text-lg mb-4 leading-relaxed max-w-xl mx-auto"
              // textWrap balance reparte las lineas para que no caiga una
              // palabra suelta al final. Sin esto, en escritorio quedaba
              // "...candidaturas por / ti." con dos letras solas y centradas.
              style={{ color: "#94a3b8", textWrap: "balance" }}
            >
              Guzzi es un agente de IA que busca ofertas, escribe una carta para cada empresa y envía tus candidaturas.
              <br />
              <strong style={{ color: "#cbd5e1" }}>
                En {PAISES} países. 24 horas al día. Sin que muevas un dedo.
              </strong>
            </p>

            {/* Trust bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-6">
              {[
                { num: OFERTAS, label: "ofertas activas" },
                { num: PAISES, label: "países" },
                { num: "24/7", label: "trabajando por ti" },
                { num: "12", label: "idiomas" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-lg font-extrabold" style={{ color: "#22c55e" }}>
                    {s.num}
                  </div>
                  <div className="text-[10px]" style={{ color: "#64748b" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Ventajas rápidas — visible sin scroll */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mb-6 text-[11px] font-medium" style={{ color: "#94a3b8" }}>
              <span><Bot className="w-3.5 h-3.5 inline" /> CV personalizado con IA</span>
              <span style={{ color: "#2d3142" }}>·</span>
              <span><Mail className="w-3.5 h-3.5 inline" /> Envío automático 24/7</span>
              <span style={{ color: "#2d3142" }}>·</span>
              <span>{PAISES} países</span>
              <span style={{ color: "#2d3142" }}>·</span>
              <span><BarChart3 className="w-3.5 h-3.5 inline" /> Pipeline visual</span>
              <span style={{ color: "#2d3142" }}>·</span>
              <span><DollarSign className="w-3.5 h-3.5 inline" /> Comparador de salarios</span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/registro"
                className="text-center text-sm font-semibold py-3.5 px-10 rounded-xl transition hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#fff",
                }}
              >
                Activar mi agente IA — gratis
              </Link>
              <Link
                href="/auth/login"
                className="text-center text-sm font-medium py-3.5 px-8 rounded-xl transition hover:bg-[#1e212b]"
                style={{ border: "1px solid #2d3142", color: "#94a3b8" }}
              >
                Ya tengo cuenta → Entrar
              </Link>
            </div>
            <p className="mt-3 text-[11px]" style={{ color: "#6b7280" }}>
              Sin tarjeta de crédito. En 30 segundos.
            </p>
            <div className="mt-4">
              <PWAInstallButton />
            </div>
          </div>
        </section>

        {/* ═══════════ LA VERDAD INCÓMODA ═══════════ */}
        {verdades.length > 0 && (
        <section
          className="py-14 px-6"
          style={{
            background: "rgba(239,68,68,0.03)",
            borderTop: "1px solid rgba(239,68,68,0.10)",
            borderBottom: "1px solid rgba(239,68,68,0.10)",
          }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
                La verdad que nadie te cuenta sobre buscar trabajo
              </h2>
              <p className="text-sm" style={{ color: "#94a3b8" }}>
                Los portales de empleo no están diseñados para que encuentres trabajo.
                <br />
                <strong style={{ color: "#f1f5f9" }}>
                  Están diseñados para que vuelvas mañana.
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {verdades.map((v) => (
                <div
                  key={v.label}
                  className="text-center p-4 rounded-xl"
                  style={{
                    background: "rgba(239,68,68,0.04)",
                    border: "1px solid rgba(239,68,68,0.08)",
                  }}
                >
                  <div className="text-2xl md:text-3xl font-black mb-1" style={{ color: "#ef4444" }}>
                    {v.stat}
                  </div>
                  <div className="text-[11px] leading-tight mb-2" style={{ color: "#94a3b8" }}>
                    {v.label}
                  </div>
                  <div className="text-[9px]" style={{ color: "#6b7280" }}>
                    Fuente: {v.fuente}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center mt-6 text-xs" style={{ color: "#64748b" }}>
              Fuentes: Informe Randstad 2025, Encuesta Adecco Candidatos, datos públicos InfoJobs,
              Infoempleo 2025.
            </p>
          </div>
        </section>
        )}

        {/* ═══════════ CÓMO FUNCIONA ═══════════ */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-12">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
                3 pasos. El resto lo hace Guzzi.
              </h2>
              <p className="text-sm" style={{ color: "#64748b" }}>
                Tú solo apareces a la entrevista.
              </p>
            </div>
            <div className="space-y-4">
              {pasos.map((paso) => (
                <div
                  key={paso.num}
                  className="flex items-start gap-4 p-5 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{
                      background: "rgba(34,197,94,0.10)",
                      border: "1px solid rgba(34,197,94,0.2)",
                    }}
                  >
                    <span className="text-sm font-bold" style={{ color: "#22c55e" }}>{paso.num}</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h3 className="text-sm font-bold mb-1" style={{ color: "#f1f5f9" }}>
                      {paso.titulo}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                      {paso.desc}
                    </p>
                  </div>
                  <span
                    className="text-2xl font-extrabold hidden md:block"
                    style={{ color: "rgba(34,197,94,0.15)" }}
                  >
                    {paso.num}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ SUPERPOTENCIAS ═══════════ */}
        <section
          className="py-16 px-6"
          style={{
            background: "rgba(15,17,23,0.5)",
            borderTop: "1px solid rgba(45,49,66,0.4)",
          }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
                No somos un portal de empleo.
                <br />
                Somos tu agente de búsqueda personal.
              </h2>
              <p className="text-sm" style={{ color: "#64748b" }}>
                6 cosas que Guzzi hace y los portales tradicionales no.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {superpotencias.map((s) => (
                <div key={s.titulo} className="card-game p-6">
                  <h3 className="text-sm font-bold mb-3" style={{ color: s.acento }}>
                    {s.titulo}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ BÚSQUEDA PÚBLICA ═══════════ */}
        <section
          className="py-16 px-6"
          style={{
            background: "rgba(15,17,23,0.6)",
            borderTop: "1px solid rgba(45,49,66,0.4)",
            borderBottom: "1px solid rgba(45,49,66,0.4)",
          }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
                {OFERTAS} ofertas. {PAISES} países. Sin registrarte.
              </h2>
              <p className="text-sm" style={{ color: "#64748b" }}>
                Explora ofertas reales en toda Europa y el mundo. Para enviar candidaturas con IA,
                crea tu cuenta gratis.
              </p>
            </div>
            <BuscadorPublico />
          </div>
        </section>

        {/* ═══════════ PAÍSES ═══════════ */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
                Busca en España. O emigra.
                <br />
                Guzzi está en los dos lados.
              </h2>
              <p className="text-sm" style={{ color: "#64748b" }}>
                Si te planteas irte, Guzzi te busca curro antes de que hagas la maleta.
              </p>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
              {PAISES_DATA.map((p: { flag: string; nombre: string; ofertas: string }) => (
                <Link
                  key={p.nombre}
                  href={`/trabajar-en/${p.nombre.toLowerCase().replace(/\s+/g, "-")}`}
                  className="card-game p-4 text-center transition hover:border-[#22c55e]/30 hover:bg-[rgba(34,197,94,0.03)]"
                >
                  <div className="text-2xl mb-2">{p.flag}</div>
                  <div className="text-[11px] font-semibold mb-0.5" style={{ color: "#f1f5f9" }}>
                    {p.nombre}
                  </div>
                  <div className="text-[10px] font-bold" style={{ color: "#22c55e" }}>
                    {p.ofertas}
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/app/emigrar"
                className="inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-80"
                style={{ color: "#22c55e" }}
              >
                Ver todos los países y salarios →
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════ COMPARATIVA ═══════════ */}
        <section
          className="py-16 px-6"
          style={{
            background: "rgba(15,17,23,0.5)",
            borderTop: "1px solid rgba(45,49,66,0.4)",
          }}
        >
          <div className="max-w-2xl mx-auto">
            <div className="p-6 rounded-2xl" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}>
              <h2 className="text-lg font-bold mb-2 text-center" style={{ color: "#f1f5f9" }}>
                Los portales de empleo son del pasado
              </h2>
              <p className="text-center text-xs mb-5" style={{ color: "#64748b" }}>
                Tablones de anuncios del 2005 vs. agente IA del 2025.
              </p>
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                <div
                  className="text-center py-1.5 text-[10px] font-semibold rounded-lg"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
                >
                  Portales tradicionales
                </div>
                <div
                  className="text-center py-1.5 text-[10px] font-semibold rounded-lg"
                  style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}
                >
                  BuscayCurra con Guzzi
                </div>
              </div>
              <div className="space-y-2">
                {comparativa.map((row, i) => (
                  <div key={i} className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div
                      className="p-2.5 rounded-lg leading-snug"
                      style={{
                        background: "rgba(239,68,68,0.04)",
                        color: "#94a3b8",
                        border: "1px solid rgba(239,68,68,0.08)",
                      }}
                    >
                      <span style={{ color: "#ef4444" }}><X className="w-3 h-3 inline" /> </span>
                      {row.ellos}
                    </div>
                    <div
                      className="p-2.5 rounded-lg leading-snug"
                      style={{
                        background: "rgba(34,197,94,0.04)",
                        color: "#94a3b8",
                        border: "1px solid rgba(34,197,94,0.10)",
                      }}
                    >
                      <span style={{ color: "#22c55e" }}><Check className="w-3 h-3 inline" /> </span>
                      {row.nosotros}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ TESTIMONIOS ═══════════ */}
        <section
          className="py-16 px-6"
          style={{
            background: "rgba(15,17,23,0.4)",
            borderTop: "1px solid rgba(45,49,66,0.4)",
          }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
                Gente real. Resultados reales.
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {testimonios.map((t) => (
                <div key={t.nombre} className="card-game p-5">
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "#94a3b8" }}>
                    &ldquo;{t.texto}&rdquo;
                  </p>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>
                      {t.nombre}
                    </p>
                    <p className="text-[11px]" style={{ color: "#64748b" }}>
                      {t.puesto} · {t.ciudad}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ FAQ ═══════════ */}
        <section className="py-16 px-6" style={{ borderTop: "1px solid rgba(45,49,66,0.4)" }}>
          <div className="max-w-3xl mx-auto">
            <div className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
                Preguntas frecuentes
              </h2>
            </div>
            <div className="space-y-3">
              {faq.map((item) => (
                <div key={item.q} className="card-game p-5">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "#f1f5f9" }}>
                    {item.q}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ AU PAIR + LIVE-IN NANNY ═══════════ */}
        <section className="py-16 px-6" style={{ borderTop: "1px solid rgba(45,49,66,0.4)" }}>
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-xs font-semibold uppercase tracking-wider mb-3 block" style={{ color: "#22c55e" }}>
              Nuevo en BuscayCurra
            </span>
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: "#f1f5f9" }}>
              ¿Quieres ser Au Pair o Live-in Nanny?
            </h2>
            <p className="text-sm mb-8 max-w-xl mx-auto" style={{ color: "#94a3b8" }}>
              {`Miles de ofertas de au pair, nanny y live-in nanny en ${NUM_PAISES} países. `}
              Crea tu carta &ldquo;Dear Family&rdquo;, compara requisitos legales por país 
              y envía tu perfil directamente a las familias.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/app/au-pair"
                className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
              >
                Perfil Au Pair
              </Link>
              <Link
                href="/auth/registro"
                className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "transparent", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}
              >
                Live-in Nanny
              </Link>
            </div>
            <p className="text-[10px] mt-4" style={{ color: "#64748b" }}>
              {`+20.000 ofertas au pair/nanny · +19.500 con email · ${NUM_PAISES} países`}
            </p>
          </div>
        </section>

        {/* ═══════════ PLANES ═══════════ */}
        <section
          id="precios"
          className="py-20 px-6"
          style={{
            background: "rgba(15,17,23,0.5)",
            borderTop: "1px solid rgba(45,49,66,0.4)",
          }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
                Sin letra pequeña
              </h2>
              <p className="text-sm" style={{ color: "#64748b" }}>
                Empieza gratis. Paga solo si necesitas enviar más candidaturas.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {planes.map((plan) => (
                <div
                  key={plan.nombre}
                  className="rounded-xl p-5 flex flex-col relative h-full"
                  style={{
                    background: plan.destacado
                      ? "rgba(34,197,94,0.06)"
                      : "rgba(255,255,255,0.02)",
                    border: plan.destacado
                      ? "1.5px solid rgba(34,197,94,0.30)"
                      : "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {plan.tag && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{ background: "#22c55e", color: "#fff" }}
                      >
                        {plan.tag}
                      </span>
                    </div>
                  )}
                  <div className="mb-4">
                    <div
                      className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                      style={{ color: plan.destacado ? "#22c55e" : "#64748b" }}
                    >
                      {plan.nombre}
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-2xl font-extrabold" style={{ color: "#f1f5f9" }}>
                        {plan.precio}€
                      </span>
                      <span className="text-[11px]" style={{ color: "#64748b" }}>
                        {plan.periodo}
                      </span>
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>
                      {plan.desc}
                    </div>
                  </div>
                  <ul className="space-y-2 mb-5 flex-1">
                    {plan.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-[11px]"
                        style={{ color: "#94a3b8" }}
                      >
                        <span
                          className="mt-0.5 flex-shrink-0"
                          style={{ color: plan.destacado ? "#22c55e" : "#64748b" }}
                        >
                          <Check className="w-3 h-3 inline" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/registro"
                    className="block text-center text-xs font-semibold py-2.5 rounded-lg transition hover:opacity-90"
                    style={
                      plan.destacado
                        ? {
                            background: "linear-gradient(135deg, #22c55e, #16a34a)",
                            color: "#fff",
                          }
                        : { border: "1px solid #2d3142", color: "#94a3b8" }
                    }
                  >
                    {plan.cta}
                  </Link>
                  {plan.nota && (
                    <p className="mt-2 text-center text-[10px]" style={{ color: "#6b7280" }}>
                      {plan.nota}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center mt-6 text-[11px]" style={{ color: "#6b7280" }}>
              Cancela en cualquier momento. Sin permanencia.
            </p>
          </div>
        </section>

        {/* ═══════════ CTA FINAL ═══════════ */}
        <section className="py-24 px-6 text-center relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.10) 0%, transparent 60%)",
            }}
          />
          <div className="max-w-xl mx-auto relative">
            <div className="flex justify-center mb-6">
              <LogoGusano size={64} animated />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3" style={{ color: "#f1f5f9" }}>
              Tu próximo trabajo ya existe.
            </h2>
            <p className="text-sm mb-2" style={{ color: "#22c55e" }}>
              Guzzi lo encuentra mientras tú descansas.
            </p>
            <p className="text-xs mb-8" style={{ color: "#64748b" }}>
              En {PAISES} países. 24/7. Con una carta para cada empresa. El trabajo viene a ti, no
              al revés.
            </p>
            <Link
              href="/auth/registro"
              className="inline-block text-sm font-semibold py-3.5 px-12 rounded-xl transition hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff",
              }}
            >
              Activar Guzzi gratis →
            </Link>
            <p className="mt-3 text-[11px]" style={{ color: "#6b7280" }}>
              Sin tarjeta de crédito. En 30 segundos.
            </p>
          </div>
        </section>
      </main>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer
        className="py-10 px-6"
        style={{ background: "#0a0c10", borderTop: "1px solid rgba(45,49,66,0.5)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <LogoGusano size={24} />
                <span className="font-bold text-sm" style={{ color: "#22c55e" }}>
                  BuscayCurra
                </span>
              </div>
              <p className="text-[11px] leading-relaxed max-w-xs" style={{ color: "#6b7280" }}>
                Un agente de IA que busca trabajo por ti. {PAISES} países, 24/7, cero spam.
                Tu agente personal de búsqueda de empleo.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h4 className="text-xs font-semibold mb-3" style={{ color: "#94a3b8" }}>
                  Producto
                </h4>
                <div className="space-y-2">
                  {[
                    { href: "/auth/registro", label: "Empezar gratis" },
                    { href: "#precios", label: "Precios" },
                    { href: "/guias", label: "Guías de uso" },
                    // Antes apuntaba a /app/emigrar, que pide sesión: quien
                    // llegaba sin cuenta acababa en el login. La pública es esta.
                    { href: "/trabajar-en", label: "Trabajar fuera" },
                  ].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="block text-[11px] hover:opacity-80 transition"
                      style={{ color: "#64748b" }}
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-3" style={{ color: "#94a3b8" }}>
                  Legal
                </h4>
                <div className="space-y-2">
                  {[
                    { href: "/aviso-legal", label: "Aviso Legal" },
                    { href: "/privacidad", label: "Privacidad" },
                    { href: "/terminos", label: "Términos" },
                    { href: "/cookies", label: "Cookies" },
                    { href: "/soporte", label: "Soporte" },
                  ].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="block text-[11px] hover:opacity-80 transition"
                      style={{ color: "#64748b" }}
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-3" style={{ color: "#94a3b8" }}>
                  Cuenta
                </h4>
                <div className="space-y-2">
                  {[
                    { href: "/auth/login", label: "Entrar" },
                    { href: "/auth/registro", label: "Registro" },
                    { href: "/empresas", label: "Para empresas" },
                  ].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="block text-[11px] hover:opacity-80 transition"
                      style={{ color: "#64748b" }}
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div
            className="flex flex-col md:flex-row items-center justify-between gap-3 pt-6"
            style={{ borderTop: "1px solid rgba(45,49,66,0.3)" }}
          >
            {/* La marca escrita SEPARADA, en texto visible. Mucha gente busca
                "busca y curra" con espacios, y si esa forma no aparece en
                ninguna parte de la web, Google no la asocia con "buscaycurra"
                y la página deja de salir para esa búsqueda. */}
            <span className="text-[10px]" style={{ color: "#2d3142" }}>
              © 2026 BuscayCurra (Busca y Curra). Todos los derechos reservados.
            </span>
            <span className="text-[10px]" style={{ color: "#2d3142" }}>
              Hecho con <span style={{color: "#22c55e"}}>♥</span> en España
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
