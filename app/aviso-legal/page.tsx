/**
 * app/aviso-legal/page.tsx — Aviso Legal de BuscayCurra
 *
 * Conforme a la Ley 34/2002 de Servicios de la Sociedad de la Información
 * y de Comercio Electrónico (LSSI-CE).
 * Página pública, no requiere autenticación.
 * Última actualización: Abril 2026
 */

import Link from "next/link";

// ─── Página de Aviso Legal ────────────────────────────────────────────────────

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen" style={{ background: "#1a1a12", color: "#f0ebe0" }}>

      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <header className="glass-warm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}
            >
              B
            </div>
            <span className="font-bold text-lg" style={{ color: "#7ed56f" }}>BuscayCurra</span>
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
            style={{ color: "#7ed56f" }}
          >
            Aviso Legal
          </h1>
          <p className="text-gray-500 text-sm">
            Última actualización: Abril 2026
          </p>
        </div>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          {/* 1. Datos identificativos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Datos identificativos del titular
            </h2>
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-5 py-3 font-semibold text-gray-600 bg-gray-100 w-40">
                      Nombre
                    </td>
                    <td className="px-5 py-3 text-gray-800">BuscayCurra</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-5 py-3 font-semibold text-gray-600 bg-gray-100">
                      Dominio
                    </td>
                    <td className="px-5 py-3 text-gray-800">buscaycurra.es</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-5 py-3 font-semibold text-gray-600 bg-gray-100">
                      Email
                    </td>
                    <td className="px-5 py-3">
                      <a
                        href="mailto:privacidad@buscaycurra.es"
                        className="font-medium hover:underline"
                        style={{ color: "#7ed56f" }}
                      >
                        privacidad@buscaycurra.es
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-5 py-3 font-semibold text-gray-600 bg-gray-100">
                      País
                    </td>
                    <td className="px-5 py-3 text-gray-800">España</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-gray-600 bg-gray-100">
                      Actividad
                    </td>
                    <td className="px-5 py-3 text-gray-800">
                      Plataforma de búsqueda de empleo con inteligencia artificial
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              En cumplimiento con el artículo 10 de la Ley 34/2002, de 11 de
              julio, de Servicios de la Sociedad de la Información y de
              Comercio Electrónico (LSSI-CE).
            </p>
          </section>

          {/* 2. Objeto y ámbito */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              2. Objeto y ámbito de aplicación
            </h2>
            <p>
              El presente Aviso Legal regula el acceso y uso del sitio web{" "}
              <strong>buscaycurra.es</strong>, titularidad de BuscayCurra, a
              través del cual se ofrece una plataforma digital de búsqueda de
              empleo asistida por inteligencia artificial.
            </p>
            <p className="mt-2">
              El acceso al sitio web atribuye la condición de usuario e implica
              la aceptación plena de las condiciones incluidas en este Aviso
              Legal en la versión publicada en el momento del acceso.
            </p>
          </section>

          {/* 3. Propiedad intelectual */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              3. Propiedad intelectual e industrial
            </h2>
            <p>
              Todos los contenidos del sitio web buscaycurra.es, incluyendo
              pero no limitado a textos, imágenes, logotipos, diseño gráfico,
              código fuente, software e interfaces, son propiedad de
              BuscayCurra o de sus licenciantes, y están protegidos por las
              leyes españolas e internacionales de propiedad intelectual e
              industrial.
            </p>
            <p className="mt-2">
              Queda expresamente <strong>prohibida</strong> la reproducción
              total o parcial, distribución, transformación o comunicación
              pública de cualquier contenido del sitio web sin la autorización
              previa y escrita de BuscayCurra.
            </p>
            <p className="mt-2">
              El nombre comercial <strong>BuscayCurra</strong>, su logotipo y
              demás signos distintivos son propiedad exclusiva de sus titulares
              y no podrán ser utilizados sin autorización.
            </p>
          </section>

          {/* 4. Exclusión de responsabilidad */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              4. Exclusión de responsabilidad
            </h2>

            <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">
              4.1 Disponibilidad del servicio
            </h3>
            <p>
              BuscayCurra no garantiza la disponibilidad y continuidad del
              funcionamiento del sitio web y sus servicios. Cuando ello sea
              razonablemente posible, BuscayCurra advertirá previamente de las
              interrupciones en el funcionamiento del sitio web.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">
              4.2 Contenidos y enlaces externos
            </h3>
            <p>
              BuscayCurra no se hace responsable de los contenidos de sitios
              web de terceros a los que se pueda acceder mediante enlaces desde
              buscaycurra.es. La presencia de dichos enlaces tiene finalidad
              informativa y no implica la aprobación, promoción ni
              responsabilidad de BuscayCurra respecto a los contenidos
              enlazados.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">
              4.3 Uso del servicio
            </h3>
            <p>
              BuscayCurra no se responsabiliza de los daños y perjuicios de
              cualquier naturaleza que puedan deberse a la transmisión,
              difusión, almacenamiento, puesta a disposición, recepción,
              obtención o acceso a los contenidos del sitio web, ni de los
              derivados del uso de los datos, informaciones, aplicaciones y
              servicios disponibles en el mismo.
            </p>
          </section>

          {/* 5. Política de privacidad y cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              5. Política de privacidad y cookies
            </h2>
            <p>
              El tratamiento de los datos personales de los usuarios se rige
              por lo establecido en nuestra{" "}
              <Link
                href="/privacidad"
                className="font-medium hover:underline"
                style={{ color: "#7ed56f" }}
              >
                Política de Privacidad
              </Link>
              . El uso de cookies en este sitio web se describe en nuestra{" "}
              <Link
                href="/cookies"
                className="font-medium hover:underline"
                style={{ color: "#7ed56f" }}
              >
                Política de Cookies
              </Link>
              .
            </p>
          </section>

          {/* 6. Ley aplicable */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              6. Ley aplicable y jurisdicción
            </h2>
            <p>
              El presente Aviso Legal se rige en todo lo que concierne a su
              interpretación y cumplimiento por la{" "}
              <strong>legislación española</strong>, siendo de aplicación,
              entre otras, la Ley 34/2002 de Servicios de la Sociedad de la
              Información (LSSI-CE), el Reglamento (UE) 2016/679 (RGPD) y la
              Ley Orgánica 3/2018 de Protección de Datos Personales y garantía
              de los derechos digitales (LOPDGDD).
            </p>
            <p className="mt-2">
              Para la resolución de cualquier controversia, las partes se
              someten a los <strong>Juzgados y Tribunales competentes de
              España</strong>, con renuncia expresa a cualquier otro fuero que
              pudiera corresponderles.
            </p>
          </section>

        </div>

        {/* ── Navegación legal ─────────────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Documentos legales relacionados:</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/privacidad"
              className="hover:underline"
              style={{ color: "#7ed56f" }}
            >
              Política de Privacidad
            </Link>
            <Link
              href="/terminos"
              className="hover:underline"
              style={{ color: "#7ed56f" }}
            >
              Términos y Condiciones
            </Link>
            <Link
              href="/cookies"
              className="hover:underline"
              style={{ color: "#7ed56f" }}
            >
              Política de Cookies
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
