"use client";
export const dynamic = "force-dynamic";

/**
 * Dashboard — Flujo bloqueante de metamorfosis estilo videojuego.
 * Cada paso es un "nivel" que se desbloquea al completar el anterior.
 * 🥚 Registro → 🐛 Perfil → 📄 CV → 🔍 Buscar → 📧 Enviar → 🦋 Metamorfosis
 */

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";
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

// ── Niveles del juego (flujo bloqueante) ────────────────────
const niveles = [
  {
    id: "perfil",
    titulo: "Completa tu perfil",
    desc: "Nombre, teléfono, LinkedIn",
    icon: "👤",
    href: "/app/perfil",
    color: "#7ed56f",
    emoji_logro: "🐛",
    fase: "De huevo a oruga",
  },
  {
    id: "cv",
    titulo: "Crea tu CV",
    desc: "La IA lo adapta por sector",
    icon: "📄",
    href: "/app/curriculum",
    color: "#f0c040",
    emoji_logro: "🐛",
    fase: "Oruga creciendo",
  },
  {
    id: "buscar",
    titulo: "Busca ofertas",
    desc: "Miles de empleos en España",
    icon: "🔍",
    href: "/app/buscar",
    color: "#e07850",
    emoji_logro: "🫘",
    fase: "Formando capullo",
  },
  {
    id: "enviar",
    titulo: "Envía candidaturas",
    desc: "Automático. Tú descansas.",
    icon: "📧",
    href: "/app/envios",
    color: "#a070d0",
    emoji_logro: "🦋",
    fase: "Alas abriéndose",
  },
  {
    id: "empresas",
    titulo: "Busca empresas",
    desc: "Encuentra contactos RRHH",
    icon: "🏢",
    href: "/app/empresas",
    color: "#60a0d0",
    emoji_logro: "🦋",
    fase: "Volando alto",
  },
];

const colorEstado: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: "#f0c04020", text: "#f0c040" },
  enviado: { bg: "#7ed56f20", text: "#7ed56f" },
  visto: { bg: "#a070d020", text: "#a070d0" },
  respuesta: { bg: "#60d09020", text: "#60d090" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("Usuario");
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
        .select("full_name, phone, linkedin_url, trabajo_encontrado")
        .eq("id", user.id).single();

      setNombre(perfil?.full_name || "");

      // Check CV in Storage (bucket 'cvs')
      let cvExists = false;
      try {
        const session = (await getSupabaseBrowser().auth.getSession()).data.session;
        if (session) {
          const res = await fetch("/api/cv/obtener", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const cvData = await res.json();
            cvExists = !!cvData?.cvUrl;
          }
        }
      } catch { /* ignore */ }

      // Try cv_sends table (may not exist yet — wrap in try/catch)
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

  // Calcular qué niveles están desbloqueados
  const perfilCompleto = evolucion.tieneNombre && evolucion.tieneTelefono;
  const tieneCv = evolucion.tieneCv;
  const haEnviado = evolucion.cvsEnviados > 0;

  const nivelesEstado = niveles.map(n => {
    switch (n.id) {
      case "perfil": return { ...n, desbloqueado: true, completado: perfilCompleto };
      case "cv": return { ...n, desbloqueado: perfilCompleto, completado: tieneCv };
      case "buscar": return { ...n, desbloqueado: tieneCv, completado: tieneCv };
      case "enviar": return { ...n, desbloqueado: tieneCv, completado: haEnviado };
      case "empresas": return { ...n, desbloqueado: tieneCv, completado: haEnviado };
      default: return { ...n, desbloqueado: false, completado: false };
    }
  });

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16" style={{ background: "#1a1a12" }}>
        <div className="text-center">
          <div className="animate-float mb-4"><LogoGusano size={60} animated /></div>
          <p className="text-sm" style={{ color: "#706a58" }}>Cargando tu aventura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pt-16" style={{ background: "linear-gradient(180deg, #0f1a0a, #1a1a12 20%, #1a1a12 80%, #15200e)" }}>
      {/* Revelación */}
      {mostrarRevelacion && userId && (
        <RevelacionMariposa userId={userId} onContinuar={() => setMostrarRevelacion(false)} />
      )}

      {/* Fondo */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position: "absolute", top: "5%", left: "5%", width: "40%", height: "40%",
          background: "radial-gradient(ellipse, rgba(126,213,111,0.05) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: "35%", height: "35%",
          background: "radial-gradient(ellipse, rgba(240,192,64,0.03) 0%, transparent 70%)" }} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">

        {/* ── Saludo ──────────────────────────────────────── */}
        {/* Avatar picker overlay */}
        {showAvatarPicker && (
          <div className="card-game p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold" style={{ color: "#f0c040" }}>🦋 Elige tu mariposa</h3>
              <button onClick={() => setShowAvatarPicker(false)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ background: "rgba(42,42,30,0.8)", color: "#706a58" }}>✖</button>
            </div>
            <AvatarMariposa
              selected={avatarId}
              onSelect={(id) => { setAvatarId(id); setShowAvatarPicker(false); }}
              fotoUrl={fotoUrl}
            />
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(126,213,111,0.15), rgba(92,184,72,0.1))",
                border: "2px solid rgba(126,213,111,0.2)",
              }}>
              {fotoUrl ? (
                <img src={fotoUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span className="text-2xl">
                  {avatarId ? (MARIPOSAS_AVATARES.find(m => m.id === avatarId)?.emoji || "🦋") : "🦋"}
                </span>
              )}
            </button>
            <div>
              {nombre ? (
                <h1 className="text-xl font-bold" style={{ color: "#f0ebe0" }}>
                  Bienvenido, <span style={{ color: "#7ed56f" }}>{nombre}</span>
                </h1>
              ) : (
                <h1 className="text-xl font-bold" style={{ color: "#f0ebe0" }}>
                  Bienvenido a <span style={{ color: "#7ed56f" }}>BuscayCurra</span>
                </h1>
              )}
              <p className="text-xs mt-0.5" style={{ color: "#706a58" }}>
                {nombre ? "Tu camino de metamorfosis 🐛→🦋" : "Toca la mariposa para elegir avatar"}
              </p>
            </div>
          </div>
          <EvolucionUsuario {...evolucion} compact />
        </div>

        {/* ── Stats rápidas ───────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Hoy", valor: stats.hoyCvs, icon: "📧", color: "#7ed56f" },
            { label: "Semana", valor: stats.semanaCvs, icon: "📅", color: "#f0c040" },
            { label: "Empresas", valor: stats.empresas, icon: "🏢", color: "#e07850" },
            { label: "Respuestas", valor: `${stats.tasaRespuesta}%`, icon: "📈", color: "#a070d0" },
          ].map(s => (
            <div key={s.label} className="card-game p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs" style={{ color: "#706a58" }}>{s.label}</span>
              </div>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.valor}</div>
            </div>
          ))}
        </div>

        {/* ── NIVELES — El camino de la metamorfosis ──────── */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: "#f0ebe0" }}>
            🎮 Tu camino
          </h2>
          <div className="space-y-3">
            {nivelesEstado.map((nivel, i) => {
              const bloqueado = !nivel.desbloqueado;
              return (
                <div key={nivel.id} className="relative">
                  {/* Línea conectora */}
                  {i > 0 && (
                    <div className="absolute -top-3 left-7 w-0.5 h-3"
                      style={{ background: nivel.desbloqueado ? nivel.color + "40" : "#3d3c30" }} />
                  )}

                  {bloqueado ? (
                    /* NIVEL BLOQUEADO */
                    <div className="card-game p-5 flex items-center gap-4 opacity-40 cursor-not-allowed">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ background: "#2a2a1e", border: "1.5px solid #3d3c30" }}>
                        🔒
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm" style={{ color: "#706a58" }}>{nivel.titulo}</p>
                        <p className="text-xs" style={{ color: "#504a3a" }}>
                          Completa el paso anterior para desbloquear
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* NIVEL DESBLOQUEADO */
                    <Link href={nivel.href}>
                      <div className="card-game p-5 flex items-center gap-4 cursor-pointer group"
                        style={nivel.completado ? { borderColor: nivel.color + "30" } : {}}>
                        {/* Icono del nivel */}
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl relative transition-transform group-hover:scale-110"
                          style={{
                            background: `${nivel.color}15`,
                            border: `1.5px solid ${nivel.color}30`,
                            boxShadow: nivel.completado ? `0 0 16px ${nivel.color}20` : "none",
                          }}>
                          {nivel.icon}
                          {/* Check de completado */}
                          {nivel.completado && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                              style={{ background: nivel.color, color: "#1a1a12" }}>
                              ✓
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm" style={{ color: "#f0ebe0" }}>{nivel.titulo}</p>
                            {nivel.completado && (
                              <span className="badge-game text-[10px]"
                                style={{ background: `${nivel.color}20`, color: nivel.color, border: `1px solid ${nivel.color}30` }}>
                                {nivel.emoji_logro} {nivel.fase}
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: "#b0a890" }}>{nivel.desc}</p>
                        </div>

                        {/* Flecha */}
                        <span className="text-lg transition-transform group-hover:translate-x-1" style={{ color: nivel.color }}>
                          →
                        </span>
                      </div>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Panel inferior: Evolución + Trabajo encontrado ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Evolución completa */}
          <EvolucionUsuario {...evolucion} />

          {/* Botón trabajo encontrado */}
          {!evolucion.trabajoEncontrado ? (
            <div className="card-game p-6 flex flex-col items-center justify-center gap-4 text-center"
              style={{ borderColor: "#7ed56f20" }}>
              <div className="text-4xl animate-float">🎉</div>
              <div>
                <p className="font-bold text-lg" style={{ color: "#f0ebe0" }}>¿Ya encontraste trabajo?</p>
                <p className="text-sm mt-1" style={{ color: "#b0a890" }}>
                  Revela tu mariposa única. 50 especies esperan.
                </p>
              </div>
              <button onClick={handleTrabajo} className="btn-game w-full">
                🦋 ¡He encontrado trabajo!
              </button>
            </div>
          ) : (
            <div className="card-game p-6 flex flex-col items-center justify-center gap-3 text-center"
              style={{ borderColor: "#f0c04030" }}>
              <div className="text-4xl">✨</div>
              <p className="font-bold text-lg" style={{ color: "#f0c040" }}>¡Metamorfosis completa!</p>
              <p className="text-sm" style={{ color: "#b0a890" }}>Tu mariposa ya fue revelada.</p>
              {userId && (
                <button onClick={() => setMostrarRevelacion(true)}
                  className="btn-game-outline text-sm">
                  Ver mi mariposa →
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Últimos envíos ──────────────────────────────── */}
        <div className="card-game overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #3d3c3030" }}>
            <h2 className="font-bold" style={{ color: "#f0ebe0" }}>Últimos envíos</h2>
            <Link href="/app/envios" className="text-xs font-medium hover:underline" style={{ color: "#7ed56f" }}>
              Ver todos →
            </Link>
          </div>

          {ultimosEnvios.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm" style={{ color: "#706a58" }}>Aún no has enviado ningún CV</p>
              {tieneCv && (
                <Link href="/app/envios" className="btn-game inline-block mt-4 text-sm">
                  Empezar a enviar
                </Link>
              )}
            </div>
          ) : (
            <div>
              {ultimosEnvios.map((envio) => {
                const est = colorEstado[envio.estado] || colorEstado.pendiente;
                return (
                  <div key={envio.id} className="px-6 py-3 flex items-center justify-between gap-4"
                    style={{ borderBottom: "1px solid #2a2a1e" }}>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: "#f0ebe0" }}>
                        {envio.puesto || "Candidatura espontánea"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#706a58" }}>{envio.empresa}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: est.bg, color: est.text }}>
                        {envio.estado}
                      </span>
                      <span className="text-[10px]" style={{ color: "#504a3a" }}>
                        {new Date(envio.creado_en).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
