# Auditoría de septiembre 2026 — qué falta por arreglar

> **Para qué es este fichero.** Seis auditorías en paralelo (Guzzi, CV, búsqueda,
> pagos, contenido, notificaciones) encontraron más de cuarenta fallos. Se van
> arreglando por orden de daño. Esto es el marcador: **si una sesión se corta,
> se continúa desde aquí sin volver a investigar nada.**
>
> Regla: cuando algo se arregle, se tacha aquí **en el mismo commit** que lo
> arregla. Un marcador desactualizado es peor que no tenerlo.

---

## ⚠️ ANTES DE TOCAR CUALQUIER TAREA PROGRAMADA (15 sep 2026)

**Ninguna tarea programada corre en GitHub Actions.** GitHub solo lanza los
calendarios `schedule` desde la rama por defecto (`main`), y allí se desactivaron
el 5 de julio de 2026 (commit `553719a`). Todo lo que sincroniza, limpia, copia o
avisa vive en el **crontab de root del VPS**. Copia versionada y reglas:
[`scripts/vps/README.md`](./scripts/vps/README.md).

Entre el 3 y el 5 de septiembre se cambió `.github/workflows/sync-jobs.yml`
creyendo que se ejecutaba. **Esos cambios no tuvieron efecto**: las dos entradas
de abajo sobre Japón y Suecia están corregidas por eso.

## SÚPER AUDITORÍA (29-30 sep 2026)

### Arreglado, desplegado y comprobado en producción

- [x] **"Mejorar mi CV" y "Nota ATS" daban error 500 a todos** (`805d4d5`). El
  router de `lib/ai` elegía DeepSeek (sin saldo, 402) y solo caía a otra IA con
  errores de "límite diario". Ahora cae a Groq/Gemini con cualquier error.
  Comprobado: 200 en 1,6 s y 0,6 s.
- [x] **Registro: la bienvenida se quedaba en un 401** (`ad6d2ae`). Con la
  confirmación por correo no hay sesión al registrarse: de 14 registros desde
  el 23 sep, 12 escribieron ciudad y solo 2 la tenían; 0 alertas; 0 correos de
  bienvenida; referidos perdidos. Ahora la hace la página de confirmación.
  Probado con una cuenta de prueba (9/9) y rellenadas 3 fichas, 7 ciudades y
  20 nombres, sin mandar correos.
- [x] **Envíos a direcciones de relleno o que ya rebotaron** (`be738fb`). 9 de
  25 envíos de septiembre rebotaron (36 %), uno a `ejemplo@domain.com`.
- [x] **Stripe: un impago no se anotaba** (`16d176d`): el webhook no tiene
  activado `invoice.payment_failed`. Ahora lo anota `subscription.updated`.
  No se puede probar en vivo sin un impago real; cubierto por el sello.
- [x] **Salarios: camarero con mínimo 144 € y máximo 95 €** (`f76f7e4`,
  `9b3845c`). Intérprete nuevo `lib/salarios/anual.ts`, mediana y mitad
  central. "Negociar salario" daba 500 (no lo llama ninguna pantalla).
- [x] **Panel de 6,8 s a 0,5 s** (`b6e9281`): consultas en paralelo.
- [x] **SEO: 156 de las 196 URLs del mapa del sitio daban 500** (`19b8770`):
  `/trabajar-en/{pais}/{oficio}`. Ahora 196/196 responden 200.
- [x] **Búsqueda de correos de empresas repetía las mismas 300 cada 2 h**
  (`e8e82fb`): de 0-3 correos por pasada a 40-42.
- [x] **Sueldos con "&euro;" y "&pound;" literales** (`b913057`): arreglado en
  la sincronización y limpiadas 97.068 ofertas + 11.023 textos.
- [x] **Adzuna: un 503 suelto dejó a España a 0 en el barrido** (`70458e7`):
  ahora reintenta los 5xx y cortes de red.
- [x] Antes, en la misma auditoría: barrido de Adzuna sin motivo de fallo
  (`2505e56`), asunto roto del correo de alertas (`5a4f6f5`), carta en blanco
  (`061bd51`), Next.js con 15 vulnerabilidades (`5c904eb`), tres
  malentendidos de Guzzi (`0025c27`, `66e90dc`).

### Decidido por Michel el 30 sep y hecho

- [x] **Recordatorio del primer día** (`dd238aa`, `2ed11fb`): correo sencillo
  con ofertas reales de su ciudad y asunto con la cifra ("Lucía, hay 8 ofertas
  nuevas en Tudela esta semana"). Solo afecta a registros nuevos; a los 78 que
  ya recibieron el antiguo no se les ha vuelto a escribir. **Medir en dos
  semanas** si alguien hace su primer CV tras recibirlo.
- [x] **Bienvenida atrasada** a las 13 personas confirmadas del 23-29 sep que
  se quedaron sin ella: enviada el 30 sep (13 de 13, entregadas), con perdón,
  sus ofertas y el paso que les falta. 10 alertas creadas (las otras 3 pusieron
  un país o nada). 4 cuentas sin confirmar el correo no reciben nada.
- [x] **Aviso antes de enviar a una dirección deducida** (`e38d4ad`):
  probado en producción en móvil (sale, y "Cancelar" no envía).
- [x] **Baja de alertas con un clic** (`dd238aa`): no había forma de quitarlas.
- [x] **392 alertas rebotadas en septiembre** a dos cuentas de prueba
  (`4fb023a`): cortadas, y tabla `correos_rebotados` para no volver a escribir
  a una dirección que rebota.
- [x] **Un CV entregado dejaba de contar para el cupo** (`5ced701`).

- [x] **Recordatorio nuevo a los 78 del antiguo** (30 sep): enviado a 63
  (fuera: 11 con bienvenida atrasada ese día, 2 que ya habían completado los
  pasos, 2 de prueba). Marcados con `recordatorio_primer_dia_2`.
- [x] **Disco del VPS del 73 % al 59 %** (30 sep): imágenes de Docker viejas,
  caché de npm y de Python. `build-deploy.sh` borra ya la imagen vieja en cada
  despliegue (`4d928f6`). Las copias de seguridad (7 días, 14 GB) no se tocan.

## AUDITORÍA COMPLETA (2-3 oct 2026)

Michel pidió revisar la aplicación entera "para que esos errores no se vuelvan
a suceder". Cinco agentes probaron como usuarios (Guzzi, envíos, ofertas, CV,
seguridad) con cuentas `delivered+qa-...@resend.dev`; sus informes, con la
forma de reproducir cada fallo, quedaron en la carpeta temporal de la sesión.
Todo lo de abajo está desplegado y con su prueba en el sello, comprobada contra
el código anterior (falla con él, pasa con el nuevo).

### Cómo se evita que vuelva a pasar

- **El sello es obligatorio antes de construir** (`2a25415`): si una prueba
  falla, `build-deploy.sh` no despliega. Ya no depende de acordarse.
- **El centinela recorre la app como un usuario cada mañana** (`b06c21f`,
  `lib/centinela/recorrido.ts`): Mejorar con IA, nota ATS, Guzzi editar CV, PDF
  del móvil con datos, CVs guardados, bienvenida tras confirmar, tablas del
  borrado de cuenta y (R8) recuperar la contraseña con el enlace abierto en
  otro navegador.
- **Una sola pieza para cada cosa**: `normalizar.ts` + `html-guardado.ts` (el
  CV), `descargar-pdf.ts` (la descarga), `borrar-datos.ts` (el borrado de
  cuenta), `envio-local.ts` (la lista de negocios de Guzzi y su respuesta),
  `oferta-viva.ts` (si la oferta sigue publicada).

### Arreglado, desplegado y comprobado

- [x] **Registro: confirmar en otro navegador daba error y sin bienvenida**
  (`6d052ca`). Bienvenidas atrasadas mandadas a quien se quedó sin ella.
- [x] **CV: el trabajo actual salía debajo, se perdían datos sin título y
  autoguardado al salir** (`92f3b80`). PDF "sin datos": `0a48ddd`, `b06c21f`.
- [x] **Eliminar la cuenta dejaba datos y las fotos seguían públicas**
  (`fbb747e`). Borrados los restos de 4 cuentas ya eliminadas.
- [x] **CRÍTICO — un "vale" u "ok gracias" de Guzzi mandaba el CV a una
  empresa que nadie había elegido** (`3925a0f`), buscando el correo en Tudela
  fuera cual fuera la ciudad y en buscadores. Ahora solo un sí a la propuesta
  recién hecha, con el negocio elegido, y solo correos de la web del negocio.
- [x] **Envíos** (`d605c30`): el correo a la empresa admitía HTML desde
  noreply@ (30 etiquetas sin escapar en la prueba); el mismo CV se podía
  repetir al minuto (la espera de 15 días no contaba "entregado"); la carta
  inventaba experiencia (3 de 3 cartas antes, 0 de 3 después).
- [x] **Contraseña olvidada** (`1e23f2e`): el correo salía en inglés y el
  enlace solo funcionaba en el navegador donde se pidió. 11 personas lo
  pidieron y 4 no han entrado nunca. Ahora el correo es nuestro, en español, y
  el enlace vale en cualquier navegador. Probado en producción de punta a punta.
- [x] **Ofertas** (`c22d92f`): no se podía quitar una guardada (y la ficha
  volvía sola a "Guardar"); empresa y descripción en minúsculas; sin
  resultados salían 50 ofertas de cualquier cosa; "jornada parcial" y "remoto"
  no filtraban. Comprobado en producción.
- [x] **EURES con "FR", "NO"... como ciudad** (`287e1a6`): 371.622 ofertas
  corregidas al nombre del país (el código sigue en `country`).
- [x] **Ofertas cerradas en origen** (`6b10e20`): la ficha comprueba si la web
  de origen la sigue teniendo; si da 404/410 la retira, lo avisa y no deja
  gastar el envío. El buscador comprueba en segundo plano lo que enseña.
- [x] **Guzzi** (`be629a5`): cursos a quien habla de su oficio; no redactaba
  el texto que prometía; "borrar mis datos" iba al editor del CV; carta de au
  pair; "en la Rioja". La ficha devolvía un 85 % de compatibilidad inventado.
- [x] **Guiones U+2011 de la IA gratuita** (`be58fef`) que rompían el correo
  de la firma y las fechas al copiarlas.
- [x] **Reseñas y tablas abiertas** (`3ed1a9d`): Google Places solo con sesión
  y con caché de 7 días; centinela R9 comprueba cada mañana con la clave
  pública que ninguna tabla de Supabase con datos de personas devuelve filas
  (hoy, de 22, solo "ofertas", pública a propósito).
- [x] **Perfil y pipeline** (`e981429`): con mala cobertura el autoguardado
  BORRABA teléfono, ciudad, provincia, CP y sector; apuntar una candidatura a
  mano gastaba el cupo de envíos; "envíos de hoy" contaba también los fallidos.
- [x] **Web pública** (`53f3fd0`): plan gratis falso en la portada, promesas
  sin respaldo ("media de 3 semanas", "llega cuando el reclutador abre el
  email", "Dashboard de equipo"), canonical heredado que hundía el SEO, y las
  52 páginas de país con "0 ofertas".
- [x] **Alertas** (`470887d`): hasta 12 correos de alertas al día a la misma
  persona; ahora como mucho uno. "Semanal" de verdad, sin duplicadas, y
  "Mis alertas" en el perfil para verlas y quitarlas. También: el botón de
  otro plan para quien ya paga, ventajas inexistentes en Mi Plan, el
  simulador de entrevistas y los referidos. Probado en el navegador.
- [x] **Au pair y registro** (`35126a4`): barra de guardar en los cuatro pasos
  con el aviso visible; el registro enlaza condiciones y privacidad (RGPD).

### Abierto

- [ ] **DECISIÓN DE MICHEL — caducidad de las ofertas de Adzuna.** Caducan a
  los 60 días de la última vez que se vieron, pero en la muestra del 3 oct casi
  todas las de más de 7 días ya no existían en Adzuna (404/410). Son 942.793
  ofertas activas de Adzuna con más de 7 días (35.056 de Adzuna España en
  total). Bajar su caducidad a 7-10 días bajaría mucho el número de ofertas
  que se anuncia. La comprobación al abrir la ficha ya protege los envíos.
- [ ] **DECISIÓN DE MICHEL — escribir a quien no pudo cambiar la contraseña**
  (6 personas entre el 5 sep y el 3 oct) con un enlace nuevo que ya funciona.
- [ ] **MICHEL — activar el cambio de plan en el portal de Stripe**
  (https://dashboard.stripe.com/settings/billing/portal → "Customers can
  switch plans", con Esencial, Pro y Empresa). Hoy está desactivado: quien
  pague Esencial no puede subir a Pro. No hay suscripciones activas, así que
  no afecta a nadie todavía.
- [ ] **DECISIÓN DE MICHEL — referidos**: invitar no da nada (los "+10 CVs" no
  los aplicaba ningún límite y se ha quitado la promesa). Si se quiere premio,
  hay que programarlo en el límite de envíos.
- [ ] **DECISIÓN DE MICHEL — "N CVs con IA" de /precios**: no se aplica en
  ningún sitio (Mejorar con IA es libre hasta 40/hora). O se aplica o se quita.
  Igual con el tope de 200 envíos/día del plan Empresa (no lo pone nada) y con
  "Soporte 24/7 / prioritario" mientras buscaycurra.es no reciba correo.
- [ ] Pagos (MEDIO): con un cobro fallido (past_due) se pierde el plan al
  instante y Mi Plan sigue diciendo "Activo" sin avisar; el webhook de Stripe
  apunta el evento antes de procesarlo (un fallo no se reintenta); la prueba de
  7 días de Pro se puede repetir. Los dos últimos, SIN PROBAR.
- [ ] Guzzi (MEDIO): preguntas de seguimiento ("¿y en Zaragoza?"), "mándame"
  para uno mismo, "hazme un cv", promesas en textos fijos, extractores.
- [ ] Envíos (MEDIO): hora de /app/envios con 2 h de desfase, recuadro "Foto"
  vacío en el PDF sin foto.
- [ ] Ofertas (MEDIO): móvil con los resultados a 1.121 px, sueldos absurdos,
  Arbeitsagentur con código postal como ciudad, búsqueda inventada tarda 12 s.
- [ ] Au pair (MEDIO): "3.020 disponibles" cuando solo 2.186 tienen correo, y
  876 apuntan a info@sitly.com (un mercado de canguros, no familias).
- [ ] Web (MEDIO): hreflang inválido en páginas de país, /trabajar-en/españa
  responde 200 "País no encontrado", número de países distinto en manifest
  (19) y prompt de Guzzi (49) frente a 26, cifras sin fuente ("95 %", "75 %",
  "369 €" de InfoJobs), títulos repetidos (/empresas, /cookies), /auth/registro
  titulado "Iniciar sesión".
- [ ] Funciones (MEDIO): comparador de salarios con cifras de 3 ofertas
  (camarero en Valencia 81.000 €), notificaciones que esconden los errores.
- [ ] Sin probar por presupuesto: empresas por zona, ETT y cámara (Places de
  pago), envío au pair, escribir una reseña, canjear un código de referido.

## LOS TRES FALLOS DEL CV (2 oct 2026)

Contados por Michel, reproducidos en producción y arreglados.

- [x] **No se podía descargar el CV** (`b848c84`, `e3a264e`). En el móvil el
  botón abría una página con `{"error":"No autorizado"}`: el enlace del PDF lo
  abre `window.open` FUERA del WebView y allí no hay sesión, pero el servidor
  la exigía. Lo protege su propio azar (128 bits, un uso, 5 minutos). De paso,
  el botón "PDF" de **CVs guardados** tampoco funcionaba en el móvil —abría una
  ventana en blanco para imprimir a mano— y ahora los dos usan
  `lib/cv-generator/descargar-pdf.ts`. Verificado: PDF real de 2 MB.
- [x] **Guzzi se iba por las ramas** (`b848c84`). "Cambiar mi experiencia de
  carretillero" acababa en BUSCAR CURSOS (la regla de cursos nombra los carnés)
  y "cambiar el puesto de mi cv" en buscar ofertas. Y cuando no, prometía
  "súbeme tu CV en PDF y te lo actualizo", que no existe. Intent `editar_cv`
  nuevo que lleva al editor de verdad y ofrece redactar el texto.
- [x] **"Mejorar con IA" no mejoraba nada** (`b848c84`, `ff6a2e8`). La IA
  respondía bien, pero el texto solo vivía en la vista previa: el formulario se
  quedaba igual, al guardar se guardaba lo de antes y por debajo de 1024 px la
  vista previa está oculta, así que en el móvil no cambiaba nada a la vista.
  Ahora entra en los campos, se avisa de qué se ha reescrito y hay "Deshacer".
  Además una pulsación gastaba 4 del tope de 15/hora y se cortaba a medias con
  un mensaje confuso: el tope sube a 40 y, si se alcanza, se dice una sola vez.

### Abierto: decisiones de Michel

- [ ] **buscaycurra.es no recibe correo** (no tiene registro MX). La web
  publica soporte@, privacidad@, contacto@ y hola@, y todo lo que se escriba
  ahí se pierde. La de privacidad la exige la ley. Hostinger no tiene opción
  gratuita para un dominio sin plan de correo: el más barato, Starter, cuesta
  0,39 $/mes a 48 meses (renueva a 1,59 $/mes), un buzón con alias. Se contrata
  en hPanel → Correos; como el DNS está en Hostinger, se configura solo.
- [x] **2.040.749 ofertas caducadas hace más de 90 días borradas** (30 sep,
  decisión de Michel). Se respetaron las guardadas, en candidaturas o en el
  historial de envíos. La limpieza diaria ya las borra sola (`e12d814`).
  La tabla pasa de 5,25 a 3,21 millones de filas; el fichero no encoge (haría
  falta VACUUM FULL con la tabla bloqueada), pero el hueco lo reutilizan las
  ofertas nuevas y el disco deja de crecer.
- [x] **290.707 ofertas invisibles** con isActive vacío (`f49d892`, migración
  008): 39.143 de Suecia y 4.049 de Polonia pasan a verse.
- [ ] **La base tiene 64 MB de memoria compartida** (valor por defecto de
  Docker): el VACUUM en paralelo falló por eso el 30 sep. No hay rastro de que
  afecte a la app, pero al recrear el contenedor conviene darle `--shm-size=256m`.
- [ ] **~29 cuentas de prueba** (audit*, qa-*, prueba*, test*...) cuentan como
  usuarios en las cifras.
- [ ] **Hay un `git stash` antiguo sin aplicar** (`WIP on unified-production:
  2ddb1e9`). Solo cambia un texto de `/api/jobs/bulk-index` y está obsoleto: ese
  fichero ya no tiene la variable que usa. Borrarlo con `git stash drop` cuando
  Michel confirme.
- [ ] **`/api/jobs/bulk-index` dice "400.000 ofertas"** cuando hay 2,5 millones.
  Es un dato de mantenimiento, no lo ve ningún usuario, pero engaña al mirarlo.
- [ ] **Webhook de Stripe:** activar `invoice.payment_failed` e
  `invoice.payment_succeeded` en https://dashboard.stripe.com/webhooks (no es
  imprescindible: el código ya lo cubre con `subscription.updated`).
- [ ] **Adzuna publica sueldos por hora multiplicados** ("72000 - 90000" para
  camarero de barra). Las estadísticas ya los aguantan, pero la ficha de la
  oferta los enseña tal cual.
- [ ] **Careerjet se guarda como `EURES_BER`, `EURES_LON`...** Es un nombre
  engañoso (no es EURES). Cambiarlo afecta a los identificadores: no tocar sin
  plan.

## ABIERTO (encontrado el 22 sep 2026)

- [ ] **DeepSeek sin saldo** (-0,01 USD, la API responde 402). Es el primer
  modelo de Guzzi para usuarios de pago, de la vista previa de la carta y del
  router de `lib/ai`. Todo cae a Groq u OpenAI, así que funciona, pero no con el
  modelo elegido. (Corrección del 30 sep: el router de `lib/ai` NO caía, y
  "Mejorar mi CV" y la nota ATS daban 500; arreglado en `805d4d5`.) **Decisión de Michel:** recargar
  (https://platform.deepseek.com/top_up) o cambiar de primer modelo.
- [ ] **`deepseek-v4-flash` es ya un nombre antiguo.** La cuenta solo lista
  `deepseek-flash` (V4.1) y `deepseek-v4-pro`; la documentación dice que el
  nombre viejo se sigue aceptando. Pasar a `deepseek-flash` cuando haya saldo
  para probarlo: por defecto razona (`effort` high) y puede cambiar tiempos.
- [ ] **Tope de Google Places: 500 al día en `PLACES_MAX_DIA`**, cuando el
  comentario de `lib/places-quota.ts` razona 300 para no pasar del crédito
  gratuito de Google. **Decisión de Michel.**
- [ ] **`/api/jobs/semantic-search` no lo llama ninguna pantalla.** Se arregló
  su modelo, pero es código muerto: decidir si se conecta o se borra.

## ABIERTO (encontrado el 15 sep 2026)

- [ ] **Arbeitnow lleva parado desde el 19 de agosto.** 6.295 ofertas vivas y
  ninguna alta en 27 días. Solo lo sincronizaban `sync-fuentes-extra.sh` y
  `sync-nocturno.sh`, y ninguno está en el crontab. El centinela lo marca, con
  razón. **Decisión de Michel:** volver a programarlo o retirarlo.
- [ ] **`/root/candados.sh` lleva escrita una contraseña real** de la cuenta con
  la que prueba el inicio de sesión. Quedó a la vista durante la revisión del
  15 sep: **hay que cambiarla** y hacer que el script la lea de `.env.local`.
  Hasta entonces no se versiona. **Requiere a Michel.**
- [ ] **Las copias de seguridad están en el mismo servidor.** `backup-bc.sh`
  (04:00 UTC, 7 días) guarda la base propia, `.env.local` y el crontab en
  `/root/backups`: si se pierde el VPS, se pierden con él. **Supabase no se copia**
  (usuarios, envíos, notificaciones). Falta una copia fuera del VPS.
- [ ] **`sync-adzuna-19.sh` sigue pidiendo Brasil, India, México y Sudáfrica**, que
  no son de los 26 países de la aplicación: gasta cuota en ofertas que no ve
  nadie. **Decisión de Michel.**
- [ ] **El vigilante `watchdog-bc.sh` no está en el crontab**, y sus avisos solo
  iban a `/tmp/watchdog-alerts.log`.

## YA ARREGLADO (no volver a mirarlo)

- **La cámara reconocía la marca y luego devolvía cualquier cosa (29 sep 2026).**
  Probado con fotos reales: el reconocimiento acertaba (Nike Air Max, Adidas,
  Font Vella, Zara), pero Nike devolvía una tienda de deportes, Font Vella una
  fuente de Girona, las "ofertas cerca de Tudela" eran de Berlín y Plymouth, el
  modelo tenía orden de adivinar marcas, una fachada de Zara devolvía el
  Stradivarius de al lado y el botón de enviar CV no salía nunca tras una foto.
  Ahora (`lib/camara/ficha-marca.ts`): la empresa de verdad (Nike, Inc.; Aguas
  Danone; Inditex), su web y portal de empleo **comprobados**, sus tiendas y las
  que la venden por separado, sus ofertas reales en España (Nike 8, Adidas 14),
  y queda guardada. Nueve tests del sello. **Pendiente de Michel: probarlo desde
  el móvil**, que es lo único que no se ha podido comprobar desde el servidor.

- **Guardar una oferta desde una notificación fallaba siempre (22 sep 2026).**
  La pantalla llamaba a `/api/jobs/save` y `/api/jobs/unsave`, que **no
  existen** (es `/api/jobs/guardar`, con la acción en el cuerpo): 404 y un
  "No se pudo guardar la oferta" sin explicación. Y en la ficha de la oferta se
  leía el motivo real del servidor y luego se tiraba, así que el tope de
  guardadas del plan salía como un error genérico. Un test del sello comprueba
  ahora que **ninguna pantalla llama a una ruta de API que no existe**.

- **La cuenta de Michel (`michelkm11batista@gmail.com`) está en plan `empresa`
  por decisión suya, no por un pago** (22 sep 2026). Tiene `stripe_customer_id`
  de una suscripción cancelada, así que el control 11 del centinela no la cuenta
  como plan regalado. Si algún día cuadra ingresos, esta cuenta no es un cliente.

- **La aplicación perdió Redis (22 sep 2026, 10:48 UTC).** Easypanel recreó
  Redis con otra IP y la aplicación seguía usando la vieja, fijada en
  `/etc/hosts` del servidor. Sin Redis no arrancaba el envío de CV, la cuota de
  Google Places fallaba cerrada y **toda búsqueda de empresas y de ETTs caía a
  OpenStreetMap**: por eso "La Papelera de Buñuel" no aparecía y Tudela daba 0
  ETTs. Arreglado conectando la aplicación a la red de Redis
  (`easypanel-buscaycurra`) y quitando la línea vieja (copia en
  `/etc/hosts.bak-20260922`). Ahora `build-deploy.sh` hace esa conexión y un PING
  a Redis en cada despliegue, y el centinela lo vigila a diario (control 13).
  Comprobado después: La Papelera → Sofidel Tudela (Pol. Ind. de Buñuel); Tudela
  → 11 ETTs.

- **El buscador de ETTs daba agencias de otra provincia o de otro país
  (22 sep 2026).** "Cabanillas" devolvía ETTs de Guadalajara (hay dos Cabanillas
  y no se avisaba de cuál se había entendido) y "Berlin" tres de cinco
  resultados en Barcelona, porque siempre se preguntaba en español. Además se
  guardaba en caché pero no se leía: cada búsqueda repetida volvía a pagar ~33
  llamadas. Ahora: caché primero, se sitúa el sitio en el mapa, se pregunta con
  las palabras de cada país (26 en `lib/ett-terminos.ts`), se descarta por
  distancia real (35 km, hasta 120 en pueblos) y se piden 12 detalles como mucho
  → de ~33 llamadas de pago por búsqueda a 16.

- **La caché de empresas se vaciaba sola (22 sep 2026).** Al guardar, la ciudad
  de cada ficha se sobrescribía con lo último buscado: buscar en Fustiñana
  reetiquetaba las ETTs de Tudela y la caché de Tudela bajó de 14 fichas a 5.
  Migración **006 aplicada en producción** (lat/lon + índice en `empresas`): la
  caché ya es geográfica, a 35 km del sitio, se llame como se llame el pueblo.
  Comprobado: Fustiñana y Cabanillas devuelven las ETTs de Tudela **gratis**
  (7-11 km), Berlín devuelve agencias alemanas (Randstad Cityhaus, Orizon,
  DIS AG) y Tudela 12 ETTs con email.

- **Guzzi perdía casi un segundo por mensaje llamando a DeepSeek sin saldo
  (22 sep 2026).** El primer 402 ahora apaga DeepSeek seis horas y se reintenta
  solo: el día que se recargue vuelve a entrar sin desplegar nada.

- **Cuatro llamadas a IA con modelos retirados (22 sep 2026).** `gemini-1.5-flash`
  (mejorar CV, carta) → `gemini-3.5-flash-lite`; `llama-3.1-8b-instant` (búsqueda
  semántica) → `openai/gpt-oss-20b`; `deepseek-chat` (retirado el 24 jul) →
  `deepseek-v4-flash`. El sello falla si vuelve a aparecer un nombre retirado.

- **Las tareas programadas nuevas no se ejecutaban nunca (15 sep 2026).** El
  centinela y el barrido de Adzuna se escribieron como workflows de GitHub. Ahora
  están en el crontab del VPS (centinela 07:30 UTC, barrido 11:00 UTC) y el
  centinela **avisa por correo** cuando cambia el resultado, y los lunes si siguen
  los fallos: antes no existía ningún canal de avisos. Además: Japón y Singapur
  añadidos al script real de Careerjet (Singapur probado: 7 de 7), Suecia fuera
  de `sync-adzuna-loop.sh`, seis scripts dejan de llevar la clave de
  administración escrita, y los 14 scripts del crontab quedan versionados. El
  centinela deja de dar falsas alarmas por nombres de fuente retirados
  (`careerjet_*`) y por ciudades de Careerjet que esperan su turno (`EURES_*`).

- **Seis de los 26 países no se sincronizaban nunca.** Japón, Singapur, Grecia,
  Chequia, Hungría y Rumanía no estaban en ningún calendario. Su configuración
  llevaba tiempo escrita en `careerjet-countries.ts` —entre 330 y 600
  combinaciones de palabra y ciudad cada uno— y nadie la llamaba. Japón acabó
  con **19 ofertas en total**: quien lo elegía entre los destinos abría la
  aplicación, no encontraba nada, y no había ningún aviso que lo explicara.
  ~~Añadidos al calendario.~~ **Corregido el 15 sep:** se añadieron a
  `sync-jobs.yml`, que no se ejecuta. Grecia, Chequia, Hungría y Rumanía ya los
  pedía el script real del VPS; **Japón y Singapur no, hasta el 15 sep.** Lo que
  creció Japón (477 y luego 1.278 ofertas) salió de tandas lanzadas a mano el
  5 sep. Comprobado antes contra la API: Tokio 1.719 con "hotel".

- **6.820 ofertas españolas estaban guardadas como suecas.** Adzuna publica 19
  países y el calendario de sincronización pedía además Irlanda y Suecia, que no
  están. El código no fallaba: caía a España por tres sitios a la vez —
  consultaba la API española, buscaba en ciudades españolas y etiquetaba el
  resultado con el país pedido. Quien filtraba por Suecia veía Galicia; quien
  filtraba por España no las veía. Arreglado en las tres capas: el sincronizador
  se planta ante un país que Adzuna no cubre, el calendario ya no los pide (su
  presupuesto pasa a Bélgica y Austria, que sí existen) y las filas se han
  reetiquetado. España: 29.599 → 36.372 ofertas activas.
  **Corregido el 15 sep:** quitar Suecia del calendario no tuvo efecto, porque no
  se ejecuta. Quien la seguía pidiendo tres veces al día era
  `/root/sync-adzuna-loop.sh`, y se quitó de ahí el 15 sep. Lo que sí protegía
  desde el 4 sep era el freno del propio sincronizador.

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
  gastan diez fotos de GPT-4o en vez de dos.~~ **ARREGLADO**: la cámara suma y
  comprueba en la misma operación, con la función `consumir_uso_camara` de
  `db/migrations/005_consumir_cuota_atomico.sql`. El `where` del `on conflict`
  es lo que lo hace atómico: si no queda cuota no actualiza, no devuelve fila, y
  llega `null`. Si la función faltara, el código usa el método viejo y lo avisa
  por el log.
  **Migración aplicada en Supabase el 15 sep 2026** por Michel, y comprobada
  desde el servidor sin escribir datos: la clave pública recibe
  `42501 permission denied`; el servidor la ejecuta (límite 0 → `null`); y
  `consumir_consulta_guzzi` sobre un contador ya por encima del límite responde
  `null` y lo deja igual (2 → 2).
  Antes de aplicarla se corrigieron dos fallos de la primera versión: con
  `camara_usos` a NULL habría respondido "sin cuota" para siempre (ahora
  `COALESCE`), y al ser `SECURITY DEFINER` con los permisos por defecto de
  Supabase, cualquiera con la clave pública podía gastar la cuota de otro
  usuario (ahora solo `service_role`, con `search_path` fijo).
  **Guzzi también, desde el 15 sep 2026:** `trackGuzziQuery`
  (`lib/usage-tracker.ts`) usa `consumir_consulta_guzzi` en vez de leer,
  comprobar y escribir; el método antiguo solo queda de respaldo, con aviso en el
  log. Probado ANTES de desplegar, con el código nuevo dentro del contenedor de
  producción, sobre un día inventado (2099-01-01) y la cuenta de administración:
  **25 mensajes a la vez con el límite gratuito de 15 → exactamente 15 permitidos
  y 10 denegados**, restantes 0-14 sin repetir ninguno, contador final 15 y
  ninguna caída al método antiguo. La fila de prueba se borró.

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

- [x] ~~**El filtro de salario mínimo no filtra.** `route.ts:248` hace
  `regexp_replace(salary,'[^0-9]','')`: `"15600 - 18000"` → `1560018000`.
  ~3 de cada 4 salarios producen un número inflado.~~ **ARREGLADO**: se toma el
  primer número (el mínimo del rango), quitando antes los separadores de miles
  o `£100,000` se quedaba en 100. Comprobado contra producción con los ocho
  formatos reales, millones incluidos.
  **Queda fuera**: los 94.217 salarios por hora (`13.9 per hour`) dan 13 y no
  casan con un filtro anual. Convertirlos exigiría inventarse las horas
  semanales de cada oferta, así que no se hace.

- [x] ~~**Los respaldos tiran el filtro de país.** El respaldo por ciudad no lleva
  `country` en el WHERE, y `buscarOfertasReales` no lo recibe. Pedir Alemania
  devuelve España; un país inexistente devuelve ofertas españolas.~~
  **ARREGLADO en el respaldo por ciudad**: lo llevan ya la consulta y su
  recuento, que tenían que filtrar por lo mismo. Importa porque hay ciudades
  homónimas: Toledo está en Castilla-La Mancha y en Ohio, Valencia en España y
  en Venezuela.
  **Pendiente**: `buscarOfertasReales` sigue sin recibir el país.

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
