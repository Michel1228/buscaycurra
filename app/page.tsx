/**
 * app/page.tsx — Landing BuscayCurra v3 — diseño premium
 */

import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";

const pasos = [
  { num: "01", titulo: "Sube tu CV", desc: "Guzzi lo analiza y lo mejora con IA para que destaque en cada oferta.", color: "#7ed56f" },
  { num: "02", titulo: "Dile qué buscas", desc: "Puesto y ciudad. Guzzi encuentra las mejores ofertas de toda España.", color: "#f0c040" },
  { num: "03", titulo: "Ves adónde va tu CV", desc: "Guzzi te muestra empresa por empresa antes de enviar. Tú apruebas.", color: "#e07850" },
  { num: "04", titulo: "Guzzi envía por ti", desc: "Carta personalizada para cada empresa. Automático. Mientras duermes.", color: "#a070d0" },
  { num: "05", titulo: "Consigues el trabajo", desc: "Empleo directo. Sin intermediarios. Tu salario completo, para ti.", color: "#ff6090" },
];

const comparativa = [
  { aspecto: "Tipo de contrato", ett: "Temporal, a través de ellos", nosotros: "Directo en la empresa", clave: true },
  { aspecto: "Tu salario", ett: "Ellos se quedan un margen siempre", nosotros: "100% tuyo. Negocias tú.", clave: true },
  { aspecto: "Control del envío", ett: "Donde ellos decidan", nosotros: "Ves y apruebas cada candidatura", clave: false },
  { aspecto: "Coste para ti", ett: "Gratis (lo pagan con tu margen)", nosotros: "9,99 €/mes. Sin letra pequeña.", clave: false },
  { aspecto: "Candidaturas/mes", ett: "Las que ellos gestionen", nosotros: "Hasta 200, con IA personalizada", clave: false },
];

const features = [
  { titulo: "IA que personaliza", desc: "Cada carta de presentación se escribe para esa empresa en concreto. No hay copy-paste." },
  { titulo: "Tú decides siempre", desc: "Guzzi nunca envía sin mostrarte adónde. Ves el nombre de la empresa antes de aprobar." },
  { titulo: "Estadísticas en tiempo real", desc: "Cuántas empresas tienen tu CV, cuántas lo abrieron, cuántas respondieron." },
  { titulo: "Privacidad total", desc: "Tus datos son tuyos. RGPD completo. Sin venderlos ni compartirlos." },
];

const planes = [
  {
    nombre: "Gratis", precio: "0", periodo: "", tag: null,
    desc: "Para probar sin riesgo",
    items: ["5 candidaturas al mes", "Mejora de CV con IA", "Búsqueda de ofertas en España", "Ves adónde va tu CV"],
    nota: "Sin tarjeta de crédito", destacado: false, cta: "Empezar gratis",
  },
  {
    nombre: "Básico", precio: "4,99", periodo: "/mes", tag: null,
    desc: "Para buscadores ocasionales",
    items: ["60 candidaturas al mes", "Carta personalizada por IA", "Búsqueda avanzada de ofertas", "Ves adónde va tu CV"],
    nota: null, destacado: false, cta: "Empezar",
  },
  {
    nombre: "Pro", precio: "9,99", periodo: "/mes", tag: "Más popular",
    desc: "Para encontrar trabajo de verdad",
    items: ["200 candidaturas al mes", "Carta avanzada por IA", "Estadísticas: quién abrió tu CV", "Email diario con nuevas ofertas", "Soporte prioritario"],
    nota: null, destacado: true, cta: "Empezar",
  },
  {
    nombre: "Empresa", precio: "49,99", periodo: "/mes", tag: null,
    desc: "Para RRHH y reclutadores",
    items: ["Candidaturas ilimitadas", "Múltiples perfiles", "Panel de gestión", "API e integraciones"],
    nota: null, destacado: false, cta: "Contactar",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0f1a0a 0%, #1a1a12 15%, #15200e 50%, #1a1a12 85%, #0f1a0a 100%)" }}>

      {/* Fondo ambiente */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 800px 600px at 15% 20%, rgba(126,213,111,0.07) 0%, transparent 70%),
                       radial-gradient(ellipse 600px 800px at 85% 70%, rgba(139,111,71,0.05) 0%, transparent 70%)`,
        }} />
      </div>

      {/* Header */}
      <header className="glass-warm sticky top-0 z-50" style={{ borderBottom: "1px solid rgba(126,213,111,0.1)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoGusano size={32} animated />
            <span className="font-bold text-base tracking-tight" style={{ color: "#7ed56f" }}>BuscayCurra</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="px-4 py-2 text-sm rounded-lg transition-colors" style={{ color: "#706a58" }}>
              Entrar
            </Link>
            <Link href="/auth/registro" className="btn-game text-sm !py-2 !px-5">
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">

        {/* ── HERO ── */}
        <section className="relative py-24 md:py-32 px-6">
          <div className="max-w-4xl mx-auto text-center">

            <div className="flex justify-center mb-10">
              <div className="animate-float" style={{ filter: "drop-shadow(0 16px 40px rgba(126,213,111,0.25))" }}>
                <LogoGusano size={100} animated />
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium" style={{ background: "rgba(126,213,111,0.08)", border: "1px solid rgba(126,213,111,0.2)", color: "#7ed56f" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                +2.400 personas ya buscando empleo con Guzzi
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-[1.05] mb-6 tracking-tight">
              <span style={{ color: "#f0ebe0" }}>200 candidaturas.</span>
              <br />
              <span style={{
                background: "linear-gradient(135deg, #7ed56f 0%, #f0c040 70%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Tú sin mover un dedo.
              </span>
            </h1>

            <p className="text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto" style={{ color: "#8a8472" }}>
              Guzzi busca ofertas, mejora tu CV y envía candidaturas con carta personalizada
              <span style={{ color: "#c8c3b4" }}> a empresas reales, una por una.</span>
            </p>

            {/* Stat row */}
            <div className="flex items-center justify-center gap-0 mb-10">
              <div className="px-8 py-3 text-center">
                <div className="text-3xl font-black tracking-tight" style={{ color: "#f0ebe0" }}>400 h</div>
                <div className="text-xs mt-0.5" style={{ color: "#504a3a" }}>a mano, sin Guzzi</div>
              </div>
              <div className="text-2xl font-black mx-2" style={{ color: "#7ed56f" }}>→</div>
              <div className="px-8 py-3 text-center">
                <div className="text-3xl font-black tracking-tight" style={{ color: "#7ed56f" }}>9,99 €</div>
                <div className="text-xs mt-0.5" style={{ color: "#504a3a" }}>al mes con Guzzi</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/registro" className="btn-game !py-3.5 !px-10 text-base font-semibold">
                Empezar gratis
              </Link>
              <Link href="#comparativa" className="btn-game-outline !py-3.5 !px-8 text-base">
                ¿Por qué no una ETT?
              </Link>
            </div>
            <p className="mt-4 text-xs" style={{ color: "#3d3c30" }}>Sin tarjeta de crédito. Cancela cuando quieras.</p>
          </div>
        </section>

        {/* ── COMPARATIVA ETT ── */}
        <section id="comparativa" className="py-24 px-6" style={{ background: "rgba(15,26,10,0.5)" }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 tracking-tight" style={{ color: "#f0ebe0" }}>
              No somos una ETT
            </h2>
            <p className="text-center mb-12 text-sm" style={{ color: "#504a3a" }}>
              Las ETTs son gratis para ti porque cobran a las empresas con tu salario. Nosotros no.
            </p>

            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(126,213,111,0.12)" }}>
              <div className="grid grid-cols-3 text-xs font-semibold uppercase tracking-widest"
                style={{ background: "rgba(126,213,111,0.05)", borderBottom: "1px solid rgba(126,213,111,0.1)" }}>
                <div className="px-5 py-3" style={{ color: "#3d3c30" }} />
                <div className="px-5 py-3 text-center" style={{ color: "#504a3a" }}>ETT</div>
                <div className="px-5 py-3 text-center" style={{ color: "#7ed56f" }}>BuscayCurra</div>
              </div>
              {comparativa.map((fila, i) => (
                <div key={fila.aspecto} className="grid grid-cols-3 text-sm"
                  style={{
                    borderBottom: i < comparativa.length - 1 ? "1px solid rgba(126,213,111,0.06)" : "none",
                    background: fila.clave ? "rgba(126,213,111,0.03)" : "transparent",
                  }}>
                  <div className="px-5 py-4 font-medium text-xs" style={{ color: "#8a8472" }}>{fila.aspecto}</div>
                  <div className="px-5 py-4 text-center text-xs" style={{ color: fila.clave ? "#6b3a3a" : "#504a3a" }}>{fila.ett}</div>
                  <div className="px-5 py-4 text-center text-xs font-semibold" style={{ color: fila.clave ? "#7ed56f" : "#b0a890" }}>{fila.nosotros}</div>
                </div>
              ))}
            </div>

            <p className="text-center mt-8 text-sm" style={{ color: "#504a3a" }}>
              Con una ETT, trabajas <em>para ellos</em>. Con BuscayCurra, encuentras trabajo{" "}
              <span style={{ color: "#c8c3b4" }}>para ti</span>.
            </p>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ── */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 tracking-tight" style={{ color: "#f0ebe0" }}>
              Cómo funciona
            </h2>
            <p className="text-center mb-16 text-sm" style={{ color: "#504a3a" }}>
              5 pasos. Guzzi hace el trabajo pesado.
            </p>

            <div className="space-y-3">
              {pasos.map((paso) => (
                <div key={paso.num} className="flex items-start gap-5 p-5 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black"
                    style={{ background: `${paso.color}14`, color: paso.color, border: `1px solid ${paso.color}30` }}>
                    {paso.num}
                  </div>
                  <div className="pt-1">
                    <h3 className="text-sm font-bold mb-1" style={{ color: paso.color }}>{paso.titulo}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#706a58" }}>{paso.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VALOR DEL TIEMPO ── */}
        <section className="py-24 px-6" style={{ background: "rgba(15,26,10,0.5)" }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-3 tracking-tight" style={{ color: "#f0ebe0" }}>
              ¿Cuánto vale tu tiempo?
            </h2>
            <p className="mb-12 text-sm" style={{ color: "#504a3a" }}>
              Enviar 200 candidaturas a mano, con carta personalizada, significa:
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-12">
              {[
                { numero: "400 h", label: "de búsqueda y redacción", color: "#e07850" },
                { numero: "3.400 €", label: "en tiempo al salario mínimo", color: "#f0c040" },
                { numero: "9,99 €", label: "lo que cuesta Guzzi al mes", color: "#7ed56f" },
              ].map((stat) => (
                <div key={stat.label} className="p-8 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="text-4xl font-black mb-2 tracking-tight" style={{ color: stat.color }}>{stat.numero}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "#504a3a" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <p className="text-base font-semibold mb-1" style={{ color: "#c8c3b4" }}>
              Una entrevista vale más que 12 meses de suscripción.
            </p>
            <p className="text-sm" style={{ color: "#3d3c30" }}>Y Guzzi te va a conseguir varias.</p>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16 tracking-tight" style={{ color: "#f0ebe0" }}>
              Lo que incluye Guzzi
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f.titulo} className="p-7 rounded-2xl flex items-start gap-5"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: "linear-gradient(180deg, #7ed56f, #5cb84830)" }} />
                  <div>
                    <h3 className="text-sm font-bold mb-2" style={{ color: "#f0ebe0" }}>{f.titulo}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#706a58" }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRECIOS ── */}
        <section className="py-24 px-6" style={{ background: "rgba(15,26,10,0.5)" }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3 tracking-tight" style={{ color: "#f0ebe0" }}>
              Sin letra pequeña
            </h2>
            <p className="text-center mb-16 text-sm" style={{ color: "#504a3a" }}>
              Empieza gratis. Paga solo si quieres más candidaturas.
            </p>

            <div className="grid md:grid-cols-4 gap-4 items-start">
              {planes.map((plan) => (
                <div key={plan.nombre} className="rounded-2xl p-6 flex flex-col relative"
                  style={{
                    background: plan.destacado ? "rgba(126,213,111,0.05)" : "rgba(255,255,255,0.02)",
                    border: plan.destacado ? "1px solid rgba(126,213,111,0.3)" : "1px solid rgba(255,255,255,0.05)",
                    boxShadow: plan.destacado ? "0 0 50px rgba(126,213,111,0.08)" : "none",
                  }}>
                  {plan.tag && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ background: "#7ed56f", color: "#0a0f07" }}>
                        {plan.tag}
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <div className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ color: plan.destacado ? "#7ed56f" : "#504a3a" }}>
                      {plan.nombre}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black tracking-tight" style={{ color: "#f0ebe0" }}>{plan.precio}€</span>
                      <span className="text-xs" style={{ color: "#504a3a" }}>{plan.periodo}</span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: "#3d3c30" }}>{plan.desc}</div>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "#8a8472" }}>
                        <span className="mt-0.5 flex-shrink-0 font-bold" style={{ color: plan.destacado ? "#7ed56f" : "#504a3a" }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link href="/auth/registro"
                    className={`text-center text-xs font-semibold py-2.5 rounded-xl transition-all ${plan.destacado ? "btn-game" : "btn-game-outline"}`}>
                    {plan.cta}
                  </Link>
                  {plan.nota && (
                    <p className="mt-2 text-center text-[10px]" style={{ color: "#3d3c30" }}>{plan.nota}</p>
                  )}
                </div>
              ))}
            </div>

            <p className="text-center mt-10 text-xs" style={{ color: "#3d3c30" }}>
              Cancela en cualquier momento. Sin permanencia. Sin sorpresas.
            </p>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="py-28 px-6 text-center">
          <div className="max-w-xl mx-auto">
            <div className="flex justify-center mb-8 animate-float">
              <div style={{ filter: "drop-shadow(0 8px 32px rgba(126,213,111,0.25))" }}>
                <LogoGusano size={72} animated />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight" style={{ color: "#f0ebe0" }}>
              Tu próximo trabajo ya existe.
            </h2>
            <p className="text-lg mb-2" style={{ color: "#7ed56f" }}>Guzzi lo encuentra.</p>
            <p className="mb-10 text-sm" style={{ color: "#504a3a" }}>
              Mientras tú sigues con tu vida, Guzzi envía candidaturas.<br />
              Sin ETTs. Sin intermediarios. Sin perder el tiempo.
            </p>
            <Link href="/auth/registro" className="btn-game !py-3.5 !px-12 text-base font-semibold">
              Empezar gratis
            </Link>
            <p className="mt-4 text-xs" style={{ color: "#3d3c30" }}>Sin tarjeta de crédito. En 30 segundos.</p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-10 px-6" style={{ background: "#0d0d08", borderTop: "1px solid rgba(126,213,111,0.07)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <LogoGusano size={22} />
              <span className="font-bold text-sm" style={{ color: "#7ed56f" }}>BuscayCurra</span>
            </div>
            <div className="flex flex-wrap gap-6 text-xs">
              {[{ href: "/auth/login", label: "Entrar" }, { href: "/auth/registro", label: "Registro" }, { href: "/precios", label: "Precios" }].map((l) => (
                <Link key={l.href} href={l.href} style={{ color: "#504a3a" }}>{l.label}</Link>
              ))}
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(126,213,111,0.06)" }}>
            <div className="flex flex-wrap gap-5 text-[11px]">
              {[{ href: "/aviso-legal", label: "Aviso Legal" }, { href: "/privacidad", label: "Privacidad" }, { href: "/terminos", label: "Términos" }, { href: "/cookies", label: "Cookies" }].map((l) => (
                <Link key={l.href} href={l.href} style={{ color: "#3d3c30" }}>{l.label}</Link>
              ))}
            </div>
            <span className="text-[10px]" style={{ color: "#2a2a20" }}>© 2025 BuscayCurra</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
