/**
 * lib/auth/sugerencia-correo.ts
 * "¿Querías decir …@gmail.com?" cuando el correo del registro tiene una errata.
 *
 * POR QUÉ (20 oct 2026). De las 56 cuentas sin confirmar, el correo de 3 había
 * rebotado y había direcciones en gmaill.com y gail.com: el correo de
 * confirmación nunca podía llegar. Solo se sugiere, nunca se cambia solo.
 */

const COMUNES = [
  "gmail.com", "hotmail.com", "hotmail.es", "outlook.com", "outlook.es",
  "yahoo.com", "yahoo.es", "icloud.com", "live.com",
];

// Existen de verdad aunque se parezcan a uno de los de arriba.
const VALIDOS = new Set([
  ...COMUNES, "mail.com", "email.com", "gmx.com", "gmx.es", "ymail.com", "me.com", "mac.com",
  "msn.com", "aol.com", "proton.me", "protonmail.com", "telefonica.net", "movistar.es",
  // Los de Microsoft y Yahoo de otros países, de la gente que viene de fuera.
  "live.es", "live.fr", "live.it", "live.de", "live.nl", "live.be", "live.ca",
  "hotmail.fr", "hotmail.it", "hotmail.de", "hotmail.be", "outlook.fr", "outlook.it", "outlook.de", "outlook.pt",
  "yahoo.fr", "yahoo.it", "yahoo.de", "yahoo.ca",
]);

// gmail.es no existe y es la errata más típica en España.
const FIJOS: Record<string, string> = { "gmail.es": "gmail.com", "googlemail.es": "gmail.com" };

function distancia(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const arriba = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = arriba;
    }
  }
  return fila[b.length];
}

/** El correo corregido, o null si no hay nada que sugerir. */
export function sugerenciaCorreo(email: string): string | null {
  const limpio = email.trim().toLowerCase();
  const arroba = limpio.lastIndexOf("@");
  if (arroba < 1) return null;
  const usuario = limpio.slice(0, arroba);
  const dominio = limpio.slice(arroba + 1).replace(/\.con$|\.cpm$|\.cm$|\.co$|\.om$/, ".com");
  if (!dominio.includes(".")) return null;
  if (FIJOS[dominio]) return `${usuario}@${FIJOS[dominio]}`;
  if (VALIDOS.has(dominio)) return dominio === limpio.slice(arroba + 1) ? null : `${usuario}@${dominio}`;
  let mejor: string | null = null, menor = 3;
  for (const c of COMUNES) {
    const d = distancia(dominio, c);
    if (d < menor) { menor = d; mejor = c; }
  }
  return mejor ? `${usuario}@${mejor}` : null;
}
