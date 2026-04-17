"use client";

/**
 * components/SplashWrapper.tsx — Envoltorio de la Splash Screen
 *
 * Muestra la SplashScreen solo en la primera visita del usuario
 * (comprueba localStorage para no repetirla).
 * Es un componente cliente, necesario porque usa localStorage y useState.
 */

import { useState, useEffect } from "react";
import SplashScreen from "./SplashScreen";

const SPLASH_KEY = "buscaycurra_splash_shown";

export default function SplashWrapper() {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    // Only show if not seen before (useEffect always runs in the browser)
    if (!localStorage.getItem(SPLASH_KEY)) {
      setMostrar(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(SPLASH_KEY, "1");
    setMostrar(false);
  };

  if (!mostrar) return null;

  return <SplashScreen onComplete={handleComplete} />;
}
