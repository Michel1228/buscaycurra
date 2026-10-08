/**
 * lib/onboarding/oficio.ts — El oficio que busca la persona, en user_contacts.
 *
 * POR QUÉ. El 8 oct 2026, de las 32 personas con alerta de empleo, 23 no
 * tenían oficio en ningún sitio: la alerta se crea solo con la ciudad y el CV,
 * si lo hay, a veces no tiene subtítulo. Sin oficio, el correo de ofertas no
 * puede decirle qué curso le piden, y Guzzi no sabe por dónde empezar. Ahora se
 * pregunta al registrarse (opcional) y se guarda aquí.
 *
 * Va en user_contacts (base propia) y no en profiles (Supabase): la columna se
 * crea sola desde el código, sin migraciones a mano en otro panel, y es la
 * tabla que ya lee el correo de ofertas.
 */
import type { Pool } from "pg";

let columnaLista = false;

export async function asegurarColumnaOficio(pool: Pool): Promise<void> {
  if (columnaLista) return;
  await pool.query(`ALTER TABLE user_contacts ADD COLUMN IF NOT EXISTS oficio TEXT`);
  columnaLista = true;
}

/** Lo que escribe la persona, limpio y con un tope razonable. */
export function limpiarOficio(texto: string | null | undefined): string {
  return (texto ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
}
