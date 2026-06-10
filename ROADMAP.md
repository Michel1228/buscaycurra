# 🗺️ HOJA DE RUTA — BuscayCurra

> **ATENCIÓN AGENTE:** Leer esto ANTES de tocar cualquier cosa.
> Cada "pasillo" tiene indicaciones de qué hay y dónde.

---

## 🏠 PLANO GENERAL

```
buscaycurra.es (Traefik)
    │
    ├── / → Next.js (buscaycurra-nextjs:8892)
    │       └── Frontend + Server Actions
    │
    ├── API interna → buscaycurra-api:3001 (Express + Prisma)
    │       └── Conecta a → VPS PostgreSQL (buscaycurra-db:5433)
    │
    └── Auth / Cloud → Supabase (ojesordjedovnpyxspxi.supabase.co)
```

---

## 🗄️ PASILLO 1: BASES DE DATOS (¡NO CONFUNDIR!)

### 📦 VPS PostgreSQL (buscaycurra-db:5433)
**→ Esta es LA base de datos principal. 2.18M de ofertas.**

| Tabla | Filas | Qué contiene |
|-------|-------|-------------|
| `JobListing` | **2.180.587** | 🔴 OFERTAS PRINCIPALES — el tesoro |
| `User` | 18 | Usuarios (auth local Prisma) |
| `Application` | 3 | Candidaturas pipeline |
| `CV` | ? | CVs completos (Prisma ORM) |
| `SavedJob` | ? | Ofertas guardadas |
| `cv_sends` | 51 | Envíos de CV |
| `gusi_conversations` | 300 | Historial chat Guzzi |
| `ScheduledCampaign` | ? | Campañas envío masivo |
| `CampaignRun` | ? | Ejecuciones de campañas |
| `company_reviews` | ? | Reviews empresas |
| `job_alerts` | ? | Alertas empleo |
| `push_subscriptions` | ? | Suscripciones push |
| `referrals` | ? | Referidos |
| `user_cvs` | ? | CVs subidos |
| `cv_cartas` | ? | Cartas presentación |

**Schema:** `contactEmail` (no `email_empresa`), `country` (no `ubicacion` para país)
**Conexión:** `docker exec buscaycurra-db psql -U buscaycurra -d buscaycurra`
**ORM:** Prisma (`buscaycurra-api:/app/prisma/schema.prisma`)

### ☁️ Supabase (cloud)
**→ Auth + perfiles + notificaciones. NO es la base de ofertas principal.**

| Tabla | Filas | Qué contiene |
|-------|-------|-------------|
| `auth.users` | 21 | Autenticación |
| `profiles` | 10 | Perfiles (plan, stripe, etc) |
| `ofertas` | 18.232 | ⚠️ LEGACY — NO USAR para contar |
| `cv_sends` | 53 | ⚠️ LEGACY — NO USAR para contar |
| `notificaciones` | 187 | Notificaciones push/email |
| `cvs` | 1 | CV (legacy) |

---

## 🚪 PASILLO 2: CONTENEDORES DOCKER

```
buscaycurra-nextjs  → :8892 → Next.js 14 (App Router)
buscaycurra-api     → :3001 → Express + Prisma
buscaycurra-db      → :5433 → PostgreSQL 16 (2.18M ofertas)
buscaycurra-redis   → :6379 → Redis 7 (BullMQ colas)
```

**Red:** `busca-y-curra_default`

---

## 📁 PASILLO 3: CÓDIGO FUENTE

```
/root/.openclaw/workspace/buscaycurra-unified/
├── app/                    → Next.js App Router
│   ├── app/                → Rutas protegidas (/app/*)
│   │   ├── gusi/           → Chat Guzzi (asistente IA)
│   │   ├── buscar/         → Búsqueda ofertas
│   │   ├── pipeline/       → Kanban candidaturas
│   │   ├── envios/         → Envíos masivos
│   │   ├── perfil/         → Cuenta + Stripe
│   │   └── ...
│   ├── auth/               → Login/Registro (sin nav)
│   ├── api/                → API Routes (server actions)
│   └── page.tsx            → Landing
├── components/             → Componentes compartidos
├── lib/                    → Supabase client, utils
└── .env.local              → Variables entorno (CRÍTICO)
```

**Rama GitHub:** `unified-production` (Michel1228/buscaycurra)

---

## 🔑 PASILLO 4: CREDENCIALES Y ACCESOS

| Servicio | Ubicación |
|----------|-----------|
| Todas las claves | `C:\Users\miche\OneDrive\Escritorio\CREDENCIALES\todas_las_credenciales.txt` |
| .env.local VPS | `/root/.openclaw/workspace/buscaycurra-unified/.env.local` |
| Supabase dashboard | https://supabase.com/dashboard/project/ojesordjedovnpyxspxi |
| Stripe dashboard | https://dashboard.stripe.com |
| VPS SSH | `ssh -i ~/.ssh/hostinger_openclaw root@187.124.37.183` |

---

## 🚨 PASILLO 5: PITFALLS (ERRORES COMUNES)

1. **NO uses Supabase `ofertas` para métricas** → solo tiene 18K legacy. Usa VPS `JobListing` (2.18M).
2. **NO uses Supabase `cv_sends`** → legacy. El real está en VPS.
3. **Schema VPS**: `contactEmail` no `email_empresa`. `country` no `ubicacion`.
4. **Deploy**: siempre con `--env-file .env.local`. NUNCA sin él.
5. **Build NEXT_PUBLIC_***: usar `export VAR="${ARG}" && npm run build` en mismo RUN. NUNCA `ENV` separado. (Ver skill `buscaycurra-docker-build`)
6. **PWA cache**: el service worker cachea bundles viejos. `unregister()` antes de auditar.
7. **Docker stop cuelga** → `timeout 10 docker kill` + `timeout 5 docker rm -f`.
8. **JSX/SWC**: arrow functions en template literals dentro de JSX rompen build → precomputar fuera.
9. **Guzzi intent detection**: patrón `\w+ en \w+` captura frases coloquiales → tiene exclusiones.

---

## 📊 PASILLO 6: MÉTRICAS CLAVE (actualizado 10 Jun 2026)

| Métrica | Valor | Fuente |
|---------|-------|--------|
| Ofertas totales | 2.180.587 | VPS JobListing |
| Ofertas nuevas/día | ~17.865 | VPS JobListing |
| Ofertas con email | 86 (0.004%) | VPS JobListing |
| Usuarios | 18 VPS / 21 Supabase auth | Ambos |
| Suscripciones pago | 2 (plan empresa) | Supabase profiles |
| Candidaturas | 3 | VPS Application |
| CV enviados | 51 | VPS cv_sends |

---

## 🔄 PASILLO 7: FLUJO DE DATOS

```
Extracción (GitHub Actions / cron)
    ↓
VPS PostgreSQL (JobListing) ← 2.18M ofertas
    ↓
buscaycurra-api (Express + Prisma)
    ↓
Next.js frontend → Usuario ve ofertas
    ↓
Guzzi envía CV → cv_sends (VPS) + notificaciones (Supabase)
    ↓
Stripe webhook → Supabase profiles (subscription_status)
```

---

## 📝 PASILLO 8: QUÉ HACE CADA AGENTE

| Agente | Rol |
|--------|-----|
| **Claw** (yo) | Auditoría, navegador, deploys, diagnóstico |
| **Cloud** | Codea features, corrige bugs |
| **Cron jobs** | Extracción ofertas cada 2h, alertas empleo cada 3h |

---

*Última actualización: 10 Jun 2026 — Claw tras cagarla mirando Supabase en vez de VPS*
