"use client";

import { useState } from "react";
import Link from "next/link";

const SECCIONES = [
  {
    titulo: "Primeros pasos",
    preguntas: [
      {
        q: "¿Cómo funciona BuscayCurra?",
        a: "BuscayCurra es una plataforma de empleo con IA. Guzzi, tu asistente, busca ofertas en 20+ países, adapta tu CV a cada empresa y envía candidaturas de forma automática. Tú solo revisas y vas a las entrevistas.",
      },
      {
        q: "¿Qué tengo que hacer al registrarme?",
        a: "Tras registrarte: 1) Completa tu CV en 'Mi CV' con tu experiencia y foto. 2) Activa los envíos en 'Mis envíos'. 3) Crea una alerta de empleo en 'Buscar'. Con eso Guzzi empieza a trabajar por ti.",
      },
      {
        q: "¿Tengo que crear un CV desde cero?",
        a: "No. Puedes escribir directamente en los campos o pedir a Guzzi que te ayude a redactarlo. Si ya tienes un CV en PDF, puedes subirlo y Guzzi extrae la información automáticamente.",
      },
      {
        q: "¿Cuánto tarda en aparecer mi primera candidatura?",
        a: "Normalmente entre 24 y 48 horas desde que activas los envíos y tu CV está completo. Guzzi busca ofertas que encajan con tu perfil y envía las candidaturas en el momento óptimo.",
      },
    ],
  },
  {
    titulo: "CV y perfil",
    preguntas: [
      {
        q: "¿Cómo añado mi foto al CV?",
        a: "En 'Mi CV', pulsa el área de foto circular en la parte superior. Puedes hacer una foto con la cámara o seleccionar una de tu carrete. La foto debe ser profesional con fondo neutro.",
      },
      {
        q: "¿Qué información debo completar en el CV?",
        a: "Cuanto más completes, mejores resultados tendrá Guzzi. Lo mínimo: nombre, email, teléfono, puesto deseado y al menos una experiencia laboral. Añadir habilidades, idiomas y formación mejora mucho la tasa de respuesta.",
      },
      {
        q: "¿Puedo tener más de un CV?",
        a: "De momento tienes un CV principal que Guzzi adapta automáticamente a cada oferta. No necesitas crear múltiples versiones: Guzzi personaliza el texto, el orden y las palabras clave según la empresa.",
      },
      {
        q: "¿Mis datos son privados?",
        a: "Sí. Tus datos solo se envían a empresas cuando tú activas los envíos. Nunca compartimos tu CV con terceros sin tu permiso. Puedes leer nuestra política de privacidad completa en /privacidad.",
      },
    ],
  },
  {
    titulo: "Envíos y candidaturas",
    preguntas: [
      {
        q: "¿Cómo activo el envío automático de CVs?",
        a: "Ve a 'Mis envíos', selecciona los sectores y países donde quieres trabajar, y activa el interruptor. Guzzi empieza a buscar ofertas que encajen y envía candidaturas automáticamente.",
      },
      {
        q: "¿Puedo ver a qué empresas se ha enviado mi CV?",
        a: "Sí. En 'Pipeline' tienes el historial completo de todas las candidaturas: empresa, puesto, fecha, y estado (enviado, visto, respuesta recibida). Puedes mover las tarjetas entre columnas según avanza el proceso.",
      },
      {
        q: "¿Cuántos CVs puedo enviar al día?",
        a: "Depende de tu plan: Gratis (2/día), Esencial (60/mes), Pro (10/día), Empresa (ilimitados). Puedes ver y cambiar tu plan en 'Mi Perfil > Mi Plan'.",
      },
      {
        q: "¿Qué pasa si una empresa responde?",
        a: "Recibirás una notificación en la app y por email. La candidatura aparecerá en 'Pipeline' con el estado actualizado. Guzzi también puede ayudarte a preparar la entrevista con el simulador.",
      },
    ],
  },
  {
    titulo: "Búsqueda de empleo",
    preguntas: [
      {
        q: "¿En qué países busca Guzzi trabajo?",
        a: "Actualmente en 20+ países: España, Alemania, Francia, Reino Unido, Países Bajos, Suecia, Noruega, Dinamarca, Suiza, Austria, Bélgica, Portugal, Irlanda, Italia, Polonia, República Checa, Hungría, Grecia, Canadá, Australia, Nueva Zelanda y EEUU.",
      },
      {
        q: "¿Cómo creo una alerta de empleo?",
        a: "En 'Buscar', escribe las palabras clave y selecciona la ubicación, luego pulsa el botón de alerta (🔔). Recibirás una notificación cada vez que aparezcan nuevas ofertas que encajen.",
      },
      {
        q: "¿Cuántas ofertas hay disponibles?",
        a: "Más de 1.600.000 ofertas activas de 15+ fuentes (Careerjet, Adzuna, Arbeitsagentur, EURES, USAJobs, JobTech Suecia, y más). Se actualizan cada 8 horas.",
      },
      {
        q: "¿Puedo guardar ofertas para verlas después?",
        a: "Sí. Pulsa el corazón (❤️) en cualquier oferta para guardarla. Las encontrarás en la sección 'Guardadas'.",
      },
    ],
  },
  {
    titulo: "Planes y pagos",
    preguntas: [
      {
        q: "¿Cuánto cuesta BuscayCurra?",
        a: "El plan Gratis incluye 2 CVs/día sin coste. El plan Esencial cuesta 2,99€/mes (60 candidaturas/mes). Pro cuesta 9,99€/mes (10 CVs/día + IA avanzada). Empresa cuesta 49,99€/mes (ilimitado + API).",
      },
      {
        q: "¿Puedo cancelar en cualquier momento?",
        a: "Sí, sin permanencia. Cancela desde 'Mi Perfil > Mi Plan > Portal de facturación'. Al cancelar, conservas el acceso hasta el final del período pagado.",
      },
      {
        q: "¿Cómo pago?",
        a: "Mediante Stripe (tarjeta de crédito/débito, Google Pay, Apple Pay). El cobro es mensual y automático. Recibes factura por email.",
      },
      {
        q: "¿Hay período de prueba?",
        a: "El plan Gratis es permanente y no requiere tarjeta. Puedes explorar la app y ver sus funciones antes de suscribirte a un plan de pago.",
      },
    ],
  },
  {
    titulo: "Técnico y cuenta",
    preguntas: [
      {
        q: "¿Cómo cambio mi contraseña?",
        a: "Ve a 'Mi Perfil > Seguridad > Cambiar contraseña'. Si no recuerdas la contraseña actual, usa 'Olvidé mi contraseña' en la pantalla de login.",
      },
      {
        q: "¿Cómo elimino mi cuenta?",
        a: "En 'Mi Perfil > Seguridad > Zona de peligro > Eliminar mi cuenta'. Se borran todos tus datos de forma permanente. Esta acción no se puede deshacer.",
      },
      {
        q: "¿La app funciona en iPhone y Android?",
        a: "Sí. BuscayCurra es una Progressive Web App (PWA) que funciona en cualquier navegador. También está disponible en Google Play y en App Store (próximamente).",
      },
      {
        q: "No recibo el email de confirmación, ¿qué hago?",
        a: "Revisa la carpeta de spam. Si tampoco está ahí, espera 5 minutos e inténtalo de nuevo desde la pantalla de login con 'Reenviar confirmación'. Si el problema persiste, contacta con soporte@buscaycurra.es.",
      },
    ],
  },
];

export default function AyudaPage() {
  const [abierta, setAbierta] = useState<string | null>(null);

  const toggle = (key: string) => setAbierta(prev => prev === key ? null : key);

  return (
    <div className="min-h-screen pt-16 pb-20" style={{ background: "#0f1117" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
            🐛
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Centro de ayuda</h1>
          <p className="text-sm" style={{ color: "#64748b" }}>
            Respuestas a las preguntas más frecuentes sobre BuscayCurra
          </p>
        </div>

        {/* Contacto rápido */}
        <div className="rounded-xl p-4 mb-8 flex items-center gap-4"
          style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <span className="text-2xl">💬</span>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>¿No encuentras lo que buscas?</p>
            <p className="text-xs" style={{ color: "#64748b" }}>Pregúntale directamente a Guzzi o escríbenos a soporte@buscaycurra.es</p>
          </div>
          <Link href="/app/gusi"
            className="text-xs font-semibold px-3 py-2 rounded-lg flex-shrink-0"
            style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
            Hablar con Guzzi →
          </Link>
        </div>

        {/* Secciones FAQ */}
        <div className="space-y-6">
          {SECCIONES.map((seccion) => (
            <div key={seccion.titulo}>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
                {seccion.titulo}
              </h2>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #2d3142" }}>
                {seccion.preguntas.map((faq, i) => {
                  const key = `${seccion.titulo}-${i}`;
                  const open = abierta === key;
                  return (
                    <div key={key} style={{ borderTop: i > 0 ? "1px solid #2d3142" : undefined }}>
                      <button onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:opacity-80"
                        style={{ background: open ? "rgba(34,197,94,0.04)" : "#161922" }}>
                        <span className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{faq.q}</span>
                        <span className="flex-shrink-0 text-base transition-transform"
                          style={{ color: "#22c55e", transform: open ? "rotate(45deg)" : "none" }}>
                          +
                        </span>
                      </button>
                      {open && (
                        <div className="px-4 pb-4 pt-1" style={{ background: "rgba(34,197,94,0.02)" }}>
                          <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer de contacto */}
        <div className="mt-10 text-center">
          <p className="text-xs" style={{ color: "#475569" }}>
            ¿Necesitas más ayuda? Escríbenos a{" "}
            <a href="mailto:soporte@buscaycurra.es" className="underline" style={{ color: "#22c55e" }}>
              soporte@buscaycurra.es
            </a>
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link href="/privacidad" className="text-xs hover:underline" style={{ color: "#334155" }}>Privacidad</Link>
            <Link href="/terminos" className="text-xs hover:underline" style={{ color: "#334155" }}>Términos</Link>
            <Link href="/sobre-nosotros" className="text-xs hover:underline" style={{ color: "#334155" }}>Quiénes somos</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
