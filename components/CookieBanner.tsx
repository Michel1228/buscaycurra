/**
 * components/CookieBanner.tsx — Banner de consentimiento de cookies (RGPD)
 *
 * Aparece en la primera visita si el usuario no ha tomado una decisión
 * sobre las cookies. Se muestra en la parte inferior de la pantalla.
 *
 * Opciones:
 *   - "Aceptar": guarda cookie-consent=accepted en localStorage por 1 año.
 *   - "Solo necesarias": guarda cookie-consent=necessary en localStorage por 1 año.
 *
 * Una vez elegida una opción, el banner no vuelve a aparecer.
 * Colores de marca: azul #2563EB y naranja #F97316.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Banner de Cookies ────────────────────────────────────────────────────────

export default function CookieBanner() {
  // Estado que controla si el banner es visible
  const [visible, setVisible] = useState(false);

  // Al montar el componente, comprobamos si el usuario ya tomó una decisión
  useEffect(() => {
    const consentimiento = localStorage.getItem("cookie-consent");
    // Si no hay consentimiento guardado, mostramos el banner
    if (!consentimiento) {
      setVisible(true);
    }
  }, []);

  // Función para aceptar todas las cookies
  function aceptarCookies() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  // Función para aceptar solo las cookies necesarias
  function soloNecesarias() {
    localStorage.setItem("cookie-consent", "necessary");
    setVisible(false);
  }

  // Si no hay que mostrar el banner, no renderizamos nada
  if (!visible) return null;

  return (
    // Banner fijo en la parte inferior de la pantalla, ancho completo
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
      role="dialog"
      aria-live="polite"
      aria-label="Banner de consentimiento de cookies"
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        {/* Texto del banner */}
        <div className="flex-1 text-sm text-gray-600">
          <p>
            Usamos cookies necesarias para el funcionamiento del servicio. No
            usamos cookies publicitarias.{" "}
            {/* Enlace a la política de cookies completa */}
            <Link
              href="/cookies"
              className="font-medium underline hover:no-underline"
              style={{ color: "#2563EB" }}
            >
              Más información
            </Link>
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Botón "Solo necesarias" — borde gris, texto oscuro */}
          <button
            onClick={soloNecesarias}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Solo necesarias
          </button>

          {/* Botón "Aceptar" — fondo azul de marca */}
          <button
            onClick={aceptarCookies}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
            style={{ backgroundColor: "#2563EB" }}
          >
            Aceptar
          </button>
        </div>

      </div>
    </div>
  );
}
