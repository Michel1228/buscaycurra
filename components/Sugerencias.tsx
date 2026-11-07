"use client";

/**
 * components/Sugerencias.tsx — La lista de sugerencias bajo un campo de texto.
 *
 * POR QUÉ NO <datalist>. Lo natural habría sido un <datalist>, pero cada
 * navegador filtra a su manera y no hay garantía de que ignore las tildes:
 * quien escribe "queretaro" o "zipaquira" en el móvil, sin tilde, tiene que ver
 * "Querétaro" y "Zipaquirá". Y no lo hemos podido probar en un iPhone de verdad
 * (ni en la app de iOS, que va dentro de un WebView). Esta lista se ha probado
 * (7 nov 2026) en Chromium de escritorio y de móvil y en WebKit con un iPhone
 * 13 emulado: tocar, flechas, Intro y Escape. Se comporta igual en todas partes.
 *
 * Es ligera (sin librerías) y accesible: el campo es un combobox con su
 * listbox (WAI-ARIA), se mueve con las flechas, Intro elige y Escape cierra.
 * Cada opción mide 44 px de alto para el dedo.
 *
 * Se usa como gancho para no tocar el campo de cada pantalla:
 *   const s = useSugerencias({ id: "sugerencias-ciudad", valor, opciones, onElegir });
 *   <div className="relative"><input {...s.propsCampo} … />{s.lista}</div>
 */
import { useMemo, useState, useRef, type KeyboardEvent } from "react";
import { filtrarSugerencias, type Sugerencia } from "@/lib/sugerencias";

interface Opciones {
  /** id del listbox; también prefijo de las opciones. */
  id: string;
  valor: string;
  opciones: (string | Sugerencia)[];
  onElegir: (texto: string) => void;
}

export function useSugerencias({ id, valor, opciones, onElegir }: Opciones) {
  const [abierta, setAbierta] = useState(false);
  const [activa, setActiva] = useState(-1);
  const cerrarLuego = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lista = useMemo(() => filtrarSugerencias(opciones, valor), [opciones, valor]);
  // Si lo escrito ya es la única sugerencia, no hay nada que proponer.
  const visible = abierta && lista.length > 0 && !(lista.length === 1 && lista[0] === valor.trim());

  function elegir(texto: string) {
    onElegir(texto);
    setAbierta(false);
    setActiva(-1);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!visible) {
      if (e.key === "ArrowDown" && lista.length) { setAbierta(true); setActiva(0); e.preventDefault(); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiva((i) => (i + 1) % lista.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiva((i) => (i <= 0 ? lista.length - 1 : i - 1)); }
    else if (e.key === "Enter" && activa >= 0) { e.preventDefault(); elegir(lista[activa]); }
    else if (e.key === "Escape") { e.preventDefault(); setAbierta(false); setActiva(-1); }
  }

  const propsCampo = {
    role: "combobox" as const,
    "aria-autocomplete": "list" as const,
    "aria-expanded": visible,
    "aria-controls": id,
    "aria-activedescendant": visible && activa >= 0 ? `${id}-${activa}` : undefined,
    autoComplete: "off",
    onKeyDown,
    onInput: () => { setAbierta(true); setActiva(-1); },
    onFocus: () => { if (cerrarLuego.current) clearTimeout(cerrarLuego.current); },
    // Se cierra un poco después: al tocar una opción, el campo pierde el foco
    // antes de que llegue el toque.
    onBlur: () => { cerrarLuego.current = setTimeout(() => setAbierta(false), 150); },
  };

  const elementoLista = visible ? (
    <ul id={id} role="listbox" aria-label="Sugerencias"
      className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg overflow-y-auto py-1"
      style={{ background: "#1e212b", border: "1px solid #2d3142", maxHeight: 264, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
      {lista.map((texto, i) => (
        <li key={texto} id={`${id}-${i}`} role="option" aria-selected={i === activa}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => elegir(texto)}
          onMouseEnter={() => setActiva(i)}
          className="px-4 text-sm cursor-pointer flex items-center"
          style={{ minHeight: 44, color: "#f1f5f9", background: i === activa ? "rgba(34,197,94,0.12)" : "transparent" }}>
          {texto}
        </li>
      ))}
    </ul>
  ) : null;

  return { propsCampo, lista: elementoLista };
}
