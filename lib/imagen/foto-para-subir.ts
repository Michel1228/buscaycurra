/**
 * lib/imagen/foto-para-subir.ts — La foto del móvil, a un tamaño que se pueda subir.
 *
 * POR QUÉ (21 oct 2026, antes de una presentación). La foto del CV no podía
 * pasar de 3 MB y la de au pair de 5, y una foto hecha con el móvil pesa entre
 * 3 y 6: "La imagen no puede superar 3 MB" justo al enseñarlo. Para un CV
 * sobra con 1.200 px; en JPEG se queda en unos 200 KB y el PDF también pesa menos.
 * La cámara de Guzzi ya lo hacía (reducirFoto en components/GusiChat.tsx).
 *
 * Si el navegador no sabe dibujarla (un formato raro), se devuelve tal cual y
 * decide el servidor.
 */
export async function fotoParaSubir(file: File, ladoMax = 1200, calidad = 0.85): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, mal) => {
      const i = document.createElement("img");
      i.onload = () => ok(i);
      i.onerror = () => mal(new Error("no se puede dibujar"));
      i.src = url;
    });
    const escala = Math.min(1, ladoMax / Math.max(img.naturalWidth, img.naturalHeight));
    // Ya pequeña y en JPEG: no se toca.
    if (escala === 1 && file.type === "image/jpeg" && file.size <= 1024 * 1024) return file;
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(img.naturalWidth * escala);
    lienzo.height = Math.round(img.naturalHeight * escala);
    const ctx = lienzo.getContext("2d");
    if (!ctx) return file;
    // Fondo blanco: un PNG con transparencia saldría negro en JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
    const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, "image/jpeg", calidad));
    if (!blob) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "foto"}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
