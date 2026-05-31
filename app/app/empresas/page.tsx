     1|"use client";
     2|
     3|import { useState, useEffect, useRef } from "react";
     4|import { getSupabaseBrowser } from "@/lib/supabase-browser";
     5|import { useRouter } from "next/navigation";
     6|
     7|interface EmpresaCompleta {
     8|  nombre: string;
     9|  dominio: string | null;
    10|  urlWeb: string | null;
    11|  emailRrhh: string | null;
    12|  emailContacto: string | null;
    13|  emailsExtraidos: string[];
    14|  telefono: string | null;
    15|  paginaEmpleo: string | null;
    16|  descripcion: string | null;
    17|  sector: string | null;
    18|  linkedin: string | null;
    19|  twitter: string | null;
    20|  instagram: string | null;
    21|  fuente: string;
    22|  googleRating?: number | null;
    23|  googleReviews?: number | null;
    24|  googleAddress?: string | null;
    25|  googleMapsUrl?: string | null;
    26|}
    27|
    28|interface EmpresaGuardada {
    29|  nombre: string;
    30|  dominio: string;
    31|  emailRrhh: string;
    32|  enviada: boolean;
    33|  fecha: string;
    34|}
    35|
    36|export default function EmpresasPage() {
    37|  const router = useRouter();
    38|  const [nombre, setNombre] = useState("");
    39|  const [buscando, setBuscando] = useState(false);
    40|  const [empresa, setEmpresa] = useState<EmpresaCompleta | null>(null);
    41|  const [error, setError] = useState("");
    42|  const [enviando, setEnviando] = useState(false);
    43|  const [exito, setExito] = useState("");
    44|  const [enviosHoy, setEnviosHoy] = useState(0);
    45|  const [limiteDiario, setLimiteDiario] = useState(2);
    46|  const [userId, setUserId] = useState("");
    47|  const [historial, setHistorial] = useState<EmpresaGuardada[]>([]);
    48|  const [mostrarTodosEmails, setMostrarTodosEmails] = useState(false);
    49|  const [stats, setStats] = useState<{ cv: { hoy: number; semana: number; mes: number; limiteHoy: number; disponibles: number }; plan: string }>({ cv: { hoy: 0, semana: 0, mes: 0, limiteHoy: 2, disponibles: 2 }, plan: "free" });
    50|  const inputRef = useRef<HTMLInputElement>(null);
    51|
    52|  useEffect(() => {
    53|    init();
    54|    inputRef.current?.focus();
    55|  }, []);
    56|
    57|  async function init() {
    58|    const supabase = getSupabaseBrowser();
    59|    const session = (await supabase.auth.getSession()).data.session;
    60|    if (!session) { router.push("/auth/login"); return; }
    61|    setUserId(session.user.id);
    62|
    63|    try {
    64|      const [statsRes, histRes] = await Promise.all([
    65|        fetch(`/api/user/stats?userId=${session.user.id}`),
    66|        supabase
    67|          .from("cv_sends")
    68|          .select("company_name, company_email, sent_at")
    69|          .eq("user_id", session.user.id)
    70|          .order("sent_at", { ascending: false })
    71|          .limit(20),
    72|      ]);
    73|
    74|      if (statsRes.ok) {
    75|        const d = await statsRes.json();
    76|        setStats(d);
    77|      }
    78|
    79|      if (histRes.data) {
    80|        setHistorial(
    81|          histRes.data.map((h: any) => ({
    82|            nombre: h.company_name,
    83|            dominio: h.company_email?.split("@")[1] || "",
    84|            emailRrhh: h.company_email,
    85|            enviada: true,
    86|            fecha: h.sent_at,
    87|          }))
    88|        );
    89|      }
    90|    } catch {}
    91|  }
    92|
    93|  async function handleBuscar() {
    94|    const term = nombre.trim();
    95|    if (!term || term.length < 2) {
    96|      setError("Escribe al menos 2 letras");
    97|      return;
    98|    }
    99|
   100|    setError("");
   101|    setEmpresa(null);
   102|    setExito("");
   103|    setBuscando(true);
   104|
   105|    try {
   106|      const res = await fetch("/api/company/extract", {
   107|        method: "POST",
   108|        headers: { "Content-Type": "application/json" },
   109|        body: JSON.stringify({ name: term }),
   110|      });
   111|
   112|      const data = await res.json();
   113|      if (!res.ok) throw new Error(data.error || "Error");
   114|
   115|      setEmpresa(data.empresa);
   116|    } catch (err) {
   117|      setError((err as Error).message);
   118|    } finally {
   119|      setBuscando(false);
   120|    }
   121|  }
   122|
   123|  async function handleEnviarCV(email?: string) {
   124|    if (!empresa || !userId) return;
   125|    if (stats.cv.disponibles <= 0) {
   126|      setError(`Límite diario (${stats.cv.limiteHoy} envíos). Mejora tu plan.`);
   127|      return;
   128|    }
   129|
   130|    setEnviando(true);
   131|    setError("");
   132|    setExito("");
   133|
   134|    try {
   135|      const res = await fetch("/api/cv-sender/registrar", {
   136|        method: "POST",
   137|        headers: { "Content-Type": "application/json" },
   138|        body: JSON.stringify({
   139|          userId,
   140|          companyName: empresa.nombre,
   141|          companyUrl: empresa.urlWeb,
   142|          jobTitle: "Candidatura espontánea",
   143|        }),
   144|      });
   145|
   146|      const data = await res.json();
   147|      if (!res.ok) throw new Error(data.error || "Error");
   148|
   149|      setStats(prev => ({ ...prev, cv: { ...prev.cv, hoy: prev.cv.hoy + 1, disponibles: Math.max(0, prev.cv.disponibles - 1) } }));
   150|      setExito(`✅ CV enviado a ${empresa.nombre}`);
   151|
   152|      setHistorial((prev) => [
   153|        {
   154|          nombre: empresa.nombre,
   155|          dominio: empresa.dominio || "",
   156|          emailRrhh: email || empresa.emailRrhh || "",
   157|          enviada: true,
   158|          fecha: new Date().toISOString(),
   159|        },
   160|        ...prev,
   161|      ]);
   162|    } catch (err) {
   163|      setError((err as Error).message);
   164|    } finally {
   165|      setEnviando(false);
   166|    }
   167|  }
   168|
   169|  function handleKeyDown(e: React.KeyboardEvent) {
   170|    if (e.key === "Enter") handleBuscar();
   171|  }
   172|
   173|  return (
   174|    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
   175|      {/* Header */}
   176|      <div
   177|        className="py-8 px-4"
   178|        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
   179|      >
   180|        <div className="max-w-2xl mx-auto">
   181|          <h1 className="text-xl font-bold" style={{ color: "#fff" }}>
   182|            Enviar CV a empresas
   183|          </h1>
   184|          <p className="text-xs mt-1 opacity-80" style={{ color: "#fff" }}>
   185|            Escribe el nombre de la empresa. Nosotros encontramos su web, email y datos de contacto.
   186|          </p>
   187|          <p className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.7)" }}>
   188|            {stats.cv.hoy}/{stats.cv.limiteHoy} envíos hoy • Plan {stats.plan}
   189|          </p>
   190|          {/* Barra de progreso */}
   191|          <div className="mt-3 flex items-center gap-2 max-w-xs">
   192|            <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.3)" }}>
   193|              <div className="h-full rounded-full transition-all duration-500"
   194|                style={{
   195|                  width: stats.cv.limiteHoy > 0 ? `${Math.min(100, (stats.cv.hoy / stats.cv.limiteHoy) * 100)}%` : "0%",
   196|                  background: stats.cv.disponibles <= 0 ? "#ef4444" : stats.cv.disponibles <= 1 ? "#f59e0b" : "#fff",
   197|                }} />
   198|            </div>
   199|            <span className="text-[10px] font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.9)" }}>
   200|              {stats.cv.disponibles} disponible{stats.cv.disponibles !== 1 ? "s" : ""}
   201|            </span>
   202|          </div>
   203|        </div>
   204|      </div>
   205|
   206|      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
   207|        {/* Buscador */}
   208|        <div className="card-game p-5">
   209|          <label className="text-xs font-semibold mb-2 block" style={{ color: "#f1f5f9" }}>
   210|            Nombre de la empresa
   211|          </label>
   212|          <p className="text-[10px] mb-3" style={{ color: "#64748b" }}>
   213|            Solo el nombre. Ej: "Mercadona", "Inditex", "BBVA". Nosotros encontramos el resto.
   214|          </p>
   215|          <div className="flex gap-2">
   216|            <input
   217|              ref={inputRef}
   218|              type="text"
   219|              value={nombre}
   220|              onChange={(e) => setNombre(e.target.value)}
   221|              onKeyDown={handleKeyDown}
   222|              placeholder="Ej: Mercadona"
   223|              className="flex-1 px-4 py-2.5 rounded-lg text-sm border outline-none transition"
   224|              style={{
   225|                background: "#0f1117",
   226|                border: "1px solid #2d3142",
   227|                color: "#f1f5f9",
   228|              }}
   229|            />
   230|            <button
   231|              onClick={handleBuscar}
   232|              disabled={buscando || nombre.trim().length < 2}
   233|              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition"
   234|              style={{
   235|                background: buscando ? "#1e212b" : "linear-gradient(135deg, #22c55e, #16a34a)",
   236|                color: buscando ? "#64748b" : "#fff",
   237|                opacity: nombre.trim().length < 2 ? 0.5 : 1,
   238|              }}
   239|            >
   240|              {buscando ? "Buscando..." : "Buscar"}
   241|            </button>
   242|          </div>
   243|
   244|          {/* Mensajes */}
   245|          {error && (
   246|            <div
   247|              className="mt-3 rounded-lg px-4 py-3 text-xs"
   248|              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
   249|            >
   250|              {error}
   251|            </div>
   252|          )}
   253|          {exito && (
   254|            <div
   255|              className="mt-3 rounded-lg px-4 py-3 text-xs"
   256|              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}
   257|            >
   258|              {exito}
   259|            </div>
   260|          )}
   261|        </div>
   262|
   263|        {/* Resultado */}
   264|        {empresa && (
   265|          <div className="card-game overflow-hidden">
   266|            {/* Cabecera */}
   267|            <div className="p-5" style={{ borderBottom: "1px solid #2d3142" }}>
   268|              <div className="flex items-start justify-between">
   269|                <div>
   270|                  <div className="flex items-center gap-2">
   271|                    <h3 className="text-base font-bold" style={{ color: "#22c55e" }}>
   272|                      {empresa.nombre}
   273|                    </h3>
   274|                    {empresa.fuente === "google_places" && (
   275|                      <span
   276|                        className="text-[9px] px-1.5 py-0.5 rounded"
   277|                        style={{ background: "rgba(66,133,244,0.15)", color: "#4285f4" }}
   278|                        title="Datos verificados por Google Places"
   279|                      >
   280|                        ✓ Google
   281|                      </span>
   282|                    )}
   283|                  </div>
   284|                  {empresa.sector && (
   285|                    <span
   286|                      className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full"
   287|                      style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}
   288|                    >
   289|                      {empresa.sector}
   290|                    </span>
   291|                  )}
   292|                  {/* Google rating */}
   293|                  {empresa.googleRating && (
   294|                    <div className="flex items-center gap-1 mt-1.5">
   295|                      <span className="text-xs" style={{ color: "#f59e0b" }}>
   296|                        {"★".repeat(Math.round(empresa.googleRating))}
   297|                        {"☆".repeat(5 - Math.round(empresa.googleRating))}
   298|                      </span>
   299|                      <span className="text-[10px]" style={{ color: "#94a3b8" }}>
   300|                        {empresa.googleRating.toFixed(1)} ({empresa.googleReviews || 0} reseñas)
   301|                      </span>
   302|                    </div>
   303|                  )}
   304|                </div>
   305|                <div className="text-right">
   306|                  <a
   307|                    href={empresa.urlWeb || "#"}
   308|                    target="_blank"
   309|                    rel="noopener"
   310|                    className="text-[10px] underline block"
   311|                    style={{ color: "#64748b" }}
   312|                  >
   313|                    {empresa.dominio}
   314|                  </a>
   315|                  {empresa.descripcion && (
   316|                    <p className="text-[9px] mt-1 max-w-[200px]" style={{ color: "#475569" }}>
   317|                      {empresa.descripcion.slice(0, 120)}...
   318|                    </p>
   319|                  )}
   320|                </div>
   321|              </div>
   322|
   323|              {/* ⚡ BOTÓN ENVIAR CV — visible inmediatamente */}
   324|              <button
   325|                onClick={() => handleEnviarCV()}
   326|                disabled={enviando || stats.cv.disponibles <= 0}
   327|                className="w-full mt-4 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
   328|                style={{
   329|                  background: enviando || stats.cv.disponibles <= 0 ? "#1e212b" : "linear-gradient(135deg, #22c55e, #16a34a)",
   330|                  color: enviando || stats.cv.disponibles <= 0 ? "#64748b" : "#fff",
   331|                  boxShadow: enviando || stats.cv.disponibles <= 0 ? "none" : "0 4px 20px rgba(34,197,94,0.3)",
   332|                }}
   333|              >
   334|                {enviando ? (
   335|                  <>⏳ Enviando CV...</>
   336|                ) : stats.cv.disponibles <= 0 ? (
   337|                  `🚫 Límite diario (${limiteDiario}/${limiteDiario})`
   338|                ) : (
   339|                  <>📤 Enviar mi CV a {empresa.nombre}</>
   340|                )}
   341|              </button>
   342|            </div>
   343|
   344|            {/* Datos de contacto */}
   345|            <div className="p-5 space-y-3">
   346|              {/* Dirección Google */}
   347|              {empresa.googleAddress && (
   348|                <div className="flex items-center gap-2">
   349|                  <span className="text-base">📍</span>
   350|                  <div className="flex-1">
   351|                    <span className="text-[9px] block" style={{ color: "#475569" }}>Dirección</span>
   352|                    <span className="text-sm" style={{ color: "#94a3b8" }}>{empresa.googleAddress}</span>
   353|                  </div>
   354|                  {empresa.googleMapsUrl && (
   355|                    <a
   356|                      href={empresa.googleMapsUrl}
   357|                      target="_blank"
   358|                      rel="noopener"
   359|                      className="text-[10px] px-2 py-1 rounded"
   360|                      style={{ background: "rgba(66,133,244,0.15)", color: "#4285f4" }}
   361|                    >
   362|                      Maps ↗
   363|                    </a>
   364|                  )}
   365|                </div>
   366|              )}
   367|
   368|              {/* Email principal */}
   369|              {empresa.emailRrhh && (
   370|                <div className="flex items-center justify-between">
   371|                  <div className="flex items-center gap-2">
   372|                    <span className="text-base">📧</span>
   373|                    <div>
   374|                      <span className="text-[9px] block" style={{ color: "#475569" }}>Email RRHH</span>
   375|                      <span className="text-sm font-mono" style={{ color: "#22c55e" }}>
   376|                        {empresa.emailRrhh}
   377|                      </span>
   378|                    </div>
   379|                  </div>
   380|                  <button
   381|                    onClick={() => {
   382|                      navigator.clipboard.writeText(empresa.emailRrhh!);
   383|                      setExito("📋 Copiado");
   384|                      setTimeout(() => setExito(""), 2000);
   385|                    }}
   386|                    className="text-[10px] px-2 py-1 rounded"
   387|                    style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
   388|                  >
   389|                    Copiar
   390|                  </button>
   391|                </div>
   392|              )}
   393|
   394|              {/* Todos los emails */}
   395|              {empresa.emailsExtraidos.length > 1 && (
   396|                <div>
   397|                  <button
   398|                    onClick={() => setMostrarTodosEmails(!mostrarTodosEmails)}
   399|                    className="text-[10px] flex items-center gap-1"
   400|                    style={{ color: "#64748b" }}
   401|                  >
   402|                    {mostrarTodosEmails ? "▲ Ocultar" : `▼ ${empresa.emailsExtraidos.length - 1} emails más`}
   403|                  </button>
   404|                  {mostrarTodosEmails && (
   405|                    <div className="mt-2 ml-7 space-y-1">
   406|                      {empresa.emailsExtraidos
   407|                        .filter((e) => e !== empresa.emailRrhh)
   408|                        .map((e) => (
   409|                          <div key={e} className="flex items-center justify-between text-[11px]">
   410|                            <span className="font-mono" style={{ color: "#94a3b8" }}>{e}</span>
   411|                            <button
   412|                              onClick={() => {
   413|                                navigator.clipboard.writeText(e);
   414|                                setExito("📋 Copiado");
   415|                                setTimeout(() => setExito(""), 2000);
   416|                              }}
   417|                              className="text-[9px]"
   418|                              style={{ color: "#22c55e" }}
   419|                            >
   420|                              Copiar
   421|                            </button>
   422|                          </div>
   423|                        ))}
   424|                    </div>
   425|                  )}
   426|                </div>
   427|              )}
   428|
   429|              {/* Teléfono */}
   430|              {empresa.telefono && (
   431|                <div className="flex items-center gap-2">
   432|                  <span className="text-base">📞</span>
   433|                  <div>
   434|                    <span className="text-[9px] block" style={{ color: "#475569" }}>Teléfono</span>
   435|                    <span className="text-sm" style={{ color: "#94a3b8" }}>{empresa.telefono}</span>
   436|                  </div>
   437|                </div>
   438|              )}
   439|
   440|              {/* Página de empleo */}
   441|              {empresa.paginaEmpleo && (
   442|                <div className="flex items-center gap-2">
   443|                  <span className="text-base">💼</span>
   444|                  <div>
   445|                    <span className="text-[9px] block" style={{ color: "#475569" }}>Página de empleo</span>
   446|                    <a
   447|                      href={empresa.paginaEmpleo}
   448|                      target="_blank"
   449|                      rel="noopener"
   450|                      className="text-sm underline"
   451|                      style={{ color: "#22c55e" }}
   452|                    >
   453|                      Ver ofertas de {empresa.nombre}
   454|                    </a>
   455|                  </div>
   456|                </div>
   457|              )}
   458|
   459|              {/* Redes sociales */}
   460|              {(empresa.linkedin || empresa.twitter || empresa.instagram) && (
   461|                <div className="flex items-center gap-2 pt-1">
   462|                  <span className="text-base">🌐</span>
   463|                  <div className="flex gap-2">
   464|                    {empresa.linkedin && (
   465|                      <a href={empresa.linkedin} target="_blank" rel="noopener"
   466|                        className="text-[10px] px-2 py-0.5 rounded"
   467|                        style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
   468|                        LinkedIn
   469|                      </a>
   470|                    )}
   471|                    {empresa.twitter && (
   472|                      <a href={empresa.twitter} target="_blank" rel="noopener"
   473|                        className="text-[10px] px-2 py-0.5 rounded"
   474|                        style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
   475|                        Twitter
   476|                      </a>
   477|                    )}
   478|                    {empresa.instagram && (
   479|                      <a href={empresa.instagram} target="_blank" rel="noopener"
   480|                        className="text-[10px] px-2 py-0.5 rounded"
   481|                        style={{ background: "rgba(236,72,153,0.15)", color: "#f472b6" }}>
   482|                        Instagram
   483|                      </a>
   484|                    )}
   485|                  </div>
   486|                </div>
   487|              )}
   488|            </div>
   489|
   490|            {/* Botón enviar */}
   491|            <div className="px-5 pb-5">
   492|              <button
   493|                onClick={() => handleEnviarCV()}
   494|                disabled={enviando || stats.cv.disponibles <= 0}
   495|                className="w-full py-3 rounded-xl text-sm font-bold transition"
   496|                style={{
   497|                  background: enviando || stats.cv.disponibles <= 0 ? "#1e212b" : "linear-gradient(135deg, #22c55e, #16a34a)",
   498|                  color: enviando || stats.cv.disponibles <= 0 ? "#64748b" : "#fff",
   499|                }}
   500|              >
   501|