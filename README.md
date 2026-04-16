# BuscayCurra 🎯
App de búsqueda de empleo y mejora de CV con IA
https://buscaycurra.es/app

---

## 🚀 Sistema de Caché con Redis

BuscayCurra usa un sistema inteligente de caché con **Redis** que minimiza al máximo las llamadas a la IA (Groq + Gemini), permitiendo que la app aguante miles de usuarios en el tier gratuito.

### ¿Cómo funciona el caché?

El sistema usa el patrón **"cache-aside"**: antes de llamar a la IA, siempre se comprueba si ya tenemos la respuesta guardada en Redis.

```
Usuario pide mejorar su CV
        │
        ▼
¿Está en Redis?
   │         │
  SÍ        NO
   │         │
   ▼         ▼
Respuesta  Llama a Groq/Gemini
instantánea  y guarda en Redis
(¡gratis!)  para futuras peticiones
```

### Tiempos de caché (TTL) por tipo de petición

| Tipo de petición | TTL (Free) | TTL (Pro) | TTL (Empresa) |
|-----------------|------------|-----------|---------------|
| Mejora de CV | 21 días | 10.5 días | 3.5 días |
| Búsqueda de ofertas | 6 horas | 3 horas | 1 hora |
| Carta de presentación | 36 horas | 18 horas | 6 horas |
| Análisis de empresa | 9 días | 4.5 días | 1.5 días |
| Chat del agente | 90 minutos | 45 minutos | 15 minutos |

> Los usuarios Free tienen TTLs más largos para ahorrar más llamadas a la IA.

### Estadísticas esperadas

Con el sistema de caché activo:
- **70-80% de reducción** en llamadas a la IA
- **Respuestas instantáneas** para peticiones repetidas (caché: <10ms vs IA: 2-3 segundos)
- Con 14.400 req/día de Groq → puede atender a **50.000+ usuarios** en lugar de 5.000

### Arquitectura del sistema

```
lib/
├── cache/
│   ├── redis-client.ts    → Cliente Redis centralizado
│   ├── ai-cache.ts        → Caché para respuestas de IA
│   ├── job-cache.ts       → Caché para ofertas de trabajo
│   ├── user-cache.ts      → Caché para datos de usuario
│   ├── smart-cache.ts     → Caché inteligente con prioridades
│   └── cache-monitor.ts   → Monitor de métricas
└── ai/
    ├── groq-client.ts     → Cliente Groq (Llama 3.3)
    ├── gemini-client.ts   → Cliente Gemini 1.5 Flash
    └── ai-router.ts       → Router inteligente de IAs

app/api/cache/stats/
    └── route.ts           → Endpoint admin de estadísticas

components/
    └── CacheMonitor.tsx   → Panel visual de monitoreo
```

### Cómo obtener las API keys gratuitas

#### Groq (Llama 3.3 — Ultrarrápido)
1. Ve a 👉 https://console.groq.com
2. Regístrate gratis
3. Haz clic en **"API Keys"** → **"Create API Key"**
4. Copia la key y ponla en `GROQ_API_KEY`

**Límites gratuitos:** 14.400 req/día, 30 req/minuto

#### Google Gemini 1.5 Flash
1. Ve a 👉 https://aistudio.google.com
2. Regístrate con tu cuenta de Google
3. Haz clic en **"Get API Key"**
4. Copia la key y ponla en `GEMINI_API_KEY`

**Límites gratuitos:** 15 req/minuto, 1.500 req/día, 1M tokens/req

### Variables de entorno necesarias

```bash
# Redis
REDIS_URL=redis://localhost:6379

# IAs gratuitas
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...

# Configuración del caché
CACHE_TTL_DEFAULT=3600
AI_CACHE_ENABLED=true

# Panel de administración
ADMIN_SECRET=tu_secreto_muy_seguro
```

Copia `.env.example` como `.env.local` y rellena los valores.

### Panel de monitoreo (solo admin)

Puedes ver las estadísticas del caché en:
- **API:** `GET /api/cache/stats` con header `x-admin-secret: TU_ADMIN_SECRET`
- **Componente:** `<CacheMonitor adminSecret="TU_ADMIN_SECRET" />`

El panel muestra:
- Hit rate en tiempo real
- Llamadas a Groq y Gemini hoy vs límite
- Dinero ahorrado estimado
- Usuarios que puede aguantar el sistema

---

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Arrancar Redis en local (necesitas Docker)
docker run -d -p 6379:6379 redis:alpine

# Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# Arrancar la app
npm run dev
```
