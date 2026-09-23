/**
 * lib/onboarding/primer-dia.ts — Los tres pasos del primer día.
 *
 * POR QUÉ EXISTE. A 23 sep 2026: 122 personas registradas, 36 habían subido CV
 * (el 30%) y en 30 días solo SEIS habían mandado un CV, 21 envíos entre todas.
 * La gente instala la aplicación, ve un panel con cuatro ceros y se va. Mandar
 * el CV a una empresa es lo que de verdad consigue puestos, y casi nadie llegaba
 * a hacerlo ni una vez.
 *
 * REGLA: los pasos se calculan SIEMPRE contra los datos de verdad (¿hay ciudad
 * en el perfil?, ¿hay un CV guardado?, ¿hay algún envío?). Nada de una columna
 * "onboarding_completado" que se marca al pulsar un botón: eso se desincroniza
 * del mundo real —alguien borra su CV y sigue "completado"— y acaba mintiendo,
 * que es justo lo que no queremos en una pantalla que dice qué te falta.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPool } from "@/lib/db";

export interface PasoPrimerDia {
  id: "zona" | "cv" | "envio";
  titulo: string;
  /** Qué se consigue con esto, en sus palabras. */
  porQue: string;
  hecho: boolean;
  /** A dónde lleva el botón. */
  ruta: string;
  textoBoton: string;
}

export interface EstadoPrimerDia {
  pasos: PasoPrimerDia[];
  /** Cuántos llevan hechos. */
  hechos: number;
  completado: boolean;
  /** El primero que falta, que es el único que hay que enseñar grande. */
  siguiente: PasoPrimerDia | null;
}

/** Los textos, en un solo sitio: los usan la pantalla y el correo. */
export function construirPasos(datos: {
  tieneZona: boolean;
  tieneCv: boolean;
  tieneEnvio: boolean;
}): EstadoPrimerDia {
  const pasos: PasoPrimerDia[] = [
    {
      id: "zona",
      titulo: "Dinos dónde buscas trabajo",
      porQue: "Con tu ciudad se buscan las ofertas y las empresas de tu zona, no las de la otra punta del país.",
      hecho: datos.tieneZona,
      ruta: "/app/perfil",
      textoBoton: "Poner mi ciudad",
    },
    {
      id: "cv",
      titulo: "Sube tu CV",
      porQue: "Se guarda una vez y ya se usa en todos los envíos. Si no tienes uno, Guzzi te lo monta con lo que le cuentes.",
      hecho: datos.tieneCv,
      ruta: "/app/curriculum",
      textoBoton: "Subir mi CV",
    },
    {
      id: "envio",
      titulo: "Manda tu primer CV a una empresa",
      porQue: "La mayoría de los puestos de un pueblo no se publican en ningún portal: se cubren porque alguien dejó el currículum.",
      hecho: datos.tieneEnvio,
      ruta: "/app/empresas",
      textoBoton: "Buscar empresas de mi zona",
    },
  ];

  const hechos = pasos.filter((p) => p.hecho).length;
  return {
    pasos,
    hechos,
    completado: hechos === pasos.length,
    siguiente: pasos.find((p) => !p.hecho) || null,
  };
}

/**
 * El estado de una persona. Cada consulta va por su lado y falla hacia "no
 * hecho": si la base no responde, se enseña el paso otra vez, que es molesto
 * pero inofensivo. Al revés —dar por hecho lo que no está— se le ocultaría a
 * alguien justo lo que le falta.
 */
export async function estadoPrimerDia(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string
): Promise<EstadoPrimerDia> {
  // Cada una en su propio try: que falle la base de CVs no debe dejar sin
  // calcular los otros dos pasos.
  const sinRomperse = async (fn: () => Promise<boolean>): Promise<boolean> => {
    try {
      return await fn();
    } catch {
      return false;
    }
  };

  const [zona, cv, envio] = await Promise.all([
    sinRomperse(async () => {
      const r = await supabase.from("profiles").select("ciudad").eq("id", userId).single();
      return !!r.data?.ciudad?.trim();
    }),
    sinRomperse(async () => {
      const r = await getPool().query("SELECT 1 FROM user_cvs WHERE user_id = $1 LIMIT 1", [userId]);
      return (r.rowCount ?? 0) > 0;
    }),
    sinRomperse(async () => {
      const r = await supabase.from("cv_sends").select("id", { count: "exact", head: true }).eq("user_id", userId);
      return (r.count ?? 0) > 0;
    }),
  ]);

  return construirPasos({ tieneZona: zona, tieneCv: cv, tieneEnvio: envio });
}

/**
 * Quién se quedó a medias, para el recordatorio.
 *
 * Se pregunta por CONJUNTOS y no persona a persona: con 122 usuarios daría
 * igual, pero esto corre a diario y crece con la aplicación.
 */
export async function usuariosAMedias(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userIds: string[]
): Promise<Map<string, EstadoPrimerDia>> {
  const estado = new Map<string, EstadoPrimerDia>();
  if (!userIds.length) return estado;

  const [perfiles, cvs, envios] = await Promise.all([
    supabase.from("profiles").select("id, ciudad").in("id", userIds),
    getPool()
      .query<{ user_id: string }>("SELECT DISTINCT user_id FROM user_cvs WHERE user_id = ANY($1)", [userIds])
      .catch(() => ({ rows: [] as Array<{ user_id: string }> })),
    supabase.from("cv_sends").select("user_id").in("user_id", userIds),
  ]);

  const conZona = new Set(
    (perfiles.data || []).filter((p: { ciudad: string | null }) => p.ciudad?.trim()).map((p: { id: string }) => p.id)
  );
  const conCv = new Set((cvs.rows || []).map((r) => r.user_id));
  const conEnvio = new Set((envios.data || []).map((e: { user_id: string }) => e.user_id));

  for (const id of userIds) {
    estado.set(
      id,
      construirPasos({ tieneZona: conZona.has(id), tieneCv: conCv.has(id), tieneEnvio: conEnvio.has(id) })
    );
  }
  return estado;
}
