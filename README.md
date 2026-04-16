# BuscayCurra 🎯

App de búsqueda de empleo y mejora de CV con IA  
🌐 https://buscaycurra.es/app

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

---

## 📧 Sistema de Envío Automático de CVs

BuscayCurra incluye un sistema escalable de envío automático de CVs construido con **BullMQ + Redis**. Este sistema puede gestionar desde cientos hasta millones de usuarios en toda España sin depender de herramientas externas como n8n.

### ¿Cómo funciona?

```
Usuario configura → BullMQ añade job → Redis gestiona cola → Workers procesan → CV enviado
```

1. El usuario introduce el email de RRHH de la empresa y el puesto al que aplica
2. BullMQ añade el envío a la cola de Redis
3. El sistema calcula el próximo horario laboral disponible (lun-vie 9:00-18:00)
4. OpenClaw IA personaliza la carta de presentación para esa empresa
5. El worker envía el CV por email usando Resend
6. El usuario recibe una confirmación por email

### Cómo arrancar Redis con Docker

Asegúrate de tener Docker Desktop instalado. Luego ejecuta:

```bash
# Arrancar Redis en segundo plano
docker-compose up -d redis

# Ver que está corriendo
docker-compose ps

# Ver los logs de Redis
docker-compose logs redis

# Parar Redis
docker-compose stop redis
```

Redis quedará disponible en `redis://localhost:6379`.

### Cómo arrancar el Worker

El worker es el proceso que coge trabajos de la cola y envía los CVs.  
Debe ejecutarse de forma **separada** al servidor Next.js.

```bash
# Instalar dependencias
npm install

# Arrancar el worker (en una terminal separada)
npm run worker

# O con más concurrencia (procesa 5 envíos en paralelo)
WORKER_CONCURRENCY=5 npm run worker
```

### Escalar horizontalmente

Para gestionar más usuarios, simplemente arranca más workers en distintos servidores:

```bash
# Servidor 1
npm run worker

# Servidor 2 (en otra máquina)
npm run worker

# Servidor 3 (en otra máquina más)
npm run worker
```

Redis distribuye automáticamente los trabajos entre todos los workers activos.

### Límites por plan

| Plan | CVs por día | CVs por mes | Precio |
|------|------------|-------------|--------|
| Free | 2 | 20 | Gratis |
| Pro | 10 | 200 | De pago |
| Empresa | Ilimitado | Ilimitado | De pago |

- Mínimo **90 días** entre envíos a la misma empresa
- Solo días laborables: **lunes a viernes, 9:00-18:00** (hora española)
- No envía en festivos nacionales de España

### Estructura del sistema

```
lib/cv-sender/
  ├── queue.ts           → Colas BullMQ + conexión Redis
  ├── worker.ts          → Worker que procesa los envíos
  ├── scheduler.ts       → Planificador (horario laboral, festivos)
  ├── rate-limiter.ts    → Control de límites por plan
  ├── email-sender.ts    → Envío de emails con Resend
  ├── cv-personalizer.ts → Personalización con OpenClaw IA
  └── tracker.ts         → Registro de envíos en Supabase

app/api/cv-sender/
  ├── send/route.ts      → POST: programar envío
  ├── status/route.ts    → GET: estado de envíos
  └── cancel/route.ts    → DELETE: cancelar envío

components/
  ├── CVSenderDashboard.tsx  → Panel de control de envíos
  └── AutoSendSetup.tsx      → Formulario de configuración

app/app/envios/page.tsx      → Página completa con tabs
scripts/start-worker.ts      → Script de arranque del worker
```

### Tablas necesarias en Supabase

Crea estas tablas en tu proyecto de Supabase:

```sql
-- Tabla de envíos de CV
CREATE TABLE cv_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  company_email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_url TEXT,
  job_title TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente',
  job_id TEXT,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de blacklist de empresas
CREATE TABLE cv_blacklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_email TEXT UNIQUE NOT NULL,
  reason TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de CVs del usuario
CREATE TABLE cvs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  text_content TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de perfiles de usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  plan TEXT DEFAULT 'free'
);
```

---

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Arrancar Redis en local (necesitas Docker)
docker-compose up -d redis

# Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# Arrancar la app
npm run dev
```

---

## 🔑 Cómo obtener las API keys gratuitas

### Groq (Llama 3.3 — Ultrarrápido)
1. Ve a 👉 https://console.groq.com
2. Regístrate gratis
3. Haz clic en **"API Keys"** → **"Create API Key"**
4. Copia la key y ponla en `GROQ_API_KEY`

**Límites gratuitos:** 14.400 req/día, 30 req/minuto

### Google Gemini 1.5 Flash
1. Ve a 👉 https://aistudio.google.com
2. Regístrate con tu cuenta de Google
3. Haz clic en **"Get API Key"**
4. Copia la key y ponla en `GEMINI_API_KEY`

**Límites gratuitos:** 15 req/minuto, 1.500 req/día, 1M tokens/req

### Panel de monitoreo (solo admin)

Puedes ver las estadísticas del caché en:
- **API:** `GET /api/cache/stats` con header `x-admin-secret: TU_ADMIN_SECRET`
- **Componente:** `<CacheMonitor adminSecret="TU_ADMIN_SECRET" />`
