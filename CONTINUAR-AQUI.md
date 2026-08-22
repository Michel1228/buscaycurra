# Dónde lo dejamos — 22 de agosto de 2026, 21:50

> Sesión cerrada porque se rompió la pantalla del portátil.
> Todo queda desplegado, verificado y sin nada a medias.
> **Al abrir con el otro ordenador, empieza por aquí.**

---

## Estado: todo bien

| | |
|---|---|
| Repositorio | limpio, sin cambios pendientes. Último commit `6289952` |
| Producción | desplegada y funcionando (portada 0,18 s) |
| Sello de verificación | **28 de 28**, salida 0 |
| Servidor | carga bajada de 10 a 4,7 — ver más abajo qué pasó |
| Google Play | versión 6 (1.0.5) **enviada a revisión** |

---

## Lo primero al volver: 3 cosas que dependen de ti

### 1. Revocar el token del bot de Telegram
Sigue vivo y estuvo publicado en un repositorio público. Se hace en
**@BotFather** → `/mybots` → BuscayCurra → API Token → Revoke.
Es lo único de la lista que es un riesgo de seguridad real.

### 2. Mirar el correo de Google Play
La versión 6 se envió a revisión el 22 de agosto a las 17:52. Si la aprueban se
publica sola en los 177 países. Si la rechazan, el motivo llega por correo.

### 3. Copiar la clave de firma a tu carpeta de credenciales
`C:\Users\MichelBatista\claves-buscaycurra\buscaycurra-subida.jks`
Si se pierde ese fichero **no se puede volver a publicar la app nunca**.
Contraseña y alias están en el fichero de credenciales local.

---

## 🔴 EL PROBLEMA MÁS GRAVE, sin arreglar todavía

**La búsqueda de ofertas tumba el servidor.**

Medido contra producción, con búsquedas reales:

```
camarero   →  93 segundos
cocinero   →  79 segundos
enfermero  → 134 segundos
conductor  → más de 150 s, sin llegar a responder
```

Y lo peor no es la lentitud. **Cuando el usuario se cansa y cierra la página, la
consulta sigue corriendo en la base de datos.** No hay `statement_timeout`
(está en 0), así que abandonar la petición HTTP no cancela nada.

Esta tarde quedaron 6 consultas huérfanas quemando los dos núcleos durante
**5 horas y 24 minutos**. La carga del servidor llegó a 14,31 (en 2 núcleos).
Las cancelé con `pg_cancel_backend` y la carga bajó a 4,7.

**Con el pool en `max=10`, bastan diez usuarios impacientes para bloquear la
aplicación entera.**

### Por dónde empezar a arreglarlo

1. `statement_timeout` en la conexión (`lib/db.ts`) — que ninguna consulta pase
   de ~15 s. Es el candado, y es lo primero.
2. El endpoint es `/api/jobs/search`. Un agente detectó que `company ~*` no
   tiene índice de trigramas. **Verificar con `EXPLAIN ANALYZE` antes de tocar
   nada**: ya hubo un caso en este proyecto donde "arreglar" una regex pasó una
   consulta de 86 ms a 176 segundos.
3. La tabla `JobListing` tiene **4,1 millones de filas** (2,3 M vivas) en la
   base propia (`buscaycurra-db`, no Supabase).

---

## 🔴 Por qué no entra dinero — y no es marketing

De la auditoría de pagos, todo verificado contra Stripe y producción:

**1. Nadie puede subir de plan desde la web.**
`app/api/stripe/checkout/route.ts:51` devuelve **409 "Ya tienes un plan activo"**
a quien ya paga. Y el portal de Stripe tiene `subscription_update = false`, así
que tampoco se puede cambiar por ahí. Se puede cancelar pero no mejorar.
En iOS sí funciona. En web es **imposible cobrar más de 2,99 €**.

**2. El plan gratis regala lo que vendes.**

| Free | Se aplica | `/precios` dice | La app dice |
|---|---|---|---|
| Envíos de CV | **3/día** | "Sin envíos de CV" | "3 CVs/día" |
| Guzzi | **15/día** | "2 consultas en total" | — |

Las tres páginas dicen tres cosas distintas y ninguna coincide con el código.
Alguien gratuito ya tiene envíos y tiene a Guzzi: **no hay motivo para pagar**.

**3. Quien paga tarde queda castigado para siempre.**
Stripe envía `customer.subscription.updated` y el webhook lo ignora (verificado
en el JavaScript ya compilado del servidor). Si a un cliente le falla el cobro y
luego paga, se queda en `past_due` eternamente y pierde Guzzi. Solo se arregla
tocando la base a mano. Falta además suscribir `invoice.payment_succeeded`.

**4. La protección contra eventos repetidos escribe en una tabla que no existe.**
`webhook/route.ts:60` usa `stripe_events`; la tabla real es
`stripe_webhook_events`. El error se traga en un `catch` vacío. Y aunque
existiera no serviría: al `upsert` le falta el `.select()` y el `return`.

**5. `getPlanEfectivo()` solo se usa en Guzzi.** Los otros seis sitios leen
`profiles.plan` a pelo, así que un moroso conserva envíos, cámara, entrevistas
y cartas con IA. Solo pierde el chat.

**6. El contador que ve el usuario siempre marca 0.** `/api/usage` lee
`usage_tracking.envios_cv`, pero `trackCVSend()` no lo llama nadie. El límite
real cuenta filas de `cv_sends`. Dos fuentes de verdad, y la de la pantalla está
vacía.

---

## Lo que SÍ quedó arreglado y desplegado hoy

**Envíos de CV** — eran seis fallos encadenados:
- `full_name` nulo reventaba el envío entero (11 de 24 perfiles no tienen nombre)
- Once usuarios con el CV hecho recibían "debes subir tu CV": el endpoint
  buscaba `user_cvs` en **Supabase**, y esa tabla vive en la **base propia**
- La cuota se regeneraba sola: al abrir la empresa el correo, el estado pasaba a
  "visto" y dejaba de contar
- La pantalla decía "te quedan 3" y el envío contestaba "límite alcanzado"
- Se podían encolar dos CVs seguidos a la misma empresa
- Au Pair tenía su propia tabla de límites, distinta de la real

**Autorrelleno del CV** — `/api/cv/extraer` exige token y ni el editor ni Guzzi
lo mandaban: **no se había ejecutado nunca**, y encima decía "✅ PDF procesado".
El mismo fallo tenía el perfil de Au Pair (guardaba bien, al volver salía vacío).

**SEO** — el `robots.txt` solo protegía de Google: Bing y cualquier otro bot
podían recorrer `/api/`. Y 1,8 millones de ofertas caducadas eran indexables,
comiéndose el presupuesto de rastreo que debía ir a las 157 páginas de países.

**Seguridad** — migración `013c` aplicada: se devolvió a los usuarios el permiso
sobre sus propios envíos sin reabrir la fuga. Verificado atacándolo.

**Android** — la app pasó de ser Chrome disfrazado a Capacitor de verdad.

---

## Cómo trabajar con esto

```bash
# Antes de cualquier despliegue (28 comprobaciones, para el deploy si falla algo)
node scripts/sello-verificacion.mjs

# Desplegar — NUNCA hacer docker build a mano, se pierden las variables
git push origin unified-production
ssh root@<ip-del-vps> 'cd /root/.openclaw/workspace/buscaycurra-unified \
  && git pull origin unified-production && bash /root/deploy-manual.sh'
```

**Recuerda que hay DOS bases de datos.** Es lo que más veces ha mordido:
- **Supabase**: `profiles`, `cv_sends`, `subscriptions`, `referrals`, auth
- **buscaycurra-db**: `user_cvs`, `CV`, `JobListing`, `empresas`, `gusi_conversations`

Y que **Supabase no lanza excepción cuando falla**: devuelve `{ error }`. Si
nadie lo mira, la pantalla dice "guardado" y no se guardó nada. Ese solo patrón
ha causado cuatro fallos distintos: perfil, notas del pipeline, autorrelleno del
CV y perfil de Au Pair.

---

## La auditoría quedó a medias

Se lanzaron cinco agentes. **Solo terminó el de pagos** (sus hallazgos están
arriba). Los otros cuatro murieron al agotarse el límite de sesión:

- **Seguridad** — RLS, endpoints sin autenticación, secretos en el repo público
- **Infraestructura** — alcanzó a medir la búsqueda lenta (el hallazgo 🔴 de
  arriba), pero no llegó a entregar informe
- **Experiencia** — no llegó a empezar
- **Guzzi** — alcanzó a apuntar que `company ~*` no tiene índice de trigramas

Al retomar, esas cuatro áreas siguen sin auditar.

---

## Último arreglo de la sesión (22 ago, 22:25) — el CV en iPhone

El usuario de Apple avisó de que el autorrelleno **seguía** sin funcionar
después del arreglo de la tarde. Tenía razón: el fallo estaba **antes**.

```ts
if (file.type !== "application/pdf") { ... }   // ← rechazaba el PDF
```

Cuando el fichero se elige desde **Archivos o iCloud Drive**, iOS entrega
`file.type` **vacío**. Esa línea rechazaba el currículum antes de subirlo, así
que no llegaba ni a la extracción que se arregló por la tarde: el usuario veía
"Solo se aceptan archivos PDF" con un PDF válido en la mano.

Ahora se acepta por tipo **o** por extensión, y el `accept` del input declara
las dos formas. Desplegado y verificado dentro del bundle que recibe el móvil.

**Antes de llegar ahí se descartaron cuatro cosas, todas con su prueba:**

- El endpoint funciona: PDF real con token → HTTP 200 en 1,7 s, y la IA
  devolvió nombre, teléfono, email, ciudad, 2 experiencias y 1 formación
- El JavaScript servido sí lleva el token (comprobado en los bundles
  compilados, no en el código fuente)
- El service worker no cachea: solo tiene push, no tiene evento `fetch`
- `/app/curriculum` va con `no-store`, así que no hay HTML viejo cacheado

**Dile al usuario de Apple que lo pruebe otra vez.** Si sigue fallando, lo
siguiente que hay que mirar es qué llega en `file.name` desde su iPhone.

Sello: **29 de 29**. Servidor: carga 0,73, portada en 0,29 s.
