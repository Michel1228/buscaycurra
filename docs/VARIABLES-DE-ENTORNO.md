# Variables de entorno — las 56 que usa el código

> **Aquí no hay ni un solo valor real, y no debe haberlo nunca.** Este
> repositorio es **público**: cualquiera puede descargarlo sin credenciales.
> Esto es solo el inventario de qué hace falta y de dónde sacarlo.
>
> Los valores reales están en dos sitios:
> - **El contenedor en producción** — `docker inspect buscaycurra-nextjs --format '{{range .Config.Env}}{{println .}}{{end}}'`
> - **El fichero local de credenciales** de Michel (fuera de la nube)

Generado leyendo `process.env.*` en `app/`, `lib/`, `components/`, `scripts/`
y `next.config.ts`. El número de usos indica lo crítica que es cada una.

---

## Imprescindibles — sin esto la aplicación no arranca

| Variable | Usos | Qué es |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 106 | URL del proyecto de Supabase. **Pública por diseño** |
| `SUPABASE_SERVICE_ROLE_KEY` | 77 | Clave de servicio. **Se salta RLS: nunca en el navegador** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 28 | Clave anónima. **Pública por diseño**, viaja en el JavaScript |
| `REDIS_URL` | 7 | **Lleva contraseña dentro** (`redis://:CLAVE@host:6379`). Sin ella, Redis rechaza la conexión |
| `DATABASE_URL` o `PGHOST`+`PGPORT`+`DATABASE_PASSWORD` | 3+3 | La **base propia** (`buscaycurra-db`), donde viven `user_cvs`, `CV` y `JobListing`. **No es Supabase** |

⚠️ **Las dos bases de datos son distintas.** Es el error que más veces ha
costado tiempo en este proyecto: preguntar por una tabla a la base equivocada
no da error, da lista vacía.

---

## Pagos

| Variable | Qué es |
|---|---|
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe (`sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Para verificar la firma del webhook (`whsec_…`) |
| `STRIPE_PRICE_ESENCIAL` / `_PRO` / `_EMPRESA` | Los identificadores de precio |
| `STRIPE_PRICE_BASICO` | ⚠️ **Sobra.** Es el plan de 4,99 € retirado. Archivar en Stripe y quitar |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Pública por diseño |
| `REVENUECAT_WEBHOOK_SECRET` | Suscripciones de iOS y Android |
| `NEXT_PUBLIC_REVENUECAT_API_KEY_IOS` | Pública por diseño |

---

## Inteligencia artificial

| Variable | Usos | Para qué |
|---|---|---|
| `GROQ_API_KEY` | 13 | El principal de Guzzi. **Ojo: Groq retira modelos sin avisar** — ya pasó con `llama-3.3-70b` |
| `DEEPSEEK_API_KEY` | 8 | Alternativa |
| `OPENAI_API_KEY` | 4 | GPT-4o para las tareas de calidad máxima |
| `GEMINI_API_KEY` | 2 | Alternativa |
| `AI_CACHE_ENABLED` | 1 | Interruptor del caché de respuestas |

---

## Fuentes de ofertas de empleo

| Variable | Fuente |
|---|---|
| `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` | Adzuna (gratis hasta 250 peticiones/día) |
| `ADZUNA_API_KEY` | ⚠️ Duplicada de `ADZUNA_APP_KEY`. Unificar |
| `JOOBLE_API_KEY` | Jooble (gratis con registro) |
| `CAREERJET_API_KEY` | Careerjet — **es lo que en el código se llama "EURES"** |
| `FRANCE_TRAVAIL_CLIENT_ID` + `_SECRET` | Empleo público francés |
| `USAJOBS_KEY` | Empleo público de Estados Unidos |

---

## Correo, avisos y empresas

| Variable | Qué es |
|---|---|
| `RESEND_API_KEY` | Envío de correo. El dominio `buscaycurra.es` está verificado |
| `FROM_EMAIL` | Remitente. Por defecto `noreply@buscaycurra.es` |
| `GOOGLE_PLACES_API_KEY` | Datos y correos de empresas. **Cuesta dinero por consulta** |
| `PLACES_MAX_DIA` | Tope diario de consultas a Places, para que no se dispare la factura |
| `VAPID_PRIVATE_KEY` + `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_EMAIL` | Notificaciones push del navegador |
| `WHATSAPP_*` (5 variables) | 💤 **Apagado desde el 6 ago 2026**: Meta cobra 0,0509 € por aviso. El correo hace lo mismo gratis |

---

## Secretos internos

| Variable | Usos | Qué protege |
|---|---|---|
| `ADMIN_SECRET` | 37 | Las rutas de administración y las llamadas internas entre servicios |
| `ALERTS_SECRET` | 3 | El cron de alertas. **El sello lo necesita para comprobarlo** |
| `SYNC_SECRET` | 2 | Los endpoints de sincronización de ofertas |
| `CRON_SECRET` | 1 | Tareas programadas |
| `WEBHOOK_SECRET` | 1 | ⚠️ Genérico y confuso. Ya hubo una fuga con él — revisar si sigue haciendo falta |
| `ADMIN_EMAILS` / `NEXT_PUBLIC_ADMIN_EMAIL` | 1+3 | Quién puede entrar al panel |

---

## Ajustes y rendimiento

| Variable | Qué hace |
|---|---|
| `WORKER_CONCURRENCY` | Cuántos envíos de CV a la vez. **Ojo: el VPS tiene 2 núcleos** |
| `BATCH_SIZE` | Tamaño de los lotes de sincronización |
| `CACHE_TTL_DEFAULT` | Cuánto vive el caché |
| `CHROMIUM_PATH` | Dónde está Chromium para generar los PDF |
| `NEXT_PUBLIC_SITE_URL` / `_APP_URL` / `BASE_URL` | ⚠️ **Tres variables para la misma URL.** Unificar |
| `NEXT_PUBLIC_BUILD_ID` / `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` | Identificar el despliegue |
| `NODE_ENV` | Lo pone Next.js solo |

---

## Cómo se inyectan (esto importa)

Hay **dos momentos distintos** y confundirlos rompe el despliegue:

**En la construcción de la imagen** (`--build-arg`) — las `NEXT_PUBLIC_*` se
quedan grabadas dentro del JavaScript:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

**Al arrancar el contenedor** (`docker run -e`) — todo lo demás.

> 🔒 **Nunca hagas `docker build` a mano.** Sin los `--build-arg` la aplicación
> se construye sin las claves públicas y el navegador no puede ni conectarse a
> Supabase. Usa siempre `/root/deploy-manual.sh`.

## Para recuperar los valores reales

```bash
ssh root@<ip-del-vps> \
  'docker inspect buscaycurra-nextjs --format "{{range .Config.Env}}{{println .}}{{end}}"'
```

Y para una sola variable, sin volcarlas todas por pantalla:

```bash
ssh root@<ip-del-vps> \
  'docker inspect buscaycurra-nextjs --format "{{range .Config.Env}}{{println .}}{{end}}" | grep ^NOMBRE_VARIABLE='
```

---

## Pendientes que salieron al hacer este inventario

1. **`STRIPE_PRICE_BASICO`** — plan de 4,99 € retirado, sigue activo en Stripe
2. **`ADZUNA_API_KEY` vs `ADZUNA_APP_KEY`** — dos nombres para lo mismo
3. **`NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` / `BASE_URL`** — tres para la misma URL
4. **`WEBHOOK_SECRET`** — genérico, y ya se filtró una vez
5. **`.env.example` documenta 28 de 56** — le faltan 28
