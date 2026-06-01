"use client";

import { useState } from "react";
import Link from "next/link";

const FAQS = [
  {
    categoria: "Cuenta y registro",
    items: [
      { q: "¿Es gratis registrarse en BuscayCurra?", a: "Sí. Crear una cuenta es completamente gratuito, sin tarjeta de crédito. El plan gratuito incluye búsqueda de ofertas, mejora de CV con IA y hasta 2 envíos de CV por día." },
      { q: "¿Cómo cambio mi contraseña?", a: "Ve a tu perfil → pestaña 'Seguridad' → 'Cambiar contraseña'. También puedes usar '¿Olvidaste tu contraseña?' en la pantalla de login para recibirla por email." },
      { q: "¿Puedo eliminar mi cuenta?", a: "Sí. En tu perfil → pestaña 'Cuenta' → 'Eliminar cuenta'. Todos tus datos se borran permanentemente en 30 días según el RGPD." },
      { q: "¿Cómo confirmo mi email?", a: "Al registrarte te enviamos un email de confirmación. Revisa también la carpeta de spam. Si no lo recibes, entra en tu perfil y pulsa 'Reenviar confirmación'." },
    ],
  },
  {
    categoria: "CV y candidaturas",
    items: [
      { q: "¿Cómo sube Guzzi mi CV?", a: "Ve a 'Mi CV' en el menú. Sube tu CV en PDF (máx. 5 MB) o cuéntale a Guzzi tu experiencia en el chat. Guzzi lo analiza, lo mejora y lo adapta a cada oferta antes de enviarlo." },
      { q: "¿Cuántos CVs puedo enviar al día?", a: "Depende de tu plan: Gratis (2/día), Esencial (5/día), Pro (10/día), Empresa (ilimitado). Los envíos se reinician cada día a medianoche." },
      { q: "¿Puedo ver a qué empresas he enviado mi CV?", a: "Sí. En 'Pipeline' tienes el historial completo de candidaturas: empresa, fecha, estado y respuestas." },
      { q: "¿Guzzi envía mi CV sin que yo lo apruebe?", a: "No. Guzzi te muestra las ofertas encontradas y tú decides cuáles enviar. El envío requiere tu confirmación o que hayas configurado previamente tus filtros." },
      { q: "¿Cada cuánto tiempo puedo enviar a la misma empresa?", a: "Cada 90 días. Esto evita el spam y protege tu imagen profesional." },
    ],
  },
  {
    categoria: "Búsqueda de empleo",
    items: [
      { q: "¿En qué países busca Guzzi ofertas?", a: "En más de 20 países: España, Alemania, Francia, Reino Unido, Irlanda, Países Bajos, Suecia, Noruega, Dinamarca, Suiza, Italia, Portugal, Bélgica, Austria, Finlandia, Polonia, Estados Unidos, Canadá, Australia, Nueva Zelanda y más." },
      { q: "¿Las ofertas son actuales?", a: "Sí. Sincronizamos ofertas cada 8 horas desde Adzuna, EURES, Careerjet, Bundesagentur für Arbeit y otras fuentes. Tenemos más de 1.600.000 ofertas activas." },
      { q: "¿Puedo guardar ofertas para verlas después?", a: "Sí. Pulsa el corazón en cualquier oferta. Accede a todas en la sección 'Guardados'." },
      { q: "¿Cómo funciona el comparador de salarios?", a: "En 'Salarios' busca tu puesto y verás el salario medio, mínimo y máximo en cada país, basado en ofertas reales publicadas." },
    ],
  },
  {
    categoria: "Planes y pagos",
    items: [
      { q: "¿Qué incluye el plan Esencial (2,99€/mes)?", a: "5 envíos de CV por día, carta de presentación personalizada por IA, buscador avanzado y estadísticas básicas. Sin permanencia." },
      { q: "¿Puedo cancelar en cualquier momento?", a: "Sí. Sin permanencia ni penalización. Ve a tu perfil → 'Mi Plan' → 'Cancelar suscripción'. Sigues teniendo acceso hasta el final del período pagado." },
      { q: "¿Cómo pago? ¿Es seguro?", a: "Usamos Stripe, el estándar mundial de pagos online. Aceptamos tarjeta de crédito/débito y Apple Pay. Nunca almacenamos datos de tu tarjeta." },
      { q: "¿Ofrecéis factura para empresas?", a: "Sí. Escríbenos a hola@buscaycurra.es con tu NIF/CIF y te enviamos la factura." },
    ],
  },
  {
    categoria: "Privacidad y datos",
    items: [
      { q: "¿Qué hacéis con mis datos?", a: "Tus datos solo se usan para mostrarte ofertas relevantes y mejorar tu CV. Nunca los vendemos a terceros. Consulta nuestra política de privacidad completa en el enlace de abajo." },
      { q: "¿Puedo pedir una copia de mis datos?", a: "Sí, tienes derecho de acceso según el RGPD. Escríbenos a privacidad@buscaycurra.es y te enviamos todos tus datos en 30 días." },
    ],
  },
  {
    categoria: "Soporte técnico",
    items: [
      { q: "La app no carga correctamente. ¿Qué hago?", a: "Cierra y reabre la app. Si persiste, limpia la caché o reinstala. Si sigue fallando, escríbenos a soporte@buscaycurra.es con una captura de pantalla." },
      { q: "No recibo notificaciones. ¿Cómo las activo?", a: "Ve a ajustes de tu dispositivo → BuscayCurra → Notificaciones → Actívalas. También puedes gestionarlas desde tu perfil en la app." },
      { q: "¿Cómo contacto con soporte?", a: "Por email en soporte@buscaycurra.es. Respondemos en menos de 24 horas en días laborables." },
    ],
  },
];

export default function AyudaPage() {
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});
  const [busqueda, setBusqueda] = useState("");

  function toggle(key: string) {
    setAbiertos((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const q = busqueda.toLowerCase().trim();
  const filtradas = FAQS.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) => !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      <div className="py-10 px-4 text-center" style={{ borderBottom: "1px solid #2d3142" }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Centro de ayuda</h1>
        <p className="text-sm mb-6" style={{ color: "#64748b" }}>
          Encuentra respuesta a tus preguntas sobre BuscayCurra y Guzzi
        </p>
        <div className="max-w-md mx-auto">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Busca tu pregunta..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#f1f5f9" }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {filtradas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "#64748b" }}>
              No encontramos resultados para &ldquo;{busqueda}&rdquo;.
            </p>
            <p className="text-xs mt-2" style={{ color: "#475569" }}>
              Escríbenos a{" "}
              <a href="mailto:soporte@buscaycurra.es" style={{ color: "#22c55e" }}>soporte@buscaycurra.es</a>
            </p>
          </div>
        ) : (
          filtradas.map((cat) => (
            <div key={cat.categoria}>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#22c55e" }}>
                {cat.categoria}
              </h2>
              <div className="space-y-2">
                {cat.items.map((item, idx) => {
                  const key = `${cat.categoria}-${idx}`;
                  const open = !!abiertos[key];
                  return (
                    <div key={key} className="rounded-xl overflow-hidden" style={{ border: "1px solid #2d3142", background: "#1e212b" }}>
                      <button
                        onClick={() => toggle(key)}
                        className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 text-sm font-medium"
                        style={{ color: "#f1f5f9" }}
                      >
                        <span>{item.q}</span>
                        <span style={{ color: "#22c55e", display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, fontSize: "10px" }}>▼</span>
                      </button>
                      {open && (
                        <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: "#94a3b8", borderTop: "1px solid #2d3142" }}>
                          <p className="pt-3">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        <div className="rounded-xl p-6 text-center" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "#f1f5f9" }}>¿No encuentras lo que buscas?</p>
          <p className="text-xs mb-4" style={{ color: "#64748b" }}>Nuestro equipo responde en menos de 24 horas en días laborables.</p>
          <a
            href="mailto:soporte@buscaycurra.es"
            className="inline-block text-sm font-semibold px-6 py-2.5 rounded-lg"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
          >
            Escribir a soporte
          </a>
        </div>

        <div className="flex flex-wrap gap-4 justify-center pb-8">
          {[
            { href: "/privacidad", label: "Privacidad" },
            { href: "/terminos", label: "Términos" },
            { href: "/cookies", label: "Cookies" },
            { href: "/sobre-nosotros", label: "Sobre nosotros" },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="text-xs hover:underline" style={{ color: "#475569" }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
