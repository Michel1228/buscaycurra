/**
 * app/cookies/page.tsx — Política de Cookies de BuscayCurra
 *
 * Detalla las cookies utilizadas por la plataforma conforme al RGPD.
 * Página pública, no requiere autenticación.
 * Última actualización: Abril 2026
 */

"use client";

import Link from "next/link";

// ─── Página de Política de Cookies ───────────────────────────────────────────

export default function CookiesPage() {

  // Función para resetear el consentimiento de cookies
  function resetearConsentimiento() {
    localStorage.removeItem("cookie-consent");
    // Recargar la página para que vuelva a aparecer el banner
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: "#2563EB" }}
            >
              B
            </div>
            <span className="font-bold text-gray-900 text-lg">BuscayCurra</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 transition"
          >
            ← Volver al inicio
          </Link>
        </div>
      </header>

      {/* ── Contenido principal ──────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 py-12">

        {/* Título */}
        <div className="mb-10">
          <h1
            className="text-4xl font-extrabold mb-3"
            style={{ color: "#2563EB" }}
          >
            Política de Cookies
          </h1>
          <p className="text-gray-500 text-sm">
            Última actualización: Abril 2026
          </p>
        </div>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          {/* 1. ¿Qué son las cookies? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              1. ¿Qué son las cookies?
            </h2>
            <p>
              Las cookies son pequeños archivos de texto que los sitios web
              guardan en tu dispositivo (ordenador, móvil o tablet) cuando los
              visitas. Sirven para que el sitio web recuerde tus preferencias,
              mantenga tu sesión iniciada y mejore tu experiencia de navegación.
            </p>
            <p className="mt-2">
              Las cookies son completamente inofensivas y no pueden acceder a
              información personal de tu dispositivo más allá de lo que tú
              mismo has proporcionado al sitio web.
            </p>
          </section>

          {/* 2. Cookies que usamos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              2. Cookies que utilizamos
            </h2>
            <p className="mb-4">
              En BuscayCurra utilizamos únicamente las cookies estrictamente
              necesarias para el funcionamiento del servicio. No utilizamos
              cookies publicitarias ni de seguimiento de terceros.
            </p>

            {/* Tabla de cookies */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                <thead>
                  <tr
                    className="text-white text-left"
                    style={{ backgroundColor: "#2563EB" }}
                  >
                    <th className="px-4 py-3 font-semibold">Cookie</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Finalidad</th>
                    <th className="px-4 py-3 font-semibold">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100 bg-white">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                      supabase-auth-token
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        Necesaria
                      </span>
                    </td>
                    <td className="px-4 py-3">Mantener la sesión iniciada en la plataforma</td>
                    <td className="px-4 py-3 text-gray-500">Sesión</td>
                  </tr>
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                      cookie-consent
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        Necesaria
                      </span>
                    </td>
                    <td className="px-4 py-3">Recordar tu elección de consentimiento de cookies</td>
                    <td className="px-4 py-3 text-gray-500">1 año</td>
                  </tr>
                  <tr className="border-t border-gray-100 bg-white">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                      _stripe_*
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        Funcional
                      </span>
                    </td>
                    <td className="px-4 py-3">Gestión segura de pagos a través de Stripe</td>
                    <td className="px-4 py-3 text-gray-500">Sesión</td>
                  </tr>
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                      _vercel_*
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        Técnica
                      </span>
                    </td>
                    <td className="px-4 py-3">Infraestructura de despliegue (Vercel)</td>
                    <td className="px-4 py-3 text-gray-500">Sesión</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Lo que NO hacemos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              3. Lo que NO hacemos con cookies
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <ul className="space-y-2 text-green-800">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 font-bold">✓</span>
                  <span>No utilizamos cookies publicitarias ni de seguimiento.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 font-bold">✓</span>
                  <span>No compartimos datos de cookies con redes publicitarias.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 font-bold">✓</span>
                  <span>No usamos píxeles de seguimiento de redes sociales.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 font-bold">✓</span>
                  <span>No rastreamos tu comportamiento fuera de nuestra plataforma.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* 4. Cómo gestionar las cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              4. Cómo gestionar las cookies en tu navegador
            </h2>
            <p className="mb-4">
              Puedes configurar o deshabilitar las cookies desde la
              configuración de tu navegador. Ten en cuenta que deshabilitar las
              cookies necesarias puede afectar al funcionamiento de la
              plataforma.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Chrome */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🌐 Google Chrome</h3>
                <ol className="list-decimal pl-4 text-sm space-y-1 text-gray-600">
                  <li>Menú → Configuración</li>
                  <li>Privacidad y seguridad</li>
                  <li>Cookies y otros datos de sitios</li>
                </ol>
              </div>

              {/* Firefox */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🦊 Mozilla Firefox</h3>
                <ol className="list-decimal pl-4 text-sm space-y-1 text-gray-600">
                  <li>Menú → Configuración</li>
                  <li>Privacidad y seguridad</li>
                  <li>Cookies y datos del sitio</li>
                </ol>
              </div>

              {/* Safari */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🧭 Safari</h3>
                <ol className="list-decimal pl-4 text-sm space-y-1 text-gray-600">
                  <li>Preferencias</li>
                  <li>Privacidad</li>
                  <li>Gestionar datos de sitios web</li>
                </ol>
              </div>
            </div>
          </section>

          {/* 5. Retirar consentimiento */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              5. Retirar o cambiar tu consentimiento
            </h2>
            <p className="mb-4">
              Puedes retirar o modificar tu consentimiento de cookies en
              cualquier momento haciendo clic en el botón de abajo. Esto
              eliminará tu elección guardada y volverá a aparecer el banner de
              cookies para que puedas tomar una nueva decisión.
            </p>
            <button
              onClick={resetearConsentimiento}
              className="px-6 py-3 rounded-xl font-semibold text-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              🔄 Restablecer preferencias de cookies
            </button>
          </section>

        </div>

        {/* ── Navegación legal ─────────────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Documentos legales relacionados:</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/privacidad"
              className="hover:underline"
              style={{ color: "#2563EB" }}
            >
              Política de Privacidad
            </Link>
            <Link
              href="/terminos"
              className="hover:underline"
              style={{ color: "#2563EB" }}
            >
              Términos y Condiciones
            </Link>
            <Link
              href="/aviso-legal"
              className="hover:underline"
              style={{ color: "#2563EB" }}
            >
              Aviso Legal
            </Link>
          </div>
        </div>

      </main>

      {/* ── Footer mínimo ────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 mt-16">
        <div className="max-w-4xl mx-auto text-center text-sm">
          © {new Date().getFullYear()} BuscayCurra —{" "}
          <a
            href="mailto:privacidad@buscaycurra.es"
            className="hover:text-white transition"
          >
            privacidad@buscaycurra.es
          </a>
        </div>
      </footer>

    </div>
  );
}
