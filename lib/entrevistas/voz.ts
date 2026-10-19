/**
 * lib/entrevistas/voz.ts — La voz del entrevistador en el navegador.
 *
 * Reproduce los audios grabados (public/voz/entrevista/<id>.mp3) uno detrás de
 * otro con UN SOLO elemento de audio. Es a propósito: el iPhone solo deja sonar
 * audio que empieza con un toque, y un elemento que ya ha sonado así puede
 * volver a sonar después sin otro toque (tras analizar una respuesta, por
 * ejemplo). Con un elemento nuevo cada vez, el segundo audio se quedaba mudo.
 *
 * Si un audio no carga, se lee ese texto con la voz del propio móvil.
 */

export interface Clip {
  id: string;
  texto: string;
}

let audio: HTMLAudioElement | null = null;
let cola: Clip[] = [];
let alAcabar: (() => void) | null = null;

function elemento(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.preload = "auto";
  }
  return audio;
}

function terminar() {
  const f = alAcabar;
  alAcabar = null;
  cola = [];
  f?.();
}

function leerConElMovil(texto: string, luego: () => void) {
  try {
    const s = window.speechSynthesis;
    if (!s) { luego(); return; }
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-ES";
    u.rate = 0.95;
    u.onend = luego;
    u.onerror = luego;
    s.speak(u);
  } catch {
    luego();
  }
}

function siguiente() {
  const c = cola.shift();
  if (!c) { terminar(); return; }
  const a = elemento();
  a.onended = siguiente;
  a.onerror = () => leerConElMovil(c.texto, siguiente);
  a.src = `/voz/entrevista/${c.id}.mp3`;
  // Si el navegador no deja sonar (no ha habido ningún toque todavía), se
  // queda en silencio: el texto sigue en pantalla y el altavoz lo repite.
  a.play().catch((e: unknown) => {
    if ((e as Error)?.name !== "AbortError") terminar();
  });
}

/** Dice los clips en orden. `fin` se llama al acabar o al pararlo. */
export function hablar(clips: Clip[], fin?: () => void) {
  parar();
  cola = [...clips];
  alAcabar = fin ?? null;
  siguiente();
}

export function parar() {
  const f = alAcabar;
  alAcabar = null;
  cola = [];
  if (audio) {
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
  }
  try { window.speechSynthesis?.cancel(); } catch { /* sin voz del móvil */ }
  f?.();
}
