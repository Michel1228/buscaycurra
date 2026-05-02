"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";

// ─── Datos de la landing ──────────────────────────────────────────────────────

const pasos = [
  { num: "01", titulo: "Crea tu perfil", desc: "30 segundos. Sin tarjeta. Empiezas como un huevo 🥚", icon: "✨", color: "#7ed56f", detalle: "Tu aventura comienza aquí" },
  { num: "02", titulo: "Sube tu CV", desc: "Nuestra IA lo analiza y mejora automáticamente para cada sector", icon: "📄", color: "#f0c040", detalle: "Te conviertes en oruga 🐛" },
  { num: "03", titulo: "Busca ofertas", desc: "Miles de ofertas en toda España filtradas por zona y sector", icon: "🔍", color: "#e07850", detalle: "Empiezas tu capullo 🫘" },
  { num: "04", titulo: "Envía candidaturas", desc: "Automáticamente a cientos de empresas. Tú descansas.", icon: "📧", color: "#a070d0", detalle: "Alas abriéndose 🦋" },
  { num: "05", titulo: "¡Encuentra trabajo!", desc: "Tu mariposa se revela. 50 especies únicas esperan.", icon: "🎉", color: "#ff6090", detalle: "¡Metamorfosis completa! ✨" },
];

const superpotencias = [
  { icon: "🧠", titulo: "Tu CV, mejorado y listo para descargar", desc: "Nuestra IA analiza tu currículum, lo adapta a cada sector y oferta, corrige errores y lo optimiza para pasar los filtros ATS de las empresas. En segundos tienes una versión profesional lista para descargar en PDF.", acento: "#7ed56f" },
  { icon: "🎯", titulo: "Entrevistas simuladas adaptadas a cada empresa", desc: "Antes de ir a una entrevista, practica con nuestra IA que conoce los valores, cultura y preguntas típicas de esa empresa específica. No es una entrevista genérica — es exactamente lo que te van a preguntar.", acento: "#f0c040" },
  { icon: "⚡", titulo: "Enviamos tu CV cuando más probabilidades tienes", desc: "Analizamos el horario de actividad de cada empresa: cuándo abren el email, cuándo está el responsable de RRHH, si trabajan en turno de noche. Tu CV llega en el momento exacto en que hay alguien para leerlo.", acento: "#a070d0" },
];

const comparativaFilas = [
  { concepto: "Coste mensual", ett: "~150€/mes en comisiones", byc: "9,99€/mes" },
  { concepto: "Control sobre tu búsqueda", ett: "La ETT decide por ti", byc: "Tú decides siempre" },
  { concepto: "Empresas a las que llegas", ett: "Solo las que trabajan con esa ETT", byc: "Cualquier empresa de España" },
  { concepto: "Adaptación de CV", ett: "CV genérico para todas", byc: "CV adaptado a cada oferta" },
  { concepto: "Entrevistas", ett: "Sin preparación", byc: "Simulacro con IA por empresa" },
  { concepto: "Transparencia", ett: "No sabes qué hacen con tu perfil", byc: "Ves cada envío en tiempo real" },
  { concepto: "Horario de envío", ett: "El que les conviene", byc: "El mejor momento para cada empresa" },
  { concepto: "Ahorro en 12 meses", ett: "Pagas ~1.800€ en comisiones", byc: "Pagas 119,88€. Ahorras ~1.680€" },
];

const testimonios = [
  { nombre: "María G.", ciudad: "Madrid", puesto: "Diseñadora gráfica", empresa: "Agencia creativa", mariposa: "Morpho Azul", texto: "En 3 semanas tenía 4 entrevistas. La ETT con la que estaba tardó 2 meses en conseguirme una sola." },
  { nombre: "Carlos R.", ciudad: "Barcelona", puesto: "Programador junior", empresa: "Startup tech", mariposa: "Atlas", texto: "La función de entrevista con IA me salvó. Me preguntaron exactamente lo que había practicado con BuscayCurra." },
  { nombre: "Ana M.", ciudad: "Valencia", puesto: "Administrativa", empresa: "Empresa logística", mariposa: "Monarca", texto: "Nunca pensé que un software podría mejorar tanto mi CV. Lo mandé a 200 empresas y tuve respuesta de 47." },
  { nombre: "Pedro L.", ciudad: "Sevilla", puesto: "Electricista", empresa: "Instalaciones industriales", mariposa: "Cola de Golondrina", texto: "Me sorprendió que encontrara empresas de mi sector que yo no conocía. Y el CV adaptado a cada una marcó la diferencia." },
  { nombre: "Laura T.", ciudad: "Bilbao", puesto: "Enfermera", empresa: "Clínica privada", mariposa: "Polilla Luna", texto: "El envío inteligente es real. Me llamaron a las 9:01 de la mañana, justo cuando el jefe de personal llegaba a la clínica." },
  { nombre: "Javi S.", ciudad: "Zaragoza", puesto: "Mecánico", empresa: "Taller oficial", mariposa: "Glasswing", texto: "Ahorré 1.600€ en comisiones de ETT. Y encontré trabajo en menos tiempo. No tiene ningún sentido seguir usando ETTs." },
];

const especies = [
  { nombre: "Morpho Azul", color: "#1a6bff", rareza: "Épica" },
  { nombre: "Monarca", color: "#e8720c", rareza: "Rara" },
  { nombre: "Atlas", color: "#c45a20", rareza: "Legendaria" },
  { nombre: "Polilla Luna", color: "#90eebf", rareza: "Épica" },
  { nombre: "Cola de Golondrina", color: "#f0e040", rareza: "Rara" },
  { nombre: "Glasswing", color: "#d0d0d0", rareza: "Rara" },
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
          <div className="absolute right-0 top-10 opacity-[0.06] pointer-events-none hidden md:block" style={{ width: "500px", height: "500px" }}>
            <svg viewBox="0 0 200 160" fill="none" style={{ width: "100%", height: "100%" }}>
              <path d="M100 80 C75 45 15 10 10 55 C5 85 55 100 100 90Z" fill="#7ed56f" />
              <path d="M100 80 C125 45 185 10 190 55 C195 85 145 100 100 90Z" fill="#5cb848" />
              <path d="M100 88 C78 92 25 100 30 130 C35 150 75 145 100 120Z" fill="#7ed56f" opacity="0.8" />
              <path d="M100 88 C122 92 175 100 170 130 C165 150 125 145 100 120Z" fill="#5cb848" opacity="0.8" />
              <ellipse cx="100" cy="100" rx="6" ry="30" fill="#3a5a2a" />
            </svg>
          </div>

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
                🦋 Comenzar gratis — sin tarjeta
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
                { num: "9,99€", label: "al mes, todo incluido" },
                { num: "1.680€", label: "ahorro vs ETT / año" },
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
              Tu camino: de oruga a mariposa
            </h2>
            <p className="text-center mb-16" style={{ color: "#706a58" }}>5 pasos. Como un juego, pero de verdad funciona.</p>
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

        {/* ── COMPARATIVA ETT vs BuscayCurra ── */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ color: "#f0ebe0" }}>
              ¿ETT o BuscayCurra? Haz los números.
            </h2>
            <p className="text-center mb-12" style={{ color: "#706a58" }}>Lo que ganas y pierdes en 12 meses. Los datos no mienten.</p>
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(15,26,10,0.6)", border: "1px solid rgba(126,213,111,0.12)" }}>
              <div className="grid grid-cols-3 text-center text-sm font-bold py-4 px-4" style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(126,213,111,0.1)" }}>
                <div style={{ color: "#706a58" }}>Aspecto</div>
                <div style={{ color: "#e07850" }}>ETT</div>
                <div style={{ color: "#7ed56f" }}>BuscayCurra</div>
              </div>
              {comparativaFilas.map((fila, i) => (
                <div key={fila.concepto} className="grid grid-cols-3 text-center text-sm py-4 px-4 items-center gap-2"
                  style={{ background: i % 2 === 0 ? "rgba(126,213,111,0.02)" : "transparent", borderBottom: "1px solid rgba(126,213,111,0.05)" }}>
                  <div className="font-medium text-left text-xs md:text-sm" style={{ color: "#b0a890" }}>{fila.concepto}</div>
                  <div className="flex items-center justify-center gap-1 text-xs md:text-sm" style={{ color: "#e07850" }}>❌ {fila.ett}</div>
                  <div className="flex items-center justify-center gap-1 text-xs md:text-sm" style={{ color: "#7ed56f" }}>✅ {fila.byc}</div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/auth/registro" className="btn-game text-base !py-4 !px-10">Empieza gratis — Sin comisiones</Link>
            </div>
          </div>
        </section>

        {/* ── ESPECIES ── */}
        <section className="py-20 px-4" style={{ background: "linear-gradient(180deg, transparent, rgba(126,213,111,0.03), transparent)" }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3" style={{ color: "#f0ebe0" }}>50 especies te esperan</h2>
            <p className="text-center mb-12" style={{ color: "#706a58" }}>Cada usuario tiene una mariposa única. ¿Cuál será la tuya?</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {especies.map((esp) => (
                <div key={esp.nombre} className="card-game p-4 text-center">
                  <div className="mx-auto mb-3 w-16 h-14 flex items-center justify-center">
                    <svg viewBox="0 0 80 64" width="64" height="52" style={{ filter: `drop-shadow(0 2px 8px ${esp.color}40)` }}>
                      <path d="M40 32 C30 18 5 5 4 25 C3 38 22 44 40 38Z" fill={esp.color} opacity="0.85" />
                      <path d="M40 32 C50 18 75 5 76 25 C77 38 58 44 40 38Z" fill={esp.color} opacity="0.7" />
                      <path d="M40 37 C32 39 12 44 14 56 C16 63 32 62 40 52Z" fill={esp.color} opacity="0.65" />
                      <path d="M40 37 C48 39 68 44 66 56 C64 63 48 62 40 52Z" fill={esp.color} opacity="0.55" />
                      <ellipse cx="40" cy="42" rx="2.5" ry="14" fill="#2a2a1e" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#f0ebe0" }}>{esp.nombre}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: esp.rareza === "Legendaria" ? "#f0c04020" : esp.rareza === "Épica" ? "#a070d020" : "#7ed56f20",
                      color: esp.rareza === "Legendaria" ? "#f0c040" : esp.rareza === "Épica" ? "#a070d0" : "#7ed56f",
                      border: `1px solid ${esp.rareza === "Legendaria" ? "#f0c04030" : esp.rareza === "Épica" ? "#a070d030" : "#7ed56f30"}` }}>
                    {esp.rareza}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-center mt-8 text-sm" style={{ color: "#706a58" }}>
              ...y 44 más. Desde la común <strong style={{ color: "#b0a890" }}>Mariposa de la Col</strong> hasta la legendaria <strong style={{ color: "#f0c040" }}>Mariposa Atlas</strong>.
            </p>
          </div>
        </section>

        {/* ── PRECIOS ── */}
        <section className="py-20 px-4" style={{ background: "rgba(15,26,10,0.5)" }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3" style={{ color: "#f0ebe0" }}>Planes simples</h2>
            <p className="text-center mb-14" style={{ color: "#706a58" }}>Empieza gratis. Evoluciona cuando quieras.</p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { nombre: "Gratis", precio: "0€", periodo: "", emoji: "🥚", desc: "Para empezar", items: ["2 CVs/día", "Buscador básico", "Evolución oruga"], dest: false },
                { nombre: "Pro", precio: "9,99€", periodo: "/mes", emoji: "🐛", desc: "Para profesionales", items: ["10 CVs/día", "IA avanzada", "Estadísticas", "Soporte"], dest: true },
                { nombre: "Empresa", precio: "49,99€", periodo: "/mes", emoji: "🦋", desc: "Sin límites", items: ["Envíos ilimitados", "Todo incluido", "Multi-usuarios", "API"], dest: false },
              ].map((plan) => (
                <div key={plan.nombre} className={`card-game p-7 text-center relative ${plan.dest ? "scale-[1.03]" : ""}`}
                  style={plan.dest ? { borderColor: "#7ed56f", boxShadow: "0 0 40px rgba(126,213,111,0.12)" } : {}}>
                  {plan.dest && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="badge-game badge-dorado text-[10px]">⭐ Popular</span>
                    </div>
                  )}
                  <div className="text-4xl mb-3">{plan.emoji}</div>
                  <h3 className="text-lg font-bold" style={{ color: "#f0ebe0" }}>{plan.nombre}</h3>
                  <p className="text-xs mb-4" style={{ color: "#706a58" }}>{plan.desc}</p>
                  <div className="mb-5">
                    <span className="text-3xl font-black" style={{ color: plan.dest ? "#7ed56f" : "#f0ebe0" }}>{plan.precio}</span>
                    <span className="text-xs" style={{ color: "#706a58" }}>{plan.periodo}</span>
                  </div>
                  <ul className="space-y-2 mb-6 text-left">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "#b0a890" }}>
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
              Personas que ya encontraron trabajo 🦋
            </h2>
            <p className="text-center mb-14" style={{ color: "#706a58" }}>Ellos empezaron como tú. Ahora son mariposas.</p>
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
                        <p className="text-xl">🦋</p>
                        <p className="text-[10px]" style={{ color: "#706a58" }}>{t.mariposa}</p>
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
              ¿Listo para tu <span style={{ color: "#7ed56f" }}>metamorfosis</span>?
            </h2>
            <p className="mb-8 text-lg" style={{ color: "#b0a890" }}>
              Miles de personas ya están evolucionando. Es tu turno.
            </p>
            <Link href="/auth/registro" className="btn-game text-lg !py-4 !px-12">
              🦋 Comenzar ahora — Es gratis
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
