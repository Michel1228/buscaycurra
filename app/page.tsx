/**
 * app/page.tsx — Landing BuscayCurra v2
 * Más detalles, mejor conversión, diseño profesional
 */

import Link from "next/link";

const stats = [
  { numero: "400K+", label: "ofertas de empleo", color: "#22c55e" },
  { numero: "2.400+", label: "personas buscando", color: "#3b82f6" },
  { numero: "200", label: "candidaturas/mes", color: "#f59e0b" },
  { numero: "9,99€", label: "al mes, sin sorpresas", color: "#a855f7" },
];

const pasos = [
  { icon: "📎", titulo: "Sube tu CV", desc: "O cuéntale a Guzzi tu experiencia. Él lo estructura profesionalmente.", tiempo: "2 min" },
  { icon: "🎯", titulo: "Dile qué buscas", desc: "Puesto y ciudad. Guzzi escanea miles de ofertas en segundos.", tiempo: "1 min" },
  { icon: "✅", titulo: "Aprueba los envíos", desc: "Ves empresa por empresa antes de enviar. Tú tienes el control.", tiempo: "5 min" },
  { icon: "📧", titulo: "Guzzi envía por ti", desc: "Carta personalizada para cada empresa. Automático, mientras duermes.", tiempo: "0 min" },
  { icon: "🦋", titulo: "Consigue el trabajo", desc: "Empleo directo. Sin intermediarios. Tu salario completo.", tiempo: "¡Listo!" },
];

const problemas = [
  { icon: "😤", titulo: "Envías 50 CVs y nadie responde", desc: "Porque tu CV no destaca y las cartas son genéricas." },
  { icon: "⏰", titulo: "400 horas buscando a mano", desc: "Buscar ofertas, rellenar formularios, redactar cartas... una y otra vez." },
  { icon: "💸", titulo: "Las ETTs se quedan tu margen", desc: "Trabajas para ellos, no para ti. Tu salario no es 100% tuyo." },
  { icon: "😰", titulo: "No sabes a dónde va tu CV", desc: "¿Lo abrieron? ¿Lo leyeron? ¿Pasó algo? Silencio total." },
];

const soluciones = [
  { icon: "🤖", titulo: "IA que mejora tu CV", desc: "Guzzi analiza tu experiencia y la presenta de forma que las empresas no puedan ignorarla." },
  { icon: "⚡", titulo: "200 candidaturas en minutos", desc: "Lo que te llevaría 400 horas a mano, Guzzi lo hace mientras tomas un café." },
  { icon: "🎯", titulo: "Cada carta es personalizada", desc: "No hay copy-paste. Cada empresa recibe una carta escrita para ella, con sus valores y necesidades." },
  { icon: "📊", titulo: "Sabes qué pasa con tu CV", desc: "Estadísticas en tiempo real: cuántos lo abrieron, cuántos respondieron, dónde estás en el proceso." },
];

const comparativa = [
  { aspecto: "Tipo de contrato", ett: "Temporal, a través de ellos", nosotros: "Directo en la empresa", clave: true },
  { aspecto: "Tu salario", ett: "Ellos se quedan un margen", nosotros: "100% tuyo. Negocias tú.", clave: true },
  { aspecto: "Control del envío", ett: "Donde ellos decidan", nosotros: "Ves y apruebas cada candidatura", clave: false },
  { aspecto: "Carta de presentación", ett: "Genérica o ninguna", nosotros: "Personalizada con IA para cada empresa", clave: false },
  { aspecto: "Seguimiento", ett: "Sin información", nosotros: "Estadísticas de apertura y respuesta", clave: false },
  { aspecto: "Coste para ti", ett: "Gratis (lo pagan con tu margen)", nosotros: "9,99 €/mes. Sin letra pequeña.", clave: false },
];

const testimonios = [
  { nombre: "María G.", puesto: "Camarera en Madrid", texto: "Envié 200 candidaturas en una semana. A los 10 días tenía 3 entrevistas. Ahora trabajo en un hotel de 4 estrellas.", tiempo: "2 semanas" },
  { nombre: "Carlos R.", puesto: "Operario en Barcelona", texto: "No sabía ni por dónde empezar. Guzzi me hizo el CV desde cero y encontró ofertas que yo nunca habría visto.", tiempo: "3 semanas" },
  { nombre: "Ana L.", puesto: "Recepcionista en Valencia", texto: "La carta personalizada es la clave. Las empresas notan que no es un copy-paste. Me llamaron 5 empresas.", tiempo: "1 semana" },
];

const features = [
  { titulo: "IA que personaliza cada carta", desc: "No hay dos cartas iguales. Cada una se escribe para esa empresa en concreto, mencionando por qué encajas." },
  { titulo: "Tú decides siempre", desc: "Guzzi nunca envía sin mostrarte adónde. Ves el nombre de la empresa, el puesto y el salario antes de aprobar." },
  { titulo: "Estadísticas en tiempo real", desc: "Cuántas empresas tienen tu CV, cuántas lo abrieron, cuántas respondieron. Todo al instante." },
  { titulo: "Mejora de CV con IA", desc: "Sube tu CV y Guzzi lo reestructura profesionalmente. Destaca tus fortalezas de forma que las empresas no puedan ignorarte." },
  { titulo: "Búsqueda inteligente", desc: "No busques tú. Guzzi escanea miles de ofertas y te muestra solo las que encajan contigo." },
  { titulo: "Privacidad total", desc: "Tus datos son tuyos. RGPD completo. Sin venderlos ni compartirlos con terceros." },
];

const planes = [
  { nombre: "Gratis", precio: "0", periodo: "", tag: null, desc: "Para probar sin riesgo",
    items: ["5 candidaturas al mes", "Mejora de CV con IA", "Búsqueda de ofertas", "Ves adónde va tu CV"],
    nota: "Sin tarjeta de crédito", destacado: false, cta: "Empezar gratis" },
  { nombre: "Básico", precio: "4,99", periodo: "/mes", tag: null, desc: "Para buscadores ocasionales",
    items: ["60 candidaturas al mes", "Carta personalizada por IA", "Búsqueda avanzada", "Ves adónde va tu CV"],
    nota: null, destacado: false, cta: "Empezar" },
  { nombre: "Pro", precio: "9,99", periodo: "/mes", tag: "Más popular", desc: "Para encontrar trabajo de verdad",
    items: ["200 candidaturas al mes", "Carta avanzada por IA", "Estadísticas de apertura", "Email diario con ofertas", "Soporte prioritario"],
    nota: null, destacado: true, cta: "Empezar" },
  { nombre: "Empresa", precio: "49,99", periodo: "/mes", tag: null, desc: "Para RRHH y reclutadores",
    items: ["Candidaturas ilimitadas", "Múltiples perfiles", "Panel de gestión", "API e integraciones"],
    nota: null, destacado: false, cta: "Contactar" },
];

const faqs = [
  { pregunta: "¿Cómo funciona exactamente?", respuesta: "Subes tu CV o cuentas tu experiencia a Guzzi. Le dices qué trabajo buscas y en qué ciudad. Guzzi encuentra ofertas, mejora tu CV y escribe una carta personalizada para cada empresa. Tú apruebas los envíos y Guzzi los envía automáticamente." },
  { pregunta: "¿Las empresas saben que uso Guzzi?", respuesta: "No. Las candidaturas se envían desde tu email personal. La empresa ve tu nombre, tu CV y tu carta. Guzzi es invisible." },
  { pregunta: "¿Puedo cancelar cuando quiera?", respuesta: "Sí. Sin permanencia, sin preguntas. Cancelas y se acabó. Puedes volver cuando quieras." },
  { pregunta: "¿Qué pasa si no encuentro trabajo?", respuesta: "Con 200 candidaturas personalizadas al mes, las probabilidades están de tu lado. Pero si no funciona, cancelas. Sin compromiso." },
  { pregunta: "¿Es legal?", respuesta: "Totalmente. Eres tú quien envía las candidaturas. Guzzi solo te ayuda a hacerlo más rápido y mejor." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>

      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: "rgba(15,17,23,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(45,49,66,0.5)" }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🐛</span>
            <span className="font-bold text-sm tracking-tight" style={{ color: "#22c55e" }}>BuscayCurra</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium transition hover:opacity-80 hidden sm:block" style={{ color: "#94a3b8" }}>Entrar</Link>
            <Link href="/auth/registro" className="text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>Empezar gratis</Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 px-6 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 60%)" }} />
          
          <div className="max-w-5xl mx-auto relative">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: Text */}
              <div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium w-fit mb-6"
                  style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", color: "#22c55e" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse" />
                  +2.400 personas ya buscando empleo con Guzzi
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.1] mb-5 tracking-tight" style={{ color: "#f1f5f9" }}>
                  Encuentra trabajo
                  <br />
                  <span style={{ color: "#22c55e" }}>sin perder 400 horas</span>
                </h1>

                <p className="text-base mb-6 leading-relaxed" style={{ color: "#94a3b8" }}>
                  Guzzi busca ofertas, mejora tu CV y envía <strong style={{ color: "#cbd5e1" }}>200 candidaturas personalizadas</strong> al mes.
                  Mientras tú vives tu vida.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Link href="/auth/registro" className="text-center text-sm font-semibold py-3 px-8 rounded-xl transition hover:opacity-90" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                    Empezar gratis →
                  </Link>
                  <Link href="#como-funciona" className="text-center text-sm font-medium py-3 px-6 rounded-xl transition hover:bg-[#2a2d35]" style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
                    Ver cómo funciona
                  </Link>
                </div>

                <p className="text-[11px]" style={{ color: "#475569" }}>Sin tarjeta de crédito. Cancela cuando quieras.</p>
              </div>

              {/* Right: Visual */}
              <div className="relative">
                <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(22,163,74,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
                  {/* Mock chat */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: "rgba(34,197,94,0.15)" }}>🐛</div>
                    <div className="flex-1">
                      <div className="rounded-xl px-4 py-2.5 text-xs" style={{ background: "#1a1d24", color: "#94a3b8" }}>
                        ¡Hola! Soy Guzzi. ¿Qué trabajo buscas?
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                    <div className="flex-1">
                      <div className="rounded-xl px-4 py-2.5 text-xs text-right" style={{ background: "#22c55e", color: "#fff" }}>
                        Busco trabajo de camarero en Madrid
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: "rgba(34,197,94,0.15)" }}>🐛</div>
                    <div className="flex-1">
                      <div className="rounded-xl px-4 py-2.5 text-xs" style={{ background: "#1a1d24", color: "#94a3b8" }}>
                        🔍 Encontré 47 ofertas. ¿Envío tu CV a todas?
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                    <div className="flex-1">
                      <div className="rounded-xl px-4 py-2.5 text-xs text-right" style={{ background: "#22c55e", color: "#fff" }}>
                        ¡Sí, envíalas! 🚀
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: "rgba(34,197,94,0.15)" }}>🐛</div>
                    <div className="flex-1">
                      <div className="rounded-xl px-4 py-2.5 text-xs" style={{ background: "#1a1d24", color: "#94a3b8" }}>
                        ✅ ¡Listo! 47 candidaturas enviadas. Te aviso cuando respondan 🦋
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="py-8 px-6" style={{ background: "rgba(22,163,74,0.03)", borderTop: "1px solid rgba(34,197,94,0.08)", borderBottom: "1px solid rgba(34,197,94,0.08)" }}>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold" style={{ color: stat.color }}>{stat.numero}</div>
                <div className="text-[11px] mt-1" style={{ color: "#64748b" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Problem / Solution */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight" style={{ color: "#f1f5f9" }}>Buscar trabajo es un trabajo</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Y nadie te paga por ello. Hasta ahora.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Problems */}
              <div>
                <h3 className="text-sm font-semibold mb-4 px-4 py-2 rounded-lg w-fit" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>❌ Sin Guzzi</h3>
                <div className="space-y-3">
                  {problemas.map((p) => (
                    <div key={p.titulo} className="p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.08)" }}>
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{p.icon}</span>
                        <div>
                          <h4 className="text-xs font-semibold mb-1" style={{ color: "#f1f5f9" }}>{p.titulo}</h4>
                          <p className="text-[11px]" style={{ color: "#64748b" }}>{p.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solutions */}
              <div>
                <h3 className="text-sm font-semibold mb-4 px-4 py-2 rounded-lg w-fit" style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>✅ Con Guzzi</h3>
                <div className="space-y-3">
                  {soluciones.map((s) => (
                    <div key={s.titulo} className="p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.03)", border: "1px solid rgba(34,197,94,0.08)" }}>
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{s.icon}</span>
                        <div>
                          <h4 className="text-xs font-semibold mb-1" style={{ color: "#f1f5f9" }}>{s.titulo}</h4>
                          <p className="text-[11px]" style={{ color: "#64748b" }}>{s.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="py-20 px-6" style={{ background: "rgba(15,17,23,0.5)" }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight" style={{ color: "#f1f5f9" }}>5 pasos. 8 minutos. 200 candidaturas.</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Guzzi hace el trabajo pesado. Tú solo apruebas.</p>
            </div>

            <div className="space-y-4">
              {pasos.map((paso, i) => (
                <div key={paso.titulo} className="flex items-start gap-4 p-5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    {paso.icon}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold" style={{ color: "#f1f5f9" }}>{paso.titulo}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>{paso.tiempo}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{paso.desc}</p>
                  </div>
                  <div className="hidden md:flex items-center">
                    <span className="text-lg font-bold" style={{ color: "#22c55e" }}>{i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparativa ETT */}
        <section id="comparativa" className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight" style={{ color: "#f1f5f9" }}>No somos una ETT</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>
                Las ETTs son "gratis" porque cobran a las empresas con tu salario.
                <br />Nosotros cobramos 9,99€ y tú ganas el 100%.
              </p>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #2d3142" }}>
              <div className="grid grid-cols-3 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: "rgba(34,197,94,0.05)", borderBottom: "1px solid #2d3142" }}>
                <div className="px-4 py-3" />
                <div className="px-4 py-3 text-center" style={{ color: "#64748b" }}>ETT</div>
                <div className="px-4 py-3 text-center" style={{ color: "#22c55e" }}>BuscayCurra</div>
              </div>
              {comparativa.map((fila, i) => (
                <div key={fila.aspecto} className="grid grid-cols-3 text-xs"
                  style={{ borderBottom: i < comparativa.length - 1 ? "1px solid rgba(45,49,66,0.5)" : "none", background: fila.clave ? "rgba(34,197,94,0.02)" : "transparent" }}>
                  <div className="px-4 py-3.5 font-medium text-[11px]" style={{ color: "#94a3b8" }}>{fila.aspecto}</div>
                  <div className="px-4 py-3.5 text-center text-[11px]" style={{ color: fila.clave ? "#ef4444" : "#64748b" }}>{fila.ett}</div>
                  <div className="px-4 py-3.5 text-center text-[11px] font-medium" style={{ color: fila.clave ? "#22c55e" : "#94a3b8" }}>{fila.nosotros}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl text-center" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.1)" }}>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                <strong style={{ color: "#22c55e" }}>Ejemplo real:</strong> Con un salario de 1.500€/mes, una ETT se queda ~300€.
                <br />En un año, pierdes <strong style={{ color: "#f59e0b" }}>3.600€</strong>. Con BuscayCurra pagas <strong style={{ color: "#22c55e" }}>119,88€</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Testimonios */}
        <section className="py-20 px-6" style={{ background: "rgba(15,17,23,0.5)" }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight" style={{ color: "#f1f5f9" }}>Historias reales</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Personas que encontraron trabajo con Guzzi</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {testimonios.map((t) => (
                <div key={t.nombre} className="p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                      {t.nombre[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>{t.nombre}</p>
                      <p className="text-[10px]" style={{ color: "#64748b" }}>{t.puesto}</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: "#94a3b8" }}>"{t.texto}"</p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                      🕐 {t.tiempo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight" style={{ color: "#f1f5f9" }}>Todo lo que incluye Guzzi</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Herramientas diseñadas para que encuentres trabajo rápido</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f) => (
                <div key={f.titulo} className="p-5 rounded-xl h-full"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-8 h-1 rounded-full mb-4" style={{ background: "linear-gradient(90deg, #22c55e, #16a34a30)" }} />
                  <h3 className="text-xs font-bold mb-2" style={{ color: "#f1f5f9" }}>{f.titulo}</h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: "#64748b" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Precios */}
        <section className="py-20 px-6" style={{ background: "rgba(15,17,23,0.5)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight" style={{ color: "#f1f5f9" }}>Sin letra pequeña</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Empieza gratis. Paga solo si quieres más candidaturas.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-3 items-start">
              {planes.map((plan) => (
                <div key={plan.nombre} className="rounded-xl p-5 flex flex-col relative h-full"
                  style={{
                    background: plan.destacado ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.02)",
                    border: plan.destacado ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(255,255,255,0.05)",
                  }}>
                  {plan.tag && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "#22c55e", color: "#fff" }}>{plan.tag}</span>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                      style={{ color: plan.destacado ? "#22c55e" : "#64748b" }}>{plan.nombre}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold tracking-tight" style={{ color: "#f1f5f9" }}>{plan.precio}€</span>
                      <span className="text-[11px]" style={{ color: "#64748b" }}>{plan.periodo}</span>
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>{plan.desc}</div>
                  </div>

                  <ul className="space-y-2 mb-5 flex-1">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                        <span className="mt-0.5 flex-shrink-0 font-bold" style={{ color: plan.destacado ? "#22c55e" : "#64748b" }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link href="/auth/registro"
                    className={`text-center text-xs font-semibold py-2.5 rounded-lg transition-all ${plan.destacado ? "text-white" : ""}`}
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

            <p className="text-center mt-8 text-[11px]" style={{ color: "#475569" }}>Cancela en cualquier momento. Sin permanencia. Sin sorpresas.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight" style={{ color: "#f1f5f9" }}>Preguntas frecuentes</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Todo lo que necesitas saber</p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.pregunta} className="p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <h3 className="text-xs font-semibold mb-2" style={{ color: "#f1f5f9" }}>{faq.pregunta}</h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: "#64748b" }}>{faq.respuesta}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-24 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(34,197,94,0.15) 0%, transparent 70%)" }} />
          <div className="max-w-xl mx-auto relative">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.08))", border: "2px solid rgba(34,197,94,0.25)" }}>
                🐛
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight" style={{ color: "#f1f5f9" }}>Tu próximo trabajo ya existe</h2>
            <p className="text-base mb-2" style={{ color: "#22c55e" }}>Guzzi lo encuentra mientras tú descansas</p>
            <p className="mb-8 text-xs" style={{ color: "#64748b" }}>
              200 candidaturas personalizadas. Empleo directo. Sin intermediarios.
            </p>
            <Link href="/auth/registro" className="inline-block text-sm font-semibold py-3 px-10 rounded-xl transition hover:opacity-90" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
              Empezar gratis →
            </Link>
            <p className="mt-3 text-[11px]" style={{ color: "#475569" }}>Sin tarjeta de crédito. En 30 segundos.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 px-6" style={{ background: "#0a0c10", borderTop: "1px solid rgba(45,49,66,0.5)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🐛</span>
                <span className="font-bold text-sm" style={{ color: "#22c55e" }}>BuscayCurra</span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "#475569" }}>
                El primer asistente de empleo con IA que envía candidaturas por ti.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-3" style={{ color: "#94a3b8" }}>Producto</h4>
              <div className="space-y-2">
                {[{ href: "/auth/registro", label: "Empezar gratis" }, { href: "/precios", label: "Precios" }, { href: "#como-funciona", label: "Cómo funciona" }].map((l) => (
                  <Link key={l.href} href={l.href} className="block text-[11px] transition hover:opacity-80" style={{ color: "#64748b" }}>{l.label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-3" style={{ color: "#94a3b8" }}>Legal</h4>
              <div className="space-y-2">
                {[{ href: "/aviso-legal", label: "Aviso Legal" }, { href: "/privacidad", label: "Privacidad" }, { href: "/terminos", label: "Términos" }, { href: "/cookies", label: "Cookies" }].map((l) => (
                  <Link key={l.href} href={l.href} className="block text-[11px] transition hover:opacity-80" style={{ color: "#64748b" }}>{l.label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-3" style={{ color: "#94a3b8" }}>Cuenta</h4>
              <div className="space-y-2">
                {[{ href: "/auth/login", label: "Entrar" }, { href: "/auth/registro", label: "Registro" }].map((l) => (
                  <Link key={l.href} href={l.href} className="block text-[11px] transition hover:opacity-80" style={{ color: "#64748b" }}>{l.label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderColor: "rgba(45,49,66,0.3)" }}>
            <span className="text-[10px]" style={{ color: "#334155" }}>© 2025 BuscayCurra. Todos los derechos reservados.</span>
            <span className="text-[10px]" style={{ color: "#334155" }}>Hecho con 💚 en España</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
