/**
 * lib/cv-generator/html-guardado.ts
 * El CV montado que se guarda en la columna "html" de user_cvs.
 *
 * LO MONTA EL SERVIDOR, NO QUIEN LLAMA. La columna se rellenaba con lo que
 * mandara cada pantalla, y dos de ellas (el autoguardado del editor y la subida
 * del CV a través de Guzzi) mandaban JSON.stringify(datos): los 52 CV guardados
 * tenían texto en bruto en vez del CV, y la pantalla de CVs guardados descargaba
 * eso (2 oct 2026). Montándolo aquí desde los datos, con la misma conversión que
 * el editor y que el envío a empresas, ninguna pantalla —de ahora o futura—
 * puede volver a guardarlo mal.
 */
import { generarCV } from "./plantillas";
import { normalizar } from "./normalizar";

/** El CV montado a partir de los datos del formulario, o "" si no hay datos. */
export function htmlDelCV(datos: unknown): string {
  if (!datos || typeof datos !== "object") return "";
  try {
    return generarCV(normalizar(datos as Record<string, unknown>));
  } catch (e) {
    console.error("[htmlDelCV] no se pudo montar el CV:", (e as Error).message);
    return "";
  }
}
