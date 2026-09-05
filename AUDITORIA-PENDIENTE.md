# Auditoría de septiembre 2026 — qué falta por arreglar

> **Para qué es este fichero.** Seis auditorías en paralelo (Guzzi, CV, búsqueda,
> pagos, contenido, notificaciones) encontraron más de cuarenta fallos. Se van
> arreglando por orden de daño. Esto es el marcador: **si una sesión se corta,
> se continúa desde aquí sin volver a investigar nada.**
>
> Regla: cuando algo se arregle, se tacha aquí **en el mismo commit** que lo
> arregla. Un marcador desactualizado es peor que no tenerlo.

---

## YA ARREGLADO (no volver a mirarlo)

- **6.820 ofertas españolas estaban guardadas como suecas.** Adzuna publica 19
  países y el calendario de sincronización pedía además Irlanda y Suecia, que no
  están. El código no fallaba: caía a España por tres sitios a la vez —
  consultaba la API española, buscaba en ciudades españolas y etiquetaba el
  resultado con el país pedido. Quien filtraba por Suecia veía Galicia; quien
  filtraba por España no las veía. Arreglado en las tres capas: el sincronizador
  se planta ante un país que Adzuna no cubre, el calendario ya no los pide (su
  presupuesto pasa a Bélgica y Austria, que sí existen) y las filas se han
  reetiquetado. España: 29.599 → 36.372 ofertas activas.

- Envíos que reventaban no dejaban rastro y gastaban cuota para siempre → se
  marcan fallidos y se avisa. Y hay rescate de huérfanos al arrancar el worker.
- Un correo de CV **sin el CV dentro** salía igual y contaba como éxito → ahora
  se niega a enviar, y el generador comprueba que el PDF es un PDF.
- El candado antiduplicados se **abría** cuando fallaba la consulta → ahora se
  cierra.
- La regla del paro llevaba **bytes de retroceso (0x08)** en vez de `\b`: no se
  disparó nunca. Arreglado, y el sello ahora **ejecuta** la función en vez de
  comparar texto.
- Las ofertas no caducaban (296.833 sin fecha) → `DEFAULT` en la columna,
  569.821 rellenadas, 195.217 retiradas y limpieza diaria programada.
- Siete datos falsos de visados (Youth Mobility, Australia 417/462, edad de NZ,
  acuerdo de Canadá, foto del CV, "49 países") y 13 enlaces oficiales muertos.
- Lo visual: 122→112 colores, dos paletas a una, seis cabeceras de verde macizo,
  el menú arcoíris, 82 emoji decorativos, los cuatro rayos idénticos.
- No se podía cerrar sesión en el móvil (`100vh` mentía) y las páginas de país
  tardaban 15 s (`force-dynamic`).

---

## 1. DINERO — lo que cuesta euros cada día

**En curso.** Es por donde se sigue.

- [x] ~~**Cambiar de plan en el portal de Stripe no cambia el plan en la app.**
  `app/api/stripe/webhook/route.ts:216-230` — `customer.subscription.updated`
  solo escribe `subscription_status`, y solo si venía de `past_due`. **Nunca
  toca la columna `plan`.** El checkout rechaza con 409 a quien ya tiene plan
  activo, así que el portal es la *única* vía para cambiarlo.
  · Bajar de Pro a Esencial: paga 2,99 € y conserva los límites de 9,99 €.
  · Subir de Esencial a Pro: paga 9,99 € y sigue con los límites del de 2,99 €.
  · **RevenueCat sí lo hace bien** (`revenuecat/webhook/route.ts:138-162`,
    `PRODUCT_CHANGE`). La misma función resuelta en Apple y olvidada en Stripe.

- [x] ~~**El plan gratuito regala el gancho de Esencial.** `app/precios/page.tsx`
  promete "Sin envíos de CV" con la cruz puesta; `lib/plan-limits.ts:37` da
  `enviosCVDia: 3` con tope de **28 al mes** (`enviosCVSemana * 4`). OJO: el
  informe del auditor decia ~90 y es FALSO — el tope mensual si se aplica.
  Comprobado: free 3/dia y 28/mes; pro 50/dia y 1.400/mes. Decidir qué gana: la promesa
  o el código. Otras dos discrepancias en la misma tabla: cámara (dice 3, da 2)
  y consultas a Guzzi (dice "2 total", da 15 diarias).~~ **DECIDIDO Y ARREGLADO**:
  Michel: el plan gratuito SI debe enviar CV, es lo que nos separa de InfoJobs.
  Gana el codigo; la pagina se ha cuadrado con el y ahora saca los numeros de
  LIMITS en vez de escribirlos. Los envios gratis se ANUNCIAN en vez de
  esconderse.

- [x] ~~**La morosidad solo protege a Guzzi.** `getPlanEfectivo`
  (`lib/plan-limits.ts:138`) es la única función que mira `subscription_status`
  y la llama **un solo sitio** (`lib/guzzi-limits.ts:53`). Todo lo demás lee el
  plan crudo: entrevistas, analyze-image, cv/guardar, jobs/guardar y
  `getUserPlan` de `rate-limiter.ts:265`. Un Pro impagado conserva 50 envíos al
  día y las fotos con GPT-4o; solo pierde el chat.~~ **ARREGLADO**: nueve sitios
  pasan ya por el plan efectivo, con un ayudante compartido para que no haya que
  acordarse en cada endpoint nuevo.

- [x] ~~**Dos funciones de pago accesibles gratis.**
  `/api/cv-sender/preview-carta` (carta con IA) solo pide sesión, no lee
  `cartaPersonalizada`. `/api/referidos` GET no lee `codigosPromocionales`.
  Los dos flags existen y solo se usan para pintar el check en pantalla.~~
  **ARREGLADO**: los dos endpoints leen ahora el flag del plan efectivo y
  devuelven 403 con el motivo, en vez de servir la función y no cobrarla.

- [x] ~~**"API e integraciones" del plan Empresa (49,99 €) no existe.**~~ Ya no se
  vende como incluida: sale como "(proximamente)" y sin tick. **Pendiente de
  Michel**: construirla o quitarla de la lista.

- [x] ~~Carrera en los contadores de cuota (`usage-tracker.ts:103`,
  `analyze-image:69`): select-then-upsert no atómico. Diez peticiones a la vez
  gastan diez fotos de GPT-4o en vez de dos.~~ **ARREGLADO en el código**: la
  cámara suma y comprueba en la misma operación, con la función
  `consumir_uso_camara` de `db/migrations/005_consumir_cuota_atomico.sql`.
  El `where` del `on conflict` es lo que lo hace atómico: si no queda cuota no
  actualiza, no devuelve fila, y llega `null`. Si la función todavía no existe
  en la base, se usa el método viejo y se avisa por el log, para no dejar la
  cámara inservible mientras tanto.
  ⚠️ **PENDIENTE DE MICHEL**: aplicar la migración 005 en Supabase. Hasta
  entonces la carrera sigue abierta.

- [x] ~~El límite **semanal** de envíos no se aplica nunca. Y el mensaje de tope
  dice "500 al mes" cuando son 1.400.~~ **ARREGLADO**.

- [x] ~~El plan Empresa **se salta la lista negra**: el que más envía es el único
  que ignora a quien pidió no recibir CVs.~~ **ARREGLADO**: la lista negra se
  comprueba ahora ANTES del atajo de "ilimitado".

---

## 2. ROTO DE CARA AL USUARIO

- [x] ~~**Las 6 ofertas del panel de inicio son enlaces muertos.**
  `app/api/dashboard/route.ts:92` lee la tabla Supabase `ofertas` (congelada
  desde el 5 de julio); el enlace va a `/app/ofertas/<id>`, que consulta
  `JobListing` de la base propia. Espacios de ID distintos: 0 de 20 coinciden.
  Es lo primero que ve alguien al entrar.~~ **ARREGLADO**: la portada lee
  ahora de `JobListing`, que es la tabla a la que apunta el enlace.

- [x] ~~**La notificación "CV enviado" lleva a error en 76 de 78 casos.**
  `worker.ts:273` guarda un `jobId` sintético (`cv-<uuid>-<ts>`) y
  `lib/notificaciones/destino.ts:77` lo prioriza sobre el mapa por tipo.
  Arreglo: validar que el id existe en `JobListing` antes de construir la ruta.~~
  **ARREGLADO**: ese id no era de una oferta, era el de la COLA (`queue.ts`
  lo genera como `cv-<usuario>-<fecha>`). Dos cosas distintas llamadas `jobId`.
  El worker lo guarda ahora como `colaJobId` y el destino descarta los que
  empiezan por `cv-`, lo que repara también las que ya estaban guardadas.

- [x] ~~**La campana está topada a 50.** `app/api/notifications/route.ts:46` hace
  `.limit(50)` y cuenta las no leídas **sobre esa página**. Hay usuarios con
  262. El "99+" de `NotificationBell.tsx:184` es código inalcanzable.~~
  **ARREGLADO**: la cuenta se pide aparte con `count: exact, head: true`, sobre
  todas las filas y sin traérselas. La lista sigue topada, que es un desplegable.

- [x] ~~**Toda oferta de búsqueda llega sin URL, sin fecha y sin fuente.**
  `app/api/jobs/search/route.ts:64-66` lee `sourceurl`/`sourcename`/`scrapedat`
  en minúsculas, pero el SELECT los pide entrecomillados y Postgres los devuelve
  con mayúsculas. **Arreglo de tres alias.**~~ **ARREGLADO**: aliaseados en las dos consultas. Rompía el badge de fuente y dejaba
  muerta la vía de email de respaldo del botón Enviar CV.

- [ ] **El filtro de salario mínimo no filtra.** `route.ts:248` hace
  `regexp_replace(salary,'[^0-9]','')`: `"15600 - 18000"` → `1560018000`.
  ~3 de cada 4 salarios producen un número inflado.

- [ ] **Los respaldos tiran el filtro de país.** El respaldo por ciudad no lleva
  `country` en el WHERE, y `buscarOfertasReales` no lo recibe. Pedir Alemania
  devuelve España; un país inexistente devuelve ofertas españolas.

- [ ] **El modo entrevista de Guzzi nunca se ha activado.** `GusiChat.tsx:284`
  manda `"entrevista"`, `chat/route.ts:953` espera `"prep_entrevista"`.
  `PROMPT_ENTREVISTA` (40 líneas) no se ha usado jamás. El badge además dice
  "MODO CV".

- [ ] **La ficha de empresa de la foto nunca se pinta.** `/api/gusi/analyze-image`
  devuelve `company`, pero `addMsg` (`GusiChat.tsx:239`) solo guarda
  `{role, text, action}` y tira el campo. Se paga el OCR y se descarta.

- [ ] Las búsquedas lentas se enseñan como "no hay ofertas": el cliente aborta a
  los 15 s y el respaldo a APIs en vivo tarda 15-21 s. La ruta de rescate es la
  que el navegador cancela.

- [ ] Guardados: la cabecera cuenta filas y la rejilla pinta solo las que
  sobreviven. 12 de 30 apuntan a ofertas purgadas.

- [ ] Alertas: títulos como "111310 nuevas ofertas" que al abrirlas dan 200
  (el `limit` se recorta en el servidor). Y una dice `de ""`.

- [ ] El push de alertas no llega a nadie: 8 usuarios con alerta, 0 con
  suscripción push. El bucle recorre cero elementos sin avisar.

- [ ] `cv_fallido` no está en el mapa de destinos ni en el de iconos: el clic
  recarga la página en la que ya estás. Se creó la notificación y no se le dio
  destino.

---

## 3. PÉRDIDA DE DATOS EN EL CV

- [ ] **Subir un PDF por el chat machaca el CV del editor.**
  `GusiChat.tsx:420` no manda `cvId`, así que el servidor pisa el más reciente.
  Y el `cvData` del chat no incluye `fotoUrl`, `templateId` ni `accentColor`:
  se pierden foto, plantilla y color.

- [ ] **Borrar una versión vacía otra versión** tres segundos después, por el
  autoguardado con `cvId` undefined. Si es el único CV, resucita una fila vacía.

- [ ] **Si la carga inicial falla, el autoguardado escribe el formulario vacío
  encima del CV bueno.** El guard `cvCargado` se pone a `true` incluso cuando la
  petición falla (`Content.tsx:263`). **Hay 6 filas en producción** con solo el
  email, una reescrita 17 minutos después de crearse.

- [ ] **El CV que reciben las empresas no es el que se descarga.** El editor usa
  `formToCVDataRaw` y el worker `normalizar`: el enviado **inventa "Español
  100%"** (17 de 26 CV), imprime bloques de experiencia vacíos (15 de 26) y no
  ordena por fecha. Y la mejora con IA nunca llega al envío.

- [ ] `DELETE /api/gusi/cv` borra **todos** los CV del usuario, sin id ni
  confirmación. Hoy no lo llama nadie, pero está expuesto.

---

## 4. DATOS FALSOS DE VISADOS (los de ayer ya están; estos son nuevos)

- [ ] **WWOOF no cuenta para los 88 días** que prorrogan el visado australiano.
  Home Affairs: el trabajo especificado de la 462 **tiene que ser remunerado**.
  Decimos que sirve (`primeros-pasos.ts:323`). Alguien podría trabajar tres
  meses gratis creyendo que se gana el segundo año.

- [ ] **Con Working Holiday no puedes estar en KiwiSaver** (`:933`). Inland
  Revenue: no se puede con visado temporal. Falso para el 100% de quien lo lee.

- [ ] **Nueva Zelanda: la prórroga es a 15 meses, no 23** (`:926`). Los 23 son
  solo para británicos. Y exige horticultura o viticultura, no "trabajo
  regional".

- [ ] **El Acuerdo Europeo de au pair está en vigor en CINCO países, no ocho**
  (`lib/au-pair/derechos.ts:48`). Finlandia, Bulgaria y Moldavia firmaron y
  **nunca ratificaron**; las fechas que tenemos son las de firma.

- [ ] **Ontario ya no tiene espera de 3 meses** para la sanidad
  (`primeros-pasos.ts:271`). La página oficial a la que enlazamos lo dice.

- [ ] **El paro europeo sí admite excepción** a las cuatro semanas
  (`lib/emigrar/paro-europeo.ts:66`). Decimos "no hay excepción". Alguien puede
  dar por perdidos miles de euros sin pedirlo.

- [ ] Cifras: superannuation es 12% (decimos 11,5), la ventana del PEAC nivel 1
  son 15 años (decimos 10, y excluye a gente que sí cumple), el mínimo de au
  pair en EE. UU. es 195,75 $/semana (decimos 250-300).

- [ ] Reino Unido dice dos cosas a la vez: la tarjeta de au pair pinta un sueldo
  en verde para un trabajo que un español no puede aceptar.

---

## 5. CÓDIGO MUERTO (decidir: borrar o conectar)

`/api/entrevistas/chat` · `/api/gusi/skill-gap` · `/api/gusi/conversations` ·
la cola `cv-sender-retry` · el botón `cv_complete` de GusiChat · los chips de
"Empresas más buscadas" de reviews (no buscan, y la tabla está vacía).

---

## 6. OBSERVABILIDAD

- [ ] `lib/guzzi/llm.ts`: los tres proveedores fallan **sin una sola línea de
  log**. Si Groq y OpenAI caen, el usuario recibe un texto enlatado y en los
  logs no hay nada. La cadena principal del chat sí lo hace bien: copiar ese
  patrón.
- [ ] `lib/guzzi/rate-limit.ts`: falla **abierto** y en silencio, y la URL por
  defecto de Redis **no lleva contraseña**. Si `REDIS_URL` no llega, el límite
  de 20 mensajes/minuto desaparece sin avisar.
- [ ] Careerjet muerto desde el 19 de agosto (145.531 ofertas congeladas). El
  contador de fallos que se añadió lo destapará en la próxima pasada.

---

## Pendiente de Michel (no lo puedo hacer yo)

- **Micrófono**: `npx cap sync` y recompilar. Y en iOS faltan
  `NSMicrophoneUsageDescription` y `NSSpeechRecognitionUsageDescription` en el
  `Info.plist`; sin ellas **iOS cierra la app** al pedir permiso.
- **Capturas del producto** para la portada (`/app/*` pide sesión).
- Decidir sobre la mascota, el `gpt-4o` de analyze-image, y qué gana en la tabla
  de precios del plan gratuito.
