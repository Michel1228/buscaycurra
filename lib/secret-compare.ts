/**
 * lib/secret-compare.ts — Comparación de secrets en tiempo constante
 *
 * Un `===` normal se corta en el primer byte distinto: midiendo tiempos de
 * respuesta, un atacante puede adivinar el secret carácter a carácter (timing
 * attack). Aquí se comparan los SHA-256 de ambos valores con timingSafeEqual:
 * tiempo constante e independiente de la longitud, sin filtrar ni siquiera si
 * las longitudes coinciden.
 */
import { createHash, timingSafeEqual } from "crypto";

export function secretIguales(recibido: string | null | undefined, esperado: string | null | undefined): boolean {
  if (!recibido || !esperado) return false;
  const a = createHash("sha256").update(recibido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}
