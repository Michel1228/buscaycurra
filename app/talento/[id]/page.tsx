/**
 * CV del candidato para empresas — /talento/[id]
 *
 * Lo ven entero las cuentas con Plan Empresa (nombre, contacto, experiencia,
 * formación) y el propio candidato, para saber qué ven las empresas. Nadie
 * más: el enlace solo sale en el portal de candidatos y solo para empresas.
 *
 * Hasta el 17 oct 2026 leía la tabla "cvs" de Supabase, que el editor de CV ya
 * no rellena (una fila, ningún perfil público): salía siempre "Perfil no
 * disponible". El CV de verdad está en user_cvs, igual que el interruptor
 * "Visible para empresas".
 */

import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import { Lock, User, MapPin, Wrench, Briefcase, GraduationCap, Globe, Mail, Phone, BadgeCheck } from "lucide-react";
import { getPool } from "@/lib/db";
import { getUserPlan } from "@/lib/cv-sender/rate-limiter";
import { enlaceCarta, referenciasVerificadas } from "@/lib/referencias/referencias";
import InvitarEntrevista from "@/components/empresas/InvitarEntrevista";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidato — BuscayCurra Talent",
  description: "Perfil profesional en BuscayCurra. Conecta con empresas que buscan tu talento.",
  robots: "noindex",
};

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Quién está mirando, por la sesión de las cookies (la misma que usa la web). */
async function quienMira(): Promise<string | null> {
  try {
    const almacen = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => almacen.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function Aviso({ titulo, mensaje, enlace, boton }: { titulo: string; mensaje: string; enlace: string; boton: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1117" }}>
      <div className="text-center p-10 max-w-md">
        <div className="flex justify-center mb-4"><Lock size={48} strokeWidth={1.2} style={{ color: "#94a3b8" }} /></div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "#f1f5f9" }}>{titulo}</h1>
        <p className="text-sm" style={{ color: "#64748b" }}>{mensaje}</p>
        <Link href={enlace} className="inline-block mt-4 text-sm" style={{ color: "#22c55e" }}>{boton}</Link>
      </div>
    </div>
  );
}

export default async function TalentoPage({ params }: Props) {
  const { id } = await params;
  const noDisponible = <Aviso titulo="Perfil no disponible" mensaje="Este candidato no tiene su perfil visible para empresas."
    enlace="/empresas/candidatos" boton="← Ver candidatos" />;
  if (!UUID.test(id)) return noDisponible;

  const quien = await quienMira();
  if (!quien) {
    return <Aviso titulo="Entra con tu cuenta de empresa" mensaje="Los CV de los candidatos solo se enseñan a empresas registradas."
      enlace="/auth/login?redirect=%2Fempresas%2Fcandidatos" boton="Entrar →" />;
  }
  const esElMismo = quien === id;
  // El plan se mira antes que el CV: a quien no es empresa no se le dice ni
  // si ese candidato existe.
  if (!esElMismo && (await getUserPlan(quien).catch(() => "free")) !== "empresa") {
    return <Aviso titulo="CV solo para empresas" mensaje="Con el Plan Empresa ves el CV entero de cada candidato, con su correo y su teléfono."
      enlace="/empresas" boton="Ver Plan Empresa →" />;
  }

  const { rows } = await getPool().query(
    `SELECT form_data, visible_empresas FROM user_cvs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
    [id]
  );
  const fila = rows[0];
  if (!fila || !fila.visible_empresas || !fila.form_data) return noDisponible;

  const cv = fila.form_data as Record<string, unknown>;
  const nombre = [texto(cv.nombre), texto(cv.apellidos)].filter(Boolean).join(" ") || "Candidato";
  const puesto = texto(cv.subtitulo);
  const ciudad = texto(cv.ciudad);
  const perfil = texto(cv.perfilProfesional);
  const email = texto(cv.email);
  const telefono = texto(cv.telefono);
  const idiomas = texto(cv.idiomas);
  const aptitudes = texto(cv.aptitudes).split(/[,;]/).map((h) => h.trim()).filter(Boolean);
  const experiencia = (Array.isArray(cv.experiencia) ? cv.experiencia : [])
    .map((e: Record<string, unknown>) => ({ puesto: texto(e.puesto), empresa: texto(e.empresa), fechas: texto(e.fechas), ubicacion: texto(e.ubicacion), descripcion: texto(e.descripcion) }))
    .filter((e) => e.puesto || e.empresa);
  const formacion = (Array.isArray(cv.formacion) ? cv.formacion : [])
    .map((f: Record<string, unknown>) => ({ titulo: texto(f.titulo), centro: texto(f.centro), ubicacion: texto(f.ubicacion) }))
    .filter((f) => f.titulo || f.centro);

  // Cartas confirmadas por quien las firmó (lib/referencias). La carta solo se
  // enlaza si la persona lo permite, con un enlace que caduca en 10 minutos.
  const referencias = await Promise.all((await referenciasVerificadas(id).catch(() => [])).map(async (r) => {
    const carta = r.carta_publica && r.carta_ruta ? await enlaceCarta(r.carta_ruta, 600) : null;
    const fecha = r.respondida_en ? new Date(r.respondida_en).toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: "Europe/Madrid" }) : "";
    return { id: r.id, empresa: r.empresa, firmante: r.firmante, cargo: r.cargo, fecha, carta };
  }));

  const caja = { background: "#161922", border: "1px solid #2d3142" };

  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      {esElMismo && (
        <p className="text-center text-xs py-2" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
          Así ven tu CV las empresas con Plan Empresa.
        </p>
      )}
      <div className="py-16 px-4" style={{ background: "linear-gradient(135deg, #1a1d28, #0f1117)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(59,130,246,0.2))", border: "2px solid rgba(34,197,94,0.3)" }}>
            <User size={40} strokeWidth={1.2} style={{ color: "#22c55e" }} />
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "#f1f5f9" }}>{nombre}</h1>
          {puesto && <p className="text-lg mb-3" style={{ color: "#22c55e" }}>{puesto}</p>}
          {ciudad && <p className="flex items-center justify-center gap-1 text-sm" style={{ color: "#94a3b8" }}><MapPin size={13} strokeWidth={1.8} />{ciudad}</p>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Contacto */}
        {(email || telefono) && (
          <div className="p-5 rounded-xl flex flex-wrap gap-x-6 gap-y-2" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-1.5 text-sm hover:opacity-80" style={{ color: "#22c55e" }}>
                <Mail size={14} strokeWidth={1.8} />{email}
              </a>
            )}
            {telefono && (
              <a href={`tel:${telefono}`} className="flex items-center gap-1.5 text-sm hover:opacity-80" style={{ color: "#f1f5f9" }}>
                <Phone size={14} strokeWidth={1.8} />{telefono}
              </a>
            )}
          </div>
        )}

        {/* «Me interesa»: invitarle a preparar la entrevista de la empresa */}
        {!esElMismo && <InvitarEntrevista candidatoId={id} nombre={nombre} />}

        {/* Referencias verificadas */}
        {referencias.length > 0 && (
          <div className="p-5 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold mb-1" style={{ color: "#22c55e" }}><BadgeCheck size={14} strokeWidth={1.8} />Referencias verificadas</h2>
            <p className="text-xs mb-3" style={{ color: "#64748b" }}>Quien firmó cada carta ha confirmado que es suya desde el correo de su empresa.</p>
            <div className="space-y-3">
              {referencias.map((r) => (
                <div key={r.id}>
                  <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{r.empresa}</p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>
                    Firmada por {r.firmante}, {r.cargo}{r.fecha ? ` · confirmada en ${r.fecha}` : ""}
                  </p>
                  {r.carta && (
                    <a href={r.carta} target="_blank" rel="noopener" className="inline-block text-xs font-semibold mt-1 hover:opacity-80" style={{ color: "#22c55e" }}>
                      Leer la carta →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perfil */}
        {perfil && (
          <div className="p-5 rounded-xl" style={caja}>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "#94a3b8" }}>{perfil}</p>
          </div>
        )}

        {/* Aptitudes */}
        {aptitudes.length > 0 && (
          <div className="p-5 rounded-xl" style={caja}>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}><Wrench size={13} strokeWidth={1.8} />Aptitudes</h2>
            <div className="flex flex-wrap gap-2">
              {aptitudes.map((h) => (
                <span key={h} className="px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", color: "#22c55e" }}>
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experiencia */}
        {experiencia.length > 0 && (
          <div className="p-5 rounded-xl" style={caja}>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}><Briefcase size={13} strokeWidth={1.8} />Experiencia</h2>
            <div className="space-y-4">
              {experiencia.map((e, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{[e.puesto, e.empresa].filter(Boolean).join(" · ")}</p>
                  {(e.fechas || e.ubicacion) && <p className="text-xs" style={{ color: "#64748b" }}>{[e.fechas, e.ubicacion].filter(Boolean).join(" · ")}</p>}
                  {e.descripcion && <p className="text-sm whitespace-pre-wrap mt-1" style={{ color: "#94a3b8" }}>{e.descripcion}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formación */}
        {formacion.length > 0 && (
          <div className="p-5 rounded-xl" style={caja}>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}><GraduationCap size={13} strokeWidth={1.8} />Formación</h2>
            <div className="space-y-3">
              {formacion.map((f, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{f.titulo}</p>
                  {(f.centro || f.ubicacion) && <p className="text-xs" style={{ color: "#64748b" }}>{[f.centro, f.ubicacion].filter(Boolean).join(" · ")}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Idiomas */}
        {idiomas && (
          <div className="p-5 rounded-xl" style={caja}>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}><Globe size={13} strokeWidth={1.8} />Idiomas</h2>
            <p className="text-sm" style={{ color: "#94a3b8" }}>{idiomas}</p>
          </div>
        )}

        <Link href="/empresas/candidatos" className="inline-block text-sm" style={{ color: "#22c55e" }}>← Volver a candidatos</Link>
      </div>
    </div>
  );
}
