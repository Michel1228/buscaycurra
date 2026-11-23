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
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { MapPin, Wrench, Briefcase, GraduationCap, Globe, Mail, Phone, BadgeCheck, Gauge, UserRound, FileText, ArrowLeft } from "lucide-react";
import { enlaceCarta, referenciasVerificadas } from "@/lib/referencias/referencias";
import { abrirCandidato, cuentaEmpresa } from "@/lib/empresas/cuenta";
import { candidatoVisible } from "@/lib/empresas/candidatos";
import { NIVELES, puedeVer } from "@/lib/empresas/reglas";
import { correoVerificado } from "@/lib/auth/correo-verificado";
import InvitarEntrevista from "@/components/empresas/InvitarEntrevista";
import { AvatarPersona, AvisoContratacion, MarcoContratacion } from "@/components/empresas/AreaContratacion";
import { Etiqueta } from "@/components/neon/Neon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidato — BuscayCurra Talent",
  description: "Perfil profesional en BuscayCurra. Conecta con empresas que buscan tu talento.",
  robots: "noindex",
};

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Quién está mirando, por la sesión de las cookies (la misma que usa la web).
 * Con el correo: hace falta para saber si es del equipo de una empresa.
 */
async function quienMira(): Promise<{ id: string; email: string; confirmado: boolean } | null> {
  try {
    const almacen = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => almacen.getAll() } }
    );
    // Se llama "sesion" y no "user" a propósito: el sello comprueba que en esta
    // página no salga el correo de quien firma una referencia buscando el campo
    // email de "r", y el correo del usuario escrito con "user" da un falso aviso.
    const sesion = (await supabase.auth.getUser()).data.user;
    return sesion?.id ? { id: sesion.id, email: sesion.email || "", confirmado: correoVerificado(sesion) } : null;
  } catch {
    return null;
  }
}

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Lo que sale cuando el CV no se puede enseñar: en el marco del área de contratación. */
function Aviso({ titulo, mensaje, enlace, boton }: { titulo: string; mensaje: string; enlace: string; boton: string }) {
  return <AvisoContratacion titulo={titulo} texto={mensaje} enlace={enlace} boton={boton} />;
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
  const esElMismo = quien.id === id;
  // La empresa se mira antes que el CV: a quien no es empresa verificada no se
  // le dice ni si ese candidato existe. Vale la suya o la de la empresa que le
  // ha dado acceso (lib/empresas/cuenta.ts). Pagar el Plan Empresa no basta
  // desde el 21 nov 2026.
  const cuenta = esElMismo ? null : await cuentaEmpresa(quien).catch(() => null);
  if (!esElMismo && !cuenta) {
    return <Aviso titulo="CV solo para empresas verificadas" mensaje="Los CV de los candidatos los ven las empresas, ETT y agencias de colocación que hemos verificado. Da de alta la tuya: es gratis."
      enlace="/empresas/alta" boton="Dar de alta mi empresa →" />;
  }

  // Lo de siempre (el CV más reciente y visible de user_cvs), con su puntuación y sus sectores.
  const ficha = await candidatoVisible(id);
  if (!ficha) return noDisponible;

  // Cada empresa ve a los de su sector; las ETT y agencias, a todos. Se mira
  // antes del cupo, para no gastar plaza en un perfil que no puede ver.
  if (cuenta && !puedeVer(cuenta.alcance, ficha.sectores)) {
    return <Aviso titulo="Este candidato no es de vuestro sector" mensaje="Cada empresa ve a los candidatos de los sectores con los que se dio de alta."
      enlace="/empresas/candidatos" boton="← Volver a candidatos" />;
  }

  // Abrir un candidato nuevo gasta una plaza del cupo del mes de la empresa; uno
  // ya abierto, no. Se mira después de saber que el CV existe y es visible, para
  // no gastar plaza en un perfil que no se puede enseñar.
  if (cuenta) {
    const abierto = await abrirCandidato(cuenta.empresaId, id);
    if (!abierto.ok) {
      return <Aviso titulo={`Ya has abierto ${abierto.maximo} candidatos este mes`}
        mensaje="Los que ya has abierto siguen disponibles. El cupo es de toda la empresa y se renueva el día 1."
        enlace="/empresas/candidatos" boton="← Volver a candidatos" />;
    }
  }

  const cv = ficha.cv;
  const nombre = [texto(cv.nombre), texto(cv.apellidos)].filter(Boolean).join(" ") || "Candidato";
  const puesto = texto(cv.subtitulo);
  const ciudad = texto(cv.ciudad);
  const perfil = texto(cv.perfilProfesional);
  const email = texto(cv.email);
  const telefono = texto(cv.telefono);
  // El editor guarda idiomas y aptitudes como listas (CVData); los CV antiguos, como texto.
  const idiomas = Array.isArray(cv.idiomas)
    ? cv.idiomas.map((i: Record<string, unknown>) => texto(i?.nombre)).filter(Boolean).join(", ")
    : texto(cv.idiomas).replace(/\s*:\s*\d+/g, ""); // «Español:100» de los CV antiguos → «Español»
  const aptitudes = (Array.isArray(cv.aptitudes) ? cv.aptitudes.map(texto) : texto(cv.aptitudes).split(/[,;]/))
    .map((h) => h.trim()).filter(Boolean);
  const nota = ficha.puntuacion;
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

  // Las tarjetas de cada parte del CV: el mismo cristal que el resto de la app.
  const Bloque = ({ Icono, titulo, tono = "neutro", children }: { Icono: typeof Briefcase; titulo: string; tono?: string; children: ReactNode }) => (
    <section className={`cristal tono-${tono} p-5`}>
      <h2 className="flex items-center gap-2 text-[15px] font-bold mb-3" style={{ color: "#f8fafc" }}>
        <Icono size={18} strokeWidth={1.9} style={{ color: "var(--tono-texto)" }} aria-hidden="true" />{titulo}
      </h2>
      {children}
    </section>
  );

  const contenido = (
    <>
      {/* Quién es, de un vistazo: inicial, nombre, puesto, ciudad, puntuación y cómo contactar. */}
      <section className="cristal tono-cian p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <AvatarPersona id={id} nombre={nombre} size={64} />
          <div className="flex-1 min-w-0">
            <h2 className="text-[22px] sm:text-[26px] font-extrabold leading-tight" style={{ color: "#f8fafc" }}>{nombre}</h2>
            {puesto && <p className="text-[14px] font-semibold mt-0.5 line-clamp-2" style={{ color: "#99f6e4" }}>{puesto}</p>}
            {ciudad && <p className="flex items-center gap-1 text-[13px] mt-1" style={{ color: "#a7b3c6" }}><MapPin size={13} aria-hidden="true" />{ciudad}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-4">
          <Etiqueta tono="cian"><Gauge size={12} aria-hidden="true" />{nota.total}/100 · {NIVELES[nota.nivel]}</Etiqueta>
          {referencias.length > 0 && (
            <Etiqueta tono="verde"><BadgeCheck size={12} aria-hidden="true" />{referencias.length > 1 ? `${referencias.length} referencias verificadas` : "Referencia verificada"}</Etiqueta>
          )}
        </div>
        {(email || telefono) && (
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            {email && <a href={`mailto:${email}`} className="boton-cristal tono-cian px-3"><Mail size={16} aria-hidden="true" />Escribir</a>}
            {telefono && <a href={`tel:${telefono}`} className="boton-cristal tono-cian px-3"><Phone size={16} aria-hidden="true" />Llamar</a>}
            <p className="col-span-2 text-[12.5px] break-all" style={{ color: "#a7b3c6" }}>{[email, telefono].filter(Boolean).join(" · ")}</p>
          </div>
        )}
      </section>

      {/* Invitarle a la entrevista de la empresa: lo primero que se puede hacer con él. */}
      {!esElMismo && <InvitarEntrevista candidatoId={id} nombre={nombre} />}

      {/* Puntuación por hechos comprobables (lib/empresas/reglas.ts): sin IA */}
      <Bloque Icono={Gauge} titulo="Puntuación BuscayCurra" tono="cian">
        <div className="flex items-end gap-2 mb-3">
          <span className="text-[40px] font-extrabold leading-none tabular-nums" style={{ color: "#99f6e4" }}>{nota.total}</span>
          <span className="text-[13px] pb-1" style={{ color: "var(--texto-tenue)" }}>/100 · {NIVELES[nota.nivel]}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {nota.partes.map((p) => (
            <Etiqueta key={p.id} tono={p.puntos === p.max ? "verde" : "neutro"}>{p.nombre} {p.puntos}/{p.max}</Etiqueta>
          ))}
        </div>
        <p className="text-[12px] mt-3" style={{ color: "var(--texto-tenue)" }}>Solo hechos comprobables. Ninguna IA valora a la persona.</p>
      </Bloque>

      {/* Referencias verificadas */}
      {referencias.length > 0 && (
        <Bloque Icono={BadgeCheck} titulo="Referencias verificadas" tono="verde">
          <div className="space-y-3">
            {referencias.map((r) => (
              <div key={r.id} className="rounded-xl p-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <p className="text-[14px] font-semibold" style={{ color: "#f1f5f9" }}>{r.empresa}</p>
                <p className="text-[12.5px]" style={{ color: "#a7b3c6" }}>{r.firmante}, {r.cargo}{r.fecha ? ` · ${r.fecha}` : ""}</p>
                {r.carta && (
                  <a href={r.carta} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[13px] font-semibold mt-1.5" style={{ color: "#86efac" }}>
                    <FileText size={14} aria-hidden="true" />Leer la carta
                  </a>
                )}
              </div>
            ))}
          </div>
        </Bloque>
      )}

      {perfil && (
        <Bloque Icono={UserRound} titulo="Perfil">
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: "#cbd5e1" }}>{perfil}</p>
        </Bloque>
      )}

      {experiencia.length > 0 && (
        <Bloque Icono={Briefcase} titulo="Experiencia" tono="azul">
          <ol className="space-y-4">
            {experiencia.map((e, i) => (
              <li key={i} className="pl-4" style={{ borderLeft: "2px solid rgba(59,130,246,0.45)" }}>
                <p className="text-[14.5px] font-semibold" style={{ color: "#f1f5f9" }}>{e.puesto || e.empresa}</p>
                {e.puesto && e.empresa && <p className="text-[13px]" style={{ color: "#93c5fd" }}>{e.empresa}</p>}
                {(e.fechas || e.ubicacion) && <p className="text-[12px]" style={{ color: "var(--texto-tenue)" }}>{[e.fechas, e.ubicacion].filter(Boolean).join(" · ")}</p>}
                {e.descripcion && <p className="text-[13.5px] whitespace-pre-wrap mt-1.5 leading-relaxed" style={{ color: "#a7b3c6" }}>{e.descripcion}</p>}
              </li>
            ))}
          </ol>
        </Bloque>
      )}

      {formacion.length > 0 && (
        <Bloque Icono={GraduationCap} titulo="Formación" tono="morado">
          <ul className="space-y-3">
            {formacion.map((f, i) => (
              <li key={i}>
                <p className="text-[14.5px] font-semibold" style={{ color: "#f1f5f9" }}>{f.titulo}</p>
                {(f.centro || f.ubicacion) && <p className="text-[12.5px]" style={{ color: "#a7b3c6" }}>{[f.centro, f.ubicacion].filter(Boolean).join(" · ")}</p>}
              </li>
            ))}
          </ul>
        </Bloque>
      )}

      {(aptitudes.length > 0 || idiomas) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {aptitudes.length > 0 && (
            <Bloque Icono={Wrench} titulo="Aptitudes" tono="ambar">
              <div className="flex flex-wrap gap-1.5">{aptitudes.map((h) => <Etiqueta key={h} tono="ambar">{h}</Etiqueta>)}</div>
            </Bloque>
          )}
          {idiomas && (
            <Bloque Icono={Globe} titulo="Idiomas" tono="rosa">
              <p className="text-[14px]" style={{ color: "#cbd5e1" }}>{idiomas}</p>
            </Bloque>
          )}
        </div>
      )}

      <a href="/empresas/candidatos" className="boton-cristal tono-neutro"><ArrowLeft size={16} aria-hidden="true" />Volver a candidatos</a>
    </>
  );

  // El propio candidato ve su ficha tal cual la ven las empresas, sin las pestañas de empresa.
  return (
    <MarcoContratacion seccion="candidatos" titulo={esElMismo ? "Así te ven las empresas" : "Ficha del candidato"} Icono={UserRound}
      empresa={esElMismo ? "Las empresas verificadas de tu sector, las ETT y las agencias de colocación" : cuenta?.razonSocial} pestanas={!esElMismo}>
      {contenido}
    </MarcoContratacion>
  );
}
