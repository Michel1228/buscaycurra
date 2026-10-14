/**
 * lib/guzzi/respuestas-fijas.ts — Respuestas que no deben depender del modelo.
 *
 * Son las de los atajos del chat y la de "mándalo a todas". Escritas a mano
 * para que digan exactamente lo que hace la app, ni más ni menos: el modelo
 * libre se inventaba pasos o prometía envíos que no hacía (auditoría del
 * 14 oct 2026 sobre 474 mensajes reales).
 */

type Mensaje = { role: string; text: string; jobs?: unknown[] };
type Oferta = { titulo?: string; empresa?: string; [k: string]: unknown };

const ORDINALES: Record<string, number> = { primera: 1, segunda: 2, tercera: 3, cuarta: 4, quinta: 5 };

/** "la primera", "la 3", "la oferta número 2", "la última" → posición (desde 1), o null. */
export function numeroDeOferta(mensaje: string, cuantas: number): number | null {
  const t = mensaje.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const ord = t.match(/\bla\s+(primera|segunda|tercera|cuarta|quinta)\b/);
  if (ord) return ORDINALES[ord[1]] <= cuantas ? ORDINALES[ord[1]] : null;
  if (/\bla\s+ultima\b/.test(t)) return cuantas || null;
  const num = t.match(/\b(?:la|oferta|numero|n[ºo°]\.?)\s*(\d{1,2})\b/);
  if (num) {
    const n = parseInt(num[1], 10);
    return n >= 1 && n <= cuantas ? n : null;
  }
  return null;
}

/**
 * Quiere mandar el CV a ofertas que ya se le enseñaron. No se manda nada desde
 * aquí: se le vuelven a poner las ofertas con su botón "Enviar CV", que enseña
 * la carta antes de que salga. Las ofertas vienen en el historial que manda el
 * chat (cada mensaje de Guzzi lleva sus `jobs`).
 */
export function respuestaOfertasMostradas(mensaje: string, history: Mensaje[], tieneCV: boolean): { reply: string; action: string; jobs?: Oferta[] } {
  if (!tieneCV) {
    return {
      reply: "Para mandar tu CV primero tengo que tenerlo: súbelo con el clip 📎 de abajo (en PDF) o créalo en [Mi CV](/app/curriculum). En cuanto lo tenga, pulsas **Enviar CV** en la oferta que quieras.",
      action: "send_cv_flow",
    };
  }
  const conOfertas = [...(history || [])].reverse().find((m) => m.role !== "user" && Array.isArray(m.jobs) && m.jobs.length > 0);
  const ofertas = ((conOfertas?.jobs || []) as Oferta[]).filter((o) => o && typeof o === "object").slice(0, 10);
  if (ofertas.length === 0) {
    return {
      reply: "Cada oferta que te enseño lleva su botón **Enviar CV**: con él te preparo una carta para esa empresa y la ves antes de que salga. Si ya no ves las ofertas, dime otra vez el puesto y la ciudad (por ejemplo, \"camarero en Tudela\") y te las saco.",
      action: "send_cv_flow",
    };
  }
  const n = numeroDeOferta(mensaje, ofertas.length);
  if (n) {
    const o = ofertas[n - 1];
    return {
      reply: `📧 Vale, te dejo aquí abajo la oferta ${n}: **${o.titulo || "sin título"}**${o.empresa ? ` (${o.empresa})` : ""}. Pulsa **Enviar CV**: te preparo la carta para esa empresa y la ves antes de que salga.`,
      jobs: [o],
      action: "search_results",
    };
  }
  return {
    reply: "📧 Te las dejo aquí abajo otra vez. Pulsa **Enviar CV** en cada una que quieras: para cada empresa te preparo una carta distinta y la ves antes de que salga. No las mando todas de golpe porque cada envío sale con tu nombre, y prefiero que veas lo que se manda.",
    jobs: ofertas,
    action: "search_results",
  };
}

/**
 * El modelo gratuito (gpt-oss-120b) a veces contesta con voseo ("¿Y vos?",
 * "tenés", "decime") aunque se le pida "tú" (14 oct 2026: una de cada tres
 * pruebas). Para quien escribe desde España suena raro, así que se cambian las
 * formas más comunes. Solo palabras enteras, en minúscula o empezando frase.
 */
const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const VOSEO: Array<[RegExp, string]> = [
  [/\b(a|para|de|por) vos\b/g, "$1 ti"], [/\bcon vos\b/g, "contigo"], [/\bvos\b/g, "tú"], [/\bVos\b/g, "Tú"], [/\bsos\b/g, "eres"],
  ...Object.entries({
    tenés: "tienes", querés: "quieres", podés: "puedes", necesitás: "necesitas", sabés: "sabes", buscás: "buscas",
    hacés: "haces", pensás: "piensas", preferís: "prefieres", venís: "vienes", decís: "dices", trabajás: "trabajas",
    vivís: "vives", contás: "cuentas", encontrás: "encuentras", decime: "dime", contame: "cuéntame", avisame: "avísame",
    escribime: "escríbeme", pasame: "pásame", mandame: "mándame", fijate: "fíjate", mirá: "mira", tené: "ten",
  }).flatMap(([v, t]) => [[v, t], [mayuscula(v), mayuscula(t)]])
    .map(([v, t]): [RegExp, string] => [new RegExp(`(?<![\\wáéíóúñÁÉÍÓÚÑ])${v}(?![\\wáéíóúñ])`, "g"), t]),
];
export function sinVoseo(texto: string): string {
  return VOSEO.reduce((t, [re, tu]) => t.replace(re, tu), texto);
}

/** El atajo "Enviar CV automático": cómo se manda el CV de verdad en la app. */
export function textoEnvioAutomatico(tieneCV: boolean): string {
  return "📧 **Así mando tu CV a empresas:**\n\n"
    + "1. **Dime puesto y ciudad** (por ejemplo, \"camarero en Tudela\") y te saco las ofertas. Cada una lleva **Enviar CV**: te escribo una carta para esa empresa, la ves y eliges cuándo sale.\n"
    + "2. **Negocios de tu zona**: si de lo tuyo no hay ofertas publicadas, te enseño negocios de la zona con su contacto y, si me dices que sí, les mando el CV.\n"
    + "3. **Una empresa concreta**: dime su nombre y la ciudad, o pásame su correo, y te preparo el envío.\n"
    + "4. **Con la cámara 📷**: hazle una foto a la fachada de un negocio y te digo qué es y cómo mandarle el CV.\n\n"
    + "Nunca se manda dos veces a la misma empresa en 15 días, y todo lo que envías lo tienes en [Mis envíos](/app/empresas)."
    + (tieneCV ? "\n\n¿De qué y dónde buscamos?" : "\n\n⚠️ Antes necesito tu CV: súbelo con el clip 📎 (en PDF) o créalo en [Mi CV](/app/curriculum).");
}

/**
 * El atajo "Au Pair" sin país. Antes tomaba "el extranjero" por una ciudad y
 * contestaba "No encontré ofertas au pair para El extranjero".
 * Las cifras salen de la ficha por país de lib/guzzi/prompts.ts.
 */
export const TEXTO_INFO_AU_PAIR = "👶 **El programa au pair, en corto:** vives con una familia en otro país, cuidas de sus hijos unas horas al día y a cambio tienes alojamiento, comida y una paga de bolsillo (en Europa, de unos 250 a 610 € al mes según el país). Es un intercambio cultural, no un empleo: si te piden jornada completa o llevar la casa, eso ya es un trabajo y tiene que pagarse como tal.\n\n"
  + "• 📋 **Requisitos habituales**: tener entre 18 y 30 años (cada país pone su tope), no tener hijos y experiencia cuidando niños.\n"
  + "• 🌍 **Para empezar**: Irlanda (para aprender inglés), Alemania (el más regulado), Países Bajos o Francia.\n"
  + "• ⚖️ **Lo que no te pueden pedir**: [Derechos del au pair](/app/au-pair/derechos)\n"
  + "• 💌 **Tu perfil y tu carta \"Dear Family\"**: [Sección Au Pair](/app/au-pair)\n\n"
  + "¿En qué país te gustaría? Dime, por ejemplo, \"busca au pair en Irlanda\" y te enseño ofertas.";
