"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";

// ─── Datos de la landing ──────────────────────────────────────────────────────

const pasos = [
  { num: "01", titulo: "Crea tu perfil", desc: "30 segundos. Sin tarjeta. Empieza tu aventura con Guzzi.", icon: "✨", color: "#7ed56f", detalle: "Tu aventura comienza aquí" },
  { num: "02", titulo: "Sube tu CV", desc: "Nuestra IA lo analiza y mejora automáticamente para cada sector", icon: "📄", color: "#f0c040", detalle: "Guzzi perfecciona tu CV 🐛" },
  { num: "03", titulo: "Busca ofertas", desc: "Miles de ofertas en toda España filtradas por zona y sector", icon: "🔍", color: "#e07850", detalle: "Guzzi escanea el mercado 🎯" },
  { num: "04", titulo: "Envía candidaturas", desc: "Automáticamente a cientos de empresas. Tú descansas.", icon: "📧", color: "#a070d0", detalle: "Guzzi trabaja por ti 🐛" },
  { num: "05", titulo: "¡Encuentra trabajo!", desc: "Empleo directo. Sin intermediarios. Tu salario completo.", icon: "🎉", color: "#ff6090", detalle: "¡Lo conseguiste! 🎉" },
];

const superpotencias = [
  { icon: "🧠", titulo: "Tu CV, mejorado y listo para descargar", desc: "Nuestra IA analiza tu currículum, lo adapta a cada sector y oferta, corrige errores y lo optimiza para pasar los filtros ATS de las empresas. En segundos tienes una versión profesional lista para descargar en PDF.", acento: "#7ed56f" },
  { icon: "🎯", titulo: "Entrevistas simuladas adaptadas a cada empresa", desc: "Antes de ir a una entrevista, practica con nuestra IA que conoce los valores, cultura y preguntas típicas de esa empresa específica. No es una entrevista genérica — es exactamente lo que te van a preguntar.", acento: "#f0c040" },
  { icon: "⚡", titulo: "Enviamos tu CV cuando más probabilidades tienes", desc: "Analizamos el horario de actividad de cada empresa: cuándo abren el email, cuándo está el responsable de RRHH, si trabajan en turno de noche. Tu CV llega en el momento exacto en que hay alguien para leerlo.", acento: "#a070d0" },
];

const testimonios = [
  { nombre: "María G.", ciudad: "Madrid", puesto: "Diseñadora gráfica", empresa: "Agencia creativa", texto: "Llevaba 4 meses en InfoJobs sin respuesta. Con BuscayCurra en 3 semanas tenía 4 entrevistas. La diferencia es que aquí mi CV llegaba personalizado, no era uno más." },
  { nombre: "Carlos R.", ciudad: "Barcelona", puesto: "Programador junior", empresa: "Startup tech", texto: "La función de entrevista con IA me salvó. Me preguntaron exactamente lo que había practicado con BuscayCurra. En LinkedIn no tenía ni idea de cómo prepararme." },
  { nombre: "Ana M.", ciudad: "Valencia", puesto: "Administrativa", empresa: "Empresa logística", texto: "En Indeed mandé el mismo CV 60 veces y nadie me llamó. Aquí mandé a 200 empresas con CV adaptado y tuve respuesta de 47. No es magia, es personalización." },
  { nombre: "Pedro L.", ciudad: "Sevilla", puesto: "Electricista", empresa: "Instalaciones industriales", texto: "Me sorprendió que encontrara empresas de mi sector que yo ni conocía. Y el CV adaptado a cada una marcó la diferencia. En Tecnoempleo no tenía ni esa opción." },
  { nombre: "Laura T.", ciudad: "Bilbao", puesto: "Enfermera", empresa: "Clínica privada", texto: "El envío inteligente es real. Me llamaron a las 9:01 de la mañana, justo cuando el jefe de personal llegaba. InfoJobs no sabe ni qué hora es en esa empresa." },
  { nombre: "Javi S.", ciudad: "Zaragoza", puesto: "Mecánico", empresa: "Taller oficial", texto: "En LinkedIn Premium pagaba 39€ al mes y nadie me veía. Con 9,99€ aquí, Guzzi mandaba mi CV cada día. Encontré trabajo en 3 semanas." },
];


const particulas = [
  { w:5, h:5, l:8, t:15, c:"#7ed56f", o:0.18, d:5.2, del:0.3 },
  { w:4, h:4, l:23, t:42, c:"#f0c040", o:0.15, d:6.1, del:1.2 },
  { w:6, h:6, l:45, t:8,  c:"#8b6f47", o:0.12, d:4.8, del:0.7 },
  { w:3, h:3, l:62, t:65, c:"#7ed56f", o:0.20, d:5.5, del:2.1 },
  { w:5, h:5, l:78, t:30, c:"#f0c040", o:0.14, d:7.0, del:0.5 },
  { w:4, h:4, l:88, t:75, c:"#8b6f47", o:0.16, d:4.3, del:1.8 },
  { w:6, h:6, l:12, t:80, c:"#7ed56f", o:0.13, d:6.7, del:2.5 },
  { w:3, h:3, l:35, t:55, c:"#f0c040", o:0.17, d:5.9, del:0.9 },
  { w:5, h:5, l:55, t:88, c:"#7ed56f", o:0.11, d:4.6, del:1.5 },
  { w:4, h:4, l:70, t:12, c:"#8b6f47", o:0.15, d:6.3, del:3.0 },
  { w:6, h:6, l:92, t:48, c:"#7ed56f", o:0.19, d:5.1, del:0.2 },
  { w:3, h:3, l:18, t:25, c:"#f0c040", o:0.14, d:7.2, del:1.0 },
];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    getSupabaseBrowser().auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/app/bienvenida");
      } else {
        setVerificando(false);
      }
    });
  }, [router]);

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1a0a" }}>
        <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid rgba(126,213,111,0.2)", borderTopColor: "#7ed56f" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0f1a0a 0%, #1a1a12 15%, #15200e 50%, #1a1a12 85%, #0f1a0a 100%)" }}>

      {/* ── Fondo vivo ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          background: `radial-gradient(ellipse 800px 600px at 15% 20%, rgba(126,213,111,0.08) 0%, transparent 70%),
                       radial-gradient(ellipse 600px 800px at 85% 70%, rgba(139,111,71,0.06) 0%, transparent 70%),
                       radial-gradient(ellipse 500px 500px at 50% 50%, rgba(240,192,64,0.04) 0%, transparent 60%)` }} />
        <svg className="absolute top-0 left-0 w-full h-full opacity-[0.07]" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <path d="M-20 80 Q100 120 200 60 Q300 10 400 50 Q450 70 500 30" stroke="#7ed56f" strokeWidth="2" fill="none" />
          <ellipse cx="170" cy="10" rx="12" ry="6" fill="#7ed56f" transform="rotate(-30 170 10)" />
          <ellipse cx="290" cy="-15" rx="10" ry="5" fill="#5cb848" transform="rotate(-45 290 -15)" />
          <path d="M1460 750 Q1300 720 1200 780 Q1100 830 1000 800 Q920 780 850 810" stroke="#8b6f47" strokeWidth="2" fill="none" />
          <ellipse cx="1240" cy="840" rx="12" ry="6" fill="#7ed56f" transform="rotate(40 1240 840)" />
        </svg>
        {particulas.map((p, i) => (
          <div key={i} className="absolute rounded-full"
            style={{ width: p.w, height: p.h, left: `${p.l}%`, top: `${p.t}%`,
              background: p.c, opacity: p.o,
              animation: `float-gentle ${p.d}s ease-in-out ${p.del}s infinite` }} />
        ))}
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50" style={{ background: "rgba(15,26,10,0.92)", borderBottom: "1px solid rgba(126,213,111,0.12)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoGusano size={34} animated />
            <span className="font-bold text-lg" style={{ color: "#7ed56f" }}>BuscayCurra</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="px-4 py-2 text-sm font-medium" style={{ color: "#b0a890" }}>Entrar</Link>
            <Link href="/auth/registro" className="btn-game text-sm !py-2 !px-5">🌱 Empezar</Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">

        {/* ── HERO ── */}
        <section className="relative py-20 md:py-28 px-4 overflow-hidden">

          <div className="max-w-4xl mx-auto text-center relative">
            <div className="flex justify-center mb-8">
              <div className="animate-float" style={{ filter: "drop-shadow(0 12px 30px rgba(126,213,111,0.3))" }}>
                <LogoGusano size={110} animated />
              </div>
            </div>
            <div className="flex justify-center mb-5">
              <span className="badge-game badge-verde text-xs">🌱 +2.400 personas ya evolucionando</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-6">
              <span style={{ color: "#f0ebe0" }}>Tu trabajo </span>
              <span style={{ background: "linear-gradient(135deg, #7ed56f 0%, #f0c040 50%, #e07850 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                te está esperando
              </span>
            </h1>
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: "#b0a890" }}>
              IA que mejora tu CV, encuentra ofertas y envía candidaturas por ti. Tú solo apruebas. En semanas, no meses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/registro" className="btn-game text-lg !py-4 !px-10">
                🐛 Comenzar gratis — sin tarjeta
              </Link>
              <Link href="/auth/login" className="px-8 py-4 rounded-xl text-sm font-medium transition"
                style={{ border: "1px solid rgba(126,213,111,0.25)", color: "#b0a890", background: "rgba(126,213,111,0.04)" }}>
                Ya tengo cuenta → Entrar
              </Link>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
              {[
                { num: "2.400+", label: "personas en activo" },
                { num: "400K+", label: "ofertas en España" },
                { num: "2,99€", label: "al mes para empezar" },
                { num: "2,99€", label: "vs 39€/mes de InfoJobs Premium" },
              ].map((s) => (
                <div key={s.label} className="card-game p-4 text-center">
                  <p className="text-2xl font-black" style={{ color: "#7ed56f" }}>{s.num}</p>
                  <p className="text-xs mt-1" style={{ color: "#706a58" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3 SUPERPOTENCIAS ── */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3" style={{ color: "#f0ebe0" }}>
              Nuestras 3 superpotencias
            </h2>
            <p className="text-center mb-14" style={{ color: "#706a58" }}>Tres herramientas reales que cambian el resultado de tu búsqueda.</p>
            <div className="grid md:grid-cols-3 gap-6">
              {superpotencias.map((s) => (
                <div key={s.titulo} className="card-game p-7 relative">
                  <div className="absolute top-4 right-4">
                    <span className="badge-game badge-verde text-[10px]">✓ Disponible ya</span>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-5"
                    style={{ background: `${s.acento}18`, border: `2px solid ${s.acento}40` }}>
                    {s.icon}
                  </div>
                  <h3 className="text-base font-bold mb-3 leading-snug" style={{ color: "#f0ebe0" }}>{s.titulo}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#b0a890" }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PASOS ── */}
        <section className="py-20 px-4 relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: "#f0ebe0" }}>
              Tu camino con Guzzi
            </h2>
            <p className="text-center mb-16" style={{ color: "#706a58" }}>5 pasos. Guzzi trabaja, tú consigues el trabajo.</p>
            <div className="space-y-8">
              {pasos.map((paso, i) => (
                <div key={paso.num} className={`flex items-start gap-6 flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black"
                      style={{ background: `linear-gradient(135deg, ${paso.color}20, ${paso.color}40)`, border: `2px solid ${paso.color}50`, color: paso.color }}>
                      {paso.num}
                    </div>
                  </div>
                  <div className="card-game p-6 flex-1 max-w-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{paso.icon}</span>
                      <h3 className="text-lg font-bold" style={{ color: paso.color }}>{paso.titulo}</h3>
                    </div>
                    <p className="text-sm leading-relaxed mb-2" style={{ color: "#b0a890" }}>{paso.desc}</p>
                    <span className="text-xs font-medium" style={{ color: "#706a58" }}>{paso.detalle}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARATIVA vs portales ── */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ color: "#f0ebe0" }}>
              InfoJobs, LinkedIn, Indeed… te tienen en una fila.
            </h2>
            <p className="text-center mb-12" style={{ color: "#706a58" }}>Tú aplicas. Ellos esperan. Guzzi trabaja por ti cada día.</p>
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(15,26,10,0.6)", border: "1px solid rgba(126,213,111,0.12)" }}>
              <div className="grid grid-cols-3 text-center text-sm font-bold py-4 px-4"
                style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(126,213,111,0.1)" }}>
                <div style={{ color: "#706a58" }}>Aspecto</div>
                <div style={{ color: "#e07850" }}>InfoJobs / LinkedIn</div>
                <div style={{ color: "#7ed56f" }}>BuscayCurra</div>
              </div>
              {[
                { concepto: "Quién aplica por ti", ellos: "Tú, a mano, oferta por oferta", byc: "Guzzi aplica por ti solo" },
                { concepto: "CV personalizado", ellos: "El mismo para todas", byc: "Adaptado por IA a cada oferta" },
                { concepto: "Tu CV entre otros", ellos: "Entre 200-2.000 candidatos", byc: "Llega en el momento exacto" },
                { concepto: "Seguimiento", ellos: "No sabes si lo leyeron", byc: "Ves cada envío en tiempo real" },
                { concepto: "Prep. entrevista", ellos: "Ninguna ayuda", byc: "Simulacro con IA por empresa" },
                { concepto: "Fuentes de ofertas", ellos: "Solo las de ese portal", byc: "+400.000 de Jooble, Careerjet…" },
                { concepto: "Precio real", ellos: "Gratis (inútil) o 39€/mes", byc: "Desde 2,99€/mes" },
              ].map((fila, i) => (
                <div key={fila.concepto} className="grid grid-cols-3 text-center text-sm py-4 px-4 items-center gap-2"
                  style={{ background: i % 2 === 0 ? "rgba(126,213,111,0.02)" : "transparent", borderBottom: "1px solid rgba(126,213,111,0.05)" }}>
                  <div className="font-medium text-left text-xs md:text-sm" style={{ color: "#b0a890" }}>{fila.concepto}</div>
                  <div className="flex items-center justify-center gap-1 text-xs md:text-sm" style={{ color: "#e07850" }}>❌ {fila.ellos}</div>
                  <div className="flex items-center justify-center gap-1 text-xs md:text-sm" style={{ color: "#7ed56f" }}>✅ {fila.byc}</div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/auth/registro" className="btn-game text-base !py-4 !px-10">Empieza gratis — Guzzi trabaja por ti</Link>
            </div>
          </div>
        </section>


        {/* ── PRECIOS ── */}
        <section className="py-20 px-4" style={{ background: "rgba(15,26,10,0.5)" }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3" style={{ color: "#f0ebe0" }}>Planes simples</h2>
            <p className="text-center mb-14" style={{ color: "#706a58" }}>Empieza gratis. Evoluciona cuando quieras.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { nombre: "Gratis", precio: "0€", periodo: "", emoji: "🥚", desc: "Para probar", items: ["2 CVs/día", "Buscador básico", "Sin tarjeta"], dest: false, badge: null },
                { nombre: "Esencial", precio: "2,99€", periodo: "/mes", emoji: "🌱", desc: "Menos que un café", items: ["5 CVs/día", "IA básica", "Historial completo"], dest: true, badge: "🔥 Más elegido" },
                { nombre: "Pro", precio: "9,99€", periodo: "/mes", emoji: "🐛", desc: "Para encontrar trabajo", items: ["10 CVs/día", "IA avanzada", "Estadísticas", "Soporte"], dest: false, badge: "⭐ Popular" },
                { nombre: "Empresa", precio: "49,99€", periodo: "/mes", emoji: "🚀", desc: "Sin límites", items: ["Envíos ilimitados", "Todo incluido", "Multi-usuarios", "API"], dest: false, badge: null },
              ].map((plan) => (
                <div key={plan.nombre} className={`card-game p-6 text-center relative ${plan.dest ? "scale-[1.03]" : ""}`}
                  style={plan.dest ? { borderColor: "#7ed56f", boxShadow: "0 0 40px rgba(126,213,111,0.12)" } : {}}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="badge-game badge-dorado text-[10px]">{plan.badge}</span>
                    </div>
                  )}
                  <div className="text-3xl mb-2">{plan.emoji}</div>
                  <h3 className="text-base font-bold" style={{ color: "#f0ebe0" }}>{plan.nombre}</h3>
                  <p className="text-[11px] mb-3" style={{ color: "#706a58" }}>{plan.desc}</p>
                  <div className="mb-4">
                    <span className="text-2xl font-black" style={{ color: plan.dest ? "#7ed56f" : "#f0ebe0" }}>{plan.precio}</span>
                    <span className="text-xs" style={{ color: "#706a58" }}>{plan.periodo}</span>
                  </div>
                  <ul className="space-y-1.5 mb-5 text-left">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs" style={{ color: "#b0a890" }}>
                        <span style={{ color: "#7ed56f" }}>✓</span>{item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/registro" className={plan.dest ? "btn-game w-full block text-center text-sm" : "btn-game-outline w-full block text-center text-sm"}>
                    Empezar
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIOS ── */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3" style={{ color: "#f0ebe0" }}>
              Personas que ya encontraron trabajo con Guzzi
            </h2>
            <p className="text-center mb-14" style={{ color: "#706a58" }}>Empezaron como tú. Guzzi los ayudó a llegar.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonios.map((t) => (
                <div key={t.nombre} className="card-game p-6 flex flex-col gap-3">
                  <div className="text-4xl font-black leading-none" style={{ color: "rgba(126,213,111,0.25)" }}>"</div>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: "#f0ebe0" }}>{t.texto}</p>
                  <div className="pt-3" style={{ borderTop: "1px solid rgba(126,213,111,0.1)" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold" style={{ color: "#7ed56f" }}>{t.nombre} · {t.ciudad}</p>
                        <p className="text-xs" style={{ color: "#706a58" }}>{t.puesto} — {t.empresa}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl">🐛</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="py-24 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center mb-6 animate-float">
              <div style={{ filter: "drop-shadow(0 8px 24px rgba(126,213,111,0.3))" }}>
                <LogoGusano size={80} animated />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#f0ebe0" }}>
              ¿Listo para encontrar <span style={{ color: "#7ed56f" }}>tu trabajo</span>?
            </h2>
            <p className="mb-8 text-lg" style={{ color: "#b0a890" }}>
              Miles de personas ya trabajan con Guzzi. Es tu turno.
            </p>
            <Link href="/auth/registro" className="btn-game text-lg !py-4 !px-12">
              🐛 Comenzar ahora — Es gratis
            </Link>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-4" style={{ backgroundColor: "#0d0d08", borderTop: "1px solid rgba(126,213,111,0.08)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <LogoGusano size={24} />
              <span className="font-bold text-sm" style={{ color: "#7ed56f" }}>BuscayCurra</span>
            </div>
            <div className="flex flex-wrap gap-5 text-sm">
              <Link href="/auth/login" style={{ color: "#706a58" }}>Entrar</Link>
              <Link href="/auth/registro" style={{ color: "#706a58" }}>Registro</Link>
              <Link href="/precios" style={{ color: "#706a58" }}>Precios</Link>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(126,213,111,0.06)" }}>
            <div className="flex flex-wrap gap-4 text-xs">
              <Link href="/aviso-legal" style={{ color: "#504a3a" }}>Aviso Legal</Link>
              <Link href="/privacidad" style={{ color: "#504a3a" }}>Privacidad</Link>
              <Link href="/terminos" style={{ color: "#504a3a" }}>Términos</Link>
              <Link href="/cookies" style={{ color: "#504a3a" }}>Cookies</Link>
            </div>
            <span className="text-[10px]" style={{ color: "#3a3628" }}>© {new Date().getFullYear()} BuscayCurra</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
