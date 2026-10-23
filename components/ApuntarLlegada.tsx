"use client";

import { useEffect } from "react";
import { apuntarLlegada } from "@/lib/origen/llegada";

/** Apunta en memoria de qué web llega la persona (lib/origen/llegada.ts). No pinta nada. */
export default function ApuntarLlegada() {
  useEffect(() => { apuntarLlegada(); }, []);
  return null;
}
