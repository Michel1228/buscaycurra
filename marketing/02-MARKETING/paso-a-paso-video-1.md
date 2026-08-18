# Vídeo 1 — "Una oferta, 400 candidatos": paso a paso

> Del guion a Instagram. Escrito el 18 de agosto de 2026.
> Tiempo real de trabajo: unas 2 horas la primera vez, 40 minutos cuando le
> cojas el aire.

---

## Lo que decide si parece profesional o casero

**La coherencia entre planos.** Si generas las cuatro imágenes por separado, cada
una te saldrá con su luz, su color y su estilo, y al montarlas parecerán cuatro
vídeos distintos pegados con celo. Es el error que delata al 90% de los vídeos
hechos con IA.

La solución son dos reglas:

1. **Genera la imagen 1 primero y no sigas hasta que sea perfecta.** Esa es tu
   referencia de estilo. Las otras tres se generan pidiendo expresamente que la
   imiten.
2. **El último fotograma de un plano es la primera imagen del siguiente.**
   Higgsfield te deja exportar el último fotograma; lo usas como imagen de
   partida del plano siguiente y el corte queda invisible. Esto es lo que hace
   que parezca una escena y no cuatro postales.

---

## PASO 1 — Las cuatro imágenes

Con **ChatGPT (GPT Image)** o **Midjourney**. Recomiendo ChatGPT para estas: sigue
mejor las instrucciones de composición, que aquí es lo que importa. Midjourney es
más bonito pero más difícil de dirigir.

En Midjourney añade `--ar 9:16 --style raw` a todos los prompts.

### Imagen 1 — La estampida (0-4 s)

```
Vertical 9:16 cinematic film still. Ground-level camera, only a few
centimeters above dusty asphalt. Hundreds of legs and feet running toward
the camera in a dense crowd, all wearing ordinary modern work clothes and
worn shoes — no costumes, no medieval. Thick dust kicked up, backlit by a
low sun creating long shadows and volumetric light rays. Desaturated cold
color grade, deep shadows. Shot on 35mm anamorphic, shallow depth of field,
motion blur on the feet. No faces visible, no text, no logos.
```

**Qué mirar antes de darla por buena:**
- Que se vea **masa**, muchísima gente. Si salen ocho pares de pies, no cuela.
- Ropa **normal y actual**. Si aparecen sandalias romanas o botas de fantasía,
  regenera: te está copiando películas y eso es lo que queremos evitar.
- **Ni una cara.** Si asoma alguna, regenera.

Genera 4 variaciones y quédate con la mejor. **Guárdala: es tu referencia.**

### Imagen 2 — El que se para (4-8 s)

```
Vertical 9:16 cinematic film still, SAME visual style as reference: cold
desaturated grade, backlit dust, 35mm anamorphic, low sun. One person seen
from behind, standing completely still in the center, shot from waist down
and slightly higher. Around them, the crowd rushes past as heavy motion
blur streaks. The still figure is sharp, everything else is blurred.
Modern casual work clothes. Dramatic rim light on their silhouette.
No visible face, no text.
```

### Imagen 3 — El móvil (8-14 s)

```
Vertical 9:16 cinematic film still, SAME grade as reference but slightly
warmer. Close-up over the shoulder of hands holding a smartphone. The
screen shows a clean dark app interface (background #0f1117) with a green
accent color (#22c55e): a vertical list of simple company cards with small
green checkmarks appearing beside them. Screen is the brightest thing in
frame, casting green light on the fingers. Dusty blurred crowd far behind,
completely out of focus. Shallow depth of field. No readable text on the
screen, no faces, no logos.
```

> Lo del texto ilegible es a propósito: los generadores escriben fatal y siempre
> con faltas. El texto de verdad lo pones tú encima en el montaje.

### Imagen 4 — La puerta (14-20 s)

```
Vertical 9:16 cinematic film still, SAME style as reference but the grade
resolves from cold to warm golden. An open doorway with warm light pouring
out, seen from a few meters away. The dust has settled, the ground is empty
— nobody around. Calm after chaos. Long shadows, volumetric light through
the doorway. 35mm anamorphic, shallow depth of field. No people, no text.
```

---

## PASO 2 — Animar cada imagen

En **Higgsfield**, opción imagen a vídeo. Sube la imagen y describe **solo el
movimiento**, no la escena — la escena ya está en la imagen. Este es el error
más común: repetir la descripción y que el generador se invente otra cosa.

| Plano | Movimiento a pedir | Duración |
|---|---|---|
| 1 | `Camera stays low and static. Feet run past. Dust swirls. Subtle handheld shake.` | 4 s |
| 2 | `Slow push-in on the still figure. Crowd streaks past faster. Dust drifts.` | 4 s |
| 3 | `Very slow push-in on the phone. Green checkmarks appear one by one. Fingers barely move.` | 5 s |
| 4 | `Slow dolly forward toward the doorway. Dust settles gently. Light intensifies.` | 5 s |

**Las tres reglas del movimiento:**
- **Poco movimiento gana.** Cuanto más le pidas, más se deforma todo. Un empuje
  lento de cámara se ve caro; un movimiento brusco se ve falso.
- **Nada de gestos humanos complicados.** Andar, girar la cabeza o mover las manos
  es donde la IA se rompe y se nota al instante.
- **Exporta el último fotograma del plano 1** y úsalo como imagen inicial del
  plano 2. Repite en cada corte. Es lo que da continuidad de verdad.

---

## PASO 3 — El montaje

Con CapCut (gratis) o el editor que uses.

1. **Ordena los cuatro planos.** Total: 18 segundos.
2. **Los textos, encima.** Fuente gruesa tipo Inter Bold o Montserrat, blanca,
   centrada abajo. Nunca los generes dentro de la imagen.
3. **Corta al ritmo del texto**, no al revés: que el corte caiga justo cuando el
   espectador termina de leer.
4. **Sonido**: pasos y polvo los primeros 8 segundos, silencio de golpe cuando el
   personaje se para (ese silencio es lo que retiene), y una nota grave al abrirse
   la puerta.
5. **Los últimos 2 segundos**: logo sobre negro y "buscaycurra.es". Sin música.

---

## PASO 4 — Antes de publicar

- **Míralo sin sonido.** El 80% lo verá así. Si no se entiende, arregla los textos.
- **Míralo en el móvil**, no en el portátil. Los textos pequeños desaparecen.
- **Los tres primeros segundos deciden.** Si "Una oferta. 400 candidatos." no
  aparece antes del segundo 2, llegas tarde.
- **Sube el vídeo sin marca de agua.** Si CapCut te mete la suya al final, quítala:
  resta profesionalidad y ocupa el sitio de tu logo.

---

## Cuánto va a costar

Depende de las tarifas del día, así que no me invento cifras: mira el precio por
generación en tu plan de Higgsfield y multiplica por unos 12 intentos de vídeo
(cuatro planos, unos tres intentos cada uno). Las imágenes son la parte barata,
y por eso conviene iterar ahí y no en el vídeo.

**Consejo de dinero:** no animes ninguna imagen hasta tener las cuatro aprobadas.
Animar una imagen que luego vas a cambiar es tirar generaciones.

---

## Cuando esté hecho

Antes de grabar los otros tres, publica este y mira **cuántos registros entran
ese día** frente a un día normal, en https://buscaycurra.es/admin/metricas

Si funciona, el guion está validado y solo hay que cambiarle la profesión:
la misma estructura con cocinero, con albañil, con enfermera. Cuatro vídeos más
casi gratis.

Si no funciona, mejor haberlo sabido con uno que con cuatro.
