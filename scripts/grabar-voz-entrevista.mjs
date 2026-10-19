/**
 * scripts/grabar-voz-entrevista.mjs — Graba las frases y preguntas del
 * simulador de entrevistas con la voz elegida (Gemini TTS).
 *
 * Se ejecuta DENTRO del contenedor, que es donde está GEMINI_API_KEY:
 *
 *   node grabar-voz-entrevista.mjs textos.json /tmp/voz-entrevista
 *
 * textos.json es la lista [{ id, texto }] de textosGrabados() en
 * lib/entrevistas/preguntas.ts. Deja un WAV por id y se salta los que ya
 * existen, así que si se corta se vuelve a lanzar y sigue. Después, en el
 * servidor, cada WAV se pasa a MP3 con ffmpeg (ver el final de este comentario)
 * y se copia a public/voz/entrevista/, y lib/entrevistas/voz-grabada.json se
 * actualiza con el texto exacto que se ha grabado.
 *
 * El nivel gratuito de Gemini permite 3 audios por minuto: va a uno cada 21 s.
 *
 *   ffmpeg -i X.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ac 1 -ar 24000 -b:a 48k X.mp3
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

// La voz 5 de las que escuchó Michel: castellano, hombre joven, "empática y cercana".
const VOZ = "es-es-csagent-3";
const ESTILO = "tranquilo, cálido y cercano, a ritmo pausado, como alguien amable que quiere que la otra persona se sienta cómoda";
const MODELO = "gemini-3.8-flash-tts";

const [, , entrada, carpeta = "/tmp/voz-entrevista"] = process.argv;
const clave = process.env.GEMINI_API_KEY;
if (!entrada || !clave) {
  console.error("Uso: node grabar-voz-entrevista.mjs textos.json [carpeta]  (con GEMINI_API_KEY)");
  process.exit(1);
}
const textos = JSON.parse(readFileSync(entrada, "utf8"));
mkdirSync(carpeta, { recursive: true });
const espera = (ms) => new Promise(r => setTimeout(r, ms));

let hechos = 0, primero = true;
for (const { id, texto } of textos) {
  if (existsSync(`${carpeta}/${id}.wav`)) continue;
  if (!primero) await espera(21000);
  primero = false;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions?key=${clave}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODELO,
      input: [{ type: "user_input", content: [{ type: "text", text: texto, annotations: [{ type: "speech_metadata", style: ESTILO }] }] }],
      response_format: { type: "audio", mime_type: "audio/wav" },
      generation_config: { speech_config: [{ voice: VOZ }] },
    }),
  });
  const j = await r.json().catch(() => ({}));
  const audio = j.steps?.find(s => s.type === "model_output")?.content?.find(c => c.type === "audio")?.data;
  if (!r.ok || !audio) {
    const msg = String(j.error?.message || r.status).slice(0, 160);
    console.log(`${id}: FALLO ${msg}`);
    // Cupo del día agotado: no tiene sentido seguir intentándolo.
    if (/per day|daily/i.test(msg)) break;
    continue;
  }
  writeFileSync(`${carpeta}/${id}.wav`, Buffer.from(audio, "base64"));
  hechos++;
  console.log(`${id}: ok`);
}
console.log(`grabados ahora: ${hechos}`);
