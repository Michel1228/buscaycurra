"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import AutoSendSetup from "@/components/AutoSendSetup";
import CVSenderDashboard from "@/components/CVSenderDashboard";

type TabId = "buscar" | "ett" | "envio" | "historial";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "buscar", label: "Buscar empresa", icon: "🔍" },
  { id: "ett", label: "ETTs", icon: "🏢" },
  { id: "envio", label: "Envío personalizado", icon: "📧" },
  { id: "historial", label: "Historial", icon: "📋" },
];

interface EmpresaCompleta {
  nombre: string;
  dominio: string | null;
  urlWeb: string | null;
  emailRrhh: string | null;
  emailContacto: string | null;
  emailsExtraidos: string[];
  telefono: string | null;
  paginaEmpleo: string | null;
  descripcion: string | null;
  sector: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  fuente: string;
  googleRating?: number | null;
  googleReviews?: number | null;
  googleAddress?: string | null;
  googleMapsUrl?: string | null;
}

interface EmpresaGuardada {
  nombre: string;
  dominio: string;
  emailRrhh: string;
  enviada: boolean;
  fecha: string;
}

interface UserStats {
  cv: { hoy: number; semana: number; mes: number; limiteHoy: number; disponibles: number };
  plan: string;
  recientes?: Array<{ empresa: string; email: string; puesto: string; fecha: string }>;
}

interface RateLimitInfo {
  enviadosHoy: number;
  limiteHoy: number;
  cvsRestantesHoy: number;
  userPlan?: string;
}

export default function EmpresasPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("buscar");
  const [envioPrefillName, setEnvioPrefillName] = useState("");
  const [envioTabKey, setEnvioTabKey] = useState(0);

  // ── Tab "Buscar" state ──
  const [nombre, setNombre] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [empresas, setEmpresas] = useState<EmpresaCompleta[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<EmpresaCompleta | null>(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState("");
  const [mostrarTodosEmails, setMostrarTodosEmails] = useState(false);
  const [sendStrategy, setSendStrategy] = useState<"ahora" | "optimo">("optimo");
  const [sendResult, setSendResult] = useState<{estimatedTime: string; positionInQueue: number; strategy: string; horaLocal: string} | null>(null);

  // ── Preview & Confirmación modals ──
  const [cvList, setCvList] = useState<Array<{id: string; nombre: string}>>([]);
  const [cvSeleccionado, setCvSeleccionado] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewCarta, setPreviewCarta] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewEmail, setPreviewEmail] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState<{empresa: string; email: string; carta: string; subject: string; estimatedTime?: string; horaLocal?: string} | null>(null);

  // ── Tab "ETTs" state ──
  const [ettCity, setEttCity] = useState("");
  const [ettBuscando, setEttBuscando] = useState(false);
  const ettInputRef = useRef<HTMLInputElement>(null);

  // ── Shared state ──
  const [userId, setUserId] = useState("");
  const [historial, setHistorial] = useState<EmpresaGuardada[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    init();
    inputRef.current?.focus();
  }, []);

  async function init() {
    const supabase = getSupabaseBrowser();
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) { router.push("/auth/login"); return; }
    setUserId(session.user.id);

    try {
      const [statsRes, histRes] = await Promise.all([
        fetch(`/api/user/stats`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
        supabase
          .from("cv_sends")
          .select("company_name, company_email, sent_at")
          .eq("user_id", session.user.id)
          .order("sent_at", { ascending: false })
          .limit(20),
      ]);

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d);
      }

      if (histRes.data) {
        setHistorial(
          histRes.data.map((h: any) => ({
            nombre: h.company_name,
            dominio: h.company_email?.split("@")[1] || "",
            emailRrhh: h.company_email,
            enviada: true,
            fecha: h.sent_at,
          }))
        );
      }
    } catch {}
  }

  const handleRateLimitUpdate = (info: RateLimitInfo) => {
    setStats(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        cv: {
          ...prev.cv,
          hoy: info.enviadosHoy,
          disponibles: info.cvsRestantesHoy,
        },
      };
    });
  };

  const handleJobScheduled = () => {
    setTimeout(() => { init(); }, 1500);
  };

  // ── Tab "Buscar empresa" handlers ──

  async function handleBuscar() {
    const term = nombre.trim();
    if (!term || term.length < 2) {
      setError("Escribe al menos 2 letras");
      return;
    }

    setError("");
    setEmpresas([]);
    setEmpresaSeleccionada(null);
    setExito("");
    setSendResult(null);
    setBuscando(true);

    try {
      const res = await fetch("/api/company/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: term }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");

      // Manejar respuesta: data.empresas (array, nuevo) o data.empresa (objeto único, compat)
      if (data.empresas?.length) {
        setEmpresas(data.empresas);
        if (data.empresas.length === 1) {
          setEmpresaSeleccionada(data.empresas[0]);
        }
      } else if (data.empresa) {
        // Compatibilidad con respuesta antigua
        setEmpresas([data.empresa]);
        setEmpresaSeleccionada(data.empresa);
      } else {
        setError(data.mensaje || `No se encontró "${term}". Prueba con el nombre completo.`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBuscando(false);
    }
  }

  function seleccionarEmpresa(emp: EmpresaCompleta) {
    setEmpresaSeleccionada(emp);
    setExito("");
    setSendResult(null);
    // Scroll al detalle
    setTimeout(() => {
      document.getElementById("empresa-detalle")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function volverALista() {
    setEmpresaSeleccionada(null);
    setExito("");
    setSendResult(null);
  }

  async function handleEnviarCV(email?: string) {
    const emp = empresaSeleccionada;
    if (!emp || !userId) return;
    if (!stats || stats.cv.disponibles <= 0) {
      if (stats && stats.plan !== "empresa") {
        setError(`Límite diario (${stats.cv.limiteHoy >= 9999 ? "∞" : stats.cv.limiteHoy} envíos). Mejora tu plan.`);
      } else if (!stats) {
        setError("Cargando datos...");
      }
      return;
    }

    const targetEmail = email || emp.emailRrhh || "";
    setError("");
    setExito("");
    setSendResult(null);
    setPreviewLoading(true);
    setPreviewEmail(targetEmail);
    setPreviewCarta("");
    setShowPreview(true);

    try {
      const session = (await (await import("@/lib/supabase-browser")).getSupabaseBrowser().auth.getSession()).data.session;
      
      // Generar preview de la carta con IA
      const previewRes = await fetch("/api/cv-sender/preview-carta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          companyName: emp.nombre,
          companyEmail: targetEmail,
          jobTitle: activeTab === "ett" ? "Candidatura espontánea ETT" : "Candidatura espontánea",
        }),
      });

      const previewData = await previewRes.json();
      if (previewRes.ok && previewData.carta) {
        setPreviewCarta(previewData.carta);
        setPreviewSubject(previewData.subject || "");
      } else {
        setPreviewCarta("No se pudo generar la carta. Se enviará una carta genérica.");
        setPreviewSubject(`Candidatura — ${emp.nombre}`);
      }
    } catch {
      setPreviewCarta("No se pudo generar la carta. Se enviará una carta genérica.");
      setPreviewSubject(`Candidatura — ${emp.nombre}`);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleConfirmarEnvio() {
    const emp = empresaSeleccionada;
    if (!emp || !userId) return;

    setShowPreview(false);
    setEnviando(true);
    setError("");
    setExito("");

    try {
      const session = (await (await import("@/lib/supabase-browser")).getSupabaseBrowser().auth.getSession()).data.session;
      const res = await fetch("/api/cv-sender/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          companyName: emp.nombre,
          companyEmail: previewEmail,
          companyUrl: emp.urlWeb,
          jobTitle: activeTab === "ett" ? "Candidatura espontánea ETT" : "Candidatura espontánea",
          strategy: sendStrategy,
          useAIPersonalization: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");

      setStats(prev => {
        if (!prev) return prev;
        return { ...prev, cv: { ...prev.cv, hoy: prev.cv.hoy + 1, disponibles: Math.max(0, prev.cv.disponibles - 1) } };
      });

      // Mostrar confirmación detallada
      setConfirmData({
        empresa: emp.nombre,
        email: previewEmail,
        carta: previewCarta,
        subject: previewSubject,
        estimatedTime: data.estimatedTimeFormatted,
        horaLocal: data.horaLocalEmpresa || "",
      });
      setShowConfirm(true);
      setExito(`✅ CV programado para ${emp.nombre}`);

      if (data.estimatedTimeFormatted) {
        setSendResult({
          estimatedTime: data.estimatedTimeFormatted,
          positionInQueue: data.positionInQueue || 0,
          strategy: data.strategy || sendStrategy,
          horaLocal: data.horaLocalEmpresa || "",
        });
      }

      setHistorial((prev) => [
        {
          nombre: emp.nombre,
          dominio: emp.dominio || "",
          emailRrhh: previewEmail,
          enviada: true,
          fecha: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleBuscar();
  }

  // ── Tab "ETTs" handlers ──

  async function handleBuscarETT() {
    const city = ettCity.trim();
    if (!city || city.length < 2) {
      setError("Escribe el nombre de una ciudad (mín. 2 letras)");
      return;
    }

    setError("");
    setEmpresas([]);
    setEmpresaSeleccionada(null);
    setExito("");
    setSendResult(null);
    setEttBuscando(true);

    try {
      const res = await fetch("/api/ett/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");

      if (data.empresas?.length) {
        setEmpresas(data.empresas);
        if (data.empresas.length === 1) {
          setEmpresaSeleccionada(data.empresas[0]);
        }
      } else {
        setError(data.mensaje || `No se encontraron ETTs en "${city}". Prueba con otra ciudad.`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEttBuscando(false);
    }
  }

  function handleEttKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleBuscarETT();
  }

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      {/* ── Header compartido ── */}
      <div
        className="py-8 px-4"
        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold" style={{ color: "#fff" }}>
            Enviar CV a empresas
          </h1>
          <p className="text-xs mt-1 opacity-90" style={{ color: "#fff" }}>
            Busca empresas reales con Google. Envía tu CV automáticamente con carta personalizada por IA.
          </p>

          {/* Contador de envíos interactivo */}
          {stats && (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition hover:scale-105 cursor-pointer"
              style={{
                background: stats.cv.disponibles <= 0 ? "rgba(239,68,68,0.35)" : stats.cv.disponibles <= 2 ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.18)",
                color: stats.cv.disponibles <= 0 ? "#fecaca" : stats.cv.disponibles <= 2 ? "#fde68a" : "#fff",
                border: `1.5px solid ${stats.cv.disponibles <= 0 ? "rgba(239,68,68,0.6)" : stats.cv.disponibles <= 2 ? "rgba(245,158,11,0.6)" : "rgba(255,255,255,0.3)"}`,
              }}
              title="Click para ver detalle de envíos"
            >
              <span className="text-lg tabular-nums">
                {stats.cv.disponibles >= 9999 ? "∞" : stats.cv.disponibles}
              </span>
              <span className="text-[10px] opacity-90">
                {stats.cv.disponibles >= 9999 ? "ilimitado" : "quedan hoy"}
              </span>
              <span className="text-[10px]">{showStats ? "▲" : "▼"}</span>
            </button>

            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.8)" }}>
              <span>📤 </span>
              <span className="tabular-nums font-semibold" style={{ color: "#fff" }}>{stats.cv.semana}</span>
              <span> esta semana</span>
              <span className="mx-1">·</span>
              <span className="tabular-nums font-semibold" style={{ color: "#fff" }}>{stats.cv.mes}</span>
              <span> este mes</span>
            </div>

            <span
              className="px-2 py-0.5 rounded text-[9px] font-bold uppercase"
              style={{
                background: stats.plan === "empresa" ? "rgba(34,197,94,0.25)" : stats.plan === "pro" ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.1)",
                color: stats.plan === "empresa" ? "#4ade80" : stats.plan === "pro" ? "#60a5fa" : "rgba(255,255,255,0.7)",
              }}
            >
              {stats.plan === "esencial" ? "Esencial" : stats.plan === "free" ? "Gratuito" : stats.plan === "pro" ? "Pro" : stats.plan === "empresa" ? "Empresa" : stats.plan}
            </span>
          </div>
          )}

          {showStats && stats && (
            <div
              className="mt-3 p-4 rounded-lg max-w-sm transition-all"
              style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>
                  📋 Tus últimos envíos
                </span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {stats.cv.hoy}/{stats.cv.limiteHoy} hoy
                </span>
              </div>
              <div className="w-full h-1 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: stats.cv.limiteHoy > 0 ? `${Math.min(100, (stats.cv.hoy / stats.cv.limiteHoy) * 100)}%` : "0%",
                    background: stats.cv.disponibles <= 0 ? "#ef4444" : stats.cv.disponibles <= 2 ? "#f59e0b" : "#22c55e",
                  }}
                />
              </div>

              {(!stats.recientes || stats.recientes.length === 0) ? (
                <p className="text-[11px]" style={{ color: "#64748b" }}>
                  Aún no has enviado ningún CV esta semana.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stats.recientes.slice(0, 5).map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded text-[11px]"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <span className="text-base">📨</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" style={{ color: "#f1f5f9" }}>{r.empresa}</p>
                        <p className="truncate" style={{ color: "#64748b" }}>{r.puesto || r.email}</p>
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: "#64748b" }}>
                        {r.fecha ? new Date(r.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : ""}
                      </span>
                    </div>
                  ))}
                  {stats.recientes.length > 5 && (
                    <p className="text-[10px] text-center" style={{ color: "#64748b" }}>
                      +{stats.recientes.length - 5} envíos más
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="sticky top-14 z-10" style={{ background: "#0f1117", borderBottom: "1px solid #2d3142" }}>
        <div className="max-w-2xl mx-auto px-4">
          <nav className="flex">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium transition"
                style={{
                  borderBottom: activeTab === tab.id ? "2px solid #22c55e" : "2px solid transparent",
                  color: activeTab === tab.id ? "#22c55e" : "#64748b",
                }}>
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Tab content ── */}
      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* ── TAB 1: Buscar empresa ── */}
        {activeTab === "buscar" && (
          <div className="space-y-4">
            {/* Buscador */}
            <div className="card-game p-5">
              <label className="block text-xs font-semibold mb-2" style={{ color: "#94a3b8" }}>
                Nombre de la empresa
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ej: Mercadona, Telefónica, Inditex..."
                  className="flex-1 text-sm"
                />
                <button
                  onClick={handleBuscar}
                  disabled={buscando || nombre.trim().length < 2}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition"
                  style={{
                    background: buscando ? "#252836" : "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: buscando ? "#64748b" : "#fff",
                    opacity: nombre.trim().length < 2 ? 0.5 : 1,
                  }}
                >
                  {buscando ? "Buscando..." : "Buscar"}
                </button>
              </div>
              <p className="text-[10px] mt-2" style={{ color: "#475569" }}>
                Buscamos en Google Places: web oficial, teléfono, dirección, Google Maps, rating y más.
              </p>
            </div>

            {/* Loading */}
            {buscando && (
              <div className="card-game p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
              </div>
            )}

            {/* Error */}
            {error && !buscando && (
              <div className="rounded-lg p-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-xs font-medium" style={{ color: "#ef4444" }}>{error}</p>
              </div>
            )}

            {/* Éxito */}
            {exito && (
              <div className="rounded-lg p-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <p className="text-sm font-semibold mb-2" style={{ color: "#22c55e" }}>{exito}</p>
                {sendResult && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                      <span>⏰</span>
                      <span>Envío estimado: <strong style={{ color: "#f1f5f9" }}>{sendResult.estimatedTime}</strong></span>
                    </div>
                    {sendResult.horaLocal && (
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                        <span>🕐</span>
                        <span>Hora local empresa: <strong style={{ color: "#f1f5f9" }}>{sendResult.horaLocal}</strong></span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                      <span>📊</span>
                      <span>Estrategia: <strong style={{ color: sendResult.strategy === "optimo" ? "#22c55e" : "#f59e0b" }}>{sendResult.strategy === "optimo" ? "Ventana óptima" : "Envío inmediato"}</strong></span>
                    </div>
                    {sendResult.positionInQueue > 0 && (
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                        <span>📬</span>
                        <span>Posición en cola: <strong style={{ color: "#f1f5f9" }}>#{sendResult.positionInQueue}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── LISTA DE RESULTADOS (múltiples empresas) ── */}
            {empresas.length > 1 && !empresaSeleccionada && !buscando && (
              <div className="space-y-3">
                <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>
                  {empresas.length} resultados para "{nombre}" — selecciona la correcta:
                </p>
                {empresas.map((emp, i) => (
                  <button
                    key={i}
                    onClick={() => seleccionarEmpresa(emp)}
                    className="card-game p-4 w-full text-left transition hover:scale-[1.01] cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm" style={{ color: "#f1f5f9" }}>{emp.nombre}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {emp.sector && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>
                              {emp.sector}
                            </span>
                          )}
                          {emp.googleAddress && (
                            <span className="text-[10px] truncate max-w-[200px]" style={{ color: "#64748b" }}>
                              📍 {emp.googleAddress}
                            </span>
                          )}
                        </div>
                      </div>
                      {emp.googleRating && (
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>★ {emp.googleRating}</span>
                          {emp.googleReviews && (
                            <p className="text-[10px]" style={{ color: "#64748b" }}>({emp.googleReviews})</p>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ── DETALLE DE EMPRESA SELECCIONADA ── */}
            {empresaSeleccionada && !buscando && (
              <div id="empresa-detalle" className="card-game p-5 space-y-4">
                {/* Botón volver si hay múltiples */}
                {empresas.length > 1 && (
                  <button onClick={volverALista}
                    className="text-[11px] font-medium mb-1" style={{ color: "#60a5fa" }}>
                    ← Volver a resultados
                  </button>
                )}

                {/* Nombre y fuente */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: "#f1f5f9" }}>{empresaSeleccionada.nombre}</h2>
                    <p className="text-[11px] mt-0.5" style={{ color: "#475569" }}>
                      {empresaSeleccionada.sector && `${empresaSeleccionada.sector} · `}
                      Google Places
                    </p>
                  </div>
                  {empresaSeleccionada.googleRating && (
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>★ {empresaSeleccionada.googleRating}</span>
                      <p className="text-[10px]" style={{ color: "#64748b" }}>{empresaSeleccionada.googleReviews} reseñas</p>
                    </div>
                  )}
                </div>

                {/* Info extraída */}
                <div className="space-y-2 text-xs">
                  {empresaSeleccionada.emailRrhh && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#64748b" }}>📧 Email:</span>
                      <span style={{ color: "#22c55e" }} className="font-medium">{empresaSeleccionada.emailRrhh}</span>
                    </div>
                  )}

                  {empresaSeleccionada.emailsExtraidos.length > 1 && (
                    <div>
                      <button
                        onClick={() => setMostrarTodosEmails(!mostrarTodosEmails)}
                        className="text-[10px] font-medium"
                        style={{ color: "#60a5fa" }}
                      >
                        {mostrarTodosEmails ? "▲ Ocultar" : `▼ ${empresaSeleccionada.emailsExtraidos.length - 1} emails alternativos`}
                      </button>
                      {mostrarTodosEmails && (
                        <div className="mt-1 space-y-0.5">
                          {empresaSeleccionada.emailsExtraidos
                            .filter(e => e !== empresaSeleccionada.emailRrhh)
                            .map((e, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-[10px]" style={{ color: "#475569" }}>{e}</span>
                                <button
                                  onClick={() => handleEnviarCV(e)}
                                  className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                                >
                                  Usar este
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {empresaSeleccionada.urlWeb && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#64748b" }}>🌐 Web:</span>
                      <a href={empresaSeleccionada.urlWeb} target="_blank" rel="noopener noreferrer"
                        className="font-medium hover:underline" style={{ color: "#60a5fa" }}>
                        {empresaSeleccionada.urlWeb.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    </div>
                  )}

                  {empresaSeleccionada.telefono && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#64748b" }}>📞 Tel:</span>
                      <span style={{ color: "#94a3b8" }}>{empresaSeleccionada.telefono}</span>
                    </div>
                  )}

                  {empresaSeleccionada.googleAddress && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#64748b" }}>📍</span>
                      <span style={{ color: "#94a3b8" }}>{empresaSeleccionada.googleAddress}</span>
                    </div>
                  )}

                  {empresaSeleccionada.googleMapsUrl && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#64748b" }}>🗺️</span>
                      <a href={empresaSeleccionada.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                        className="font-medium hover:underline" style={{ color: "#60a5fa" }}>
                        Ver en Google Maps →
                      </a>
                    </div>
                  )}

                  {empresaSeleccionada.paginaEmpleo && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#64748b" }}>💼 Empleo:</span>
                      <a href={empresaSeleccionada.paginaEmpleo} target="_blank" rel="noopener noreferrer"
                        className="font-medium hover:underline" style={{ color: "#60a5fa" }}>
                        Ver ofertas →
                      </a>
                    </div>
                  )}
                </div>

                {/* Acciones de envío */}
                {empresaSeleccionada.emailRrhh ? (
                  <div className="pt-2 space-y-3" style={{ borderTop: "1px solid #2d3142" }}>
                    {/* Selector de estrategia */}
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: "#94a3b8" }}>
                        Estrategia de envío
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { id: "optimo" as const, label: "🎯 Horario óptimo", sub: "El CV llega cuando lo van a leer" },
                          { id: "ahora" as const, label: "⚡ Enviar ya", sub: "Inmediato, sin esperas" },
                        ]).map(s => (
                          <button key={s.id} type="button" onClick={() => setSendStrategy(s.id)}
                            className="py-2.5 px-3 rounded-lg text-left transition"
                            style={{
                              background: sendStrategy === s.id ? "rgba(34,197,94,0.1)" : "#161922",
                              border: sendStrategy === s.id ? "1.5px solid rgba(34,197,94,0.3)" : "1px solid #252836",
                            }}>
                            <div className="text-[11px] font-semibold" style={{ color: sendStrategy === s.id ? "#22c55e" : "#f1f5f9" }}>{s.label}</div>
                            <div className="text-[9px] mt-0.5" style={{ color: "#475569" }}>{s.sub}</div>
                          </button>
                        ))}
                      </div>
                      {sendStrategy === "optimo" && (
                        <p className="text-[10px] mt-1.5" style={{ color: "#4ade80" }}>
                          🎯 Analizamos la zona horaria y enviamos en su ventana de máxima apertura (9-10:30am hora local).
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleEnviarCV()}
                      disabled={enviando}
                      className="w-full py-3 rounded-lg font-bold text-sm transition"
                      style={{
                        background: enviando ? "#252836" : "linear-gradient(135deg, #22c55e, #16a34a)",
                        color: enviando ? "#64748b" : "#fff",
                      }}
                    >
                      {enviando ? "Enviando..." : `📤 Enviar CV a ${empresaSeleccionada.nombre.split(" ")[0]}`}
                    </button>
                  </div>
                ) : (
                  <div className="pt-2" style={{ borderTop: "1px solid #2d3142" }}>
                    <div className="rounded-lg p-3" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                      <p className="text-xs font-medium mb-1" style={{ color: "#f59e0b" }}>⚠️ Email no encontrado</p>
                      <p className="text-[11px]" style={{ color: "#64748b" }}>
                        Google no proporciona el email corporativo. Ve a la pestaña <button onClick={() => { setEnvioPrefillName(empresaSeleccionada.nombre); setEnvioTabKey(prev => prev + 1); setActiveTab("envio"); }} className="font-medium underline" style={{ color: "#22c55e" }}>"Envío personalizado"</button> para buscar por URL o introducirlo manualmente.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB ETTs: Buscar ETTs por ciudad ── */}
        {activeTab === "ett" && (
          <div className="space-y-4">
            {/* Buscador de ETTs por ciudad */}
            <div className="card-game p-5">
              <label className="block text-xs font-semibold mb-2" style={{ color: "#94a3b8" }}>
                Buscar ETTs en tu ciudad
              </label>
              <p className="text-[10px] mb-3" style={{ color: "#475569" }}>
                Encuentra agencias de empleo temporal (ETTs) cerca de ti. Envíales tu CV con carta adaptada.
              </p>
              <div className="flex gap-2">
                <input
                  ref={ettInputRef}
                  type="text"
                  value={ettCity}
                  onChange={e => setEttCity(e.target.value)}
                  onKeyDown={handleEttKeyDown}
                  placeholder="Ej: Madrid, Barcelona, Valencia..."
                  className="flex-1 text-sm"
                />
                <button
                  onClick={handleBuscarETT}
                  disabled={ettBuscando || ettCity.trim().length < 2}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition"
                  style={{
                    background: ettBuscando ? "#252836" : "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: ettBuscando ? "#64748b" : "#fff",
                    opacity: ettCity.trim().length < 2 ? 0.5 : 1,
                  }}
                >
                  {ettBuscando ? "Buscando..." : "Buscar ETTs"}
                </button>
              </div>
            </div>

            {/* Loading */}
            {ettBuscando && (
              <div className="card-game p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
              </div>
            )}

            {/* Error */}
            {error && !ettBuscando && (
              <div className="rounded-lg p-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-xs font-medium" style={{ color: "#ef4444" }}>{error}</p>
              </div>
            )}

            {/* Éxito */}
            {exito && (
              <div className="rounded-lg p-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <p className="text-sm font-semibold mb-2" style={{ color: "#22c55e" }}>{exito}</p>
                {sendResult && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                      <span>⏰</span>
                      <span>Envío estimado: <strong style={{ color: "#f1f5f9" }}>{sendResult.estimatedTime}</strong></span>
                    </div>
                    {sendResult.horaLocal && (
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                        <span>🕐</span>
                        <span>Hora local empresa: <strong style={{ color: "#f1f5f9" }}>{sendResult.horaLocal}</strong></span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                      <span>📊</span>
                      <span>Estrategia: <strong style={{ color: sendResult.strategy === "optimo" ? "#22c55e" : "#f59e0b" }}>{sendResult.strategy === "optimo" ? "Ventana óptima" : "Envío inmediato"}</strong></span>
                    </div>
                    {sendResult.positionInQueue > 0 && (
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                        <span>📬</span>
                        <span>Posición en cola: <strong style={{ color: "#f1f5f9" }}>#{sendResult.positionInQueue}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── LISTA DE RESULTADOS (múltiples ETTs) ── */}
            {empresas.length > 1 && !empresaSeleccionada && !ettBuscando && (
              <div className="space-y-3">
                <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>
                  {empresas.length} ETTs en {ettCity} — selecciona una:
                </p>
                {empresas.map((emp, i) => (
                  <button
                    key={i}
                    onClick={() => seleccionarEmpresa(emp)}
                    className="card-game p-4 w-full text-left transition hover:scale-[1.01] cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm" style={{ color: "#f1f5f9" }}>{emp.nombre}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {emp.sector && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>
                              {emp.sector}
                            </span>
                          )}
                          {emp.googleAddress && (
                            <span className="text-[10px] truncate max-w-[200px]" style={{ color: "#64748b" }}>
                              📍 {emp.googleAddress}
                            </span>
                          )}
                        </div>
                      </div>
                      {emp.googleRating && (
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>★ {emp.googleRating}</span>
                          {emp.googleReviews && (
                            <p className="text-[10px]" style={{ color: "#64748b" }}>({emp.googleReviews})</p>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ── DETALLE DE ETT SELECCIONADA ── */}
            {empresaSeleccionada && !ettBuscando && (
              <div id="ett-detalle" className="card-game p-5 space-y-4">
                {/* Botón volver si hay múltiples */}
                {empresas.length > 1 && (
                  <button onClick={volverALista}
                    className="text-[11px] font-medium mb-1" style={{ color: "#60a5fa" }}>
                    ← Volver a resultados
                  </button>
                )}

                {/* Nombre y fuente */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: "#f1f5f9" }}>{empresaSeleccionada.nombre}</h2>
                    <p className="text-[11px] mt-0.5" style={{ color: "#475569" }}>
                      {empresaSeleccionada.sector && `${empresaSeleccionada.sector} · `}
                      Google Places
                    </p>
                  </div>
                  {empresaSeleccionada.googleRating && (
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>★ {empresaSeleccionada.googleRating}</span>
                      <p className="text-[10px]" style={{ color: "#64748b" }}>{empresaSeleccionada.googleReviews} reseñas</p>
                    </div>
                  )}
                </div>

                {/* Info extraída */}
                <div className="space-y-2 text-xs">
                  {empresaSeleccionada.emailRrhh && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#64748b" }}>📧 Email:</span>
                      <span style={{ color: "#22c55e" }} className="font-medium">{empresaSeleccionada.emailRrhh}</span>
                    </div>
                  )}

                  {empresaSeleccionada.emailsExtraidos.length > 1 && (
                    <div>
                      <button
                        onClick={() => setMostrarTodosEmails(!mostrarTodosEmails)}
                        className="text-[10px] font-medium"
                        style={{ color: "#60a5fa" }}
                      >
                        {mostrarTodosEmails ? "▲ Ocultar" : `▼ ${empresaSeleccionada.emailsExtraidos.length - 1} emails alternativos`}
                      </button>
                      {mostrarTodosEmails && (
                        <div className="mt-1 space-y-0.5">
                          {empresaSeleccionada.emailsExtraidos
                            .filter(e => e !== empresaSeleccionada.emailRrhh)
                            .map((e, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-[10px]" style={{ color: "#475569" }}>{e}</span>
                                <button
                                  onClick={() => handleEnviarCV(e)}
                                  className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                                >
                                  Usar este
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {empresaSeleccionada.urlWeb && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#64748b" }}>🌐 Web:</span>
                      <a href={empresaSeleccionada.urlWeb} target="_blank" rel="noopener noreferrer"
                        className="font-medium hover:underline" style={{ color: "#60a5fa" }}>
                        {empresaSeleccionada.urlWeb.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    </div>
                  )}

                  {empresaSeleccionada.telefono && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#64748b" }}>📞 Tel:</span>
                      <span style={{ color: "#94a3b8" }}>{empresaSeleccionada.telefono}</span>
                    </div>
                  )}

                  {empresaSeleccionada.googleAddress && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#64748b" }}>📍</span>
                      <span style={{ color: "#94a3b8" }}>{empresaSeleccionada.googleAddress}</span>
                    </div>
                  )}

                  {empresaSeleccionada.googleMapsUrl && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#64748b" }}>🗺️</span>
                      <a href={empresaSeleccionada.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                        className="font-medium hover:underline" style={{ color: "#60a5fa" }}>
                        Ver en Google Maps →
                      </a>
                    </div>
                  )}

                  {empresaSeleccionada.paginaEmpleo && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#64748b" }}>💼 Empleo:</span>
                      <a href={empresaSeleccionada.paginaEmpleo} target="_blank" rel="noopener noreferrer"
                        className="font-medium hover:underline" style={{ color: "#60a5fa" }}>
                        Ver ofertas →
                      </a>
                    </div>
                  )}
                </div>

                {/* Acciones de envío */}
                {empresaSeleccionada.emailRrhh ? (
                  <div className="pt-2 space-y-3" style={{ borderTop: "1px solid #2d3142" }}>
                    {/* Nota: carta adaptada para ETTs */}
                    <div className="rounded-lg p-2" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)" }}>
                      <p className="text-[10px]" style={{ color: "#4ade80" }}>
                        💡 La carta se adaptará automáticamente: "Estimado equipo de selección de {empresaSeleccionada.nombre}..."
                      </p>
                    </div>

                    {/* Selector de estrategia */}
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: "#94a3b8" }}>
                        Estrategia de envío
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { id: "optimo" as const, label: "🎯 Horario óptimo", sub: "El CV llega cuando lo van a leer" },
                          { id: "ahora" as const, label: "⚡ Enviar ya", sub: "Inmediato, sin esperas" },
                        ]).map(s => (
                          <button key={s.id} type="button" onClick={() => setSendStrategy(s.id)}
                            className="py-2.5 px-3 rounded-lg text-left transition"
                            style={{
                              background: sendStrategy === s.id ? "rgba(34,197,94,0.1)" : "#161922",
                              border: sendStrategy === s.id ? "1.5px solid rgba(34,197,94,0.3)" : "1px solid #252836",
                            }}>
                            <div className="text-[11px] font-semibold" style={{ color: sendStrategy === s.id ? "#22c55e" : "#f1f5f9" }}>{s.label}</div>
                            <div className="text-[9px] mt-0.5" style={{ color: "#475569" }}>{s.sub}</div>
                          </button>
                        ))}
                      </div>
                      {sendStrategy === "optimo" && (
                        <p className="text-[10px] mt-1.5" style={{ color: "#4ade80" }}>
                          🎯 Analizamos la zona horaria y enviamos en su ventana de máxima apertura (9-10:30am hora local).
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleEnviarCV()}
                      disabled={enviando}
                      className="w-full py-3 rounded-lg font-bold text-sm transition"
                      style={{
                        background: enviando ? "#252836" : "linear-gradient(135deg, #22c55e, #16a34a)",
                        color: enviando ? "#64748b" : "#fff",
                      }}
                    >
                      {enviando ? "Enviando..." : `📤 Enviar CV a ${empresaSeleccionada.nombre.split(" ")[0]}`}
                    </button>
                  </div>
                ) : (
                  <div className="pt-2" style={{ borderTop: "1px solid #2d3142" }}>
                    <div className="rounded-lg p-3" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                      <p className="text-xs font-medium mb-1" style={{ color: "#f59e0b" }}>⚠️ Email no encontrado</p>
                      <p className="text-[11px]" style={{ color: "#64748b" }}>
                        Google no proporciona el email corporativo. Ve a la pestaña <button onClick={() => { setEnvioPrefillName(empresaSeleccionada.nombre); setEnvioTabKey(prev => prev + 1); setActiveTab("envio"); }} className="font-medium underline" style={{ color: "#22c55e" }}>"Envío personalizado"</button> para buscar por URL o introducirlo manualmente.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Envío personalizado ── */}
        {activeTab === "envio" && (
          <Suspense fallback={
            <div className="card-game p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
            </div>
          }>
            <AutoSendSetup
              key={envioTabKey}
              userId={userId}
              initialCompanyName={envioPrefillName}
              onJobScheduled={handleJobScheduled}
              onRateLimitUpdate={handleRateLimitUpdate}
              onViewHistory={() => setActiveTab("historial")}
            />
          </Suspense>
        )}

        {/* ── TAB 3: Historial ── */}
        {activeTab === "historial" && (
          <CVSenderDashboard userId={userId} userPlan={(stats?.plan as "free" | "basico" | "pro" | "empresa") || "free"} />
        )}

      </main>

      {/* ── MODAL: Preview de la carta antes de enviar ── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="card-game max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4" style={{ background: "#111827", border: "1px solid #2d3142" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: "#f1f5f9" }}>📄 Previsualizar envío</h3>
              <button onClick={() => setShowPreview(false)} className="text-sm" style={{ color: "#64748b" }}>✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span style={{ color: "#64748b" }}>Para:</span>
                <span className="font-medium" style={{ color: "#22c55e" }}>{previewEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: "#64748b" }}>Asunto:</span>
                <span style={{ color: "#94a3b8" }}>{previewSubject}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: "#64748b" }}>CV:</span>
                <span style={{ color: "#94a3b8" }}>Tu CV en PDF adjunto</span>
              </div>
            </div>

            {/* Selector de CV (si hay múltiples) */}
            {cvList.length > 1 && (
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>CV a enviar:</label>
                <select value={cvSeleccionado} onChange={e => setCvSeleccionado(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#2d3142] rounded-lg px-3 py-2 text-xs text-[#f1f5f9]">
                  {cvList.map(cv => (
                    <option key={cv.id} value={cv.id}>{cv.nombre || `CV ${cv.id.slice(0,8)}`}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Carta */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "#94a3b8" }}>Carta de presentación:</label>
              {previewLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6" style={{ border: "2px solid #2d3142", borderTopColor: "#22c55e" }} />
                </div>
              ) : (
                <div className="rounded-lg p-4 text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto" style={{ background: "#0f1117", border: "1px solid #1e212b", color: "#cbd5e1" }}>
                  {previewCarta}
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid #2d3142" }}>
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-2.5 rounded-lg text-xs font-medium transition"
                style={{ background: "#252836", color: "#94a3b8" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEnvio}
                disabled={previewLoading}
                className="flex-1 py-2.5 rounded-lg text-xs font-bold transition"
                style={{ background: previewLoading ? "#252836" : "linear-gradient(135deg, #22c55e, #16a34a)", color: previewLoading ? "#64748b" : "#fff" }}
              >
                ✅ Confirmar envío
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirmación post-envío ── */}
      {showConfirm && confirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="card-game max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4" style={{ background: "#111827", border: "1px solid #22c55e" }}>
            <div className="text-center">
              <span className="text-3xl">✅</span>
              <h3 className="text-lg font-bold mt-2" style={{ color: "#22c55e" }}>¡CV enviado!</h3>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg p-4 space-y-2" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.1)" }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748b" }}>Empresa:</span>
                  <span className="font-medium" style={{ color: "#f1f5f9" }}>{confirmData.empresa}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748b" }}>Email:</span>
                  <span className="font-medium" style={{ color: "#22c55e" }}>{confirmData.email}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748b" }}>Asunto:</span>
                  <span className="font-medium" style={{ color: "#94a3b8" }}>{confirmData.subject}</span>
                </div>
                {confirmData.estimatedTime && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "#64748b" }}>Envío estimado:</span>
                    <span className="font-medium" style={{ color: "#f59e0b" }}>{confirmData.estimatedTime}</span>
                  </div>
                )}
                {confirmData.horaLocal && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "#64748b" }}>Hora local:</span>
                    <span className="font-medium" style={{ color: "#94a3b8" }}>{confirmData.horaLocal}</span>
                  </div>
                )}
              </div>

              {/* Carta enviada */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>📧 Carta enviada:</label>
                <div className="rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto" style={{ background: "#0f1117", border: "1px solid #1e212b", color: "#cbd5e1" }}>
                  {confirmData.carta}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowConfirm(false)}
              className="w-full py-2.5 rounded-lg text-sm font-bold transition"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff" }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
