/**
 * lib/metricas/personas.ts (servidor) — Cuánta gente hay, cuánta entra y de dónde viene.
 *
 * Lo usan el contador del escritorio de Michel (/api/admin/contador) y el
 * resumen diario por correo (/api/admin/resumen-diario), 23 oct 2026.
 *
 * Cuenta PERSONAS REALES: fuera las cuentas de prueba e internas, las mismas
 * que se quitaban a mano cada vez que Michel preguntaba cuántos usuarios hay.
 * Los días van en hora de Madrid, que es como los cuenta él.
 */
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { COMO_NOS_CONOCIO } from "@/lib/origen/llegada";
import { correoVerificado } from "@/lib/auth/correo-verificado";

export function esCuentaDePrueba(email: string): boolean {
  return /@resend\.dev$/i.test(email) || /^(audit|qa|test|prueba|demo)[\w.+-]*@/i.test(email)
    || /@buscaycurra\.es$/i.test(email) || /@(example|test)\./i.test(email);
}

const diaMadrid = (d: Date | string | number) => new Date(d).toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
const DIA = 86400000;

export type Cuenta = { nombre: string; n: number };

export type ResumenPersonas = {
  reales: number;
  confirmadas: number;
  sinConfirmar: number;
  hoy: number;
  ayer: number;
  ultimos7: number;
  ultimos30: number;
  /** Han entrado en la app en los últimos 7 días. */
  activas7: number;
  /** Altas de los últimos 14 días, del más antiguo a hoy. */
  porDia: Array<{ dia: string; altas: number }>;
  /** Todas las personas, por la ciudad de su ficha (o la del registro). */
  ciudades: Cuenta[];
  /** Por qué canal llegaron las altas de los últimos 7 y 30 días (ver canalDe). */
  canales7: Cuenta[];
  canales30: Cuenta[];
};

const NOMBRE_CONOCIO = new Map(COMO_NOS_CONOCIO);
const NOMBRE_LLEGADA: Record<string, string> = {
  google: "Google", bing: "Bing", duckduckgo: "DuckDuckGo", instagram: "Instagram", facebook: "Facebook",
  tiktok: "TikTok", x: "X (Twitter)", linkedin: "LinkedIn", youtube: "YouTube", whatsapp: "WhatsApp",
  chatgpt: "ChatGPT", "app store": "App Store", "google play": "Google Play",
};

/**
 * Un solo canal por persona, de lo más fiable a lo menos: lo que contestó en el
 * registro, la web de la que venía, si entró por una ficha de oferta (casi
 * siempre desde Google), si se registró en la app, o "Directo". Lo que no
 * tiene nada es de antes del 23 oct 2026, cuando no se apuntaba.
 */
export function canalDe(meta: Record<string, unknown>): string {
  const conocio = String(meta.conocio || "");
  if (conocio) return NOMBRE_CONOCIO.get(conocio) || "Otro";
  const llegoDe = String(meta.llego_de || "");
  if (llegoDe && llegoDe !== "directo") return NOMBRE_LLEGADA[llegoDe] || llegoDe;
  if (String(meta.origen || "").startsWith("oferta:")) return "Ficha de una oferta";
  if (meta.plataforma === "ios") return "App de iPhone";
  if (meta.plataforma === "android") return "App de Android";
  if (llegoDe === "directo") return "Directo";
  return "Sin dato";
}

function ranking(valores: string[], max: number): Cuenta[] {
  const m = new Map<string, number>();
  for (const v of valores) m.set(v, (m.get(v) || 0) + 1);
  return [...m.entries()].map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre)).slice(0, max);
}

const capitalizar = (s: string) => s.replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, l: string) => sep + l.toUpperCase());

export async function resumenPersonas(sb: SupabaseClient): Promise<ResumenPersonas> {
  const todas: User[] = [];
  for (let pagina = 1; pagina <= 50; pagina++) {
    const { data, error } = await sb.auth.admin.listUsers({ page: pagina, perPage: 1000 });
    if (error) throw error;
    todas.push(...data.users);
    if (data.users.length < 1000) break;
  }
  const reales = todas.filter((u) => !esCuentaDePrueba(u.email || ""));

  const ahora = Date.now();
  const hoy = diaMadrid(ahora);
  const ayer = diaMadrid(ahora - DIA);
  const altaDe = (u: User) => diaMadrid(u.created_at);
  const hace = (u: User, dias: number) => ahora - new Date(u.created_at).getTime() < dias * DIA;

  const porDia: Array<{ dia: string; altas: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const dia = diaMadrid(ahora - i * DIA);
    porDia.push({ dia, altas: reales.filter((u) => altaDe(u) === dia).length });
  }

  // La ciudad de la ficha manda (la persona la puede cambiar); si no, la del registro.
  const ciudadFicha = new Map<string, string>();
  for (let desde = 0; ; desde += 1000) {
    const { data } = await sb.from("profiles").select("id, ciudad").range(desde, desde + 999);
    for (const p of data || []) if (p.ciudad?.trim()) ciudadFicha.set(p.id, p.ciudad.trim());
    if (!data || data.length < 1000) break;
  }
  const ciudades = ranking(
    reales.map((u) => ciudadFicha.get(u.id) || String(u.user_metadata?.ciudad || "").trim())
      .filter(Boolean).map((c) => capitalizar(c.toLowerCase())),
    8,
  );

  const canal = (u: User) => canalDe((u.user_metadata || {}) as Record<string, unknown>);
  return {
    reales: reales.length,
    // Con "Confirm email" apagado, email_confirmed_at se pone al crear la cuenta:
    // lo que cuenta es el correo verificado (lib/auth/correo-verificado.ts).
    confirmadas: reales.filter((u) => correoVerificado(u)).length,
    sinConfirmar: reales.filter((u) => !correoVerificado(u)).length,
    hoy: reales.filter((u) => altaDe(u) === hoy).length,
    ayer: reales.filter((u) => altaDe(u) === ayer).length,
    ultimos7: reales.filter((u) => hace(u, 7)).length,
    ultimos30: reales.filter((u) => hace(u, 30)).length,
    activas7: reales.filter((u) => u.last_sign_in_at && ahora - new Date(u.last_sign_in_at).getTime() < 7 * DIA).length,
    porDia,
    ciudades,
    canales7: ranking(reales.filter((u) => hace(u, 7)).map(canal), 8),
    canales30: ranking(reales.filter((u) => hace(u, 30)).map(canal), 10),
  };
}
