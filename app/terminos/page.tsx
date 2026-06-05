/**
 * app/terminos/page.tsx — Términos y Condiciones de BuscayCurra
 *
 * Términos de servicio completos para la plataforma.
 * Página pública, no requiere autenticación.
 * Última actualización: Abril 2026
 */

import Link from "next/link";

// ─── Página de Términos y Condiciones ────────────────────────────────────────

export default function TerminosPage() {
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
            Términos y Condiciones
          </h1>
          <p className="text-gray-500 text-sm">
            Última actualización: Abril 2026
          </p>
        </div>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          {/* 1. Descripción del servicio */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              1. Descripción del servicio
            </h2>
            <p>
              BuscayCurra es una plataforma SaaS (Software as a Service) de
              búsqueda de empleo con inteligencia artificial, accesible en{" "}
              <strong>buscaycurra.es</strong>. El servicio permite a los
              usuarios buscar ofertas de trabajo en España, mejorar su
              currículum vitae mediante IA y enviar candidaturas automáticamente
              a empresas.
            </p>
            <p className="mt-2">
              Al registrarse y utilizar BuscayCurra, el usuario acepta
              íntegramente los presentes Términos y Condiciones.
            </p>
          </section>

          {/* 2. Registro y cuenta */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              2. Registro y cuenta de usuario
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Para utilizar BuscayCurra, el usuario debe crear una cuenta
                proporcionando información veraz y actualizada.
              </li>
              <li>
                El usuario debe ser <strong>mayor de 18 años</strong>. El uso
                del servicio por menores de edad no está permitido.
              </li>
              <li>
                El usuario es responsable de mantener sus credenciales de acceso
                (contraseña) en secreto y de todas las actividades realizadas
                desde su cuenta.
              </li>
              <li>
                Cada persona solo puede tener <strong>una cuenta activa</strong>.
                La creación de múltiples cuentas para eludir restricciones del
                servicio está prohibida.
              </li>
              <li>
                BuscayCurra se reserva el derecho de suspender o eliminar
                cuentas que incumplan estos términos.
              </li>
            </ul>
          </section>

          {/* 3. Planes y pagos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              3. Planes y condiciones de pago
            </h2>

            {/* Tabla de planes */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                <thead>
                  <tr
                    className="text-white text-left"
                    style={{ background: "linear-gradient(135deg, #7ed56f, #5cb848)", color: "#1a1a12" }}
                  >
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Precio</th>
                    <th className="px-4 py-3 font-semibold">Envíos/día</th>
                    <th className="px-4 py-3 font-semibold">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100 bg-white">
                    <td className="px-4 py-3 font-medium">Free</td>
                    <td className="px-4 py-3">Gratis</td>
                    <td className="px-4 py-3">2 CVs / día</td>
                    <td className="px-4 py-3 text-gray-500">Sin tarjeta</td>
                  </tr>
                  <tr className="border-t border-gray-100 bg-blue-50">
                    <td className="px-4 py-3 font-medium" style={{ color: "#7ed56f" }}>
                      Pro
                    </td>
                    <td className="px-4 py-3">9,99 € / mes</td>
                    <td className="px-4 py-3">10 CVs / día</td>
                    <td className="px-4 py-3 text-gray-500">Renovación mensual</td>
                  </tr>
                  <tr className="border-t border-gray-100 bg-white">
                    <td className="px-4 py-3 font-medium" style={{ color: "#F97316" }}>
                      Empresa
                    </td>
                    <td className="px-4 py-3">49,99 € / mes</td>
                    <td className="px-4 py-3">Ilimitado</td>
                    <td className="px-4 py-3 text-gray-500">Renovación mensual</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ul className="list-disc pl-6 space-y-2">
              <li>
                Los pagos son gestionados íntegramente por{" "}
                <strong>Stripe</strong>, una plataforma de pagos certificada PCI
                DSS. BuscayCurra no almacena datos de tarjetas bancarias.
              </li>
              <li>
                Las suscripciones se renuevan automáticamente cada mes en la
                misma fecha en que se activaron, salvo que el usuario las
                cancele antes.
              </li>
              <li>
                <strong>No se realizarán reembolsos</strong> una vez iniciado el
                período de facturación, salvo obligación legal aplicable o error
                imputable a BuscayCurra.
              </li>
              <li>
                BuscayCurra se reserva el derecho de modificar los precios con
                un preaviso de <strong>30 días</strong> mediante comunicación al
                correo electrónico del usuario.
              </li>
            </ul>
          </section>

          {/* 4. Uso aceptable */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              4. Uso aceptable del servicio
            </h2>
            <p>El usuario se compromete a no utilizar BuscayCurra para:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Enviar spam masivo o candidaturas no relacionadas con el perfil profesional.</li>
              <li>Enviar CVs con información falsa, fraudulenta o que suplante la identidad de terceros.</li>
              <li>Realizar actividades ilegales o que vulneren derechos de terceros.</li>
              <li>Intentar acceder de forma no autorizada a sistemas o datos de la plataforma.</li>
              <li>Usar el servicio de manera que degrade su rendimiento o disponibilidad para otros usuarios.</li>
            </ul>
            <p className="mt-3">
              El incumplimiento de estas normas podrá conllevar la suspensión
              inmediata de la cuenta sin derecho a reembolso.
            </p>
          </section>

          {/* 5. Contenido del usuario */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              5. Contenido del usuario
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                El usuario es el único responsable del contenido de su
                currículum vitae y de la veracidad de la información que
                proporciona.
              </li>
              <li>
                Al subir su CV a la plataforma, el usuario concede a BuscayCurra
                una licencia limitada para procesarlo con el fin de prestar el
                servicio (mejora con IA, envío a empresas).
              </li>
              <li>
                BuscayCurra no se responsabiliza del contenido enviado a
                empresas ni de las consecuencias derivadas de dicho envío.
              </li>
              <li>
                El usuario declara que tiene los derechos necesarios sobre toda
                la información incluida en su CV.
              </li>
            </ul>
          </section>

          {/* 6. Limitación de responsabilidad */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              6. Limitación de responsabilidad
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                BuscayCurra es una herramienta que facilita la búsqueda de
                empleo, pero <strong>no garantiza</strong> la obtención de
                trabajo ni la respuesta por parte de las empresas.
              </li>
              <li>
                BuscayCurra no es responsable de las decisiones de contratación
                de las empresas a las que se envían candidaturas.
              </li>
              <li>
                La plataforma se presta &quot;tal cual&quot; y BuscayCurra no garantiza su
                disponibilidad ininterrumpida, aunque se esforzará en mantener
                el servicio operativo.
              </li>
              <li>
                En ningún caso la responsabilidad de BuscayCurra podrá exceder
                el importe abonado por el usuario en los 3 meses anteriores al
                evento que origina la reclamación.
              </li>
            </ul>
          </section>

          {/* 7. Derecho de desistimiento */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              7. Derecho de desistimiento (14 días)
            </h2>
            <p>
              De conformidad con el Real Decreto Legislativo 1/2007 y la
              Directiva 2011/83/UE, el usuario consumidor dispone de un plazo
              de <strong>14 días naturales</strong> desde la contratación de
              cualquier plan de pago para desistir del contrato sin necesidad
              de justificación y sin penalización alguna.
            </p>
            <p className="mt-2">
              Para ejercer este derecho, el usuario debe comunicarlo a{" "}
              <a
                href="mailto:privacidad@buscaycurra.es"
                className="font-medium hover:underline"
                style={{ color: "#7ed56f" }}
              >
                privacidad@buscaycurra.es
              </a>{" "}
              antes de que expire dicho plazo. Se procederá al reembolso
              íntegro en un plazo máximo de 14 días desde la recepción de la
              solicitud, utilizando el mismo medio de pago empleado en la
              compra.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Nota: si el usuario ha hecho uso efectivo del servicio (envíos
              de CV realizados, uso de la IA), el derecho de desistimiento
              puede quedar limitado conforme al artículo 103.m) del RDL
              1/2007, al tratarse de contenido digital cuya ejecución ha
              comenzado con consentimiento expreso del usuario.
            </p>
          </section>

          {/* 8. Cancelación */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              8. Cancelación de suscripción
            </h2>
            <p>
              El usuario puede cancelar su suscripción en cualquier momento
              desde la sección <strong>Mi perfil</strong> de la plataforma. La
              cancelación tendrá efecto al finalizar el período de facturación
              en curso, sin derecho a reembolso proporcional salvo ejercicio
              del derecho de desistimiento descrito en el artículo anterior.
            </p>
            <p className="mt-2">
              El usuario también puede solicitar la eliminación completa de su
              cuenta y todos sus datos directamente desde{" "}
              <strong>Mi perfil → Eliminar mi cuenta</strong>, o enviando un
              correo a{" "}
              <a
                href="mailto:privacidad@buscaycurra.es"
                className="font-medium hover:underline"
                style={{ color: "#7ed56f" }}
              >
                privacidad@buscaycurra.es
              </a>
              .
            </p>
          </section>

          {/* 9. Modificaciones */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              9. Modificaciones del servicio y condiciones
            </h2>
            <p>
              BuscayCurra se reserva el derecho de modificar estos Términos y
              Condiciones, el servicio o los precios. Los cambios en precios se
              comunicarán con al menos <strong>30 días de antelación</strong>.
              El uso continuado del servicio tras la notificación implicará la
              aceptación de los nuevos términos.
            </p>
          </section>

          {/* 10. Ley aplicable */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              10. Ley aplicable y jurisdicción
            </h2>
            <p>
              Los presentes Términos y Condiciones se rigen por la{" "}
              <strong>legislación española</strong>. Para cualquier controversia
              derivada de la interpretación o ejecución de estos términos, las
              partes se someten a los{" "}
              <strong>tribunales competentes de España</strong>, con renuncia
              expresa a cualquier otro fuero que pudiera corresponderles.
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
