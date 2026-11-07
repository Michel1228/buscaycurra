/**
 * /api/referencias — Mis cartas de recomendación (lib/referencias/referencias.ts).
 *
 * GET                → { referencias, premio }
 * POST (formulario)  → empresa, firmante, cargo, email, cartaPublica, carta (PDF).
 *                      Guarda la carta y escribe a quien la firmó para que la confirme.
 * DELETE ?id=        → quitarla, con su fichero.
 *
 * Las fotos de cartas llegan ya pasadas a PDF desde el navegador: el
 * almacenamiento de los CV solo admite PDF.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserId, correoSinVerificar } from "@/lib/auth-server";
import { getPool } from "@/lib/db";
import { sendReferenciaConfirmarEmail } from "@/lib/email/smtp-sender";
import {
  apuntarPeticion, correoDeEmpresaValido, crearReferencia, enlaceReferencia, ENVIOS_POR_REFERENCIA,
  MAX_REFERENCIAS, motivoParaNoPedir, nuevoIdReferencia, quitarReferencia, REFERENCIAS_CON_PREMIO, referenciasDe,
} from "@/lib/referencias/referencias";

export const dynamic = "force-dynamic";

const MAXIMO = 5 * 1024 * 1024;
const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const campo = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const error = (mensaje: string, status = 400) => NextResponse.json({ error: mensaje }, { status });
const premio = { envios: ENVIOS_POR_REFERENCIA, cartasConPremio: REFERENCIAS_CON_PREMIO, maximo: MAX_REFERENCIAS };

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return error("Entra para ver tus cartas", 401);
  try {
    return NextResponse.json({ referencias: await referenciasDe(userId), premio });
  } catch (e) {
    console.error("[referencias] GET:", (e as Error).message);
    return error("No se pudieron leer tus cartas", 500);
  }
}

export async function POST(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  const userId = await getUserId(req);
  if (!userId) return error("Entra para subir tu carta", 401);

  let fd: FormData;
  try { fd = await req.formData(); } catch { return error("No ha llegado el formulario. Inténtalo de nuevo."); }
  const empresa = campo(fd, "empresa", 120);
  const firmante = campo(fd, "firmante", 120);
  const cargo = campo(fd, "cargo", 80);
  const email = campo(fd, "email", 160).toLowerCase();
  const cartaPublica = fd.get("cartaPublica") === "true";
  const carta = fd.get("carta");

  if (!empresa || !firmante || !cargo || !email) return error("Rellena la empresa, quién firma, su cargo y su correo.");
  if (!correoDeEmpresaValido(email, empresa)) {
    return error("Tiene que ser el correo de esa empresa, con su nombre detrás de la @. No vale Gmail ni Hotmail: así sabemos que contesta alguien de allí.");
  }
  if (!(carta instanceof File) || !carta.size) return error("Falta la carta.");
  if (carta.size > MAXIMO) return error("La carta no puede pasar de 5 MB.");
  const bytes = Buffer.from(await carta.arrayBuffer());
  if (bytes.subarray(0, 4).toString("latin1") !== "%PDF") return error("La carta tiene que ser un PDF o una foto.");

  const sb = admin();
  try {
    const { data: cuenta } = await sb.auth.admin.getUserById(userId);
    if ((cuenta?.user?.email || "").toLowerCase() === email) return error("Ese es tu correo: tiene que ser el de quien firmó la carta.");
    const motivo = await motivoParaNoPedir(userId, email);
    if (motivo) return error(motivo);

    // Quien firmó tiene que saber de quién es la carta.
    const { rows } = await getPool().query(
      `SELECT form_data->>'nombre' AS nombre, form_data->>'apellidos' AS apellidos
         FROM user_cvs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`, [userId]
    );
    let candidato = [rows[0]?.nombre, rows[0]?.apellidos].map((s) => String(s || "").trim()).filter(Boolean).join(" ");
    if (!candidato) {
      const { data: perfil } = await sb.from("profiles").select("full_name").eq("id", userId).maybeSingle();
      candidato = String(perfil?.full_name || "").trim();
    }
    if (!candidato) return error("Pon tu nombre en el CV antes: quien firmó tiene que saber de quién es la carta.");

    const id = nuevoIdReferencia();
    const enlace = enlaceReferencia(id);
    if (!enlace) return error("Ahora mismo no se puede pedir. Inténtalo más tarde.", 500);
    const ruta = `${userId}/referencia-${id}.pdf`;
    const { error: errorSubida } = await sb.storage.from("cvs").upload(ruta, bytes, { contentType: "application/pdf" });
    if (errorSubida) {
      console.error("[referencias] subida:", errorSubida.message);
      return error("No se pudo guardar la carta. Inténtalo de nuevo.", 500);
    }

    await crearReferencia({ id, userId, empresa, firmante, cargo, email, cartaRuta: ruta, cartaPublica });
    const enviado = await sendReferenciaConfirmarEmail({ to: email, firmante, candidato, empresa, cargo, enlace });
    if (!enviado) {
      await quitarReferencia(userId, id);
      await sb.storage.from("cvs").remove([ruta]);
      return error("No hemos podido escribir a ese correo. Revisa que esté bien escrito.", 502);
    }
    await apuntarPeticion(userId, email);
    return NextResponse.json({ ok: true, referencias: await referenciasDe(userId), premio });
  } catch (e) {
    console.error("[referencias] POST:", (e as Error).message);
    return error("No se pudo pedir la confirmación. Inténtalo de nuevo.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const sinVerificar = await correoSinVerificar(req);
  if (sinVerificar) return sinVerificar;
  const userId = await getUserId(req);
  if (!userId) return error("No autorizado", 401);
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return error("Falta la carta");
  try {
    const ruta = await quitarReferencia(userId, id);
    if (ruta === undefined) return error("Esa carta no está", 404);
    if (ruta) await admin().storage.from("cvs").remove([ruta]);
    return NextResponse.json({ ok: true, referencias: await referenciasDe(userId), premio });
  } catch (e) {
    console.error("[referencias] DELETE:", (e as Error).message);
    return error("No se pudo quitar", 500);
  }
}
