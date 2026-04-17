/**
 * app/privacidad/page.tsx — Política de Privacidad de BuscayCurra
 *
 * Conforme al Reglamento General de Protección de Datos (RGPD).
 * Página pública, no requiere autenticación.
 * Última actualización: Abril 2026
 */

import Link from "next/link";

// ─── Página de Política de Privacidad ────────────────────────────────────────

export default function PrivacidadPage() {
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
            Política de Privacidad
          </h1>
          <p className="text-gray-500 text-sm">
            Última actualización: Abril 2026
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          {/* 1. Responsable */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              1. Responsable del tratamiento
            </h2>
            <p>
              El responsable del tratamiento de sus datos personales es{" "}
              <strong>BuscayCurra</strong>, accesible en el dominio{" "}
              <strong>buscaycurra.es</strong>.
            </p>
            <p className="mt-2">
              Para cualquier consulta relacionada con la protección de datos
              puede contactarnos en:{" "}
              <a
                href="mailto:privacidad@buscaycurra.es"
                className="font-medium hover:underline"
                style={{ color: "#7ed56f" }}
              >
                privacidad@buscaycurra.es
              </a>
            </p>
          </section>

          {/* 2. Datos que recogemos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              2. Datos personales que recopilamos
            </h2>
            <p>En BuscayCurra recopilamos los siguientes datos:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Datos de registro:</strong> nombre, dirección de correo
                electrónico y número de teléfono.
              </li>
              <li>
                <strong>Currículum vitae (CV):</strong> el documento PDF que el
                usuario sube voluntariamente a la plataforma.
              </li>
              <li>
                <strong>Historial de candidaturas:</strong> registro de los
                envíos de CV realizados a empresas a través del servicio.
              </li>
              <li>
                <strong>Datos de pago:</strong> la gestión de pagos es realizada
                íntegramente por Stripe. BuscayCurra no almacena datos de
                tarjetas bancarias ni información financiera sensible.
              </li>
              <li>
                <strong>Datos de uso y navegación:</strong> información técnica
                sobre cómo el usuario utiliza la plataforma (páginas visitadas,
                clics, tiempo de sesión) con fines de mejora del servicio.
              </li>
            </ul>
          </section>

          {/* 3. Finalidad */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              3. Finalidad del tratamiento
            </h2>
            <p>Utilizamos sus datos personales para las siguientes finalidades:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                Prestación del servicio de búsqueda de empleo en la plataforma
                BuscayCurra.
              </li>
              <li>
                Mejora del currículum vitae mediante inteligencia artificial.
              </li>
              <li>
                Envío automático de candidaturas a empresas a petición del
                usuario.
              </li>
              <li>
                Gestión de suscripciones y procesamiento de pagos a través de
                Stripe.
              </li>
              <li>
                Comunicaciones relacionadas con el servicio (notificaciones,
                actualizaciones, soporte técnico).
              </li>
              <li>
                Cumplimiento de obligaciones legales aplicables.
              </li>
            </ul>
          </section>

          {/* 4. Base legal */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              4. Base legal del tratamiento
            </h2>
            <p>
              El tratamiento de sus datos personales se realiza sobre las
              siguientes bases jurídicas:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Consentimiento del interesado</strong> (art. 6.1.a
                RGPD): para el envío de comunicaciones no esenciales y el uso
                de cookies no estrictamente necesarias.
              </li>
              <li>
                <strong>Ejecución de un contrato</strong> (art. 6.1.b RGPD):
                para la prestación de los servicios de BuscayCurra contratados
                por el usuario.
              </li>
              <li>
                <strong>Interés legítimo</strong> (art. 6.1.f RGPD): para la
                mejora del servicio y la seguridad de la plataforma.
              </li>
            </ul>
          </section>

          {/* 5. Conservación */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              5. Plazo de conservación de datos
            </h2>
            <p>
              Sus datos personales se conservarán mientras su cuenta esté
              activa y durante <strong>1 año adicional</strong> tras la
              cancelación de la misma, salvo que la legislación aplicable
              exija un período de conservación distinto.
            </p>
            <p className="mt-2">
              Los datos asociados al historial de candidaturas podrán
              conservarse de forma anonimizada con fines estadísticos.
            </p>
          </section>

          {/* 6. Derechos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              6. Sus derechos
            </h2>
            <p>
              De acuerdo con el RGPD, usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Acceso:</strong> conocer qué datos personales suyos
                tratamos.
              </li>
              <li>
                <strong>Rectificación:</strong> solicitar la corrección de datos
                inexactos o incompletos.
              </li>
              <li>
                <strong>Supresión («derecho al olvido»):</strong> solicitar la
                eliminación de sus datos cuando ya no sean necesarios.
              </li>
              <li>
                <strong>Portabilidad:</strong> recibir sus datos en un formato
                estructurado y de uso común.
              </li>
              <li>
                <strong>Oposición:</strong> oponerse al tratamiento de sus datos
                en determinadas circunstancias.
              </li>
              <li>
                <strong>Limitación del tratamiento:</strong> solicitar que
                restrinjamos el tratamiento de sus datos en ciertos casos.
              </li>
            </ul>
            <p className="mt-3">
              Para ejercer cualquiera de estos derechos, envíe un correo a{" "}
              <a
                href="mailto:privacidad@buscaycurra.es"
                className="font-medium hover:underline"
                style={{ color: "#7ed56f" }}
              >
                privacidad@buscaycurra.es
              </a>{" "}
              indicando el derecho que desea ejercer y adjuntando una copia de
              su documento de identidad.
            </p>
          </section>

          {/* 7. Transferencias internacionales */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              7. Transferencias internacionales de datos
            </h2>
            <p>
              Para la prestación del servicio utilizamos los siguientes
              proveedores, algunos de los cuales pueden implicar transferencias
              de datos fuera del Espacio Económico Europeo:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Supabase</strong> (base de datos y autenticación):
                infraestructura ubicada en la Unión Europea. Cumple plenamente
                con el RGPD.
              </li>
              <li>
                <strong>Stripe</strong> (pagos): empresa con sede en EE.UU. La
                transferencia se realiza bajo las cláusulas contractuales
                estándar aprobadas por la Comisión Europea.
              </li>
              <li>
                <strong>Groq / Google Gemini</strong> (inteligencia artificial):
                servicios con sede en EE.UU. La transferencia se realiza bajo
                las cláusulas contractuales estándar aprobadas por la Comisión
                Europea.
              </li>
            </ul>
          </section>

          {/* 8. Reclamaciones */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              8. Derecho a presentar reclamaciones
            </h2>
            <p>
              Si considera que el tratamiento de sus datos personales vulnera la
              normativa de protección de datos, tiene derecho a presentar una
              reclamación ante la{" "}
              <strong>
                Agencia Española de Protección de Datos (AEPD)
              </strong>
              , a través de su sitio web{" "}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
                style={{ color: "#7ed56f" }}
              >
                www.aepd.es
              </a>
              .
            </p>
          </section>

          {/* 9. Cambios */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              9. Cambios en esta política
            </h2>
            <p>
              BuscayCurra se reserva el derecho de modificar esta Política de
              Privacidad para adaptarla a cambios legislativos o del servicio.
              Le informaremos de cambios significativos mediante un aviso en la
              plataforma o por correo electrónico.
            </p>
          </section>

        </div>

        {/* ── Navegación legal ─────────────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Documentos legales relacionados:</p>
          <div className="flex flex-wrap gap-4 text-sm">
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
            <Link
              href="/aviso-legal"
              className="hover:underline"
              style={{ color: "#7ed56f" }}
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
