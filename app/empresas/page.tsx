import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";
import { Target, Bot, MapPin, Banknote, Zap, RefreshCw, Star, Check, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { LIMITES_EMPRESA } from "@/lib/plan-limits";

// Cuánto incluye el plan (4 nov 2026): cupo de candidatos al mes y personas
// con acceso. Sale de lib/plan-limits.ts, lo mismo que aplica el servidor.
const CANDIDATOS_MES = LIMITES_EMPRESA.candidatosMes;
const PERSONAS = LIMITES_EMPRESA.usuarios;

// Esta pagina no consulta la base de datos ni una sola vez: es una landing con
// texto fijo. Estaba en force-dynamic, o sea que el servidor la renderizaba
// entera en cada visita para no leer nada. Ahora se sirve de cache.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Para Empresas — BuscayCurra | Accede a talento activo",
  description:
    "Encuentra a gente que busca trabajo y ha pedido que las empresas la encuentren: nombre, contacto y CV completo. Plan Empresa, 49,99€/mes, sin coste por oferta.",
  openGraph: {
    title: "BuscayCurra para Empresas — Talento real, sin intermediarios",
    description:
      "Candidatos que han pedido que les encuentren, con su CV completo y contacto directo. 49,99€/mes.",
    url: "https://buscaycurra.es/empresas",
    type: "website",
  },
};

// LO QUE SE PROMETE ES LO QUE HAY (17 oct 2026). Aquí se anunciaban alertas
// de nuevos candidatos, una API, exportar contactos, "soporte 24/7", "nuevos
// candidatos cada día" y precios de InfoJobs y LinkedIn sin fuente. Nada de
// eso existía o se podía demostrar, y a una empresa que paga no se le puede
// vender así (Ley de Competencia Desleal: actos de engaño y publicidad
// comparativa que no se puede comprobar). Si algo de eso llega a existir, se
// vuelve a anunciar.
const VENTAJAS: { Icon: LucideIcon; titulo: string; desc: string }[] = [
  {
    Icon: Target,
    titulo: "Gente que quiere que la encuentren",
    desc: "Solo aparece quien ha activado «Visible para empresas» en su CV. Te escribe alguien que ha pedido que le escribas.",
  },
  {
    Icon: Bot,
    titulo: "CV completos y ordenados",
    desc: "Todos los CV están hechos con el mismo editor: experiencia, formación, aptitudes e idiomas, fáciles de comparar.",
  },
  {
    Icon: MapPin,
    titulo: "Busca por ciudad y perfil",
    desc: "Escribe la ciudad y lo que buscas (camarero, carretillero, administrativo…) y te salen los que encajan.",
  },
  {
    Icon: Banknote,
    titulo: "Sin pagar por candidato",
    desc: `Una cuota al mes, sin coste por oferta ni por contacto, para hasta ${PERSONAS} personas de tu empresa. Sin permanencia.`,
  },
  {
    Icon: Zap,
    titulo: "Contacto directo",
    desc: `Con Plan Empresa ves el nombre de cada candidato y abres el email, el teléfono y el CV de hasta ${CANDIDATOS_MES} al mes. Sin intermediarios, sin plataforma de mensajería.`,
  },
  {
    Icon: RefreshCw,
    titulo: "Ofertas sin coste",
    desc: "Mándanos tu oferta desde el formulario: la revisamos y te contestamos por correo.",
  },
];

// TESTIMONIOS RETIRADOS el 17 de agosto de 2026.
//
// Eran inventados: nombre, ciudad, oficio, cinco estrellas y cifras concretas
// ("lo mandé a 200 empresas y tuve respuesta de 47"). Con 51 usuarios
// registrados y ninguno de pago, no había de dónde sacarlos. Es el mismo
// problema que el "2.400+ personas encontraron trabajo" que ya se limpió, pero
// peor: aquello era una cifra, esto son personas que no existen.
//
// Se deja el array vacío a propósito, no se borra: cuando haya usuarios de
// verdad que quieran contar su caso, se rellena aquí y la sección reaparece
// sola. Lo que NO puede es volver a llenarse de invenciones.
const TESTIMONIOS: { nombre: string; ciudad?: string; puesto?: string; texto: string; empresa?: string; cargo?: string }[] = [];

const FAQ_EMPRESAS = [
  {
    q: "¿Necesito publicar una oferta para encontrar candidatos?",
    a: "No. Con el Plan Empresa ves directamente a todos los candidatos que han activado «Visible para empresas», y los buscas por ciudad y perfil sin esperar a que te escriban.",
  },
  {
    q: "¿Qué datos de contacto tengo de cada candidato?",
    a: `Con Plan Empresa ves el nombre completo de todos los candidatos que han activado «Visible para empresas», y abres el email, el teléfono y el CV completo de hasta ${CANDIDATOS_MES} al mes. Uno que ya has abierto sigue abierto y no vuelve a contar. Contacto directo sin intermediarios.`,
  },
  {
    q: "¿Pueden usarlo varias personas de mi empresa?",
    a: `Sí, hasta ${PERSONAS} contándote a ti, cada una con su propia cuenta: nadie tiene que pasarse la contraseña. Las añades por su correo en «Tu equipo». El cupo de candidatos del mes es de toda la empresa.`,
  },
  {
    q: "¿Puedo publicar ofertas también?",
    a: "Sí, sin coste. Nos la mandas desde el formulario, la revisamos y te contestamos por correo.",
  },
  {
    q: "¿Cuántos candidatos hay?",
    a: "Los que han activado «Visible para empresas» en su CV. Antes de pagar puedes ver sus fichas sin nombre (puesto, ciudad y aptitudes) en el portal de candidatos, y así sabes si hay lo que buscas.",
  },
  {
    q: "¿Funcionáis solo en España?",
    a: "Casi todos los candidatos están en España, y hay algunos de otros países.",
  },
];


export default function EmpresasLandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>

      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: "rgba(15,17,23,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(45,49,66,0.4)" }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoGusano size={26} />
            <span className="font-bold text-sm" style={{ color: "#22c55e" }}>BuscayCurra</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>Para empresas</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/empresas/candidatos" className="text-sm font-medium transition hover:opacity-80 hidden sm:block" style={{ color: "#94a3b8" }}>
              Ver candidatos
            </Link>
            <Link href="/precios" className="text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
              Contratar acceso
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* Hero */}
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(34,197,94,0.08) 0%, transparent 55%)" }} />
          <div className="max-w-4xl mx-auto text-center relative">

            <div className="flex justify-center mb-5">
              <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", color: "#22c55e" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse" />
                Ver los perfiles es gratis
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5 tracking-tight" style={{ color: "#f1f5f9" }}>
              El talento que necesitas.<br />
              <span style={{ color: "#22c55e" }}>Sin intermediarios.</span>
            </h1>

            <p className="text-base md:text-lg mb-8 leading-relaxed max-w-2xl mx-auto" style={{ color: "#94a3b8" }}>
              Encuentra a gente que busca trabajo y <strong style={{ color: "#cbd5e1" }}>ha pedido que las empresas la encuentren</strong>.
              Búscalos por ciudad y perfil, mira su CV completo y contacta directo,
              sin intermediarios y sin coste por oferta.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              <Link href="/empresas/candidatos"
                className="text-center text-sm font-semibold py-3.5 px-10 rounded-xl transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                Ver candidatos disponibles →
              </Link>
              <Link href="/empresas/publicar"
                className="text-center text-sm font-medium py-3.5 px-8 rounded-xl transition hover:bg-[#1e212b]"
                style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
                Mandar una oferta gratis
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              {[
                // No se promete un numero de candidatos: seria mentir a
                // quien va a pagar 49,99 EUR al mes por esto.
                { num: "0€", label: "Ver perfiles y mandar ofertas", color: "#22c55e" },
                { num: "49,99€", label: "Al mes, sin permanencia", color: "#f59e0b" },
                { num: "CV", label: "Completo y con contacto", color: "#a855f7" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.num}</div>
                  <div className="text-[11px]" style={{ color: "#64748b" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ventajas */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Por qué las empresas eligen BuscayCurra</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Contratar no debería ser caro ni lento.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {VENTAJAS.map(v => (
                <div key={v.titulo} className="card-game p-6">
                  <v.Icon size={32} strokeWidth={1.3} className="mb-4" style={{ color: "#22c55e" }} />
                  <h3 className="text-sm font-bold mb-2" style={{ color: "#f1f5f9" }}>{v.titulo}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonios: solo si los hay de verdad (el array está vacío a propósito) */}
        {TESTIMONIOS.length > 0 && (
        <section className="py-16 px-6" style={{ background: "rgba(15,17,23,0.6)", borderTop: "1px solid rgba(45,49,66,0.4)" }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-center mb-2" style={{ color: "#f1f5f9" }}>Lo que dicen las empresas</h2>
            <p className="text-sm text-center mb-10" style={{ color: "#64748b" }}>Resultados reales de reclutadores que ya usan BuscayCurra</p>
            <div className="grid md:grid-cols-3 gap-5">
              {TESTIMONIOS.map(t => (
                <div key={t.nombre} className="rounded-2xl p-6 flex flex-col gap-4"
                  style={{ background: "#161922", border: "1px solid #2d3142" }}>
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={13} strokeWidth={0} fill="#f59e0b" />)}</div>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: "#94a3b8" }}>"{t.texto}"</p>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>{t.nombre}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>{t.cargo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Precios para empresas */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Un precio. Todo incluido.</h2>
            <p className="text-sm mb-10" style={{ color: "#64748b" }}>Sin sorpresas y sin coste por oferta ni por candidato</p>
            <div className="rounded-2xl p-8" style={{ background: "#161922", border: "2px solid rgba(34,197,94,0.3)" }}>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-5xl font-black" style={{ color: "#22c55e" }}>49,99€</span>
                <span className="text-sm" style={{ color: "#64748b" }}>/mes</span>
              </div>
              <p className="text-xs mb-6" style={{ color: "#64748b" }}>Sin permanencia · Cancela cuando quieras</p>
              <div className="grid sm:grid-cols-2 gap-2 text-left mb-8">
                {[
                  "Todos los candidatos visibles, con nombre",
                  `Email, teléfono y CV completo de hasta ${CANDIDATOS_MES} al mes`,
                  `Hasta ${PERSONAS} personas de tu empresa, cada una con su cuenta`,
                  "Búsqueda por ciudad y perfil",
                  "Mandarnos ofertas sin coste",
                  "Guzzi IA ilimitado",
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <Check size={11} strokeWidth={2.5} className="flex-shrink-0" style={{ color: "#22c55e" }} />
                    <span className="text-xs" style={{ color: "#94a3b8" }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/precios"
                className="block text-center text-sm font-bold py-3 rounded-xl transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                Contratar Plan Empresa →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ empresas */}
        <section className="py-16 px-6" style={{ borderTop: "1px solid rgba(45,49,66,0.4)" }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-center mb-8" style={{ color: "#f1f5f9" }}>Preguntas frecuentes</h2>
            <div className="space-y-3">
              {FAQ_EMPRESAS.map((faq, i) => (
                <details key={i} className="rounded-xl overflow-hidden group"
                  style={{ border: "1px solid #2d3142" }}>
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none"
                    style={{ background: "#161922" }}>
                    <span className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{faq.q}</span>
                    <span className="text-base ml-3 flex-shrink-0" style={{ color: "#22c55e" }}>+</span>
                  </summary>
                  <div className="px-5 py-4" style={{ background: "rgba(34,197,94,0.02)", borderTop: "1px solid #2d3142" }}>
                    <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
            <div className="text-center mt-8">
              <p className="text-xs" style={{ color: "#6b7280" }}>
                ¿Más preguntas? Escríbenos a{" "}
                <a href="mailto:empresas@buscaycurra.es" className="underline" style={{ color: "#22c55e" }}>
                  empresas@buscaycurra.es
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Para ETTs */}
        <section className="py-12 px-6" style={{ background: "rgba(245,158,11,0.04)", borderTop: "1px solid rgba(245,158,11,0.12)", borderBottom: "1px solid rgba(245,158,11,0.12)" }}>
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-2" style={{ color: "#f59e0b" }}>¿Eres una ETT o consultora de RRHH?</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                Ves a todos los candidatos que han activado «Visible para empresas», los buscas por ciudad y
                perfil y abres el contacto y el CV completo de hasta {CANDIDATOS_MES} al mes —{" "}
                <strong style={{ color: "#f1f5f9" }}>49,99€/mes, sin coste por candidato.</strong>
              </p>
            </div>
            <Link href="/precios"
              className="flex-shrink-0 text-sm font-semibold px-6 py-3 rounded-xl transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff" }}>
              Ver plan Empresa →
            </Link>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-24 px-6 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3" style={{ color: "#f1f5f9" }}>
              Empieza a contratar diferente
            </h2>
            <p className="text-sm mb-2" style={{ color: "#22c55e" }}>Candidatos reales que han pedido que les encuentren.</p>
            <p className="text-xs mb-8" style={{ color: "#64748b" }}>Mira sus perfiles sin nombre antes de pagar.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/empresas/candidatos"
                className="text-sm font-semibold py-3.5 px-10 rounded-xl transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}>
                Ver candidatos gratis →
              </Link>
              <Link href="/empresas/publicar"
                className="text-sm font-medium py-3.5 px-8 rounded-xl transition hover:bg-[#1e212b]"
                style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
                Mandar una oferta
              </Link>
            </div>
          </div>
        </section>

      </main>

      <footer className="py-6 px-6 text-center" style={{ background: "#0a0c10", borderTop: "1px solid rgba(45,49,66,0.5)" }}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-[11px]" style={{ color: "#2d3142" }}>
          <Link href="/" className="hover:opacity-80">← Volver a BuscayCurra</Link>
          <span className="hidden sm:block">·</span>
          <Link href="/empresas/publicar" className="hover:opacity-80">Mandar una oferta gratis</Link>
          <span className="hidden sm:block">·</span>
          <Link href="/precios" className="hover:opacity-80">Planes y precios</Link>
        </div>
      </footer>
    </div>
  );
}
