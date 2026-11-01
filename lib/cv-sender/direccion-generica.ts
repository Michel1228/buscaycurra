/**
 * lib/cv-sender/direccion-generica.ts
 * ¿Es una dirección genérica (empleo@, info@...)? Casi siempre son las deducidas.
 *
 * POR QUÉ (1 nov 2026). En una semana, de 19 CVs a estas direcciones rebotaron
 * 11; de 18 a las demás, 1. El servidor no sabe si una dirección se dedujo o se
 * encontró publicada, pero la forma lo dice casi siempre.
 */

// Al 3 %, el mismo en que avisa el centinela: el 4 % es donde Resend puede pausar
// todos los correos de la cuenta (lib/centinela/limites-correo.ts).
export const UMBRAL_FRENO_REBOTES = 3;

const GENERICAS = /^(empleo|empleos|trabajo|info|informacion|rrhh|hr|jobs|careers|talento|seleccion|contacto|recursoshumanos)$/i;

export function esDireccionGenerica(email: string): boolean {
  return GENERICAS.test(email.trim().split("@")[0] || "");
}
