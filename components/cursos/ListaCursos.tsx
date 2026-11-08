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
import { Suspense } from "react";
import Link from "next/link";
import { BadgeCheck, CalendarDays, FolderOpen, GraduationCap, RefreshCw } from "lucide-react";
import {
  tiposPorPais, ordenarPorUrgencia, sectoresConCursos, tiposPorSector,
} from "@/lib/cursos/tipos";
import { plataformasPorPais, servicioEmpleoDe, EUROPASS } from "@/lib/cursos/plataformas";
import { LISTA_PAISES } from "@/lib/paises";
import { cursoIdiomaDe } from "@/lib/cursos/idioma-inmigrantes";
import CatalogoCursos from "./CatalogoCursos";
import FormacionPorPais, { type PaisFormacion } from "./FormacionPorPais";
import PaisCursos from "./PaisCursos";

export default function ListaCursos({ base, pais = "ES" }: { base: string; pais?: string }) {
  const todos = tiposPorPais(pais);
  const obligatorios = ordenarPorUrgencia(todos.filter(t => t.familia === "obligatorio"));

  const porSector = sectoresConCursos(pais)
    .map(sector => ({
      sector,
      cursos: ordenarPorUrgencia(tiposPorSector(sector, pais).filter(t => t.familia === "mejora")),
    }))
    .filter(s => s.cursos.length > 0);

  // Para quien se va fuera: el servicio oficial de cada país y lo que piden
  // allí en lugar de nuestros cursos (equivalenteEn de cada ficha).
  const paisesFuera: PaisFormacion[] = LISTA_PAISES
    .filter(p => p.codigo !== pais)
    .map(p => {
      const s = servicioEmpleoDe(p.codigo);
      return {
        codigo: p.codigo,
        nombre: p.nombre,
        bandera: p.bandera,
        servicio: s ? { nombre: s.nombre, url: s.url, queHacer: s.queHacer } : undefined,
        idioma: cursoIdiomaDe(p.codigo),
        equivalencias: todos.flatMap(t => (t.equivalenteEn ?? [])
          .filter(eq => eq.pais === p.codigo)
          .map(eq => ({ cursoSlug: t.slug, curso: t.nombre, nombre: eq.nombre, nota: eq.nota }))),
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap size={22} strokeWidth={1.8} style={{ color: "#22c55e" }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#22c55e" }}>Formación</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
          El curso que te piden para el trabajo que quieres
        </h1>
        <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#94a3b8" }}>
          Cuánto cuesta de verdad, cuánto dura y dónde sacarlo gratis.
          Sin rodeos y con la fuente oficial de cada dato.
        </p>
      </div>

      {/* El catálogo es del país donde está cada uno (?pais=MX). */}
      <Suspense fallback={null}>
        <PaisCursos actual={pais} />
      </Suspense>

      {/* Solo dentro de la app: en la pública no hay sesión que consultar, y
          ofrecer "mis cursos" a quien no ha entrado es una puerta a un login
          que no ha pedido. */}
      {base.startsWith("/app") && (
        <Link
          href={`${base}/mis-cursos`}
          className="rounded-xl p-3.5 mb-4 flex items-center gap-3 hover:opacity-90"
          style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)", textDecoration: "none" }}
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
      {/* La acreditación es un procedimiento de España: fuera no se ofrece. */}
      {pais === "ES" && <Link
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
      </Link>}

      {/* ── Plazas con fecha: lo que de verdad se puede hacer ya ──
          Las fichas dicen qué curso te piden; esto dice dónde hay uno gratis
          que empieza el mes que viene. Solo España: las fuentes son de aquí. */}
      {pais === "ES" && (
        <Link
          href={`${base}/plazas`}
          className="rounded-xl p-4 mb-8 flex items-start gap-3 hover:opacity-90"
          style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)", textDecoration: "none" }}
        >
          <CalendarDays size={19} strokeWidth={1.8} className="shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
          <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: "#f1f5f9" }}>
              Plazas gratis que empiezan pronto
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
              Miles de cursos con fecha, horario y centro, publicados por los servicios públicos de
              empleo de Euskadi, Cataluña, Castilla y León, Murcia y Navarra. Busca el tuyo y apúntate.
            </p>
          </div>
        </Link>
      )}

      {/* Para quien ya lo tiene: una línea, no otra tarjeta grande. */}
      {pais === "ES" && (
        <Link
          href={`${base}/renovar`}
          className="rounded-xl px-4 py-3 mb-8 -mt-5 flex items-center gap-3 hover:opacity-90"
          style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)", textDecoration: "none" }}
        >
          <RefreshCw size={16} strokeWidth={1.9} className="shrink-0" style={{ color: "#22c55e" }} />
          <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
            ¿Se te caduca el carné? Cada cuánto y cómo renovarlo
          </span>
        </Link>
      )}

      <CatalogoCursos
        obligatorios={obligatorios}
        porSector={porSector}
        plataformas={plataformasPorPais(pais)}
        servicio={servicioEmpleoDe(pais)}
        base={base}
      />

      <FormacionPorPais paises={paisesFuera} base={base} />

      <div className="rounded-xl p-4 text-xs leading-relaxed"
           style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)", color: "#94a3b8" }}>
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
