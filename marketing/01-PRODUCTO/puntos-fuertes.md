# Puntos fuertes de BuscayCurra

> **Todo lo de este documento está verificado contra el código real** (13 ago 2026).
> Si vas a escribir un anuncio, un guion o un texto de tienda, puedes prometer esto
> sin mentir. Lo que no esté aquí, no lo prometas.

---

## Los tres que Michel quiere destacar

### 1. 🎨 Plantillas de currículum — **10 diseños, PDF instantáneo**

Verificado en `lib/cv-generator/`. Diez plantillas reales:

| Plantilla | Para quién |
|---|---|
| **ATS** | La más importante: pasa los filtros automáticos de las grandes empresas |
| Ejecutiva | Puestos de responsabilidad |
| Elegante · Moderna · Minimalista | Perfiles generales |
| Coqueta | Atención al cliente, imagen, hostelería |
| Oscura | Tecnología, diseño |
| Folio · Firma | Formatos clásicos |

**El argumento de venta que funciona:** *"El 75% de los CVs los descarta un robot
antes de que los vea una persona. La plantilla ATS está hecha para pasar ese filtro."*

Y algo que casi nadie ofrece: **el CV se adapta a cada oferta con IA**
(`lib/cv-sender/cv-personalizer.ts`). No es el mismo PDF para todas.

---

### 2. 🤖 Envío automático de candidaturas — **la función más difícil de copiar**

Verificado en `lib/cv-sender/`. No es un botón de "enviar": es un sistema completo.

- **Cola de envíos** (`queue.ts`, `worker.ts`) — envía en segundo plano, tú no esperas
- **Personalización con IA** (`cv-personalizer.ts`) — adapta CV y carta a cada empresa
- **Programación inteligente** (`scheduler.ts`) — envía cuando el reclutador abre el correo,
  no a las 3 de la madrugada
- **Seguimiento** (`tracker.ts`) — sabes qué se envió y en qué estado está
- **Anti-spam** (`rate-limiter.ts`) — no quema tu reputación enviando de más

**Dato real para usar:** los usuarios han enviado **112 candidaturas** con esto.

**El argumento:** *"Tú te echas a dormir. Guzzi sigue echando currículums."*

---

### 3. 🏢 Empresas, fotos y carteles — **lo que nadie más tiene**

Verificado en `app/api/empresas/` y `app/api/gusi/analyze-image/`.

**Búsqueda de empresas por zona** (`empresas/zona`) — encuentra negocios reales cerca
de ti con Google Places: dirección, teléfono, web, valoraciones.

**Extracción de emails** — saca el correo de contacto de la web de la empresa.
**El 90% de las ofertas llegan con email listo** para enviar el CV.

**📸 Foto de un cartel o un escaparate → candidatura.** Esta es la función estrella
y la más difícil de explicar por escrito, pero la más fácil de enseñar en vídeo:

> Vas por la calle. Ves un cartel de "Se busca camarero" en un bar.
> Le haces una foto con la app.
> Guzzi lee el cartel, identifica el bar, encuentra su email y te ofrece enviar tu CV.
> **Todo sin escribir una palabra.**

Funciona igual con el escaparate de una tienda, el logo de una empresa en una furgoneta
o el nombre de un restaurante. Usa GPT-4o Vision para leer la imagen y Google Places
para localizar el negocio.

**Esto es oro puro para TikTok e Instagram.** Es visual, es rápido, y nadie más lo hace.

---

## Lo que Michel se dejó (y es igual de importante)

Michel pidió destacar tres cosas, pero hay más que merecen estar:

### 🐛 Guzzi — el agente conversacional

**Es el verdadero diferencial.** No es un buscador con filtros: es un asistente al que
le hablas normal. *"Busco algo de camarero en Dublín"* y te lo busca, te lo adapta y
te lo envía.

Tres proveedores de IA por detrás (DeepSeek, Groq, OpenAI) para que nunca se quede mudo.

### 🌍 26 países y emigración de verdad

No es "también hay ofertas de fuera". Es un módulo entero: visados, alojamiento,
salarios comparados, requisitos por país. **Japón entra por el visado SSW, que no
exige carrera universitaria** — justo el perfil de nuestros usuarios.

### 👶 Au pair y live-in nanny — nicho casi sin competencia

**~20.000 ofertas** de este tipo. Con calculadora de costes, comparativa legal por
país y carta de presentación específica. Es un nicho con comunidad muy activa en
redes y **casi nadie lo cubre bien en español**.

### 🔔 Alertas por email

El usuario dice qué busca y le llegan las ofertas nuevas. **8 de 22 usuarios ya las
tienen configuradas** — es la función que hace que la gente vuelva.

### 💰 Comparador de salarios y simulador de entrevistas

Menos vistosos, pero buenos para contenido educativo ("cuánto se cobra de camarero
en Noruega frente a España").

---

## Lo que NO hay que prometer

Sé honesto en el marketing, porque un usuario decepcionado no vuelve:

- ❌ **No garantiza trabajo.** Envía candidaturas, no contrata.
- ❌ **Las cadenas grandes no dan email de la tienda concreta.** Para Mercadona o
  Zara sale el correo corporativo. Para negocios pequeños sí sale el real.
- ❌ **Las alertas por WhatsApp están apagadas** (Meta cobra 0,05 € por mensaje).
  Solo email por ahora.
- ❌ **Android aún no está público.** Solo iOS y web.
