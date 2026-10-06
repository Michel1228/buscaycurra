/**
 * lib/job-search/salario-sql.ts
 * El sueldo mínimo de una oferta, en SQL, a partir del texto de "salary".
 *
 * Se queda con el PRIMER número (el mínimo del rango) después de quitar los
 * separadores de miles. Antes se borraba todo lo que no fuera dígito y se
 * pegaba el resto: "30000 - 30000" daba 3000030000 y el filtro de salario
 * dejaba pasar de todo. Ver el comentario largo en app/api/jobs/search.
 *
 * Vive aquí, y no dentro del buscador, para que el centinela pruebe la MISMA
 * fórmula que usa el filtro (antes llevaba una copia).
 *
 * `columna` es el nombre de la columna o una expresión SQL ya escapada.
 */
export function salarioMinimoSql(columna = "salary"): string {
  return `NULLIF(substring(
      regexp_replace(regexp_replace(${columna}, '([0-9])[.,]([0-9]{3})', '\\1\\2', 'g'),
                     '([0-9])[.,]([0-9]{3})', '\\1\\2', 'g')
      from '[0-9]+'), '')::bigint`;
}

/** Textos reales de la base con el número que tiene que salir. */
export const CASOS_SALARIO: Array<[string, number]> = [
  ["30000 - 30000", 30000],
  ["1.500 - 2.000 €/mes", 1500],
  ["25,000 - 30,000", 25000],
  ["£100,000 - 100,000", 100000],
  ["€26000 per year", 26000],
  ["1.234.567 - 1.500.000", 1234567],
];
