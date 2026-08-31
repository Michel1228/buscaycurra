/**
 * components/cursos/ListaCursos.tsx — Prepara los datos del catálogo.
 *
 * Vive aparte porque se pinta en DOS sitios con marcos distintos:
 *   /cursos          → página pública, con PublicHeader. Es la que ve Google.
 *   /app/formacion   → dentro de la app, con el menú de siempre.
 *
 * Aquí solo se calcula y se ordena; el pintado y el buscador están en
 * CatalogoCursos, que es de cliente porque el filtro responde al teclear. Como
 * el catálogo es estático, esto no toca la base de datos ni una vez.
 */
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import {
  tiposPorPais, ordenarPorUrgencia, sectoresConCursos, tiposPorSector,
} from "@/lib/cursos/tipos";
import { plataformasPorPais, servicioEmpleoDe, EUROPASS } from "@/lib/cursos/plataformas";
import CatalogoCursos from "./CatalogoCursos";

export default function ListaCursos({ base, pais = "ES" }: { base: string; pais?: string }) {
  const todos = tiposPorPais(pais);
  const obligatorios = ordenarPorUrgencia(todos.filter(t => t.familia === "obligatorio"));

  const porSector = sectoresConCursos(pais)
    .map(sector => ({
      sector,
      cursos: ordenarPorUrgencia(tiposPorSector(sector, pais).filter(t => t.familia === "mejora")),
    }))
    .filter(s => s.cursos.length > 0);

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap size={22} strokeWidth={1.8} style={{ color: "#22c55e" }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#22c55e" }}>Formación</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
          El curso que te piden para el trabajo que quieres
        </h1>
        <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#94a3b8" }}>
          Cuánto cuesta de verdad, cuánto dura y dónde sacarlo gratis.
          Sin rodeos y con la fuente oficial de cada dato.
        </p>
      </div>

      <CatalogoCursos
        obligatorios={obligatorios}
        porSector={porSector}
        plataformas={plataformasPorPais(pais)}
        servicio={servicioEmpleoDe(pais)}
        base={base}
      />

      <div className="rounded-xl p-4 text-xs leading-relaxed"
           style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#94a3b8" }}>
        ¿Te vas a trabajar fuera y no sabes si tu título vale allí? Se comprueba en{" "}
        <a href={EUROPASS.url} target="_blank" rel="noopener noreferrer" style={{ color: "#22c55e" }}>
          {EUROPASS.nombre}
        </a>
        , el servicio oficial de la UE. Y si prefieres que te lo mire alguien,{" "}
        <Link href="/app/gusi" style={{ color: "#22c55e" }}>pregúntale a Guzzi</Link>.
      </div>
    </>
  );
}
