"use client";

// Deshabilitar prerenderizado estático — la página requiere autenticación dinámica
export const dynamic = "force-dynamic";

/**
 * app/app/page.tsx — Dashboard principal del usuario (panel tras login)
 *
 * Muestra:
 *   - Saludo personalizado con el nombre del usuario
 *   - 4 tarjetas con estadísticas de actividad
 *   - 4 accesos directos a las secciones principales
 *   - Lista de los 5 últimos CVs enviados (desde Supabase tabla `cv_sends`)
 *
 * Si el usuario no ha iniciado sesión, redirige a /auth/login.
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";


// ─── Tipos ────────────────────────────────────────────────────────────────────

interface EnvioCV {
  id: string;
  empresa: string;
  puesto: string;
  estado: "enviado" | "visto" | "respuesta" | "pendiente";
  creado_en: string;
}

// ─── Accesos directos ─────────────────────────────────────────────────────────
const accesosDirectos = [
  {
    emoji: "🔍",
    titulo: "Buscar ofertas",
    descripcion: "Miles de empleos en España",
    href: "/app/buscar",
    color: "#2563EB",
  },
  {
    emoji: "📧",
    titulo: "Enviar CV",
    descripcion: "Envío automático de candidaturas",
    href: "/app/envios",
    color: "#F97316",
  },
  {
    emoji: "📄",
    titulo: "Mejorar CV",
    descripcion: "Adapta tu CV con IA",
    href: "/app/curriculum",
    color: "#2563EB",
  },
  {
    emoji: "🏢",
    titulo: "Buscar empresas",
    descripcion: "Encuentra contactos de RRHH",
    href: "/app/empresas",
    color: "#F97316",
  },
];

// ─── Colores según estado del envío ──────────────────────────────────────────
const colorEstado: Record<EnvioCV["estado"], string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  enviado: "bg-blue-100 text-blue-700",
  visto: "bg-purple-100 text-purple-700",
  respuesta: "bg-green-100 text-green-700",
};

const etiquetaEstado: Record<EnvioCV["estado"], string> = {
  pendiente: "Pendiente",
  enviado: "Enviado",
  visto: "Visto",
  respuesta: "Con respuesta",
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  // Estado del usuario
  const [nombreUsuario, setNombreUsuario] = useState<string>("Usuario");
  const [cargando, setCargando] = useState(true);

  // Progreso del perfil (para la tarjeta de onboarding)
  const [progreso, setProgreso] = useState({
    tieneNombre: false,
    tieneTelefono: false,
    tieneCv: false,
    tieneEnvios: false,
  });

  // Estadísticas de la semana
  const [stats, setStats] = useState({
    hoyCvs: 0,
    semanaCvs: 0,
    empresas: 0,
    tasaRespuesta: 0,
  });

  // Últimos envíos de CV
  const [ultimosEnvios, setUltimosEnvios] = useState<EnvioCV[]>([]);

  // Cargar datos al montar el componente
  useEffect(() => {
    async function cargarDatos() {
      // Verificar si el usuario está autenticado
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();

      if (!user) {
        // Si no hay sesión, redirigir al login
        router.push("/auth/login");
        return;
      }

      // Obtener nombre y datos de progreso del perfil
      const { data: perfil } = await getSupabaseBrowser()
        .from("profiles")
        .select("full_name, phone, cv_url")
        .eq("id", user.id)
        .single();

      if (perfil?.full_name) {
        setNombreUsuario(perfil.full_name);
      } else {
        setNombreUsuario(user.email?.split("@")[0] || "Usuario");
      }

      setProgreso((prev) => ({
        ...prev,
        tieneNombre: !!(perfil?.full_name),
        tieneTelefono: !!(perfil?.phone),
        tieneCv: !!(perfil?.cv_url),
      }));

      // Obtener datos de envíos de CV desde la tabla cv_sends
      const { data: envios } = await getSupabaseBrowser()
        .from("cv_sends")
        .select("id, empresa, puesto, estado, creado_en")
        .eq("user_id", user.id)
        .order("creado_en", { ascending: false })
        .limit(5);

      if (envios) {
        setUltimosEnvios(envios as EnvioCV[]);

        // Calcular estadísticas a partir de los envíos reales
        const ahora = new Date();
        const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        const haceUnaSemana = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Todos los envíos (no solo los 5 últimos) para estadísticas
        const { data: todosEnvios } = await getSupabaseBrowser()
          .from("cv_sends")
          .select("empresa, estado, creado_en")
          .eq("user_id", user.id);

        if (todosEnvios) {
          const hoyCvs = todosEnvios.filter(
            (e) => new Date(e.creado_en) >= hoy
          ).length;
          const semanaCvs = todosEnvios.filter(
            (e) => new Date(e.creado_en) >= haceUnaSemana
          ).length;
          const empresasUnicas = new Set(todosEnvios.map((e) => e.empresa)).size;
          const conRespuesta = todosEnvios.filter((e) => e.estado === "respuesta").length;
          const tasa =
            todosEnvios.length > 0
              ? Math.round((conRespuesta / todosEnvios.length) * 100)
              : 0;

          setStats({
            hoyCvs,
            semanaCvs,
            empresas: empresasUnicas,
            tasaRespuesta: tasa,
          });

          setProgreso((prev) => ({ ...prev, tieneEnvios: todosEnvios.length > 0 }));
        }
      }

      setCargando(false);
    }

    cargarDatos();
  }, [router]);

  // Mostrar spinner mientras carga
  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: "#2563EB", borderTopColor: "transparent" }}
          />
          <p className="text-gray-500 text-sm">Cargando tu panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* ── Saludo personalizado ───────────────────────────────────── */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Hola, {nombreUsuario}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Aquí tienes el resumen de tu actividad.</p>
        </div>

        {/* ── Progreso de configuración ──────────────────────────────── */}
        <TarjetaProgreso
          tieneNombre={progreso.tieneNombre}
          tieneTelefono={progreso.tieneTelefono}
          tieneCv={progreso.tieneCv}
          tieneEnvios={progreso.tieneEnvios}
        />

        {/* ── Tarjetas de estadísticas ───────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <TarjetaEstadistica
            titulo="CVs enviados hoy"
            valor={stats.hoyCvs}
            emoji="📧"
          />
          <TarjetaEstadistica
            titulo="CVs esta semana"
            valor={stats.semanaCvs}
            emoji="📅"
          />
          <TarjetaEstadistica
            titulo="Empresas contactadas"
            valor={stats.empresas}
            emoji="🏢"
          />
          <TarjetaEstadistica
            titulo="Tasa de respuesta"
            valor={`${stats.tasaRespuesta}%`}
            emoji="📈"
          />
        </div>

        {/* ── Accesos directos ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {accesosDirectos.map((acceso) => (
            <Link
              key={acceso.href}
              href={acceso.href}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition flex flex-col items-center text-center gap-3"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${acceso.color}15` }}
              >
                {acceso.emoji}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{acceso.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{acceso.descripcion}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Últimos envíos ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Últimos envíos</h2>
            <Link
              href="/app/envios"
              className="text-sm font-medium hover:underline"
              style={{ color: "#2563EB" }}
            >
              Ver todos →
            </Link>
          </div>

          {ultimosEnvios.length === 0 ? (
            // Mensaje cuando no hay envíos aún
            <div className="px-6 py-12 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-500 text-sm">Aún no has enviado ningún CV</p>
              <Link
                href="/app/buscar"
                className="inline-block mt-4 px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
                style={{ backgroundColor: "#2563EB" }}
              >
                Buscar ofertas
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {ultimosEnvios.map((envio) => (
                <li key={envio.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {envio.puesto || "Candidatura espontánea"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{envio.empresa}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        colorEstado[envio.estado] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {etiquetaEstado[envio.estado] || envio.estado}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(envio.creado_en).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componente tarjeta de progreso de configuración ─────────────────────────

function TarjetaProgreso({
  tieneNombre,
  tieneTelefono,
  tieneCv,
  tieneEnvios,
}: {
  tieneNombre: boolean;
  tieneTelefono: boolean;
  tieneCv: boolean;
  tieneEnvios: boolean;
}) {
  const pasos = [
    {
      label: "Añade tu nombre completo",
      ok: tieneNombre,
      href: "/app/perfil",
      emoji: "👤",
    },
    {
      label: "Añade tu teléfono",
      ok: tieneTelefono,
      href: "/app/perfil",
      emoji: "📱",
    },
    {
      label: "Sube tu currículum (PDF)",
      ok: tieneCv,
      href: "/app/curriculum",
      emoji: "📄",
    },
    {
      label: "Envía tu primera candidatura",
      ok: tieneEnvios,
      href: "/app/envios",
      emoji: "📧",
    },
  ];

  const completados = pasos.filter((p) => p.ok).length;
  if (completados === pasos.length) return null;

  const porcentaje = Math.round((completados / pasos.length) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-gray-900">Configura tu cuenta</h2>
          <p className="text-xs text-gray-400 mt-0.5">{completados} de {pasos.length} pasos completados</p>
        </div>
        <span className="text-sm font-bold" style={{ color: "#2563EB" }}>{porcentaje}%</span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full mb-5 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${porcentaje}%`, backgroundColor: "#2563EB" }}
        />
      </div>

      <div className="space-y-2">
        {pasos.map((paso) =>
          paso.ok ? (
            <div key={paso.label} className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 text-sm flex-shrink-0">
                ✓
              </div>
              <p className="text-sm text-gray-400 line-through">{paso.label}</p>
            </div>
          ) : (
            <Link
              key={paso.label}
              href={paso.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                {paso.emoji}
              </div>
              <p className="text-sm font-medium text-gray-800 flex-1">{paso.label}</p>
              <span className="text-xs font-semibold group-hover:translate-x-0.5 transition-transform" style={{ color: "#2563EB" }}>→</span>
            </Link>
          )
        )}
      </div>
    </div>
  );
}

// ─── Componente tarjeta de estadística ────────────────────────────────────────

function TarjetaEstadistica({
  titulo,
  valor,
  emoji,
}: {
  titulo: string;
  valor: number | string;
  emoji: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="text-2xl mb-2">{emoji}</div>
      <div className="text-2xl font-bold text-gray-900">{valor}</div>
      <div className="text-xs text-gray-500 mt-1">{titulo}</div>
    </div>
  );
}
