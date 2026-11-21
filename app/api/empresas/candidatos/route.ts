import { NextRequest, NextResponse } from "next/server";
import { getUsuario, correoSinVerificar } from "@/lib/auth-server";
import { cuentaEmpresa, cupoDelMes, yaAbiertos } from "@/lib/empresas/cuenta";
import { candidatosVisibles, ordenarParaEmpresa, type FichaCandidato } from "@/lib/empresas/candidatos";
import { NIVELES } from "@/lib/empresas/reglas";

export const dynamic = "force-dynamic";

const POR_PAGINA = 24;

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function aptitudesDe(v: unknown): string[] {
  const l = Array.isArray(v) ? v.map(texto) : texto(v).split(",").map((s) => s.trim());
  return l.filter(Boolean).slice(0, 4);
}

function puestoDe(cv: Record<string, unknown>): string {
  const exp = Array.isArray(cv.experiencia) ? cv.experiencia : [];
  return texto(cv.subtitulo) || texto((exp[0] as { puesto?: string } | undefined)?.puesto);
}

export async function GET(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  // Autenticación obligatoria
  const usuario = await getUsuario(req);
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ciudad = searchParams.get("ciudad") || "";
  const keyword = searchParams.get("q") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const offset = (page - 1) * POR_PAGINA;

  // Empresa verificada y activa: la suya o la que le ha dado acceso (lib/empresas/cuenta.ts).
  // Pagar el Plan Empresa ya no basta (21 nov 2026).
  const cuenta = await cuentaEmpresa(usuario).catch(() => null);
  const esEmpresa = !!cuenta;

  // LA VISIBILIDAD SE LEE DE user_cvs, QUE ES DONDE LA GUARDA EL CV.
  //
  // Desde el 14 may 2026 el interruptor "Visible para empresas" escribe en
  // user_cvs.visible_empresas (nuestra base de datos). Este portal seguía
  // preguntando a Supabase por profiles.visible_empresas, una columna que no
  // existe: la consulta fallaba sin avisar y las empresas veían siempre 0
  // candidatos. Comprobado el 17 oct 2026 con 16 personas que lo habían activado.
  // (La consulta está en lib/empresas/candidatos.ts.)
  try {
    const todos = await candidatosVisibles({ ciudad, q: keyword });

    // Una empresa verificada ve los de su alcance (su sector; ETT y agencias,
    // todos), de más puntuación a menos. Los demás ven fichas sin nombre (puesto,
    // ciudad y aptitudes), por orden de actualización y sin puntuación ni
    // referencias: saben que hay gente, pero la valoración es solo para empresas.
    const lista: FichaCandidato[] = cuenta
      ? ordenarParaEmpresa(todos, cuenta.alcance)
      : [...todos].sort((a, b) => +new Date(b.actualizado) - +new Date(a.actualizado));
    const pagina = lista.slice(offset, offset + POR_PAGINA);

    // EL CONTACTO, SOLO DE LOS YA ABIERTOS (4 nov 2026). Abrir uno gasta cupo
    // del mes (/talento/[id]); si la lista diera el correo y el teléfono de
    // todos, el cupo no serviría de nada.
    const abiertos = cuenta ? await yaAbiertos(cuenta.empresaId, pagina.map((c) => c.id)) : new Set<string>();
    const candidatos = pagina.map((c, i) => {
      const cv = c.cv;
      const abierto = abiertos.has(c.id);
      return {
        id: esEmpresa ? c.id : String(offset + i),
        nombre: esEmpresa ? [texto(cv.nombre), texto(cv.apellidos)].filter(Boolean).join(" ") : "Candidato",
        ciudad: texto(cv.ciudad) || "España",
        puesto: puestoDe(cv),
        aptitudes: aptitudesDe(cv.aptitudes),
        email: abierto ? texto(cv.email) || null : null,
        telefono: abierto ? texto(cv.telefono) || null : null,
        abierto,
        // La valoración, solo para empresas verificadas.
        referencias: esEmpresa ? c.referencias : 0,
        puntuacion: esEmpresa ? c.puntuacion.total : null,
        nivel: esEmpresa ? NIVELES[c.puntuacion.nivel] : null,
        updatedAt: c.actualizado,
      };
    });

    const cupo = cuenta ? await cupoDelMes(cuenta.empresaId) : null;
    return NextResponse.json({
      candidatos, esEmpresa, titular: !!cuenta?.titular, cupo, pagina: page, total: lista.length,
      alcance: cuenta ? { ...cuenta.alcance, razonSocial: cuenta.razonSocial } : null,
    });
  } catch (error) {
    console.error("[empresas/candidatos] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
