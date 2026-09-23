/**
 * lib/promesas.ts — Las cifras que la aplicación promete por ahí fuera.
 *
 * POR QUÉ EXISTE. El correo de bienvenida decía "más de 148.000 ofertas activas
 * en España". El 23 sep 2026 había 38.576. Nadie mintió a propósito: el número
 * se escribió a mano cuando era cierto y ahí se quedó mientras la realidad
 * cambiaba. Lo recibía cada persona que se registraba.
 *
 * CÓMO FUNCIONA ESTO AHORA
 *
 *  - Las cifras se declaran AQUÍ, una sola vez, y siempre por debajo de lo real,
 *    con margen para que un día flojo no convierta la frase en mentira.
 *  - El control 15 del centinela compara estos números con la base de datos cada
 *    mañana y avisa por correo si alguno deja de ser cierto.
 *
 * Al subir una cifra, mirar antes el dato real (no al revés).
 */

/** Ofertas activas en España. Real a 23 sep 2026: 38.576. */
export const OFERTAS_ESPANA = 30000;

/** Ofertas activas en los 26 países. Real a 23 sep 2026: 2.380.049. */
export const OFERTAS_TOTALES = 1500000;

/** "30.000", "1.500.000" — con el punto de los miles como se escribe en español. */
export function enEspanol(numero: number): string {
  return numero.toLocaleString("es-ES");
}

/** La frase tal cual se usa en el correo de bienvenida y donde haga falta. */
export function frasePromesaOfertas(): string {
  return `más de ${enEspanol(OFERTAS_ESPANA)} ofertas activas en España`;
}
