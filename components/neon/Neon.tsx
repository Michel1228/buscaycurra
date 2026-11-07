/**
 * components/neon/Neon.tsx — Las piezas comunes del diseño de neón (7 nov 2026).
 *
 * Salen de los bocetos de Michel: tarjetas de cristal con borde y degradado
 * del color de su tipo, cifras grandes arriba, tarjetas grandes para elegir,
 * acciones rápidas, iconos en círculo y Guzzi con su aro de luz. Los estilos
 * están en app/globals.css ("SISTEMA NEÓN"); aquí solo la estructura.
 *
 * REGLA DE ESTAS PIEZAS: ninguna trae cifras ni textos de ejemplo. Lo que
 * enseñan lo pasa la pantalla, y la pantalla lo saca de datos reales; si no
 * hay dato, la tarjeta no se pinta (los bocetos traían "68 % de respuesta" o
 * "+12 %" que no salían de ningún sitio).
 */
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

export type Tono = "azul" | "verde" | "morado" | "ambar" | "lima" | "cian" | "rosa" | "neutro";

/** El número como se escribe en España: 67.274. */
export function cifra(n: number): string {
  return n.toLocaleString("es-ES");
}

/**
 * Guzzi con su aro de luz. Es la misma imagen de siempre (la del icono de la
 * app), ampliada un poco para que el círculo crema llene el aro.
 */
export function GuzziBrillo({ size = 56, decorativo = false, className = "" }: {
  size?: number;
  /** Si al lado ya pone "Guzzi", el lector de pantalla no lo repite. */
  decorativo?: boolean;
  className?: string;
}) {
  return (
    <span className={`guzzi-aro relative inline-flex ${className}`}>
      <span className="block overflow-hidden rounded-full" style={{ width: size, height: size, background: "#f6efd8" }}>
        <Image
          src={size > 64 ? "/icon-512.png" : "/icon-192.png"}
          alt={decorativo ? "" : "Guzzi"}
          width={size}
          height={size}
          className="block object-cover"
          style={{ width: size, height: size, transform: "scale(1.2)" }}
          priority
        />
      </span>
    </span>
  );
}

/** Icono dentro de un círculo del color de su tono. */
export function IconoCirculo({ Icono, tono, size = 44 }: { Icono: LucideIcon; tono?: Tono; size?: number }) {
  return (
    <span className={`icono-circulo ${tono ? `tono-${tono}` : ""}`} style={{ width: size, height: size }} aria-hidden="true">
      <Icono size={Math.round(size * 0.45)} strokeWidth={1.9} />
    </span>
  );
}

/** Pastilla pequeña: "Recomendado", "Activa", "En pausa"… */
export function Etiqueta({ tono = "lima", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className={`tono-${tono} inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold`}
      style={{ background: "rgba(var(--tono), 0.14)", border: "1px solid rgba(var(--tono), 0.35)", color: "var(--tono-texto)" }}
    >
      {children}
    </span>
  );
}

/** Las ondas de luz de las cabeceras. Decorativas; quietas con "reducir movimiento". */
export function OndasCabecera({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`ondas-cabecera pointer-events-none absolute ${className}`}
      viewBox="0 0 600 220"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="onda-cab" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a3e635" stopOpacity="0" />
          <stop offset="0.55" stopColor="#bef264" stopOpacity="0.85" />
          <stop offset="1" stopColor="#a3e635" stopOpacity="0" />
        </linearGradient>
        <filter id="onda-brillo" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <path d="M0 170 C 140 170, 220 60, 360 70 S 520 150, 600 40" stroke="url(#onda-cab)" strokeWidth="10" filter="url(#onda-brillo)" opacity="0.5" />
      <path d="M0 170 C 140 170, 220 60, 360 70 S 520 150, 600 40" stroke="url(#onda-cab)" strokeWidth="2" />
      <path d="M0 190 C 160 190, 240 96, 380 100 S 530 170, 600 80" stroke="url(#onda-cab)" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/**
 * Cabecera de pantalla: icono (o Guzzi), título con una parte en verde neón,
 * una frase debajo y las ondas de luz a la derecha.
 */
export function CabeceraPantalla({ Icono, guzzi, antetitulo, titulo, resaltado, subtitulo, children }: {
  Icono?: LucideIcon;
  guzzi?: boolean;
  antetitulo?: string;
  titulo: ReactNode;
  /** La parte del título que va en verde neón, al final. */
  resaltado?: string;
  subtitulo?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="relative">
      <OndasCabecera className="-right-6 -top-10 w-[70%] max-w-[620px] h-auto opacity-80 hidden sm:block" />
      <div className="relative flex items-center gap-4 sm:gap-5">
        {guzzi ? (
          <GuzziBrillo size={64} decorativo className="sm:hidden" />
        ) : null}
        {guzzi ? (
          <GuzziBrillo size={84} decorativo className="hidden sm:inline-flex" />
        ) : Icono ? (
          <span className="icono-circulo tono-lima" style={{ width: 56, height: 56, borderRadius: 18 }} aria-hidden="true">
            <Icono size={28} strokeWidth={1.8} />
          </span>
        ) : null}
        <div className="min-w-0">
          {antetitulo && (
            <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-1" style={{ color: "var(--neon)" }}>{antetitulo}</p>
          )}
          <h1 className="text-[26px] sm:text-4xl font-extrabold leading-[1.1] tracking-tight" style={{ color: "#f8fafc" }}>
            {titulo}{resaltado ? <> <span className="texto-neon">{resaltado}</span></> : null}
          </h1>
          {subtitulo && (
            <p className="mt-1.5 text-sm sm:text-base leading-snug" style={{ color: "#a7b3c6" }}>{subtitulo}</p>
          )}
        </div>
      </div>
      {children}
    </header>
  );
}

/** Tarjeta de cristal. Si lleva href, es un enlace entero. */
export function TarjetaCristal({ tono = "neutro", href, className = "", children, ...resto }: {
  tono?: Tono;
  href?: string;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">) {
  if (href) {
    return (
      <Link href={href} className={`cristal cristal-enlace tono-${tono} block ${className}`}>
        {children}
      </Link>
    );
  }
  return (
    <div className={`cristal tono-${tono} ${className}`} {...resto}>
      {children}
    </div>
  );
}

/**
 * Cifra grande de arriba de la pantalla. `valor` ya viene contado: esta pieza
 * no inventa ni redondea nada.
 */
export function CifraGrande({ tono, Icono, valor, etiqueta, href, nota }: {
  tono: Tono;
  Icono: LucideIcon;
  valor: number | string;
  etiqueta: string;
  href?: string;
  /** Una línea pequeña debajo, si hace falta aclarar de dónde sale. */
  nota?: string;
}) {
  const contenido = (
    <>
      <IconoCirculo Icono={Icono} tono={tono} size={40} />
      <span className="min-w-0 flex-1">
        <span className="block text-[26px] sm:text-[30px] font-extrabold leading-none tracking-tight tabular-nums" style={{ color: "var(--tono-texto)" }}>
          {typeof valor === "number" ? cifra(valor) : valor}
        </span>
        <span className="block mt-1.5 text-[13px] leading-tight" style={{ color: "#cbd5e1" }}>{etiqueta}</span>
        {nota && <span className="block mt-0.5 text-[11px] leading-tight" style={{ color: "var(--texto-tenue)" }}>{nota}</span>}
      </span>
      {href && <ChevronRight size={18} className="hidden sm:block shrink-0 opacity-60" aria-hidden="true" />}
    </>
  );
  const clases = `cristal tono-${tono} flex flex-col items-start gap-3 sm:flex-row sm:items-center p-4 min-h-[96px]`;
  return href ? (
    <Link href={href} className={`${clases} cristal-enlace`}>{contenido}</Link>
  ) : (
    <div className={clases}>{contenido}</div>
  );
}

/** Fila de "Acciones rápidas": icono en círculo, texto y flecha. 60 px de alto. */
export function AccionRapida({ tono, Icono, texto, href, onClick, destacada }: {
  tono: Tono;
  Icono: LucideIcon;
  texto: string;
  href?: string;
  onClick?: () => void;
  destacada?: boolean;
}) {
  const clases = `cristal cristal-enlace tono-${tono} flex items-center gap-3 w-full text-left px-4 min-h-[60px]`;
  const estilo = destacada ? { borderColor: "rgba(var(--tono), 0.6)", boxShadow: "0 0 0 1px rgba(var(--tono),0.25) inset, 0 12px 30px -16px rgba(var(--tono),0.8)" } : undefined;
  const contenido = (
    <>
      <IconoCirculo Icono={Icono} tono={tono} size={40} />
      <span className="flex-1 text-[15px] font-semibold" style={{ color: "#f1f5f9" }}>{texto}</span>
      <ChevronRight size={18} className="shrink-0 opacity-60" aria-hidden="true" />
    </>
  );
  if (href) return <Link href={href} className={clases} style={estilo}>{contenido}</Link>;
  return <button type="button" onClick={onClick} className={clases} style={estilo}>{contenido}</button>;
}

/** Título de sección con su icono y, si hace falta, el enlace a "ver todo". */
export function TituloSeccion({ Icono, titulo, subtitulo, enlace, id }: {
  Icono?: LucideIcon;
  titulo: string;
  subtitulo?: ReactNode;
  enlace?: { href: string; texto: string };
  id?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3.5">
      <div className="flex items-start gap-2.5 min-w-0">
        {Icono && <Icono size={22} strokeWidth={1.8} className="mt-0.5 shrink-0" style={{ color: "var(--neon)" }} aria-hidden="true" />}
        <div className="min-w-0">
          <h2 id={id} className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: "#f8fafc" }}>{titulo}</h2>
          {subtitulo && <p className="text-[13px] mt-0.5 leading-snug" style={{ color: "#a7b3c6" }}>{subtitulo}</p>}
        </div>
      </div>
      {enlace && (
        <Link href={enlace.href} className="shrink-0 inline-flex items-center gap-1 min-h-[44px] text-[13px] font-semibold" style={{ color: "var(--neon-claro)" }}>
          {enlace.texto} <ChevronRight size={15} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/**
 * Tarjeta grande para elegir camino ("Habla con Guzzi" o "Modo manual").
 * La recomendada lleva el botón de neón; la otra, el de cristal. Así hay una
 * sola acción principal en la pantalla.
 */
export function TarjetaEleccion({ tono, cabeza, titulo, resaltado, etiqueta, subtitulo, puntos, accion, children }: {
  tono: Tono;
  /** El icono o Guzzi, a la izquierda del título. */
  cabeza: ReactNode;
  titulo: string;
  resaltado?: string;
  etiqueta?: string;
  subtitulo?: string;
  puntos?: { Icono: LucideIcon; texto: string }[];
  accion: { href: string; texto: string; principal?: boolean };
  children?: ReactNode;
}) {
  return (
    <div className={`cristal tono-${tono} relative overflow-hidden p-5 sm:p-6 flex flex-col gap-4`}>
      <div className="flex items-center gap-4">
        {cabeza}
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: "#f8fafc" }}>
            {titulo}{resaltado ? <> <span className="texto-neon">{resaltado}</span></> : null}
          </h2>
          {etiqueta && <div className="mt-1"><Etiqueta tono={tono}>{etiqueta}</Etiqueta></div>}
          {subtitulo && <p className="text-[13px] mt-0.5" style={{ color: "#a7b3c6" }}>{subtitulo}</p>}
        </div>
      </div>
      {puntos && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {puntos.map(({ Icono, texto }) => (
            <li key={texto} className="flex items-center gap-2.5 text-[14px]" style={{ color: "#dbe3ee" }}>
              <Icono size={17} strokeWidth={2} className="shrink-0" style={{ color: "var(--tono-texto)" }} aria-hidden="true" />
              {texto}
            </li>
          ))}
        </ul>
      )}
      {children}
      <Link href={accion.href} className={`${accion.principal ? "boton-neon" : "boton-cristal"} w-full mt-auto`}>
        {accion.texto} <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}
