import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";

const VENTAJAS = [
  {
    icon: "🎯",
    titulo: "Candidatos activos, no pasivos",
    desc: "Cada perfil pertenece a alguien que está buscando trabajo ahora mismo. No bases de datos de años atrás.",
  },
  {
    icon: "🤖",
    titulo: "CVs mejorados con IA",
    desc: "Guzzi optimiza cada CV antes de que llegue a tu bandeja. Recibes candidatos con el perfil bien estructurado.",
  },
  {
    icon: "📍",
    titulo: "Filtra por ciudad y perfil",
    desc: "Busca exactamente lo que necesitas: cocinero en Madrid, electricista en Bilbao, programador remoto.",
  },
  {
    icon: "💸",
    titulo: "Sin pagar por oferta",
    desc: "InfoJobs cobra hasta 369€ por publicar una oferta. Aquí accedes a candidatos ilimitados por 49,99€/mes.",
  },
  {
    icon: "⚡",
    titulo: "Contacto directo",
    desc: "Con Plan Empresa ves nombre, email y teléfono de cada candidato. Sin intermediarios, sin plataforma de mensajería.",
  },
  {
    icon: "🔄",
    titulo: "Base actualizada diariamente",
    desc: "Nuevos candidatos cada día. Recibes alertas cuando alguien de tu sector y ciudad carga su CV.",
  },
];

const COMPARATIVA = [
  { aspecto: "Publicar oferta", infojobs: "369€ por oferta", nosotros: "Gratis (incluido)" },
  { aspecto: "Acceso a candidatos", infojobs: "Solo los que aplican", nosotros: "Todo el pool activo" },
  { aspecto: "Contacto directo", infojobs: "Solo si aplican ellos", nosotros: "Email y teléfono directo" },
  { aspecto: "CVs optimizados IA", infojobs: "No", nosotros: "Sí, todos" },
  { aspecto: "Coste mensual", infojobs: "300-800€/mes (suscripción BD)", nosotros: "49,99€/mes" },
];

export default function EmpresasLandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>

      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: "rgba(15,17,23,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(45,49,66,0.4)" }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoGusano size={26} />
            <span className="font-bold text-sm" style={{ color: "#22c55e" }}>BuscayCurra</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>Para empresas</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/empresas/candidatos" className="text-sm font-medium transition hover:opacity-80 hidden sm:block" style={{ color: "#94a3b8" }}>
              Ver candidatos
            </Link>
            <Link href="/precios" className="text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
              Contratar acceso
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* Hero */}
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(34,197,94,0.08) 0%, transparent 55%)" }} />
          <div className="max-w-4xl mx-auto text-center relative">

            <div className="flex justify-center mb-5">
              <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", color: "#22c55e" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse" />
                2.400+ candidatos activos en España
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5 tracking-tight" style={{ color: "#f1f5f9" }}>
              El talento que necesitas.<br />
              <span style={{ color: "#22c55e" }}>Sin depender de InfoJobs.</span>
            </h1>

            <p className="text-base md:text-lg mb-8 leading-relaxed max-w-2xl mx-auto" style={{ color: "#94a3b8" }}>
              Accede directamente a nuestra bolsa de candidatos activos en España.
              Todos con CV optimizado por IA, buscando trabajo <strong style={{ color: "#cbd5e1" }}>ahora mismo</strong>.
              Filtra por sector, ciudad y perfil. Contacta directo, sin intermediarios.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              <Link href="/empresas/candidatos"
                className="text-center text-sm font-semibold py-3.5 px-10 rounded-xl transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                Ver candidatos disponibles →
              </Link>
              <Link href="/empresas/publicar"
                className="text-center text-sm font-medium py-3.5 px-8 rounded-xl transition hover:bg-[#1e212b]"
                style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
                Publicar oferta gratis
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              {[
                { num: "2.400+", label: "Candidatos activos", color: "#22c55e" },
                { num: "49,99€", label: "Al mes, todo incluido", color: "#f59e0b" },
                { num: "0€", label: "Por publicar ofertas", color: "#a855f7" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.num}</div>
                  <div className="text-[11px]" style={{ color: "#64748b" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparativa vs InfoJobs para empresas */}
        <section className="py-12 px-6" style={{ background: "rgba(15,17,23,0.5)", borderTop: "1px solid rgba(45,49,66,0.4)" }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-center mb-8" style={{ color: "#f1f5f9" }}>
              InfoJobs para empresas cobra 369€ por oferta. Nosotros no.
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(45,49,66,0.5)" }}>
              <div className="grid grid-cols-3 py-3 px-4 text-[11px] font-semibold uppercase tracking-wider"
                style={{ background: "#1e212b", color: "#64748b" }}>
                <span></span>
                <span className="text-center" style={{ color: "#ef4444" }}>InfoJobs / LinkedIn</span>
                <span className="text-center" style={{ color: "#22c55e" }}>BuscayCurra</span>
              </div>
              {COMPARATIVA.map((row, i) => (
                <div key={i} className="grid grid-cols-3 py-3 px-4 text-[11px] items-center"
                  style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent", borderTop: "1px solid rgba(45,49,66,0.3)" }}>
                  <span style={{ color: "#94a3b8" }}>{row.aspecto}</span>
                  <span className="text-center" style={{ color: "#64748b" }}>{row.infojobs}</span>
                  <span className="text-center font-semibold" style={{ color: "#22c55e" }}>{row.nosotros}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ventajas */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Por qué las empresas eligen BuscayCurra</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Contratar no debería ser caro ni lento.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {VENTAJAS.map(v => (
                <div key={v.titulo} className="card-game p-6">
                  <div className="text-3xl mb-4">{v.icon}</div>
                  <h3 className="text-sm font-bold mb-2" style={{ color: "#f1f5f9" }}>{v.titulo}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Para ETTs */}
        <section className="py-12 px-6" style={{ background: "rgba(245,158,11,0.04)", borderTop: "1px solid rgba(245,158,11,0.12)", borderBottom: "1px solid rgba(245,158,11,0.12)" }}>
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-2" style={{ color: "#f59e0b" }}>¿Eres una ETT o consultora de RRHH?</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                Accede a toda nuestra bolsa de candidatos activos. Filtra por sector, ciudad y experiencia.
                Exporta contactos directo. Sin límites en el Plan Empresa —{" "}
                <strong style={{ color: "#f1f5f9" }}>49,99€/mes por acceso ilimitado a toda la base.</strong>
              </p>
            </div>
            <Link href="/precios"
              className="flex-shrink-0 text-sm font-semibold px-6 py-3 rounded-xl transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff" }}>
              Ver plan Empresa →
            </Link>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-24 px-6 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3" style={{ color: "#f1f5f9" }}>
              Empieza a contratar diferente
            </h2>
            <p className="text-sm mb-2" style={{ color: "#22c55e" }}>Sin ofertas fantasma. Sin candidatos desaparecidos.</p>
            <p className="text-xs mb-8" style={{ color: "#64748b" }}>Candidatos reales buscando trabajo hoy en España.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/empresas/candidatos"
                className="text-sm font-semibold py-3.5 px-10 rounded-xl transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                Ver candidatos gratis →
              </Link>
              <Link href="/empresas/publicar"
                className="text-sm font-medium py-3.5 px-8 rounded-xl transition hover:bg-[#1e212b]"
                style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
                Publicar oferta
              </Link>
            </div>
          </div>
        </section>

      </main>

      <footer className="py-6 px-6 text-center" style={{ background: "#0a0c10", borderTop: "1px solid rgba(45,49,66,0.5)" }}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-[11px]" style={{ color: "#334155" }}>
          <Link href="/" className="hover:opacity-80">← Volver a BuscayCurra</Link>
          <span className="hidden sm:block">·</span>
          <Link href="/empresas/publicar" className="hover:opacity-80">Publicar oferta gratis</Link>
          <span className="hidden sm:block">·</span>
          <Link href="/precios" className="hover:opacity-80">Planes y precios</Link>
        </div>
      </footer>
    </div>
  );
}
