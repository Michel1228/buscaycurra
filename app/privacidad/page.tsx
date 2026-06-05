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
          <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>Última actualización: mayo de 2026</p>
        </div>

        <S titulo="1. Responsable del tratamiento">
          <p>
            <strong style={{ color: "#f1f5f9" }}>Responsable:</strong> Michel Batista González<br />
            <strong style={{ color: "#f1f5f9" }}>Servicio:</strong> BuscayCurra — plataforma de búsqueda de empleo con inteligencia artificial<br />
            <strong style={{ color: "#f1f5f9" }}>Web:</strong> https://buscaycurra.es<br />
            <strong style={{ color: "#f1f5f9" }}>Contacto:</strong> privacidad@buscaycurra.es
          </p>
        </S>

        <S titulo="2. Datos que recopilamos">
          <ul style={{ paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Registro:</strong> nombre completo y correo electrónico.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Currículum:</strong> el documento que el usuario sube voluntariamente.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Uso:</strong> búsquedas, ofertas guardadas y candidaturas gestionadas.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Pago:</strong> gestionado íntegramente por Stripe. No almacenamos datos bancarios.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Técnicos:</strong> IP y navegador, únicamente para seguridad y diagnóstico.</li>
          </ul>
        </S>

        <S titulo="3. Finalidad y base jurídica">
          <p>Tratamos tus datos para:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 6 }}>Prestar el servicio de búsqueda de empleo — <em>ejecución de contrato (Art. 6.1.b RGPD)</em>.</li>
            <li style={{ marginBottom: 6 }}>Enviar tu CV a empresas con tu autorización expresa — <em>consentimiento (Art. 6.1.a RGPD)</em>.</li>
            <li style={{ marginBottom: 6 }}>Gestionar tu suscripción y facturación — <em>ejecución de contrato (Art. 6.1.b RGPD)</em>.</li>
            <li style={{ marginBottom: 6 }}>Enviarte notificaciones transaccionales — <em>interés legítimo (Art. 6.1.f RGPD)</em>.</li>
          </ul>
        </S>

        <S titulo="4. Conservación de los datos">
          <p>
            Los datos se conservan mientras mantengas tu cuenta activa. Al eliminarla, se borran en un máximo de <strong style={{ color: "#f1f5f9" }}>30 días</strong>, salvo obligación legal de conservación (datos de facturación: 5 años según normativa fiscal española).
          </p>
        </S>

        <S titulo="5. Destinatarios">
          <p>Compartimos datos únicamente con estos proveedores y solo en la medida necesaria:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Supabase Inc.</strong> — base de datos y autenticación.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Stripe Inc.</strong> — procesamiento de pagos.</li>
            <li style={{ marginBottom: 6 }}><strong style={{ color: "#f1f5f9" }}>Resend Inc.</strong> — envío de correos transaccionales.</li>
          </ul>
          <p style={{ marginTop: 10 }}>No vendemos ni cedemos datos a terceros con fines publicitarios.</p>
        </S>

        <S titulo="6. Tus derechos (ARCO+)">
          <p>Tienes derecho a acceder, rectificar, suprimir, oponerte, portar y limitar el tratamiento de tus datos. Escribe a <strong style={{ color: "#22c55e" }}>privacidad@buscaycurra.es</strong> y responderemos en 30 días. También puedes reclamar ante la <strong style={{ color: "#f1f5f9" }}>AEPD</strong> en <a href="https://www.aepd.es" target="_blank" rel="noreferrer" style={{ color: "#22c55e" }}>www.aepd.es</a>.</p>
        </S>

        <S titulo="7. Seguridad">
          <p>Aplicamos cifrado HTTPS/TLS, acceso restringido a producción y contraseñas hasheadas. Los servidores se encuentran en el Espacio Económico Europeo o cuentan con garantías equivalentes.</p>
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
