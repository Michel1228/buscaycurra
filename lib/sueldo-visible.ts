/**
 * lib/sueldo-visible.ts — El sueldo de una oferta, dicho en español y con su moneda.
 *
 * POR QUÉ (prueba desde Colombia y México, 7 nov 2026). Las páginas /empleo
 * enseñaban el sueldo tal y como lo guarda la fuente: "9451 - 11000 per month"
 * o "156000 - 156000", en inglés y sin moneda. Quien lo lee no sabe si son
 * pesos, euros o dólares, ni si es al mes o al año.
 *
 * Solo se reescriben las formas simples (una cifra o un rango, con o sin el
 * periodo y la moneda). Si el texto dice algo más ("Salario competitivo",
 * "según convenio"), se deja tal cual: es mejor enseñarlo como viene que
 * inventarle un sentido.
 */
import { PAISES } from "@/lib/paises";

const PERIODOS: [RegExp, string][] = [
  [/\b(per|a|by the)\s+month\b|\bmonthly\b|\bal mes\b|\bpor mes\b|\bmensual(es)?\b|\/\s*mes\b/gi, "al mes"],
  [/\b(per|a|by the)\s+year\b|\b(per\s+)?annum\b|\byearly\b|\bannual(ly)?\b|\bal año\b|\bpor año\b|\banual(es)?\b|\/\s*año\b/gi, "al año"],
  [/\b(per|an?)\s+hour\b|\bhourly\b|\bla hora\b|\bpor hora\b|\/\s*h(ora)?\b/gi, "la hora"],
  [/\b(per|a)\s+week\b|\bweekly\b|\bsemanal(es)?\b|\ba la semana\b|\bpor semana\b/gi, "a la semana"],
  [/\b(per|a)\s+day\b|\bdaily\b|\bdiario\b|\bal día\b|\bpor día\b/gi, "al día"],
];

const CODIGOS = /\b(EUR|USD|MXN|COP|ARS|CLP|PEN|BRL|GBP|CHF|CAD|AUD|NZD|INR|ZAR|VES|NIO|HNL|GTQ|CRC|UYU|DOP|PAB|SEK|NOK|DKK|PLN|CZK|HUF|RON|JPY|SGD)\b/i;
const SIMBOLOS = /€|\$|£|₹|¥/g;

/** "11,000" o "11.000" → 11000; "9451.50" → 9451.5. null si no se entiende. */
function aNumero(t: string): number | null {
  if (/^\d{1,3}([.,]\d{3})+$/.test(t)) return Number(t.replace(/[.,]/g, ""));
  if (/^\d+([.,]\d{1,2})?$/.test(t)) return Number(t.replace(",", "."));
  if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(t)) return Number(t.replace(/\./g, "").replace(",", "."));
  if (/^\d{1,3}(,\d{3})+\.\d{1,2}$/.test(t)) return Number(t.replace(/,/g, ""));
  return null;
}

/** 9451 → "9.451" y 12.5 → "12,50", como se escriben las cifras en español. */
function conPuntos(n: number): string {
  const entero = Math.trunc(n);
  const miles = String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return Number.isInteger(n) ? miles : `${miles},${n.toFixed(2).split(".")[1]}`;
}

/**
 * "9451 - 11000 per month" en México → "9.451-11.000 MXN al mes".
 * `pais` es el de la oferta; sin él, la cifra va sin moneda (no se adivina).
 */
export function sueldoVisible(texto: string, pais?: string | null): string {
  const original = (texto || "").trim();
  if (!original) return original;

  let resto = original;
  let periodo = "";
  for (const [re, nombre] of PERIODOS) {
    if (re.test(resto)) { periodo = periodo || nombre; resto = resto.replace(re, " "); }
    re.lastIndex = 0;
  }
  const codigo = (resto.match(CODIGOS)?.[1] || "").toUpperCase();
  const simboloEscrito = resto.match(SIMBOLOS)?.[0] || "";
  resto = resto.replace(CODIGOS, " ").replace(SIMBOLOS, " ");

  const cifras = resto.match(/\d[\d.,]*\d|\d/g) || [];
  // Lo que queda, sin las cifras ni los guiones, tiene que estar vacío: si
  // hay más palabras, el texto dice algo que no sabemos reescribir.
  const sobra = resto.replace(/\d[\d.,]*\d|\d/g, " ").replace(/\s+(-|–|a|to|hasta)\s+|^\s*(de|desde|from)\s+|[-–]/gi, " ").trim();
  if (sobra || cifras.length === 0 || cifras.length > 2) return original;
  const numeros = cifras.map(aNumero);
  if (numeros.some((n) => n === null || n <= 0)) return original;

  const [a, b] = numeros as number[];
  const cifra = b === undefined || a === b ? conPuntos(a) : `${conPuntos(a)}-${conPuntos(b)}`;
  // La moneda: la que diga el texto con su código; si no, la del país de la
  // oferta ("$" en México son pesos); si no sabemos el país, el símbolo que
  // traía el texto, tal cual. Nunca una inventada.
  const monedaPais = PAISES[(pais || "").toUpperCase()]?.moneda;
  const moneda = codigo || monedaPais || "";
  const simbolo = moneda === "EUR" ? "€" : moneda || simboloEscrito;
  return [cifra, simbolo, periodo].filter(Boolean).join(" ");
}
