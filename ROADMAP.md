# 🐛 BuscayCurra — Hoja de Ruta y Estado Actual
> Actualizado: 12 Jun 2026 01:30 UTC · Por: Hermes (DeepSeek V4 Pro)

---

## 📍 ESTADO ACTUAL DE LA APLICACIÓN

### Producción (https://buscaycurra.es)
- **Build**: commit `bf51260` + cambios UI de hoy (CVSenderDashboard + header empresas)
- **Modelo IA**: DeepSeek V4 Pro, thinking OFF, temp 0.5
- **Ofertas**: 2.05M en 34 países (PG VPS) + 18.6K ES en Supabase
- **Usuarios**: 21 registrados
- **Envíos CV**: 58 totales
- **APIs empleo activas**: Jooble, Careerjet · Adzuna roto desde ~8 mayo
- **Google Places**: Funcional, sin emails extraídos aún

### Lo que FUNCIONA ✅
- Login/Registro Supabase
- Búsqueda de ofertas (Jooble + Careerjet)
- Guzzi chat IA con tools, streaming SSE, conversación memory
- Envío CV con BullMQ + Redis + carta IA personalizada
- Pipeline kanban
- Editor CV con foto y visibilidad
- Stripe suscripciones (Esencial 2.99€, Pro, Empresa)
- Sistema notificaciones (bell + Supabase + Web Push)
- Google Places (buscar empresas, extraer datos)
- ETTs por ciudad
- Comparador salarios (pocos datos aún)
- Entrevistas IA
- Emigrar a 34 países
- Au Pair
- Cámara Guzzi (OCR + Google Places)

### Lo que FALTA ❌
- **Extracción de emails de empresas**: 0 en Supabase. Worker existe pero no activo
- **Alertas inteligentes**: 0 alertas creadas. Sistema existe pero no se auto-crean
- **Portal de empresas**: Pendiente de implementar
- **Adzuna**: Scraper roto desde mayo. Sin nuevas ofertas de Adzuna
- **App móvil**: Rechazada por Apple (Guideline 2.2). Necesita resubmit
- **SEO programático**: Solo /empleo/[puesto]/[ciudad] básico, sin datos enriquecidos
- **Web Push**: 0 suscripciones activas

---

## 🎯 PRÓXIMOS PASOS (orden prioridad)

### 🔴 Críticos (esta semana)
1. **Activar extracción de emails de empresas** → Sin emails no se puede enviar CV
2. **Auto-crear alertas desde búsquedas** → Retención de usuarios
3. **Preparar resubmit iOS** → App Store es canal clave

### 🟡 Importantes (este mes)
4. **Agente Autónomo Guzzi Apply** → Unique Selling Point. NADIE en España lo tiene
5. **Skill Gap Analysis** → Premium feature. Visual radar chart
6. **Estimación salarial IA** → Desbloquear comparador salarios con datos estimados
7. **SEO Programático Ciudad×Puesto** → Tráfico orgánico masivo con 2M+ ofertas

### 🟢 Estratégicos (largo plazo)
8. **Talent Marketplace Inverso** → Empresas pagan por buscar candidatos
9. **WhatsApp Alerts** → 95% penetración España, >90% apertura
10. **Entrevistas IA con Voz** → Web Speech API

---

## 🔐 CREDENCIALES Y ACCESOS

### VPS Hostinger
- IP: 187.124.37.183
- SSH: `ssh -i ~/.ssh/hostinger_openclaw root@187.124.37.183`
- **Hermes workspace**: `/root/.openclaw/workspace/buscaycurra-unified/`
- **Rama**: `unified-production`
- **Repo**: `Michel1228/buscaycurra`

### Supabase
- URL: https://ojesordjedovnpyxspxi.supabase.co
- Anon key: `sb_publishable_YCsE2bdWgmtR8U9AvmfRCA_n09gvZyN`
- PAT expira: 17 junio 2026

### APIs IA
- DeepSeek: `deepseek-v4-pro` (primario) · Key: en .env.local
- Groq: `qwen/qwen3-32b` (fallback) · Key: en .env.local
- DeepSeek legacy `deepseek-chat` MUERE 24 julio 2026 → YA migrado a V4 Pro

### WhatsApp Business
- Phone Number ID: 1148143131713343
- Template: `buscaycurra_alerta_en` (4 params: nombre, puesto, ciudad, URL)
- Token expira → regenerar en business.facebook.com/settings/system-users

---

## 🐳 COMANDOS DOCKER

### Build
```bash
cd /root/.openclaw/workspace/buscaycurra-unified
docker build --no-cache -t buscaycurra:latest \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://ojesordjedovnpyxspxi.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_YCsE2bdWgmtR8U9AvmfRCA_n09gvZyN \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51R6VvuFpJ5Zv2pUCptbHrsIsgcZJnEWZfBneZB3iZSBnf61Tuwsa4GHgydmAp8aQVoqzIowEaZoIAIAQbDVn0osJ00fclX6yn4 \
  --build-arg NEXT_PUBLIC_API_URL=https://buscaycurra.es .
```

### Deploy
```bash
timeout 10 docker kill buscaycurra-nextjs 2>/dev/null
timeout 5 docker rm -f buscaycurra-nextjs 2>/dev/null
docker run -d --name buscaycurra-nextjs \
  --network busca-y-curra_default \
  --env-file /root/.openclaw/workspace/buscaycurra-unified/.env.local \
  -e REDIS_URL=redis://buscaycurra-redis:6379 \
  -e API_URL=http://buscaycurra-api:3001 \
  -p 8892:3000 buscaycurra:latest
```

### Contenedores activos
- `buscaycurra-nextjs` → :8892 (Next.js)
- `buscaycurra-api` → :3001 (Express/Prisma)
- `buscaycurra-redis` → :6379
- `buscaycurra-db` → :5433 (PostgreSQL)
- Red: `busca-y-curra_default`

---

## ⚠️ PITFALLS RECURRENTES

1. **NUNCA cambiar modelo IA sin consultar a Michel**
2. **NUNCA pedir API keys repetidamente** — si Michel dice que rotó, buscar en .env.local
3. **Build sin --no-cache** → variables NEXT_PUBLIC_* vacías en cliente → página en blanco
4. **Si Guzzi solo dice "¡Hola! Soy Guzzi..."** → LLMs no funcionan (keys inválidas)
5. **docker stop puede colgar** → usar timeout + kill + rm -f
6. **NO enlaces externos** a InfoJobs, LinkedIn, Indeed, Jooble, Careerjet, Adzuna
7. **NUNCA sugerir Madrid/Barcelona** por defecto en Guzzi — priorizar ciudad del usuario
8. **Límite DB pool**: max 5 conexiones

---

## 📊 MÉTRICAS CLAVE

| Métrica | Valor |
|---------|-------|
| Ofertas totales | 2.05M |
| Países | 34 |
| Ofertas España | 18,610 |
| Usuarios registrados | 21 |
| CVs enviados | 58 |
| Tasa apertura email | 54K (2.5%) |
| Planes activos | Esencial (2.99€), Pro (9.99€), Empresa (49.99€) |

---

## 🔄 CRONS ACTIVOS

- **GitHub Actions sync**: cada 2h (L-V), 4h (finde) → `.github/workflows/sync-jobs.yml`
- **Cron alertas VPS**: cada 3h → crontab root
- **WhatsApp alerts**: worker en background

---

## 📝 CONVENCIONES

- `"use client"` solo con estado/hooks
- Paleta: fondo `#0f1117`, verde `#22c55e`, texto `#f1f5f9`, secundario `#94a3b8`, muted `#64748b`
- Componentes: `btn-game` (botón verde), `card-game` (tarjeta con borde `#2d3142`)
- Commits: español o inglés, sin emojis
- Rutas `/app/*` → con AppNavWrapper
- Rutas `/auth/*` → sin nav, split-screen marketing
