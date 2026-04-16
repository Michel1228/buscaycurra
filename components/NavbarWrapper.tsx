"use client";

/**
 * components/NavbarWrapper.tsx — Muestra la Navbar solo en rutas /app/*
 *
 * Usa usePathname() para detectar si estamos en el panel del usuario.
 * En la landing page y páginas de auth no se muestra la Navbar.
 */

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const ruta = usePathname();

  // Solo mostrar la Navbar dentro del panel de usuario (/app/*)
  if (!ruta.startsWith("/app/")) return null;

  return <Navbar />;
}
