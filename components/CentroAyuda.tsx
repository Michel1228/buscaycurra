"use client";

/**
 * CentroAyuda — Centro de ayuda / FAQ reutilizable.
 *
 * Se usa en dos sitios:
 *   - /app/ayuda   → dentro de la app (con AppNavWrapper), requiere sesión
 *   - /soporte     → página PÚBLICA (sin auth), es la Support URL que Apple exige
 *
 * El contenido es idéntico en ambos; solo cambia el contexto donde se monta.
 */

import { useState } from "react";
import Link from "next/link";
import { NUM_PAISES } from "@/lib/paises";
import { LIMITS } from "@/lib/plan-limits";

// Las cifras salen de lib/plan-limits.ts, no escritas a mano. El 22 sep 2026
// esta página decía "2 envíos al día" en el plan gratuito y "5" en Esencial
// cuando de verdad eran 3 y 15, y hablaba de un plan Básico que ya no se vende.
// Un centro de ayuda que miente hace más daño que no tenerlo.
const FREE = LIMITS.free;
const ESENCIAL = LIMITS.esencial;
const PRO = LIMITS.pro;

const FAQS = [
  {
    categoria: "Cuenta y registro",
    items: [
      { q: "¿Es gratis registrarse en BuscayCurra?", a: `Sí. Crear una cuenta es completamente gratuito, sin tarjeta de crédito. El plan gratuito incluye búsqueda de ofertas, mejora de CV con IA y hasta ${FREE.enviosCVDia} envíos de CV por día (${FREE.enviosCVSemana} por semana).` },
      { q: "¿Cómo cambio mi contraseña?", a: "Ve a tu perfil → pestaña 'Seguridad' → 'Cambiar contraseña'. También puedes usar '¿Olvidaste tu contraseña?' en la pantalla de login para recibirla por email." },
      { q: "¿Puedo eliminar mi cuenta?", a: "Sí. En tu perfil → pestaña 'Cuenta' → 'Eliminar cuenta'. Todos tus datos se borran permanentemente en 30 días según el RGPD." },
      { q: "¿Cómo confirmo mi email?", a: "Al registrarte te enviamos un email de confirmación. Revisa también la carpeta de spam. Si no lo recibes, entra en tu perfil y pulsa 'Reenviar confirmación'." },
    ],
  },
  {
    categoria: "CV y candidaturas",
    items: [
      { q: "¿Cómo sube Guzzi mi CV?", a: "Ve a 'Mi CV' en el menú. Sube tu CV en PDF (máx. 5 MB) o cuéntale a Guzzi tu experiencia en el chat. Guzzi lo analiza, lo mejora y lo adapta a cada oferta antes de enviarlo." },
      { q: "¿Cuántos CVs puedo enviar al día?", a: `Depende de tu plan: Gratis (${FREE.enviosCVDia}/día y ${FREE.enviosCVSemana}/semana), Esencial (${ESENCIAL.enviosCVDia}/día), Pro (${PRO.enviosCVDia}/día) y Empresa (${LIMITS.empresa.enviosCVDia}/día). Los envíos se reinician cada día a medianoche.` },
      { q: "¿Puedo ver a qué empresas he enviado mi CV?", a: "Sí. En 'Pipeline' tienes el historial completo de candidaturas: empresa, fecha, estado y respuestas." },
      { q: "¿Guzzi envía mi CV sin que yo lo apruebe?", a: "No. Guzzi te muestra las ofertas encontradas y tú decides cuáles enviar. El envío requiere tu confirmación o que hayas configurado previamente tus filtros." },
      { q: "¿Cada cuánto tiempo puedo enviar a la misma empresa?", a: "Cada 15 días. Esto evita el spam y protege tu imagen profesional." },
    ],
  },
  {
    categoria: "Búsqueda de empleo",
    items: [
      { q: "¿En qué países busca Guzzi ofertas?", a: `En ${NUM_PAISES} países: España, Alemania, Francia, Reino Unido, Irlanda, Países Bajos, Suecia, Noruega, Dinamarca, Suiza, Italia, Portugal, Bélgica, Austria, Finlandia, Polonia, Estados Unidos, Canadá, Australia, Nueva Zelanda y Grecia.` },
      { q: "¿Las ofertas son actuales?", a: "Sí. Sincronizamos ofertas cada 6 horas desde Adzuna, EURES, Careerjet, Bundesagentur für Arbeit y otras fuentes. Tenemos millones de ofertas activas." },
      { q: "¿Puedo guardar ofertas para verlas después?", a: "Sí. Pulsa el corazón en cualquier oferta. Accede a todas en la sección 'Guardados'." },
      { q: "¿Cómo funciona el comparador de salarios?", a: "En 'Salarios' busca tu puesto y verás el salario medio, mínimo y máximo en cada país, basado en ofertas reales publicadas." },
    ],
  },
  {
    categoria: "Planes y pagos",
    items: [
      { q: "¿Qué incluye el plan Esencial (2,99€/mes)?", a: `${ESENCIAL.enviosCVDia} envíos de CV por día, carta de presentación personalizada por IA, ensayos de entrevista sin límite, ${ESENCIAL.guzziMaxConsultasDia} consultas diarias a Guzzi y ${ESENCIAL.cvsGuardados} CVs guardados. Sin permanencia.` },
      { q: "¿Puedo cancelar en cualquier momento?", a: "Sí. Sin permanencia ni penalización. Ve a tu perfil → 'Mi Plan' → 'Cancelar suscripción'. Sigues teniendo acceso hasta el final del período pagado." },
      { q: "¿Cómo pago? ¿Es seguro?", a: "En la web usamos Stripe, el estándar mundial de pagos online. En la app de iPhone/iPad el pago se realiza de forma segura con tu cuenta de Apple (compra integrada). Nunca almacenamos datos de tu tarjeta." },
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

export default function CentroAyuda() {
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
    <div className="py-10 px-4 text-center" style={{ borderBottom: "1px solid #2d3142" }}>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "#f8fafc" }}>Centro de <span className="texto-neon">ayuda</span></h1>
        <p className="text-sm mb-6" style={{ color: "#a7b3c6" }}>
          Encuentra respuesta a tus preguntas sobre BuscayCurra y Guzzi
        </p>
        <div className="max-w-md mx-auto">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Busca tu pregunta..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(163,230,53,0.3)", color: "#f1f5f9" }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 text-left">
        {filtradas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "#a7b3c6" }}>
              No encontramos resultados para &ldquo;{busqueda}&rdquo;.
            </p>
            <p className="text-xs mt-2" style={{ color: "#a7b3c6" }}>
              Escríbenos a{" "}
              <a href="mailto:soporte@buscaycurra.es" style={{ color: "#bef264" }}>soporte@buscaycurra.es</a>
            </p>
          </div>
        ) : (
          filtradas.map((cat) => (
            <div key={cat.categoria}>
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "#bef264" }}>
                {cat.categoria}
              </h2>
              <div className="space-y-2">
                {cat.items.map((item, idx) => {
                  const key = `${cat.categoria}-${idx}`;
                  const open = !!abiertos[key];
                  return (
                    <div key={key} className="cristal tono-neutro overflow-hidden" style={{ borderRadius: 16 }}>
                      <button
                        onClick={() => toggle(key)}
                        className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 text-sm font-medium"
                        style={{ color: "#f1f5f9" }}
                      >
                        <span>{item.q}</span>
                        <span style={{ color: "#bef264", display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, fontSize: "10px" }}>▼</span>
                      </button>
                      {open && (
                        <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: "#cbd5e1", borderTop: "1px solid rgba(148,163,184,0.16)" }}>
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

        <div className="cristal tono-lima p-6 text-center">
          <p className="text-sm font-semibold mb-1" style={{ color: "#f1f5f9" }}>¿No encuentras lo que buscas?</p>
          <p className="text-xs mb-4" style={{ color: "#a7b3c6" }}>Nuestro equipo responde en menos de 24 horas en días laborables.</p>
          <a
            href="mailto:soporte@buscaycurra.es"
            className="boton-neon text-sm"
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
            <Link key={l.href} href={l.href} className="zona-tactil text-xs hover:underline" style={{ color: "#a7b3c6" }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
