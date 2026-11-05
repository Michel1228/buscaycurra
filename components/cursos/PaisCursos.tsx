"use client";

/**
 * components/cursos/PaisCursos.tsx — "Cursos para quien está en…".
 *
 * El catálogo se pintaba siempre para España: alguien de Monterrey veía el
 * SEPE, FUNDAE y el carné de manipulador de alimentos, nada de lo que le sirve
 * allí. Ahora el catálogo es del país donde está cada uno (?pais=MX), y esto:
 *   · la primera vez, si no hay ?pais y sabemos que está en otro país
 *     (lib/origen/donde-estoy.ts), le lleva a los de su país sin preguntar;
 *   · y deja cambiarlo con un desplegable, sin formulario.
 */

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { dondeEstoy } from "@/lib/origen/donde-estoy";
import { NACIONALIDADES, nacionalidadDe } from "@/lib/origen/nacionalidades";

export default function PaisCursos({ actual }: { actual: string }) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    if (params.get("pais")) return;
    const aqui = dondeEstoy();
    if (aqui && aqui !== actual && nacionalidadDe(aqui)) router.replace(`${ruta}?pais=${aqui}`, { scroll: false });
  }, [params, actual, ruta, router]);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 text-xs" style={{ color: "#94a3b8" }}>
      <MapPin size={14} strokeWidth={1.9} style={{ color: "#22c55e" }} />
      <label htmlFor="cursos-pais">Cursos para quien está en</label>
      <select id="cursos-pais" value={actual}
        onChange={(e) => router.push(`${ruta}?pais=${e.target.value}`, { scroll: false })}
        className="text-xs px-2 py-1 rounded" style={{ background: "#161922", border: "1px solid #2d3142", color: "#f1f5f9" }}>
        {NACIONALIDADES.map(n => <option key={n.codigo} value={n.codigo}>{n.bandera} {n.nombre}</option>)}
      </select>
    </div>
  );
}
