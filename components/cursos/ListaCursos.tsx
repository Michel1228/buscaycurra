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
import { BadgeCheck, FolderOpen, GraduationCap } from "lucide-react";
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

      {/* Solo dentro de la app: en la pública no hay sesión que consultar, y
          ofrecer "mis cursos" a quien no ha entrado es una puerta a un login
          que no ha pedido. */}
      {base.startsWith("/app") && (
        <Link
          href={`${base}/mis-cursos`}
          className="rounded-xl p-3.5 mb-4 flex items-center gap-3 hover:opacity-90"
          style={{ background: "#1e212b", border: "1px solid #2d3142", textDecoration: "none" }}
        >
          <FolderOpen size={17} strokeWidth={1.8} className="shrink-0" style={{ color: "#94a3b8" }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Mis cursos</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              Tus cartas guardadas, los papeles que te faltan y por dónde vas.
            </p>
          </div>
        </Link>
      )}

      {/* ── Antes del catálogo, no después ──
          Para mucha de nuestra gente la respuesta correcta no es "haz un curso"
          sino "acredita lo que ya sabes". Ponerlo debajo de trece fichas de
          cursos sería enterrarlo: quien lleva diez años cuidando o limpiando ya
          se habría ido a mirar precios. */}
      <Link
        href={`${base}/acreditar`}
        className="rounded-xl p-4 mb-8 flex items-start gap-3 hover:opacity-90"
        style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)", textDecoration: "none" }}
      >
        <BadgeCheck size={19} strokeWidth={1.8} className="shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
        <div>
          <p className="text-sm font-semibold mb-0.5" style={{ color: "#22c55e" }}>
            ¿Llevas años trabajando y no tienes el título?
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
            Se puede acreditar oficialmente lo que ya sabes hacer, gratis y sin volver a clase.
            Mira si cumples los requisitos antes de pagar ningún curso.
          </p>
        </div>
      </Link>

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
