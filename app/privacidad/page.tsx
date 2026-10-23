import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad — BuscayCurra",
  description: "Información sobre el tratamiento de tus datos personales en BuscayCurra.",
};

const S = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 36 }}>
    <h2 style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 700, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #1e2538" }}>
      {titulo}
    </h2>
    <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.8 }}>{children}</div>
  </section>
);

export default function PrivacidadPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#090c10", padding: "60px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <Link href="/" style={{ color: "#22c55e", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
            ← Volver a BuscayCurra
          </Link>
          <h1 style={{ color: "#f1f5f9", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Política de Privacidad</h1>
          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Última actualización: octubre de 2026</p>
        </div>

        <S titulo="1. Responsable del tratamiento">
          <p>
            <strong style={{ color: "#f1f5f9" }}>Responsable:</strong> Michel Batista González<br />
            <strong style={{ color: "#f1f5f9" }}>Servicio:</strong> BuscayCurra — plataforma de búsqueda de empleo con inteligencia artificial<br />
            <strong style={{ color: "#f1f5f9" }}>Web:</strong> https://buscaycurra.es<br />
            <strong style={{ color: "#f1f5f9" }}>Contacto:</strong> privacidad@buscaycurra.es
          </p>
        </S>

        {/* REVISADA EL 22 OCT 2026 contra el código. Decía que solo se compartían
            datos con Supabase, Stripe y Resend, y que los servidores estaban en el
            EEE "o con garantías equivalentes"; Guzzi va por OpenAI, el CV por Groq,
            la cámara por OpenAI y Google, y faltaban las fotos, la ubicación y las
            conversaciones. Si se añade un servicio que recibe datos, va aquí. */}
        <S titulo="2. Datos que guardamos">
          <ul style={{ paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Tu cuenta:</strong> nombre, correo, ciudad y, si lo indicas, tu oficio. Si llegas con un enlace de invitación, quién te invitó.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Cómo nos conociste:</strong> lo que contestes en el registro, si quieres, la web o el enlace desde el que llegaste y si te registraste en la app o en la web. Solo lo usamos para saber qué funciona, y se guarda con tu cuenta: no usamos cookies para esto.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Tu currículum:</strong> lo que escribes en el editor o el PDF que subes (experiencia, formación, idiomas, teléfono, correo y la foto si la pones).</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Lo que haces aquí:</strong> búsquedas, ofertas guardadas, los CV que mandas (a qué empresa y cuándo) y si te contestan, tus carnés y cuándo caducan, y tus ensayos de entrevista.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Conversaciones con Guzzi:</strong> se guardan para que puedas seguirlas. Si mandas una foto con la cámara, en la conversación queda una miniatura.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Ubicación:</strong> solo si das permiso al usar la cámara, para buscar los negocios de cerca. No la guardamos.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Au pair:</strong> si haces ese perfil, edad, nacionalidad, idiomas, experiencia con niños, referencias y fotos.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Pagos:</strong> los gestiona Stripe en la web y Apple en la app de iPhone. No guardamos datos bancarios.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Técnicos:</strong> dirección IP y navegador, para la seguridad y para arreglar fallos.</li>
          </ul>
        </S>

        <S titulo="3. Para qué los usamos">
          <ul style={{ paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>Darte el servicio: tu CV, buscar ofertas, Guzzi, los ensayos de entrevista y los cursos — <em>ejecución del contrato (art. 6.1.b RGPD)</em>.</li>
            <li style={{ marginBottom: 6 }}>Recomendarte ofertas, cursos y avisos según lo que pone tu CV y tu ciudad. Si no has rellenado el CV, no te mandamos ofertas al azar — <em>ejecución del contrato (art. 6.1.b RGPD)</em>.</li>
            <li style={{ marginBottom: 6 }}>Mandar tu CV a las empresas que tú eliges, cuando pulsas enviar — <em>consentimiento (art. 6.1.a RGPD)</em>.</li>
            <li style={{ marginBottom: 6 }}>Enseñar tu CV a empresas con Plan Empresa, solo si activas «Visible para empresas». Lo puedes apagar cuando quieras — <em>consentimiento (art. 6.1.a RGPD)</em>.</li>
            <li style={{ marginBottom: 6 }}>Avisarte por correo de ofertas, recordatorios y la caducidad de tus carnés. Cada correo trae cómo darte de baja — <em>interés legítimo (art. 6.1.f RGPD)</em>.</li>
            <li style={{ marginBottom: 6 }}>Gestionar tu suscripción y la facturación — <em>ejecución del contrato (art. 6.1.b RGPD)</em>.</li>
          </ul>
        </S>

        <S titulo="4. Cuánto tiempo">
          <p>
            Mientras tengas la cuenta. Al borrarla desde tu perfil se borran tu CV, tus fotos, tus envíos, tus conversaciones y el resto de tus datos, en un máximo de <strong style={{ color: "#f1f5f9" }}>30 días</strong> (casi todo, al momento). Los datos de facturación se guardan el tiempo que obliga la ley (5 años, normativa fiscal española).
          </p>
        </S>

        <S titulo="5. Quién más trata tus datos">
          <p>Solo para lo que se explica en cada caso:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Hostinger</strong> — nuestro servidor, en Francia: CV, envíos y conversaciones.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Supabase</strong> — las cuentas, la ficha y los ficheros (el CV en PDF y las fotos).</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>OpenAI</strong> (Estados Unidos) — las respuestas de Guzzi, la lectura de las fotos de la cámara y el respaldo de las cartas cuando Groq no responde.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Groq</strong> (Estados Unidos) — Guzzi cuando OpenAI no responde, las cartas para las empresas, mejorar tu CV, leer el PDF de tu CV, los ensayos de entrevista y las traducciones.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Google</strong> (Estados Unidos) — Google Maps para encontrar empresas y negocios (lo que buscas y, con la cámara, tu ubicación) y Gemini para mejorar CV largos.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Resend</strong> (Estados Unidos) — los correos, también los CV que mandas a las empresas.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Stripe</strong> y, en la app de iPhone, <strong style={{ color: "#f1f5f9" }}>Apple</strong> y <strong style={{ color: "#f1f5f9" }}>RevenueCat</strong> — los pagos.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Meta (WhatsApp)</strong> — solo si activas los avisos por WhatsApp.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Las empresas</strong> a las que tú mandas tu CV y, si activas «Visible para empresas», las que tienen Plan Empresa.</li>
          </ul>
          <p style={{ marginTop: 10 }}>Nuestro servidor está en la Unión Europea. Varios de estos servicios están en Estados Unidos: al usarlos, esos datos salen del Espacio Económico Europeo.</p>
          <p style={{ marginTop: 10 }}>No vendemos tus datos ni los usamos para publicidad.</p>
        </S>

        <S titulo="6. Tus derechos">
          <p>Puedes acceder a tus datos, corregirlos, borrarlos, llevártelos, oponerte a su uso o limitarlo. Tu cuenta y tu CV los borras tú mismo desde tu perfil; para lo demás, escribe a <strong style={{ color: "#22c55e" }}>privacidad@buscaycurra.es</strong> y te respondemos en 30 días. También puedes reclamar ante la <strong style={{ color: "#f1f5f9" }}>AEPD</strong> en <a href="https://www.aepd.es" target="_blank" rel="noreferrer" style={{ color: "#22c55e" }}>www.aepd.es</a>.</p>
        </S>

        <S titulo="7. Seguridad">
          <p>Todo viaja cifrado (HTTPS/TLS), el acceso a los servidores está restringido y las contraseñas de las cuentas las guarda Supabase cifradas.</p>
        </S>

        <S titulo="8. Cookies">
          <p>Usamos únicamente cookies técnicas necesarias para la sesión del usuario. No utilizamos cookies de seguimiento ni publicitarias de terceros.</p>
        </S>

        <S titulo="9. Modificaciones">
          <p>Notificaremos cambios relevantes por email o con un aviso en la aplicación. La versión vigente siempre estará en esta página.</p>
        </S>

        <div style={{ background: "#111520", border: "1px solid #1e2538", borderRadius: 14, padding: "20px 24px", marginTop: 40 }}>
          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
            ¿Preguntas? <a href="mailto:privacidad@buscaycurra.es" style={{ color: "#22c55e", textDecoration: "none" }}>privacidad@buscaycurra.es</a>
          </p>
        </div>
      </div>
    </div>
  );
}
