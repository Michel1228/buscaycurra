/**
 * lib/centinela/recorrido.ts
 * Cada mañana, el centinela recorre la aplicación COMO UN USUARIO.
 *
 * POR QUÉ. Los fallos de esta semana no los vio ninguna comprobación: todo
 * respondía 200 y cada pieza, por separado, funcionaba. Lo que fallaba era el
 * camino entero que hace una persona: pulsar "Mejorar" y que el formulario no
 * cambie, bajar el CV en el móvil y que salga vacío, pedirle a Guzzi cambiar el
 * CV y que se ponga a hablar de cursos. Michel los encontró usándola.
 *
 * Aquí se repiten esos caminos de punta a punta con una cuenta fija de
 * comprobación (delivered+recorrido@resend.dev: Resend la acepta y no llega a
 * nadie). Si alguno vuelve a romperse, el correo del centinela lo dice esa misma
 * mañana. Coste: dos llamadas a la IA gratuita y un PDF al día.
 *
 * REGLA: cada comprobación nace de un fallo que pasó de verdad, y se ha visto
 * fallar con el código roto antes de darla por buena.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { getPool } from "@/lib/db";
import { htmlDelCV } from "@/lib/cv-generator/html-guardado";

type Anota = (nombre: string, bien: boolean, detalle: string, nacioDe: string) => void;

const BASE = "https://buscaycurra.es";
const CUENTA = "delivered+recorrido@resend.dev";

/** CV ficticio de la cuenta de comprobación. "Recorrido" es lo que se busca en el PDF. */
const CV_PRUEBA = {
  nombre: "Recorrido", apellidos: "Diario", subtitulo: "Camarero",
  telefono: "600 000 000", email: CUENTA, ciudad: "Tudela",
  perfilProfesional: "Camarero con tres años de experiencia en barra y sala.",
  aptitudes: "Atención al cliente, Caja", idiomas: "Español:100",
  experiencia: [{ fechas: "2022 - 2025", puesto: "Camarero", empresa: "Bar Ejemplo", ubicacion: "Tudela", descripcion: "servir mesas\ncobrar en caja" }],
  formacion: [{ titulo: "Graduado en ESO", centro: "Instituto Ejemplo", ubicacion: "Tudela" }],
  templateId: "clasica", accentColor: "#16a34a",
};

/** La cuenta de comprobación existe, con su ficha y su CV, y devuelve una sesión. */
async function prepararCuenta(admin: SupabaseClient): Promise<{ token: string; userId: string }> {
  const { data: lista } = await admin.auth.admin.listUsers({ perPage: 1000 });
  let usuario = lista.users.find((u) => u.email === CUENTA);
  if (!usuario) {
    const { data, error } = await admin.auth.admin.createUser({
      email: CUENTA, password: randomBytes(24).toString("base64url"), email_confirm: true,
      user_metadata: { full_name: "Recorrido Diario", ciudad: "Tudela" },
      app_metadata: { bienvenida_en: new Date().toISOString(), comprobacion: true },
    });
    if (error || !data.user) throw new Error("no se pudo crear la cuenta de comprobación: " + error?.message);
    usuario = data.user;
  }
  const userId = usuario.id;
  await admin.from("profiles").upsert({ id: userId, email: CUENTA, full_name: "Recorrido Diario", ciudad: "Tudela", plan: "free" }, { onConflict: "id" });
  const pool = getPool();
  const { rows } = await pool.query(`SELECT 1 FROM user_cvs WHERE user_id = $1 LIMIT 1`, [userId]);
  if (!rows.length) {
    await pool.query(`INSERT INTO user_cvs (user_id, nombre, html, form_data, updated_at) VALUES ($1, 'Mi CV', $2, $3, NOW())`,
      [userId, htmlDelCV(CV_PRUEBA), JSON.stringify(CV_PRUEBA)]);
  }

  const { data: enlace, error: eEnlace } = await admin.auth.admin.generateLink({ type: "magiclink", email: CUENTA });
  if (eEnlace) throw new Error("generateLink: " + eEnlace.message);
  const v = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${enlace.properties.hashed_token}&type=magiclink`,
    { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, redirect: "manual" });
  const token = new URLSearchParams((v.headers.get("location") || "").split("#")[1] || "").get("access_token");
  if (!token) throw new Error("no se obtuvo sesión de la cuenta de comprobación");
  return { token, userId };
}

export async function recorridoDeUsuario(anota: Anota): Promise<void> {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  let sesion: { token: string; userId: string };
  try {
    sesion = await prepararCuenta(admin);
  } catch (e) {
    anota("recorrido de usuario: entrar con la cuenta de comprobación", false, (e as Error).message,
      "2 oct 2026: los fallos de la semana solo se veían recorriendo la app como un usuario");
    return;
  }
  const H = { Authorization: `Bearer ${sesion.token}`, "Content-Type": "application/json" };
  const post = (ruta: string, cuerpo: unknown) =>
    fetch(BASE + ruta, { method: "POST", headers: H, body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(60000) });

  // ── R1. "Mejorar con IA" devuelve un texto mejor, no un error ni lo mismo ──
  try {
    const crudo = "soy camarero llevo tres años en bares";
    const r = await post("/api/cv/mejorar", { cvText: crudo, jobTitle: "Camarero" });
    const d = await r.json().catch(() => ({})) as { cvMejorado?: string; error?: string };
    const texto = (d.cvMejorado || "").trim();
    anota("mejorar el CV con IA reescribe el texto", r.ok && texto.length > crudo.length && texto !== crudo,
      r.ok ? `${texto.length} caracteres a partir de ${crudo.length}` : `HTTP ${r.status}: ${d.error || ""}`,
      "29 sep 2026: con DeepSeek sin saldo, Mejorar mi CV daba error 500 a todo el mundo");
  } catch (e) {
    anota("mejorar el CV con IA reescribe el texto", false, (e as Error).message,
      "29 sep 2026: con DeepSeek sin saldo, Mejorar mi CV daba error 500 a todo el mundo");
  }

  // ── R2. La nota ATS responde con una nota ──
  try {
    const r = await post("/api/cv/ats-score", { titulo: "Camarero", empresa: "Bar Ejemplo", descripcion: "Se busca camarero con experiencia en barra." });
    const d = await r.json().catch(() => ({})) as { score?: unknown; error?: string };
    anota("la nota ATS del CV responde", r.ok && typeof d.score === "number",
      r.ok ? `nota ${d.score}` : `HTTP ${r.status}: ${d.error || ""}`,
      "29 sep 2026: la nota ATS daba error 500 a todo el mundo (DeepSeek sin saldo)");
  } catch (e) {
    anota("la nota ATS del CV responde", false, (e as Error).message, "29 sep 2026: la nota ATS daba error 500 a todo el mundo");
  }

  // ── R3. Guzzi entiende "cambiar mi experiencia" y manda al editor ──
  try {
    const r = await post("/api/gusi/chat", { message: "quiero cambiar mi experiencia de carretillero", history: [] });
    const d = await r.json().catch(() => ({})) as { action?: string; reply?: string };
    anota("Guzzi manda al editor cuando quieres cambiar el CV", r.ok && d.action === "editar_cv" && /\/app\/curriculum/.test(d.reply || ""),
      `acción: ${d.action || "ninguna"}`,
      "2 oct 2026: Guzzi se ponía a buscar cursos de carretillero y prometía editar un PDF que no puede tocar");
  } catch (e) {
    anota("Guzzi manda al editor cuando quieres cambiar el CV", false, (e as Error).message, "2 oct 2026: Guzzi se iba por las ramas");
  }

  // ── R4. El PDF del móvil: sin sesión, varias peticiones, y con los datos dentro ──
  const fichero = `/tmp/recorrido-${Date.now()}.pdf`;
  try {
    const r = await post("/api/cv/pdf-template", { html: htmlDelCV(CV_PRUEBA), paraVisor: true });
    const { id } = await r.json().catch(() => ({})) as { id?: string };
    if (!r.ok || !id) throw new Error(`no se generó el PDF (HTTP ${r.status})`);
    const pedidas: Buffer[] = [];
    // Como el teléfono: el navegador lo abre y el gestor de descargas lo vuelve a pedir, sin sesión.
    for (let i = 0; i < 2; i++) {
      const g = await fetch(`${BASE}/api/cv/pdf-template?id=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(30000) });
      pedidas.push(Buffer.from(await g.arrayBuffer()));
    }
    const sonPdf = pedidas.every((b) => b.subarray(0, 5).toString() === "%PDF-");
    let conDatos = false;
    if (sonPdf) {
      writeFileSync(fichero, pedidas[1]);
      conDatos = execFileSync("pdftotext", [fichero, "-"], { timeout: 15000 }).toString().includes("Recorrido");
    }
    anota("el CV en PDF del móvil se abre, aguanta dos peticiones y lleva los datos", sonPdf && conDatos,
      !sonPdf ? "alguna de las dos peticiones no devolvió un PDF" : conDatos ? "dos peticiones, PDF con los datos" : "el PDF no lleva los datos",
      "2 oct 2026: en el móvil el PDF daba 'No autorizado' y luego salía vacío al guardarlo");
  } catch (e) {
    anota("el CV en PDF del móvil se abre, aguanta dos peticiones y lleva los datos", false, (e as Error).message,
      "2 oct 2026: en el móvil el PDF daba 'No autorizado' y luego salía vacío al guardarlo");
  } finally {
    try { unlinkSync(fichero); } catch { /* no se llegó a crear */ }
  }

  // ── R5. Ningún CV guardado es texto en bruto ──
  try {
    const { rows } = await getPool().query(`SELECT COUNT(*)::int AS n FROM user_cvs WHERE ltrim(coalesce(html, '')) LIKE '{%'`);
    anota("ningún CV guardado es texto en bruto", rows[0].n === 0, `${rows[0].n} CV con datos en bruto en vez del CV montado`,
      "2 oct 2026: los 52 CV guardados tenían JSON en vez del CV y 'CVs guardados' descargaba eso");
  } catch (e) {
    anota("ningún CV guardado es texto en bruto", false, (e as Error).message, "2 oct 2026: los 52 CV guardados tenían JSON");
  }

  // ── R6. Quien confirma su cuenta recibe la bienvenida (ficha, ciudad, alerta, correo) ──
  try {
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const haceUnaSemana = Date.now() - 7 * 86400000;
    // Solo cuentas confirmadas hace más de una hora (da tiempo a que llegue) y de la última semana.
    const recientes = data.users.filter((u) => u.email_confirmed_at && !/@resend\.dev$/.test(u.email || "")
      && new Date(u.created_at).getTime() > haceUnaSemana
      && Date.now() - new Date(u.email_confirmed_at).getTime() > 3600000);
    const sin = recientes.filter((u) => !u.app_metadata?.bienvenida_en);
    anota("quien confirma su cuenta recibe la bienvenida", sin.length === 0,
      `${sin.length} de ${recientes.length} cuentas confirmadas esta semana sin bienvenida`,
      "29 sep 2026: la bienvenida se quedaba en 401 y 12 personas se quedaron sin ficha, ciudad, alerta ni correo");
  } catch (e) {
    anota("quien confirma su cuenta recibe la bienvenida", false, (e as Error).message, "29 sep 2026: la bienvenida se quedaba en 401");
  }

  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/logout?scope=local`, {
    method: "POST", headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${sesion.token}` },
  }).catch(() => {});
}
