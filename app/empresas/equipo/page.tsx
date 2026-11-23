"use client";

/**
 * /empresas/equipo — Quién de la empresa verificada entra a los candidatos y cuánto queda del
 * cupo del mes (lib/empresas/cuenta.ts). Cada persona entra con su propia
 * cuenta; quien la dio de alta añade a las demás por su correo.
 */
import { useCallback, useEffect, useState } from "react";
import { MessagesSquare, Unlock, UserPlus, UsersRound, X } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Etiqueta } from "@/components/neon/Neon";
import { AvatarPersona, AvisoContratacion, MarcoContratacion } from "@/components/empresas/AreaContratacion";

interface Cupo { usados: number; maximo: number }
interface Estado {
  titular: boolean;
  miembros: { email: string; creado: string }[];
  usuarios: { usados: number | null; maximo: number };
  cupo: { candidatos: Cupo; invitaciones: Cupo };
}

/** Lo gastado del mes, con su barra. Ámbar cuando se acaba. */
function Barra({ titulo, c, Icono }: { titulo: string; c: Cupo; Icono: typeof Unlock }) {
  const lleno = c.usados >= c.maximo;
  return (
    <div className={`cristal ${lleno ? "tono-ambar" : "tono-cian"} p-4 sm:p-5`}>
      <div className="flex items-center gap-3">
        <span className="icono-circulo" style={{ width: 40, height: 40 }} aria-hidden="true"><Icono size={19} /></span>
        <p className="text-[13.5px] font-semibold" style={{ color: "#cbd5e1" }}>{titulo}</p>
      </div>
      <p className="mt-3 text-[30px] font-extrabold leading-none tabular-nums" style={{ color: "var(--tono-texto)" }}>
        {c.usados}<span className="text-[14px] font-semibold" style={{ color: "var(--texto-tenue)" }}> de {c.maximo}</span>
      </p>
      <div className="w-full h-2 rounded-full mt-3" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (100 * c.usados) / c.maximo)}%`, background: "rgb(var(--tono))", boxShadow: "0 0 12px rgba(var(--tono),0.6)" }} />
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

  if (fase === "cargando") return <AvisoContratacion titulo="Cargando tu equipo…" />;
  if (fase === "entrar") return <AvisoContratacion titulo="Entra con tu cuenta de empresa" enlace="/auth/login?redirect=%2Fempresas%2Fcandidatos" boton="Entrar" />;
  if (fase === "plan") return <AvisoContratacion titulo="Para empresas verificadas" texto="Es gratis: comprobamos vuestro NIF y os mandamos un código." enlace="/empresas/alta" boton="Dar de alta mi empresa" />;
  if (!datos) return <AvisoContratacion titulo="No se pudo cargar tu equipo" texto="Prueba otra vez en un momento." />;

  const lleno = datos.usuarios.usados !== null && datos.usuarios.usados >= datos.usuarios.maximo;

  return (
    <MarcoContratacion seccion="equipo" titulo="Equipo" Icono={UsersRound}>
      <section className="grid sm:grid-cols-2 gap-3" aria-label="Este mes">
        <Barra titulo="Candidatos abiertos este mes" c={datos.cupo.candidatos} Icono={Unlock} />
        <Barra titulo="Invitaciones a entrevista este mes" c={datos.cupo.invitaciones} Icono={MessagesSquare} />
      </section>
      <p className="text-[12.5px] -mt-2" style={{ color: "var(--texto-tenue)" }}>De toda la empresa. Se renueva el día 1.</p>

      {datos.titular ? (
        <section className="cristal tono-neutro p-5 space-y-4" aria-labelledby="titulo-equipo">
          <div className="flex items-center justify-between gap-3">
            <h2 id="titulo-equipo" className="text-[18px] font-bold" style={{ color: "#f8fafc" }}>Quién entra</h2>
            <Etiqueta tono="cian">{datos.usuarios.usados} de {datos.usuarios.maximo}</Etiqueta>
          </div>

          <ul className="space-y-2">
            <li className="flex items-center gap-3 rounded-2xl px-3.5 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(148,163,184,0.16)" }}>
              <AvatarPersona id="titular" nombre="Tú" size={38} />
              <span className="flex-1 text-[14.5px] font-semibold" style={{ color: "#f1f5f9" }}>Tú</span>
              <Etiqueta tono="verde">Titular</Etiqueta>
            </li>
            {datos.miembros.map((m) => (
              <li key={m.email} className="flex items-center gap-3 rounded-2xl px-3.5 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(148,163,184,0.16)" }}>
                <AvatarPersona id={m.email} nombre={m.email} size={38} />
                <span className="flex-1 min-w-0 text-[14px] truncate" style={{ color: "#cbd5e1" }}>{m.email}</span>
                <button type="button" onClick={() => void quitar(m.email)} aria-label={`Quitar el acceso a ${m.email}`}
                  className="shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-full" style={{ color: "#a7b3c6" }}><X size={18} /></button>
              </li>
            ))}
          </ul>

          {lleno ? (
            <p className="text-[13px]" style={{ color: "#fcd34d" }}>Ya sois {datos.usuarios.maximo}. Para dar acceso a otra persona, quita antes a alguien.</p>
          ) : (
            <div className="grid sm:grid-cols-[1fr_auto] gap-2.5">
              <label className="sr-only" htmlFor="correo-equipo">Correo de la persona</label>
              <input id="correo-equipo" type="email" value={correo} maxLength={200} placeholder="correo@tuempresa.es"
                onChange={(e) => setCorreo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && correo.trim()) void anadir(); }}
                className="w-full" />
              <button type="button" onClick={() => void anadir()} disabled={guardando || !correo.trim()} className="boton-neon disabled:opacity-50">
                <UserPlus size={18} aria-hidden="true" />{guardando ? "Añadiendo…" : "Dar acceso"}
              </button>
            </div>
          )}
          <p className="text-[12.5px]" style={{ color: "var(--texto-tenue)" }}>Cada persona entra con su propia cuenta, registrada con ese correo.</p>
          {error && <p role="alert" className="text-[13px]" style={{ color: "#fca5a5" }}>{error}</p>}
        </section>
      ) : (
        <section className="cristal tono-neutro p-5">
          <p className="text-[14px]" style={{ color: "#cbd5e1" }}>Entras con la cuenta de tu empresa. Quien la dio de alta añade o quita personas.</p>
        </section>
      )}
    </MarcoContratacion>
  );
}
