/**
 * lib/entrevistas/feedback.ts — La respuesta del entrevistador, en tres casillas.
 *
 * El modelo contesta con tres líneas (BIEN, PULIR, DILO ASÍ). Se separan aquí
 * para pintarlas como casillas; si falta alguna, devuelve null y la pantalla
 * enseña el texto tal cual, que siempre es mejor que una casilla vacía.
 */

export interface PartesFeedback {
  bien: string;
  pulir: string;
  diloAsi: string;
}

export function partesDelFeedback(texto: string): PartesFeedback | null {
  const partes: Partial<PartesFeedback> = {};
  for (const linea of String(texto || "").split("\n")) {
    // Tolera negritas de markdown y la tilde que a veces se come: **BIEN:**, DILO ASI:
    const m = linea.replace(/\*\*/g, "").match(/^\s*[-•]?\s*(BIEN|PULIR|DILO AS[IÍ])\s*:\s*(.+?)\s*$/i);
    if (!m) continue;
    const clave = m[1].toUpperCase().startsWith("DILO") ? "diloAsi" : m[1].toUpperCase() === "BIEN" ? "bien" : "pulir";
    // Fuera comillas y caracteres invisibles que a veces cuela el modelo.
    if (!partes[clave]) partes[clave] = m[2].replace(/[​-‍﻿]/g, "").trim().replace(/^["«]|["»]$/g, "").trim();
  }
  return partes.bien && partes.pulir && partes.diloAsi ? (partes as PartesFeedback) : null;
}
