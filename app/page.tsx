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

            {/* Guzzi mascot */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 60px rgba(34,197,94,0.25)", background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)" }} />
                <LogoGusano size={90} animated />
              </div>
            </div>

            {/* Badge */}
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
              IA que mejora tu CV, encuentra las mejores ofertas y envía{" "}
              <strong style={{ color: "#cbd5e1" }}>200 candidaturas personalizadas</strong> al mes.
              Sin ETTs, sin comisiones, sin perder el tiempo.
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

            {/* Stats */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: "#22c55e" }}>2.400+</div>
                <div className="text-[11px]" style={{ color: "#64748b" }}>personas en activo</div>
              </div>
              <div className="hidden sm:block w-px h-8" style={{ background: "#2d3142" }} />
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: "#22c55e" }}>400.000+</div>
                <div className="text-[11px]" style={{ color: "#64748b" }}>ofertas en España</div>
              </div>
              <div className="hidden sm:block w-px h-8" style={{ background: "#2d3142" }} />
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: "#f59e0b" }}>~3.200€</div>
                <div className="text-[11px]" style={{ color: "#64748b" }}>que te ahorra vs ETT/año</div>
              </div>
            </div>
          </div>
        </section>

        {/* Ofertas reales */}
        <section className="py-16 px-6" style={{ background: "rgba(15,17,23,0.6)", borderTop: "1px solid rgba(45,49,66,0.4)", borderBottom: "1px solid rgba(45,49,66,0.4)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
                400.000+ ofertas reales en España ahora mismo
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

        {/* ETT vs BuscayCurra */}
        <section className="py-16 px-6" style={{ background: "rgba(15,17,23,0.5)" }}>
          <div className="max-w-2xl mx-auto">
            <div className="p-6 rounded-2xl" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}>
              <h2 className="text-lg font-bold mb-4 text-center" style={{ color: "#f1f5f9" }}>¿Por qué no una ETT?</h2>
              <div className="grid grid-cols-2 gap-4 text-center mb-4">
                <div className="p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#ef4444" }}>ETT</p>
                  <p className="text-2xl font-extrabold" style={{ color: "#ef4444" }}>~3.200€</p>
                  <p className="text-[10px] mt-1" style={{ color: "#64748b" }}>que se quedan de tu salario/año</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#22c55e" }}>BuscayCurra</p>
                  <p className="text-2xl font-extrabold" style={{ color: "#22c55e" }}>119,88€</p>
                  <p className="text-[10px] mt-1" style={{ color: "#64748b" }}>al año. Tu salario es 100% tuyo.</p>
                </div>
              </div>
              <p className="text-center text-xs" style={{ color: "#64748b" }}>
                Contrato directo con la empresa. Sin intermediarios. Tú negocias tu salario.
              </p>
            </div>
          </div>
        </section>

        {/* Planes */}
        <section id="precios" className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Sin letra pequeña</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Empieza gratis. Paga solo si quieres más candidaturas.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-4 items-start">
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
            <p className="text-xs mb-8" style={{ color: "#64748b" }}>200 candidaturas personalizadas. Empleo directo. Sin intermediarios.</p>
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
                El primer asistente de empleo con IA que envía candidaturas por ti. Empleo directo, sin ETTs.
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
