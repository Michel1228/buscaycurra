/**
 * components/PublicFooter.tsx — El pie de la web pública.
 *
 * POR QUÉ EXISTE: había páginas públicas buenas a las que no enlazaba nadie
 * (/descargar y /precios ya pasaron por eso y por ello están en la cabecera).
 * Una página sin enlaces internos no la encuentra ni Google ni el usuario, por
 * muy bien escrita que esté. Aquí está todo lo público en un solo sitio.
 *
 * Es un componente de servidor a propósito: son enlaces, no necesita JavaScript.
 */
import Link from "next/link";
import LogoGusano from "@/components/LogoGusano";
import { GUIAS } from "@/lib/guias/contenido";

const COLUMNAS: Array<{ titulo: string; enlaces: Array<{ texto: string; href: string }> }> = [
  {
    titulo: "Buscar trabajo",
    enlaces: [
      { texto: "Ofertas de empleo", href: "/empleo" },
      { texto: "Trabajar en otro país", href: "/trabajar-en" },
      { texto: "Cursos y carnés", href: "/cursos" },
      { texto: "Acreditar tu experiencia", href: "/cursos/acreditar" },
    ],
  },
  {
    titulo: "Antes de irte fuera",
    enlaces: [
      { texto: "Llevarte el paro", href: "/llevarte-el-paro" },
      { texto: "El CV según el país", href: "/cv-por-pais" },
      { texto: "Derechos de las au pair", href: "/derechos-au-pair" },
    ],
  },
  {
    titulo: "BuscayCurra",
    enlaces: [
      { texto: "Qué es y para quién", href: "/sobre-nosotros" },
      { texto: "Precios", href: "/precios" },
      { texto: "Descargar la app", href: "/descargar" },
      { texto: "Para empresas", href: "/empresas" },
      { texto: "Soporte y preguntas", href: "/soporte" },
    ],
  },
];

const LEGAL = [
  { texto: "Privacidad", href: "/privacidad" },
  { texto: "Términos", href: "/terminos" },
  { texto: "Aviso legal", href: "/aviso-legal" },
  { texto: "Cookies", href: "/cookies" },
];

export default function PublicFooter() {
  return (
    <footer style={{ borderTop: "1px solid #2d3142", background: "#0f1117" }}>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Guías primero: es lo que busca quien llega sin conocernos. */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>
              Guías de uso
            </h2>
            <ul className="mt-3 space-y-2">
              {GUIAS.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guias/${g.slug}`}
                    className="text-xs transition hover:opacity-80"
                    style={{ color: "#94a3b8" }}
                  >
                    {g.slug === "enviar-cv-a-empresas"
                      ? "Enviar el CV a una empresa"
                      : g.slug === "ett"
                        ? "Encontrar ETTs cerca"
                        : g.slug === "buscar-ofertas"
                          ? "Buscar ofertas"
                          : g.slug === "guzzi"
                            ? "Qué pedirle a Guzzi"
                            : g.slug === "cv"
                              ? "Preparar el CV"
                              : "Irte a trabajar fuera"}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {COLUMNAS.map((col) => (
            <div key={col.titulo}>
              <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>
                {col.titulo}
              </h2>
              <ul className="mt-3 space-y-2">
                {col.enlaces.map((e) => (
                  <li key={e.href}>
                    <Link
                      href={e.href}
                      className="text-xs transition hover:opacity-80"
                      style={{ color: "#94a3b8" }}
                    >
                      {e.texto}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-9 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ borderTop: "1px solid #2d3142" }}
        >
          <div className="flex items-center gap-2">
            <LogoGusano size={22} />
            <span className="text-xs" style={{ color: "#64748b" }}>
              BuscayCurra — búsqueda de empleo en 26 países
            </span>
          </div>
          <ul className="flex flex-wrap gap-4">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-xs transition hover:opacity-80" style={{ color: "#64748b" }}>
                  {l.texto}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
