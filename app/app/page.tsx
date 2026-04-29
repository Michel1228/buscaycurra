"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EvolucionUsuario from "@/components/EvolucionUsuario";
import RevelacionMariposa from "@/components/RevelacionMariposa";
import AvatarMariposa, { MARIPOSAS_AVATARES } from "@/components/AvatarMariposa";
import { getEspecieForUser } from "@/lib/especies";

interface EnvioCV {
  id: string;
  empresa: string;
  puesto: string;
  estado: "enviado" | "visto" | "respuesta" | "pendiente";
  creado_en: string;
}

const ACCIONES_RAPIDAS = [
  { href: "/app/perfil", icon: "👤", label: "Mi Perfil", desc: "Foto, datos y CV en un sitio", color: "#22c55e" },
  { href: "/app/buscar", icon: "🔍", label: "Buscar ofertas", desc: "Encuentra trabajo en tu ciudad", color: "#3b82f6" },
  { href: "/app/envios", icon: "📧", label: "Enviar CVs", desc: "Envío automático a empresas", color: "#f59e0b" },
  { href: "/app/pipeline", icon: "📊", label: "Pipeline", desc: "Seguimiento de candidaturas", color: "#a855f7" },
];

const colorEstado: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b" },
  enviado: { bg: "rgba(34,197,94,0.12)", text: "#22c55e" },
  visto: { bg: "rgba(168,85,247,0.12)", text: "#a855f7" },
  respuesta: { bg: "rgba(59,130,246,0.12)", text: "#3b82f6" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [evolucion, setEvolucion] = useState({
    tieneNombre: false, tieneTelefono: false, tieneLinkedin: false,
    tieneCv: false, cvsEnviados: 0, trabajoEncontrado: false,
  });
  const [mostrarRevelacion, setMostrarRevelacion] = useState(false);
  const [stats, setStats] = useState({ hoyCvs: 0, semanaCvs: 0, empresas: 0, tasaRespuesta: 0 });
  const [ultimosEnvios, setUltimosEnvios] = useState<EnvioCV[]>([]);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUserId(user.id);

      const { data: perfil } = await getSupabaseBrowser().from("profiles")
        .select("full_name, phone, linkedin_url, trabajo_encontrado, avatar_id, foto_url")
        .eq("id", user.id).single();

      setNombre(perfil?.full_name || "");
      setAvatarId(perfil?.avatar_id || null);
      setFotoUrl(perfil?.foto_url || null);

      let cvExists = false;
      try {
        const session = (await getSupabaseBrowser().auth.getSession()).data.session;
        if (session) {
          const res = await fetch("/api/cv/obtener", {
            headers: { Authorization: `Bearer ${session.access_token}` },
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) {
            const cvData = await res.json();
            cvExists = !!cvData?.cvUrl;
          }
        }
      } catch { /* ignore */ }

      let enviosData: EnvioCV[] = [];
      let todosEnvios: { empresa: string; estado: string; creado_en: string }[] = [];
      try {
        const { data: envios } = await getSupabaseBrowser().from("cv_sends")
          .select("id, empresa, puesto, estado, creado_en")
          .eq("user_id", user.id).order("creado_en", { ascending: false }).limit(5);
        if (envios) enviosData = envios as EnvioCV[];

        const { data: todos } = await getSupabaseBrowser().from("cv_sends")
          .select("empresa, estado, creado_en").eq("user_id", user.id);
        if (todos) todosEnvios = todos;
      } catch { /* cv_sends table may not exist */ }

      setUltimosEnvios(enviosData);

      const ahora = new Date();
      const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      const semana = new Date(hoy.getTime() - 7 * 86400000);
      setStats({
        hoyCvs: todosEnvios.filter(e => new Date(e.creado_en) >= hoy).length,
        semanaCvs: todosEnvios.filter(e => new Date(e.creado_en) >= semana).length,
        empresas: new Set(todosEnvios.map(e => e.empresa)).size,
        tasaRespuesta: todosEnvios.length > 0 ? Math.round((todosEnvios.filter(e => e.estado === "respuesta").length / todosEnvios.length) * 100) : 0,
      });
      setEvolucion({
        tieneNombre: !!perfil?.full_name, tieneTelefono: !!perfil?.phone,
        tieneLinkedin: !!perfil?.linkedin_url, trabajoEncontrado: !!perfil?.trabajo_encontrado,
        tieneCv: cvExists, cvsEnviados: todosEnvios.length,
      });
      setCargando(false);
    }
    cargar();
  }, [router]);

  const handleTrabajo = async () => {
    if (!userId) return;
    const especie = getEspecieForUser(userId);
    await getSupabaseBrowser().from("profiles").update({
      trabajo_encontrado: true, trabajo_encontrado_at: new Date().toISOString(), especie_id: especie.id,
    }).eq("id", userId);
    setEvolucion(p => ({ ...p, trabajoEncontrado: true }));
    setMostrarRevelacion(true);
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16" style={{ background: "#0f1117" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 mx-auto mb-4" style={{ border: "3px solid #2d3142", borderTopColor: "#22c55e" }} />
          <p className="text-sm" style={{ color: "#64748b" }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16" style={{ background: "#0f1117" }}>
      {mostrarRevelacion && userId && (
        <RevelacionMariposa userId={userId} onContinuar={() => setMostrarRevelacion(false)} />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Header con perfil ──────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition hover:scale-105"
            style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.1))", border: "2px solid rgba(34,197,94,0.2)" }}>
            {fotoUrl ? (
              <img src={fotoUrl} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              <span className="text-2xl">{avatarId ? (MARIPOSAS_AVATARES.find(m => m.id === avatarId)?.emoji || "🦋") : "👤"}</span>
            )}
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>
              {nombre ? `Hola, ${nombre}` : "Bienvenido a BuscayCurra"}
            </h1>
            <p className="text-xs" style={{ color: "#64748b" }}>
              {nombre ? "Tu panel de control" : "Completa tu perfil para empezar"}
            </p>
          </div>
          <EvolucionUsuario {...evolucion} compact />
        </div>

        {/* Avatar picker */}
        {showAvatarPicker && (
          <div className="card-game p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold" style={{ color: "#f59e0b" }}>Elige tu avatar</h3>
              <button onClick={() => setShowAvatarPicker(false)} className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: "#252836", color: "#64748b" }}>✕</button>
            </div>
            <AvatarMariposa selected={avatarId} onSelect={(id) => { setAvatarId(id); setShowAvatarPicker(false); }} fotoUrl={fotoUrl} />
          </div>
        )}

        {/* ── Stats rápidas ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Hoy", valor: stats.hoyCvs, icon: "📧", color: "#22c55e" },
            { label: "Semana", valor: stats.semanaCvs, icon: "📅", color: "#3b82f6" },
            { label: "Empresas", valor: stats.empresas, icon: "🏢", color: "#f59e0b" },
            { label: "Respuestas", valor: `${stats.tasaRespuesta}%`, icon: "📈", color: "#a855f7" },
          ].map(s => (
            <div key={s.label} className="card-game p-4">
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: s.color }}>{s.icon}</span>
                <span className="text-xs" style={{ color: "#64748b" }}>{s.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.valor}</div>
            </div>
          ))}
        </div>

        {/* ── Acciones rápidas ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {ACCIONES_RAPIDAS.map(a => (
            <Link key={a.href} href={a.href}>
              <div className="card-game p-4 hover:scale-[1.02] transition-transform cursor-pointer h-full">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3"
                  style={{ background: `${a.color}15`, border: `1px solid ${a.color}25` }}>
                  {a.icon}
                </div>
                <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>{a.label}</p>
                <p className="text-[11px] mt-1" style={{ color: "#64748b" }}>{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Últimos envíos ────────────────────────────────────────── */}
        <div className="card-game overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #2d3142" }}>
            <h2 className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Últimos envíos</h2>
            <Link href="/app/envios" className="text-xs font-medium hover:underline" style={{ color: "#22c55e" }}>Ver todos →</Link>
          </div>

          {ultimosEnvios.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm" style={{ color: "#64748b" }}>Aún no has enviado ningún CV</p>
              <Link href="/app/envios" className="btn-game inline-block mt-4 text-xs">Empezar a enviar</Link>
            </div>
          ) : (
            <div>
              {ultimosEnvios.map((envio) => {
                const est = colorEstado[envio.estado] || colorEstado.pendiente;
                return (
                  <div key={envio.id} className="px-5 py-3 flex items-center justify-between gap-4" style={{ borderBottom: "1px solid #252836" }}>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: "#f1f5f9" }}>{envio.puesto || "Candidatura espontánea"}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{envio.empresa}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: est.bg, color: est.text }}>{envio.estado}</span>
                      <span className="text-[10px]" style={{ color: "#475569" }}>{new Date(envio.creado_en).toLocaleDateString("es-ES")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Trabajo encontrado ────────────────────────────────────── */}
        {!evolucion.trabajoEncontrado ? (
          <div className="card-game p-6 mt-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>¿Ya encontraste trabajo?</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Revela tu mariposa única</p>
            </div>
            <button onClick={handleTrabajo} className="btn-game text-xs">🦋 ¡Lo encontré!</button>
          </div>
        ) : (
          <div className="card-game p-6 mt-6 flex items-center justify-between gap-4" style={{ borderColor: "rgba(245,158,11,0.2)" }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: "#f59e0b" }}>¡Metamorfosis completa!</p>
                <p className="text-xs" style={{ color: "#64748b" }}>Tu mariposa ya fue revelada</p>
              </div>
            </div>
            {userId && (
              <button onClick={() => setMostrarRevelacion(true)} className="btn-game-outline text-xs">Ver mi mariposa</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
