"use client";

/**
 * La vista previa del CV que cambia mientras se escribe, SIN RECARGARSE.
 *
 * Antes era un <iframe srcDoc={html}>: cada letra cambiaba srcDoc y el navegador
 * tiraba el documento y lo volvía a cargar. Eso, una vez por tecla (medido el
 * 20 nov 2026), era el "parpadeo raro" que vio Michel: el recuadro se quedaba un
 * instante en blanco y volvía arriba del todo, así que si estabas mirando tu
 * experiencia más abajo, saltaba solo al principio.
 *
 * Ahora el primer HTML entra por srcDoc y los siguientes se escriben dentro del
 * mismo documento, guardando y devolviendo la posición de desplazamiento.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";

export default function VistaPreviaEnVivo({ html, title, className, style }: {
  html: string; title: string; className?: string; style?: CSSProperties;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [primero] = useState(html);
  const cargado = useRef(false);
  const ultimo = useRef(html);

  const pintar = (h: string) => {
    const ventana = ref.current?.contentWindow, doc = ref.current?.contentDocument;
    if (!ventana || !doc) return;
    const x = ventana.scrollX, y = ventana.scrollY;
    doc.open();
    doc.write(h);
    doc.close();
    ventana.scrollTo(x, y);
  };

  useEffect(() => {
    if (html === ultimo.current) return;
    ultimo.current = html;
    if (cargado.current) pintar(html);    // si aún no ha cargado, lo pinta onLoad
  }, [html]);

  return (
    <iframe
      ref={ref}
      srcDoc={primero}
      title={title}
      className={className}
      style={style}
      onLoad={() => {
        // Solo la primera carga: escribir en el documento vuelve a lanzar "load".
        if (cargado.current) return;
        cargado.current = true;
        if (ultimo.current !== primero) pintar(ultimo.current);
      }}
    />
  );
}
