/**
 * Página SEO dinámica: /empleo/[puesto]/[ciudad]
 * Genera miles de páginas indexables para Google.
 * Ejemplo: /empleo/camarero/madrid
 */

import { Metadata } from "next";
import { ofertasParecidas, slug, type OfertaCorta } from "@/lib/job-search/ofertas-parecidas";
import { paisesDeCiudad } from "@/lib/guzzi/ciudades-pais";
import { paisPorVocabulario, puestosParecidos } from "@/lib/sugerencias";
import { sueldoVisible } from "@/lib/sueldo-visible";
import { PAISES } from "@/lib/paises";
import Link from "next/link";
import { DollarSign, Search } from "lucide-react";

const sueldoValido = (s: string | null) => (s && !/^(ver en oferta|consultar|a convenir)$/i.test(s.trim()) ? s : null);

// POR QUE ESTA PAGINA ESTABA VACIA (18 oct 2026).
//
// Las 80 combinaciones más visitadas se generaban AL COMPILAR, y en la
// compilación no hay base de datos (getaddrinfo ENOTFOUND buscaycurra-db): se
// guardaban con "0 ofertas" y se servían así un día. Las demás buscaban
// "%puesto%" también en la descripción de 3 millones de ofertas, tardaban y
// fallaban igual. Se comprobó en producción: "Trabajo de camarero en Madrid,
// 0 ofertas", con 232 abiertas. Ahora la ciudad va primero y sin tildes, el
// puesto solo en el título, y se guarda en Redis una hora.
// NO SE GENERAN AL COMPILAR (18 oct 2026). En la compilación no hay base de
// datos: las 80 que se pre-generaban salían con "0 ofertas" y se servían así un
// día entero. Ahora cada una se genera la primera vez que alguien la abre y se
// guarda 6 horas.
export const revalidate = 21600;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ puesto: string; ciudad: string }>;
}): Promise<Metadata> {
  const { puesto, ciudad } = await params;
  const puestoFmt = decodeURIComponent(puesto).replace(/-/g, " ");
  const ciudadFmt = decodeURIComponent(ciudad).replace(/-/g, " ");

  const titulo = `Empleo de ${puestoFmt} en ${ciudadFmt} | BuscayCurra`;
  const descripcion = `Ofertas de trabajo de ${puestoFmt} en ${ciudadFmt}, actualizadas cada día. Envía tu CV a las empresas con ayuda de IA, gratis.`;

  return {
    title: titulo,
    description: descripcion,
    keywords: [`${puestoFmt} ${ciudadFmt}`, "empleo", "trabajo", ciudadFmt, puestoFmt],
    openGraph: {
      title: titulo,
      description: descripcion,
      locale: "es_ES",
      type: "website",
    },
    alternates: {
      canonical: `https://buscaycurra.es/empleo/${puesto}/${ciudad}`,
    },
  };
}

// ─── Página principal ───────────────────────────────────────────────────────
export default async function EmpleoPage({
  params,
}: {
  params: Promise<{ puesto: string; ciudad: string }>;
}) {
  const { puesto, ciudad } = await params;
  const puestoFmt = decodeURIComponent(puesto).replace(/-/g, " ");
  const ciudadFmt = decodeURIComponent(ciudad).replace(/-/g, " ");

  // LA CIUDAD PRIMERO Y SIN TILDES (18 oct 2026): ver lib/job-search/ofertas-parecidas.ts.
  // Antes se buscaba "%camarero%" también en la descripción de 3 millones de
  // ofertas; tardaba tanto que fallaba y la página decía "0 ofertas" hasta en
  // Madrid. Si algo falla, no se enseña ninguna cifra.
  let ofertas: OfertaCorta[] = [];
  let total: number | null = null;
  let soloDeLaCiudad = false;
  try {
    const r = await ofertasParecidas(puestoFmt, ciudadFmt, { limite: 50 });
    if (r) {
      if (r.ofertas.length) { ofertas = r.ofertas; total = r.deEsePuesto; }
      else { ofertas = r.deLaCiudad; total = r.enLaCiudad; soloDeLaCiudad = r.deLaCiudad.length > 0; }
    }
  } catch (e) {
    console.error("[EmpleoPage] Error:", (e as Error).message);
  }

  // DE QUÉ PAÍS ES LA PÁGINA (7 nov 2026). Proponía "vendedor en madrid" y
  // "camarero" también en Medellín o Guadalajara (Jalisco). El país sale de la
  // tabla de ciudades, sin consultar la base. Si la ciudad existe en varios
  // países, decide el oficio ("mesero" no se dice en España) y, si no lo
  // aclara, se queda como estaba (España). La moneda del sueldo solo se pone
  // cuando la ciudad es de un país sin duda: si no, la cifra va sin moneda.
  const candidatos = paisesDeCiudad(ciudadFmt);
  const paisSeguro = candidatos.length === 1 ? candidatos[0] : null;
  const paisPagina = paisSeguro
    ?? (candidatos.length > 1 ? paisPorVocabulario(candidatos, puestoFmt) ?? (candidatos.includes("ES") ? "ES" : candidatos[0]) : "ES");

  // Puestos relacionados y ciudades cercanas: en España, los de siempre.
  const puestosRelacionados: { slug: string; nombre: string }[] = paisPagina === "ES"
    ? [
        "camarero", "cocinero", "limpieza", "conductor", "electricista",
        "dependiente", "programador", "enfermero", "administrativo",
      ].filter(p => p !== puesto).slice(0, 6).map(p => ({ slug: p, nombre: p }))
    : puestosParecidos(paisPagina).map(p => ({ slug: slug(p), nombre: p })).filter(p => p.slug !== puesto).slice(0, 6);

  const ciudadesCercanas: { slug: string; nombre: string }[] = paisPagina === "ES"
    ? [
        "madrid", "barcelona", "valencia", "sevilla", "zaragoza",
        "bilbao", "malaga", "murcia", "valladolid", "alicante",
      ].filter(c => c !== ciudad).slice(0, 6).map(c => ({ slug: c, nombre: c.replace(/-/g, " ") }))
    : (PAISES[paisPagina]?.ciudades ?? []).map(c => ({ slug: slug(c), nombre: c })).filter(c => c.slug !== ciudad).slice(0, 6);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #0f1a0a, #1a1a12)" }}>
      {/* Header SEO */}
      <div className="py-12 px-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}>
        <div className="max-w-4xl mx-auto">
          <nav className="text-xs mb-4" style={{ color: "#64748b" }}>
            <Link href="/">Inicio</Link> → <Link href="/empleo">Empleo</Link> → {puestoFmt} → {ciudadFmt}
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#22c55e" }}>
            Trabajo de {puestoFmt} en {ciudadFmt}
          </h1>
          <p className="text-base" style={{ color: "#94a3b8" }}>
            {total !== null && total > 0
              ? soloDeLaCiudad
                ? `Ahora no hay ofertas de ${puestoFmt}, pero hay ${total.toLocaleString("es-ES")} en ${ciudadFmt}.`
                : `${total.toLocaleString("es-ES")} ofertas abiertas ahora mismo.`
              : "Ofertas actualizadas cada día."}{" "}
            Envía tu CV gratis con BuscayCurra.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* CTA principal */}
        <div className="card-game p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-lg" style={{ color: "#f1f5f9" }}>
              Manda tu CV a estas empresas
            </p>
            <p className="text-sm" style={{ color: "#64748b" }}>
              Crea tu cuenta gratis: Guzzi te ayuda con el CV y la carta para cada oferta de {ciudadFmt}.
            </p>
          </div>
          <Link href={`/auth/registro?desde=${encodeURIComponent(`empleo/${puesto}/${ciudad}`)}`}
            className="btn-game whitespace-nowrap">
            Crear cuenta gratis →
          </Link>
        </div>

        {/* Ofertas */}
        {ofertas.length > 0 ? (
          <div className="space-y-4 mb-10">
            <h2 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>
              {soloDeLaCiudad ? `Últimas ofertas en ${ciudadFmt}` : `Ofertas de ${puestoFmt} en ${ciudadFmt}`}
            </h2>
            {ofertas.map((o) => (
              <div key={o.id} className="card-game p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm" style={{ color: "#f1f5f9" }}>{o.title}</h3>
                    <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{[o.company, (o.city || "").split(",")[0]].filter(Boolean).join(" · ")}</p>
                    {sueldoValido(o.salary) && (
                      <p className="text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: "#22c55e" }}><DollarSign size={11} />{sueldoVisible(sueldoValido(o.salary)!, paisSeguro)}</p>
                    )}
                  </div>
                  <Link href={`/empleo/oferta/${o.id}`}
                    className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition hover:opacity-80"
                    style={{ background: "linear-gradient(135deg, #22c55e, #5cb848)", color: "#1a1a12" }}>
                    Ver oferta
                  </Link>
                </div>
              </div>
            ))}
            <div className="text-center py-4">
              <Link href={`/auth/registro?desde=${encodeURIComponent(`empleo/${puesto}/${ciudad}`)}`}
                className="btn-game-outline">
                Crear cuenta y ver todas →
              </Link>
            </div>
          </div>
        ) : (
          <div className="card-game p-10 text-center mb-10">
            <Search size={40} className="mx-auto mb-3" style={{ color: "#64748b" }} />
            <p className="font-semibold" style={{ color: "#f1f5f9" }}>No hay ofertas en este momento</p>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Crea tu cuenta gratis y te avisamos cuando salga una de {puestoFmt} en {ciudadFmt}.
            </p>
            <Link href={`/auth/registro?desde=${encodeURIComponent(`empleo/${puesto}/${ciudad}`)}`}
              className="btn-game inline-block mt-4">
              Crear cuenta gratis
            </Link>
          </div>
        )}

        {/* Puestos relacionados */}
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "#64748b" }}>
            Empleos similares en {ciudadFmt}
          </h3>
          <div className="flex flex-wrap gap-2">
            {puestosRelacionados.map(p => (
              <Link key={p.slug} href={`/empleo/${p.slug}/${ciudad}`}
                className="px-3 py-1.5 rounded-lg text-xs transition hover:opacity-80"
                style={{ background: "rgba(126,213,111,0.08)", border: "1px solid rgba(126,213,111,0.15)", color: "#22c55e" }}>
                {p.nombre} en {ciudadFmt}
              </Link>
            ))}
          </div>
        </div>

        {/* Ciudades cercanas */}
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "#64748b" }}>
            {puestoFmt} en otras ciudades
          </h3>
          <div className="flex flex-wrap gap-2">
            {ciudadesCercanas.map(c => (
              <Link key={c.slug} href={`/empleo/${puesto}/${c.slug}`}
                className="px-3 py-1.5 rounded-lg text-xs transition hover:opacity-80"
                style={{ background: "rgba(240,192,64,0.08)", border: "1px solid rgba(240,192,64,0.15)", color: "#f0c040" }}>
                {puestoFmt} en {c.nombre}
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ Schema para SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": `¿Cuánto gana un ${puestoFmt} en ${ciudadFmt}?`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `El salario de un ${puestoFmt} en ${ciudadFmt} varía según experiencia y empresa. Consulta las ofertas activas en BuscayCurra para ver rangos actualizados.`
              }
            },
            {
              "@type": "Question",
              "name": `¿Dónde encontrar trabajo de ${puestoFmt} en ${ciudadFmt}?`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": total && !soloDeLaCiudad
                  ? `En BuscayCurra hay ahora mismo ${total} ofertas de ${puestoFmt} en ${ciudadFmt}. Guzzi, el asistente con IA, te ayuda a enviar tu CV a las empresas.`
                  : `En BuscayCurra se publican cada día ofertas de ${puestoFmt} en ${ciudadFmt}. Guzzi, el asistente con IA, te ayuda a enviar tu CV a las empresas.`
              }
            }
          ]
        })}} />
      </div>
    </div>
  );
}
