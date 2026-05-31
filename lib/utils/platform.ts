/**
 * Detecta si la app corre dentro de un wrapper nativo de Capacitor en iOS.
 * Usado para aplicar el modelo "Reader" de Apple (sin botones de compra in-app).
 */
export function isNativeIOS(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as any).Capacitor;
  return !!(cap?.isNativePlatform?.() && cap?.getPlatform?.() === "ios");
}
