import type { Metadata } from "next";
import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";
import { NUM_PAISES } from "@/lib/paises";
import FondoOleaje from "@/components/FondoOleaje";
import { Target, Lock, Zap, Globe2, Search, Sparkles, Mail, BarChart3 } from "lucide-react";
import { IconoCirculo, type Tono } from "@/components/neon/Neon";

export const metadata: Metadata = {
  title: "Sobre nosotros — BuscayCurra | El agente IA que busca trabajo por ti",
  description: `BuscayCurra es la plataforma de empleo con IA que automatiza tu búsqueda de trabajo en ${NUM_PAISES} países. Conoce nuestra historia, misión y el equipo detrás de Guzzi.`,
};

const VALORES = [
  { Icono: Target, tono: "lima" as Tono, titulo: "Honestidad radical", desc: "No prometemos lo que no podemos cumplir. Si una oferta no encaja con tu perfil, Guzzi te lo dice." },
  { Icono: Lock, tono: "azul" as Tono, titulo: "Tu privacidad primero", desc: "Tus datos son tuyos. No los vendemos, no los compartimos. Los borramos cuando nos lo pides." },
  { Icono: Zap, tono: "ambar" as Tono, titulo: "Automatización con criterio", desc: "Automatizamos lo repetitivo — no la decisión. Tú siempre tienes el control de qué se envía y a quién." },
  { Icono: Globe2, tono: "morado" as Tono, titulo: "Empleo sin fronteras", desc: "El mercado laboral es global. BuscayCurra también. Buscamos trabajo donde hay trabajo, no solo donde hay portales." },
];

const HITOS = [
  { año: "2024", texto: "Nace BuscayCurra con la idea de que buscar trabajo no debería ser un trabajo en sí mismo." },
  { año: "2025", texto: "Lanzamos Guzzi, el asistente IA que envía candidaturas personalizadas automáticamente." },
  { año: "2026", texto: `Superamos los dos millones de ofertas activas en ${NUM_PAISES} países.` },
];

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      {/* El fondo de oleaje de toda la aplicación (diseño de neón, 8 nov 2026) */}
      <FondoOleaje />
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{ background: "rgba(6,9,11,0.82)", borderBottom: "1px solid rgba(163,230,53,0.12)", backdropFilter: "blur(10px)" }}
      >
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoGusano size={26} />
            <span className="font-extrabold text-sm"><span style={{ color: "#f8fafc" }}>Buscay</span><span className="texto-neon">Curra</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm" style={{ color: "#8b98ad" }}>Entrar</Link>
            <Link
              href="/auth/registro"
              className="text-sm font-semibold px-4 py-2 rounded-full"
              style={{ background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406" }}
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <LogoGusano size={72} animated />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.08] mb-4" style={{ color: "#f8fafc" }}>
            Buscar trabajo no debería<br />
            <span className="texto-neon">ser otro trabajo.</span>
          </h1>
          <p className="text-base leading-relaxed max-w-xl mx-auto" style={{ color: "#94a3b8" }}>
            BuscayCurra nació de una frustración real: miles de CVs enviados manualmente,
            semanas sin respuesta, portales desactualizados y procesos que no han cambiado en 20 años.
            Decidimos que había una forma mejor.
          </p>
        </div>

        {/* Misión */}
        <section className="mb-16">
          <div
            className="cristal tono-lima p-8"
          >
            <h2 className="text-lg font-bold mb-3" style={{ color: "#bef264" }}>Nuestra misión</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
              Democratizar el acceso al empleo de calidad usando inteligencia artificial.
              Que un trabajador en Sevilla tenga las mismas oportunidades de encontrar trabajo en Berlín
              o Sydney que alguien que lleva años en esa industria. Que el talento llegue donde más se necesita,
              sin que el proceso de búsqueda sea el obstáculo.
            </p>
          </div>
        </section>

        {/* Qué es Guzzi */}
        <section className="mb-16">
          <h2 className="text-xl font-bold mb-6" style={{ color: "#f1f5f9" }}>Guzzi, tu agente de empleo</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { Icono: Search, tono: "azul" as Tono, titulo: "Busca por ti", desc: `Escanea millones de ofertas en ${NUM_PAISES} países cada 6 horas. Filtra por tu perfil, sector y salario esperado.` },
              { Icono: Sparkles, tono: "ambar" as Tono, titulo: "Mejora tu CV", desc: "Analiza tu currículum con IA, te dice qué le falta para cada oferta y lo traduce a 6 idiomas si buscas fuera." },
              { Icono: Mail, tono: "verde" as Tono, titulo: "Envía candidaturas", desc: "Envía tu CV automáticamente con carta personalizada para cada empresa. Tú solo vas a la entrevista." },
              { Icono: BarChart3, tono: "morado" as Tono, titulo: "Seguimiento en tiempo real", desc: "Pipeline visual de todas tus candidaturas: enviada, abierta, en revisión, entrevista. Sin agujeros negros." },
            ].map((s) => (
              <div key={s.titulo} className={`cristal tono-${s.tono} p-5`}>
                <div className="mb-3"><IconoCirculo Icono={s.Icono} tono={s.tono} size={40} /></div>
                <h3 className="text-sm font-bold mb-2" style={{ color: "#f1f5f9" }}>{s.titulo}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#8b98ad" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Hitos */}
        <section className="mb-16">
          <h2 className="text-xl font-bold mb-6" style={{ color: "#f1f5f9" }}>Nuestra historia</h2>
          <div className="space-y-4">
            {HITOS.map((h) => (
              <div key={h.año} className="flex items-start gap-4">
                <span
                  className="text-sm font-extrabold flex-shrink-0 w-12 text-right"
                  style={{ color: "#bef264" }}
                >
                  {h.año}
                </span>
                <div
                  className="w-px flex-shrink-0 mt-1.5"
                  style={{ height: "40px", background: "rgba(163,230,53,0.35)" }}
                />
                <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{h.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Valores */}
        <section className="mb-16">
          <h2 className="text-xl font-bold mb-6" style={{ color: "#f1f5f9" }}>Lo que nos guía</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {VALORES.map((v) => (
              <div key={v.titulo} className={`cristal tono-${v.tono} p-5`}>
                <div className="mb-3"><IconoCirculo Icono={v.Icono} tono={v.tono} size={40} /></div>
                <h3 className="text-sm font-bold mb-1" style={{ color: "#f1f5f9" }}>{v.titulo}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#8b98ad" }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contacto */}
        <section className="mb-16 text-center">
          <h2 className="text-xl font-bold mb-3" style={{ color: "#f1f5f9" }}>¿Hablamos?</h2>
          <p className="text-sm mb-6" style={{ color: "#8b98ad" }}>
            Para prensa, colaboraciones o simplemente para contarnos tu experiencia.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:hola@buscaycurra.es"
              className="text-sm font-semibold px-6 min-h-[48px] inline-flex items-center justify-center rounded-full"
              style={{ background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406" }}
            >
              hola@buscaycurra.es
            </a>
            <Link
              href="/app/ayuda"
              className="text-sm font-semibold px-6 min-h-[48px] inline-flex items-center justify-center rounded-full"
              style={{ border: "1px solid rgba(148,163,184,0.18)", color: "#94a3b8" }}
            >
              Centro de ayuda →
            </Link>
          </div>
        </section>

        {/* CTA */}
        <div
          className="cristal tono-lima p-8 text-center"
        >
          <h2 className="text-xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
            Tu próximo trabajo ya existe.
          </h2>
          <p className="text-sm mb-6" style={{ color: "#8b98ad" }}>
            Guzzi lo encuentra mientras tú descansas.
          </p>
          <Link
            href="/auth/registro"
            className="inline-flex items-center justify-center min-h-[48px] text-sm font-semibold px-8 rounded-full"
            style={{ background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406" }}
          >
            Activar Guzzi gratis →
          </Link>
          <p className="mt-3 text-xs" style={{ color: "#8b98ad" }}>Sin tarjeta de crédito. En 30 segundos.</p>
        </div>
      </main>

      <footer className="py-8 px-6 text-center" style={{ borderTop: "1px solid rgba(45,49,66,0.4)" }}>
        <div className="flex flex-wrap gap-4 justify-center text-xs" style={{ color: "#8b98ad" }}>
          {[
            { href: "/", label: "Inicio" },
            { href: "/precios", label: "Precios" },
            { href: "/app/ayuda", label: "Ayuda" },
            { href: "/privacidad", label: "Privacidad" },
            { href: "/terminos", label: "Términos" },
            { href: "/aviso-legal", label: "Aviso Legal" },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="hover:underline">{l.label}</Link>
          ))}
        </div>
        <p className="mt-4 text-xs" style={{ color: "#8b98ad" }}>
          © {new Date().getFullYear()} BuscayCurra. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
