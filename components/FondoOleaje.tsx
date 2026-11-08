"use client";

/**
 * components/FondoOleaje.tsx — El fondo de todas las pantallas (app y web).
 *
 * Lo pidió Michel (7 y 8 nov 2026): "destellos de colores entre verde y negro
 * que se funden, como un efecto oleaje", "que se vea de calidad, como los
 * fondos de pantalla de los móviles". La primera versión (solo CSS, ciclos de
 * 40-90 s) casi no se veía moverse y se notaba dibujada.
 *
 * AHORA ES UN SHADER WebGL PEQUEÑO, escrito aquí (sin librerías):
 *  - luz verde y lima que fluye despacio sobre negro (ruido con "domain
 *    warping", que es lo que da ese aspecto de líquido), con degradados muy
 *    suaves y un poco de ruido de dithering para que no salgan bandas;
 *  - líneas finas en dos ángulos, como facetas de un diamante, que solo se
 *    encienden cuando pasa por encima la luz (un barrido cada ~14 s);
 *  - el centro más oscuro, que es donde va el texto.
 *
 * COSTE. Se pinta a media resolución (o menos: como mucho ~350.000 píxeles) y
 * el navegador lo escala, que en degradados suaves no se nota; a 30 fps como
 * máximo, y se para con la pestaña oculta o la app en segundo plano. Nada en
 * el servidor.
 *
 * SI NO HAY WebGL (o se pierde el contexto) quedan las capas CSS de debajo,
 * que también se mueven (ciclos de 12-20 s). Con "reducir movimiento" del
 * sistema se pinta UN fotograma y se queda quieto: la imagen fija es la misma
 * composición, así que sigue siendo bonita.
 *
 * Lo monta AppNavWrapper (en /app/*) y las páginas públicas. Va detrás de todo
 * (z-index -1) y no recibe toques.
 */
import { useEffect, useRef } from "react";

const VERTICE = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAGMENTO = `
precision mediump float;
uniform vec2 r;
uniform float t;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), u.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * n(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * r) / r.y;
  float T = t * 0.07;
  // Luz que fluye: el ruido deformado por otro ruido (domain warping).
  vec2 q = vec2(fbm(p * 1.25 + vec2(0.0, T)), fbm(p * 1.25 + vec2(5.2, -T * 0.8)));
  vec2 w = p + 1.1 * q + vec2(0.3 * sin(T * 2.1), 0.25 * cos(T * 1.6));
  float f = fbm(w * 1.5 + vec2(T * 0.9, -T * 0.4));
  float brillo = pow(clamp(f * 1.35 - 0.18, 0.0, 1.0), 2.6);
  float cinta = smoothstep(0.42, 0.62, f) * (1.0 - smoothstep(0.62, 0.86, f));
  // El centro, más oscuro: ahí va el texto.
  float centro = 1.0 - 0.62 * exp(-dot(p * vec2(0.9, 1.15), p * vec2(0.9, 1.15)) * 2.2);
  vec3 verde = vec3(0.10, 0.62, 0.30);
  vec3 lima  = vec3(0.64, 0.90, 0.21);
  vec3 luz = mix(verde, lima, smoothstep(0.35, 0.75, q.x));
  vec3 col = vec3(0.010, 0.017, 0.014) + luz * (0.55 * brillo + 0.22 * cinta) * centro;
  // Facetas de diamante: rayas finas en dos ángulos que se encienden al pasar la luz.
  float d1 = abs(fract(dot(p, vec2(0.894, 0.447)) * 7.0) - 0.5);
  float d2 = abs(fract(dot(p, vec2(-0.316, 0.949)) * 5.0) - 0.5);
  float lineas = max(smoothstep(0.035, 0.0, d1), 0.8 * smoothstep(0.03, 0.0, d2));
  float pos = fract(t / 14.0) * 3.4 - 1.7;
  float barrido = smoothstep(0.45, 0.0, abs(dot(p, vec2(0.6, 0.8)) - pos));
  col += vec3(0.80, 1.0, 0.55) * lineas * (0.55 * barrido + 0.18 * brillo) * 0.32 * centro;
  // Dithering: un pelo de ruido para que los degradados no hagan escalones.
  col += (h(gl_FragCoord.xy + fract(t * 7.0)) - 0.5) / 160.0;
  gl_FragColor = vec4(col, 1.0);
}`;

/** Prepara WebGL y devuelve una función para pintar en el instante t, o null. */
function prepararShader(lienzo: HTMLCanvasElement): ((t: number) => void) | null {
  const gl = lienzo.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false });
  if (!gl) return null;
  const compilar = (tipo: number, fuente: string) => {
    const s = gl.createShader(tipo);
    if (!s) return null;
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = compilar(gl.VERTEX_SHADER, VERTICE);
  const fs = compilar(gl.FRAGMENT_SHADER, FRAGMENTO);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, "r");
  const uT = gl.getUniformLocation(prog, "t");
  return (t: number) => {
    gl.viewport(0, 0, lienzo.width, lienzo.height);
    gl.uniform2f(uR, lienzo.width, lienzo.height);
    gl.uniform1f(uT, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}

const FPS_MAX = 30;
const PIXELES_MAX = 350_000;

export default function FondoOleaje() {
  const capa = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const raiz = document.documentElement;
    document.body.classList.add("con-oleaje");
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");
    const c = lienzo.current;
    const pintar = c ? prepararShader(c) : null;

    let animacion = 0;
    let ultimo = 0;
    const inicio = performance.now();

    const medir = () => {
      if (!c) return;
      const ancho = window.innerWidth, alto = window.innerHeight;
      const escala = Math.min(0.5, Math.sqrt(PIXELES_MAX / Math.max(1, ancho * alto)));
      c.width = Math.max(1, Math.round(ancho * escala));
      c.height = Math.max(1, Math.round(alto * escala));
    };

    const fotograma = (ahora: number) => {
      animacion = requestAnimationFrame(fotograma);
      if (ahora - ultimo < 1000 / FPS_MAX - 2) return;
      ultimo = ahora;
      pintar?.((ahora - inicio) / 1000);
    };
    const parar = () => { cancelAnimationFrame(animacion); animacion = 0; };
    const arrancar = () => {
      if (!pintar) return;
      parar();
      // Con "reducir movimiento": un solo fotograma, en un momento bonito.
      if (quieto.matches) { pintar(9.0); return; }
      animacion = requestAnimationFrame(fotograma);
    };

    const alCambiarVisibilidad = () => {
      raiz.classList.toggle("oleaje-quieto", document.hidden);
      if (document.hidden) parar(); else arrancar();
    };
    let espera: ReturnType<typeof setTimeout> | undefined;
    const alRedimensionar = () => {
      clearTimeout(espera);
      espera = setTimeout(() => { medir(); if (quieto.matches) pintar?.(9.0); }, 150);
    };
    const alPerderContexto = (e: Event) => {
      e.preventDefault();
      parar();
      capa.current?.removeAttribute("data-webgl");
    };

    if (pintar && c) {
      capa.current?.setAttribute("data-webgl", "1");
      medir();
      arrancar();
      window.addEventListener("resize", alRedimensionar);
      c.addEventListener("webglcontextlost", alPerderContexto);
      quieto.addEventListener?.("change", arrancar);
    }
    alCambiarVisibilidad();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      parar();
      clearTimeout(espera);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("resize", alRedimensionar);
      c?.removeEventListener("webglcontextlost", alPerderContexto);
      quieto.removeEventListener?.("change", arrancar);
      raiz.classList.remove("oleaje-quieto");
      document.body.classList.remove("con-oleaje");
    };
  }, []);

  return (
    <div ref={capa} className="fondo-oleaje" aria-hidden="true">
      {/* Respaldo sin WebGL: capas CSS que también se mueven. */}
      <div className="oleaje-banda oleaje-banda-1" />
      <div className="oleaje-banda oleaje-banda-2" />
      <div className="oleaje-banda oleaje-banda-3" />
      {/* Hilos de luz: un haz de curvas finas que se repite cada 1600 de
          ancho, para que el desplazamiento de media anchura no tenga costura. */}
      <svg className="oleaje-hilos" viewBox="0 0 3200 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="oleaje-hilo" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#a3e635" stopOpacity="0.05" />
            <stop offset="0.25" stopColor="#bef264" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#22c55e" stopOpacity="0.12" />
            <stop offset="0.75" stopColor="#bef264" stopOpacity="0.55" />
            <stop offset="1" stopColor="#a3e635" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {[0, 14, 30, 48, 70].map((d, i) => (
          <path
            key={d}
            // La tangente con la que empieza cada tramo es la misma con la que
            // acaba (400, -180): el dibujo empalma consigo mismo sin pico.
            d={`M0 ${300 + d} C 400 ${120 + d}, 1200 ${480 + d}, 1600 ${300 + d} C 2000 ${120 + d}, 2800 ${480 + d}, 3200 ${300 + d}`}
            fill="none"
            stroke="url(#oleaje-hilo)"
            strokeWidth={i === 1 ? 1.4 : 0.8}
            vectorEffect="non-scaling-stroke"
            opacity={1 - i * 0.16}
          />
        ))}
      </svg>
      <div className="oleaje-facetas" />
      <div className="oleaje-destello" />
      <div className="oleaje-velo" />
      {/* El shader, encima de todo lo anterior cuando hay WebGL. */}
      <canvas ref={lienzo} className="oleaje-lienzo" />
    </div>
  );
}
