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
import { Search, MapPin, Building2, Mail, ClipboardList, Bot } from "lucide-react";

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
  { id: "ofertas",   label: "Ofertas de trabajo", ayuda: "Puestos publicados, de 49 países",        Icon: Search,        pagina: "buscar" },
  { id: "zona",      label: "Negocios de tu zona", ayuda: "Bares, talleres y tiendas cerca de ti",  Icon: MapPin,        pagina: "empresas" },
  { id: "buscar",    label: "Buscar una empresa",  ayuda: "Por su nombre, aunque sea el bar de al lado", Icon: Building2, pagina: "empresas" },
  { id: "ett",       label: "ETTs y agencias",     ayuda: "Las que colocan gente en tu provincia",  Icon: Building2,     pagina: "empresas" },
  { id: "envio",     label: "Enviar mi CV",        ayuda: "Con carta escrita por IA para cada una", Icon: Mail,          pagina: "empresas" },
  { id: "historial", label: "Lo que he enviado",   ayuda: "A quién, cuándo y si han contestado",    Icon: ClipboardList, pagina: "empresas" },
];

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
            <s.Icon size={15} className="mt-0.5 shrink-0" />
            <span className="min-w-0">
              <span className="block font-medium">{s.label}</span>
              {/* La frase de ayuda solo cabe en pantalla grande; en el móvil
                  las secciones van en fila y solo se ve el nombre. */}
              <span className="hidden md:block text-[10px] leading-tight mt-0.5"
                style={{ color: esActiva ? "rgba(34,197,94,0.75)" : "#64748b" }}>
                {s.ayuda}
              </span>
            </span>
          </>
        );
        const estilo = {
          background: esActiva ? "rgba(34,197,94,0.12)" : "transparent",
          border: `1px solid ${esActiva ? "rgba(34,197,94,0.35)" : "transparent"}`,
          color: esActiva ? "#22c55e" : "#94a3b8",
        };
        const clases = "flex items-start gap-2 md:gap-2.5 px-2.5 md:px-3 py-2.5 rounded-lg text-[11px] md:text-xs transition text-left leading-tight";

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
        className="flex items-start gap-2 md:gap-2.5 px-2.5 md:px-3 py-2.5 rounded-lg text-[11px] md:text-xs transition col-span-2 md:col-span-1 md:mt-2 leading-tight"
        style={{ background: "rgba(34,197,94,0.06)", border: "1px dashed rgba(34,197,94,0.3)", color: "#22c55e" }}>
        <Bot size={15} className="mt-0.5 shrink-0" />
        <span className="min-w-0">
          <span className="block font-medium">Que lo haga Guzzi</span>
          <span className="hidden md:block text-[10px] leading-tight mt-0.5" style={{ color: "#64748b" }}>
            Se lo pides hablando y lo busca él
          </span>
        </span>
      </Link>
    </nav>
  );
}
