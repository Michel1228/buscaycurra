/**
 * lib/onboarding/pedir-bienvenida.ts (navegador)
 * Pide al servidor la bienvenida de la cuenta: ficha, ciudad, alerta y correo.
 *
 * SE PIDE EN DOS SITIOS: al confirmar el correo y al entrar con la contraseña.
 * Hasta el 3 oct 2026 solo se pedía al confirmar, y la confirmación falla en el
 * caso más normal del móvil: te registras en la app y abres el correo en Gmail,
 * que abre el enlace en OTRO navegador. El enlace es PKCE y solo funciona en el
 * navegador donde te registraste, así que la persona veía "Algo no fue bien" y
 * nunca llegaba la bienvenida (2 de las 10 cuentas de esa semana). Al entrar con
 * su contraseña ya sí la recibe.
 *
 * El servidor la hace una sola vez por cuenta (app_metadata.bienvenida_en), así
 * que pedirla de más no hace daño. No espera respuesta ni muestra errores: la
 * entrada no puede quedarse colgada por esto.
 */
export function pedirBienvenida(accessToken: string | undefined | null): void {
  if (!accessToken) return;
  fetch("/api/auth/welcome", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: "{}",
    keepalive: true,
  }).catch(() => { /* se reintenta en la próxima entrada */ });
}
