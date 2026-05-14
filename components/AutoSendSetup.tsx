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

  const [urlBusqueda, setUrlBusqueda] = useState("");
  const [buscandoEmail, setBuscandoEmail] = useState(false);
  const [emailEncontrado, setEmailEncontrado] = useState<string | null>(null);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  // Selector de hora
  const [slotElegido, setSlotElegido] = useState<"auto" | "ahora" | "manana" | "custom">("auto");
  const [fechaCustom, setFechaCustom] = useState("");

  useEffect(() => {
    const empresa = searchParams.get("empresa");
    const url = searchParams.get("url");
    const puesto = searchParams.get("puesto");
    if (empresa) setCompanyName(empresa);
    if (url) { setCompanyUrl(url); setUrlBusqueda(url); }
    if (puesto) setJobTitle(puesto);
  }, [searchParams]);

  function calcularFechaEnvio(): string | undefined {
    const ahora = new Date();
    const h = ahora.getHours();
    const esDiaLaboral = ahora.getDay() >= 1 && ahora.getDay() <= 5;
    const esHoraLaboral = h >= 9 && h < 18;

    if (slotElegido === "ahora") {
      // Próximo minuto disponible (mínimo 1 min)
      const fecha = new Date(ahora.getTime() + 60_000);
      return fecha.toISOString();
    }
    if (slotElegido === "auto") {
      return undefined; // El servidor calcula la próxima hora laboral
    }
    if (slotElegido === "manana") {
      const manana = new Date(ahora);
      manana.setDate(manana.getDate() + 1);
      // Si mañana es sábado→ lunes, domingo→ lunes
      if (manana.getDay() === 6) manana.setDate(manana.getDate() + 2);
      if (manana.getDay() === 0) manana.setDate(manana.getDate() + 1);
      manana.setHours(9, 0, 0, 0);
      return manana.toISOString();
    }
    if (slotElegido === "custom" && fechaCustom) {
      return new Date(fechaCustom).toISOString();
    }
    return undefined;
  }

  function getSlotLabel(): string {
    const ahora = new Date();
    const h = ahora.getHours();
    const esDiaLaboral = ahora.getDay() >= 1 && ahora.getDay() <= 5;
    const esHoraLaboral = h >= 9 && h < 18;
    if (esDiaLaboral && esHoraLaboral) return "Ahora mismo";
    // Fuera de horario
    const sig = new Date(ahora);
    if (h >= 18) sig.setDate(sig.getDate() + 1);
    if (sig.getDay() === 6) sig.setDate(sig.getDate() + 2);
    if (sig.getDay() === 0) sig.setDate(sig.getDate() + 1);
    sig.setHours(9, 0, 0, 0);
    return `${sig.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })} 9:00h`;
  }

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
    } catch { /* silencioso */ }
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
      setError("Necesitas el email para enviar automáticamente. Si no lo encuentras, usa 'Ya apliqué yo'.");
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
            scheduledFor: calcularFechaEnvio(),
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
      <div className="card-game p-6 text-center space-y-3">
        <h3 className="text-base font-semibold" style={{ color: "#22c55e" }}>
          {modo === "ya-aplique" ? "Candidatura registrada" : "CV programado para envío"}
        </h3>
        {scheduled?.fecha && (
          <p className="text-xs" style={{ color: "#4ade80" }}>Se enviará el {scheduled.fecha}</p>
        )}
        <p className="text-[11px]" style={{ color: "#64748b" }}>Recibirás un email de confirmación cuando se procese.</p>
        <p className="text-[10px] mt-1 px-2" style={{ color: "#475569" }}>
          Algunas empresas prefieren el anonimato y no muestran su nombre público, pero tu candidatura ha sido enviada con éxito.
        </p>
        <div className="flex gap-2 justify-center mt-3">
          <button onClick={() => { setSuccess(false); setScheduled(null); }}
            className="px-4 py-2 rounded-lg text-xs font-medium"
            style={{ border: "1px solid #2d3142", color: "#94a3b8" }}>
            + Otro envío
          </button>
          <button onClick={() => router.push("/app/envios")} className="btn-game px-4 py-2 text-xs">
            Ver envíos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-game p-5">
      <h2 className="text-base font-semibold mb-0.5" style={{ color: "#f1f5f9" }}>Enviar candidatura</h2>
      <p className="text-[11px] mb-4" style={{ color: "#64748b" }}>
        Tu CV se envía con carta personalizada por IA.
      </p>

      {/* Selector de modo */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {([
          { id: "buscar-email" as Modo, titulo: "Buscar email", sub: "Pega la web" },
          { id: "tengo-email" as Modo, titulo: "Tengo email", sub: "Contacto directo" },
          { id: "ya-aplique" as Modo, titulo: "Ya apliqué", sub: "Solo registrar" },
        ]).map(m => (
          <button key={m.id} type="button" onClick={() => { setModo(m.id); setError(null); }}
            className="py-2.5 px-2 rounded-lg text-[10px] font-medium transition text-center"
            style={{
              background: modo === m.id ? "rgba(34,197,94,0.1)" : "#161922",
              border: modo === m.id ? "1.5px solid rgba(34,197,94,0.3)" : "1px solid #252836",
              color: modo === m.id ? "#22c55e" : "#64748b",
            }}>
            <div className="font-semibold mb-0.5 text-[11px]">{m.titulo}</div>
            <div style={{ opacity: 0.7, fontSize: "9px" }}>{m.sub}</div>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-3 rounded-lg p-2.5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <p className="text-[11px] font-medium" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">

        {/* Modo: BUSCAR EMAIL */}
        {modo === "buscar-email" && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>
                Web de la empresa <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div className="flex gap-2">
                <input type="url" value={urlBusqueda}
                  onChange={e => { setUrlBusqueda(e.target.value); setCompanyUrl(e.target.value); }}
                  placeholder="https://www.empresa.com" className="flex-1 text-sm" />
                <button type="button" onClick={() => void buscarEmail()} disabled={buscandoEmail || !urlBusqueda.trim()}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition flex-shrink-0"
                  style={{
                    background: buscandoEmail ? "#252836" : "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    color: buscandoEmail ? "#64748b" : "#22c55e",
                  }}>
                  {buscandoEmail ? "Buscando…" : "Buscar"}
                </button>
              </div>
              <p className="text-[10px] mt-1" style={{ color: "#475569" }}>Pega la URL de la empresa o de la oferta.</p>
            </div>

            {busquedaRealizada && (
              <div className="rounded-lg p-3" style={{
                background: emailEncontrado ? "rgba(34,197,94,0.05)" : "rgba(245,158,11,0.05)",
                border: emailEncontrado ? "1px solid rgba(34,197,94,0.15)" : "1px solid rgba(245,158,11,0.15)",
              }}>
                {emailEncontrado ? (
                  <>
                    <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#22c55e" }}>Email encontrado</p>
                    <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} className="w-full text-sm" />
                    <p className="text-[10px] mt-1" style={{ color: "#475569" }}>Puedes editarlo si no es correcto.</p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-semibold mb-1" style={{ color: "#f59e0b" }}>No encontramos el email</p>
                    <p className="text-[10px] mb-2" style={{ color: "#64748b" }}>Búscalo en la web de la empresa y pégalo aquí:</p>
                    <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)}
                      placeholder="rrhh@empresa.com" className="w-full text-sm" />
                  </>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>Empresa</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="ej: Mercadona, Telefónica..." className="w-full text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>
                Puesto <span className="font-normal text-[10px]" style={{ color: "#475569" }}>(opcional)</span>
              </label>
              <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                placeholder="ej: Camarero, Electricista..." className="w-full text-sm" />
            </div>
          </>
        )}

        {/* Modo: TENGO EMAIL */}
        {modo === "tengo-email" && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>
                Empresa <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="ej: Mercadona, Telefónica..." className="w-full text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>
                Puesto <span className="font-normal text-[10px]" style={{ color: "#475569" }}>(opcional)</span>
              </label>
              <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                placeholder="ej: Camarero, Electricista..." className="w-full text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>
                Email de RRHH <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)}
                placeholder="rrhh@empresa.com" className="w-full text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>
                Web <span className="font-normal text-[10px]" style={{ color: "#475569" }}>(mejora la carta IA)</span>
              </label>
              <input type="url" value={companyUrl} onChange={e => setCompanyUrl(e.target.value)}
                placeholder="https://www.empresa.com" className="w-full text-sm" />
            </div>
          </>
        )}

        {/* Modo: YA APLIQUÉ */}
        {modo === "ya-aplique" && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>
                Empresa <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="ej: Mercadona, Telefónica..." className="w-full text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>
                Puesto <span className="font-normal text-[10px]" style={{ color: "#475569" }}>(opcional)</span>
              </label>
              <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                placeholder="ej: Camarero, Electricista..." className="w-full text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>
                Link de la oferta <span className="font-normal text-[10px]" style={{ color: "#475569" }}>(para seguimiento)</span>
              </label>
              <input type="url" value={companyUrl} onChange={e => setCompanyUrl(e.target.value)}
                placeholder="https://infojobs.net/oferta/..." className="w-full text-sm" />
            </div>

            <div className="rounded-lg p-3" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.1)" }}>
              <p className="text-[11px]" style={{ color: "#4ade80" }}>
                Se guardará en tu historial para hacer seguimiento. No se enviará ningún email.
              </p>
            </div>
          </>
        )}

        {/* Selector de hora */}
        {modo !== "ya-aplique" && (
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "#94a3b8" }}>
              ¿Cuándo enviarlo?
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {([
                { id: "ahora" as const,  label: getSlotLabel(),        sub: "Lo antes posible" },
                { id: "manana" as const, label: "Mañana a las 9:00h",  sub: "Primer email del día" },
                { id: "auto" as const,   label: "Automático",           sub: "El sistema elige ⭐" },
                { id: "custom" as const, label: "Elegir fecha y hora",  sub: "Control total" },
              ] as { id: "ahora" | "manana" | "auto" | "custom"; label: string; sub: string }[]).map(s => (
                <button key={s.id} type="button" onClick={() => setSlotElegido(s.id)}
                  className="py-2 px-3 rounded-lg text-left transition"
                  style={{
                    background: slotElegido === s.id ? "rgba(34,197,94,0.1)" : "#161922",
                    border: slotElegido === s.id ? "1.5px solid rgba(34,197,94,0.3)" : "1px solid #252836",
                  }}>
                  <div className="text-[11px] font-semibold" style={{ color: slotElegido === s.id ? "#22c55e" : "#f1f5f9" }}>{s.label}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: "#475569" }}>{s.sub}</div>
                </button>
              ))}
            </div>
            {slotElegido === "custom" && (
              <input
                type="datetime-local"
                value={fechaCustom}
                onChange={e => setFechaCustom(e.target.value)}
                min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "#0f1117", border: "1px solid #2d3142", color: "#f1f5f9" }}
              />
            )}
            <p className="text-[10px] mt-1.5" style={{ color: "#475569" }}>
              💡 Martes y miércoles entre 9-11h o 14-16h tienen la mayor tasa de apertura.
            </p>
          </div>
        )}

        {/* Personalización IA */}
        {modo !== "ya-aplique" && (
          <div className="flex items-start gap-2.5 rounded-lg p-3"
            style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.1)" }}>
            <input id="useAI" type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 rounded accent-green-500 cursor-pointer" />
            <div>
              <label htmlFor="useAI" className="text-xs font-medium cursor-pointer" style={{ color: "#4ade80" }}>
                Personalizar carta con IA
              </label>
              <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>
                La IA adapta la carta a esta empresa. Aumenta las respuestas.
              </p>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-2.5 font-semibold rounded-lg transition text-xs"
          style={{
            background: loading ? "#252836" : "linear-gradient(135deg, #22c55e, #16a34a)",
            color: loading ? "#64748b" : "#fff",
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
