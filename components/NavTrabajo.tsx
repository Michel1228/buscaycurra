"use client";

/**
 * components/NavTrabajo.tsx — El índice de todo lo que se puede hacer.
 *
 * POR QUÉ EXISTE. Buscar ofertas y enviar el CV a empresas eran dos apartados
 * distintos del menú, cada uno con su propia navegación por dentro. Para el
 * usuario eran dos aplicaciones separadas, y tenía que saber de antemano en
 * cuál estaba lo que buscaba. Nada le decía que existiera la otra mitad.
 *
 * Esta barra es la misma en las dos páginas y las enseña TODAS a la vez, con
 * una frase debajo de cada una explicando qué hace. Así, estés donde estés,
 * ves el mapa completo y sabes exactamente dónde está cada cosa. Las de otra
 * página son enlaces normales; las de la página actual cambian de sección sin
 * recargar.
 */

import Link from "next/link";
import { Search, MapPin, Building2, Users, Mail, ClipboardList, Bot } from "lucide-react";

export type SeccionTrabajo =
  | "ofertas" | "zona" | "buscar" | "ett" | "envio" | "historial";

interface Seccion {
  id: SeccionTrabajo;
  label: string;
  ayuda: string;
  Icon: typeof Search;
  /** En qué página vive. Determina si es enlace o cambio de sección. */
  pagina: "buscar" | "empresas";
}

export const SECCIONES: Seccion[] = [
  { id: "ofertas",   label: "Ofertas de trabajo", ayuda: "Publicados en medio mundo",        Icon: Search,        pagina: "buscar" },
  { id: "zona",      label: "Negocios de tu zona", ayuda: "Bares, talleres y tiendas cerca de ti",  Icon: MapPin,        pagina: "empresas" },
  { id: "buscar",    label: "Buscar una empresa",  ayuda: "Por su nombre, aunque sea el bar de al lado", Icon: Building2, pagina: "empresas" },
  { id: "ett",       label: "ETTs y agencias",     ayuda: "Las que colocan gente en tu provincia",  Icon: Users,         pagina: "empresas" },
  { id: "envio",     label: "Enviar mi CV",        ayuda: "Con carta escrita por IA para cada una", Icon: Mail,          pagina: "empresas" },
  { id: "historial", label: "Lo que he enviado",   ayuda: "A quién, cuándo y si han contestado",    Icon: ClipboardList, pagina: "empresas" },
];

// Con el diseño de neón (7 nov 2026): cada sección con su icono en un círculo
// de cristal de su color, como las tarjetas y el menú.
const TONO_SECCION: Record<SeccionTrabajo, string> = {
  ofertas: "azul", zona: "verde", buscar: "morado", ett: "ambar", envio: "lima", historial: "cian",
};

export default function NavTrabajo({
  activa, paginaActual, onCambiar,
}: {
  activa: SeccionTrabajo;
  paginaActual: "buscar" | "empresas";
  /** Solo se llama para secciones de esta misma página. */
  onCambiar: (id: SeccionTrabajo) => void;
}) {
  return (
    // En el móvil van en rejilla de dos columnas, no en una fila con scroll.
    // Con scroll horizontal solo se ven las dos primeras y hay que adivinar
    // que hay más arrastrando — que es exactamente cómo "Enviar CV" pasaba
    // desapercibida. En rejilla se ve todo lo que hay sin tocar nada.
    <nav className="grid grid-cols-2 md:flex md:flex-col gap-1.5 md:gap-1 md:w-56 md:shrink-0">
      {SECCIONES.map(s => {
        const esActiva = s.id === activa;
        const contenido = (
          <>
            <span className={`icono-circulo tono-${esActiva ? "lima" : TONO_SECCION[s.id]} shrink-0`} style={{ width: 30, height: 30 }} aria-hidden="true">
              <s.Icon size={14} />
            </span>
            <span className="min-w-0">
              <span className="block font-medium">{s.label}</span>
              {/* La frase de ayuda solo cabe en pantalla grande. En el móvil,
                  con dos columnas, solo entra el nombre. */}
              <span className="hidden md:block text-[11px] leading-tight mt-0.5"
                style={{ color: esActiva ? "#d9f99d" : "#a7b3c6" }}>
                {s.ayuda}
              </span>
            </span>
          </>
        );
        // POR QUE LAS NO ACTIVAS LLEVAN CAJA. Antes eran `transparent` de fondo
        // Y de borde: solo la seleccionada tenia forma, y las demas quedaban
        // como texto gris suelto. No parecian pulsables porque visualmente no
        // lo eran, y por eso "ETTs y agencias" o "Buscar una empresa" pasaban
        // desapercibidas. Ahora cada una es una tarjeta con el mismo fondo y el
        // mismo borde que el resto de la aplicacion, y la activa se distingue
        // por el verde, no por ser la unica que se ve.
        const estilo = {
          background: esActiva ? "rgba(163,230,53,0.1)" : "rgba(12,15,22,0.86)",
          border: `1px solid ${esActiva ? "rgba(163,230,53,0.45)" : "rgba(148,163,184,0.16)"}`,
          boxShadow: esActiva ? "0 0 18px -8px rgba(163,230,53,0.8)" : "none",
          color: esActiva ? "#ecfccb" : "#dbe3ee",
        };
        const clases =
          "flex items-center gap-2 md:gap-2.5 px-2.5 md:px-3 min-h-[48px] py-2 rounded-xl " +
          "text-[12px] md:text-[13px] transition text-left leading-tight " +
          (esActiva ? "" : "hover:border-[#a3e635]/40 hover:text-[#f1f5f9]");

        // Las secciones de la otra página son enlaces de verdad: se navega,
        // no se duplica el codigo de una pantalla dentro de la otra.
        if (s.pagina !== paginaActual) {
          const destino = s.pagina === "buscar" ? "/app/buscar" : `/app/empresas?seccion=${s.id}`;
          return (
            <Link key={s.id} href={destino} className={clases} style={estilo}>
              {contenido}
            </Link>
          );
        }
        return (
          <button key={s.id} onClick={() => onCambiar(s.id)} className={clases} style={estilo}>
            {contenido}
          </button>
        );
      })}

      {/* Guzzi cierra la lista: es la otra forma de hacer todo esto, hablando. */}
      <Link href="/app/gusi"
        className="flex items-center gap-2 md:gap-2.5 px-2.5 md:px-3 min-h-[48px] py-2 rounded-xl text-[12px] md:text-[13px] transition col-span-2 md:col-span-1 md:mt-2 leading-tight"
        style={{ background: "rgba(163,230,53,0.07)", border: "1px dashed rgba(163,230,53,0.45)", color: "#d9f99d" }}>
        <span className="icono-circulo tono-lima shrink-0" style={{ width: 30, height: 30 }} aria-hidden="true"><Bot size={14} /></span>
        <span className="min-w-0">
          <span className="block font-medium">Que lo haga Guzzi</span>
          <span className="hidden md:block text-[11px] leading-tight mt-0.5" style={{ color: "#a7b3c6" }}>
            Se lo pides hablando y lo busca él
          </span>
        </span>
      </Link>
    </nav>
  );
}
