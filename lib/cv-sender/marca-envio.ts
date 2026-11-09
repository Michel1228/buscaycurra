/**
 * lib/cv-sender/marca-envio.ts — ¿Qué se le dice a ESTA persona de esta oferta?
 *
 * POR QUÉ (8 nov 2026). El freno de 15 días es por dirección de correo, y el
 * dueño lo pidió así: "son ofertas distintas aunque vengan de la misma empresa;
 * cuando se envíe un correo, se tacha esa oferta de cada usuario que lo envía".
 * Por eso:
 *   · "Enviado" se marca SOLO en la oferta concreta a la que la persona mandó su
 *     CV (la misma URL de origen; en los envíos antiguos, sin URL guardada, el
 *     mismo puesto y empresa).
 *   · Las demás ofertas de esa empresa NO se dan por enviadas: se dice la verdad,
 *     "ya mandaste tu CV a esta empresa el 3 nov; podrás volver a escribirles el
 *     18 nov", porque el freno anti-spam sigue.
 *   · Los envíos son de cada persona: la lista sale de SU sesión (RLS de
 *     cv_sends: auth.uid() = user_id) y aquí solo se compara.
 *
 * Sin dependencias de servidor: lo usan JobCard, la ficha y el servidor.
 */

export const DIAS_ENTRE_ENVIOS = 15;

/** Estados que cuentan como "ya se lo mandé" (los mismos que gastan cuota). */
const ESTADOS_ENVIADO = ["enviado", "pendiente", "entregado", "visto", "respondido"];

export interface EnvioPropio {
  company_email: string | null;
  company_url: string | null;
  company_name: string | null;
  job_title: string | null;
  status: string;
  sent_at: string | null;
  created_at: string | null;
}

export interface OfertaParaMarca {
  url?: string | null;
  titulo?: string | null;
  empresa?: string | null;
  correo?: string | null;
}

export type MarcaEnvio =
  | { tipo: "esta-oferta"; fecha: Date }
  | { tipo: "misma-empresa"; fecha: Date; puedeEl: Date; texto: string }
  | null;

const NO_PUESTO = (s?: string | null) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** La URL sin tracking ni barra final, para comparar la de la oferta con la guardada. */
function urlClave(u?: string | null): string {
  if (!u) return "";
  try {
    const x = new URL(u);
    return (x.hostname.replace(/^www\./, "") + x.pathname).replace(/\/+$/, "").toLowerCase();
  } catch { return u.trim().toLowerCase(); }
}

function fechaDe(e: EnvioPropio): Date {
  return new Date(e.sent_at || e.created_at || Date.now());
}

/** "3 nov": la fecha como se dice en España, sin año. */
export function fechaCorta(d: Date): string {
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" }).replace(".", "");
}

/** El aviso de la misma empresa, con la fecha en que podrá volver a escribirles. */
export function avisoMismaEmpresa(ultimo: Date, minDias = DIAS_ENTRE_ENVIOS): { puedeEl: Date; texto: string } {
  const puedeEl = new Date(ultimo.getTime() + minDias * 86_400_000);
  return {
    puedeEl,
    texto: `Ya mandaste tu CV a esta empresa el ${fechaCorta(ultimo)}; podrás volver a escribirles el ${fechaCorta(puedeEl)}.`,
  };
}

/**
 * La marca de una oferta para una persona, dada la lista de SUS envíos.
 * null = nada que decir (se puede enviar).
 */
export function marcaDeOferta(misEnvios: EnvioPropio[], oferta: OfertaParaMarca, ahora = new Date()): MarcaEnvio {
  const enviados = misEnvios.filter((e) => ESTADOS_ENVIADO.includes(e.status));
  const url = urlClave(oferta.url);
  const puesto = NO_PUESTO(oferta.titulo), empresa = NO_PUESTO(oferta.empresa);

  // 1. Esta oferta: la misma URL; en los envíos sin URL, el mismo puesto en la misma empresa.
  const esta = enviados
    .filter((e) => (e.company_url && url ? urlClave(e.company_url) === url
      : !e.company_url && puesto && NO_PUESTO(e.job_title) === puesto && empresa && NO_PUESTO(e.company_name) === empresa))
    .sort((a, b) => fechaDe(b).getTime() - fechaDe(a).getTime())[0];
  if (esta) return { tipo: "esta-oferta", fecha: fechaDe(esta) };

  // 2. Otra oferta de una empresa a la que escribió hace menos de 15 días: no se
  //    tacha, se explica el freno.
  const correo = (oferta.correo ?? "").trim().toLowerCase();
  if (!correo) return null;
  const reciente = enviados
    .filter((e) => (e.company_email ?? "").trim().toLowerCase() === correo)
    .sort((a, b) => fechaDe(b).getTime() - fechaDe(a).getTime())[0];
  if (!reciente) return null;
  const ultimo = fechaDe(reciente);
  if (reciente.status !== "pendiente" && ahora.getTime() - ultimo.getTime() >= DIAS_ENTRE_ENVIOS * 86_400_000) return null;
  if (reciente.status === "pendiente") {
    return { tipo: "misma-empresa", fecha: ultimo, puedeEl: ultimo, texto: "Ya tienes un CV en cola para esta empresa; espera a que salga antes de escribirles otra vez." };
  }
  return { tipo: "misma-empresa", fecha: ultimo, ...avisoMismaEmpresa(ultimo) };
}
