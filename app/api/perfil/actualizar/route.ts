/**
 * POST /api/perfil/actualizar — Guardar los datos personales del usuario.
 *
 * POR QUÉ EXISTE. La página de perfil escribía directamente en la tabla
 * `profiles` desde el navegador, con la clave anónima. Eso dejó de funcionar
 * cuando se blindó la tabla (migración 012) para que nadie pudiera cambiarse el
 * plan desde el navegador: ahora esa escritura devuelve
 *
 *   {"code":"42501","message":"permission denied for table profiles"} → HTTP 403
 *
 * Reproducido el 18 de agosto de 2026 con un usuario de prueba real. Lo grave
 * es que la pantalla decía "Guardado" igualmente, porque el código no miraba el
 * error que devuelve Supabase y tenía un `catch` vacío. Un usuario de iPhone lo
 * reportó: escribía su nombre, veía que se guardaba, salía, y no estaba.
 *
 * La solución NO es volver a abrir los permisos de la tabla — eso desharía el
 * blindaje. Es que el guardado pase por aquí, donde el servidor usa la clave de
 * servicio y decide exactamente qué campos se pueden tocar.
 *
 * NUNCA se escriben `plan`, `subscription_status`, `stripe_customer_id` ni nada
 * relacionado con el pago, aunque vengan en la petición. Esos solo los cambian
 * los webhooks de Stripe y RevenueCat.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/** Lo único que el usuario puede cambiar de su propio perfil. */
const CAMPOS_PERMITIDOS = [
  "full_name",
  "phone",
  "ciudad",
  "provincia",
  "codigo_postal",
  "sector",
] as const;

/** Tope de caracteres por campo, para que nadie meta un libro en la columna. */
const MAX_LARGO = 200;

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Petición mal formada" }, { status: 400 });
  }

  // Se copia campo a campo desde la lista blanca. Lo que no esté en ella se
  // ignora en silencio: da igual lo que mande el cliente.
  const cambios: Record<string, string> = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    const valor = body[campo];
    if (typeof valor !== "string") continue;
    const limpio = valor.trim().slice(0, MAX_LARGO);
    cambios[campo] = limpio;
  }

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "No hay nada que guardar" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // El id sale de la sesión, NUNCA del cuerpo de la petición: si viniera de
  // ahí, cualquiera podría editar el perfil de otro.
  const { error } = await supabase
    .from("profiles")
    .update({ ...cambios, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("[perfil/actualizar]", error.message);
    return NextResponse.json(
      { error: "No se ha podido guardar. Inténtalo de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, guardado: Object.keys(cambios) });
}
