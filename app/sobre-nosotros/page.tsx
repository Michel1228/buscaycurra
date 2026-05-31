import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiénes somos — BuscayCurra",
  description: "BuscayCurra es la plataforma de empleo con IA que busca, adapta y envía candidaturas por ti en 20+ países. Conoce nuestra historia y misión.",
};

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>

      {/* Nav mínima */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(15,17,23,0.95)", borderBottom: "1px solid #1a1d27", backdropFilter: "blur(8px)" }}>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🐛</span>
          <span className="font-bold text-sm" style={{ color: "#22c55e" }}>BuscayCurra</span>
        </Link>
        <Link href="/auth/registro"
          className="text-xs font-semibold px-4 py-2 rounded-lg"
          style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
          Empezar gratis →
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-20">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
            🌍 Tudela, Navarra · España
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#f1f5f9" }}>
            InfoJobs es 2005.<br />
            <span style={{ color: "#22c55e" }}>BuscayCurra es 2025.</span>
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "#64748b" }}>
            Creamos la primera plataforma de empleo con agente IA real para España y el mundo hispano.
            No un portal. Un agente que trabaja por ti.
          </p>
        </div>

        {/* Historia */}
        <div className="rounded-2xl p-8 mb-8" style={{ background: "#161922", border: "1px solid #2d3142" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#f1f5f9" }}>La historia</h2>
          <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
            <p>
              BuscayCurra nació de una frustración real. Después de semanas enviando CVs a mano,
              adaptando cada uno a cada oferta, esperando respuestas que nunca llegaban… me pregunté:
              ¿por qué nadie ha automatizado esto con IA?
            </p>
            <p>
              Los portales de empleo llevan décadas sin cambiar. InfoJobs, Indeed, LinkedIn siguen
              funcionando igual que hace 20 años: publicas tu CV, esperas entre miles de candidatos
              iguales, y rezas para que alguien lo lea.
            </p>
            <p>
              Con los LLMs modernos, era posible hacer algo diferente: un agente que entiende tu perfil,
              busca ofertas relevantes en cualquier país, adapta tu CV a cada empresa y lo envía
              en el momento exacto. Que trabaje mientras tú duermes.
            </p>
            <p>
              Eso es <strong style={{ color: "#f1f5f9" }}>BuscayCurra</strong>. Y eso es Guzzi,
              el primer agente de empleo con IA diseñado para el mercado de habla hispana.
            </p>
          </div>
        </div>

        {/* Misión y valores */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: "🎯",
              titulo: "Nuestra misión",
              desc: "Democratizar el acceso al empleo. Que cualquier persona con talento pueda encontrar trabajo en cualquier país, sin barreras de idioma, tiempo ni conocimientos técnicos.",
            },
            {
              icon: "🤝",
              titulo: "Nuestros valores",
              desc: "Transparencia total sobre cómo funciona la IA. Sin trucos, sin spam, sin envíos masivos sin control. Cada candidatura es revisada y aprobada por el usuario.",
            },
            {
              icon: "🌍",
              titulo: "Nuestra visión",
              desc: "Un mundo donde el talento no tenga fronteras. Que un programador de Tudela pueda trabajar en Berlín con la misma facilidad que en Madrid.",
            },
          ].map(v => (
            <div key={v.titulo} className="rounded-xl p-5" style={{ background: "#161922", border: "1px solid #2d3142" }}>
              <span className="text-2xl block mb-3">{v.icon}</span>
              <h3 className="font-semibold text-sm mb-2" style={{ color: "#f1f5f9" }}>{v.titulo}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Números */}
        <div className="rounded-2xl p-8 mb-8"
          style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))", border: "1px solid rgba(34,197,94,0.15)" }}>
          <h2 className="text-lg font-bold mb-6 text-center" style={{ color: "#f1f5f9" }}>BuscayCurra en cifras</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { num: "1.6M+", label: "Ofertas activas" },
              { num: "20+", label: "Países" },
              { num: "2.400+", label: "Personas encontraron trabajo" },
              { num: "18.000+", label: "CVs enviados este mes" },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-black mb-1" style={{ color: "#22c55e" }}>{stat.num}</p>
                <p className="text-xs" style={{ color: "#64748b" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tecnología */}
        <div className="rounded-2xl p-8 mb-8" style={{ background: "#161922", border: "1px solid #2d3142" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#f1f5f9" }}>La tecnología detrás</h2>
          <p className="text-sm mb-5" style={{ color: "#64748b" }}>
            BuscayCurra está construido con las mejores herramientas actuales para garantizar velocidad, privacidad y fiabilidad.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: "IA / Agente", valor: "Kimi K2 + modelos propios fine-tuned para empleo" },
              { label: "Fuentes de empleo", valor: "Adzuna, Careerjet, EURES, Arbeitsagentur, USAJobs, JobTech y más" },
              { label: "Infraestructura", valor: "Next.js 14, Supabase, Redis, Docker en VPS europeo" },
              { label: "Pagos", valor: "Stripe — encriptado, conforme PCI DSS" },
              { label: "Datos", valor: "Almacenados en Europa (RGPD)" },
              { label: "Disponibilidad", valor: "99.9% uptime · monitorizados 24/7" },
            ].map(t => (
              <div key={t.label} className="flex items-start gap-3 p-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #252836" }}>
                <span className="text-xs font-bold mt-0.5 flex-shrink-0" style={{ color: "#22c55e" }}>▸</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>{t.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{t.valor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div className="rounded-xl p-5 mb-8" style={{ background: "#161922", border: "1px solid #2d3142" }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: "#f1f5f9" }}>Datos de la empresa</h2>
          <div className="grid sm:grid-cols-2 gap-2 text-xs" style={{ color: "#64748b" }}>
            <p><span style={{ color: "#94a3b8" }}>Titular:</span> Michel Batista González</p>
            <p><span style={{ color: "#94a3b8" }}>NIF:</span> X9784910-C</p>
            <p><span style={{ color: "#94a3b8" }}>Domicilio:</span> C. Melchor Enrico Comediografo, 9, piso 2A, Tudela, Navarra 31500</p>
            <p><span style={{ color: "#94a3b8" }}>Email:</span> hola@buscaycurra.es</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/auth/registro"
            className="inline-block px-8 py-3 rounded-xl text-sm font-bold transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
            Empieza gratis — sin tarjeta
          </Link>
          <p className="text-xs mt-3" style={{ color: "#374155" }}>
            ¿Tienes preguntas?{" "}
            <Link href="/app/ayuda" className="underline" style={{ color: "#475569" }}>Centro de ayuda</Link>
            {" "}·{" "}
            <a href="mailto:hola@buscaycurra.es" className="underline" style={{ color: "#475569" }}>hola@buscaycurra.es</a>
          </p>
        </div>
      </div>
    </div>
  );
}
