"use client";

/**
 * /app/admin/empresas — Michel revisa las empresas que piden ver candidatos y las aprueba.
 *
 * Al aprobar se genera un código y se manda al correo de la empresa; aquí no se
 * ve (solo lo tiene ese correo). Al rechazar, a quien la dio de alta le llega el
 * motivo para que corrija los datos (lib/empresas/verificacion.ts).
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Solicitud {
  id: string; email_cuenta: string; razon_social: string; nif: string; tipo: "empresa" | "ett" | "agencia"; autorizacion: string | null;
  sectores: string[]; busca: string | null; provincia: string | null; web: string | null; correo_empresa: string; telefono: string | null;
  estado: "pendiente" | "aprobada" | "activa" | "rechazada" | "suspendida"; motivo: string | null; intentos: number;
  codigo_caduca: string | null; revisado_por: string | null; revisado_en: string | null; activada_en: string | null; creado: string;
}

const TIPO = { empresa: "Empresa", ett: "ETT", agencia: "Agencia de colocación" };
const COLOR: Record<Solicitud["estado"], string> = { pendiente: "#fbbf24", aprobada: "#60a5fa", activa: "#22c55e", rechazada: "#94a3b8", suspendida: "#ef4444" };
const ESTADO: Record<Solicitud["estado"], string> = { pendiente: "Por revisar", aprobada: "Código enviado", activa: "Activa", rechazada: "Rechazada", suspendida: "Suspendida" };
const fecha = (s: string | null) => (s ? new Date(s).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");

/** Dónde comprobar cada una (registros públicos y gratuitos). */
function enlaces(s: Solicitud): [string, string][] {
  const l: [string, string][] = [[`Buscar «${s.nif}»`, `https://www.google.com/search?q=${encodeURIComponent(`"${s.nif}"`)}`]];
  if (s.tipo === "ett") {
    l.push(["ETT por NIF (Madrid)", "https://www.comunidad.madrid/empleo/empresas-trabajo-temporal-ett"]);
    l.push(["ETT de toda España (Xunta)", "https://emprego.xunta.gal/es/las-empresas-de-trabajo-temporal-ett"]);
  }
  if (s.tipo === "agencia") l.push(["Agencias de colocación (SNE)", "https://www.sistemanacionalempleo.es/AgenciasColocacion_WEB/listadoAgencias.do?modo=inicio"]);
  if (s.web) l.push(["Su web", /^https?:\/\//.test(s.web) ? s.web : `https://${s.web}`]);
  return l;
}

export default function AdminEmpresasPage() {
  const [token, setToken] = useState("");
  const [lista, setLista] = useState<Solicitud[] | null>(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);

  const cargar = useCallback(async (t: string) => {
    const r = await fetch("/api/admin/empresas", { headers: { Authorization: `Bearer ${t}` } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setError(r.status === 403 ? "Esta página es solo para administración." : j.error || "No se pudo cargar."); return; }
    setLista(j.solicitudes || []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { setError("Entra con tu cuenta de administración."); return; }
      setToken(session.access_token);
      await cargar(session.access_token);
    })();
  }, [cargar]);

  async function hacer(s: Solicitud, accion: "aprobar" | "reenviar" | "rechazar" | "suspender") {
    const motivo = (motivos[s.id] || "").trim();
    if ((accion === "rechazar" || accion === "suspender") && !motivo) { setAviso("Escribe el motivo: le llega a la empresa."); return; }
    if (accion === "suspender" && !window.confirm(`¿Quitar el acceso a ${s.razon_social}? Dejará de ver candidatos, y su equipo también.`)) return;
    setOcupado(s.id); setAviso("");
    try {
      const r = await fetch("/api/admin/empresas", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: s.id, accion, motivo }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setAviso(j.error || "No se pudo."); return; }
      setLista(j.solicitudes || []);
      if (accion === "aprobar" || accion === "reenviar") {
        setAviso(j.enviado ? `Código enviado a ${s.correo_empresa}.` : `Aprobada, pero el correo a ${s.correo_empresa} no salió: pulsa «Mandar otro código» más tarde.`);
      } else setAviso(accion === "rechazar" ? "Rechazada; le hemos escrito con el motivo." : "Acceso suspendido.");
    } finally { setOcupado(null); }
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "#0f1117" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-extrabold" style={{ color: "#f8fafc" }}>Empresas por verificar</h1>
          <Link href="/app/admin" className="text-xs" style={{ color: "#22c55e" }}>← Panel</Link>
        </div>
        <p className="text-xs mb-6" style={{ color: "#8b98ad" }}>
          Comprueba el NIF y, si es ETT o agencia, su número en el listado oficial. Al aprobar, el código va al correo de la empresa: si es de Gmail u Hotmail, mira antes la web o llama.
        </p>
        {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}
        {aviso && <p className="text-sm mb-4 rounded-lg px-3 py-2" style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80" }}>{aviso}</p>}
        {lista && lista.length === 0 && <p className="text-sm" style={{ color: "#94a3b8" }}>Ninguna todavía.</p>}
        <div className="space-y-3">
          {lista?.map((s) => (
            <div key={s.id} className="rounded-xl p-4" style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" }}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{s.razon_social} <span className="font-mono text-xs" style={{ color: "#94a3b8" }}>{s.nif}</span></p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>
                    {TIPO[s.tipo]}{s.autorizacion ? ` · nº ${s.autorizacion}` : ""}{s.tipo === "empresa" ? ` · ${s.sectores.join(", ")}` : " · todos los sectores"}{s.provincia ? ` · ${s.provincia}` : ""}
                  </p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>Código a: {s.correo_empresa} · cuenta: {s.email_cuenta}{s.telefono ? ` · ${s.telefono}` : ""}</p>
                  {s.busca && <p className="text-xs mt-1" style={{ color: "#cbd5e1" }}>Busca: {s.busca}</p>}
                  <p className="text-[11px] mt-1" style={{ color: "#64748b" }}>
                    Pedida {fecha(s.creado)}{s.revisado_en ? ` · revisada ${fecha(s.revisado_en)}` : ""}{s.activada_en ? ` · activa desde ${fecha(s.activada_en)}` : ""}
                    {s.estado === "aprobada" && s.intentos > 0 ? ` · ${s.intentos} intentos fallidos` : ""}
                  </p>
                  {s.motivo && <p className="text-[11px] mt-1" style={{ color: "#fbbf24" }}>Motivo: {s.motivo}</p>}
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: COLOR[s.estado], border: `1px solid ${COLOR[s.estado]}55` }}>{ESTADO[s.estado]}</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {enlaces(s).map(([t, u]) => (
                  <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="text-[11px] underline" style={{ color: "#60a5fa" }}>{t}</a>
                ))}
              </div>
              {s.estado !== "rechazada" && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {s.estado === "pendiente" && <button disabled={ocupado === s.id} onClick={() => void hacer(s, "aprobar")} className="btn-game text-xs px-4 py-2">Aprobar y mandar código</button>}
                  {s.estado === "aprobada" && <button disabled={ocupado === s.id} onClick={() => void hacer(s, "reenviar")} className="text-xs px-3 py-2 rounded-lg" style={{ border: "1px solid rgba(96,165,250,0.4)", color: "#60a5fa" }}>Mandar otro código</button>}
                  <input value={motivos[s.id] || ""} onChange={(e) => setMotivos({ ...motivos, [s.id]: e.target.value })} maxLength={300}
                    placeholder={s.estado === "activa" ? "Motivo para suspender" : "Motivo si la rechazas"} className="text-xs flex-1 min-w-[180px]" />
                  {(s.estado === "pendiente" || s.estado === "aprobada") && <button disabled={ocupado === s.id} onClick={() => void hacer(s, "rechazar")} className="text-xs px-3 py-2 rounded-lg" style={{ border: "1px solid rgba(148,163,184,0.3)", color: "#cbd5e1" }}>Rechazar</button>}
                  {(s.estado === "aprobada" || s.estado === "activa") && <button disabled={ocupado === s.id} onClick={() => void hacer(s, "suspender")} className="text-xs px-3 py-2 rounded-lg" style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }}>Suspender</button>}
                </div>
              )}
              {s.estado === "rechazada" && (
                <button disabled={ocupado === s.id} onClick={() => void hacer(s, "aprobar")} className="text-xs mt-3" style={{ color: "#22c55e" }}>Aprobar igualmente</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
