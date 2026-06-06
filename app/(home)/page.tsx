import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";
import BuscadorPublico from "@/components/BuscadorPublico";
import PWAInstallButton from "@/components/PWAInstallButton";
import PublicHeader from "@/components/PublicHeader";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatOfertas(n: number): string {
  if (n >= 1_000_000) return "millones de";
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

async function getRealStats() {
  try {
    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT UPPER(country) AS code, COUNT(*)::int AS total
      FROM "JobListing"
      WHERE "isActive" = true AND country IS NOT NULL AND country != ''
      GROUP BY UPPER(country)
      ORDER BY total DESC
    `);
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
  
  const OFERTAS = stats ? formatOfertas(stats.totalGlobal) : "millones de";
  const PAISES = stats ? String(stats.countryCount) : "21";
  const OBJETIVO = "10.000.000";

  // Mapa flags + nombres para traducir códigos ISO
  const FLAG_MAP: Record<string, { flag: string; nombre: string }> = {
    US: { flag: "🇺🇸", nombre: "Estados Unidos" },
    DE: { flag: "🇩🇪", nombre: "Alemania" },
    ES: { flag: "🇪🇸", nombre: "España" },
    FR: { flag: "🇫🇷", nombre: "Francia" },
    GB: { flag: "🇬🇧", nombre: "Reino Unido" },
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
    { nombre: "Gratis", precio: "0", periodo: "", desc: "Para probar sin compromiso", items: ["2 CVs enviados por día", "Mejora de CV con IA", "Búsqueda de ofertas", "Pipeline de candidaturas"], nota: "Sin tarjeta de crédito", destacado: false, cta: "Empezar gratis" },
    { nombre: "Esencial", precio: "2,99", periodo: "/mes", desc: "Menos que un café al mes", items: ["60 candidaturas al mes", "Carta personalizada por IA", "Buscador avanzado", "Estadísticas básicas"], nota: null, destacado: true, cta: "Empezar", tag: "🔥 Más elegido" },
    { nombre: "Pro", precio: "9,99", periodo: "/mes", desc: "Para profesionales serios", items: ["10 CVs enviados por día", "IA avanzada", "Estadísticas detalladas", "Historial completo", "Soporte prioritario"], nota: null, destacado: false, cta: "Empezar" },
    { nombre: "Empresa", precio: "49,99", periodo: "/mes", desc: "Para RRHH y reclutadores", items: ["Envíos ilimitados", "Dashboard de equipo", "API e integraciones", "Soporte 24/7"], nota: null, destacado: false, cta: "Contactar" },
  ];

  // ── Cómo funciona ──
  const pasos = [
    { num: "1", icon: "📎", titulo: "Sube tu CV o cuéntaselo a Guzzi", desc: "En 2 minutos Guzzi analiza tu experiencia, la mejora con IA y la adapta al formato que esperan las empresas." },
    { num: "2", icon: "🌍", titulo: "Elige dónde quieres trabajar", desc: `España, Alemania, Irlanda... Guzzi escanea cientos de miles de ofertas en ${PAISES} países. Filtra por salario, sector y tipo de contrato.` },
    { num: "3", icon: "🚀", titulo: "Guzzi envía. Tú solo vas a la entrevista.", desc: "Carta personalizada para cada empresa. Envío en el momento exacto en que el reclutador abre el email. Automático." },
  ];

  // ── Superpotencias ──
  const superpotencias = [
    { icon: "🌍", titulo: `${PAISES} países, un solo agente`, desc: "Busca trabajo en España o emigra. Guzzi habla 12 idiomas y adapta tu CV al formato de cada país. De España a Alemania, de Irlanda a Australia — sin mover un dedo.", acento: "#22c55e" },
    { icon: "🎯", titulo: "CV único para cada oferta. Cero spam.", desc: "Tu CV no se dispara a lo loco. Guzzi lo adapta a cada empresa: palabras clave, formato, tono. Supera los filtros ATS que descartan al 75% de candidatos antes de que un humano lo vea.", acento: "#f59e0b" },
    { icon: "⏰", titulo: "Enviado cuando el reclutador está leyendo", desc: "Analizamos la hora de actividad de cada empresa. Tu candidatura llega a las 8:32am del martes — no a las 3am de un sábado. La diferencia entre abrirlo o borrarlo sin leer.", acento: "#a855f7" },
    { icon: "🤖", titulo: "24/7. No duerme. No se cansa. No se rinde.", desc: "Mientras tú vives tu vida, duermes o ves Netflix, Guzzi está escaneando ofertas, adaptando candidaturas y enviando. Como tener un comercial trabajando para ti a tiempo completo.", acento: "#e07850" },
    { icon: "📊", titulo: "Pipeline visual: sabes dónde está cada CV", desc: "Deja de preguntarte \"¿lo habrán leído?\". Ve en tiempo real el estado de cada candidatura: enviada, abierta, en revisión, entrevista, oferta. Sin agujeros negros.", acento: "#3b82f6" },
    { icon: "💰", titulo: "Comparador de salarios reales", desc: "¿Cuánto pagan por tu puesto en Berlín vs Barcelona? ¿Merece la pena emigrar? Datos reales de cientos de miles de ofertas. Decide con números, no con intuición.", acento: "#f59e0b" },
  ];

  // ── La verdad incómoda ──
  const verdades = [
    { stat: "95%", label: "de CVs no los lee nadie", fuente: "InfoJobs / Randstad" },
    { stat: "78%", label: "de candidatos ghosteados", fuente: "Adecco Spain" },
    { stat: "3-5%", label: "tasa de respuesta real", fuente: "Portales tradicionales" },
    { stat: "35-45 días", label: "de media hasta encontrar trabajo", fuente: "Infoempleo" },
  ];

  // ── Comparativa ──
  const comparativa = [
    { ellos: "Tú buscas, filtras y envías a mano", nosotros: "Guzzi busca, filtra y envía por ti" },
    { ellos: "Mismo CV para 200 ofertas distintas", nosotros: "CV adaptado por IA a cada empresa" },
    { ellos: "Ofertas caducadas y empresas fantasma", nosotros: `${OFERTAS} ofertas actualizadas a diario` },
    { ellos: "Sin saber si tu CV fue leído", nosotros: "Pipeline visual: enviado → abierto → entrevista" },
    { ellos: "Solo España. Si quieres emigrar, busca tú.", nosotros: `${PAISES} países. Guzzi busca en todos a la vez.` },
    { ellos: "ATS descarta tu CV sin leerlo", nosotros: "IA que optimiza para pasar los filtros ATS" },
    { ellos: "29€/mes para que te ignoren", nosotros: "Gratis para candidatos. Sin permanencia." },
  ];

  // ── Testimonios ──
  const testimonios = [
    { nombre: "María G.", ciudad: "Madrid", puesto: "Diseñadora gráfica", texto: "En 3 semanas tenía 4 entrevistas. Con InfoJobs estuve 2 meses enviando CVs a mano sin respuesta." },
    { nombre: "Carlos R.", ciudad: "Barcelona", puesto: "Programador junior", texto: "Me fui a Berlín. Guzzi me encontró ofertas que ni sabía que existían. En 10 días tenía contrato. Sin hablar alemán." },
    { nombre: "Ana M.", ciudad: "Valencia", puesto: "Administrativa", texto: "Nunca pensé que un software podría mejorar tanto mi CV. Lo mandé a 200 empresas y tuve respuesta de 47." },
    { nombre: "Pedro L.", ciudad: "Sevilla", puesto: "Electricista", texto: "Me sorprendió que encontrara empresas de mi sector que yo no conocía. Y el CV adaptado a cada una marcó la diferencia." },
  ];

  // ── FAQ ──
  const faq = [
    { q: "¿Es realmente gratis para los candidatos?", a: "Sí, completamente. El plan gratuito permite enviar hasta 2 CVs al día con mejora por IA. No pedimos tarjeta de crédito para registrarte. Las funciones avanzadas (60+ envíos/mes, estadísticas, ATS Score) están en los planes de pago — desde 2,99€/mes." },
    { q: "¿En cuántos países busca Guzzi?", a: `Actualmente en ${PAISES} países: España, Alemania, Reino Unido, Estados Unidos, Canadá, Francia, Suecia, Australia, Países Bajos, Italia, Suiza, Irlanda, Bélgica, Portugal, Noruega, Polonia, Dinamarca, Austria, Finlandia y más. Añadimos países nuevos constantemente.` },
    { q: "¿Cómo funciona el envío automático de CVs?", a: "Nuestra IA adapta tu CV a cada oferta antes de enviarlo. No es spam — cada candidatura se personaliza con el perfil y palabras clave de la empresa. Tú marcas sector, países y tipo de contrato, y Guzzi trabaja por ti." },
    { q: "¿Es legal enviar CVs automáticamente?", a: "Totalmente legal. Enviar tu currículum a ofertas de trabajo publicadas es un derecho tuyo. Actuamos como un agente inteligente que te representa — sin cobrarte comisiones ni quedarse con parte de tu salario." },
    { q: "¿Puedo buscar trabajo en el extranjero sin hablar el idioma?", a: "Sí. Guzzi traduce ofertas a 12 idiomas y adapta tu CV al formato de cada país. Muchas empresas multinacionales trabajan en inglés. Además, si quieres emigrar, te mostramos qué países tienen más demanda de tu perfil y qué salarios ofrecen." },
    { q: "¿Qué diferencia hay con InfoJobs, LinkedIn o Indeed?", a: "InfoJobs, LinkedIn e Indeed son tablones de anuncios: tú buscas, tú filtras, tú envías. El 95% de esos CVs no llegan a ningún humano. BuscayCurra es activo: Guzzi trabaja por ti 24/7, adapta tu CV a cada oferta y envía candidaturas automáticamente en 20+ países. No es un portal de empleo. Es tu agente personal de búsqueda." },
    { q: "¿Puedo ver las ofertas sin registrarme?", a: "Sí. El buscador público está disponible sin cuenta. Puedes explorar ofertas por país, salario y sector. Para enviar candidaturas y usar la IA necesitas crear una cuenta — es gratis y tarda 30 segundos." },
    { q: "¿En cuánto tiempo puedo encontrar trabajo?", a: "La media de nuestros usuarios activos que usan envío automático es de 3 semanas. Con CV bien optimizado y búsqueda en varios países, los usuarios suelen recibir respuesta en 1-2 semanas. Tu caso depende de tu sector y experiencia." },
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
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    boxShadow: "0 0 80px rgba(34,197,94,0.30)",
                    background: "radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 70%)",
                  }}
                />
                <LogoGusano size={90} animated />
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
              style={{ color: "#94a3b8" }}
            >
              Guzzi es el primer agente IA que busca, adapta y envía candidaturas por ti.
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
                { num: OBJETIVO, label: "ofertas objetivo" },
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
              <span>🤖 CV personalizado con IA</span>
              <span style={{ color: "#2d3142" }}>·</span>
              <span>📧 Envío automático 24/7</span>
              <span style={{ color: "#2d3142" }}>·</span>
              <span>🌍 {PAISES} países</span>
              <span style={{ color: "#2d3142" }}>·</span>
              <span>📊 Pipeline visual</span>
              <span style={{ color: "#2d3142" }}>·</span>
              <span>💰 Comparador de salarios</span>
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
            <p className="mt-3 text-[11px]" style={{ color: "#475569" }}>
              Sin tarjeta de crédito. En 30 segundos.
            </p>
            <div className="mt-4">
              <PWAInstallButton />
            </div>
          </div>
        </section>

        {/* ═══════════ LA VERDAD INCÓMODA ═══════════ */}
        <section
          className="py-14 px-6"
          style={{
            background: "rgba(239,68,68,0.03)",
            borderTop: "1px solid rgba(239,68,68,0.10)",
            borderBottom: "1px solid rgba(239,68,68,0.10)",
          }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
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
                  <div className="text-[9px]" style={{ color: "#475569" }}>
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

        {/* ═══════════ CÓMO FUNCIONA ═══════════ */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
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
                    {paso.icon}
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
            <div className="text-center mb-12">
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
                  <div className="text-3xl mb-4">{s.icon}</div>
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
            <div className="text-center mb-8">
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
            <div className="text-center mb-10">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
                Busca en España. O emigra.
                <br />
                Guzzi está en los dos lados.
              </h2>
              <p className="text-sm" style={{ color: "#64748b" }}>
                1 de cada 5 titulados españoles quiere trabajar fuera. Guzzi te busca curro antes de
                que hagas la maleta.
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
                🌍 Ver todos los países y salarios →
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
                InfoJobs y LinkedIn son del pasado
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
                      <span style={{ color: "#ef4444" }}>✕ </span>
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
                      <span style={{ color: "#22c55e" }}>✓ </span>
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
            <div className="text-center mb-10">
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
            <div className="text-center mb-10">
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
            <div className="text-center mb-12">
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
                    <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>
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
                          ✓
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
                    <p className="mt-2 text-center text-[10px]" style={{ color: "#475569" }}>
                      {plan.nota}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center mt-6 text-[11px]" style={{ color: "#475569" }}>
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
              En {PAISES} países. 24/7. Con CV adaptado a cada empresa. El trabajo viene a ti, no
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
            <p className="mt-3 text-[11px]" style={{ color: "#475569" }}>
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
              <p className="text-[11px] leading-relaxed max-w-xs" style={{ color: "#475569" }}>
                El primer agente IA que busca trabajo por ti. {PAISES} países, 24/7, cero spam.
                La alternativa real a InfoJobs, LinkedIn e Indeed.
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
                    { href: "/app/emigrar", label: "Emigrar" },
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
            <span className="text-[10px]" style={{ color: "#334155" }}>
              © 2026 BuscayCurra. Todos los derechos reservados.
            </span>
            <span className="text-[10px]" style={{ color: "#334155" }}>
              Hecho con 💚 en España
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
