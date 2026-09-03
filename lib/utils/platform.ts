/**
 * Detecta si la app corre dentro de un wrapper nativo de Capacitor en iOS.
 * Usado para aplicar el modelo "Reader" de Apple (sin botones de compra in-app).
 */
export function isNativeIOS(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as any).Capacitor;
  return !!(cap?.isNativePlatform?.() && cap?.getPlatform?.() === "ios");
}

/**
 * ¿Corremos dentro del envoltorio nativo de Capacitor, en iOS o en Android?
 *
 * Hace falta para el microfono. La Web Speech API SI esta expuesta dentro del
 * WebView de iOS —`webkitSpeechRecognition` existe— pero NO FUNCIONA: es el
 * fallo 239816 de WebKit. O sea que detectar la API y darla por buena manda al
 * usuario a un callejon sin salida, que es justo lo que pasaba. Dentro de la
 * app nativa hay que usar el plugin nativo, no la API del navegador.
 */
export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as any).Capacitor;
  return !!cap?.isNativePlatform?.();
}

/** "ios" | "android" | "web" */
export function plataforma(): string {
  if (typeof window === "undefined") return "web";
  return (window as any).Capacitor?.getPlatform?.() || "web";
}
