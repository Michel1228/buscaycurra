/**
 * lib/auth/destino.ts — A dónde volver después de registrarse o entrar.
 *
 * Quien llega de Google y pulsa un botón que lleva dentro de la app
 * ("Buscar ofertas en Suecia") no tiene cuenta: antes acababa en "Bienvenido
 * de vuelta" (el login) y se iba (18 oct 2026). Ahora va al registro con el
 * destino, que se guarda en la cuenta y se respeta al confirmar el correo.
 *
 * Solo rutas de la app: "/app/..." sin "//" ni barras invertidas, para que
 * nadie use estos enlaces para mandar a la gente a otra web.
 */
export function destinoSeguro(v: unknown): string | null {
  if (typeof v !== "string" || v.length > 300) return null;
  if (!v.startsWith("/app/") || v.includes("//") || v.includes("\\") || /[\r\n]/.test(v)) return null;
  return v;
}

/** Cookie que dice "en este dispositivo ya ha habido una cuenta": login, no registro. */
export const COOKIE_CUENTA = "bc_cuenta";

/** Se pone al entrar o al confirmar el correo. Un año. */
export function marcarQueTieneCuenta(): void {
  try {
    document.cookie = `${COOKIE_CUENTA}=1; path=/; max-age=31536000; SameSite=Lax`;
  } catch { /* sin cookies, el login sigue funcionando igual */ }
}
