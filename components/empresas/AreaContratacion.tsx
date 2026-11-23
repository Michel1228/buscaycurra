/**
 * components/empresas/AreaContratacion.tsx — El marco de las pantallas de empresa.
 *
 * POR QUÉ (23 nov 2026, Michel): «las casillas son muy simples, no tienen nada
 * que ver con la otra interfaz; que no sea un montón de letras, que se
 * identifique todo». Candidatos, Entrevistas y Equipo llevan ahora el diseño de
 * neón de la app (components/neon/Neon.tsx) y, con la sesión abierta, la misma
 * barra de arriba y de abajo (AppNavWrapper, RUTAS_EMPRESA). Su color propio es
 * el turquesa (tono-cian), para que se vea a la primera que es la parte de la
 * empresa y no la del candidato, que es lima.
 *
 * Sin hooks: lo usan tanto las pantallas de cliente como /talento/[id], que se
 * pinta en el servidor.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { MessagesSquare, Users, UsersRound, type LucideIcon } from "lucide-react";
import { GuzziBrillo } from "@/components/neon/Neon";

export type SeccionContratacion = "candidatos" | "entrevistas" | "equipo";

const PESTANAS: { id: SeccionContratacion; href: string; texto: string; Icono: LucideIcon }[] = [
  { id: "candidatos", href: "/empresas/candidatos", texto: "Candidatos", Icono: Users },
  { id: "entrevistas", href: "/empresas/entrevistas", texto: "Entrevistas", Icono: MessagesSquare },
  { id: "equipo", href: "/empresas/equipo", texto: "Equipo", Icono: UsersRound },
];

/** Iniciales de una persona: «María Luna» → «ML». */
export function iniciales(nombre: string): string {
  return nombre.trim().split(/\s+/).slice(0, 2).map((n) => n[0] || "").join("").toUpperCase() || "?";
}

/** Un tono fijo por persona, para que cada tarjeta se distinga sin decir nada de ella. */
export function tonoDe(id: string): "azul" | "morado" | "ambar" | "rosa" | "cian" | "verde" {
  const tonos = ["azul", "morado", "ambar", "rosa", "cian", "verde"] as const;
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return tonos[h % tonos.length];
}

/** La inicial de una persona en su círculo de color. */
export function AvatarPersona({ id, nombre, size = 48 }: { id: string; nombre: string; size?: number }) {
  return (
    <span className={`icono-circulo tono-${tonoDe(id)} font-extrabold`} style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }} aria-hidden="true">
      {iniciales(nombre)}
    </span>
  );
}

export function MarcoContratacion({ seccion, titulo, Icono, empresa, pestanas = true, porValorar = 0, children }: {
  seccion?: SeccionContratacion;
  titulo: string;
  Icono: LucideIcon;
  /** La razón social de la empresa verificada, si ya se sabe. */
  empresa?: string | null;
  pestanas?: boolean;
  /** Respuestas de entrevista que nadie ha valorado todavía: salen en la pestaña. */
  porValorar?: number;
  children: ReactNode;
}) {
  return (
    <div className="ui-neon min-h-screen pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-12 space-y-6">
        <header className="tono-cian flex items-center gap-3.5 sm:gap-5">
          <span className="icono-circulo" style={{ width: 56, height: 56, borderRadius: 18 }} aria-hidden="true">
            <Icono size={28} strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--tono-texto)" }}>Área de contratación</p>
            <h1 className="text-[26px] sm:text-4xl font-extrabold leading-[1.1] tracking-tight" style={{ color: "#f8fafc" }}>{titulo}</h1>
            {empresa && <p className="text-[13px] mt-0.5 truncate" style={{ color: "#a7b3c6" }}>{empresa}</p>}
          </div>
        </header>

        {pestanas && (
          <nav aria-label="Área de contratación" className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl"
            style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(45,212,191,0.22)" }}>
            {PESTANAS.map(({ id, href, texto, Icono: I }) => {
              const activa = id === seccion;
              return (
                <Link key={id} href={href} aria-current={activa ? "page" : undefined}
                  className="relative flex items-center justify-center gap-1.5 sm:gap-2 min-h-[46px] rounded-xl text-[13.5px] sm:text-[15px] font-semibold transition-colors"
                  style={activa
                    ? { background: "rgba(45,212,191,0.16)", color: "#99f6e4", boxShadow: "inset 0 0 0 1px rgba(45,212,191,0.5)" }
                    : { color: "#a7b3c6" }}>
                  <I size={17} strokeWidth={2} aria-hidden="true" />
                  {texto}
                  {id === "entrevistas" && porValorar > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold inline-flex items-center justify-center tabular-nums"
                      style={{ background: "#f59e0b", color: "#1a1205" }} aria-label={`${porValorar} por valorar`}>
                      {porValorar}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {children}
      </div>
    </div>
  );
}

/**
 * Lo que sale cuando aún no se puede usar la pantalla: entrar, darse de alta,
 * cargando… Una tarjeta en medio, con Guzzi, y un solo botón.
 */
export function AvisoContratacion({ titulo, texto, enlace, boton, secundario }: {
  titulo: string;
  texto?: string;
  enlace?: string;
  boton?: string;
  secundario?: { href: string; texto: string };
}) {
  return (
    <div className="ui-neon min-h-screen pt-16 px-4 flex items-start sm:items-center justify-center">
      <div className="cristal tono-cian w-full max-w-md mt-10 sm:mt-0 p-7 text-center flex flex-col items-center gap-3">
        <GuzziBrillo size={64} decorativo />
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase mt-1" style={{ color: "var(--tono-texto)" }}>Área de contratación</p>
        <h1 className="text-xl font-extrabold" style={{ color: "#f8fafc" }}>{titulo}</h1>
        {texto && <p className="text-sm leading-relaxed" style={{ color: "#a7b3c6" }}>{texto}</p>}
        {enlace && boton && <Link href={enlace} className="boton-neon w-full mt-2">{boton}</Link>}
        {secundario && <Link href={secundario.href} className="boton-cristal tono-cian w-full">{secundario.texto}</Link>}
      </div>
    </div>
  );
}
