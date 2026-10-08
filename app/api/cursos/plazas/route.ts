/**
 * /api/cursos/plazas — Plazas reales de cursos gratuitos, públicas.
 *
 *   ?ficha=carretillero   las que corresponden a una ficha
 *   ?provincia=48         código INE de provincia
 *   ?modalidad=online     presencial | online | mixta
 *   ?q=soldadura          texto libre sobre el título
 *   ?desde=20&limite=20   paginación (máximo 50)
 *
 * Pública y sin sesión: son datos abiertos de la administración y las fichas de
 * /cursos las indexa Google. Se cachea una hora en el CDN porque los datos solo
 * cambian una vez al día y el servidor no está para repetir consultas.
 */
import { NextRequest, NextResponse } from "next/server";
import { buscarPlazas, provinciasConPlazas, resumenPlazas } from "@/lib/cursos/plazas/db";
import { FUENTES } from "@/lib/cursos/plazas/fuentes";
import { nombreProvincia } from "@/lib/cursos/plazas/provincias";

export const dynamic = "force-dynamic";

const MODALIDADES = new Set(["presencial", "online", "mixta"]);

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const ficha = sp.get("ficha")?.replace(/[^a-z0-9-]/g, "").slice(0, 60) || undefined;
  const provincia = /^\d{2}$/.test(sp.get("provincia") ?? "") ? sp.get("provincia")! : undefined;
  const modalidadPedida = sp.get("modalidad") ?? "";
  const modalidad = MODALIDADES.has(modalidadPedida)
    ? (modalidadPedida as "presencial" | "online" | "mixta")
    : undefined;
  const texto = sp.get("q")?.slice(0, 80) || undefined;
  const limite = parseInt(sp.get("limite") ?? "20", 10) || 20;
  const desde = parseInt(sp.get("desde") ?? "0", 10) || 0;

  try {
    const [{ total, plazas }, provincias, resumen] = await Promise.all([
      buscarPlazas({ ficha, provincia, modalidad, texto, limite, desde }),
      provinciasConPlazas({ ficha, modalidad, texto }),
      resumenPlazas(),
    ]);

    return NextResponse.json(
      {
        total,
        plazas: plazas.map(p => ({
          ...p,
          provinciaNombre: nombreProvincia(p.provincia),
          fuenteNombre: FUENTES[p.fuente]?.nombre ?? p.fuente,
          comunidad: FUENTES[p.fuente]?.comunidad ?? null,
          atribucion: FUENTES[p.fuente]?.atribucion ?? null,
        })),
        provincias: provincias.map(p => ({ ...p, nombre: nombreProvincia(p.provincia) ?? p.provincia })),
        // Qué comunidades cubrimos, para decirlo con todas las letras: quien es
        // de Sevilla tiene que saber que no es que no haya cursos, es que su
        // comunidad no los publica como datos.
        cobertura: [...new Set(resumen.fuentes.filter(f => f.porEmpezar > 0)
          .map(f => FUENTES[f.fuente as keyof typeof FUENTES]?.comunidad).filter(Boolean))],
        porEmpezar: resumen.porEmpezar,
      },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (e) {
    console.error("[cursos/plazas]", (e as Error).message);
    return NextResponse.json({ total: 0, plazas: [], provincias: [], cobertura: [], porEmpezar: 0, error: "No disponible" }, { status: 503 });
  }
}
