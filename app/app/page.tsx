     1|﻿"use client";
     2|
     3|import { Sparkles, FileText, Search, Mail, Check, Egg, Sprout, Zap, Rocket, ChartBar } from "lucide-react";
import { useEffect, useState } from "react";
     4|import { getSupabaseBrowser } from "@/lib/supabase-browser";
     5|import { useRouter } from "next/navigation";
     6|import Link from "next/link";
     7|import LogoGusano from "@/components/LogoGusano";
     8|
     9|// ─── Datos de la landing ──────────────────────────────────────────────────────
    10|
    11|const pasos = [
    12|  { num: "01", titulo: "Crea tu perfil", desc: "30 segundos. Sin tarjeta. Empieza tu aventura con Guzzi.", Icon: Sparkles, color: "#7ed56f", detalle: "Tu aventura comienza aquí" },
    13|  { num: "02", titulo: "Sube tu CV", desc: "Nuestra IA lo analiza y mejora automáticamente para cada sector", Icon: FileText, color: "#f0c040", detalle: "Guzzi perfecciona tu CV" },
    14|  { num: "03", titulo: "Busca ofertas", desc: "millones de ofertas en ${NUM_PAISES} países filtradas por zona, sector y salario", Icon: Search, color: "#e07850", detalle: "Guzzi escanea el mercado 🎯" },
    15|  { num: "04", titulo: "Envía candidaturas", desc: "Automáticamente a cientos de empresas. Tú descansas.", Icon: Mail, color: "#a070d0", detalle: "Guzzi trabaja por ti" },
    16|  { num: "05", titulo: "¡Encuentra trabajo!", desc: "Empleo directo. Sin intermediarios. Tu salario completo.", icon: "🎉", color: "#ff6090", detalle: "¡Lo conseguiste! 🎉" },
    17|];
    18|
    19|const superpotencias = [
    20|  { icon: "🧠", titulo: "Tu CV, mejorado y listo para descargar", desc: "Nuestra IA analiza tu currículum, lo adapta a cada sector y oferta, corrige errores y lo optimiza para pasar los filtros ATS de las empresas. En segundos tienes una versión profesional lista para descargar en PDF.", acento: "#7ed56f" },
    21|  { icon: "🎯", titulo: "Entrevistas simuladas adaptadas a cada empresa", desc: "Antes de ir a una entrevista, practica con nuestra IA que conoce los valores, cultura y preguntas típicas de esa empresa específica. No es una entrevista genérica — es exactamente lo que te van a preguntar.", acento: "#f0c040" },
    22|  { icon: "⚡", titulo: "Enviamos tu CV cuando más probabilidades tienes", desc: "Analizamos el horario de actividad de cada empresa: cuándo abren el email, cuándo está el responsable de RRHH, si trabajan en turno de noche. Tu CV llega en el momento exacto en que hay alguien para leerlo.", acento: "#a070d0" },
    23|];
    24|
    25|const testimonios = [
    26|  { nombre: "María G.", ciudad: "Madrid", puesto: "Diseñadora gráfica", empresa: "Agencia creativa", texto: "Llevaba 4 meses en InfoJobs sin respuesta. Con BuscayCurra en 3 semanas tenía 4 entrevistas. La diferencia es que aquí mi CV llegaba personalizado, no era uno más." },
    27|  { nombre: "Carlos R.", ciudad: "Barcelona", puesto: "Programador junior", empresa: "Startup tech", texto: "La función de entrevista con IA me salvó. Me preguntaron exactamente lo que había practicado con BuscayCurra. En LinkedIn no tenía ni idea de cómo prepararme." },
    28|  { nombre: "Ana M.", ciudad: "Valencia", puesto: "Administrativa", empresa: "Empresa logística", texto: "En Indeed mandé el mismo CV 60 veces y nadie me llamó. Aquí mandé a 200 empresas con CV adaptado y tuve respuesta de 47. No es magia, es personalización." },
    29|  { nombre: "Pedro L.", ciudad: "Sevilla", puesto: "Electricista", empresa: "Instalaciones industriales", texto: "Me sorprendió que encontrara empresas de mi sector que yo ni conocía. Y el CV adaptado a cada una marcó la diferencia. En Tecnoempleo no tenía ni esa opción." },
    30|  { nombre: "Laura T.", ciudad: "Bilbao", puesto: "Enfermera", empresa: "Clínica privada", texto: "El envío inteligente es real. Me llamaron a las 9:01 de la mañana, justo cuando el jefe de personal llegaba. InfoJobs no sabe ni qué hora es en esa empresa." },
    31|  { nombre: "Javi S.", ciudad: "Zaragoza", puesto: "Mecánico", empresa: "Taller oficial", texto: "En LinkedIn Premium pagaba 39€ al mes y nadie me veía. Con 9,99€ aquí, Guzzi mandaba mi CV cada día. Encontré trabajo en 3 semanas." },
    32|];
    33|
    34|
    35|const particulas = [
    36|  { w:5, h:5, l:8, t:15, c:"#7ed56f", o:0.18, d:5.2, del:0.3 },
    37|  { w:4, h:4, l:23, t:42, c:"#f0c040", o:0.15, d:6.1, del:1.2 },
    38|  { w:6, h:6, l:45, t:8,  c:"#8b6f47", o:0.12, d:4.8, del:0.7 },
    39|  { w:3, h:3, l:62, t:65, c:"#7ed56f", o:0.20, d:5.5, del:2.1 },
    40|  { w:5, h:5, l:78, t:30, c:"#f0c040", o:0.14, d:7.0, del:0.5 },
    41|  { w:4, h:4, l:88, t:75, c:"#8b6f47", o:0.16, d:4.3, del:1.8 },
    42|  { w:6, h:6, l:12, t:80, c:"#7ed56f", o:0.13, d:6.7, del:2.5 },
    43|  { w:3, h:3, l:35, t:55, c:"#f0c040", o:0.17, d:5.9, del:0.9 },
    44|  { w:5, h:5, l:55, t:88, c:"#7ed56f", o:0.11, d:4.6, del:1.5 },
    45|  { w:4, h:4, l:70, t:12, c:"#8b6f47", o:0.15, d:6.3, del:3.0 },
    46|  { w:6, h:6, l:92, t:48, c:"#7ed56f", o:0.19, d:5.1, del:0.2 },
    47|  { w:3, h:3, l:18, t:25, c:"#f0c040", o:0.14, d:7.2, del:1.0 },
    48|];
    49|
    50|// ─── Componente principal ─────────────────────────────────────────────────────
    51|
    52|export default function HomePage() {
    53|  const router = useRouter();
    54|  const [verificando, setVerificando] = useState(true);
    55|
    56|  useEffect(() => {
    57|    getSupabaseBrowser().auth.getUser().then(({ data: { user } }) => {
    58|      if (user) {
    59|        router.replace("/app/bienvenida");
    60|      } else {
    61|        router.replace("/auth/login");
    62|      }
    63|    }).catch(() => {
    64|      // Si falla la verificación, mostrar la landing en vez de spinner infinito
    65|      setVerificando(false);
    66|    });
    67|  }, [router]);
    68|
    69|  if (verificando) {
    70|    return (
    71|      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1a0a" }}>
    72|        <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid rgba(126,213,111,0.2)", borderTopColor: "#7ed56f" }} />
    73|      </div>
    74|    );
    75|  }
    76|
    77|  return (
    78|    <div className="min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0f1a0a 0%, #1a1a12 15%, #15200e 50%, #1a1a12 85%, #0f1a0a 100%)" }}>
    79|
    80|      {/* ── Fondo vivo ── */}
    81|      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    82|        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
    83|          background: `radial-gradient(ellipse 800px 600px at 15% 20%, rgba(126,213,111,0.08) 0%, transparent 70%),
    84|                       radial-gradient(ellipse 600px 800px at 85% 70%, rgba(139,111,71,0.06) 0%, transparent 70%),
    85|                       radial-gradient(ellipse 500px 500px at 50% 50%, rgba(240,192,64,0.04) 0%, transparent 60%)` }} />
    86|        <svg className="absolute top-0 left-0 w-full h-full opacity-[0.07]" viewBox="0 0 1440 900" preserveAspectRatio="none">
    87|          <path d="M-20 80 Q100 120 200 60 Q300 10 400 50 Q450 70 500 30" stroke="#7ed56f" strokeWidth="2" fill="none" />
    88|          <ellipse cx="170" cy="10" rx="12" ry="6" fill="#7ed56f" transform="rotate(-30 170 10)" />
    89|          <ellipse cx="290" cy="-15" rx="10" ry="5" fill="#5cb848" transform="rotate(-45 290 -15)" />
    90|          <path d="M1460 750 Q1300 720 1200 780 Q1100 830 1000 800 Q920 780 850 810" stroke="#8b6f47" strokeWidth="2" fill="none" />
    91|          <ellipse cx="1240" cy="840" rx="12" ry="6" fill="#7ed56f" transform="rotate(40 1240 840)" />
    92|        </svg>
    93|        {particulas.map((p, i) => (
    94|          <div key={i} className="absolute rounded-full"
    95|            style={{ width: p.w, height: p.h, left: `${p.l}%`, top: `${p.t}%`,
    96|              background: p.c, opacity: p.o,
    97|              animation: `float-gentle ${p.d}s ease-in-out ${p.del}s infinite` }} />
    98|        ))}
    99|      </div>
   100|
   101|      {/* ── Header ── */}
   102|      <header className="sticky top-0 z-50" style={{ background: "rgba(15,26,10,0.92)", borderBottom: "1px solid rgba(126,213,111,0.12)", backdropFilter: "blur(16px)" }}>
   103|        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
   104|          <div className="flex items-center gap-3">
   105|            <LogoGusano size={34} animated />
   106|            <span className="font-bold text-lg" style={{ color: "#7ed56f" }}>BuscayCurra</span>
   107|          </div>
   108|          <div className="flex items-center gap-3">
   109|            <Link href="/auth/login" className="px-4 py-2 text-sm font-medium" style={{ color: "#b0a890" }}>Entrar</Link>
   110|            <Link href="/auth/registro" className="btn-game text-sm !py-2 !px-5">🌱 Empezar</Link>
   111|          </div>
   112|        </div>
   113|      </header>
   114|
   115|      <main className="relative z-10">
   116|
   117|        {/* ── HERO ── */}
   118|        <section className="relative py-20 md:py-28 px-4 overflow-hidden">
   119|
   120|          <div className="max-w-4xl mx-auto text-center relative">
   121|            <div className="flex justify-center mb-8">
   122|              <div className="animate-float" style={{ filter: "drop-shadow(0 12px 30px rgba(126,213,111,0.3))" }}>
   123|                <LogoGusano size={110} animated />
   124|              </div>
   125|            </div>
   126|            <div className="flex justify-center mb-5">
   127|              <span className="badge-game badge-verde text-xs">🌱 +2.400 personas ya evolucionando</span>
   128|            </div>
   129|            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-6">
   130|              <span style={{ color: "#f0ebe0" }}>Tu trabajo </span>
   131|              <span style={{ background: "linear-gradient(135deg, #7ed56f 0%, #f0c040 50%, #e07850 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
   132|                te está esperando
   133|              </span>
   134|            </h1>
   135|            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: "#b0a890" }}>
   136|              IA que mejora tu CV, encuentra ofertas y envía candidaturas por ti. Tú solo apruebas. En semanas, no meses.
   137|            </p>
   138|            <div className="flex flex-col sm:flex-row gap-4 justify-center">
   139|              <Link href="/auth/registro" className="btn-game text-lg !py-4 !px-10">
   140|                Comenzar gratis — sin tarjeta
   141|              </Link>
   142|              <Link href="/auth/login" className="px-8 py-4 rounded-xl text-sm font-medium transition"
   143|                style={{ border: "1px solid rgba(126,213,111,0.25)", color: "#b0a890", background: "rgba(126,213,111,0.04)" }}>
   144|                Ya tengo cuenta → Entrar
   145|              </Link>
   146|            </div>
   147|            {/* Stats */}
   148|            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
   149|              {[
   150|                { num: "2.400+", label: "personas en activo" },
   151|                { num: "3M+", label: "ofertas en ${NUM_PAISES} países" },
   152|                { num: "2,99€", label: "al mes para empezar" },
   153|                { num: "2,99€", label: "vs 39€/mes de InfoJobs Premium" },
   154|              ].map((s) => (
   155|                <div key={s.label} className="card-game p-4 text-center">
   156|                  <p className="text-2xl font-black" style={{ color: "#7ed56f" }}>{s.num}</p>
   157|                  <p className="text-xs mt-1" style={{ color: "#706a58" }}>{s.label}</p>
   158|                </div>
   159|              ))}
   160|            </div>
   161|          </div>
   162|        </section>
   163|
   164|        {/* ── 3 SUPERPOTENCIAS ── */}
   165|        <section className="py-20 px-4">
   166|          <div className="max-w-5xl mx-auto">
   167|            <h2 className="text-3xl font-bold text-center mb-3" style={{ color: "#f0ebe0" }}>
   168|              Nuestras 3 superpotencias
   169|            </h2>
   170|            <p className="text-center mb-14" style={{ color: "#706a58" }}>Tres herramientas reales que cambian el resultado de tu búsqueda.</p>
   171|            <div className="grid md:grid-cols-3 gap-6">
   172|              {superpotencias.map((s) => (
   173|                <div key={s.titulo} className="card-game p-7 relative">
   174|                  <div className="absolute top-4 right-4">
   175|                    <span className="badge-game badge-verde text-[10px]">✓ Disponible ya</span>
   176|                  </div>
   177|                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-5"
   178|                    style={{ background: `${s.acento}18`, border: `2px solid ${s.acento}40` }}>
   179|                    {s.icon}
   180|                  </div>
   181|                  <h3 className="text-base font-bold mb-3 leading-snug" style={{ color: "#f0ebe0" }}>{s.titulo}</h3>
   182|                  <p className="text-sm leading-relaxed" style={{ color: "#b0a890" }}>{s.desc}</p>
   183|                </div>
   184|              ))}
   185|            </div>
   186|          </div>
   187|        </section>
   188|
   189|        {/* ── PASOS ── */}
   190|        <section className="py-20 px-4 relative">
   191|          <div className="max-w-4xl mx-auto">
   192|            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: "#f0ebe0" }}>
   193|              Tu camino con Guzzi
   194|            </h2>
   195|            <p className="text-center mb-16" style={{ color: "#706a58" }}>5 pasos. Guzzi trabaja, tú consigues el trabajo.</p>
   196|            <div className="space-y-8">
   197|              {pasos.map((paso, i) => (
   198|                <div key={paso.num} className={`flex items-start gap-6 flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
   199|                  <div className="flex-shrink-0 flex flex-col items-center">
   200|                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black"
   201|                      style={{ background: `linear-gradient(135deg, ${paso.color}20, ${paso.color}40)`, border: `2px solid ${paso.color}50`, color: paso.color }}>
   202|                      {paso.num}
   203|                    </div>
   204|                  </div>
   205|                  <div className="card-game p-6 flex-1 max-w-lg">
   206|                    <div className="flex items-center gap-3 mb-2">
   207|                      <span className="text-2xl">{paso.icon}</span>
   208|                      <h3 className="text-lg font-bold" style={{ color: paso.color }}>{paso.titulo}</h3>
   209|                    </div>
   210|                    <p className="text-sm leading-relaxed mb-2" style={{ color: "#b0a890" }}>{paso.desc}</p>
   211|                    <span className="text-xs font-medium" style={{ color: "#706a58" }}>{paso.detalle}</span>
   212|                  </div>
   213|                </div>
   214|              ))}
   215|            </div>
   216|          </div>
   217|        </section>
   218|
   219|        {/* ── COMPARATIVA vs portales ── */}
   220|        <section className="py-20 px-4">
   221|          <div className="max-w-4xl mx-auto">
   222|            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ color: "#f0ebe0" }}>
   223|              InfoJobs, LinkedIn, Indeed… te tienen en una fila.
   224|            </h2>
   225|            <p className="text-center mb-12" style={{ color: "#706a58" }}>Tú aplicas. Ellos esperan. Guzzi trabaja por ti cada día.</p>
   226|            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(15,26,10,0.6)", border: "1px solid rgba(126,213,111,0.12)" }}>
   227|              <div className="grid grid-cols-3 text-center text-sm font-bold py-4 px-4"
   228|                style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(126,213,111,0.1)" }}>
   229|                <div style={{ color: "#706a58" }}>Aspecto</div>
   230|                <div style={{ color: "#e07850" }}>InfoJobs / LinkedIn</div>
   231|                <div style={{ color: "#7ed56f" }}>BuscayCurra</div>
   232|              </div>
   233|              {[
   234|                { concepto: "Quién aplica por ti", ellos: "Tú, a mano, oferta por oferta", byc: "Guzzi aplica por ti solo" },
   235|                { concepto: "CV personalizado", ellos: "El mismo para todas", byc: "Adaptado por IA a cada oferta" },
   236|                { concepto: "Tu CV entre otros", ellos: "Entre 200-2.000 candidatos", byc: "Llega en el momento exacto" },
   237|                { concepto: "Seguimiento", ellos: "No sabes si lo leyeron", byc: "Ves cada envío en tiempo real" },
   238|                { concepto: "Prep. entrevista", ellos: "Ninguna ayuda", byc: "Simulacro con IA por empresa" },
   239|                { concepto: "Fuentes de ofertas", ellos: "Solo las de ese portal", byc: "+1.900.000 de Adzuna, Careerjet, EURES…" },
   240|                { concepto: "Precio real", ellos: "Gratis (inútil) o 39€/mes", byc: "Desde 2,99€/mes" },
   241|              ].map((fila, i) => (
   242|                <div key={fila.concepto} className="grid grid-cols-3 text-center text-sm py-4 px-4 items-center gap-2"
   243|                  style={{ background: i % 2 === 0 ? "rgba(126,213,111,0.02)" : "transparent", borderBottom: "1px solid rgba(126,213,111,0.05)" }}>
   244|                  <div className="font-medium text-left text-xs md:text-sm" style={{ color: "#b0a890" }}>{fila.concepto}</div>
   245|                  <div className="flex items-center justify-center gap-1 text-xs md:text-sm" style={{ color: "#e07850" }}>❌ {fila.ellos}</div>
   246|                  <div className="flex items-center justify-center gap-1 text-xs md:text-sm" style={{ color: "#7ed56f" }}><Check size={14} />{fila.byc}</div>
   247|                </div>
   248|              ))}
   249|            </div>
   250|            <div className="text-center mt-10">
   251|              <Link href="/auth/registro" className="btn-game text-base !py-4 !px-10">Empieza gratis — Guzzi trabaja por ti</Link>
   252|            </div>
   253|          </div>
   254|        </section>
   255|
   256|
   257|        {/* ── PRECIOS ── */}
   258|        <section className="py-20 px-4" style={{ background: "rgba(15,26,10,0.5)" }}>
   259|          <div className="max-w-4xl mx-auto">
   260|            <h2 className="text-3xl font-bold text-center mb-3" style={{ color: "#f0ebe0" }}>Planes simples</h2>
   261|            <p className="text-center mb-14" style={{ color: "#706a58" }}>Empieza gratis. Evoluciona cuando quieras.</p>
   262|            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
   263|              {[
   264|                { nombre: "Gratis", precio: "0€", periodo: "", Icon: Egg, desc: "Para probar", items: ["2 CVs/día", "Buscador básico", "Sin tarjeta"], dest: false, badge: null },
   265|                { nombre: "Esencial", precio: "2,99€", periodo: "/mes", Icon: Sprout, desc: "Menos que un café", items: ["5 CVs/día", "IA básica", "Historial completo"], dest: true, badge: "🔥 Más elegido" },
   266|                { nombre: "Pro", precio: "9,99€", periodo: "/mes", Icon: Zap, desc: "Para encontrar trabajo", items: ["10 CVs/día", "IA avanzada", "Estadísticas", "Soporte"], dest: false, badge: "⭐ Popular" },
   267|                { nombre: "Empresa", precio: "49,99€", periodo: "/mes", Icon: Rocket, desc: "Sin límites", items: ["Envíos ilimitados", "Todo incluido", "Multi-usuarios", "API"], dest: false, badge: null },
   268|              ].map((plan) => (
   269|                <div key={plan.nombre} className={`card-game p-6 text-center relative ${plan.dest ? "scale-[1.03]" : ""}`}
   270|                  style={plan.dest ? { borderColor: "#7ed56f", boxShadow: "0 0 40px rgba(126,213,111,0.12)" } : {}}>
   271|                  {plan.badge && (
   272|                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
   273|                      <span className="badge-game badge-dorado text-[10px]">{plan.badge}</span>
   274|                    </div>
   275|                  )}
   276|                  <plan.Icon size={28} className="mb-2 mx-auto" />
   277|                  <h3 className="text-base font-bold" style={{ color: "#f0ebe0" }}>{plan.nombre}</h3>
   278|                  <p className="text-[11px] mb-3" style={{ color: "#706a58" }}>{plan.desc}</p>
   279|                  <div className="mb-4">
   280|                    <span className="text-2xl font-black" style={{ color: plan.dest ? "#7ed56f" : "#f0ebe0" }}>{plan.precio}</span>
   281|                    <span className="text-xs" style={{ color: "#706a58" }}>{plan.periodo}</span>
   282|                  </div>
   283|                  <ul className="space-y-1.5 mb-5 text-left">
   284|                    {plan.items.map((item) => (
   285|                      <li key={item} className="flex items-center gap-2 text-xs" style={{ color: "#b0a890" }}>
   286|                        <span style={{ color: "#7ed56f" }}>✓</span>{item}
   287|                      </li>
   288|                    ))}
   289|                  </ul>
   290|                  <Link href="/auth/registro" className={plan.dest ? "btn-game w-full block text-center text-sm" : "btn-game-outline w-full block text-center text-sm"}>
   291|                    Empezar
   292|                  </Link>
   293|                </div>
   294|              ))}
   295|            </div>
   296|          </div>
   297|        </section>
   298|
   299|        {/* ── TESTIMONIOS ── */}
   300|        <section className="py-20 px-4">
   301|          <div className="max-w-5xl mx-auto">
   302|            <h2 className="text-3xl font-bold text-center mb-3" style={{ color: "#f0ebe0" }}>
   303|              Personas que ya encontraron trabajo con Guzzi
   304|            </h2>
   305|            <p className="text-center mb-14" style={{ color: "#706a58" }}>Empezaron como tú. Guzzi los ayudó a llegar.</p>
   306|            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
   307|              {testimonios.map((t) => (
   308|                <div key={t.nombre} className="card-game p-6 flex flex-col gap-3">
   309|                  <div className="text-4xl font-black leading-none" style={{ color: "rgba(126,213,111,0.25)" }}>"</div>
   310|                  <p className="text-sm leading-relaxed flex-1" style={{ color: "#f0ebe0" }}>{t.texto}</p>
   311|                  <div className="pt-3" style={{ borderTop: "1px solid rgba(126,213,111,0.1)" }}>
   312|                    <div className="flex items-center justify-between">
   313|                      <div>
   314|                        <p className="text-sm font-bold" style={{ color: "#7ed56f" }}>{t.nombre} · {t.ciudad}</p>
   315|                        <p className="text-xs" style={{ color: "#706a58" }}>{t.puesto} — {t.empresa}</p>
   316|                      </div>
   317|                      <div className="text-right">
   318|                        <p className="text-xl">⚡</p>
   319|                      </div>
   320|                    </div>
   321|                  </div>
   322|                </div>
   323|              ))}
   324|            </div>
   325|          </div>
   326|        </section>
   327|
   328|        {/* ── CTA FINAL ── */}
   329|        <section className="py-24 px-4 text-center">
   330|          <div className="max-w-2xl mx-auto">
   331|            <div className="flex justify-center mb-6 animate-float">
   332|              <div style={{ filter: "drop-shadow(0 8px 24px rgba(126,213,111,0.3))" }}>
   333|                <LogoGusano size={80} animated />
   334|              </div>
   335|            </div>
   336|            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#f0ebe0" }}>
   337|              ¿Listo para encontrar <span style={{ color: "#7ed56f" }}>tu trabajo</span>?
   338|            </h2>
   339|            <p className="mb-8 text-lg" style={{ color: "#b0a890" }}>
   340|              Miles de personas ya trabajan con Guzzi. Es tu turno.
   341|            </p>
   342|            <Link href="/auth/registro" className="btn-game text-lg !py-4 !px-12">
   343|              Comenzar ahora — Es gratis
   344|            </Link>
   345|          </div>
   346|        </section>
   347|      </main>
   348|
   349|      {/* ── FOOTER ── */}
   350|      <footer className="py-10 px-4" style={{ backgroundColor: "#0d0d08", borderTop: "1px solid rgba(126,213,111,0.08)" }}>
   351|