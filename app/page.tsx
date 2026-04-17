/**
 * app/page.tsx — Landing page principal de BuscayCurra
 *
 * Página de inicio pública con:
 *   - Hero: título, subtítulo, gusano animado y botones de registro/login
 *   - Features: 3 tarjetas con las funcionalidades principales
 *   - Precios: 3 columnas (Free, Pro, Empresa)
 *   - Footer: logo y enlaces
 *
 * Paleta "La Metamorfosis": verde neón #00ff88 sobre negro #0a0a0a.
 */

import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";

// ─── Datos de las funcionalidades ────────────────────────────────────────────
const features = [
  {
    emoji: "🔍",
    titulo: "Buscar Ofertas",
    descripcion: "Encuentra miles de ofertas en toda España actualizadas en tiempo real.",
  },
  {
    emoji: "📄",
    titulo: "Mejorar CV",
    descripcion: "IA que adapta automáticamente tu CV a cada oferta de trabajo.",
  },
  {
    emoji: "📧",
    titulo: "Envío Automático",
    descripcion: "Envía tu CV a empresas automáticamente sin esfuerzo.",
  },
];

// ─── Datos de los planes de precio ───────────────────────────────────────────
const planes = [
  {
    nombre: "Free",
    precio: "0€",
    periodo: "",
    descripcion: "Para empezar",
    caracteristicas: ["2 CVs / día", "Buscador básico", "Soporte por email"],
    destacado: false,
  },
  {
    nombre: "Pro",
    precio: "9,99€",
    periodo: "/mes",
    descripcion: "Para profesionales",
    caracteristicas: ["10 CVs / día", "IA avanzada", "Estadísticas", "Soporte prioritario"],
    destacado: true,
  },
  {
    nombre: "Empresa",
    precio: "49,99€",
    periodo: "/mes",
    descripcion: "Sin límites",
    caracteristicas: ["Envíos ilimitados", "Todo incluido", "Múltiples usuarios", "API de acceso"],
    destacado: false,
  },
];

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a", color: "#f0f0f0" }}>

      {/* ── Cabecera pública ──────────────────────────────────────────── */}
      <header
        className="border-b sticky top-0 z-50"
        style={{
          backgroundColor: "rgba(10,10,10,0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: "#00ff8820",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <LogoGusano size={36} animated />
            <span className="font-bold text-lg tracking-wide" style={{ color: "#00ff88" }}>
              BuscayCurra
            </span>
          </div>

          {/* Botones de acceso */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-medium transition"
              style={{ color: "#a0a0a0" }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth/registro"
              className="px-4 py-2 text-sm font-semibold rounded-lg transition"
              style={{
                backgroundColor: "#00ff88",
                color: "#0a0a0a",
              }}
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section
          className="py-28 px-4 text-center relative overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 50% 40%, #0d1f0d 0%, #0a0a0a 70%)",
          }}
        >
          {/* Gusano decorativo animado */}
          <div className="flex justify-center mb-10 opacity-80">
            <LogoGusano size={90} animated />
          </div>

          <div className="max-w-3xl mx-auto relative z-10">
            <h1
              className="text-5xl font-extrabold leading-tight mb-6"
              style={{
                color: "#f0f0f0",
              }}
            >
              Encuentra trabajo más rápido{" "}
              <span
                style={{
                  color: "#00ff88",
                  textShadow: "0 0 20px #00ff88, 0 0 40px #4ade80",
                }}
              >
                con IA
              </span>{" "}
              🚀
            </h1>
            <p className="text-xl mb-10 leading-relaxed" style={{ color: "#a0a0a0" }}>
              Mejora tu CV automáticamente, busca ofertas en toda España y envía tu candidatura
              a cientos de empresas con un solo clic.
            </p>
            {/* Botones de llamada a la acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/registro"
                className="px-8 py-4 text-lg font-semibold rounded-xl transition"
                style={{
                  backgroundColor: "#00ff88",
                  color: "#0a0a0a",
                  boxShadow: "0 0 20px #00ff8866",
                }}
              >
                Empezar gratis
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-4 text-lg font-semibold rounded-xl border transition"
                style={{
                  color: "#f0f0f0",
                  borderColor: "#00ff8840",
                  backgroundColor: "transparent",
                }}
              >
                Iniciar sesión
              </Link>
            </div>
          </div>

          {/* Efecto gradiente verde difuso en el fondo */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 20% 80%, #00ff8808 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4ade8008 0%, transparent 50%)",
            }}
          />
        </section>

        {/* ── Sección Features ──────────────────────────────────────────── */}
        <section className="py-20 px-4" style={{ backgroundColor: "#0a0a0a" }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-14" style={{ color: "#f0f0f0" }}>
              Todo lo que necesitas para encontrar trabajo
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div
                  key={feature.titulo}
                  className="rounded-2xl p-8 text-center border transition hover:scale-105"
                  style={{
                    backgroundColor: "#0d1f0d",
                    borderColor: "#00ff8825",
                  }}
                >
                  <div className="text-5xl mb-5">{feature.emoji}</div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: "#f0f0f0" }}>
                    {feature.titulo}
                  </h3>
                  <p style={{ color: "#a0a0a0" }} className="leading-relaxed">
                    {feature.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Sección Precios ───────────────────────────────────────────── */}
        <section className="py-20 px-4" style={{ backgroundColor: "#050505" }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4" style={{ color: "#f0f0f0" }}>
              Planes simples y transparentes
            </h2>
            <p className="text-center mb-14" style={{ color: "#a0a0a0" }}>
              Empieza gratis y escala cuando lo necesites
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {planes.map((plan) => (
                <div
                  key={plan.nombre}
                  className="rounded-2xl p-8 border transition hover:scale-105"
                  style={
                    plan.destacado
                      ? {
                          backgroundColor: "#0d1f0d",
                          borderColor: "#00ff88",
                          boxShadow: "0 0 30px #00ff8830",
                          transform: "scale(1.05)",
                        }
                      : {
                          backgroundColor: "#0d1f0d",
                          borderColor: "#00ff8820",
                        }
                  }
                >
                  {plan.destacado && (
                    <div
                      className="text-xs font-bold uppercase tracking-widest mb-3"
                      style={{ color: "#00ff88" }}
                    >
                      Más popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-1" style={{ color: "#f0f0f0" }}>
                    {plan.nombre}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "#a0a0a0" }}>
                    {plan.descripcion}
                  </p>
                  {/* Precio */}
                  <div className="mb-6">
                    <span
                      className="text-4xl font-extrabold"
                      style={{ color: plan.destacado ? "#00ff88" : "#f0f0f0" }}
                    >
                      {plan.precio}
                    </span>
                    <span className="text-sm" style={{ color: "#a0a0a0" }}>
                      {plan.periodo}
                    </span>
                  </div>
                  {/* Lista de características */}
                  <ul className="space-y-3 mb-8">
                    {plan.caracteristicas.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "#a0a0a0" }}
                      >
                        <span style={{ color: "#00ff88" }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {/* Botón del plan */}
                  <Link
                    href="/auth/registro"
                    className="block text-center py-3 rounded-xl font-semibold text-sm transition"
                    style={
                      plan.destacado
                        ? { backgroundColor: "#00ff88", color: "#0a0a0a" }
                        : { backgroundColor: "#1a2e1a", color: "#00ff88", border: "1px solid #00ff8840" }
                    }
                  >
                    Empezar con {plan.nombre}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="py-12 px-4" style={{ backgroundColor: "#050505", borderTop: "1px solid #00ff8815" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo en el footer */}
            <div className="flex items-center gap-2">
              <LogoGusano size={28} />
              <span className="font-bold" style={{ color: "#00ff88" }}>BuscayCurra</span>
            </div>
            {/* Links del footer */}
            <div className="flex flex-wrap gap-6 text-sm justify-center md:justify-end">
              <Link href="/auth/login" className="transition" style={{ color: "#a0a0a0" }}>
                Iniciar sesión
              </Link>
              <Link href="/auth/registro" className="transition" style={{ color: "#a0a0a0" }}>
                Registro
              </Link>
            </div>
          </div>

          {/* Links legales obligatorios (LSSI + RGPD) */}
          <div
            className="border-t mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm"
            style={{ borderColor: "#00ff8815" }}
          >
            <div className="flex flex-wrap gap-5 justify-center">
              {[
                { href: "/aviso-legal",  label: "Aviso Legal" },
                { href: "/privacidad",   label: "Política de Privacidad" },
                { href: "/terminos",     label: "Términos y Condiciones" },
                { href: "/cookies",      label: "Política de Cookies" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="transition" style={{ color: "#555" }}>
                  {label}
                </Link>
              ))}
              <a href="mailto:privacidad@buscaycurra.es" className="transition" style={{ color: "#555" }}>
                privacidad@buscaycurra.es
              </a>
            </div>
            <div className="text-xs" style={{ color: "#333" }}>
              © {new Date().getFullYear()} BuscayCurra — Encuentra trabajo con IA
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

