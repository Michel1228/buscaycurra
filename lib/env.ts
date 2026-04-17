/**
 * lib/env.ts — Validación de variables de entorno
 *
 * Comprueba que las variables requeridas estén configuradas
 * antes de que la app intente usarlas y falle silenciosamente.
 *
 * Uso: importar en los entry points (layout.tsx, API routes, worker)
 *   import { validateEnv } from "@/lib/env";
 *   validateEnv();
 */

// ─── Variables requeridas según contexto ──────────────────────────────────────

/** Variables de entorno requeridas para que la app funcione */
const REQUIRED_SERVER_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

/** Variables opcionales pero recomendadas (se advierte si faltan) */
const RECOMMENDED_VARS = [
  "GROQ_API_KEY",
  "GEMINI_API_KEY",
  "STRIPE_SECRET_KEY",
  "REDIS_URL",
  "RESEND_API_KEY",
] as const;

// ─── Función de validación ────────────────────────────────────────────────────

let _validated = false;

/**
 * Valida que las variables de entorno requeridas estén configuradas.
 * Solo se ejecuta una vez; las llamadas posteriores no hacen nada.
 *
 * @throws Error si falta alguna variable requerida (solo en producción)
 */
export function validateEnv(): void {
  // Solo validar una vez
  if (_validated) return;
  _validated = true;

  const missing: string[] = [];
  const warnings: string[] = [];

  // Comprobar variables requeridas
  for (const key of REQUIRED_SERVER_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Comprobar variables recomendadas (solo avisar)
  for (const key of RECOMMENDED_VARS) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  // Mostrar avisos de variables recomendadas que faltan
  if (warnings.length > 0) {
    console.warn(
      `⚠️  BuscayCurra: variables de entorno recomendadas sin configurar: ${warnings.join(", ")}. ` +
      `Algunas funcionalidades pueden no estar disponibles.`
    );
  }

  // Si faltan variables requeridas, fallar
  if (missing.length > 0) {
    const mensaje =
      `❌ BuscayCurra: faltan variables de entorno obligatorias: ${missing.join(", ")}. ` +
      `Copia .env.example a .env.local y configúralas.`;

    if (process.env.NODE_ENV === "production") {
      throw new Error(mensaje);
    } else {
      console.error(mensaje);
    }
  }
}
