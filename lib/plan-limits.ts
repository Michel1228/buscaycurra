/**
 * lib/plan-limits.ts — Límites por plan de suscripción
 * 
 * FUENTE ÚNICA de verdad para límites. Tanto UI como enforcement.
 * Límites diarios se resetean a las 00:00 UTC.
 * Free usa date_key fija "trial" (límite TOTAL, no diario).
 */

export type PlanTier = "free" | "basico" | "esencial" | "pro" | "empresa";

export interface PlanLimits {
  name: string;
  guzziModel: string;              // Modelo de IA para Guzzi
  guzziMaxConsultasDia: number;    // Consultas al chat por día (free: TOTAL trial)
  enviosCVDia: number;             // Envíos de CV por día
  enviosCVSemana: number;          // Envíos de CV por semana
  camaraMaxUsos: number;           // 📸 Fotos a la cámara AL MES, todos los planes (se recargan el día 1)
  cvsGuardados: number;            // CVs que puede tener guardados
  cvConIAGratis: number;           // CVs gratuitos creados con IA (TOTAL)
  cartaPersonalizada: boolean;     // Si la carta se personaliza con IA
  prepararEntrevista: boolean;     // Simulador de entrevista con IA, sin límite
  /** Entrevistas de ensayo a la semana; null = sin límite (lib/entrevistas/cupo.ts). */
  entrevistasSemana: number | null;
  ofertasGuardadas: number;        // Ofertas que puede guardar
  codigosPromocionales: boolean;   // Puede crear códigos de referido
  apiAccess: boolean;              // Acceso a API externa
}

export const LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    name: "Gratis",
    // 15 consultas al dia en vez de 5: con 5 la gente ni se molesta en
    // probarlo, y quien no prueba nunca se suscribe. Desde el 16 oct 2026 todos
    // los planes van por el mismo modelo (ver app/api/gusi/chat/route.ts).
    guzziModel: "gpt-5.6-luna (OpenAI), respaldo Groq",
    guzziMaxConsultasDia: 15,         // antes 5 — subido el 7 ago 2026
    enviosCVDia: 3,                   // 3 envíos/día
    enviosCVSemana: 7,               // 7 envíos/semana
    // LA CÁMARA VA POR MES (17 oct 2026). Cada foto cuesta ~1 céntimo de
    // GPT-4o y hasta 10-12 de Google Maps; y lo mismo se consigue gratis
    // escribiendo el nombre del negocio. La foto es un extra: 5/30/100/300 al
    // mes en vez de 2/10/30/ilimitado al día.
    camaraMaxUsos: 5,
    cvsGuardados: 1,
    cvConIAGratis: 1,                 // 1 CV gratis con IA
    cartaPersonalizada: false,
    prepararEntrevista: false,
    entrevistasSemana: 2,                // 19 oct 2026: dos ensayos a la semana gratis
    ofertasGuardadas: 10,
    codigosPromocionales: true,       // 21 oct 2026: invita cualquiera (lib/referidos/premios.ts)
    apiAccess: false,
  },
  basico: {
    name: "Básico",
    guzziModel: "gpt-5.6-luna (OpenAI), respaldo Groq",
    guzziMaxConsultasDia: 30,
    enviosCVDia: 15,
    enviosCVSemana: 100,
    camaraMaxUsos: 30,                // Legacy — mismo que esencial
    cvsGuardados: 3,
    cvConIAGratis: 3,
    cartaPersonalizada: true,
    prepararEntrevista: true,
    entrevistasSemana: null,
    ofertasGuardadas: 50,
    codigosPromocionales: true,       // 21 oct 2026: invita cualquiera (lib/referidos/premios.ts)
    apiAccess: false,
  },
  esencial: {
    name: "Esencial",
    guzziModel: "gpt-5.6-luna (OpenAI), respaldo Groq",
    guzziMaxConsultasDia: 30,
    enviosCVDia: 15,
    enviosCVSemana: 100,
    camaraMaxUsos: 30,                // 30 fotos al mes
    cvsGuardados: 3,
    cvConIAGratis: 3,
    cartaPersonalizada: true,
    prepararEntrevista: true,
    entrevistasSemana: null,
    ofertasGuardadas: 50,
    codigosPromocionales: true,       // 21 oct 2026: invita cualquiera (lib/referidos/premios.ts)
    apiAccess: false,
  },
  pro: {
    name: "Pro",
    guzziModel: "gpt-5.6-luna (OpenAI), respaldo Groq",
    guzziMaxConsultasDia: 100,
    enviosCVDia: 50,
    enviosCVSemana: 350,
    camaraMaxUsos: 100,               // 100 fotos al mes
    cvsGuardados: 10,
    cvConIAGratis: 10,
    cartaPersonalizada: true,
    prepararEntrevista: true,
    entrevistasSemana: null,
    ofertasGuardadas: 200,
    codigosPromocionales: true,
    apiAccess: false,
  },
  empresa: {
    name: "Empresa",
    guzziModel: "gpt-5.6-luna (OpenAI), respaldo Groq",
    guzziMaxConsultasDia: 999999,
    enviosCVDia: 200,
    enviosCVSemana: 1500,
    camaraMaxUsos: 300,               // 300 fotos al mes (antes ilimitado)
    cvsGuardados: 999,
    cvConIAGratis: 999999,
    cartaPersonalizada: true,
    prepararEntrevista: true,
    entrevistasSemana: null,
    ofertasGuardadas: 9999,
    codigosPromocionales: true,
    apiAccess: true,
  },
};

/**
 * Lo que compra una empresa con el Plan Empresa (lib/empresas/cuenta.ts).
 *
 * POR QUÉ (4 nov 2026). Era una sola cuenta con una contraseña: cinco
 * departamentos podían usarla a la vez y abrir todos los contactos que
 * quisieran por 49,99 €/mes. Ahora cada persona entra con su cuenta y el cupo
 * del mes es de la empresa, lo use quien lo use.
 *
 * NÚMEROS PROVISIONALES: Michel los fija cuando decida el precio de empresa.
 */
export const LIMITES_EMPRESA = {
  /** Personas con acceso, contando a quien paga. */
  usuarios: 3,
  /** Candidatos distintos a los que abre contacto y CV cada mes; uno ya abierto no vuelve a contar. */
  candidatosMes: 100,
  /** Invitaciones «Me interesa» al mes (además del tope diario de lib/entrevistas/empresa.ts). */
  invitacionesMes: 60,
};

/** Obtiene los límites para un plan. Si no se reconoce, devuelve free. */
export function getPlanLimits(plan?: string | null): PlanLimits {
  if (!plan) return LIMITS.free;
  const tier = plan.toLowerCase() as PlanTier;
  return LIMITS[tier] ?? LIMITS.free;
}

/**
 * El plan que de verdad toca aplicar, mirando también si la suscripción está al
 * corriente.
 *
 * POR QUÉ HACE FALTA. La columna `subscription_status` se leía en varios sitios
 * y no se usaba en ninguno para decidir. Consecuencia comprobada en producción:
 * hay cuentas con `plan = "empresa"` y `subscription_status = "inactive"`
 * disfrutando de Guzzi ilimitado, cámara ilimitada y envíos ilimitados, mientras
 * la pantalla de consumo les dice "free".
 *
 * Y lo mismo con quien deja de pagar: el webhook de Stripe marca `past_due` en
 * `invoice.payment_failed` pero deja el plan intacto, así que un Pro moroso
 * conservaba sus 100 consultas de IA al día hasta que Stripe borrase la
 * suscripción — y si la configuración de Stripe es "dejar impagada" en vez de
 * "cancelar", para siempre.
 *
 * Estados que SÍ dan derecho al plan: `active` y `trialing` (el periodo de
 * prueba de 7 días de Pro es legítimo). También se acepta que el campo venga
 * vacío o nulo: hay cuentas antiguas creadas antes de que existiera la columna,
 * y cortarles el servicio por una migración no sería justo.
 */
export function getPlanEfectivo(
  plan?: string | null,
  subscriptionStatus?: string | null
): string {
  if (!plan || plan.toLowerCase() === "free") return "free";
  // Sin dato, se respeta el plan: son cuentas anteriores a la columna.
  if (subscriptionStatus === undefined || subscriptionStatus === null || subscriptionStatus === "") {
    return plan;
  }
  const alCorriente = ["active", "trialing"].includes(subscriptionStatus.toLowerCase());
  return alCorriente ? plan : "free";
}

/**
 * El plan efectivo de un usuario, LEYENDO LAS DOS COLUMNAS que hacen falta.
 *
 * POR QUE EXISTE. getPlanEfectivo() es correcta, pero solo la usaba UN sitio:
 * Guzzi. Los otros siete leian `select("plan")` a secas y se creian el plan
 * guardado sin mirar si la suscripcion seguia viva. Resultado: alguien dejaba de
 * pagar el plan Pro y conservaba 50 envios de CV al dia, 30 fotos con GPT-4o
 * —que se pagan a OpenAI— , las entrevistas, 10 CVs y 200 ofertas guardadas.
 * Lo unico que perdia era el chat.
 *
 * O sea que lo unico protegido era justo lo que mas nos cuesta, y todo lo demas
 * quedaba abierto. Con esto se lee bien desde un solo sitio y no hay que
 * acordarse en cada endpoint nuevo.
 *
 * Falla CERRADO a proposito: si no se puede leer el perfil se devuelve "free".
 * Regalar un plan de pago por un fallo de lectura es peor que pedirle a alguien
 * que recargue.
 */
export async function planEfectivoDeUsuario(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("plan, subscription_status")
      .eq("id", userId)
      .single();
    if (error || !data) return "free";
    return getPlanEfectivo(data.plan, data.subscription_status);
  } catch {
    return "free";
  }
}

/** Modelo real de IA que usará Guzzi según el plan */
export function getGuzziModel(plan?: string | null): string {
  return getPlanLimits(plan).guzziModel;
}

/** Verifica si el plan tiene acceso a Guzzi */
export function canUseGuzzi(plan?: string | null): boolean {
  return getPlanLimits(plan).guzziMaxConsultasDia > 0;
}

/** Verifica si el plan permite usar la cámara */
export function canUseCamera(plan?: string | null): boolean {
  return getPlanLimits(plan).camaraMaxUsos > 0;
}
