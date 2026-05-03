# BuscayCurra — Contexto del Proyecto

## Qué es esta app

**BuscayCurra** es una plataforma web de búsqueda de empleo con IA para el mercado español.
El nombre del asistente IA es **Guzzi** (o Gusi) y tiene forma de gusano 🐛.

**Dominio en producción:** https://buscaycurra.es
**VPS (Hostinger):** 187.124.37.183
**SSH:** `ssh -i "C:/Users/miche/.ssh/hostinger_openclaw" root@187.124.37.183`

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Auth + DB | Supabase (PostgreSQL) |
| Pagos | Stripe (suscripciones: Básico / Pro / Empresa) |
| Colas | Redis + BullMQ (envío masivo de CVs) |
| Deploy | Docker, Traefik (reverse proxy), VPS Hostinger |
| Agente IA | Kimi K2.6 via OpenClaw (Telegram @MichellBG_Bot) |
| APIs empleo | Adzuna, Jooble, Careerjet |
| Email | Resend (SMTP) |

---

## Módulos principales

- **`/app/gusi`** — Chat con Guzzi (asistente IA principal)
- **`/app/buscar`** — Búsqueda de ofertas de empleo
- **`/app/guardados`** — Ofertas guardadas
- **`/app/pipeline`** — Pipeline de candidaturas (kanban)
- **`/app/envios`** — Envío masivo de CVs con BullMQ
- **`/app/perfil`** — Cuenta y suscripción Stripe
- **`/app/salarios`** — Comparador de salarios
- **`/app/reviews`** — Reviews de empresas
- **`/app/referidos`** — Sistema de referidos
- **`/auth/login`** — Login (diseño split-screen marketing)
- **`/auth/registro`** — Registro

---

## Sistema de diseño

```
Fondo principal:   #0f1117  (negro azulado)
Fondo secundario:  #111827
Tarjetas:          #1e212b  + borde #2d3142
Verde principal:   #22c55e  (color de marca)
Texto principal:   #f1f5f9
Texto secundario:  #94a3b8
Texto muted:       #64748b
Error:             #ef4444
```

**Componentes globales:**
- `btn-game` — botón verde principal
- `card-game` — tarjeta con borde sutil

**Mascota:** Gusano SVG animado (gradiente verde, efecto glow)

---

## Infraestructura en producción

```bash
# Contenedores Docker activos
buscaycurra-nextjs   → puerto 8892 (Next.js)
buscaycurra-api      → puerto 3001 (Express/Prisma)
buscaycurra-redis    → puerto 6379
buscaycurra-db       → puerto 5433 (PostgreSQL)
```

**Red Docker:** `busca-y-curra_default`

**Variables de entorno runtime (docker run -e):**
- `REDIS_URL=redis://buscaycurra-redis:6379`
- `API_URL=http://buscaycurra-api:3001`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`
- `SUPABASE_SERVICE_ROLE_KEY`

**Variables baked en build (--build-arg):**
- `NEXT_PUBLIC_SUPABASE_URL=https://ojesordjedovnpyxspxi.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_YCsE2bdWgmtR8U9AvmfRCA_n09gvZyN`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## Supabase

**URL:** https://ojesordjedovnpyxspxi.supabase.co
**Anon key:** `sb_publishable_YCsE2bdWgmtR8U9AvmfRCA_n09gvZyN`
**Tablas principales:** `profiles`, `candidaturas`, `ofertas`, `cv_queue`, `referrals`, `subscriptions`

---

## Código fuente en el servidor

El código fuente está en el VPS en:
```
/root/.openclaw/workspace/buscaycurra-unified/
```

Rama activa: `unified-production` (GitHub: michelbatista/buscaycurra o similar)

---

## Agente Telegram (OpenClaw)

- **Bot:** @MichellBG_Bot (token: `8312696057:AAHh4kNjCoD_E4YsIvAxdVXDPGRNttJOB74`)
- **Modelo:** Kimi K2.6 — SIEMPRE este modelo, nunca Opus, nunca Groq sin permiso explícito
- **Config:** `/root/.openclaw/openclaw.json`
- **Servicio:** `systemctl --user status openclaw-gateway`
- **KIMI_API_KEY:** `sk-1V46gvX6EUOmVL4C4Lmrk7FsOmETkzlRhd0rmFpPYhHo5IbK`

---

## Credenciales (archivo completo)

Todas las claves en: `C:\Users\miche\OneDrive\Escritorio\CREDENCIALES\todas_las_credenciales.txt`

---

## Convenciones de trabajo

1. **Idioma:** Español siempre en conversación y comentarios de código
2. **Commits:** en español o inglés, sin emojis
3. **Rutas `/app/*`** → muestran navegación (AppNavWrapper)
4. **Rutas `/auth/*`** → sin navegación (solo layout mínimo)
5. **Rutas `/`** → landing pública
6. Las páginas de auth usan diseño split-screen (marketing izquierda, formulario derecha)
7. `"use client"` en páginas con estado o hooks; sin `"use client"` en server components

---

## Estructura del proyecto

```
app/
├── app/           → Rutas protegidas /app/* (requieren auth)
│   ├── gusi/      → Chat con Guzzi (asistente IA)
│   ├── buscar/    → Búsqueda de ofertas
│   ├── guardados/ → Ofertas guardadas
│   ├── pipeline/  → Kanban de candidaturas
│   ├── envios/    → Envíos masivos BullMQ
│   ├── perfil/    → Cuenta + Stripe
│   ├── salarios/  → Comparador
│   ├── reviews/   → Reviews empresas
│   └── referidos/ → Referidos
├── auth/          → Login / Registro / Recuperar (sin nav)
├── api/           → API routes (Server Actions)
├── precios/       → Landing de precios (pública)
├── empleo/        → Landing pública
└── page.tsx       → Landing principal
components/        → Componentes compartidos
lib/               → Supabase, Stripe, BullMQ, utils
```

---

## Comandos clave

```bash
# Desarrollo local
npm run dev           # Arranca en localhost:3000

# Build + deploy al VPS
git push origin unified-production
# Luego en el servidor:
# cd /root/.openclaw/workspace/buscaycurra-unified
# docker build -t buscaycurra:latest .
# docker stop buscaycurra-nextjs && docker rm buscaycurra-nextjs
# docker run -d --name buscaycurra-nextjs ...

# Redis local (para BullMQ)
docker run -d -p 6379:6379 redis:7-alpine
```

---

## Skills de desarrollo disponibles

### Instaladas en ~/.claude/skills/
| Skill | Cuándo usarla |
|-------|--------------|
| `nextjs-developer` | App Router, server components, API routes, middleware |
| `react-expert` | Componentes, hooks, estado, rendimiento |
| `typescript-pro` | Tipos avanzados, type guards, strict mode |
| `frontend-design` | UI premium, componentes visuales, diseño |
| `javascript-pro` | Lógica avanzada, async/await, Node.js |
| `debugging-wizard` | Errores, stack traces, diagnóstico sistemático |
| `react-native-expert` | App móvil (si aplica) |
| `webapp-testing` | Tests con Playwright |
| `theme-factory` | Temas y estilos globales |

### Skills del sistema (built-in de Claude Code)
| Skill | Cuándo usarla |
|-------|--------------|
| `/feature` | Implementar una feature completa (multi-agente) |
| `/review` | Revisión profunda de código (diseño, seguridad, perf) |
| `/test` | Generar tests priorizados por ROI |
| `/simplify` | Revisar y simplificar código cambiado |
| `/security-review` | Auditoría de seguridad de los cambios pendientes |

---

## MCP configurado (.mcp.json)

- **GitHub** (`@modelcontextprotocol/server-github`): gestión de PRs, ramas, issues del repo `Michel1228/buscaycurra`

> Pendiente añadir Supabase MCP cuando se obtenga el service role key desde https://supabase.com/dashboard/project/ojesordjedovnpyxspxi/settings/api

---

## APIs externas — precios

Antes de sugerir cualquier servicio externo de pago, indicar precio y URL de alta.

- **Adzuna:** gratuito hasta 250 req/día → https://developer.adzuna.com
- **Jooble:** gratuito con registro → https://es.jooble.org/api
- **Resend:** gratuito hasta 3.000 emails/mes → https://resend.com/pricing
- **Stripe:** comisión por transacción → https://stripe.com/es/pricing
- **OpenAI GPT-4o-mini** para tareas rutinarias (barato), GPT-4o solo calidad máxima
