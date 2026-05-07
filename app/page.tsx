/**
 * app/page.tsx — Landing "La Metamorfosis" — Vibrante, con vida, interactiva
 * Fondo con ramas/hojas, mariposas reales, pasos claros, colores vivos.
 */

import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";
import LandingFondo from "@/components/LandingFondo";

const pasos = [
  {
    num: "01",
    titulo: "Crea tu perfil",
    desc: "30 segundos. Sin tarjeta. Empiezas como un huevo 🥚",
    icon: "✨",
    color: "#7ed56f",
    detalle: "Tu aventura comienza aquí",
  },
  {
    num: "02",
    titulo: "Sube tu CV",
    desc: "Nuestra IA lo analiza y mejora automáticamente para cada sector",
    icon: "📄",
    color: "#f0c040",
    detalle: "Te conviertes en oruga 🐛",
  },
  {
    num: "03",
    titulo: "Busca ofertas",
    desc: "Miles de ofertas en toda España filtradas por zona y sector",
    icon: "🔍",
    color: "#e07850",
    detalle: "Empiezas tu capullo 🫘",
  },
  {
    num: "04",
    titulo: "Envía candidaturas",
    desc: "Automáticamente a cientos de empresas. Tú descansas.",
    icon: "📧",
    color: "#a070d0",
    detalle: "Alas abriéndose 🦋",
  },
  {
    num: "05",
    titulo: "¡Encuentra trabajo!",
    desc: "Tu mariposa se revela. 50 especies únicas esperan.",
    icon: "🎉",
    color: "#ff6090",
    detalle: "¡Metamorfosis completa! ✨",
  },
];

const especies = [
  { nombre: "Morpho Azul", color: "#1a6bff", rareza: "Épica" },
  { nombre: "Monarca", color: "#e8720c", rareza: "Rara" },
  { nombre: "Atlas", color: "#c45a20", rareza: "Legendaria" },
  { nombre: "Polilla Luna", color: "#90eebf", rareza: "Épica" },
  { nombre: "Cola de Golondrina", color: "#f0e040", rareza: "Rara" },
  { nombre: "Glasswing", color: "#d0d0d0", rareza: "Rara" },
];

const superpotencias = [
  {
    icon: "🧠",
    titulo: "Tu CV, mejorado y listo para descargar",
    desc: "Nuestra IA analiza tu currículum, lo adapta a cada sector y oferta, corrige errores y lo optimiza para pasar los filtros ATS de las empresas. En segundos tienes una versión profesional lista para descargar en PDF.",
    acento: "#7ed56f",
  },
  {
    icon: "🎯",
    titulo: "Entrevistas simuladas adaptadas a cada empresa",
    desc: "Antes de ir a una entrevista, practica con nuestra IA que conoce los valores, cultura y preguntas típicas de esa empresa específica. No es una entrevista genérica — es exactamente lo que te van a preguntar.",
    acento: "#f0c040",
  },
  {
    icon: "⚡",
    titulo: "Enviamos tu CV cuando más probabilidades tienes",
    desc: "Analizamos el horario de actividad de cada empresa: cuándo abren el email, cuándo está el responsable de RRHH, si trabajan en turno de noche. Tu CV llega en el momento exacto en que hay alguien para leerlo.",
    acento: "#a070d0",
  },
];

const faq = [
  {
    q: "¿Es realmente gratis para los candidatos?",
    a: "Sí, completamente. El plan gratuito permite enviar hasta 3 CVs al día con mejora por IA. No pedimos tarjeta de crédito para registrarte. Las funciones avanzadas (50 envíos/día, estadísticas, ATS Score) están en los planes de pago.",
  },
  {
    q: "¿Cómo funciona el envío automático de CVs?",
    a: "Nuestra IA adapta tu CV a cada oferta antes de enviarlo. No es spam — cada candidatura se personaliza con el perfil de la empresa. Tú marcas tu sector, ciudad y tipo de contrato, y el sistema trabaja por ti.",
  },
  {
    q: "¿Es legal enviar CVs automáticamente a empresas?",
    a: "Totalmente legal. Enviar tu currículum a ofertas de trabajo publicadas es un derecho tuyo. Actuamos como un agente que te representa, igual que una ETT o headhunter, pero sin cobrarte.",
  },
  {
    q: "¿En cuánto tiempo puedo encontrar trabajo?",
    a: "La media de nuestros usuarios activos es de 3 semanas. Depende del sector y la zona, pero el envío masivo multiplica exponencialmente tus probabilidades. Con CV bien optimizado, los usuarios suelen recibir respuesta en 1-2 semanas.",
  },
  {
    q: "¿Qué diferencia hay con InfoJobs, LinkedIn o Indeed?",
    a: "En esas plataformas tú buscas, filtras y envías. Aquí BuscayCurra hace todo eso por ti y encima mejora tu CV con IA. Además agregamos ofertas de más de 100k fuentes, incluyendo empresas que no publican en InfoJobs.",
  },
  {
    q: "¿Qué es la mariposa de mi perfil?",
    a: "Tu avatar de metamorfosis — una de las 50 especies únicas que desbloqueas completando pasos en tu búsqueda: subir CV, practicar entrevistas, conseguir entrevistas reales. Nuestra forma de hacer el proceso menos estresante.",
  },
];

const comparativaFilas = [
  { concepto: "Precio por candidato",       rival: "Gratis (pero sin IA)",         byc: "Gratis + IA incluida" },
  { concepto: "Precio para empresas",       rival: "€369 por UNA oferta",           byc: "€49,99/mes ilimitado" },
  { concepto: "IA que mejora tu CV",        rival: "No existe",                     byc: "Llama 3.3 + Gemini" },
  { concepto: "Chatbot guía paso a paso",   rival: "No existe",                     byc: "Gusi — disponible 24/7" },
  { concepto: "Envío automático a empresas",rival: "Manual, uno a uno",             byc: "50 empresas/día automático" },
  { concepto: "Carta de presentación IA",   rival: "No existe",                     byc: "Generada al instante" },
  { concepto: "Ofertas de múltiples fuentes",rival: "Solo su propia base de datos", byc: "100k+ fuentes agregadas" },
  { concepto: "Valoración de usuarios",     rival: "1.1/5 en Trustpilot",          byc: "Transparencia total" },
];

const testimonios = [
  {
    nombre: "María G.",
    ciudad: "Madrid",
    puesto: "Diseñadora gráfica",
    empresa: "Agencia creativa",
    mariposa: "Morpho Azul",
    texto: "En 3 semanas tenía 4 entrevistas. Con InfoJobs estuve 2 meses enviando CVs a mano sin respuesta.",
  },
  {
    nombre: "Carlos R.",
    ciudad: "Barcelona",
    puesto: "Programador junior",
    empresa: "Startup tech",
    mariposa: "Atlas",
    texto: "La función de entrevista con IA me salvó. Me preguntaron exactamente lo que había practicado con BuscayCurra.",
  },
  {
    nombre: "Ana M.",
    ciudad: "Valencia",
    puesto: "Administrativa",
    empresa: "Empresa logística",
    mariposa: "Monarca",
    texto: "Nunca pensé que un software podría mejorar tanto mi CV. Lo mandé a 200 empresas y tuve respuesta de 47.",
  },
  {
    nombre: "Pedro L.",
    ciudad: "Sevilla",
    puesto: "Electricista",
    empresa: "Instalaciones industriales",
    mariposa: "Cola de Golondrina",
    texto: "Me sorprendió que encontrara empresas de mi sector que yo no conocía. Y el CV adaptado a cada una marcó la diferencia.",
  },
  {
    nombre: "Laura T.",
    ciudad: "Bilbao",
    puesto: "Enfermera",
    empresa: "Clínica privada",
    mariposa: "Polilla Luna",
    texto: "El envío inteligente es real. Me llamaron a las 9:01 de la mañana, justo cuando el jefe de personal llegaba a la clínica.",
  },
  {
    nombre: "Javi S.",
    ciudad: "Zaragoza",
    puesto: "Mecánico",
    empresa: "Taller oficial",
    mariposa: "Glasswing",
    texto: "Antes pagaba por destacar en InfoJobs sin resultado. Con BuscayCurra encontré trabajo en 3 semanas y pagué cero.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0f1a0a 0%, #1a1a12 15%, #15200e 50%, #1a1a12 85%, #0f1a0a 100%)" }}>

      {/* ══════ FONDO VIVO — Ramas, hojas, partículas (cliente para evitar hydration mismatch) ══════ */}
      <LandingFondo />

      {/* ══════ HEADER ══════ */}
      <header className="glass-warm sticky top-0 z-50" style={{ borderBottom: "1px solid rgba(126,213,111,0.12)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoGusano size={34} animated />
            <span className="font-bold text-lg" style={{ color: "#7ed56f" }}>BuscayCurra</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/precios" className="px-3 py-1.5 text-sm font-bold rounded-xl transition"
              style={{ color: "#f0c040", border: "1px solid rgba(240,192,64,0.3)", background: "rgba(240,192,64,0.06)" }}>
              ⭐ Precios
            </Link>
            <Link href="/auth/login" className="px-4 py-2 text-sm font-medium" style={{ color: "#b0a890" }}>
              Entrar
            </Link>
            <Link href="/auth/registro" className="btn-game text-sm !py-2 !px-5">
              🌱 Empezar
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">

        {/* ══════ HERO — Grande, vivo, con mariposa de fondo ══════ */}
        <section className="relative py-20 md:py-28 px-4 overflow-hidden">
          {/* Mariposa de fondo grande semi-transparente */}
          <div className="absolute right-0 top-10 opacity-[0.06] pointer-events-none hidden md:block"
            style={{ width: "500px", height: "500px" }}>
            <svg viewBox="0 0 200 160" fill="none" style={{ width: "100%", height: "100%", animation: "wing-flap 3s ease-in-out infinite" }}>
              <path d="M100 80 C75 45 15 10 10 55 C5 85 55 100 100 90Z" fill="#7ed56f" />
              <path d="M100 80 C125 45 185 10 190 55 C195 85 145 100 100 90Z" fill="#5cb848" />
              <path d="M100 88 C78 92 25 100 30 130 C35 150 75 145 100 120Z" fill="#7ed56f" opacity="0.8" />
              <path d="M100 88 C122 92 175 100 170 130 C165 150 125 145 100 120Z" fill="#5cb848" opacity="0.8" />
              <ellipse cx="100" cy="100" rx="6" ry="30" fill="#3a5a2a" />
            </svg>
          </div>

          <div className="max-w-4xl mx-auto text-center relative">
            {/* Oruga animada */}
            <div className="flex justify-center mb-8">
              <div className="animate-float" style={{ filter: "drop-shadow(0 12px 30px rgba(126,213,111,0.3))" }}>
                <LogoGusano size={110} animated />
              </div>
            </div>

            {/* Badge de estado */}
            <div className="flex justify-center mb-5">
              <span className="badge-game badge-verde text-xs">🌱 +2.400 personas ya evolucionando</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-6">
              <span style={{ color: "#f0ebe0" }}>Tu trabajo </span>
              <span style={{
                background: "linear-gradient(135deg, #7ed56f 0%, #f0c040 50%, #e07850 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                está ahí fuera
              </span>
              <br />
              <span style={{ color: "#f0ebe0" }}>Nosotros te </span>
              <span style={{ color: "#7ed56f" }}>llevamos</span>
            </h1>

            <p className="text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto" style={{ color: "#b0a890" }}>
              IA que mejora tu CV, busca ofertas y envía candidaturas.
              <br />
              <strong style={{ color: "#f0c040" }}>Empieza como oruga. Termina como mariposa.</strong>
            </p>

            {/* CTAs grandes */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link href="/auth/registro" className="btn-game text-lg !py-4 !px-12 !text-base">
                🦋 Comenzar mi metamorfosis
              </Link>
              <Link href="#pasos" className="btn-game-outline text-lg !py-4 !px-10 !text-base">
                Ver cómo funciona ↓
              </Link>
            </div>

            <p className="text-xs" style={{ color: "#706a58" }}>Gratis para siempre. Sin tarjeta de crédito.</p>
          </div>
        </section>

        {/* ══════ STATS — Números de credibilidad ══════ */}
        <section className="py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { num: "17.000+", label: "Ofertas activas", icon: "💼", color: "#7ed56f" },
                { num: "2.400+", label: "Candidatos activos", icon: "🦋", color: "#f0c040" },
                { num: "3 semanas", label: "Media hasta empleo", icon: "⚡", color: "#e07850" },
                { num: "100k+", label: "Fuentes de empleo", icon: "🌐", color: "#a070d0" },
              ].map((stat) => (
                <div key={stat.label} className="card-game p-6 text-center">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-2xl md:text-3xl font-black mb-1" style={{ color: stat.color }}>{stat.num}</div>
                  <div className="text-xs" style={{ color: "#706a58" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ DIFERENCIAL vs InfoJobs — Banner visible ══════ */}
        <section className="py-8 px-4" style={{ background: "rgba(59,95,224,0.06)", borderTop: "1px solid rgba(59,95,224,0.15)", borderBottom: "1px solid rgba(59,95,224,0.15)" }}>
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl md:text-2xl font-black mb-1" style={{ color: "#7eb8f0" }}>
                💡 Lo que InfoJobs debería ser (pero no es)
              </h2>
              <p className="text-sm md:text-base" style={{ color: "#b0a890" }}>
                InfoJobs cobra €369 por UNA oferta y tiene 1.1/5 en Trustpilot.
                <strong style={{ color: "#f0ebe0" }}> Nosotros somos gratis para candidatos, con IA y envío automático.</strong>
              </p>
            </div>
            <div className="flex flex-wrap gap-3 flex-shrink-0">
              {["IA incluida", "Envío automático", "100k+ ofertas"].map((tag) => (
                <span key={tag} className="text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: "rgba(59,95,224,0.12)", color: "#7eb8f0", border: "1px solid rgba(59,95,224,0.3)" }}>
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ PASOS — El camino de la metamorfosis ══════ */}
        <section id="pasos" className="py-20 px-4 relative">
          {/* Línea conectora vertical */}
          <div className="absolute left-1/2 top-32 bottom-20 w-0.5 hidden md:block" 
            style={{ background: "linear-gradient(180deg, #7ed56f 0%, #f0c040 40%, #e07850 70%, #a070d0 90%, #ff6090 100%)", opacity: 0.2 }} />
          
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: "#f0ebe0" }}>
              Tu camino: de oruga a mariposa
            </h2>
            <p className="text-center mb-16" style={{ color: "#706a58" }}>
              5 pasos. Como un juego, pero de verdad funciona.
            </p>

            <div className="space-y-8">
              {pasos.map((paso, i) => (
                <div key={paso.num}
                  className={`flex items-start gap-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} flex-col md:flex-row`}
                >
                  {/* Número y línea */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${paso.color}20, ${paso.color}40)`,
                        border: `2px solid ${paso.color}50`,
                        color: paso.color,
                        boxShadow: `0 4px 20px ${paso.color}25`,
                      }}>
                      {paso.num}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="card-game p-6 flex-1 max-w-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{paso.icon}</span>
                      <h3 className="text-lg font-bold" style={{ color: paso.color }}>{paso.titulo}</h3>
                    </div>
                    <p className="text-sm leading-relaxed mb-2" style={{ color: "#b0a890" }}>{paso.desc}</p>
                    <span className="text-xs font-medium" style={{ color: "#706a58" }}>{paso.detalle}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ COMPARATIVA InfoJobs vs BuscayCurra ══════ */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-2" style={{ color: "#f0ebe0" }}>
              InfoJobs vs BuscayCurra
            </h2>
            <p className="text-center text-lg font-semibold mb-2" style={{ color: "#f0c040" }}>
              La alternativa inteligente que InfoJobs nunca será
            </p>
            <p className="text-center mb-12" style={{ color: "#706a58" }}>
              Mismo objetivo, experiencia completamente diferente.
            </p>

            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(15,26,10,0.6)", border: "1px solid rgba(126,213,111,0.12)" }}>
              {/* Header */}
              <div className="grid grid-cols-3 text-center text-sm font-bold py-4 px-4" style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(126,213,111,0.1)" }}>
                <div style={{ color: "#706a58" }}>Característica</div>
                <div style={{ color: "#e07850" }}>InfoJobs</div>
                <div style={{ color: "#7ed56f" }}>BuscayCurra</div>
              </div>

              {comparativaFilas.map((fila, i) => (
                <div key={fila.concepto}
                  className="grid grid-cols-3 text-center text-sm py-4 px-4 items-center gap-2"
                  style={{
                    background: i % 2 === 0 ? "rgba(126,213,111,0.02)" : "transparent",
                    borderBottom: "1px solid rgba(126,213,111,0.05)",
                  }}>
                  <div className="font-medium text-left text-xs md:text-sm" style={{ color: "#b0a890" }}>{fila.concepto}</div>
                  <div className="flex items-center justify-center gap-1 text-xs md:text-sm" style={{ color: "#e07850" }}>
                    <span>❌</span>
                    <span>{fila.rival}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs md:text-sm" style={{ color: "#7ed56f" }}>
                    <span>✅</span>
                    <span>{fila.byc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href="/auth/registro" className="btn-game text-base !py-4 !px-10">
                Empieza gratis — Es mejor que InfoJobs
              </Link>
            </div>
          </div>
        </section>

        {/* ══════ PREVIEW ESPECIES — Las mariposas que puedes desbloquear ══════ */}
        <section className="py-20 px-4" style={{ background: "linear-gradient(180deg, transparent, rgba(126,213,111,0.03), transparent)" }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3" style={{ color: "#f0ebe0" }}>
              50 especies te esperan
            </h2>
            <p className="text-center mb-12" style={{ color: "#706a58" }}>
              Cada usuario tiene una mariposa única. ¿Cuál será la tuya?
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {especies.map((esp) => (
                <div key={esp.nombre} className="card-game p-4 text-center group cursor-pointer">
                  {/* SVG mariposa mini */}
                  <div className="mx-auto mb-3 w-16 h-14 flex items-center justify-center">
                    <svg viewBox="0 0 80 64" width="64" height="52" style={{ filter: `drop-shadow(0 2px 8px ${esp.color}40)` }}>
                      <path d={`M40 32 C30 18 5 5 4 25 C3 38 22 44 40 38Z`} fill={esp.color} opacity="0.85" />
                      <path d={`M40 32 C50 18 75 5 76 25 C77 38 58 44 40 38Z`} fill={esp.color} opacity="0.7" />
                      <path d={`M40 37 C32 39 12 44 14 56 C16 63 32 62 40 52Z`} fill={esp.color} opacity="0.65" />
                      <path d={`M40 37 C48 39 68 44 66 56 C64 63 48 62 40 52Z`} fill={esp.color} opacity="0.55" />
                      <ellipse cx="40" cy="42" rx="2.5" ry="14" fill="#2a2a1e" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#f0ebe0" }}>{esp.nombre}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: esp.rareza === "Legendaria" ? "#f0c04020" : esp.rareza === "Épica" ? "#a070d020" : "#7ed56f20",
                      color: esp.rareza === "Legendaria" ? "#f0c040" : esp.rareza === "Épica" ? "#a070d0" : "#7ed56f",
                      border: `1px solid ${esp.rareza === "Legendaria" ? "#f0c04030" : esp.rareza === "Épica" ? "#a070d030" : "#7ed56f30"}`,
                    }}>
                    {esp.rareza}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-center mt-8 text-sm" style={{ color: "#706a58" }}>
              ...y 44 más. Desde la común <strong style={{ color: "#b0a890" }}>Mariposa de la Col</strong> hasta la legendaria <strong style={{ color: "#f0c040" }}>Mariposa Atlas</strong>.
            </p>
          </div>
        </section>

        {/* ══════ SUPERPOTENCIAS — Nuestras 3 funcionalidades principales ══════ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3" style={{ color: "#f0ebe0" }}>
              Nuestras 3 superpotencias
            </h2>
            <p className="text-center mb-14" style={{ color: "#706a58" }}>
              Tres herramientas reales que cambian el resultado de tu búsqueda.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {superpotencias.map((s) => (
                <div key={s.titulo} className="card-game p-7 relative">
                  <div className="absolute top-4 right-4">
                    <span className="badge-game badge-verde text-[10px]">✓ Disponible ya</span>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-5 flex-shrink-0"
                    style={{ background: `${s.acento}18`, border: `2px solid ${s.acento}40` }}>
                    {s.icon}
                  </div>
                  <h3 className="text-base font-bold mb-3 leading-snug" style={{ color: "#f0ebe0" }}>{s.titulo}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#b0a890" }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ PRECIOS ══════ */}
        <section className="py-20 px-4" style={{ background: "rgba(15,26,10,0.5)" }} id="precios">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-2" style={{ color: "#f0ebe0" }}>
              Planes simples
            </h2>
            <p className="text-center mb-3" style={{ color: "#706a58" }}>
              Empieza gratis. Evoluciona cuando quieras.
            </p>
            {/* Comparativa InfoJobs */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs"
                style={{ background: "rgba(126,213,111,0.08)", border: "1px solid rgba(126,213,111,0.15)" }}>
                <span style={{ color: "#706a58" }}>💡 InfoJobs cobra</span>
                <span className="font-bold line-through" style={{ color: "#ef4444" }}>€369 por una oferta</span>
                <span style={{ color: "#706a58" }}>·</span>
                <span className="font-bold" style={{ color: "#7ed56f" }}>Nosotros: 50 envíos/día por €9,99/mes</span>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {[
                { nombre: "Gratis", precio: "0€", periodo: "", emoji: "🥚", desc: "Para empezar", items: ["3 CVs/día", "Buscador básico", "CV con IA"], dest: false, badge: null },
                { nombre: "Básico", precio: "2,99€", periodo: "/mes", emoji: "🐛", desc: "Lo esencial", items: ["15 CVs/día", "IA avanzada", "Carta presentación"], dest: false, badge: null },
                { nombre: "Pro", precio: "9,99€", periodo: "/mes", emoji: "🦋", desc: "Para encontrar trabajo rápido", items: ["50 CVs/día", "ATS Score", "Estadísticas", "Soporte"], dest: true, badge: "⭐ Popular · 7 días gratis" },
                { nombre: "Empresa", precio: "49,99€", periodo: "/mes", emoji: "🏢", desc: "Sin límites", items: ["Ilimitado", "API acceso", "Dashboard equipo", "Factura B2B"], dest: false, badge: null },
              ].map((plan) => (
                <div key={plan.nombre}
                  className={`card-game p-6 text-center relative flex flex-col ${plan.dest ? "scale-[1.02]" : ""}`}
                  style={plan.dest ? { borderColor: "#7ed56f", boxShadow: "0 0 40px rgba(126,213,111,0.12)" } : {}}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="badge-game badge-dorado text-[10px] px-3">{plan.badge}</span>
                    </div>
                  )}
                  <div className="text-3xl mb-2">{plan.emoji}</div>
                  <h3 className="text-base font-bold" style={{ color: "#f0ebe0" }}>{plan.nombre}</h3>
                  <p className="text-[11px] mb-3" style={{ color: "#706a58" }}>{plan.desc}</p>
                  <div className="mb-4">
                    <span className="text-2xl font-black" style={{ color: plan.dest ? "#7ed56f" : "#f0ebe0" }}>{plan.precio}</span>
                    <span className="text-xs" style={{ color: "#706a58" }}>{plan.periodo}</span>
                  </div>
                  <ul className="space-y-1.5 mb-5 text-left flex-1">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs" style={{ color: "#b0a890" }}>
                        <span style={{ color: "#7ed56f" }}>✓</span>{item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/precios"
                    className={plan.dest ? "btn-game w-full block text-center text-sm py-2" : "btn-game-outline w-full block text-center text-sm py-2"}>
                    {plan.nombre === "Gratis" ? "Empezar gratis" : plan.dest ? "7 días gratis →" : "Ver plan"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ TESTIMONIOS ══════ */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3" style={{ color: "#f0ebe0" }}>
              Personas que ya encontraron trabajo 🦋
            </h2>
            <p className="text-center mb-14" style={{ color: "#706a58" }}>
              Ellos empezaron como tú. Ahora son mariposas.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonios.map((t) => (
                <div key={t.nombre} className="card-game p-6 flex flex-col gap-3">
                  <div className="text-4xl font-black leading-none" style={{ color: "rgba(126,213,111,0.25)" }}>"</div>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: "#f0ebe0" }}>{t.texto}</p>
                  <div className="pt-3" style={{ borderTop: "1px solid rgba(126,213,111,0.1)" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold" style={{ color: "#7ed56f" }}>{t.nombre} · {t.ciudad}</p>
                        <p className="text-xs" style={{ color: "#706a58" }}>{t.puesto} — {t.empresa}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl" style={{ color: "#f0c040" }}>🦋</p>
                        <p className="text-[10px]" style={{ color: "#706a58" }}>{t.mariposa}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ FAQ ══════ */}
        <section className="py-20 px-4" style={{ background: "rgba(15,26,10,0.4)" }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4" style={{ color: "#f0ebe0" }}>
              Preguntas frecuentes
            </h2>
            <p className="text-center mb-14" style={{ color: "#706a58" }}>
              Todo lo que necesitas saber antes de empezar.
            </p>
            <div className="space-y-4">
              {faq.map((item) => (
                <div key={item.q} className="card-game p-6">
                  <h3 className="font-bold mb-3 text-base" style={{ color: "#f0ebe0" }}>
                    <span style={{ color: "#7ed56f" }}>✦</span> {item.q}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#b0a890" }}>{item.a}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <p className="text-sm" style={{ color: "#706a58" }}>
                ¿Tienes otra pregunta?{" "}
                <a href="mailto:hola@buscaycurra.es" style={{ color: "#7ed56f" }}>Escríbenos</a>
              </p>
            </div>
          </div>
        </section>

        {/* ══════ CTA FINAL ══════ */}
        <section className="py-24 px-4 text-center relative">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center mb-6 animate-float">
              <div style={{ filter: "drop-shadow(0 8px 24px rgba(126,213,111,0.3))" }}>
                <LogoGusano size={80} animated />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#f0ebe0" }}>
              ¿Listo para tu <span style={{ color: "#7ed56f" }}>metamorfosis</span>?
            </h2>
            <p className="mb-8 text-lg" style={{ color: "#b0a890" }}>
              Miles de personas ya están evolucionando. Es tu turno.
            </p>
            <Link href="/auth/registro" className="btn-game text-lg !py-4 !px-12">
              🦋 Comenzar ahora — Es gratis
            </Link>
          </div>
        </section>
      </main>

      {/* ══════ FOOTER ══════ */}
      <footer className="py-10 px-4" style={{ backgroundColor: "#0d0d08", borderTop: "1px solid rgba(126,213,111,0.08)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <LogoGusano size={24} />
              <span className="font-bold text-sm" style={{ color: "#7ed56f" }}>BuscayCurra</span>
            </div>
            <div className="flex flex-wrap gap-5 text-sm">
              {[
                { href: "/auth/login", label: "Entrar" },
                { href: "/auth/registro", label: "Registro" },
                { href: "/precios", label: "Precios" },
              ].map((l) => (
                <Link key={l.href} href={l.href} style={{ color: "#706a58" }}>{l.label}</Link>
              ))}
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(126,213,111,0.06)" }}>
            <div className="flex flex-wrap gap-4 text-xs">
              {[
                { href: "/aviso-legal", label: "Aviso Legal" },
                { href: "/privacidad", label: "Privacidad" },
                { href: "/terminos", label: "Términos" },
                { href: "/cookies", label: "Cookies" },
              ].map((l) => (
                <Link key={l.href} href={l.href} style={{ color: "#504a3a" }}>{l.label}</Link>
              ))}
            </div>
            <span className="text-[10px]" style={{ color: "#3a3628" }}>© {new Date().getFullYear()} BuscayCurra</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
