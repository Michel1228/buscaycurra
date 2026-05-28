"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

interface DatosEmpresa {
  nombre: string;
  emailRrhh: string | null;
  telefono: string | null;
  paginaEmpleo: string | null;
  dominio: string;
}

interface EnvioRealizado {
  id: string;
  company_name: string;
  company_email: string;
  sent_at: string;
}

export default function EmpresasPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [extrayendo, setExtrayendo] = useState(false);
  const [empresa, setEmpresa] = useState<DatosEmpresa | null>(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState("");
  const [enviosHoy, setEnviosHoy] = useState(0);
  const [limiteDiario, setLimiteDiario] = useState(2);
  const [userId, setUserId] = useState("");
  const [historial, setHistorial] = useState<EnvioRealizado[]>([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const supabase = getSupabaseBrowser();
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) { router.push("/auth/login"); return; }
    const uid = session.user.id;
    setUserId(uid);

    // Cargar envíos de hoy
    try {
      const res = await fetch(`/api/cv-sender/envios-hoy?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setEnviosHoy(data.enviados || 0);
        setLimiteDiario(data.limite || 2);
      }
    } catch {}

    // Cargar historial
    try {
      const { data: sends } = await supabase
        .from("cv_sends")
        .select("id, company_name, company_email, sent_at")
        .eq("user_id", uid)
        .order("sent_at", { ascending: false })
        .limit(20);
      if (sends) setHistorial(sends as EnvioRealizado[]);
    } catch {}
  }

  async function handleExtraer() {
    if (!url.trim()) return;
    setError("");
    setEmpresa(null);
    setExtrayendo(true);

    try {
      const res = await fetch("/api/company/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error extrayendo");

      setEmpresa(data.empresa);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExtrayendo(false);
    }
  }

  async function handleEnviarCV() {
    if (!empresa || !userId) return;
    if (enviosHoy >= limiteDiario) {
      setError(`Límite diario alcanzado (${limiteDiario} envíos). Mejora tu plan.`);
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
          companyUrl: url.trim(),
          jobTitle: "Candidatura espontánea",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");

      setEnviosHoy((prev) => prev + 1);
      setExito(`✅ CV enviado a ${empresa.nombre}`);

      // Refrescar historial
      const supabase = getSupabaseBrowser();
      const { data: sends } = await supabase
        .from("cv_sends")
        .select("id, company_name, company_email, sent_at")
        .eq("user_id", userId)
        .order("sent_at", { ascending: false })
        .limit(20);
      if (sends) setHistorial(sends as EnvioRealizado[]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
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
            Sin esperar a que publiquen una oferta. Tú tomas la iniciativa.
          </p>
          <p className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.7)" }}>
            {enviosHoy}/{limiteDiario} envíos hoy
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Input URL */}
        <div className="card-game p-5">
          <label className="text-xs font-semibold mb-2 block" style={{ color: "#f1f5f9" }}>
            URL de la empresa
          </label>
          <p className="text-[10px] mb-3" style={{ color: "#64748b" }}>
            Pega la web de la empresa. Extraemos automáticamente su email de RRHH.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExtraer()}
              placeholder="https://www.empresa-ejemplo.com"
              className="flex-1 px-4 py-2.5 rounded-lg text-sm border outline-none transition"
              style={{
                background: "#0f1117",
                border: "1px solid #2d3142",
                color: "#f1f5f9",
              }}
            />
            <button
              onClick={handleExtraer}
              disabled={extrayendo || !url.trim()}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition"
              style={{
                background: extrayendo ? "#1e212b" : "linear-gradient(135deg, #22c55e, #16a34a)",
                color: extrayendo ? "#64748b" : "#fff",
                opacity: !url.trim() ? 0.5 : 1,
              }}
            >
              {extrayendo ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-t-transparent" style={{ borderColor: "#64748b", borderTopColor: "transparent" }} />
                  Extrayendo...
                </span>
              ) : (
                "Extraer emails"
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mt-3 rounded-lg px-4 py-3 text-xs"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444",
              }}
            >
              {error}
            </div>
          )}

          {/* Éxito */}
          {exito && (
            <div
              className="mt-3 rounded-lg px-4 py-3 text-xs"
              style={{
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.2)",
                color: "#22c55e",
              }}
            >
              {exito}
            </div>
          )}
        </div>

        {/* Resultado extracción */}
        {empresa && (
          <div className="card-game p-5 space-y-3">
            <h3 className="text-sm font-bold" style={{ color: "#22c55e" }}>
              {empresa.nombre}
            </h3>

            {/* Email */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] block" style={{ color: "#64748b" }}>
                  Email RRHH
                </span>
                <span className="text-sm font-mono" style={{ color: empresa.emailRrhh ? "#22c55e" : "#f59e0b" }}>
                  {empresa.emailRrhh || "No encontrado (usaremos email genérico)"}
                </span>
              </div>
              {empresa.emailRrhh && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(empresa.emailRrhh!);
                  }}
                  className="text-[10px] px-2 py-1 rounded"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                >
                  Copiar
                </button>
              )}
            </div>

            {/* Teléfono */}
            {empresa.telefono && (
              <div>
                <span className="text-[10px] block" style={{ color: "#64748b" }}>
                  Teléfono
                </span>
                <span className="text-xs" style={{ color: "#94a3b8" }}>
                  {empresa.telefono}
                </span>
              </div>
            )}

            {/* Página empleo */}
            {empresa.paginaEmpleo && (
              <div>
                <span className="text-[10px] block" style={{ color: "#64748b" }}>
                  Página de empleo
                </span>
                <a
                  href={empresa.paginaEmpleo}
                  target="_blank"
                  rel="noopener"
                  className="text-xs underline"
                  style={{ color: "#22c55e" }}
                >
                  {empresa.paginaEmpleo}
                </a>
              </div>
            )}

            {/* Botón enviar */}
            <button
              onClick={handleEnviarCV}
              disabled={enviando || enviosHoy >= limiteDiario}
              className="w-full py-3 rounded-xl text-sm font-bold transition"
              style={{
                background:
                  enviando || enviosHoy >= limiteDiario
                    ? "#1e212b"
                    : "linear-gradient(135deg, #22c55e, #16a34a)",
                color: enviando || enviosHoy >= limiteDiario ? "#64748b" : "#fff",
                cursor: enviosHoy >= limiteDiario ? "not-allowed" : "pointer",
              }}
            >
              {enviando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: "#64748b", borderTopColor: "transparent" }} />
                  Enviando CV...
                </span>
              ) : enviosHoy >= limiteDiario ? (
                `Límite diario alcanzado (${limiteDiario}/${limiteDiario})`
              ) : (
                `📤 Enviar mi CV a ${empresa.nombre}`
              )}
            </button>
            <p className="text-center text-[10px]" style={{ color: "#475569" }}>
              {empresa.emailRrhh
                ? "Se enviará al email extraído de su web"
                : "Se usará un email genérico (rrhh@dominio.com)"}
            </p>
          </div>
        )}

        {/* Historial */}
        {historial.length > 0 && (
          <div className="card-game p-5">
            <h3 className="text-xs font-semibold mb-3" style={{ color: "#f1f5f9" }}>
              📋 Últimos envíos
            </h3>
            <div className="space-y-2">
              {historial.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: "1px solid rgba(45,49,66,0.3)" }}
                >
                  <div>
                    <span className="text-[11px] font-medium block" style={{ color: "#f1f5f9" }}>
                      {h.company_name}
                    </span>
                    <span className="text-[9px]" style={{ color: "#475569" }}>
                      {h.company_email}
                    </span>
                  </div>
                  <span className="text-[10px]" style={{ color: "#64748b" }}>
                    {new Date(h.sent_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div
          className="rounded-xl p-4"
          style={{
            background: "rgba(34,197,94,0.04)",
            border: "1px solid rgba(34,197,94,0.1)",
          }}
        >
          <h4 className="text-[11px] font-semibold mb-2" style={{ color: "#22c55e" }}>
            💡 ¿Cómo funciona?
          </h4>
          <ul className="space-y-1.5 text-[10px]" style={{ color: "#64748b" }}>
            <li>1. Pega la URL de cualquier empresa</li>
            <li>2. Extraemos emails de RRHH automáticamente</li>
            <li>3. Si no encontramos email, usamos rrhh@dominio.com</li>
            <li>4. Tu CV se envía con carta personalizada por IA</li>
            <li>5. La empresa tendrá tu CV en su base de datos para futuras vacantes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
