/**
 * lib/salarios/anual.ts
 * Sueldos ANUALES en euros sacados del texto libre de las ofertas.
 *
 * POR QUÉ. Las estadísticas se calculaban en SQL con expresiones regulares que
 * no aguantaban los formatos reales. El 30 sep 2026, "camarero" en España daba
 * mínimo 144 € y máximo 95 €: la del máximo tenía un `.*` voraz que solo dejaba
 * las dos últimas cifras ("18.000 - 22.095" → 95). Y aunque se leyeran bien, la
 * media no resiste la basura de algunos portales: hay "camarero de barra" a
 * 72.000–90.000 €, que la subía de 20.500 € (lo real) a 30.481 €.
 *
 * Aquí se lee cada texto uno a uno y se resume con la mediana y la mitad
 * central de las ofertas, que no se mueven por cuatro cifras absurdas.
 */

export interface RangoAnual {
  min: number;
  max: number;
}

// Fuera de esto no es un sueldo anual real en España: o es mensual/por horas
// escrito sin unidad, o es basura del portal.
const ANUAL_MIN = 8000;
const ANUAL_MAX = 200000;

/** Los números del texto, entendiendo "18.000", "24,000", "26711.82" y "11,85". */
function numerosDelTexto(t: string): number[] {
  return (t.match(/\d[\d.,]*/g) || [])
    .map((n) => {
      const limpio = /^\d{1,3}([.,]\d{3})+$/.test(n)
        ? n.replace(/[.,]/g, "")                 // separador de miles
        : n.replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
      return parseFloat(limpio);
    })
    .filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * Rango anual en euros, o null si el texto no es un sueldo anual en euros.
 * Los sueldos por hora, día, semana o mes se descartan en vez de convertirlos:
 * un mes puede ser de 12 o de 14 pagas, y una hora depende de la jornada.
 */
export function salarioAnualEuros(texto: string | null | undefined): RangoAnual | null {
  if (!texto) return null;
  const t = texto.replace(/&euro;/gi, "€").toLowerCase();
  if (/[$£¥]|\b(usd|gbp|chf|pln|sek|nok|dkk|czk|huf|ron)\b/.test(t)) return null;
  if (/hour|hora|\/h\b|month|\bmes|mensual|week|semana|\bday\b|\bd[ií]a/.test(t)) return null;
  const numeros = numerosDelTexto(t);
  if (numeros.length === 0) return null;
  const min = Math.min(...numeros);
  const max = Math.max(...numeros);
  if (min < ANUAL_MIN || max > ANUAL_MAX) return null;
  return { min, max };
}

export interface ResumenSalarios {
  /** Ofertas con un sueldo anual legible. */
  conSalario: number;
  /** Mediana: la mitad cobra menos y la otra mitad más. */
  tipico: number;
  /** Percentil 25 y 75: entre los dos está la mitad central de las ofertas. */
  bajo: number;
  alto: number;
}

export function resumirSalarios(textos: Array<string | null | undefined>): ResumenSalarios | null {
  const medios = textos
    .map(salarioAnualEuros)
    .filter((r): r is RangoAnual => r !== null)
    .map((r) => (r.min + r.max) / 2)
    .sort((a, b) => a - b);
  if (medios.length === 0) return null;
  const percentil = (p: number) => Math.round(medios[Math.round((medios.length - 1) * p)]);
  return {
    conSalario: medios.length,
    tipico: percentil(0.5),
    bajo: percentil(0.25),
    alto: percentil(0.75),
  };
}
