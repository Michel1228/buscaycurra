/**
 * /api/cursos/ir — Salida hacia un curso de pago: apunta el clic y redirige.
 *
 *   ?p=coursera   programa (ver lib/cursos/afiliados.ts)
 *   ?u=https://www.coursera.org/...   destino; solo dominios del programa
 *   ?f=excel-ofimatica   ficha desde la que se pulsó (para saber qué funciona)
 *
 * Nunca redirige fuera de los dominios del programa: sin esa comprobación esto
 * sería una redirección abierta que cualquiera podría usar para colar un enlace
 * de phishing con nuestro dominio delante.
 *
 * El clic se apunta sin guardar nada de la persona (ni IP ni sesión): solo
 * fecha, programa, ficha y si llevaba comisión. Si apuntarlo falla, se
 * redirige igual: la persona no tiene por qué notar nada.
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { destinoFinal, destinoPermitido, programaValido } from "@/lib/cursos/afiliados";

export const dynamic = "force-dynamic";

let tablaLista = false;

async function apuntarClic(programa: string, ficha: string | null, conComision: boolean) {
  const pool = getPool();
  if (!tablaLista) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS curso_clic (
        id           BIGSERIAL PRIMARY KEY,
        programa     TEXT NOT NULL,
        ficha        TEXT,
        con_comision BOOLEAN NOT NULL,
        creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    tablaLista = true;
  }
  await pool.query(
    `INSERT INTO curso_clic (programa, ficha, con_comision) VALUES ($1, $2, $3)`,
    [programa, ficha, conComision]
  );
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const programa = sp.get("p");
  const destino = sp.get("u") ?? "";
  const ficha = sp.get("f")?.replace(/[^a-z0-9-]/g, "").slice(0, 60) || null;

  if (!programaValido(programa) || !destinoPermitido(programa, destino)) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 400 });
  }

  const { url, conComision } = destinoFinal(programa, destino);
  try {
    await apuntarClic(programa, ficha, conComision);
  } catch (e) {
    console.error("[cursos/ir] no se pudo apuntar el clic:", (e as Error).message);
  }

  return NextResponse.redirect(url, {
    status: 302,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}
