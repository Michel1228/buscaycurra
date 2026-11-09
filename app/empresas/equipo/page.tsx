"use client";

/**
 * /empresas/equipo — Quién de la empresa entra al Plan Empresa y cuánto queda del
 * cupo del mes (lib/empresas/cuenta.ts). Cada persona entra con su propia
 * cuenta; quien paga añade a las demás por su correo.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import FondoOleaje from "@/components/FondoOleaje";

interface Cupo { usados: number; maximo: number }
interface Estado {
  titular: boolean;
  miembros: { email: string; creado: string }[];
  usuarios: { usados: number | null; maximo: number };
  cupo: { candidatos: Cupo; invitaciones: Cupo };
}

const caja = { background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" };

function Barra({ titulo, c }: { titulo: string; c: Cupo }) {
  const lleno = c.usados >= c.maximo;
  return (
    <div className="rounded-xl p-4" style={caja}>
      <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: "#8b98ad" }}>{titulo}</p>
      <p className="text-xl font-bold tabular-nums" style={{ color: lleno ? "#f59e0b" : "#f1f5f9" }}>
        {c.usados} <span className="text-xs font-normal" style={{ color: "#8b98ad" }}>de {c.maximo}</span>
      </p>
      <div className="w-full h-1.5 rounded-full mt-2" style={{ background: "#0f1117" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (100 * c.usados) / c.maximo)}%`, background: lleno ? "#f59e0b" : "#22c55e" }} />
      </div>
    </div>
  );
}

export default function EquipoEmpresaPage() {
  const [token, setToken] = useState("");
  const [fase, setFase] = useState<"cargando" | "entrar" | "plan" | "listo">("cargando");
  const [datos, setDatos] = useState<Estado | null>(null);
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async (t: string) => {
    const r = await fetch("/api/empresas/equipo", { headers: { Authorization: `Bearer ${t}` } });
    if (r.status === 401) { setFase("entrar"); return; }
    if (r.status === 402) { setFase("plan"); return; }
    setDatos(await r.json().catch(() => null));
    setFase("listo");
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { setFase("entrar"); return; }
      setToken(session.access_token);
      await cargar(session.access_token);
    })();
  }, [cargar]);

  async function anadir() {
    setGuardando(true); setError("");
    try {
      const r = await fetch("/api/empresas/equipo", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: correo }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setError(j.error || "No se pudo añadir."); return; }
      setDatos(j);
      setCorreo("");
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(email: string) {
    if (!window.confirm(`¿Quitar el acceso a ${email}? Dejará de ver los candidatos y las entrevistas de la empresa.`)) return;
    const r = await fetch(`/api/empresas/equipo?email=${encodeURIComponent(email)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json().catch(() => ({}));
    if (r.ok) setDatos(j); else setError(j.error || "No se pudo quitar.");
  }

  const cabecera = (
    <header className="sticky top-0 z-50" style={{ background: "rgba(15,17,23,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(45,49,66,0.4)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/empresas" className="flex items-center gap-2.5">
          <img src="/icon-192.png" alt="Guzzi" width={24} height={24} style={{ borderRadius: "50%" }} />
          <span className="font-bold text-sm" style={{ color: "#22c55e" }}>BuscayCurra</span>
          <span className="hidden sm:inline text-xs" style={{ color: "#8b98ad" }}>/ Tu equipo</span>
        </Link>
        <Link href="/empresas/candidatos" className="text-xs font-semibold" style={{ color: "#22c55e" }}>Candidatos →</Link>
      </div>
    </header>
  );

  if (fase !== "listo" || !datos) {
    const textos = {
      cargando: ["Cargando…", "", ""],
      entrar: ["Entra con tu cuenta de empresa", "/auth/login?redirect=%2Fempresas%2Fcandidatos", "Entrar"],
      plan: ["El equipo es del Plan Empresa", "/empresas", "Ver Plan Empresa"],
      listo: ["No se pudo cargar tu equipo", "", ""],
    }[fase];
    return (
      <div className="min-h-screen" style={{ background: "#0f1117" }}>{cabecera}
        <div className="text-center py-24 px-4">
          <p className="text-sm font-semibold mb-4" style={{ color: "#f1f5f9" }}>{textos[0]}</p>
          {textos[1] && <Link href={textos[1]} className="btn-game text-sm px-5 py-2.5 rounded-lg inline-block">{textos[2]}</Link>}
        </div>
      </div>
    );
  }

  const lleno = datos.usuarios.usados !== null && datos.usuarios.usados >= datos.usuarios.maximo;

  return (
    <div className="min-h-screen pb-16" style={{ background: "#0f1117" }}>
      {/* El fondo de oleaje de toda la aplicación (diseño de neón, 8 nov 2026) */}
      <FondoOleaje />
      {cabecera}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <section>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "#f8fafc" }}>Este mes</h1>
          <p className="text-xs mb-5 max-w-2xl" style={{ color: "#8b98ad" }}>
            El cupo es de toda la empresa, lo use quien lo use, y se renueva el día 1. Un candidato que ya habéis abierto sigue abierto y no vuelve a contar.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Barra titulo="Candidatos abiertos (contacto y CV)" c={datos.cupo.candidatos} />
            <Barra titulo="Invitaciones «Me interesa»" c={datos.cupo.invitaciones} />
          </div>
        </section>

        {datos.titular ? (
          <section>
            <h2 className="text-lg font-bold mb-1" style={{ color: "#f1f5f9" }}>
              Tu equipo <span className="text-sm font-normal" style={{ color: "#8b98ad" }}>· {datos.usuarios.usados} de {datos.usuarios.maximo} personas</span>
            </h2>
            <p className="text-xs mb-5 max-w-2xl" style={{ color: "#8b98ad" }}>
              Cada persona entra con su propia cuenta de BuscayCurra, registrada con el correo que pongas aquí, y ve los candidatos y las entrevistas de la empresa.
              Así nadie tiene que pasarse la contraseña. Para entrar, que abra buscaycurra.es/empresas/candidatos.
            </p>

            <div className="space-y-2 mb-5">
              <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={caja}>
                <span className="text-sm" style={{ color: "#f1f5f9" }}>Tú</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>Quien paga</span>
              </div>
              {datos.miembros.map((m) => (
                <div key={m.email} className="rounded-xl px-4 py-3 flex items-center justify-between gap-3" style={caja}>
                  <span className="text-sm truncate" style={{ color: "#cbd5e1" }}>{m.email}</span>
                  <button onClick={() => void quitar(m.email)} className="text-xs shrink-0" style={{ color: "#94a3b8" }}>Quitar</button>
                </div>
              ))}
            </div>

            {lleno ? (
              <p className="text-xs" style={{ color: "#f59e0b" }}>
                Tu plan incluye {datos.usuarios.maximo} personas, contándote a ti. Para dar acceso a otra, quita antes a alguien.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="sr-only" htmlFor="correo-equipo">Correo de la persona</label>
                <input id="correo-equipo" type="email" value={correo} maxLength={200} placeholder="correo@tuempresa.es"
                  onChange={(e) => setCorreo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && correo.trim()) void anadir(); }}
                  className="flex-1 text-sm" />
                <button onClick={() => void anadir()} disabled={guardando || !correo.trim()} className="btn-game text-xs px-4 py-2">
                  {guardando ? "Añadiendo…" : "Dar acceso"}
                </button>
              </div>
            )}
            {error && <p className="text-xs mt-2" style={{ color: "#ef4444" }}>{error}</p>}
          </section>
        ) : (
          <section>
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              Entras con el Plan Empresa de tu empresa. Quien lo paga es quien añade o quita personas.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
