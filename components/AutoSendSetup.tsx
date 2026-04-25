"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface AutoSendSetupProps {
  userId: string;
  onJobScheduled?: () => void;
}

type Modo = "tengo-email" | "buscar-email" | "ya-aplique";

export default function AutoSendSetup({ userId, onJobScheduled }: AutoSendSetupProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [modo, setModo] = useState<Modo>("buscar-email");
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [useAI, setUseAI] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [scheduled, setScheduled] = useState<{ fecha: string } | null>(null);

  // Extractor de email
  const [urlBusqueda, setUrlBusqueda] = useState("");
  const [buscandoEmail, setBuscandoEmail] = useState(false);
  const [emailEncontrado, setEmailEncontrado] = useState<string | null>(null);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  // Pre-rellenar desde parámetros URL (cuando viene de Guzzi o de ofertas)
  useEffect(() => {
    const empresa = searchParams.get("empresa");
    const url = searchParams.get("url");
    const puesto = searchParams.get("puesto");
    if (empresa) setCompanyName(empresa);
    if (url) { setCompanyUrl(url); setUrlBusqueda(url); }
    if (puesto) setJobTitle(puesto);
  }, [searchParams]);

  const buscarEmail = async () => {
    if (!urlBusqueda.trim()) return;
    setBuscandoEmail(true);
    setBusquedaRealizada(false);
    setEmailEncontrado(null);
    try {
      const res = await fetch(`/api/empresas/analizar?url=${encodeURIComponent(urlBusqueda.trim())}`);
      const data = await res.json() as { emailRrhh?: string; nombre?: string };
      if (data.emailRrhh) {
        setEmailEncontrado(data.emailRrhh);
        setCompanyEmail(data.emailRrhh);
        if (data.nombre && !companyName.trim()) setCompanyName(data.nombre);
      }
    } catch {
      // silencioso — mostrar opciones al usuario
    }
    setBusquedaRealizada(true);
    setBuscandoEmail(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyName.trim()) { setError("Introduce el nombre de la empresa"); return; }

    if (modo === "tengo-email") {
      if (!companyEmail.trim()) { setError("Introduce el email de RRHH"); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail)) {
        setError("El email no parece válido"); return;
      }
    }

    if (modo === "buscar-email" && !companyEmail.trim()) {
      setError("Necesitas el email para enviar automáticamente. Si no lo encuentras, usa 'Ya apliqué yo' para registrarlo.");
      return;
    }

    setLoading(true);
    try {
      if (modo === "ya-aplique") {
        const res = await fetch("/api/cv-sender/registrar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, companyName: companyName.trim(), jobTitle: jobTitle.trim(), companyUrl: companyUrl.trim() || undefined }),
        });
        const data = await res.json() as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Error al registrar");
      } else {
        const res = await fetch("/api/cv-sender/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            companyName: companyName.trim(),
            companyEmail: companyEmail.trim().toLowerCase(),
            companyUrl: companyUrl.trim() || undefined,
            jobTitle: jobTitle.trim() || undefined,
            priority: "normal",
            useAIPersonalization: useAI,
          }),
        });
        const data = await res.json() as { error?: string; estimatedTimeFormatted?: string };
        if (!res.ok) throw new Error(data.error ?? "Error al programar");
        setScheduled({ fecha: data.estimatedTimeFormatted ?? "" });
      }
      setSuccess(true);
      onJobScheduled?.();
      setCompanyName(""); setCompanyEmail(""); setCompanyUrl(""); setJobTitle("");
      setUrlBusqueda(""); setEmailEncontrado(null); setBusquedaRealizada(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card-game p-8 text-center space-y-4">
        <h3 className="text-xl font-bold" style={{ color: "#7ed56f" }}>
          {modo === "ya-aplique" ? "Candidatura registrada" : "CV programado para envío"}
        </h3>
        {scheduled?.fecha && (
          <p className="text-sm" style={{ color: "#a8e6a1" }}>Se enviará el {scheduled.fecha}</p>
        )}
        <p className="text-xs" style={{ color: "#706a58" }}>
          Recibirás un email de confirmación cuando se procese.
        </p>
        <div className="flex gap-3 justify-center mt-4">
          <button onClick={() => { setSuccess(false); setScheduled(null); }}
            className="px-5 py-2 rounded-xl text-sm font-semibold"
            style={{ border: "1px solid #3d3c30", color: "#b0a890" }}>
            + Otro envío
          </button>
          <button onClick={() => router.push("/app/envios")} className="btn-game px-5 py-2 text-sm">
            Ver mis envíos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-game p-6">
      <h2 className="text-lg font-bold mb-1" style={{ color: "#f0ebe0" }}>Enviar candidatura</h2>
      <p className="text-sm mb-5" style={{ color: "#706a58" }}>
        Tu CV se envía con carta personalizada por IA. Elige cómo quieres gestionar el contacto.
      </p>

      {/* Selector de modo */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {([
          { id: "buscar-email" as Modo, titulo: "Buscar email", sub: "Pega la web de la empresa" },
          { id: "tengo-email" as Modo, titulo: "Tengo el email", sub: "Ya sé el contacto de RRHH" },
          { id: "ya-aplique" as Modo, titulo: "Ya apliqué yo", sub: "Solo quiero registrarlo" },
        ]).map(m => (
          <button key={m.id} type="button" onClick={() => { setModo(m.id); setError(null); }}
            className="py-3 px-3 rounded-xl text-xs font-semibold transition text-left"
            style={{
              background: modo === m.id ? "rgba(126,213,111,0.12)" : "rgba(42,42,30,0.5)",
              border: modo === m.id ? "2px solid rgba(126,213,111,0.4)" : "1px solid #3d3c30",
              color: modo === m.id ? "#7ed56f" : "#706a58",
            }}>
            <div className="font-bold mb-0.5 text-xs">{m.titulo}</div>
            <div style={{ opacity: 0.7, fontSize: "10px", lineHeight: "1.3" }}>{m.sub}</div>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl p-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-xs font-medium" style={{ color: "#f87171" }}>{error}</p>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">

        {/* ── Modo: BUSCAR EMAIL ── */}
        {modo === "buscar-email" && (
          <>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                Web de la empresa <span style={{ color: "#f87171" }}>*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlBusqueda}
                  onChange={e => { setUrlBusqueda(e.target.value); setCompanyUrl(e.target.value); }}
                  placeholder="https://www.empresa.com"
                  className="input-game flex-1"
                />
                <button type="button" onClick={() => void buscarEmail()} disabled={buscandoEmail || !urlBusqueda.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition flex-shrink-0"
                  style={{
                    background: buscandoEmail ? "#3d3c30" : "rgba(126,213,111,0.15)",
                    border: "1px solid rgba(126,213,111,0.3)",
                    color: buscandoEmail ? "#706a58" : "#7ed56f",
                  }}>
                  {buscandoEmail ? "Buscando..." : "Buscar email"}
                </button>
              </div>
              <p className="text-xs mt-1.5" style={{ color: "#504a3a" }}>
                Pega la URL de la empresa o de la oferta. Intentaremos encontrar el email de RRHH.
              </p>
            </div>

            {busquedaRealizada && (
              <div className="rounded-xl p-4" style={{
                background: emailEncontrado ? "rgba(126,213,111,0.06)" : "rgba(240,192,64,0.06)",
                border: emailEncontrado ? "1px solid rgba(126,213,111,0.2)" : "1px solid rgba(240,192,64,0.2)",
              }}>
                {emailEncontrado ? (
                  <>
                    <p className="text-xs font-semibold mb-2" style={{ color: "#7ed56f" }}>Email encontrado</p>
                    <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)}
                      className="input-game w-full text-sm" />
                    <p className="text-xs mt-1" style={{ color: "#504a3a" }}>Puedes editarlo si no es correcto.</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#f0c040" }}>No encontramos el email automáticamente</p>
                    <p className="text-xs mb-2" style={{ color: "#706a58" }}>
                      Busca en la web de la empresa su sección de empleo o contacto, copia el email y pégalo aquí:
                    </p>
                    <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)}
                      placeholder="rrhh@empresa.com (pégalo tú)" className="input-game w-full text-sm" />
                    <p className="text-xs mt-2" style={{ color: "#504a3a" }}>
                      O usa "Ya apliqué yo" para registrar que aplicaste por la web de la empresa.
                    </p>
                  </>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>Empresa</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="ej: Mercadona, Telefónica..." className="input-game w-full" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                Puesto <span className="font-normal text-xs" style={{ color: "#504a3a" }}>(opcional)</span>
              </label>
              <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                placeholder="ej: Camarero, Electricista..." className="input-game w-full" />
            </div>
          </>
        )}

        {/* ── Modo: TENGO EMAIL ── */}
        {modo === "tengo-email" && (
          <>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                Empresa <span style={{ color: "#f87171" }}>*</span>
              </label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="ej: Mercadona, Telefónica, Bar El Rincón..." className="input-game w-full" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                Puesto <span className="font-normal text-xs" style={{ color: "#504a3a" }}>(opcional)</span>
              </label>
              <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                placeholder="ej: Camarero, Electricista, Administrativo..." className="input-game w-full" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                Email de RRHH <span style={{ color: "#f87171" }}>*</span>
              </label>
              <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)}
                placeholder="rrhh@empresa.com" className="input-game w-full" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                Web de la empresa <span className="font-normal text-xs" style={{ color: "#504a3a" }}>(mejora la carta IA)</span>
              </label>
              <input type="url" value={companyUrl} onChange={e => setCompanyUrl(e.target.value)}
                placeholder="https://www.empresa.com" className="input-game w-full" />
            </div>
          </>
        )}

        {/* ── Modo: YA APLIQUÉ ── */}
        {modo === "ya-aplique" && (
          <>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                Empresa <span style={{ color: "#f87171" }}>*</span>
              </label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="ej: Mercadona, Telefónica..." className="input-game w-full" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                Puesto <span className="font-normal text-xs" style={{ color: "#504a3a" }}>(opcional)</span>
              </label>
              <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                placeholder="ej: Camarero, Electricista..." className="input-game w-full" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#b0a890" }}>
                Link de la oferta <span className="font-normal text-xs" style={{ color: "#504a3a" }}>(para hacer seguimiento)</span>
              </label>
              <input type="url" value={companyUrl} onChange={e => setCompanyUrl(e.target.value)}
                placeholder="https://infojobs.net/oferta/..." className="input-game w-full" />
            </div>

            <div className="rounded-xl p-4" style={{ background: "rgba(126,213,111,0.06)", border: "1px solid rgba(126,213,111,0.12)" }}>
              <p className="text-sm" style={{ color: "#a8e6a1" }}>
                Se guardará en tu historial para hacer seguimiento. No se enviará ningún email automático.
              </p>
            </div>
          </>
        )}

        {/* Personalización IA (solo modos de envío real) */}
        {modo !== "ya-aplique" && (
          <div className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: "rgba(126,213,111,0.06)", border: "1px solid rgba(126,213,111,0.12)" }}>
            <input id="useAI" type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-green-500 cursor-pointer" />
            <div>
              <label htmlFor="useAI" className="text-sm font-semibold cursor-pointer" style={{ color: "#a8e6a1" }}>
                Personalizar carta con IA
              </label>
              <p className="text-xs mt-0.5" style={{ color: "#706a58" }}>
                La IA adapta la carta a esta empresa. Aumenta mucho las respuestas.
              </p>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3.5 font-bold rounded-xl transition text-sm"
          style={{
            background: loading ? "#3d3c30" : "linear-gradient(135deg, #7ed56f, #5cb848)",
            color: loading ? "#706a58" : "#1a1a12",
            boxShadow: loading ? "none" : "0 4px 16px rgba(126,213,111,0.25)",
          }}>
          {loading
            ? "Procesando..."
            : modo === "ya-aplique"
              ? "Registrar candidatura"
              : "Enviar CV automáticamente"}
        </button>
      </form>
    </div>
  );
}
