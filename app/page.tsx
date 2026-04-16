/**
 * app/page.tsx — Landing page principal de BuscayCurra
 *
 * Página de inicio pública con:
 *   - Hero: título, subtítulo y botones de registro/login
 *   - Features: 3 tarjetas con las funcionalidades principales
 *   - Precios: 3 columnas (Free, Pro, Empresa)
 *   - Footer: logo y enlaces
 *
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import Link from "next/link";

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
    <div className="min-h-screen bg-white">

      {/* ── Cabecera pública ──────────────────────────────────────────── */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: "#2563EB" }}
            >
              B
            </div>
            <span className="font-bold text-gray-900 text-lg">BuscayCurra</span>
          </div>

          {/* Botones de acceso */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth/registro"
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition"
              style={{ backgroundColor: "#2563EB" }}
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="py-24 px-4 text-center bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              Encuentra trabajo más rápido con IA 🚀
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Mejora tu CV automáticamente, busca ofertas en toda España y envía tu candidatura
              a cientos de empresas con un solo clic.
            </p>
            {/* Botones de llamada a la acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/registro"
                className="px-8 py-4 text-lg font-semibold text-white rounded-xl shadow-lg hover:opacity-90 transition"
                style={{ backgroundColor: "#2563EB" }}
              >
                Empezar gratis
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-4 text-lg font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </section>

        {/* ── Sección Features ──────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">
              Todo lo que necesitas para encontrar trabajo
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div
                  key={feature.titulo}
                  className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100 hover:shadow-md transition"
                >
                  <div className="text-5xl mb-5">{feature.emoji}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.titulo}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{feature.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Sección Precios ───────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Planes simples y transparentes
            </h2>
            <p className="text-center text-gray-600 mb-14">
              Empieza gratis y escala cuando lo necesites
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {planes.map((plan) => (
                <div
                  key={plan.nombre}
                  className={`rounded-2xl p-8 border transition hover:shadow-lg ${
                    plan.destacado
                      ? "text-white shadow-xl scale-105"
                      : "bg-white border-gray-200"
                  }`}
                  style={
                    plan.destacado
                      ? { backgroundColor: "#2563EB", borderColor: "#2563EB" }
                      : {}
                  }
                >
                  {plan.destacado && (
                    <div className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-3">
                      Más popular
                    </div>
                  )}
                  <h3
                    className={`text-xl font-bold mb-1 ${
                      plan.destacado ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.nombre}
                  </h3>
                  <p
                    className={`text-sm mb-4 ${
                      plan.destacado ? "text-blue-200" : "text-gray-500"
                    }`}
                  >
                    {plan.descripcion}
                  </p>
                  {/* Precio */}
                  <div className="mb-6">
                    <span
                      className={`text-4xl font-extrabold ${
                        plan.destacado ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {plan.precio}
                    </span>
                    <span
                      className={`text-sm ${
                        plan.destacado ? "text-blue-200" : "text-gray-500"
                      }`}
                    >
                      {plan.periodo}
                    </span>
                  </div>
                  {/* Lista de características */}
                  <ul className="space-y-3 mb-8">
                    {plan.caracteristicas.map((item) => (
                      <li
                        key={item}
                        className={`flex items-center gap-2 text-sm ${
                          plan.destacado ? "text-blue-100" : "text-gray-600"
                        }`}
                      >
                        <span
                          className={`text-base ${
                            plan.destacado ? "text-blue-200" : "text-green-500"
                          }`}
                        >
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {/* Botón del plan */}
                  <Link
                    href="/auth/registro"
                    className={`block text-center py-3 rounded-xl font-semibold text-sm transition ${
                      plan.destacado
                        ? "bg-white hover:bg-blue-50"
                        : "text-white hover:opacity-90"
                    }`}
                    style={
                      plan.destacado
                        ? { color: "#2563EB" }
                        : { backgroundColor: "#F97316" }
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
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo en el footer */}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: "#2563EB" }}
              >
                B
              </div>
              <span className="font-bold text-white">BuscayCurra</span>
            </div>
            {/* Links del footer */}
            <div className="flex gap-6 text-sm">
              <Link href="/auth/login" className="hover:text-white transition">
                Iniciar sesión
              </Link>
              <Link href="/auth/registro" className="hover:text-white transition">
                Registro
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © {new Date().getFullYear()} BuscayCurra — Encuentra trabajo con IA
          </div>
        </div>
      </footer>
    </div>
  );
}
