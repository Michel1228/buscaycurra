"use client";

/**
 * components/neon/LogoEmpresa.tsx — El logo de la empresa, o sus iniciales.
 *
 * El dominio sale de lib/logo-empresa.ts, que NO adivina: o es una marca
 * comprobada o es el dominio de su propio correo. Si no hay dominio, círculo
 * con las iniciales del color de la tarjeta.
 *
 * El icono lo carga EL NAVEGADOR desde el servicio de iconos de Google
 * (gratis y sin clave, el mismo que usan los buscadores), no nuestro servidor:
 *  - perezoso (loading="lazy") y con tamaño fijo, para que la tarjeta no salte;
 *  - sin decir desde qué página se pide (referrerPolicy="no-referrer");
 *  - si falla, o el icono es una miniatura de menos de 32 px (Google devuelve
 *    un globo de 16 px cuando no tiene nada), se quedan las iniciales.
 * Es <img> y no next/image a propósito: next/image lo pediría a través de
 * nuestro servidor para redimensionarlo.
 */
import { useEffect, useRef, useState } from "react";
import { dominioDeLogo, inicialesDe } from "@/lib/logo-empresa";
import type { Tono } from "@/components/neon/Neon";

export default function LogoEmpresa({ empresa, correo, tono = "neutro", size = 40 }: {
  empresa: string | null | undefined;
  /** Solo el correo que es de verdad de la empresa (ver lib/logo-empresa.ts). */
  correo?: string | null;
  tono?: Tono;
  size?: number;
}) {
  const dominio = dominioDeLogo(empresa, correo);
  const [estado, setEstado] = useState<"cargando" | "ok" | "fallo">("cargando");
  const ref = useRef<HTMLImageElement>(null);

  const alCargar = (img: HTMLImageElement) => setEstado(img.naturalWidth >= 32 ? "ok" : "fallo");

  // Si la imagen ya estaba en caché y cargó antes de que React escuchara,
  // onLoad no llega: se mira al montar.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) alCargar(img);
  }, [dominio]);

  return (
    <span
      className={`tono-${tono} relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.34),
        background: "radial-gradient(circle at 30% 25%, rgba(var(--tono),0.32), rgba(var(--tono),0.1) 75%)",
        border: "1px solid rgba(var(--tono),0.42)",
        color: "var(--tono-texto)",
      }}
      aria-hidden="true"
    >
      {estado !== "ok" && inicialesDe(empresa)}
      {dominio && estado !== "fallo" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(dominio)}&sz=128`}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={(e) => alCargar(e.currentTarget)}
          onError={() => setEstado("fallo")}
          className="absolute inset-0 h-full w-full rounded-full object-contain"
          style={{
            background: "#ffffff",
            padding: Math.round(size * 0.16),
            opacity: estado === "ok" ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
        />
      )}
    </span>
  );
}
