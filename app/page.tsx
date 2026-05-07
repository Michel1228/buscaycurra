import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";
import BuscadorPublico from "@/components/BuscadorPublico";

const planes = [
  {
    nombre: "Gratis",
    precio: "0",
    periodo: "",
    desc: "Para probar sin compromiso",
    items: ["5 candidaturas al mes", "Mejora de CV con IA", "Búsqueda de ofertas", "Pipeline de candidaturas"],
    nota: "Sin tarjeta de crédito",
    destacado: false,
    cta: "Empezar gratis",
  },
  {
    nombre: "Esencial",
    precio: "2,99",
    periodo: "/mes",
    desc: "Menos que un café al mes",
    items: ["30 candidaturas al mes", "Carta personalizada por IA", "Búsqueda avanzada", "Historial de envíos"],
    nota: null,
    destacado: false,
    cta: "Empezar",
  },
  {
    nombre: "Básico",
    precio: "4,99",
    periodo: "/mes",
    desc: "Para buscadores ocasionales",
    items: ["60 candidaturas al mes", "Carta personalizada por IA", "Búsqueda avanzada", "Seguimiento de candidaturas"],
    nota: null,
    destacado: false,
    cta: "Empezar",
  },
  {
    nombre: "Pro",
    precio: "9,99",
    periodo: "/mes",
    desc: "Para encontrar trabajo de verdad",
    items: ["200 candidaturas al mes", "Carta avanzada por IA", "Estadísticas de apertura", "Email diario con ofertas", "Soporte prioritario"],
    nota: null,
    destacado: true,
    cta: "Empezar",
    tag: "Más popular",
  },
  {
    nombre: "Empresa",
    precio: "49,99",
    periodo: "/mes",
    desc: "Para RRHH y reclutadores",
    items: ["Candidaturas ilimitadas", "Múltiples perfiles", "Panel de gestión", "API e integraciones"],
    nota: null,
    destacado: false,
    cta: "Contactar",
  },
];

const pasos = [
  { num: "1", icon: "📎", titulo: "Sube tu CV o cuéntale a Guzzi", desc: "En 2 minutos Guzzi analiza tu experiencia y la mejora con IA." },
  { num: "2", icon: "🎯", titulo: "Dile qué trabajo buscas", desc: "Puesto y ciudad. Guzzi escanea miles de ofertas en segundos y filtra las que encajan." },
  { num: "3", icon: "✅", titulo: "Aprueba y Guzzi envía", desc: "Ves cada empresa antes de enviar. Carta personalizada para cada una. Automático." },
];

const superpotencias = [
  {
    icon: "🧠",
    titulo: "Tu CV, mejorado y listo para descargar",
    desc: "Nuestra IA analiza tu currículum, lo adapta a cada sector y oferta, corrige errores y lo optimiza para pasar los filtros ATS de las empresas. En segundos tienes una versión profesional lista para descargar en PDF.",
    acento: "#22c55e",
  },
  {
    icon: "🎯",
    titulo: "Entrevistas simuladas adaptadas a cada empresa",
    desc: "Antes de ir a una entrevista, practica con nuestra IA que conoce los valores, cultura y preguntas típicas de esa empresa. No es una entrevista genérica — es exactamente lo que te van a preguntar.",
    acento: "#f59e0b",
  },
  {
    icon: "⚡",
    titulo: "Enviamos tu CV cuando más probabilidades tienes",
    desc: "Analizamos el horario de actividad de cada empresa: cuándo abren el email, cuándo está el responsable de RRHH. Tu CV llega en el momento exacto en que hay alguien para leerlo.",
    acento: "#a855f7",
  },
];

const testimonios = [
  {
    nombre: "María G.",
    ciudad: "Madrid",
    puesto: "Diseñadora gráfica",
    texto: "En 3 semanas tenía 4 entrevistas. Con InfoJobs estuve 2 meses enviando CVs a mano sin respuesta.",
  },
  {
    nombre: "Carlos R.",
    ciudad: "Barcelona",
    puesto: "Programador junior",
    texto: "La función de entrevista con IA me salvó. Me preguntaron exactamente lo que había practicado con BuscayCurra.",
  },
  {
    nombre: "Ana M.",
    ciudad: "Valencia",
    puesto: "Administrativa",
    texto: "Nunca pensé que un software podría mejorar tanto mi CV. Lo mandé a 200 empresas y tuve respuesta de 47.",
  },
  {
    nombre: "Pedro L.",
    ciudad: "Sevilla",
    puesto: "Electricista",
    texto: "Me sorprendió que encontrara empresas de mi sector que yo no conocía. Y el CV adaptado a cada una marcó la diferencia.",
  },
];

const faq = [
  {
    q: "¿Es realmente gratis para los candidatos?",
    a: "Sí, completamente. El plan gratuito permite enviar hasta 5 CVs al mes con mejora por IA. No pedimos tarjeta de crédito para registrarte. Las funciones avanzadas (200 envíos/día, estadísticas, ATS Score) están en los planes de pago.",
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
    a: "La media de nuestros usuarios activos es de 3 semanas. Con CV bien optimizado y envío masivo los usuarios suelen recibir respuesta en 1-2 semanas.",
  },
  {
    q: "¿Qué diferencia hay con InfoJobs, LinkedIn o Indeed?",
    a: "InfoJobs, LinkedIn e Indeed son tablones de anuncios: tú buscas, tú filtras, tú envías. El 95% de esos CVs no llegan a ningún humano. BuscayCurra es activo: Guzzi trabaja por ti 24/7, adapta tu CV a cada oferta y envía candidaturas automáticamente. Además agregamos ofertas de más de 4 fuentes, incluyendo empresas que no publican en InfoJobs.",
  },
  {
    q: "¿Puedo ver las ofertas sin registrarme?",
    a: "Sí. El buscador público está disponible sin cuenta. Para enviar candidaturas y usar la IA necesitas crear una cuenta — es gratis y tarda 30 segundos.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>

      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: "rgba(15,17,23,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(45,49,66,0.4)" }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoGusano size={28} />
            <span className="font-bold text-sm tracking-tight" style={{ color: "#22c55e" }}>BuscayCurra</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/empresas" className="text-sm font-medium transition hover:opacity-80 hidden sm:block" style={{ color: "#64748b" }}>Para empresas</Link>
            <Link href="/auth/login" className="text-sm font-medium transition hover:opacity-80 hidden sm:block" style={{ color: "#94a3b8" }}>Entrar</Link>
            <Link href="/auth/registro" className="text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* Hero */}
        <section className="relative py-20 md:py-28 px-6 overflow-hidden">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(34,197,94,0.10) 0%, transparent 55%)" }} />
          <div className="max-w-3xl mx-auto text-center relative">

            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 60px rgba(34,197,94,0.25)", background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)" }} />
                <LogoGusano size={90} animated />
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", color: "#22c55e" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse" />
                +2.400 personas ya encontrando trabajo con Guzzi
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.08] mb-5 tracking-tight" style={{ color: "#f1f5f9" }}>
              Guzzi busca por ti.<br />
              <span style={{ color: "#22c55e" }}>Tú solo apareces</span><br />
              <span style={{ color: "#f1f5f9" }}>a la entrevista.</span>
            </h1>

            <p className="text-base md:text-lg mb-8 leading-relaxed max-w-xl mx-auto" style={{ color: "#94a3b8" }}>
              En InfoJobs y LinkedIn tú mandas CVs al vacío.{" "}
              <strong style={{ color: "#cbd5e1" }}>Aquí Guzzi envía 200 candidaturas personalizadas</strong> al mes mientras tú haces otra cosa.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <Link href="/auth/registro"
                className="text-center text-sm font-semibold py-3.5 px-10 rounded-xl transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                Comenzar gratis — sin tarjeta
              </Link>
              <Link href="/auth/login"
                className="text-center text-sm font-medium py-3.5 px-8 rounded-xl transition hover:bg-[#1e212b]"
                style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
                Ya tengo cuenta → Entrar
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: "#22c55e" }}>213.000+</div>
                <div className="text-[11px]" style={{ color: "#64748b" }}>ofertas activas en España</div>
              </div>
              <div className="hidden sm:block w-px h-8" style={{ background: "#2d3142" }} />
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: "#22c55e" }}>2.400+</div>
                <div className="text-[11px]" style={{ color: "#64748b" }}>personas en activo</div>
              </div>
              <div className="hidden sm:block w-px h-8" style={{ background: "#2d3142" }} />
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: "#f59e0b" }}>95%</div>
                <div className="text-[11px]" style={{ color: "#64748b" }}>de CVs ignorados en portales</div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-10 px-6" style={{ background: "rgba(15,17,23,0.4)", borderTop: "1px solid rgba(45,49,66,0.3)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { num: "213.000+", label: "Ofertas activas", icon: "💼", color: "#22c55e" },
                { num: "2.400+", label: "Candidatos activos", icon: "👥", color: "#f59e0b" },
                { num: "3 semanas", label: "Media hasta empleo", icon: "⚡", color: "#e07850" },
                { num: "4 fuentes", label: "APIs de empleo", icon: "🌐", color: "#a855f7" },
              ].map((stat) => (
                <div key={stat.label} className="card-game p-5 text-center">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="text-xl md:text-2xl font-black mb-1" style={{ color: stat.color }}>{stat.num}</div>
                  <div className="text-[11px]" style={{ color: "#64748b" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Búsqueda pública */}
        <section className="py-16 px-6" style={{ background: "rgba(15,17,23,0.6)", borderTop: "1px solid rgba(45,49,66,0.4)", borderBottom: "1px solid rgba(45,49,66,0.4)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
                213.000+ ofertas reales en España ahora mismo
              </h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Busca sin registrarte. Para enviar candidaturas, crea tu cuenta gratis.</p>
            </div>
            <BuscadorPublico />
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>3 pasos. 8 minutos. 200 candidaturas.</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Guzzi hace el trabajo. Tú solo apruebas.</p>
            </div>
            <div className="space-y-4">
              {pasos.map((paso) => (
                <div key={paso.num} className="flex items-start gap-4 p-5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    {paso.icon}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h3 className="text-sm font-bold mb-1" style={{ color: "#f1f5f9" }}>{paso.titulo}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{paso.desc}</p>
                  </div>
                  <span className="text-2xl font-extrabold hidden md:block" style={{ color: "rgba(34,197,94,0.15)" }}>{paso.num}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Superpotencias */}
        <section className="py-16 px-6" style={{ background: "rgba(15,17,23,0.5)", borderTop: "1px solid rgba(45,49,66,0.4)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>3 superpotencias que ninguna otra plataforma tiene</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>No somos un portal de empleo más. Somos tu agente de búsqueda personal.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {superpotencias.map((s) => (
                <div key={s.titulo} className="card-game p-6">
                  <div className="text-3xl mb-4">{s.icon}</div>
                  <h3 className="text-sm font-bold mb-3" style={{ color: s.acento }}>{s.titulo}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparativa vs portales */}
        <section className="py-8 px-6" style={{ background: "rgba(239,68,68,0.04)", borderTop: "1px solid rgba(239,68,68,0.12)", borderBottom: "1px solid rgba(239,68,68,0.12)" }}>
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-lg md:text-xl font-black mb-1" style={{ color: "#f1f5f9" }}>
                ⚡ Los portales te ignoran. Guzzi trabaja para ti.
              </h2>
              <p className="text-sm" style={{ color: "#94a3b8" }}>
                InfoJobs, LinkedIn e Indeed son tablones de anuncios pasivos.
                <strong style={{ color: "#f1f5f9" }}> BuscayCurra es la única plataforma en España donde el trabajo viene a ti, no al revés.</strong>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {["Activo 24/7", "Gratis para candidatos", "Sin ofertas fantasma"].map((tag) => (
                <span key={tag} className="text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: "rgba(34,197,94,0.10)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Portales tradicionales vs BuscayCurra */}
        <section className="py-16 px-6" style={{ background: "rgba(15,17,23,0.5)" }}>
          <div className="max-w-2xl mx-auto">
            <div className="p-6 rounded-2xl" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}>
              <h2 className="text-lg font-bold mb-2 text-center" style={{ color: "#f1f5f9" }}>InfoJobs y LinkedIn son del pasado</h2>
              <p className="text-center text-xs mb-5" style={{ color: "#64748b" }}>Llevan 20 años haciendo lo mismo. Nosotros lo hacemos diferente.</p>
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                <div className="text-center py-1.5 text-[10px] font-semibold rounded-lg" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>InfoJobs / LinkedIn</div>
                <div className="text-center py-1.5 text-[10px] font-semibold rounded-lg" style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>BuscayCurra con Guzzi</div>
              </div>
              <div className="space-y-2">
                {[
                  { ellos: "Tú buscas, filtras y envías a mano", nosotros: "Guzzi busca, filtra y envía por ti" },
                  { ellos: "300 CVs enviados. 3 respuestas.", nosotros: "CV adaptado a cada empresa" },
                  { ellos: "Ofertas caducadas y empresas fantasma", nosotros: "213.000+ ofertas actualizadas a diario" },
                  { ellos: "Pagan 29€/mes para saber que te ignoraron", nosotros: "Gratis para candidatos" },
                  { ellos: "ATS descarta tu CV sin leerlo", nosotros: "IA que supera los filtros ATS" },
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="p-2.5 rounded-lg leading-snug" style={{ background: "rgba(239,68,68,0.04)", color: "#94a3b8", border: "1px solid rgba(239,68,68,0.08)" }}>
                      <span style={{ color: "#ef4444" }}>✕ </span>{row.ellos}
                    </div>
                    <div className="p-2.5 rounded-lg leading-snug" style={{ background: "rgba(34,197,94,0.04)", color: "#94a3b8", border: "1px solid rgba(34,197,94,0.10)" }}>
                      <span style={{ color: "#22c55e" }}>✓ </span>{row.nosotros}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonios */}
        <section className="py-16 px-6" style={{ background: "rgba(15,17,23,0.4)", borderTop: "1px solid rgba(45,49,66,0.4)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Lo que dicen quienes ya encontraron trabajo</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {testimonios.map((t) => (
                <div key={t.nombre} className="card-game p-5">
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "#94a3b8" }}>
                    &ldquo;{t.texto}&rdquo;
                  </p>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>{t.nombre}</p>
                    <p className="text-[11px]" style={{ color: "#64748b" }}>{t.puesto} · {t.ciudad}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-6" style={{ borderTop: "1px solid rgba(45,49,66,0.4)" }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Preguntas frecuentes</h2>
            </div>
            <div className="space-y-3">
              {faq.map((item) => (
                <div key={item.q} className="card-game p-5">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "#f1f5f9" }}>{item.q}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Planes */}
        <section id="precios" className="py-20 px-6" style={{ background: "rgba(15,17,23,0.5)", borderTop: "1px solid rgba(45,49,66,0.4)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Sin letra pequeña</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Empieza gratis. Paga solo si quieres más candidaturas.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
              {planes.map((plan) => (
                <div key={plan.nombre} className="rounded-xl p-5 flex flex-col relative h-full"
                  style={{
                    background: plan.destacado ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
                    border: plan.destacado ? "1.5px solid rgba(34,197,94,0.30)" : "1px solid rgba(255,255,255,0.05)",
                  }}>
                  {plan.tag && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "#22c55e", color: "#fff" }}>{plan.tag}</span>
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                      style={{ color: plan.destacado ? "#22c55e" : "#64748b" }}>{plan.nombre}</div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-2xl font-extrabold" style={{ color: "#f1f5f9" }}>{plan.precio}€</span>
                      <span className="text-[11px]" style={{ color: "#64748b" }}>{plan.periodo}</span>
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>{plan.desc}</div>
                  </div>
                  <ul className="space-y-2 mb-5 flex-1">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                        <span className="mt-0.5 flex-shrink-0" style={{ color: plan.destacado ? "#22c55e" : "#64748b" }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/registro"
                    className="block text-center text-xs font-semibold py-2.5 rounded-lg transition hover:opacity-90"
                    style={plan.destacado
                      ? { background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }
                      : { border: "1px solid #2d3142", color: "#94a3b8" }
                    }>
                    {plan.cta}
                  </Link>
                  {plan.nota && <p className="mt-2 text-center text-[10px]" style={{ color: "#475569" }}>{plan.nota}</p>}
                </div>
              ))}
            </div>
            <p className="text-center mt-6 text-[11px]" style={{ color: "#475569" }}>Cancela en cualquier momento. Sin permanencia.</p>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-24 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.08) 0%, transparent 60%)" }} />
          <div className="max-w-xl mx-auto relative">
            <div className="flex justify-center mb-6">
              <LogoGusano size={64} animated />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3" style={{ color: "#f1f5f9" }}>Tu próximo trabajo ya existe</h2>
            <p className="text-sm mb-2" style={{ color: "#22c55e" }}>Guzzi lo encuentra mientras tú descansas</p>
            <p className="text-xs mb-8" style={{ color: "#64748b" }}>200 candidaturas personalizadas. El trabajo viene a ti, no al revés.</p>
            <Link href="/auth/registro"
              className="inline-block text-sm font-semibold py-3.5 px-12 rounded-xl transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
              Empezar gratis →
            </Link>
            <p className="mt-3 text-[11px]" style={{ color: "#475569" }}>Sin tarjeta de crédito. En 30 segundos.</p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-10 px-6" style={{ background: "#0a0c10", borderTop: "1px solid rgba(45,49,66,0.5)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <LogoGusano size={24} />
                <span className="font-bold text-sm" style={{ color: "#22c55e" }}>BuscayCurra</span>
              </div>
              <p className="text-[11px] leading-relaxed max-w-xs" style={{ color: "#475569" }}>
                El primer asistente de empleo con IA que trabaja por ti. La alternativa real a InfoJobs, LinkedIn e Indeed.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h4 className="text-xs font-semibold mb-3" style={{ color: "#94a3b8" }}>Producto</h4>
                <div className="space-y-2">
                  {[
                    { href: "/auth/registro", label: "Empezar gratis" },
                    { href: "#precios", label: "Precios" },
                  ].map(l => (
                    <Link key={l.href} href={l.href} className="block text-[11px] hover:opacity-80 transition" style={{ color: "#64748b" }}>{l.label}</Link>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-3" style={{ color: "#94a3b8" }}>Legal</h4>
                <div className="space-y-2">
                  {[
                    { href: "/aviso-legal", label: "Aviso Legal" },
                    { href: "/privacidad", label: "Privacidad" },
                    { href: "/terminos", label: "Términos" },
                    { href: "/cookies", label: "Cookies" },
                  ].map(l => (
                    <Link key={l.href} href={l.href} className="block text-[11px] hover:opacity-80 transition" style={{ color: "#64748b" }}>{l.label}</Link>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-3" style={{ color: "#94a3b8" }}>Cuenta</h4>
                <div className="space-y-2">
                  {[
                    { href: "/auth/login", label: "Entrar" },
                    { href: "/auth/registro", label: "Registro" },
                  ].map(l => (
                    <Link key={l.href} href={l.href} className="block text-[11px] hover:opacity-80 transition" style={{ color: "#64748b" }}>{l.label}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-6" style={{ borderTop: "1px solid rgba(45,49,66,0.3)" }}>
            <span className="text-[10px]" style={{ color: "#334155" }}>© 2025 BuscayCurra. Todos los derechos reservados.</span>
            <span className="text-[10px]" style={{ color: "#334155" }}>Hecho con 💚 en España</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
