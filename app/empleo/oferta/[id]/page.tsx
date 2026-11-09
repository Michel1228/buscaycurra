import { getPool } from "@/lib/db";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, DollarSign, Calendar, ClipboardList } from "lucide-react";
import { empresaParaGoogle, jobPostingDe } from "@/lib/seo/job-posting";
import { servicioOficial } from "@/lib/job-search/fuente-oficial";
import { ofertasParecidas, slug } from "@/lib/job-search/ofertas-parecidas";
import { DATOS } from "@/lib/datos-reales";
import { sueldoVisible } from "@/lib/sueldo-visible";
import FondoOleaje from "@/components/FondoOleaje";

/** "Ver en oferta", "Consultar"…: no es un sueldo, y no se enseña como si lo fuera. */
function sueldoDe(s: string | null): string | null {
  const t = (s || "").trim();
  return t && !/^(ver en oferta|consultar|a convenir|no especificado|n\/?d|-)$/i.test(t) ? t : null;
}

/**
 * "ADZUNA_ES" → "Adzuna": el código interno no se enseña. Y "EURES_GIJ" →
 * "Careerjet": las "EURES_xxx" son de Careerjet, guardadas así por un error
 * histórico (fetchCareerjetGlobal); EURES de verdad es "EURES" a secas.
 */
function nombreFuente(s: string | null): string | null {
  if (/^EURES_/i.test((s || "").trim())) return "Careerjet";
  const base = (s || "").split("_")[0].trim();
  if (!base) return null;
  return base.length <= 5 && base === base.toUpperCase() ? base : base[0].toUpperCase() + base.slice(1).toLowerCase();
}

const APP_STORE = "https://apps.apple.com/app/buscaycurra-empleo-con-ia/id6775232067";
const GOOGLE_PLAY = "https://play.google.com/store/apps/details?id=es.buscaycurra.app";

/** "Camarero en Bar Pepe - Bilbao", o sin la parte que falte (empresa, ciudad). */
function tituloDe(row: { title: string; company: string | null; city: string | null }): string {
  const empresa = empresaParaGoogle(row.company);
  return `${row.title}${empresa ? ` en ${empresa}` : ""}${row.city ? ` - ${row.city}` : ""}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pool = getPool();
  const result = await pool.query(
    `SELECT "title", "company", "city", "sourceName", "expiresAt" FROM "JobListing" WHERE "id" = $1`,
    [id]
  );
  const row = result.rows[0];

  if (!row) return { title: "Oferta no encontrada | BuscayCurra" };

  // LAS OFERTAS CADUCADAS NO DEBEN ESTAR EN GOOGLE.
  //
  // Aquí no se miraba `expiresAt` en absoluto: una oferta de hace medio año
  // seguía devolviendo 200 y sin noindex, o sea que Google la indexaba y
  // mandaba gente a un puesto que ya no existe. Con 1,8 millones de ofertas
  // caducadas en la base, eso no es un despiste: es la mayor parte de lo que
  // el robots.txt le ofrece rastrear.
  //
  // follow sí, index no: los enlaces de la página siguen valiendo para que
  // Google llegue al buscador y a las páginas de país, que son las que de
  // verdad interesa posicionar.
  const caducada = row.expiresAt != null && new Date(row.expiresAt) < new Date();

  // Las de Lanbide o SEF Murcia no dicen la empresa: "X en  - Bilbao" era lo
  // que salía en Google. Se nombra solo lo que se sabe.
  const titulo = tituloDe(row);
  const oficial = servicioOficial(row.sourceName);

  return {
    title: caducada
      ? `${titulo} (oferta cerrada) | BuscayCurra`
      : `${titulo} | BuscayCurra`,
    description: caducada
      ? `Esta oferta de ${titulo} ya no está disponible. Busca ofertas parecidas en BuscayCurra.`
      : oficial
        ? `Trabajo de ${titulo}, publicada por ${oficial.nombre}. Se solicita en su web oficial.`
        : `Trabajo de ${titulo}. Envía tu CV automáticamente con IA.`,
    ...(caducada && { robots: { index: false, follow: true } }),
  };
}

export default async function OfertaPublicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pool = getPool();

  const result = await pool.query(
    `SELECT "id", "title", "company", "city", "sourceUrl", "sourceName",
            "description", "salary", "sector", "createdAt", "expiresAt",
            "country", "province"
     FROM "JobListing" WHERE "id" = $1`,
    [id]
  );

  const row = result.rows[0];

  // UN 404 DE VERDAD, no una página que dice "no encontrada" devolviendo 200.
  // Eso es un soft 404, y Google lo trata como señal de sitio descuidado:
  // rastrea, ve contenido de error con código de éxito, y baja la confianza en
  // el resto. notFound() sirve el 404 real y la página de error del sitio.
  if (!row) notFound();

  const caducada = row.expiresAt != null && new Date(row.expiresAt) < new Date();

  // Sin empresa real no se marca como JobPosting: ver lib/seo/job-posting.ts.
  const jobPostingSchema = jobPostingDe(row);
  const empresa = empresaParaGoogle(row.company);
  // Lanbide y SEF Murcia: se solicitan en su web, no mandando el CV por correo.
  const oficial = servicioOficial(row.sourceName);
  const sueldo = sueldoDe(row.salary);
  // Más de lo mismo en su ciudad (18 oct 2026): casi todas las visitas de
  // Google entran por una ficha como esta, y no se les enseñaba ninguna más.
  const parecidas = await ofertasParecidas(row.title || "", row.city, { excluirId: row.id, limite: 5 }).catch(() => null);
  const ciudadCorta = (row.city || "").split(",")[0].trim();
  const listaParecidas = parecidas ? (parecidas.ofertas.length ? parecidas.ofertas : parecidas.deLaCiudad) : [];
  const sonDelPuesto = !!parecidas?.ofertas.length;

  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      {/* El fondo de oleaje de toda la aplicación (diseño de neón, 8 nov 2026) */}
      <FondoOleaje />
      {jobPostingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
        />
      )}
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="text-xs mb-6 inline-block hover:underline" style={{ color: "#8b98ad" }}>
          ← BuscayCurra
        </Link>

        {/* Si la oferta ya venció, se dice ANTES de que la lea entera. Llegar
            desde Google a un puesto cerrado y enterarte al final es la peor
            manera de conocer la aplicación. Se ofrece la salida útil: ofertas
            iguales que sí están abiertas. */}
        {caducada && (
          <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "#f59e0b" }}>
              Esta oferta ya está cerrada
            </p>
            <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>
              La empresa la retiró. Te dejamos abajo la búsqueda del mismo puesto con las que siguen abiertas.
            </p>
            <Link
              href={`/app/buscar?keyword=${encodeURIComponent(row.title || "")}&location=${encodeURIComponent(row.city || "")}`}
              className="text-xs px-4 py-2 rounded-lg font-medium inline-block"
              style={{ background: "linear-gradient(180deg, #d9f99d, #a3e635 55%, #84cc16)", color: "#0b1406" }}>
              Ver ofertas abiertas de {row.title}
            </Link>
          </div>
        )}

        <div className="rounded-xl p-6" style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" }}>
          <h1 className="text-xl font-bold mb-2" style={{ color: "#f1f5f9" }}>
            {row.title}
          </h1>
          <p className="text-base font-medium mb-4" style={{ color: "#22c55e" }}>
            {empresa ?? (oficial ? `Publicada por ${oficial.nombre}` : "Empresa sin especificar")}
          </p>

          <div className="flex flex-wrap gap-4 mb-5 text-sm" style={{ color: "#94a3b8" }}>
            <span>{row.city}</span>
            {sueldo && <span>{sueldoVisible(sueldo, row.country)}</span>}
            {row.createdAt && (
              <span>📅 {new Date(row.createdAt).toLocaleDateString("es-ES")}</span>
            )}
          </div>

          {row.description && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(148,163,184,0.14)" }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "#f1f5f9" }}>Descripción</h2>
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8" }}>
                {row.description}
              </div>
            </div>
          )}

          {/* QUÉ HACER CON ESTA OFERTA (18 oct 2026). Era "Enviar CV con IA" al
              registro, que luego no recordaba la oferta, y "Buscar similares",
              que pedía entrar. De Google llegan unas 80 personas al día y se
              registraban 2 o 3. Ahora el botón dice a quién se manda el CV y
              el registro te devuelve a esta oferta con el envío preparado. */}
          <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(148,163,184,0.14)" }}>
            {oficial && row.sourceUrl ? (
              <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="btn-game text-sm px-5 py-3 rounded-lg font-semibold inline-block">
                Inscribirme en {oficial.corto}
              </a>
            ) : !caducada ? (
              <>
                <Link href={`/auth/registro?oferta=${encodeURIComponent(row.id)}`}
                  className="btn-game text-base px-6 py-3 rounded-xl font-bold block text-center sm:inline-block">
                  Envía tu CV a {empresa ?? "esta empresa"}
                </Link>
                <p className="text-xs mt-3" style={{ color: "#94a3b8" }}>
                  Gratis. Guzzi, nuestro asistente con IA, te prepara la carta para esta oferta y te ayuda a mandarla.
                </p>
              </>
            ) : null}
            {row.sourceUrl && !oficial && (
              <a href={row.sourceUrl} target="_blank" rel="nofollow noopener noreferrer"
                className="text-xs mt-4 inline-block hover:underline" style={{ color: "#8b98ad" }}>
                Ver la oferta original{nombreFuente(row.sourceName) ? ` en ${nombreFuente(row.sourceName)}` : ""} ↗
              </a>
            )}
          </div>
        </div>

        {/* Más ofertas de lo mismo en su ciudad, con enlace a su página. */}
        {listaParecidas.length > 0 && (
          <section className="mt-6">
            <h2 className="text-base font-bold mb-3" style={{ color: "#f1f5f9" }}>
              {sonDelPuesto ? `Más ofertas de ${parecidas!.puesto} en ${ciudadCorta}` : `Últimas ofertas en ${ciudadCorta}`}
            </h2>
            <div className="space-y-2">
              {listaParecidas.map((o) => (
                <Link key={o.id} href={`/empleo/oferta/${o.id}`}
                  className="block rounded-xl px-4 py-3 transition hover:opacity-90"
                  style={{ background: "rgba(12,15,22,0.86)", border: "1px solid rgba(148,163,184,0.18)" }}>
                  <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{o.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                    {[o.company, (o.city || "").split(",")[0], sueldoDe(o.salary) && sueldoVisible(sueldoDe(o.salary)!, null)].filter(Boolean).join(" · ")}
                  </p>
                </Link>
              ))}
            </div>
            {sonDelPuesto && parecidas!.puesto && parecidas!.deEsePuesto > listaParecidas.length && (
              <Link href={`/empleo/${slug(parecidas!.puesto)}/${slug(ciudadCorta)}`}
                className="text-sm font-semibold mt-3 inline-block hover:underline" style={{ color: "#22c55e" }}>
                Ver las {parecidas!.deEsePuesto} ofertas de {parecidas!.puesto} en {ciudadCorta} →
              </Link>
            )}
          </section>
        )}

        {/* Quiénes somos, en una línea, y la app. */}
        <div className="mt-8 rounded-xl p-5" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>BuscayCurra es gratis</p>
          <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
            {DATOS.ofertasActivasTexto} de ofertas y {DATOS.conEmailTexto} traen el correo de la empresa: tu CV llega a una persona.
            Guzzi te ayuda a hacer el CV y a mandarlo.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <a href={APP_STORE} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-2 rounded-lg font-semibold"
              style={{ background: "#0f1117", color: "#f1f5f9", border: "1px solid rgba(148,163,184,0.18)" }}>
              App para iPhone
            </a>
            <a href={GOOGLE_PLAY} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-2 rounded-lg font-semibold"
              style={{ background: "#0f1117", color: "#f1f5f9", border: "1px solid rgba(148,163,184,0.18)" }}>
              App para Android
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
