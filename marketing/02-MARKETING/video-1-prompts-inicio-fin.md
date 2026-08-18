# Vídeo 1 con fotogramas de inicio y final — prompts detallados

> Michel tenía razón: **dos imágenes por toma es mejor que una.** Con una sola,
> el generador decide él a dónde va la escena y cada intento sale distinto. Con
> inicio y final le fijas los dos extremos y solo rellena el camino: mucho más
> predecible y bastantes menos intentos.

## Lo que cambia respecto al plan anterior

En vez de 4 imágenes → 4 vídeos cortos, ahora son **4 imágenes → 2 tomas largas**.
Sale más barato y con menos cortes queda mejor.

| Toma | Empieza en | Termina en | Duración |
|---|---|---|---|
| **A** | La estampida de pies | El que se queda parado | 8-9 s |
| **B** | El móvil en la mano | La puerta abierta y vacía | 8-9 s |

**Regla de oro de esta técnica:** las dos imágenes de una misma toma tienen que
poder ser el mismo sitio a dos segundos de distancia. Si son escenas distintas, el
generador hace una transición rara con formas que se derriten. Por eso las cuatro
comparten suelo, polvo y luz.

---

# TOMA A

## A-1 · Fotograma de INICIO — la estampida

```
Vertical 9:16 cinematic film still, 35mm anamorphic lens, shot at f/2.8.

SCENE: Ground-level camera placed 15cm above cracked dusty asphalt in an
open industrial yard. A dense crowd of at least 60 people runs directly
toward the camera. We see them from the knees down: worn trainers, work
boots, jeans, tracksuit bottoms — ordinary modern clothing, nothing
historical or fantasy. Their legs fill the entire frame width.

LIGHT: Low sun directly behind the crowd, backlighting them. Thick dust
kicked up by the running feet catches the light in visible volumetric rays.
Long hard shadows stretch toward the camera.

COLOR: Desaturated cold grade, teal shadows, dust glowing pale amber.
Deep crushed blacks. Slight film grain.

MOTION: Feet closest to camera show natural motion blur. Dust particles
frozen mid-air.

IN THE BACKGROUND, very far and out of focus: a single doorway with warm
light, small in the frame, top third.

NEGATIVE: no faces, no upper bodies, no text, no logos, no medieval or
fantasy clothing, no armour, no weapons, no CGI look, no illustration.
```

## A-2 · Fotograma de FINAL — el que se para

```
Vertical 9:16 cinematic film still. SAME LOCATION, SAME LIGHT, SAME COLOR
GRADE as the reference image — identical dusty asphalt, identical backlit
low sun, identical teal-and-amber desaturated look, 35mm anamorphic f/2.8.

SCENE: The camera has risen slightly, now about 1.2m high. In the exact
centre of frame, ONE person stands completely still, seen from behind,
framed from the shoulders down. They wear a plain dark jacket and jeans.
They are perfectly sharp and in focus.

Around them, the same crowd rushes past as heavy horizontal motion-blur
streaks — the people are no longer individually readable, just streaks of
movement on both sides.

LIGHT: The same low sun behind, giving the still figure a bright rim light
along their shoulders and arms, separating them from the blurred chaos.
Dust still floating.

IN THE BACKGROUND: the same distant doorway with warm light, now slightly
larger and a little more in focus.

NEGATIVE: no face, no head turn, no text, no logos, no other sharp people,
no fantasy clothing.
```

**Movimiento que pides en Higgsfield para la toma A:**

```
Camera rises slowly and smoothly from ground level to standing height while
pushing gently forward. The running crowd blurs into streaks. Dust drifts
through the light. Subtle handheld shake throughout.
```

---

# TOMA B

## B-1 · Fotograma de INICIO — el móvil

```
Vertical 9:16 cinematic film still, 35mm anamorphic, f/1.8.

SCENE: Close over-the-shoulder shot of two hands holding a smartphone
vertically. We see the hands, the forearms in a dark jacket sleeve, and the
phone screen — no head, no face. The phone screen is the brightest object
in the frame.

ON THE SCREEN: a clean dark mobile app interface, background almost black
(#0f1117), with a vertical list of 5 simple rounded cards. Beside three of
them, small bright green (#22c55e) checkmark icons. Deliberately soft and
slightly out of focus so no text is readable.

LIGHT: The green screen light spills onto the fingers and the underside of
the face area (which stays out of frame). Same low backlit sun from behind
as the reference, same volumetric dust.

BACKGROUND: The same dusty yard and blurred crowd, now completely out of
focus — just soft shapes and dust.

COLOR: Same desaturated cold grade as reference, but slightly warmer around
the hands.

NEGATIVE: no readable text, no faces, no logos, no watermark, no fantasy
elements.
```

## B-2 · Fotograma de FINAL — la puerta

```
Vertical 9:16 cinematic film still. SAME LOCATION and SAME LENS as the
reference images — the same cracked dusty asphalt yard, 35mm anamorphic.

SCENE: The camera now faces the doorway that was distant in the earlier
shots. It is now the main subject, centred, about 4 metres away. The door
is open and warm golden light pours out onto the ground.

The yard is COMPLETELY EMPTY. No people at all. The dust has settled,
leaving only a faint haze near the ground catching the light.

LIGHT: Warm golden light from the doorway is now the dominant source,
replacing the cold backlight. Long soft shadows reach toward the camera.

COLOR: The grade has resolved from cold teal to warm golden amber — same
film stock and grain as the reference, but the temperature has flipped.

NEGATIVE: no people, no crowd, no text, no logos, no signage with letters.
```

**Movimiento que pides en Higgsfield para la toma B:**

```
Very slow push-in. Green checkmarks appear one after another on the phone
screen. Fingers stay almost still. Then the camera continues forward as the
scene opens up. Dust settles gently. Warm light intensifies.
```

> Ojo: si la toma B te sale rara al pasar del móvil a la puerta (son dos sitios
> muy distintos), pártela en dos tomas separadas de 4-5 segundos cada una. Es
> preferible un corte limpio a una transición derretida.

---

## El orden en que hay que generar

1. **A-1 primero, y no sigas hasta que sea perfecta.** Es tu patrón de estilo.
2. **A-2**, pidiendo expresamente que imite a A-1.
3. Anima la toma A. **Si te gusta, sigue. Si no, arregla las imágenes** — no
   gastes en B hasta tener A bien.
4. **B-1 y B-2**, con la misma referencia.
5. Anima la toma B.

---

## Qué mirar en A-1 antes de dar el visto bueno

Esta imagen manda sobre las otras tres, así que merece diez intentos si hace falta:

- [ ] **¿Hay masa de gente?** Si salen ocho pares de pies, no cuela. Queremos que
      dé sensación de aglomeración.
- [ ] **¿La ropa es actual?** Si aparecen sandalias, capas o botas de fantasía,
      regenera: te está copiando películas, que es justo lo que evitamos.
- [ ] **¿Se ve alguna cara?** Si asoma una, fuera.
- [ ] **¿Se ve el polvo con los rayos de luz?** Es lo que da el aire de cine. Sin
      polvo la imagen se queda plana.
- [ ] **¿Se intuye la puerta al fondo?** Tiene que estar, aunque sea pequeña y
      borrosa: es a donde va toda la historia.

Cuando la tengas, pásamela y te digo si vale o qué tocar antes de gastar en las
otras tres.
