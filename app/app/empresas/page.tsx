"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

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

export default function EmpresasPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [empresa, setEmpresa] = useState<EmpresaCompleta | null>(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState("");
  const [enviosHoy, setEnviosHoy] = useState(0);
  const [limiteDiario, setLimiteDiario] = useState(2);
  const [userId, setUserId] = useState("");
  const [historial, setHistorial] = useState<EmpresaGuardada[]>([]);
  const [mostrarTodosEmails, setMostrarTodosEmails] = useState(false);
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
      const [enviosRes, histRes] = await Promise.all([
        fetch(`/api/cv-sender/envios-hoy?userId=${session.user.id}`),
        supabase
          .from("cv_sends")
          .select("company_name, company_email, sent_at")
          .eq("user_id", session.user.id)
          .order("sent_at", { ascending: false })
          .limit(20),
      ]);

      if (enviosRes.ok) {
        const d = await enviosRes.json();
        setEnviosHoy(d.enviados || 0);
        setLimiteDiario(d.limite || 2);
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

  async function handleBuscar() {
    const term = nombre.trim();
    if (!term || term.length < 2) {
      setError("Escribe al menos 2 letras");
      return;
    }

    setError("");
    setEmpresa(null);
    setExito("");
    setBuscando(true);

    try {
      const res = await fetch("/api/company/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: term }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");

      setEmpresa(data.empresa);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBuscando(false);
    }
  }

  async function handleEnviarCV(email?: string) {
    if (!empresa || !userId) return;
    if (enviosHoy >= limiteDiario) {
      setError(`Límite diario (${limiteDiario} envíos). Mejora tu plan.`);
      return;
    }

    setEnviando(true);
    setError("");
    setExito("");

    try {
      const res = await fetch("/api/cv-sender/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          companyName: empresa.nombre,
          companyUrl: empresa.urlWeb,
          jobTitle: "Candidatura espontánea",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");

      setEnviosHoy((p) => p + 1);
      setExito(`✅ CV enviado a ${empresa.nombre}`);

      setHistorial((prev) => [
        {
          nombre: empresa.nombre,
          dominio: empresa.dominio || "",
          emailRrhh: email || empresa.emailRrhh || "",
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

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      {/* Header */}
      <div
        className="py-8 px-4"
        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold" style={{ color: "#fff" }}>
            Enviar CV a empresas
          </h1>
          <p className="text-xs mt-1 opacity-80" style={{ color: "#fff" }}>
            Escribe el nombre de la empresa. Nosotros encontramos su web, email y datos de contacto.
          </p>
          <p className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.7)" }}>
            {enviosHoy}/{limiteDiario} envíos hoy • Sin necesidad de oferta publicada
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Buscador */}
        <div className="card-game p-5">
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#f1f5f9" }}>
            Nombre de la empresa
          </label>
          <p className="text-[10px] mb-3" style={{ color: "#64748b" }}>
            Solo el nombre. Ej: "Mercadona", "Inditex", "BBVA". Nosotros encontramos el resto.
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ej: Mercadona"
              className="flex-1 px-4 py-2.5 rounded-lg text-sm border outline-none transition"
              style={{
                background: "#0f1117",
                border: "1px solid #2d3142",
                color: "#f1f5f9",
              }}
            />
            <button
              onClick={handleBuscar}
              disabled={buscando || nombre.trim().length < 2}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition"
              style={{
                background: buscando ? "#1e212b" : "linear-gradient(135deg, #22c55e, #16a34a)",
                color: buscando ? "#64748b" : "#fff",
                opacity: nombre.trim().length < 2 ? 0.5 : 1,
              }}
            >
              {buscando ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {/* Mensajes */}
          {error && (
            <div
              className="mt-3 rounded-lg px-4 py-3 text-xs"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
            >
              {error}
            </div>
          )}
          {exito && (
            <div
              className="mt-3 rounded-lg px-4 py-3 text-xs"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}
            >
              {exito}
            </div>
          )}
        </div>

        {/* Resultado */}
        {empresa && (
          <div className="card-game overflow-hidden">
            {/* Cabecera */}
            <div className="p-5" style={{ borderBottom: "1px solid #2d3142" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold" style={{ color: "#22c55e" }}>
                      {empresa.nombre}
                    </h3>
                    {empresa.fuente === "google_places" && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(66,133,244,0.15)", color: "#4285f4" }}
                        title="Datos verificados por Google Places"
                      >
                        ✓ Google
                      </span>
                    )}
                  </div>
                  {empresa.sector && (
                    <span
                      className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}
                    >
                      {empresa.sector}
                    </span>
                  )}
                  {/* Google rating */}
                  {empresa.googleRating && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-xs" style={{ color: "#f59e0b" }}>
                        {"★".repeat(Math.round(empresa.googleRating))}
                        {"☆".repeat(5 - Math.round(empresa.googleRating))}
                      </span>
                      <span className="text-[10px]" style={{ color: "#94a3b8" }}>
                        {empresa.googleRating.toFixed(1)} ({empresa.googleReviews || 0} reseñas)
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <a
                    href={empresa.urlWeb || "#"}
                    target="_blank"
                    rel="noopener"
                    className="text-[10px] underline block"
                    style={{ color: "#64748b" }}
                  >
                    {empresa.dominio}
                  </a>
                  {empresa.descripcion && (
                    <p className="text-[9px] mt-1 max-w-[200px]" style={{ color: "#475569" }}>
                      {empresa.descripcion.slice(0, 120)}...
                    </p>
                  )}
                </div>
              </div>

              {/* ⚡ BOTÓN ENVIAR CV — visible inmediatamente */}
              <button
                onClick={() => handleEnviarCV()}
                disabled={enviando || enviosHoy >= limiteDiario}
                className="w-full mt-4 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
                style={{
                  background: enviando || enviosHoy >= limiteDiario ? "#1e212b" : "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: enviando || enviosHoy >= limiteDiario ? "#64748b" : "#fff",
                  boxShadow: enviando || enviosHoy >= limiteDiario ? "none" : "0 4px 20px rgba(34,197,94,0.3)",
                }}
              >
                {enviando ? (
                  <>⏳ Enviando CV...</>
                ) : enviosHoy >= limiteDiario ? (
                  `🚫 Límite diario (${limiteDiario}/${limiteDiario})`
                ) : (
                  <>📤 Enviar mi CV a {empresa.nombre}</>
                )}
              </button>
            </div>

            {/* Datos de contacto */}
            <div className="p-5 space-y-3">
              {/* Dirección Google */}
              {empresa.googleAddress && (
                <div className="flex items-center gap-2">
                  <span className="text-base">📍</span>
                  <div className="flex-1">
                    <span className="text-[9px] block" style={{ color: "#475569" }}>Dirección</span>
                    <span className="text-sm" style={{ color: "#94a3b8" }}>{empresa.googleAddress}</span>
                  </div>
                  {empresa.googleMapsUrl && (
                    <a
                      href={empresa.googleMapsUrl}
                      target="_blank"
                      rel="noopener"
                      className="text-[10px] px-2 py-1 rounded"
                      style={{ background: "rgba(66,133,244,0.15)", color: "#4285f4" }}
                    >
                      Maps ↗
                    </a>
                  )}
                </div>
              )}

              {/* Email principal */}
              {empresa.emailRrhh && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📧</span>
                    <div>
                      <span className="text-[9px] block" style={{ color: "#475569" }}>Email RRHH</span>
                      <span className="text-sm font-mono" style={{ color: "#22c55e" }}>
                        {empresa.emailRrhh}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(empresa.emailRrhh!);
                      setExito("📋 Copiado");
                      setTimeout(() => setExito(""), 2000);
                    }}
                    className="text-[10px] px-2 py-1 rounded"
                    style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                  >
                    Copiar
                  </button>
                </div>
              )}

              {/* Todos los emails */}
              {empresa.emailsExtraidos.length > 1 && (
                <div>
                  <button
                    onClick={() => setMostrarTodosEmails(!mostrarTodosEmails)}
                    className="text-[10px] flex items-center gap-1"
                    style={{ color: "#64748b" }}
                  >
                    {mostrarTodosEmails ? "▲ Ocultar" : `▼ ${empresa.emailsExtraidos.length - 1} emails más`}
                  </button>
                  {mostrarTodosEmails && (
                    <div className="mt-2 ml-7 space-y-1">
                      {empresa.emailsExtraidos
                        .filter((e) => e !== empresa.emailRrhh)
                        .map((e) => (
                          <div key={e} className="flex items-center justify-between text-[11px]">
                            <span className="font-mono" style={{ color: "#94a3b8" }}>{e}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(e);
                                setExito("📋 Copiado");
                                setTimeout(() => setExito(""), 2000);
                              }}
                              className="text-[9px]"
                              style={{ color: "#22c55e" }}
                            >
                              Copiar
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Teléfono */}
              {empresa.telefono && (
                <div className="flex items-center gap-2">
                  <span className="text-base">📞</span>
                  <div>
                    <span className="text-[9px] block" style={{ color: "#475569" }}>Teléfono</span>
                    <span className="text-sm" style={{ color: "#94a3b8" }}>{empresa.telefono}</span>
                  </div>
                </div>
              )}

              {/* Página de empleo */}
              {empresa.paginaEmpleo && (
                <div className="flex items-center gap-2">
                  <span className="text-base">💼</span>
                  <div>
                    <span className="text-[9px] block" style={{ color: "#475569" }}>Página de empleo</span>
                    <a
                      href={empresa.paginaEmpleo}
                      target="_blank"
                      rel="noopener"
                      className="text-sm underline"
                      style={{ color: "#22c55e" }}
                    >
                      Ver ofertas de {empresa.nombre}
                    </a>
                  </div>
                </div>
              )}

              {/* Redes sociales */}
              {(empresa.linkedin || empresa.twitter || empresa.instagram) && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-base">🌐</span>
                  <div className="flex gap-2">
                    {empresa.linkedin && (
                      <a href={empresa.linkedin} target="_blank" rel="noopener"
                        className="text-[10px] px-2 py-0.5 rounded"
                        style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
                        LinkedIn
                      </a>
                    )}
                    {empresa.twitter && (
                      <a href={empresa.twitter} target="_blank" rel="noopener"
                        className="text-[10px] px-2 py-0.5 rounded"
                        style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
                        Twitter
                      </a>
                    )}
                    {empresa.instagram && (
                      <a href={empresa.instagram} target="_blank" rel="noopener"
                        className="text-[10px] px-2 py-0.5 rounded"
                        style={{ background: "rgba(236,72,153,0.15)", color: "#f472b6" }}>
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botón enviar */}
            <div className="px-5 pb-5">
              <button
                onClick={() => handleEnviarCV()}
                disabled={enviando || enviosHoy >= limiteDiario}
                className="w-full py-3 rounded-xl text-sm font-bold transition"
                style={{
                  background: enviando || enviosHoy >= limiteDiario ? "#1e212b" : "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: enviando || enviosHoy >= limiteDiario ? "#64748b" : "#fff",
                }}
              >
                {enviando ? "Enviando..." :
                  enviosHoy >= limiteDiario ? `Límite diario (${limiteDiario}/${limiteDiario})` :
                  `📤 Enviar mi CV a ${empresa.nombre}`}
              </button>
            </div>
          </div>
        )}

        {/* Historial */}
        {historial.length > 0 && (
          <div className="card-game p-5">
            <h3 className="text-xs font-semibold mb-3" style={{ color: "#f1f5f9" }}>
              📋 Empresas contactadas
            </h3>
            <div className="space-y-1.5">
              {historial.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5"
                  style={{ borderBottom: "1px solid rgba(45,49,66,0.3)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: "#22c55e" }}>✓</span>
                    <span className="text-[11px] font-medium" style={{ color: "#f1f5f9" }}>
                      {h.nombre}
                    </span>
                  </div>
                  <span className="text-[9px]" style={{ color: "#475569" }}>
                    {new Date(h.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cómo funciona */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)" }}
        >
          <h4 className="text-[11px] font-semibold mb-2" style={{ color: "#22c55e" }}>
            💡 Así de simple
          </h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: "✏️", text: "Escribe el nombre de la empresa" },
              { icon: "🔍", text: "Encontramos web, email y datos" },
              { icon: "📤", text: "Envías tu CV en un clic" },
            ].map((s) => (
              <div key={s.icon}>
                <span className="text-xl block mb-1">{s.icon}</span>
                <span className="text-[9px]" style={{ color: "#64748b" }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
